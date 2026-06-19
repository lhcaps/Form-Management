import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import {
  createCorsOriginValidator,
  resolveCorsPolicy,
} from './common/cors-origin';
import { createGlobalValidationPipe } from './common/validation-pipe.factory';
import { envOrDefault } from './common/env.util';

loadEnv({ path: resolve(process.cwd(), '..', '..', '.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const environment = process.env.NODE_ENV ?? 'development';
  const corsPolicy = resolveCorsPolicy(
    envOrDefault('API_CORS_ORIGIN', 'http://localhost:3000'),
    environment,
  );

  if (environment === 'production') {
    if (envOrDefault('AUTH_COOKIE_SECURE', 'false').toLowerCase() !== 'true') {
      throw new Error(
        'AUTH_COOKIE_SECURE must be "true" when NODE_ENV=production',
      );
    }
    if (envOrDefault('SEED_ADMIN_PASSWORD', '') === 'admin123') {
      throw new Error(
        'SEED_ADMIN_PASSWORD="admin123" is forbidden in production — change it before deploying',
      );
    }
    if (envOrDefault('API_CORS_ORIGIN', '') === '*') {
      throw new Error('API_CORS_ORIGIN="*" is forbidden in production');
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  // --- CORS ---
  app.enableCors({
    origin: corsPolicy.allowAll ? true : createCorsOriginValidator(corsPolicy),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  });

  if (environment !== 'production') {
    logger.log(
      `Allowed CORS origins: ${
        corsPolicy.allowAll ? '*' : corsPolicy.origins.join(', ')
      }`,
    );
  }

  // --- Cookies (cho session auth) ---
  app.use(cookieParser());

  // --- Global prefix ---
  const globalPrefix = envOrDefault('API_GLOBAL_PREFIX', 'api/v1');
  app.setGlobalPrefix(globalPrefix);

  // --- Validation ---
  app.useGlobalPipes(createGlobalValidationPipe());

  // --- Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QUANLYVKS API')
    .setDescription(
      'Offline VKS case management and document template automation API',
    )
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const port = Number(envOrDefault('API_PORT', '3001'));
  await app.listen(port);

  logger.log(
    `QUANLYVKS API is running on http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
