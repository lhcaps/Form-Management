import { Module } from '@nestjs/common';
import { FormsContractsModule } from '../forms-contracts/forms-contracts.module';
import { TemplatesModule } from '../templates/templates.module';
import { AdminFormTemplatesService } from './application/admin-form-templates.service';
import { FormContractVersionRepository } from './application/form-contract-version.repository';
import { FormPreviewService } from './application/form-preview.service';
import { FormStudioService } from './application/form-studio.service';
import { RuntimeFormContractService } from './application/runtime-form-contract.service';
import { ContractFormInputsService } from './application/contract-form-inputs.service';
import { FormReviewQueryService } from './application/form-review-query.service';
import { ContractFormInputsController } from './contract-form-inputs.controller';
import { FormPermissionsController } from './form-permissions.controller';
import {
  AdminFormDraftsController,
  AdminFormReviewsController,
  AdminFormTemplatesController,
  AdminFormVersionsController,
  FormPreviewJobsController,
  RuntimeFormContractController,
} from './form-studio.controller';
import { PrismaFormContractVersionRepository } from './infrastructure/prisma-form-contract-version.repository';

@Module({
  imports: [FormsContractsModule, TemplatesModule],
  controllers: [
    AdminFormTemplatesController,
    AdminFormDraftsController,
    AdminFormReviewsController,
    AdminFormVersionsController,
    FormPreviewJobsController,
    RuntimeFormContractController,
    FormPermissionsController,
    ContractFormInputsController,
  ],
  providers: [
    FormStudioService,
    RuntimeFormContractService,
    AdminFormTemplatesService,
    FormPreviewService,
    ContractFormInputsService,
    FormReviewQueryService,
    {
      provide: FormContractVersionRepository,
      useClass: PrismaFormContractVersionRepository,
    },
  ],
  exports: [FormStudioService, RuntimeFormContractService],
})
export class FormStudioModule {}
