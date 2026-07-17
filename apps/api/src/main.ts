import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ApplicationErrorFilter } from './common/application-error.filter';
import { createCorsOriginValidator } from './common/cors-origin';
import { requestContextMiddleware } from './common/request-context.middleware';
import { createGlobalValidationPipe } from './common/validation-pipe.factory';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { loadApiEnvironment } from './infrastructure/config/load-api-environment';
import { ContractSyncGuard } from './modules/forms-contracts/infrastructure/contract-sync.guard';

async function bootstrap(): Promise<void> {
  loadApiEnvironment();
  const { AppModule } = await import('./app.module');
  const logger = new Logger('Bootstrap');

  // --- C1: Contract Sync Guard ---
  // Verify locked contracts match runtime compiled contracts before starting server
  try {
    const contractGuard = new ContractSyncGuard();
    await contractGuard.verify();
  } catch (error) {
    logger.error('Contract sync guard failed:', error.message);
    process.exit(1);
  }
  const bootstrapConfig = new AppConfigService(process.env);
  bootstrapConfig.assertProductionSafety();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
    rawBody: true,
  });
  app.enableShutdownHooks();
  const config = app.get(AppConfigService);
  const corsPolicy = config.corsPolicy;

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
      'X-Request-Id',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  if (!config.isProduction && !config.tunnelTestMode) {
    logger.log(
      `Allowed CORS origins: ${corsPolicy.allowAll ? '*' : corsPolicy.origins.join(', ')}`,
    );
  } else if (config.tunnelTestMode) {
    logger.log(
      `[TUNNEL_TEST] Local cross-origin cookie test mode is active. ` +
        `Cookie: Secure=${config.effectiveAuthCookieSecure}, SameSite=${config.effectiveAuthCookieSameSite}`,
    );
  }

  // --- Cookies (cho session auth) ---
  app.use(cookieParser());

  // --- Request correlation and stable error responses ---
  app.use(requestContextMiddleware);
  app.useGlobalFilters(new ApplicationErrorFilter());

  // --- Global prefix ---
  const globalPrefix = config.apiGlobalPrefix;
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
  if (config.isSwaggerEnabled) {
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const port = config.apiPort;
  const serverUrl = await app.listen(port);

  logger.log(`QUANLYVKS API is running on ${serverUrl}/${globalPrefix}`);
}

void bootstrap();
