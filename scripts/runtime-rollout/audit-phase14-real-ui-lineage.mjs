// Phase 14 Turn 4 — Adversarial Audit Phase 3 script.
// Audit the execution layer for the 83 lifecycle forms. For each form
// classify the EXECUTION_LAYER and report per-form evidence summary.
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();
const PHASE14 = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion");
const OUT_DIR = path.join(PHASE14, "turn4-adversarial-audit");

function sha256(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

const PHASE14_LIFECYCLE = load(path.join(PHASE14, "turn4-final-83-form-lifecycle-verdicts.json"));
const persisted = load(path.join(PHASE14, "turn4-authoritative-persisted-77.json"));
const standalone = load(path.join(PHASE14, "turn4-standalone-6-results.json"));
const blocked30 = load(path.join(PHASE14, "turn4-blocked-closure-results-30.json"));
const smoke12 = load(path.join(PHASE14, "turn4-smoke-12-results.json"));
const canary = load(path.join(PHASE14, "turn4-canary-results-7.json"));
const realUI = load(path.join(PHASE14, "persisted-ui-results-77.json"));
const standaloneResults = load(path.join(PHASE14, "standalone-results-6.json"));

const realUIByCode = {};
for (const r of (realUI.forms ?? [])) {
  realUIByCode[r.formCode] = r;
}

const rows = PHASE14_LIFECYCLE.rows.map((r) => {
  const code = r.FORM_CODE;
  const lifecycle = r.LIFECYCLE;
  const isPersisted = lifecycle === "PERSISTED_DOCUMENT_WORKSPACE";
  const isStandalone = lifecycle === "STANDALONE_RUNTIME_PREVIEW";

  // Find the source artifact this form came from
  let sourceArtifact = null;
  let sourceProvenance = null;
  if (isPersisted) {
    const p = (persisted.forms ?? []).find((f) => (f.formCode ?? f.FORM_CODE) === code);
    if (p) {
      sourceArtifact = "turn4-authoritative-persisted-77.json";
      sourceProvenance = p.provenance?.[0]?.source ?? null;
    }
  } else if (isStandalone) {
    const s = (standalone.forms ?? []).find((f) => (f.formCode ?? f.FORM_CODE) === code);
    if (s) {
      sourceArtifact = "turn4-standalone-6-results.json";
      sourceProvenance = "turn4-standalone-6-results";
    }
  }

  // EXECUTION_LAYER classification
  const runId = sourceProvenance;
  const isAPIRunner = runId === "turn4-smoke-12-results" || runId === "turn4-blocked-closure-results-30" || runId === "turn4-broad-persisted-rerun" || runId === "turn4-standalone-6-results";
  const isCanary = (canary.canaries ?? []).includes(code);
  const isFromCanary = isCanary;
  const isRealUI = !isAPIRunner;
  let executionLayer = isRealUI ? "REAL_PLAYWRIGHT_UI" : "API_DATA_PLANE_ONLY";
  if (runId === null && isStandalone) {
    // turn4-standalone-6 is API-only
    executionLayer = "API_DATA_PLANE_ONLY";
  }

  // Real-UI evidence from earlier phase14 run
  const realUIRow = realUIByCode[code];
  const realUIVerdict = realUIRow?.verdict ?? null;
  const realUIPass = realUIVerdict === "PERSISTED_BROWSER_UI_PASS";

  // Check for actual screenshots
  const shotR1 = path.join(PHASE14, "screenshots", `${code}-R1-after-save.png`);
  const shotR2 = path.join(PHASE14, "screenshots", `${code}-R2-after-save.png`);
  const previewR1 = path.join(PHASE14, "screenshots", `${code}-R1-after-preview.png`);
  const previewR2 = path.join(PHASE14, "screenshots", `${code}-R2-after-preview.png`);
  const hasR1 = existsSync(shotR1) || existsSync(previewR1);
  const hasR2 = existsSync(shotR2) || existsSync(previewR2);
  const r1Path = existsSync(shotR1) ? shotR1 : (existsSync(previewR1) ? previewR1 : null);
  const r2Path = existsSync(shotR2) ? shotR2 : (existsSync(previewR2) ? previewR2 : null);

  // Real-UI row from earlier run
  const rui = realUIRow;
  const r1 = rui?.evidence?.r1;
  const r2 = rui?.evidence?.r2;
  const r1SaveClick = r1?.stages?.find((s) => s.stage === "SAVE_CLICK")?.ok === true;
  const r2SaveClick = r2?.stages?.find((s) => s.stage === "SAVE_CLICK")?.ok === true;
  const r1PreviewClick = r1?.stages?.find((s) => s.stage === "PREVIEW_CLICK")?.ok === true;
  const r2PreviewClick = r2?.stages?.find((s) => s.stage === "PREVIEW_CLICK")?.ok === true;
  const r1SaveResp = r1?.stages?.find((s) => s.stage === "SAVE_RESPONSE");
  const r2SaveResp = r2?.stages?.find((s) => s.stage === "SAVE_RESPONSE");
  const freshContext = rui?.evidence?.freshContext ?? null;
  const hydrated = rui?.evidence?.hydrated ?? null;
  const downloadEvent = rui?.evidence?.downloadEvent ?? null;
  const r1Hash = rui?.evidence?.r1?.docxSha256 ?? rui?.evidence?.r1?.previewSha256 ?? null;
  const r2Hash = rui?.evidence?.r2?.docxSha256 ?? rui?.evidence?.r2?.previewSha256 ?? null;

  // Provisional UIs
  let finalUiVerdict = rui?.verdict ?? "NO_EXECUTION_EVIDENCE";

  // Determine: is this Turn 4 re-running real UI, or did Turn 4 only run API?
  const turn4EvidenceIsRealUI = false; // all turn 4 sources here are API_ONLY

  return {
    FORM_CODE: code,
    EXECUTION_RUN_ID: runId,
    EXECUTION_LAYER: executionLayer,
    LIFECYCLE: lifecycle,
    PLAYWRIGHT_BROWSER_LAUNCHED: !!rui,
    PAGE_GOTO_EXECUTED: !!r1?.stages?.find((s) => s.stage === "GOTO"),
    CONTROL_LOCATORS_FOUND: !!r1?.stages?.find((s) => s.stage === "FILL_SAMPLE_CLICK"),
    VISIBLE_CONTROLS_INTERACTED: !!r1?.stages?.find((s) => s.stage === "FILL_SAMPLE_CLICK")?.ok,
    SAVE_BUTTON_CLICKED: isPersisted ? r1SaveClick : r1PreviewClick,
    SAVE_RESPONSE_STATUS: isPersisted ? r1SaveResp?.status ?? null : r1PreviewClick,
    PREVIEW_BUTTON_CLICKED: isStandalone ? r1PreviewClick : null,
    DOWNLOAD_EVENT_OBSERVED: !!downloadEvent,
    FRESH_CONTEXT_CREATED: !!freshContext,
    UI_HYDRATION_ASSERTED: !!hydrated,
    DIRECT_API_SAVE_USED: isAPIRunner,
    DIRECT_API_RENDER_USED: isAPIRunner,
    SCREENSHOT_PATHS: { R1: r1Path, R2: r2Path },
    SCREENSHOT_R1_EXISTS: hasR1,
    SCREENSHOT_R2_EXISTS: hasR2,
    NETWORK_EVIDENCE_PATHS: [],
    PER_FORM_RESULT_PATH: sourceArtifact,
    PROVENANCE_SOURCE: sourceProvenance,
    EARLIER_REAL_UI_VERDICT: realUIVerdict,
    EARLIER_REAL_UI_PASS: realUIPass,
    EARLIER_R1_DOCX_SHA: r1Hash,
    EARLIER_R2_DOCX_SHA: r2Hash,
    FINAL_UI_VERDICT: finalUiVerdict,
    Turn4_RE_RUN_REAL_UI: false,
    Turn4_VERDICT_ARTIFACT_PATH: sourceArtifact,
  };
});

// Aggregate
const byLayer = {};
for (const r of rows) {
  byLayer[r.EXECUTION_LAYER] = (byLayer[r.EXECUTION_LAYER] ?? 0) + 1;
}
const summary = {
  schema: "qllaw.phase14.real_ui_lineage_summary/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  totalForms: rows.length,
  byExecutionLayer: byLayer,
  byEarlierRealUiVerdict: {
    PERSISTED_BROWSER_UI_PASS: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "PERSISTED_BROWSER_UI_PASS").length,
    FAIL_SAVE: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "FAIL_SAVE").length,
    FAIL_R2_SAVE: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "FAIL_R2_SAVE").length,
    FAIL_RUNTIME: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "FAIL_RUNTIME").length,
    NO_EVIDENCE: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "NO_EXECUTION_EVIDENCE").length,
  },
  byTurn4Provenance: {
    "turn4-smoke-12-results": rows.filter((r) => r.PROVENANCE_SOURCE === "turn4-smoke-12-results").length,
    "turn4-blocked-closure-results-30": rows.filter((r) => r.PROVENANCE_SOURCE === "turn4-blocked-closure-results-30").length,
    "turn4-broad-persisted-rerun": rows.filter((r) => r.PROVENANCE_SOURCE === "turn4-broad-persisted-rerun").length,
    "turn4-standalone-6-results": rows.filter((r) => r.LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW").length,
  },
  claim_83_lifecycle_real_ui: false,
  claim_83_lifecycle_real_ui_reason: "Turn 4 runners (phase14-turn4-blocked-closure.mjs, phase14-turn4-broad-persisted.mjs, phase14-turn4-standalone-6.mjs, phase14-turn4-smoke-12.mjs, phase14-turn4-canary-runner.mjs) are all API-only. PROVENANCE_SOURCE for every form in the 77 persisted-77 file is turn4-smoke/blocked-closure/broad-persisted-rerun. None of the Turn 4 evidence chain uses Playwright.",
  realUiProvenCount: rows.filter((r) => r.EARLIER_REAL_UI_VERDICT === "PERSISTED_BROWSER_UI_PASS").length,
  apiOnlyCount: rows.filter((r) => r.EXECUTION_LAYER === "API_DATA_PLANE_ONLY").length,
  realUiProvenTurn4Count: rows.filter((r) => r.PROVENANCE_SOURCE !== null && r.EARLIER_REAL_UI_VERDICT === "PERSISTED_BROWSER_UI_PASS").length,
};
writeFileSync(path.join(OUT_DIR, "real-ui-lineage-summary.json"), JSON.stringify(summary, null, 2));

