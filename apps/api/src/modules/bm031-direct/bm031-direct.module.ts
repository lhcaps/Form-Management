import { Global, Module, forwardRef } from '@nestjs/common';
import { Bm031DirectController } from './bm031-direct.controller';
import { Bm031DirectService } from './bm031-direct.service';
import { Bm031DirectFormInputsSaveAdapter } from '../documents/rendering/application/generated-input-save-core/bm031-direct-form-inputs-save.adapter';
import { GeneratedInputSaveModule } from '../documents/rendering/application/generated-input-save-core/generated-input-save.module';

@Global()
@Module({
  imports: [forwardRef(() => GeneratedInputSaveModule)],
  controllers: [Bm031DirectController],
  providers: [
    Bm031DirectService,
    // PR-E: BM-031 direct generated form-inputs adapter — wraps
    // Bm031DirectService.saveFormInputs inside the shared
    // GeneratedInputSaveOrchestrator.
    Bm031DirectFormInputsSaveAdapter,
  ],
  // PR-E: export BM-031 direct adapter so GeneratedInputSaveModule
  // can compose it via forwardRef.
  exports: [Bm031DirectService, Bm031DirectFormInputsSaveAdapter],
})
export class Bm031DirectModule {}
