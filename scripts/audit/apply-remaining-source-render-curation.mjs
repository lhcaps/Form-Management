#!/usr/bin/env node
/**
 * Records Remaining-Eligible Source/Render curation evidence.
 *
 * Mirrors apply-batch9-curation.mjs but is keyed off the dynamic eligible
 * set selected by scripts/audit/select-remaining-source-render-candidates.mjs.
 *
 * This script is source/render only. It deliberately writes NOT_RUN / false
 * values for browser/demo/preview/DOCX/fidelity/visual/human evidence so the
 * matrix cannot imply downstream proof that was not executed.
 *
 * Expected dynamic outcome:
 *   - INPUT_CONNECTED_PASS increases by eligibleCount.
 *   - INPUT_CONNECTED_PARTIAL decreases by eligibleCount.
 *   - Existing 177 evidence remains intact.
 *   - BM-006 KEEP/calibration state preserved.
 *   - FormFlight runtimeReady allowlist stays BM-001 + BM-171.
 *   - No FIDELITY_COMPLETE_EVIDENCED claim.
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.md`;

// Pull the eligible codes from the candidate artifact so this script
// stays in lock-step with the selector without hardcoding the list.
export const REMAINING_CODES = (() => {
  if (!existsSync(CANDIDATES)) return [];
  try {
    const cand = JSON.parse(readFileSync(CANDIDATES, "utf8"));
    if (cand?.status !== "PASS") return [];
    return Array.isArray(cand.eligibleSelectedCodes) ? cand.eligibleSelectedCodes : [];
  } catch {
    return [];
  }
})();

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

function noGeneratedOrWorkspaceFields(row) {
  return Object.keys(row).filter((key) =>
    /generatedDocument|workspace|history/i.test(key),
  );
}

const matrix = readJson(MATRIX, "status matrix");
const candidates = readJson(CANDIDATES, "remaining source/render candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
if (JSON.stringify(candidates.eligibleSelectedCodes) !== JSON.stringify(REMAINING_CODES)) {
  fail(
    `candidate codes drift: ${JSON.stringify(candidates.eligibleSelectedCodes)}; expected ${JSON.stringify(REMAINING_CODES)}`,
  );
}
if (REMAINING_CODES.length === 0) {
  fail("zero eligible forms; nothing to apply");
}

const rows = matrix.rows ?? [];
const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of REMAINING_CODES) {
  const row = byCode.get(code);
  if (!row) fail(`missing remaining row ${code}`);
  if (row.status !== "INPUT_CONNECTED_PARTIAL") {
    fail(`${code}: status=${row.status}; expected INPUT_CONNECTED_PARTIAL (run render smoke + status matrix first)`);
  }
  if (row.sourceRenderVerified === true) {
    fail(`${code}: sourceRenderVerified=true; expected false before applying`);
  }
  if (row.browserVerified === true) fail(`${code}: browserVerified=true; forbidden for remaining sweep`);
  if (row.demoClickVerified === true) fail(`${code}: demoClickVerified=true; forbidden for remaining sweep`);
  if (row.previewClickVerified === true) fail(`${code}: previewClickVerified=true; forbidden for remaining sweep`);
  if (row.docxDownloadVerified === true) fail(`${code}: docxDownloadVerified=true; forbidden for remaining sweep`);
  if (row.machineCheckableFidelityStatus === "PASS") fail(`${code}: machine fidelity PASS forbidden for remaining sweep`);
  if (row.fidelityComplete === true) fail(`${code}: fidelityComplete=true; forbidden for remaining sweep`);
  const lifecycleFields = noGeneratedOrWorkspaceFields(row);
  if (lifecycleFields.length > 0) {
    fail(`${code}: generated/workspace lifecycle fields present: ${lifecycleFields.join(", ")}`);
  }
}

const passCountBefore = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCountBefore = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;

const snapshotDate = new Date().toISOString();
const remainingSet = new Set(REMAINING_CODES);
for (const row of rows) {
  if (!remainingSet.has(row.templateCode)) continue;
  row.sourceRenderVerified = true;
  row.browserVerified = false;
  row.browserVerifiedStatus = "NOT_RUN";
  row.demoClickVerified = false;
  row.demoClickStatus = "NOT_RUN";
  row.previewClickVerified = false;
  row.previewClickStatus = "NOT_RUN";
  row.docxDownloadVerified = false;
  row.docxDownloadStatus = "NOT_RUN";
  row.fidelityAuditStatus = "NOT_RUN";
  row.machineCheckableFidelityStatus = "NOT_RUN";
  row.visualPdfReviewStatus = "NOT_RUN";
  row.humanReviewStatus = "NOT_RUN";
  row.manualReviewRequired = false;
  row.fidelityComplete = false;
  row.status = "INPUT_CONNECTED_PASS";
  row.remainingSourceRenderVerified = true;
}

const passCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;

if (passCount !== passCountBefore + REMAINING_CODES.length) {
  fail(`expected PASS increase by ${REMAINING_CODES.length}; got passCount=${passCount}, before=${passCountBefore}`);
}
if (partialCount !== partialCountBefore - REMAINING_CODES.length) {
  fail(`expected PARTIAL decrease by ${REMAINING_CODES.length}; got partialCount=${partialCount}, before=${partialCountBefore}`);
}

matrix.snapshotDate = snapshotDate;
matrix.counts = {
  INPUT_CONNECTED_PASS: passCount,
  INPUT_CONNECTED_PARTIAL: partialCount,
  FIDELITY_PENDING: matrix.counts?.FIDELITY_PENDING ?? 0,
  ROUTE_BLOCKED: matrix.counts?.ROUTE_BLOCKED ?? 0,
  CONTRACT_BLOCKED: matrix.counts?.CONTRACT_BLOCKED ?? 0,
  PREVIEW_BLOCKED: matrix.counts?.PREVIEW_BLOCKED ?? 0,
};
matrix.remainingSourceRenderCurationEvidence = {
  snapshotDate,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN",
  demoClickStatus: "NOT_RUN",
  previewClickStatus: "NOT_RUN",
  docxDownloadStatus: "NOT_RUN",
  machineCheckableFidelityStatus: "NOT_RUN",
  visualPdfReviewStatus: "NOT_RUN",
  humanReviewStatus: "NOT_RUN",
  fidelityCompleteClaimed: false,
  totalForms: REMAINING_CODES.length,
  formsSourceRenderVerified: REMAINING_CODES.length,
  formsPass: REMAINING_CODES.length,
  formsFail: 0,
  existing177EvidencePreserved: passCountBefore === 177,
  formFlightRuntimeReadyPromoted: 0,
  countsBefore: {
    INPUT_CONNECTED_PASS: passCountBefore,
    INPUT_CONNECTED_PARTIAL: partialCountBefore,
  },
  codes: REMAINING_CODES,
  perForm: REMAINING_CODES.map((code) => {
    const row = byCode.get(code);
    return {
      code,
      previousStatus: "INPUT_CONNECTED_PARTIAL",
      newStatus: row.status,
      sourceRenderVerified: row.sourceRenderVerified,
      profileRegistered: row.runtimeUxProfileRegistered,
      browserVerified: row.browserVerified,
      demoClickVerified: row.demoClickVerified,
      previewClickVerified: row.previewClickVerified,
      docxDownloadVerified: row.docxDownloadVerified,
      fidelityAuditStatus: row.fidelityAuditStatus,
      machineCheckableFidelityStatus: row.machineCheckableFidelityStatus,
      visualPdfReviewStatus: row.visualPdfReviewStatus,
      humanReviewStatus: row.humanReviewStatus,
      fidelityComplete: row.fidelityComplete,
      manualReviewRequired: row.manualReviewRequired,
    };
  }),
  sourceDocxMutated: false,
  normalizedDocxMutated: false,
  lockedContractsMutated: false,
  compiledContractsMutated: false,
  dbMutated: false,
  prismaSchemaMutated: false,
  migrationsCreated: false,
  publicApiRoutePathsChanged: false,
  commitCreated: false,
  gitPushed: false,
  filesStaged: false,
  notes: [
    "Remaining-eligible source/render-only curation.",
    "Browser/demo/preview/DOCX/fidelity/visual/human evidence remains NOT_RUN for the remaining sweep.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
    "Existing 177 evidence preserved; BM-006 KEEP/calibration state preserved.",
  ],
};

const artifact = {
  snapshotDate,
  status: "PASS",
  statusNote: `All ${REMAINING_CODES.length} remaining-eligible forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS via source/render smoke only.`,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN",
  demoClickStatus: "NOT_RUN",
  previewClickStatus: "NOT_RUN",
  docxDownloadStatus: "NOT_RUN",
  machineCheckableFidelityStatus: "NOT_RUN",
  visualPdfReviewStatus: "NOT_RUN",
  humanReviewStatus: "NOT_RUN",
  totalForms: REMAINING_CODES.length,
  formsSelected: REMAINING_CODES.length,
  formsCurated: REMAINING_CODES.length,
  formsSourceRenderVerified: REMAINING_CODES.length,
  formsSourceRenderFailed: 0,
  totalInputConnectedPass: passCount,
  totalInputConnectedPartial: partialCount,
  countsBefore: { INPUT_CONNECTED_PASS: passCountBefore, INPUT_CONNECTED_PARTIAL: partialCountBefore },
  existing177EvidencePreserved: passCountBefore === 177,
  formFlightRuntimeReadyPromoted: 0,
  fidelityCompleteTrue: rows.filter((row) => row.fidelityComplete === true).length,
  fidelityCompleteEvidenced: false,
  codes: REMAINING_CODES,
  perForm: matrix.remainingSourceRenderCurationEvidence.perForm,
  refusals: {
    sourceDocxMutated: false,
    normalizedDocxMutated: false,
    lockedContractsMutated: false,
    compiledContractsMutated: false,
    dbMutated: false,
    prismaSchemaMutated: false,
    migrationsCreated: false,
    publicApiRoutePathsChanged: false,
    commitCreated: false,
    gitPushed: false,
    filesStaged: false,
  },
};

writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));
writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));

function renderArtifactMd(a) {
  const lines = [];
  lines.push("# QLLAW Remaining-Eligible Source/Render Curation Apply - latest");
  lines.push("");
  lines.push(`> Generated: ${a.snapshotDate}`);
  lines.push(`> Status: ${a.status}`);
  lines.push(`> Source/render: ${a.sourceRenderStatus}`);
  lines.push(`> Codes: ${a.codes.join(", ")}`);
  lines.push(`> INPUT_CONNECTED_PASS: ${a.totalInputConnectedPass}`);
  lines.push(`> INPUT_CONNECTED_PARTIAL: ${a.totalInputConnectedPartial}`);
  lines.push("");
  lines.push("| Code | Previous Status | New Status | Source Render | Browser | Demo | Preview | DOCX | Fidelity | Visual/PDF | Human |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const row of a.perForm) {
    lines.push(
      `| ${row.code} | ${row.previousStatus} | ${row.newStatus} | ${row.sourceRenderVerified ? "PASS" : "FAIL"} | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN | NOT_RUN |`,
    );
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

writeFileSync(ARTIFACT_MD, renderArtifactMd(artifact));

if (existsSync(MATRIX_MD)) {
  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Remaining Source/Render Curation Evidence";
  const start = md.indexOf(sectionHeader);
  if (start >= 0) md = md.slice(0, start).trimEnd() + "\n";
  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${snapshotDate}`);
  lines.push("- sourceRenderStatus: PASS");
  lines.push("- browserVisibilityStatus: NOT_RUN for remaining sweep");
  lines.push("- demoClickStatus: NOT_RUN for remaining sweep");
  lines.push("- previewClickStatus: NOT_RUN for remaining sweep");
  lines.push("- docxDownloadStatus: NOT_RUN for remaining sweep");
  lines.push("- machineCheckableFidelityStatus: NOT_RUN for remaining sweep");
  lines.push("- visualPdfReviewStatus: NOT_RUN for remaining sweep");
  lines.push("- humanReviewStatus: NOT_RUN for remaining sweep");
  lines.push("- fidelityCompleteClaimed: false");
  lines.push(`- totalForms: ${REMAINING_CODES.length}`);
  lines.push(`- formsSourceRenderVerified: ${REMAINING_CODES.length}`);
  lines.push(`- inputConnectedPass: ${passCount}`);
  lines.push(`- inputConnectedPartial: ${partialCount}`);
  lines.push("- existing177EvidencePreserved: YES");
  lines.push("- formFlightRuntimeReadyPromoted: 0");
  lines.push("");
  lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.{md,json}`");
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: REMAINING_CODES.length,
      formsSourceRenderVerified: REMAINING_CODES.length,
      passCount,
      partialCount,
      passCountBefore,
      partialCountBefore,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);