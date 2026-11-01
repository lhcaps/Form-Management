import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const apiSrcDir = join(__dirname, '..', '..');
const repoRoot = join(apiSrcDir, '..', '..', '..');

function readApiSource(relativePath: string): string {
  return readFileSync(join(apiSrcDir, relativePath), 'utf8');
}

function readRepoSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

describe('contract platform retirement guard', () => {
  it('registers contract platform instead of retired Form Studio module', () => {
    const appModule = readApiSource('app.module.ts');

    assert.match(appModule, /ContractPlatformModule/);
    assert.doesNotMatch(appModule, /FormStudioModule/);
    assert.equal(existsSync(join(apiSrcDir, 'modules/form-studio')), false);
  });

  it('does not register retired authoring controllers in the active module', () => {
    const moduleSource = readApiSource(
      'modules/contract-platform/contract-platform.module.ts',
    );

    for (const retiredController of [
      'AdminFormTemplatesController',
      'AdminFormDraftsController',
      'AdminFormReviewsController',
      'AdminFormVersionsController',
      'FormPreviewJobsController',
      'FormPermissionsController',
    ]) {
      assert.doesNotMatch(moduleSource, new RegExp(retiredController));
    }
  });

  it('keeps preserved public route paths stable', () => {
    const runtimeController = readApiSource(
      'modules/contract-platform/runtime-form-contract.controller.ts',
    );
    assert.match(runtimeController, /Controller\('forms\/runtime'\)/);
    assert.match(runtimeController, /Get\(':templateCode'\)/);

    const catalogController = readApiSource(
      'modules/contract-platform/form-platform-catalog.controller.ts',
    );
    assert.match(catalogController, /Controller\('form-platform\/catalog'\)/);

    const schemaController = readApiSource(
      'modules/contract-platform/document-form-schema.controller.ts',
    );
    assert.match(schemaController, /Controller\('documents\/generated'\)/);
    assert.match(schemaController, /Get\(':documentId\/form-schema'\)/);

    const inputsController = readApiSource(
      'modules/contract-platform/contract-form-inputs.controller.ts',
    );
    assert.match(inputsController, /Controller\('documents\/generated'\)/);
    assert.match(inputsController, /Put\(':documentId\/contract-form-inputs'\)/);
  });

  it('keeps BM031 direct and legacy generated save endpoints available', () => {
    const legacySaveController = readApiSource(
      'modules/documents/document-renderer.controller.ts',
    );
    assert.match(legacySaveController, /generated\/:documentId\/form-inputs/);

    const bm031DirectController = readApiSource(
      'modules/bm031-direct/bm031-direct.controller.ts',
    );
    assert.match(bm031DirectController, /bm031-direct-form-inputs/);
  });

  it('removes retired frontend navigation and authoring helpers', () => {
    const webSrcDir = join(repoRoot, 'apps/web/src');
    const navSource = readFileSync(
      join(webSrcDir, 'components/layout/nav-items.tsx'),
      'utf8',
    );
    assert.doesNotMatch(navSource, /\/admin\/form-studio/);
    assert.doesNotMatch(navSource, /Form Studio/);

    const compatibilityClient = readFileSync(
      join(webSrcDir, 'lib/form-studio-api.ts'),
      'utf8',
    );
    assert.match(compatibilityClient, /contract-platform-api/);
    assert.doesNotMatch(compatibilityClient, /admin\/form-/);
  });

  it('keeps the runtime preview adapter out of generated-document DB / audit tables', () => {
    // The runtime-preview lifecycle (Session template flow) must NEVER reach
    // into the generated_documents / generated_document_files /
    // generated_document_audit_logs / case_events tables, nor must it
    // route through the legacy / contract document renderers.
    //
    // The orchestrator is the unified seam that owns BOTH lifecycles, so
    // it legitimately references `GeneratedDocumentRenderAdapter` for the
    // generated-document lifecycle. The invariant the test asserts is on
    // the runtime adapter path only: the runtime adapter is the one piece
    // of code that `renderRuntimePreviewSessionDocx` actually delegates
    // to, and it must remain free of generated-document side effects.
    const runtimeAdapter = readApiSource(
      'modules/documents/rendering/application/api-render-core/runtime-template-render.adapter.ts',
    );

    assert.doesNotMatch(runtimeAdapter, /GeneratedDocument/);
    assert.doesNotMatch(runtimeAdapter, /LegacyDocumentRendererAdapter/);
    assert.doesNotMatch(runtimeAdapter, /ContractDocumentRendererAdapter/);
    assert.doesNotMatch(runtimeAdapter, /generated-documents/);
    assert.doesNotMatch(runtimeAdapter, /generated_document_files/);
    assert.doesNotMatch(runtimeAdapter, /generated-document-audit-logs/);
    assert.doesNotMatch(runtimeAdapter, /case-events/);
    assert.doesNotMatch(runtimeAdapter, /prisma/);
  });
});
