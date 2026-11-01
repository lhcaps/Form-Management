// Phase 14 Turn 4 — Adversarial Audit Phase 2 script.
// Explains the 10 forms in the application roster that are also
// UPSTREAM_RENDER_BLOCKED in Phase 12.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();
const PHASE14 = path.join(
  ROOT,
  "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion",
);
const PHASE12 = path.join(
  ROOT,
  "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual",
);
const RUNTIME_ROLLOUT = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout");
const OUT_DIR = path.join(PHASE14, "turn4-adversarial-audit");

function sha256(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

const recon = load(path.join(OUT_DIR, "exact-form-set-reconciliation.json"));
const visual = load(path.join(PHASE12, "visual-final-verdicts-213.json"));
const phase14Final = load(path.join(PHASE14, "turn4-final-83-form-lifecycle-verdicts.json"));
const persisted77 = load(path.join(PHASE14, "turn4-authoritative-persisted-77.json"));
const standalone6 = load(path.join(PHASE14, "turn4-standalone-6-results.json"));
const ready = load(path.join(RUNTIME_ROLLOUT, "runtime-readiness.generated.json"));
const baseline = (ready.baselineRuntimeReady ?? []).slice();
const phase1Promoted = ["BM-002", "BM-008", "BM-010", "BM-012", "BM-172"].sort();

const BASELINE_BASELINE_REPO = ["BM-001","BM-136","BM-148","BM-156","BM-157","BM-168","BM-171","BM-174","BM-181","BM-206","BM-213"].sort();
const STANDALONE_BASELINE_6 = ["BM-157","BM-168","BM-174","BM-181","BM-206","BM-213"];

const intersect = recon.intersectionAppAndBlocked;
const phase14Lifecycle = phase14Final.rows.map((r) => r.FORM_CODE);
const appRoster = (ready.runtimeReadyFormCodes ?? []).slice();

const excess = intersect.map((code) => {
  const v = visual.rows.find((r) => r.FORM_CODE === code);
  const final83 = phase14Final.rows.find((r) => r.FORM_CODE === code);
  const persisted = persisted77.forms?.find((f) => (f.formCode ?? f.FORM_CODE) === code);
  const standalone = standalone6.forms?.find((f) => (f.formCode ?? f.FORM_CODE) === code);
  const rdy = ready.entries?.find((e) => (e.formCode ?? e.FORM_CODE) === code);
  const isBaseline = BASELINE_BASELINE_REPO.includes(code);
  const isPhase1 = phase1Promoted.includes(code);
  const isPhase14 = phase14Lifecycle.includes(code);
  const isStandalone = STANDALONE_BASELINE_6.includes(code);

  // Eligibility verdict
  let eligibility = "UNKNOWN";
  let reason = null;
  if (isBaseline && isStandalone) {
    eligibility = "HISTORICAL_ONLY_STALE";
    reason = "Baseline form was promoted BEFORE Phase 12 visual closure; Phase 12 marked it UPSTREAM_RENDER_BLOCKED but the pre-Phase-12 baseline roster was not retracted. Has standalone-fresh Turn-4 evidence (R1+R2 via preview-session) but the Phase-12 upstream-blocked verdict was not cleared.";
  } else if (isBaseline && !isStandalone) {
    eligibility = "UPSTREAM_BLOCKED";
    reason = "Baseline form promoted before Phase 12 closure. Phase 12 visual closure marked it UPSTREAM_RENDER_BLOCKED with WORD/LO R1+R2 SKIPPED. The application roster retained it as BASELINE_RUNTIME_READY but no Phase-12 Word/LO evidence was ever produced. The roster entry is HISTORICAL_ONLY and stale w.r.t. the Phase-12 inclusion criterion.";
  } else if (isPhase1) {
    eligibility = "HISTORICAL_ONLY_STALE";
    reason = "Phase-1 promoted form (Phase 1B LibreOffice). The Phase 1B LibreOffice visual evidence was produced, but Phase 12 visual closure re-evaluated its BLOCKED_TYPE_CONFLICT and re-flagged UPSTREAM_RENDER_BLOCKED. The roster entry is HISTORICAL_ONLY and stale.";
  } else if (isPhase14) {
    eligibility = "PHASE14_INCLUDED_BUT_BLOCKED";
    reason = "Form was promoted in Phase 14 (real or API-anchored), but Phase 12 visual verdict UPSTREAM_RENDER_BLOCKED was not cleared despite the new evidence. Either (a) Phase 14 evidence is API-only and insufficient to clear Phase 12 visual verdict, or (b) Phase 12 visual verdict was re-evaluated and the blocker is genuine. Without a Phase-12 re-evaluation, the form is in a contradictory state.";
  } else {
    eligibility = "UNKNOWN_ROSTER_ENTRY";
    reason = "Form not in baseline, phase1, or phase14 lists. This is an unexpected roster entry.";
  }

  return {
    FORM_CODE: code,
    ROSTER_SOURCE: "runtime-readiness.generated.json",
    BASELINE_MEMBERSHIP: isBaseline,
    PHASE1_MEMBERSHIP: isPhase1,
    PHASE12_VISUAL_VERDICT: v?.VISUAL_FINAL_VERDICT ?? null,
    PHASE12_EXCLUSION_REASONS: v?.EXCLUSION_REASONS ?? [],
    PHASE14_INCLUDED: isPhase14,
    PHASE14_LIFECYCLE: final83?.LIFECYCLE ?? null,
    PHASE14_VERDICT: final83?.VERDICT ?? null,
    PHASE14_EVIDENCE_SOURCE: final83?.EVIDENCE_SOURCE ?? null,
    PHASE14_CROSSWALK_VERDICT: final83?.CROSSWALK_VERDICT ?? null,
    PERSISTED_IN_TURN4: !!persisted,
    STANDALONE_IN_TURN4: !!standalone,
    CURRENT_AUTHORITY_HASH: rdy?.evidenceSha256 ?? null,
    CURRENT_PROMOTION_STATUS: rdy?.promotionStatus ?? null,
    CURRENT_VISUAL_EVIDENCE: v ? {
      WORD_R1: v.WORD_R1,
      WORD_R2: v.WORD_R2,
      LIBREOFFICE_R1: v.LIBREOFFICE_R1,
      LIBREOFFICE_R2: v.LIBREOFFICE_R2,
    } : null,
    CURRENT_REAL_UI_EVIDENCE: persisted || standalone || isStandalone ? {
      TURN4_PERSISTED: !!persisted,
      TURN4_STANDALONE: !!standalone,
      R1_SAVE: persisted?.provenance?.[0]?.outcome?.R1_SAVE ?? null,
      R2_SAVE: persisted?.provenance?.[0]?.outcome?.R2_SAVE ?? null,
    } : null,
    CURRENT_PROMOTION_EVIDENCE: rdy?.runtimeR1Sha256 ? {
      runtimeR1Sha256: rdy.runtimeR1Sha256,
      runtimeR2Sha256: rdy.runtimeR2Sha256,
      libreOfficeR1Sha256: rdy.libreOfficeR1Sha256,
      libreOfficeR2Sha256: rdy.libreOfficeR2Sha256,
      slotVerdict: rdy.slotVerdict,
    } : null,
    UPSTREAM_BLOCKED_STATUS: v?.VISUAL_FINAL_VERDICT === "UPSTREAM_RENDER_BLOCKED",
    ELIGIBILITY_VERDICT: eligibility,
    BLOCKING_REASON: reason,
  };
});

const out = {
  schema: "qllaw.phase14.excess_roster_forms/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  description: "Excess forms in APPLICATION_CONSUMED_ROSTER that are also in PHASE12_UPSTREAM_BLOCKED. Each form is classified with an ELIGIBILITY_VERDICT and a BLOCKING_REASON.",
  count: excess.length,
  forms: excess,
  summary: {
    HISTORICAL_ONLY_STALE: excess.filter((e) => e.ELIGIBILITY_VERDICT === "HISTORICAL_ONLY_STALE").length,
    UPSTREAM_BLOCKED: excess.filter((e) => e.ELIGIBILITY_VERDICT === "UPSTREAM_BLOCKED").length,
    PHASE14_INCLUDED_BUT_BLOCKED: excess.filter((e) => e.ELIGIBILITY_VERDICT === "PHASE14_INCLUDED_BUT_BLOCKED").length,
    UNKNOWN_ROSTER_ENTRY: excess.filter((e) => e.ELIGIBILITY_VERDICT === "UNKNOWN_ROSTER_ENTRY").length,
  },
};
writeFileSync(path.join(OUT_DIR, "excess-roster-forms.json"), JSON.stringify(out, null, 2));

const lines = [];
lines.push("# Phase 14 Turn 4 — Excess Roster Forms (10)");
lines.push("");
lines.push(`Generated: ${out.generatedAt}`);
lines.push("");
lines.push("## Headline");
lines.push("");
lines.push("The application roster (93 forms) intersects the Phase-12 upstream-blocked set (130 forms) in **10 forms**. These are the 10 candidate \"excess\" forms. They are the 11 baseline + 5 Phase-1 promoted = 16 forms, minus the 6 standalone-baseline (BM-157/168/174/181/206/213) which Phase 12 cleared.");
lines.push("");
lines.push("## Per-form evidence");
lines.push("");
for (const e of excess) {
  lines.push(`### ${e.FORM_CODE}`);
  lines.push("");
  lines.push(`- **Roster source**: ${e.ROSTER_SOURCE}`);
  lines.push(`- **Baseline membership**: ${e.BASELINE_MEMBERSHIP}`);
  lines.push(`- **Phase-1 membership**: ${e.PHASE1_MEMBERSHIP}`);
  lines.push(`- **Phase-12 visual verdict**: ${e.PHASE12_VISUAL_VERDICT}`);
  lines.push(`- **Phase-12 exclusion reasons**: ${JSON.stringify(e.PHASE12_EXCLUSION_REASONS)}`);
  lines.push(`- **Phase-14 included**: ${e.PHASE14_INCLUDED}`);
  lines.push(`- **Phase-14 lifecycle**: ${e.PHASE14_LIFECYCLE}`);
  lines.push(`- **Phase-14 verdict**: ${e.PHASE14_VERDICT}`);
  lines.push(`- **Phase-14 evidence source**: ${e.PHASE14_EVIDENCE_SOURCE}`);
  lines.push(`- **Phase-14 crosswalk verdict**: ${e.PHASE14_CROSSWALK_VERDICT}`);
  lines.push(`- **Persisted in Turn 4**: ${e.PERSISTED_IN_TURN4}`);
  lines.push(`- **Standalone in Turn 4**: ${e.STANDALONE_IN_TURN4}`);
  lines.push(`- **Current authority hash**: ${e.CURRENT_AUTHORITY_HASH}`);
  lines.push(`- **Current promotion status**: ${e.CURRENT_PROMOTION_STATUS}`);
  lines.push(`- **Upstream blocked status**: ${e.UPSTREAM_BLOCKED_STATUS}`);
  lines.push(`- **Eligibility verdict**: **${e.ELIGIBILITY_VERDICT}**`);
  lines.push(`- **Blocking reason**: ${e.BLOCKING_REASON}`);
  lines.push("");
}
lines.push("## Summary");
lines.push("");
for (const [k, v] of Object.entries(out.summary)) {
  lines.push(`- ${k}: ${v}`);
}
writeFileSync(path.join(OUT_DIR, "excess-roster-forms.md"), lines.join("\n"));

console.log("Wrote: excess-roster-forms.json");
console.log("Wrote: excess-roster-forms.md");
console.log("Excess forms:", excess.length);
console.log("Summary:", out.summary);
