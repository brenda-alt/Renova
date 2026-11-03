import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export const ORDENACOES_RECEITAS = [
  'expiresOn',
  '-expiresOn',
  'patientName',
  '-patientName',
  'createdAt',
  '-createdAt',
] as const;

export const FILTROS_SITUACAO = ['vencida', 'proxima', 'dentro_do_prazo', 'pendente'] as const;
export const FILTROS_FAIXA = [
  'VENCIDA',
  'PROXIMA_5',
  'PROXIMA_15',
  'DENTRO_DO_PRAZO',
  'PENDENTE_INFORMACAO',
] as const;
export const BANDAS_ALERTA = ['vencida', 'proxima_5', 'proxima_15', 'proxima', 'pendente'] as const;
export const CICLOS_RECEITA = ['ATIVA', 'CANCELADA'] as const;
export const TIPOS_RECEITA = ['COMUM', 'CONTROLADA'] as const;

export class ItemReceitaDto {
  @IsString({ message: 'O nome do medicamento deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do medicamento é obrigatório.' })
  @MaxLength(180, { message: 'O nome do medicamento deve ter no máximo 180 caracteres.' })
  medicationName!: string;

  @IsString({ message: 'A dosagem deve ser um texto.' })
  @IsNotEmpty({ message: 'A dosagem é obrigatória.' })
  @MaxLength(80, { message: 'A dosagem deve ter no máximo 80 caracteres.' })
  dosage!: string;

  @IsString({ message: 'A quantidade deve ser um texto.' })
  @IsNotEmpty({ message: 'A quantidade é obrigatória.' })
  @MaxLength(40, { message: 'A quantidade deve ter no máximo 40 caracteres.' })
  quantity!: string;

  @IsBoolean({ message: 'O uso da manhã deve ser verdadeiro ou falso.' })
  morning!: boolean;

  @IsBoolean({ message: 'O uso da tarde deve ser verdadeiro ou falso.' })
  afternoon!: boolean;

  @IsBoolean({ message: 'O uso da noite deve ser verdadeiro ou falso.' })
  night!: boolean;
}

export type OrdenacaoReceitas = (typeof ORDENACOES_RECEITAS)[number];
export type BandaAlerta = (typeof BANDAS_ALERTA)[number];

export class CriarReceitaDto {
  @IsString({ message: 'O paciente deve ser identificado por texto.' })
  @IsNotEmpty({ message: 'O paciente é obrigatório.' })
  patientId!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data de vencimento deve usar o formato AAAA-MM-DD.',
  })
  expiresOn?: string | null;

  @IsOptional()
  @IsString({ message: 'A observação deve ser um texto.' })
  @IsNotEmpty({ message: 'A observação não pode ser vazia.' })
  @MaxLength(2000, { message: 'A observação deve ter no máximo 2000 caracteres.' })
  notes?: string;

  @IsOptional()
  @IsIn(TIPOS_RECEITA, { message: 'O tipo da receita deve ser comum ou controlada.' })
  prescriptionType?: (typeof TIPOS_RECEITA)[number];

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data de emissão deve usar o formato AAAA-MM-DD.',
  })
  issuedOn?: string;

  @IsOptional()
  @IsInt({ message: 'A validade deve ser um número inteiro de dias.' })
  @Min(1, { message: 'A validade deve ter pelo menos 1 dia.' })
  @Max(9999, { message: 'A validade deve ter no máximo 9999 dias.' })
  validityDays?: number;

  @IsOptional()
  @IsArray({ message: 'Os medicamentos devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Adicione ao menos um medicamento.' })
  @ArrayMaxSize(30, { message: 'A receita pode ter no máximo 30 medicamentos.' })
  @ValidateNested({ each: true })
  @Type(() => ItemReceitaDto)
  items?: ItemReceitaDto[];
}

export class AtualizarReceitaDto {
  @ValidateIf((dto: AtualizarReceitaDto) => dto.expiresOn !== undefined && dto.expiresOn !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data de vencimento deve usar o formato AAAA-MM-DD.',
  })
  expiresOn?: string | null;

  @ValidateIf((dto: AtualizarReceitaDto) => dto.notes !== undefined && dto.notes !== null)
  @IsString({ message: 'A observação deve ser um texto.' })
  @IsNotEmpty({ message: 'A observação não pode ser vazia.' })
  @MaxLength(2000, { message: 'A observação deve ter no máximo 2000 caracteres.' })
  notes?: string | null;

  @ValidateIf((dto: AtualizarReceitaDto) => dto.lifecycleStatus !== undefined)
  @IsIn(CICLOS_RECEITA, { message: 'A situação da receita informada não é aceita.' })
  lifecycleStatus?: (typeof CICLOS_RECEITA)[number] | null;
}

export class ListarReceitasQueryDto {
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
  @IsIn(ORDENACOES_RECEITAS, { message: 'A ordenação informada não é aceita.' })
  sort?: OrdenacaoReceitas;

  @IsOptional()
  @IsString({ message: 'O paciente deve ser identificado por texto.' })
  patientId?: string;

  @IsOptional()
  @IsIn(FILTROS_SITUACAO, { message: 'O filtro de prazo informado não é aceito.' })
  statusFilter?: (typeof FILTROS_SITUACAO)[number];

  @IsOptional()
  @IsIn(FILTROS_FAIXA, { message: 'A faixa de alerta informada não é aceita.' })
  alertBand?: (typeof FILTROS_FAIXA)[number];

  @IsOptional()
  @IsIn(CICLOS_RECEITA, { message: 'A situação da receita informada não é aceita.' })
  lifecycleStatus?: (typeof CICLOS_RECEITA)[number];
}

export class ListarAlertasQueryDto {
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
  @IsIn(['expiresOn', '-expiresOn'], { message: 'A ordenação informada não é aceita.' })
  sort?: 'expiresOn' | '-expiresOn';

  @IsOptional()
  @IsIn(BANDAS_ALERTA, { message: 'A faixa de alerta informada não é aceita.' })
  band?: BandaAlerta;
}
