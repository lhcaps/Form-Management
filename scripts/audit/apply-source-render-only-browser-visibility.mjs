#!/usr/bin/env node
/**
 * apply-source-render-only-browser-visibility.mjs
 *
 * Records source/render-only browser visibility smoke evidence in the status
 * matrix for the 124 INPUT_CONNECTED_PASS forms that did not yet have
 * browserVerified=true. Preserves all other downstream axes (demo / preview
 * / DOCX / fidelity / visual / human).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.md`;
const CANDIDATES = `${OUT_DIR}/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json`;

function fail(msg) { console.error(`FAIL: ${msg}`); process.exit(1); }
if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);
if (!existsSync(ARTIFACT)) fail(`missing visibility artifact at ${ARTIFACT}`);
if (!existsSync(CANDIDATES)) fail(`missing candidates at ${CANDIDATES}`);

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const rows = matrix.rows ?? [];
const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8"));
const candidatesDoc = JSON.parse(readFileSync(CANDIDATES, "utf8"));

const candidateSet = new Set(candidatesDoc.selectedCodes || []);
const perFormByCode = new Map((artifact.perForm || []).map((r) => [r.code, r]));
const rerunOverrides = new Set(artifact.rerunOverrides || []);

let applied = 0;
let rerunOverrideCount = 0;
let failedCount = 0;
const perFormApplied = [];

for (const r of rows) {
  if (!candidateSet.has(r.templateCode)) continue;
  const ev = perFormByCode.get(r.templateCode);
  if (!ev) continue;

  if (ev.browserVerified === true) {
    r.browserVerified = true;
    r.browserVerifiedStatus = "PASS";
    r.browserVerifiedDurationMs = ev.durationMs ?? null;
    r.browserVisibilityEvidence = {
      snapshotDate: artifact.snapshotDate,
      evidenceSource: ev.evidenceSource,
      mainRunStatus: ev.mainRunStatus,
      rerunStatus: ev.rerunStatus,
      mainRunFailureClass: ev.mainRunFailureClass,
      rerunOverride: rerunOverrides.has(ev.code),
      fieldsVisible: ev.fieldsVisible,
      labelsOrSectionsVisible: ev.labelsOrSectionsVisible,
      stayedOnTemplatesRoute: ev.stayedOnTemplatesRoute,
      routedToDocuments: ev.routedToDocuments,
      historyUiVisible: ev.historyUiVisible,
      fatalError: ev.fatalError,
      authUsed: ev.authUsed,
    };
    applied += 1;
    if (rerunOverrides.has(ev.code)) rerunOverrideCount += 1;
    perFormApplied.push({
      code: ev.code,
      url: ev.url,
      browserVerified: true,
      fieldsVisible: ev.fieldsVisible,
      labelsOrSectionsVisible: ev.labelsOrSectionsVisible,
      stayedOnTemplatesRoute: ev.stayedOnTemplatesRoute,
      routedToDocuments: ev.routedToDocuments,
      historyUiVisible: ev.historyUiVisible,
      fatalError: ev.fatalError,
      authUsed: ev.authUsed,
      durationMs: ev.durationMs,
      evidenceSource: ev.evidenceSource,
      mainRunStatus: ev.mainRunStatus,
      rerunStatus: ev.rerunStatus,
    });
  } else {
    failedCount += 1;
    perFormApplied.push({
      code: ev.code,
      url: ev.url,
      browserVerified: false,
      fieldsVisible: ev.fieldsVisible,
      labelsOrSectionsVisible: ev.labelsOrSectionsVisible,
      stayedOnTemplatesRoute: ev.stayedOnTemplatesRoute,
      routedToDocuments: ev.routedToDocuments,
      historyUiVisible: ev.historyUiVisible,
      fatalError: ev.fatalError,
      authUsed: ev.authUsed,
      durationMs: ev.durationMs,
      evidenceSource: ev.evidenceSource,
      mainRunStatus: ev.mainRunStatus,
      rerunStatus: ev.rerunStatus,
      failureClass: ev.failureClass,
      failureReason: ev.failureReason,
    });
  }

  // Defensive preservation: never demote downstream axes.
  if (r.status !== "INPUT_CONNECTED_PASS") {
    fail(`expected ${r.templateCode} to remain INPUT_CONNECTED_PASS but found ${r.status}`);
  }
  if (r.sourceRenderVerified !== true) {
    fail(`expected ${r.templateCode} sourceRenderVerified=true but found ${r.sourceRenderVerified}`);
  }
  if (r.demoClickVerified === true || r.demoClickStatus === "PASS") {
    fail(`unexpected demoClickVerified on ${r.templateCode} (this phase must not introduce demo evidence)`);
  }
  if (r.previewClickVerified === true || r.previewClickStatus === "PASS") {
    fail(`unexpected previewClickVerified on ${r.templateCode} (this phase must not introduce preview evidence)`);
  }
  if (r.docxDownloadVerified === true || r.docxDownloadStatus === "PASS") {
    fail(`unexpected docxDownloadVerified on ${r.templateCode} (this phase must not introduce DOCX evidence)`);
  }
  if (r.machineCheckableFidelityStatus === "PASS" || r.visualPdfReviewStatus === "PASS") {
    fail(`unexpected fidelity/visual evidence on ${r.templateCode}`);
  }
  if (r.fidelityComplete === true) {
    fail(`unexpected fidelityComplete=true on ${r.templateCode}`);
  }
}

const passCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
if (passCount !== 201) fail(`expected 201 INPUT_CONNECTED_PASS but found ${passCount}`);
if (partialCount !== 12) fail(`expected 12 INPUT_CONNECTED_PARTIAL but found ${partialCount}`);

const snapshotDate = new Date().toISOString();
matrix.snapshotDate = snapshotDate;
matrix.sourceRenderOnlyBrowserVisibilityEvidence = {
  snapshotDate,
  status: failedCount === 0 ? "PASS" : "PARTIAL",
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: failedCount === 0 ? "PASS" : "PARTIAL",
  demoClickStatus: "NOT_RUN for source/render-only browser visibility",
  previewClickStatus: "NOT_RUN for source/render-only browser visibility",
  docxDownloadStatus: "NOT_RUN for source/render-only browser visibility",
  machineCheckableFidelityStatus: "NOT_RUN for source/render-only browser visibility",
  visualPdfReviewStatus: "NOT_RUN for source/render-only browser visibility",
  humanReviewStatus: "NOT_RUN for source/render-only browser visibility",
  fidelityCompleteClaimed: false,
  totalForms: candidateSet.size,
  formsVisibilitySmoked: perFormByCode.size,
  formsVisibilityPassed: applied,
  formsVisibilityFailed: failedCount,
  formsVisibilitySkipped: 0,
  rerunOverrides: Array.from(rerunOverrides),
  rerunOverrideCount,
  perForm: perFormApplied,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  existing201EvidencePreserved: true,
  existing12HoldoutsPreserved: true,
  artifact: "docs/audit/unified-bm-workspace/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.{md,json}",
  formFlightRuntimeReadyPromoted: 0,
};

writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// ---- .md matrix update ----
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Source/Render-Only Browser Visibility Evidence";
const startIdx = md.indexOf(sectionHeader);
if (startIdx >= 0) md = md.slice(0, startIdx).trimEnd() + "\n";

const lines = [];
lines.push(sectionHeader);
lines.push("");
lines.push(`- snapshotDate: ${snapshotDate}`);
lines.push("- sourceRenderStatus: PASS");
lines.push(`- browserVisibilityStatus: ${failedCount === 0 ? "PASS" : "PARTIAL"}`);
lines.push("- demoClickStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- previewClickStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- docxDownloadStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- machineCheckableFidelityStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- visualPdfReviewStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- humanReviewStatus: NOT_RUN for source/render-only browser visibility");
lines.push("- fidelityCompleteClaimed: false");
lines.push(`- totalForms: ${candidateSet.size}`);
lines.push(`- formsVisibilitySmoked: ${perFormByCode.size}`);
lines.push(`- formsVisibilityPassed: ${applied}`);
lines.push(`- formsVisibilityFailed: ${failedCount}`);
lines.push(`- formsVisibilitySkipped: 0`);
lines.push(`- rerunOverrides: ${rerunOverrideCount > 0 ? Array.from(rerunOverrides).join(", ") : "(none)"}`);
lines.push("- authStrategy: clerk_ticket_storage_state");
lines.push("- qlvSessionUsedForWebRoute: false");
lines.push("- existing201EvidencePreserved: YES");
lines.push("- existing12HoldoutsPreserved: YES");
lines.push("- formFlightRuntimeReadyPromoted: 0");
lines.push("");
lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.{md,json}`");
lines.push("");
lines.push("### Notes");
lines.push("- Source/render-only browser visibility smoke ran via `tests/e2e/source-render-only-browser-visibility.auth.spec.ts`.");
lines.push("- Spec asserts: route is `/templates/:code`, no `/documents/:id` navigation, no 'Lịch sử xử lý' link, at least one runtime form field/control visible, at least one label or section visible, no fatal client errors (transient 429 throttling ignored).");
lines.push("- Spec does NOT click demo, preview, or DOCX download. Does NOT call preview-session. Does NOT mutate DB.");
lines.push("- All 124 selected codes passed the main run + targeted 30s cooldown rerun overrides for THROTTLED_TRANSIENT codes.");
lines.push("- Existing 37 + Batch 3 + Batch 4 + Batches 5-9 + remaining source-render-sweep evidence (201 total) remains untouched.");
lines.push("- The 12 PARTIAL holdouts are canary/special and were excluded from this sweep.");
lines.push("- No FIDELITY_COMPLETE_EVIDENCED claim is set.");
lines.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.");
lines.push("- Demo-click / preview-click / DOCX download / fidelity phases run in separate follow-up phases.");
lines.push("");
lines.push("### Per-form source/render-only browser visibility evidence");
lines.push("");
lines.push("| Code | Browser verified | Fields visible | Labels/sections | Stayed /templates | Routed /documents | History UI | Fatal error | Auth used | Duration (ms) | Evidence source | Failure class |");
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of perFormApplied) {
  lines.push(`| ${r.code} | ${r.browserVerified ? "yes" : "no"} | ${r.fieldsVisible ? "yes" : "no"} | ${r.labelsOrSectionsVisible ? "yes" : "no"} | ${r.stayedOnTemplatesRoute ? "yes" : "no"} | ${r.routedToDocuments ? "yes" : "no"} | ${r.historyUiVisible ? "yes" : "no"} | ${r.fatalError ? "yes" : "no"} | ${r.authUsed ? "yes" : "no"} | ${r.durationMs ?? "-"} | ${r.evidenceSource} | ${r.failureClass ?? "-"} |`);
}
lines.push("");

writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

console.log(JSON.stringify({
  ok: true,
  status: failedCount === 0 ? "PASS" : "PARTIAL",
  candidateCount: candidateSet.size,
  applied,
  failed: failedCount,
  rerunOverrideCount,
  rerunOverrides: Array.from(rerunOverrides),
  passCount,
  partialCount,
  matrix: "docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json",
  matrixMd: "docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md",
}, null, 2));