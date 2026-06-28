#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const WRITE_MODE = process.argv.includes('--write');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const APPROVED_DIR = join(
  ROOT,
  'docs',
  'audit',
  '213-docx-fidelity-board',
  'contract-repair-batch-1-approved',
);
const DECISIONS_JSON = join(APPROVED_DIR, 'decisions.approved.json');
const REPORT_JSON = join(APPROVED_DIR, 'apply-report.latest.json');
const REPORT_MD = join(APPROVED_DIR, 'apply-report.latest.md');
const BACKUP_DIR = join(APPROVED_DIR, 'backups');

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

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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

function loadDecisions() {
  if (!existsSync(DECISIONS_JSON)) {
    throw new Error(`Missing approved decisions file: ${DECISIONS_JSON}`);
  }

  const doc = readJson(DECISIONS_JSON);
  const decisions = doc.decisions ?? doc.approvedDecisions ?? [];
  if (!Array.isArray(decisions)) {
    throw new Error('Approved decisions file must contain decisions[]');
  }

  return {
    document: doc,
    decisions: decisions.filter(
      (decision) => decision.approvalStatus === 'APPROVED_FOR_APPLY',
    ),
  };
}

function loadEvidence(decision) {
  const evidencePath = join(
    ROOT,
    decision.sourceEvidence ??
      join(
        'docs',
        'audit',
        'per-form-render-accurate',
        decision.templateCode,
        'evidence.latest.json',
      ),
  );

  if (!existsSync(evidencePath)) {
    throw new Error(
      `Missing evidence for ${decision.decisionId ?? decision.templateCode}: ${evidencePath}`,
    );
  }

  return { path: evidencePath, evidence: readJson(evidencePath) };
}

function includesValue(values, value) {
  return Array.isArray(values) && values.includes(value);
}

function placeholderItem(evidence, placeholder) {
  return (evidence.docx?.placeholders?.items ?? []).find(
    (item) => item.placeholder === placeholder,
  );
}

function docxPlaceholderOrder(evidence, placeholder) {
  const order = evidence.docx?.placeholders?.unique ?? [];
  const index = order.indexOf(placeholder);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}

function insertByDocxOrder(items, newItem, getKey, evidence) {
  const newOrder = docxPlaceholderOrder(evidence, getKey(newItem));
  const insertIndex = items.findIndex((item) => {
    const existingOrder = docxPlaceholderOrder(evidence, getKey(item));
    return existingOrder > newOrder;
  });

  if (insertIndex < 0) {
    items.push(newItem);
  } else {
    items.splice(insertIndex, 0, newItem);
  }
}

function deriveTextBefore(context, rawPattern, fallback) {
  const index = String(context ?? '').indexOf(rawPattern);
  if (index < 0) return fallback ?? '';
  return String(context).slice(Math.max(0, index - 160), index).trim();
}

function deriveTextAfter(context, rawPattern, fallback) {
  const index = String(context ?? '').indexOf(rawPattern);
  if (index < 0) return fallback ?? '';
  return String(context)
    .slice(index + rawPattern.length, index + rawPattern.length + 160)
    .trim();
}

const VALID_FIELD_SOURCES = new Set([
  'manual',
  'casePayload',
  'agencyConfig',
  'officialConfig',
  'systemDate',
  'computed',
  'constantFromDocx',
]);

