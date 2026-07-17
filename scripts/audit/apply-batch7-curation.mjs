#!/usr/bin/env node
/**
 * Records Batch 7 source/render curation evidence.
 *
 * Batch 7 is source/render only. This script deliberately writes NOT_RUN /
 * false values for browser/demo/preview/DOCX/fidelity/visual/human evidence
 * so the matrix cannot imply downstream proof that was not executed.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_BATCH7_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH7_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH7_CURATION.latest.md`;

export const BATCH7_CODES = [
  "BM-141",
  "BM-142",
  "BM-143",
  "BM-144",
  "BM-145",
  "BM-146",
  "BM-147",
  "BM-148",
  "BM-149",
  "BM-150",
  "BM-151",
  "BM-152",
  "BM-153",
  "BM-154",
  "BM-155",
  "BM-156",
  "BM-157",
  "BM-158",
  "BM-159",
  "BM-160",
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
const candidates = readJson(CANDIDATES, "Batch 7 candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
if (JSON.stringify(candidates.selectedCodes) !== JSON.stringify(BATCH7_CODES)) {
  fail(
    `candidate codes drift: ${JSON.stringify(candidates.selectedCodes)}; expected ${JSON.stringify(BATCH7_CODES)}`,
  );
}

const rows = matrix.rows ?? [];
const byCode = new Map(rows.map((row) => [row.templateCode, row]));
for (const code of BATCH7_CODES) {
  const row = byCode.get(code);
  if (!row) fail(`missing Batch 7 row ${code}`);
  if (row.status !== "INPUT_CONNECTED_PASS") {
    fail(`${code}: status=${row.status}; expected INPUT_CONNECTED_PASS (run render smoke + status matrix first)`);
  }
  if (row.sourceRenderVerified !== true) {
    fail(`${code}: sourceRenderVerified=${row.sourceRenderVerified}; expected true`);
  }
  if (row.browserVerified === true) fail(`${code}: browserVerified=true; forbidden for Batch 7`);
  if (row.demoClickVerified === true) fail(`${code}: demoClickVerified=true; forbidden for Batch 7`);
  if (row.previewClickVerified === true) fail(`${code}: previewClickVerified=true; forbidden for Batch 7`);
  if (row.docxDownloadVerified === true) fail(`${code}: docxDownloadVerified=true; forbidden for Batch 7`);
  if (row.machineCheckableFidelityStatus === "PASS") fail(`${code}: machine fidelity PASS forbidden for Batch 7`);
  if (row.fidelityComplete === true) fail(`${code}: fidelityComplete=true; forbidden for Batch 7`);
  const lifecycleFields = noGeneratedOrWorkspaceFields(row);
  if (lifecycleFields.length > 0) {
    fail(`${code}: generated/workspace lifecycle fields present: ${lifecycleFields.join(", ")}`);
  }
}

const passCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;
// Accept either pre-Batch-8 baseline (137/76), post-Batch-8 state (157/56),
// or post-Batch-9 state (177/36). Batch 7 is idempotent and only writes
// per-form evidence for its own codes.
const allowedPassSet = new Set([137, 157, 177]);
if (!allowedPassSet.has(passCount) || partialCount !== 213 - passCount) {
  fail(`count drift: INPUT_CONNECTED_PASS=${passCount}, INPUT_CONNECTED_PARTIAL=${partialCount}; expected 137/76 or 157/56 or 177/36`);
}

const snapshotDate = new Date().toISOString();
const batch7Set = new Set(BATCH7_CODES);
for (const row of rows) {
  if (!batch7Set.has(row.templateCode)) continue;
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
  row.batch7SourceRenderVerified = true;
}

matrix.snapshotDate = snapshotDate;
matrix.batch7CurationEvidence = {
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
  totalForms: BATCH7_CODES.length,
  formsSourceRenderVerified: BATCH7_CODES.length,
  formsPass: BATCH7_CODES.length,
  formsFail: 0,
  existing117EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  codes: BATCH7_CODES,
  perForm: BATCH7_CODES.map((code) => {
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
    "Batch 7 is source/render-only curation.",
    "Browser/demo/preview/DOCX/fidelity/visual/human evidence remains NOT_RUN for Batch 7.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
  ],
};

const artifact = {
  snapshotDate,
  status: "PASS",
  statusNote:
    "All 20 Batch 7 forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS via source/render smoke only.",
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN for Batch 7",
  demoClickStatus: "NOT_RUN for Batch 7",
  previewClickStatus: "NOT_RUN for Batch 7",
  docxDownloadStatus: "NOT_RUN for Batch 7",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 7",
  visualPdfReviewStatus: "NOT_RUN for Batch 7",
  humanReviewStatus: "NOT_RUN for Batch 7",
  totalForms: BATCH7_CODES.length,
  formsSelected: BATCH7_CODES.length,
  formsCurated: BATCH7_CODES.length,
  formsSourceRenderVerified: BATCH7_CODES.length,
  formsSourceRenderFailed: 0,
  totalInputConnectedPass: passCount,
  totalInputConnectedPartial: partialCount,
  existing117EvidencePreserved: true,
  formFlightRuntimeReadyPromoted: 0,
  fidelityCompleteTrue: rows.filter((row) => row.fidelityComplete === true).length,
  fidelityCompleteEvidenced: false,
  codes: BATCH7_CODES,
  perForm: matrix.batch7CurationEvidence.perForm,
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
  lines.push("# QLLAW Batch 7 Curation - latest");
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
  const sectionHeader = "## Batch 7 Curation Evidence";
  const start = md.indexOf(sectionHeader);
  if (start >= 0) md = md.slice(0, start).trimEnd() + "\n";
  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${snapshotDate}`);
  lines.push("- sourceRenderStatus: PASS");
  lines.push("- browserVisibilityStatus: NOT_RUN for Batch 7");
  lines.push("- demoClickStatus: NOT_RUN for Batch 7");
  lines.push("- previewClickStatus: NOT_RUN for Batch 7");
  lines.push("- docxDownloadStatus: NOT_RUN for Batch 7");
  lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 7");
  lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 7");
  lines.push("- humanReviewStatus: NOT_RUN for Batch 7");
  lines.push("- fidelityCompleteClaimed: false");
  lines.push(`- totalForms: ${BATCH7_CODES.length}`);
  lines.push(`- formsSourceRenderVerified: ${BATCH7_CODES.length}`);
  lines.push("- existing117EvidencePreserved: YES");
  lines.push("- formFlightRuntimeReadyPromoted: 0");
  lines.push("");
  lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH7_CURATION.latest.{md,json}`");
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH7_CODES.length,
      formsSourceRenderVerified: BATCH7_CODES.length,
      passCount,
      partialCount,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);