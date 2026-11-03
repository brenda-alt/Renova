import { mascararCpf } from './cpf';
import {
  calcularIdade,
  dataCivilUtc,
  formatarDataCivil,
  IdadeCalculada,
} from './idade';

export interface PacientePersistido {
  id: number;
  nome: string;
  cpf: string | null;
  dataNascimento: Date | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PacienteResposta {
  id: string;
  cpf: string | null;
  fullName: string;
  birthDate: string | null;
  phone: string | null;
  postalCode: string | null;
  street: string | null;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  age: IdadeCalculada;
  active: true;
  createdAt: string;
  updatedAt: string;
}

export function formatarTelefone(telefone: string | null): string | null {
  if (!telefone) {
    return null;
  }

  const digitos = telefone.replace(/\D/g, '');

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  return telefone;
}

export function formatarCep(cep: string | null): string | null {
  if (!cep) {
    return null;
  }

  const digitos = cep.replace(/\D/g, '');

  if (digitos.length === 8) {
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
  }

  return cep;
}

export function mapearPaciente(
  paciente: PacientePersistido,
  agora: Date,
): PacienteResposta {
  const cpf =
    paciente.cpf && paciente.cpf.length === 11
      ? mascararCpf(paciente.cpf)
      : paciente.cpf;

  return {
    id: String(paciente.id),
    cpf,
    fullName: paciente.nome,
    birthDate: paciente.dataNascimento
      ? formatarDataCivil(dataCivilUtc(paciente.dataNascimento))
      : null,
    phone: formatarTelefone(paciente.telefone),
    postalCode: formatarCep(paciente.cep),
    street: paciente.endereco,
    addressNumber: paciente.numero,
    complement: paciente.complemento,
    neighborhood: paciente.bairro,
    city: paciente.cidade,
    state: paciente.uf,
    age: calcularIdade(paciente.dataNascimento, agora),
    active: true,
    createdAt: paciente.createdAt.toISOString(),
    updatedAt: paciente.updatedAt.toISOString(),
  };
}
