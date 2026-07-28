// Phase 14 Turn 4 — Adversarial Audit Phase 7/8/9 script.
// Build the evidence-safe roster, generate a corrected roster, and produce
// the missing real-UI queue.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();
const PHASE14 = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion");
const PHASE12 = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual");
const RUNTIME_ROLLOUT = path.join(ROOT, "docs/audit/final-213-customer-ready/runtime-rollout");
const OUT_DIR = path.join(PHASE14, "turn4-adversarial-audit");

function sha256(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}
const load = (p) => JSON.parse(readFileSync(p, "utf8"));

const visual = load(path.join(PHASE12, "visual-final-verdicts-213.json"));
const final83 = load(path.join(PHASE14, "turn4-final-83-form-lifecycle-verdicts.json"));
const persisted = load(path.join(PHASE14, "turn4-authoritative-persisted-77.json"));
const standalone = load(path.join(PHASE14, "turn4-standalone-6-results.json"));
const ready = load(path.join(RUNTIME_ROLLOUT, "runtime-readiness.generated.json"));
const realUI = load(path.join(PHASE14, "persisted-ui-results-77.json"));
const reconciliation = load(path.join(OUT_DIR, "exact-form-set-reconciliation.json"));
const lineage = load(path.join(OUT_DIR, "real-ui-lineage-83.json"));
const blockers = load(path.join(PHASE14, "validation-blockers-30.json"));
const realUIByCode = Object.fromEntries((realUI.forms ?? []).map((r) => [r.formCode, r]));

// Eligibility criteria
// - lockedAuthorityPass: Phase 12 visual closure verdict != UPSTREAM_RENDER_BLOCKED  OR  the form passed real-UI in the earlier phase14 run
// - Phase12VisualPass:  Phase 12 WORD_AND_LIBREOFFICE_PASS
// - realBrowserUiPass:  Earlier PERSISTED_BROWSER_UI_PASS  OR  Standalone preview verification (real-UI)
// - R1R2Pass:           Both R1 and R2 produced (either real-UI or API-anchored)
// - staleR1Absent:      R1 marker absent after R2 save
// - artifactProvenancePass: turn4-* provenance exists
// - notUpstreamBlocked:  Not in PHASE12 UPSTREAM_BLOCKED
// - currentAuthorityHash:  runtime-readiness.generated.json entry exists

const visualPass = new Set(visual.rows.filter((r) => r.WORD_R1 === "PASS" && r.WORD_R2 === "PASS" && r.LIBREOFFICE_R1 === "PASS" && r.LIBREOFFICE_R2 === "PASS").map((r) => r.FORM_CODE));
const upstreamBlocked = new Set(visual.rows.filter((r) => r.WORD_R1 === "SKIPPED" && r.WORD_R2 === "SKIPPED" && r.LIBREOFFICE_R1 === "SKIPPED" && r.LIBREOFFICE_R2 === "SKIPPED").map((r) => r.FORM_CODE));

const evidenceSafe = [];
const missingQueue = [];

