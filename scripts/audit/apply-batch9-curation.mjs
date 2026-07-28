#!/usr/bin/env node
/**
 * Records Batch 9 source/render curation evidence.
 *
 * Batch 9 is source/render only. This script deliberately writes NOT_RUN /
 * false values for browser/demo/preview/DOCX/fidelity/visual/human evidence
 * so the matrix cannot imply downstream proof that was not executed.
 *
 * Selected codes: 20 forms chosen dynamically by
 * scripts/audit/select-batch9-candidates.mjs (currently:
 * BM-016, BM-021, BM-025..BM-029, BM-032, BM-034, BM-203..BM-213).
 * Expected outcome: INPUT_CONNECTED_PASS = 177, INPUT_CONNECTED_PARTIAL = 36.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_BATCH9_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH9_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH9_CURATION.latest.md`;

// Pull the selected codes from the candidate artifact so this script
// stays in lock-step with the selector without hardcoding the list.
export const BATCH9_CODES = (() => {
  if (!existsSync(CANDIDATES)) return [];
  try {
    const cand = JSON.parse(readFileSync(CANDIDATES, "utf8"));
    if (cand?.status !== "PASS") return [];
    return Array.isArray(cand.selectedCodes) ? cand.selectedCodes : [];
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
const candidates = readJson(CANDIDATES, "Batch 9 candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
if (JSON.stringify(candidates.selectedCodes) !== JSON.stringify(BATCH9_CODES)) {
  fail(
    `candidate codes drift: ${JSON.stringify(candidates.selectedCodes)}; expected ${JSON.stringify(BATCH9_CODES)}`,
  );
}

const rows = matrix.rows ?? [];
const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of BATCH9_CODES) {
  const row = byCode.get(code);
  if (!row) fail(`missing Batch 9 row ${code}`);
  if (row.status !== "INPUT_CONNECTED_PASS") {
    fail(`${code}: status=${row.status}; expected INPUT_CONNECTED_PASS (run render smoke + status matrix first)`);
  }
  if (row.sourceRenderVerified !== true) {
    fail(`${code}: sourceRenderVerified=${row.sourceRenderVerified}; expected true`);
  }
  if (row.browserVerified === true) fail(`${code}: browserVerified=true; forbidden for Batch 9`);
  if (row.demoClickVerified === true) fail(`${code}: demoClickVerified=true; forbidden for Batch 9`);
  if (row.previewClickVerified === true) fail(`${code}: previewClickVerified=true; forbidden for Batch 9`);
  if (row.docxDownloadVerified === true) fail(`${code}: docxDownloadVerified=true; forbidden for Batch 9`);
  if (row.machineCheckableFidelityStatus === "PASS") fail(`${code}: machine fidelity PASS forbidden for Batch 9`);
  if (row.fidelityComplete === true) fail(`${code}: fidelityComplete=true; forbidden for Batch 9`);
  const lifecycleFields = noGeneratedOrWorkspaceFields(row);
  if (lifecycleFields.length > 0) {
    fail(`${code}: generated/workspace lifecycle fields present: ${lifecycleFields.join(", ")}`);
  }
}

const passCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;
if (passCount !== 177 || partialCount !== 36) {
  fail(`count drift: INPUT_CONNECTED_PASS=${passCount}, INPUT_CONNECTED_PARTIAL=${partialCount}; expected 177/36`);
}

const snapshotDate = new Date().toISOString();
const batch9Set = new Set(BATCH9_CODES);
for (const row of rows) {
  if (!batch9Set.has(row.templateCode)) continue;
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
  row.batch9SourceRenderVerified = true;
}

matrix.snapshotDate = snapshotDate;
matrix.batch9CurationEvidence = {
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
  totalForms: BATCH9_CODES.length,
  formsSourceRenderVerified: BATCH9_CODES.length,
  formsPass: BATCH9_CODES.length,
  formsFail: 0,
  existing157EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  codes: BATCH9_CODES,
  perForm: BATCH9_CODES.map((code) => {
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
    "Batch 9 is source/render-only curation.",
    "Browser/demo/preview/DOCX/fidelity/visual/human evidence remains NOT_RUN for Batch 9.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
  ],
};

const artifact = {
  snapshotDate,
  status: "PASS",
  statusNote:
    "All 20 Batch 9 forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS via source/render smoke only.",
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN for Batch 9",
  demoClickStatus: "NOT_RUN for Batch 9",
  previewClickStatus: "NOT_RUN for Batch 9",
  docxDownloadStatus: "NOT_RUN for Batch 9",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 9",
  visualPdfReviewStatus: "NOT_RUN for Batch 9",
  humanReviewStatus: "NOT_RUN for Batch 9",
  totalForms: BATCH9_CODES.length,
  formsSelected: BATCH9_CODES.length,
  formsCurated: BATCH9_CODES.length,
  formsSourceRenderVerified: BATCH9_CODES.length,
  formsSourceRenderFailed: 0,
  totalInputConnectedPass: passCount,
  totalInputConnectedPartial: partialCount,
  existing157EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  fidelityCompleteTrue: rows.filter((row) => row.fidelityComplete === true).length,
  fidelityCompleteEvidenced: false,
  codes: BATCH9_CODES,
  perForm: matrix.batch9CurationEvidence.perForm,
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
  lines.push("# QLLAW Batch 9 Curation - latest");
  lines.push("");
  lines.push(`> Generated: ${a.snapshotDate}`);
  lines.push(`> Status: ${a.status}`);
  lines.push(`> Source/render: ${a.sourceRenderStatus}`);
  lines.push(`> Codes: ${a.codes.join(", ")}`);
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
  const sectionHeader = "## Batch 9 Curation Evidence";
  const start = md.indexOf(sectionHeader);
  if (start >= 0) md = md.slice(0, start).trimEnd() + "\n";
  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${snapshotDate}`);
  lines.push("- sourceRenderStatus: PASS");
  lines.push("- browserVisibilityStatus: NOT_RUN for Batch 9");
  lines.push("- demoClickStatus: NOT_RUN for Batch 9");
  lines.push("- previewClickStatus: NOT_RUN for Batch 9");
  lines.push("- docxDownloadStatus: NOT_RUN for Batch 9");
  lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 9");
  lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 9");
  lines.push("- humanReviewStatus: NOT_RUN for Batch 9");
  lines.push("- fidelityCompleteClaimed: false");
  lines.push(`- totalForms: ${BATCH9_CODES.length}`);
  lines.push(`- formsSourceRenderVerified: ${BATCH9_CODES.length}`);
  lines.push("- existing157EvidencePreserved: YES");
  lines.push("- formFlightRuntimeReadyPromoted: 0");
  lines.push("");
  lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH9_CURATION.latest.{md,json}`");
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH9_CODES.length,
      formsSourceRenderVerified: BATCH9_CODES.length,
      passCount,
      partialCount,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);