#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const workspaceRequire = createRequire(join(process.cwd(), 'apps', 'api', 'package.json'));
const PizZip = workspaceRequire('pizzip');
const Docxtemplater = workspaceRequire('docxtemplater');

const TASK = 'FORM_RENDER_FIDELITY_GATE';

function parseArgs(argv) {
  let root = process.cwd();
  let templateCode = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--template-code') {
      templateCode = argv[index + 1];
      index += 1;
      continue;
    }
  }

  if (!templateCode) throw new Error('Pass --template-code <BM-XXX>');
  return { root: resolve(root), templateCode };
}

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

function normalizedDocxPath(root, templateCode) {
  return join(
    root,
    'storage',
    'templates',
    'normalized-docx',
    templateCode,
    `${templateCode}_normalized.docx`,
  );
}

function lockedContractsDir(root) {
  return join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
}

function findLockedContractFile(root, templateCode) {
  const dir = lockedContractsDir(root);
  const matches = readdirSync(dir)
    .filter(
      (file) =>
        file.startsWith(`${templateCode}__`) &&
        file.endsWith('.contract.locked.json'),
    )
    .sort();
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${templateCode} locked contract, found ${matches.length}`,
    );
  }
  return join(dir, matches[0]);
}

function reportDir(root, templateCode) {
  return join(root, 'docs', 'audit', 'per-form-render-accurate', templateCode);
}

function decodeXmlText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xD;/g, '');
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function splitStaticAnchorFragments(value) {
  return String(value ?? '')
    .split(/\{\{[^}]+\}\}/g)
    .map((fragment) => normalizeText(fragment))
    .filter(Boolean);
}

function extractTextPartsFromZip(zip) {
  const parts = [];
  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith('word/') || !name.endsWith('.xml')) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;
    for (const match of content.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)) {
      const text = decodeXmlText(match[1]).replace(/<[^>]*>/g, '');
      if (text.trim()) parts.push({ partName: name, text: text.trim() });
    }
  }
  return parts;
}

function fullText(parts) {
  return normalizeText(parts.map((part) => part.text).join(' '));
}

function extractPlaceholdersFromZip(zip) {
  const items = [];
  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith('word/') || !name.endsWith('.xml')) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;
    for (const match of content.matchAll(/\{\{([^}]+)\}\}/g)) {
      items.push({ placeholder: match[1].trim(), partName: name });
    }
  }
  const counts = {};
  for (const item of items) {
    counts[item.placeholder] = (counts[item.placeholder] ?? 0) + 1;
  }
  return {
    items,
    unique: Object.keys(counts).sort(),
    counts,
  };
}

function extractStructure(zip) {
  const documentXml = zip.file('word/document.xml')?.asText() ?? '';
  const names = Object.keys(zip.files);
  return {
    paragraphCount: (documentXml.match(/<w:p\b[^>]*>/gu) ?? []).length,
    tableCount: (documentXml.match(/<w:tbl\b[^>]*>/gu) ?? []).length,
    rowCount: (documentXml.match(/<w:tr\b[^>]*>/gu) ?? []).length,
    cellCount: (documentXml.match(/<w:tc\b[^>]*>/gu) ?? []).length,
    headerCount: names.filter((name) => /^word\/header\d+\.xml$/u.test(name)).length,
    footerCount: names.filter((name) => /^word\/footer\d+\.xml$/u.test(name)).length,
  };
}

function extractStaticAnchors(parts) {
  const anchors = [];
  const seen = new Set();
  for (const part of parts) {
    const withoutPlaceholders = normalizeText(part.text.replace(/\{\{[^}]+\}\}/g, ' '));
    if (withoutPlaceholders.length < 8) continue;
    if (!/[A-Za-z0-9À-ỹ]/u.test(withoutPlaceholders)) continue;
    if (seen.has(withoutPlaceholders)) continue;
    seen.add(withoutPlaceholders);
    anchors.push({
      partName: part.partName,
      text: withoutPlaceholders,
      fragments: splitStaticAnchorFragments(part.text),
    });
  }
  return anchors.slice(0, 200);
}

function hasStaticAnchor(renderedText, anchor) {
  if (renderedText.includes(anchor.text)) return true;

  const fragments = Array.isArray(anchor.fragments)
    ? anchor.fragments.map((fragment) => normalizeText(fragment)).filter(Boolean)
    : [];
  if (fragments.length < 2) return false;

  let searchFrom = 0;
  for (const fragment of fragments) {
    const nextIndex = renderedText.indexOf(fragment, searchFrom);
    if (nextIndex === -1) return false;
    searchFrom = nextIndex + fragment.length;
  }
  return true;
}

function findUnreplaced(parts) {
  const issues = [];
  for (const part of parts) {
    if (!part.text.includes('{{') && !part.text.includes('}}')) continue;
    issues.push({
      partName: part.partName,
      preview: part.text.slice(0, 160),
    });
  }
  return issues;
}

function findUndefinedNullLiterals(parts) {
  const issues = [];
  for (const part of parts) {
    if (!/\b(?:undefined|null)\b/i.test(part.text)) continue;
    issues.push({
      partName: part.partName,
      preview: part.text.slice(0, 160),
    });
  }
  return issues;
}

function markerForPath(path) {
  return `__${path.replace(/\W+/g, '_').toUpperCase()}__`;
}

function setDeep(target, path, value) {
  const segments = String(path).split('.').filter(Boolean);
  if (segments.length === 0) return;
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    if (!cursor[segment] || typeof cursor[segment] !== 'object') {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = value;
}

function buildRenderPayload(contract) {
  const payload = {};
  for (const binding of contract.renderBindings ?? []) {
    if (!binding?.slotId || !binding?.from) continue;
    const value = markerForPath(binding.from);
    payload[binding.slotId] = value;
    setDeep(payload, binding.slotId, value);
  }
  return payload;
}

function renderDocx(buffer, payload) {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(payload);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function buildBindingFidelity(contract, sourcePlaceholders) {
  const slotIds = new Set((contract.docxSlots ?? []).map((slot) => slot.slotId).filter(Boolean));
  const bindingSlotIds = new Set(
    (contract.renderBindings ?? []).map((binding) => binding.slotId).filter(Boolean),
  );
  const fieldPaths = new Set(
    (contract.canonicalFields ?? []).map((field) => field.path).filter(Boolean),
  );
  const templatePlaceholdersWithoutSlots = sourcePlaceholders.unique.filter(
    (placeholder) => !slotIds.has(placeholder),
  );
  const templatePlaceholdersWithoutBindings = sourcePlaceholders.unique.filter(
    (placeholder) => !bindingSlotIds.has(placeholder),
  );
  const bindingsWithoutCanonicalFields = (contract.renderBindings ?? [])
    .filter((binding) => binding?.from && !fieldPaths.has(binding.from))
    .map((binding) => ({ slotId: binding.slotId, from: binding.from }));
  const status =
    templatePlaceholdersWithoutSlots.length === 0 &&
    templatePlaceholdersWithoutBindings.length === 0 &&
    bindingsWithoutCanonicalFields.length === 0
      ? 'PASS'
      : 'FAIL';
  return {
    status,
    templatePlaceholdersWithoutSlots,
    templatePlaceholdersWithoutBindings,
    bindingsWithoutCanonicalFields,
  };
}

function compareStructure(source, rendered) {
  const deltas = {};
  for (const key of Object.keys(source)) {
    deltas[key] = rendered[key] - source[key];
  }
  const status = Object.values(deltas).every((delta) => delta === 0) ? 'PASS' : 'FAIL';
  return { status, source, rendered, deltas };
}

function decideStatus(sections) {
  return Object.values(sections).every((section) => section.status === 'PASS')
    ? 'PASS'
    : 'FAIL';
}

function nextActionFor(report) {
  if (report.bindingFidelity.status !== 'PASS') {
    return 'Repair template placeholders without bindings before claiming render fidelity.';
  }
  if (report.render.status !== 'PASS') {
    return 'Fix DOCX render errors before comparing fidelity.';
  }
  if (report.textFidelity.status !== 'PASS') {
    return 'Repair unreplaced placeholders or missing static anchors.';
  }
  if (report.literalFidelity.status !== 'PASS') {
    return 'Remove undefined/null literal leakage from render payload.';
  }
  if (report.structureFidelity.status !== 'PASS') {
    return 'Investigate OOXML structure drift between normalized and rendered DOCX.';
  }
  return 'Render fidelity clean; proceed to board refresh and next remediation gate.';
}

function buildMarkdown(report) {
  const lines = [
    `# ${report.templateCode} Render Fidelity Gate`,
    '',
    `Generated: ${report.generatedAt}`,
    `Status: **${report.status}**`,
    '',
    '| Gate | Status |',
    '|---|---|',
    `| Binding fidelity | ${report.bindingFidelity.status} |`,
    `| Render | ${report.render.status} |`,
    `| Text fidelity | ${report.textFidelity.status} |`,
    `| Literal fidelity | ${report.literalFidelity.status} |`,
    `| Structure fidelity | ${report.structureFidelity.status} |`,
    `| Package integrity | ${report.packageIntegrity.status} |`,
    '',
    '## Binding Findings',
    '',
    `Template placeholders without slots: ${report.bindingFidelity.templatePlaceholdersWithoutSlots.join(', ') || 'none'}`,
    `Template placeholders without bindings: ${report.bindingFidelity.templatePlaceholdersWithoutBindings.join(', ') || 'none'}`,
    '',
    '## Text Findings',
    '',
    `Unreplaced placeholders: ${report.textFidelity.unreplacedPlaceholders}`,
    `Missing static anchors: ${report.textFidelity.missingStaticAnchors}`,
    `Undefined/null literals: ${report.literalFidelity.undefinedOrNullLiterals}`,
    '',
    '## Structure',
    '',
    '| Metric | Source | Rendered | Delta |',
    '|---|---:|---:|---:|',
  ];
  for (const key of Object.keys(report.structureFidelity.source)) {
    lines.push(
      `| ${key} | ${report.structureFidelity.source[key]} | ${report.structureFidelity.rendered[key]} | ${report.structureFidelity.deltas[key]} |`,
    );
  }
  lines.push('', `Next action: ${report.nextAction}`, '');
  return lines.join('\n');
}

