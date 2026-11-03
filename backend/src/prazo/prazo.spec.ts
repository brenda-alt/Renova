import { classificarPrazo } from './prazo';

const referencia = { year: 2026, month: 10, day: 18 };

function vencimento(data: string): Date {
  return new Date(`${data}T00:00:00.000Z`);
}

describe('classificação de prazo', () => {
  it('separa vencida, faixas de 5 e 15 dias e dentro do prazo', () => {
    expect(classificarPrazo(vencimento('2026-10-17'), referencia).alertBand).toBe('VENCIDA');
    expect(classificarPrazo(vencimento('2026-10-18'), referencia).alertBand).toBe('PROXIMA_5');
    expect(classificarPrazo(vencimento('2026-10-23'), referencia).alertBand).toBe('PROXIMA_5');
    expect(classificarPrazo(vencimento('2026-10-24'), referencia).alertBand).toBe('PROXIMA_15');
    expect(classificarPrazo(vencimento('2026-11-02'), referencia).alertBand).toBe('PROXIMA_15');
    expect(classificarPrazo(vencimento('2026-11-03'), referencia)).toMatchObject({
      alertBand: 'DENTRO_DO_PRAZO',
      situation: 'DENTRO_DO_PRAZO',
      visualEmphasis: false,
    });
    expect(classificarPrazo(null, referencia)).toMatchObject({
      alertBand: 'PENDENTE_INFORMACAO',
      situation: 'PENDENTE_INFORMACAO',
      daysUntilExpiry: null,
    });
  });
});
