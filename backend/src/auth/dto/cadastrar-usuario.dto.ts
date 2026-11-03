
/**
 * Este DTO não está ligado a nenhum controller.
 * Cadastro de usuário não é rota pública. O primeiro usuário entra pelo script
 * `src/scripts/criar-primeiro-usuario.ts`, executado só com autorização.
 */
import {
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
  } from 'class-validator';
  
  export class CadastrarUsuarioDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório.' })
    @MaxLength(150)
    nome!: string;
  
    @IsEmail({}, { message: 'Informe um e-mail válido.' })
    @MaxLength(180)
    email!: string;
  
    @IsString()
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
    @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
    senha!: string;
  
    @IsIn(['ADMIN', 'PROFISSIONAL'], {
      message: 'O perfil deve ser ADMIN ou PROFISSIONAL.',
    })
    perfil!: string;
  }
  