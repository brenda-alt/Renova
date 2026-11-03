import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO, AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ReceitasModule } from './receitas.module';

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

describe('receitas HTTP', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const findPaciente = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const findReceita = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();

  async function subir(perfil: 'ADMIN' | 'PROFISSIONAL'): Promise<void> {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    findPaciente.mockReset();
    create.mockReset();
    update.mockReset();
    findReceita.mockReset();
    findReceita.mockResolvedValue(receitaDeTeste());
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      receitaDeTeste(data),
    );
    findMany.mockReset();
    count.mockReset();
    findUsuario.mockResolvedValue(usuarioAtivo(perfil));
    findPaciente.mockResolvedValue({ id: 7 });
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      receitaDeTeste(data),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, ReceitasModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique: findUsuario },
        paciente: { findUnique: findPaciente },
        receita: { create, update, findMany, count, findUnique: findReceita },
        $transaction: async (operacao: (tx: unknown) => Promise<unknown>) =>
          operacao({ receita: { create } }),
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
    method: string,
    token?: string,
    corpo?: unknown,
  ): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}${caminho}`, {
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

  it('exige autenticação e prescriptions:create', async () => {
    await subir('PROFISSIONAL');
    const semToken = await pedir('/api/v1/prescriptions', 'POST', undefined, {
      patientId: '7',
      expiresOn: '2026-11-17',
    });
    expect(semToken.body).toEqual(AUTENTICACAO_NECESSARIA);

    const token = await app.get(JwtService).signAsync({ sub: 4 });
    const negado = await pedir('/api/v1/prescriptions', 'POST', token, {
      patientId: '7',
      expiresOn: '2026-11-17',
    });
    expect(negado.body).toEqual(ACESSO_NEGADO);
    expect(create).not.toHaveBeenCalled();
  });

  it('cadastra com 201 e não grava vencimento ausente nem cancelamento', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const criada = await pedir('/api/v1/prescriptions', 'POST', token, {
      patientId: '7',
      expiresOn: '2026-11-17',
    });
    expect(criada.status).toBe(201);
    expect(criada.body).toMatchObject({
      id: '21',
      lifecycleStatus: 'ATIVA',
      expiresOn: '2026-11-17',
      patient: { id: '7' },
    });

    const semData = await pedir('/api/v1/prescriptions', 'POST', token, { patientId: '7' });
    const cancelada = await pedir('/api/v1/prescriptions/21', 'PATCH', token, {
      lifecycleStatus: 'CANCELADA',
    });
    const alertas = await pedir('/api/v1/prescriptions/alerts', 'GET', token);

    expect(semData.status).toBe(201);
    expect(semData.body).toMatchObject({ expiresOn: null, alertBand: 'PENDENTE_INFORMACAO' });
    expect(cancelada.status).toBe(200);
    expect(cancelada.body).toMatchObject({ lifecycleStatus: 'CANCELADA' });
    expect(alertas.status).toBe(200);
    expect(alertas.body).toMatchObject({ data: [], timezone: 'America/Sao_Paulo' });
    expect(create).toHaveBeenCalledTimes(2);

    const completa = await pedir('/api/v1/prescriptions', 'POST', token, {
      patientId: '7',
      prescriptionType: 'COMUM',
      issuedOn: '2026-10-18',
      validityDays: 30,
      expiresOn: '2026-11-17',
      items: [
        {
          medicationName: 'Losartana',
          dosage: '50 mg',
          quantity: '30',
          morning: true,
          afternoon: false,
          night: false,
        },
      ],
    });
    expect(completa.status).toBe(201);
    expect(completa.body).toMatchObject({
      prescriptionType: 'COMUM',
      issuedOn: '2026-10-18',
      expiresOn: '2026-11-17',
      items: [{ medicationName: 'Losartana', dosage: '50 mg', morning: true }],
    });

    const semPeriodo = await pedir('/api/v1/prescriptions', 'POST', token, {
      patientId: '7',
      prescriptionType: 'COMUM',
      issuedOn: '2026-10-18',
      validityDays: 30,
      items: [
        {
          medicationName: 'Losartana',
          dosage: '50 mg',
          quantity: '30',
          morning: false,
          afternoon: false,
          night: false,
        },
      ],
    });
    expect(semPeriodo.status).toBe(400);
    expect(create).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ canceladaPorId: 4 }) }),
    );
  });
});

function receitaDeTeste(data: Record<string, unknown> = {}) {
  const itens = data.itens;
  const criados =
    itens && typeof itens === 'object' && 'create' in itens && Array.isArray(itens.create)
      ? itens.create
      : [];

  return {
    id: 21,
    dataEmissao: data.dataEmissao ?? new Date('2026-10-18T00:00:00.000Z'),
    dataVencimento:
      data.dataVencimento === undefined
        ? new Date('2026-11-17T00:00:00.000Z')
        : data.dataVencimento,
    tipoReceita: data.tipoReceita ?? null,
    canceladaEm: data.canceladaEm === undefined ? null : data.canceladaEm,
    observacoes: data.observacoes === undefined ? null : data.observacoes,
    createdAt: new Date('2026-10-18T18:00:00.000Z'),
    updatedAt: new Date('2026-10-18T18:00:00.000Z'),
    paciente: { id: 7, nome: 'Maria Helena', cpf: '52998224725' },
    itens: criados.map((item, indice) => ({ id: indice + 1, ...item })),
  };
}
