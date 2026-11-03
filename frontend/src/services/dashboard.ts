import { solicitar } from './api';
import type { ListaPrioritarios, ResumoDashboard } from '../types/api';
import { listarComConsulta } from './auth';

export function obterResumo(): Promise<ResumoDashboard> {
  return solicitar<ResumoDashboard>('/dashboard/summary');
}

export function listarPrioritarios(): Promise<ListaPrioritarios> {
  return listarComConsulta<ListaPrioritarios>('/patients/priority', {
    page: 1,
    pageSize: 5,
    sort: 'nearestExpiryOn',
  });
}
