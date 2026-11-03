import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CepEncontrado, ViaCepClient } from './via-cep.client';

@Injectable()
export class EnderecosService {
  constructor(private readonly viaCep: ViaCepClient) {}

  validarCep(valor: string): string {
    const digitos = valor.replace(/\D/g, '');

    if (!/^(\d{8})$/.test(digitos) || !/^(\d{8}|\d{5}-\d{3})$/.test(valor)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'cep', message: 'O CEP deve ter 8 dígitos ou o formato 00000-000.' }],
      });
    }

    return digitos;
  }

  async consultar(digitos: string): Promise<CepEncontrado> {
    const resultado = await this.viaCep.consultar(digitos);

    if (resultado === 'nao-encontrado') {
      throw new NotFoundException({
        code: 'CEP_NOT_FOUND',
        message: 'CEP não encontrado. Preencha o endereço manualmente.',
      });
    }

    return resultado;
  }
}
