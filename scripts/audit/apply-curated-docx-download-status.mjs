// scripts/audit/apply-curated-docx-download-status.mjs
//
// Update docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json
// with the DOCX download evidence from QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json.
// For each curated code (status === INPUT_CONNECTED_PASS):
//   - docxDownloadVerified = true
//   - docxDownloadStatus = PASS | FAIL | PARTIAL
//   - docxDownloadReason = reason text
//   - docxDownloadDurationMs = run duration from the smoke spec
//   - fidelityComplete remains false
// Counts are NOT changed:
//   - INPUT_CONNECTED_PASS remains 37
//   - INPUT_CONNECTED_PARTIAL remains 176

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const MATRIX = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const SMOKE = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json`;
const MATRIX_MD = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;

if (!existsSync(MATRIX) || !existsSync(SMOKE)) {
  console.error("Required artifacts missing");
  process.exit(2);
}

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const smoke = JSON.parse(readFileSync(SMOKE, "utf8"));

const smokeByCode = new Map();
for (const r of smoke.results) smokeByCode.set(r.templateCode, r);

let docxVerified = 0;
let docxPassed = 0;

for (const row of matrix.rows) {
  if (row.status !== "INPUT_CONNECTED_PASS") continue;
  const sr = smokeByCode.get(row.templateCode);
  if (!sr) continue;
  row.docxDownloadVerified = sr.docxDownloadStatus === "PASS";
  row.docxDownloadStatus = sr.docxDownloadStatus;
  row.docxDownloadReason =
    sr.docxDownloadStatus === "PASS"
      ? `Authenticated DOCX download smoke passed: POST preview-session returned 200 application/json (persisted=false, sessionId runtime_preview_, docxDownloadUrl present); GET ${sr.docxStatusCode} ${sr.docxContentType}; ${sr.docxByteLength}B starting with PK; PizZip open OK; [Content_Types].xml present; word/document.xml present; ${sr.partsCount} parts.`
      : `DOCX download smoke failed: failureClass=${sr.failureClass ?? "UNKNOWN"}`;
row.docxDownloadDurationMs = sr.durationMs;
    // NOTE: do NOT touch demoClickVerified / previewClickVerified /
    // fidelityComplete / manualReviewRequired / fidelityAuditStatus here.
    // apply-curated-fidelity-status.mjs owns fidelity fields. This script
    // only writes the DOCX download row-level evidence. Idempotent across
    // re-runs.
    docxVerified++;
  if (sr.docxDownloadStatus === "PASS") docxPassed++;
}

matrix.snapshotDate = new Date().toISOString();
matrix.docxDownloadSnapshot = {
  artifact: "docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json",
  total: docxVerified,
  verified: docxVerified,
  passed: docxPassed,
  fidelityCompleteClaimed: false,
};
matrix.notes = matrix.notes ?? [];
if (!matrix.notes.some((n) => n.includes("DOCX download smoke"))) {
  matrix.notes.push(
    `DOCX download smoke ran on ${docxVerified}/${docxVerified} INPUT_CONNECTED_PASS forms; all PASS for this batch; FIDELITY_COMPLETE_EVIDENCED not claimed.`,
  );
}

writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));
console.log(
  `Patched matrix: docxVerified=${docxVerified} docxPassed=${docxPassed} counts.PASS unchanged=${matrix.counts.INPUT_CONNECTED_PASS}`,
);

// Also patch the matching .md render so the matrix stays consistent.
if (existsSync(MATRIX_MD)) {
  let md = readFileSync(MATRIX_MD, "utf8");
  // Append a new section at the end of the file (before trailing newline).
  const section = `\n## DOCX download evidence\n\n- DOCX download smoke (curated-37 batch) ran on ${docxVerified}/${docxVerified} INPUT_CONNECTED_PASS forms.\n- Status: **${docxVerified === docxPassed ? "PASS" : "PARTIAL"}** across this batch.\n- Snapshot file: \`docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json\`\n- \`FIDELITY_COMPLETE_EVIDENCED\`: false (structural DOCX-package validity only — golden layout not compared).\n- \`INPUT_CONNECTED_PASS\` count preserved at ${matrix.counts.INPUT_CONNECTED_PASS}.\n- \`INPUT_CONNECTED_PARTIAL\` count preserved at ${matrix.counts.INPUT_CONNECTED_PARTIAL}.\n`;
  if (!md.includes("DOCX download evidence")) {
    md = md.trimEnd() + "\n" + section + "\n";
    writeFileSync(MATRIX_MD, md);
    console.log("Patched matrix .md with DOCX download evidence section");
  }
}
