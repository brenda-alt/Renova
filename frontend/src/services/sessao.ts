const CHAVE_TOKEN = 'renova.accessToken';

export function lerToken(): string | null {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string): void {
  sessionStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken(): void {
  sessionStorage.removeItem(CHAVE_TOKEN);
}
