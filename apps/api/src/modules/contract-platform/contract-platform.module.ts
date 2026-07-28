import { Module, forwardRef } from '@nestjs/common';
import { FormsContractsModule } from '../forms-contracts/forms-contracts.module';
import { TemplatesModule } from '../templates/templates.module';
import { ContractFormInputsService } from './application/contract-form-inputs.service';
import { DocumentFormSchemaService } from './application/document-form-schema.service';
import { FormPlatformCatalogService } from './application/form-platform-catalog.service';
import { RuntimeFormContractService } from './application/runtime-form-contract.service';
import { ContractFormInputsController } from './contract-form-inputs.controller';
import { DocumentFormSchemaController } from './document-form-schema.controller';
import { FormPlatformCatalogController } from './form-platform-catalog.controller';
import { RuntimeFormContractController } from './runtime-form-contract.controller';
import { ContractFormInputsSaveAdapter } from '../documents/rendering/application/generated-input-save-core/contract-form-inputs-save.adapter';
import { GeneratedInputSaveModule } from '../documents/rendering/application/generated-input-save-core/generated-input-save.module';

@Module({
  imports: [
    FormsContractsModule,
    TemplatesModule,
    forwardRef(() => GeneratedInputSaveModule),
  ],
  controllers: [
    RuntimeFormContractController,
    FormPlatformCatalogController,
    ContractFormInputsController,
    DocumentFormSchemaController,
  ],
  providers: [
    RuntimeFormContractService,
    FormPlatformCatalogService,
    ContractFormInputsService,
    DocumentFormSchemaService,
    // PR-E: contract generated form-inputs adapter — wraps
    // ContractFormInputsService.save inside the shared
    // GeneratedInputSaveOrchestrator.
    ContractFormInputsSaveAdapter,
  ],
  exports: [
    RuntimeFormContractService,
    ContractFormInputsService,
    // PR-E: export contract save adapter so GeneratedInputSaveModule
    // can compose it via forwardRef.
    ContractFormInputsSaveAdapter,
  ],
})
export class ContractPlatformModule {}
