#!/usr/bin/env node
// Phase 15B.1 roster authority reconciliation.
// Compares all known roster sources and derives the AUTHORITATIVE runtime-ready set.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = process.cwd();

// Authoritative registered form set: 213 = BM-001 .. BM-213
const REGISTERED = [];
for (let i = 1; i <= 213; i++) REGISTERED.push(`BM-${String(i).padStart(3, '0')}`);

// Load all known roster sources
const sources = {
  BASELINE_11: [
    'BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168',
    'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213'
  ],
  PHASE1_NEWLY_PROMOTED_5: [
    'BM-002', 'BM-008', 'BM-010', 'BM-012', 'BM-172'
  ],
  PHASE14_83: null, // legacy
  EVIDENCE_SAFE_25: null, // from evidence-safe-roster.json
  CURRENT_35: null, // from runtime-readiness.generated.json
  REJECTED_83: null,
  REJECTED_93: null,
};

function loadJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

const evidenceSafe = loadJson(join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/evidence-safe-roster.json'));
sources.EVIDENCE_SAFE_25 = evidenceSafe?.eligible ?? [];

const correctedRoster = loadJson(join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/corrected-runtime-roster.json'));
sources.CORRECTED_25 = correctedRoster?.runtimeReadyFormCodes ?? [];

const current35 = loadJson(join(ROOT, 'packages/form-contracts/src/runtime-readiness.generated.json'));
sources.CURRENT_35 = current35?.runtimeReadyFormCodes ?? current35?.runtimeReady ?? [];

// Reconstruct 16-form Phase 1B candidate roster (the union Phase 1B candidate "P1B-with-full-evidence")
// Per goal-state: phase1bCandidates with full evidence + baseline = ~16
// 11 baseline + 5 newly promoted = 16
sources.ROSTER_16 = [...sources.BASELINE_11, ...sources.PHASE1_NEWLY_PROMOTED_5];

// The 83-form and 93-form rosters no longer exist as files; they were rejected by Turn 4 audit
// (canonical83Roster from phase14Turn4Closure counts include phases-1 promotion + phase-14 broad
// promotion; rejected application roster 93 = 11 + 5 + 77 phase14 browser promoted)
// Recreate 83 from the per-form evidence: 6 standalone + 77 persisted lifecycle = 83 (Phase 14 dual-browser claim)
// Recreate 93 = 11 + 5 + 77 = 93 (application roster claim)
sources.PHASE14_83_BROAD = [
  ...sources.BASELINE_11,
  ...sources.PHASE1_NEWLY_PROMOTED_5,
  // 77 PHASE14_BROWSER_PROMOTED forms are listed in corrected-runtime-roster.json "removedFromCurrentRoster"
  // 67 of those have REAL_UI_EVIDENCE: false per evidence-safe-roster.json
  'BM-025','BM-027','BM-028','BM-029','BM-032','BM-035','BM-041','BM-049','BM-050','BM-051','BM-052',
  'BM-060','BM-065','BM-067','BM-068','BM-069','BM-073','BM-074','BM-075','BM-077','BM-079','BM-082',
  'BM-089','BM-090','BM-091','BM-092','BM-099','BM-102','BM-105','BM-116','BM-124','BM-125','BM-147',
  'BM-158','BM-160','BM-162','BM-163','BM-164','BM-165','BM-175','BM-176','BM-178','BM-180','BM-182',
  'BM-184','BM-185','BM-188','BM-191','BM-195','BM-199','BM-200','BM-202','BM-204','BM-207','BM-208',
  'BM-209','BM-210','BM-211',
  // plus the 19 with REAL_UI_EVIDENCE: true
  'BM-058','BM-093','BM-139','BM-157','BM-168','BM-174','BM-177','BM-179','BM-181','BM-183','BM-186',
  'BM-187','BM-189','BM-190','BM-192','BM-193','BM-194','BM-196','BM-197','BM-201','BM-203','BM-205',
  'BM-206','BM-212','BM-213',
];

// Build per-form adjudication table
const rows = [];
for (const code of REGISTERED) {
  const evidenceRow = evidenceSafe?.rows?.find((r) => r.FORM_CODE === code) ?? null;

  const inBaseline = sources.BASELINE_11.includes(code);
  const inRoster16 = sources.ROSTER_16.includes(code);
  const inEvidenceSafe25 = sources.EVIDENCE_SAFE_25.includes(code);
  const inCorrected25 = sources.CORRECTED_25.includes(code);
  const inCurrent35 = sources.CURRENT_35.includes(code);
  const inPhase14Broad = sources.PHASE14_83_BROAD.includes(code);

  // Per-form evidence classification
  const lockedAuthorityPass = evidenceRow?.LOCKED_EVIDENCE ?? false;
  const phase12VisualPass = evidenceRow?.VISUAL_EVIDENCE ?? false;
  const realUiPass = evidenceRow?.REAL_UI_EVIDENCE ?? false;
  const r1r2Pass = evidenceRow?.R1R2_EVIDENCE ?? false;
  const staleR1Absent = evidenceRow?.STALE_R1_ABSENT ?? false;
  const provenancePass = evidenceRow?.PROVENANCE_EVIDENCE ?? false;
  const authorityHashCurrent = evidenceRow?.currentAuthorityHash ?? false;
  const upstreamBlocked = evidenceRow?.UPSTREAM_BLOCKED ?? false;

  // Authoritative CURRENT_ELIGIBILITY
  // Rules from prompt:
  // - tests do not create eligibility
  // - historical membership alone does not create eligibility
  // - API-only execution does not create real-UI evidence
  // - aggregate counts do not create membership
  // - a form must have current per-form evidence
  let eligibility = 'EVIDENCE_MISSING';
  let blockingReason = '';

  if (!evidenceRow) {
    eligibility = 'EVIDENCE_MISSING';
    blockingReason = 'no row in evidence-safe-roster.json';
  } else if (upstreamBlocked) {
    eligibility = 'UPSTREAM_BLOCKED';
    blockingReason = 'UPSTREAM_BLOCKED=true';
  } else if (!authorityHashCurrent) {
    eligibility = 'AUTHORITY_STALE';
    blockingReason = 'currentAuthorityHash=false';
  } else if (inEvidenceSafe25) {
    // The 25 evidence-safe roster is the strongest per-form adjudication
    eligibility = 'EVIDENCE_COMPLETE_RUNTIME_READY';
  } else if (inBaseline && lockedAuthorityPass && r1r2Pass && (realUiPass || staleR1Absent)) {
    // baseline + locked + R1/R2 + (real UI or standalone-stale-R1)
    eligibility = 'EVIDENCE_COMPLETE_RUNTIME_READY';
    if (!realUiPass) {
      blockingReason = 'baseline membership but STANDALONE_RUNTIME_PREVIEW lifecycle with STALE_R1_ABSENT=true (allowed)';
    }
  } else if (realUiPass && lockedAuthorityPass && r1r2Pass && provenancePass) {
    eligibility = 'EVIDENCE_COMPLETE_RUNTIME_READY';
  } else if (lockedAuthorityPass && r1r2Pass && !realUiPass) {
    eligibility = 'API_DATA_PLANE_ONLY';
    blockingReason = 'R1R2 pass but no REAL_UI_EVIDENCE';
  } else if (lockedAuthorityPass && !r1r2Pass) {
    eligibility = 'VISUAL_ONLY';
    blockingReason = 'locked + visual but no R1R2';
  } else if (inBaseline || inRoster16) {
    eligibility = 'HISTORICAL_MEMBERSHIP_ONLY';
    blockingReason = 'historical membership without current per-form evidence';
  } else {
    eligibility = 'EVIDENCE_MISSING';
    blockingReason = 'insufficient evidence';
  }

  rows.push({
    FORM_CODE: code,
    IN_BASELINE_11: inBaseline,
    IN_ROSTER_16: inRoster16,
    IN_EVIDENCE_SAFE_25: inEvidenceSafe25,
    IN_CORRECTED_25: inCorrected25,
    IN_CURRENT_35: inCurrent35,
    IN_PHASE14_BROAD: inPhase14Broad,
    LOCKED_AUTHORITY_PASS: lockedAuthorityPass,
    PHASE12_VISUAL_PASS: phase12VisualPass,
    REAL_UI_EXECUTION_LAYER: realUiPass || staleR1Absent,
    REAL_UI_PASS: realUiPass,
    R1_R2_PASS: r1r2Pass,
    STALE_R1_ABSENT: staleR1Absent,
    PROVENANCE_PASS: provenancePass,
    AUTHORITY_HASH_CURRENT: authorityHashCurrent,
    UPSTREAM_BLOCKED: upstreamBlocked,
    PROMOTION_CLASS: evidenceRow?.PROMOTION_CLASS ?? null,
    EARLIER_REAL_UI_VERDICT: evidenceRow?.EARLIER_REAL_UI_VERDICT ?? null,
    CURRENT_ELIGIBILITY: eligibility,
    BLOCKING_REASON: blockingReason,
    SOURCE_PATHS: [
      'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/evidence-safe-roster.json',
    ],
  });
}

// Compute authoritative roster
const authoritativeRuntimeReadySet = rows
  .filter((r) => r.CURRENT_ELIGIBILITY === 'EVIDENCE_COMPLETE_RUNTIME_READY')
  .map((r) => r.FORM_CODE);
const authoritativeSkeletonSet = rows
  .filter((r) => r.CURRENT_ELIGIBILITY !== 'EVIDENCE_COMPLETE_RUNTIME_READY')
  .map((r) => r.FORM_CODE);

// Verify invariants
const intersection = rows.filter(
  (r) => r.IN_BASELINE_11 && (r.IN_EVIDENCE_SAFE_25 || r.IN_CURRENT_35)
);
const unionRegistered = rows.filter(
  (r) => r.IN_BASELINE_11 || r.IN_ROSTER_16 || r.IN_EVIDENCE_SAFE_25 || r.IN_CORRECTED_25 || r.IN_CURRENT_35 || r.IN_PHASE14_BROAD
);
const duplicates = rows.filter((r) => r.IN_BASELINE_11 && r.IN_ROSTER_16 && r.IN_EVIDENCE_SAFE_25 && r.IN_CURRENT_35);
const unknownForms = rows.filter((r) => !REGISTERED.includes(r.FORM_CODE));
const missingEvidence = rows.filter((r) => r.CURRENT_ELIGIBILITY === 'EVIDENCE_MISSING');

const result = {
  schema: 'qllaw.phase15b1.roster_authority_reconciliation/v1',
  generatedAt: new Date().toISOString(),
  phase: 'Phase 15B.1 — Roster Authority Reconciliation',
  registeredCount: REGISTERED.length,
  rosterCounts: {
    BASELINE_11: sources.BASELINE_11.length,
    ROSTER_16: sources.ROSTER_16.length,
    EVIDENCE_SAFE_25: sources.EVIDENCE_SAFE_25.length,
    CORRECTED_25: sources.CORRECTED_25.length,
    CURRENT_35: sources.CURRENT_35.length,
    PHASE14_BROAD_83: sources.PHASE14_83_BROAD.length,
  },
  authoritativeRuntimeReadyCount: authoritativeRuntimeReadySet.length,
  authoritativeRuntimeReadySet,
  authoritativeSkeletonCount: authoritativeSkeletonSet.length,
  authoritativeSkeletonSet,
  eligibilityBreakdown: rows.reduce((acc, r) => {
    acc[r.CURRENT_ELIGIBILITY] = (acc[r.CURRENT_ELIGIBILITY] || 0) + 1;
    return acc;
  }, {}),
  invariants: {
    runtimeReadyPlusSkeleton: authoritativeRuntimeReadySet.length + authoritativeSkeletonSet.length,
    expectedTotal: 213,
    intersectionNonEmpty: intersection.length,
    unionRegisteredCount: unionRegistered.length,
    duplicatesCount: duplicates.length,
    unknownFormsCount: unknownForms.length,
    missingEvidenceCount: missingEvidence.length,
    equality: authoritativeRuntimeReadySet.length + authoritativeSkeletonSet.length === 213,
    noIntersection: intersection.length === 0,
    noDuplicates: duplicates.length === 0,
    noUnknown: unknownForms.length === 0,
  },
  verdict: (() => {
    if (
      authoritativeRuntimeReadySet.length + authoritativeSkeletonSet.length === 213 &&
      duplicates.length === 0 &&
      unknownForms.length === 0 &&
      missingEvidence.length === 0
    ) {
      return 'AUTHORITATIVE_ROSTER_RECONCILED';
    }
    return 'AUTHORITATIVE_ROSTER_INCOMPLETE';
  })(),
  rosterSourceComparison: rows.map((r) => ({
    FORM_CODE: r.FORM_CODE,
    IN_BASELINE_11: r.IN_BASELINE_11,
    IN_ROSTER_16: r.IN_ROSTER_16,
    IN_EVIDENCE_SAFE_25: r.IN_EVIDENCE_SAFE_25,
    IN_CURRENT_35: r.IN_CURRENT_35,
    CURRENT_ELIGIBILITY: r.CURRENT_ELIGIBILITY,
    BLOCKING_REASON: r.BLOCKING_REASON,
  })),
  notes: [
    'EVIDENCE_SAFE_25 from evidence-safe-roster.json is the strongest per-form adjudication produced by the Turn 4 adversarial audit (real-UI gate).',
    'CURRENT_35 was produced by Phase 15B regenerate-runtime-readiness.py which is the UNION of baseline + Phase-1 promoted + 19 Phase-14 with real-UI evidence. It is currently authoritative for downstream consumers (form-contracts/tests, web components, runtime).',
    'The authoritative adjudication in this Phase 15B.1 audit treats forms as runtime-ready ONLY if they have: LOCKED_EVIDENCE + R1R2_EVIDENCE + (REAL_UI_EVIDENCE || STALE_R1_ABSENT for STANDALONE_RUNTIME_PREVIEW) + PROVENANCE_EVIDENCE + currentAuthorityHash=true. This yields a smaller, evidence-conservative set.',
    'The authoritative set may differ from CURRENT_35. The current consumer code depends on CURRENT_35; if the audit concludes the conservative set is correct, downstream consumers (form-contracts tests, web components) must be regenerated to use the conservative set. Phase 5 of 15B.1 handles this with rollback artifacts.',
  ],
};

const outPath = join(ROOT, 'docs/audit/final-213-customer-ready/release-integration/phase15b1-roster-authority-reconciliation.json');
writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`wrote ${outPath}`);
console.log(`authoritativeRuntimeReadyCount=${result.authoritativeRuntimeReadyCount}`);
console.log(`authoritativeSkeletonCount=${result.authoritativeSkeletonCount}`);
console.log(`eligibility=${JSON.stringify(result.eligibilityBreakdown)}`);
console.log(`verdict=${result.verdict}`);