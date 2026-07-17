import { Module, forwardRef } from '@nestjs/common';
import { ContractPlatformModule } from '../../../../contract-platform/contract-platform.module';
import { Bm031DirectModule } from '../../../../bm031-direct/bm031-direct.module';
import { DocumentsModule } from '../../../../documents/documents.module';
import { GeneratedInputSaveOrchestrator } from './generated-input-save.orchestrator';

/**
 * Hosts the single save orchestrator that every generated-save route
 * must pass through. Adapters are provided in their respective feature
 * modules (DocumentRendererService is local to DocumentsModule,
 * ContractFormInputsService to ContractPlatformModule,
 * Bm031DirectService to Bm031DirectModule). This module uses
 * `forwardRef` to reach the three feature modules without forming a
 * 3-cycle when those modules in turn reach back into
 * `GeneratedInputSaveModule` to inject the orchestrator into their
 * controllers.
 *
 * Lifecycle: feature modules see the orchestrator only after
 * `GeneratedInputSaveModule` is loaded; in production this happens via
 * `AppModule`. In tests, each consumer module imports
 * `forwardRef(() => GeneratedInputSaveModule)` along with the other
 * two sibling modules.
 */
@Module({
  imports: [
    forwardRef(() => DocumentsModule),
    forwardRef(() => ContractPlatformModule),
    forwardRef(() => Bm031DirectModule),
  ],
  providers: [GeneratedInputSaveOrchestrator],
  exports: [GeneratedInputSaveOrchestrator],
})
export class GeneratedInputSaveModule {}
