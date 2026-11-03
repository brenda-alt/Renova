import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UsuarioDaRequisicao } from './authenticated-user';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const login = jest.fn();
  const obterUsuarioAutenticado = jest.fn();

  beforeEach(async () => {
    login.mockReset();
    obterUsuarioAutenticado.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login, obterUsuarioAutenticado },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('encaminha username e password do contrato para o login', async () => {
    login.mockResolvedValue({
      accessToken: 'token-de-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });

    await expect(
      controller.login({
        username: 'ana.souza@example.com',
        password: 'correta',
      }),
    ).resolves.toEqual({
      accessToken: 'token-de-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(login).toHaveBeenCalledWith('ana.souza@example.com', 'correta');
  });

  it('busca /auth/me pelo id recarregado, sem usar o restante do token', async () => {
    const resposta = {
      id: '9',
      username: 'ana.souza@example.com',
      fullName: 'Ana Souza',
      active: true,
      roles: [{ code: 'PROFISSIONAL', name: 'Profissional' }],
      permissions: [],
    };
    obterUsuarioAutenticado.mockResolvedValue(resposta);

    const request = {
      user: {
        id: 9,
        username: 'outro-valor',
        fullName: 'Nome do token',
        active: true,
        perfil: 'ADMIN',
      },
    } as Request & { user: UsuarioDaRequisicao };

    await expect(controller.me(request)).resolves.toEqual(resposta);
    expect(obterUsuarioAutenticado).toHaveBeenCalledWith(9);
  });
});
