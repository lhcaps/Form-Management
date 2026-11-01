#!/usr/bin/env node
/**
 * Records Batch 5 source/render curation evidence.
 *
 * Batch 5 is source/render only. This script deliberately writes NOT_RUN /
 * false values for browser/demo/preview/DOCX/fidelity/visual/human evidence
 * so the matrix cannot imply downstream proof that was not executed.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_BATCH5_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH5_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH5_CURATION.latest.md`;

export const BATCH5_CODES = [
  "BM-101",
  "BM-102",
  "BM-103",
  "BM-104",
  "BM-105",
  "BM-106",
  "BM-107",
  "BM-108",
  "BM-109",
  "BM-110",
  "BM-111",
  "BM-112",
  "BM-113",
  "BM-114",
  "BM-115",
  "BM-116",
  "BM-117",
  "BM-118",
  "BM-119",
  "BM-120",
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
const candidates = readJson(CANDIDATES, "Batch 5 candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
if (JSON.stringify(candidates.selectedCodes) !== JSON.stringify(BATCH5_CODES)) {
  fail(
    `candidate codes drift: ${JSON.stringify(candidates.selectedCodes)}; expected ${JSON.stringify(BATCH5_CODES)}`,
  );
}

const rows = matrix.rows ?? [];
const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of BATCH5_CODES) {
  const row = byCode.get(code);
  if (!row) fail(`missing Batch 5 row ${code}`);
  if (row.status !== "INPUT_CONNECTED_PASS") {
    fail(`${code}: status=${row.status}; expected INPUT_CONNECTED_PASS (run render smoke + status matrix first)`);
  }
  if (row.sourceRenderVerified !== true) {
    fail(`${code}: sourceRenderVerified=${row.sourceRenderVerified}; expected true`);
  }
  if (row.browserVerified === true) fail(`${code}: browserVerified=true; forbidden for Batch 5`);
  if (row.demoClickVerified === true) fail(`${code}: demoClickVerified=true; forbidden for Batch 5`);
  if (row.previewClickVerified === true) fail(`${code}: previewClickVerified=true; forbidden for Batch 5`);
  if (row.docxDownloadVerified === true) fail(`${code}: docxDownloadVerified=true; forbidden for Batch 5`);
  if (row.machineCheckableFidelityStatus === "PASS") fail(`${code}: machine fidelity PASS forbidden for Batch 5`);
  if (row.fidelityComplete === true) fail(`${code}: fidelityComplete=true; forbidden for Batch 5`);
  const lifecycleFields = noGeneratedOrWorkspaceFields(row);
  if (lifecycleFields.length > 0) {
    fail(`${code}: generated/workspace lifecycle fields present: ${lifecycleFields.join(", ")}`);
  }
}

const passCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;
// Accept pre-Batch-6 baseline (97), Batch 6 state (117), Batch 7 state (137),
// post-Batch-8 state (157), or post-Batch-9 state (177). Each layer writes
// its own per-form evidence; guard scripts enforce the 97/116, 117/96,
// 137/76, 157/56, and 177/36 invariants downstream.
const allowedPassSet = new Set([97, 117, 137, 157, 177]);
if (!allowedPassSet.has(passCount)) {
  fail(`count drift: INPUT_CONNECTED_PASS=${passCount}; expected one of [97, 117, 137, 157, 177]`);
}
const expectedPartial = 213 - passCount;
if (partialCount !== expectedPartial) {
  fail(`count drift: INPUT_CONNECTED_PARTIAL=${partialCount}; expected ${expectedPartial}`);
}

const snapshotDate = new Date().toISOString();
const batch5Set = new Set(BATCH5_CODES);
for (const row of rows) {
  if (!batch5Set.has(row.templateCode)) continue;
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
  row.batch5SourceRenderVerified = true;
}

matrix.snapshotDate = snapshotDate;
matrix.batch5CurationEvidence = {
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
  totalForms: BATCH5_CODES.length,
  formsSourceRenderVerified: BATCH5_CODES.length,
  formsPass: BATCH5_CODES.length,
  formsFail: 0,
  existing77EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  codes: BATCH5_CODES,
  perForm: BATCH5_CODES.map((code) => {
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
    "Batch 5 is source/render-only curation.",
    "Browser/demo/preview/DOCX/fidelity/visual/human evidence remains NOT_RUN for Batch 5.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
  ],
};

const artifact = {
  snapshotDate,
  status: "PASS",
  statusNote:
    "All 20 Batch 5 forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS via source/render smoke only.",
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN for Batch 5",
  demoClickStatus: "NOT_RUN for Batch 5",
  previewClickStatus: "NOT_RUN for Batch 5",
  docxDownloadStatus: "NOT_RUN for Batch 5",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 5",
  visualPdfReviewStatus: "NOT_RUN for Batch 5",
  humanReviewStatus: "NOT_RUN for Batch 5",
  totalForms: BATCH5_CODES.length,
  formsSelected: BATCH5_CODES.length,
  formsCurated: BATCH5_CODES.length,
  formsSourceRenderVerified: BATCH5_CODES.length,
  formsSourceRenderFailed: 0,
  totalInputConnectedPass: passCount,
  totalInputConnectedPartial: partialCount,
  existing77EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  fidelityCompleteTrue: rows.filter((row) => row.fidelityComplete === true).length,
  fidelityCompleteEvidenced: false,
  codes: BATCH5_CODES,
  perForm: matrix.batch5CurationEvidence.perForm,
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
  lines.push("# QLLAW Batch 5 Curation - latest");
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
  const sectionHeader = "## Batch 5 Curation Evidence";
  const start = md.indexOf(sectionHeader);
  if (start >= 0) md = md.slice(0, start).trimEnd() + "\n";
  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${snapshotDate}`);
  lines.push("- sourceRenderStatus: PASS");
  lines.push("- browserVisibilityStatus: NOT_RUN for Batch 5");
  lines.push("- demoClickStatus: NOT_RUN for Batch 5");
  lines.push("- previewClickStatus: NOT_RUN for Batch 5");
  lines.push("- docxDownloadStatus: NOT_RUN for Batch 5");
  lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 5");
  lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 5");
  lines.push("- humanReviewStatus: NOT_RUN for Batch 5");
  lines.push("- fidelityCompleteClaimed: false");
  lines.push(`- totalForms: ${BATCH5_CODES.length}`);
  lines.push(`- formsSourceRenderVerified: ${BATCH5_CODES.length}`);
  lines.push("- existing77EvidencePreserved: YES");
  lines.push("- formFlightRuntimeReadyPromoted: 0");
  lines.push("");
  lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH5_CURATION.latest.{md,json}`");
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH5_CODES.length,
      formsSourceRenderVerified: BATCH5_CODES.length,
      passCount,
      partialCount,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);
