import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ORDENACOES_PRIORIDADE = ['nearestExpiryOn', '-nearestExpiryOn'] as const;

export type OrdenacaoPrioridade = (typeof ORDENACOES_PRIORIDADE)[number];

export class ListarPrioritariosQueryDto {
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
  @IsIn(ORDENACOES_PRIORIDADE, { message: 'A ordenação informada não é aceita.' })
  sort?: OrdenacaoPrioridade;
}
