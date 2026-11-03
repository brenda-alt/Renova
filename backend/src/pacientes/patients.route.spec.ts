import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO, AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';
import { PERMISSOES } from '../auth/permissoes';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PacientesModule } from './pacientes.module';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

function usuarioAtivo(perfil: 'ADMIN' | 'PROFISSIONAL') {
  return {
    id: 4,
    nome: perfil === 'ADMIN' ? 'Admin Renova' : 'Ana Souza',
    email: 'ana.souza@example.com',
    perfil,
    ativo: true,
  };
}

describe('GET /api/v1/patients', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findMany = jest.fn();
  const count = jest.fn();
  const findUnique = jest.fn();

  async function subir(perfil: 'ADMIN' | 'PROFISSIONAL'): Promise<void> {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findMany.mockReset();
    count.mockReset();
    findUnique.mockReset();
    findUnique.mockResolvedValue(usuarioAtivo(perfil));
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, PacientesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique },
        paciente: { findMany, count },
        $disconnect: jest.fn(),
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    const endereco = app.getHttpServer().address();
    if (!endereco || typeof endereco === 'string') {
      throw new Error('A aplicação de teste não informou a porta.');
    }
    baseUrl = `http://127.0.0.1:${endereco.port}`;
  }

  afterEach(async () => {
    await app?.close();
  });

  afterAll(() => {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  });

  async function pedir(
    caminho: string,
    token?: string,
  ): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}${caminho}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as unknown) : null,
    };
  }

  it('recusa a rota do contrato sem token e não publica /pacientes', async () => {
    await subir('PROFISSIONAL');

    const semToken = await pedir('/api/v1/patients?page=1&pageSize=20&sort=fullName');
    const caminhoAntigo = await pedir('/api/v1/pacientes');

    expect(semToken.status).toBe(401);
    expect(semToken.body).toEqual(AUTENTICACAO_NECESSARIA);
    expect(caminhoAntigo.status).toBe(404);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('responde 403 sem patients:read e não devolve pacientes', async () => {
    await subir('PROFISSIONAL');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const resposta = await pedir(
      '/api/v1/patients?page=1&pageSize=20&sort=fullName',
      token,
    );

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
    expect(JSON.stringify(resposta.body)).not.toContain('Maria');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejeita CPF inválido e ordenação fora do contrato', async () => {
    await subir('PROFISSIONAL');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const cpf = await pedir('/api/v1/patients?cpf=111.111.111-11', token);
    const ordenacao = await pedir('/api/v1/patients?sort=nome', token);

    expect(cpf.status).toBe(400);
    expect(cpf.body).toMatchObject({
      code: 'CPF_INVALID',
      message: 'CPF inválido.',
    });
    expect(ordenacao.status).toBe(400);
    expect(ordenacao.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('permite ao ADMIN listar pacientes e devolve as mesmas permissões em /auth/me', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const identidade = await pedir('/api/v1/auth/me', token);
    const lista = await pedir(
      '/api/v1/patients?page=1&pageSize=20&sort=fullName',
      token,
    );

    expect(identidade.status).toBe(200);
    expect(identidade.body).toMatchObject({
      id: '4',
      active: true,
      roles: [{ code: 'ADMIN', name: 'Administrador' }],
      permissions: [...PERMISSOES],
    });
    expect(lista.status).toBe(200);
    expect(lista.body).toEqual({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { nome: 'asc' },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('não concede o catálogo ao PROFISSIONAL em /auth/me', async () => {
    await subir('PROFISSIONAL');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const identidade = await pedir('/api/v1/auth/me', token);

    expect(identidade.status).toBe(200);
    expect(identidade.body).toMatchObject({
      roles: [{ code: 'PROFISSIONAL', name: 'Profissional' }],
      permissions: [],
    });
    expect(
      (identidade.body as { permissions: string[] }).permissions,
    ).not.toEqual([...PERMISSOES]);
  });
});
