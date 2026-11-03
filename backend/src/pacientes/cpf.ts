export type CpfValidado =
  | { ok: true; digitos: string }
  | { ok: false; detalhe: string };

function digitoVerificador(base: string): number {
  let soma = 0;
  let peso = base.length + 1;

  for (const caractere of base) {
    soma += Number(caractere) * peso;
    peso -= 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(valor: string): CpfValidado {
  const digitos = valor.replace(/\D/g, '');

  if (digitos.length !== 11) {
    return { ok: false, detalhe: 'O CPF deve ter 11 dígitos.' };
  }

  if (/^(\d)\1{10}$/.test(digitos)) {
    return {
      ok: false,
      detalhe: 'O CPF não pode ter todos os dígitos iguais.',
    };
  }

  const primeiro = digitoVerificador(digitos.slice(0, 9));
  const segundo = digitoVerificador(digitos.slice(0, 10));

  if (primeiro !== Number(digitos[9]) || segundo !== Number(digitos[10])) {
    return { ok: false, detalhe: 'Os dígitos verificadores não conferem.' };
  }

  return { ok: true, digitos };
}

export function mascararCpf(digitos: string): string {
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}
