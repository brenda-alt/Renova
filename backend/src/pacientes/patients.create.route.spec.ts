import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AUTENTICACAO_NECESSARIA, ACESSO_NEGADO } from '../auth/auth.constants';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PacientesModule } from './pacientes.module';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

const CADASTRO_VALIDO = {
  cpf: '529.982.247-25',
  fullName: 'Maria Helena',
  birthDate: '1984-03-12',
  phone: '11988887777',
  postalCode: '01310-000',
  street: 'Rua das Acácias',
};

function usuarioAtivo(perfil: 'ADMIN' | 'PROFISSIONAL') {
  return {
    id: 4,
    nome: perfil === 'ADMIN' ? 'Admin Renova' : 'Ana Souza',
    email: 'ana.souza@example.com',
    perfil,
    ativo: true,
  };
}

describe('POST /api/v1/patients', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const findPaciente = jest.fn();
  const create = jest.fn();

  async function subir(perfil: 'ADMIN' | 'PROFISSIONAL'): Promise<void> {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    findPaciente.mockReset();
    create.mockReset();
    findUsuario.mockResolvedValue(usuarioAtivo(perfil));
    findPaciente.mockResolvedValue(null);
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 15,
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      createdAt: new Date('2026-10-18T18:00:00.000Z'),
      updatedAt: new Date('2026-10-18T18:00:00.000Z'),
    }));

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, PacientesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        usuario: { findUnique: findUsuario },
        paciente: { findUnique: findPaciente, create },
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
    corpo: unknown,
    token?: string,
  ): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(corpo),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as unknown) : null,
    };
  }

  it('recusa cadastro sem token e não grava', async () => {
    await subir('ADMIN');

    const resposta = await pedir(CADASTRO_VALIDO);

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual(AUTENTICACAO_NECESSARIA);
    expect(create).not.toHaveBeenCalled();
  });

  it('recusa PROFISSIONAL sem patients:create e não grava', async () => {
    await subir('PROFISSIONAL');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const resposta = await pedir(CADASTRO_VALIDO, token);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
    expect(create).not.toHaveBeenCalled();
  });

  it('cadastra com 201 quando o ADMIN tem patients:create', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const resposta = await pedir(CADASTRO_VALIDO, token);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      id: '15',
      cpf: '529.982.247-25',
      fullName: 'Maria Helena',
      birthDate: '1984-03-12',
      phone: '(11) 98888-7777',
      postalCode: '01310-000',
      street: 'Rua das Acácias',
      addressNumber: null,
      city: null,
      state: null,
      active: true,
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('recusa CPF inválido, data futura e duplicidade sem gravar por cima', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });

    const cpf = await pedir(
      { cpf: '111.111.111-11', fullName: 'Maria Helena' },
      token,
    );
    const futura = await pedir(
      { ...CADASTRO_VALIDO, birthDate: '2999-01-01' },
      token,
    );

    expect(cpf.status).toBe(400);
    expect(cpf.body).toMatchObject({ code: 'CPF_INVALID' });
    expect(futura.status).toBe(400);
    expect(futura.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(create).not.toHaveBeenCalled();

    findPaciente.mockResolvedValue({ id: 9 });
    const duplicado = await pedir(CADASTRO_VALIDO, token);

    expect(duplicado.status).toBe(409);
    expect(duplicado.body).toEqual({
      code: 'CPF_ALREADY_EXISTS',
      message: 'Já existe um paciente cadastrado com este CPF.',
      existingPatientId: '9',
    });
    expect(create).not.toHaveBeenCalled();
  });
});
