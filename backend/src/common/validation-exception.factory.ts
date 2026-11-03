import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FieldErrorBody {
  field: string;
  message: string;
}

function mensagemDeValidacao(key: string, message: string): string {
  if (key === 'whitelistValidation') {
    return 'Campo não permitido.';
  }

  return message;
}

function chavesVisiveis(error: ValidationError): string[] {
  const constraints = error.constraints ?? {};
  const ausente = error.value === undefined || error.value === null;

  return Object.keys(constraints).filter((key) => {
    if (ausente && key !== 'isNotEmpty' && key !== 'whitelistValidation') {
      return false;
    }

    if (typeof error.value !== 'string' && (key === 'maxLength' || key === 'minLength')) {
      return false;
    }

    return true;
  });
}

export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): FieldErrorBody[] {
  const details: FieldErrorBody[] = [];

  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const constraints = error.constraints ?? {};

    for (const key of chavesVisiveis(error)) {
      const message = constraints[key];

      if (message) {
        details.push({
          field,
          message: mensagemDeValidacao(key, message),
        });
      }
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, field));
    }
  }

  return details;
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Pedido inválido.',
    details: flattenValidationErrors(errors),
  });
}
