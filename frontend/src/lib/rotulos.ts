import type { FaixaAlerta, SituacaoPrazo, TipoReceita } from '../types/api';

const FAIXAS: Record<FaixaAlerta, string> = {
  VENCIDA: 'Vencida',
  PROXIMA_5: 'Até 5 dias',
  PROXIMA_15: 'De 6 a 15 dias',
  DENTRO_DO_PRAZO: 'Em dia',
  PENDENTE_INFORMACAO: 'Sem vencimento',
};

const SITUACOES: Record<SituacaoPrazo, string> = {
  VENCIDA: 'Vencida',
  DENTRO_DO_PRAZO: 'Dentro do prazo',
  PENDENTE_INFORMACAO: 'Pendente de informação',
};

export function rotuloFaixa(faixa: FaixaAlerta, perto?: number, atencao?: number): string {
  if (faixa === 'PROXIMA_5' && perto !== undefined) {
    return `Até ${perto} dias`;
  }

  if (faixa === 'PROXIMA_15' && perto !== undefined && atencao !== undefined) {
    return `De ${perto + 1} a ${atencao} dias`;
  }

  if (faixa === 'DENTRO_DO_PRAZO' && atencao !== undefined) {
    return `Acima de ${atencao} dias`;
  }

  return FAIXAS[faixa];
}

export function rotuloSituacao(situacao: SituacaoPrazo): string {
  return SITUACOES[situacao];
}

export function rotuloTipoReceita(tipo: TipoReceita | null): string {
  if (tipo === 'COMUM') {
    return 'Comum';
  }

  if (tipo === 'CONTROLADA') {
    return 'Controlada';
  }

  return 'Não informado';
}

export function rotuloPeriodos(item: {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}): string {
  const periodos = [
    item.morning ? 'Manhã' : null,
    item.afternoon ? 'Tarde' : null,
    item.night ? 'Noite' : null,
  ].filter((periodo): periodo is string => periodo !== null);

  return periodos.length > 0 ? periodos.join(', ') : 'Sem período';
}

export function classeFaixa(faixa: FaixaAlerta): string {
  if (faixa === 'VENCIDA') {
    return 'selo selo-perigo';
  }

  if (faixa === 'PROXIMA_5' || faixa === 'PROXIMA_15') {
    return 'selo selo-aviso';
  }

  if (faixa === 'PENDENTE_INFORMACAO') {
    return 'selo selo-neutro';
  }

  return 'selo selo-ok';
}
