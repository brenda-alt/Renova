import { z } from 'zod';
import { dataCivilValida, somarDiasCivis } from '../lib/datas';

export const esquemaMedicamento = z
  .object({
    medicationName: z
      .string()
      .trim()
      .min(1, 'O nome do medicamento é obrigatório.')
      .max(180, 'O nome do medicamento deve ter no máximo 180 caracteres.'),
    dosage: z
      .string()
      .trim()
      .min(1, 'A dosagem é obrigatória.')
      .max(80, 'A dosagem deve ter no máximo 80 caracteres.'),
    quantity: z
      .string()
      .trim()
      .min(1, 'A quantidade é obrigatória.')
      .max(40, 'A quantidade deve ter no máximo 40 caracteres.'),
    morning: z.boolean(),
    afternoon: z.boolean(),
    night: z.boolean(),
  })
  .superRefine((dados, contexto) => {
    if (!dados.morning && !dados.afternoon && !dados.night) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe ao menos um período: manhã, tarde ou noite.',
        path: ['morning'],
      });
    }
  });

export const esquemaNovaReceita = z
  .object({
    prescriptionType: z.string(),
    issuedOn: z.string(),
    validityDays: z.number(),
    notes: z.string().trim().max(2000, 'A observação deve ter no máximo 2000 caracteres.'),
    items: z.array(esquemaMedicamento).min(1, 'Adicione ao menos um medicamento.'),
  })
  .superRefine((dados, contexto) => {
    if (dados.prescriptionType !== 'COMUM' && dados.prescriptionType !== 'CONTROLADA') {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escolha se a receita é comum ou controlada.',
        path: ['prescriptionType'],
      });
    }

    if (!dataCivilValida(dados.issuedOn)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data de emissão é inválida.',
        path: ['issuedOn'],
      });
    }

    const validadeInvalida =
      !Number.isInteger(dados.validityDays) || dados.validityDays < 1 || dados.validityDays > 9999;

    if (validadeInvalida) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A validade deve ser um número inteiro de 1 a 9999 dias.',
        path: ['validityDays'],
      });
      return;
    }

    if (dataCivilValida(dados.issuedOn) && !somarDiasCivis(dados.issuedOn, dados.validityDays)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A validade produz uma data que o sistema não representa.',
        path: ['validityDays'],
      });
    }
  });

export type MedicamentoFormulario = z.infer<typeof esquemaMedicamento>;
