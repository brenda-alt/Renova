import { mascararCpf, validarCpf } from './cpf';

describe('validarCpf', () => {
  it('aceita CPF válido com ou sem máscara', () => {
    expect(validarCpf('529.982.247-25')).toEqual({
      ok: true,
      digitos: '52998224725',
    });
    expect(validarCpf('11144477735')).toEqual({
      ok: true,
      digitos: '11144477735',
    });
  });

  it('rejeita quantidade, sequência repetida e dígito verificador', () => {
    expect(validarCpf('529.982.247')).toMatchObject({
      ok: false,
      detalhe: 'O CPF deve ter 11 dígitos.',
    });
    expect(validarCpf('111.111.111-11')).toMatchObject({
      ok: false,
      detalhe: 'O CPF não pode ter todos os dígitos iguais.',
    });
    expect(validarCpf('529.982.247-26')).toMatchObject({
      ok: false,
      detalhe: 'Os dígitos verificadores não conferem.',
    });
  });

  it('mascara os 11 dígitos para exibição', () => {
    expect(mascararCpf('52998224725')).toBe('529.982.247-25');
  });
});
