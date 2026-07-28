// Phase 14 Turn 4 — Adversarial Audit Phase 4/5/6 script.
// Audits the 30 closed blockers, the 30 mutations, and the 15 closure guards.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PHASE14 = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion");
const OUT_DIR = path.join(PHASE14, "turn4-adversarial-audit");
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

// ============== PHASE 4: 30 closed blockers ==============
const blockers = load(path.join(PHASE14, "validation-blockers-30.json"));
const remediation = load(path.join(PHASE14, "turn4-validation-remediation-plan.json"));
const blockedResults = load(path.join(PHASE14, "turn4-blocked-closure-results-30.json"));
const realUI = load(path.join(PHASE14, "persisted-ui-results-77.json"));

const blockedPhase4 = (blockers ?? []).map((b) => {
  const code = b.FORM_CODE;
  const result = (blockedResults.results ?? []).find((r) => r.formCode === code);
  const realUIRow = (realUI.forms ?? []).find((r) => r.formCode === code);
  const remediationRow = (remediation.remediationRows ?? []).find((r) => r.FORM_CODE === code);

  const turn3Status = b.VERDICT ?? null;
  const turn4Status = result?.verdict ?? null;
  const closureMethod = result
    ? (realUIRow?.verdict === "PERSISTED_BROWSER_UI_PASS" ? "REAL_UI_CLOSURE" : "API_ONLY_CLOSURE")
    : "NO_PROVEN_CLOSURE";

  // UI evidence
  const uiControlEntry = realUIRow?.evidence?.r1?.stages?.find((s) => s.stage === "FILL_SAMPLE_CLICK")?.ok === true;
  const saveClick = realUIRow?.evidence?.r1?.stages?.find((s) => s.stage === "SAVE_CLICK")?.ok === true;
  const saveRequest = realUIRow?.evidence?.r1?.stages?.find((s) => s.stage === "SAVE_RESPONSE")?.status ?? null;
  const freshReload = realUIRow?.evidence?.freshContextReloaded === true;
  const r2Ui = realUIRow?.evidence?.r2?.stages?.find((s) => s.stage === "FILL_SAMPLE_CLICK")?.ok === true;
  const downloadEvent = realUIRow?.evidence?.downloadEvent ?? false;
  const staleR1Absent = realUIRow?.evidence?.verdict === "PERSISTED_BROWSER_UI_PASS";
  const staleR1DocxAbsent = realUIRow?.evidence?.r1Hash !== realUIRow?.evidence?.r2Hash;
  const validationErrorBefore = turn3Status;
  const validationErrorAfter = turn4Status === "PASS" ? "NONE" : (result?.error ?? "UNKNOWN");

  const finalVerdict = closureMethod === "REAL_UI_CLOSURE" ? "PASS" : (closureMethod === "API_ONLY_CLOSURE" ? "API_ONLY_NOT_UI" : "FAIL");

  return {
    FORM_CODE: code,
    TURN3_STATUS: turn3Status,
    TURN4_STATUS: turn4Status,
    CLOSURE_METHOD: closureMethod,
    UI_CONTROL_ENTRY_EVIDENCE: uiControlEntry,
    SAVE_CLICK_EVIDENCE: saveClick,
    SAVE_REQUEST_EVIDENCE: saveRequest,
    FRESH_RELOAD_EVIDENCE: freshReload,
    R2_UI_EVIDENCE: r2Ui,
    PREVIEW_CLICK_EVIDENCE: realUIRow?.evidence?.r1?.stages?.find((s) => s.stage === "PREVIEW_CLICK")?.ok === true,
    DOWNLOAD_EVENT_EVIDENCE: downloadEvent,
    STALE_R1_UI_EVIDENCE: staleR1Absent,
    STALE_R1_DOCX_EVIDENCE: staleR1DocxAbsent,
    VALIDATION_ERROR_BEFORE: validationErrorBefore,
    VALIDATION_ERROR_AFTER: validationErrorAfter,
    EARLIER_REAL_UI_VERDICT: realUIRow?.verdict ?? null,
    REMEDIATION_R1_DOC_NO: remediationRow?.GENERATED_R1?.decisionNumber ?? null,
    REMEDIATION_R2_DOC_NO: remediationRow?.GENERATED_R2?.decisionNumber ?? null,
    FINAL_VERDICT: finalVerdict,
  };
});

const blockedPhase4Out = {
  schema: "qllaw.phase14.turn4_validation_closure_audit_30/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  blockerCount: blockedPhase4.length,
  byClosureMethod: {
    REAL_UI_CLOSURE: blockedPhase4.filter((b) => b.CLOSURE_METHOD === "REAL_UI_CLOSURE").length,
    API_ONLY_CLOSURE: blockedPhase4.filter((b) => b.CLOSURE_METHOD === "API_ONLY_CLOSURE").length,
    NO_PROVEN_CLOSURE: blockedPhase4.filter((b) => b.CLOSURE_METHOD === "NO_PROVEN_CLOSURE").length,
  },
  rows: blockedPhase4,
  note: "REAL_UI_CLOSURE requires the form to have a PERSISTED_BROWSER_UI_PASS from earlier phase14-real-ui-runner.mjs. API_ONLY_CLOSURE means Turn 4 used HTTP API calls to bypass the validation. NO_PROVEN_CLOSURE means even Turn 4's API path did not produce a PASS.",
};
writeFileSync(path.join(OUT_DIR, "turn4-validation-closure-audit-30.json"), JSON.stringify(blockedPhase4Out, null, 2));

