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
import {
  AtualizarReceitaDto,
  CriarReceitaDto,
  ListarAlertasQueryDto,
  ListarReceitasQueryDto,
} from './dto/receita.dto';
import { ReceitasService } from './receitas.service';

@Controller('prescriptions')
export class ReceitasController {
  constructor(
    private readonly receitasService: ReceitasService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async criar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Body() dto: CriarReceitaDto,
  ) {
    this.receitasService.validarCadastro(dto);
    await this.authService.exigirPermissao(request.user.id, 'prescriptions:create');
    return this.receitasService.criar(dto, request.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Query() query: ListarReceitasQueryDto,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'prescriptions:read');
    return this.receitasService.listar(query);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  async alertas(
    @Req() request: { user: UsuarioDaRequisicao },
    @Query() query: ListarAlertasQueryDto,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'dashboard:read');
    return this.receitasService.listarAlertas(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obter(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('id') id: string,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'prescriptions:read');
    return this.receitasService.obter(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async atualizar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('id') id: string,
    @Body() dto: AtualizarReceitaDto,
  ) {
    this.receitasService.validarAtualizacao(dto);

    if (dto.lifecycleStatus === 'CANCELADA') {
      await this.authService.exigirPermissao(request.user.id, 'prescriptions:update');
      await this.authService.exigirPermissao(request.user.id, 'prescriptions:cancel');
    } else {
      await this.authService.exigirPermissao(request.user.id, 'prescriptions:update');
    }

    return this.receitasService.atualizar(id, dto, request.user.id);
  }
}
