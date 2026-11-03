import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    json.mockReset();
    status.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registra P1001 e responde que o banco está indisponível', () => {
    const filtro = new ApiExceptionFilter();
    filtro.catch(erroPrisma('P1001', 'Can\'t reach database server at `127.0.0.1:5433`'), host);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Prisma P1001'));
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith({
      code: 'DATABASE_UNAVAILABLE',
      message: 'O banco de dados está indisponível.',
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('127.0.0.1');
  });

  it('distingue conflito, estrutura ausente e erro desconhecido', () => {
    const filtro = new ApiExceptionFilter();

    filtro.catch(
      erroPrisma('P2002', 'Unique constraint failed', { modelName: 'Usuario', target: ['email'] }),
      host,
    );
    filtro.catch(erroPrisma('P2022', 'Column missing', { column: 'tipo_receita' }), host);
    filtro.catch(new Error('postgresql://usuario:segredo@127.0.0.1/renova'), host);

    expect(json).toHaveBeenNthCalledWith(1, {
      code: 'UNIQUE_CONFLICT',
      message: 'Já existe um registro com esses dados.',
    });
    expect(status).toHaveBeenNthCalledWith(2, HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenNthCalledWith(2, {
      code: 'SCHEMA_MISMATCH',
      message: 'A estrutura do banco não corresponde à aplicação.',
    });
    expect(json).toHaveBeenNthCalledWith(3, {
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir a operação.',
    });

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Prisma P2002'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('tipo_receita'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[url-oculta]'));
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('segredo'));
    expect(JSON.stringify(json.mock.calls)).not.toContain('tipo_receita');
    expect(JSON.stringify(json.mock.calls)).not.toContain('segredo');
  });
});

function erroPrisma(code: string, message: string, meta?: Record<string, unknown>): Error {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: 'teste',
    meta,
  });
}