function classifyRelinkDecision(decision, contract, evidence) {
  const errors = [];

  if (!decision.templateCode || !decision.oldSlotId || !decision.newSlotId) {
    errors.push('Decision missing templateCode, oldSlotId, or newSlotId');
  }
  if (!decision.preserveBindingFrom) {
    errors.push('Decision missing preserveBindingFrom');
  }
  if (decision.oldSlotId === decision.newSlotId) {
    errors.push('oldSlotId and newSlotId must differ');
  }
  if (evidence.templateCode !== decision.templateCode) {
    errors.push(
      `Evidence templateCode ${evidence.templateCode} does not match ${decision.templateCode}`,
    );
  }

  const docxPlaceholders = evidence.docx?.placeholders?.unique ?? [];
  if (!includesValue(docxPlaceholders, decision.newSlotId)) {
    errors.push(
      `DOCX evidence does not contain placeholder ${decision.newSlotId}`,
    );
  }

  const fields = contract.canonicalFields ?? [];
  const slots = contract.docxSlots ?? [];
  const bindings = contract.renderBindings ?? [];

  const sourceField = fields.find(
    (field) => field.path === decision.preserveBindingFrom,
  );
  const oldSlot = slots.find((slot) => slot.slotId === decision.oldSlotId);
  const newSlot = slots.find((slot) => slot.slotId === decision.newSlotId);
  const oldBinding = bindings.find(
    (binding) => binding.slotId === decision.oldSlotId,
  );
  const newBinding = bindings.find(
    (binding) => binding.slotId === decision.newSlotId,
  );

  if (!sourceField) {
    errors.push(`Canonical source field missing: ${decision.preserveBindingFrom}`);
  }

  const idempotent =
    !oldSlot &&
    !oldBinding &&
    Boolean(newSlot) &&
    Boolean(newBinding) &&
    newBinding?.from === decision.preserveBindingFrom;

  if (idempotent) {
    return { status: errors.length ? 'FAILED_VALIDATION' : 'SKIPPED_IDEMPOTENT', errors };
  }

  if (!oldSlot) errors.push(`Old slot missing: ${decision.oldSlotId}`);
  if (!oldBinding) errors.push(`Old binding missing: ${decision.oldSlotId}`);
  if (newSlot) errors.push(`New slot already exists: ${decision.newSlotId}`);
  if (newBinding) errors.push(`New binding already exists: ${decision.newSlotId}`);
  if (oldBinding && oldBinding.from !== decision.preserveBindingFrom) {
    errors.push(
      `Old binding from=${oldBinding.from} does not match ${decision.preserveBindingFrom}`,
    );
  }

  const mismatches = evidence.structuralMismatches ?? {};
  if (
    !includesValue(
      mismatches.templatePlaceholdersWithoutSlots,
      decision.newSlotId,
    )
  ) {
    errors.push(
      `Evidence does not list ${decision.newSlotId} as templatePlaceholdersWithoutSlots`,
    );
  }
  if (
    !includesValue(
      mismatches.contractSlotsWithoutTemplatePlaceholders,
      decision.oldSlotId,
    )
  ) {
    errors.push(
      `Evidence does not list ${decision.oldSlotId} as contractSlotsWithoutTemplatePlaceholders`,
    );
  }
  if (
    !includesValue(
      mismatches.bindingsWithoutTemplatePlaceholders,
      decision.oldSlotId,
    )
  ) {
    errors.push(
      `Evidence does not list ${decision.oldSlotId} as bindingsWithoutTemplatePlaceholders`,
    );
  }

  return { status: errors.length ? 'FAILED_VALIDATION' : 'PLANNED', errors };
}

function classifyAddPlaceholderDecision(decision, contract, evidence) {
  const errors = [];
  const placeholder = decision.placeholder;
  const field = decision.field ?? {};
  const slot = decision.slot ?? {};
  const binding = decision.binding ?? {};

  if (!decision.templateCode || !placeholder) {
    errors.push('Decision missing templateCode or placeholder');
  }
  if (evidence.templateCode !== decision.templateCode) {
    errors.push(
      `Evidence templateCode ${evidence.templateCode} does not match ${decision.templateCode}`,
    );
  }
  if (field.path !== placeholder) {
    errors.push('field.path must equal placeholder for add-placeholder repairs');
  }
  if (!field.label) errors.push('field.label is required');
  if (!field.source) errors.push('field.source is required');
  if (field.source && !VALID_FIELD_SOURCES.has(field.source)) {
    errors.push(`Unsupported field.source: ${field.source}`);
  }
  if (!field.uiComponent) errors.push('field.uiComponent is required');
  if (!field.section) errors.push('field.section is required');
  if (binding.from !== field.path) {
    errors.push('binding.from must equal field.path');
  }

  const docxPlaceholders = evidence.docx?.placeholders?.unique ?? [];
  if (!includesValue(docxPlaceholders, placeholder)) {
    errors.push(`DOCX evidence does not contain placeholder ${placeholder}`);
  }
  if (!placeholderItem(evidence, placeholder)) {
    errors.push(`DOCX evidence is missing placeholder item ${placeholder}`);
  }

  const fields = contract.canonicalFields ?? [];
  const slots = contract.docxSlots ?? [];
  const bindings = contract.renderBindings ?? [];
  const existingField = fields.find((item) => item.path === field.path);
  const existingSlot = slots.find((item) => item.slotId === placeholder);
  const existingBinding = bindings.find((item) => item.slotId === placeholder);

  const idempotent =
    Boolean(existingField) &&
    Boolean(existingSlot) &&
    Boolean(existingBinding) &&
    existingBinding?.from === field.path;

  if (idempotent) {
    return { status: errors.length ? 'FAILED_VALIDATION' : 'SKIPPED_IDEMPOTENT', errors };
  }

  const mismatches = evidence.structuralMismatches ?? {};
  if (
    !includesValue(mismatches.templatePlaceholdersWithoutSlots, placeholder)
  ) {
    errors.push(
      `Evidence does not list ${placeholder} as templatePlaceholdersWithoutSlots`,
    );
  }

  if (existingField) errors.push(`Canonical field already exists: ${field.path}`);
  if (existingSlot) errors.push(`Slot already exists: ${placeholder}`);
  if (existingBinding) errors.push(`Binding already exists: ${placeholder}`);

  const rawPattern = decision.expectedDocxRawPattern ?? `{{${placeholder}}}`;
  const item = placeholderItem(evidence, placeholder);
  if (item?.context && !String(item.context).includes(rawPattern)) {
    errors.push(
      `Placeholder context for ${placeholder} does not include ${rawPattern}`,
    );
  }

  if (slot.label && slot.label !== field.label) {
    errors.push('slot.label must match field.label');
  }

  return { status: errors.length ? 'FAILED_VALIDATION' : 'PLANNED', errors };
}

