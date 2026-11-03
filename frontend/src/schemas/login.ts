import { z } from 'zod';

export const esquemaLogin = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'O usuário é obrigatório.')
    .max(80, 'O usuário deve ter no máximo 80 caracteres.')
    .email('Digite o e-mail completo cadastrado, no formato nome@dominio.'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória.')
    .max(200, 'A senha deve ter no máximo 200 caracteres.'),
});

export type DadosLogin = z.infer<typeof esquemaLogin>;
