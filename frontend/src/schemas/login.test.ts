import { describe, expect, it } from 'vitest';
import { esquemaLogin } from './login';

describe('esquemaLogin', () => {
  it('aceita o e-mail cadastrado e envia os campos do contrato', () => {
    const resultado = esquemaLogin.safeParse({
      username: ' admin.acesso@example.com ',
      password: 'senha-de-teste',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({
        username: 'admin.acesso@example.com',
        password: 'senha-de-teste',
      });
    }
  });

  it('explica quando o valor não é um e-mail e não chama a API', () => {
    const resultado = esquemaLogin.safeParse({
      username: 'admin.acesso',
      password: 'senha-de-teste',
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe(
        'Digite o e-mail completo cadastrado, no formato nome@dominio.',
      );
    }
  });
});