function classifyRemoveOrphanDecision(decision, contract, evidence) {
  const errors = [];
  const targetPath = decision.path;

  if (!decision.templateCode || !targetPath) {
    errors.push('Decision missing templateCode or path');
  }
  if (evidence.templateCode !== decision.templateCode) {
    errors.push(
      `Evidence templateCode ${evidence.templateCode} does not match ${decision.templateCode}`,
    );
  }

  const docxPlaceholders = evidence.docx?.placeholders?.unique ?? [];
  if (includesValue(docxPlaceholders, targetPath)) {
    errors.push(`Cannot remove ${targetPath}; DOCX evidence still contains it`);
  }

  const fields = contract.canonicalFields ?? [];
  const slots = contract.docxSlots ?? [];
  const bindings = contract.renderBindings ?? [];
  const existingField = fields.find((item) => item.path === targetPath);
  const existingSlot = slots.find((item) => item.slotId === targetPath);
  const existingBinding = bindings.find((item) => item.slotId === targetPath);

  const shouldRemoveField = decision.removeCanonicalField === true;
  const idempotent =
    !existingSlot &&
    !existingBinding &&
    (!shouldRemoveField || !existingField);

  if (idempotent) {
    return { status: errors.length ? 'FAILED_VALIDATION' : 'SKIPPED_IDEMPOTENT', errors };
  }

  const mismatches = evidence.structuralMismatches ?? {};
  if (
    !includesValue(
      mismatches.contractSlotsWithoutTemplatePlaceholders,
      targetPath,
    )
  ) {
    errors.push(
      `Evidence does not list ${targetPath} as contractSlotsWithoutTemplatePlaceholders`,
    );
  }
  if (
    !includesValue(
      mismatches.bindingsWithoutTemplatePlaceholders,
      targetPath,
    )
  ) {
    errors.push(
      `Evidence does not list ${targetPath} as bindingsWithoutTemplatePlaceholders`,
    );
  }

  if (!existingSlot) errors.push(`Slot missing: ${targetPath}`);
  if (!existingBinding) errors.push(`Binding missing: ${targetPath}`);
  if (shouldRemoveField && !existingField) {
    errors.push(`Canonical field missing: ${targetPath}`);
  }
  if (existingBinding && existingBinding.from !== targetPath) {
    errors.push(
      `Refusing to remove ${targetPath}; binding.from=${existingBinding.from} is a different semantic field`,
    );
  }

  const otherBindingsFromField = bindings.filter(
    (binding) =>
      binding.from === targetPath && binding.slotId !== targetPath,
  );
  if (shouldRemoveField && otherBindingsFromField.length > 0) {
    errors.push(
      `Refusing to remove field ${targetPath}; other bindings still read from it`,
    );
  }

  return { status: errors.length ? 'FAILED_VALIDATION' : 'PLANNED', errors };
}

function classifyDecision(decision, contract, evidence) {
  if (decision.action === 'RELINK_SLOT_TARGET_TO_DOCX_PLACEHOLDER') {
    return classifyRelinkDecision(decision, contract, evidence);
  }
  if (decision.action === 'ADD_TEMPLATE_PLACEHOLDER_SLOT_FIELD_BINDING') {
    return classifyAddPlaceholderDecision(decision, contract, evidence);
  }
  if (decision.action === 'REMOVE_ORPHAN_FIELD_SLOT_BINDING') {
    return classifyRemoveOrphanDecision(decision, contract, evidence);
  }

  return {
    status: 'FAILED_VALIDATION',
    errors: [`Unsupported action: ${decision.action}`],
  };
}

