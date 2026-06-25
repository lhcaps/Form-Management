/**
 * E2 — DOCX render integration for 6 representative BMs
 * (PLAN.md v2.3 §E2 + user-locked E2 brief 2026-06-25).
 *
 * Purpose: prove the renderer produces a usable DOCX for the 6 locked
 * representative BMs when given deterministic mock values derived from
 * the schema. This is the integration smoke that E1's schema-layer
 * conformance alone cannot provide: schema and renderer must agree on
 * which fields become text in the DOCX.
 *
 * Important scope (do NOT extend):
 *  - Renders only the 6 representative BMs: BM-001, BM-051, BM-053,
 *    BM-100, BM-150, BM-200.
 *  - Does NOT do XML-context checks (F4).
 *  - Does NOT check table/repeat row counts (F5).
 *  - Does NOT check header/footer/style fidelity (F2/F3).
 *  - Does NOT check legal semantic correctness (Phase G).
 *  - Does NOT render the other 207 BMs (213/213 is E1's job; this is
 *    a representative integration smoke only).
 *  - Does NOT remediate the 115 source fields (C3).
 *  - Does NOT modify locked contract JSON files.
 *  - Does NOT refactor document-renderer.service.ts.
 *  - Does NOT change save/deep-merge semantics.
 *  - Does NOT wire new UI behavior.
 *  - Does NOT relax renderer errors to make tests pass.
 *
 * Reuses:
 *  - DocxtemplaterContractRenderEngine.renderShadow() — the existing
 *    renderer path already used by docxtemplater-contract-render-engine
 *    .spec.ts for BM-001. E2 does not create a parallel renderer.
 *  - ContractRenderPlanBuilder.build() — the existing plan builder that
 *    loads the locked contract, validates status === "locked", and
 *    produces the (fields, bindings, missingRequired, warnings) tuple.
 *  - deriveFormInputSchema() from @qllaw/form-contracts — the E1
 *    schema. E2 uses it to determine which canonical paths are
 *    required manual editable fields and therefore need a marker.
 *
 * Test-local helpers:
 *  - markerForPath(): path-encoded marker, mirrored from the user's
 *    E2 brief (e.g. "legalBasis.line1" -> "__LEGALBASIS_LINE1__").
 *  - buildMockFormData(): walks schema.sections and emits mock values
 *    for required manual editable fields. Date inputType fields still
 *    use the marker string because Docxtemplater does not enforce
 *    date shape on string values.
 *  - extractDocxText(): unzips a DOCX buffer via PizZip, regex-reads
 *    word/document.xml <w:t>...</w:t> spans, decodes XML entities.
 *    Mirrors the structure of scripts/docx-contract/extract-docx-structure
 *    .mjs but is intentionally minimal — no header/footer/table
 *    paragraph block metadata (those belong to F2/F3/F4/F5).
 *
 * Per-BM assertions:
 *  1. The locked contract exists at docs/audit/docx/contracts/locked/
 *     BM-XXX__*.contract.locked.json.
 *  2. The normalized DOCX template exists at
 *     storage/templates/normalized-docx/BM-XXX/BM-XXX_normalized.docx.
 *     (Missing templates are caught by the F1 slot-inventory audit;
 *     if E2 hits a missing template, the test fails with a clear
 *     signal pointing to F1.)
 *  3. deriveFormInputSchema(contract) returns a non-empty schema
 *     (E1 already proved this for all 213; this is a local guard).
 *  4. renderShadow() returns successfully and writes a DOCX file at
 *     result.artifacts.docxPath.
 *  5. Extracted text from the rendered DOCX does not contain "{{"
 *     and does not contain "}}".
 *  6. For each required manual editable field included in mock
 *     formData, the marker appears in extracted text at least once.
 *  7. If a marker is missing, the test fails with: templateCode,
 *     field path, expected marker, and the first 200 chars of
 *     extracted text for triage.
 *
 * No-marker assertion policy:
 *  - Markers are NOT asserted for fields whose source is anything
 *    other than "manual" (casePayload/agencyConfig/... are not user
 *    inputs and the renderer fills them differently or not at all).
 *  - Markers are NOT asserted for non-required fields. E2 is a
 *    "must-not-leave-blanks-for-required-fields" smoke, not a
 *    completeness check.
 *  - Markers are NOT asserted for binding-fallback fields
 *    (origin === "binding-fallback"). Those emit a
 *    BOUND_SLOT_MISSING_FIELD warning in E1 and are a separate
 *    fidelity concern (Phase F), not a "did the renderer see the
 *    mock value" concern.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import PizZip from 'pizzip';
import { deriveFormInputSchema } from '@qllaw/form-contracts';

import { DocxtemplaterContractRenderEngine } from './docxtemplater-contract-render-engine';
import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import type { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';

// Jest runs from apps/api. The existing docxtemplater-contract-render-engine
// spec uses `join(process.cwd(), '..', '..')` to reach the repo root.
const REPO_ROOT = join(process.cwd(), '..', '..');
const LOCKED_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'docx',
  'contracts',
  'locked',
);
const NORMALIZED_DIR = join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
);
const OUTPUT_ROOT = join(tmpdir(), 'qllaw-e2-render-six-bms');

const REPRESENTATIVE_BMS = [
  'BM-001',
  'BM-051',
  'BM-053',
  'BM-100',
  'BM-150',
  'BM-200',
] as const;

type RepresentativeBM = (typeof REPRESENTATIVE_BMS)[number];

interface BmRenderReport {
  templateCode: RepresentativeBM;
  normalizedDocxPresent: boolean;
  normalizedDocxPath: string;
  contractPresent: boolean;
  contractPath: string;
  schemaSections: number;
  schemaFields: number;
  requiredManualEditableFieldCount: number;
  renderSucceeded: boolean;
  docxPath: string | null;
  extractedTextLength: number;
  markerFoundCount: number;
  markerMissingCount: number;
  missingMarkers: Array<{
    fieldPath: string;
    marker: string;
    textPreview: string;
  }>;
  containsDoubleOpenBrace: boolean;
  containsDoubleCloseBrace: boolean;
  skippedReason: string | null;
}

function makeWorkspacePaths(): WorkspacePathsService {
  return {
    contractsRoot: join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts'),
    normalizedTemplatesRoot: NORMALIZED_DIR,
    repoRoot: REPO_ROOT,
  } as unknown as WorkspacePathsService;
}

function makePrismaService() {
  return { $connect: jest.fn(), $disconnect: jest.fn() } as unknown;
}

function loadLockedContractPath(
  templateCode: string,
): string | null {
  const match = readdirSync(LOCKED_DIR).find(
    (entry) =>
      entry.startsWith(`${templateCode}__`) &&
      entry.endsWith('.contract.locked.json'),
  );
  return match ? join(LOCKED_DIR, match) : null;
}

function markerForPath(path: string): string {
  return `__${path.replace(/\W+/g, '_').toUpperCase()}__`;
}

function buildMockFormData(
  schema: ReturnType<typeof deriveFormInputSchema>,
): Record<string, string> {
  const mock: Record<string, string> = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (
        field.required === true &&
        field.editable === true &&
        field.source === 'manual' &&
        field.origin === 'canonical'
      ) {
        mock[field.path] = markerForPath(field.path);
      }
    }
  }
  return mock;
}

function buildPlan(
  templateCode: string,
  formData: Record<string, unknown>,
) {
  return new ContractRenderPlanBuilder(
    makePrismaService() as never,
    makeWorkspacePaths(),
  ).build({
    documentId: `e2-${templateCode}`,
    templateCode,
    formData,
  });
}

function extractDocxText(docxBuffer: Buffer): string {
  const zip = new PizZip(docxBuffer);
  const documentXml = zip.file('word/document.xml')?.asText();
  if (!documentXml) return '';
  const textParts: string[] = [];
  const textRe = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gu;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(documentXml))) {
    textParts.push(decodeXmlEntities(m[1]));
  }
  return textParts.join('');
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'");
}

function textPreview(text: string, max = 200): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

async function runOneRender(
  templateCode: RepresentativeBM,
  contractPath: string,
  normalizedDocxPath: string,
  precomputedSchema: ReturnType<typeof deriveFormInputSchema>,
  precomputedMockFormData: Record<string, string>,
): Promise<Partial<BmRenderReport>> {
  const plan = buildPlan(templateCode, precomputedMockFormData);

  const engine = new DocxtemplaterContractRenderEngine(makeWorkspacePaths());
  const renderResult = await engine.renderShadow(
    plan,
    precomputedMockFormData,
    OUTPUT_ROOT,
  );

  const docxBuffer = readFileSync(renderResult.artifacts.docxPath);
  const extractedText = extractDocxText(docxBuffer);

  const containsDoubleOpenBrace = extractedText.includes('{{');
  const containsDoubleCloseBrace = extractedText.includes('}}');

  const missingMarkers: BmRenderReport['missingMarkers'] = [];
  let markerFoundCount = 0;
  let markerMissingCount = 0;
  for (const [fieldPath, marker] of Object.entries(precomputedMockFormData)) {
    if (extractedText.includes(marker)) {
      markerFoundCount += 1;
    } else {
      markerMissingCount += 1;
      missingMarkers.push({
        fieldPath,
        marker,
        textPreview: textPreview(extractedText),
      });
    }
  }

  return {
    renderSucceeded: true,
    docxPath: renderResult.artifacts.docxPath,
    extractedTextLength: extractedText.length,
    markerFoundCount,
    markerMissingCount,
    missingMarkers,
    containsDoubleOpenBrace,
    containsDoubleCloseBrace,
    skippedReason: null,
  };
}

async function runOne(templateCode: RepresentativeBM): Promise<BmRenderReport> {
  const contractPath = loadLockedContractPath(templateCode);
  const normalizedDocxPath = join(
    NORMALIZED_DIR,
    templateCode,
    `${templateCode}_normalized.docx`,
  );
  const normalizedDocxPresent = existsSync(normalizedDocxPath);
  const contractPresent = contractPath !== null;

  if (!contractPresent || !normalizedDocxPresent) {
    const skippedReason = !contractPresent
      ? `Locked contract not found at ${LOCKED_DIR}/${templateCode}__*.contract.locked.json`
      : `Normalized DOCX template missing at ${normalizedDocxPath} — F1 slot-inventory must land before E2 can render this BM.`;
    // eslint-disable-next-line no-console
    console.warn(`[E2] ${templateCode}: SKIP — ${skippedReason}`);
    return {
      templateCode,
      normalizedDocxPresent,
      normalizedDocxPath,
      contractPresent,
      contractPath: contractPath ?? '(missing)',
      schemaSections: 0,
      schemaFields: 0,
      requiredManualEditableFieldCount: 0,
      renderSucceeded: false,
      docxPath: null,
      extractedTextLength: 0,
      markerFoundCount: 0,
      markerMissingCount: 0,
      missingMarkers: [],
      containsDoubleOpenBrace: false,
      containsDoubleCloseBrace: false,
      skippedReason,
    };
  }

  // Derive schema BEFORE attempting render so that schema stats stay
  // informative even if the renderer throws. This way an E2 failure tells
  // the operator which BM had a real template defect vs. which BM had a
  // data-binding miss.
  const contract = JSON.parse(readFileSync(contractPath!, 'utf8'));
  const schema = deriveFormInputSchema(contract);
  const mockFormData = buildMockFormData(schema);
  const schemaSections = schema.sections.length;
  const schemaFields = schema.sections.reduce(
    (sum, s) => sum + s.fields.length,
    0,
  );
  const requiredManualEditableFieldCount = Object.keys(mockFormData).length;

  try {
    const renderResult = await runOneRender(
      templateCode,
      contractPath!,
      normalizedDocxPath,
      schema,
      mockFormData,
    );
    const fullReport: BmRenderReport = {
      templateCode,
      normalizedDocxPresent,
      normalizedDocxPath,
      contractPresent,
      contractPath: contractPath!,
      schemaSections,
      schemaFields,
      requiredManualEditableFieldCount,
      renderSucceeded: renderResult.renderSucceeded ?? false,
      docxPath: renderResult.docxPath ?? null,
      extractedTextLength: renderResult.extractedTextLength ?? 0,
      markerFoundCount: renderResult.markerFoundCount ?? 0,
      markerMissingCount: renderResult.markerMissingCount ?? 0,
      missingMarkers: renderResult.missingMarkers ?? [],
      containsDoubleOpenBrace: renderResult.containsDoubleOpenBrace ?? false,
      containsDoubleCloseBrace:
        renderResult.containsDoubleCloseBrace ?? false,
      skippedReason: renderResult.skippedReason ?? null,
    };
    return fullReport;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn(
      `[E2] ${templateCode}: RENDER THREW — ${message}`,
    );
    return {
      templateCode,
      normalizedDocxPresent,
      normalizedDocxPath,
      contractPresent,
      contractPath: contractPath!,
      schemaSections,
      schemaFields,
      requiredManualEditableFieldCount,
      renderSucceeded: false,
      docxPath: null,
      extractedTextLength: 0,
      markerFoundCount: 0,
      markerMissingCount: 0,
      missingMarkers: [],
      containsDoubleOpenBrace: false,
      containsDoubleCloseBrace: false,
      skippedReason: `Render failed: ${message}`,
    };
  }
}

describe('E2 — DOCX render integration for 6 representative BMs', () => {
  const reports = new Map<RepresentativeBM, BmRenderReport>();

  beforeAll(async () => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
    for (const bm of REPRESENTATIVE_BMS) {
      const report = await runOne(bm);
      reports.set(bm, report);
    }
  });

  afterAll(() => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
    // eslint-disable-next-line no-console
    console.log(
      '[E2] corpus report:\n' +
        JSON.stringify(
          Array.from(reports.values()).map((r) => ({
            templateCode: r.templateCode,
            normalizedDocxPresent: r.normalizedDocxPresent,
            contractPresent: r.contractPresent,
            schemaSections: r.schemaSections,
            schemaFields: r.schemaFields,
            requiredManualEditableFieldCount:
              r.requiredManualEditableFieldCount,
            renderSucceeded: r.renderSucceeded,
            extractedTextLength: r.extractedTextLength,
            markerFoundCount: r.markerFoundCount,
            markerMissingCount: r.markerMissingCount,
            containsDoubleOpenBrace: r.containsDoubleOpenBrace,
            containsDoubleCloseBrace: r.containsDoubleCloseBrace,
            skippedReason: r.skippedReason,
          })),
          null,
          2,
        ),
    );
  });

  for (const bm of REPRESENTATIVE_BMS) {
    describe(`${bm}`, () => {
      it('reports its status', () => {
        const report = reports.get(bm);
        expect(report).toBeDefined();
        expect(report!.templateCode).toBe(bm);
      });

      it('has a locked contract and a normalized DOCX template on disk', () => {
        const report = reports.get(bm)!;
        expect(report.contractPresent).toBe(true);
        expect(report.normalizedDocxPresent).toBe(true);
      });

      it('derives a schema whose sections and fields are non-empty', () => {
        const report = reports.get(bm)!;
        expect(report.schemaSections).toBeGreaterThan(0);
        expect(report.schemaFields).toBeGreaterThan(0);
      });

      it('renders successfully via the existing shadow path', () => {
        const report = reports.get(bm)!;
        if (!report.renderSucceeded) {
          throw new Error(
            `[E2] ${report.templateCode} render threw: ${report.skippedReason}`,
          );
        }
        expect(report.renderSucceeded).toBe(true);
        expect(report.docxPath).not.toBeNull();
      });

      it('renders no unreplaced {{ or }} placeholders', () => {
        const report = reports.get(bm)!;
        if (!report.renderSucceeded) {
          // Render failure is already surfaced by the previous it(). Don't
          // double-report it through this assertion.
          return;
        }
        expect(report.containsDoubleOpenBrace).toBe(false);
        expect(report.containsDoubleCloseBrace).toBe(false);
      });

      it('contains every required manual editable field marker at least once (or has none to assert)', () => {
        const report = reports.get(bm)!;
        if (!report.renderSucceeded) {
          return;
        }
        if (report.requiredManualEditableFieldCount === 0) {
          // Some BMs (e.g. system-date-only templates) legitimately have no
          // required manual editable fields. Their smoke signal is the no-{}}
          // assertion above; this it() is a no-op when the mock set is empty.
          return;
        }
        if (report.markerMissingCount > 0) {
          const details = report.missingMarkers
            .map(
              (m) =>
                `  - path=${m.fieldPath}\n    marker=${m.marker}\n    textPreview=${m.textPreview}`,
            )
            .join('\n');
          throw new Error(
            `E2 marker smoke failed for ${report.templateCode}: ${report.markerMissingCount}/${report.requiredManualEditableFieldCount} required manual editable markers missing in rendered DOCX.\n` +
              'Per PLAN.md v2.3 §E2: a missing marker is a real signal that schema path and renderer binding diverge. ' +
              'Do not relax this assertion; debug the binding for the missing path.\n' +
              details,
          );
        }
      });
    });
  }
});
