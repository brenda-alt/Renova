import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * O contrato exige `username` e `password` e rejeita campos extras.
 * `username` não é coluna: o serviço resolve esse valor para `Usuario.email`.
 */
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'O usuário deve ser um texto.' })
  @IsNotEmpty({ message: 'O usuário é obrigatório.' })
  @MaxLength(80, { message: 'O usuário deve ter no máximo 80 caracteres.' })
  username!: string;

  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MaxLength(200, { message: 'A senha deve ter no máximo 200 caracteres.' })
  password!: string;
}
