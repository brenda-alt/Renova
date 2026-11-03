import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { interpretarIdInteiro } from '../common/identificador';
import { dataCivilParaUtc, interpretarDataCivil } from '../pacientes/idade';
import { PrismaService } from '../prisma/prisma.service';
import { mapearAcompanhamento, AcompanhamentoResposta } from './acompanhamento.mapper';
import {
  CriarAcompanhamentoDto,
  ListarAcompanhamentosQueryDto,
} from './dto/acompanhamento.dto';

const SELECAO = {
  id: true,
  pacienteId: true,
  receitaId: true,
  ocorreuEm: true,
  descricao: true,
  createdAt: true,
  usuario: { select: { id: true, nome: true } },
} as const;

@Injectable()
export class AcompanhamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(pacienteIdTexto: string, query: ListarAcompanhamentosQueryDto) {
    const pacienteId = await this.exigirPaciente(pacienteIdTexto);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { pacienteId };
    const [registros, total] = await Promise.all([
      this.prisma.acompanhamento.findMany({
        where,
        orderBy: { ocorreuEm: query.sort === 'occurredOn' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SELECAO,
      }),
      this.prisma.acompanhamento.count({ where }),
    ]);

    return {
      data: registros.map(mapearAcompanhamento),
      page,
      pageSize,
      total,
    };
  }

  async criar(
    pacienteIdTexto: string,
    dto: CriarAcompanhamentoDto,
    usuarioId: number,
  ): Promise<AcompanhamentoResposta> {
    const pacienteId = await this.exigirPaciente(pacienteIdTexto);
    const ocorreuEm = this.dataDoAcompanhamento(dto.occurredOn);
    const receitaId = await this.receitaDoPaciente(pacienteId, dto.prescriptionId);
    const criado = await this.prisma.acompanhamento.create({
      data: {
        pacienteId,
        receitaId,
        usuarioId,
        ocorreuEm,
        descricao: dto.description.trim(),
      },
      select: SELECAO,
    });

    return mapearAcompanhamento(criado);
  }

  private async exigirPaciente(idTexto: string): Promise<number> {
    const id = interpretarIdInteiro(idTexto);

    if (id === null) {
      throw pacienteNaoEncontrado();
    }

    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!paciente) {
      throw pacienteNaoEncontrado();
    }

    return id;
  }

  private async receitaDoPaciente(
    pacienteId: number,
    prescriptionId: string | undefined,
  ): Promise<number | null> {
    if (!prescriptionId) {
      return null;
    }

    const id = interpretarIdInteiro(prescriptionId);

    if (id === null) {
      throw receitaIncompativel();
    }

    const receita = await this.prisma.receita.findUnique({
      where: { id },
      select: { pacienteId: true },
    });

    if (!receita || receita.pacienteId !== pacienteId) {
      throw receitaIncompativel();
    }

    return id;
  }

  private dataDoAcompanhamento(valor: string): Date {
    const data = interpretarDataCivil(valor);

    if (!data) {
      throw new BadRequestException({
        code: 'DATE_INVALID',
        message: 'Data inválida.',
        details: [{ field: 'occurredOn', message: 'A data do acompanhamento é inválida.' }],
      });
    }

    return dataCivilParaUtc(data);
  }
}

function pacienteNaoEncontrado(): NotFoundException {
  return new NotFoundException({
    code: 'PATIENT_NOT_FOUND',
    message: 'Paciente não encontrado.',
  });
}

function receitaIncompativel(): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Pedido inválido.',
    details: [
      {
        field: 'prescriptionId',
        message: 'A receita informada não pertence a este paciente.',
      },
    ],
  });
}
