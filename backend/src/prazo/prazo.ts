import {
  DataCivil,
  dataCivilNoFuso,
  dataCivilParaUtc,
  dataCivilUtc,
  diferencaDiasCivis,
  somarDiasCivis,
} from '../pacientes/idade';

export const FUSO_OPERACIONAL = 'America/Sao_Paulo';

/** Proposta documentada no contrato, centralizada para dashboard, alertas e prioridade. */
export const DIAS_FAIXA_PROXIMA = 5;
export const DIAS_FAIXA_ATENCAO = 15;

export type FaixaAlerta =
  | 'VENCIDA'
  | 'PROXIMA_5'
  | 'PROXIMA_15'
  | 'DENTRO_DO_PRAZO'
  | 'PENDENTE_INFORMACAO';

export type SituacaoPrazo = 'VENCIDA' | 'DENTRO_DO_PRAZO' | 'PENDENTE_INFORMACAO';

export interface ClassificacaoPrazo {
  situation: SituacaoPrazo;
  alertBand: FaixaAlerta;
  daysUntilExpiry: number | null;
  visualEmphasis: boolean;
}

export interface FaixaDias {
  minimo: number | null;
  maximo: number | null;
}

export function referenciaCivil(agora: Date): DataCivil {
  return dataCivilNoFuso(agora, FUSO_OPERACIONAL);
}

export function classificarPrazo(
  vencimento: Date | null,
  referencia: DataCivil,
): ClassificacaoPrazo {
  if (!vencimento) {
    return {
      situation: 'PENDENTE_INFORMACAO',
      alertBand: 'PENDENTE_INFORMACAO',
      daysUntilExpiry: null,
      visualEmphasis: false,
    };
  }

  const daysUntilExpiry = diferencaDiasCivis(dataCivilUtc(vencimento), referencia);

  if (daysUntilExpiry < 0) {
    return {
      situation: 'VENCIDA',
      alertBand: 'VENCIDA',
      daysUntilExpiry,
      visualEmphasis: true,
    };
  }

  if (daysUntilExpiry <= DIAS_FAIXA_PROXIMA) {
    return {
      situation: 'DENTRO_DO_PRAZO',
      alertBand: 'PROXIMA_5',
      daysUntilExpiry,
      visualEmphasis: false,
    };
  }

  if (daysUntilExpiry <= DIAS_FAIXA_ATENCAO) {
    return {
      situation: 'DENTRO_DO_PRAZO',
      alertBand: 'PROXIMA_15',
      daysUntilExpiry,
      visualEmphasis: false,
    };
  }

  return {
    situation: 'DENTRO_DO_PRAZO',
    alertBand: 'DENTRO_DO_PRAZO',
    daysUntilExpiry,
    visualEmphasis: false,
  };
}

export function faixaPorAlerta(alerta: FaixaAlerta): FaixaDias | null {
  if (alerta === 'VENCIDA') {
    return { minimo: null, maximo: -1 };
  }

  if (alerta === 'PROXIMA_5') {
    return { minimo: 0, maximo: DIAS_FAIXA_PROXIMA };
  }

  if (alerta === 'PROXIMA_15') {
    return { minimo: DIAS_FAIXA_PROXIMA + 1, maximo: DIAS_FAIXA_ATENCAO };
  }

  if (alerta === 'DENTRO_DO_PRAZO') {
    return { minimo: DIAS_FAIXA_ATENCAO + 1, maximo: null };
  }

  return null;
}

export function faixaPorSituacao(situacao: string): FaixaDias | null {
  if (situacao === 'vencida') {
    return { minimo: null, maximo: -1 };
  }

  if (situacao === 'proxima') {
    return { minimo: 0, maximo: DIAS_FAIXA_ATENCAO };
  }

  if (situacao === 'dentro_do_prazo') {
    return { minimo: DIAS_FAIXA_ATENCAO + 1, maximo: null };
  }

  return null;
}

export function faixaPorBandaDeAlerta(banda: string): FaixaDias | null {
  if (banda === 'vencida') {
    return faixaPorAlerta('VENCIDA');
  }

  if (banda === 'proxima_5') {
    return faixaPorAlerta('PROXIMA_5');
  }

  if (banda === 'proxima_15') {
    return faixaPorAlerta('PROXIMA_15');
  }

  if (banda === 'proxima') {
    return faixaPorSituacao('proxima');
  }

  return null;
}

export function intersecaoDeFaixas(esquerda: FaixaDias, direita: FaixaDias): FaixaDias | null {
  const minimo = Math.max(esquerda.minimo ?? Number.NEGATIVE_INFINITY, direita.minimo ?? Number.NEGATIVE_INFINITY);
  const maximo = Math.min(esquerda.maximo ?? Number.POSITIVE_INFINITY, direita.maximo ?? Number.POSITIVE_INFINITY);

  if (minimo > maximo) {
    return null;
  }

  return {
    minimo: Number.isFinite(minimo) ? minimo : null,
    maximo: Number.isFinite(maximo) ? maximo : null,
  };
}

export function intervaloDeVencimento(
  faixa: FaixaDias,
  referencia: DataCivil,
): { gte?: Date; lte?: Date } {
  const intervalo: { gte?: Date; lte?: Date } = {};

  if (faixa.minimo !== null) {
    intervalo.gte = dataCivilParaUtc(somarDiasCivis(referencia, faixa.minimo));
  }

  if (faixa.maximo !== null) {
    intervalo.lte = dataCivilParaUtc(somarDiasCivis(referencia, faixa.maximo));
  }

  return intervalo;
}
