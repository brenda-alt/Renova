export function validarDigitosCpf(digitos: string): string | null {
  if (digitos.length !== 11) {
    return 'O CPF deve ter 11 dígitos.';
  }

  if (/^(\d)\1{10}$/.test(digitos)) {
    return 'O CPF não pode ter todos os dígitos iguais.';
  }

  const primeiro = digitoVerificador(digitos.slice(0, 9));
  const segundo = digitoVerificador(digitos.slice(0, 10));

  if (primeiro !== Number(digitos[9]) || segundo !== Number(digitos[10])) {
    return 'Os dígitos verificadores não conferem.';
  }

  return null;
}

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

export function mensagemCpf(valor: string): string | null {
  const digitos = valor.replace(/\D/g, '');

  if (!/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(valor.trim())) {
    return 'O CPF deve ter 11 dígitos ou a máscara 000.000.000-00.';
  }

  return validarDigitosCpf(digitos);
}
