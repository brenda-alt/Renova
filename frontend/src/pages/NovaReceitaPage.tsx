import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, Sunset } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AvisoPermissao, Carregando, MensagemErro } from '../components/Estados';
import { formatarDataCivil, hojeCivil, somarDiasCivis } from '../lib/datas';
import { itensParaSalvar, rascunhoEmBranco } from '../lib/itens-receita';
import { rotuloPeriodos } from '../lib/rotulos';
import { resolverVinculo } from '../lib/vinculo-paciente';
import { esquemaMedicamento, esquemaNovaReceita, type MedicamentoFormulario } from '../schemas/nova-receita';
import { ErroApi } from '../services/api';
import { listarPacientes } from '../services/pacientes';
import { criarReceita } from '../services/receitas';
import { useSessao } from '../sessao/SessaoContexto';
import type { CadastroReceita, Paciente, TipoReceita } from '../types/api';

const VALIDADES = [
  { valor: '30', rotulo: '30 dias' },
  { valor: '60', rotulo: '60 dias' },
  { valor: '90', rotulo: '90 dias' },
  { valor: '180', rotulo: '180 dias' },
  { valor: 'personalizada', rotulo: 'Personalizada' },
];

const MEDICAMENTO_INICIAL = {
  medicationName: '',
  dosage: '',
  quantity: '',
  morning: false,
  afternoon: false,
  night: false,
};

