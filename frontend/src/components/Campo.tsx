import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface CampoBase {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
}

export function CampoTexto({
  id,
  rotulo,
  erro,
  dica,
  ...props
}: CampoBase & InputHTMLAttributes<HTMLInputElement>) {
  const descricao = erro ?? dica;
  return (
    <label className="campo" htmlFor={id}>
      <span>{rotulo}</span>
      <input id={id} aria-invalid={Boolean(erro)} aria-describedby={descricao ? `${id}-ajuda` : undefined} {...props} />
      {descricao ? (
        <small id={`${id}-ajuda`} className={erro ? 'campo-erro' : 'campo-dica'}>
          {descricao}
        </small>
      ) : null}
    </label>
  );
}

export function CampoArea({
  id,
  rotulo,
  erro,
  dica,
  ...props
}: CampoBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="campo" htmlFor={id}>
      <span>{rotulo}</span>
      <textarea id={id} aria-invalid={Boolean(erro)} {...props} />
      {erro ? <small className="campo-erro">{erro}</small> : null}
      {!erro && dica ? <small className="campo-dica">{dica}</small> : null}
    </label>
  );
}

export function CampoSelecao({
  id,
  rotulo,
  erro,
  children,
  ...props
}: CampoBase & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <label className="campo" htmlFor={id}>
      <span>{rotulo}</span>
      <select id={id} aria-invalid={Boolean(erro)} {...props}>
        {children}
      </select>
      {erro ? <small className="campo-erro">{erro}</small> : null}
    </label>
  );
}
