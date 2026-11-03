import { permissoesEfetivas } from './permissoes';

export interface PapelAutenticado {
  code: string;
  name: string;
}

export interface AcessoDoPerfil {
  code: string;
  name: string;
  permissions: string[];
}

const NOMES_CONHECIDOS: Record<string, string> = {
  ADMIN: 'Administrador',
  PROFISSIONAL: 'Profissional',
};

/**
 * A coluna `perfil` é um texto único. O ADMIN recebe o catálogo inteiro.
 * Os demais perfis permanecem sem permissão até a matriz ser definida.
 */
export function mapearPerfil(perfil: string): AcessoDoPerfil {
  const code = perfil.trim();

  return {
    code,
    name: NOMES_CONHECIDOS[code] ?? code,
    permissions: permissoesEfetivas(code),
  };
}
