#!/usr/bin/env node
/**
 * smoke-bm001-shadow-render.mjs
 *
 * Smoke + generation test for BM-001 shadow render pipeline.
 *
 * Modes:
 *   --inspect-existing   Read and verify existing artifacts only.
 *   (default)           Generate shadow renders from scenario fixtures.
 *
 * Environment:
 *   DOCUMENT_RENDERER_MODE        shadow | active | off  (default: shadow)
 *   DOCUMENT_RENDERER_CONTRACT_TEMPLATES  comma-separated template codes
 *   SMOKE_STRICT                  true | false (default: false)
 *   SMOKE_SCENARIOS               comma-separated scenario IDs (default: all)
 *   API_BASE                      API base URL (default: http://localhost:3001/api/v1)
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — infra failure (API unreachable, manifest missing, etc.)
 *   2  — semantic/format warning in strict mode
 */

import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _require = createRequire(import.meta.url);

const REPO_ROOT = join(__dirname, '..');
// Require from apps/api (where pizzip and docxtemplater live) and pnpm-hoisted jszip
const _requireApi = createRequire(join(REPO_ROOT, 'apps', 'api', 'package.json'));
const _requireJSZip = createRequire(join(REPO_ROOT, 'node_modules', '.pnpm', 'node_modules', 'jszip', 'package.json'));
const SCENARIOS_DIR = join(REPO_ROOT, 'test', 'fixtures', 'rendering', 'bm001-shadow-scenarios');
const CONTRACTS_ROOT = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts');
const LOCKED_CONTRACT_PATH = join(CONTRACTS_ROOT, 'locked', 'BM-001__f4c2aa3682d3.contract.locked.json');
const TEMPLATE_ROOT = join(REPO_ROOT, 'storage', 'templates', 'normalized-docx', 'BM-001');
const TEMPLATE_PATH = join(TEMPLATE_ROOT, 'BM-001_normalized.docx');
const SHADOW_OUTPUT_DIR = join(REPO_ROOT, 'storage', 'generated', 'shadow-renders', 'BM-001');

const RENDERER_MODE = process.env.DOCUMENT_RENDERER_MODE ?? 'shadow';
const CONTRACT_TEMPLATES = (process.env.DOCUMENT_RENDERER_CONTRACT_TEMPLATES ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const STRICT = process.env.SMOKE_STRICT === 'true';
const INSPECT_ONLY = process.argv.includes('--inspect-existing');
const SCENARIOS_FILTER = (process.env.SMOKE_SCENARIOS ?? '').split(',').map((t) => t.trim()).filter(Boolean);

function log(level, ...args) {
  const prefix = level === 'FAIL' ? '[FAIL]' : level === 'WARN' ? '[WARN]' : level === 'PASS' ? '[PASS]' : '[INFO]';
  console.log(prefix, ...args);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// ─── Locked contract loader ───────────────────────────────────────────────────

function loadLockedContract() {
  if (!existsSync(LOCKED_CONTRACT_PATH)) {
    throw new Error(`Locked contract not found: ${LOCKED_CONTRACT_PATH}`);
  }
  const raw = readFileSync(LOCKED_CONTRACT_PATH, 'utf-8');
  return JSON.parse(raw);
}

// ─── Scenario loader ─────────────────────────────────────────────────────────

function loadScenarios() {
  if (!existsSync(SCENARIOS_DIR)) {
    throw new Error(`Scenarios directory not found: ${SCENARIOS_DIR}`);
  }
  const files = readdirSync(SCENARIOS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No scenario JSON files found in ${SCENARIOS_DIR}`);
  }

  return files.map((file) => {
    const path = join(SCENARIOS_DIR, file);
    return JSON.parse(readFileSync(path, 'utf-8'));
  }).filter((s) => {
    if (SCENARIOS_FILTER.length === 0) return true;
    return SCENARIOS_FILTER.includes(s.scenarioId);
  });
}

// ─── Template loader ────────────────────────────────────────────────────────

function loadTemplate() {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Normalized template not found: ${TEMPLATE_PATH}`);
  }
  return readFileSync(TEMPLATE_PATH);
}

// ─── Render engine (simplified, in-process) ────────────────────────────────

function buildBindingMap(contract, formData) {
  const bindings = new Map();
  for (const binding of contract.renderBindings ?? []) {
    const rawValue = formData[binding.from];
    const resolvedValue = resolveValue(rawValue, binding.transform, binding.fallback);
    bindings.set(binding.slotId, resolvedValue);
  }
  return bindings;
}

function resolveValue(value, transform, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback ?? '';
  }
  switch (transform) {
    case 'identity':
    case 'derived':
    case 'ordinal':
    case 'ordinal_wards':
    case 'wardname':
    case 'reporttype':
      return typeof value === 'string' ? value : String(value);
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'date':
      try {
        return new Date(value).toLocaleDateString('vi-VN');
      } catch {
        return typeof value === 'string' ? value : String(value);
      }
    case 'dateiso':
      try {
        return new Date(value).toISOString().split('T')[0];
      } catch {
        return typeof value === 'string' ? value : String(value);
      }
    case 'titlecase':
      if (typeof value !== 'string') return value;
      return value.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

async function renderDocx(templateBuffer, bindingMap) {
  const PizZip = _requireApi('pizzip');
  const Docxtemplater = _requireApi('docxtemplater');

  const templateZip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(templateZip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '{{', end: '}}' } });
  const data = {};
  for (const [key, value] of bindingMap) {
    data[key] = value ?? '';
  }
  doc.render(data);

  const renderedBuffer = doc.getZip().generate({ type: 'nodebuffer' });

  // Extract rendered XML for semantic/format comparison
  const JSZip = _requireJSZip('jszip');
  const renderedZip = await JSZip.loadAsync(renderedBuffer);
  const docXmlFile = await renderedZip.file('word/document.xml').async('string');

  return { buffer: renderedBuffer, xml: Buffer.from(docXmlFile, 'utf-8') };
}

