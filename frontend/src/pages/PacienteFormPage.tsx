import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormularioPaciente } from '../components/FormularioPaciente';
import { AvisoPermissao, Carregando, MensagemErro } from '../components/Estados';
import { ErroApi } from '../services/api';
import { atualizarPaciente, criarPaciente, obterPaciente } from '../services/pacientes';
import type { PacienteValidado } from '../schemas/paciente';
import { useSessao } from '../sessao/SessaoContexto';
import type { AtualizacaoPaciente, Paciente } from '../types/api';

function montarAtualizacao(inicial: Paciente, dados: PacienteValidado): AtualizacaoPaciente {
  const corpo: AtualizacaoPaciente = {};

  if (dados.fullName !== inicial.fullName) {
    corpo.fullName = dados.fullName;
    corpo.confirmNameChange = Boolean(dados.confirmNameChange);
  }

  const campos = [
    'birthDate',
    'phone',
    'postalCode',
    'street',
    'addressNumber',
    'complement',
    'neighborhood',
    'city',
    'state',
  ] as const;

  for (const campo of campos) {
    const novo = dados[campo] ?? null;
    const antigo = inicial[campo] ?? null;
    if (novo !== antigo) {
      corpo[campo] = novo;
    }
  }

  return corpo;
}

export function PacienteFormPage({ modo }: { modo: 'criar' | 'editar' }) {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const consultas = useQueryClient();
  const { temPermissao } = useSessao();
  const [erro, setErro] = useState<ErroApi | null>(null);
  const permitido = modo === 'criar' ? temPermissao('patients:create') : temPermissao('patients:update');
  const atual = useQuery({
    queryKey: ['pacientes', id],
    queryFn: () => obterPaciente(id),
    enabled: modo === 'editar',
  });
  const gravar = useMutation({
    mutationFn: (dados: PacienteValidado) => {
      if (modo === 'criar') {
        return criarPaciente({
          cpf: dados.cpf,
          fullName: dados.fullName,
          birthDate: dados.birthDate,
          phone: dados.phone,
          postalCode: dados.postalCode,
          street: dados.street,
          addressNumber: dados.addressNumber,
          complement: dados.complement,
          neighborhood: dados.neighborhood,
          city: dados.city,
          state: dados.state,
        });
      }

      if (!atual.data) {
        throw new ErroApi(404, { code: 'PATIENT_NOT_FOUND', message: 'Paciente não encontrado.' });
      }

      return atualizarPaciente(id, montarAtualizacao(atual.data, dados));
    },
    onSuccess(paciente) {
      void consultas.invalidateQueries({ queryKey: ['pacientes'] });
      void consultas.invalidateQueries({ queryKey: ['dashboard'] });
      navegar(`/pacientes/${paciente.id}`);
    },
    onError(falha) {
      setErro(falha instanceof ErroApi ? falha : new ErroApi(0, { code: 'NETWORK_ERROR', message: 'Não foi possível salvar o paciente.' }));
    },
  });

  if (!permitido) {
    return <AvisoPermissao />;
  }

  if (modo === 'editar' && atual.isLoading) {
    return <Carregando />;
  }

  if (modo === 'editar' && atual.isError) {
    return <MensagemErro erro={atual.error} />;
  }

  return (
    <section>
      <header className="cabecalho-pagina">
        <div>
          <p className="olho">Pacientes</p>
          <h1>{modo === 'criar' ? 'Novo paciente' : 'Editar paciente'}</h1>
        </div>
      </header>
      <FormularioPaciente
        modo={modo}
        inicial={atual.data}
        enviando={gravar.isPending}
        erro={erro}
        onSubmit={(dados) => {
          setErro(null);
          gravar.mutate(dados);
        }}
      />
    </section>
  );
}
