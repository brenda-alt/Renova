/**
 * Códigos exigidos pelas operações do contrato OpenAPI.
 * Incluir um código aqui passa a valer para o ADMIN, sem outra lista.
 */
export const PERMISSOES = [
  'dashboard:read',
  'followups:create',
  'followups:read',
  'patients:create',
  'patients:read',
  'patients:update',
  'prescriptions:cancel',
  'prescriptions:create',
  'prescriptions:read',
  'prescriptions:update',
] as const;

export type Permissao = (typeof PERMISSOES)[number];

const PERFIL_COM_CATALOGO_COMPLETO = 'ADMIN';

export function permissoesEfetivas(perfil: string): string[] {
  if (perfil.trim() === PERFIL_COM_CATALOGO_COMPLETO) {
    return [...PERMISSOES];
  }

  return [];
}
