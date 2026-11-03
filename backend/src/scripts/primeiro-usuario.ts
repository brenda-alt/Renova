export const PERFIS_DO_PRIMEIRO_USUARIO = ['ADMIN', 'PROFISSIONAL'] as const;

export type PerfilDoPrimeiroUsuario = (typeof PERFIS_DO_PRIMEIRO_USUARIO)[number];

export interface DadosPrimeiroUsuario {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilDoPrimeiroUsuario;
}

export type ValidacaoPrimeiroUsuario =
  | { ok: true; dados: DadosPrimeiroUsuario }
  | { ok: false; motivo: string };

const EMAIL_ACEITO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarPrimeiroUsuario(input: {
  nome?: string;
  email?: string;
  senha?: string;
  perfil?: string;
  emailJaExiste?: boolean;
}): ValidacaoPrimeiroUsuario {
  const nome = input.nome?.trim() ?? '';
  const email = input.email?.trim().toLowerCase() ?? '';
  const senha = input.senha ?? '';
  const perfil = input.perfil?.trim() ?? '';

  if (!nome || !email || !senha || !perfil) {
    return {
      ok: false,
      motivo:
        'Informe SEED_USUARIO_NOME, SEED_USUARIO_EMAIL, SEED_USUARIO_SENHA e SEED_USUARIO_PERFIL. Nenhum usuário foi criado.',
    };
  }

  if (nome.length > 150) {
    return { ok: false, motivo: 'O nome deve ter no máximo 150 caracteres. Nenhum usuário foi criado.' };
  }

  if (email.length > 80 || !EMAIL_ACEITO.test(email)) {
    return {
      ok: false,
      motivo:
        'O e-mail precisa ser válido e ter no máximo 80 caracteres, que é o limite de username no contrato. Nenhum usuário foi criado.',
    };
  }

  if (senha.length < 8 || senha.length > 72) {
    return {
      ok: false,
      motivo:
        'A senha deve ter entre 8 e 72 caracteres. Nenhum usuário foi criado.',
    };
  }

  if (!PERFIS_DO_PRIMEIRO_USUARIO.includes(perfil as PerfilDoPrimeiroUsuario)) {
    return {
      ok: false,
      motivo:
        'SEED_USUARIO_PERFIL deve ser ADMIN ou PROFISSIONAL. Nenhum usuário foi criado.',
    };
  }

  if (input.emailJaExiste) {
    return {
      ok: false,
      motivo:
        'Usuário já cadastrado com esse e-mail. Nenhum registro foi alterado.',
    };
  }

  return {
    ok: true,
    dados: {
      nome,
      email,
      senha,
      perfil: perfil as PerfilDoPrimeiroUsuario,
    },
  };
}
