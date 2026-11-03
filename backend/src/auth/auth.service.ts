import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordHasher } from './password-hasher';
import { AuthenticatedUserView } from './authenticated-user';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  ACESSO_NEGADO,
  AUTENTICACAO_NECESSARIA,
  CREDENCIAIS_INVALIDAS,
} from './auth.constants';
import { mapearPerfil } from './perfil-acesso';

export interface LoginResponseBody {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

const COMPARACAO_SEM_USUARIO = 'renova-comparacao-sem-usuario';

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyPasswordHash?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hashDeComparacao();
  }

  /**
   * `username` do contrato é o e-mail cadastrado, após trim e minúsculas.
   * Não existe coluna username e a busca não usa a parte local do e-mail.
   * Usuário ausente, inativo e senha incorreta produzem a mesma resposta.
   */
  async login(username: string, password: string): Promise<LoginResponseBody> {
    const email = username.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        senhaHash: true,
        ativo: true,
      },
    });

    const senhaConfere = await this.passwordHasher.compare(
      password,
      usuario?.senhaHash ?? (await this.hashDeComparacao()),
    );

    if (!usuario || !usuario.ativo || !senhaConfere) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: usuario.id },
      {
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        algorithm: 'HS256',
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  async obterUsuarioAutenticado(id: number): Promise<AuthenticatedUserView> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(AUTENTICACAO_NECESSARIA);
    }

    const papel = mapearPerfil(usuario.perfil);

    return {
      id: String(usuario.id),
      username: usuario.email,
      fullName: usuario.nome,
      active: true,
      roles: [{ code: papel.code, name: papel.name }],
      permissions: papel.permissions,
    };
  }

  async exigirPermissao(usuarioId: number, permissao: string): Promise<void> {
    const usuario = await this.obterUsuarioAutenticado(usuarioId);

    if (!usuario.permissions.includes(permissao)) {
      throw new ForbiddenException(ACESSO_NEGADO);
    }
  }

  private async hashDeComparacao(): Promise<string> {
    if (!this.dummyPasswordHash) {
      this.dummyPasswordHash = await this.passwordHasher.hash(COMPARACAO_SEM_USUARIO);
    }

    return this.dummyPasswordHash;
  }
}
