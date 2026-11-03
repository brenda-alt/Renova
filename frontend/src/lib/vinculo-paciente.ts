import { validarDigitosCpf } from './cpf';

export interface PacienteBusca {
  id: string;
  fullName: string;
  cpf: string | null;
}

export type VinculoPaciente =
  | { status: 'aguardando' }
  | { status: 'cpf-invalido'; message: string }
  | { status: 'ausente'; message: string }
  | { status: 'ambiguo'; opcoes: PacienteBusca[]; message: string }
  | { status: 'vinculado'; paciente: PacienteBusca };

const MENSAGEM_AUSENTE =
  'Nenhum paciente cadastrado com esses dados. Cadastre o paciente antes de lançar a receita.';

export function resolverVinculo(entrada: {
  cpf: string;
  nome: string;
  buscaCpf?: PacienteBusca[];
  buscaNome?: PacienteBusca[];
  totalNome?: number;
  cpfConsultado: boolean;
  nomeConsultado: boolean;
  escolhaId?: string | null;
}): VinculoPaciente {
  const digitos = entrada.cpf.replace(/\D/g, '');

  if (digitos.length > 11) {
    return { status: 'cpf-invalido', message: 'O CPF deve ter 11 dígitos.' };
  }

  if (digitos.length === 11) {
    const mensagem = validarDigitosCpf(digitos);
    if (mensagem) {
      return { status: 'cpf-invalido', message: mensagem };
    }

    if (!entrada.cpfConsultado) {
      return { status: 'aguardando' };
    }

    const encontrados = entrada.buscaCpf ?? [];
    if (encontrados.length === 0) {
      return { status: 'ausente', message: MENSAGEM_AUSENTE };
    }

    if (encontrados.length > 1) {
      return {
        status: 'ambiguo',
        opcoes: encontrados,
        message: 'Há mais de um paciente com esse CPF. Escolha o cadastro correto.',
      };
    }

    return { status: 'vinculado', paciente: encontrados[0] };
  }

  if (digitos.length > 0) {
    return { status: 'aguardando' };
  }

  const nome = entrada.nome.trim();
  if (nome.length < 2 || !entrada.nomeConsultado) {
    return { status: 'aguardando' };
  }

  const opcoes = entrada.buscaNome ?? [];
  const escolhido = entrada.escolhaId
    ? opcoes.find(
        (paciente) => paciente.id === entrada.escolhaId && nomesIguais(nome, paciente.fullName),
      )
    : undefined;

  if (escolhido) {
    return { status: 'vinculado', paciente: escolhido };
  }

  if (opcoes.length === 0) {
    return { status: 'ausente', message: MENSAGEM_AUSENTE };
  }

  if ((entrada.totalNome ?? opcoes.length) === 1 && opcoes.length === 1) {
    return { status: 'vinculado', paciente: opcoes[0] };
  }

  const incompleta = (entrada.totalNome ?? opcoes.length) > opcoes.length;
  return {
    status: 'ambiguo',
    opcoes,
    message: incompleta
      ? 'Há vários pacientes com esse nome. Continue digitando ou escolha um cadastro. Nomes iguais se distinguem pelo CPF.'
      : 'Há mais de um paciente com esse nome. Escolha o cadastro pelo CPF para não vincular a pessoa errada.',
  };
}

function nomesIguais(esquerda: string, direita: string): boolean {
  return esquerda.trim().toLocaleLowerCase('pt-BR') === direita.trim().toLocaleLowerCase('pt-BR');
}
