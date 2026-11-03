import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { interpretarIdInteiro } from '../common/identificador';
import {
  dataCivilParaUtc,
  dataCivilUtc,
  formatarDataCivil,
  interpretarDataCivil,
  somarDiasCivis,
} from '../pacientes/idade';
import { PrismaService } from '../prisma/prisma.service';
import {
  classificarPrazo,
  FaixaDias,
  faixaPorAlerta,
  faixaPorBandaDeAlerta,
  faixaPorSituacao,
  FUSO_OPERACIONAL,
  intersecaoDeFaixas,
  intervaloDeVencimento,
  referenciaCivil,
} from '../prazo/prazo';
import {
  AtualizarReceitaDto,
  BandaAlerta,
  CriarReceitaDto,
  ListarAlertasQueryDto,
  ListarReceitasQueryDto,
  OrdenacaoReceitas,
} from './dto/receita.dto';
import { mapearReceita, ReceitaPersistida, ReceitaResposta } from './receita.mapper';

const SELECAO_RECEITA = {
  id: true,
  dataEmissao: true,
  dataVencimento: true,
  tipoReceita: true,
  canceladaEm: true,
  observacoes: true,
  createdAt: true,
  updatedAt: true,
  paciente: {
    select: {
      id: true,
      nome: true,
      cpf: true,
    },
  },
  itens: {
    orderBy: { id: 'asc' as const },
    select: {
      id: true,
      nomeMedicamento: true,
      dosagem: true,
      quantidade: true,
      usoManha: true,
      usoTarde: true,
      usoNoite: true,
    },
  },
} as const;

interface ItemNormalizado {
  nomeMedicamento: string;
  dosagem: string;
  quantidade: string;
  usoManha: boolean;
  usoTarde: boolean;
  usoNoite: boolean;
}

interface CadastroNormalizado {
  dataEmissao: Date;
  dataVencimento: Date | null;
  tipoReceita: 'COMUM' | 'CONTROLADA' | null;
  observacoes: string | null;
  itens: ItemNormalizado[];
}

export interface ListaReceitasResposta {
  data: ReceitaResposta[];
  page: number;
  pageSize: number;
  total: number;
  referenceDate: string;
  timezone: typeof FUSO_OPERACIONAL;
}

