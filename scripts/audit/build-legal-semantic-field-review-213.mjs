#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import PizZip from 'pizzip';

import { isGenericPath } from '../docx-contract/lib/generic-path.mjs';

const REVIEW_OUT_DIR = join('docs', 'audit', 'legal-semantic-field-review-213');
const LOCKED_DIR = join('docs', 'audit', 'docx', 'contracts', 'locked');
const GENERIC_LABELS = new Set([
  '',
  'blank',
  'field',
  'slot',
  'slot from docx remediation',
  'slot from wave 01 docx remediation',
  'slot from wave 02 docx remediation',
  'o trong',
  '\u00f4 tr\u1ed1ng',
]);
const ALLOWED_SOURCES = new Set([
  'agencyConfig',
  'officialConfig',
  'systemDate',
  'computed',
  'manual',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return value == null ? '' : String(value);
}

function normalize(value) {
  return asText(value).trim();
}

function normalizePath(value) {
  return asText(value).replaceAll('\\', '/');
}

function toRepoPath(root, filePath) {
  return normalizePath(relative(root, filePath));
}

function countBy(rows, select) {
  const counts = {};
  for (const row of rows) {
    const key = select(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function isGenericLabel(value) {
  return GENERIC_LABELS.has(normalize(value).toLowerCase());
}

function sentenceFromPath(pathValue) {
  const last = normalize(pathValue).split('.').at(-1) ?? '';
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function sourceIssue(pathValue, source) {
  const path = normalize(pathValue);
  const fieldSource = normalize(source);
  if (!fieldSource) return 'missing source';
  if (!ALLOWED_SOURCES.has(fieldSource)) return `unsupported source "${fieldSource}"`;
  if (fieldSource === 'agencyConfig' && !path.startsWith('agency.')) {
    return 'agencyConfig outside agency namespace';
  }
  if (
    fieldSource === 'officialConfig' &&
    !(
      path.startsWith('official.') ||
      path.startsWith('signature.') ||
      path.includes('signer') ||
      path.includes('positionTitle')
    )
  ) {
    return 'officialConfig outside official/signature namespace';
  }
  if (
    fieldSource === 'systemDate' &&
    !/(date|day|month|year|ngay|thang|nam)/iu.test(path)
  ) {
    return 'systemDate on non-date path';
  }
  return null;
}

function uiIssue(field) {
  const ui = normalize(field.uiComponent);
  if (!ui) return 'missing uiComponent';
  if (!['text', 'textarea', 'date', 'select', 'checkbox', 'number'].includes(ui)) {
    return `unrecognized uiComponent "${ui}"`;
  }
  if (/content|description|reason|summary|note|line|basis|decision/iu.test(field.path ?? '')) {
    if (ui === 'text' && /content|description|reason|summary|basis/iu.test(field.path ?? '')) {
      return 'long narrative path uses text input';
    }
  }
  return null;
}

function findBinding(contract, fieldPath) {
  const bindings = asArray(contract.renderBindings);
  return (
    bindings.find((binding) => binding.from === fieldPath) ??
    bindings.find((binding) => binding.slotId === fieldPath) ??
    null
  );
}

function findSlot(contract, fieldPath, binding) {
  const slots = asArray(contract.docxSlots);
  const slotId = binding?.slotId ?? fieldPath;
  return (
    slots.find((slot) => slot.slotId === slotId) ??
    slots.find((slot) => slot.slotId === fieldPath) ??
    null
  );
}

function rawPatternMatchesSlot(slot, actualDocxHasSemanticToken) {
  if (actualDocxHasSemanticToken === true) return true;
  const rawPattern = normalize(slot?.evidence?.rawPattern);
  if (!rawPattern || !slot?.slotId) return true;
  return rawPattern.includes(`{{${slot.slotId}}}`);
}

function cleanXmlText(value) {
  return asText(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function actualDocxEvidenceForMatch(fileName, plainText, match, radius = 320) {
  const rawPattern = match[0];
  const matchIndex = plainText.indexOf(rawPattern);
  const tokenIndex = matchIndex >= 0 ? matchIndex : 0;
  const beforeStart = Math.max(0, tokenIndex - radius);
  const afterEnd = Math.min(plainText.length, tokenIndex + rawPattern.length + radius);
  return {
    fileName,
    rawPattern,
    textBefore: plainText.slice(beforeStart, tokenIndex).slice(-160).trim(),
    textAfter: plainText.slice(tokenIndex + rawPattern.length, afterEnd).slice(0, 160).trim(),
    context: plainText.slice(beforeStart, afterEnd).trim(),
  };
}

function findActualDocxEvidence(actualPlaceholders, ...candidates) {
  for (const candidate of candidates.map(normalize).filter(Boolean)) {
    if (typeof actualPlaceholders?.get === 'function') {
      const evidence = actualPlaceholders.get(candidate);
      if (evidence) return evidence;
    }
    if (typeof actualPlaceholders?.has === 'function' && actualPlaceholders.has(candidate)) {
      return { rawPattern: `{{${candidate}}}`, context: '', textBefore: '', textAfter: '' };
    }
  }
  return null;
}

export function dispositionForField({ field, slot, binding, actualDocxHasSemanticToken = false }) {
  const blockers = [];
  const fixes = [];
  const notes = [];

  const fieldPath = normalize(field?.path);
  const label = normalize(field?.label);
  const source = normalize(field?.source);
  const slotId = normalize(slot?.slotId);
  const bindingFrom = normalize(binding?.from);
  const bindingSlotId = normalize(binding?.slotId);

  if (!fieldPath) blockers.push('missing field path');
  if (isGenericPath(fieldPath)) blockers.push('generic path');
  if (slotId && isGenericPath(slotId)) blockers.push('generic docx slot');
  if (bindingFrom && isGenericPath(bindingFrom)) blockers.push('generic binding source');
  if (bindingSlotId && isGenericPath(bindingSlotId)) blockers.push('generic binding slot');
  if (!slot) blockers.push('missing matching docxSlot');
  if (!binding) blockers.push('missing renderBinding');
  if (binding && binding.from && binding.from !== fieldPath) fixes.push('path');
  if (slot && binding && slot.slotId !== binding.slotId) fixes.push('path');
  if (slot && !rawPatternMatchesSlot(slot, actualDocxHasSemanticToken)) {
    blockers.push('rawPattern does not match semantic slotId');
  }
  if (isGenericLabel(label)) fixes.push('label');
  const sourceProblem = sourceIssue(fieldPath, source);
  if (sourceProblem) fixes.push('source');
  const uiProblem = uiIssue(field ?? {});
  if (uiProblem) fixes.push('uiComponent');
  const proposedUiComponent =
    uiProblem === 'long narrative path uses text input'
      ? 'textarea'
      : field.uiComponent ?? 'text';

  if (sourceProblem) notes.push(sourceProblem);
  if (uiProblem) notes.push(uiProblem);
  if (slot?.context) notes.push('docx context present');
  if (actualDocxHasSemanticToken) notes.push('actual DOCX token present');
  if (field?.reviewEvidence) notes.push('field reviewEvidence present');

  const uniqueFixes = [...new Set(fixes)];
  const uniqueBlockers = [...new Set(blockers)];
  const confidence =
    uniqueBlockers.length > 0 ? 'LOW' : uniqueFixes.length > 0 ? 'MEDIUM' : 'HIGH';

  let disposition = 'APPROVE_AS_IS';
  if (uniqueBlockers.length > 0) disposition = 'NEEDS_HUMAN_REVIEW';
  else if (uniqueFixes.includes('label')) disposition = 'FIX_LABEL';
  else if (uniqueFixes.includes('path')) disposition = 'FIX_PATH';
  else if (uniqueFixes.includes('source')) disposition = 'FIX_SOURCE';
  else if (uniqueFixes.includes('required')) disposition = 'FIX_REQUIRED';
  else if (uniqueFixes.includes('uiComponent')) disposition = 'FIX_UI_COMPONENT';

  const proposedLabel = isGenericLabel(label) ? sentenceFromPath(fieldPath) : field.label;
  return {
    disposition,
    confidence,
    proposedSemanticPath: fieldPath,
    proposedLabel,
    proposedSource: ALLOWED_SOURCES.has(source) ? field.source : 'manual',
    proposedRequired: field.required === true,
    proposedUiComponent,
    notes: [...uniqueBlockers, ...uniqueFixes.map((fix) => `fix ${fix}`), ...notes].join('; '),
  };
}

function buildRow(root, contractPath, contract, field, actualPlaceholders) {
  const binding = findBinding(contract, field.path);
  const slot = findSlot(contract, field.path, binding);
  const actualDocxEvidence = findActualDocxEvidence(
    actualPlaceholders,
    field.path,
    binding?.slotId,
    slot?.slotId,
  );
  const actualDocxHasSemanticToken = actualDocxEvidence !== null;
  const disposition = dispositionForField({
    field,
    slot,
    binding,
    actualDocxHasSemanticToken,
  });
  const templateCode = contract.templateCode ?? contract.template_code ?? '';

  return {
    templateCode,
    lockedContractPath: toRepoPath(root, contractPath),
    fieldPath: field.path ?? '',
    fieldLabel: field.label ?? '',
    fieldSource: field.source ?? '',
    fieldRequired: field.required === true,
    fieldUiComponent: field.uiComponent ?? '',
    fieldReviewRequired: field.reviewRequired === true,
    docxSlotSlotId: slot?.slotId ?? '',
    docxSlotContext: slot?.context ?? '',
    docxSlotEvidenceRawPattern: slot?.evidence?.rawPattern ?? '',
    docxSlotEvidenceTextBefore: slot?.evidence?.textBefore ?? '',
    docxSlotEvidenceTextAfter: slot?.evidence?.textAfter ?? '',
    actualDocxHasSemanticToken,
    actualDocxContext: actualDocxEvidence?.context ?? '',
    actualDocxEvidenceRawPattern: actualDocxEvidence?.rawPattern ?? '',
    actualDocxEvidenceTextBefore: actualDocxEvidence?.textBefore ?? '',
    actualDocxEvidenceTextAfter: actualDocxEvidence?.textAfter ?? '',
    actualDocxEvidenceFileName: actualDocxEvidence?.fileName ?? '',
    reviewEvidence: field.reviewEvidence ?? null,
    proposedSemanticPath: disposition.proposedSemanticPath,
    proposedLabel: disposition.proposedLabel ?? '',
    proposedSource: disposition.proposedSource,
    proposedRequired: disposition.proposedRequired,
    proposedUiComponent: disposition.proposedUiComponent,
    confidence: disposition.confidence,
    disposition: disposition.disposition,
    notes: disposition.notes,
    binding: binding
      ? {
          slotId: binding.slotId ?? '',
          from: binding.from ?? '',
          transform: binding.transform ?? '',
          reviewRequired: binding.reviewRequired === true,
        }
      : null,
    docxSlot: slot ?? null,
    field: {
      path: field.path ?? '',
      label: field.label ?? '',
      source: field.source ?? '',
      required: field.required === true,
      uiComponent: field.uiComponent ?? '',
      reviewRequired: field.reviewRequired === true,
    },
    proposed: {
      semanticPath: disposition.proposedSemanticPath,
      label: disposition.proposedLabel ?? '',
      source: disposition.proposedSource,
      required: disposition.proposedRequired,
      uiComponent: disposition.proposedUiComponent,
    },
  };
}

function needsReviewRow(contract, field) {
  if (field?.reviewRequired === true) return true;
  const binding = findBinding(contract, field.path);
  const slot = findSlot(contract, field.path, binding);
  return slot?.reviewRequired === true || binding?.reviewRequired === true;
}

async function loadActualDocxPlaceholders(root, templateCode) {
  const docxPath = join(
    root,
    'storage',
    'templates',
    'normalized-docx',
    templateCode,
    `${templateCode}_normalized.docx`,
  );
  try {
    const zip = new PizZip(await readFile(docxPath));
    const placeholders = new Map();
    for (const fileName of Object.keys(zip.files)) {
      if (!/^word\/.*\.xml$/u.test(fileName)) continue;
      const xml = zip.file(fileName)?.asText();
      if (!xml) continue;
      const plainText = cleanXmlText(xml);
      for (const match of xml.matchAll(/\{\{\s*([^}]+?)\s*\}\}/gu)) {
        const placeholder = match[1].trim();
        if (!placeholders.has(placeholder)) {
          placeholders.set(placeholder, actualDocxEvidenceForMatch(fileName, plainText, match));
        }
      }
    }
    return placeholders;
  } catch {
    return new Map();
  }
}

export async function buildLegalSemanticFieldReview(root = process.cwd(), options = {}) {
  const resolvedRoot = resolve(root);
  const lockedDir = resolve(resolvedRoot, options.lockedDir ?? LOCKED_DIR);
  const requestedCodes = new Set(asArray(options.templateCodes).map(String));
  const files = (await readdir(lockedDir))
    .filter((file) => file.endsWith('.contract.locked.json'))
    .sort();

  const contracts = [];
  const rows = [];

  for (const file of files) {
    const contractPath = join(lockedDir, file);
    const contract = JSON.parse(await readFile(contractPath, 'utf8'));
    const templateCode = contract.templateCode ?? file.replace(/__.*/, '');
    if (requestedCodes.size > 0 && !requestedCodes.has(templateCode)) continue;
    contract.templateCode = templateCode;
    contracts.push({ contract, contractPath });
    const actualPlaceholders = await loadActualDocxPlaceholders(resolvedRoot, templateCode);

    for (const field of asArray(contract.canonicalFields)) {
      if (!needsReviewRow(contract, field)) continue;
      rows.push(buildRow(resolvedRoot, contractPath, contract, field, actualPlaceholders));
    }
  }

  const formsNeedingReview = new Set(rows.map((row) => row.templateCode));
  const totalCanonicalFields = contracts.reduce(
    (total, item) => total + asArray(item.contract.canonicalFields).length,
    0,
  );
  const byForm = rows
    .reduce((acc, row) => {
      const current = acc.get(row.templateCode) ?? {
        templateCode: row.templateCode,
        reviewRequiredFields: 0,
        dispositions: {},
      };
      current.reviewRequiredFields += 1;
      current.dispositions[row.disposition] = (current.dispositions[row.disposition] ?? 0) + 1;
      acc.set(row.templateCode, current);
      return acc;
    }, new Map());

  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generatedBy: 'scripts/audit/build-legal-semantic-field-review-213.mjs',
    scope: {
      lockedDir: toRepoPath(resolvedRoot, lockedDir),
      templateCodes: requestedCodes.size > 0 ? [...requestedCodes].sort() : 'ALL',
    },
    summary: {
      totalLockedForms: contracts.length,
      totalCanonicalFields,
      reviewRequiredFields: rows.length,
      formsNeedingReview: formsNeedingReview.size,
      byDisposition: countBy(rows, (row) => row.disposition),
      byConfidence: countBy(rows, (row) => row.confidence),
    },
    forms: [...byForm.values()].sort(
      (left, right) =>
        right.reviewRequiredFields - left.reviewRequiredFields ||
        left.templateCode.localeCompare(right.templateCode),
    ),
    rows,
  };
}

export function csvEscape(value) {
  const text =
    typeof value === 'string'
      ? value
      : value == null
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvValue(row, header) {
  switch (header) {
    case 'field.path':
      return row.fieldPath;
    case 'field.label':
      return row.fieldLabel;
    case 'field.source':
      return row.fieldSource;
    case 'field.required':
      return row.fieldRequired;
    case 'field.uiComponent':
      return row.fieldUiComponent;
    case 'field.reviewRequired':
      return row.fieldReviewRequired;
    case 'matching docxSlot.slotId':
      return row.docxSlotSlotId;
    case 'docxSlot.context':
      return row.docxSlotContext;
    case 'docxSlot.evidence.rawPattern':
      return row.docxSlotEvidenceRawPattern;
    case 'docxSlot.evidence.textBefore':
      return row.docxSlotEvidenceTextBefore;
    case 'docxSlot.evidence.textAfter':
      return row.docxSlotEvidenceTextAfter;
    case 'actualDocx.context':
      return row.actualDocxContext;
    case 'actualDocx.evidence.rawPattern':
      return row.actualDocxEvidenceRawPattern;
    case 'actualDocx.evidence.textBefore':
      return row.actualDocxEvidenceTextBefore;
    case 'actualDocx.evidence.textAfter':
      return row.actualDocxEvidenceTextAfter;
    case 'actualDocx.evidence.fileName':
      return row.actualDocxEvidenceFileName;
    default:
      return row[header];
  }
}

function buildCsv(review) {
  const headers = [
    'templateCode',
    'lockedContractPath',
    'field.path',
    'field.label',
    'field.source',
    'field.required',
    'field.uiComponent',
    'field.reviewRequired',
    'matching docxSlot.slotId',
    'docxSlot.context',
    'docxSlot.evidence.rawPattern',
    'docxSlot.evidence.textBefore',
    'docxSlot.evidence.textAfter',
    'actualDocxHasSemanticToken',
    'actualDocx.context',
    'actualDocx.evidence.rawPattern',
    'actualDocx.evidence.textBefore',
    'actualDocx.evidence.textAfter',
    'actualDocx.evidence.fileName',
    'reviewEvidence',
    'proposedSemanticPath',
    'proposedLabel',
    'proposedSource',
    'proposedRequired',
    'proposedUiComponent',
    'confidence',
    'disposition',
    'notes',
  ];
  return [
    headers.join(','),
    ...review.rows.map((row) => headers.map((header) => csvEscape(csvValue(row, header))).join(',')),
    '',
  ].join('\n');
}

function mdTable(rows) {
  return rows
    .map((row) => `| ${row.map((cell) => asText(cell).replaceAll('|', '\\|')).join(' |')} |`)
    .join('\n');
}

function buildMarkdown(review) {
  const summaryRows = [
    ['Metric', 'Value'],
    ['Total locked forms', review.summary.totalLockedForms],
    ['Total canonical fields', review.summary.totalCanonicalFields],
    ['Fields reviewRequired', review.summary.reviewRequiredFields],
    ['Forms needing review', review.summary.formsNeedingReview],
    ['Dispositions', JSON.stringify(review.summary.byDisposition)],
    ['Confidence', JSON.stringify(review.summary.byConfidence)],
  ];
  const formRows = [
    ['BM', 'Review fields', 'Dispositions'],
    ...review.forms.map((form) => [
      form.templateCode,
      form.reviewRequiredFields,
      JSON.stringify(form.dispositions),
    ]),
  ];
  const fieldRows = [
    [
      'BM',
      'Field path',
      'Label',
      'Source',
      'Slot',
      'Actual DOCX context',
      'Confidence',
      'Disposition',
      'Notes',
    ],
    ...review.rows.map((row) => [
      row.templateCode,
      row.fieldPath,
      row.fieldLabel,
      row.fieldSource,
      row.docxSlotSlotId || '-',
      row.actualDocxContext || '-',
      row.confidence,
      row.disposition,
      row.notes || '-',
    ]),
  ];

  return [
    '# Legal Semantic Field Review 213',
    '',
    `Generated: ${review.generatedAt}`,
    '',
    '## Summary',
    '',
    mdTable(summaryRows),
    '',
    '## Forms Needing Review',
    '',
    mdTable(formRows),
    '',
    '## Per Field Review Rows',
    '',
    mdTable(fieldRows),
    '',
  ].join('\n');
}

export async function writeLegalSemanticFieldReview(root, review, options = {}) {
  const resolvedRoot = resolve(root);
  const outDir = resolve(resolvedRoot, options.outDir ?? REVIEW_OUT_DIR);
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, 'latest.json');
  const mdPath = join(outDir, 'latest.md');
  const csvPath = join(outDir, 'per-field.csv');

  await writeFile(jsonPath, `${JSON.stringify(review, null, 2)}\n`);
  await writeFile(mdPath, buildMarkdown(review));
  await writeFile(csvPath, buildCsv(review));

  return { jsonPath, mdPath, csvPath };
}

function parseArgs(argv) {
  const options = { root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') options.root = argv[++index];
    else if (arg === '--out-dir') options.outDir = argv[++index];
    else if (arg === '--codes') {
      options.templateCodes = argv[++index]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const review = await buildLegalSemanticFieldReview(options.root, options);
  const paths = await writeLegalSemanticFieldReview(options.root, review, options);
  console.log(
    `LEGAL_SEMANTIC_FIELD_REVIEW_213 fields=${review.summary.reviewRequiredFields} forms=${review.summary.formsNeedingReview}`,
  );
  console.log(`JSON: ${paths.jsonPath}`);
  console.log(`MD: ${paths.mdPath}`);
  console.log(`CSV: ${paths.csvPath}`);
}

const isCli = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
