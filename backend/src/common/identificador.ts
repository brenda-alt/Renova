const INT32_MAXIMO = 2_147_483_647;

export function interpretarIdInteiro(valor: string): number | null {
  if (!/^[1-9]\d*$/.test(valor)) {
    return null;
  }

  const id = Number(valor);

  if (!Number.isSafeInteger(id) || id > INT32_MAXIMO) {
    return null;
  }

  return id;
}
