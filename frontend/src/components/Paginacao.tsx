interface Propriedades {
  page: number;
  pageSize: number;
  total: number;
  onChange: (pagina: number) => void;
}

export function Paginacao({ page, pageSize, total, onChange }: Propriedades) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="paginacao">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {paginas}
      </span>
      <button type="button" disabled={page >= paginas} onClick={() => onChange(page + 1)}>
        Próxima
      </button>
    </div>
  );
}
