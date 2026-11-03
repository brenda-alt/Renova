import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CampoArea, CampoSelecao, CampoTexto } from '../components/Campo';
import { AvisoPermissao, Carregando, MensagemErro } from '../components/Estados';
import { formatarDataCivil, formatarDataHora } from '../lib/datas';
import { rotuloFaixa, rotuloPeriodos, rotuloSituacao, rotuloTipoReceita } from '../lib/rotulos';
import { esquemaReceita, type FormularioReceitaDados } from '../schemas/receita';
import { ErroApi } from '../services/api';
import { atualizarReceita, obterReceita } from '../services/receitas';
import { useSessao } from '../sessao/SessaoContexto';

export function ReceitaDetalhePage() {
  const { id = '' } = useParams();
  const local = useLocation();
  const cadastrada = Boolean((local.state as { cadastrada?: boolean } | null)?.cadastrada);
  const consultas = useQueryClient();
  const { temPermissao } = useSessao();
  const receita = useQuery({
    queryKey: ['receitas', id],
    queryFn: () => obterReceita(id),
  });
  const formulario = useForm<FormularioReceitaDados>({
    resolver: zodResolver(esquemaReceita),
    values: receita.data
      ? {
          expiresOn: receita.data.expiresOn ?? '',
          notes: receita.data.notes ?? '',
          lifecycleStatus: receita.data.lifecycleStatus,
        }
      : undefined,
  });
  const gravar = useMutation({
    mutationFn: (dados: FormularioReceitaDados) =>
      atualizarReceita(id, {
        expiresOn: dados.expiresOn ? dados.expiresOn : null,
        notes: dados.notes ? dados.notes : null,
        lifecycleStatus: dados.lifecycleStatus,
      }),
    onSuccess() {
      void consultas.invalidateQueries({ queryKey: ['receitas'] });
      void consultas.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  if (receita.isLoading) {
    return <Carregando />;
  }

  if (receita.isError) {
    return <MensagemErro erro={receita.error} />;
  }

  const dados = receita.data;
  if (!dados) {
    return <MensagemErro erro={new Error('Receita não encontrada.')} />;
  }

  const podeEditar = temPermissao('prescriptions:update');
  const podeCancelar = temPermissao('prescriptions:cancel');

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Receita {dados.id}</p>
          <h1>
            <Link to={`/pacientes/${dados.patient.id}`}>{dados.patient.fullName}</Link>
          </h1>
          <p className="subtitulo">
            {rotuloSituacao(dados.situation)} · {rotuloFaixa(dados.alertBand)} · referência{' '}
            {formatarDataCivil(dados.referenceDate)} ({dados.timezone})
          </p>
        </div>
      </header>
      {cadastrada ? <p className="alerta alerta-ok">Receita salva no prontuário.</p> : null}
      <dl className="ficha">
        <div>
          <dt>CPF</dt>
          <dd>{dados.patient.cpf ?? 'Não informado'}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{rotuloTipoReceita(dados.prescriptionType)}</dd>
        </div>
        <div>
          <dt>Emissão</dt>
          <dd>{formatarDataCivil(dados.issuedOn)}</dd>
        </div>
        <div>
          <dt>Registro</dt>
          <dd>{formatarDataHora(dados.createdAt)}</dd>
        </div>
        <div>
          <dt>Dias até o vencimento</dt>
          <dd>{dados.daysUntilExpiry === null ? 'Não calculado' : dados.daysUntilExpiry}</dd>
        </div>
      </dl>
      {dados.items.length > 0 ? (
        <section className="cartao-estatico">
          <h2>Medicamentos</h2>
          <ul className="lista-medicamentos">
            {dados.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.medicationName}</strong>
                  <small>
                    {item.dosage} · quantidade {item.quantity} · {rotuloPeriodos(item)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {podeEditar ? (
        <form
          className="formulario"
          onSubmit={formulario.handleSubmit((valores) => gravar.mutate(valores))}
          noValidate
        >
          <CampoTexto
            id="expiresOn"
            rotulo="Vencimento"
            type="date"
            erro={formulario.formState.errors.expiresOn?.message}
            {...formulario.register('expiresOn')}
          />
          <CampoArea
            id="notes"
            rotulo="Observação"
            erro={formulario.formState.errors.notes?.message}
            {...formulario.register('notes')}
          />
          <CampoSelecao id="lifecycleStatus" rotulo="Ciclo" {...formulario.register('lifecycleStatus')}>
            <option value="ATIVA">Ativa</option>
            <option value="CANCELADA" disabled={!podeCancelar && dados.lifecycleStatus !== 'CANCELADA'}>
              Cancelada
            </option>
          </CampoSelecao>
          {gravar.isError ? <MensagemErro erro={gravar.error instanceof ErroApi ? gravar.error : gravar.error} /> : null}
          {gravar.isSuccess ? <p className="alerta alerta-ok">Receita atualizada.</p> : null}
          <button type="submit" className="botao" disabled={gravar.isPending}>
            {gravar.isPending ? 'Salvando…' : 'Salvar receita'}
          </button>
        </form>
      ) : (
        <AvisoPermissao />
      )}
    </section>
  );
}
