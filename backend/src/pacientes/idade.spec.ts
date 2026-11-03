import { calcularIdade } from './idade';

describe('calcularIdade', () => {
  const referencia = new Date('2026-10-18T15:00:00.000Z');

  it('calcula anos completos quando o aniversário já ocorreu', () => {
    expect(calcularIdade(new Date('1984-03-12T00:00:00.000Z'), referencia)).toEqual({
      years: 42,
      status: 'CALCULADA',
    });
  });

  it('subtrai um ano quando o aniversário ainda não ocorreu', () => {
    expect(calcularIdade(new Date('1984-10-19T00:00:00.000Z'), referencia)).toEqual({
      years: 41,
      status: 'CALCULADA',
    });
  });

  it('não informa idade sem data de nascimento', () => {
    expect(calcularIdade(null, referencia)).toEqual({
      years: null,
      status: 'NAO_INFORMADA',
    });
  });
});
