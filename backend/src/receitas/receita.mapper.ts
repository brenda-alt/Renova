import { mascararCpf } from '../pacientes/cpf';
import { DataCivil, dataCivilUtc, formatarDataCivil } from '../pacientes/idade';
import { ClassificacaoPrazo, FUSO_OPERACIONAL } from '../prazo/prazo';

export interface ItemReceitaPersistido {
  id: number;
  nomeMedicamento: string;
  dosagem: string;
  quantidade: string;
  usoManha: boolean;
  usoTarde: boolean;
  usoNoite: boolean;
}

export interface ReceitaPersistida {
  id: number;
  dataEmissao: Date;
  dataVencimento: Date | null;
  tipoReceita: string | null;
  canceladaEm: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  paciente: {
    id: number;
    nome: string;
    cpf: string | null;
  };
  itens: ItemReceitaPersistido[];
}

export interface ItemReceitaResposta {
  id: string;
  medicationName: string;
  dosage: string;
  quantity: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface ReceitaResposta extends ClassificacaoPrazo {
  id: string;
  patient: {
    id: string;
    fullName: string;
    cpf: string | null;
  };
  issuedOn: string;
  expiresOn: string | null;
  prescriptionType: 'COMUM' | 'CONTROLADA' | null;
  items: ItemReceitaResposta[];
  notes: string | null;
  lifecycleStatus: 'ATIVA' | 'CANCELADA';
  referenceDate: string;
  timezone: typeof FUSO_OPERACIONAL;
  createdAt: string;
  updatedAt: string;
}

export function mapearReceita(
  receita: ReceitaPersistida,
  referencia: DataCivil,
  classificacao: ClassificacaoPrazo,
): ReceitaResposta {
  const cpf =
    receita.paciente.cpf && receita.paciente.cpf.length === 11
      ? mascararCpf(receita.paciente.cpf)
      : receita.paciente.cpf;

  return {
    id: String(receita.id),
    patient: {
      id: String(receita.paciente.id),
      fullName: receita.paciente.nome,
      cpf,
    },
    issuedOn: formatarDataCivil(dataCivilUtc(receita.dataEmissao)),
    expiresOn: receita.dataVencimento
      ? formatarDataCivil(dataCivilUtc(receita.dataVencimento))
      : null,
    prescriptionType: tipoDaReceita(receita.tipoReceita),
    items: receita.itens.map((item) => ({
      id: String(item.id),
      medicationName: item.nomeMedicamento,
      dosage: item.dosagem,
      quantity: item.quantidade,
      morning: item.usoManha,
      afternoon: item.usoTarde,
      night: item.usoNoite,
    })),
    notes: receita.observacoes,
    lifecycleStatus: receita.canceladaEm ? 'CANCELADA' : 'ATIVA',
    referenceDate: formatarDataCivil(referencia),
    timezone: FUSO_OPERACIONAL,
    createdAt: receita.createdAt.toISOString(),
    updatedAt: receita.updatedAt.toISOString(),
    ...classificacao,
  };
}

function tipoDaReceita(tipo: string | null): 'COMUM' | 'CONTROLADA' | null {
  if (tipo === 'COMUM' || tipo === 'CONTROLADA') {
    return tipo;
  }

  return null;
}
