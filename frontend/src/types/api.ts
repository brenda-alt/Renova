export interface ErroCampo {
  field: string;
  message: string;
}

export interface ErroApiCorpo {
  code: string;
  message: string;
  details?: ErroCampo[];
  existingPatientId?: string;
  currentName?: string;
  informedName?: string;
}

export interface RespostaLogin {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface Papel {
  code: string;
  name: string;
}

export interface UsuarioAutenticado {
  id: string;
  username: string;
  fullName: string;
  active: boolean;
  roles: Papel[];
  permissions: string[];
}

export interface IdadePaciente {
  years: number | null;
  status: 'CALCULADA' | 'NAO_INFORMADA';
}

export interface Paciente {
  id: string;
  cpf: string | null;
  fullName: string;
  birthDate?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  age: IdadePaciente;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListaPaginada<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ResumoPaciente {
  id: string;
  fullName: string;
  cpf: string | null;
}

export type SituacaoPrazo = 'VENCIDA' | 'DENTRO_DO_PRAZO' | 'PENDENTE_INFORMACAO';

export type FaixaAlerta =
  | 'VENCIDA'
  | 'PROXIMA_5'
  | 'PROXIMA_15'
  | 'DENTRO_DO_PRAZO'
  | 'PENDENTE_INFORMACAO';

export type CicloReceita = 'ATIVA' | 'CANCELADA';

export type TipoReceita = 'COMUM' | 'CONTROLADA';

export interface ItemReceita {
  id: string;
  medicationName: string;
  dosage: string;
  quantity: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface Receita {
  id: string;
  patient: ResumoPaciente;
  issuedOn: string;
  expiresOn: string | null;
  prescriptionType: TipoReceita | null;
  items: ItemReceita[];
  notes: string | null;
  lifecycleStatus: CicloReceita;
  situation: SituacaoPrazo;
  alertBand: FaixaAlerta;
  daysUntilExpiry: number | null;
  visualEmphasis: boolean;
  referenceDate: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListaReceitas extends ListaPaginada<Receita> {
  referenceDate: string;
  timezone: string;
}

export interface ContagensDashboard {
  vencidas: number;
  proximas5: number;
  proximas15: number;
  dentroDoPrazo: number;
  pendentesInformacao: number;
}

export interface ResumoDashboard {
  referenceDate: string;
  timezone: string;
  alertWindows: {
    nearDays: number;
    attentionDays: number;
  };
  counts: ContagensDashboard;
}

export interface PacientePrioritario {
  id: string;
  fullName: string;
  phone: string | null;
  nearestExpiryOn: string;
  alertBand: FaixaAlerta;
  daysUntilExpiry: number;
}

export interface ListaPrioritarios extends ListaPaginada<PacientePrioritario> {
  referenceDate: string;
  timezone: string;
}

export interface ConsultaCep {
  postalCode: string;
  street: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CadastroPaciente {
  cpf: string;
  fullName: string;
  birthDate?: string;
  phone?: string;
  postalCode?: string;
  street?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface AtualizacaoPaciente {
  fullName?: string;
  confirmNameChange?: boolean;
  birthDate?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface AtualizacaoReceita {
  expiresOn?: string | null;
  notes?: string | null;
  lifecycleStatus?: CicloReceita;
}

export interface MedicamentoReceita {
  medicationName: string;
  dosage: string;
  quantity: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface CadastroReceita {
  patientId: string;
  prescriptionType: TipoReceita;
  issuedOn: string;
  validityDays: number;
  expiresOn: string;
  notes?: string;
  items: MedicamentoReceita[];
}
