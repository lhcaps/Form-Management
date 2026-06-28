#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATE_CODE = 'BM-212';
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE);
const ROOT_CAUSE_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIX_PLAN_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const BOARD_JSON = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board', 'latest.json');
const RENDER_JSON = join(ROOT, 'docs', 'audit', 'per-form-render-accurate', TEMPLATE_CODE, 'render-diff.latest.json');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const GENERATED_AT = 'deterministic-current-state';

const DEFER_CLASSIFICATIONS = new Set([
  'DEFER_WEAK_EVIDENCE_AUTO_LOCKED',
  'DEFER_REQUIRED_POLICY_REVIEW',
  'DEFER_SOURCE_POLICY_REVIEW',
]);

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
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
  if (!existsSync(FIX_PLAN_JSON)) return [];
  const fixPlan = loadJson(FIX_PLAN_JSON);
  return (fixPlan.plans || fixPlan.items || fixPlan.fixItems || [])
    .filter((item) => item.templateCode === templateCode);
}

function groupIssues(templateEntry, fixPlanItems) {
  const fixByKey = new Map();
  for (const item of fixPlanItems) {
    const issueCodes = Array.isArray(item.issueCodes) ? item.issueCodes : [item.issueCode].filter(Boolean);
    for (const issueCode of issueCodes) {
      const key = `${item.path || item.fieldPath || ''}|${issueCode}`;
      fixByKey.set(key, item);
    }
  }

  const byPath = new Map();
  for (const issue of templateEntry.allIssues || []) {
    const current = byPath.get(issue.path) || {
      path: issue.path,
      slotId: issue.slotId ?? null,
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
        issueCode: issue.issueCode,
        classification: fix.classification ?? null,
        action: fix.action ?? fix.proposed?.action ?? null,
        applySafe: fix.applySafe ?? false,
        reason: fix.reason ?? null,
      });
    }
    byPath.set(issue.path, current);
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function classify(item) {
  if (item.issueCodes.includes('REQUIRED_SUSPICIOUS')) {
    return {
      classification: 'DEFER_REQUIRED_POLICY_REVIEW',
      reason: `${item.path} has REQUIRED_SUSPICIOUS. Whether required=true is legally/product-correct must be reviewed before mutating locked metadata.`,
    };
  }

  if (item.issueCodes.includes('WEAK_EVIDENCE_AUTO_LOCKED')) {
    return {
      classification: 'DEFER_WEAK_EVIDENCE_AUTO_LOCKED',
      reason: `${item.path} is locked with reviewRequired=false but audit evidence is short/noisy or generic. Correct source/review policy needs human review.`,
    };
  }

  return {
    classification: 'DEFER_SOURCE_POLICY_REVIEW',
    reason: `${item.path} has source-policy debt that is not auto-safe.`,
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

function markdownTable(items) {
  const lines = [
    '| Path | Issue codes | Label | Classification |',
    '|---|---|---|---|',
  ];
  for (const item of items) {
    lines.push(`| \`${item.path}\` | ${item.issueCodes.join(', ')} | ${escapeMd(item.label || '')} | ${item.classification} |`);
  }
  return lines.join('\n');
}

function escapeMd(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 180);
}

function writeJson(name, value) {
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(name, value) {
  writeFileSync(join(OUT_DIR, name), value, 'utf8');
}

function main() {
  if (!existsSync(ROOT_CAUSE_JSON)) throw new Error(`Missing ${ROOT_CAUSE_JSON}`);
  if (!existsSync(RENDER_JSON)) throw new Error(`Missing ${RENDER_JSON}. Run render-form-fidelity-gate first.`);

  mkdirSync(OUT_DIR, { recursive: true });

  const rootCause = loadJson(ROOT_CAUSE_JSON);
  const board = existsSync(BOARD_JSON) ? loadJson(BOARD_JSON) : null;
  const renderDiff = loadJson(RENDER_JSON);
  const contractInfo = loadContract(TEMPLATE_CODE);
  const templateEntry = findTemplateEntry(rootCause, TEMPLATE_CODE);
  if (!templateEntry) throw new Error(`${TEMPLATE_CODE} not found in root-cause audit`);

  const fixPlanItems = collectFixPlanItems(TEMPLATE_CODE);
  const issueGroups = groupIssues(templateEntry, fixPlanItems).map((item) => {
    const contractField = contractInfo.contract.canonicalFields?.find((field) => field.path === item.path) ?? null;
    const renderBinding = contractInfo.contract.renderBindings?.find((binding) => binding.slotId === item.slotId || binding.from === item.path) ?? null;
    const classification = classify(item);
    return {
      ...item,
      ...classification,
      contractField,
      renderBinding,
      proposedRequired: null,
      proposedReviewRequired: null,
      proposedSource: null,
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
        throw new Error(`Unexpected applySafe=true fix-plan item for ${item.path}/${fix.issueCode}`);
      }
    }
  }

  const renderGate = renderGateSummary(renderDiff);
  const boardRow = board?.rows?.find((row) => row.templateCode === TEMPLATE_CODE) ?? null;

  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM212_SOURCE_POLICY_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    title: templateEntry.title || boardRow?.title || TEMPLATE_CODE,
    sourceId: templateEntry.sourceId || boardRow?.sourceId || contractInfo.contract.sourceId,
    lockedContract: `docs/audit/docx/contracts/locked/${contractInfo.fileName}`,
    renderGate,
    rootCause: {
      issueCount: templateEntry.issueCount,
      failCount: templateEntry.failCount,
      reviewCount: templateEntry.reviewCount,
      issueCounts: Object.fromEntries(
        Object.entries(templateEntry.allIssues.reduce((acc, issue) => {
          acc[issue.issueCode] = (acc[issue.issueCode] || 0) + 1;
          return acc;
        }, {})).sort(),
      ),
    },
    occurrenceCount: issueGroups.length,
    issueGroups,
    candidates,
    deferred,
    safetyAssertions: {
      canApplyRunNow: false,
      canMarkDone: false,
      noContractMutation: true,
      noDocxMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      renderFailureHidden: false,
    },
  };

  const patchPlan = {
    schemaVersion: '1.0.0',
    task: 'BM212_SOURCE_POLICY_PATCH_PLAN',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    patchCandidates: [],
    deferredItems: deferred.map(({ path, issueCodes, classification, reason }) => ({ path, issueCodes, classification, reason })),
    safetyAssertions: {
      canApplyRunNow: false,
      requiresPlannerApproval: true,
      requiresHumanDocxLegalReview: true,
    },
  };

  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM212_SOURCE_POLICY_EVIDENCE',
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
    },
    nextPlannerDecision: 'Close BM-212 as BLOCKED_BY_HUMAN_DOCX_REVIEW or provide approved source/required/reviewRequired decisions for a separate apply task.',
  };

  const ledger = {
    task: 'BM212_SOURCE_POLICY_REVIEW_BLOCKER',
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
        placeholder: 'BM-212.sourcePolicyFields',
        count: deferred.length,
        classification: 'DEFER_SOURCE_POLICY_REVIEW',
        reason: 'BM-212 render-fidelity passes, but source/required/reviewRequired policy findings are not apply-safe. Do not mutate locked metadata without human DOCX/legal/product review.',
      },
    ],
    remainingIssueSummary: evidence.rootCause,
    remainingPaths: deferred.map((item) => item.path),
    plannerDecision: 'DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW',
    rejectedOptions: [
      {
        option: 'AUTO_SET_REVIEW_REQUIRED_TRUE_FOR_ALL_BM212_FIELDS',
        reason: 'This would silence WEAK_EVIDENCE_AUTO_LOCKED mechanically, but it does not prove the correct source or required policy for each field.',
      },
      {
        option: 'AUTO_SET_DOCUMENT_IDENTITY_FIELDS_REQUIRED',
        reason: 'document.issueDate and document.fullDocumentCode look required, but required=true changes product/legal validation behavior and needs explicit review.',
      },
      {
        option: 'MARK_BM212_DONE_BECAUSE_RENDER_GATE_PASS',
        reason: 'Render fidelity is clean, but source-policy/root-cause metadata remains unresolved.',
      },
    ],
    requiredHumanReviewQuestions: [
      'Should each recipients.personLineN field stay locked, or should it require review because the DOCX evidence is generic/noisy?',
      'Should document.issueDate and document.fullDocumentCode be required for BM-212 runtime submission?',
      'Are any BM-212 recipient lines derived from case/participant data instead of manual input?',
      'Should BM-212 remain generic renderer or receive a bespoke authoring panel before metadata lock is considered complete?',
    ],
    evidenceRefs: {
      renderDiff: 'docs/audit/per-form-render-accurate/BM-212/render-diff.latest.json',
      evidence: 'docs/audit/docx-placeholder-renormalization/BM-212/evidence.latest.json',
      patchPlan: 'docs/audit/docx-placeholder-renormalization/BM-212/patch-plan.latest.json',
      plannerHandoff: 'docs/audit/docx-placeholder-renormalization/BM-212/planner-handoff.latest.json',
    },
    createdAt: GENERATED_AT,
    createdBy: 'BM212_SOURCE_POLICY_EVIDENCE task',
  };

  writeJson('evidence.latest.json', evidence);
  writeJson('patch-plan.latest.json', patchPlan);
  writeJson('planner-handoff.latest.json', handoff);
  writeJson('human-review-blocker.latest.json', ledger);

  writeText('evidence.latest.md', [
    '# BM-212 Source Policy Evidence',
    '',
    `Mode: ${evidence.mode}`,
    `Render gate: ${renderGate.status}`,
    `Candidates: ${candidates.length}`,
    `Deferred fields: ${deferred.length}`,
    `Root-cause issue entries: ${templateEntry.issueCount}`,
    '',
    markdownTable(issueGroups),
    '',
  ].join('\n'));

  writeText('patch-plan.latest.md', [
    '# BM-212 Source Policy Patch Plan',
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    '- Patch candidates: 0',
    `- Deferred fields: ${deferred.length}`,
    '- Can apply now: NO',
    '',
  ].join('\n'));

  writeText('planner-handoff.latest.md', [
    '# BM-212 Planner Handoff',
    '',
    `Status: ${handoff.status}`,
    `Render gate: ${renderGate.status}`,
    `Can apply now: ${handoff.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    handoff.nextPlannerDecision,
    '',
  ].join('\n'));

  writeText('human-review-blocker.latest.md', [
    '# BM-212 Human Review Blocker',
    '',
    `**Template:** ${TEMPLATE_CODE} - ${evidence.title}`,
    '**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW',
    '**Lane:** LEGAL_REVIEW',
    '**Can Apply Now:** NO',
    '**Can Mark Done:** NO',
    '',
    '## Render Gate',
    '',
    `Render gate is ${renderGate.status}. BM-212 is blocked for source-policy review, not render execution.`,
    '',
    '## Deferred Fields',
    '',
    markdownTable(deferred),
    '',
    '## Required Review',
    '',
    '- Confirm source, required, and reviewRequired policy per field.',
    '- Split any approved metadata changes into a separate apply task with exact path-level decisions.',
    '- Do not mark BM-212 DONE until policy blockers are resolved.',
    '',
  ].join('\n'));

  writeText('codegraph.findings.md', [
    '# BM-212 CodeGraph Findings',
    '',
    '- Board lane SOURCE_POLICY is driven by SHOULD_BE_READONLY, REQUIRED_SUSPICIOUS, and COMPILED_DRIFT.',
    '- WEAK_EVIDENCE_AUTO_LOCKED is reviewed after PATH_DOMAIN_BINDING in board priority and still requires human review when present.',
    '- `renderBindings.slotId` is the DOCX placeholder target; `renderBindings.from` is the semantic source path.',
    '- `plan-forms-root-cause-fixes.mjs` classifies WEAK_EVIDENCE_AUTO_LOCKED and REQUIRED_SUSPICIOUS as not apply-safe.',
    '- Human-review ledgers under docs/audit/docx-placeholder-renormalization/BM-*/ are preserved by refresh-213-docx-fidelity-board.mjs.',
    '',
  ].join('\n'));

  process.stdout.write(`[BM-212] evidence written to ${OUT_DIR}\n`);
  process.stdout.write(`[BM-212] candidates=${candidates.length} deferred=${deferred.length} issues=${templateEntry.issueCount} render=${renderGate.status}\n`);
}

main();
