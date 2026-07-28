import { BadRequestException, Injectable } from '@nestjs/common';
import type { CurrentUser } from '../../../../auth/current-user.type';
import { ContractFormInputsService } from '../../../../contract-platform/application/contract-form-inputs.service';
import type {
  GeneratedInputSaveAdapter,
  GeneratedInputSaveRequest,
} from './generated-input-save.types';

/**
 * Contract generated form-inputs adapter. Wraps the existing
 * `ContractFormInputsService.save` so that the public PUT
 * `/documents/generated/:documentId/contract-form-inputs` route is
 * served through the shared GeneratedInputSaveOrchestrator.
 *
 * Lives in ContractPlatformModule because `ContractFormInputsService`
 * is local to that module.
 *
 * Auth (Clerk-mediated) and agency-scope checks already live inside
 * `ContractFormInputsService.save`; this adapter intentionally does
 * not duplicate them. Validation errors from the contract path (422
 * `CONTRACT_INPUT_VALIDATION_FAILED`, 409 `STALE_CONTRACT_HASH`, etc.)
 * bubble up unchanged.
 */
@Injectable()
export class ContractFormInputsSaveAdapter implements GeneratedInputSaveAdapter {
  readonly route = 'contract-form-inputs' as const;
  readonly intent = 'GENERATED_SAVE_CONTRACT_INPUTS' as const;

  constructor(private readonly inputs: ContractFormInputsService) {}

  async save(request: GeneratedInputSaveRequest): Promise<unknown> {
    if (!request.body || typeof request.body !== 'object') {
      throw new BadRequestException('Body phải là object.');
    }
    const body = request.body as {
      contractHash: string;
      data: Record<string, unknown>;
    };
    if (!body.contractHash || !body.data) {
      throw new BadRequestException('Body phải chứa { contractHash, data }.');
    }
    const actor = request.actor as CurrentUser | undefined;
    if (!actor || typeof actor !== 'object' || typeof actor.id !== 'string') {
      throw new BadRequestException(
        'Contract save yêu cầu actor là CurrentUser.',
      );
    }
    return this.inputs.save(request.documentId, body, actor);
  }
}
