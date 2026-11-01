#!/usr/bin/env node
/**
 * assert-curated-37-visual-fidelity.mjs
 *
 * Read-only guard. Asserts the curated 37 visual/PDF fidelity invariants:
 *
 *   - Total rows == 213
 *   - counts.INPUT_CONNECTED_PASS == 37
 *   - counts.INPUT_CONNECTED_PARTIAL == 176
 *   - All 37 curated rows have visualPdfReviewStatus set
 *   - No fidelityComplete=true unless humanReviewStatus === PASS
 *   - No non-curated row gets visualPdfReviewStatus set
 *   - Prior evidence flags (browser/demo/preview/docx/fidelity) preserved
 *   - No FORMFLIGHT runtimeReady allowlist drift
 *   - visualPdfFidelityStatus is PARTIAL (not PASS, since human review not done)
 *   - fidelityCompleteEvidenced is false (no human-reviewed PASS for all 37)
 *
 * Usage:
 *   node scripts/audit/assert-curated-37-visual-fidelity.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const VISUAL = `${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json`;
const FIDELITY = `${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json`;

const CURATED_37 = new Set([
  "BM-001","BM-005","BM-006","BM-007","BM-008","BM-009","BM-010",
  "BM-011","BM-012","BM-014","BM-015","BM-017","BM-018","BM-019",
  "BM-020","BM-022","BM-023","BM-030","BM-031","BM-033","BM-035",
  "BM-036","BM-037","BM-038","BM-040","BM-042","BM-043","BM-044",
  "BM-045","BM-046","BM-047","BM-048","BM-052","BM-053","BM-054",
  "BM-070","BM-171",
]);

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function loadJson(path, label) {
  if (!existsSync(path)) fail(`missing artifact: ${label} (${path})`);
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (err) { fail(`invalid JSON in ${label}: ${err.message}`); }
}

function main() {
  const matrix = loadJson(MATRIX, "status matrix");
  const visual = loadJson(VISUAL, "visual PDF artifact");
  const fidelity = loadJson(FIDELITY, "golden layout fidelity artifact");

  // 1. Total rows
  if (matrix.total !== 213 || (matrix.rows || []).length !== 213) {
    fail(`matrix.total=${matrix.total} rows=${(matrix.rows||[]).length}; expected 213`);
  }

  // 2. Top-level counts
  const counts = matrix.counts || {};
  if (counts.INPUT_CONNECTED_PASS !== 37) {
    fail(`counts.INPUT_CONNECTED_PASS=${counts.INPUT_CONNECTED_PASS}; expected 37`);
  }
  if (counts.INPUT_CONNECTED_PARTIAL !== 176) {
    fail(`counts.INPUT_CONNECTED_PARTIAL=${counts.INPUT_CONNECTED_PARTIAL}; expected 176`);
  }

  // 3. Visual artifact integrity
  if (visual.totalForms !== 37) {
    fail(`visual.totalForms=${visual.totalForms}; expected 37`);
  }
  if (visual.fidelityCompleteEvidenced === true) {
    fail("visual artifact fidelityCompleteEvidenced===true; not allowed (no human review PASS for all 37)");
  }

  // 4. Fidelity artifact integrity
  if (fidelity.fidelityCompleteClaimed === true) {
    fail("golden layout fidelity artifact fidelityCompleteClaimed===true; not allowed");
  }

  // 5. Per-curated-row: visualPdfReviewStatus exists and is correct
  const byCode = new Map((matrix.rows || []).map((r) => [r.templateCode, r]));
  let fidelityCompleteCount = 0;
  let humanReviewedPassCount = 0;

  for (const code of CURATED_37) {
    const row = byCode.get(code);
    if (!row) fail(`curated row ${code} missing from matrix`);

    if (!row.visualPdfReviewStatus) {
      fail(`${code}: visualPdfReviewStatus not set`);
    }

    // Rule: fidelityComplete=true requires humanReviewStatus === "PASS"
    if (row.fidelityComplete === true && row.visualPdfHumanReviewStatus !== "PASS") {
      fail(`${code}: fidelityComplete=true but humanReviewStatus=${row.visualPdfHumanReviewStatus}; requires PASS`);
    }

    // Rule: humanReviewStatus=PASS requires visualPdfReviewStatus=PASS_HUMAN_REVIEWED
    if (row.visualPdfHumanReviewStatus === "PASS" && row.visualPdfReviewStatus !== "PASS_HUMAN_REVIEWED") {
      fail(`${code}: humanReviewStatus=PASS but visualPdfReviewStatus=${row.visualPdfReviewStatus}; requires PASS_HUMAN_REVIEWED`);
    }

    if (row.fidelityComplete === true) fidelityCompleteCount++;
    if (row.visualPdfHumanReviewStatus === "PASS") humanReviewedPassCount++;

    // Prior evidence preserved
    if (row.sourceRenderVerified !== true) fail(`${code}: sourceRenderVerified=${row.sourceRenderVerified}; expected true`);
    if (row.browserVerified !== true) fail(`${code}: browserVerified=${row.browserVerified}; expected true`);
    if (row.demoClickVerified !== true) fail(`${code}: demoClickVerified=${row.demoClickVerified}; expected true`);
    if (row.previewClickVerified !== true) fail(`${code}: previewClickVerified=${row.previewClickVerified}; expected true`);
    if (row.docxDownloadVerified !== true) fail(`${code}: docxDownloadVerified=${row.docxDownloadVerified}; expected true`);
    if (row.fidelityAuditStatus !== "PASS") fail(`${code}: fidelityAuditStatus=${row.fidelityAuditStatus}; expected PASS`);
    if (row.fidelityComplete === true && !row.fidelityCompleteEvidenceSource) {
      fail(`${code}: fidelityComplete=true but no fidelityCompleteEvidenceSource`);
    }
  }

  // 6. No non-curated row gets visualPdfReviewStatus
  for (const row of matrix.rows || []) {
    if (CURATED_37.has(row.templateCode)) continue; // curated — skip
    if (row.status !== "INPUT_CONNECTED_PARTIAL") continue; // only partial rows matter
    if (row.visualPdfReviewStatus) {
      fail(`non-curated partial row ${row.templateCode} has visualPdfReviewStatus=${row.visualPdfReviewStatus}; should be unset`);
    }
  }

  // 7. visualPdfFidelityStatus must be PARTIAL (not PASS — no human review for all 37)
  const visualEvidence = matrix.curated37VisualPdfEvidence || {};
  if (visualEvidence.fidelityCompleteEvidenced === true) {
    fail("matrix curated37VisualPdfEvidence.fidelityCompleteEvidenced===true; not allowed");
  }

  // 8. fidelityComplete count matches humanReviewedPass count
  if (fidelityCompleteCount !== humanReviewedPassCount) {
    fail(`fidelityCompleteCount=${fidelityCompleteCount} !== humanReviewedPassCount=${humanReviewedPassCount}`);
  }

  // 9. No FORMFLIGHT allowlist drift
  const allowlistCandidates = [
    "apps/web/src/lib/form-flight/runtime-ready-allowlist.ts",
    "apps/web/src/lib/form-flight/profile-registry.ts",
    "apps/web/src/lib/form-flight/index.ts",
  ];
  for (const rel of allowlistCandidates) {
    const p = `${ROOT}/${rel}`;
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const matches = src.match(/BM-\d{3}/g) || [];
    const uniq = [...new Set(matches)];
    const nonAllowlisted = uniq.filter((c) => c !== "BM-001" && c !== "BM-171");
    if (nonAllowlisted.length > 0) {
      fail(`runtimeReady allowlist file ${rel} references non-BM-001/BM-171 codes: ${nonAllowlisted.join(", ")}`);
    }
  }

  // 10. visualPdfFidelityStatus artifact is PARTIAL (not PASS — human review not done)
  if (visual.status === "PASS") {
    fail(`visual artifact status=${visual.status}; expected PARTIAL (human review not complete for all 37)`);
  }

  console.log(JSON.stringify({
    ok: true,
    total: 213,
    curated: 37,
    inputConnectedPass: 37,
    inputConnectedPartial: 176,
    visualPdfReviewStatusSet: 37,
    fidelityCompleteTrue: fidelityCompleteCount,
    humanReviewedPass: humanReviewedPassCount,
    visualPdfFidelityStatus: visual.status,
    fidelityCompleteEvidenced: false,
    formFlightRuntimeReadyPromoted: 0,
  }, null, 2));
  process.exit(0);
}

main();
