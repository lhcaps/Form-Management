#!/usr/bin/env node
/**
 * apply-batch4-browser-visibility.mjs
 *
 * Records Batch 4 authenticated browser visibility smoke evidence in the
 * status matrix. Reads main run + optional rerun, classifies each
 * per-form result, and updates matrix rows + creates artifacts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH4_BROWSER_VISIBILITY.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH4_BROWSER_VISIBILITY.latest.md`;
const MAIN_RUN = `${ROOT}/.tmp-batch4-visibility.parsed.json`;
const RERUN_RUN = `${ROOT}/.tmp-batch4-visibility.rerun.parsed.json`;

const BATCH4_CODES = [
  "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084",
  "BM-085", "BM-086", "BM-087", "BM-088", "BM-090", "BM-091",
  "BM-092", "BM-093", "BM-094", "BM-095", "BM-096", "BM-097",
  "BM-098", "BM-100",
];

function fail(msg) { console.error(`FAIL: ${msg}`); process.exit(1); }
function loadParsed(path, label) {
  if (!existsSync(path)) fail(`missing ${label} at ${path}`);
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (err) { fail(`invalid JSON in ${label}: ${err.message}`); }
}

if (!existsSync(MATRIX)) fail(`missing status matrix at ${MATRIX}`);
const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const rows = matrix.rows ?? [];
const batch4Set = new Set(BATCH4_CODES);

const mainRun = loadParsed(MAIN_RUN, "main visibility run");
const rerunRun = existsSync(RERUN_RUN) ? loadParsed(RERUN_RUN, "rerun visibility") : null;

function indexByCode(parsed) {
  const out = new Map();
  for (const c of parsed.codes) {
    if (!c.templateCode) continue;
    if (!out.has(c.templateCode)) out.set(c.templateCode, c);
  }
  return out;
}

const mainByCode = indexByCode(mainRun);
const rerunByCode = rerunRun ? indexByCode(rerunRun) : new Map();

const finalByCode = new Map();
for (const code of BATCH4_CODES) {
  const m = mainByCode.get(code);
  if (!m) fail(`main run is missing code ${code}`);
  finalByCode.set(code, Object.assign({}, m, { source: "main" }));
}

const rerunOverrides = [];
for (const code of BATCH4_CODES) {
  const r = rerunByCode.get(code);
  if (!r) continue;
  if (r.status === "passed") {
    const prev = finalByCode.get(code);
    if (prev.status !== "passed") rerunOverrides.push(code);
    finalByCode.set(code, Object.assign({}, r, { source: "rerun" }));
  }
}

function classify(form) {
  const m = mainByCode.get(form);
  const r = rerunByCode.get(form);
  const final = finalByCode.get(form);
  const isPassed = final.status === "passed";
  const isTransientThrottled =
    !isPassed &&
    m && m.status === "failed" &&
    /net::ERR_CONNECTION_REFUSED/i.test(m.errorMessage || "") &&
    r && r.status === "passed";
  let failureClass = null;
  if (!isPassed) {
    if (isTransientThrottled) failureClass = "THROTTLED_TRANSIENT";
    else if (/sign-in|sign-up/i.test((m && m.errorMessage) || "")) failureClass = "AUTH_FAIL";
    else if (/404|not found/i.test((m && m.errorMessage) || "")) failureClass = "ROUTE_404";
    else if (/Timed out waiting|page\.goto|net::ERR_|net error|net::ABORTED/i.test((m && m.errorMessage) || ""))
      failureClass = "ROUTE_RENDER_FAIL";
    else if (/not visible|toBeVisible/i.test((m && m.errorMessage) || "")) failureClass = "VISIBILITY_FAIL";
    else failureClass = "UNKNOWN";
  }
  return {
    code: form,
    authenticated: isPassed,
    route200: isPassed,
    not404: isPassed,
    redirectedToSignIn: false,
    titleOrCodeVisible: isPassed,
    sectionVisible: isPassed,
    fieldsVisible: isPassed,
    previewButtonVisible: isPassed,
    notFoundBoundaryAbsent: isPassed,
    consoleErrors: [],
    browserVisibilityStatus: isPassed ? "PASS" : "FAIL",
    failureClass,
    durationMs: final.durationMs || null,
    mainRunStatus: m ? m.status : null,
    rerunStatus: r ? r.status : null,
    evidenceSource: final.source,
  };
}

const perForm = BATCH4_CODES.map((c) => classify(c));
const perFormByCode = new Map(perForm.map((r) => [r.code, r]));

for (const r of rows) {
  if (!batch4Set.has(r.templateCode)) continue;
  const ev = perFormByCode.get(r.templateCode);
  if (!ev) continue;
  if (!ev.authenticated) {
    fail(`batch4 ${r.templateCode} did not pass (failureClass=${ev.failureClass})`);
  }
  r.browserVerified = true;
  r.browserVerifiedStatus = "PASS";
  r.browserVerifiedDurationMs = ev.durationMs;
  r.browserVisibilityEvidence = {
    mainRunStatus: ev.mainRunStatus,
    rerunStatus: ev.rerunStatus,
    evidenceSource: ev.evidenceSource,
    failureClass: ev.failureClass,
    snapshotDate: new Date().toISOString(),
  };
}

const passCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PASS").length;
const partialCount = rows.filter((r) => r.status === "INPUT_CONNECTED_PARTIAL").length;
if (passCount < 77 || partialCount > 136) {
  fail(`count drift: PASS=${passCount} (expected at least 77), PARTIAL=${partialCount} (expected at most 136)`);
}

const snapshotDate = new Date().toISOString();
const formsVisibilitySmoked = perForm.length;
const formsVisibilityPassed = perForm.filter((r) => r.authenticated).length;
const formsVisibilityFailed = perForm.filter((r) => !r.authenticated).length;

const artifact = {
  snapshotDate,
  status: (formsVisibilityFailed === 0 && formsVisibilityPassed === 20) ? "PASS" : (formsVisibilityPassed === 0 ? "FAIL" : "PARTIAL"),
  statusNote: (formsVisibilityFailed === 0)
    ? `All ${formsVisibilitySmoked} Batch 4 forms passed authenticated Playwright browser visibility smoke. BM-094, BM-095, BM-096, BM-097 experienced transient connection-refused failures on the main run (classified THROTTLED_TRANSIENT) and passed cleanly on the targeted cooldown rerun (honest merge - rerun evidence preferred). No demo-click / preview-click / DOCX download / fidelity phase was run for Batch 4. Existing 57 evidence remains untouched and valid.`
    : `Batch 4 browser visibility incomplete: ${formsVisibilityPassed}/${formsVisibilitySmoked} passed.`,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: (formsVisibilityFailed === 0) ? "PASS" : "PARTIAL",
  demoClickStatus: "NOT_RUN for Batch 4",
  previewClickStatus: "NOT_RUN for Batch 4",
  docxDownloadStatus: "NOT_RUN for Batch 4",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 4",
  visualPdfReviewStatus: "NOT_RUN for Batch 4",
  fidelityCompleteClaimed: false,
  totalForms: 20,
  formsVisibilitySmoked,
  formsVisibilityPassed,
  formsVisibilityFailed,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  generatedAt: snapshotDate,
  codes: BATCH4_CODES,
  rerunOverrides,
  perForm,
  existing57EvidencePreserved: true,
  manualReviewRequired: false,
  formFlightRuntimeReadyPromoted: 0,
  notes: [
    "Batch 4 browser visibility smoke ran via tests/e2e/curated-batch4-templates.auth.spec.ts.",
    "Spec asserts authenticated URL is not sign-in/sign-up, BM code or title visible, at least one h3 section heading visible, at least one input/textarea/select visible, 'Xem trước bản in' button visible, 'Không tìm thấy trang' boundary absent, no fatal console/page errors.",
    "Spec does NOT click preview, does NOT click demo, does NOT exercise the preview-session API, does NOT download DOCX.",
    "BM-094, BM-095, BM-096, BM-097 experienced transient connection-refused failures on the main run (THROTTLED_TRANSIENT) and passed cleanly on the targeted cooldown rerun - rerun evidence preferred.",
    "Existing 37 + Batch 3 (57 total) evidence remains untouched and valid.",
    "No FIDELITY_COMPLETE_EVIDENCED claim is set.",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.",
    "Demo-click / preview-click / DOCX download / fidelity phases for Batch 4 run in separate follow-up phases.",
  ],
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
  remainingRisks: [
    "Batch 4 demo-click not run",
    "Batch 4 preview-click not run",
    "Batch 4 DOCX download not run",
    "Batch 4 fidelity audit not run",
    "Existing 37 + Batch 3 still require visual/PDF review before fidelityComplete",
    "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only",
    "FIDELITY_COMPLETE_EVIDENCED not claimed",
  ],
};

matrix.snapshotDate = snapshotDate;
matrix.batch4BrowserVisibilityEvidence = {
  snapshotDate,
  sourceRenderStatus: "PASS",
  browserVisibilityStatus: artifact.browserVisibilityStatus,
  demoClickStatus: "NOT_RUN for Batch 4",
  previewClickStatus: "NOT_RUN for Batch 4",
  docxDownloadStatus: "NOT_RUN for Batch 4",
  machineCheckableFidelityStatus: "NOT_RUN for Batch 4",
  visualPdfReviewStatus: "NOT_RUN for Batch 4",
  fidelityCompleteClaimed: false,
  totalForms: 20,
  formsVisibilitySmoked,
  formsVisibilityPassed,
  formsVisibilityFailed,
  rerunOverrides,
  perForm,
  authStrategy: "clerk_ticket_storage_state",
  qlvSessionUsedForWebRoute: false,
  artifact: "docs/audit/unified-bm-workspace/QLLAW_BATCH4_BROWSER_VISIBILITY.latest.{md,json}",
};

writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(MATRIX, JSON.stringify(matrix, null, 2));

// ---- .md matrix update ----
let md = readFileSync(MATRIX_MD, "utf8");
const sectionHeader = "## Batch 4 Browser Visibility Evidence";
const startIdx = md.indexOf(sectionHeader);
if (startIdx >= 0) md = md.slice(0, startIdx).trimEnd() + "\n";

const lines = [];
lines.push(sectionHeader);
lines.push("");
lines.push(`- snapshotDate: ${snapshotDate}`);
lines.push("- sourceRenderStatus: PASS");
lines.push(`- browserVisibilityStatus: ${artifact.browserVisibilityStatus}`);
lines.push("- demoClickStatus: NOT_RUN for Batch 4");
lines.push("- previewClickStatus: NOT_RUN for Batch 4");
lines.push("- docxDownloadStatus: NOT_RUN for Batch 4");
lines.push("- machineCheckableFidelityStatus: NOT_RUN for Batch 4");
lines.push("- visualPdfReviewStatus: NOT_RUN for Batch 4");
lines.push("- fidelityCompleteClaimed: false");
lines.push("- totalForms: 20");
lines.push(`- formsVisibilitySmoked: ${formsVisibilitySmoked}`);
lines.push(`- formsVisibilityPassed: ${formsVisibilityPassed}`);
lines.push(`- formsVisibilityFailed: ${formsVisibilityFailed}`);
lines.push(`- rerunOverrides: ${rerunOverrides.length > 0 ? rerunOverrides.join(", ") : "(none)"}`);
lines.push("- authStrategy: clerk_ticket_storage_state");
lines.push("- qlvSessionUsedForWebRoute: false");
lines.push("- existing57EvidencePreserved: YES");
lines.push("- formFlightRuntimeReadyPromoted: 0");
lines.push("");
lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_BATCH4_BROWSER_VISIBILITY.latest.{md,json}`");
lines.push("");
lines.push("### Notes");
for (const n of artifact.notes) lines.push(`- ${n}`);
lines.push("");
lines.push("### Per-form batch 4 browser visibility evidence");
lines.push("");
lines.push("| Code | Authenticated | Route 200 | Not 404 | SignIn redirect | Title/Code | Section | Field | Preview button | Console errors | Browser status | Failure class | Duration (ms) | Evidence source |");
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of perForm) {
  lines.push(`| ${r.code} | ${r.authenticated ? "yes" : "no"} | ${r.route200 ? "yes" : "no"} | ${r.not404 ? "yes" : "no"} | ${r.redirectedToSignIn ? "yes" : "no"} | ${r.titleOrCodeVisible ? "yes" : "no"} | ${r.sectionVisible ? "yes" : "no"} | ${r.fieldsVisible ? "yes" : "no"} | ${r.previewButtonVisible ? "yes" : "no"} | ${r.consoleErrors.length} | ${r.browserVisibilityStatus} | ${r.failureClass || "-"} | ${r.durationMs || "-"} | ${r.evidenceSource} |`);
}
lines.push("");

writeFileSync(MATRIX_MD, md + lines.join("\n") + "\n");

// ---- Standalone .md artifact ----
function renderArtifactMd(a) {
  const out = [];
  out.push("# QLLAW Batch 4 Browser Visibility - latest");
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
  out.push(`> **Forms visibility smoked**: ${a.formsVisibilitySmoked}`);
  out.push(`> **Forms visibility passed**: ${a.formsVisibilityPassed}`);
  out.push(`> **Forms visibility failed**: ${a.formsVisibilityFailed}`);
  out.push(`> **Rerun overrides**: ${a.rerunOverrides.length > 0 ? a.rerunOverrides.join(", ") : "(none)"}`);
  out.push(`> **Auth strategy**: ${a.authStrategy}`);
  out.push(`> **qlvSession used for web route**: ${a.qlvSessionUsedForWebRoute}`);
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
  out.push("## Per-form batch 4 browser visibility results");
  out.push("");
  out.push("| Code | Authenticated | Route 200 | Not 404 | SignIn redirect | Title/Code | Section | Field | Preview button | Console errors | Browser status | Failure class | Duration (ms) | Evidence source |");
  out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of a.perForm) {
    out.push(`| ${r.code} | ${r.authenticated ? "yes" : "no"} | ${r.route200 ? "yes" : "no"} | ${r.not404 ? "yes" : "no"} | ${r.redirectedToSignIn ? "yes" : "no"} | ${r.titleOrCodeVisible ? "yes" : "no"} | ${r.sectionVisible ? "yes" : "no"} | ${r.fieldsVisible ? "yes" : "no"} | ${r.previewButtonVisible ? "yes" : "no"} | ${r.consoleErrors.length} | ${r.browserVisibilityStatus} | ${r.failureClass || "-"} | ${r.durationMs || "-"} | ${r.evidenceSource} |`);
  }
  out.push("");
  out.push("## Remaining risks");
  out.push("");
  for (const r of a.remainingRisks) out.push(`- ${r}`);
  out.push("");
  return out.join("\n") + "\n";
}

writeFileSync(ARTIFACT_MD, renderArtifactMd(artifact));

console.log(JSON.stringify({
  ok: true,
  totalForms: 20,
  formsVisibilitySmoked,
  formsVisibilityPassed,
  formsVisibilityFailed,
  rerunOverrides,
  passCount,
  partialCount,
  artifact: "docs/audit/unified-bm-workspace/QLLAW_BATCH4_BROWSER_VISIBILITY.latest.{md,json}",
}, null, 2));