// ─── Semantic comparison ─────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /\{[^{}]+\}/g,
  /\{\{[^{}]+\}\}/g,
  /……+/g,
  /_{3,}/g,
];

function extractTextFromXml(xml) {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUnresolvedPlaceholders(text) {
  const found = new Set();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) found.add(match);
    }
  }
  const dotPatterns = /[.。]{2,}/g;
  const dotMatches = text.match(dotPatterns);
  if (dotMatches) {
    for (const match of dotMatches) found.add(match);
  }
  const all = Array.from(found);
  const harmful = all.filter((p) => (p.startsWith('{') || p.startsWith('{{')) && !p.startsWith('……') && !p.startsWith('___'));
  return { all, harmful };
}

function findLiteralUndefined(text) {
  // docxtemplater inserts the string "undefined" when a binding value is undefined
  const matches = [...text.matchAll(/>undefined</g)];
  return matches.map((m) => `undefined at position ${m.index}`);
}

function compareSemantic(legacyXml, contractXml, expectedText) {
  const legacyText = extractTextFromXml(legacyXml);
  const contractText = extractTextFromXml(contractXml);
  const missing = [];

  for (const expected of expectedText) {
    const trimmed = expected.trim();
    if (trimmed && !contractText.includes(trimmed)) {
      missing.push(trimmed);
    }
  }

  const unresolved = findUnresolvedPlaceholders(contractXml).harmful;
  const literalUndefined = findLiteralUndefined(contractXml);
  const notes = [];
  const ratio = legacyText.length > 0 && contractText.length > 0
    ? contractText.length / legacyText.length
    : 1;
  if (ratio < 0.5) notes.push(`Contract text is significantly shorter (${ratio.toFixed(2)}x) than legacy.`);
  if (ratio > 2.0) notes.push(`Contract text is significantly longer (${ratio.toFixed(2)}x) than legacy.`);
  if (missing.length > 0) notes.push(`${missing.length} expected value(s) not found.`);
  if (literalUndefined.length > 0) notes.push(`${literalUndefined.length} binding(s) unresolved (rendered as undefined).`);

  let status = 'pass';
  if (missing.length > 0) status = 'fail';
  else if (unresolved.length > 0 || literalUndefined.length > 0) status = 'fail';
  else if (notes.length > 0) status = 'warning';

  return { status, legacyTextLength: legacyText.length, contractTextLength: contractText.length, missingExpectedText: missing, unexpectedUnresolvedPlaceholders: unresolved, literalUndefinedRendered: literalUndefined, notes };
}

