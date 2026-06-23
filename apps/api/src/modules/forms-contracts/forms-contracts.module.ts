/**
 * Phase D — Forms contracts module.
 *
 * Uses DbFormContractRepository as the source of truth for the forms catalog.
 * PrismaModule is @Global() so PrismaService is available without explicit import.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FormContractRepository } from './application/form-contract.repository';
import { FormsCatalogService } from './application/forms-catalog.service';
import { FormsCatalogController } from './forms-catalog.controller';
import { DbFormContractRepository } from './infrastructure/db-form-contract.repository';

@Module({
  imports: [PrismaModule],
  controllers: [FormsCatalogController],
  providers: [
    FormsCatalogService,
    {
      provide: FormContractRepository,
      useClass: DbFormContractRepository,
    },
  ],
  exports: [FormsCatalogService, FormContractRepository],
})
export class FormsContractsModule {}
