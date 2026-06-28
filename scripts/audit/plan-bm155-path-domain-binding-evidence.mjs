#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATE_CODE = 'BM-155';
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE);
const ROOT_CAUSE_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
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

function groupIssues(templateEntry) {
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
    };
    current.issueCodes.push(issue.issueCode);
    current.severities.push(issue.severity);
    current.requiresHumanReview ||= issue.requiresHumanReview === true;
    current.reasons.push(issue.reason);
    byPath.set(issue.path, current);
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function isPlaceholderOnlyContext(text) {
  const stripped = String(text || '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/[.,;:()\-–—\s0-9]/g, '')
    .trim();
  return stripped.length === 0;
}

function classify(item) {
  if (item.issueCodes.includes('SOURCE_MISMATCH')) {
    return {
      classification: 'DEFER_SOURCE_POLICY_CONFLICT',
      reason: `${item.path} has SOURCE_MISMATCH plus UI-visible bad metadata. Source/path policy must be reviewed before changing contract metadata.`,
    };
  }

  if (/nơi\s+tạm\s+trú|nơi\s+thường\s+trú/i.test(item.context || '')) {
    return {
      classification: 'DEFER_PATH_DOMAIN_MISMATCH',
      reason: `${item.path} appears near an address label, but the current path/domain is not an address semantic. This requires same-BM legal/DOCX review before remap.`,
    };
  }

  if (isPlaceholderOnlyContext(item.context)) {
    return {
      classification: 'DEFER_NO_VISIBLE_LABEL',
      reason: `${item.path} has only placeholder-neighborhood evidence and no stable visible Vietnamese label. Do not infer a semantic path from position alone.`,
    };
  }

  if (item.suggestedPath || item.suggestedLabel) {
    return {
      classification: 'DEFER_LABEL_ONLY_WEAK_EVIDENCE',
      reason: `${item.path} has an audit suggestion, but BM-155 evidence is still label/context-only and not enough for an approved mutation.`,
    };
  }

  return {
    classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
    reason: `${item.path} remains a generic field/path-domain issue that needs human DOCX/legal review.`,
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

  const issueGroups = groupIssues(templateEntry).map((item) => {
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
      canApply: false,
    };
  });

  const deferred = issueGroups.filter((item) => item.classification.startsWith('DEFER_'));
  const candidates = issueGroups.filter((item) => !item.classification.startsWith('DEFER_'));

  for (const item of issueGroups) {
    if (!DEFER_CLASSIFICATIONS.has(item.classification)) {
      throw new Error(`Unexpected classification ${item.classification} for ${item.path}`);
    }
  }

  const renderGate = renderGateSummary(renderDiff);
  const boardRow = board?.rows?.find((row) => row.templateCode === TEMPLATE_CODE) ?? null;

  const evidence = {
    schemaVersion: '1.0.0',
    task: 'BM155_PATH_DOMAIN_BINDING_EVIDENCE',
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
    task: 'BM155_PATH_DOMAIN_BINDING_PATCH_PLAN',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    patchCandidates: [],
    deferredItems: deferred.map(({ path, rawPattern, classification, reason }) => ({ path, rawPattern, classification, reason })),
    safetyAssertions: {
      canApplyRunNow: false,
      requiresPlannerApproval: true,
      requiresHumanDocxLegalReview: true,
    },
  };

  const handoff = {
    handoffVersion: '1.0.0',
    task: 'BM155_PATH_DOMAIN_BINDING_EVIDENCE',
    mode: 'EVIDENCE_ONLY',
    generatedAt: GENERATED_AT,
    templateCode: TEMPLATE_CODE,
    status: 'BLOCKED_BY_HUMAN_DOCX_REVIEW',
    canApplyRunNow: false,
    canMarkDone: false,
    renderGateBefore: renderGate,
    counts: {
      totalIssueGroups: issueGroups.length,
      candidates: candidates.length,
      deferred: deferred.length,
    },
    nextPlannerDecision: 'Close BM-155 as BLOCKED_BY_HUMAN_DOCX_REVIEW or provide approved occurrence/path-level decisions for a separate apply task.',
  };

  const ledger = {
    task: 'BM155_REMAINING_PATH_DOMAIN_REVIEW_BLOCKER',
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
        placeholder: 'BM-155.pathDomainGenericFields',
        count: deferred.length,
        classification: 'DEFER_REQUIRES_HUMAN_DOCX_REVIEW',
        reason: 'BM-155 render-fidelity passes, but remaining path-domain/generic-field evidence is weak, label-only, or path-domain conflicting. Do not mutate without human DOCX/legal review.',
      },
    ],
    remainingIssueSummary: evidence.rootCause,
    remainingPaths: deferred.map((item) => item.path),
    plannerDecision: 'DEFER_TO_HUMAN_DOCX_LEGAL_REVIEW',
    rejectedOptions: [
      {
        option: 'AUTO_REMAP_ALL_BM155_GENERIC_FIELDS',
        reason: 'The remaining evidence mixes generic document/person fields, address-like labels, legal-basis/body slots, and footer/recipient slots. Batch mutation would be semantic guessing.',
      },
      {
        option: 'MARK_BM155_DONE_BECAUSE_RENDER_GATE_PASS',
        reason: 'Render fidelity is clean, but semantic/path-domain contract metadata remains unresolved.',
      },
    ],
    requiredHumanReviewQuestions: [
      'What official TT-03-2026-VKSTC label and semantic path corresponds to each BM-155 generic field?',
      'Are the person.field11-person.field14 placeholders document metadata, person metadata, or procedural references in this form?',
      'Does the Nơi tạm trú context currently mapped as document.soQd require a person/address semantic path?',
      'Which Điều 2 / footer fields are legal body text versus recipient/footer metadata?',
    ],
    evidenceRefs: {
      renderDiff: 'docs/audit/per-form-render-accurate/BM-155/render-diff.latest.json',
      evidence: 'docs/audit/docx-placeholder-renormalization/BM-155/evidence.latest.json',
      patchPlan: 'docs/audit/docx-placeholder-renormalization/BM-155/patch-plan.latest.json',
      plannerHandoff: 'docs/audit/docx-placeholder-renormalization/BM-155/planner-handoff.latest.json',
    },
    createdAt: GENERATED_AT,
    createdBy: 'BM155_PATH_DOMAIN_BINDING_EVIDENCE task',
  };

  writeJson('evidence.latest.json', evidence);
  writeJson('patch-plan.latest.json', patchPlan);
  writeJson('planner-handoff.latest.json', handoff);
  writeJson('human-review-blocker.latest.json', ledger);

  writeText('evidence.latest.md', [
    '# BM-155 Path-Domain Binding Evidence',
    '',
    `Mode: ${evidence.mode}`,
    `Render gate: ${renderGate.status}`,
    `Candidates: ${candidates.length}`,
    `Deferred: ${deferred.length}`,
    '',
    markdownTable(issueGroups),
    '',
  ].join('\n'));

  writeText('patch-plan.latest.md', [
    '# BM-155 Patch Plan',
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    '- Patch candidates: 0',
    `- Deferred items: ${deferred.length}`,
    '- Can apply now: NO',
    '',
  ].join('\n'));

  writeText('planner-handoff.latest.md', [
    '# BM-155 Planner Handoff',
    '',
    `Status: ${handoff.status}`,
    `Render gate: ${renderGate.status}`,
    `Can apply now: ${handoff.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    handoff.nextPlannerDecision,
    '',
  ].join('\n'));

  writeText('human-review-blocker.latest.md', [
    '# BM-155 Human Review Blocker',
    '',
    `**Template:** ${TEMPLATE_CODE} - ${evidence.title}`,
    '**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW',
    '**Lane:** LEGAL_REVIEW',
    '**Can Apply Now:** NO',
    '**Can Mark Done:** NO',
    '',
    '## Render Gate',
    '',
    `Render gate is ${renderGate.status}. BM-155 is blocked for semantic/path-domain review, not render execution.`,
    '',
    '## Deferred Items',
    '',
    markdownTable(deferred),
    '',
    '## Required Review',
    '',
    '- Confirm official labels and semantic paths for each generic field.',
    '- Split any approved changes into a separate apply task with exact path-level decisions.',
    '- Do not mark BM-155 DONE until semantic blockers are resolved.',
    '',
  ].join('\n'));

  process.stdout.write(`[BM-155] evidence written to ${OUT_DIR}\n`);
  process.stdout.write(`[BM-155] candidates=${candidates.length} deferred=${deferred.length} render=${renderGate.status}\n`);
}

main();