// ============== PHASE 5: 30 mutations ==============
const mutations = load(path.join(PHASE14, "browser-mutation-results.json"));

const mutationRows = (mutations.mutations ?? []).map((m) => {
  const isAPIPath = /API_ANCHORED_PROXY|API_BASED|API_PATH|API layer/i.test(m.semanticDelta ?? "");
  const executionMode = m.executionMode ?? (m.executionStatus === "EXECUTION_COMPLETED_API_ANCHORED" ? "API_ANCHORED_PROXY" : "UNKNOWN");
  const liveBrowserUsed = !!m.liveBrowserUsed;
  const realBaselineArtifact = !!m.realBaselineArtifact;
  const mutationApplied = m.mutationTriggered === true;
  const beforeHash = m.beforeHash ?? m.payloadSha ?? null;
  const afterHash = m.afterHash ?? m.payloadSha ?? null;
  const semanticDelta = m.semanticDelta ?? null;
  const guardExit = m.guardExitCode ?? null;
  const expectedFailure = m.expectedFailure ?? null;
  const actualFailure = m.actualFailure ?? null;
  const setupFailure = m.setupFailure ?? null;

  // Allowed execution modes
  let allowedMode = "LIST_ONLY";
  if (liveBrowserUsed && mutationApplied) {
    allowedMode = "LIVE_BROWSER_MUTATION";
  } else if (mutationApplied && !liveBrowserUsed && realBaselineArtifact) {
    allowedMode = "SYNTHETIC_ARTIFACT_MUTATION";
  } else if (mutationApplied && !liveBrowserUsed && !realBaselineArtifact) {
    allowedMode = "DEFINITION_ONLY";
  }

  const verdict = m.guardExitCode === 1 ? "PASS" : "FAIL";

  return {
    MUTATION_ID: m.id,
    EXECUTION_MODE: allowedMode,
    LIVE_BROWSER_USED: liveBrowserUsed,
    REAL_BASELINE_ARTIFACT: realBaselineArtifact,
    MUTATION_APPLIED: mutationApplied,
    BEFORE_HASH: beforeHash,
    AFTER_HASH: afterHash,
    SEMANTIC_DELTA: semanticDelta,
    GUARD_PROCESS_EXIT: guardExit,
    EXPECTED_FAILURE: expectedFailure,
    ACTUAL_FAILURE: actualFailure,
    SETUP_FAILURE: setupFailure,
    VERDICT: verdict,
  };
});

const phase5Out = {
  schema: "qllaw.phase14.browser_mutation_execution_audit/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  mutationTotal: mutationRows.length,
  byExecutionMode: {
    LIVE_BROWSER_MUTATION: mutationRows.filter((r) => r.EXECUTION_MODE === "LIVE_BROWSER_MUTATION").length,
    SYNTHETIC_ARTIFACT_MUTATION: mutationRows.filter((r) => r.EXECUTION_MODE === "SYNTHETIC_ARTIFACT_MUTATION").length,
    DEFINITION_ONLY: mutationRows.filter((r) => r.EXECUTION_MODE === "DEFINITION_ONLY").length,
    LIST_ONLY: mutationRows.filter((r) => r.EXECUTION_MODE === "LIST_ONLY").length,
  },
  rows: mutationRows,
  note: "Phase 14 live-browser gate requires 30 LIVE_BROWSER_MUTATION. The Turn 4 runner (phase14-turn4-mutations-30.mjs) self-describes as 'EXECUTION_COMPLETED_API_ANCHORED' and uses HTTP API probes; no Playwright was launched. All 30 mutations are therefore API_ANCHORED_PROXY (LIST_ONLY or DEFINITION_ONLY), not LIVE_BROWSER_MUTATION.",
};
writeFileSync(path.join(OUT_DIR, "browser-mutation-execution-audit.json"), JSON.stringify(phase5Out, null, 2));

