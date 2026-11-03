export interface IdadeCalculada {
  years: number | null;
  status: 'CALCULADA' | 'NAO_INFORMADA';
}

export interface DataCivil {
  year: number;
  month: number;
  day: number;
}

export function dataCivilUtc(valor: Date): DataCivil {
  return {
    year: valor.getUTCFullYear(),
    month: valor.getUTCMonth() + 1,
    day: valor.getUTCDate(),
  };
}

export function dataCivilNoFuso(agora: Date, timeZone: string): DataCivil {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const ler = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value);

  return {
    year: ler('year'),
    month: ler('month'),
    day: ler('day'),
  };
}

export function interpretarDataCivil(valor: string): DataCivil | null {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

  if (!correspondencia) {
    return null;
  }

  const year = Number(correspondencia[1]);
  const month = Number(correspondencia[2]);
  const day = Number(correspondencia[3]);
  const instante = new Date(Date.UTC(year, month - 1, day));

  if (
    instante.getUTCFullYear() !== year ||
    instante.getUTCMonth() !== month - 1 ||
    instante.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function dataCivilEhPosterior(data: DataCivil, referencia: DataCivil): boolean {
  if (data.year !== referencia.year) {
    return data.year > referencia.year;
  }

  if (data.month !== referencia.month) {
    return data.month > referencia.month;
  }

  return data.day > referencia.day;
}

export function diferencaDiasCivis(alvo: DataCivil, referencia: DataCivil): number {
  const milissegundosPorDia = 86_400_000;
  const alvoUtc = Date.UTC(alvo.year, alvo.month - 1, alvo.day);
  const referenciaUtc = Date.UTC(referencia.year, referencia.month - 1, referencia.day);
  return Math.round((alvoUtc - referenciaUtc) / milissegundosPorDia);
}

export function somarDiasCivis(data: DataCivil, dias: number): DataCivil {
  return dataCivilUtc(new Date(Date.UTC(data.year, data.month - 1, data.day + dias)));
}

export function dataCivilParaUtc(data: DataCivil): Date {
  return new Date(Date.UTC(data.year, data.month - 1, data.day));
}

export function formatarDataCivil(data: DataCivil): string {
  const month = String(data.month).padStart(2, '0');
  const day = String(data.day).padStart(2, '0');
  return `${data.year}-${month}-${day}`;
}

/**
 * Anos completos na data corrente de America/Sao_Paulo.
 * Sem nascimento, a idade não é informada. Data futura já gravada não produz
 * ano negativo: o schema só aceita zero ou mais, e a leitura não rejeita a lista.
 */
export function calcularIdade(nascimento: Date | null, agora: Date): IdadeCalculada {
  if (!nascimento) {
    return { years: null, status: 'NAO_INFORMADA' };
  }

  const inicio = dataCivilUtc(nascimento);
  const hoje = dataCivilNoFuso(agora, 'America/Sao_Paulo');
  let years = hoje.year - inicio.year;
  const aniversarioAindaNaoOcorreu =
    hoje.month < inicio.month ||
    (hoje.month === inicio.month && hoje.day < inicio.day);

  if (aniversarioAindaNaoOcorreu) {
    years -= 1;
  }

  if (years < 0) {
    return { years: null, status: 'CALCULADA' };
  }

  return { years, status: 'CALCULADA' };
}
