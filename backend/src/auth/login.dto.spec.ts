import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { validationExceptionFactory } from '../common/validation-exception.factory';

describe('LoginDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  });

  async function validar(body: unknown) {
    return pipe.transform(body, { type: 'body', metatype: LoginDto });
  }

  it('aceita username e password', async () => {
    await expect(
      validar({ username: '  ana.souza@example.com  ', password: 'correta' }),
    ).resolves.toEqual({
      username: 'ana.souza@example.com',
      password: 'correta',
    });
  });

  it('rejeita campo extra e corpo incompleto', async () => {
    try {
      await validar({
        username: 'ana.souza@example.com',
        password: 'correta',
        perfil: 'ADMIN',
      });
      throw new Error('O campo extra deveria ter sido recusado.');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [{ field: 'perfil', message: 'Campo não permitido.' }],
      });
    }

    try {
      await validar({});
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: [
          { field: 'username', message: 'O usuário é obrigatório.' },
          { field: 'password', message: 'A senha é obrigatória.' },
        ],
      });
    }
  });
});
