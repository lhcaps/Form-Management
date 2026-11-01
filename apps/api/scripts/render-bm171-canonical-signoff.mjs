#!/usr/bin/env node
/**
 * PR7A — Render a fresh canonical BM-171 DOCX via the production render
 * path (DocxtemplaterContractRenderEngine + ContractRenderPlanBuilder +
 * shared mapping toolkit + BM-171 style profile engine).
 *
 * Mirrors `apps/api/scripts/render-bm001-canonical-signoff.mjs` exactly.
 * Called by `scripts/audit/build-bm171-visual-signoff-packet.mjs` via
 * `pnpm --filter api exec tsx …`. The companion packet-builder is a
 * pure-JS `.mjs` that shells out to this script so the canonical render
 * runs through the EXACT same engine the BE uses in production — not a
 * duplicated renderer.
 *
 * Inputs (env vars):
 *   BM171_SIGNOFF_DOCX_PATH   — absolute path where the rendered DOCX is copied
 *   BM171_SIGNOFF_OUT_ROOT    — output root for shadow artefacts
 *   BM171_SIGNOFF_REPO_ROOT   — repo root
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
 * The script does NOT enable any other BM. visualSignoffGranted stays
 * false. rolloutReady stays false. (PR7A — BM-171 controlled rollout only.)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatSlashDate,
  formatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../src/modules/documents/rendering/application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine';
import { extractDocumentXmlFromZip } from '../src/modules/documents/rendering/infrastructure/docx-semantic-comparator';

const REPO_ROOT = process.env.BM171_SIGNOFF_REPO_ROOT ?? process.cwd();

const DOCX_OUT_PATH = process.env.BM171_SIGNOFF_DOCX_PATH ?? '';
if (!DOCX_OUT_PATH) {
  console.error(
    '[FAIL] Missing env var BM171_SIGNOFF_DOCX_PATH (absolute path for the rendered DOCX copy).',
  );
  process.exit(2);
}

const OUT_ROOT = process.env.BM171_SIGNOFF_OUT_ROOT ?? '';
if (!OUT_ROOT) {
  console.error(
    '[FAIL] Missing env var BM171_SIGNOFF_OUT_ROOT (absolute path for shadow artefacts).',
  );
  process.exit(2);
}

/**
 * Canonical BM-171 final-evidence fixture (PR7A):
 *   - issue place: TP. Hồ Chí Minh
 *   - issue date:  2026-07-04 → "ngày 04 tháng 07 năm 2026" (leading zeros preserved)
 *   - asset-owner DOB: 1985-09-08 → "08/09/1985"
 *   - asset-owner identity issued: 2021-12-14 → "14/12/2021"
 *   - archive: buildArchiveLine('', 'Lưu: HSVA, HSKS, VP.')
 *
 * Slot values are computed by the SAME shared helpers the BE renderer uses
 * in production (`formatVietnamesePlaceDateLine`, `formatSlashDate`,
 * `buildArchiveLine`, `splitIsoDateToVietnameseParts`).
 */
const BM171_FIXTURE_INPUT = Object.freeze({
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04',
  assetOwnerDateOfBirth: '1985-09-08',
  assetOwnerIdentityIssuedDate: '2021-12-14',
  recipientsArchiveLineInput: '',
});

const BM171_PAYLOAD = Object.freeze({
  'document.issuePlaceAndDateLine': formatVietnamesePlaceDateLine({
    place: BM171_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM171_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),
  'assetOwner.dateOfBirthText': formatSlashDate(
    splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerDateOfBirth),
  ),
  'assetOwner.identityIssuedDateText': formatSlashDate(
    splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedDate),
  ),
  'recipients.archiveLine': buildArchiveLine(
    BM171_FIXTURE_INPUT.recipientsArchiveLineInput,
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
    documentId: 'pr7a-bm171-canonical-signoff',
    formData: BM171_PAYLOAD,
    templateCode: 'BM-171',
  });

  const result = await new DocxtemplaterContractRenderEngine(
    workspacePaths,
  ).renderShadow(plan, BM171_PAYLOAD, OUT_ROOT);

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
    payloadUsed: BM171_PAYLOAD,
    fixtureInputs: BM171_FIXTURE_INPUT,
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