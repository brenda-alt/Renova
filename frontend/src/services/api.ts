import type { ErroApiCorpo, ErroCampo } from '../types/api';
import { lerToken } from './sessao';

export class ErroApi extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErroCampo[];
  readonly existingPatientId?: string;
  readonly currentName?: string;
  readonly informedName?: string;

  constructor(status: number, corpo: ErroApiCorpo) {
    super(corpo.message);
    this.name = 'ErroApi';
    this.status = status;
    this.code = corpo.code;
    this.details = corpo.details ?? [];
    this.existingPatientId = corpo.existingPatientId;
    this.currentName = corpo.currentName;
    this.informedName = corpo.informedName;
  }
}

let aoNaoAutorizado: (() => void) | null = null;

export function definirAoNaoAutorizado(ouvinte: (() => void) | null): void {
  aoNaoAutorizado = ouvinte;
}

export function baseDaApi(): string {
  const configurada = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
  return configurada.replace(/\/$/, '');
}

export function consulta(
  parametros: Record<string, string | number | undefined>,
): string {
  const busca = new URLSearchParams();

  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== '') {
      busca.set(chave, String(valor));
    }
  }

  const texto = busca.toString();
  return texto ? `?${texto}` : '';
}

export function interpretarCorpoErro(status: number, corpo: unknown): ErroApi {
  if (
    typeof corpo === 'object' &&
    corpo !== null &&
    'code' in corpo &&
    'message' in corpo &&
    typeof corpo.code === 'string' &&
    typeof corpo.message === 'string'
  ) {
    const detalhes = 'details' in corpo && Array.isArray(corpo.details) ? corpo.details : [];
    return new ErroApi(status, {
      code: corpo.code,
      message: corpo.message,
      details: detalhes.filter(
        (item): item is ErroCampo =>
          typeof item === 'object' &&
          item !== null &&
          'field' in item &&
          'message' in item &&
          typeof item.field === 'string' &&
          typeof item.message === 'string',
      ),
      existingPatientId:
        'existingPatientId' in corpo && typeof corpo.existingPatientId === 'string'
          ? corpo.existingPatientId
          : undefined,
      currentName:
        'currentName' in corpo && typeof corpo.currentName === 'string'
          ? corpo.currentName
          : undefined,
      informedName:
        'informedName' in corpo && typeof corpo.informedName === 'string'
          ? corpo.informedName
          : undefined,
    });
  }

  if (status === 401) {
    return new ErroApi(status, {
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    });
  }

  if (status === 403) {
    return new ErroApi(status, {
      code: 'FORBIDDEN',
      message: 'Você não tem permissão para esta operação.',
    });
  }

  if (status === 404) {
    return new ErroApi(status, {
      code: 'NOT_FOUND',
      message: 'O registro solicitado não foi encontrado.',
    });
  }

  if (status === 409) {
    return new ErroApi(status, {
      code: 'CONFLICT',
      message: 'A operação conflitou com os dados já cadastrados.',
    });
  }

  return new ErroApi(status, {
    code: 'INTERNAL_ERROR',
    message: 'Não foi possível concluir a operação.',
  });
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    return erro.message;
  }

  return 'Não foi possível concluir a operação.';
}

interface OpcoesPedido {
  autenticar?: boolean;
}

export async function solicitar<T>(
  caminho: string,
  init: RequestInit = {},
  opcoes: OpcoesPedido = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (opcoes.autenticar !== false) {
    const token = lerToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${baseDaApi()}/api/v1${caminho}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ErroApi(0, {
      code: 'NETWORK_ERROR',
      message: 'Não foi possível contactar a API. Verifique se o backend está em execução.',
    });
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const texto = await resposta.text();
  let corpo: unknown = null;

  if (texto) {
    try {
      corpo = JSON.parse(texto) as unknown;
    } catch {
      throw new ErroApi(resposta.status || 500, {
        code: 'INTERNAL_ERROR',
        message: 'A API devolveu uma resposta que não pôde ser lida.',
      });
    }
  }

  if (!resposta.ok) {
    const erro = interpretarCorpoErro(resposta.status, corpo);
    if (resposta.status === 401 && opcoes.autenticar !== false) {
      aoNaoAutorizado?.();
    }
    throw erro;
  }

  return corpo as T;
}
