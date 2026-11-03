import { describe, expect, it } from 'vitest';
import { esquemaMedicamento, esquemaNovaReceita } from './nova-receita';

const medicamento = {
  medicationName: 'Losartana',
  dosage: '50 mg',
  quantity: '30',
  morning: true,
  afternoon: false,
  night: false,
};

describe('cadastro de receita', () => {
  it('exige medicamento, período, tipo e validade', () => {
    expect(esquemaMedicamento.safeParse({ ...medicamento, morning: false }).success).toBe(false);
    expect(esquemaMedicamento.safeParse(medicamento).success).toBe(true);

    const semItens = esquemaNovaReceita.safeParse({
      prescriptionType: 'COMUM',
      issuedOn: '2026-10-18',
      validityDays: 30,
      notes: '',
      items: [],
    });
    const valida = esquemaNovaReceita.safeParse({
      prescriptionType: 'CONTROLADA',
      issuedOn: '2026-10-18',
      validityDays: 30,
      notes: '',
      items: [medicamento],
    });

    expect(semItens.success).toBe(false);
    expect(valida.success).toBe(true);
  });
});
