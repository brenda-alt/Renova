import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface CepEncontrado {
  postalCode: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

@Injectable()
export class ViaCepClient {
  async consultar(cep: string): Promise<CepEncontrado | 'nao-encontrado'> {
    let response: Response;

    try {
      response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw consultaIndisponivel();
    }

    if (!response.ok) {
      throw consultaIndisponivel();
    }

    let corpo: unknown;

    try {
      corpo = await response.json();
    } catch {
      throw consultaIndisponivel();
    }

    if (typeof corpo !== 'object' || corpo === null) {
      throw consultaIndisponivel();
    }

    const registro = corpo as Record<string, unknown>;

    if (registro.erro === true) {
      return 'nao-encontrado';
    }

    const street = texto(registro.logradouro);
    const neighborhood = texto(registro.bairro);
    const city = texto(registro.localidade);
    const state = texto(registro.uf);

    if (!street || !neighborhood || !city || !state || state.length !== 2) {
      throw consultaIndisponivel();
    }

    return {
      postalCode: `${cep.slice(0, 5)}-${cep.slice(5)}`,
      street,
      complement: texto(registro.complemento),
      neighborhood,
      city,
      state: state.toUpperCase(),
    };
  }
}

function texto(valor: unknown): string | null {
  if (typeof valor !== 'string') {
    return null;
  }

  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : null;
}

function consultaIndisponivel(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'CEP_LOOKUP_UNAVAILABLE',
    message: 'A consulta de CEP está indisponível. Preencha o endereço manualmente.',
  });
}
