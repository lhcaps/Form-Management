/**
 * Smart Remediation Classifier for DOCX Atlas V1
 *
 * Classifies BMs into remediation buckets based on DOCX Atlas, Contract Atlas,
 * and Render Atlas data.
 *
 * Precedence (exactly one bucket per BM):
 * 1. DO_NOT_TOUCH_ALREADY_BLOCKED
 * 2. RENDER_FAIL_REQUIRES_REPAIR
 * 3. DOCX_REQUIRES_OCCURRENCE_REVIEW
 * 4. PLANNER_REVIEW_CANDIDATE
 * 5. DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER
 * 6. LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW
 *
 * @module smart-remediation-classifier
 */

// ─── Bucket definitions ─────────────────────────────────────────────────────────

export const BUCKETS = {
  DO_NOT_TOUCH_ALREADY_BLOCKED: 'DO_NOT_TOUCH_ALREADY_BLOCKED',
  RENDER_FAIL_REQUIRES_REPAIR: 'RENDER_FAIL_REQUIRES_REPAIR',
  DOCX_REQUIRES_OCCURRENCE_REVIEW: 'DOCX_REQUIRES_OCCURRENCE_REVIEW',
  PLANNER_REVIEW_CANDIDATE: 'PLANNER_REVIEW_CANDIDATE',
  DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER: 'DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER',
  LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW:
    'LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW',
};

export const BUCKET_PRECEDENCE = [
  BUCKETS.DO_NOT_TOUCH_ALREADY_BLOCKED,
  BUCKETS.RENDER_FAIL_REQUIRES_REPAIR,
  BUCKETS.DOCX_REQUIRES_OCCURRENCE_REVIEW,
  BUCKETS.PLANNER_REVIEW_CANDIDATE,
  BUCKETS.DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER,
  BUCKETS.LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW,
];

const DOCX_SAFE_RISK_LEVELS = new Set(['NONE', 'LOW']);
const POLICY_BLOCKER_ISSUES = new Set([
  'SOURCE_POLICY',
  'PATH_DOMAIN_BINDING',
  'WEAK_EVIDENCE_AUTO_LOCKED',
  'REQUIRED_SUSPICIOUS',
  'SHOULD_BE_READONLY',
  'COMPILED_DRIFT',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'SOURCE_MISMATCH',
  'GENERIC_FIELD_CANONICALIZATION',
  'BAD_LABEL',
  'UI_VISIBLE_BAD_METADATA',
]);

function normalizeStatus(value) {
  return String(value ?? 'UNKNOWN').toUpperCase();
}

function docxRiskLevels(docxAtlasRow) {
  const levels = [];
  if (docxAtlasRow?.highestRiskLevel) levels.push(docxAtlasRow.highestRiskLevel);
  for (const risk of Object.values(docxAtlasRow?.placeholderRisks ?? {})) {
    if (risk && typeof risk === 'object') levels.push(risk.level ?? 'NONE');
  }
  return levels.length > 0 ? levels : ['NONE'];
}

function occurrencesForPlaceholder(docxAtlasRow, placeholder) {
  const value = docxAtlasRow?.byPlaceholder?.[placeholder];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.occurrences)) return value.occurrences;
  if (Array.isArray(docxAtlasRow?.occurrences)) {
    return docxAtlasRow.occurrences.filter((occ) => occ.placeholder === placeholder);
  }
  if (typeof value?.count === 'number') {
    return Array.from({ length: value.count }, (_, index) => ({
      contextSignature: value.contextSignatures?.[index] ?? value.contextSignatures?.[0] ?? null,
      visibleLabels: value.visibleLabels ?? [],
    }));
  }
  return [];
}

function hasOnlyAllowedPolicyIssues(contractAtlasRow) {
  const issueCodes = [
    ...(contractAtlasRow?.issueCodes ?? []),
    ...(contractAtlasRow?.baselineFindings ?? []),
    ...(contractAtlasRow?.rootIssueCodes ?? []),
  ].filter(Boolean);
  if (issueCodes.length === 0) return true;
  return issueCodes.every((issueCode) => POLICY_BLOCKER_ISSUES.has(issueCode));
}

