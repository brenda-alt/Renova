import { solicitar } from './api';
import type { AtualizacaoReceita, CadastroReceita, ListaReceitas, Receita } from '../types/api';
import { listarComConsulta } from './auth';

export interface FiltroReceitas {
  page?: number;
  patientId?: string;
  statusFilter?: string;
  alertBand?: string;
  lifecycleStatus?: string;
}

export function listarReceitas(filtro: FiltroReceitas): Promise<ListaReceitas> {
  return listarComConsulta<ListaReceitas>('/prescriptions', {
    page: filtro.page ?? 1,
    pageSize: 20,
    sort: '-createdAt',
    patientId: filtro.patientId,
    statusFilter: filtro.statusFilter,
    alertBand: filtro.alertBand,
    lifecycleStatus: filtro.lifecycleStatus,
  });
}

export function criarReceita(dados: CadastroReceita): Promise<Receita> {
  return solicitar<Receita>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function obterReceita(id: string): Promise<Receita> {
  return solicitar<Receita>(`/prescriptions/${id}`);
}

export function atualizarReceita(id: string, dados: AtualizacaoReceita): Promise<Receita> {
  return solicitar<Receita>(`/prescriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}
