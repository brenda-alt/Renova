import { consulta, solicitar } from './api';
import type { RespostaLogin, UsuarioAutenticado } from '../types/api';

export function entrar(username: string, password: string): Promise<RespostaLogin> {
  return solicitar<RespostaLogin>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    { autenticar: false },
  );
}

export function obterEu(): Promise<UsuarioAutenticado> {
  return solicitar<UsuarioAutenticado>('/auth/me');
}

export function listarComConsulta<T>(
  caminho: string,
  parametros: Record<string, string | number | undefined>,
): Promise<T> {
  return solicitar<T>(`${caminho}${consulta(parametros)}`);
}
