import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO } from '../auth/auth.constants';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardModule } from './dashboard.module';
import { PacientesModule } from '../pacientes/pacientes.module';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

describe('dashboard HTTP', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const count = jest.fn();
  const groupBy = jest.fn();
  const findMany = jest.fn();

  beforeEach(async () => {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    count.mockReset();
    groupBy.mockReset();
    findMany.mockReset();
    count.mockResolvedValue(0);
    groupBy.mockResolvedValue([]);
    findMany.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, DashboardModule, PacientesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique: findUsuario },
        receita: { count, groupBy },
        paciente: { findMany },
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
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  });

  async function pedir(caminho: string, token?: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}${caminho}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const text = await response.text();
    return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
  }

  it('exige dashboard:read no resumo e na prioridade', async () => {
    findUsuario.mockResolvedValue({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: true,
    });
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    expect((await pedir('/api/v1/dashboard/summary', token)).body).toEqual(ACESSO_NEGADO);
    expect((await pedir('/api/v1/patients/priority', token)).body).toEqual(ACESSO_NEGADO);
    expect(count).not.toHaveBeenCalled();
    expect(groupBy).not.toHaveBeenCalled();
  });

  it('resume as contagens para o ADMIN', async () => {
    findUsuario.mockResolvedValue({
      id: 4,
      nome: 'Admin Renova',
      email: 'ana.souza@example.com',
      perfil: 'ADMIN',
      ativo: true,
    });
    count.mockResolvedValue(0);
    const token = await app.get(JwtService).signAsync({ sub: 4 });
    const resposta = await pedir('/api/v1/dashboard/summary', token);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      timezone: 'America/Sao_Paulo',
      alertWindows: { nearDays: 5, attentionDays: 15 },
      counts: { pendentesInformacao: 0 },
    });
  });
});
