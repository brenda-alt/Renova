const FUSO = 'America/Sao_Paulo';

export function hojeCivil(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

export function dataCivilValida(valor: string): boolean {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!correspondencia) {
    return false;
  }

  const ano = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const dia = Number(correspondencia[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

export function somarDiasCivis(valor: string, dias: number): string | null {
  if (!dataCivilValida(valor) || !Number.isInteger(dias)) {
    return null;
  }

  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  const anoFinal = data.getUTCFullYear();

  if (anoFinal > 9999) {
    return null;
  }

  const mesFinal = String(data.getUTCMonth() + 1).padStart(2, '0');
  const diaFinal = String(data.getUTCDate()).padStart(2, '0');
  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}

export function formatarDataCivil(valor: string | null | undefined): string {
  if (!valor) {
    return 'Não informada';
  }

  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!correspondencia) {
    return valor;
  }

  return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
}

export function formatarDataHora(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data);
}
