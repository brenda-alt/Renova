import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsuarioDaRequisicao } from '../auth/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from '../dashboard/dashboard.service';
import { ListarPrioritariosQueryDto } from '../dashboard/dto/listar-prioritarios.query';
import { AtualizarPacienteDto } from './dto/atualizar-paciente.dto';
import { CriarPacienteDto } from './dto/criar-paciente.dto';
import { ListarPacientesQueryDto } from './dto/listar-pacientes.query';
import { PacientesService } from './pacientes.service';

@Controller('patients')
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly authService: AuthService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Query() query: ListarPacientesQueryDto,
  ) {
    this.pacientesService.validarParametros(query);
    await this.authService.exigirPermissao(request.user.id, 'patients:read');
    return this.pacientesService.listar(query);
  }

  @Get('priority')
  @UseGuards(JwtAuthGuard)
  async prioritarios(
    @Req() request: { user: UsuarioDaRequisicao },
    @Query() query: ListarPrioritariosQueryDto,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'dashboard:read');
    return this.dashboardService.listarPrioritarios(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obter(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('id') id: string,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'patients:read');
    return this.pacientesService.obter(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async atualizar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('id') id: string,
    @Body() dto: AtualizarPacienteDto,
  ) {
    this.pacientesService.validarAtualizacao(dto);
    await this.authService.exigirPermissao(request.user.id, 'patients:update');
    return this.pacientesService.atualizar(id, dto, request.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async criar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Body() dto: CriarPacienteDto,
  ) {
    this.pacientesService.validarCadastro(dto);
    await this.authService.exigirPermissao(request.user.id, 'patients:create');
    return this.pacientesService.criar(dto);
  }
}
