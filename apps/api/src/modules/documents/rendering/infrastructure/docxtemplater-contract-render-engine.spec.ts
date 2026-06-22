import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import PizZip from 'pizzip';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from './docxtemplater-contract-render-engine';
import type { ContractRenderPlan } from '../domain/contract-render-plan';

interface ScenarioFixture {
  formData: Record<string, unknown>;
}

const REPO_ROOT = join(process.cwd(), '..', '..');
const OUTPUT_ROOT = join(tmpdir(), 'qllaw-docx-contract-render-engine');

function loadScenario(): ScenarioFixture {
  return JSON.parse(
    readFileSync(
      join(
        REPO_ROOT,
        'test',
        'fixtures',
        'rendering',
        'bm001-shadow-scenarios',
        '01-basic-valid.json',
      ),
      'utf8',
    ),
  ) as ScenarioFixture;
}

function makeWorkspacePaths(): WorkspacePathsService {
  return {
    contractsRoot: join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts'),
    normalizedTemplatesRoot: join(
      REPO_ROOT,
      'storage',
      'templates',
      'normalized-docx',
    ),
    repoRoot: REPO_ROOT,
  } as WorkspacePathsService;
}

function makePrismaService() {
  return { $connect: jest.fn(), $disconnect: jest.fn() } as unknown;
}

function buildPlan(formData: Record<string, unknown>): ContractRenderPlan {
  return new ContractRenderPlanBuilder(
    makePrismaService() as any,
    makeWorkspacePaths(),
  ).build({
    documentId: 'test-document',
    formData,
    templateCode: 'BM-001',
  });
}

describe('DocxtemplaterContractRenderEngine', () => {
  beforeEach(() => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
  });

  afterAll(() => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
  });

  it('writes a valid full-package DOCX with the template parts preserved', async () => {
    const scenario = loadScenario();
    const plan = buildPlan(scenario.formData);

    const result = await new DocxtemplaterContractRenderEngine(
      makeWorkspacePaths(),
    ).renderShadow(plan, scenario.formData, OUTPUT_ROOT);

    expect(existsSync(result.artifacts.docxPath)).toBe(true);

    const zip = new PizZip(readFileSync(result.artifacts.docxPath));
    expect(zip.file('word/document.xml')?.asText()).toContain(
      'Phát hiện hành vi trộm cắp tài sản',
    );
    expect(zip.file('word/document.xml')?.asText()).not.toContain('undefined');
    expect(zip.file('word/styles.xml')).not.toBeNull();
    expect(zip.file('word/settings.xml')).not.toBeNull();
    expect(zip.file('word/header1.xml')).not.toBeNull();
    expect(zip.file('word/_rels/document.xml.rels')).not.toBeNull();
    expect(result.packageIntegrity.status).toBe('pass');
    expect(result.packageIntegrity.missingParts).toHaveLength(0);
    expect(readdirSync(join(OUTPUT_ROOT, 'BM-001'))).toHaveLength(1);
  });

  it('fails semantic verification when any non-empty binding value is absent', async () => {
    const scenario = loadScenario();
    const plan = buildPlan(scenario.formData);
    const brokenPlan: ContractRenderPlan = Object.freeze({
      ...plan,
      bindings: Object.freeze(
        plan.bindings.map((binding) =>
          binding.slotId === 'crimeReport.content'
            ? { ...binding, value: '' }
            : binding,
        ),
      ),
    });

    const result = await new DocxtemplaterContractRenderEngine(
      makeWorkspacePaths(),
    ).renderShadow(brokenPlan, scenario.formData, OUTPUT_ROOT);

    expect(result.semanticComparison.status).toBe('fail');
    expect(result.semanticComparison.missingExpectedText).toContain(
      scenario.formData['crimeReport.content'],
    );
  });
});
