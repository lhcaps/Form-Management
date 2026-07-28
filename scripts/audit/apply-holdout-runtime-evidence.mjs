#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json`;
const HOLDOUT_CODES = new Set([
  "BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
  "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200",
]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!existsSync(MATRIX) || !existsSync(MATRIX_MD) || !existsSync(ARTIFACT)) fail("matrix, matrix markdown, or holdout runtime evidence is missing");
const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8"));
if (artifact.status !== "PASS" || artifact.passed !== HOLDOUT_CODES.size) fail("holdout runtime evidence is not a complete PASS");
if (artifact.formFlightRuntimeReadyPromoted !== 0) fail("Form Flight runtimeReady must remain false");
if (artifact.visualHumanReviewPromoted !== 0) fail("visual human review must remain false");

const evidence = new Map((artifact.forms ?? []).map((form) => [form.templateCode, form]));
for (const row of matrix.rows ?? []) {
  if (!HOLDOUT_CODES.has(row.templateCode)) continue;
  const form = evidence.get(row.templateCode);
  if (!form) fail(`missing evidence for ${row.templateCode}`);
  if (row.status !== "INPUT_CONNECTED_PARTIAL" && row.status !== "INPUT_CONNECTED_PASS") fail(`${row.templateCode} must start INPUT_CONNECTED_PARTIAL or already be INPUT_CONNECTED_PASS`);
  if (!form.browserVerified || !form.demoClickVerified || !form.previewClickVerified || !form.docxDownloadVerified || !form.pdfExportVerified || form.persisted !== false) fail(`${row.templateCode} evidence is incomplete`);
  if (row.formFlightProfileExists === true && row.runtimeReady === true) fail(`${row.templateCode} runtimeReady must remain false`);
  row.status = "INPUT_CONNECTED_PASS";
  row.browserVerified = true;
  row.browserVerifiedStatus = "PASS";
  row.demoClickVerified = true;
  row.demoClickStatus = "PASS";
  row.previewClickVerified = true;
  row.previewClickStatus = "PASS";
  row.docxDownloadVerified = true;
  row.docxDownloadStatus = "PASS";
  row.pdfExportVerified = true;
  row.pdfExportStatus = "PASS";
  row.holdoutRuntimeEvidence = { artifact: "QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json", generatedAt: artifact.generatedAt, persisted: false };
}
matrix.counts.INPUT_CONNECTED_PASS = (matrix.rows ?? []).filter((row) => row.status === "INPUT_CONNECTED_PASS").length;
matrix.counts.INPUT_CONNECTED_PARTIAL = (matrix.rows ?? []).filter((row) => row.status === "INPUT_CONNECTED_PARTIAL").length;
if (matrix.counts.INPUT_CONNECTED_PASS !== 213 || matrix.counts.INPUT_CONNECTED_PARTIAL !== 0) fail("matrix counts must become 213 PASS and 0 PARTIAL");
matrix.holdoutRuntimeEvidence = { artifact: "QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json", status: "PASS", runtimeReady: "must remain false", visualHumanReview: "must remain false" };
matrix.snapshotDate = new Date().toISOString();
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));
let matrixMd = readFileSync(MATRIX_MD, "utf8");
matrixMd = matrixMd
  .replace(/^> \*\*Generated\*\*: .*$/m, `> **Generated**: ${matrix.snapshotDate}`)
  .replace(/\| INPUT_CONNECTED_PASS \| \d+ \|/, "| INPUT_CONNECTED_PASS | 213 |")
  .replace(/\| INPUT_CONNECTED_PARTIAL \| \d+ \|/, "| INPUT_CONNECTED_PARTIAL | 0 |");
const holdoutHeader = "## Holdout Runtime Export Evidence";
const existingHoldout = matrixMd.indexOf(holdoutHeader);
if (existingHoldout >= 0) matrixMd = matrixMd.slice(0, existingHoldout).trimEnd() + "\n";
matrixMd += `\n${holdoutHeader}\n\n- Artifact: \`QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json\`\n- 12/12 authenticated runtime flows PASS: demo, non-persisted preview session, DOCX ZIP export, and PDF export.\n- Form Flight runtimeReady must remain false; visual human review must remain false.\n`;
writeFileSync(MATRIX_MD, matrixMd);
console.log(JSON.stringify({ status: "PASS", inputConnectedPass: 213, inputConnectedPartial: 0 }, null, 2));
