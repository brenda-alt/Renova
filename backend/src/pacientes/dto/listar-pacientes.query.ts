import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ORDENACOES_PACIENTES = [
  'fullName',
  '-fullName',
  'createdAt',
  '-createdAt',
] as const;

export type OrdenacaoPacientes = (typeof ORDENACOES_PACIENTES)[number];

export class ListarPacientesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página começa em 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O tamanho da página deve ser um número inteiro.' })
  @Min(1, { message: 'O tamanho da página deve ser pelo menos 1.' })
  @Max(100, { message: 'O tamanho da página deve ser no máximo 100.' })
  pageSize?: number;

  @IsOptional()
  @IsIn(ORDENACOES_PACIENTES, {
    message: 'A ordenação informada não é aceita.',
  })
  sort?: OrdenacaoPacientes;

  @IsOptional()
  @IsString({ message: 'O CPF deve ser um texto.' })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto.' })
  @MaxLength(200, { message: 'O nome deve ter no máximo 200 caracteres.' })
  name?: string;
}
