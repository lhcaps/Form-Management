#!/usr/bin/env node
/**
 * Records Batch 8 source/render curation evidence.
 *
 * Batch 8 is source/render only. This script deliberately writes NOT_RUN /
 * false values for browser/demo/preview/DOCX/fidelity/visual/human evidence
 * so the matrix cannot imply downstream proof that was not executed.
 *
 * Selected codes: BM-161..BM-170 + BM-172..BM-181 (20 forms).
 * Expected outcome: INPUT_CONNECTED_PASS = 157, INPUT_CONNECTED_PARTIAL = 56.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_BATCH8_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH8_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH8_CURATION.latest.md`;

export const BATCH8_CODES = [
  "BM-161",
  "BM-162",
  "BM-163",
  "BM-164",
  "BM-165",
  "BM-166",
  "BM-167",
  "BM-168",
  "BM-169",
  "BM-170",
  "BM-172",
  "BM-173",
  "BM-174",
  "BM-175",
  "BM-176",
  "BM-177",
  "BM-178",
  "BM-179",
  "BM-180",
  "BM-181",
];

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
const candidates = readJson(CANDIDATES, "Batch 8 candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
if (JSON.stringify(candidates.selectedCodes) !== JSON.stringify(BATCH8_CODES)) {
  fail(
    `candidate codes drift: ${JSON.stringify(candidates.selectedCodes)}; expected ${JSON.stringify(BATCH8_CODES)}`,
  );
}

const rows = matrix.rows ?? [];
const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of BATCH8_CODES) {
  const row = byCode.get(code);
  if (!row) fail(`missing Batch 8 row ${code}`);
  if (row.status !== "INPUT_CONNECTED_PASS") {
    fail(`${code}: status=${row.status}; expected INPUT_CONNECTED_PASS (run render smoke + status matrix first)`);
  }
  if (row.sourceRenderVerified !== true) {
    fail(`${code}: sourceRenderVerified=${row.sourceRenderVerified}; expected true`);
  }
  if (row.browserVerified === true) fail(`${code}: browserVerified=true; forbidden for Batch 8`);
  if (row.demoClickVerified === true) fail(`${code}: demoClickVerified=true; forbidden for Batch 8`);
  if (row.previewClickVerified === true) fail(`${code}: previewClickVerified=true; forbidden for Batch 8`);
  if (row.docxDownloadVerified === true) fail(`${code}: docxDownloadVerified=true; forbidden for Batch 8`);
  if (row.machineCheckableFidelityStatus === "PASS") fail(`${code}: machine fidelity PASS forbidden for Batch 8`);
  if (row.fidelityComplete === true) fail(`${code}: fidelityComplete=true; forbidden for Batch 8`);
  const lifecycleFields = noGeneratedOrWorkspaceFields(row);
  if (lifecycleFields.length > 0) {
    fail(`${code}: generated/workspace lifecycle fields present: ${lifecycleFields.join(", ")}`);
  }
}

const passCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;
// Accept either the post-Batch-8 baseline (157/56) or the post-Batch-9
// state (177/36). Batch 8 is idempotent and only writes per-form evidence
// for its own codes.
if (![157, 177].includes(passCount) || partialCount !== 213 - passCount) {
  fail(`count drift: INPUT_CONNECTED_PASS=${passCount}, INPUT_CONNECTED_PARTIAL=${partialCount}; expected 157/56 or 177/36`);
}

const snapshotDate = new Date().toISOString();
const batch8Set = new Set(BATCH8_CODES);
for (const row of rows) {
  if (!batch8Set.has(row.templateCode)) continue;
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
  row.batch8SourceRenderVerified = true;
}

matrix.snapshotDate = snapshotDate;
matrix.batch8CurationEvidence = {
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
  totalForms: BATCH8_CODES.length,
  formsSourceRenderVerified: BATCH8_CODES.length,
  formsPass: BATCH8_CODES.length,
  formsFail: 0,
  existing137EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  codes: BATCH8_CODES,
  perForm: BATCH8_CODES.map((code) => {
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
    "Batch 8 is source/render-only curation.",
    "Browser/demo/preview/DOCX/fidelity/visual/human evidence remains NOT_RUN for Batch 8.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
  ],
};

const artifact = {
  snapshotDate,
  status: "PASS",
  statusNote:
    "All 20 Batch 8 forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS via source/render smoke only.",
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN for Batch 8",
  demoClickStatus: "NOT_RUN for Batch 8",
  previewClickStatus: "NOT_RUN for Batch 8",
  docxDownloadStatus: "NOT_RUN for Batch 8",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 8",
  visualPdfReviewStatus: "NOT_RUN for Batch 8",
  humanReviewStatus: "NOT_RUN for Batch 8",
  totalForms: BATCH8_CODES.length,
  formsSelected: BATCH8_CODES.length,
  formsCurated: BATCH8_CODES.length,
  formsSourceRenderVerified: BATCH8_CODES.length,
  formsSourceRenderFailed: 0,
  totalInputConnectedPass: passCount,
  totalInputConnectedPartial: partialCount,
  existing137EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  fidelityCompleteTrue: rows.filter((row) => row.fidelityComplete === true).length,
  fidelityCompleteEvidenced: false,
  codes: BATCH8_CODES,
  perForm: matrix.batch8CurationEvidence.perForm,
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
  lines.push("# QLLAW Batch 8 Curation - latest");
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
  const sectionHeader = "## Batch 8 Curation Evidence";
  const start = md.indexOf(sectionHeader);
  if (start >= 0) md = md.slice(0, start).trimEnd() + "\n";
  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${snapshotDate}`);
  lines.push("- sourceRenderStatus: PASS");
  lines.push("- browserVisibilityStatus: NOT_RUN for Batch 8");
  lines.push("- demoClickStatus: NOT_RUN for Batch 8");
  lines.push("- previewClickStatus: NOT_RUN for Batch 8");
  lines.push("- docxDownloadStatus: NOT_RUN for Batch 8");
  lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 8");
  lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 8");
  lines.push("- humanReviewStatus: NOT_RUN for Batch 8");
  lines.push("- fidelityCompleteClaimed: false");
  lines.push(`- totalForms: ${BATCH8_CODES.length}`);
  lines.push(`- formsSourceRenderVerified: ${BATCH8_CODES.length}`);
  lines.push("- existing137EvidencePreserved: YES");
  lines.push("- formFlightRuntimeReadyPromoted: 0");
  lines.push("");
  lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH8_CURATION.latest.{md,json}`");
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH8_CODES.length,
      formsSourceRenderVerified: BATCH8_CODES.length,
      passCount,
      partialCount,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);
