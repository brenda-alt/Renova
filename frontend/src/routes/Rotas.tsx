import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSessao } from '../sessao/SessaoContexto';

export function RotaPrivada() {
  const { usuario, carregando } = useSessao();

  if (carregando) {
    return (
      <p className="estado-tela" role="status">
        Carregando sessão…
      </p>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RotaPublica({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useSessao();

  if (carregando) {
    return (
      <p className="estado-tela" role="status">
        Carregando sessão…
      </p>
    );
  }

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