function applyRelink(contract, decision, evidence) {
  const next = deepClone(contract);
  const slots = next.docxSlots ?? [];
  const bindings = next.renderBindings ?? [];
  const slot = slots.find((item) => item.slotId === decision.oldSlotId);
  const binding = bindings.find((item) => item.slotId === decision.oldSlotId);
  const item = placeholderItem(evidence, decision.newSlotId);
  const rawPattern =
    decision.expectedDocxRawPattern ?? `{{${decision.newSlotId}}}`;
  const context = item?.context ?? slot.context ?? '';

  slot.slotId = decision.newSlotId;
  slot.label = decision.expectedLabel ?? slot.label;
  slot.context = context;
  slot.evidence = {
    ...(slot.evidence ?? {}),
    rawPattern,
    textBefore: deriveTextBefore(context, rawPattern, slot.evidence?.textBefore),
    textAfter: deriveTextAfter(context, rawPattern, slot.evidence?.textAfter),
  };
  slot.reviewEvidence = {
    ...(slot.reviewEvidence ?? {}),
    rawPattern,
    context,
    textBefore: slot.evidence.textBefore,
    textAfter: slot.evidence.textAfter,
  };

  binding.slotId = decision.newSlotId;
  binding.from = decision.preserveBindingFrom;

  return next;
}

function applyAddPlaceholder(contract, decision, evidence) {
  const next = deepClone(contract);
  next.canonicalFields ??= [];
  next.docxSlots ??= [];
  next.renderBindings ??= [];

  const placeholder = decision.placeholder;
  const fieldDecision = decision.field;
  const slotDecision = decision.slot ?? {};
  const bindingDecision = decision.binding ?? {};
  const item = placeholderItem(evidence, placeholder);
  const rawPattern =
    decision.expectedDocxRawPattern ?? `{{${placeholder}}}`;
  const context = item?.context ?? rawPattern;
  const textBefore = deriveTextBefore(context, rawPattern, '');
  const textAfter = deriveTextAfter(context, rawPattern, '');
  const location = slotDecision.location ?? item?.location ?? {
    partName: 'word/document.xml',
    blockId: null,
    tableCellId: null,
  };
  const reviewRequired =
    fieldDecision.reviewRequired ?? slotDecision.reviewRequired ?? false;

  const field = {
    path: fieldDecision.path,
    type: fieldDecision.type ?? 'string',
    label: fieldDecision.label,
    source: fieldDecision.source,
    required: fieldDecision.required ?? slotDecision.required ?? false,
    uiComponent: fieldDecision.uiComponent,
    section: fieldDecision.section,
    reviewRequired,
    transform:
      fieldDecision.transform ?? bindingDecision.transform ?? 'identity',
    reviewEvidence: {
      context,
      blockId: location.blockId ?? null,
    },
  };

  const slot = {
    slotId: placeholder,
    location,
    context,
    label: slotDecision.label ?? fieldDecision.label,
    slotType: slotDecision.slotType ?? 'text',
    required: slotDecision.required ?? field.required,
    confidence: slotDecision.confidence ?? 1,
    evidence: {
      textBefore,
      textAfter,
      rawPattern,
    },
    reviewRequired,
    reviewEvidence: {
      textBefore,
      textAfter,
      rawPattern,
      context,
      blockId: location.blockId ?? null,
    },
  };

  const binding = {
    slotId: placeholder,
    from: bindingDecision.from,
    transform: bindingDecision.transform ?? 'identity',
    fallback: bindingDecision.fallback ?? '',
    reviewRequired: bindingDecision.reviewRequired ?? reviewRequired,
  };

  insertByDocxOrder(next.canonicalFields, field, (item) => item.path, evidence);
  insertByDocxOrder(next.docxSlots, slot, (item) => item.slotId, evidence);
  insertByDocxOrder(next.renderBindings, binding, (item) => item.slotId, evidence);

  return next;
}

function applyRemoveOrphan(contract, decision) {
  const next = deepClone(contract);
  const targetPath = decision.path;

  next.docxSlots = (next.docxSlots ?? []).filter(
    (slot) => slot.slotId !== targetPath,
  );
  next.renderBindings = (next.renderBindings ?? []).filter(
    (binding) => binding.slotId !== targetPath,
  );
  if (decision.removeCanonicalField === true) {
    next.canonicalFields = (next.canonicalFields ?? []).filter(
      (field) => field.path !== targetPath,
    );
  }

  return next;
}

