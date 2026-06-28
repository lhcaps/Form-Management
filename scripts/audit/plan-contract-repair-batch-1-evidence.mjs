#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { extractDocxPlaceholdersFromFile } from './lib/docx-placeholder-risks.mjs';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DOCX_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const BOARD_DIR = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board');
const BATCH_JSON = join(BOARD_DIR, 'contract-repair-batch-1.latest.json');
const BATCH_EVIDENCE_JSON = join(
  BOARD_DIR,
  'contract-repair-batch-1-evidence.latest.json',
);
const BATCH_EVIDENCE_MD = join(
  BOARD_DIR,
  'contract-repair-batch-1-evidence.latest.md',
);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const separator = header.map(() => '---');
  return [header, separator, ...body]
    .map(
      (cells) =>
        `| ${cells.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`,
    )
    .join('\n');
}

function loadBatch() {
  if (!existsSync(BATCH_JSON)) {
    throw new Error(`Missing batch file: ${BATCH_JSON}`);
  }
  return readJson(BATCH_JSON);
}

function findLockedContractFile(templateCode) {
  const matches = readdirSync(LOCKED_DIR)
    .filter(
      (file) =>
        file.startsWith(`${templateCode}__`) &&
        file.endsWith('.contract.locked.json'),
    )
    .sort();
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one locked contract for ${templateCode}, found ${matches.length}`,
    );
  }
  return join(LOCKED_DIR, matches[0]);
}

function slotId(slot) {
  return slot.slotId ?? slot.id ?? '';
}

function bindingSlotId(binding) {
  return binding.slotId ?? binding.id ?? '';
}

function normalizedDocxPath(templateCode) {
  return join(
    NORMALIZED_DOCX_DIR,
    templateCode,
    `${templateCode}_normalized.docx`,
  );
}

function extractDocxPlaceholders(templateCode) {
  const docxPath = normalizedDocxPath(templateCode);
  return extractDocxPlaceholdersFromFile(docxPath);
}

function simplifySlot(slot) {
  return {
    slotId: slotId(slot),
    label: slot.label ?? null,
    rawPattern: slot.rawPattern ?? null,
    required: slot.required ?? null,
    reviewRequired: slot.reviewRequired ?? null,
    context: slot.context ?? null,
  };
}

function simplifyField(field) {
  return {
    path: field.path ?? null,
    label: field.label ?? null,
    source: field.source ?? null,
    required: field.required ?? null,
    reviewRequired: field.reviewRequired ?? null,
    rawPattern: field.rawPattern ?? null,
  };
}

function simplifyBinding(binding) {
  return {
    slotId: bindingSlotId(binding),
    from: binding.from ?? null,
    transform: binding.transform ?? null,
    reviewRequired: binding.reviewRequired ?? null,
  };
}

function buildStructuralMismatches(docx, contract) {
  const placeholders = new Set(docx.placeholders.unique);
  const slots = contract.docxSlots ?? [];
  const fields = contract.canonicalFields ?? [];
  const bindings = contract.renderBindings ?? [];
  const slotIds = new Set(slots.map((slot) => slot.slotId).filter(Boolean));
  const bindingSlotIds = new Set(
    bindings.map((binding) => binding.slotId).filter(Boolean),
  );
  const fieldPaths = new Set(fields.map((field) => field.path).filter(Boolean));
  const bindingFromBySlotId = new Map();
  const bindingSlotIdsByFrom = new Map();

  for (const binding of bindings) {
    if (binding.slotId && binding.from && !bindingFromBySlotId.has(binding.slotId)) {
      bindingFromBySlotId.set(binding.slotId, binding.from);
    }
    if (binding.from && binding.slotId) {
      const current = bindingSlotIdsByFrom.get(binding.from) ?? [];
      current.push(binding.slotId);
      bindingSlotIdsByFrom.set(binding.from, current);
    }
  }

  function slotHasCanonicalSource(id) {
    if (fieldPaths.has(id)) return true;
    const from = bindingFromBySlotId.get(id);
    return Boolean(from && fieldPaths.has(from));
  }

  function fieldHasSlotTarget(path) {
    if (slotIds.has(path)) return true;
    return (bindingSlotIdsByFrom.get(path) ?? []).some((id) => slotIds.has(id));
  }

  return {
    templatePlaceholdersWithoutSlots: [...placeholders]
      .filter((placeholder) => !slotIds.has(placeholder))
      .sort(),
    contractSlotsWithoutTemplatePlaceholders: [...slotIds]
      .filter((id) => !placeholders.has(id))
      .sort(),
    bindingsWithoutTemplatePlaceholders: bindings
      .filter((binding) => !placeholders.has(binding.slotId))
      .map((binding) => binding.slotId)
      .filter(Boolean)
      .sort(),
    slotsWithoutBindings: [...slotIds]
      .filter((id) => !bindingSlotIds.has(id))
      .sort(),
    bindingsWithoutSlots: [...bindingSlotIds]
      .filter((id) => !slotIds.has(id))
      .sort(),
    slotsWithoutCanonicalFields: [...slotIds]
      .filter((id) => !slotHasCanonicalSource(id))
      .sort(),
    fieldsWithoutSlots: [...fieldPaths]
      .filter((path) => !fieldHasSlotTarget(path))
      .sort(),
    duplicateSemanticPlaceholders:
      docx.placeholders.risks?.duplicateSemantic?.map((risk) => risk.placeholder) ??
      [],
    reviewRequired: {
      slots: slots
        .filter((slot) => slot.reviewRequired === true)
        .map((slot) => slot.slotId)
        .filter(Boolean),
      fields: fields
        .filter((field) => field.reviewRequired === true)
        .map((field) => field.path)
        .filter(Boolean),
      bindings: bindings
        .filter((binding) => binding.reviewRequired === true)
        .map((binding) => binding.slotId)
        .filter(Boolean),
    },
  };
}

function buildEvidence(batchItem) {
  const contractPath = findLockedContractFile(batchItem.templateCode);
  const rawContract = readJson(contractPath);
  const docx = extractDocxPlaceholders(batchItem.templateCode);
  const contract = {
    file: contractPath,
    sourceId: rawContract.sourceId ?? basename(contractPath, '.json'),
    status: rawContract.status ?? null,
    reviewKind: rawContract.reviewKind ?? null,
    canonicalFields: (rawContract.canonicalFields ?? []).map(simplifyField),
    docxSlots: (rawContract.docxSlots ?? []).map(simplifySlot),
    renderBindings: (rawContract.renderBindings ?? []).map(simplifyBinding),
  };
  const structuralMismatches = buildStructuralMismatches(docx, contract);

  return {
    schemaVersion: 1,
    mode: 'EVIDENCE_ONLY',
    templateCode: batchItem.templateCode,
    title: batchItem.title,
    sourceBatch: 'docs/audit/213-docx-fidelity-board/contract-repair-batch-1.latest.json',
    canApplyRunNow: false,
    baselineFindings: batchItem.baselineFindings,
    rootCause: batchItem.rootCause,
    docx,
    contract,
    structuralMismatches,
    safetyAssertions: {
      sameBmEvidenceOnly: true,
      noCrossBmEvidence: true,
      noContractMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
    },
  };
}

function mismatchCount(evidence) {
  const m = evidence.structuralMismatches;
  return (
    m.templatePlaceholdersWithoutSlots.length +
    m.contractSlotsWithoutTemplatePlaceholders.length +
    m.bindingsWithoutTemplatePlaceholders.length +
    m.slotsWithoutBindings.length +
    m.bindingsWithoutSlots.length +
    m.slotsWithoutCanonicalFields.length +
    m.fieldsWithoutSlots.length +
    m.duplicateSemanticPlaceholders.length +
    m.reviewRequired.slots.length +
    m.reviewRequired.fields.length +
    m.reviewRequired.bindings.length
  );
}

function proposedActionsFromEvidence(evidence) {
  const m = evidence.structuralMismatches;
  const actions = [];
  const duplicateRiskByPlaceholder = new Map(
    (evidence.docx.placeholders.risks?.duplicateSemantic ?? []).map((risk) => [
      risk.placeholder,
      risk,
    ]),
  );

  for (const risk of duplicateRiskByPlaceholder.values()) {
    actions.push({
      action: 'REVIEW_RENORMALIZE_DUPLICATE_DOCX_PLACEHOLDER',
      placeholder: risk.placeholder,
      approved: false,
      severity: risk.severity,
      reason: risk.reason,
      anchors: risk.anchors,
    });
  }

  for (const placeholder of m.templatePlaceholdersWithoutSlots) {
    if (duplicateRiskByPlaceholder.has(placeholder)) continue;
    actions.push({
      action: 'REVIEW_ADD_CONTRACT_SLOT_FOR_TEMPLATE_PLACEHOLDER',
      placeholder,
      approved: false,
      reason: 'Template placeholder exists in same-BM normalized DOCX but has no contract slot.',
    });
  }
  for (const slot of m.contractSlotsWithoutTemplatePlaceholders) {
    actions.push({
      action: 'REVIEW_ORPHAN_CONTRACT_SLOT',
      slotId: slot,
      approved: false,
      reason: 'Contract slot has no matching same-BM normalized DOCX placeholder.',
    });
  }
  for (const binding of m.bindingsWithoutTemplatePlaceholders) {
    actions.push({
      action: 'REVIEW_BINDING_WITHOUT_TEMPLATE_PLACEHOLDER',
      slotId: binding,
      approved: false,
      reason: 'Render binding targets a slot that is not present as a same-BM DOCX placeholder.',
    });
  }
  if (evidence.baselineFindings.includes('LEGACY_RENDERER_MANIFEST_STALE')) {
    actions.push({
      action: 'REFRESH_LEGACY_RENDERER_MANIFEST_EVIDENCE',
      approved: false,
      reason: 'Baseline reports a stale legacy renderer manifest; refresh evidence before contract mutation.',
    });
  }

  return actions;
}

function buildPatchPlan(evidence) {
  return {
    schemaVersion: 1,
    mode: 'PROPOSED_ONLY_NOT_APPROVED',
    templateCode: evidence.templateCode,
    title: evidence.title,
    canApplyRunNow: false,
    approvedDecisions: [],
    baselineFindings: evidence.baselineFindings,
    mismatchSummary: {
      total: mismatchCount(evidence),
      templatePlaceholdersWithoutSlots:
        evidence.structuralMismatches.templatePlaceholdersWithoutSlots.length,
      contractSlotsWithoutTemplatePlaceholders:
        evidence.structuralMismatches.contractSlotsWithoutTemplatePlaceholders
          .length,
      bindingsWithoutTemplatePlaceholders:
        evidence.structuralMismatches.bindingsWithoutTemplatePlaceholders.length,
      duplicateSemanticPlaceholders:
        evidence.structuralMismatches.duplicateSemanticPlaceholders.length,
      reviewRequired:
        evidence.structuralMismatches.reviewRequired.slots.length +
        evidence.structuralMismatches.reviewRequired.fields.length +
        evidence.structuralMismatches.reviewRequired.bindings.length,
    },
    proposedActions: proposedActionsFromEvidence(evidence),
    safetyAssertions: evidence.safetyAssertions,
    plannerDecisionNeeded: {
      requested: true,
      reason:
        'Evidence is prepared only. A human/planner must approve exact structural mutations per BM before any apply runner is created.',
    },
  };
}

function formatEvidenceMarkdown(evidence) {
  const m = evidence.structuralMismatches;
  return [
    `# ${evidence.templateCode} Contract Repair Evidence`,
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['DOCX placeholders total', evidence.docx.placeholders.total],
      ['DOCX placeholders unique', evidence.docx.placeholders.unique.length],
      [
        'DOCX duplicate semantic risks',
        evidence.docx.placeholders.risks?.duplicateSemantic?.length ?? 0,
      ],
      ['Contract slots', evidence.contract.docxSlots.length],
      ['Canonical fields', evidence.contract.canonicalFields.length],
      ['Render bindings', evidence.contract.renderBindings.length],
      ['Mismatch count', mismatchCount(evidence)],
    ]),
    '',
    '## Baseline Findings',
    '',
    ...evidence.baselineFindings.map((finding) => `- ${finding}`),
    '',
    '## Structural Mismatches',
    '',
    markdownTable([
      ['Type', 'Count', 'Items'],
      [
        'templatePlaceholdersWithoutSlots',
        m.templatePlaceholdersWithoutSlots.length,
        m.templatePlaceholdersWithoutSlots.join(', '),
      ],
      [
        'contractSlotsWithoutTemplatePlaceholders',
        m.contractSlotsWithoutTemplatePlaceholders.length,
        m.contractSlotsWithoutTemplatePlaceholders.join(', '),
      ],
      [
        'bindingsWithoutTemplatePlaceholders',
        m.bindingsWithoutTemplatePlaceholders.length,
        m.bindingsWithoutTemplatePlaceholders.join(', '),
      ],
      ['slotsWithoutBindings', m.slotsWithoutBindings.length, m.slotsWithoutBindings.join(', ')],
      ['bindingsWithoutSlots', m.bindingsWithoutSlots.length, m.bindingsWithoutSlots.join(', ')],
      [
        'slotsWithoutCanonicalFields',
        m.slotsWithoutCanonicalFields.length,
        m.slotsWithoutCanonicalFields.join(', '),
      ],
      ['fieldsWithoutSlots', m.fieldsWithoutSlots.length, m.fieldsWithoutSlots.join(', ')],
      [
        'duplicateSemanticPlaceholders',
        m.duplicateSemanticPlaceholders.length,
        m.duplicateSemanticPlaceholders.join(', '),
      ],
    ]),
    '',
    '## DOCX Duplicate Semantic Risks',
    '',
    markdownTable([
      ['Placeholder', 'Count', 'Anchors', 'Reason'],
      ...(evidence.docx.placeholders.risks?.duplicateSemantic ?? []).map((risk) => [
        risk.placeholder,
        risk.count,
        risk.anchors.join(', '),
        risk.reason,
      ]),
    ]),
    '',
    '## DOCX Placeholder Context',
    '',
    markdownTable([
      ['Placeholder', 'Count', 'Context'],
      ...evidence.docx.placeholders.items.map((item) => [
        item.placeholder,
        item.count,
        item.context,
      ]),
    ]),
    '',
  ].join('\n');
}

