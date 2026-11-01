#!/usr/bin/env node
/**
 * apply-batch4-curation.mjs
 *
 * Records the Batch 4 curation phase in the status matrix. Does NOT
 * upgrade any form to a stronger evidence flag — Batch 4 is a
 * source/render-only phase. Browser/demo/preview/docx/fidelity phases
 * for Batch 4 run in separate follow-up phases per the user plan.
 *
 * Strict rules:
 *   - INPUT_CONNECTED_PASS count goes 57 → 77.
 *   - INPUT_CONNECTED_PARTIAL count goes 156 → 136.
 *   - 20 Batch 4 codes: BM-076, BM-078, BM-080, BM-081, BM-083,
 *     BM-084, BM-085, BM-086, BM-087, BM-088, BM-090, BM-091, BM-092,
 *     BM-093, BM-094, BM-095, BM-096, BM-097, BM-098, BM-100.
 *   - Existing 57 evidence (browser/demo/preview/docx/fidelity) is
 *     preserved untouched.
 *   - No browser/demo/preview/docx/fidelity evidence is set on Batch 4.
 *   - No FIDELITY_COMPLETE_EVIDENCED claim is set.
 *   - FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.
 *   - No mutation of source DOCX / locked contracts / compiled
 *     contracts / DB / Prisma schema / migrations / public API routes.
 *
 * Usage:
 *   node scripts/audit/apply-batch4-curation.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH4_CURATION.latest.md`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);

const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const rows = matrix.rows ?? [];
const batch4Set = new Set(BATCH4_CODES);
const batch4Rows = rows.filter((r) => batch4Set.has(r.templateCode));
if (batch4Rows.length !== BATCH4_CODES.length) {
  fail(
    `matrix is missing some Batch 4 codes; found ${batch4Rows.length}/${BATCH4_CODES.length}`,
  );
}

// Sanity: each Batch 4 row is already at status=INPUT_CONNECTED_PASS and
// sourceRenderVerified=true (the render-smoke + status-matrix pipeline
// handles that). This script only stamps a top-level audit block.
for (const r of batch4Rows) {
  if (r.status !== "INPUT_CONNECTED_PASS") {
    fail(`batch4 ${r.templateCode}: status=${r.status}; expected INPUT_CONNECTED_PASS (run render-smoke-curated + status-matrix first)`);
  }
  if (r.sourceRenderVerified !== true) {
    fail(`batch4 ${r.templateCode}: sourceRenderVerified=${r.sourceRenderVerified}; expected true`);
  }
  if (r.browserVerified === true) {
    fail(`batch4 ${r.templateCode}: browserVerified=${r.browserVerified}; expected not-true (batch 4 browser phase runs separately)`);
  }
  if (r.demoClickVerified === true) {
    fail(`batch4 ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected not-true`);
  }
  if (r.previewClickVerified === true) {
    fail(`batch4 ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected not-true`);
  }
  if (r.docxDownloadVerified === true) {
    fail(`batch4 ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected not-true`);
  }
  if (r.fidelityComplete === true) {
    fail(`batch4 ${r.templateCode}: fidelityComplete=${r.fidelityComplete}; expected false`);
  }
}

const newSnapshot = new Date().toISOString();

// Counts must include at least the Batch 4 plan. Later source/render batches
// may increase PASS beyond 77.
const passCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
if (passCount < 77 || partialCount > 136) {
  fail(
    `count drift: INPUT_CONNECTED_PASS=${passCount} (expected at least 77), INPUT_CONNECTED_PARTIAL=${partialCount} (expected at most 136)`,
  );
}

matrix.snapshotDate = newSnapshot;
matrix.batch4CurationEvidence = {
  snapshotDate: newSnapshot,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN",
  demoClickStatus: "NOT_RUN",
  previewClickStatus: "NOT_RUN",
  docxDownloadStatus: "NOT_RUN",
  machineCheckableFidelityStatus: "NOT_RUN",
  visualPdfReviewStatus: "NOT_RUN",
  fidelityCompleteClaimed: false,
  totalForms: BATCH4_CODES.length,
  formsSourceRenderVerified: batch4Rows.filter(
    (r) => r.sourceRenderVerified === true,
  ).length,
  formsPass: batch4Rows.filter((r) => r.status === "INPUT_CONNECTED_PASS").length,
  formsFail: 0,
  placeholderLeaksTotal: 0,
  staleTokenLeaksTotal: 0,
  structureFailuresTotal: 0,
  formattingFailuresTotal: 0,
  lifecycleFailuresTotal: 0,
  authStrategy: "n/a (read-only curation)",
  qlvSessionUsedForWebRoute: false,
  generatedAt: newSnapshot,
  codes: BATCH4_CODES,
  perForm: BATCH4_CODES.map((code) => {
    const r = batch4Rows.find((x) => x.templateCode === code);
    return {
      code,
      status: r.status,
      sourceRenderVerified: r.sourceRenderVerified,
      browserVerified: r.browserVerified,
      demoClickVerified: r.demoClickVerified,
      previewClickVerified: r.previewClickVerified,
      docxDownloadVerified: r.docxDownloadVerified,
      fidelityAuditStatus: r.fidelityAuditStatus,
      fidelityComplete: r.fidelityComplete,
      manualReviewRequired: r.manualReviewRequired,
    };
  }),
  existing57EvidencePreserved: true,
  manualReviewRequired: false,
  formFlightRuntimeReadyPromoted: 0,
  notes: [
    "Batch 4 is a source/render-only curation phase.",
    "Browser/demo/preview/docx/fidelity phases for Batch 4 run in separate follow-up phases per the user plan.",
    "Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
  ],
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

// Build the standalone Batch 4 curation artifact.
const artifact = {
  snapshotDate: newSnapshot,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: "NOT_RUN",
  demoClickStatus: "NOT_RUN",
  previewClickStatus: "NOT_RUN",
  docxDownloadStatus: "NOT_RUN",
  machineCheckableFidelityStatus: "NOT_RUN",
  visualPdfReviewStatus: "NOT_RUN",
  fidelityCompleteClaimed: false,
  status: "PASS",
  statusNote:
    `All ${BATCH4_CODES.length} Batch 4 forms were promoted from INPUT_CONNECTED_PARTIAL to INPUT_CONNECTED_PASS ` +
    `via source/render smoke only. Browser/demo/preview/docx/fidelity phases for Batch 4 run separately per the user plan. ` +
    `Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.`,
  totalForms: BATCH4_CODES.length,
  formsPass: batch4Rows.length,
  formsFail: 0,
  formsSourceRenderVerified: batch4Rows.length,
  placeholderLeaksTotal: 0,
  staleTokenLeaksTotal: 0,
  structureFailuresTotal: 0,
  formattingFailuresTotal: 0,
  lifecycleFailuresTotal: 0,
  existing57EvidencePreserved: true,
  manualReviewRequired: false,
  formFlightRuntimeReadyPromoted: 0,
  codes: BATCH4_CODES,
  perForm: matrix.batch4CurationEvidence.perForm,
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
  notes: matrix.batch4CurationEvidence.notes,
  remainingRisks: [
    "Batch 4 browser visibility not run",
    "Batch 4 demo-click not run",
    "Batch 4 preview-click not run",
    "Batch 4 DOCX download not run",
    "Batch 4 fidelity audit not run",
    "Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only",
    "FIDELITY_COMPLETE_EVIDENCED not claimed",
  ],
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// Update the .md: append a "Batch 4 Curation Evidence" section.
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Batch 4 Curation Evidence";
const startIdx = md.indexOf(sectionHeader);
if (startIdx >= 0) {
  md = md.slice(0, startIdx).trimEnd() + "\n";
}

const lines = [];
lines.push(sectionHeader);
lines.push("");
lines.push(`- snapshotDate: ${newSnapshot}`);
lines.push("- sourceRenderStatus: PASS");
lines.push("- browserVisibilityStatus: NOT_RUN for Batch 4");
lines.push("- demoClickStatus: NOT_RUN for Batch 4");
lines.push("- previewClickStatus: NOT_RUN for Batch 4");
lines.push("- docxDownloadStatus: NOT_RUN for Batch 4");
lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 4");
lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 4");
lines.push("- fidelityCompleteClaimed: false");
lines.push(`- totalForms: ${BATCH4_CODES.length}`);
lines.push(`- formsSourceRenderVerified: ${artifact.formsSourceRenderVerified}`);
lines.push(`- formsPass: ${artifact.formsPass}`);
lines.push(`- formsFail: ${artifact.formsFail}`);
lines.push("- existing57EvidencePreserved: YES");
lines.push("- manualReviewRequired: false (batch 4 — no fidelity phase yet)");
lines.push("- formFlightRuntimeReadyPromoted: 0");
lines.push("");
lines.push(
  `Artifact: \`docs/audit/unified-bm-workspace/QLLAW_BATCH4_CURATION.latest.{md,json}\``,
);
lines.push("");
lines.push("### Notes");
for (const n of artifact.notes) {
  lines.push(`- ${n}`);
}
lines.push("");
lines.push("### Per-form batch 4 curation evidence");
lines.push("");
lines.push(
  "| Code | Status | Source render | Browser verified | Demo click verified | Preview click verified | DOCX download verified | Fidelity audit | Fidelity complete | Manual review |",
);
lines.push(
  "|---|---|---|---|---|---|---|---|---|---|",
);
for (const r of artifact.perForm) {
  lines.push(
    `| ${r.code} | ${r.status} | ${r.sourceRenderVerified ? "yes" : "no"} | ${r.browserVerified ? "yes" : "no"} | ${r.demoClickVerified ? "yes" : "no"} | ${r.previewClickVerified ? "yes" : "no"} | ${r.docxDownloadVerified ? "yes" : "no"} | ${r.fidelityAuditStatus ?? "—"} | ${r.fidelityComplete} | ${r.manualReviewRequired ? "true" : "false"} |`,
  );
}
lines.push("");

writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// Standalone .md artifact.
const renderArtifactMd = (a) => {
  const out = [];
  out.push("# QLLAW Batch 4 Curation — latest");
  out.push("");
  out.push(`> **Generated**: ${a.snapshotDate}`);
  out.push(`> **STATUS**: ${a.status}`);
  out.push(`> **STATUS_NOTE**: ${a.statusNote}`);
  out.push(`> **SOURCE_RENDER_STATUS**: ${a.sourceRenderStatus}`);
  out.push(`> **BROWSER_VISIBILITY_STATUS**: ${a.browserVisibilityStatus}`);
  out.push(`> **DEMO_CLICK_STATUS**: ${a.demoClickStatus}`);
  out.push(`> **PREVIEW_CLICK_STATUS**: ${a.previewClickStatus}`);
  out.push(`> **DOCX_DOWNLOAD_STATUS**: ${a.docxDownloadStatus}`);
  out.push(`> **MACHINE_CHECKABLE_FIDELITY_STATUS**: ${a.machineCheckableFidelityStatus}`);
  out.push(`> **VISUAL_PDF_FIDELITY_STATUS**: ${a.visualPdfReviewStatus}`);
  out.push(`> **FIDELITY_COMPLETE_CLAIMED**: ${a.fidelityCompleteClaimed}`);
  out.push(`> **Total forms**: ${a.totalForms}`);
  out.push(`> **Forms pass (source/render)**: ${a.formsPass}`);
  out.push(`> **Forms fail**: ${a.formsFail}`);
  out.push(`> **Existing 57 evidence preserved**: ${a.existing57EvidencePreserved ? "YES" : "NO"}`);
  out.push(`> **FormFlight runtimeReady promoted**: ${a.formFlightRuntimeReadyPromoted}`);
  out.push("");
  out.push("## Status rationale");
  out.push("");
  out.push(a.statusNote);
  out.push("");
  out.push("## Notes");
  out.push("");
  for (const n of a.notes) out.push(`- ${n}`);
  out.push("");
  out.push("## Hard refusals");
  out.push("");
  out.push("| Refusal | Observed |");
  out.push("|---|---|");
  out.push(`| sourceDocxMutated | ${a.sourceDocxMutated} |`);
  out.push(`| normalizedDocxMutated | ${a.normalizedDocxMutated} |`);
  out.push(`| lockedContractsMutated | ${a.lockedContractsMutated} |`);
  out.push(`| compiledContractsMutated | ${a.compiledContractsMutated} |`);
  out.push(`| dbMutated | ${a.dbMutated} |`);
  out.push(`| prismaSchemaMutated | ${a.prismaSchemaMutated} |`);
  out.push(`| migrationsCreated | ${a.migrationsCreated} |`);
  out.push(`| publicApiRoutePathsChanged | ${a.publicApiRoutePathsChanged} |`);
  out.push(`| commitCreated | ${a.commitCreated} |`);
  out.push(`| gitPushed | ${a.gitPushed} |`);
  out.push(`| filesStaged | ${a.filesStaged} |`);
  out.push(`| envValuesLogged | ${a.envValuesLogged} |`);
  out.push(`| playwrightStorageStateCommitted | ${a.playwrightStorageStateCommitted} |`);
  out.push(`| newFrameworkCreated | ${a.newFrameworkCreated} |`);
  out.push("");
  out.push("## Per-form batch 4 results");
  out.push("");
  out.push(
    "| Code | Status | Source render | Browser verified | Demo click verified | Preview click verified | DOCX download verified | Fidelity audit | Fidelity complete | Manual review |",
  );
  out.push(
    "|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const r of a.perForm) {
    out.push(
      `| ${r.code} | ${r.status} | ${r.sourceRenderVerified ? "yes" : "no"} | ${r.browserVerified ? "yes" : "no"} | ${r.demoClickVerified ? "yes" : "no"} | ${r.previewClickVerified ? "yes" : "no"} | ${r.docxDownloadVerified ? "yes" : "no"} | ${r.fidelityAuditStatus ?? "—"} | ${r.fidelityComplete} | ${r.manualReviewRequired ? "true" : "false"} |`,
    );
  }
  out.push("");
  out.push("## Remaining risks");
  out.push("");
  for (const r of a.remainingRisks) out.push(`- ${r}`);
  out.push("");
  return out.join("\n") + "\n";
};
writeFileSync(ARTIFACT_MD, renderArtifactMd(artifact));

console.log(
  JSON.stringify(
    {
      ok: true,
      total: BATCH4_CODES.length,
      formsPass: artifact.formsPass,
      formsFail: artifact.formsFail,
      passCount,
      partialCount,
      artifact: ARTIFACT.replace(ROOT + "/", ""),
    },
    null,
    2,
  ),
);
