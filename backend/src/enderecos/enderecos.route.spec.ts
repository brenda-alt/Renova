import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ACESSO_NEGADO, AUTENTICACAO_NECESSARIA } from '../auth/auth.constants';
import { configureApp } from '../common/configure-app';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EnderecosModule } from './enderecos.module';
import { ViaCepClient } from './via-cep.client';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

describe('GET /api/v1/addresses/cep/{cep}', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  let app: INestApplication;
  let baseUrl: string;
  const findUsuario = jest.fn();
  const consultar = jest.fn();

  async function subir(perfil: 'ADMIN' | 'PROFISSIONAL'): Promise<void> {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUsuario.mockReset();
    consultar.mockReset();
    findUsuario.mockResolvedValue({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil,
      ativo: true,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, EnderecosModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ usuario: { findUnique: findUsuario }, $disconnect: jest.fn() })
      .overrideProvider(ViaCepClient)
      .useValue({ consultar })
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

  async function pedir(caminho: string, token?: string): Promise<{ status: number; body: unknown }> {
    const response = await fetch(`${baseUrl}${caminho}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const text = await response.text();
    return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
  }

  it('não consulta o provedor sem token, sem permissão ou com CEP inválido', async () => {
    await subir('PROFISSIONAL');
    expect((await pedir('/api/v1/addresses/cep/01310000')).body).toEqual(AUTENTICACAO_NECESSARIA);

    const token = await app.get(JwtService).signAsync({ sub: 4 });
    expect((await pedir('/api/v1/addresses/cep/01310000', token)).body).toEqual(ACESSO_NEGADO);

    await app.close();
    await subir('ADMIN');
    const admin = await app.get(JwtService).signAsync({ sub: 4 });
    expect((await pedir('/api/v1/addresses/cep/123', admin)).status).toBe(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('devolve o endereço sugerido, 404 e 503 sem gravar paciente', async () => {
    await subir('ADMIN');
    const token = await app.get(JwtService).signAsync({ sub: 4 });
    consultar.mockResolvedValueOnce({
      postalCode: '01310-000',
      street: 'Avenida Exemplo',
      complement: null,
      neighborhood: 'Bairro Exemplo',
      city: 'Cidade Exemplo',
      state: 'SP',
    });

    const ok = await pedir('/api/v1/addresses/cep/01310-000', token);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ postalCode: '01310-000', state: 'SP' });
    expect(consultar).toHaveBeenCalledWith('01310000');

    consultar.mockResolvedValueOnce('nao-encontrado');
    expect((await pedir('/api/v1/addresses/cep/01310000', token)).status).toBe(404);

    const { ServiceUnavailableException } = await import('@nestjs/common');
    consultar.mockRejectedValueOnce(
      new ServiceUnavailableException({
        code: 'CEP_LOOKUP_UNAVAILABLE',
        message: 'A consulta de CEP está indisponível. Preencha o endereço manualmente.',
      }),
    );
    const indisponivel = await pedir('/api/v1/addresses/cep/01310000', token);
    expect(indisponivel.status).toBe(503);
    expect(indisponivel.body).toMatchObject({ code: 'CEP_LOOKUP_UNAVAILABLE' });
  });
});
