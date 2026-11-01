import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { GeneratedInputSaveOrchestrator } from './generated-input-save.orchestrator';
import { LegacyGeneratedFormInputsSaveAdapter } from './legacy-generated-form-inputs-save.adapter';
import { ContractFormInputsSaveAdapter } from './contract-form-inputs-save.adapter';
import { Bm031DirectFormInputsSaveAdapter } from './bm031-direct-form-inputs-save.adapter';
import type { GeneratedInputSaveRequest } from './generated-input-save.types';

function buildOrchestrator(opts: {
  legacy?: LegacyGeneratedFormInputsSaveAdapter;
  contract?: ContractFormInputsSaveAdapter;
  bm031?: Bm031DirectFormInputsSaveAdapter;
}): GeneratedInputSaveOrchestrator {
  return new GeneratedInputSaveOrchestrator(
    (opts.legacy ?? {
      route: 'legacy-form-inputs',
      intent: 'GENERATED_SAVE_LEGACY_INPUTS',
      save: async () => undefined,
    }) as unknown as LegacyGeneratedFormInputsSaveAdapter,
    (opts.contract ?? {
      route: 'contract-form-inputs',
      intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
      save: async () => undefined,
    }) as unknown as ContractFormInputsSaveAdapter,
    (opts.bm031 ?? {
      route: 'bm031-direct',
      intent: 'GENERATED_BM031_DIRECT_SAVE',
      save: async () => undefined,
    }) as unknown as Bm031DirectFormInputsSaveAdapter,
  );
}

describe('GeneratedInputSaveOrchestrator', () => {
  it('routes GENERATED_SAVE_LEGACY_INPUTS through the legacy adapter', async () => {
    const calls: Array<{ intent: string; documentId: string }> = [];
    const orchestrator = buildOrchestrator({
      legacy: {
        route: 'legacy-form-inputs',
        intent: 'GENERATED_SAVE_LEGACY_INPUTS',
        save: async (request: GeneratedInputSaveRequest) => {
          calls.push({
            intent: request.intent,
            documentId: request.documentId,
          });
          return { ok: true, calledFrom: 'legacy' };
        },
      } as unknown as LegacyGeneratedFormInputsSaveAdapter,
    });

    const envelope = await orchestrator.save({
      intent: 'GENERATED_SAVE_LEGACY_INPUTS',
      documentId: '42',
      body: { agency: { name: 'VKSKV7' } },
    });

    assert.equal(envelope.ok, true);
    assert.equal(envelope.route, 'legacy-form-inputs');
    assert.deepEqual(envelope.result, { ok: true, calledFrom: 'legacy' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].intent, 'GENERATED_SAVE_LEGACY_INPUTS');
    assert.equal(calls[0].documentId, '42');
  });

  it('routes GENERATED_SAVE_CONTRACT_INPUTS through the contract adapter', async () => {
    const calls: unknown[] = [];
    const orchestrator = buildOrchestrator({
      contract: {
        route: 'contract-form-inputs',
        intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
        save: async (request: GeneratedInputSaveRequest) => {
          calls.push(request);
          return { ok: true, calledFrom: 'contract' };
        },
      } as unknown as ContractFormInputsSaveAdapter,
    });

    const envelope = await orchestrator.save({
      intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
      documentId: '11',
      actor: { id: 'u1', fullName: 'KSV A' },
      body: { contractHash: 'h-1', data: { person: { fullName: 'A' } } },
    });

    assert.equal(envelope.ok, true);
    assert.equal(envelope.route, 'contract-form-inputs');
    assert.equal((envelope.result as { calledFrom: string }).calledFrom, 'contract');
    assert.equal(calls.length, 1);
    assert.equal(
      (calls[0] as { intent: string }).intent,
      'GENERATED_SAVE_CONTRACT_INPUTS',
    );
  });

  it('routes GENERATED_BM031_DIRECT_SAVE through the BM031 adapter', async () => {
    const calls: unknown[] = [];
    const orchestrator = buildOrchestrator({
      bm031: {
        route: 'bm031-direct',
        intent: 'GENERATED_BM031_DIRECT_SAVE',
        save: async (request: GeneratedInputSaveRequest) => {
          calls.push(request);
          return { ok: true, calledFrom: 'bm031' };
        },
      } as unknown as Bm031DirectFormInputsSaveAdapter,
    });

    const envelope = await orchestrator.save({
      intent: 'GENERATED_BM031_DIRECT_SAVE',
      documentId: '77',
      body: { legalBasis: { requestApprovalLine: 'Lệnh bắt ...' } },
    });

    assert.equal(envelope.ok, true);
    assert.equal(envelope.route, 'bm031-direct');
    assert.equal((envelope.result as { calledFrom: string }).calledFrom, 'bm031');
    assert.equal(calls.length, 1);
    assert.equal(
      (calls[0] as { documentId: string }).documentId,
      '77',
    );
  });

  it('rejects attempts to misuse a generated-render intent as a save intent', async () => {
    const orchestrator = buildOrchestrator({});
    await assert.rejects(
      () =>
        orchestrator.save({
          intent: 'GENERATED_RENDER_DOCX' as never,
          documentId: '42',
          body: {},
        } as never),
      BadRequestException,
    );
  });

  it('rejects unknown / unsupported save intent values', async () => {
    const orchestrator = buildOrchestrator({});
    for (const intent of [
      'RUNTIME_PREVIEW_SESSION',
      'TOTALLY_UNKNOWN',
      '',
      null,
      undefined,
    ]) {
      await assert.rejects(
        () =>
          orchestrator.save({
            intent: intent as never,
            documentId: '42',
            body: {},
          } as never),
        BadRequestException,
      );
    }
  });

  it('rejects requests missing a documentId', async () => {
    const orchestrator = buildOrchestrator({});
    await assert.rejects(
      () =>
        orchestrator.save({
          intent: 'GENERATED_SAVE_LEGACY_INPUTS',
          documentId: '',
          body: {},
        }),
      BadRequestException,
    );
  });

  it('does not swallow validation errors from the adapter', async () => {
    class CustomError extends Error {
      readonly code = 'CONTRACT_INPUT_VALIDATION_FAILED';
      readonly status = 422;
    }
    const orchestrator = buildOrchestrator({
      contract: {
        route: 'contract-form-inputs',
        intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
        save: async () => {
          throw new CustomError('Dữ liệu biểu mẫu chưa hợp lệ.');
        },
      } as unknown as ContractFormInputsSaveAdapter,
    });

    await assert.rejects(
      () =>
        orchestrator.save({
          intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
          documentId: '11',
          actor: { id: 'u1' },
          body: { contractHash: 'h', data: {} },
        }),
      (err: unknown) => {
        assert.ok(err instanceof CustomError);
        assert.equal((err as CustomError).status, 422);
        return true;
      },
    );
  });

  it('does not swallow errors from the BM031 adapter', async () => {
    class BmError extends Error {
      readonly code = 'BM031_TEMPLATE_MISMATCH';
    }
    const orchestrator = buildOrchestrator({
      bm031: {
        route: 'bm031-direct',
        intent: 'GENERATED_BM031_DIRECT_SAVE',
        save: async () => {
          throw new BmError('not BM-031');
        },
      } as unknown as Bm031DirectFormInputsSaveAdapter,
    });

    await assert.rejects(
      () =>
        orchestrator.save({
          intent: 'GENERATED_BM031_DIRECT_SAVE',
          documentId: '77',
          body: {},
        }),
      BmError,
    );
  });
});
