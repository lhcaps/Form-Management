const REQUIRED_SCENARIOS = new Set([
  '01-basic-valid',
  '02-long-source-report',
  '03-organization-informant',
  '04-missing-optional-fields',
  '05-vietnamese-diacritics-and-addresses',
]);

export function parseHumanReviewApproval(markdown) {
  const reviewer =
    markdown.match(/^Reviewer:\s*(.+)$/imu)?.[1]?.trim() ?? '';
  const reviewDate =
    markdown.match(/^Review date:\s*(.+)$/imu)?.[1]?.trim() ?? '';
  const approved =
    /-\s*\[x\]\s*Approved for BM-001 active allow-list cutover/iu.test(
      markdown,
    ) &&
    reviewer.length > 0 &&
    reviewDate.length > 0;

  return Object.freeze({ approved, reviewer, reviewDate });
}

export function evaluateBm001CutoverReadiness(manifests, humanReview) {
  const blockers = new Set();
  const scenarioIds = new Set(
    manifests.map((manifest) => manifest.scenarioId),
  );

  if (
    scenarioIds.size !== REQUIRED_SCENARIOS.size ||
    [...REQUIRED_SCENARIOS].some((scenarioId) => !scenarioIds.has(scenarioId))
  ) {
    blockers.add('scenario-coverage-incomplete');
  }

  for (const manifest of manifests) {
    if (
      manifest.schemaVersion !== 2 ||
      manifest.provenance?.renderer !==
        'shared-full-package-docx-renderer/v1'
    ) {
      blockers.add('stale-or-untrusted-evidence');
    }

    const semantic = manifest.semanticComparison ?? {};
    if (semantic.status === 'fail') blockers.add('semantic-failure');
    if ((semantic.missingExpectedText ?? []).length > 0) {
      blockers.add('missing-expected-text');
    }
    if ((semantic.unexpectedUnresolvedPlaceholders ?? []).length > 0) {
      blockers.add('unresolved-placeholder');
    }
    if ((semantic.unexpectedLiteralValues ?? []).length > 0) {
      blockers.add('unexpected-literal-value');
    }
    if (manifest.formatAudit?.status === 'fail') {
      blockers.add('format-failure');
    }
    if (manifest.packageIntegrity?.status !== 'pass') {
      blockers.add('package-integrity-failure');
    }
  }

  const automatedBlockers = new Set(blockers);
  const automatedReady = automatedBlockers.size === 0;

  if (!humanReview.approved) {
    blockers.add('human-review-not-approved');
  }

  return Object.freeze({
    automatedReady,
    activeReady: automatedReady && humanReview.approved,
    blockers: Object.freeze([...blockers].sort()),
  });
}
