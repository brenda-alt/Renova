import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';
import { validationExceptionFactory } from './validation-exception.factory';

const ORIGENS_LOCAIS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function origensPermitidas(): string[] {
  const configuradas = process.env.CORS_ORIGINS?.split(',')
    .map((origem) => origem.trim())
    .filter((origem) => origem.length > 0);

  return configuradas && configuradas.length > 0 ? configuradas : ORIGENS_LOCAIS;
}

export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: origensPermitidas(),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}