function buildMarkdown(report) {
  const lines = [
    '# Contract Repair Batch 1 Approved Apply Report',
    '',
    `Mode: ${report.mode}`,
    '',
    '| Metric | Count |',
    '|---|---:|',
    `| Decisions | ${report.summary.decisions} |`,
    `| Planned | ${report.summary.planned} |`,
    `| Applied | ${report.summary.applied} |`,
    `| Skipped idempotent | ${report.summary.skippedIdempotent} |`,
    `| Failed | ${report.summary.failed} |`,
    '',
    '| Decision | BM | Action | Status | Target | Source field |',
    '|---|---|---|---|---|---|',
  ];

  for (const item of report.items) {
    lines.push(
      `| ${item.decisionId} | ${item.templateCode} | ${item.action} | ${item.status} | ${item.newSlotId ?? item.placeholder ?? item.oldSlotId ?? item.path ?? ''} | ${item.preserveBindingFrom ?? item.fieldPath ?? item.path ?? ''} |`,
    );
  }

  return lines.join('\n');
}

function main() {
  const { document, decisions } = loadDecisions();
  const items = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const decision of decisions) {
    const { path: evidencePath, evidence } = loadEvidence(decision);
    const contractPath = findLockedContractFile(decision.templateCode);
    const contract = readJson(contractPath);
    const classification = classifyDecision(decision, contract, evidence);
    const item = {
      decisionId: decision.decisionId ?? `${decision.templateCode}:${decision.action}`,
      templateCode: decision.templateCode,
      action: decision.action,
      status: classification.status,
      oldSlotId: decision.oldSlotId,
      newSlotId: decision.newSlotId,
      placeholder: decision.placeholder,
      path: decision.path,
      preserveBindingFrom: decision.preserveBindingFrom,
      fieldPath: decision.field?.path,
      contractFile: contractPath,
      evidenceFile: evidencePath,
      errors: classification.errors,
    };

    if (classification.status === 'PLANNED' && WRITE_MODE) {
      const backupSubdir = join(BACKUP_DIR, timestamp);
      mkdirSync(backupSubdir, { recursive: true });
      const backupPath = join(backupSubdir, basename(contractPath));
      copyFileSync(contractPath, backupPath);

      const next =
        decision.action === 'RELINK_SLOT_TARGET_TO_DOCX_PLACEHOLDER'
          ? applyRelink(contract, decision, evidence)
          : decision.action === 'ADD_TEMPLATE_PLACEHOLDER_SLOT_FIELD_BINDING'
            ? applyAddPlaceholder(contract, decision, evidence)
            : applyRemoveOrphan(contract, decision, evidence);
      writeJson(contractPath, next);
      item.status = 'APPLIED';
      item.backupFile = backupPath;
    }

    items.push(item);
  }

  const report = {
    schemaVersion: 1,
    mode: WRITE_MODE ? 'WRITE' : 'DRY_RUN',
    generatedAt: new Date().toISOString(),
    sourceDecisions: DECISIONS_JSON,
    sourceMode: document.mode ?? null,
    safetyAssertions: {
      explicitApprovedDecisionsRequired: true,
      dryRunByDefault: true,
      sameBmEvidenceRequired: true,
      noCanonicalSourceFieldRename: true,
      noDocxTemplateMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
    },
    summary: {
      decisions: items.length,
      planned: items.filter((item) => item.status === 'PLANNED').length,
      applied: items.filter((item) => item.status === 'APPLIED').length,
      skippedIdempotent: items.filter(
        (item) => item.status === 'SKIPPED_IDEMPOTENT',
      ).length,
      failed: items.filter((item) => item.status === 'FAILED_VALIDATION')
        .length,
    },
    items,
  };

  writeJson(REPORT_JSON, report);
  writeText(REPORT_MD, buildMarkdown(report));

  const failed = report.summary.failed;
  console.log('=== apply:contract-repair-batch-1-approved ===');
  console.log(`Mode: ${report.mode}`);
  console.log(`Planned: ${report.summary.planned}`);
  console.log(`Applied: ${report.summary.applied}`);
  console.log(`Skipped idempotent: ${report.summary.skippedIdempotent}`);
  console.log(`Failed: ${failed}`);
  console.log(`Report: ${REPORT_JSON}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
