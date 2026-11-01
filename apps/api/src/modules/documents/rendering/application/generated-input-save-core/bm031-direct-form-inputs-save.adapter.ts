import { BadRequestException, Injectable } from '@nestjs/common';
import { Bm031DirectService } from '../../../../bm031-direct/bm031-direct.service';
import type {
  GeneratedInputSaveAdapter,
  GeneratedInputSaveRequest,
} from './generated-input-save.types';

/**
 * BM-031 direct generated form-inputs adapter. Wraps the existing
 * `Bm031DirectService.saveFormInputs` so that the public POST
 * `/documents/generated/:id/bm031-direct-form-inputs` route is served
 * through the shared GeneratedInputSaveOrchestrator.
 *
 * Lives in Bm031DirectModule because `Bm031DirectService` is local to
 * that module. Preserved as a compatibility / deprecation-safe seam:
 * the adapter does NOT do its own BM-031 template check, does NOT
 * write runtime preview-session files, and does NOT touch the legacy
 * templateCode guard logic — that all still lives in
 * `Bm031DirectService.saveFormInputs`.
 */
@Injectable()
export class Bm031DirectFormInputsSaveAdapter implements GeneratedInputSaveAdapter {
  readonly route = 'bm031-direct' as const;
  readonly intent = 'GENERATED_BM031_DIRECT_SAVE' as const;

  constructor(private readonly service: Bm031DirectService) {}

  async save(request: GeneratedInputSaveRequest): Promise<unknown> {
    if (!request.body || typeof request.body !== 'object') {
      throw new BadRequestException('Body phải là object.');
    }
    const documentId = await this.service.resolveDocumentId(request.documentId);
    return this.service.saveFormInputs(
      documentId,
      request.body as Record<string, unknown>,
    );
  }
}
