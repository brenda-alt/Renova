import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioDaRequisicao } from './authenticated-user';
import { readJwtSecret } from './auth.constants';

interface AccessTokenPayload {
  sub?: unknown;
  [claim: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: readJwtSecret(),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<UsuarioDaRequisicao | null> {
    if (typeof payload.sub !== 'number' || !Number.isInteger(payload.sub)) {
      return null;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      return null;
    }

    return {
      id: usuario.id,
      username: usuario.email,
      fullName: usuario.nome,
      active: true,
      perfil: usuario.perfil,
    };
  }
}
