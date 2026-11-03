import { solicitar } from './api';
import type {
  AtualizacaoPaciente,
  CadastroPaciente,
  ListaPaginada,
  Paciente,
} from '../types/api';
import { listarComConsulta } from './auth';

export interface FiltroPacientes {
  page?: number;
  pageSize?: number;
  name?: string;
  cpf?: string;
}

export function listarPacientes(filtro: FiltroPacientes): Promise<ListaPaginada<Paciente>> {
  return listarComConsulta<ListaPaginada<Paciente>>('/patients', {
    page: filtro.page ?? 1,
    pageSize: filtro.pageSize ?? 20,
    sort: 'fullName',
    name: filtro.name,
    cpf: filtro.cpf,
  });
}

export function obterPaciente(id: string): Promise<Paciente> {
  return solicitar<Paciente>(`/patients/${id}`);
}

export function criarPaciente(dados: CadastroPaciente): Promise<Paciente> {
  return solicitar<Paciente>('/patients', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function atualizarPaciente(id: string, dados: AtualizacaoPaciente): Promise<Paciente> {
  return solicitar<Paciente>(`/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}