// ============== PHASE 6: 15 closure guards ==============
const guards = load(path.join(PHASE14, "turn4-closure-guards.json"));
const guardAudits = (guards.guards ?? []).map((g) => {
  const id = g.id;
  const name = g.name;
  const observed = g.pass;
  const inputs = [
    "turn4-final-83-form-lifecycle-verdicts.json",
    "turn4-authoritative-persisted-77.json",
    "turn4-standalone-6-results.json",
    "turn4-smoke-12-results.json",
    "turn4-canary-results-7.json",
    "turn4-blocked-closure-results-30.json",
    "browser-mutation-results.json",
    "turn4-dynamic-ui-field-crosswalk.json",
    "canonical-83-form-roster.json",
    "runtime-readiness.generated.json",
    "runtime-readiness.generated.ts",
    "bridge-eligibility.ts",
    "turn4-promotion-consumer-dataflow.json",
  ];
  const inputHashes = inputs.map((p) => {
    try {
      const full = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion", p);
      const buf = readFileSync(full);
      const { createHash } = require("node:crypto");
      return { path: p, sha256: createHash("sha256").update(buf).digest("hex") };
    } catch (e) {
      return { path: p, error: e.message };
    }
  });
  const perFormOrAggregate = ["G01","G02","G03","G04","G05","G06","G07","G08","G09"].includes(id) ? "AGGREGATE_ONLY" : "AGGREGATE_ONLY";
  const requiresRealUI = ["G01","G02","G03","G04","G05","G06","G07"].includes(id);
  const apiOnlyAccepted = true; // observed behavior: API-only accepted

  // Trust verdict
  let trustVerdict = "TRUSTED";
  let reason = "PASS";
  // G07 is the one with API mutations
  if (id === "G07") {
    const liveMuts = phase5Out.byExecutionMode.LIVE_BROWSER_MUTATION ?? 0;
    if (liveMuts === 0) {
      trustVerdict = "UNTRUSTED_API_MUTATIONS_AS_LIVE";
      reason = "Guard considers all 30 mutations PASS, but they are not LIVE_BROWSER_MUTATION (runner is API-anchored).";
    }
  }
  if (id === "G01" || id === "G02" || id === "G03" || id === "G04" || id === "G05" || id === "G06") {
    trustVerdict = "UNTRUSTED_API_ONLY_AS_REAL_UI";
    reason = "Guard PASSes on API-only lifecycle verdicts. Real-UI inheritance is not enforced.";
  }
  if (id === "G10") {
    trustVerdict = "SOFT_PASS";
    reason = "Guard passes on appRosterSize >= 83, not == 83. Should be == 83 to enforce the 83 roster size invariant.";
  }
  if (id === "G14") {
    trustVerdict = "ALWAYS_TRUE";
    reason = "Guard predicate is literal `true` (phase14-turn4-closure-guards.mjs line 145: `true, // We explicitly keep productionReady=false per the protocol`).";
  }
  if (id === "G15") {
    trustVerdict = "ALWAYS_TRUE";
    reason = "Guard predicate is literal `true` (phase14-turn4-closure-guards.mjs line 151: `true, // 130 forms excluded by Phase 13c pre-live guard reconciliation`).";
  }
  if (id === "G11" || id === "G12") {
    trustVerdict = "INDIRECT";
    reason = "Passes on the consumer dataflow artifact existence, not on whether the consumer actually applied the evidence end-to-end.";
  }
  if (id === "G13") {
    trustVerdict = "STRING_MATCH";
    reason = "Passes on a regex string match in bridge-eligibility.ts; does not verify the alias resolves to the regenerated roster at runtime.";
  }
  if (id === "G08") {
    trustVerdict = "AGGREGATE_ONLY";
    reason = "Passes on crosswalk totalEditableFieldsAudited == 83 and unaccountedFields == 0; does not verify each form's UI controls existed.";
  }
  if (id === "G09") {
    trustVerdict = "TRUSTED";
  }

  return {
    CHECK_ID: id,
    CHECK_DESCRIPTION: name,
    INPUT_PATHS: inputs,
    INPUT_HASHES: inputHashes,
    PER_FORM_OR_AGGREGATE: perFormOrAggregate,
    REQUIRES_REAL_UI: requiresRealUI,
    API_ONLY_ACCEPTED: apiOnlyAccepted,
    OBSERVED: observed,
    PASS: g.pass,
    TRUST_VERDICT: trustVerdict,
    REASON: reason,
    EVIDENCE: g.evidence,
  };
});

const phase6Out = {
  schema: "qllaw.phase14.closure_guard_trust_audit/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  totalGuards: guardAudits.length,
  trusted: guardAudits.filter((g) => g.TRUST_VERDICT === "TRUSTED").length,
  untrusted: guardAudits.filter((g) => g.TRUST_VERDICT !== "TRUSTED").length,
  guards: guardAudits,
  summary: "G07 (mutations) trusts API-only mutations as live browser. G01-G06 trust API-only lifecycle verdicts as real UI. G10 is a soft pass (>= 83). G14 and G15 are literal `true` predicates. G11-G12 trust artifact existence. G13 is a regex string match.",
};
writeFileSync(path.join(OUT_DIR, "closure-guard-trust-audit.json"), JSON.stringify(phase6Out, null, 2));

console.log("Wrote: turn4-validation-closure-audit-30.json", `${blockedPhase4.length} rows`);
console.log("  byClosureMethod:", blockedPhase4Out.byClosureMethod);
console.log("Wrote: browser-mutation-execution-audit.json", `${mutationRows.length} rows`);
console.log("  byExecutionMode:", phase5Out.byExecutionMode);
console.log("Wrote: closure-guard-trust-audit.json", `${guardAudits.length} guards`);
console.log("  trusted:", phase6Out.trusted, "untrusted:", phase6Out.untrusted);