function run({ root, templateCode }) {
  const docxPath = normalizedDocxPath(root, templateCode);
  const contractPath = findLockedContractFile(root, templateCode);
  if (!existsSync(docxPath)) throw new Error(`Missing normalized DOCX: ${docxPath}`);
  const contract = readJson(contractPath);
  const sourceBuffer = readFileSync(docxPath);
  const sourceZip = new PizZip(sourceBuffer);
  const sourceTextParts = extractTextPartsFromZip(sourceZip);
  const sourceText = fullText(sourceTextParts);
  const sourcePlaceholders = extractPlaceholdersFromZip(sourceZip);
  const staticAnchors = extractStaticAnchors(sourceTextParts);
  const bindingFidelity = buildBindingFidelity(contract, sourcePlaceholders);
  const packageIntegrity = {
    status:
      sourceZip.file('[Content_Types].xml') && sourceZip.file('word/document.xml')
        ? 'PASS'
        : 'FAIL',
    hasContentTypes: Boolean(sourceZip.file('[Content_Types].xml')),
    hasDocumentXml: Boolean(sourceZip.file('word/document.xml')),
  };

  let renderedBuffer = null;
  let renderError = null;
  try {
    renderedBuffer = renderDocx(sourceBuffer, buildRenderPayload(contract));
  } catch (error) {
    renderError = error.message;
  }

  let renderedZip = null;
  let renderedTextParts = [];
  let renderedText = '';
  let renderedStructure = {
    paragraphCount: 0,
    tableCount: 0,
    rowCount: 0,
    cellCount: 0,
    headerCount: 0,
    footerCount: 0,
  };
  if (renderedBuffer) {
    renderedZip = new PizZip(renderedBuffer);
    renderedTextParts = extractTextPartsFromZip(renderedZip);
    renderedText = fullText(renderedTextParts);
    renderedStructure = extractStructure(renderedZip);
  }

  const unreplaced = findUnreplaced(renderedTextParts);
  const missingAnchors = staticAnchors.filter(
    (anchor) => !hasStaticAnchor(renderedText, anchor),
  );
  const literalIssues = findUndefinedNullLiterals(renderedTextParts);
  const textFidelity = {
    status: unreplaced.length === 0 && missingAnchors.length === 0 ? 'PASS' : 'FAIL',
    sourceTextLength: sourceText.length,
    renderedTextLength: renderedText.length,
    textLengthRatio:
      sourceText.length > 0 ? Number((renderedText.length / sourceText.length).toFixed(4)) : null,
    unreplacedPlaceholders: unreplaced.length,
    unreplaced,
    staticAnchorCount: staticAnchors.length,
    missingStaticAnchors: missingAnchors.length,
    missingAnchors: missingAnchors.slice(0, 25),
  };
  const literalFidelity = {
    status: literalIssues.length === 0 ? 'PASS' : 'FAIL',
    undefinedOrNullLiterals: literalIssues.length,
    issues: literalIssues,
  };
  const render = {
    status: renderError ? 'FAIL' : 'PASS',
    error: renderError,
  };
  const structureFidelity = compareStructure(
    extractStructure(sourceZip),
    renderedStructure,
  );

  const generatedAt = new Date().toISOString();
  const partial = {
    schemaVersion: 1,
    task: TASK,
    generatedAt,
    templateCode,
    sourceId: contract.sourceId ?? null,
    paths: {
      normalizedDocx: docxPath,
      lockedContract: contractPath,
      reportJson: join(reportDir(root, templateCode), 'render-diff.latest.json'),
      reportMarkdown: join(reportDir(root, templateCode), 'render-diff.latest.md'),
    },
    sourcePlaceholders,
    bindingFidelity,
    render,
    textFidelity,
    literalFidelity,
    structureFidelity,
    packageIntegrity,
  };
  const status = decideStatus({
    bindingFidelity,
    render,
    textFidelity,
    literalFidelity,
    structureFidelity,
    packageIntegrity,
  });
  const report = {
    ...partial,
    status,
    clean: status === 'PASS',
    nextAction: nextActionFor({ ...partial, status }),
  };

  writeJson(report.paths.reportJson, report);
  writeText(report.paths.reportMarkdown, buildMarkdown(report));
  return report;
}

try {
  const report = run(parseArgs(process.argv.slice(2)));
  console.log(`${TASK} ${report.templateCode} ${report.status}`);
  console.log(`Report: ${report.paths.reportJson}`);
  process.exit(report.status === 'PASS' ? 0 : 1);
} catch (error) {
  console.error(`${TASK} failed: ${error.message}`);
  process.exit(1);
}
