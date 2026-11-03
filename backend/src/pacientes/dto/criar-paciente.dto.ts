import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

function textoOpcional({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const texto = value.trim();
  return texto === '' ? undefined : texto;
}

export class CriarPacienteDto {
  @Transform(textoOpcional)
  @IsString({ message: 'O CPF deve ser um texto.' })
  @IsNotEmpty({ message: 'O CPF é obrigatório.' })
  @Matches(/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/, {
    message: 'O CPF deve ter 11 dígitos ou a máscara 000.000.000-00.',
  })
  cpf!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  fullName!: string;

  @IsOptional()
  @Transform(textoOpcional)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data de nascimento deve usar o formato AAAA-MM-DD.',
  })
  birthDate?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'O telefone deve ser um texto.' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  phone?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @Matches(/^(\d{8}|\d{5}-\d{3})$/, {
    message: 'O CEP deve ter 8 dígitos ou o formato 00000-000.',
  })
  postalCode?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'O logradouro deve ser um texto.' })
  @MaxLength(200, { message: 'O logradouro deve ter no máximo 200 caracteres.' })
  street?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString()
  @MaxLength(20)
  addressNumber?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString()
  @MaxLength(120)
  complement?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'A UF deve ter 2 letras.' })
  state?: string;
}
