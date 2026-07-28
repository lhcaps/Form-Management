import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentRendererService } from '../../../document-renderer.service';
import type { GeneratedInputSaveAdapter } from './generated-input-save.types';
import type { GeneratedInputSaveRequest } from './generated-input-save.types';

/**
 * Legacy generated form-inputs adapter. Wraps the existing
 * `DocumentRendererService.updateFormInputs` so that the public POST
 * `/documents/generated/:documentId/form-inputs` route can be served
 * through the shared GeneratedInputSaveOrchestrator without altering
 * payload shape, validation, or DB behavior.
 *
 * Lives in DocumentsModule because DocumentRendererService is local
 * to that module.
 */
@Injectable()
export class LegacyGeneratedFormInputsSaveAdapter implements GeneratedInputSaveAdapter {
  readonly route = 'legacy-form-inputs' as const;
  readonly intent = 'GENERATED_SAVE_LEGACY_INPUTS' as const;

  constructor(private readonly renderer: DocumentRendererService) {}

  async save(request: GeneratedInputSaveRequest): Promise<unknown> {
    if (!request.body || typeof request.body !== 'object') {
      throw new BadRequestException('Body phải là object.');
    }
    return this.renderer.updateFormInputs(
      request.documentId,
      request.body as Parameters<
        DocumentRendererService['updateFormInputs']
      >[1],
    );
  }
}
