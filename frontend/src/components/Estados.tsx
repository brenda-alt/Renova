import type { ReactNode } from 'react';
import { mensagemDeErro } from '../services/api';

export function Carregando({ children = 'Carregando…' }: { children?: ReactNode }) {
  return (
    <p className="estado" role="status">
      {children}
    </p>
  );
}

export function MensagemErro({ erro }: { erro: unknown }) {
  return (
    <p className="alerta alerta-erro" role="alert">
      {mensagemDeErro(erro)}
    </p>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="estado">{children}</p>;
}

export function AvisoPermissao() {
  return (
    <p className="alerta alerta-erro" role="alert">
      Você não tem permissão para esta operação.
    </p>
  );
}