// ─── Detection helpers ───────────────────────────────────────────────────────────

/**
 * Check if a row is an existing blocker.
 */
export function isExistingBlocked(rowOrLedger) {
  if (!rowOrLedger) return false;

  // Check completionStatus
  if (rowOrLedger.completionStatus === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') {
    return true;
  }

  // Check status field
  if (rowOrLedger.status === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') {
    return true;
  }

  // Check primaryLane
  if (rowOrLedger.primaryLane === 'LEGAL_REVIEW') {
    // Verify it's actually blocked
    if (rowOrLedger.completionStatus === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') {
      return true;
    }
  }

  return false;
}

/**
 * Check if render report indicates failure.
 */
export function hasRenderFailure(renderReport) {
  if (!renderReport) return false;

  const status = normalizeStatus(renderReport.status ?? renderReport.verdict);

  // FAIL conditions
  if (status === 'FAIL') return true;

  // Check specific gates
  if (renderReport.render?.status === 'FAIL') return true;
  if (renderReport.literalFidelity?.status === 'FAIL') return true;
  if (renderReport.textFidelity?.status === 'FAIL') return true;
  if (renderReport.bindingFidelity?.status === 'FAIL') return true;
  if (renderReport.structureFidelity?.status === 'FAIL') return true;

  // Check undefined/null literals
  const undefinedLiterals = renderReport.literalFidelity?.undefinedOrNullLiterals ?? 0;
  if (undefinedLiterals > 0) return true;

  // Check unreplaced placeholders
  const unreplaced = renderReport.textFidelity?.unreplacedPlaceholders ?? 0;
  if (unreplaced > 0) return true;

  return false;
}

/**
 * Check if DOCX atlas row has HIGH/CRITICAL occurrence risk.
 */
