import { describe, expect, it } from 'vitest';
import { interpretarCorpoErro } from './api';

describe('interpretarCorpoErro', () => {
  it('preserva o código e a mensagem da API', () => {
    const erro = interpretarCorpoErro(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Credenciais inválidas.',
    });

    expect(erro.status).toBe(401);
    expect(erro.code).toBe('INVALID_CREDENTIALS');
    expect(erro.message).toBe('Credenciais inválidas.');
  });

  it('guarda o paciente existente em conflito de CPF', () => {
    const erro = interpretarCorpoErro(409, {
      code: 'CPF_ALREADY_EXISTS',
      message: 'Já existe um paciente cadastrado com este CPF.',
      existingPatientId: '15',
    });

    expect(erro.existingPatientId).toBe('15');
  });
});
