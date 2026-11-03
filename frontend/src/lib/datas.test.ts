import { describe, expect, it } from 'vitest';
import { dataCivilValida, formatarDataCivil, somarDiasCivis } from './datas';

describe('datas civis', () => {
  it('rejeita dia inexistente', () => {
    expect(dataCivilValida('2026-02-31')).toBe(false);
  });

  it('formata a data sem deslocar o dia', () => {
    expect(formatarDataCivil('2026-10-18')).toBe('18/10/2026');
  });

  it('soma dias civis sem atravessar o fuso', () => {
    expect(somarDiasCivis('2026-10-18', 30)).toBe('2026-11-17');
    expect(somarDiasCivis('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDiasCivis('2026-02-31', 1)).toBeNull();
  });
});
