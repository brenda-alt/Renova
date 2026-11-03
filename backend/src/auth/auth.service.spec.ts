import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACESSO_NEGADO,
  AUTENTICACAO_NECESSARIA,
  CREDENCIAIS_INVALIDAS,
} from './auth.constants';
import { AuthService } from './auth.service';
import { PERMISSOES } from './permissoes';
import { PasswordHasher } from './password-hasher';

describe('AuthService', () => {
  let service: AuthService;
  const findUnique = jest.fn();
  const signAsync = jest.fn();
  const compareSpy = jest.fn();
  const hashSpy = jest.fn();

  beforeAll(async () => {
    hashSpy.mockResolvedValue('hash-de-comparacao');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { usuario: { findUnique } },
        },
        {
          provide: JwtService,
          useValue: { signAsync },
        },
        {
          provide: PasswordHasher,
          useValue: { compare: compareSpy, hash: hashSpy },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    await service.onModuleInit();
  });

  beforeEach(() => {
    findUnique.mockReset();
    signAsync.mockReset();
    compareSpy.mockReset();
  });

  async function corpoDaRecusa(acao: () => Promise<unknown>) {
    try {
      await acao();
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      return (error as UnauthorizedException).getResponse();
    }

    throw new Error('A operação deveria ter sido recusada.');
  }

  it('emite accessToken, tokenType e expiresIn para credencial válida', async () => {
    findUnique.mockResolvedValue({
      id: 4,
      senhaHash: 'hash-real',
      ativo: true,
    });
    compareSpy.mockResolvedValue(true);
    signAsync.mockResolvedValue('token-de-teste');

    const result = await service.login('Ana.Souza@example.com', 'correta');

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'ana.souza@example.com' },
      select: { id: true, senhaHash: true, ativo: true },
    });
    expect(signAsync).toHaveBeenCalledWith(
      { sub: 4 },
      { expiresIn: 3600, algorithm: 'HS256' },
    );
    expect(result).toEqual({
      accessToken: 'token-de-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(result).not.toHaveProperty('senhaHash');
    expect(JSON.stringify(result)).not.toContain('hash-real');
    expect(JSON.stringify(result)).not.toContain('correta');
  });

  it('recusa senha inválida, usuário inativo e usuário inexistente com o mesmo corpo', async () => {
    findUnique.mockResolvedValueOnce({
      id: 4,
      senhaHash: 'hash-real',
      ativo: true,
    });
    compareSpy.mockResolvedValueOnce(false);
    const senhaInvalida = await corpoDaRecusa(() =>
      service.login('ana.souza@example.com', 'errada'),
    );

    findUnique.mockResolvedValueOnce({
      id: 4,
      senhaHash: 'hash-real',
      ativo: false,
    });
    compareSpy.mockResolvedValueOnce(true);
    const inativo = await corpoDaRecusa(() =>
      service.login('ana.souza@example.com', 'correta'),
    );

    findUnique.mockResolvedValueOnce(null);
    compareSpy.mockResolvedValueOnce(false);
    const inexistente = await corpoDaRecusa(() =>
      service.login('ausente@example.com', 'qualquer'),
    );

    expect(senhaInvalida).toEqual(CREDENCIAIS_INVALIDAS);
    expect(inativo).toEqual(senhaInvalida);
    expect(inexistente).toEqual(senhaInvalida);
    expect(signAsync).not.toHaveBeenCalled();
    expect(compareSpy).toHaveBeenLastCalledWith('qualquer', 'hash-de-comparacao');
    expect(JSON.stringify([senhaInvalida, inativo, inexistente])).not.toContain(
      'hash-real',
    );
  });

  it('monta /auth/me a partir do banco e recusa usuário inativo ou ausente', async () => {
    findUnique.mockResolvedValueOnce({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: true,
    });

    const view = await service.obterUsuarioAutenticado(4);

    expect(view).toEqual({
      id: '4',
      username: 'ana.souza@example.com',
      fullName: 'Ana Souza',
      active: true,
      roles: [{ code: 'PROFISSIONAL', name: 'Profissional' }],
      permissions: [],
    });
    expect(view).not.toHaveProperty('senhaHash');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    findUnique.mockResolvedValueOnce({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: false,
    });
    expect(await corpoDaRecusa(() => service.obterUsuarioAutenticado(4))).toEqual(
      AUTENTICACAO_NECESSARIA,
    );

    findUnique.mockResolvedValueOnce(null);
    expect(await corpoDaRecusa(() => service.obterUsuarioAutenticado(9))).toEqual(
      AUTENTICACAO_NECESSARIA,
    );
  });

  it('concede ao ADMIN as permissões efetivas e nega o PROFISSIONAL', async () => {
    findUnique.mockResolvedValue({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'ADMIN',
      ativo: true,
    });

    const administrador = await service.obterUsuarioAutenticado(4);
    expect(administrador.permissions).toEqual([...PERMISSOES]);

    for (const permissao of PERMISSOES) {
      await expect(service.exigirPermissao(4, permissao)).resolves.toBeUndefined();
    }

    findUnique.mockResolvedValue({
      id: 8,
      nome: 'Carla Nunes',
      email: 'carla.nunes@example.com',
      perfil: 'PROFISSIONAL',
      ativo: true,
    });

    const profissional = await service.obterUsuarioAutenticado(8);
    expect(profissional.permissions).toEqual([]);
    expect(profissional.permissions).not.toEqual(administrador.permissions);

    await expect(service.exigirPermissao(8, 'patients:read')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    try {
      await service.exigirPermissao(8, 'patients:read');
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toEqual(ACESSO_NEGADO);
    }
  });
});
