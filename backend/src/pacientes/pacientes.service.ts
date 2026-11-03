import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { interpretarIdInteiro } from '../common/identificador';
import { PrismaService } from '../prisma/prisma.service';
import { validarCpf } from './cpf';
import { AtualizarPacienteDto } from './dto/atualizar-paciente.dto';
import { CriarPacienteDto } from './dto/criar-paciente.dto';
import {
  ListarPacientesQueryDto,
  OrdenacaoPacientes,
} from './dto/listar-pacientes.query';
import {
  dataCivilEhPosterior,
  dataCivilNoFuso,
  dataCivilUtc,
  interpretarDataCivil,
} from './idade';
import { mapearPaciente, PacienteResposta } from './paciente.mapper';

export interface ListaPacientesResposta {
  data: PacienteResposta[];
  page: number;
  pageSize: number;
  total: number;
}

interface FiltroPaciente {
  cpf?: string;
  nome?: { contains: string; mode: 'insensitive' };
}

interface CadastroNormalizado {
  nome: string;
  cpf: string;
  dataNascimento: Date | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

const SELECAO_PACIENTE = {
  id: true,
  nome: true,
  cpf: true,
  dataNascimento: true,
  telefone: true,
  cep: true,
  endereco: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  uf: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  validarParametros(query: ListarPacientesQueryDto): void {
    const cpfInformado = query.cpf?.trim();

    if (!cpfInformado) {
      return;
    }

    const cpf = validarCpf(cpfInformado);

    if (!cpf.ok) {
      throw new BadRequestException({
        code: 'CPF_INVALID',
        message: 'CPF inválido.',
        details: [{ field: 'cpf', message: cpf.detalhe }],
      });
    }
  }

  async listar(query: ListarPacientesQueryDto): Promise<ListaPacientesResposta> {
    this.validarParametros(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sort = query.sort ?? 'fullName';
    const where = this.filtro(query);
    const agora = new Date();

    const [registros, total] = await Promise.all([
      this.prisma.paciente.findMany({
        where,
        orderBy: this.ordenacao(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SELECAO_PACIENTE,
      }),
      this.prisma.paciente.count({ where }),
    ]);

    return {
      data: registros.map((registro) => mapearPaciente(registro, agora)),
      page,
      pageSize,
      total,
    };
  }

  private filtro(query: ListarPacientesQueryDto): FiltroPaciente {
    const where: FiltroPaciente = {};
    const cpfInformado = query.cpf?.trim();
    const nome = query.name?.trim();

    if (cpfInformado) {
      const cpf = validarCpf(cpfInformado);

      if (cpf.ok) {
        where.cpf = cpf.digitos;
      }
    }

    if (nome) {
      where.nome = { contains: nome, mode: 'insensitive' };
    }

    return where;
  }

  validarCadastro(dto: CriarPacienteDto): CadastroNormalizado {
    const cpf = validarCpf(dto.cpf);

    if (!cpf.ok) {
      throw new BadRequestException({
        code: 'CPF_INVALID',
        message: 'CPF inválido.',
        details: [{ field: 'cpf', message: cpf.detalhe }],
      });
    }

    return {
      nome: dto.fullName.trim(),
      cpf: cpf.digitos,
      dataNascimento: this.dataDeNascimento(dto.birthDate),
      telefone: this.somenteDigitos(dto.phone, 'phone', 20),
      cep: dto.postalCode ? dto.postalCode.replace(/\D/g, '') : null,
      endereco: dto.street?.trim() || null,
      numero: dto.addressNumber?.trim() || null,
      complemento: dto.complement?.trim() || null,
      bairro: dto.neighborhood?.trim() || null,
      cidade: dto.city?.trim() || null,
      uf: dto.state ? dto.state.toUpperCase() : null,
    };
  }

  async criar(dto: CriarPacienteDto): Promise<PacienteResposta> {
    const dados = this.validarCadastro(dto);
    const existente = await this.prisma.paciente.findUnique({
      where: { cpf: dados.cpf },
      select: { id: true },
    });

    if (existente) {
      throw this.conflitoDeCpf(existente.id);
    }

    try {
      const criado = await this.prisma.paciente.create({
        data: dados,
        select: SELECAO_PACIENTE,
      });

      return mapearPaciente(criado, new Date());
    } catch (error) {
      if (!conflitoUnico(error)) {
        throw error;
      }

      const duplicado = await this.prisma.paciente.findUnique({
        where: { cpf: dados.cpf },
        select: { id: true },
      });

      throw this.conflitoDeCpf(duplicado?.id);
    }
  }

  private dataDeNascimento(valor: string | undefined): Date | null {
    if (!valor) {
      return null;
    }

    const data = interpretarDataCivil(valor);

    if (!data) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'birthDate', message: 'A data de nascimento é inválida.' }],
      });
    }

    const hoje = dataCivilNoFuso(new Date(), 'America/Sao_Paulo');

    if (dataCivilEhPosterior(data, hoje)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [
          {
            field: 'birthDate',
            message: 'A data de nascimento não pode ser posterior à data corrente.',
          },
        ],
      });
    }

    return new Date(Date.UTC(data.year, data.month - 1, data.day));
  }

  private somenteDigitos(
    valor: string | undefined,
    campo: string,
    maximo: number,
  ): string | null {
    if (!valor) {
      return null;
    }

    const digitos = valor.replace(/\D/g, '');

    if (digitos.length === 0 || digitos.length > maximo) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: campo, message: 'Informe apenas os dígitos do campo.' }],
      });
    }

    return digitos;
  }

  private conflitoDeCpf(id: number | undefined): ConflictException {
    const corpo: {
      code: 'CPF_ALREADY_EXISTS';
      message: string;
      existingPatientId?: string;
    } = {
      code: 'CPF_ALREADY_EXISTS',
      message: 'Já existe um paciente cadastrado com este CPF.',
    };

    if (id !== undefined) {
      corpo.existingPatientId = String(id);
    }

    return new ConflictException(corpo);
  }

  async obter(idTexto: string): Promise<PacienteResposta> {
    const id = this.exigirId(idTexto);
    const registro = await this.prisma.paciente.findUnique({
      where: { id },
      select: SELECAO_PACIENTE,
    });

    if (!registro) {
      throw pacienteNaoEncontrado();
    }

    return mapearPaciente(registro, new Date());
  }

  validarAtualizacao(dto: AtualizarPacienteDto): void {
    if (dto.fullName === null) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'fullName', message: 'O nome não pode ser removido.' }],
      });
    }

    if (dto.birthDate) {
      this.dataDeNascimento(dto.birthDate);
    }

    if (dto.phone) {
      this.somenteDigitos(dto.phone, 'phone', 20);
    }
  }

  async atualizar(
    idTexto: string,
    dto: AtualizarPacienteDto,
    usuarioId: number,
  ): Promise<PacienteResposta> {
    this.validarAtualizacao(dto);
    const id = this.exigirId(idTexto);
    const atual = await this.prisma.paciente.findUnique({
      where: { id },
      select: SELECAO_PACIENTE,
    });

    if (!atual) {
      throw pacienteNaoEncontrado();
    }

    const data: {
      nome?: string;
      dataNascimento?: Date | null;
      telefone?: string | null;
      cep?: string | null;
      endereco?: string | null;
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      cidade?: string | null;
      uf?: string | null;
    } = {};
    let nomeAlterado: { anterior: string; novo: string } | null = null;

    if (dto.fullName !== undefined && dto.fullName !== null) {
      const nome = dto.fullName.trim();
      const difere = nome.toLocaleLowerCase('pt-BR') !== atual.nome.toLocaleLowerCase('pt-BR');

      if (difere && dto.confirmNameChange !== true) {
        throw new ConflictException({
          code: 'NAME_CHANGE_CONFIRMATION_REQUIRED',
          message: 'O nome informado difere do cadastro. Confirme a alteração para continuar.',
          currentName: atual.nome,
          informedName: nome,
        });
      }

      if (nome !== atual.nome) {
        data.nome = nome;
        nomeAlterado = { anterior: atual.nome, novo: nome };
      }
    }

    if (dto.birthDate !== undefined) {
      const dataNascimento = dto.birthDate === null ? null : this.dataDeNascimento(dto.birthDate);

      if (!mesmaData(dataNascimento, atual.dataNascimento)) {
        data.dataNascimento = dataNascimento;
      }
    }

    if (dto.phone !== undefined) {
      const telefone = dto.phone === null ? null : this.somenteDigitos(dto.phone, 'phone', 20);

      if (telefone !== atual.telefone) {
        data.telefone = telefone;
      }
    }

    if (dto.postalCode !== undefined) {
      const cep = dto.postalCode === null ? null : dto.postalCode.replace(/\D/g, '');

      if (cep !== atual.cep) {
        data.cep = cep;
      }
    }

    if (dto.street !== undefined) {
      const endereco = dto.street === null ? null : dto.street.trim();

      if (endereco !== atual.endereco) {
        data.endereco = endereco;
      }
    }

    this.atribuirTexto(data, 'numero', dto.addressNumber, atual.numero);
    this.atribuirTexto(data, 'complemento', dto.complement, atual.complemento);
    this.atribuirTexto(data, 'bairro', dto.neighborhood, atual.bairro);
    this.atribuirTexto(data, 'cidade', dto.city, atual.cidade);

    if (dto.state !== undefined) {
      const uf = dto.state === null ? null : dto.state.toUpperCase();

      if (uf !== atual.uf) {
        data.uf = uf;
      }
    }

    if (Object.keys(data).length === 0) {
      return mapearPaciente(atual, new Date());
    }

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.paciente.update({
        where: { id },
        data,
        select: SELECAO_PACIENTE,
      });

      if (nomeAlterado) {
        await tx.historicoPaciente.create({
          data: {
            pacienteId: id,
            usuarioId,
            campoAlterado: 'fullName',
            valorAnterior: nomeAlterado.anterior,
            valorNovo: nomeAlterado.novo,
          },
        });
      }

      return registro;
    });

    return mapearPaciente(atualizado, new Date());
  }

  private atribuirTexto(
    data: {
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      cidade?: string | null;
    },
    campo: 'numero' | 'complemento' | 'bairro' | 'cidade',
    informado: string | null | undefined,
    atual: string | null,
  ): void {
    if (informado === undefined) {
      return;
    }

    const valor = informado === null ? null : informado.trim();

    if (valor !== atual) {
      data[campo] = valor;
    }
  }

  private exigirId(idTexto: string): number {
    const id = interpretarIdInteiro(idTexto);

    if (id === null) {
      throw pacienteNaoEncontrado();
    }

    return id;
  }

  private ordenacao(sort: OrdenacaoPacientes): { nome: 'asc' | 'desc' } | { createdAt: 'asc' | 'desc' } {
    if (sort === '-fullName') {
      return { nome: 'desc' };
    }

    if (sort === 'createdAt') {
      return { createdAt: 'asc' };
    }

    if (sort === '-createdAt') {
      return { createdAt: 'desc' };
    }

    return { nome: 'asc' };
  }
}

function pacienteNaoEncontrado(): NotFoundException {
  return new NotFoundException({
    code: 'PATIENT_NOT_FOUND',
    message: 'Paciente não encontrado.',
  });
}

function mesmaData(esquerda: Date | null, direita: Date | null): boolean {
  if (esquerda === null || direita === null) {
    return esquerda === direita;
  }

  const a = dataCivilUtc(esquerda);
  const b = dataCivilUtc(direita);
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function conflitoUnico(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
