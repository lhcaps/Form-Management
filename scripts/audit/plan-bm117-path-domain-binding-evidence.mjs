#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATE_CODE = process.env.TEMPLATE_CODE_OVERRIDE || 'BM-117';
const TASK_CODE = TEMPLATE_CODE.replace('-', '');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE);
const ROOT_CAUSE_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIX_PLAN_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const BOARD_JSON = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board', 'latest.json');
const RENDER_JSON = join(ROOT, 'docs', 'audit', 'per-form-render-accurate', TEMPLATE_CODE, 'render-diff.latest.json');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const GENERATED_AT = 'deterministic-current-state';

const DEFER_CLASSIFICATIONS = new Set([
  'DEFER_LABEL_ONLY_WEAK_EVIDENCE',
  'DEFER_NO_VISIBLE_LABEL',
  'DEFER_PATH_DOMAIN_MISMATCH',
  'DEFER_SOURCE_POLICY_CONFLICT',
  'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
]);

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function tryLoadJson(filePath) {
  return existsSync(filePath) ? loadJson(filePath) : null;
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
      slotId: issue.slotId ?? null,
      rawPattern: issue.rawPattern ?? null,
      rawKey: issue.rawKey ?? null,
      rawDomain: issue.rawDomain ?? null,
      rawTail: issue.rawTail ?? null,
      label: issue.label ?? null,
      source: issue.source ?? null,
      context: issue.context ?? '',
      suggestedPath: issue.suggestedPath ?? null,
      suggestedLabel: issue.suggestedLabel ?? null,
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
        reason: fix.reason ?? null,
      });
    }

    byPath.set(issue.path, current);
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function isPlaceholderOnlyContext(text) {
  const stripped = String(text || '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/[.,;:()\-0-9\s]/g, '')
    .trim();
  return stripped.length === 0;
}

function hasResidenceContext(text) {
  return /N[oơ]i\s+(th[uư][oờ]ng|t[aạ]m)\s+tr[uú]/iu.test(String(text || ''));
}

function hasLegalBasisContext(text) {
  return /C[ăa]n\s+c[uứ]|Quy[ếe]t\s+[đd][ịi]nh|[đd][ìi]nh\s+ch[ỉi]\s+[đd]i[ềe]u\s+tra/iu.test(String(text || ''));
}

function classify(item) {
  const context = item.context || '';

  if (item.issueCodes.includes('SOURCE_MISMATCH')) {
    return {
      classification: 'DEFER_SOURCE_POLICY_CONFLICT',
      reason: `${item.path} has SOURCE_MISMATCH in legal-basis context. Source/path policy must be reviewed before changing contract metadata.`,
    };
  }

  if (hasResidenceContext(context)) {
    return {
      classification: 'DEFER_PATH_DOMAIN_MISMATCH',
      reason: `${item.path} appears near a residence label, but the current path/domain is not a stable residence semantic. Same-BM DOCX/legal review is required before remap.`,
    };
  }

  if (hasLegalBasisContext(context)) {
    return {
      classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
      reason: `${item.path} appears in a procedural/legal-basis sentence. Do not infer a label or source from the current generic path alone.`,
    };
  }

  if (isPlaceholderOnlyContext(context)) {
    return {
      classification: 'DEFER_NO_VISIBLE_LABEL',
      reason: `${item.path} has only placeholder-neighborhood evidence and no stable visible label. Do not infer a semantic path from position alone.`,
    };
  }

  if (item.suggestedPath || item.suggestedLabel || item.label === 'Ô trống') {
    return {
      classification: 'DEFER_LABEL_ONLY_WEAK_EVIDENCE',
      reason: `${item.path} has label-only or weak context evidence. The current fix-plan requires review and is not apply-safe.`,
    };
  }

  return {
    classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
    reason: `${item.path} remains a generic path-domain issue that needs human DOCX/legal review.`,
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

function issueCodeCounts(issues) {
  return Object.fromEntries(
    Object.entries(issues.reduce((acc, issue) => {
      acc[issue.issueCode] = (acc[issue.issueCode] || 0) + 1;
      return acc;
    }, {})).sort(),
  );
}

function markdownTable(items) {
  const lines = [
    '| Path | Raw pattern | Context | Classification |',
    '|---|---|---|---|',
  ];
  for (const item of items) {
    lines.push(`| \`${item.path}\` | \`${item.rawPattern || ''}\` | ${escapeMd(item.context || '')} | ${item.classification} |`);
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
  writeFileSync(join(OUT_DIR, name), value.endsWith('\n') ? value : `${value}\n`, 'utf8');
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
  const issueGroups = groupIssues(templateEntry, fixPlanItems).map((item) => {
    const contractField = contractInfo.contract.canonicalFields?.find((field) => field.path === item.path) ?? null;
    const docxSlot = contractInfo.contract.docxSlots?.find((slot) => slot.slotId === item.slotId || slot.slotId === item.path) ?? null;
    const renderBinding = contractInfo.contract.renderBindings?.find((binding) => binding.slotId === item.slotId || binding.from === item.path) ?? null;
    const classification = classify(item);
    return {
      ...item,
      ...classification,
      contractField,
      docxSlot,
      renderBinding,
      proposedPath: null,
      proposedLabel: null,
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
        throw new Error(`Unexpected applySafe=true fix-plan item for ${item.path}`);
      }
    }
  }

  const renderGate = renderGateSummary(renderDiff);
  const boardRow = board?.rows?.find((row) => row.templateCode === TEMPLATE_CODE) ?? null;
  const rootCauseSummary = {
    issueCount: templateEntry.issueCount,
    failCount: templateEntry.failCount,
    reviewCount: templateEntry.reviewCount,
    issueCounts: issueCodeCounts(templateEntry.allIssues || []),
  };

  const evidence = {
    schemaVersion: '1.0.0',
    task: `${TASK_CODE}_PATH_DOMAIN_BINDING_EVIDENCE`,
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    title: templateEntry.title || boardRow?.title || TEMPLATE_CODE,
    sourceId: templateEntry.allIssues?.[0]?.sourceId || boardRow?.sourceId || contractInfo.contract.sourceId,
    lockedContract: `docs/audit/docx/contracts/locked/${contractInfo.fileName}`,
    renderGate,
    rootCause: rootCauseSummary,
    fixPlan: {
      total: fixPlanItems.length,
      applySafeTrue: fixPlanItems.filter((item) => item.applySafe === true).length,
      allApplySafeFalse: fixPlanItems.every((item) => item.applySafe !== true),
      classifications: fixPlanItems.reduce((acc, item) => {
        acc[item.classification] = (acc[item.classification] || 0) + 1;
        return acc;
      }, {}),
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
      noApprovedDecisions: true,
      renderPassDoesNotCloseSemanticReview: true,
    },
  };

  const patchPlan = {
    schemaVersion: '1.0.0',
    task: `${TASK_CODE}_PATH_DOMAIN_BINDING_PATCH_PLAN`,
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    patchCandidates: [],
    deferredItems: deferred.map(({ path, rawPattern, issueCodes, classification, reason }) => ({
      path,
      rawPattern,
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
    task: `${TASK_CODE}_PATH_DOMAIN_BINDING_EVIDENCE`,
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
      fixPlanItems: fixPlanItems.length,
      applySafeFixPlanItems: fixPlanItems.filter((item) => item.applySafe === true).length,
    },
    nextPlannerDecision: `Close ${TEMPLATE_CODE} as BLOCKED_BY_HUMAN_DOCX_REVIEW or provide approved same-BM path/source/label decisions for a separate apply task.`,
  };

  const ledger = {
    task: `${TASK_CODE}_REMAINING_PATH_DOMAIN_REVIEW_BLOCKER`,
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
        placeholder: `${TEMPLATE_CODE}.pathDomainGenericFields`,
        count: deferred.length,
        classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
        reason: `${TEMPLATE_CODE} render-fidelity passes, but ten path-domain issue groups remain non-apply-safe and require human DOCX/legal review.`,
      },
    ],
    remainingIssueSummary: rootCauseSummary,
    remainingPaths: deferred.map((item) => item.path),
    plannerDecision: 'DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW',
    rejectedOptions: [
      {
        option: 'AUTO_APPLY_LABEL_ONLY_FIXES_FOR_O_TRONG',
        reason: `The current fix-plan marks all ${TEMPLATE_CODE} items applySafe=false; several fields are placeholder-only or path-domain conflicting, so label-only mutation would hide semantic debt.`,
      },
      {
        option: 'AUTO_REMAP_RESIDENCE_CONTEXT_FIELDS',
        reason: 'Nơi thường trú/Nơi tạm trú contexts indicate likely domain mismatch, but exact path split and semantic ownership require same-BM DOCX/legal review.',
      },
      {
        option: `MARK_${TASK_CODE}_DONE_BECAUSE_RENDER_GATE_PASS`,
        reason: 'Render fidelity is clean, but path-domain and source metadata remain unresolved.',
      },
    ],
    requiredHumanReviewQuestions: [
      'Which official labels and semantic paths should replace the ten "Ô trống" generic fields?',
      'Are the Nơi thường trú placeholders split address fields or a combined person/current/permanent address line?',
      'Should legalBasis.field3 stay manual, become a legal-basis/procedural reference, or be sourced from a prior decision payload?',
      `Which document/agency fields are constants from agency config versus manual user inputs in ${TEMPLATE_CODE}?`,
    ],
    evidenceRefs: {
      renderDiff: `docs/audit/per-form-render-accurate/${TEMPLATE_CODE}/render-diff.latest.json`,
      evidence: `docs/audit/docx-placeholder-renormalization/${TEMPLATE_CODE}/evidence.latest.json`,
      patchPlan: `docs/audit/docx-placeholder-renormalization/${TEMPLATE_CODE}/patch-plan.latest.json`,
      plannerHandoff: `docs/audit/docx-placeholder-renormalization/${TEMPLATE_CODE}/planner-handoff.latest.json`,
    },
    createdAt: GENERATED_AT,
    createdBy: `${TASK_CODE}_PATH_DOMAIN_BINDING_EVIDENCE task`,
  };

  writeJson('evidence.latest.json', evidence);
  writeJson('patch-plan.latest.json', patchPlan);
  writeJson('planner-handoff.latest.json', handoff);
  writeJson('human-review-blocker.latest.json', ledger);

  writeText('evidence.latest.md', [
    `# ${TEMPLATE_CODE} Path-Domain Binding Evidence`,
    '',
    `Mode: ${evidence.mode}`,
    `Render gate: ${renderGate.status}`,
    `Candidates: ${candidates.length}`,
    `Deferred: ${deferred.length}`,
    `Root-cause issue entries: ${templateEntry.issueCount}`,
    '',
    markdownTable(issueGroups),
    '',
  ].join('\n'));

  writeText('patch-plan.latest.md', [
    `# ${TEMPLATE_CODE} Patch Plan`,
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    '- Patch candidates: 0',
    `- Deferred items: ${deferred.length}`,
    '- Can apply now: NO',
    '',
  ].join('\n'));

  writeText('planner-handoff.latest.md', [
    `# ${TEMPLATE_CODE} Planner Handoff`,
    '',
    `Status: ${handoff.status}`,
    `Render gate: ${renderGate.status}`,
    `Can apply now: ${handoff.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    handoff.nextPlannerDecision,
    '',
  ].join('\n'));

  writeText('human-review-blocker.latest.md', [
    `# ${TEMPLATE_CODE} Human Review Blocker`,
    '',
    `**Template:** ${TEMPLATE_CODE} - ${evidence.title}`,
    '**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW',
    '**Lane:** LEGAL_REVIEW',
    '**Can Apply Now:** NO',
    '**Can Mark Done:** NO',
    '',
    '## Render Gate',
    '',
    `Render gate is ${renderGate.status}. ${TEMPLATE_CODE} is blocked for semantic/path-domain review, not render execution.`,
    '',
    '## Deferred Items',
    '',
    markdownTable(deferred),
    '',
    '## Required Review',
    '',
    '- Confirm official labels, source policy, and semantic paths for each generic field.',
    '- Split any approved changes into a separate apply task with exact path-level decisions.',
    `- Do not mark ${TEMPLATE_CODE} DONE until semantic blockers are resolved.`,
    '',
  ].join('\n'));

  writeText('codegraph.findings.md', [
    `# ${TEMPLATE_CODE} CodeGraph Findings`,
    '',
    '- `renderBindings.slotId` is the DOCX placeholder target and `renderBindings.from` is the semantic source path.',
    '- Clean render output does not prove source/path-domain metadata correctness.',
    '- Existing path-domain evidence scripts use evidence-only ledgers and no approved decisions when fix-plan items are applySafe=false.',
    '- Board refresh preserves `human-review-blocker.latest.json` ledgers and moves blocked BMs to `LEGAL_REVIEW`.',
    '',
  ].join('\n'));

  process.stdout.write(`[${TEMPLATE_CODE}] evidence written to ${OUT_DIR}\n`);
  process.stdout.write(`[${TEMPLATE_CODE}] candidates=${candidates.length} deferred=${deferred.length} issues=${templateEntry.issueCount} render=${renderGate.status}\n`);
}

main();
