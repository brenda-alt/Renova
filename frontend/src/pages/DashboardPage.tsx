import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarPrioritarios, obterResumo } from '../services/dashboard';
import { Carregando, MensagemErro } from '../components/Estados';
import { classeFaixa, rotuloFaixa } from '../lib/rotulos';
import { formatarDataCivil } from '../lib/datas';
import { useSessao } from '../sessao/SessaoContexto';
import type { FaixaAlerta } from '../types/api';

export function DashboardPage() {
  const navegar = useNavigate();
  const { temPermissao } = useSessao();
  const [busca, setBusca] = useState('');
  const resumo = useQuery({ queryKey: ['dashboard', 'resumo'], queryFn: obterResumo });
  const prioridade = useQuery({
    queryKey: ['dashboard', 'prioridade'],
    queryFn: listarPrioritarios,
    enabled: temPermissao('dashboard:read'),
  });

  function pesquisar(evento: FormEvent) {
    evento.preventDefault();
    const nome = busca.trim();
    navegar(nome ? `/pacientes?name=${encodeURIComponent(nome)}` : '/pacientes');
  }

  if (resumo.isLoading) {
    return <Carregando>Carregando indicadores…</Carregando>;
  }

  if (resumo.isError) {
    return <MensagemErro erro={resumo.error} />;
  }

  const dados = resumo.data;
  if (!dados) {
    return <MensagemErro erro={new Error('A API não devolveu os indicadores.')} />;
  }

  const { nearDays, attentionDays } = dados.alertWindows;
  const cartoes: { titulo: string; valor: number; faixa: FaixaAlerta; detalhe: string }[] = [
    {
      titulo: 'Receitas vencidas',
      valor: dados.counts.vencidas,
      faixa: 'VENCIDA',
      detalhe: 'Vencimento anterior à data de referência',
    },
    {
      titulo: `Vencendo em até ${nearDays} dias`,
      valor: dados.counts.proximas5,
      faixa: 'PROXIMA_5',
      detalhe: 'Inclui a data de referência',
    },
    {
      titulo: `Vencendo de ${nearDays + 1} a ${attentionDays} dias`,
      valor: dados.counts.proximas15,
      faixa: 'PROXIMA_15',
      detalhe: 'Faixa seguinte à de 5 dias',
    },
    {
      titulo: `Em dia, acima de ${attentionDays} dias`,
      valor: dados.counts.dentroDoPrazo,
      faixa: 'DENTRO_DO_PRAZO',
      detalhe: 'Vencimento depois da faixa de atenção',
    },
  ];

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Dashboard</p>
          <h1>Indicadores de prazo</h1>
         {/* <p className="subtitulo">
            Referência {formatarDataCivil(dados.referenceDate)} · {dados.timezone}. Receitas canceladas não entram
            nas faixas. Sem vencimento: {dados.counts.pendentesInformacao}.
          </p> */}
        </div>
      </header>
      {temPermissao('patients:read') ? (
        <form className="busca" onSubmit={pesquisar}>
          <label htmlFor="busca-dashboard">Buscar paciente</label>
          <input
            id="busca-dashboard"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Nome do paciente"
          />
          <button type="submit" className="botao">
            Buscar
          </button>
        </form>
      ) : null}
      <div className="cartoes">
        {cartoes.map((cartao) => (
          <Link key={cartao.faixa} className="cartao" to={`/receitas?alertBand=${cartao.faixa}`}>
            <span className={classeFaixa(cartao.faixa)}>{rotuloFaixa(cartao.faixa, nearDays, attentionDays)}</span>
            <strong>{cartao.valor}</strong>
            <span>{cartao.titulo}</span>
            <small>{cartao.detalhe}</small>
          </Link>
        ))}
      </div>
      <div className="acoes-rapidas">
        <Link className="botao botao-secundario" to="/pacientes">
          Ver pacientes
        </Link>
        <Link className="botao botao-secundario" to="/receitas">
          Ver receitas
        </Link>
      </div>
      <h2>Pacientes prioritários</h2>
      {prioridade.isLoading ? <Carregando /> : null}
      {prioridade.isError ? <MensagemErro erro={prioridade.error} /> : null}
      {prioridade.data && prioridade.data.data.length === 0 ? (
        <p className="estado">Nenhum paciente com receita vencida ou na faixa de até {attentionDays} dias.</p>
      ) : null}
      {prioridade.data && prioridade.data.data.length > 0 ? (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Telefone</th>
                <th>Vencimento</th>
                <th>Faixa</th>
              </tr>
            </thead>
            <tbody>
              {prioridade.data.data.map((paciente) => (
                <tr key={paciente.id}>
                  <td>
                    <Link to={`/pacientes/${paciente.id}`}>{paciente.fullName}</Link>
                  </td>
                  <td>{paciente.phone ?? 'Não informado'}</td>
                  <td>{formatarDataCivil(paciente.nearestExpiryOn)}</td>
                  <td>
                    <span className={classeFaixa(paciente.alertBand)}>
                      {rotuloFaixa(paciente.alertBand, nearDays, attentionDays)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
