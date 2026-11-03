import { describe, expect, it } from 'vitest';
import { itensParaSalvar, rascunhoEmBranco, type RascunhoMedicamento } from './itens-receita';

const vazio: RascunhoMedicamento = {
  medicationName: '',
  dosage: '',
  quantity: '',
  morning: false,
  afternoon: false,
  night: false,
};

const amoxicilina: RascunhoMedicamento = {
  medicationName: ' Amoxicilina ',
  dosage: '500mg',
  quantity: '30',
  morning: true,
  afternoon: false,
  night: false,
};

describe('itensParaSalvar', () => {
  it('inclui o medicamento preenchido mesmo antes de ele estar na lista', () => {
    const resultado = itensParaSalvar([], amoxicilina);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.itens).toEqual([
        {
          medicationName: 'Amoxicilina',
          dosage: '500mg',
          quantity: '30',
          morning: true,
          afternoon: false,
          night: false,
        },
      ]);
    }
  });

  it('pede um medicamento só quando a lista e o rascunho estão vazios', () => {
    expect(rascunhoEmBranco(vazio)).toBe(true);
    expect(itensParaSalvar([], vazio)).toEqual({
      ok: false,
      origem: 'lista',
      mensagem: 'Adicione ao menos um medicamento.',
    });
  });

  it('mostra o erro do rascunho incompleto e conserva o item já adicionado', () => {
    const incluido = itensParaSalvar([], amoxicilina);
    expect(incluido.ok).toBe(true);
    if (!incluido.ok) {
      return;
    }

    const incompleto = itensParaSalvar(incluido.itens, { ...vazio, medicationName: 'Dipirona' });
    expect(incompleto).toEqual({
      ok: false,
      origem: 'rascunho',
      mensagem: 'A dosagem é obrigatória.',
    });

    const salvo = itensParaSalvar(incluido.itens, vazio);
    expect(salvo).toEqual({ ok: true, itens: incluido.itens });
  });
});
