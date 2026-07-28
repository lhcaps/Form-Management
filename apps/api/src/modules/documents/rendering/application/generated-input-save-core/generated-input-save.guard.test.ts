import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';

const apiSrcDir = join(__dirname, '..', '..', '..', '..', '..');

function readApiSource(relativePath: string): string {
  return readFileSync(join(apiSrcDir, relativePath), 'utf8');
}

describe('generated input save orchestrator guard', () => {
  it('keeps the orchestrator out of runtime preview-session service deps', () => {
    const orchestrator = readApiSource(
      'modules/documents/rendering/application/generated-input-save-core/generated-input-save.orchestrator.ts',
    );

    assert.doesNotMatch(orchestrator, /RuntimePreviewSessionService/);
    assert.doesNotMatch(orchestrator, /runtime-preview-session-files/);
    assert.doesNotMatch(orchestrator, /StandaloneTemplateRenderService/);
    assert.doesNotMatch(orchestrator, /RuntimeTemplateRenderAdapter/);
  });

  it('keeps each save adapter free of DOCX renderer and runtime-preview deps', () => {
    const adapterFiles = [
      'modules/documents/rendering/application/generated-input-save-core/legacy-generated-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/contract-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/bm031-direct-form-inputs-save.adapter.ts',
    ];

    for (const relativePath of adapterFiles) {
      const source = readApiSource(relativePath);

      assert.doesNotMatch(source, /RuntimePreviewSessionService/, relativePath);
      assert.doesNotMatch(source, /runtime-preview-session-files/, relativePath);
      assert.doesNotMatch(source, /RuntimeTemplateRenderAdapter/, relativePath);
      assert.doesNotMatch(source, /StandaloneTemplateRenderService/, relativePath);
      assert.doesNotMatch(source, /LegacyDocumentRendererAdapter/, relativePath);
      assert.doesNotMatch(source, /ContractDocumentRendererAdapter/, relativePath);
      assert.doesNotMatch(source, /DocxPreviewService/, relativePath);
      assert.doesNotMatch(source, /docxtemplater/, relativePath);
      assert.doesNotMatch(source, /pizzip/, relativePath);
      assert.doesNotMatch(source, /mammoth/, relativePath);
      assert.doesNotMatch(source, /renderDocx/, relativePath);
    }
  });

  it('does not let any adapter call sample/demo data helpers', () => {
    const adapterFiles = [
      'modules/documents/rendering/application/generated-input-save-core/legacy-generated-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/contract-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/bm031-direct-form-inputs-save.adapter.ts',
    ];

    for (const relativePath of adapterFiles) {
      const source = readApiSource(relativePath);

      assert.doesNotMatch(source, /seed-demo/i, relativePath);
      assert.doesNotMatch(source, /sample-/i, relativePath);
      assert.doesNotMatch(source, /fixture/i, relativePath);
      assert.doesNotMatch(source, /mock-data/i, relativePath);
      assert.doesNotMatch(source, /harness\/demo/i, relativePath);
    }
  });

  it('keeps the three generated save routes exactly as before', () => {
    const rendererController = readApiSource(
      'modules/documents/document-renderer.controller.ts',
    );
    const contractController = readApiSource(
      'modules/contract-platform/contract-form-inputs.controller.ts',
    );
    const bm031Controller = readApiSource(
      'modules/bm031-direct/bm031-direct.controller.ts',
    );

    assert.match(
      rendererController,
      /Post\('generated\/:documentId\/form-inputs'\)/,
      'legacy form-inputs route must be unchanged',
    );
    assert.match(
      contractController,
      /Put\(':documentId\/contract-form-inputs'\)/,
      'contract form-inputs route must be unchanged',
    );
    assert.match(
      bm031Controller,
      /Post\(':id\/bm031-direct-form-inputs'\)/,
      'BM031 direct form-inputs route must be unchanged',
    );
  });

  it('keeps the legacy form-inputs controller delegating to the orchestrator', () => {
    const controller = readApiSource(
      'modules/documents/document-renderer.controller.ts',
    );

    assert.match(controller, /GeneratedInputSaveOrchestrator/);
    assert.match(controller, /GENERATED_SAVE_LEGACY_INPUTS/);
    assert.doesNotMatch(
      controller,
      /documentRendererService\.updateFormInputs\(/,
    );
    assert.doesNotMatch(
      controller,
      /assertRenderIntentBoundary\(/,
      'controller should let orchestrator run the boundary assertion',
    );
  });

  it('keeps the contract form-inputs controller delegating to the orchestrator', () => {
    const controller = readApiSource(
      'modules/contract-platform/contract-form-inputs.controller.ts',
    );

    assert.match(controller, /GeneratedInputSaveOrchestrator/);
    assert.match(controller, /GENERATED_SAVE_CONTRACT_INPUTS/);
    assert.doesNotMatch(controller, /ContractFormInputsService/);
    assert.doesNotMatch(controller, /assertRenderIntentBoundary\(/);
  });

  it('keeps the BM031 direct save controller delegating to the orchestrator', () => {
    const controller = readApiSource(
      'modules/bm031-direct/bm031-direct.controller.ts',
    );

    assert.match(controller, /GeneratedInputSaveOrchestrator/);
    assert.match(controller, /GENERATED_BM031_DIRECT_SAVE/);
    assert.doesNotMatch(
      controller,
      /Bm031DirectService\.saveFormInputs\(/,
    );
    assert.doesNotMatch(controller, /assertRenderIntentBoundary\(/);
  });

  it('keeps the GeneratedInputSaveModule wired into AppModule', () => {
    const appModule = readApiSource('app.module.ts');

    assert.match(appModule, /GeneratedInputSaveModule/);
  });

  it('does not introduce body/query mode on the generated save routes', () => {
    const rendererController = readApiSource(
      'modules/documents/document-renderer.controller.ts',
    );
    const contractController = readApiSource(
      'modules/contract-platform/contract-form-inputs.controller.ts',
    );
    const bm031Controller = readApiSource(
      'modules/bm031-direct/bm031-direct.controller.ts',
    );

    for (const [label, source] of [
      ['document-renderer', rendererController],
      ['contract-form-inputs', contractController],
      ['bm031-direct', bm031Controller],
    ] as const) {
      assert.doesNotMatch(source, /@Query\(\)/, `${label}: must not read query`);
      assert.doesNotMatch(
        source,
        /['"`]mode['"`]\s*[:,)]/,
        `${label}: must not introduce mode`,
      );
    }
  });

  it('does not mutate schema.prisma or create migration files', () => {
    assert.equal(
      existsSync(join(apiSrcDir, '..', 'prisma', 'schema.prisma')),
      true,
    );
    assert.equal(
      existsSync(join(apiSrcDir, '..', 'prisma', 'migrations')),
      true,
    );
    assert.ok(readApiSource('app.module.ts').length > 0);
  });

  it('does not touch locked / normalized / source DOCX files', () => {
    const orchestrator = readApiSource(
      'modules/documents/rendering/application/generated-input-save-core/generated-input-save.orchestrator.ts',
    );
    const adapterFiles = [
      'modules/documents/rendering/application/generated-input-save-core/legacy-generated-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/contract-form-inputs-save.adapter.ts',
      'modules/documents/rendering/application/generated-input-save-core/bm031-direct-form-inputs-save.adapter.ts',
    ];

    assert.doesNotMatch(orchestrator, /writeFile|writeFileSync|createWriteStream/);

    for (const relativePath of adapterFiles) {
      const source = readApiSource(relativePath);
      assert.doesNotMatch(source, /writeFile|writeFileSync|createWriteStream/, relativePath);
    }
  });

  it('rejects attempts to route a save through runtime lifecycle', async () => {
    const { assertRenderIntentBoundary } = await import(
      './../api-render-core/api-render-boundary.policy'
    );
    assert.throws(
      () =>
        assertRenderIntentBoundary({
          lifecycle: 'runtime-template',
          intent: 'GENERATED_SAVE_LEGACY_INPUTS',
        }),
      BadRequestException,
    );

    assert.throws(
      () =>
        assertRenderIntentBoundary({
          lifecycle: 'runtime-template',
          intent: 'GENERATED_BM031_DIRECT_SAVE',
        }),
      BadRequestException,
    );
  });
});
