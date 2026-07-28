// ?2 formNumber vs documentNumber proof.
//
// For each runtime-ready BM-### form, read:
//   1. The normalized DOCX text layer (literal text from word/document.xml
//      + word/header*.xml + word/footer*.xml)
//   2. The locked contract's `docxSlots[]` (which {{...}} placeholders exist)
//   3. The compiled contract's `renderPlan.bindings[]` and `jsonSchema.required`
//
// Then classify each form:
//   - formNumberLocation: HEADER_TEXT_LITERAL | NONE
//   - documentNumberInputExposed: boolean
//   - documentNumberRenderSlot: BOUND | UNBOUND_INPUT | NONE
//   - invariantFormNumberNotBound: boolean
//   - classification: see below

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { readDocxParts } from './lib/docx-zip.mjs';

const PROJECT_ROOT = process.env.QLLAW_ROOT ?? 'D:/Study/Project/QLLaw-main';

export const RUNTIME_READY_FORMS = Object.freeze([
  'BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157',
  'BM-168', 'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213',
]);

const FORBIDDEN_BINDINGS = new Set([
  'formNumber', 'metadata.formNumber', 'document.formNumber', 'template.formNumber',
]);

function extractPlainText(xml) {
  return (xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [])
    .map((s) => s.replace(/<[^>]+>/g, ''))
    .join('');
}

function docxText(docxBuffer) {
  const { parts } = readDocxParts(docxBuffer);
  const interested = parts.filter((p) => /^word\/(document|header\d*|footer\d*)\.xml$/u.test(p.name));
  return interested.map((p) => extractPlainText(p.xml)).join('\n');
}

function findLockedContract(formCode) {
  const dir = join(PROJECT_ROOT, 'docs/audit/docx/contracts/locked');
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir);
  for (const f of entries) {
    if (f.startsWith(formCode + '__') && f.endsWith('.contract.locked.json')) {
      return JSON.parse(readFileSync(join(dir, f), 'utf8'));
    }
  }
  return null;
}

function findCompiledContract(formCode) {
  const p = join(PROJECT_ROOT, 'docs/audit/docx/compiled-v2', formCode + '.compiled.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function findNormalizedDocx(formCode) {
  const p = join(PROJECT_ROOT, 'storage/templates/normalized-docx', formCode, formCode + '_normalized.docx');
  return existsSync(p) ? p : null;
}

function docxTextFromPath(p) {
  return docxText(readFileSync(p));
}

// Match a Vietnamese form-number literal WITHOUT relying on Unicode literals
// in source code: detect the structural shape "M<non-letter>u s<non-letter> NNN".
const FORM_NUMBER_RE = /M[^a-zA-Z]u\s+s[^a-zA-Z]\s*\d+/u;

export function classifyFormFields(formCode) {
  const docxPath = findNormalizedDocx(formCode);
  const locked = findLockedContract(formCode);
  const compiled = findCompiledContract(formCode);

  let docxTextValue = '';
  if (docxPath) docxTextValue = docxTextFromPath(docxPath);

  const hasFormNumberLiteral = FORM_NUMBER_RE.test(docxTextValue);

  const slotIds = (locked?.docxSlots ?? []).map((s) => s.slotId);
  const boundFieldKeys = (compiled?.renderPlan?.bindings ?? []).map((b) => b?.source?.fieldKey).filter(Boolean);
  const jsonSchemaProps = Object.keys(compiled?.jsonSchema?.properties ?? {});
  const jsonSchemaRequired = compiled?.jsonSchema?.required ?? [];

  const documentNumberInputExposed =
    jsonSchemaProps.some((k) => /documentNumber|formNumber/i.test(k)) ||
    boundFieldKeys.some((k) => /documentNumber|formNumber/i.test(k));

  const slotHasDocumentNumber = slotIds.some((s) => /documentNumber|formNumber/i.test(s));
  const bindingHasDocumentNumber = (compiled?.renderPlan?.bindings ?? []).some((b) =>
    /documentNumber|formNumber/i.test(b?.target?.slotId ?? ''));
  const documentNumberRenderSlot = slotHasDocumentNumber || bindingHasDocumentNumber
    ? 'BOUND'
    : documentNumberInputExposed
    ? 'UNBOUND_INPUT'
    : 'NONE';

  const formNumberBound = boundFieldKeys.some((k) => FORBIDDEN_BINDINGS.has(k));
  const invariantFormNumberNotBound = !formNumberBound;

  let classification;
  if (!hasFormNumberLiteral && documentNumberRenderSlot === 'NONE') {
    classification = 'NO_FORM_NUMBER_NO_DOCUMENT_NUMBER';
  } else if (hasFormNumberLiteral && documentNumberRenderSlot === 'BOUND') {
    classification = 'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT_AND_DOCUMENT_NUMBER_BOUND';
  } else if (hasFormNumberLiteral && documentNumberRenderSlot === 'UNBOUND_INPUT') {
    classification = 'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT_AND_DOCUMENT_NUMBER_INPUT_NO_SLOT';
  } else if (hasFormNumberLiteral && documentNumberRenderSlot === 'NONE') {
    classification = 'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT';
  } else if (!hasFormNumberLiteral && documentNumberRenderSlot === 'UNBOUND_INPUT') {
    classification = 'DOCUMENT_NUMBER_INPUT_NO_SLOT';
  } else {
    classification = 'UNCLASSIFIED';
  }

  return {
    formCode,
    docxTextHasModelNumberLiteral: hasFormNumberLiteral,
    formNumberLocation: hasFormNumberLiteral ? 'HEADER_TEXT_LITERAL' : 'NONE',
    documentNumberInputExposed,
    documentNumberRenderSlot,
    invariantFormNumberNotBound,
    classification,
    lockedSlotCount: slotIds.length,
    boundFieldKeyCount: boundFieldKeys.length,
    requiredFieldCount: jsonSchemaRequired.length,
  };
}

export function classifyAllFormFields() {
  return RUNTIME_READY_FORMS.map((code) => classifyFormFields(code));
}

export function runCli({ outPath } = {}) {
  const records = classifyAllFormFields();
  if (outPath) {
    mkdirSync(join(outPath, '..'), { recursive: true });
    writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
  }
  const lines = [
    '| Form | formNumber (literal?) | documentNumber input? | render slot? | classification |',
    '|------|-----------------------|----------------------|--------------|----------------|',
  ];
  for (const r of records) {
    lines.push(
      '| ' + r.formCode + ' | ' + (r.docxTextHasModelNumberLiteral ? 'YES' : 'NO') +
      ' | ' + (r.documentNumberInputExposed ? 'YES' : 'NO') +
      ' | ' + r.documentNumberRenderSlot +
      ' | ' + r.classification + ' |',
    );
  }
  process.stdout.write(lines.join('\n') + '\n');
  return records;
}

if (process.argv[1]?.endsWith('classify-form-fields.mjs')) {
  const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length);
  runCli({ outPath: outArg });
}
