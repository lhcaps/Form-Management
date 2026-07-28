import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPersistedDraftBridgeIneligibilityReason,
  isPersistedDraftBridgeRenderScope,
  STANDALONE_RUNTIME_TEMPLATE_CODES,
  UNREGISTERED_FORM_CANARY,
} from '../src/bridge-eligibility.js';
import {
  RUNTIME_READINESS_ENTRIES,
  RUNTIME_READY_FORM_CODES,
  RUNTIME_READINESS_PROVENANCE,
} from '../src/runtime-readiness.generated.js';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const GENERATED_JSON_PATH = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'runtime-readiness.generated.json',
);

test('bridge eligibility keeps standalone forms and unsupported target scopes out', () => {
  // Two canonical surfaces are intentionally distinct:
  // - STANDALONE_RUNTIME_TEMPLATE_CODES = 11-form form-flight baseline
  //   (hand-authored form-flight UI for `/templates/:code` runtime route).
  // - RUNTIME_READY_FORM_CODES = 25-form form-contracts bridge roster
  //   (`/documents/:id` generated-document persistence path).
  // The surfaces must NOT be aliases; each is authoritative for its own
  // lifecycle.
  assert.deepEqual(
    [...STANDALONE_RUNTIME_TEMPLATE_CODES].sort(),
    [
      'BM-001',
      'BM-136',
      'BM-148',
      'BM-156',
      'BM-157',
      'BM-168',
      'BM-171',
      'BM-174',
      'BM-181',
      'BM-206',
      'BM-213',
    ],
    'STANDALONE_RUNTIME_TEMPLATE_CODES must remain the 11-form form-flight baseline',
  );
  // RUNTIME_READY_FORM_CODES is the form-contracts bridge roster and
  // must contain both the 11-form baseline + the 14 PHASE14_BROWSER_PROMOTED
  // forms with REAL_UI evidence (25 = 11 + 14).
  assert.equal(
    RUNTIME_READY_FORM_CODES.length,
    25,
    'RUNTIME_READY_FORM_CODES must contain 25 forms',
  );
  // The standalone form-flight baseline subset is intentionally disjoint
  // from RUNTIME_READY_FORM_CODES for the 5 demoted baseline forms
  // (BM-001, BM-136, BM-148, BM-156, BM-171) per the Phase 15B.1 evidence
  // policy — those forms lack current per-form Turn 4 evidence rows, so
  // they remain on the form-flight baseline (for the standalone template
  // route) but were demoted from the form-contracts bridge roster (for
  // the generated-document persistence path). The 6 STANDALONE_RUNTIME_PREVIEW
  // forms (BM-157, BM-168, BM-174, BM-181, BM-206, BM-213) appear in both
  // rosters. The 14 PHASE14_BROWSER_PROMOTED forms appear only in
  // RUNTIME_READY_FORM_CODES (no hand-authored form-flight profile).
  const DEMOTED_BASELINE = new Set([
    'BM-001',
    'BM-136',
    'BM-148',
    'BM-156',
    'BM-171',
  ]);
  for (const code of STANDALONE_RUNTIME_TEMPLATE_CODES) {
    if (DEMOTED_BASELINE.has(code)) {
      assert.equal(
        (RUNTIME_READY_FORM_CODES as readonly string[]).includes(code),
        false,
        `${code} is a Phase 15B.1-demoted baseline form; it MUST NOT appear in RUNTIME_READY_FORM_CODES`,
      );
    } else {
      assert.ok(
        (RUNTIME_READY_FORM_CODES as readonly string[]).includes(code),
        `${code} is a retained baseline form-flight form and must also be in RUNTIME_READY_FORM_CODES`,
      );
    }
  }
  // The synthetic canary must never appear in either roster.
  assert.ok(
    !(STANDALONE_RUNTIME_TEMPLATE_CODES as readonly string[]).includes(
      '__UNREGISTERED_FORM_CANARY__',
    ),
  );
  assert.ok(
    !(RUNTIME_READY_FORM_CODES as readonly string[]).includes(
      '__UNREGISTERED_FORM_CANARY__',
    ),
  );
  assert.equal(isPersistedDraftBridgeRenderScope('CASE_LEVEL'), true);
  assert.equal(isPersistedDraftBridgeRenderScope('PERSON_LEVEL'), true);
  assert.equal(isPersistedDraftBridgeRenderScope('SELECTED_PERSONS'), true);
  assert.equal(isPersistedDraftBridgeRenderScope('EVIDENCE_LEVEL'), false);
  // BM-001 IS a standalone form-flight template (it has a hand-authored
  // form-flight profile in the 11-form baseline). The Phase 15B.1
  // evidence policy only demoted it from RUNTIME_READY_FORM_CODES (the
  // form-contracts bridge roster for /documents/:id persistence).
  // The standalone form-flight route (`/templates/:code`) still routes
  // BM-001 through the form-flight panel — the user gets the standalone
  // runtime preview, NOT the persisted-draft bridge.
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: 'BM-001',
      renderScope: 'CASE_LEVEL',
    }),
    'STANDALONE_RUNTIME_TEMPLATE',
    'BM-001 IS a standalone form-flight template; the persisted-draft bridge is NOT its path',
  );
  // Unsupported render scope wins over form eligibility.
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: 'BM-003',
      renderScope: 'EVENT_LEVEL',
    }),
    'UNSUPPORTED_RENDER_SCOPE',
  );
  // Unregistered canary always rejected.
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: UNREGISTERED_FORM_CANARY,
      renderScope: 'CASE_LEVEL',
    }),
    'UNREGISTERED_FORM',
  );
  // BM-200 must NOT be in the runtime-ready roster (canary preservation).
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: 'BM-200',
      renderScope: 'CASE_LEVEL',
    }),
    null,
    'BM-200 must remain a non-promoted canary so regression tests can detect over-promotion',
  );
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: 'BM-999',
      renderScope: 'CASE_LEVEL',
    }),
    null,
    'BM-999 must remain a non-promoted canary so regression tests can detect over-promotion',
  );
});

