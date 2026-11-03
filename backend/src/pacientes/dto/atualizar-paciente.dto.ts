import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function textoInformado(campo: 'fullName' | 'phone' | 'postalCode' | 'street' | 'addressNumber' | 'complement' | 'neighborhood' | 'city' | 'state') {
  return (dto: AtualizarPacienteDto) => dto[campo] !== undefined && dto[campo] !== null;
}

export class AtualizarPacienteDto {
  @ValidateIf(textoInformado('fullName'))
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  fullName?: string | null;

  @ValidateIf((dto: AtualizarPacienteDto) => dto.confirmNameChange !== undefined)
  @IsBoolean({ message: 'A confirmação de nome deve ser verdadeira ou falsa.' })
  confirmNameChange?: boolean | null;

  @ValidateIf((dto: AtualizarPacienteDto) => dto.birthDate !== undefined && dto.birthDate !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'A data de nascimento deve usar o formato AAAA-MM-DD.',
  })
  birthDate?: string | null;

  @ValidateIf(textoInformado('phone'))
  @IsString({ message: 'O telefone deve ser um texto.' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  phone?: string | null;

  @ValidateIf(textoInformado('postalCode'))
  @Matches(/^(\d{8}|\d{5}-\d{3})$/, {
    message: 'O CEP deve ter 8 dígitos ou o formato 00000-000.',
  })
  postalCode?: string | null;

  @ValidateIf(textoInformado('street'))
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O logradouro deve ser um texto.' })
  @IsNotEmpty({ message: 'O logradouro não pode ser vazio.' })
  @MaxLength(200, { message: 'O logradouro deve ter no máximo 200 caracteres.' })
  street?: string | null;

  @ValidateIf(textoInformado('addressNumber'))
  @IsString()
  @MaxLength(20)
  addressNumber?: string | null;

  @ValidateIf(textoInformado('complement'))
  @IsString()
  @MaxLength(120)
  complement?: string | null;

  @ValidateIf(textoInformado('neighborhood'))
  @IsString()
  @MaxLength(120)
  neighborhood?: string | null;

  @ValidateIf(textoInformado('city'))
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ValidateIf(textoInformado('state'))
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'A UF deve ter 2 letras.' })
  state?: string | null;
}
