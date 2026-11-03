import { Injectable } from '@nestjs/common';
import { dataCivilParaUtc, dataCivilUtc, formatarDataCivil, somarDiasCivis } from '../pacientes/idade';
import { formatarTelefone } from '../pacientes/paciente.mapper';
import { PrismaService } from '../prisma/prisma.service';
import {
  classificarPrazo,
  DIAS_FAIXA_ATENCAO,
  DIAS_FAIXA_PROXIMA,
  FUSO_OPERACIONAL,
  referenciaCivil,
} from '../prazo/prazo';
import { ListarPrioritariosQueryDto } from './dto/listar-prioritarios.query';

export interface ResumoDashboard {
  referenceDate: string;
  timezone: typeof FUSO_OPERACIONAL;
  alertWindows: {
    nearDays: number;
    attentionDays: number;
  };
  counts: {
    vencidas: number;
    proximas5: number;
    proximas15: number;
    dentroDoPrazo: number;
    pendentesInformacao: number;
  };
}

export interface PacientePrioritario {
  id: string;
  fullName: string;
  phone: string | null;
  nearestExpiryOn: string;
  alertBand: string;
  daysUntilExpiry: number;
}

export interface ListaPrioritaria {
  data: PacientePrioritario[];
  page: number;
  pageSize: number;
  total: number;
  referenceDate: string;
  timezone: typeof FUSO_OPERACIONAL;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(): Promise<ResumoDashboard> {
    const referencia = referenciaCivil(new Date());
    const hoje = dataCivilParaUtc(referencia);
    const ate5 = dataCivilParaUtc(somarDiasCivis(referencia, DIAS_FAIXA_PROXIMA));
    const depoisDe5 = dataCivilParaUtc(somarDiasCivis(referencia, DIAS_FAIXA_PROXIMA + 1));
    const ate15 = dataCivilParaUtc(somarDiasCivis(referencia, DIAS_FAIXA_ATENCAO));
    const depoisDe15 = dataCivilParaUtc(somarDiasCivis(referencia, DIAS_FAIXA_ATENCAO + 1));

    const ativas = { canceladaEm: null };
    const [vencidas, proximas5, proximas15, dentroDoPrazo, pendentesInformacao] = await Promise.all([
      this.prisma.receita.count({ where: { ...ativas, dataVencimento: { lt: hoje } } }),
      this.prisma.receita.count({ where: { ...ativas, dataVencimento: { gte: hoje, lte: ate5 } } }),
      this.prisma.receita.count({ where: { ...ativas, dataVencimento: { gte: depoisDe5, lte: ate15 } } }),
      this.prisma.receita.count({ where: { ...ativas, dataVencimento: { gte: depoisDe15 } } }),
      this.prisma.receita.count({ where: { ...ativas, dataVencimento: null } }),
    ]);

    return {
      referenceDate: formatarDataCivil(referencia),
      timezone: FUSO_OPERACIONAL,
      alertWindows: {
        nearDays: DIAS_FAIXA_PROXIMA,
        attentionDays: DIAS_FAIXA_ATENCAO,
      },
      counts: {
        vencidas,
        proximas5,
        proximas15,
        dentroDoPrazo,
        pendentesInformacao,
      },
    };
  }

  async listarPrioritarios(query: ListarPrioritariosQueryDto): Promise<ListaPrioritaria> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const referencia = referenciaCivil(new Date());
    const limite = dataCivilParaUtc(somarDiasCivis(referencia, DIAS_FAIXA_ATENCAO));
    const where = { canceladaEm: null, dataVencimento: { lte: limite } };
    const ordem = query.sort === '-nearestExpiryOn' ? 'desc' : 'asc';

    const [grupos, agrupados] = await Promise.all([
      this.prisma.receita.groupBy({
        by: ['pacienteId'],
        where,
        _min: { dataVencimento: true },
        orderBy: { _min: { dataVencimento: ordem } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.receita.groupBy({
        by: ['pacienteId'],
        where,
      }),
    ]);

    const ids = grupos.map((grupo) => grupo.pacienteId);
    const pacientes = ids.length
      ? await this.prisma.paciente.findMany({
          where: { id: { in: ids } },
          select: { id: true, nome: true, telefone: true },
        })
      : [];
    const porId = new Map(pacientes.map((paciente) => [paciente.id, paciente]));

    return {
      data: grupos.flatMap((grupo) => {
        const paciente = porId.get(grupo.pacienteId);
        const vencimento = grupo._min.dataVencimento;

        if (!paciente || !vencimento) {
          return [];
        }

        const classificacao = classificarPrazo(vencimento, referencia);

        if (classificacao.daysUntilExpiry === null) {
          return [];
        }

        return [
          {
            id: String(paciente.id),
            fullName: paciente.nome,
            phone: formatarTelefone(paciente.telefone),
            nearestExpiryOn: formatarDataCivil(dataCivilUtc(vencimento)),
            alertBand: classificacao.alertBand,
            daysUntilExpiry: classificacao.daysUntilExpiry,
          },
        ];
      }),
      page,
      pageSize,
      total: agrupados.length,
      referenceDate: formatarDataCivil(referencia),
      timezone: FUSO_OPERACIONAL,
    };
  }
}
