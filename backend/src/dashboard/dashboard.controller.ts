import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsuarioDaRequisicao } from '../auth/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async resumo(@Req() request: { user: UsuarioDaRequisicao }) {
    await this.authService.exigirPermissao(request.user.id, 'dashboard:read');
    return this.dashboardService.resumo();
  }
}
