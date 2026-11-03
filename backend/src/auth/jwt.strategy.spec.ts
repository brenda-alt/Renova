import { JwtService } from '@nestjs/jwt';
import { sign, TokenExpiredError, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

const SEGREDO_DE_TESTE = 'unit-test-jwt-secret-not-for-production';

describe('JWT', () => {
  const segredoAnterior = process.env.JWT_SECRET;
  const findUnique = jest.fn();
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = SEGREDO_DE_TESTE;
    findUnique.mockReset();
    strategy = new JwtStrategy({
      usuario: { findUnique },
    } as unknown as PrismaService);
  });

  afterAll(() => {
    if (segredoAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = segredoAnterior;
    }
  });

  it('assina somente o id, expira em 3600 segundos e recusa token vencido', async () => {
    const jwt = new JwtService({
      secret: SEGREDO_DE_TESTE,
      signOptions: { expiresIn: 3600, algorithm: 'HS256' },
    });
    const token = await jwt.signAsync({ sub: 4 });
    const payload = verify(token, SEGREDO_DE_TESTE) as unknown as {
      sub: number;
      exp: number;
      iat: number;
    };

    expect(payload.sub).toBe(4);
    expect(payload.exp - payload.iat).toBe(3600);
    expect(payload).not.toHaveProperty('perfil');
    expect(payload).not.toHaveProperty('permissions');
    expect(payload).not.toHaveProperty('senhaHash');

    const vencido = sign({ sub: 4 }, SEGREDO_DE_TESTE, {
      expiresIn: -1,
      algorithm: 'HS256',
    });
    expect(() => verify(vencido, SEGREDO_DE_TESTE)).toThrow(TokenExpiredError);
  });

  it('recarrega o usuário ativo e ignora perfil ou permissão gravados no token', async () => {
    findUnique.mockResolvedValue({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: true,
    });

    const usuario = await strategy.validate({
      sub: 4,
      perfil: 'ADMIN',
      permissions: ['prescriptions:create'],
    });

    expect(usuario).toEqual({
      id: 4,
      username: 'ana.souza@example.com',
      fullName: 'Ana Souza',
      active: true,
      perfil: 'PROFISSIONAL',
    });
    expect(usuario).not.toHaveProperty('senhaHash');
    expect(usuario).not.toHaveProperty('permissions');
  });

  it('rejeita token sem usuário ativo', async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(strategy.validate({ sub: 4 })).resolves.toBeNull();

    findUnique.mockResolvedValueOnce({
      id: 4,
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      perfil: 'PROFISSIONAL',
      ativo: false,
    });
    await expect(strategy.validate({ sub: 4 })).resolves.toBeNull();
    await expect(strategy.validate({ sub: '4' })).resolves.toBeNull();
  });
});
