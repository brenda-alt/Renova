import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO, AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';
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

const paciente = {
  id: 7,
  nome: 'Maria Helena',
  cpf: '52998224725',
  dataNascimento: new Date('1984-03-12T00:00:00.000Z'),
  telefone: '11988887777',
  cep: '01310000',
  endereco: 'Rua das Acácias',
  numero: null,
  complemento: null,
  bairro: null,
  cidade: null,
  uf: null,
  createdAt: new Date('2026-10-18T18:00:00.000Z'),
  updatedAt: new Date('2026-10-18T18:00:00.000Z'),
};

describe('paciente por identificador', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const findPaciente = jest.fn();
  const update = jest.fn();
  const historicoCreate = jest.fn();

  async function subir(perfil: 'ADMIN' | 'PROFISSIONAL'): Promise<void> {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    findPaciente.mockReset();
    update.mockReset();
    historicoCreate.mockReset();
    findUsuario.mockResolvedValue(usuarioAtivo(perfil));
    findPaciente.mockResolvedValue(paciente);
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...paciente,
      ...data,
    }));

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, PacientesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique: findUsuario },
        paciente: { findUnique: findPaciente, update },
        historicoPaciente: { create: historicoCreate },
        $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            paciente: { update },
            historicoPaciente: { create: historicoCreate },
          }),
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

  it('recusa consulta e atualização sem token', async () => {
    await subir('ADMIN');

    expect((await pedir('/api/v1/patients/7', 'GET')).body).toEqual(AUTENTICACAO_NECESSARIA);
    expect((await pedir('/api/v1/patients/7', 'PATCH', undefined, { phone: '11977776666' })).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });

  it('recusa PROFISSIONAL sem patients:read e patients:update', async () => {
    await subir('PROFISSIONAL');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    expect((await pedir('/api/v1/patients/7', 'GET', token)).body).toEqual(ACESSO_NEGADO);
    expect((await pedir('/api/v1/patients/7', 'PATCH', token, { phone: '11977776666' })).status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('consulta, atualiza parcialmente e recusa nome, data e endereço inválidos', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const consulta = await pedir('/api/v1/patients/7', 'GET', token);
    expect(consulta.status).toBe(200);
    expect(consulta.body).toMatchObject({ id: '7', fullName: 'Maria Helena', street: 'Rua das Acácias' });

    findPaciente.mockResolvedValueOnce(null);
    expect((await pedir('/api/v1/patients/99', 'GET', token)).status).toBe(404);
    expect((await pedir('/api/v1/patients/1f2e3d4c-5b6a-4789-8c0d-1e2f3a4b5c6d', 'GET', token)).status).toBe(404);

    findPaciente.mockResolvedValue(paciente);
    const parcial = await pedir('/api/v1/patients/7', 'PATCH', token, { phone: '11977776666' });
    expect(parcial.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { telefone: '11977776666' } }),
    );

    const nome = await pedir('/api/v1/patients/7', 'PATCH', token, { fullName: 'Outra Pessoa' });
    expect(nome.status).toBe(409);
    expect(nome.body).toMatchObject({
      code: 'NAME_CHANGE_CONFIRMATION_REQUIRED',
      currentName: 'Maria Helena',
      informedName: 'Outra Pessoa',
    });

    const futura = await pedir('/api/v1/patients/7', 'PATCH', token, { birthDate: '2999-01-01' });
    const cidade = await pedir('/api/v1/patients/7', 'PATCH', token, { city: 'Cidade Exemplo' });
    const idade = await pedir('/api/v1/patients/7', 'PATCH', token, { age: { years: 10 } });
    expect(futura.status).toBe(400);
    expect(cidade.status).toBe(200);
    expect(cidade.body).toMatchObject({ city: 'Cidade Exemplo' });
    expect(idade.status).toBe(400);
    expect(update).toHaveBeenCalledTimes(2);
  });
});