export function NovaReceitaPage() {
  const navegar = useNavigate();
  const consultas = useQueryClient();
  const { temPermissao } = useSessao();
  const podeBuscar = temPermissao('patients:read');
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [escolhaId, setEscolhaId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<'' | TipoReceita>('');
  const [emissao, setEmissao] = useState(hojeCivil);
  const [validade, setValidade] = useState('30');
  const [diasPersonalizados, setDiasPersonalizados] = useState('');
  const [rascunho, setRascunho] = useState(MEDICAMENTO_INICIAL);
  const [erroRascunho, setErroRascunho] = useState<string | null>(null);
  const [medicamentos, setMedicamentos] = useState<MedicamentoFormulario[]>([]);
  const [observacao, setObservacao] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const nomeDebounced = useValorDebounced(nome.trim(), 350);
  const digitos = cpf.replace(/\D/g, '');
  const cpfCompleto = digitos.length === 11;
  const nomePronto = digitos.length === 0 && nomeDebounced.length >= 2;

  const consultaCpf = useQuery({
    queryKey: ['pacientes', 'receita-cpf', digitos],
    queryFn: () => listarPacientes({ cpf: digitos, pageSize: 5 }),
    enabled: podeBuscar && cpfCompleto,
  });
  const consultaNome = useQuery({
    queryKey: ['pacientes', 'receita-nome', nomeDebounced],
    queryFn: () => listarPacientes({ name: nomeDebounced, pageSize: 20 }),
    enabled: podeBuscar && nomePronto,
  });

  const vinculo = resolverVinculo({
    cpf,
    nome,
    buscaCpf: consultaCpf.data?.data.map(resumirPaciente),
    buscaNome: consultaNome.data?.data.map(resumirPaciente),
    totalNome: consultaNome.data?.total,
    cpfConsultado: consultaCpf.isSuccess,
    nomeConsultado: consultaNome.isSuccess,
    escolhaId,
  });
  const paciente = vinculo.status === 'vinculado' ? vinculo.paciente : null;
  const cpfAplicado = useRef('');
  const nomeAplicado = useRef('');

  useEffect(() => {
    if (!paciente) {
      return;
    }

    if (digitos.length === 11 && cpfAplicado.current !== digitos) {
      cpfAplicado.current = digitos;
      setNome(paciente.fullName);
      return;
    }

    if (digitos.length === 0 && nomeAplicado.current !== paciente.id) {
      nomeAplicado.current = paciente.id;
      setNome(paciente.fullName);
      if (paciente.cpf) {
        setCpf(paciente.cpf);
      }
    }
  }, [paciente, digitos]);

  const dias = validade === 'personalizada' ? Number(diasPersonalizados) : Number(validade);
  const vencimento = somarDiasCivis(emissao, dias);
  const buscando =
    (cpfCompleto && consultaCpf.isFetching) || (nomePronto && consultaNome.isFetching);

  const gravar = useMutation({
    mutationFn: (dados: CadastroReceita) => criarReceita(dados),
    onSuccess(receita) {
      void consultas.invalidateQueries({ queryKey: ['receitas'] });
      void consultas.invalidateQueries({ queryKey: ['dashboard'] });
      navegar(`/receitas/${receita.id}`, { replace: true, state: { cadastrada: true } });
    },
  });

  if (!temPermissao('prescriptions:create')) {
    return <AvisoPermissao />;
  }

  function adicionarMedicamento() {
    const validado = esquemaMedicamento.safeParse(rascunho);
    if (!validado.success) {
      setErroRascunho(validado.error.issues[0]?.message ?? 'Preencha o medicamento.');
      return;
    }

    setMedicamentos((atual) => [...atual, validado.data]);
    setRascunho(MEDICAMENTO_INICIAL);
    setErroRascunho(null);
    setErroLocal(null);
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (gravar.isPending) {
      return;
    }

    setErroLocal(null);
    setErroRascunho(null);
    if (!paciente) {
      setErroLocal(
        vinculo.status === 'aguardando'
          ? 'Informe o CPF ou o nome de um paciente já cadastrado.'
          : vinculo.status === 'cpf-invalido' || vinculo.status === 'ausente' || vinculo.status === 'ambiguo'
            ? vinculo.message
            : 'Selecione um paciente já cadastrado antes de salvar.',
      );
      return;
    }

    const itens = itensParaSalvar(medicamentos, rascunho);
    if (!itens.ok) {
      if (itens.origem === 'rascunho') {
        setErroRascunho(itens.mensagem);
      } else {
        setErroLocal(itens.mensagem);
      }
      return;
    }

    if (!rascunhoEmBranco(rascunho)) {
      setMedicamentos(itens.itens);
      setRascunho(MEDICAMENTO_INICIAL);
    }

    const payload = {
      prescriptionType: tipo,
      issuedOn: emissao,
      validityDays: dias,
      notes: observacao,
      items: itens.itens,
    };
    const validado = esquemaNovaReceita.safeParse(payload);
    if (!validado.success || !vencimento) {
      setErroLocal(validado.success ? 'A data de vencimento não pôde ser calculada.' : validado.error.issues[0]?.message ?? 'Revise os dados da receita.');
      return;
    }

    gravar.mutate({
      patientId: paciente.id,
      prescriptionType: validado.data.prescriptionType as TipoReceita,
      issuedOn: validado.data.issuedOn,
      validityDays: validado.data.validityDays,
      expiresOn: vencimento,
      notes: validado.data.notes || undefined,
      items: validado.data.items,
    });
  }

  function editarRascunho(proximo: typeof MEDICAMENTO_INICIAL) {
    setRascunho(proximo);
    setErroRascunho(null);
    setErroLocal(null);
  }

  function escolherPaciente(id: string) {
    const opcao = vinculo.status === 'ambiguo' ? vinculo.opcoes.find((item) => item.id === id) : undefined;
    if (!opcao) {
      return;
    }

    setEscolhaId(opcao.id);
    setNome(opcao.fullName);
    setCpf(opcao.cpf ?? '');
    setErroLocal(null);
  }

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Receitas</p>
          <h1>Nova receita</h1>
        </div>
        <Link className="botao-secundario" to="/receitas">
          Voltar
        </Link>
      </header>
      <form className="formulario" onSubmit={salvar} noValidate>
        <section className="cartao-estatico">
          <h2>Paciente</h2>
          {podeBuscar ? null : <AvisoPermissao />}
          <div className="grade">
            <label className="campo" htmlFor="cpf-paciente">
              <span>CPF</span>
              <input
                id="cpf-paciente"
                inputMode="numeric"
                autoComplete="off"
                value={cpf}
                onChange={(evento) => {
                  setCpf(evento.target.value);
                  setEscolhaId(null);
                  setErroLocal(null);
                }}
              />
            </label>
            <label className="campo" htmlFor="nome-paciente">
              <span>Nome</span>
              <input
                id="nome-paciente"
                autoComplete="off"
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value);
                  setEscolhaId(null);
                  setErroLocal(null);
                }}
              />
            </label>
          </div>
          {buscando ? <Carregando>Buscando paciente…</Carregando> : null}
          {consultaCpf.isError ? <MensagemErro erro={consultaCpf.error} /> : null}
          {consultaNome.isError ? <MensagemErro erro={consultaNome.error} /> : null}
          {vinculo.status === 'cpf-invalido' || vinculo.status === 'ausente' ? (
            <p className="alerta alerta-erro" role="alert">
              {vinculo.message}{' '}
              {vinculo.status === 'ausente' ? <Link to="/pacientes/novo">Cadastrar paciente</Link> : null}
            </p>
          ) : null}
          {vinculo.status === 'ambiguo' ? (
            <div className="alerta alerta-aviso">
              <p>{vinculo.message}</p>
              <ul className="lista-escolha">
                {vinculo.opcoes.map((opcao) => (
                  <li key={opcao.id}>
                    <button type="button" className="botao-secundario" onClick={() => escolherPaciente(opcao.id)}>
                      {opcao.fullName}
                      <small>{opcao.cpf ?? 'CPF não informado'}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {paciente ? (
            <p className="alerta alerta-ok" role="status">
              Paciente vinculado: {paciente.fullName}
              {paciente.cpf ? ` · ${paciente.cpf}` : ' · CPF não informado no cadastro'}.
            </p>
          ) : null}
        </section>

        <section className="cartao-estatico">
          <h2>Medicamento</h2>
          <div className="grade">
            <label className="campo" htmlFor="tipo-receita">
              <span>Tipo de receita</span>
              <select
                id="tipo-receita"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value as '' | TipoReceita)}
              >
                <option value="">Selecione</option>
                <option value="COMUM">Comum</option>
                <option value="CONTROLADA">Controlada</option>
              </select>
              <small className="campo-dica">O tipo é gravado. Não há regra adicional para receita controlada.</small>
            </label>
            <label className="campo" htmlFor="nome-medicamento">
              <span>Medicamento</span>
              <input
                id="nome-medicamento"
                value={rascunho.medicationName}
                onChange={(evento) => editarRascunho({ ...rascunho, medicationName: evento.target.value })}
              />
            </label>
            <label className="campo" htmlFor="dosagem">
              <span>Dosagem</span>
              <input
                id="dosagem"
                value={rascunho.dosage}
                onChange={(evento) => editarRascunho({ ...rascunho, dosage: evento.target.value })}
              />
            </label>
            <label className="campo" htmlFor="quantidade">
              <span>Quantidade</span>
              <input
                id="quantidade"
                value={rascunho.quantity}
                onChange={(evento) => editarRascunho({ ...rascunho, quantity: evento.target.value })}
              />
            </label>
            <fieldset className="campo campo-largo">
              <legend>Uso diário</legend>
              <div className="periodos">
                <Periodo
                  rotulo="Manhã"
                  pressed={rascunho.morning}
                  onClick={() => editarRascunho({ ...rascunho, morning: !rascunho.morning })}
                  icone={<Sun size={18} aria-hidden="true" />}
                />
                <Periodo
                  rotulo="Tarde"
                  pressed={rascunho.afternoon}
                  onClick={() => editarRascunho({ ...rascunho, afternoon: !rascunho.afternoon })}
                  icone={<Sunset size={18} aria-hidden="true" />}
                />
                <Periodo
                  rotulo="Noite"
                  pressed={rascunho.night}
                  onClick={() => editarRascunho({ ...rascunho, night: !rascunho.night })}
                  icone={<Moon size={18} aria-hidden="true" />}
                />
              </div>
            </fieldset>
            <label className="campo" htmlFor="emissao">
              <span>Data de emissão</span>
              <input id="emissao" type="date" value={emissao} onChange={(evento) => setEmissao(evento.target.value)} />
            </label>
            <label className="campo" htmlFor="validade">
              <span>Validade</span>
              <select id="validade" value={validade} onChange={(evento) => setValidade(evento.target.value)}>
                {VALIDADES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </label>
            {validade === 'personalizada' ? (
              <label className="campo" htmlFor="dias-personalizados">
                <span>Quantidade de dias</span>
                <input
                  id="dias-personalizados"
                  inputMode="numeric"
                  value={diasPersonalizados}
                  onChange={(evento) => setDiasPersonalizados(evento.target.value)}
                />
                <small className="campo-dica">De 1 a 9999 dias, só para a data continuar representável.</small>
              </label>
            ) : null}
            <p className="campo campo-largo">
              <span>Vencimento</span>
              <strong>{vencimento ? formatarDataCivil(vencimento) : 'Data inválida'}</strong>
            </p>
          </div>
          {erroRascunho ? (
            <p className="alerta alerta-erro" role="alert">
              {erroRascunho}
            </p>
          ) : null}
          <button type="button" className="botao-secundario" onClick={adicionarMedicamento} disabled={gravar.isPending}>
            Adicionar este medicamento
          </button>
        </section>

        {medicamentos.length > 0 ? (
          <section className="cartao-estatico">
            <h2>Medicamentos da receita</h2>
            <ul className="lista-medicamentos">
              {medicamentos.map((item, indice) => (
                <li key={`${item.medicationName}-${indice}`}>
                  <div>
                    <strong>{item.medicationName}</strong>
                    <small>
                      {item.dosage} · quantidade {item.quantity} · {rotuloPeriodos(item)}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => setMedicamentos((atual) => atual.filter((_, posicao) => posicao !== indice))}
                    disabled={gravar.isPending}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <label className="campo" htmlFor="observacao-receita">
          <span>Observação</span>
          <textarea
            id="observacao-receita"
            rows={3}
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
          />
        </label>
        {erroLocal ? (
          <p className="alerta alerta-erro" role="alert">
            {erroLocal}
          </p>
        ) : null}
        {gravar.isPending ? <Carregando>Salvando a receita…</Carregando> : null}
        {gravar.isError ? (
          <MensagemErro erro={gravar.error instanceof ErroApi ? gravar.error : gravar.error} />
        ) : null}
        <button type="submit" className="botao botao-largo" disabled={gravar.isPending || buscando}>
          {gravar.isPending ? 'Salvando…' : 'Salvar no Prontuário'}
        </button>
      </form>
    </section>
  );
}

function Periodo({
  rotulo,
  pressed,
  onClick,
  icone,
}: {
  rotulo: string;
  pressed: boolean;
  onClick: () => void;
  icone: ReactNode;
}) {
  return (
    <button type="button" className="periodo" aria-pressed={pressed} onClick={onClick}>
      {icone}
      {rotulo}
    </button>
  );
}

function resumirPaciente(paciente: Paciente) {
  return { id: paciente.id, fullName: paciente.fullName, cpf: paciente.cpf };
}

function useValorDebounced(valor: string, atraso: number): string {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDebounced(valor), atraso);
    return () => clearTimeout(temporizador);
  }, [valor, atraso]);

  return debounced;
}
