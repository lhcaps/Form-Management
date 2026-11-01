import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { assertRenderIntentBoundary } from './api-render-boundary.policy';
import { assertRenderWriteBoundary } from './api-render-write.policy';
import { ApiRenderOrchestrator } from './api-render-orchestrator';

const apiSrcDir = join(__dirname, '..', '..', '..', '..', '..');

function readApiSource(relativePath: string): string {
  return readFileSync(join(apiSrcDir, relativePath), 'utf8');
}

describe('generated render shared core', () => {
  it('rejects runtime lifecycle intent for generated render', () => {
    assert.throws(
      () =>
        assertRenderIntentBoundary({
          lifecycle: 'runtime-template',
          intent: 'GENERATED_RENDER_DOCX',
        }),
      BadRequestException,
    );
  });

  it('keeps generated render write classes away from runtime preview writes', () => {
    assert.throws(
      () =>
        assertRenderWriteBoundary({
          lifecycle: 'generated-document',
          writeClass: 'runtime-preview-session-files',
        }),
      BadRequestException,
    );
  });

  it('delegates generated render through the generated adapter', async () => {
    const command = {
      documentId: '42',
      options: { force: true, renderedByName: 'KSV A' },
      actor: null,
    };
    const result = {
      skipped: false,
      file: {
        id: '99',
        fileFormat: 'DOCX',
        fileName: 'BM-001.docx',
      },
    };
    const runtimeAdapter = {
      renderPreviewDocx: async () => {
        throw new Error('runtime preview should not run');
      },
    };
    const generatedAdapter = {
      renderDocx: async (input: typeof command) => {
        assert.equal(input, command);
        return result;
      },
    };
    const orchestrator = new ApiRenderOrchestrator(
      runtimeAdapter as never,
      generatedAdapter as never,
    );

    await assert.doesNotReject(() =>
      orchestrator.renderGeneratedDocumentDocx(command),
    );
    const rendered = await orchestrator.renderGeneratedDocumentDocx(command);
    assert.equal(rendered, result);
  });

  it('keeps public generated DOCX route and binary response path unchanged', () => {
    const controller = readApiSource(
      'modules/documents/document-renderer.controller.ts',
    );

    assert.match(controller, /Post\('generated\/:documentId\/render-docx'\)/);
    assert.match(controller, /renderGeneratedDocument\.execute/);
    assert.doesNotMatch(controller, /Query\(/);
    assert.doesNotMatch(controller, /metadata/);
    assert.doesNotMatch(controller, /application\/json/);
  });

  it('keeps routing policy and renderer adapters present', () => {
    for (const relativePath of [
      'modules/documents/rendering/application/document-renderer-routing.policy.ts',
      'modules/documents/rendering/infrastructure/legacy-document-renderer.adapter.ts',
      'modules/documents/rendering/infrastructure/contract-document-renderer.adapter.ts',
      'modules/documents/rendering/application/contract-shadow-renderer.orchestrator.ts',
      'modules/documents/document-renderer.service.ts',
    ]) {
      assert.ok(readApiSource(relativePath).length > 0, relativePath);
    }
  });

  it('keeps generated adapter out of runtime preview-only dependencies', () => {
    const generatedAdapter = readApiSource(
      'modules/documents/rendering/application/api-render-core/generated-document-render.adapter.ts',
    );

    assert.doesNotMatch(generatedAdapter, /RuntimePreviewSessionService/);
    assert.doesNotMatch(generatedAdapter, /runtime-preview-session-files/);
    assert.doesNotMatch(generatedAdapter, /RuntimeTemplateRenderAdapter/);
  });

  it('keeps runtime adapter out of generated persistence dependencies', () => {
    const runtimeAdapter = readApiSource(
      'modules/documents/rendering/application/api-render-core/runtime-template-render.adapter.ts',
    );

    assert.doesNotMatch(runtimeAdapter, /GeneratedDocument/);
    assert.doesNotMatch(runtimeAdapter, /generated-documents/);
    assert.doesNotMatch(runtimeAdapter, /generated-document-files/);
    assert.doesNotMatch(runtimeAdapter, /generated-document-audit-logs/);
  });

  it('does not import runtime preview adapter from generated render tests', () => {
    const generatedSpec = readApiSource(
      'modules/documents/rendering/application/render-generated-document.use-case.spec.ts',
    );

    assert.doesNotMatch(generatedSpec, /runtime-template-render\.adapter/);
    assert.doesNotMatch(generatedSpec, /RuntimeTemplateRenderAdapter/);
  });
});
