#!/usr/bin/env node
/**
 * One-time patch for the 3 targeted codes in the status matrix.
 *
 * curated-22-browser-smoke.mjs sets browserVerified / browserVerifiedReason
 * but does not refresh browserVerifiedStatus / browserVerifiedDurationMs
 * per row (the helper takes those fields from the run only when the smoke
 * script computed the original matrix, not from the per-form evidence).
 *
 * For BM-048/BM-052/BM-053 the matrix was generated with stale
 *   status=failed, durationMs=21370-21960
 * from the original full Playwright run. After the targeted rerun replaced
 * the 3 rows in .visibility-run.latest.json with status=passed +
 * durationMs=1384-1465, the matrix's per-row fields were not refreshed.
 *
 * This script only updates the 3 BM-NNN rows. It does NOT change the
 * browserVerified / browserVerifiedReason / sourceRenderVerified fields
 * the smoke script set; those were already correct (true / "passed").
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const MATRIX = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const TARGETED = `${ROOT}/docs/audit/unified-bm-workspace/.visibility-run.targeted.latest.json`;

const TARGETED_CODES = ["BM-048", "BM-052", "BM-053"];

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const targeted = JSON.parse(readFileSync(TARGETED, "utf8"));
const byCode = new Map();
for (const row of targeted.codes) {
  if (row.templateCode) byCode.set(row.templateCode, row);
}

let patched = 0;
for (const row of matrix.rows ?? []) {
  if (!TARGETED_CODES.includes(row.templateCode)) continue;
  const tr = byCode.get(row.templateCode);
  if (!tr) {
    throw new Error(
      `Targeted run did not contain ${row.templateCode}; cannot patch.`,
    );
  }
  const before = {
    status: row.browserVerifiedStatus,
    durationMs: row.browserVerifiedDurationMs,
  };
  row.browserVerifiedStatus = tr.status; // "passed"
  row.browserVerifiedDurationMs = tr.durationMs;
  console.log(
    `${row.templateCode}: status ${before.status} -> ${row.browserVerifiedStatus}, ` +
      `durationMs ${before.durationMs} -> ${row.browserVerifiedDurationMs}`,
  );
  patched++;
}

if (patched !== TARGETED_CODES.length) {
  throw new Error(
    `Expected to patch ${TARGETED_CODES.length} rows; patched ${patched}.`,
  );
}

matrix.snapshotDate = new Date().toISOString();
matrix.targetedRerun = {
  snapshotDate: new Date().toISOString(),
  patchedRows: TARGETED_CODES,
  sourceJson: TARGETED,
  note: "Refreshed per-row browserVerifiedStatus and browserVerifiedDurationMs for the 3 targeted codes from the targeted Playwright rerun. Other matrix fields are unchanged.",
};

writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));
console.log(JSON.stringify({ patched, sourceJson: TARGETED }, null, 2));