export function hasHighDocxOccurrenceRisk(docxAtlasRow) {
  if (!docxAtlasRow) return false;

  const risks = docxAtlasRow.placeholderRisks ?? {};

  for (const [placeholder, risk] of Object.entries(risks)) {
    if (!risk || typeof risk !== 'object') continue;

    const level = risk.level ?? 'NONE';

    if (level === 'CRITICAL') return true;
    if (level === 'HIGH') {
      // Additional check: must have multiple occurrences
      const occ = occurrencesForPlaceholder(docxAtlasRow, placeholder);
      if (occ && occ.length > 1) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if placeholder is from risky family.
 */
export function isRiskyPlaceholderFamily(placeholder) {
  if (!placeholder) return false;

  const riskyPatterns = [
    /^recipients\.personLine\d+$/,
    /^document\.fullDocumentCode\d+$/,
    /^document\.\w*Code\w*$/,
    /^case\.caseNumber/,
    /^agency\.\w*Line/,
    /^decision\.decisionLine/,
  ];

  return riskyPatterns.some((re) => re.test(placeholder));
}

/**
 * Check if DOCX atlas has duplicate multi-context risk.
 */
export function hasDuplicateMultiContextRisk(docxAtlasRow) {
  if (!docxAtlasRow || !docxAtlasRow.placeholderRisks) return false;

  for (const [placeholder, risk] of Object.entries(docxAtlasRow.placeholderRisks)) {
    if (!risk || typeof risk !== 'object') continue;

    const level = risk.level ?? 'NONE';
    if (level !== 'HIGH' && level !== 'CRITICAL') continue;

    // Check if this is a duplicate occurrence
    const occs = occurrencesForPlaceholder(docxAtlasRow, placeholder);
    if (!occs || occs.length <= 1) continue;

    // Check context signatures
    const sigs = new Set(occs.map((o) => o.contextSignature));
    if (sigs.size > 1) {
      return true;
    }
  }

  return false;
}

/**
 * Check if DOCX atlas has table blank ambiguity.
 */
export function hasTableBlankAmbiguity(docxAtlasRow) {
  if (!docxAtlasRow || !docxAtlasRow.occurrences) return false;

  // Look for occurrences in table cells without visible labels
  for (const occ of docxAtlasRow.occurrences) {
    if (occ.partKind !== 'body') continue;

    const hasTableContext = occ.tableContextRough !== null;
    const hasLabels = occ.visibleLabels && occ.visibleLabels.length > 0;

    if (hasTableContext && !hasLabels) {
      // Blank table cell
      if (isRiskyPlaceholderFamily(occ.placeholder)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if this BM qualifies for DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER.
 *
 * Criteria:
 * - render PASS
 * - undefined/null = 0
 * - unreplaced placeholders = 0
 * - binding fidelity PASS
 * - structure fidelity PASS
 * - docxRiskLevel NONE or LOW
 * - occurrenceReviewRequired = false
 * - no duplicate placeholder multi-context
 * - no table blank ambiguity
 * - issues are only source-policy/path-domain/weak evidence/required suspicious
 * - no candidate repair exists
 */
export function isDocxSafeRenderPassPolicyBlocker(input) {
  if (!input) return false;

  const { renderReport, docxAtlasRow, contractAtlasRow } = input;

  // 1. Render PASS required
  if (!renderReport) return false;
  const status = normalizeStatus(renderReport.status);
  if (status !== 'PASS') return false;

  // 2. No undefined/null literals
  const undefinedLiterals = renderReport.literalFidelity?.undefinedOrNullLiterals ?? 0;
  if (undefinedLiterals > 0) return false;

  // 3. No unreplaced placeholders
  const unreplaced = renderReport.textFidelity?.unreplacedPlaceholders ?? 0;
  if (unreplaced > 0) return false;

  // 4. Binding fidelity PASS
  if (renderReport.bindingFidelity?.status === 'FAIL') return false;

  // 5. Structure fidelity PASS
  if (renderReport.structureFidelity?.status === 'FAIL') return false;

  // 6. DOCX risk NONE or LOW
  if (docxAtlasRow) {
    if (docxAtlasRow.occurrenceReviewRequired === true) return false;
    if (docxRiskLevels(docxAtlasRow).some((level) => !DOCX_SAFE_RISK_LEVELS.has(level))) {
      return false;
    }
    if (hasHighDocxOccurrenceRisk(docxAtlasRow)) return false;
    if (hasDuplicateMultiContextRisk(docxAtlasRow)) return false;
    if (hasTableBlankAmbiguity(docxAtlasRow)) return false;
  }

  // 7. No occurrence review required (check contract)
  if (contractAtlasRow) {
    const rrSlots = contractAtlasRow.reviewRequiredSlots ?? [];
    const rrFields = contractAtlasRow.reviewRequiredFields ?? [];
    const rrBindings = contractAtlasRow.reviewRequiredBindings ?? [];
    if (rrSlots.length > 0 || rrFields.length > 0 || rrBindings.length > 0) {
      return false;
    }
  }

  // 8. Issues should be source-policy/path-domain type
  if (contractAtlasRow) {
    if (contractAtlasRow.candidateRepairExists === true) return false;
    if ((contractAtlasRow.structuralMismatchCount ?? 0) > 0) return false;
    if (!hasOnlyAllowedPolicyIssues(contractAtlasRow)) return false;

    // These are acceptable for policy blocker
    const hasStructuralIssues =
      (contractAtlasRow.templatePlaceholdersWithoutSlots?.length ?? 0) > 0 ||
      (contractAtlasRow.slotsWithoutBindings?.length ?? 0) > 0 ||
      (contractAtlasRow.bindingsWithoutSlots?.length ?? 0) > 0;

    if (hasStructuralIssues) return false;
  }

  return true;
}

/**
 * Check if this BM qualifies for RENDER_FAIL_REQUIRES_REPAIR.
 */
export function isRenderFailRepair(input) {
  if (!input) return false;

  const { renderReport } = input;
  if (!renderReport) return false;

  return hasRenderFailure(renderReport);
}

/**
 * Check if this BM qualifies for DOCX_REQUIRES_OCCURRENCE_REVIEW.
 */
export function isDocxOccurrenceReview(input) {
  if (!input) return false;

  const { docxAtlasRow, renderReport } = input;

  // Must have render at least pass (but may have issues)
  if (renderReport && hasRenderFailure(renderReport)) {
    return false; // Render fail -> repair bucket instead
  }

  if (docxAtlasRow) {
    // Has high/critical DOCX risk
    if (hasHighDocxOccurrenceRisk(docxAtlasRow)) return true;

    // Has duplicate multi-context
    if (hasDuplicateMultiContextRisk(docxAtlasRow)) return true;

    // Has table blank ambiguity with risky placeholder
    if (hasTableBlankAmbiguity(docxAtlasRow)) return true;
  }

  return false;
}

/**
 * Check if this BM qualifies for PLANNER_REVIEW_CANDIDATE.
 */
export function isPlannerReviewCandidate(input) {
  if (!input) return false;

  const { docxAtlasRow, renderReport, contractAtlasRow } = input;

  // Not if render fail
  if (renderReport && hasRenderFailure(renderReport)) return false;

  // Not if existing blocker
  if (input.completionStatus === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') return false;

  // Has evidence of possible safe repair but not fully proven
  // Check for risky placeholders with potential for binding
  if (docxAtlasRow) {
    for (const [placeholder, risk] of Object.entries(
      docxAtlasRow.placeholderRisks ?? {}
    )) {
      if (!risk || typeof risk !== 'object') continue;

      const level = risk.level ?? 'NONE';
      const occs = occurrencesForPlaceholder(docxAtlasRow, placeholder);

      // MEDIUM risk + single occurrence + has labels = potential candidate
      if (level === 'MEDIUM' && occs.length === 1) {
        const occ = occs[0];
        if (occ.visibleLabels && occ.visibleLabels.length > 0) {
          return true;
        }
      }
    }
  }

  return false;
}

// ─── Main classification ────────────────────────────────────────────────────────

/**
 * Classify a BM for the smart remediation queue.
 * Returns the bucket and reasoning.
 */
export function classifyBmForSmartQueue(input) {
  const {
    templateCode,
    row, // board row or existing ledger
    renderReport,
    docxAtlasRow,
    contractAtlasRow,
  } = input;

  const result = {
    templateCode: templateCode ?? row?.templateCode ?? 'UNKNOWN',
    bucket: null,
    reasoning: [],
    confidence: {
      docxConfidence: 'LOW',
      renderConfidence: 'LOW',
      semanticConfidence: 'LOW',
      automationSafety: 'UNSAFE',
    },
  };

  // 1. DO_NOT_TOUCH_ALREADY_BLOCKED
  if (isExistingBlocked(row)) {
    result.bucket = BUCKETS.DO_NOT_TOUCH_ALREADY_BLOCKED;
    result.reasoning.push('Existing blocker preserved');
    result.confidence.automationSafety = 'SAFE_BLOCKER_ONLY';
    result.confidence.semanticConfidence = 'HIGH'; // Known blocked
    return result;
  }

  // 2. RENDER_FAIL_REQUIRES_REPAIR
  if (isRenderFailRepair({ renderReport })) {
    result.bucket = BUCKETS.RENDER_FAIL_REQUIRES_REPAIR;
    result.reasoning.push('Render gate FAIL detected');

    if (renderReport) {
      if (renderReport.literalFidelity?.undefinedOrNullLiterals > 0) {
        result.reasoning.push(
          `Undefined/null literals: ${renderReport.literalFidelity.undefinedOrNullLiterals}`
        );
      }
      if (renderReport.textFidelity?.unreplacedPlaceholders > 0) {
        result.reasoning.push(
          `Unreplaced placeholders: ${renderReport.textFidelity.unreplacedPlaceholders}`
        );
      }
      if (renderReport.bindingFidelity?.status === 'FAIL') {
        result.reasoning.push('Binding fidelity FAIL');
      }
    }

    result.confidence.renderConfidence = 'HIGH';
    result.confidence.automationSafety = 'PER_BM_REQUIRED';
    return result;
  }

  // 3. DOCX_REQUIRES_OCCURRENCE_REVIEW
  if (isDocxOccurrenceReview({ renderReport, docxAtlasRow })) {
    result.bucket = BUCKETS.DOCX_REQUIRES_OCCURRENCE_REVIEW;
    result.reasoning.push('DOCX occurrence review required');

    if (docxAtlasRow) {
      for (const [placeholder, risk] of Object.entries(
        docxAtlasRow.placeholderRisks ?? {}
      )) {
        if (!risk || typeof risk !== 'object') continue;
        const level = risk.level ?? 'NONE';
        if (level === 'HIGH' || level === 'CRITICAL') {
          const occs = occurrencesForPlaceholder(docxAtlasRow, placeholder);
          result.reasoning.push(
            `${level} risk: ${placeholder} (${occs.length} occurrences)`
          );
        }
      }
    }

    result.confidence.docxConfidence = 'HIGH';
    result.confidence.automationSafety = 'PER_BM_REQUIRED';
    return result;
  }

  // 4. PLANNER_REVIEW_CANDIDATE
  if (isPlannerReviewCandidate({ renderReport, docxAtlasRow, contractAtlasRow, completionStatus: row?.completionStatus })) {
    result.bucket = BUCKETS.PLANNER_REVIEW_CANDIDATE;
    result.reasoning.push('Evidence suggests possible safe repair candidate');

    if (docxAtlasRow) {
      for (const [placeholder, risk] of Object.entries(
        docxAtlasRow.placeholderRisks ?? {}
      )) {
        if (!risk || typeof risk !== 'object') continue;
        const level = risk.level ?? 'NONE';
        if (level === 'MEDIUM') {
          result.reasoning.push(
            `MEDIUM risk: ${placeholder} — potential planner candidate`
          );
        }
      }
    }

    result.confidence.docxConfidence = 'MEDIUM';
    result.confidence.automationSafety = 'PLANNER_REQUIRED';
    return result;
  }

  // 5. DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER
  if (isDocxSafeRenderPassPolicyBlocker({ renderReport, docxAtlasRow, contractAtlasRow })) {
    result.bucket = BUCKETS.DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER;
    result.reasoning.push(
      'DOCX render fidelity is clean; semantic/source-policy requires human review.'
    );
    result.reasoning.push(
      'Phrase: "DOCX render fidelity is clean; semantic/source-policy requires human review."'
    );
    result.reasoning.push('Never say: "DOCX is fully correct."');

    result.confidence.docxConfidence = 'HIGH';
    result.confidence.renderConfidence = 'HIGH';
    result.confidence.semanticConfidence = 'LOW';
    result.confidence.automationSafety = 'SAFE_BLOCKER_ONLY';
    return result;
  }

  // 6. LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW
  result.bucket = BUCKETS.LOW_PRIORITY_RENDER_PASS_SEMANTIC_REVIEW;
  result.reasoning.push(
    'Render PASS, low DOCX risk, no urgent issues — low priority for semantic review'
  );

  result.confidence.docxConfidence = renderReport ? 'MEDIUM' : 'LOW';
  result.confidence.renderConfidence = renderReport ? 'HIGH' : 'LOW';
  result.confidence.semanticConfidence = 'LOW';
  result.confidence.automationSafety = 'SAFE_BLOCKER_ONLY';

  return result;
}

/**
 * Classify multiple BMs and return queue summary.
 */
export function classifyQueue(bms) {
  const classified = bms.map((bm) => classifyBmForSmartQueue(bm));

  // Count by bucket
  const bucketCounts = {};
  for (const bucket of BUCKET_PRECEDENCE) {
    bucketCounts[bucket] = 0;
  }

  for (const c of classified) {
    bucketCounts[c.bucket] = (bucketCounts[c.bucket] ?? 0) + 1;
  }

  // Top 10 per bucket
  const topByBucket = {};
  for (const bucket of BUCKET_PRECEDENCE) {
    topByBucket[bucket] = classified
      .filter((c) => c.bucket === bucket)
      .slice(0, 10)
      .map((c) => c.templateCode);
  }

  return {
    total: classified.length,
    bucketCounts,
    topByBucket,
    classified,
  };
}
