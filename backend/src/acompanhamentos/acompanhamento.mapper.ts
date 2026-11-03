import { dataCivilUtc, formatarDataCivil } from '../pacientes/idade';

export interface AcompanhamentoPersistido {
  id: number;
  pacienteId: number;
  receitaId: number | null;
  ocorreuEm: Date;
  descricao: string;
  createdAt: Date;
  usuario: { id: number; nome: string };
}

export interface AcompanhamentoResposta {
  id: string;
  patientId: string;
  prescriptionId: string | null;
  occurredOn: string;
  description: string;
  recordedBy: { id: string; fullName: string };
  createdAt: string;
}

export function mapearAcompanhamento(registro: AcompanhamentoPersistido): AcompanhamentoResposta {
  return {
    id: String(registro.id),
    patientId: String(registro.pacienteId),
    prescriptionId: registro.receitaId === null ? null : String(registro.receitaId),
    occurredOn: formatarDataCivil(dataCivilUtc(registro.ocorreuEm)),
    description: registro.descricao,
    recordedBy: {
      id: String(registro.usuario.id),
      fullName: registro.usuario.nome,
    },
    createdAt: registro.createdAt.toISOString(),
  };
}