const lineage = {
  schema: "qllaw.phase14.real_ui_lineage_83/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  rows,
  note: "EXECUTION_LAYER classification. API_DATA_PLANE_ONLY means the Turn 4 evidence was produced via raw HTTP API calls (no Playwright). REAL_PLAYWRIGHT_UI means the form has a real-UI row from the earlier `phase14-real-ui-runner.mjs` (PHASE14_TURN2_*). HYBRID_FIXTURE_PLUS_REAL_UI is reserved for forms where API was used for fixtures + real UI for control interaction. NO_EXECUTION_EVIDENCE means no row exists at all.",
};
writeFileSync(path.join(OUT_DIR, "real-ui-lineage-83.json"), JSON.stringify(lineage, null, 2));

const lines = [];
lines.push("# Phase 14 Turn 4 — Real UI Lineage Audit (83)");
lines.push("");
lines.push(`Generated: ${summary.generatedAt}`);
lines.push("");
lines.push("## Headline");
lines.push("");
lines.push(`- All ${rows.length} forms have Turn 4 evidence sourced from API-only runners.`);
lines.push(`- ${summary.realUiProvenCount} forms have EARLIER real-UI evidence (from previous Phase 14 run, not Turn 4).`);
lines.push(`- 0 forms have Turn 4 fresh real-UI evidence.`);
lines.push("");
lines.push("## EXECUTION_LAYER distribution");
lines.push("");
for (const [k, v] of Object.entries(byLayer)) {
  lines.push(`- ${k}: ${v}`);
}
lines.push("");
lines.push("## Earlier real-UI verdict distribution");
lines.push("");
for (const [k, v] of Object.entries(summary.byEarlierRealUiVerdict)) {
  lines.push(`- ${k}: ${v}`);
}
lines.push("");
lines.push("## Turn 4 provenance source distribution");
lines.push("");
for (const [k, v] of Object.entries(summary.byTurn4Provenance)) {
  lines.push(`- ${k}: ${v}`);
}
lines.push("");
lines.push("## Per-form execution layer");
lines.push("");
lines.push("| Form | Lifecycle | Execution Layer | Provenance Source | Earlier Real UI |");
lines.push("|---|---|---|---|---|");
for (const r of rows) {
  lines.push(`| ${r.FORM_CODE} | ${r.LIFECYCLE} | ${r.EXECUTION_LAYER} | ${r.PROVENANCE_SOURCE ?? "—"} | ${r.EARLIER_REAL_UI_VERDICT} |`);
}
writeFileSync(path.join(OUT_DIR, "real-ui-lineage-83.md"), lines.join("\n"));

console.log("Wrote: real-ui-lineage-83.json", `(${rows.length} rows)`);
console.log("Wrote: real-ui-lineage-83.md");
console.log("Wrote: real-ui-lineage-summary.json");
console.log("byExecutionLayer:", byLayer);
console.log("realUiProvenCount:", summary.realUiProvenCount);
console.log("apiOnlyCount:", summary.apiOnlyCount);
