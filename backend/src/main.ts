
import 'dotenv/config';
import { readFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';
import {
  loadOpenApiContract,
  resolveOpenApiContractPath,
} from './openapi/load-openapi-contract';

const OPENAPI_FILE_ROUTE = '/api/openapi.yaml';

async function bootstrap(): Promise<void> {
  const contractPath = resolveOpenApiContractPath();
  const document = loadOpenApiContract(contractPath);
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  app.getHttpAdapter().get(
    OPENAPI_FILE_ROUTE,
    (_req: Request, res: Response) => {
      res.type('application/yaml; charset=utf-8');
      res.send(readFileSync(contractPath));
    },
  );

  app.use(
    '/api/docs',
    apiReference({
      url: OPENAPI_FILE_ROUTE,
      pageTitle: 'Renova API',
      theme: 'moon',
      darkMode: true,
      forceDarkModeState: 'dark',
    }),
  );

  await app.listen(3000);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