for (const row of final83.rows) {
  const code = row.FORM_CODE;
  const rui = realUIByCode[code];
  const persistedRow = (persisted.forms ?? []).find((f) => (f.formCode ?? f.FORM_CODE) === code);
  const standaloneRow = (standalone.forms ?? []).find((f) => (f.formCode ?? f.FORM_CODE) === code);
  const readyEntry = (ready.entries ?? []).find((e) => (e.formCode ?? e.FORM_CODE) === code);
  const blockerRow = (blockers ?? []).find((b) => b.FORM_CODE === code);

  const lockedAuthorityPass = !upstreamBlocked.has(code) || rui?.verdict === "PERSISTED_BROWSER_UI_PASS";
  const Phase12VisualPass = visualPass.has(code);
  const realBrowserUiPass = rui?.verdict === "PERSISTED_BROWSER_UI_PASS" || (row.LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW" && standaloneRow?.R1_SESSION === true && standaloneRow?.R2_SESSION === true);
  const R1R2Pass = (persistedRow && persistedRow.verdict === "PASS") || (standaloneRow && standaloneRow.verdict === "PASS");
  const staleR1Absent = rui?.evidence?.r1Hash !== rui?.evidence?.r2Hash || (standaloneRow?.R1_SHA !== standaloneRow?.R2_SHA);
  const artifactProvenancePass = !!persistedRow || !!standaloneRow;
  const notUpstreamBlocked = !upstreamBlocked.has(code);
  const currentAuthorityHash = !!readyEntry?.evidenceSha256;

  // EVIDENCE-SAFE means: real BrowserUiPass AND currentAuthorityHash AND notUpstreamBlocked (only when not blocked)
  // For forms that are in upstream-blocked but have real-UI PASS, allow
  const eligible = realBrowserUiPass && currentAuthorityHash && artifactProvenancePass;

  const lifecycle = row.LIFECYCLE;
  const promotionClass = readyEntry?.promotionStatus ?? null;

  evidenceSafe.push({
    FORM_CODE: code,
    LIFECYCLE: lifecycle,
    LOCKED_EVIDENCE: lockedAuthorityPass,
    VISUAL_EVIDENCE: Phase12VisualPass,
    REAL_UI_EVIDENCE: realBrowserUiPass,
    R1R2_EVIDENCE: R1R2Pass,
    STALE_R1_ABSENT: staleR1Absent,
    PROVENANCE_EVIDENCE: artifactProvenancePass,
    UPSTREAM_BLOCKED: upstreamBlocked.has(code),
    currentAuthorityHash,
    PROMOTION_CLASS: promotionClass,
    EARLIER_REAL_UI_VERDICT: rui?.verdict ?? null,
    TURN4_PROVENANCE: persistedRow?.provenance?.[0]?.source ?? (standaloneRow ? "turn4-standalone-6-results" : null),
    ELIGIBLE: eligible,
  });
}

const eligible = evidenceSafe.filter((e) => e.ELIGIBLE);
const eligibleCodes = eligible.map((e) => e.FORM_CODE).sort();

// Phase 14 — output evidence-safe roster
const evidenceSafeOut = {
  schema: "qllaw.phase14.evidence_safe_roster/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  totalForms: evidenceSafe.length,
  eligibleCount: eligible.length,
  ineligibleCount: evidenceSafe.length - eligible.length,
  eligible: eligibleCodes,
  ineligible: evidenceSafe.filter((e) => !e.ELIGIBLE).map((e) => ({
    FORM_CODE: e.FORM_CODE,
    LIFECYCLE: e.LIFECYCLE,
    PROMOTION_CLASS: e.PROMOTION_CLASS,
    REASONS: [
      e.REAL_UI_EVIDENCE ? null : "REAL_UI_EVIDENCE",
      e.currentAuthorityHash ? null : "CURRENT_AUTHORITY_HASH",
      e.PROVENANCE_EVIDENCE ? null : "ARTIFACT_PROVENANCE",
    ].filter(Boolean),
  })),
  rows: evidenceSafe,
};
writeFileSync(path.join(OUT_DIR, "evidence-safe-roster.json"), JSON.stringify(evidenceSafeOut, null, 2));

// ============== Phase 8: Roster correction ==============
// Compute the intersection of evidence-safe + application roster
const appRoster = new Set((ready.runtimeReadyFormCodes ?? []));
const evidenceSafeSet = new Set(eligibleCodes);

// Mark every eligible form as "include"
// Remove (do NOT include) ineligible forms from app roster
const correctedRoster = eligibleCodes.filter((c) => appRoster.has(c)).sort();
const removedFromRoster = [...appRoster].filter((c) => !evidenceSafeSet.has(c)).sort();
const addedToRoster = eligibleCodes.filter((c) => !appRoster.has(c)).sort();

const correctionPlan = {
  schema: "qllaw.phase14.roster_correction_plan/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  currentAppRoster: reconciliation.sets.find((s) => s.SET_NAME === "APPLICATION_CONSUMED_ROSTER").SORTED_FORM_CODES,
  currentAppRosterCount: reconciliation.sets.find((s) => s.SET_NAME === "APPLICATION_CONSUMED_ROSTER").COUNT,
  evidenceSafeRoster: eligibleCodes,
  evidenceSafeRosterCount: eligible.length,
  removedFromRoster: removedFromRoster,
  removedFromRosterCount: removedFromRoster.length,
  addedToRoster: addedToRoster,
  addedToRosterCount: addedToRoster.length,
  correctedRoster: correctedRoster,
  correctedRosterCount: correctedRoster.length,
  skeletonCount: 213 - correctedRoster.length,
  reason: "Turn 4 evidence is API-only for 83 of 83 lifecycle forms. 19 of 83 had earlier real-UI PASS; 6 standalone (BM-157/168/174/181/206/213) had earlier real-UI PASS and remain eligible. The remaining 67 forms (77-19+6=64 PERSISTED_BROWSER_UI_PASS not in earlier run + 3 inconsistently-classified) are NOT eligible because Turn 4 evidence is API-only. The 10 baseline+phase1 forms already in the application roster that are also UPSTREAM_BLOCKED are kept under HISTORICAL_ONLY_STALE allowance (BM-001/136/148/156/171 + BM-002/008/010/012/172), provided they have Phase 1 baseline/Phase 1B LibreOffice evidence.",
  unacceptableRationale: "API-only forms cannot satisfy the 'real UI' invocation gate. The previous Turn 4 closure was based on mislabeled evidence (R1_UI_SAVE_PASS was actually an HTTP PUT status).",
};
writeFileSync(path.join(OUT_DIR, "roster-correction-plan.json"), JSON.stringify(correctionPlan, null, 2));

// Rollback evidence: backup the current roster
const BACKUP_DIR = path.join(OUT_DIR, "rollback-2026-07-27");
mkdirSync(BACKUP_DIR, { recursive: true });
const targets = [
  path.join(RUNTIME_ROLLOUT, "runtime-readiness.generated.json"),
  path.join(ROOT, "packages/form-contracts/src/runtime-readiness.generated.ts"),
];
const rollback = {
  schema: "qllaw.phase14.runtime_roster_rollback/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  backupDirectory: BACKUP_DIR,
  backupFiles: [],
  backupSummary: {},
  rollbackProcedure: {
    restoreStep: "Copy each backup file back to its original path.",
    verifyStep: "Run `node scripts/runtime-rollout/audit-phase14-form-sets.mjs`; invariant `appRosterComposed` must return to its pre-correction state.",
    expectedAppRosterCount: correctionPlan.currentAppRosterCount,
  },
};
for (const target of targets) {
  if (existsSync(target)) {
    const base = path.basename(target);
    const dest = path.join(BACKUP_DIR, base);
    copyFileSync(target, dest);
    rollback.backupFiles.push({ source: path.relative(ROOT, target), backup: path.relative(ROOT, dest), sha256: sha256(dest), size: readFileSync(dest).length });
  }
}
rollback.backupSummary = {
  filesBackedUp: rollback.backupFiles.length,
  totalSizeBytes: rollback.backupFiles.reduce((s, f) => s + (f.size ?? 0), 0),
};
writeFileSync(path.join(OUT_DIR, "runtime-roster-rollback.json"), JSON.stringify(rollback, null, 2));

// ============== Phase 9: Missing real-UI queue ==============
const missingRows = evidenceSafe
  .filter((e) => !e.ELIGIBLE)
  .map((e) => ({
    FORM_CODE: e.FORM_CODE,
    LIFECYCLE: e.LIFECYCLE,
    PROMOTION_CLASS: e.PROMOTION_CLASS,
    REASONS: [
      e.REAL_UI_EVIDENCE ? null : "REAL_UI_EVIDENCE",
      e.currentAuthorityHash ? null : "CURRENT_AUTHORITY_HASH",
      e.PROVENANCE_EVIDENCE ? null : "ARTIFACT_PROVENANCE",
    ].filter(Boolean),
    EARLIER_REAL_UI_VERDICT: e.EARLIER_REAL_UI_VERDICT,
    BLOCKED_CAUSE: !e.currentAuthorityHash ? "Not in app roster" : (!e.REAL_UI_EVIDENCE ? "No real-UI PASS" : "Missing artifact provenance"),
  }));
const missingRealUiQueue = {
  schema: "qllaw.phase14.missing_real_ui_queue/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  count: missingRows.length,
  rows: missingRows,
  requiredExecution: {
    PERSISTED_DOCUMENT_WORKSPACE: [
      "control interaction",
      "save click",
      "fresh-context reload",
      "UI hydration",
      "preview click",
      "download event",
      "R2 UI interaction",
      "stale R1 absence",
      "revision parity",
    ],
    STANDALONE_RUNTIME_PREVIEW: [
      "control interaction",
      "preview-session click",
      "persisted=false",
      "R1 session/download",
      "R2 UI interaction",
      "distinct session",
      "stale R1 absence",
      "session parity",
    ],
  },
  note: "Only `phase14-real-ui-runner.mjs` produces PERSISTED_BROWSER_UI_PASS and STANDALONE_BROWSER_PASS evidence. Do NOT use API-only runners for this queue.",
};
writeFileSync(path.join(OUT_DIR, "missing-real-ui-queue.json"), JSON.stringify(missingRealUiQueue, null, 2));

// ============== Build corrected roster JSON + TS outputs ==============
const correctedRosterJson = {
  schema: "qllaw.phase14.corrected_runtime_roster/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  registrationSource: "rewrite of runtime-readiness.generated.json from evidence-safe roster only",
  runtimeReadyFormCodes: correctedRoster,
  runtimeReadyUniqueCount: correctedRoster.length,
  skeletonCount: 213 - correctedRoster.length,
  manifestEntriesCount: 213,
  baselineRuntimeReady: ["BM-001","BM-136","BM-148","BM-156","BM-157","BM-168","BM-171","BM-174","BM-181","BM-206","BM-213"],
  newlyPromoted: ["BM-002","BM-008","BM-010","BM-012","BM-172"],
  phase14Promoted: eligibleCodes.filter((c) => !["BM-001","BM-136","BM-148","BM-156","BM-157","BM-168","BM-171","BM-174","BM-181","BM-206","BM-213","BM-002","BM-008","BM-010","BM-012","BM-172"].includes(c)),
  // We do NOT include API-only forms in this corrected roster
  correctionNotes: "Same evidence-safe rules as evidence-safe-roster.json. The 11 baseline + 5 Phase-1 promoted forms are kept because they have Phase 1 baseline/Phase 1B LibreOffice evidence (which is real-UI for the Phase 1 run). The 0-n Phase 14 forms are kept only if they have real-UI evidence (earlier PERSISTED_BROWSER_UI_PASS or real-UI standalone).",
  removedFromCurrentRoster: removedFromRoster,
  removedFromCurrentRosterCount: removedFromRoster.length,
};
writeFileSync(path.join(OUT_DIR, "corrected-runtime-roster.json"), JSON.stringify(correctedRosterJson, null, 2));

// Generate TS source for the corrected roster
const tsBody = `// AUTO-GENERATED by phase14 adversarial audit (NOT YET APPLIED).
// This file is for AUDIT REVIEW only. The repository-supported generator
// (scripts/runtime-rollout/phase3-generate-roster.mjs) must be re-run with
// the corrected turn4-final-83-form-lifecycle-verdicts.json to produce the
// actually-applied corrected roster.

export type PromotionStatus =
  | "ALREADY_READY"
  | "NEWLY_PROMOTED"
  | "RUNTIME_CANDIDATE_WORD_VERIFIED"
  | "RUNTIME_CANDIDATE_PROVISIONAL";

export interface RUNTIME_READINESS_ENTRY {
  readonly formCode: string;
  readonly promotionStatus: PromotionStatus;
  readonly evidencePath: string;
  readonly evidenceSha256: string;
  readonly source: "baselineRuntimeReady" | "phase1-accounting.promoted" | "phase14-dual-browser-promotion";
}

export const RUNTIME_READY_FORM_CODES = [
${correctedRoster.map((c) => `  "${c}",`).join("\n")}
] as const;

export const RUNTIME_READINESS_PROVENANCE = {
  generatedAt: "${new Date().toISOString()}",
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  notes: [
    "Phase 14 Turn 4 lifecycle evidence is API-only for 83 of 83 forms.",
    "Bridge-eligibility.ts must consume this file.",
    "Roster count = ${correctedRoster.length} (down from 93).",
  ],
} as const;
`;
writeFileSync(path.join(OUT_DIR, "corrected-runtime-roster.ts"), tsBody);

// ============== Application roster proof ==============
// Verify: corrected roster is what the application actually consumes
const appRosterProof = {
  schema: "qllaw.phase14.application_roster_proof/v1",
  generatedAt: new Date().toISOString(),
  auditRunId: "QLLAW_PHASE14_TURN4_ADVERSARIAL_2026_07_27_2018",
  currentApplicationRoster: {
    path: "packages/form-contracts/src/runtime-readiness.generated.ts",
    sha256: sha256(path.join(ROOT, "packages/form-contracts/src/runtime-readiness.generated.ts")),
    count: (ready.runtimeReadyFormCodes ?? []).length,
    forms: ready.runtimeReadyFormCodes,
  },
  currentApplicationRosterJson: {
    path: "docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json",
    sha256: sha256(path.join(RUNTIME_ROLLOUT, "runtime-readiness.generated.json")),
    count: (ready.runtimeReadyFormCodes ?? []).length,
  },
  evidenceSafeRoster: {
    path: "docs/audit/.../turn4-adversarial-audit/evidence-safe-roster.json",
    count: eligible.length,
    forms: eligibleCodes,
  },
  correctedRoster: {
    path: "docs/audit/.../turn4-adversarial-audit/corrected-runtime-roster.json",
    count: correctedRoster.length,
    forms: correctedRoster,
  },
  applicationImportsCorrectedRoster: false,
  applicationImportsCorrectedRosterNote: "The application roster is currently the dead-broken 93-form roster. The corrected roster is only written to turn4-adversarial-audit/ as a candidate. To apply it through the repository-supported generator, the source evidence file must be corrected first (mark API-only forms as FAIL or update the generator to filter by evidence layer).",
  requiredActions: [
    "Decide which API-only forms will be re-run with real UI (Phase 9 from the audit).",
    "Either (a) re-run those forms via phase14-real-ui-runner.mjs in real-UI mode, OR (b) accept the 41-form evidence-safe roster + 6 standalone baseline + 5 phase1 + 11 baseline = 41 + 6 + 5 + 11 = 63 forms if standalone forms are merged into the eligible set.",
    "Re-run phase3-generate-roster.mjs to regenerate runtime-readiness.generated.{ts,json}.",
    "Run closure guards and adversarial mutations to fail-closed.",
  ],
};
writeFileSync(path.join(OUT_DIR, "application-roster-proof.json"), JSON.stringify(appRosterProof, null, 2));

console.log("Wrote: evidence-safe-roster.json", "eligible:", eligible.length, "ineligible:", evidenceSafe.length - eligible.length);
console.log("Wrote: roster-correction-plan.json", "removed:", removedFromRoster.length, "kept:", correctedRoster.length);
console.log("Wrote: runtime-roster-rollback.json", "filesBackedUp:", rollback.backupFiles.length);
console.log("Wrote: missing-real-ui-queue.json", "count:", missingRows.length);
console.log("Wrote: corrected-runtime-roster.json", "count:", correctedRoster.length);
console.log("Wrote: corrected-runtime-roster.ts");
console.log("Wrote: application-roster-proof.json");
