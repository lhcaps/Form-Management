/**
 * Phase D — Forms contracts module.
 */
import { Module } from '@nestjs/common';
import { FormsCatalogController } from './forms-catalog.controller';
import { FormsCatalogService } from './forms-catalog.service';

@Module({
  controllers: [FormsCatalogController],
  providers: [FormsCatalogService],
  exports: [FormsCatalogService],
})
export class FormsContractsModule {}
