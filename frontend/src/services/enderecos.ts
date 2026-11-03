import { solicitar } from './api';
import type { ConsultaCep } from '../types/api';

export function consultarCep(cep: string): Promise<ConsultaCep> {
  return solicitar<ConsultaCep>(`/addresses/cep/${encodeURIComponent(cep)}`);
}
