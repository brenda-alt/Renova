import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Carregando, MensagemErro, Vazio } from '../components/Estados';
import { Paginacao } from '../components/Paginacao';
import { formatarDataCivil } from '../lib/datas';
import { listarPacientes } from '../services/pacientes';
import { useSessao } from '../sessao/SessaoContexto';

export function PacientesPage() {
  const { temPermissao } = useSessao();
  const [parametros, setParametros] = useSearchParams();
  const name = parametros.get('name') ?? '';
  const cpf = parametros.get('cpf') ?? '';
  const page = Number(parametros.get('page') ?? '1');
  const [rascunhoNome, setRascunhoNome] = useState(name);
  const [rascunhoCpf, setRascunhoCpf] = useState(cpf);
  const lista = useQuery({
    queryKey: ['pacientes', { page, name, cpf }],
    queryFn: () => listarPacientes({ page, name, cpf }),
  });

  function filtrar(evento: FormEvent) {
    evento.preventDefault();
    const proximos = new URLSearchParams();
    if (rascunhoNome.trim()) proximos.set('name', rascunhoNome.trim());
    if (rascunhoCpf.trim()) proximos.set('cpf', rascunhoCpf.trim());
    setParametros(proximos);
  }

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Pacientes</p>
          <h1>Cadastro</h1>
        </div>
        {temPermissao('patients:create') ? (
          <Link className="botao" to="/pacientes/novo">
            Novo paciente
          </Link>
        ) : null}
      </header>
      <form className="busca" onSubmit={filtrar}>
        <label htmlFor="filtro-nome">Nome</label>
        <input id="filtro-nome" value={rascunhoNome} onChange={(evento) => setRascunhoNome(evento.target.value)} />
        <label htmlFor="filtro-cpf">CPF</label>
        <input id="filtro-cpf" value={rascunhoCpf} onChange={(evento) => setRascunhoCpf(evento.target.value)} />
        <button type="submit" className="botao">
          Filtrar
        </button>
      </form>
      {lista.isLoading ? <Carregando /> : null}
      {lista.isError ? <MensagemErro erro={lista.error} /> : null}
      {lista.data && lista.data.data.length === 0 ? <Vazio>Nenhum paciente encontrado.</Vazio> : null}
      {lista.data && lista.data.data.length > 0 ? (
        <>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Nascimento</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                </tr>
              </thead>
              <tbody>
                {lista.data.data.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>
                      <Link to={`/pacientes/${paciente.id}`}>{paciente.fullName}</Link>
                    </td>
                    <td>{paciente.cpf ?? 'Não informado'}</td>
                    <td>{formatarDataCivil(paciente.birthDate)}</td>
                    <td>{paciente.phone ?? 'Não informado'}</td>
                    <td>{paciente.city ?? 'Não informada'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao
            page={lista.data.page}
            pageSize={lista.data.pageSize}
            total={lista.data.total}
            onChange={(proxima) => {
              const proximos = new URLSearchParams(parametros);
              proximos.set('page', String(proxima));
              setParametros(proximos);
            }}
          />
        </>
      ) : null}
    </section>
  );
}