function formatPatchPlanMarkdown(plan) {
  return [
    `# ${plan.templateCode} Contract Repair Patch Plan`,
    '',
    'Mode: PROPOSED_ONLY_NOT_APPROVED',
    '',
    `Can apply run now: ${plan.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    '## Proposed Actions',
    '',
    markdownTable([
      ['Action', 'Target', 'Approved', 'Reason'],
      ...plan.proposedActions.map((action) => [
        action.action,
        action.placeholder ?? action.slotId ?? '-',
        action.approved,
        action.reason,
      ]),
    ]),
    '',
    '## Planner Decision Needed',
    '',
    plan.plannerDecisionNeeded.reason,
    '',
  ].join('\n');
}

function formatAggregateMarkdown(aggregate) {
  return [
    '# Contract Repair Batch 1 Evidence',
    '',
    'Mode: EVIDENCE_ONLY',
    '',
    `Can apply run now: ${aggregate.canApplyRunNow ? 'YES' : 'NO'}`,
    '',
    '## Items',
    '',
    markdownTable([
      ['BM', 'Mismatch count', 'Proposed actions', 'Evidence', 'Patch plan'],
      ...aggregate.items.map((item) => [
        item.templateCode,
        item.mismatchCount,
        item.proposedActionCount,
        item.evidenceJson,
        item.patchPlanJson,
      ]),
    ]),
    '',
    '## Safety',
    '',
    markdownTable([
      ['Assertion', 'Value'],
      ...Object.entries(aggregate.safetyAssertions).map(([key, value]) => [
        key,
        value,
      ]),
    ]),
    '',
  ].join('\n');
}

function main() {
  const batch = loadBatch();
  const aggregateItems = [];

  for (const item of batch.items) {
    const evidence = buildEvidence(item);
    const patchPlan = buildPatchPlan(evidence);
    const targets = item.evidenceTargets;

    writeJson(join(ROOT, targets.evidenceJson), evidence);
    writeText(join(ROOT, targets.evidenceMd), formatEvidenceMarkdown(evidence));
    writeJson(join(ROOT, targets.patchPlanJson), patchPlan);
    writeText(join(ROOT, targets.patchPlanMd), formatPatchPlanMarkdown(patchPlan));

    aggregateItems.push({
      templateCode: item.templateCode,
      mismatchCount: mismatchCount(evidence),
      proposedActionCount: patchPlan.proposedActions.length,
      evidenceJson: targets.evidenceJson,
      patchPlanJson: targets.patchPlanJson,
      canApplyRunNow: false,
    });
  }

  const aggregate = {
    schemaVersion: 1,
    mode: 'EVIDENCE_ONLY',
    sourceBatch: 'docs/audit/213-docx-fidelity-board/contract-repair-batch-1.latest.json',
    canApplyRunNow: false,
    approvedDecisions: [],
    safetyAssertions: {
      noContractMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      sameBmEvidenceRequired: true,
    },
    items: aggregateItems,
  };

  writeJson(BATCH_EVIDENCE_JSON, aggregate);
  writeText(BATCH_EVIDENCE_MD, formatAggregateMarkdown(aggregate));

  console.log('=== plan:contract-repair-batch-1-evidence ===');
  console.log(`Items: ${aggregate.items.length}`);
  console.log(`Aggregate: ${BATCH_EVIDENCE_JSON}`);
}

main();
