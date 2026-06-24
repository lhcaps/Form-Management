import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { Bm031DirectModule } from './modules/bm031-direct/bm031-direct.module';
import { CasesModule } from './modules/cases/cases.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ImportsModule } from './modules/imports/imports.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { FormsContractsModule } from './modules/forms-contracts/forms-contracts.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HealthModule } from './modules/health/health.module';
import { FormStudioModule } from './modules/form-studio/form-studio.module';
import { CsrfCookieGuard } from './common/csrf-cookie.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InfrastructureModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 60,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    TemplatesModule,
    CasesModule,
    DocumentsModule,
    ImportsModule,
    Bm031DirectModule,
    FormsContractsModule,
    FormStudioModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // CSRF guard active only when SameSite=None (cross-origin cookie auth).
    // Safe-ignores OPTIONS, GET, and same-site requests.
    { provide: APP_GUARD, useClass: CsrfCookieGuard },
  ],
})
export class AppModule {}
