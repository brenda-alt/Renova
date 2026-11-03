import { loadOpenApiContract, resolveOpenApiContractPath } from './load-openapi-contract';

const OPERACOES_PUBLICADAS = [
  'POST /auth/login',
  'GET /auth/me',
  'POST /patients',
  'GET /patients',
  'GET /patients/priority',
  'GET /patients/{id}',
  'PATCH /patients/{id}',
  'GET /patients/{id}/follow-ups',
  'POST /patients/{id}/follow-ups',
  'POST /prescriptions',
  'GET /prescriptions',
  'GET /prescriptions/alerts',
  'GET /prescriptions/{id}',
  'PATCH /prescriptions/{id}',
  'GET /dashboard/summary',
  'GET /addresses/cep/{cep}',
];

describe('contrato OpenAPI publicado', () => {
  const documento = loadOpenApiContract(resolveOpenApiContractPath()) as unknown as {
    paths: Record<string, Record<string, { operationId?: string }>>;
  };

  it('documenta somente as rotas que o servidor publica', () => {
    const operacoes = Object.entries(documento.paths).flatMap(([caminho, metodos]) =>
      Object.keys(metodos)
        .filter((metodo) => ['get', 'post', 'patch', 'put', 'delete'].includes(metodo))
        .map((metodo) => `${metodo.toUpperCase()} ${caminho}`),
    );

    expect(operacoes.sort()).toEqual([...OPERACOES_PUBLICADAS].sort());
  });
});
