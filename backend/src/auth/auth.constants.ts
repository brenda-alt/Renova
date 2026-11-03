export const ACCESS_TOKEN_TTL_SECONDS = 3600;

export const CREDENCIAIS_INVALIDAS = {
  code: 'INVALID_CREDENTIALS',
  message: 'Credenciais inválidas.',
} as const;

export const AUTENTICACAO_NECESSARIA = {
  code: 'UNAUTHENTICATED',
  message: 'Autenticação necessária.',
} as const;

export const ACESSO_NEGADO = {
  code: 'FORBIDDEN',
  message: 'Você não tem permissão para esta operação.',
} as const;

export function readJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET não está definida ou tem menos de 32 caracteres. Defina a variável no ambiente, sem gravar o valor no código.',
    );
  }

  return secret;
}
