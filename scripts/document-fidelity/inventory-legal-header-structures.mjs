// ?3 - Read-only 213-template structural inventory.
//
// Walks every storage/templates/normalized-docx/BM-XXX/BM-XXX_normalized.docx,
// runs the token-scoped classifier against word/document.xml, and emits a
// JSON + Markdown inventory.
//
// To avoid embedding Vietnamese diacritics in source code, the form-number
// token is constructed at runtime via String.fromCharCode so source code
// stays pure ASCII.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readDocxParts } from './lib/docx-zip.mjs';
import { classifyStructuralFamily } from './lib/ooxml-token-scope.mjs';

const PROJECT_ROOT = process.env.QLLAW_ROOT ?? 'D:/Study/Project/QLLaw-main';
const NORMALIZED_ROOT = join(PROJECT_ROOT, 'storage/templates/normalized-docx');

// Vietnamese form-number prefix: "M?u s? " (precomposed/NFC code points).
const FORM_NUMBER_PREFIX = 'M' + String.fromCharCode(0x1EAB) + 'u s' + String.fromCharCode(0x1ED1) + ' ';
const ISSUANCE_PREFIX_BANHANH_THEO = 'Ban h' + String.fromCharCode(0xE0) + 'nh theo';
const ISSUANCE_PREFIX_BANHANH_KEM = 'Ban h' + String.fromCharCode(0xE0) + 'nh k' + String.fromCharCode(0xE8) + 'm theo';

function tokenFor(code) {
  const num = code.replace(/^BM-/, '');
  if (code === 'BM-001') return FORM_NUMBER_PREFIX + '01/HS';
  return FORM_NUMBER_PREFIX + num;
}

function issuanceTokenFor(code) {
  if (code === 'BM-001') return ISSUANCE_PREFIX_BANHANH_THEO;
  return ISSUANCE_PREFIX_BANHANH_KEM;
}

function tokensFor(code) {
  return {
    modelNumberToken: tokenFor(code),
    issuanceNoteToken: issuanceTokenFor(code),
  };
}

function inventoryForm(formCode, docxPath) {
  const buf = readFileSync(docxPath);
  const { parts } = readDocxParts(buf);
  const textParts = parts.filter((p) => /^word\/(document|header\d*|footer\d*)\.xml$/u.test(p.name));
  const tokens = tokensFor(formCode);
  const documentPart = textParts.find((p) => p.name === 'word/document.xml');
  const documentXml = documentPart?.xml ?? '';

  const plain = textParts.map((p) => (p.xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).join(' ')).join('\n');

  // Token-presence heuristics: try the exact token first; if that fails but
  // the form-number prefix "M?u s" (with diacritics) is present, fall back to
  // the structural family classifier using the prefix so the family is still
  // classified. Some forms (e.g. BM-213) split the model-number across
  // multiple <w:t> nodes.
  const exactTokenPresent = plain.includes(tokens.modelNumberToken);
  const prefixPresent = plain.includes(FORM_NUMBER_PREFIX);
  const effectiveToken = exactTokenPresent ? tokens.modelNumberToken : (prefixPresent ? FORM_NUMBER_PREFIX : null);

  let classification = null;
  if (effectiveToken) {
    classification = classifyStructuralFamily(documentXml, {
      modelNumberToken: effectiveToken,
      issuanceNoteToken: tokens.issuanceNoteToken,
    });
  }

  const modelNumberPresent = exactTokenPresent;
  const modelNumberPrefixPresent = prefixPresent;
  const issuanceNotePresent = plain.includes(tokens.issuanceNoteToken);

  let tokenBearingPart = null;
  for (const p of textParts) {
    if (p.xml.includes(tokens.modelNumberToken) || (prefixPresent && p.xml.includes(FORM_NUMBER_PREFIX))) {
      tokenBearingPart = p.name;
      break;
    }
  }

  return {
    formCode,
    sourcePath: docxPath.replace(/\\/g, '/'),
    textPartsFound: textParts.map((p) => p.name),
    modelNumberToken: tokens.modelNumberToken,
    issuanceNoteToken: tokens.issuanceNoteToken,
    modelNumberPresent,
    modelNumberPrefixPresent,
    effectiveToken,
    issuanceNotePresent,
    tokenBearingPart,
    family: classification?.family ?? 'NO_MODEL_NUMBER',
    anyFloating: classification?.modelNumberLocation?.anyFloating ?? null,
    classification,
  };
}

