import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO, AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AcompanhamentosModule } from './acompanhamentos.module';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

describe('acompanhamentos HTTP', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const findPaciente = jest.fn();
  const findReceita = jest.fn();
  const create = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();

  beforeEach(async () => {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    findPaciente.mockReset();
    findReceita.mockReset();
    create.mockReset();
    findMany.mockReset();
    count.mockReset();
    findUsuario.mockResolvedValue({
      id: 4,
      nome: 'Admin Renova',
      email: 'ana.souza@example.com',
      perfil: 'ADMIN',
      ativo: true,
    });
    findPaciente.mockResolvedValue({ id: 7 });
    findReceita.mockResolvedValue({ pacienteId: 7 });
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 3,
      pacienteId: data.pacienteId,
      receitaId: data.receitaId,
      ocorreuEm: data.ocorreuEm,
      descricao: data.descricao,
      createdAt: new Date('2026-10-18T18:00:00.000Z'),
      usuario: { id: 4, nome: 'Admin Renova' },
    }));

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AcompanhamentosModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique: findUsuario },
        paciente: { findUnique: findPaciente },
        receita: { findUnique: findReceita },
        acompanhamento: { create, findMany, count },
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

  async function pedir(
    method: string,
    token?: string,
    corpo?: unknown,
  ): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}/api/v1/patients/7/follow-ups`, {
      method,
      headers: {
        ...(corpo !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
  }

  it('exige autenticação e followups:create', async () => {
    expect((await pedir('POST', undefined, { occurredOn: '2026-10-18', description: 'Contato' })).body).toEqual(
      AUTENTICACAO_NECESSARIA,
    );

    findUsuario.mockResolvedValue({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: true,
    });
    const token = await app.get(JwtService).signAsync({ sub: 4 });
    expect((await pedir('POST', token, { occurredOn: '2026-10-18', description: 'Contato' })).body).toEqual(
      ACESSO_NEGADO,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('cadastra com 201 e lista o histórico vazio', async () => {
    const token = await app.get(JwtService).signAsync({ sub: 4 });
    const criado = await pedir('POST', token, {
      occurredOn: '2026-10-18',
      description: 'Contato telefônico fictício',
      prescriptionId: '21',
    });
    const lista = await pedir('GET', token);

    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({ id: '3', patientId: '7', prescriptionId: '21' });
    expect(lista.status).toBe(200);
    expect(lista.body).toMatchObject({ data: [], page: 1, total: 0 });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
