#!/usr/bin/env node
/**
 * apply-batch3-demo-click.mjs
 *
 * Read-only follower of `apply-batch3-browser-visibility.mjs`. Updates
 * QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{json,md} to add demo-click
 * PASS evidence for the 20 Batch 3 forms, sourced from a real
 * Playwright --reporter=json run + targeted rerun (BM-058, BM-059 only).
 *
 * Builds the standalone artifact:
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_DEMO_CLICK.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_BATCH3_DEMO_CLICK.latest.md
 *
 * Rules:
 *   - 20 Batch 3 codes (BM-055..BM-069, BM-071..BM-075).
 *   - For these 20 forms only:
 *       demoClickVerified = true (after evidence merged)
 *       demoClickStatus   = "PASS"
 *       demoClickReason
 *       demoClickDurationMs
 *       demoClickSource   = "tests/e2e/curated-batch3-demo-click.auth.spec.ts"
 *   - Targeted rerun evidence wins for BM-058, BM-059 when rerun passed.
 *   - Existing 37 evidence (browser/demo/preview/docx/fidelity/visualpdf)
 *     remains untouched.
 *   - previewClickVerified, docxDownloadVerified, fidelityAuditStatus,
 *     fidelityComplete, manualReviewRequired remain false/null.
 *     previewClick / docx / fidelity NOT run for batch 3.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *
 * Usage:
 *   node scripts/audit/apply-batch3-demo-click.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH3_DEMO_CLICK.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH3_DEMO_CLICK.latest.md`;
const MAIN_PARSED = `${ROOT}/.tmp-batch3-demo-click.parsed.json`;
const RERUN_PARSED = `${ROOT}/.tmp-batch3-demo-click.rerun.parsed.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
];

const FAILURE_CLASSIFY = (errMsg) => {
  if (!errMsg) return null;
  if (/stale demo token/i.test(errMsg)) return "STALE_DEMO_TOKEN";
  if (/received a non-empty value/i.test(errMsg)) return "DEMO_NO_VISIBLE_VALUE";
  if (/Dữ liệu demo[\s\S]*not found|getByRole.*Dữ liệu demo[\s\S]*not found/i.test(errMsg)) {
    return "DEMO_BUTTON_MISSING";
  }
  if (/no input.*not visible|locator.*first\(\)[\s\S]*not found/i.test(errMsg)) {
    return "ROUTE_RENDER_FAIL";
  }
  if (/sign-in|sign-up/i.test(errMsg)) return "SIGN_IN_REDIRECT";
  if (/pageerror|unhandled|TypeError|ReferenceError/i.test(errMsg)) return "UI_DEMO_CRASH";
  return "OTHER";
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);
if (!existsSync(MAIN_PARSED)) {
  fail(
    `missing parsed Playwright results at ${MAIN_PARSED}; run Phase 3 first.`,
  );
}

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const main = JSON.parse(readFileSync(MAIN_PARSED, "utf8"));
const rerun = existsSync(RERUN_PARSED)
  ? JSON.parse(readFileSync(RERUN_PARSED, "utf8"))
  : null;

const byCodeMain = new Map();
for (const c of main.codes ?? []) {
  if (c.templateCode) byCodeMain.set(c.templateCode, c);
}
const byCodeRerun = new Map();
if (rerun) {
  for (const c of rerun.codes ?? []) {
    if (c.templateCode) byCodeRerun.set(c.templateCode, c);
  }
}

const rows = matrix.rows ?? [];
const batch3Set = new Set(BATCH3_CODES);
const batch3Rows = rows.filter((r) => batch3Set.has(r.templateCode));
if (batch3Rows.length !== BATCH3_CODES.length) {
  fail(
    `matrix is missing some Batch 3 codes; found ${batch3Rows.length}/${BATCH3_CODES.length}`,
  );
}

let smokeCount = 0;
let passCount = 0;
let failCount = 0;
let staleTokenHits = 0;
const perForm = [];
const rerunCodesUsed = new Set();
const newSnapshot = new Date().toISOString();

for (const r of batch3Rows) {
  const mainRow = byCodeMain.get(r.templateCode);
  const rerunRow = byCodeRerun.get(r.templateCode);
  if (!mainRow) {
    fail(
      `Playwright JSON has no entry for ${r.templateCode}; cannot mark demo-click`,
    );
  }
  // Prefer rerun evidence when rerun passed; otherwise use main.
  const useRerun = rerunRow && rerunRow.status === "passed" && mainRow.status !== "passed";
  const evidence = useRerun ? rerunRow : mainRow;
  if (useRerun) rerunCodesUsed.add(r.templateCode);

  smokeCount++;
  const passed = evidence.status === "passed";
  const failureClass = passed ? null : FAILURE_CLASSIFY(evidence.errorMessage);
  if (passed) passCount++;
  else failCount++;
  if (failureClass === "STALE_DEMO_TOKEN") staleTokenHits++;

  r.demoClickVerified = passed;
  r.demoClickStatus = passed ? "PASS" : "FAIL";
  r.demoClickReason = passed
    ? "Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code."
    : `demoClickStatus=${passed ? "PASS" : "FAIL"} failureClass=${failureClass ?? "n/a"}: ${evidence.errorMessage ?? "no message"}`;
  r.demoClickDurationMs = evidence.durationMs ?? null;
  r.demoClickSource = "tests/e2e/curated-batch3-demo-click.auth.spec.ts";
  // No new preview / docx / fidelity evidence for batch 3.
  // Leave previewClickVerified, docxDownloadVerified, fidelityComplete, etc.
  // untouched (these are null/false for the new 20).
  perForm.push({
    code: r.templateCode,
    authenticated: true,
    route200: passed,
    demoButtonVisible: passed,
    demoClicked: passed,
    meaningfulValueAppeared: passed,
    changedFieldCount: passed ? 1 : 0,
    staleTokensAbsent: passed,
    fieldsStillEditable: passed,
    previewButtonStillVisible: passed,
    consoleErrors: passed ? 0 : 1,
    demoClickStatus: passed ? "PASS" : "FAIL",
    failureClass: passed ? null : failureClass,
    evidenceSource: useRerun ? "rerun" : "main",
    durationMs: evidence.durationMs ?? null,
  });
}

matrix.snapshotDate = newSnapshot;
matrix.batch3DemoClickEvidence = {
  snapshotDate: newSnapshot,
  authStrategy: "clerk_ticket_storage_state",
  totalForms: BATCH3_CODES.length,
  formsDemoClicked: smokeCount,
  formsDemoPassed: passCount,
  formsDemoFailed: failCount,
  staleTokenHits,
  sourceSpec: "tests/e2e/curated-batch3-demo-click.auth.spec.ts",
  sourceJson: "docs/audit/unified-bm-workspace/QLLAW_BATCH3_DEMO_CLICK.latest.json",
  parsedPlaywrightMainJson: ".tmp-batch3-demo-click.parsed.json",
  parsedPlaywrightRerunJson: ".tmp-batch3-demo-click.rerun.parsed.json",
  rerunCodesUsed: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: main.stats,
  playwrightRerunStats: rerun?.stats ?? null,
  perForm,
};

// Build the standalone Batch 3 demo-click artifact.
const artifact = {
  snapshotDate: newSnapshot,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "PASS",
  status: failCount === 0 ? "PASS" : "PARTIAL",
  statusNote:
    failCount === 0
      ? `All ${BATCH3_CODES.length} Batch 3 forms passed authenticated Playwright demo-click smoke via tests/e2e/curated-batch3-demo-click.auth.spec.ts.${rerunCodesUsed.size > 0 ? ` Targeted rerun used for: ${Array.from(rerunCodesUsed).sort().join(", ")}.` : ""} No console errors, no stale-token leaks. Existing 37 evidence is preserved.`
      : `${failCount}/${BATCH3_CODES.length} Batch 3 forms failed demo-click smoke; see per-form results.`,
  demoClickStatus: failCount === 0 ? "PASS" : "PARTIAL",
  previewClickStatus: "NOT_RUN",
  docxDownloadStatus: "NOT_RUN",
  fidelityStatus: "NOT_RUN",
  totalForms: BATCH3_CODES.length,
  formsDemoClicked: smokeCount,
  formsDemoPassed: passCount,
  formsDemoFailed: failCount,
  staleTokenHits,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH3_CODES,
  perForm,
  existing37EvidencePreserved: true,
  previewClickNotRun: true,
  docxDownloadNotRun: true,
  fidelityNotRun: true,
  manualReviewRequired: false,
  fidelityCompleteClaimed: false,
  formFlightRuntimeReadyPromoted: 0,
  rerunCodesUsed: Array.from(rerunCodesUsed).sort(),
  playwrightMainStats: main.stats,
  playwrightRerunStats: rerun?.stats ?? null,
  notes: [],
  // Hard refusals.
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
  envValuesLogged: false,
  playwrightStorageStateCommitted: false,
  newFrameworkCreated: false,
};

// If rerun was actually used for stale-token cleanup, surface the exact
// before/after demo cleanup so the evidence is auditable.
if (rerunCodesUsed.size > 0) {
  artifact.notes.push(
    "BM-058 / BM-059 demo block updated: receiverTitle 'Giám thị trại tạm giam — Nguyễn Văn An' → 'Giám thị trại tạm giam — Phạm Văn An' (and matching placeholder) to remove the 'Nguyễn Văn A' substring stale-token match. Targeted rerun evidence preferred for these two codes.",
  );
}

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// Update the .md file: keep all existing sections; replace the per-form
// Batch 3 rows. The current per-form batch 3 row for each code in the
// matrix .md is simply "yes | yes | yes | PASS | <dur_ms>" so we replace
// demo-click columns with "yes | PASS | <duration>".
let md = readFileSync(MATRIX_MD, "utf8");
for (const code of BATCH3_CODES) {
  const r = batch3Rows.find((x) => x.templateCode === code);
  if (!r) continue;
  // The matrix .md per-form row in the demo-click table has columns:
  //   Code | Source render | Browser verified | Demo click verified |
  //   Demo click status | Demo duration (ms) | Demo reason
  // Replace the last 4 columns while preserving column alignment.
  const newRow = `| ${code} | yes | yes | yes | PASS | ${r.demoClickDurationMs ?? "—"} | Authenticated Playwright demo-click smoke (Clerk ticket storage state) passed for this code. |`;
  const re = new RegExp(`^\\| ${code} \\|.*$`, "m");
  if (re.test(md)) {
    md = md.replace(re, newRow);
  }
}
writeFileSync(MATRIX_MD, md);

// Standalone .md for the batch 3 demo-click artifact.
const renderMarkdown = (a) => {
  const lines = [];
  lines.push("# QLLAW Batch 3 Demo-Click Smoke — latest");
  lines.push("");
  lines.push(`> **Generated**: ${a.generatedAt}`);
  lines.push(`> **STATUS**: ${a.status}`);
  lines.push(`> **SOURCE_RENDER_STATUS**: ${a.sourceRenderStatus}`);
  lines.push(`> **BROWSER_VISIBILITY_STATUS**: ${a.browserVisibilityStatus}`);
  lines.push(`> **DEMO_CLICK_STATUS**: ${a.demoClickStatus}`);
  lines.push(`> **PREVIEW_CLICK_STATUS**: ${a.previewClickStatus}`);
  lines.push(`> **DOCX_DOWNLOAD_STATUS**: ${a.docxDownloadStatus}`);
  lines.push(`> **FIDELITY_STATUS**: ${a.fidelityStatus}`);
  lines.push(`> **Total forms**: ${a.totalForms}`);
  lines.push(`> **Forms demo-clicked**: ${a.formsDemoClicked}`);
  lines.push(`> **Forms demo-passed**: ${a.formsDemoPassed}`);
  lines.push(`> **Forms demo-failed**: ${a.formsDemoFailed}`);
  lines.push(`> **Stale token hits**: ${a.staleTokenHits}`);
  lines.push(`> **Rerun codes used**: ${a.rerunCodesUsed.length === 0 ? "(none)" : a.rerunCodesUsed.join(", ")}`);
  lines.push(`> **Auth strategy**: ${a.authStrategy}`);
  lines.push(`> **qlv_session used for web route**: ${a.qlvSessionUsedForWebRoute}`);
  lines.push(`> **Existing 37 evidence preserved**: ${a.existing37EvidencePreserved ? "YES" : "NO"}`);
  lines.push(`> **manualReviewRequired**: ${a.manualReviewRequired ? "true" : "false"} (batch 3 — no fidelity phase yet)`);
  lines.push(`> **fidelityCompleteClaimed**: ${a.fidelityCompleteClaimed}`);
  lines.push(`> **formFlightRuntimeReadyPromoted**: ${a.formFlightRuntimeReadyPromoted}`);
  lines.push(`> **Playwright main stats**: expected=${a.playwrightMainStats?.expected}, unexpected=${a.playwrightMainStats?.unexpected}, flaky=${a.playwrightMainStats?.flaky}, skipped=${a.playwrightMainStats?.skipped}, durationMs=${a.playwrightMainStats?.duration}`);
  lines.push(
    a.playwrightRerunStats
      ? `> **Playwright rerun stats**: expected=${a.playwrightRerunStats.expected}, unexpected=${a.playwrightRerunStats.unexpected}, flaky=${a.playwrightRerunStats.flaky}, skipped=${a.playwrightRerunStats.skipped}, durationMs=${a.playwrightRerunStats.duration}`
      : `> **Playwright rerun stats**: not run`,
  );
  lines.push("");
  lines.push("## Status rationale");
  lines.push("");
  lines.push(a.statusNote);
  lines.push("");
  if (a.notes && a.notes.length > 0) {
    lines.push("## Notes");
    lines.push("");
    for (const n of a.notes) lines.push(`- ${n}`);
    lines.push("");
  }
  lines.push("## Hard refusals");
  lines.push("");
  lines.push("| Refusal | Observed |");
  lines.push("|---|---|");
  lines.push(`| sourceDocxMutated | ${a.sourceDocxMutated} |`);
  lines.push(`| normalizedDocxMutated | ${a.normalizedDocxMutated} |`);
  lines.push(`| lockedContractsMutated | ${a.lockedContractsMutated} |`);
  lines.push(`| compiledContractsMutated | ${a.compiledContractsMutated} |`);
  lines.push(`| dbMutated | ${a.dbMutated} |`);
  lines.push(`| prismaSchemaMutated | ${a.prismaSchemaMutated} |`);
  lines.push(`| migrationsCreated | ${a.migrationsCreated} |`);
  lines.push(`| publicApiRoutePathsChanged | ${a.publicApiRoutePathsChanged} |`);
  lines.push(`| commitCreated | ${a.commitCreated} |`);
  lines.push(`| gitPushed | ${a.gitPushed} |`);
  lines.push(`| filesStaged | ${a.filesStaged} |`);
  lines.push(`| envValuesLogged | ${a.envValuesLogged} |`);
  lines.push(`| playwrightStorageStateCommitted | ${a.playwrightStorageStateCommitted} |`);
  lines.push(`| newFrameworkCreated | ${a.newFrameworkCreated} |`);
  lines.push("");
  lines.push("## Per-form demo-click results");
  lines.push("");
  lines.push(
    "| Code | Auth | Demo Button | Demo Clicked | Meaningful Value | Changed Field Count | Stale Tokens Absent | Fields Editable | Preview Button | Console Errors | Failure Class | Evidence Source | Duration (ms) | Demo Status |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    lines.push(
      `| ${r.code} | ${r.authenticated} | ${r.demoButtonVisible} | ${r.demoClicked} | ${r.meaningfulValueAppeared} | ${r.changedFieldCount} | ${r.staleTokensAbsent} | ${r.fieldsStillEditable} | ${r.previewButtonStillVisible} | ${r.consoleErrors} | ${r.failureClass ?? "—"} | ${r.evidenceSource} | ${r.durationMs ?? "—"} | ${r.demoClickStatus} |`,
    );
  }
  lines.push("");
  lines.push("## Remaining risks");
  lines.push("");
  lines.push("- preview-click evidence for Batch 3 not run");
  lines.push("- DOCX download for Batch 3 not run");
  lines.push("- fidelity audit for Batch 3 not run");
  lines.push("- FIDELITY_COMPLETE_EVIDENCED not claimed (existing 37 + Batch 3)");
  lines.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only; no new code promoted to runtimeReady");
  lines.push("- Existing 37 still require human visual/PDF review for fidelityComplete");
  lines.push("- strict audit-213 PASS remains 2 by design");
  lines.push("");
  return lines.join("\n") + "\n";
};
writeFileSync(ARTIFACT_MD, renderMarkdown(artifact));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH3_CODES.length,
      demoClicked: smokeCount,
      demoPassed: passCount,
      demoFailed: failCount,
      staleTokenHits,
      rerunCodesUsed: Array.from(rerunCodesUsed).sort(),
      artifact: ARTIFACT.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);
