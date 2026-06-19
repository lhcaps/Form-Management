import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateBm001CutoverReadiness,
  parseHumanReviewApproval,
} from '../scripts/lib/bm001-cutover-readiness.mjs';

function validManifest(scenarioId) {
  return {
    schemaVersion: 2,
    scenarioId,
    provenance: {
      renderer: 'shared-full-package-docx-renderer/v1',
    },
    semanticComparison: {
      status: 'warning',
      missingExpectedText: [],
      unexpectedLiteralValues: [],
      unexpectedUnresolvedPlaceholders: [],
    },
    formatAudit: {
      status: 'warning',
    },
    packageIntegrity: {
      status: 'pass',
    },
  };
}

const VALID_SCENARIOS = [
  '01-basic-valid',
  '02-long-source-report',
  '03-organization-informant',
  '04-missing-optional-fields',
  '05-vietnamese-diacritics-and-addresses',
];

test('automated evidence cannot approve active cutover without human sign-off', () => {
  const result = evaluateBm001CutoverReadiness(
    VALID_SCENARIOS.map(validManifest),
    { approved: false, reviewer: '', reviewDate: '' },
  );

  assert.equal(result.automatedReady, true);
  assert.equal(result.activeReady, false);
  assert.ok(result.blockers.includes('human-review-not-approved'));
});

test('semantic failures block automated readiness', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[0].semanticComparison.status = 'fail';

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.equal(result.activeReady, false);
  assert.ok(result.blockers.includes('semantic-failure'));
});

test('parses an explicit signed approval and allows readiness only when all gates pass', () => {
  const review = parseHumanReviewApproval(`
- [x] Approved for BM-001 active allow-list cutover

Reviewer: Nguyễn Văn A
Review date: 2026-06-20
`);
  const result = evaluateBm001CutoverReadiness(
    VALID_SCENARIOS.map(validManifest),
    review,
  );

  assert.equal(review.approved, true);
  assert.equal(result.automatedReady, true);
  assert.equal(result.activeReady, true);
  assert.deepEqual(result.blockers, []);
});

test('stale renderer evidence is rejected even with signed human approval', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[1].provenance.renderer = 'legacy-docx-only-renderer/v0';

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.equal(result.activeReady, false);
  assert.ok(result.blockers.includes('stale-or-untrusted-evidence'));
});

test('stale schema version is rejected', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[2].schemaVersion = 1;

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.ok(result.blockers.includes('stale-or-untrusted-evidence'));
});

test('missing scenario coverage blocks readiness', () => {
  const incomplete = VALID_SCENARIOS.slice(0, 4).map(validManifest);

  const result = evaluateBm001CutoverReadiness(incomplete, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.ok(result.blockers.includes('scenario-coverage-incomplete'));
});

test('package integrity failure blocks readiness', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[0].packageIntegrity.status = 'fail';

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.ok(result.blockers.includes('package-integrity-failure'));
});

test('unresolved placeholder blocks readiness', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[0].semanticComparison.unexpectedUnresolvedPlaceholders = [
    '{{receiver.fullName}}',
  ];

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.ok(result.blockers.includes('unresolved-placeholder'));
});

test('unexpected literal value (undefined/null) blocks readiness', () => {
  const manifests = VALID_SCENARIOS.map(validManifest);
  manifests[0].semanticComparison.unexpectedLiteralValues = ['undefined'];

  const result = evaluateBm001CutoverReadiness(manifests, {
    approved: true,
    reviewer: 'Reviewer',
    reviewDate: '2026-06-20',
  });

  assert.equal(result.automatedReady, false);
  assert.ok(result.blockers.includes('unexpected-literal-value'));
});

test('human approval without reviewer name does not enable active ready', () => {
  const review = parseHumanReviewApproval(`
- [x] Approved for BM-001 active allow-list cutover
`);

  assert.equal(review.approved, false);

  const result = evaluateBm001CutoverReadiness(
    VALID_SCENARIOS.map(validManifest),
    review,
  );

  assert.equal(result.automatedReady, true);
  assert.equal(result.activeReady, false);
  assert.ok(result.blockers.includes('human-review-not-approved'));
});