@Injectable()
export class ReceitasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarReceitasQueryDto): Promise<ListaReceitasResposta> {
    return this.consultar(query);
  }

  async listarAlertas(query: ListarAlertasQueryDto): Promise<ListaReceitasResposta> {
    return this.consultar(
      {
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort ?? 'expiresOn',
      },
      query.band ?? 'proxima',
    );
  }

  async obter(idTexto: string): Promise<ReceitaResposta> {
    const id = this.exigirId(idTexto);
    const registro = await this.prisma.receita.findUnique({
      where: { id },
      select: SELECAO_RECEITA,
    });

    if (!registro) {
      throw receitaNaoEncontrada();
    }

    return this.responder(registro);
  }

  validarCadastro(dto: CriarReceitaDto): CadastroNormalizado {
    const itens = this.itensDoCadastro(dto);
    const tipoReceita = dto.prescriptionType ?? null;

    if (tipoReceita && itens.length === 0) {
      throw erroDeCampo('items', 'Adicione ao menos um medicamento.');
    }

    if (!tipoReceita && itens.length > 0) {
      throw erroDeCampo('prescriptionType', 'O tipo da receita deve ser comum ou controlada.');
    }

    const dataEmissao = this.dataDeEmissao(dto.issuedOn);
    let dataVencimento: Date | null;

    if (dto.validityDays !== undefined) {
      const vencimento = somarDiasCivis(dataCivilUtc(dataEmissao), dto.validityDays);

      if (vencimento.year > 9999) {
        throw erroDeCampo('validityDays', 'A validade produz uma data que o sistema não representa.');
      }

      const texto = formatarDataCivil(vencimento);

      if (dto.expiresOn && dto.expiresOn !== texto) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Pedido inválido.',
          details: [
            {
              field: 'expiresOn',
              message: 'A data de vencimento não confere com a emissão e a validade.',
            },
          ],
        });
      }

      dataVencimento = dataCivilParaUtc(vencimento);
    } else {
      dataVencimento = dto.expiresOn ? this.dataDeVencimento(dto.expiresOn) : null;
    }

    return {
      dataEmissao,
      dataVencimento,
      tipoReceita,
      observacoes: dto.notes?.trim() || null,
      itens,
    };
  }

  async criar(dto: CriarReceitaDto, usuarioId: number): Promise<ReceitaResposta> {
    const cadastro = this.validarCadastro(dto);
    const pacienteId = interpretarIdInteiro(dto.patientId);

    if (pacienteId === null) {
      throw pacienteNaoEncontrado();
    }

    const paciente = await this.prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true },
    });

    if (!paciente) {
      throw pacienteNaoEncontrado();
    }

    const criada = await this.prisma.$transaction((transacao) =>
      transacao.receita.create({
        data: {
          pacienteId,
          usuarioId,
          dataEmissao: cadastro.dataEmissao,
          dataVencimento: cadastro.dataVencimento,
          tipoReceita: cadastro.tipoReceita,
          observacoes: cadastro.observacoes,
          canceladaEm: null,
          canceladaPorId: null,
          itens: cadastro.itens.length > 0 ? { create: cadastro.itens } : undefined,
        },
        select: SELECAO_RECEITA,
      }),
    );

    return this.responder(criada);
  }

  validarAtualizacao(dto: AtualizarReceitaDto): void {
    if (dto.lifecycleStatus === null) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'lifecycleStatus', message: 'A situação da receita informada não é aceita.' }],
      });
    }

    if (dto.expiresOn) {
      this.dataDeVencimento(dto.expiresOn);
    }
  }

  async atualizar(
    idTexto: string,
    dto: AtualizarReceitaDto,
    usuarioId: number,
  ): Promise<ReceitaResposta> {
    this.validarAtualizacao(dto);

    const id = this.exigirId(idTexto);
    const atual = await this.prisma.receita.findUnique({
      where: { id },
      select: SELECAO_RECEITA,
    });

    if (!atual) {
      throw receitaNaoEncontrada();
    }

    const data: {
      dataVencimento?: Date | null;
      observacoes?: string | null;
      canceladaEm?: Date | null;
      canceladaPorId?: number | null;
    } = {};

    if (dto.expiresOn !== undefined) {
      const dataVencimento = dto.expiresOn === null ? null : this.dataDeVencimento(dto.expiresOn);
      const atualTexto = atual.dataVencimento
        ? formatarDataCivil(dataCivilUtc(atual.dataVencimento))
        : null;

      if (dto.expiresOn !== atualTexto) {
        data.dataVencimento = dataVencimento;
      }
    }

    if (dto.lifecycleStatus === 'CANCELADA' && atual.canceladaEm === null) {
      data.canceladaEm = new Date();
      data.canceladaPorId = usuarioId;
    }

    if (dto.lifecycleStatus === 'ATIVA' && atual.canceladaEm !== null) {
      data.canceladaEm = null;
      data.canceladaPorId = null;
    }

    if (dto.notes !== undefined) {
      const observacoes = dto.notes === null ? null : dto.notes.trim();

      if (observacoes !== atual.observacoes) {
        data.observacoes = observacoes;
      }
    }

    if (Object.keys(data).length === 0) {
      return this.responder(atual);
    }

    const atualizada = await this.prisma.receita.update({
      where: { id },
      data,
      select: SELECAO_RECEITA,
    });

    return this.responder(atualizada);
  }

  private async consultar(
    query: ListarReceitasQueryDto,
    banda?: BandaAlerta,
  ): Promise<ListaReceitasResposta> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const referencia = referenciaCivil(new Date());
    const vazia: ListaReceitasResposta = {
      data: [],
      page,
      pageSize,
      total: 0,
      referenceDate: formatarDataCivil(referencia),
      timezone: FUSO_OPERACIONAL,
    };

    const where = this.filtro(query, banda, referencia);

    if (where === null) {
      return vazia;
    }

    const [registros, total] = await Promise.all([
      this.prisma.receita.findMany({
        where,
        orderBy: this.ordenacao(query.sort ?? (banda ? 'expiresOn' : '-createdAt')),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SELECAO_RECEITA,
      }),
      this.prisma.receita.count({ where }),
    ]);

    return {
      data: registros.map((registro) =>
        mapearReceita(registro, referencia, classificarPrazo(registro.dataVencimento, referencia)),
      ),
      page,
      pageSize,
      total,
      referenceDate: formatarDataCivil(referencia),
      timezone: FUSO_OPERACIONAL,
    };
  }

  private filtro(
    query: ListarReceitasQueryDto,
    banda: BandaAlerta | undefined,
    referencia: ReturnType<typeof referenciaCivil>,
  ) {
    const where: {
      pacienteId?: number;
      canceladaEm?: null | { not: null };
      dataVencimento?: { gte?: Date; lte?: Date } | null;
    } = {
      canceladaEm: query.lifecycleStatus === 'CANCELADA' ? { not: null } : null,
    };

    if (query.patientId !== undefined) {
      const pacienteId = interpretarIdInteiro(query.patientId);

      if (pacienteId === null) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Pedido inválido.',
          details: [{ field: 'patientId', message: 'O identificador do paciente é inválido.' }],
        });
      }

      where.pacienteId = pacienteId;
    }

    let faixa: FaixaDias | null | undefined;

    if (banda) {
      faixa = faixaPorBandaDeAlerta(banda);
    }

    if (query.statusFilter && query.statusFilter !== 'pendente') {
      const situacao = faixaPorSituacao(query.statusFilter);
      faixa = faixa && situacao ? intersecaoDeFaixas(faixa, situacao) : situacao;
    }

    if (query.alertBand && query.alertBand !== 'PENDENTE_INFORMACAO') {
      const alerta = faixaPorAlerta(query.alertBand);
      faixa = faixa && alerta ? intersecaoDeFaixas(faixa, alerta) : alerta;
    }

    const pendente =
      banda === 'pendente' ||
      query.statusFilter === 'pendente' ||
      query.alertBand === 'PENDENTE_INFORMACAO';

    if (pendente && faixa) {
      return null;
    }

    if (pendente) {
      where.dataVencimento = null;
    } else if (faixa === null) {
      return null;
    } else if (faixa) {
      where.dataVencimento = intervaloDeVencimento(faixa, referencia);
    }

    return where;
  }

  private ordenacao(sort: OrdenacaoReceitas | 'expiresOn' | '-expiresOn') {
    if (sort === 'expiresOn') {
      return { dataVencimento: 'asc' as const };
    }

    if (sort === '-expiresOn') {
      return { dataVencimento: 'desc' as const };
    }

    if (sort === 'patientName') {
      return { paciente: { nome: 'asc' as const } };
    }

    if (sort === '-patientName') {
      return { paciente: { nome: 'desc' as const } };
    }

    if (sort === 'createdAt') {
      return { createdAt: 'asc' as const };
    }

    return { createdAt: 'desc' as const };
  }

  private dataDeVencimento(valor: string): Date {
    const data = interpretarDataCivil(valor);

    if (!data) {
      throw erroDeCampo('expiresOn', 'A data de vencimento é inválida.');
    }

    return dataCivilParaUtc(data);
  }

  private dataDeEmissao(valor?: string): Date {
    if (!valor) {
      return dataCivilParaUtc(referenciaCivil(new Date()));
    }

    const data = interpretarDataCivil(valor);

    if (!data) {
      throw erroDeCampo('issuedOn', 'A data de emissão é inválida.');
    }

    return dataCivilParaUtc(data);
  }

  private itensDoCadastro(dto: CriarReceitaDto): ItemNormalizado[] {
    return (dto.items ?? []).map((item, indice) => {
      if (!item.morning && !item.afternoon && !item.night) {
        throw erroDeCampo(
          `items.${indice}.morning`,
          'Informe ao menos um período: manhã, tarde ou noite.',
        );
      }

      return {
        nomeMedicamento: item.medicationName.trim(),
        dosagem: item.dosage.trim(),
        quantidade: item.quantity.trim(),
        usoManha: item.morning,
        usoTarde: item.afternoon,
        usoNoite: item.night,
      };
    });
  }

  private responder(registro: ReceitaPersistida): ReceitaResposta {
    const referencia = referenciaCivil(new Date());
    return mapearReceita(
      registro,
      referencia,
      classificarPrazo(registro.dataVencimento, referencia),
    );
  }

  private exigirId(idTexto: string): number {
    const id = interpretarIdInteiro(idTexto);

    if (id === null) {
      throw receitaNaoEncontrada();
    }

    return id;
  }
}

function erroDeCampo(field: string, message: string): BadRequestException {
  return new BadRequestException({
    code: field === 'expiresOn' || field === 'issuedOn' ? 'DATE_INVALID' : 'VALIDATION_ERROR',
    message: field === 'expiresOn' || field === 'issuedOn' ? 'Data inválida.' : 'Pedido inválido.',
    details: [{ field, message }],
  });
}

function pacienteNaoEncontrado(): NotFoundException {
  return new NotFoundException({
    code: 'PATIENT_NOT_FOUND',
    message: 'Paciente não encontrado.',
  });
}

function receitaNaoEncontrada(): NotFoundException {
  return new NotFoundException({
    code: 'PRESCRIPTION_NOT_FOUND',
    message: 'Receita não encontrada.',
  });
}
