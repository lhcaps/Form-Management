#!/usr/bin/env node
/**
 * apply-all-curated-evidence.mjs
 *
 * Orchestrates the curated-37 evidence apply pipeline in a strict, idempotent
 * order so that every curated INPUT_CONNECTED_PASS row simultaneously holds:
 *
 *   browserVerified=true  (set by status-matrix-213.mjs from
 *                          QLLAW_CURATED_BROWSER_SMOKE.latest.json)
 *   demoClickVerified=true
 *   previewClickVerified=true
 *   docxDownloadVerified=true
 *   fidelityAuditStatus=PASS
 *   fidelityComplete=false          (manual/PDF review still required)
 *   manualReviewRequired=true
 *
 * Run order:
 *   1. status-matrix-213.mjs          (regenerates the full 213-row matrix
 *                                      from the linkage + smoke artifacts,
 *                                      then re-applies browser evidence)
 *   2. apply-curated-demo-click-status.mjs
 *   3. apply-curated-preview-click-status.mjs
 *   4. apply-curated-docx-download-status.mjs
 *   5. apply-curated-fidelity-status.mjs
 *
 * Each apply-* script only writes its own fields and never resets evidence
 * owned by other steps. status-matrix-213.mjs is run first so the row-level
 * evidence (browser/demo/preview/fidelity) defaults are seeded consistently,
 * but it intentionally only seeds browserVerified from
 * QLLAW_CURATED_BROWSER_SMOKE.latest.json — the rest is filled in by the
 * downstream apply scripts.
 *
 * This orchestrator is idempotent: re-running it preserves all flags.
 *
 * Usage:
 *   node scripts/audit/apply-all-curated-evidence.mjs
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");

const STEPS = [
  "scripts/audit/status-matrix-213.mjs",
  "scripts/audit/apply-curated-demo-click-status.mjs",
  "scripts/audit/apply-curated-preview-click-status.mjs",
  "scripts/audit/apply-curated-docx-download-status.mjs",
  "scripts/audit/apply-curated-fidelity-status.mjs",
];

let ok = true;
for (const s of STEPS) {
  console.log(`--- ${s} ---`);
  const env = s.endsWith("status-matrix-213.mjs")
    ? { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "0" }
    : process.env;
  const r = spawnSync(process.execPath, [s], {
    cwd: ROOT,
    stdio: "inherit",
    env,
  });
  if (r.status !== 0) {
    console.error(`FATAL: ${s} exited with status ${r.status}`);
    ok = false;
    break;
  }
}

process.exit(ok ? 0 : 1);
