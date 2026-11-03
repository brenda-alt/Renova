import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTENTICACAO_NECESSARIA } from './auth.constants';
import { UsuarioDaRequisicao } from './authenticated-user';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UsuarioDaRequisicao>(
    err: unknown,
    user: TUser | false | null,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException(AUTENTICACAO_NECESSARIA);
    }

    return user;
  }
}
