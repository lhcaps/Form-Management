import { BadRequestException, Injectable } from '@nestjs/common';
import { assertRenderIntentBoundary } from '../api-render-core/api-render-boundary.policy';
import { LegacyGeneratedFormInputsSaveAdapter } from './legacy-generated-form-inputs-save.adapter';
import { ContractFormInputsSaveAdapter } from './contract-form-inputs-save.adapter';
import { Bm031DirectFormInputsSaveAdapter } from './bm031-direct-form-inputs-save.adapter';
import type {
  GeneratedInputSaveAdapter,
  GeneratedInputSaveIntent,
  GeneratedInputSaveRequest,
  GeneratedInputSaveResult,
} from './generated-input-save.types';

const INTENT_TO_ROUTE = {
  GENERATED_SAVE_LEGACY_INPUTS: 'legacy-form-inputs',
  GENERATED_SAVE_CONTRACT_INPUTS: 'contract-form-inputs',
  GENERATED_BM031_DIRECT_SAVE: 'bm031-direct',
} as const satisfies Record<GeneratedInputSaveIntent, string>;

function isKnownSaveIntent(value: unknown): value is GeneratedInputSaveIntent {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(INTENT_TO_ROUTE, value)
  );
}

/**
 * Single seam every generated save route passes through. The
 * orchestrator asserts the (lifecycle, intent) tuple is valid, dispatches
 * to the matching adapter, and wraps the result in a stable envelope.
 * It never swallows, normalizes, or coerces adapter errors.
 */
@Injectable()
export class GeneratedInputSaveOrchestrator {
  private readonly adapters: GeneratedInputSaveAdapter[];

  constructor(
    legacyAdapter: LegacyGeneratedFormInputsSaveAdapter,
    contractAdapter: ContractFormInputsSaveAdapter,
    bm031Adapter: Bm031DirectFormInputsSaveAdapter,
  ) {
    this.adapters = [legacyAdapter, contractAdapter, bm031Adapter];
  }

  async save(
    request: GeneratedInputSaveRequest,
  ): Promise<GeneratedInputSaveResult> {
    if (!request || typeof request !== 'object') {
      throw new BadRequestException('Generated save request is required.');
    }

    if (!isKnownSaveIntent(request.intent)) {
      throw new BadRequestException('Generated save intent is invalid.');
    }

    if (
      typeof request.documentId !== 'string' ||
      request.documentId.length === 0
    ) {
      throw new BadRequestException('Generated save documentId is required.');
    }

    assertRenderIntentBoundary({
      lifecycle: 'generated-document',
      intent: request.intent,
    });

    const adapter = this.adapters.find(
      (entry) => entry.intent === request.intent,
    );
    if (!adapter) {
      throw new BadRequestException(
        `No generated save adapter registered for intent ${request.intent}.`,
      );
    }

    const result = await adapter.save(request);
    return {
      ok: true,
      route: adapter.route,
      result,
    };
  }
}