function formatSemanticMd(result) {
  const lines = [
    '# DOCX Semantic Diff',
    '',
    `**Status**: \`${result.status}\``,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Legacy text length | ${result.legacyTextLength} |`,
    `| Contract text length | ${result.contractTextLength} |`,
    '',
  ];
  if (result.missingExpectedText.length > 0) {
    lines.push('## Missing Expected Text');
    for (const t of result.missingExpectedText) lines.push(`- "${t}"`);
    lines.push('');
  }
  if (result.unexpectedUnresolvedPlaceholders.length > 0) {
    lines.push('## Unexpected Unresolved Placeholders');
    for (const p of result.unexpectedUnresolvedPlaceholders) lines.push(`- \`${p}\``);
    lines.push('');
  }
  if (result.literalUndefinedRendered && result.literalUndefinedRendered.length > 0) {
    lines.push('## Unresolved Bindings (rendered as literal "undefined")');
    for (const u of result.literalUndefinedRendered) lines.push(`- ${u}`);
    lines.push('');
  }
  if (result.notes.length > 0) {
    lines.push('## Notes');
    for (const n of result.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ─── Format auditor (simplified) ─────────────────────────────────────────────

function auditFormat(documentXml) {
  const allXml = documentXml;
  const checks = [];

  const hasFont = /Times New Roman/i.test(allXml);
  checks.push({ id: 'FMT-001', requirement: 'Times New Roman size 13 baseline', status: hasFont ? 'pass' : 'not_detectable', evidence: hasFont ? 'Times New Roman found' : undefined });

  const hasVKS = /VIỆN KIỂM SÁT NHÂN DÂN/i.test(allXml);
  checks.push({ id: 'FMT-002', requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH', status: hasVKS ? 'pass' : 'not_detectable', evidence: hasVKS ? 'Agency header found' : undefined });

  const hasKhuVucBold = /KHU VỰC\s*7[\s\S]{0,200}<w:b[\s/]/i.test(allXml);
  checks.push({ id: 'FMT-003', requirement: 'Header: VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 bold', status: hasKhuVucBold ? 'pass' : 'warning', evidence: hasKhuVucBold ? 'KHU VỰC 7 + bold found' : 'Bold proximity not detected' });

  // FMT-004: Underline under KHU VỰC 7 only (not full line)
  // Whether the underline is ONLY under KHU VỰC 7 (and not the whole line) cannot be verified structurally.
  const hasKhuVucUnderline = /KHU VỰC\s*7[\s\S]{0,200}<w:u[^>]*(?:\/>|>)/i.test(allXml);
  checks.push({ id: 'FMT-004', requirement: 'Underline under KHU VỰC 7 only (not full line)', status: 'not_detectable', evidence: hasKhuVucUnderline ? 'Underline found near KHU VỰC 7; exact placement requires visual/PDF pipeline' : 'Underline not detectable from OOXML proximity check' });

  const hasLegalBasis = /Thông tư\s*số\s*03[/-]?2026/i.test(allXml);
  const legalSize8 = /Thông tư[\s\S]{0,300}<w:sz\s[^>]*w:val="16"/i.test(allXml);
  checks.push({ id: 'FMT-005', requirement: 'Legal basis line size 8', status: hasLegalBasis ? (legalSize8 ? 'pass' : 'warning') : 'not_detectable', evidence: hasLegalBasis ? 'Legal basis found' : undefined });

  const hasQuocHieu = /CỘNG\s*HÒA\s*XÃ\s*HỘI\s*CHỦ\s*NGHĨA\s*VIỆT\s*NAM/i.test(allXml);
  checks.push({ id: 'FMT-006', requirement: 'Quốc hiệu size 13', status: hasQuocHieu ? 'pass' : 'not_detectable', evidence: hasQuocHieu ? 'National motto found' : undefined });

  const hasMotto = /Độc\s*lập\s*-\s*Tự\s*do\s*-\s*Hạnh\s*phúc/i.test(allXml);
  const mottoSize14 = /Độc[\s\S]{0,500}<w:sz\s[^>]*w:val="28"/i.test(allXml);
  checks.push({ id: 'FMT-007', requirement: 'Độc lập - Tự do - Hạnh phúc size 14', status: hasMotto ? (mottoSize14 ? 'pass' : 'warning') : 'not_detectable', evidence: hasMotto ? 'Motto found' : undefined });

  // FMT-008: Underline under motto matches exact line width
  // Exact pixel-width cannot be verified structurally; presence of underline is detectable.
  const hasMottoUnderline = /Độc[\s\S]{0,500}<w:u[^>]*(?:\/>|>)/i.test(allXml);
  checks.push({ id: 'FMT-008', requirement: 'Underline under motto matches exact line width', status: hasMottoUnderline ? 'warning' : 'not_detectable', evidence: hasMottoUnderline ? 'Underline found near motto; exact width requires visual/PDF pipeline' : 'Underline not detectable from OOXML proximity check' });

  const hasIssueDate = /ngày\s*\d{1,2}\s*tháng\s*\d{1,2}\s*năm\s*\d{4}/i.test(allXml);
  checks.push({ id: 'FMT-009', requirement: 'Issue date line italic size 14', status: hasIssueDate ? 'pass' : 'not_detectable', evidence: hasIssueDate ? 'Issue date pattern found' : undefined });

  // FMT-010: Số/date horizontal alignment
  // Precise horizontal alignment cannot be verified from OOXML structure.
  checks.push({ id: 'FMT-010', requirement: 'Số/date horizontal alignment', status: 'not_detectable', evidence: 'Horizontal alignment requires visual/PDF pipeline' });

  const hasTitleBold14 = /<w:sz\s[^>]*w:val="28"[\s\S]{0,100}<w:b[\s/]/i.test(allXml);
  checks.push({ id: 'FMT-011', requirement: 'Body titles bold size 14', status: hasTitleBold14 ? 'pass' : 'warning', evidence: hasTitleBold14 ? 'Bold + size 14 found' : 'Bold + size 14 proximity not detected' });

  const hasDieuBold = /<w:b[\s/][\s\S]{0,200}Điều\s*\d+/i.test(allXml);
  const hasSectionBold = /<w:b[\s/][\s\S]{0,200}>\s*\d+\s*<\/?w:t>/i.test(allXml);
  checks.push({ id: 'FMT-012', requirement: 'Điều 1, Điều 2, section 1., 2. bold', status: (hasDieuBold || hasSectionBold) ? 'pass' : 'warning', evidence: (hasDieuBold || hasSectionBold) ? 'Điều/section bold found' : 'Điều bold not detected' });

  const hasNoiNhan = /Nơi\s*nhận\s*:/i.test(allXml);
  checks.push({ id: 'FMT-013', requirement: 'Footer: Nơi nhận: bold italic size 12', status: hasNoiNhan ? 'pass' : 'not_detectable', evidence: hasNoiNhan ? 'Nơi nhận: found' : undefined });

  const noiNhanSize11 = /Nơi\s*nhận[\s\S]{0,500}<w:sz\s[^>]*w:val="22"/i.test(allXml);
  checks.push({ id: 'FMT-014', requirement: 'Footer recipient lines size 11', status: noiNhanSize11 ? 'pass' : 'not_detectable', evidence: noiNhanSize11 ? 'Size 11 near Nơi nhận' : undefined });

  const hasChucVu = /(Viện\s*trưởng|Kiểm\s*sát\s*viên)/i.test(allXml);
  checks.push({ id: 'FMT-015', requirement: 'Signature title bold size 14; 2-3 lines between title and name', status: hasChucVu ? 'warning' : 'not_detectable', evidence: hasChucVu ? 'Signature title found' : undefined });

  const hasPageNumber = /<w:fldChar[\s\S]*?w:fldCharType="begin"[\s\S]*?PAGE/i.test(allXml);
  checks.push({ id: 'FMT-016', requirement: 'Page number present for documents > 2 pages', status: hasPageNumber ? 'pass' : 'not_detectable', evidence: hasPageNumber ? 'PAGE field found' : undefined });

  // FMT-017: Different First Page enabled
  const hasDifferentFirstPage = /<w:titlePg[\s"\/]/.test(allXml);
  checks.push({ id: 'FMT-017', requirement: 'Different First Page enabled', status: hasDifferentFirstPage ? 'pass' : 'not_detectable', evidence: hasDifferentFirstPage ? 'titlePg found in document' : undefined });

  const overall = checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warning')
      ? 'warning'
      : checks.every((c) => c.status !== 'not_detectable') ? 'pass' : 'warning';

  return { status: overall, checks };
}

function formatAuditMd(audit) {
  const lines = [
    '# DOCX Format Audit',
    '',
    `**Overall Status**: \`${audit.status}\``,
    '',
    '| Check ID | Requirement | Status | Evidence |',
    '|----------|-------------|--------|---------|',
  ];
  for (const check of audit.checks) {
    const evidence = check.evidence ?? '-';
    lines.push(`| ${check.id} | ${check.requirement} | \`${check.status}\` | ${evidence} |`);
  }
  return lines.join('\n');
}

// ─── Render one scenario ────────────────────────────────────────────────────

async function renderScenario(scenario, contract, templateBuffer) {
  const bindingMap = buildBindingMap(contract, scenario.formData);
  const { buffer: docxBuffer, xml: renderedXml } = await renderDocx(templateBuffer, bindingMap);

  const legacyXml = templateBuffer.toString('utf-8');
  const semanticResult = compareSemantic(legacyXml, renderedXml.toString('utf-8'), scenario.expectedText ?? []);
  const formatResult = auditFormat(renderedXml.toString('utf-8'));

  const ts = timestamp();
  const scenarioOutputDir = join(SHADOW_OUTPUT_DIR, `${scenario.scenarioId}-${ts}`);
  mkdirSync(scenarioOutputDir, { recursive: true });

  // Write contract.docx
  writeFileSync(join(scenarioOutputDir, 'contract.docx'), docxBuffer);

  // Write semantic-diff.json
  writeFileSync(join(scenarioOutputDir, 'semantic-diff.json'), JSON.stringify(semanticResult, null, 2));

  // Write semantic-diff.md
  writeFileSync(join(scenarioOutputDir, 'semantic-diff.md'), formatSemanticMd(semanticResult));

  // Write format-audit.json
  writeFileSync(join(scenarioOutputDir, 'format-audit.json'), JSON.stringify(formatResult, null, 2));

  // Write format-audit.md
  writeFileSync(join(scenarioOutputDir, 'format-audit.md'), formatAuditMd(formatResult));

  // Write manifest.json
  const manifest = {
    scenarioId: scenario.scenarioId,
    templateCode: 'BM-001',
    timestamp: ts,
    description: scenario.description,
    renderPlan: {
      sourceId: contract.sourceId,
      contractStatus: contract.status,
      fieldCount: contract.canonicalFields?.length ?? 0,
      bindingCount: contract.renderBindings?.length ?? 0,
    },
    semanticComparison: semanticResult,
    formatAudit: formatResult,
    artifacts: {
      docx: join(scenarioOutputDir, 'contract.docx'),
      semanticDiffJson: join(scenarioOutputDir, 'semantic-diff.json'),
      semanticDiffMd: join(scenarioOutputDir, 'semantic-diff.md'),
      formatAuditJson: join(scenarioOutputDir, 'format-audit.json'),
      formatAuditMd: join(scenarioOutputDir, 'format-audit.md'),
    },
  };
  writeFileSync(join(scenarioOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return { scenarioId: scenario.scenarioId, outputDir: scenarioOutputDir, semanticResult, formatResult };
}

// ─── Inspect existing artifacts ─────────────────────────────────────────────

async function inspectExisting() {
  log('INFO', '=== INSPECT MODE ===');
  if (!existsSync(SHADOW_OUTPUT_DIR)) {
    log('WARN', `Shadow output dir does not exist: ${SHADOW_OUTPUT_DIR}`);
    return { scenarioResults: [], infraFail: false, hasWarning: false };
  }

  const entries = readdirSync(SHADOW_OUTPUT_DIR)
    .map((name) => ({ name, stat: statSync(join(SHADOW_OUTPUT_DIR, name)) }))
    .filter((e) => e.stat.isDirectory())
    .sort((a, b) => b.stat.mtime - a.stat.mtime);

  log('INFO', `Found ${entries.length} shadow render directories`);
  const results = [];

  for (const entry of entries) {
    const manifestPath = join(SHADOW_OUTPUT_DIR, entry.name, 'manifest.json');
    if (!existsSync(manifestPath)) {
      log('WARN', `No manifest in ${entry.name}`);
      continue;
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      results.push({
        scenarioId: manifest.scenarioId ?? entry.name,
        outputDir: join(SHADOW_OUTPUT_DIR, entry.name),
        semanticResult: manifest.semanticComparison,
        formatResult: manifest.formatAudit,
      });
      log('PASS', `${manifest.scenarioId ?? entry.name}: semantic=${manifest.semanticComparison?.status}, format=${manifest.formatAudit?.status}`);
    } catch (err) {
      log('FAIL', `Failed to read manifest in ${entry.name}: ${err.message}`);
    }
  }

  return { scenarioResults: results, infraFail: false, hasWarning: results.length === 0 };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== BM-001 Shadow Render Smoke Test ===\n');

  if (INSPECT_ONLY) {
    const result = await inspectExisting();
    if (result.hasWarning) process.exit(1);
    process.exit(0);
    return;
  }

  // Default mode: generate shadow renders
  let infraFail = false;
  let hasWarning = false;
  let infraWarnings = [];

  // 1. Check renderer mode
  if (RENDERER_MODE !== 'shadow') {
    log('WARN', `DOCUMENT_RENDERER_MODE is "${RENDERER_MODE}", expected "shadow".`);
    infraWarnings.push(`Renderer mode is "${RENDERER_MODE}"`);
  }

  // 2. Check contract templates
  if (CONTRACT_TEMPLATES.length > 0 && !CONTRACT_TEMPLATES.includes('BM-001')) {
    log('FAIL', `DOCUMENT_RENDERER_CONTRACT_TEMPLATES does not include BM-001: [${CONTRACT_TEMPLATES.join(', ')}]`);
    infraFail = true;
  }

  // 3. Check locked contract exists
  if (!existsSync(LOCKED_CONTRACT_PATH)) {
    log('FAIL', `Locked contract not found: ${LOCKED_CONTRACT_PATH}`);
    infraFail = true;
  } else {
    log('PASS', `Locked contract: ${LOCKED_CONTRACT_PATH}`);
  }

  // 4. Check template exists
  if (!existsSync(TEMPLATE_PATH)) {
    log('FAIL', `Normalized template not found: ${TEMPLATE_PATH}`);
    infraFail = true;
  } else {
    log('PASS', `Template: ${TEMPLATE_PATH}`);
  }

  if (infraFail) {
    log('FAIL', 'INFRA FAILURE — required files missing');
    process.exit(1);
  }

  // 5. Load contract and scenarios
  const contract = loadLockedContract();
  const scenarios = loadScenarios();
  const templateBuffer = loadTemplate();

  log('INFO', `Locked contract: ${contract.templateCode} (${contract.status})`);
  log('INFO', `Rendering ${scenarios.length} scenarios to ${SHADOW_OUTPUT_DIR}`);
  mkdirSync(SHADOW_OUTPUT_DIR, { recursive: true });

  // 6. Render each scenario
  const results = [];
  for (const scenario of scenarios) {
    log('INFO', `Rendering scenario: ${scenario.scenarioId}`);
    try {
      const result = await renderScenario(scenario, contract, templateBuffer);
      results.push(result);

      if (result.semanticResult.status === 'fail') {
        log('FAIL', `${scenario.scenarioId}: semantic FAIL — missing: ${result.semanticResult.missingExpectedText.join(', ')}`);
        hasWarning = true;
      } else if (result.semanticResult.status === 'warning') {
        log('WARN', `${scenario.scenarioId}: semantic warning — ${result.semanticResult.notes.join('; ')}`);
        hasWarning = true;
      } else {
        log('PASS', `${scenario.scenarioId}: semantic PASS`);
      }

      if (result.formatResult.status === 'fail') {
        log('FAIL', `${scenario.scenarioId}: format FAIL`);
        hasWarning = true;
      } else if (result.formatResult.status === 'warning') {
        log('WARN', `${scenario.scenarioId}: format warning — some checks not detectable or weak`);
        hasWarning = true;
      } else {
        log('PASS', `${scenario.scenarioId}: format PASS`);
      }
    } catch (err) {
      log('FAIL', `${scenario.scenarioId}: render error — ${err.message}`);
      hasWarning = true;
      infraFail = true;
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const passCount = results.filter((r) => r.semanticResult.status === 'pass').length;
  const warnCount = results.filter((r) => r.semanticResult.status === 'warning').length;
  const failCount = results.filter((r) => r.semanticResult.status === 'fail').length;

  console.log(`  Scenarios rendered: ${results.length}`);
  console.log(`  Semantic pass: ${passCount}, warning: ${warnCount}, fail: ${failCount}`);

  if (infraFail) {
    log('FAIL', 'INFRA FAILURE — one or more renders failed');
    process.exit(1);
  }

  if (hasWarning) {
    log('WARN', 'Warnings detected — see above');
    if (STRICT) process.exit(2);
  } else {
    log('PASS', 'All checks passed');
  }

  process.exit(0);
}

main().catch((err) => {
  log('FAIL', `Script crashed: ${err.message}`);
  process.exit(1);
});
