import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarAcompanhamentoDto {
  @IsString({ message: 'A data do acompanhamento deve ser um texto.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data do acompanhamento deve usar o formato AAAA-MM-DD.',
  })
  occurredOn!: string;

  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @MaxLength(2000, { message: 'A descrição deve ter no máximo 2000 caracteres.' })
  description!: string;

  @IsOptional()
  @IsString({ message: 'A receita deve ser identificada por texto.' })
  prescriptionId?: string;
}

export class ListarAcompanhamentosQueryDto {
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
  @IsIn(['occurredOn', '-occurredOn'], { message: 'A ordenação informada não é aceita.' })
  sort?: 'occurredOn' | '-occurredOn';
}
