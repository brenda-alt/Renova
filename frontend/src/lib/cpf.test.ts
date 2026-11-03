import { describe, expect, it } from 'vitest';
import { mensagemCpf } from './cpf';

describe('mensagemCpf', () => {
  it('aceita um CPF válido mascarado', () => {
    expect(mensagemCpf('529.982.247-25')).toBeNull();
  });

  it('rejeita dígitos verificadores incorretos', () => {
    expect(mensagemCpf('529.982.247-26')).toBe('Os dígitos verificadores não conferem.');
  });

  it('rejeita sequência com dígitos iguais', () => {
    expect(mensagemCpf('111.111.111-11')).toBe('O CPF não pode ter todos os dígitos iguais.');
  });
});
