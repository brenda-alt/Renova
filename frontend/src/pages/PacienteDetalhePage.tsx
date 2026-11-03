import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Carregando, MensagemErro } from '../components/Estados';
import { formatarDataCivil, formatarDataHora } from '../lib/datas';
import { obterPaciente } from '../services/pacientes';
import { useSessao } from '../sessao/SessaoContexto';

export function PacienteDetalhePage() {
  const { id = '' } = useParams();
  const { temPermissao } = useSessao();
  const paciente = useQuery({
    queryKey: ['pacientes', id],
    queryFn: () => obterPaciente(id),
  });

  if (paciente.isLoading) {
    return <Carregando />;
  }

  if (paciente.isError) {
    return <MensagemErro erro={paciente.error} />;
  }

  const dados = paciente.data;
  if (!dados) {
    return <MensagemErro erro={new Error('Paciente não encontrado.')} />;
  }

  const linhas = [
    ['CPF', dados.cpf ?? 'Não informado'],
    ['Nascimento', formatarDataCivil(dados.birthDate)],
    ['Idade', dados.age.status === 'CALCULADA' ? `${dados.age.years} anos` : 'Não informada'],
    ['Telefone', dados.phone ?? 'Não informado'],
    ['CEP', dados.postalCode ?? 'Não informado'],
    ['Logradouro', dados.street ?? 'Não informado'],
    ['Número', dados.addressNumber ?? 'Não informado'],
    ['Complemento', dados.complement ?? 'Não informado'],
    ['Bairro', dados.neighborhood ?? 'Não informado'],
    ['Cidade', dados.city ?? 'Não informada'],
    ['UF', dados.state ?? 'Não informada'],
    ['Atualizado em', formatarDataHora(dados.updatedAt)],
  ];

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Paciente</p>
          <h1>{dados.fullName}</h1>
        </div>
        <div className="acoes-rapidas">
          {temPermissao('patients:update') ? (
            <Link className="botao" to={`/pacientes/${dados.id}/editar`}>
              Editar
            </Link>
          ) : null}
          <Link className="botao botao-secundario" to={`/receitas?patientId=${dados.id}`}>
            Receitas
          </Link>
        </div>
      </header>
      <dl className="ficha">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt>{rotulo}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
