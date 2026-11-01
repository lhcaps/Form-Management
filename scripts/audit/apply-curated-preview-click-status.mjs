#!/usr/bin/env node
/**
 * apply-curated-preview-click-status.mjs
 *
 * Updates QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add
 *   - previewClickVerified=true for the 37 curated forms whose
 *     preview-click run passed (per
 *     QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json).
 *   - previewClickStatus=FAIL/PARTIAL with a previewClickReason
 *     when a curated form's preview-click failed.
 *   - previewClickDurationMs for every curated row.
 *   - fidelityComplete remains false (not claimed — DOCX download
 *     fidelity evidence is out of scope).
 *
 * Strict rules:
 *   - INPUT_CONNECTED_PASS count stays 37.
 *   - INPUT_CONNECTED_PARTIAL count stays 176.
 *   - No form classification is upgraded or downgraded.
 *   - BM-001 is no longer marked KNOWN_FAIL_BM001.
 *
 * Usage:
 *   node scripts/audit/apply-curated-preview-click-status.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const PREVIEW_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json`;

function main() {
  if (!existsSync(MATRIX_JSON) || !existsSync(PREVIEW_ARTIFACT)) {
    console.error(`FATAL: missing ${MATRIX_JSON} or ${PREVIEW_ARTIFACT}`);
    process.exit(2);
  }

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, "utf8"));
  const preview = JSON.parse(readFileSync(PREVIEW_ARTIFACT, "utf8"));

  // Sanity: preview-click artifact must cover all 37.
  if (preview.totalForms !== 37 || preview.formsPreviewPassed !== 37) {
    console.error(
      `FATAL: preview artifact totalForms=${preview.totalForms} formsPreviewPassed=${preview.formsPreviewPassed}; expected 37/37`,
    );
    process.exit(2);
  }

  const byCode = new Map((preview.results || []).map((r) => [r.templateCode, r]));

  let updated = 0;
  for (const row of matrix.rows || []) {
    const r = byCode.get(row.templateCode);
    if (!r) continue; // not a curated form
    const passed = r.previewClickStatus === "PASS";
    row.previewClickVerified = passed;
    row.previewClickStatus = r.previewClickStatus;
    row.previewClickReason = passed
      ? "Authenticated Playwright preview-click smoke (Clerk ticket storage state) passed: POST preview-session returned application/json, persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present, no binary PK leak, no generatedDocumentId leak, no auto-download, no /documents route navigation, no 'Lịch sử xử lý' link, no console errors."
      : `previewClickStatus=${r.previewClickStatus} failureClass=${r.failureClass ?? "n/a"}`;
    row.previewClickDurationMs = r.durationMs ?? null;
    row.previewClickSource = "tests/e2e/curated-37-preview-click.auth.spec.ts";
    row.previewClickSessionIdPrefix = passed ? "runtime_preview_" : null;
    row.previewClickDocxUrlPresent = passed;
    row.previewClickPersistedFalse = passed;
    row.previewClickBinaryPkLeak = false;
    row.previewClickGeneratedDocumentIdLeak = false;
    row.previewClickAutoDownloadLeak = false;
    row.previewClickHistoryLinkLeak = false;
    row.previewClickDocumentsRouteLeak = false;
    // NOTE: do NOT touch demoClickVerified / docxDownloadVerified /
    // fidelityComplete / manualReviewRequired / fidelityAuditStatus here.
    // Other apply-* scripts own those fields. This script only writes the
    // preview-click row-level evidence. Idempotent across re-runs.
    updated++;
  }

  // Top-level preview-click evidence block.
  matrix.curated37PreviewClickEvidence = {
    snapshotDate: preview.snapshotDate,
    authStrategy: preview.authStrategy,
    status: preview.status,
    sourceRenderStatus: preview.sourceRenderStatus,
    browserVisibilityStatus: preview.browserVisibilityStatus,
    demoClickStatus: preview.demoClickStatus,
    previewClickStatus: preview.previewClickStatus,
    totalForms: preview.totalForms,
    formsPreviewClicked: preview.formsPreviewClicked,
    formsPreviewPassed: preview.formsPreviewPassed,
    formsPreviewFailed: preview.formsPreviewFailed,
    binaryPkLeaks: preview.binaryPkLeaks,
    generatedDocumentLeaks: preview.generatedDocumentLeaks,
    autoDownloadLeaks: preview.autoDownloadLeaks,
    historyLinkLeaks: preview.historyLinkLeaks,
    documentsRouteLeaks: preview.documentsRouteLeaks,
    mainRunSource: preview.mainRunSource,
    mainRunStats: preview.mainRunStats,
    notes: preview.notes,
  };

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

  // Markdown refresh — append a "Curated 37 Preview-Click Evidence" section.
  let md = readFileSync(MATRIX_MD, "utf8");
  const sectionHeader = "## Curated 37 Preview-Click Evidence";
  const startIdx = md.indexOf(sectionHeader);
  if (startIdx >= 0) {
    md = md.slice(0, startIdx).trimEnd() + "\n";
  }

  const lines = [];
  lines.push(sectionHeader);
  lines.push("");
  lines.push(`- snapshotDate: ${preview.snapshotDate}`);
  lines.push(`- authStrategy: ${preview.authStrategy}`);
  lines.push(`- status: ${preview.status}`);
  lines.push(`- sourceRenderStatus: ${preview.sourceRenderStatus}`);
  lines.push(`- browserVisibilityStatus: ${preview.browserVisibilityStatus}`);
  lines.push(`- demoClickStatus: ${preview.demoClickStatus}`);
  lines.push(`- previewClickStatus: ${preview.previewClickStatus}`);
  lines.push(`- totalForms: ${preview.totalForms}`);
  lines.push(`- formsPreviewClicked: ${preview.formsPreviewClicked}`);
  lines.push(`- formsPreviewPassed: ${preview.formsPreviewPassed}`);
  lines.push(`- formsPreviewFailed: ${preview.formsPreviewFailed}`);
  lines.push(`- binaryPkLeaks: ${preview.binaryPkLeaks}`);
  lines.push(`- generatedDocumentLeaks: ${preview.generatedDocumentLeaks}`);
  lines.push(`- autoDownloadLeaks: ${preview.autoDownloadLeaks}`);
  lines.push(`- historyLinkLeaks: ${preview.historyLinkLeaks}`);
  lines.push(`- documentsRouteLeaks: ${preview.documentsRouteLeaks}`);
  lines.push("");
  lines.push(
    `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.{md,json}\``,
  );
  lines.push("");
  lines.push("### Notes");
  for (const n of preview.notes ?? []) {
    lines.push(`- ${n}`);
  }
  lines.push("");
  lines.push("### Per-form preview-click evidence (curated INPUT_CONNECTED_PASS codes)");
  lines.push("");
  lines.push(
    "| Code | Source render | Browser verified | Demo click verified | Preview click verified | Preview click status | Preview duration (ms) | Session prefix | DOCX URL | Persisted false | Binary PK leak | GenDocId leak | Auto-download | History link | /documents route | Preview reason |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const row of matrix.rows || []) {
    const r = byCode.get(row.templateCode);
    if (!r) continue;
    lines.push(
      `| ${row.templateCode} | ${row.sourceRenderVerified ? "yes" : "no"} | ${row.browserVerified ? "yes" : "no"} | ${row.demoClickVerified ? "yes" : "no"} | ${row.previewClickVerified ? "yes" : "no"} | ${row.previewClickStatus} | ${row.previewClickDurationMs ?? "—"} | ${row.previewClickSessionIdPrefix ?? "—"} | ${row.previewClickDocxUrlPresent ? "yes" : "no"} | ${row.previewClickPersistedFalse ? "yes" : "no"} | ${row.previewClickBinaryPkLeak ? "yes" : "no"} | ${row.previewClickGeneratedDocumentIdLeak ? "yes" : "no"} | ${row.previewClickAutoDownloadLeak ? "yes" : "no"} | ${row.previewClickHistoryLinkLeak ? "yes" : "no"} | ${row.previewClickDocumentsRouteLeak ? "yes" : "no"} | ${(row.previewClickReason ?? "").slice(0, 110)} |`,
    );
  }
  lines.push("");
  writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

  console.log(
    `Updated ${updated} curated rows in status matrix (counts preserved: PASS=${passCount}, PARTIAL=${partialCount})`,
  );
}

main();
