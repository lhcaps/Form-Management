import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { FormPermissionGuard } from './form-permission.guard';
import { AgencyResourceAccessService } from './agency-resource-access.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      // Áp dụng guard toàn cục; route nào dùng @Public() sẽ bỏ qua.
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FormPermissionGuard,
    },
    AgencyResourceAccessService,
  ],
  exports: [AuthService, AgencyResourceAccessService],
})
export class AuthModule {}
