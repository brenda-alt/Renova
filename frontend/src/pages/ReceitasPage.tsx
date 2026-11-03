import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Carregando, MensagemErro, Vazio } from '../components/Estados';
import { Paginacao } from '../components/Paginacao';
import { formatarDataCivil, formatarDataHora } from '../lib/datas';
import { classeFaixa, rotuloFaixa, rotuloSituacao } from '../lib/rotulos';
import { listarReceitas } from '../services/receitas';
import { useSessao } from '../sessao/SessaoContexto';

export function ReceitasPage() {
  const { temPermissao } = useSessao();
  const [parametros, setParametros] = useSearchParams();
  const page = Number(parametros.get('page') ?? '1');
  const patientId = parametros.get('patientId') ?? '';
  const alertBand = parametros.get('alertBand') ?? '';
  const statusFilter = parametros.get('statusFilter') ?? '';
  const lifecycleStatus = parametros.get('lifecycleStatus') ?? '';
  const [paciente, setPaciente] = useState(patientId);
  const lista = useQuery({
    queryKey: ['receitas', { page, patientId, alertBand, statusFilter, lifecycleStatus }],
    queryFn: () =>
      listarReceitas({
        page,
        patientId,
        alertBand,
        statusFilter,
        lifecycleStatus,
      }),
  });

  function aplicar(evento: FormEvent) {
    evento.preventDefault();
    const proximos = new URLSearchParams(parametros);
    if (paciente.trim()) proximos.set('patientId', paciente.trim());
    else proximos.delete('patientId');
    proximos.delete('page');
    setParametros(proximos);
  }

  function definir(chave: string, valor: string) {
    const proximos = new URLSearchParams(parametros);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    proximos.delete('page');
    setParametros(proximos);
  }

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Receitas</p>
          <h1>Consulta</h1>
          {lista.data ? (
            <p className="subtitulo">
              Referência {formatarDataCivil(lista.data.referenceDate)} · {lista.data.timezone}
            </p> 
          ) : null}
        </div>
        {temPermissao('prescriptions:create') ? (
          <Link className="botao" to="/receitas/nova">
            Nova receita
          </Link>
        ) : null}
      </header>
      <form className="busca" onSubmit={aplicar}>
        <label htmlFor="filtro-paciente">Paciente</label>
        <input
          id="filtro-paciente"
          value={paciente}
          onChange={(evento) => setPaciente(evento.target.value)}
          placeholder="Identificador"
        />
        <label htmlFor="filtro-ciclo">Situação</label>
        <select
          id="filtro-ciclo"
          value={lifecycleStatus}
          onChange={(evento) => definir('lifecycleStatus', evento.target.value)}
        >
          <option value="">Ativas</option>
          <option value="ATIVA">Ativas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
        <label htmlFor="filtro-faixa">Faixa</label>
        <select id="filtro-faixa" value={alertBand} onChange={(evento) => definir('alertBand', evento.target.value)}>
          <option value="">Todas</option>
          <option value="VENCIDA">Vencidas</option>
          <option value="PROXIMA_5">Até 5 dias</option>
          <option value="PROXIMA_15">De 6 a 15 dias</option>
          <option value="DENTRO_DO_PRAZO">Em dia</option>
          <option value="PENDENTE_INFORMACAO">Sem vencimento</option>
        </select>
        <label htmlFor="filtro-prazo">Prazo</label>
        <select
          id="filtro-prazo"
          value={statusFilter}
          onChange={(evento) => definir('statusFilter', evento.target.value)}
        >
          <option value="">Todos</option>
          <option value="vencida">Vencidas</option>
          <option value="proxima">Até 15 dias</option>
          <option value="dentro_do_prazo">Acima de 15 dias</option>
          <option value="pendente">Sem vencimento</option>
        </select>
        <button type="submit" className="botao">
          Filtrar
        </button>
      </form>
      {lista.isLoading ? <Carregando /> : null}
      {lista.isError ? <MensagemErro erro={lista.error} /> : null}
      {lista.data && lista.data.data.length === 0 ? <Vazio>Nenhuma receita encontrada.</Vazio> : null}
      {lista.data && lista.data.data.length > 0 ? (
        <>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Registro</th>
                  <th>Vencimento</th>
                  <th>Ciclo</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {lista.data.data.map((receita) => (
                  <tr key={receita.id} className={receita.visualEmphasis ? 'linha-alerta' : undefined}>
                    <td>
                      <Link to={`/receitas/${receita.id}`}>{receita.patient.fullName}</Link>
                      <small>{receita.patient.cpf ?? 'CPF não informado'}</small>
                      {receita.items.length > 0 ? (
                        <small>{receita.items.map((item) => item.medicationName).join(', ')}</small>
                      ) : null}
                    </td>
                    <td>{formatarDataHora(receita.createdAt)}</td>
                    <td>{formatarDataCivil(receita.expiresOn)}</td>
                    <td>{receita.lifecycleStatus === 'CANCELADA' ? 'Cancelada' : 'Ativa'}</td>
                    <td>
                      <span className={classeFaixa(receita.alertBand)}>{rotuloFaixa(receita.alertBand)}</span>
                      <small>{rotuloSituacao(receita.situation)}</small>
                    </td>
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
