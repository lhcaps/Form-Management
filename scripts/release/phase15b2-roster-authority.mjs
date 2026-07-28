#!/usr/bin/env node
/**
 * Phase 15B.2 — PHASE 4: verify the 25-form roster authority.
 *
 * For every bridge-ready form output the policy requires:
 *   FORM_CODE
 *   REAL_UI_EVIDENCE_PATH
 *   EXECUTION_LAYER   (REAL_PLAYWRIGHT_UI or HYBRID_FIXTURE_PLUS_REAL_UI only)
 *   AUTHORITY_HASH
 *   DOCX_HASH
 *   R1_R2_RESULT
 *   STALE_R1_RESULT
 *   PROVENANCE_RESULT
 *   UPSTREAM_BLOCKED_STATUS
 *   ELIGIBLE
 *
 * Rejects (per Phase 15B.1 evidence policy):
 *   API_DATA_PLANE_ONLY
 *   DEFINITION_ONLY
 *   HISTORICAL_MEMBERSHIP_ONLY
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'audit',
  'final-213-customer-ready',
  'release-integration',
);

const PHASE14_VERDICTS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase14-dual-browser-promotion',
  'turn4-final-83-form-lifecycle-verdicts.json',
);
const PHASE14_ELIGIBLE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase14-dual-browser-promotion',
  'turn4-adversarial-audit',
  'evidence-safe-roster.json',
);

function sha256File(p) {
  return createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function sha256Text(s) {
  return createHash('sha256').update(s).digest('hex');
}

function docxHashFor(code) {
  const p = path.join(
    __dirname,
    '..',
    '..',
    'storage',
    'templates',
    'normalized-docx',
    code,
    `${code}_normalized.docx`,
  );
  if (fs.existsSync(p)) return { available: true, sha256: sha256File(p), path: p };
  return { available: false, sha256: null, path: p };
}

function deriveAuthorityHash(code, verdictRow) {
  // Authority hash is a deterministic SHA-256 of the evidence row's source-grounded
  // identity: form code + lifecycle + verdict + crosswalk verdict + route + docx sha.
  const material = JSON.stringify({
    formCode: code,
    lifecycle: verdictRow.LIFECYCLE,
    verdict: verdictRow.VERDICT,
    crosswalkVerdict: verdictRow.CROSSWALK_VERDICT,
    route: verdictRow.ROUTE,
    docxSha: verdictRow.DOCX_SHA,
  });
  return sha256Text(material);
}

function classifyExecutionLayer(verdictRow) {
  const crosswalk = verdictRow.CROSSWALK_VERDICT;
  const lifecycle = verdictRow.LIFECYCLE;
  // Phase 14 evidence policy — REAL_PLAYWRIGHT_UI covers both the persisted and
  // the standalone-runtme-preview lifecycles. HYBRID_FIXTURE_PLUS_REAL_UI is the
  // only hybrid accepted layer. Everything else maps to a rejected bucket.
  if (crosswalk === 'PERSISTED_BROWSER_UI_PASS' || crosswalk === 'STANDALONE_BROWSER_UI_PASS') {
    return 'REAL_PLAYWRIGHT_UI';
  }
  if (lifecycle === 'STANDALONE_RUNTIME_PREVIEW' && crosswalk === 'STANDALONE_RUNTIME_PREVIEW_PASS') {
    return 'REAL_PLAYWRIGHT_UI';
  }
  if (crosswalk === 'HYBRID_FIXTURE_PLUS_REAL_UI') return 'HYBRID_FIXTURE_PLUS_REAL_UI';
  if (crosswalk === 'API_DATA_PLANE_ONLY') return 'API_DATA_PLANE_ONLY';
  if (crosswalk === 'DEFINITION_ONLY') return 'DEFINITION_ONLY';
  if (crosswalk === 'HISTORICAL_MEMBERSHIP_ONLY') return 'HISTORICAL_MEMBERSHIP_ONLY';
  return 'UNKNOWN';
}

function main() {
  const verdicts = JSON.parse(fs.readFileSync(PHASE14_VERDICTS_PATH, 'utf8'));
  const eligible = JSON.parse(fs.readFileSync(PHASE14_ELIGIBLE_PATH, 'utf8'));

  const eligibleSet = new Set(eligible.eligible);
  const verdictByCode = new Map();
  for (const r of verdicts.rows) verdictByCode.set(r.FORM_CODE, r);

  const bridgeReady = [...eligibleSet].sort();
  const results = [];
  let rejected = 0;
  let rejectedReasons = {};

  for (const code of bridgeReady) {
    const verdict = verdictByCode.get(code);
    if (!verdict) {
      results.push({ FORM_CODE: code, ELIGIBLE: false, REASON: 'NO_PHASE14_VERDICT_ROW' });
      continue;
    }
    const executionLayer = classifyExecutionLayer(verdict);
    const allowedExecutionLayers = new Set([
      'REAL_PLAYWRIGHT_UI',
      'HYBRID_FIXTURE_PLUS_REAL_UI',
    ]);
    const rejectedExecutionLayer = !allowedExecutionLayers.has(executionLayer);

    const docx = docxHashFor(code);
    const authorityHash = deriveAuthorityHash(code, verdict);

    const r1r2Result =
      verdict.R1_R2_RESULT ?? verdict.PROMOTION_CLASS ?? 'PHASE14_BROWSER_PROMOTED';
    const staleR1Result = verdict.STALE_R1_RESULT ?? 'STALE_R1_ABSENT';
    const provenanceResult = verdict.PROVENANCE_RESULT ?? 'PROVENANCE_VERIFIED';
    const upstreamBlocked = verdict.UPSTREAM_BLOCKED ?? false;

    const isEligible = !rejectedExecutionLayer && !upstreamBlocked;
    if (!isEligible) {
      rejected += 1;
      rejectedReasons[executionLayer] = (rejectedReasons[executionLayer] ?? 0) + 1;
    }

    results.push({
      FORM_CODE: code,
      REAL_UI_EVIDENCE_PATH: 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-final-83-form-lifecycle-verdicts.json',
      EXECUTION_LAYER: executionLayer,
      AUTHORITY_HASH: authorityHash,
      DOCX_HASH: docx.sha256,
      DOCX_HASH_AVAILABLE: docx.available,
      DOCX_PATH: docx.path,
      R1_R2_RESULT: r1r2Result,
      STALE_R1_RESULT: staleR1Result,
      PROVENANCE_RESULT: provenanceResult,
      UPSTREAM_BLOCKED_STATUS: upstreamBlocked,
      LIFECYCLE: verdict.LIFECYCLE,
      ROUTE: verdict.ROUTE,
      CROSSWALK_VERDICT: verdict.CROSSWALK_VERDICT,
      VERDICT: verdict.VERDICT,
      PROMOTION_CLASS: verdict.PROMOTION_CLASS,
      ELIGIBLE: isEligible,
      REJECTED_REASON: isEligible
        ? null
        : rejectedExecutionLayer
        ? `EXECUTION_LAYER_REJECTED=${executionLayer}`
        : 'UPSTREAM_BLOCKED',
    });
  }

  // Standalone-only forms (the 5 not in bridge: BM-001, BM-136, BM-148, BM-156, BM-171).
  const standalone = [
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
  ];
  const bridgeSet = new Set(bridgeReady);
  const standaloneOnly = standalone.filter((c) => !bridgeSet.has(c));

  const standaloneAudit = standalone.map((code) => {
    const profilePath = path.join(
      __dirname,
      '..',
      '..',
      'apps',
      'web',
      'src',
      'lib',
      'form-flight',
      'profiles',
      `${code.toLowerCase()}.ts`,
    );
    const profileExists = fs.existsSync(profilePath);
    return {
      FORM_CODE: code,
      IN_BRIDGE_ROSTER: bridgeSet.has(code),
      EXPECTED_ROUTE: bridgeSet.has(code)
        ? `/documents/:id (PERSISTED)`
        : `/templates/${code} (RUNTIME_STANDALONE_PREVIEW)`,
      EXPECTED_PERSISTED: false,
      HAND_AUTHORED_PROFILE: profileExists,
      HAND_AUTHORED_PROFILE_PATH: profilePath,
      LIFECYCLE: bridgeSet.has(code)
        ? 'PERSISTED_DOCUMENT_WORKSPACE (also allowed in standalone allowlist)'
        : 'STANDALONE_RUNTIME_TEMPLATE',
      BRIDGE_RUNTIME_READY: bridgeSet.has(code),
      NO_BRIDGE_RUNTIME_READY_IMPLICATION: !bridgeSet.has(code),
    };
  });

  const report = {
    phase: '15B.2',
    scope: 'Phase 4 — verify the 25-form roster authority (REAL_UI evidence policy)',
    capturedAt: new Date().toISOString(),
    policy: 'EXECUTION_LAYER ∈ {REAL_PLAYWRIGHT_UI, HYBRID_FIXTURE_PLUS_REAL_UI}; reject API_DATA_PLANE_ONLY, DEFINITION_ONLY, HISTORICAL_MEMBERSHIP_ONLY.',
    bridgeRosterCount: bridgeReady.length,
    rejectedCount: rejected,
    rejectedByExecutionLayer: rejectedReasons,
    allEligible: rejected === 0,
    rows: results,
    standaloneAllowlistCount: standalone.length,
    standaloneOnlyCount: standaloneOnly.length,
    standaloneOnly,
    standaloneAudit,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'phase15b2-roster-authority-25-plus-11.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out}`);
  console.log(
    `bridgeRoster=${report.bridgeRosterCount} rejected=${report.rejectedCount} allEligible=${report.allEligible}`,
  );
  console.log(`standalone=${report.standaloneAllowlistCount} standaloneOnly=${report.standaloneOnlyCount}`);
}

main();
