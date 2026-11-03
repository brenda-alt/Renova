import { z } from 'zod';
import { dataCivilValida } from '../lib/datas';

export const esquemaReceita = z
  .object({
    expiresOn: z.string().trim(),
    notes: z.string().trim().max(2000, 'A observação deve ter no máximo 2000 caracteres.'),
    lifecycleStatus: z.enum(['ATIVA', 'CANCELADA']),
  })
  .superRefine((dados, contexto) => {
    if (dados.expiresOn && !dataCivilValida(dados.expiresOn)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data de vencimento deve usar o formato AAAA-MM-DD.',
        path: ['expiresOn'],
      });
    }
  });

export type FormularioReceitaDados = z.infer<typeof esquemaReceita>;
