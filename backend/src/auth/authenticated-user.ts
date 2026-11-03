import { PapelAutenticado } from './perfil-acesso';

export interface AuthenticatedUserView {
  id: string;
  username: string;
  fullName: string;
  active: boolean;
  roles: PapelAutenticado[];
  permissions: string[];
}

export interface UsuarioDaRequisicao {
  id: number;
  username: string;
  fullName: string;
  active: true;
  perfil: string;
}
