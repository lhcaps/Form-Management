import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { assertRenderIntentBoundary } from './api-render-boundary.policy';
import { assertRenderWriteBoundary } from './api-render-write.policy';
import { ApiRenderOrchestrator } from './api-render-orchestrator';
import { RuntimeTemplateRenderAdapter } from './runtime-template-render.adapter';

describe('runtime preview shared core', () => {
  it('accepts runtime preview intent and runtime preview session writes only', () => {
    assert.doesNotThrow(() =>
      assertRenderIntentBoundary({
        lifecycle: 'runtime-template',
        intent: 'RUNTIME_PREVIEW_SESSION',
      }),
    );
    assert.doesNotThrow(() =>
      assertRenderWriteBoundary({
        lifecycle: 'runtime-template',
        writeClass: 'runtime-preview-session-files',
      }),
    );

    for (const writeClass of [
      'generated-documents',
      'stored-files',
      'generated-document-files',
      'generated-document-audit-logs',
      'case-events',
    ] as const) {
      assert.throws(
        () =>
          assertRenderWriteBoundary({ lifecycle: 'runtime-template', writeClass }),
        BadRequestException,
      );
    }
  });

  it('renders runtime preview through adapter wrapping existing renderer path', async () => {
    const rendered = {
      templateCode: 'BM-001',
      fileName: 'BM-001.docx',
      buffer: Buffer.from('docx'),
      warnings: ['missing optional'],
      missingRequired: [{ path: 'document.number', reason: 'missing' }],
    };
    const renderer = {
      renderDocx: async (input: { templateCode: string; data?: unknown }) => {
        assert.equal(input.templateCode, 'BM-001');
        assert.deepEqual(input.data, { document: { number: '' } });
        return rendered;
      },
    };
    const adapter = new RuntimeTemplateRenderAdapter(renderer as never);
    const generatedAdapter = {
      renderDocx: async () => {
        throw new Error('generated render should not run');
      },
    };
    const orchestrator = new ApiRenderOrchestrator(
      adapter,
      generatedAdapter as never,
    );

    const result = await orchestrator.renderRuntimePreviewSessionDocx({
      templateCode: 'BM-001',
      data: { document: { number: '' } },
    });

    assert.equal(adapter.lifecycle, 'runtime-template');
    assert.equal(result, rendered);
    assert.equal(result.missingRequired.length, 1);
  });
});
