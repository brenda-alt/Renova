import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsuarioDaRequisicao } from '../auth/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnderecosService } from './enderecos.service';

@Controller('addresses')
export class EnderecosController {
  constructor(
    private readonly enderecosService: EnderecosService,
    private readonly authService: AuthService,
  ) {}

  @Get('cep/:cep')
  @UseGuards(JwtAuthGuard)
  async consultar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('cep') cep: string,
  ) {
    const digitos = this.enderecosService.validarCep(cep);
    await this.authService.exigirPermissao(request.user.id, 'patients:read');
    return this.enderecosService.consultar(digitos);
  }
}
