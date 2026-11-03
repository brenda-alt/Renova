import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';
import type { OpenAPIObject } from '@nestjs/swagger';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function resolveOpenApiContractPath(): string {
  const candidates = [
    resolve(process.cwd(), '../docs/api/openapi.yaml'),
    resolve(process.cwd(), 'docs/api/openapi.yaml'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(
      'Contrato OpenAPI não encontrado. Execute o backend a partir da pasta backend/ para localizar ../docs/api/openapi.yaml.',
    );
  }

  return found;
}

export function loadOpenApiContract(sourcePath: string): OpenAPIObject {
  const parsed = load(readFileSync(sourcePath, 'utf8'));

  if (!isRecord(parsed)) {
    throw new Error('O arquivo docs/api/openapi.yaml não contém um documento YAML.');
  }

  if (typeof parsed.openapi !== 'string' || !parsed.openapi.startsWith('3.')) {
    throw new Error('O contrato em docs/api/openapi.yaml precisa ser OpenAPI 3.x.');
  }

  if (!isRecord(parsed.info) || !isRecord(parsed.paths) || !isRecord(parsed.components)) {
    throw new Error('O contrato OpenAPI está sem info, paths ou components.');
  }

  const securitySchemes = parsed.components.securitySchemes;
  if (!isRecord(securitySchemes) || !isRecord(securitySchemes.bearerAuth)) {
    throw new Error('O contrato OpenAPI não contém components.securitySchemes.bearerAuth.');
  }

  return parsed as unknown as OpenAPIObject;
}
