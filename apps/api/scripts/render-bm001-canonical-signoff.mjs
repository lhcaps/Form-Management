#!/usr/bin/env node
/**
 * PR6G.5.1 — Render a fresh canonical BM-001 DOCX via the production render
 * path (DocxtemplaterContractRenderEngine + ContractRenderPlanBuilder +
 * shared mapping toolkit + BM-001 style profile engine).
 *
 * Called by build-bm001-visual-signoff-packet.mjs via `pnpm --filter api
 * exec tsx …`. The companion packet-builder is a pure-JS `.mjs` that shells
 * out to this script so the canonical render runs through the EXACT same
 * engine the BE uses in production — not a duplicated renderer.
 *
 * Inputs (env vars):
 *   BM001_SIGNOFF_DOCX_PATH   — absolute path where the rendered DOCX is copied
 *
 * Output (stdout):
 *   JSON line with: docxPath, shadowPath, manifestPath, byteLength, sha256,
 *   visibleText, semanticStatus, formatStatus, packageIntegrityStatus,
 *   payloadUsed, fixtureInputs.
 *
 * Exit codes:
 *   0 — render OK
 *   1 — infra failure (template missing, locked contract missing, render error)
 *   2 — usage error (env var missing)
 *
 * The script does NOT mutate any locked contract / template / DB row.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatVietnamesePlaceDateLine,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../src/modules/documents/rendering/application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine';
import { extractDocumentXmlFromZip } from '../src/modules/documents/rendering/infrastructure/docx-semantic-comparator';

const REPO_ROOT = process.env.BM001_SIGNOFF_REPO_ROOT ?? process.cwd();

const DOCX_OUT_PATH = process.env.BM001_SIGNOFF_DOCX_PATH ?? '';
if (!DOCX_OUT_PATH) {
  console.error(
    '[FAIL] Missing env var BM001_SIGNOFF_DOCX_PATH (absolute path for the rendered DOCX copy).',
  );
  process.exit(2);
}

/**
 * Canonical BM-001 final-evidence fixture (post-PR6G.3.1):
 *   - issue place: TP. Hồ Chí Minh
 *   - issue date:  2026-07-04 → "ngày 04 tháng 07 năm 2026"
 *   - reception start: 08:00, ngày 26 tháng 12 năm 2025, tại TP. Hồ Chí Minh
 *   - reception end:   10:00, ngày 26 tháng 12 năm 2025
 *   - identity issued: 07 tháng 06 năm 2020
 *   - archive:         buildArchiveLine('', 'Lưu: HSVA, HSKS, VP.')
 *
 * Slot values are computed by the SAME shared helpers the BE renderer uses
 * in production (`formatVietnamesePlaceDateLine`, `buildArchiveLine`, and
 * dateParts-style ISO splitting). Byte-equivalent to BE output.
 */
const BM001_FIXTURE_INPUT = Object.freeze({
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04',
  informantIdentityIssuedDate: '2020-06-07',
  receptionStartedAtDate: '2025-12-26',
  receptionEndedAtDate: '2025-12-26',
  recipientsArchiveLineInput: '',
});

const BM001_PAYLOAD = Object.freeze({
  'document.issuePlaceDateLine': formatVietnamesePlaceDateLine({
    place: BM001_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM001_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),
  'reception.startedAtTimeText': '08:00',
  'reception.startedAtDay': '26',
  'reception.startedAtMonth': '12',
  'reception.startedAtYear': '2025',
  'reception.locationName': 'TP. Hồ Chí Minh',
  'reception.endedAtTimeText': '10:00',
  'reception.endedAtDay': '26',
  'reception.endedAtMonth': '12',
  'reception.endedAtYear': '2025',
  'informant.identityIssuedDay': '07',
  'informant.identityIssuedMonth': '06',
  'informant.identityIssuedYear': '2020',
  'informant.identityIssuedPlace': 'Cục Cảnh sát',
  'recipients.archiveLine': buildArchiveLine(
    BM001_FIXTURE_INPUT.recipientsArchiveLineInput,
    'Lưu: HSVA, HSKS, VP.',
  ),
});

function makeWorkspacePaths() {
  return {
    contractsRoot: `${REPO_ROOT}/docs/audit/docx/contracts`,
    normalizedTemplatesRoot: `${REPO_ROOT}/storage/templates/normalized-docx`,
    repoRoot: REPO_ROOT,
  };
}

function makePrismaService() {
  return { $connect: () => undefined, $disconnect: () => undefined };
}

async function main() {
  const workspacePaths = makeWorkspacePaths();
  const plan = new ContractRenderPlanBuilder(
    makePrismaService(),
    workspacePaths,
  ).build({
    documentId: 'pr6g51-bm001-canonical-signoff',
    formData: BM001_PAYLOAD,
    templateCode: 'BM-001',
  });

  const result = await new DocxtemplaterContractRenderEngine(
    workspacePaths,
  ).renderShadow(plan, BM001_PAYLOAD, process.env.BM001_SIGNOFF_OUT_ROOT);

  const buffer = readFileSync(result.artifacts.docxPath);
  mkdirSync(dirname(DOCX_OUT_PATH), { recursive: true });
  writeFileSync(DOCX_OUT_PATH, buffer);

  const xml = await extractDocumentXmlFromZip(buffer);
  const visibleText = xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const payload = {
    docxPath: DOCX_OUT_PATH,
    shadowPath: result.shadowPath,
    manifestPath: result.artifacts.manifestPath,
    byteLength: buffer.byteLength,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    visibleText,
    semanticStatus: result.semanticComparison.status,
    formatStatus: result.formatAudit.status,
    packageIntegrityStatus: result.packageIntegrity.status,
    renderPlan: {
      templateCode: plan.templateCode,
      fieldCount: plan.fields.length,
      bindingCount: plan.bindings.length,
      missingRequiredCount: plan.missingRequired.length,
      warnings: [...plan.warnings],
    },
    payloadUsed: BM001_PAYLOAD,
    fixtureInputs: BM001_FIXTURE_INPUT,
  };
  process.stdout.write(JSON.stringify(payload));
}

main().catch((err) => {
  console.error(
    '[FAIL]',
    err && err.stack ? err.stack : err && err.message ? err.message : String(err),
  );
  process.exit(1);
});