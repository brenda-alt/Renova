import { esquemaMedicamento, type MedicamentoFormulario } from '../schemas/nova-receita';

export interface RascunhoMedicamento {
  medicationName: string;
  dosage: string;
  quantity: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export function rascunhoEmBranco(rascunho: RascunhoMedicamento): boolean {
  return (
    rascunho.medicationName.trim() === '' &&
    rascunho.dosage.trim() === '' &&
    rascunho.quantity.trim() === '' &&
    !rascunho.morning &&
    !rascunho.afternoon &&
    !rascunho.night
  );
}

export function itensParaSalvar(
  lista: MedicamentoFormulario[],
  rascunho: RascunhoMedicamento,
): { ok: true; itens: MedicamentoFormulario[] } | { ok: false; mensagem: string; origem: 'lista' | 'rascunho' } {
  if (rascunhoEmBranco(rascunho)) {
    if (lista.length === 0) {
      return {
        ok: false,
        origem: 'lista',
        mensagem: 'Adicione ao menos um medicamento.',
      };
    }

    return { ok: true, itens: lista };
  }

  const validado = esquemaMedicamento.safeParse(rascunho);
  if (!validado.success) {
    return {
      ok: false,
      origem: 'rascunho',
      mensagem: validado.error.issues[0]?.message ?? 'Preencha o medicamento.',
    };
  }

  return { ok: true, itens: [...lista, validado.data] };
}