test('generated roster is unique, sorted, and free of duplicates/canaries', () => {
  const codes = [...RUNTIME_READY_FORM_CODES];
  const sorted = [...codes].sort();
  assert.deepEqual(codes, sorted, 'RUNTIME_READY_FORM_CODES must be sorted ascending');
  const seen = new Set();
  for (const code of codes) {
    assert.equal(seen.has(code), false, `duplicate code: ${code}`);
    seen.add(code);
    assert.match(code, /^BM-\d{3}$/, `unexpected form code format: ${code}`);
    assert.notEqual(code, UNREGISTERED_FORM_CANARY, 'canary must not appear in roster');
  }
  // Authoritative roster count: runtimeReady + skeleton == 213.
  const skeletonCount = 213 - RUNTIME_READY_FORM_CODES.length;
  assert.equal(RUNTIME_READY_FORM_CODES.length + skeletonCount, 213);
  // Roster must NOT include the regression canary.
  assert.equal(
    ([...RUNTIME_READY_FORM_CODES] as readonly string[]).includes('BM-200'),
    false,
    'BM-200 must remain a non-promoted canary',
  );
});

test('BM-001 demoted from form-contracts bridge roster (RUNTIME_READY_FORM_CODES) per Phase 15B.1 evidence policy', () => {
  // Phase 15B.1 evidence policy: BM-001 has no row in evidence-safe-roster.json
  // (Turn 4 adversarial audit only audited 83 Phase-14 candidate forms). Per the
  // Phase 15B.1 strict evidence policy (REAL_UI required), BM-001 is demoted
  // from RUNTIME_READY_FORM_CODES (the form-contracts bridge roster). The
  // previous "ALREADY_READY" classification was test-driven, not evidence-driven.
  //
  // BM-001 REMAINS in STANDALONE_RUNTIME_TEMPLATE_CODES (the form-flight
  // baseline) because it has a hand-authored form-flight profile. The two
  // surfaces serve different lifecycles; the demotion is scoped to the
  // form-contracts bridge roster only.
  const bm001 = RUNTIME_READINESS_ENTRIES.find((e: { formCode: string }) => e.formCode === 'BM-001');
  assert.equal(bm001, undefined, 'BM-001 is not in the authoritative 25-form roster');
  // BM-001 must not be in the runtime-ready codes list.
  assert.equal(
    (RUNTIME_READY_FORM_CODES as readonly string[]).includes('BM-001'),
    false,
    'BM-001 must not be in the authoritative roster',
  );
  // BM-001 remains a standalone form-flight template; the persisted-draft
  // bridge is not its path.
  assert.equal(
    getPersistedDraftBridgeIneligibilityReason({
      templateCode: 'BM-001',
      renderScope: 'CASE_LEVEL',
    }),
    'STANDALONE_RUNTIME_TEMPLATE',
    'BM-001 remains a standalone form-flight template; the persisted-draft bridge is not its path',
  );
});

test('every entry has a non-empty evidencePath and evidenceSha256', () => {
  for (const entry of RUNTIME_READINESS_ENTRIES) {
    assert.ok(entry.evidencePath.length > 0, `entry ${entry.formCode} missing evidencePath`);
    assert.match(entry.evidenceSha256, /^[a-f0-9]{64}$/, `entry ${entry.formCode} bad evidenceSha256`);
  }
});

test('provenance block carries sourceManifestSha256 and baselineRuntimeReady', () => {
  assert.ok(RUNTIME_READINESS_PROVENANCE.sourceManifestSha256);
  assert.ok(Array.isArray(RUNTIME_READINESS_PROVENANCE.baselineRuntimeReady));
  // Phase 15B.1: baselineRuntimeReady is restricted to STANDALONE_RUNTIME_PREVIEW forms
  // with REAL_UI evidence. BM-001 is no longer included because it lacks Turn 4 evidence.
  for (const code of RUNTIME_READINESS_PROVENANCE.baselineRuntimeReady) {
    assert.match(code, /^BM-\d{3}$/);
  }
});

test('JSON roster artifact (if present) agrees with the generated TS', () => {
  if (!existsSync(GENERATED_JSON_PATH)) {
    // The JSON artifact is only present after the validator runs; skip silently
    // when running tests in isolation.
    return;
  }
  const json = JSON.parse(readFileSync(GENERATED_JSON_PATH, 'utf8'));
  assert.deepEqual(json.runtimeReadyFormCodes, [...RUNTIME_READY_FORM_CODES]);
  assert.equal(json.runtimeReadyUniqueCount, RUNTIME_READY_FORM_CODES.length);
  assert.equal(json.skeletonCount, 213 - RUNTIME_READY_FORM_CODES.length);
});
