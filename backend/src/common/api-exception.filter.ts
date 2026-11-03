import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';

interface CodedBody {
  code: string;
  message: string;
  details?: unknown;
  existingPatientId?: string;
  currentName?: string;
  informedName?: string;
}

interface ErroPrisma {
  code: string;
  message: string;
  meta?: unknown;
}

interface RespostaPrisma {
  status: number;
  code: string;
  message: string;
}

const RESPOSTAS_PRISMA: Record<string, RespostaPrisma> = {
  P1001: indisponivel(),
  P1002: indisponivel(),
  P1008: indisponivel(),
  P1017: indisponivel(),
  P2002: {
    status: HttpStatus.CONFLICT,
    code: 'UNIQUE_CONFLICT',
    message: 'Já existe um registro com esses dados.',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    code: 'RELATION_CONFLICT',
    message: 'O registro informado não pode ser vinculado.',
  },
  P2021: estrutura(),
  P2022: estrutura(),
  P2025: {
    status: HttpStatus.NOT_FOUND,
    code: 'RECORD_NOT_FOUND',
    message: 'Registro não encontrado.',
  },
};

function indisponivel(): RespostaPrisma {
  return {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'DATABASE_UNAVAILABLE',
    message: 'O banco de dados está indisponível.',
  };
}

function estrutura(): RespostaPrisma {
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'SCHEMA_MISMATCH',
    message: 'A estrutura do banco não corresponde à aplicação.',
  };
}

function isCodedBody(value: unknown): value is CodedBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

export function lerErroPrisma(exception: unknown): ErroPrisma | null {
  if (typeof exception !== 'object' || exception === null) {
    return null;
  }

  const candidato = exception as { name?: unknown; code?: unknown; message?: unknown; meta?: unknown };

  if (candidato.name !== 'PrismaClientKnownRequestError' || typeof candidato.code !== 'string') {
    return null;
  }

  if (!/^P\d{4}$/.test(candidato.code)) {
    return null;
  }

  return {
    code: candidato.code,
    message: typeof candidato.message === 'string' ? candidato.message : '',
    meta: candidato.meta,
  };
}

export function respostaDeErroPrisma(code: string): RespostaPrisma {
  return (
    RESPOSTAS_PRISMA[code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir a operação.',
    }
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const prisma = lerErroPrisma(exception);

    if (prisma) {
      registrarPrisma(prisma);
      const resposta = respostaDeErroPrisma(prisma.code);
      response.status(resposta.status).json({
        code: resposta.code,
        message: resposta.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (isCodedBody(body)) {
        const payload: CodedBody = {
          code: body.code,
          message: body.message,
        };

        if (body.details !== undefined) {
          payload.details = body.details;
        }

        if (typeof body.existingPatientId === 'string') {
          payload.existingPatientId = body.existingPatientId;
        }

        if (typeof body.currentName === 'string') {
          payload.currentName = body.currentName;
        }

        if (typeof body.informedName === 'string') {
          payload.informedName = body.informedName;
        }

        response.status(status).json(payload);
        return;
      }

      if (status === HttpStatus.UNAUTHORIZED) {
        response.status(status).json(AUTENTICACAO_NECESSARIA);
        return;
      }

      if (status === HttpStatus.BAD_REQUEST) {
        response.status(status).json({
          code: 'VALIDATION_ERROR',
          message: 'Pedido inválido.',
        });
        return;
      }

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        response.status(status).json({
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível concluir a operação.',
        });
        return;
      }

      response.status(status).json(body);
      return;
    }

    console.error(textoDeFalha(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir a operação.',
    });
  }
}

function registrarPrisma(erro: ErroPrisma): void {
  const meta = metaSegura(erro.meta);
  const complemento = meta ? ` meta=${JSON.stringify(meta)}` : '';
  console.error(`Prisma ${erro.code}: ${sanitizar(primeiraLinha(erro.message))}${complemento}`);
}

function textoDeFalha(exception: unknown): string {
  if (!(exception instanceof Error)) {
    return 'Falha não tratada na API';
  }

  const detalhe = sanitizar(primeiraLinha(exception.message));
  return detalhe ? `${exception.name}: ${detalhe}` : `${exception.name}: falha não tratada na API`;
}

function primeiraLinha(texto: string): string {
  return texto.split('\n')[0]?.trim() ?? '';
}

function sanitizar(texto: string): string {
  return texto.replace(/postgres(?:ql)?:\/\/\S+/gi, '[url-oculta]').slice(0, 400);
}

function metaSegura(meta: unknown): Record<string, string | string[]> | undefined {
  if (typeof meta !== 'object' || meta === null) {
    return undefined;
  }

  const origem = meta as Record<string, unknown>;
  const saida: Record<string, string | string[]> = {};

  for (const chave of ['modelName', 'target', 'column', 'table', 'constraint']) {
    const valor = origem[chave];

    if (typeof valor === 'string' && valor.length > 0 && valor.length <= 200) {
      saida[chave] = valor;
    }

    if (Array.isArray(valor) && valor.every((item) => typeof item === 'string' && item.length <= 200)) {
      saida[chave] = valor.slice(0, 8);
    }
  }

  return Object.keys(saida).length > 0 ? saida : undefined;
}
