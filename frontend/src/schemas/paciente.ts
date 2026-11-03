import { z } from 'zod';
import { mensagemCpf } from '../lib/cpf';
import { dataCivilValida, hojeCivil } from '../lib/datas';

function textoLimite(maximo: number, mensagem: string) {
  return z
    .string()
    .trim()
    .max(maximo, mensagem)
    .transform((valor) => (valor === '' ? undefined : valor));
}

export const esquemaPaciente = z
  .object({
    cpf: z.string().trim(),
    fullName: z
      .string()
      .trim()
      .min(1, 'O nome é obrigatório.')
      .max(150, 'O nome deve ter no máximo 150 caracteres.'),
    birthDate: z
      .string()
      .trim()
      .transform((valor) => (valor === '' ? undefined : valor)),
    phone: textoLimite(20, 'O telefone deve ter no máximo 20 caracteres.'),
    postalCode: z
      .string()
      .trim()
      .transform((valor) => (valor === '' ? undefined : valor)),
    street: textoLimite(200, 'O logradouro deve ter no máximo 200 caracteres.'),
    addressNumber: textoLimite(20, 'O número deve ter no máximo 20 caracteres.'),
    complement: textoLimite(120, 'O complemento deve ter no máximo 120 caracteres.'),
    neighborhood: textoLimite(120, 'O bairro deve ter no máximo 120 caracteres.'),
    city: textoLimite(120, 'A cidade deve ter no máximo 120 caracteres.'),
    state: z
      .string()
      .trim()
      .transform((valor) => (valor === '' ? undefined : valor.toUpperCase())),
    confirmNameChange: z.boolean().optional(),
  })
  .superRefine((dados, contexto) => {
    const cpf = mensagemCpf(dados.cpf);
    if (cpf) {
      contexto.addIssue({ code: z.ZodIssueCode.custom, message: cpf, path: ['cpf'] });
    }

    if (dados.birthDate && !dataCivilValida(dados.birthDate)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data de nascimento é inválida.',
        path: ['birthDate'],
      });
    } else if (dados.birthDate && dados.birthDate > hojeCivil()) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data de nascimento não pode ser posterior à data corrente.',
        path: ['birthDate'],
      });
    }

    if (dados.postalCode && !/^(\d{8}|\d{5}-\d{3})$/.test(dados.postalCode)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O CEP deve ter 8 dígitos ou o formato 00000-000.',
        path: ['postalCode'],
      });
    }

    if (dados.state && !/^[A-Z]{2}$/.test(dados.state)) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A UF deve ter 2 letras.',
        path: ['state'],
      });
    }
  });

export type FormularioPacienteDados = z.input<typeof esquemaPaciente>;
export type PacienteValidado = z.output<typeof esquemaPaciente>;