export function inventoryAll({ root = NORMALIZED_ROOT } = {}) {
  if (!existsSync(root)) {
    throw new Error('Normalized DOCX root does not exist: ' + root);
  }
  const entries = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^BM-\d{3}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  const records = [];
  const missing = [];
  for (const code of entries) {
    const docxPath = join(root, code, code + '_normalized.docx');
    if (!existsSync(docxPath)) {
      missing.push({ formCode: code, reason: 'no normalized DOCX at expected path', path: docxPath });
      continue;
    }
    records.push(inventoryForm(code, docxPath));
  }
  return { records, missing, totalForms: entries.length };
}

function emitJson(outPath, data) {
  mkdirSync(join(outPath, '..'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
}

function emitMarkdown(outPath, data) {
  const lines = [];
  lines.push('# QLLAW 213-form Legal-Header Structural Inventory');
  lines.push('');
  lines.push('Generated: ' + new Date().toISOString());
  lines.push('');
  lines.push('Total forms scanned: ' + data.totalForms);
  lines.push('Records: ' + data.records.length);
  lines.push('Missing: ' + data.missing.length);
  lines.push('');
  const familyCounts = {};
  for (const r of data.records) {
    familyCounts[r.family] = (familyCounts[r.family] ?? 0) + 1;
  }
  lines.push('## Family counts');
  lines.push('');
  for (const [family, count] of Object.entries(familyCounts).sort()) {
    lines.push('- `' + family + '`: ' + count);
  }
  lines.push('');
  const cohort = data.records.filter((r) =>
    ['BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168', 'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213'].includes(r.formCode),
  );
  lines.push('## Runtime-ready 11 cohort');
  lines.push('');
  lines.push('| Form | Model-number token | Token present? | Token part | Family | anyFloating? |');
  lines.push('|------|---------------------|----------------|------------|--------|--------------|');
  for (const r of cohort) {
    const anyFloat = r.anyFloating === null ? 'n/a' : (r.anyFloating ? 'YES' : 'NO');
    lines.push('| ' + r.formCode + ' | `' + (r.modelNumberToken ?? '') + '` | ' + (r.modelNumberPresent ? 'YES' : 'NO') + ' | ' + (r.tokenBearingPart ?? '(none)') + ' | ' + r.family + ' | ' + anyFloat + ' |');
  }
  lines.push('');
  if (data.missing.length) {
    lines.push('## Missing / skipped');
    lines.push('');
    for (const m of data.missing) {
      lines.push('- `' + m.formCode + '`: ' + m.reason + ' (' + m.path + ')');
    }
    lines.push('');
  }
  lines.push('## All forms');
  lines.push('');
  lines.push('| Form | Family | Model-number | Issuance note |');
  lines.push('|------|--------|---------------|----------------|');
  for (const r of data.records) {
    lines.push('| ' + r.formCode + ' | ' + r.family + ' | ' + (r.modelNumberPresent ? 'YES' : '-') + ' | ' + (r.issuanceNotePresent ? 'YES' : '-') + ' |');
  }
  mkdirSync(join(outPath, '..'), { recursive: true });
  writeFileSync(outPath, lines.join('\n'), 'utf8');
}

export function runCli({ outJson, outMd } = {}) {
  const data = inventoryAll();
  if (outJson) emitJson(outJson, data);
  if (outMd) emitMarkdown(outMd, data);
  process.stdout.write('inventoried ' + data.records.length + '/' + data.totalForms + ' forms; missing=' + data.missing.length + '\n');
  return data;
}

if (process.argv[1]?.endsWith('inventory-legal-header-structures.mjs')) {
  const outJson = process.argv.find((a) => a.startsWith('--out-json='))?.slice('--out-json='.length);
  const outMd = process.argv.find((a) => a.startsWith('--out-md='))?.slice('--out-md='.length);
  runCli({ outJson, outMd });
}
