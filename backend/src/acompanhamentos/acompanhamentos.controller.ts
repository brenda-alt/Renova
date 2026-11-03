import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsuarioDaRequisicao } from '../auth/authenticated-user';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AcompanhamentosService } from './acompanhamentos.service';
import {
  CriarAcompanhamentoDto,
  ListarAcompanhamentosQueryDto,
} from './dto/acompanhamento.dto';

@Controller('patients/:patientId/follow-ups')
export class AcompanhamentosController {
  constructor(
    private readonly acompanhamentosService: AcompanhamentosService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('patientId') patientId: string,
    @Query() query: ListarAcompanhamentosQueryDto,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'followups:read');
    return this.acompanhamentosService.listar(patientId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async criar(
    @Req() request: { user: UsuarioDaRequisicao },
    @Param('patientId') patientId: string,
    @Body() dto: CriarAcompanhamentoDto,
  ) {
    await this.authService.exigirPermissao(request.user.id, 'followups:create');
    return this.acompanhamentosService.criar(patientId, dto, request.user.id);
  }
}
