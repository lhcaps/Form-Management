#!/usr/bin/env node
/**
 * apply-curated-demo-click-status.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add
 *   - demoClickVerified=true  for the 37 curated forms whose demo-click
 *     run passed (per QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.json).
 *   - demoClickReason         when a curated form's demo-click failed.
 *   - previewClickVerified=false (unchanged; BM-001 preview bug out of scope).
 *   - fidelityComplete=false  (unchanged; not claimed).
 *
 * Strict rules:
 *   - INPUT_CONNECTED_PASS count stays 37.
 *   - INPUT_CONNECTED_PARTIAL count stays 176.
 *   - No form classification is upgraded or downgraded.
 *
 * Usage:
 *   node scripts/audit/apply-curated-demo-click-status.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const DEMO_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.json`;

function main() {
  if (!existsSync(MATRIX_JSON) || !existsSync(DEMO_ARTIFACT)) {
    console.error(`FATAL: missing ${MATRIX_JSON} or ${DEMO_ARTIFACT}`);
    process.exit(2);
  }

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
  const demo = JSON.parse(readFileSync(DEMO_ARTIFACT, "utf8"));

  // Verify the curated set matches what we claim.
  const expectedCurated = 37;
  const expectedPass = 37;
  if (demo.totalForms !== expectedCurated || demo.formsDemoPassed !== expectedPass) {
    console.error(
      `FATAL: demo artifact totalForms=${demo.totalForms} formsDemoPassed=${demo.formsDemoPassed}; expected ${expectedCurated}/${expectedPass}`,
    );
    process.exit(2);
  }

  const byCode = new Map((demo.results || []).map((r) => [r.templateCode, r]));

  let updated = 0;
  for (const row of matrix.rows || []) {
    const r = byCode.get(row.templateCode);
    if (!r) continue; // not a curated form
    const passed = r.demoClickStatus === "PASS";
    row.demoClickVerified = passed;
    row.demoClickStatus = r.demoClickStatus;
    row.demoClickReason = r.demoClickStatus === "PASS"
      ? "Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code."
      : `demoClickStatus=${r.demoClickStatus} failureClass=${r.failureClass ?? "n/a"}`;
    row.demoClickDurationMs = r.durationMs ?? null;
    row.demoClickSource = "tests/e2e/curated-37-demo-click.auth.spec.ts";
    // NOTE: do NOT touch previewClickVerified / docxDownloadVerified /
    // fidelityComplete / manualReviewRequired / fidelityAuditStatus here.
    // Other apply-* scripts own those fields. This script only writes the
    // demo-click row-level evidence. Idempotent across re-runs.
    updated++;
  }

  // Top-level demo-click evidence block.
  matrix.curated37DemoClickEvidence = {
    snapshotDate: demo.snapshotDate,
    authStrategy: demo.authStrategy,
    status: demo.status,
    sourceRenderStatus: demo.sourceRenderStatus,
    browserVisibilityStatus: demo.browserVisibilityStatus,
    demoClickStatus: demo.demoClickStatus,
    previewClickStatus: demo.previewClickStatus,
    totalForms: demo.totalForms,
    formsDemoClicked: demo.formsDemoClicked,
    formsDemoPassed: demo.formsDemoPassed,
    formsDemoFailed: demo.formsDemoFailed,
    staleTokenHits: demo.staleTokenHits,
    mainRunSource: demo.mainRunSource,
    rerunSource: demo.rerunSource,
    mainRunStats: demo.mainRunStats,
    rerunStats: demo.rerunStats,
    notes: demo.notes,
  };

  // Snapshot date refresh.
  matrix.snapshotDate = new Date().toISOString();

  // Counts are preserved for this script's scope. Later source/render batches
  // may increase PASS beyond the older 57/77 baselines.
  const passCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PASS",
  ).length;
  const partialCount = (matrix.rows || []).filter(
    (r) => r.status === "INPUT_CONNECTED_PARTIAL",
  ).length;
  // Either 57 (existing only) or 77 (existing + batch 4 source/render).
  if (passCount < 57 || partialCount > 156) {
    console.error(
      `FATAL: count drift detected INPUT_CONNECTED_PASS=${passCount} (expected at least 57), INPUT_CONNECTED_PARTIAL=${partialCount} (expected at most 156)`,
    );
    process.exit(2);
  }

  writeFileSync(MATRIX_JSON, JSON.stringify(matrix, null, 2));

  // Markdown refresh — append a "Curated 37 Demo-Click Evidence" section.
  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Curated 37 Demo-Click Evidence";
  // Drop any prior section so re-runs stay idempotent.
  const startIdx = md.indexOf(sectionHeader);
  if (startIdx >= 0) {
    md = md.slice(0, startIdx).trimEnd() + "\n";
  }

  // Resolve previewClickStatus from the dedicated preview-click artifact
  // when available — the demo-click artifact can carry a legacy/older
  // previewClickStatus (e.g. KNOWN_FAIL_BM001 from before the BM-001 fix)
  // that becomes stale once preview-click evidence is updated.
  const PREVIEW_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json`;
  let resolvedPreviewClickStatus = demo.previewClickStatus;
  if (existsSync(PREVIEW_ARTIFACT)) {
    try {
      const previewArtifact = JSON.parse(readFileSync(PREVIEW_ARTIFACT, "utf8"));
      if (previewArtifact?.previewClickStatus) {
        resolvedPreviewClickStatus = previewArtifact.previewClickStatus;
      }
    } catch {
      // Keep demo artifact's status on parse failure.
    }
  }

  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${demo.snapshotDate}`);
  lines.push(`- authStrategy: ${demo.authStrategy}`);
  lines.push(`- status: ${demo.status}`);
  lines.push(`- sourceRenderStatus: ${demo.sourceRenderStatus}`);
  lines.push(`- browserVisibilityStatus: ${demo.browserVisibilityStatus}`);
  lines.push(`- demoClickStatus: ${demo.demoClickStatus}`);
  lines.push(`- previewClickStatus: ${resolvedPreviewClickStatus}`);
  lines.push(`- totalForms: ${demo.totalForms}`);
  lines.push(`- formsDemoClicked: ${demo.formsDemoClicked}`);
  lines.push(`- formsDemoPassed: ${demo.formsDemoPassed}`);
  lines.push(`- formsDemoFailed: ${demo.formsDemoFailed}`);
  lines.push(`- staleTokenHits: ${demo.staleTokenHits}`);
  lines.push("");
  lines.push(
    `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.{md,json}\``,
  );
  lines.push("");
  lines.push("### Notes");
  for (const n of demo.notes ?? []) {
    lines.push(`- ${n}`);
  }
  lines.push("");
  lines.push("### Per-form demo-click evidence (curated INPUT_CONNECTED_PASS codes)");
  lines.push("");
  lines.push(
    "| Code | Source render | Browser verified | Demo click verified | Demo click status | Demo duration (ms) | Demo reason |",
  );
  lines.push("|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    const r = byCode.get(row.templateCode);
    if (!r) continue;
    lines.push(
      `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.demoClickStatus} | ${row.demoClickDurationMs ?? "—"} | ${row.demoClickReason ?? ""} |`,
    );
  }
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

  console.log(`Updated ${updated} curated rows in status matrix (counts preserved: PASS=${passCount}, PARTIAL=${partialCount})`);
}

main();
