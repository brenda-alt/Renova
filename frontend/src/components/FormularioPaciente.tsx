import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { consultarCep } from '../services/enderecos';
import { ErroApi, mensagemDeErro } from '../services/api';
import { esquemaPaciente, type FormularioPacienteDados, type PacienteValidado } from '../schemas/paciente';
import type { Paciente } from '../types/api';
import { CampoTexto } from './Campo';

interface Propriedades {
  modo: 'criar' | 'editar';
  inicial?: Paciente;
  enviando: boolean;
  erro: ErroApi | null;
  onSubmit: (dados: PacienteValidado) => void;
}

function valorInicial(inicial?: Paciente): FormularioPacienteDados {
  return {
    cpf: inicial?.cpf ?? '',
    fullName: inicial?.fullName ?? '',
    birthDate: inicial?.birthDate ?? '',
    phone: inicial?.phone ?? '',
    postalCode: inicial?.postalCode ?? '',
    street: inicial?.street ?? '',
    addressNumber: inicial?.addressNumber ?? '',
    complement: inicial?.complement ?? '',
    neighborhood: inicial?.neighborhood ?? '',
    city: inicial?.city ?? '',
    state: inicial?.state ?? '',
    confirmNameChange: false,
  };
}

export function FormularioPaciente({ modo, inicial, enviando, erro, onSubmit }: Propriedades) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormularioPacienteDados, unknown, PacienteValidado>({
    resolver: zodResolver(esquemaPaciente),
    defaultValues: valorInicial(inicial),
  });
  const cep = useMutation({
    mutationFn: consultarCep,
    onSuccess(endereco) {
      setValue('postalCode', endereco.postalCode, { shouldValidate: true });
      setValue('street', endereco.street);
      setValue('neighborhood', endereco.neighborhood);
      setValue('city', endereco.city);
      setValue('state', endereco.state);
      if (endereco.complement) {
        setValue('complement', endereco.complement);
      }
    },
  });
  const nome = watch('fullName');
  const nomeMudou =
    modo === 'editar' &&
    inicial !== undefined &&
    nome.trim().toLowerCase() !== inicial.fullName.trim().toLowerCase();
  const erroCampo = (campo: keyof FormularioPacienteDados) =>
    errors[campo]?.message ?? erro?.details.find((item) => item.field === campo)?.message;

  return (
    <form
      className="formulario"
      onSubmit={handleSubmit((dados) => {
        if (nomeMudou && !dados.confirmNameChange) {
          return;
        }
        onSubmit(dados);
      })}
      noValidate
    >
      {erro && erro.details.length === 0 ? (
        <p className="alerta alerta-erro" role="alert">
          {erro.message}
        </p>
      ) : null}
      {erro?.existingPatientId ? (
        <p className="alerta alerta-aviso">
          O cadastro existente está no identificador {erro.existingPatientId}.
        </p>
      ) : null}
      <div className="grade">
        <CampoTexto
          id="cpf"
          rotulo="CPF"
          disabled={modo === 'editar'}
          erro={erroCampo('cpf')}
          {...register('cpf')}
        />
        <CampoTexto id="fullName" rotulo="Nome completo" erro={erroCampo('fullName')} {...register('fullName')} />
        <CampoTexto id="birthDate" rotulo="Data de nascimento" type="date" erro={erroCampo('birthDate')} {...register('birthDate')} />
        <CampoTexto id="phone" rotulo="Telefone" erro={erroCampo('phone')} {...register('phone')} />
        <div className="cep">
          <CampoTexto id="postalCode" rotulo="CEP" erro={erroCampo('postalCode')} {...register('postalCode')} />
          <button
            type="button"
            className="botao botao-secundario"
            disabled={cep.isPending}
            onClick={() => {
              const postalCode = watch('postalCode');
              if (postalCode.trim()) {
                cep.mutate(postalCode.trim());
              }
            }}
          >
            {cep.isPending ? 'Consultando…' : 'Buscar CEP'}
          </button>
        </div>
        {cep.isError ? <p className="alerta alerta-aviso">{mensagemDeErro(cep.error)}</p> : null}
        <CampoTexto id="street" rotulo="Logradouro" erro={erroCampo('street')} {...register('street')} />
        <CampoTexto id="addressNumber" rotulo="Número" erro={erroCampo('addressNumber')} {...register('addressNumber')} />
        <CampoTexto id="complement" rotulo="Complemento" erro={erroCampo('complement')} {...register('complement')} />
        <CampoTexto id="neighborhood" rotulo="Bairro" erro={erroCampo('neighborhood')} {...register('neighborhood')} />
        <CampoTexto id="city" rotulo="Cidade" erro={erroCampo('city')} {...register('city')} />
        <CampoTexto id="state" rotulo="UF" maxLength={2} erro={erroCampo('state')} {...register('state')} />
      </div>
      {nomeMudou ? (
        <label className="confirmacao">
          <input type="checkbox" {...register('confirmNameChange')} />
          Confirmo a alteração do nome
          {erro?.currentName ? ` de “${erro.currentName}” para “${erro.informedName ?? nome.trim()}”` : ''}.
        </label>
      ) : null}
      {nomeMudou && !watch('confirmNameChange') ? (
        <p className="campo-erro">Confirme a alteração do nome para continuar.</p>
      ) : null}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? 'Salvando…' : modo === 'criar' ? 'Cadastrar paciente' : 'Salvar alterações'}
      </button>
    </form>
  );
}
