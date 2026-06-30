#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATE_CODE = 'BM-069';
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE);
const ROOT_CAUSE_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIX_PLAN_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const BOARD_JSON = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board', 'latest.json');
const RENDER_JSON = join(ROOT, 'docs', 'audit', 'per-form-render-accurate', TEMPLATE_CODE, 'render-diff.latest.json');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const WAVE02_REVIEW_JSON = join(ROOT, 'docs', 'audit', 'docx-wave-02-bm068-bm069-review', 'review.latest.json');
const PATH_INVESTIGATION_JSON = join(ROOT, 'docs', 'audit', 'docx-path-binding-investigation-plan', 'plan.latest.json');
const P1_INVESTIGATION_JSON = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-1', 'investigation.latest.json');

const GENERATED_AT = 'deterministic-current-state';

const DEFER_CLASSIFICATIONS = new Set([
  'DEFER_DOCX_AUTHORING_REVIEW',
  'DEFER_LEGAL_REVIEW',
  'DEFER_REQUIRED_POLICY_REVIEW',
  'DEFER_REVIEW_REQUIRED_REMAINS',
]);

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function tryLoadJson(filePath) {
  return existsSync(filePath) ? loadJson(filePath) : null;
}

function writeJson(name, value) {
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(name, value) {
  writeFileSync(join(OUT_DIR, name), value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function findTemplateEntry(rootCause, templateCode) {
  const entries = rootCause.byTemplate || rootCause.templates || [];
  return entries.find((entry) => entry.templateCode === templateCode);
}

function loadContract(templateCode) {
  const fileName = readdirSync(LOCKED_DIR)
    .filter((name) => name.startsWith(`${templateCode}__`) && name.endsWith('.contract.locked.json'))
    .sort()[0];
  if (!fileName) throw new Error(`Locked contract not found for ${templateCode}`);
  return {
    fileName,
    path: join(LOCKED_DIR, fileName),
    contract: loadJson(join(LOCKED_DIR, fileName)),
  };
}

function collectFixPlanItems(templateCode) {
  const fixPlan = tryLoadJson(FIX_PLAN_JSON);
  if (!fixPlan) return [];
  return (fixPlan.plans || fixPlan.items || fixPlan.fixItems || [])
    .filter((item) => item.templateCode === templateCode);
}

function issueCodeCounts(issues) {
  return Object.fromEntries(
    Object.entries(issues.reduce((acc, issue) => {
      acc[issue.issueCode] = (acc[issue.issueCode] || 0) + 1;
      return acc;
    }, {})).sort(),
  );
}

function groupIssues(templateEntry, fixPlanItems) {
  const fixByKey = new Map();
  for (const item of fixPlanItems) {
    const issueCodes = Array.isArray(item.issueCodes) ? item.issueCodes : [item.issueCode].filter(Boolean);
    for (const issueCode of issueCodes) {
      fixByKey.set(`${item.path || item.fieldPath || ''}|${issueCode}`, item);
    }
  }

  const byPath = new Map();
  for (const issue of templateEntry.allIssues || []) {
    const current = byPath.get(issue.path) || {
      path: issue.path,
      slotId: issue.slotId ?? issue.path ?? null,
      rawPattern: issue.rawPattern ?? null,
      rawKey: issue.rawKey ?? null,
      rawDomain: issue.rawDomain ?? null,
      rawTail: issue.rawTail ?? null,
      label: issue.label ?? null,
      source: issue.source ?? null,
      required: issue.required ?? null,
      reviewRequired: issue.reviewRequired ?? null,
      context: issue.context ?? '',
      confidence: issue.confidence ?? 'UNKNOWN',
      issueCodes: [],
      severities: [],
      requiresHumanReview: false,
      reasons: [],
      fixPlan: [],
    };

    current.issueCodes.push(issue.issueCode);
    current.severities.push(issue.severity);
    current.requiresHumanReview ||= issue.requiresHumanReview === true;
    current.reasons.push(issue.reason);

    const fix = fixByKey.get(`${issue.path}|${issue.issueCode}`);
    if (fix) {
      current.fixPlan.push({
        issueCodes: Array.isArray(fix.issueCodes) ? fix.issueCodes : [issue.issueCode],
        classification: fix.classification ?? null,
        action: fix.action ?? fix.proposed?.action ?? null,
        applySafe: fix.applySafe ?? false,
        keepDeferred: Boolean(fix.keepDeferred),
        reason: fix.reason ?? null,
      });
    }

    byPath.set(issue.path, current);
  }

  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function classifyIssueGroup(item) {
  if (item.path === 'decision.decisionLine') {
    return {
      classification: 'DEFER_LEGAL_REVIEW',
      reason: 'decision.decisionLine is parked by same-BM path-binding evidence as LEGAL_REVIEW. Do not rename the slot or bind it without legal/form review.',
    };
  }

  if (item.issueCodes.some((code) => [
    'BAD_LABEL',
    'GENERIC_FIELD_CANONICALIZATION',
    'REMEDIATION_LEAK',
    'UI_VISIBLE_BAD_METADATA',
  ].includes(code))) {
    return {
      classification: 'DEFER_DOCX_AUTHORING_REVIEW',
      reason: `${item.path} still carries DOCX-remediation/generic-field debt. Same-BM prior evidence keeps this deferred; label-only/path-only mutation is not safe.`,
    };
  }

  if (item.issueCodes.includes('REQUIRED_SUSPICIOUS')) {
    return {
      classification: 'DEFER_REQUIRED_POLICY_REVIEW',
      reason: `${item.path} has REQUIRED_SUSPICIOUS. required=true changes runtime/legal validation behavior and needs explicit human policy review.`,
    };
  }

  return {
    classification: 'DEFER_REVIEW_REQUIRED_REMAINS',
    reason: `${item.path} remains reviewRequired in the locked contract and cannot be marked done without human review closure.`,
  };
}

function renderGateSummary(renderDiff) {
  return {
    status: renderDiff.status,
    bindingFidelity: renderDiff.bindingFidelity?.status,
    literalFidelity: renderDiff.literalFidelity?.status,
    undefinedOrNullLiterals: renderDiff.literalFidelity?.undefinedOrNullLiterals ?? 0,
    textFidelity: renderDiff.textFidelity?.status,
    structureFidelity: renderDiff.structureFidelity?.status,
    clean: renderDiff.clean === true,
  };
}

function summarizeReviewRequired(contract) {
  return {
    fields: (contract.canonicalFields || [])
      .filter((field) => field.reviewRequired === true)
      .map((field) => field.path),
    slots: (contract.docxSlots || [])
      .filter((slot) => slot.reviewRequired === true)
      .map((slot) => slot.slotId),
    bindings: (contract.renderBindings || [])
      .filter((binding) => binding.reviewRequired === true)
      .map((binding) => binding.slotId),
  };
}

function loadPriorEvidence() {
  const wave02 = tryLoadJson(WAVE02_REVIEW_JSON);
  const pathPlan = tryLoadJson(PATH_INVESTIGATION_JSON);
  const p1 = tryLoadJson(P1_INVESTIGATION_JSON);

  const decisions = [];
  if (wave02) {
    for (const item of wave02.items || []) {
      if (item.templateCode !== TEMPLATE_CODE) continue;
      decisions.push({
        source: 'docs/audit/docx-wave-02-bm068-bm069-review/review.latest.json',
        id: item.reviewItemId,
        path: item.path,
        decision: item.decision,
        approvedLabel: item.approvedLabel ?? null,
        evidenceSummary: item.evidence?.evidenceNotes ?? null,
      });
    }
  }

  if (pathPlan) {
    for (const item of pathPlan.items || []) {
      if (item.templateCode !== TEMPLATE_CODE) continue;
      decisions.push({
        source: 'docs/audit/docx-path-binding-investigation-plan/plan.latest.json',
        id: item.investigationId,
        path: item.path,
        decision: item.nextAction,
        rootCauseHypothesis: item.rootCauseHypothesis,
        risk: item.risk,
        evidenceSummary: item.evidenceSummary,
      });
    }
  }

  if (p1) {
    const p1Items = [
      ...(p1.findings || []),
      ...(p1.keepDeferred || []),
      ...(p1.removeCandidates || []),
      ...(p1.inconclusive || []),
    ];
    for (const item of p1Items) {
      if (item.templateCode !== TEMPLATE_CODE && item.bm !== TEMPLATE_CODE) continue;
      decisions.push({
        source: 'docs/audit/docx-path-binding-p1-investigation-batch-1/investigation.latest.json',
        id: item.investigationId ?? item.id,
        path: item.path,
        decision: item.recommendedRemediation ?? item.remediation,
        rootCauseFinding: item.rootCauseFinding ?? item.finding,
        confidence: item.confidence,
        evidenceSummary: item.reason ?? null,
      });
    }
  }

  return {
    sources: [
      'docs/audit/docx-wave-02-bm068-bm069-review/review.latest.json',
      'docs/audit/docx-path-binding-investigation-plan/plan.latest.json',
      'docs/audit/docx-path-binding-p1-investigation-batch-1/investigation.latest.json',
    ].filter((source) => existsSync(join(ROOT, source))),
    decisions,
    keyFindings: {
      w2r013KeepDeferred: decisions.some((item) =>
        item.id === 'W2R-013' &&
        ['DEFER', 'KEEP_DEFERRED', 'PATH_BINDING_INVESTIGATE'].includes(item.decision),
      ),
      w2r022LegalReview: decisions.some((item) =>
        item.id === 'W2R-022' &&
        ['LEGAL_REVIEW'].includes(item.decision),
      ),
    },
  };
}

function escapeMd(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 220);
}

function markdownTable(items) {
  const lines = [
    '| Path | Issue codes | Classification | Evidence note |',
    '|---|---|---|---|',
  ];
  for (const item of items) {
    lines.push(`| \`${item.path}\` | ${item.issueCodes.join(', ')} | ${item.classification} | ${escapeMd(item.reason)} |`);
  }
  return lines.join('\n');
}

function main() {
  if (!existsSync(ROOT_CAUSE_JSON)) throw new Error(`Missing ${ROOT_CAUSE_JSON}`);
  if (!existsSync(RENDER_JSON)) throw new Error(`Missing ${RENDER_JSON}. Run render-form-fidelity-gate first.`);

  mkdirSync(OUT_DIR, { recursive: true });

  const rootCause = loadJson(ROOT_CAUSE_JSON);
  const board = tryLoadJson(BOARD_JSON);
  const renderDiff = loadJson(RENDER_JSON);
  const contractInfo = loadContract(TEMPLATE_CODE);
  const templateEntry = findTemplateEntry(rootCause, TEMPLATE_CODE);
  if (!templateEntry) throw new Error(`${TEMPLATE_CODE} not found in root-cause audit`);

  const fixPlanItems = collectFixPlanItems(TEMPLATE_CODE);
  const reviewRequired = summarizeReviewRequired(contractInfo.contract);
  const priorEvidence = loadPriorEvidence();
  const boardRow = board?.rows?.find((row) => row.templateCode === TEMPLATE_CODE) ?? null;

  const issueGroups = groupIssues(templateEntry, fixPlanItems).map((item) => {
    const contractField = contractInfo.contract.canonicalFields?.find((field) => field.path === item.path) ?? null;
    const docxSlot = contractInfo.contract.docxSlots?.find((slot) => slot.slotId === item.slotId || slot.slotId === item.path) ?? null;
    const renderBinding = contractInfo.contract.renderBindings?.find((binding) => binding.slotId === item.slotId || binding.from === item.path) ?? null;
    const classification = classifyIssueGroup(item);

    return {
      ...item,
      ...classification,
      contractField,
      docxSlot,
      renderBinding,
      proposedLabel: null,
      proposedPath: null,
      proposedRequired: null,
      proposedReviewRequired: null,
      canApply: false,
    };
  });

  const deferred = issueGroups.filter((item) => item.classification.startsWith('DEFER_'));
  const candidates = issueGroups.filter((item) => !item.classification.startsWith('DEFER_'));

  for (const item of issueGroups) {
    if (!DEFER_CLASSIFICATIONS.has(item.classification)) {
      throw new Error(`Unexpected classification ${item.classification} for ${item.path}`);
    }
    for (const fix of item.fixPlan) {
      if (fix.applySafe === true) {
        throw new Error(`Unexpected applySafe=true fix-plan item for ${item.path}`);
      }
    }
  }

  const renderGate = renderGateSummary(renderDiff);
  const rootCauseSummary = {
    issueCount: templateEntry.issueCount,
    failCount: templateEntry.failCount,
    reviewCount: templateEntry.reviewCount,
    issueCounts: issueCodeCounts(templateEntry.allIssues || []),
  };

  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM069_CONTRACT_REPAIR_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    title: templateEntry.title || boardRow?.title || contractInfo.contract.templateTitle || TEMPLATE_CODE,
    sourceId: templateEntry.allIssues?.[0]?.sourceId || boardRow?.sourceId || contractInfo.contract.sourceId,
    lockedContract: `docs/audit/docx/contracts/locked/${contractInfo.fileName}`,
    renderGate,
    rootCause: rootCauseSummary,
    contract: {
      status: contractInfo.contract.status,
      reviewKind: contractInfo.contract.reviewKind ?? null,
      fieldCount: contractInfo.contract.canonicalFields?.length ?? 0,
      slotCount: contractInfo.contract.docxSlots?.length ?? 0,
      bindingCount: contractInfo.contract.renderBindings?.length ?? 0,
      reviewRequired,
    },
    fixPlan: {
      total: fixPlanItems.length,
      applySafeTrue: fixPlanItems.filter((item) => item.applySafe === true).length,
      allApplySafeFalse: fixPlanItems.every((item) => item.applySafe !== true),
    },
    occurrenceCount: issueGroups.length,
    issueGroups,
    candidates,
    deferred,
    priorEvidence,
    safetyAssertions: {
      canApplyRunNow: false,
      canMarkDone: false,
      noContractMutation: true,
      noDocxMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      renderPassDoesNotCloseReview: true,
    },
  };

  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM069_CONTRACT_REPAIR_PATCH_PLAN',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    patchCandidates: [],
    deferredItems: deferred.map(({ path, issueCodes, classification, reason }) => ({
      path,
      issueCodes,
      classification,
      reason,
    })),
    safetyAssertions: {
      canApplyRunNow: false,
      requiresPlannerApproval: true,
      requiresHumanDocxLegalReview: true,
      noApprovedDecisions: true,
    },
  };

  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM069_CONTRACT_REPAIR_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    status: 'BLOCKED_BY_HUMAN_DOCX_REVIEW',
    canApplyRunNow: false,
    canMarkDone: false,
    renderGateBefore: renderGate,
    counts: {
      totalIssueGroups: issueGroups.length,
      totalIssueCodes: templateEntry.issueCount,
      candidates: candidates.length,
      deferred: deferred.length,
      reviewRequiredFields: reviewRequired.fields.length,
      fixPlanItems: fixPlanItems.length,
      applySafeFixPlanItems: fixPlanItems.filter((item) => item.applySafe === true).length,
    },
    nextPlannerDecision: 'Close BM-069 as BLOCKED_BY_HUMAN_DOCX_REVIEW until a human DOCX/legal reviewer approves exact path, label, required, and reviewRequired changes.',
  };

  const ledger = {
    task: 'BM069_CONTRACT_REPAIR_REVIEW_BLOCKER',
    schemaVersion: '1.0.0',
    templateCode: TEMPLATE_CODE,
    title: evidence.title,
    sourceId: evidence.sourceId,
    status: 'BLOCKED_BY_HUMAN_DOCX_REVIEW',
    canApplyRunNow: false,
    canMarkDone: false,
    renderGateStatus: renderGate.status,
    renderGateDetails: {
      bindingFidelity: renderGate.bindingFidelity,
      literalFidelity: renderGate.literalFidelity,
      undefinedOrNullLiterals: renderGate.undefinedOrNullLiterals,
      textFidelity: renderGate.textFidelity,
      structureFidelity: renderGate.structureFidelity,
    },
    blockedPlaceholders: [
      {
        placeholder: 'BM-069.contractRepairIssueGroups',
        count: deferred.length,
        classification: 'DEFER_DOCX_AUTHORING_REVIEW',
        reason: 'BM-069 render-fidelity passes, but eight same-BM contract/root-cause issue groups remain non-apply-safe.',
      },
      {
        placeholder: 'BM-069.reviewRequiredFields',
        count: reviewRequired.fields.length,
        classification: 'DEFER_REVIEW_REQUIRED_REMAINS',
        reason: 'The locked contract still has 12 reviewRequired canonical fields, slots, and bindings.',
      },
    ],
    remainingIssueSummary: rootCauseSummary,
    reviewRequiredSummary: reviewRequired,
    remainingPaths: deferred.map((item) => item.path),
    plannerDecision: 'DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW',
    rejectedOptions: [
      {
        option: 'MARK_BM069_DONE_BECAUSE_RENDER_GATE_PASS',
        reason: 'Render execution is clean, but root-cause metadata and reviewRequired markers remain unresolved.',
      },
      {
        option: 'AUTO_RENAME_SLOTID_TO_MATCH_SEMANTIC_PATH',
        reason: 'renderBindings.slotId is the actual DOCX placeholder target; renaming it without DOCX evidence risks breaking render fidelity.',
      },
      {
        option: 'AUTO_APPLY_LABEL_OR_REQUIRED_FIXES',
        reason: 'The current fix-plan has zero applySafe BM-069 items and prior same-BM evidence keeps key paths deferred.',
      },
    ],
    requiredHumanReviewQuestions: [
      'Should document.fullDocumentCode stay as a body procedural slot, be reauthored into the visible header, or be split from a new current-document code field?',
      'Should document.reasonLine, document.reasonLine2, decision.decisionLine, and document.summaryLine remain body procedural references or be renamed to exact legal semantics?',
      'Which BM-069 fields should be required at runtime: document.issueDate, person.idNumber, person.occupation, and document.fullDocumentCode?',
      'Which of the 12 reviewRequired fields can be formally closed after DOCX/legal review?',
    ],
    evidenceRefs: {
      renderDiff: 'docs/audit/per-form-render-accurate/BM-069/render-diff.latest.json',
      evidence: 'docs/audit/docx-placeholder-renormalization/BM-069/evidence.latest.json',
      patchPlan: 'docs/audit/docx-placeholder-renormalization/BM-069/patch-plan.latest.json',
      plannerHandoff: 'docs/audit/docx-placeholder-renormalization/BM-069/planner-handoff.latest.json',
      priorWave02: 'docs/audit/docx-wave-02-bm068-bm069-review/review.latest.json',
      priorPathBindingPlan: 'docs/audit/docx-path-binding-investigation-plan/plan.latest.json',
      priorP1Investigation: 'docs/audit/docx-path-binding-p1-investigation-batch-1/investigation.latest.json',
    },
    createdAt: GENERATED_AT,
    createdBy: 'BM069_CONTRACT_REPAIR_EVIDENCE task',
  };

  writeJson('evidence.latest.json', evidence);
  writeJson('patch-plan.latest.json', patchPlan);
  writeJson('planner-handoff.latest.json', handoff);
  writeJson('human-review-blocker.latest.json', ledger);

  writeText('evidence.latest.md', [
    '# BM-069 Contract Repair Evidence',
    '',
    `Mode: ${evidence.mode}`,
    `Render gate: ${renderGate.status}`,
    `Candidates: ${candidates.length}`,
    `Deferred issue groups: ${deferred.length}`,
    `Review-required fields: ${reviewRequired.fields.length}`,
    `Root-cause issue entries: ${templateEntry.issueCount}`,
    '',
    markdownTable(issueGroups),
    '',
  ].join('\n'));

  writeText('patch-plan.latest.md', [
    '# BM-069 Contract Repair Patch Plan',
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    '- Patch candidates: 0',
    `- Deferred issue groups: ${deferred.length}`,
    '- Can apply now: NO',
    '',
  ].join('\n'));

  writeText('planner-handoff.latest.md', [
    '# BM-069 Planner Handoff',
    '',
    `Status: ${handoff.status}`,
    `Render gate: ${renderGate.status}`,
    `Can apply now: ${handoff.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    handoff.nextPlannerDecision,
    '',
  ].join('\n'));

  writeText('human-review-blocker.latest.md', [
    '# BM-069 Human Review Blocker',
    '',
    `**Template:** ${TEMPLATE_CODE} - ${evidence.title}`,
    '**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW',
    '**Lane:** LEGAL_REVIEW',
    '**Can Apply Now:** NO',
    '**Can Mark Done:** NO',
    '',
    '## Render Gate',
    '',
    `Render gate is ${renderGate.status}. BM-069 is blocked for contract/DOCX review, not render execution.`,
    '',
    '## Deferred Issue Groups',
    '',
    markdownTable(deferred),
    '',
    '## Required Review',
    '',
    '- Resolve the false-header/body-procedural document.fullDocumentCode evidence.',
    '- Review decision/reason/summary body procedural slots against the original DOCX/legal form.',
    '- Approve required/reviewRequired policy before any contract mutation.',
    '- Do not mark BM-069 DONE until human DOCX/legal review closes these blockers.',
    '',
  ].join('\n'));

  writeText('codegraph.findings.md', [
    '# BM-069 CodeGraph Findings',
    '',
    '- Runtime render uses contract render bindings: `slotId` targets the DOCX placeholder and `from` targets the semantic source path.',
    '- The render plan builder treats `reviewRequired` as a warning; clean rendering does not close human review debt.',
    '- Previous contract-repair apply patterns that mutate `slotId` and `from` together are unsafe for BM-069 without explicit same-BM DOCX approval.',
    '- Board refresh preserves `human-review-blocker.latest.json` ledgers and moves blocked BMs to `LEGAL_REVIEW`.',
    '',
  ].join('\n'));

  process.stdout.write(`[BM-069] evidence written to ${OUT_DIR}\n`);
  process.stdout.write(`[BM-069] candidates=${candidates.length} deferred=${deferred.length} issues=${templateEntry.issueCount} reviewRequired=${reviewRequired.fields.length} render=${renderGate.status}\n`);
}

main();
