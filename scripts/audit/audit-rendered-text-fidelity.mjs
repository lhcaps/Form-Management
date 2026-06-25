#!/usr/bin/env node
/**
 * audit-rendered-text-fidelity.mjs — Task F3 of PLAN.md.
 *
 * Renders all 213 BMs with deterministic mock values, extracts normalized text
 * from original normalized DOCX and rendered DOCX, and verifies:
 *   1. no unreplaced placeholders remain,
 *   2. required fixed text anchors remain,
 *   3. rendered/original text length ratio is within threshold.
 *
 * Exit codes:
 *   0 — all 213 PASS or REVIEW_REQUIRED (with allowlist entries).
 *   1 — one or more FAIL (defect not allowlisted).
 *
 * Usage:
 *   node scripts/audit/audit-rendered-text-fidelity.mjs               # render + audit
 *   node scripts/audit/audit-rendered-text-fidelity.mjs --report-only  # skip renders, use cache
 *   node scripts/audit/audit-rendered-text-fidelity.mjs --dry-run     # render all, exit 0
 *   node scripts/audit/audit-rendered-text-fidelity.mjs --template-code BM-001
 *
 * Cache dir:   .cache/f2-rendered-docx/ (shared with F2 structural fidelity)
 * Allowlist:   docs/audit/docx/fidelity-allowlist.json
 * Reports:     docs/audit/rendered-text-fidelity/latest.{json,md}
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const ALLOWLIST_PATH = join(ROOT, 'docs', 'audit', 'docx', 'fidelity-allowlist.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'rendered-text-fidelity');
const CACHE_DIR = join(ROOT, '.cache', 'f2-rendered-docx');

const REPORT_ONLY = process.argv.includes('--report-only');
const DRY_RUN = process.argv.includes('--dry-run');
const TEMPLATE_CODE = (() => {
  const idx = process.argv.indexOf('--template-code');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

// ──────────────────────────────────────────────────────────────────────────────
// Text extraction from DOCX XML parts
// ──────────────────────────────────────────────────────────────────────────────

const UNREPLACED_TOKENS = ['{{', '}}', '{#', '{/'];

/**
 * Extract plain text from a DOCX XML part (word/document.xml, word/header*.xml, etc.).
 * Strategy: remove self-closing <w:t .../> tags first (these are empty/broken in some
 * templates), then extract properly closed <w:t>...</w:t> text nodes, decode XML
 * entities, strip any residual XML tags that leaked in.
 */
const extractTextFromPart = (content) => {
  const results = [];
  // Remove self-closing <w:t .../> before extracting
  const stripped = content.replace(/<w:t(?:\s[^>]*)?\/>/gu, '');
  const matches = [...stripped.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)];
  for (const m of matches) {
    let t = m[1];
    t = t
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, '');
    // Strip any residual XML tags that leaked in (e.g. from malformed templates)
    t = t.replace(/<[^>]*>/g, '');
    if (t.trim()) results.push(t.trim());
  }
  return results;
};

/**
 * Extract text from all OOXML parts of a DOCX buffer that can contain visible text.
 * Returns array of { partName, text }.
 */
const extractAllTextParts = (buf) => {
  const PizZip = $require('pizzip');
  const zip = new PizZip(buf);
  const results = [];
  const allNames = Object.keys(zip.files);

  for (const name of allNames) {
    // Only process OOXML parts that can contain user-visible text
    if (!/^word\//.test(name) && name !== 'word/document.xml') continue;
    if (!name.endsWith('.xml')) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;
    const parts = extractTextFromPart(content);
    for (const text of parts) {
      results.push({ part: name, text });
    }
  }
  return results;
};

/**
 * Check rendered text for unreplaced docxtemplater-like tokens.
 * Returns array of { token, part, preview }.
 */
const findUnreplacedPlaceholders = (textParts) => {
  const issues = [];
  for (const { part, text } of textParts) {
    for (const token of UNREPLACED_TOKENS) {
      if (text.includes(token)) {
        const idx = text.indexOf(token);
        const preview = text.slice(Math.max(0, idx - 15), idx + 40);
        issues.push({ token, part: part.replace('word/', ''), preview });
        break; // only one issue per part
      }
    }
  }
  return issues;
};

// ──────────────────────────────────────────────────────────────────────────────
// Text normalization
// ──────────────────────────────────────────────────────────────────────────────

const normalizeForComparison = (textArr) => {
  return textArr.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0);
};

const fullTextFromParts = (textParts) => {
  return normalizeForComparison(textParts.map((p) => p.text)).join(' ');
};

// ──────────────────────────────────────────────────────────────────────────────
// Anchor generation from original text
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Known Vietnamese legal phrases that must appear in rendered output.
 * These are required anchors (FAIL if missing).
 */
const LEGAL_ANCHOR_PATTERNS = [
  // Quốc hiệu / tiêu ngữ
  { pattern: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', label: 'quocHieu' },
  { pattern: 'Độc lập - Tự do - Hạnh phúc', label: 'tieuNgu' },
  // Institution names
  { pattern: 'VIỆN KIỂM SÁT', label: 'vks' },
  { pattern: 'TÒA ÁN', label: 'toaAn' },
  // Legal basis
  { pattern: 'Căn cứ', label: 'canCu' },
  { pattern: 'Bộ luật Tố tụng hình sự', label: 'bltths' },
  { pattern: 'Bộ luật Hình sự', label: 'blhs' },
  { pattern: 'Luật Tổ chức Viện kiểm sát nhân dân', label: 'luatVks' },
  // Fixed administrative
  { pattern: 'Nơi nhận', label: 'noiNhan' },
  { pattern: 'TM. TÒA ÁN', label: 'tmToaAn' },
  { pattern: 'TM. VIỆN KIỂM SÁT', label: 'tmVks' },
  // Date/place lines
  { pattern: 'Ngày', label: 'ngay' },
  { pattern: 'tháng', label: 'thang' },
  { pattern: 'năm', label: 'nam' },
];

/**
 * Generate anchors from original normalized text.
 *
 * LEGAL_ANCHOR: Required. Vietnamese legal fixed phrases.
 * LOCKED_ANCHOR: Required. Stable fixed phrases around labels/headings (>= 12 chars).
 * AUTO_ANCHOR: REVIEW_REQUIRED if missing. Long fixed text chunks (>= 15 chars, no placeholders).
 */
const generateAnchors = (originalTextParts) => {
  const legalAnchors = [];
  const lockedAnchors = [];
  const autoAnchors = [];

  // ── Step 1: Known legal anchors ──────────────────────────────────────────
  const fullText = fullTextFromParts(originalTextParts);
  const fullNorm = fullText.replace(/\s+/g, ' ').trim();

  for (const { pattern, label } of LEGAL_ANCHOR_PATTERNS) {
    const normPattern = pattern.replace(/\s+/g, ' ').trim();
    const idx = fullNorm.indexOf(normPattern);
    if (idx >= 0) {
      legalAnchors.push({
        text: normPattern,
        label,
        required: true,
        found: true,
        foundAt: idx,
      });
    }
  }

  // ── Step 2: LOCKED_ANCHOR — stable fixed phrases from original ───────────
  // Extract fixed text segments between/around placeholders.
  // Strategy: find all {{...}} positions, then extract text between them
  // that is >= 12 chars and has few punctuation/braces.

  const placeholderPositions = [];
  for (const { text } of originalTextParts) {
    for (const m of text.matchAll(/\{\{/g)) {
      placeholderPositions.push({ text, start: m.index, end: m.index + m[0].length });
    }
    for (const m of text.matchAll(/\}\}/g)) {
      // closing brace — we'll handle these via open positions
    }
  }

  // For each text node, find fixed segments between {{...}} markers
  for (const { text } of originalTextParts) {
    const segments = splitAroundPlaceholders(text);
    for (const seg of segments) {
      const cleaned = seg.replace(/\{\{[^}]+\}\}/g, '').trim();
      // Skip segments that are mostly braces or punctuation
      const alphaLen = (cleaned.match(/[a-zA-ZÀ-ỹ]/gu) || []).length;
      if (cleaned.length < 12) continue;
      if (alphaLen / cleaned.length < 0.3) continue;
      // Skip segments that are close to marker values (will look like __XXX__)
      if (/^_{2,}[\w]+_{2,}$/.test(cleaned)) continue;
      // Skip if contains unreplaced placeholder token
      if (UNREPLACED_TOKENS.some((t) => cleaned.includes(t))) continue;

      const normSeg = cleaned.replace(/\s+/g, ' ').trim();

      // Check if it's already captured by a LEGAL_ANCHOR
      const isLegal = legalAnchors.some((a) => a.text === normSeg);
      if (isLegal) continue;

      // Classify as LOCKED if it contains label-like words
      const isLocked = classifyAsLocked(cleaned);
      if (isLocked) {
        // Avoid duplicates
        if (!lockedAnchors.some((a) => a.text === normSeg)) {
          lockedAnchors.push({ text: normSeg, required: true, found: true });
        }
      } else if (normSeg.length >= 15) {
        if (!autoAnchors.some((a) => a.text === normSeg)) {
          autoAnchors.push({ text: normSeg, required: false, found: true });
        }
      }
    }
  }

  return { legalAnchors, lockedAnchors, autoAnchors };
};

/**
 * Split a text string into segments: [fixed, {{placeholder}}, fixed, ...]
 */
const splitAroundPlaceholders = (text) => {
  const segments = [];
  let lastEnd = 0;
  // Match {{...}} including multi-char paths
  const re = /\{\{[^}]+\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastEnd) {
      segments.push(text.slice(lastEnd, m.index));
    }
    segments.push(m[0]); // the placeholder itself
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) {
    segments.push(text.slice(lastEnd));
  }
  return segments;
};

/**
 * Heuristic: classify a text segment as LOCKED_ANCHOR (required) vs AUTO_ANCHOR.
 * LOCKED: contains label-like Vietnamese text or institutional names.
 * AUTO: general fixed text.
 */
const classifyAsLocked = (text) => {
  const norm = text.replace(/\s+/g, ' ').trim();

  // Contains typical label words
  const labelWords = [
    'Họ và tên', 'Tên', 'Địa chỉ', 'Ngày sinh', 'Nghề nghiệp',
    'Quốc tịch', 'Số CMND', 'CMND', 'Nơi cấp', 'Giới tính',
    'Cơ quan', 'Chức vụ', 'Điện thoại', 'Email',
    'Bị can', 'Bị cáo', 'Người bị hại', 'Người chứng kiến', 'Người đại diện',
    'Điều', 'khoản', 'Mục', 'Tiết',
    'YÊU CẦU', 'BIÊN BẢN', 'QUYẾT ĐỊNH', 'BẢN ÁN', 'THÔNG BÁO',
    'Điều tra', 'Truy tố', 'Xét xử', 'Xét', 'xử',
    'Tố tụng', 'Hình sự', 'Dân sự',
    'Ban hành', 'thông tư', 'Quyết định',
    'Thẩm', 'tra', 'phê',
    'Mẫu số', 'HS',
  ];

  for (const word of labelWords) {
    if (norm.includes(word)) return true;
  }

  // Contains institutional designation patterns
  if (/[A-ZÀ-Ỹ]{3,}\s+(NHÂN DÂN|QUÂN SỰ|NHÂN|CỦA)/u.test(norm)) return true;

  // Contains a number reference pattern (Điều N, Mục N, etc.)
  if (/(?:Điều|Mục|Tiết|Khoản)\s+\d/.test(norm)) return true;

  // Form number pattern
  if (/Mẫu\s+số\s+\d+/.test(norm)) return true;

  // Signature block markers
  if (/TM\.|Thừa ủy|Người|Tòa|Viện|Chủ tịch|Phó|Chánh|Thư ký|Kiểm sát|Khởi tố/.test(norm)) return true;

  return false;
};

// ──────────────────────────────────────────────────────────────────────────────
// Mock data builder (mirrors E2/F2 convention)
// ──────────────────────────────────────────────────────────────────────────────

const markerForPath = (path) => `__${path.replace(/\W+/g, '_').toUpperCase()}__`;

// ──────────────────────────────────────────────────────────────────────────────
// DOCX pre-processor (reused from F2)
// ──────────────────────────────────────────────────────────────────────────────

const fixMalformedPlaceholders = (text) => {
  text = text.replace(/\}{3,}/gu, '}}');
  const result = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') { depth++; result.push(c); }
    else if (c === '}') { if (depth > 0) { depth--; result.push(c); } }
    else { result.push(c); }
  }
  const fixed = result.join('');
  const openPairs = (fixed.match(/\{\{/g) || []).length;
  const closePairs = (fixed.match(/\}\}/g) || []).length;
  if (openPairs > closePairs) return fixed + '}}';
  return fixed;
};

const preprocessDocxZip = (buf) => {
  const PizZip = $require('pizzip');
  const zip = new PizZip(buf);
  const fixedFiles = {};
  let changed = false;
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue;
    const content = zip.file(name)?.asText();
    if (!content || !content.includes('{{')) continue;
    const fixed = content.replace(
      /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/gu,
      (match, openTag, textContent, closeTag) => {
        const ft = fixMalformedPlaceholders(textContent);
        return ft !== textContent ? openTag + ft + closeTag : match;
      },
    );
    if (fixed !== content) { fixedFiles[name] = fixed; changed = true; }
  }
  if (!changed) return buf;
  const newZip = new PizZip();
  for (const name of Object.keys(zip.files)) {
    newZip.file(name, fixedFiles[name] !== undefined ? fixedFiles[name] : zip.files[name].asUint8Array());
  }
  return newZip.generate({ type: 'nodebuffer' });
};

// ──────────────────────────────────────────────────────────────────────────────
// Renderer subprocess (same pattern as F2)
// ──────────────────────────────────────────────────────────────────────────────

const renderOneSync = (templateCode, contractPath, normalizedDocxPath, outputBinPath) => {
  const { writeFileSync, readFileSync: readF, existsSync, mkdirSync } = $require('node:fs');
  const { join: j2join } = $require('node:path');
  const { tmpdir: otmpdir } = $require('node:os');

  const scriptDir = j2join(otmpdir(), `f3-render-${process.pid}`);
  mkdirSync(scriptDir, { recursive: true });
  const scriptPath = j2join(scriptDir, `_render_${templateCode}.ts`);

  const REPO_ROOT = '../..';

  const renderScript = `
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const REPO_ROOT = resolve('${REPO_ROOT.replace(/\\/g, '\\\\')}');
const LOCKED_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORM_DIR = join(REPO_ROOT, 'storage', 'templates', 'normalized-docx');

const markerForPath = (p) => '__' + p.replace(/\\W+/g, '_').toUpperCase() + '__';

const fixMalformedPlaceholders = (text) => {
  text = text.replace(/\\}{3,}/gu, '}}');
  const result = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') { depth++; result.push(c); }
    else if (c === '}') { if (depth > 0) { depth--; result.push(c); } }
    else { result.push(c); }
  }
  const fixed = result.join('');
  const opens = (fixed.match(/\\{\\{/g) || []).length;
  const closes = (fixed.match(/\\}\\}/g) || []).length;
  return opens > closes ? fixed + '}}' : fixed;
};

const preprocessDocxZip = (buf) => {
  const zip = new PizZip(buf);
  const fixedFiles = {};
  let changed = false;
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue;
    const content = zip.file(name)?.asText();
    if (!content || !content.includes('{{')) continue;
    const fixed = content.replace(
      /(<w:t(?:\\s[^>]*)?>)([\\s\\S]*?)(<\\/w:t>)/gu,
      (match, openTag, textContent, closeTag) => {
        const ft = fixMalformedPlaceholders(textContent);
        return ft !== textContent ? openTag + ft + closeTag : match;
      },
    );
    if (fixed !== content) { fixedFiles[name] = fixed; changed = true; }
  }
  if (!changed) return buf;
  const newZip = new PizZip();
  for (const name of Object.keys(zip.files)) {
    newZip.file(name, fixedFiles[name] !== undefined ? fixedFiles[name] : zip.files[name].asUint8Array());
  }
  return newZip.generate({ type: 'nodebuffer' });
};

const contractPath = '${contractPath.replace(/\\/g, '\\\\')}';
const normPath = '${normalizedDocxPath.replace(/\\/g, '\\\\')}';
const outPath = '${outputBinPath.replace(/\\/g, '\\\\')}';

const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
const mock = {};
for (const slot of contract.docxSlots ?? []) {
  if (slot.rejected || !slot.slotId) continue;
  mock[slot.slotId] = markerForPath(slot.slotId);
}

const rawBuf = readFileSync(normPath);
const buf = preprocessDocxZip(rawBuf);
const zip = new PizZip(buf);
const doc = new Docxtemplater(zip, {
  delimiters: { start: '{{', end: '}}' },
  paragraphLoop: true,
  linebreaks: true,
});
doc.render(mock);
const outBuf = doc.getZip().generate({ type: 'nodebuffer' });
writeFileSync(outPath, outBuf);
`.trim();

  writeFileSync(scriptPath, renderScript, 'utf8');

  const { execSync, unlinkSync, rmdirSync } = $require('node:child_process');

  try {
    execSync(
      `pnpm exec tsx "${scriptPath}"`,
      { cwd: join(ROOT, 'apps', 'api'), stdio: ['pipe', 'pipe', 'pipe'], timeout: 60_000 },
    );
    if (existsSync(outputBinPath)) {
      return readF(outputBinPath);
    }
  } catch {
    // render failed
  } finally {
    try { unlinkSync(scriptPath); } catch { /* ok */ }
    try { rmdirSync(scriptDir); } catch { /* ok */ }
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// Allowlist
// ──────────────────────────────────────────────────────────────────────────────

const makeDefaultThresholds = () => ({
  textLengthRatioMin: 0.7,
  textLengthRatioMax: 1.3,
  notes: 'Default text fidelity thresholds',
});

const loadAllowlist = () => {
  if (!existsSync(ALLOWLIST_PATH)) return { default: makeDefaultThresholds() };
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    return {
      default: { ...makeDefaultThresholds(), ...raw.default },
      ...raw,
    };
  } catch {
    return { default: makeDefaultThresholds() };
  }
};

const getThresholds = (allowlist, templateCode) => {
  const perBm = allowlist[templateCode];
  const defaults = allowlist.default ?? makeDefaultThresholds();
  if (perBm) return { ...defaults, ...perBm };
  return defaults;
};

// ──────────────────────────────────────────────────────────────────────────────
// Per-BM audit
// ──────────────────────────────────────────────────────────────────────────────

const auditOne = (templateCode, sourceId, normBuf, rendBuf, allowlist) => {
  // Extract text
  let originalParts = [];
  let renderedParts = [];

  try {
    originalParts = extractAllTextParts(normBuf);
  } catch {
    return {
      templateCode, sourceId,
      status: 'FAIL',
      originalTextLength: 0,
      renderedTextLength: 0,
      textLengthRatio: 0,
      requiredAnchorsCount: 0,
      missingRequiredAnchors: [],
      autoAnchorsCount: 0,
      missingAutoAnchorsCount: 0,
      unreplacedPlaceholders: [],
      notes: ['Failed to extract text from original DOCX.'],
    };
  }

  try {
    renderedParts = extractAllTextParts(rendBuf);
  } catch {
    return {
      templateCode, sourceId,
      status: 'FAIL',
      originalTextLength: fullTextFromParts(originalParts).length,
      renderedTextLength: 0,
      textLengthRatio: 0,
      requiredAnchorsCount: 0,
      missingRequiredAnchors: [],
      autoAnchorsCount: 0,
      missingAutoAnchorsCount: 0,
      unreplacedPlaceholders: [],
      notes: ['Failed to extract text from rendered DOCX.'],
    };
  }

  const originalText = fullTextFromParts(originalParts);
  const renderedText = fullTextFromParts(renderedParts);
  const originalTextLength = originalText.length;
  const renderedTextLength = renderedText.length;

  // Text length ratio
  const textLengthRatio =
    originalTextLength === 0 ? (renderedTextLength === 0 ? 1 : 0) :
    renderedTextLength / originalTextLength;

  const t = getThresholds(allowlist, templateCode);

  // Check for unreplaced placeholders in rendered text
  const unreplacedPlaceholders = findUnreplacedPlaceholders(renderedParts);

  // Generate anchors from original text
  const { legalAnchors, lockedAnchors, autoAnchors } = generateAnchors(originalParts);

  // Check required anchors in rendered text
  const fullNorm = renderedText.replace(/\s+/g, ' ').trim();

  const missingRequiredAnchors = [];

  for (const anchor of [...legalAnchors, ...lockedAnchors]) {
    const normAnchor = anchor.text.replace(/\s+/g, ' ').trim();
    if (!fullNorm.includes(normAnchor)) {
      missingRequiredAnchors.push({
        level: anchor.label ? (LEGAL_ANCHOR_PATTERNS.some(p => p.label === anchor.label) ? 'LEGAL_ANCHOR' : 'LOCKED_ANCHOR') : 'LOCKED_ANCHOR',
        text: anchor.text,
        part: undefined,
      });
    }
  }

  // Check AUTO_ANCHORs
  let missingAutoAnchorsCount = 0;
  for (const anchor of autoAnchors) {
    const normAnchor = anchor.text.replace(/\s+/g, ' ').trim();
    if (!fullNorm.includes(normAnchor)) {
      missingAutoAnchorsCount++;
    }
  }

  // Determine status
  const notes = [];
  let status = 'PASS';
  let allowlistApplied = false;

  // FAIL conditions
  if (unreplacedPlaceholders.length > 0) {
    status = 'FAIL';
    notes.push(`Unreplaced placeholders: ${unreplacedPlaceholders.length}`);
  }

  const hasLegalMissing = missingRequiredAnchors.some((a) => a.level === 'LEGAL_ANCHOR');
  const hasLockedMissing = missingRequiredAnchors.some((a) => a.level === 'LOCKED_ANCHOR');

  if (hasLegalMissing) {
    status = 'FAIL';
    notes.push(`Missing required LEGAL_ANCHOR: ${missingRequiredAnchors.filter((a) => a.level === 'LEGAL_ANCHOR').map((a) => a.text).join(', ')}`);
  }

  if (hasLockedMissing) {
    const missingLocked = missingRequiredAnchors.filter((a) => a.level === 'LOCKED_ANCHOR');
    // Check allowlist
    const bmEntry = allowlist[templateCode];
    if (bmEntry && bmEntry.skipMissingLockedAnchor) {
      status = 'REVIEW_REQUIRED';
      allowlistApplied = true;
      notes.push(`Allowlist: skip missing LOCKED_ANCHOR. Reason: ${bmEntry.notes ?? ''}`);
    } else if (bmEntry) {
      status = 'REVIEW_REQUIRED';
      allowlistApplied = true;
      notes.push(`Allowlist applied for missing LOCKED_ANCHOR: ${bmEntry.notes ?? ''}`);
    } else {
      status = 'FAIL';
      notes.push(`Missing required LOCKED_ANCHOR: ${missingLocked.map((a) => a.text).join(', ')}`);
    }
  }

  // Text length ratio check
  if (status !== 'FAIL') {
    if (textLengthRatio < t.textLengthRatioMin || textLengthRatio > t.textLengthRatioMax) {
      const bmEntry = allowlist[templateCode];
      if (bmEntry && (bmEntry.textLengthRatioMin !== undefined || bmEntry.textLengthRatioMax !== undefined)) {
        // Check if the ratio is within the per-BM threshold
        const perBmMin = bmEntry.textLengthRatioMin ?? t.textLengthRatioMin;
        const perBmMax = bmEntry.textLengthRatioMax ?? t.textLengthRatioMax;
        if (textLengthRatio < perBmMin || textLengthRatio > perBmMax) {
          status = 'REVIEW_REQUIRED';
          allowlistApplied = true;
          notes.push(`Allowlist applied: textLengthRatio=${textLengthRatio.toFixed(3)} outside per-BM [${perBmMin}, ${perBmMax}]. ${bmEntry.notes ?? ''}`);
        }
      } else {
        status = 'FAIL';
        notes.push(`textLengthRatio=${textLengthRatio.toFixed(3)} outside default [${t.textLengthRatioMin}, ${t.textLengthRatioMax}]. Add to allowlist or investigate.`);
      }
    }
  }

  // REVIEW_REQUIRED conditions (only if not already FAIL)
  if (status !== 'FAIL' && missingAutoAnchorsCount > 0) {
    status = 'REVIEW_REQUIRED';
    notes.push(`${missingAutoAnchorsCount} AUTO_ANCHOR(s) missing — review recommended.`);
  }

  return {
    templateCode,
    sourceId,
    status,
    originalTextLength,
    renderedTextLength,
    textLengthRatio: parseFloat(textLengthRatio.toFixed(4)),
    requiredAnchorsCount: legalAnchors.length + lockedAnchors.length,
    missingRequiredAnchors,
    autoAnchorsCount: autoAnchors.length,
    missingAutoAnchorsCount,
    unreplacedPlaceholders,
    allowlistApplied,
    notes: notes.length > 0 ? notes : undefined,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Report writing
// ──────────────────────────────────────────────────────────────────────────────

const writeReports = (results) => {
  mkdirSync(OUT_DIR, { recursive: true });
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const reviewCount = results.filter((r) => r.status === 'REVIEW_REQUIRED').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  const allTextLengthRatios = results
    .filter((r) => r.textLengthRatio > 0)
    .map((r) => r.textLengthRatio);
  const minRatio = allTextLengthRatios.length > 0 ? Math.min(...allTextLengthRatios) : 0;
  const maxRatio = allTextLengthRatios.length > 0 ? Math.max(...allTextLengthRatios) : 0;
  const totalMissingRequired = results.reduce(
    (sum, r) => sum + r.missingRequiredAnchors.length, 0,
  );
  const totalUnreplaced = results.reduce(
    (sum, r) => sum + r.unreplacedPlaceholders.length, 0,
  );

  const body = {
    generatedAt: new Date().toISOString(),
    totalContracts: results.length,
    renderedCount: results.filter((r) => r.originalTextLength > 0).length,
    passCount,
    reviewRequiredCount: reviewCount,
    failCount,
    textLengthRatioMin: parseFloat(minRatio.toFixed(4)),
    textLengthRatioMax: parseFloat(maxRatio.toFixed(4)),
    totalMissingRequiredAnchors: totalMissingRequired,
    totalUnreplacedPlaceholders: totalUnreplaced,
    results,
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const failures = results.filter((r) => r.status === 'FAIL');
  const reviewRequired = results.filter((r) => r.status === 'REVIEW_REQUIRED');
  const allowlist = loadAllowlist();

  const lines = [];
  lines.push(`# DOCX Rendered Text Fidelity — F3 audit`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${body.totalContracts} |`);
  lines.push(`| renderedCount | ${body.renderedCount} |`);
  lines.push(`| passCount | ${body.passCount} |`);
  lines.push(`| reviewRequiredCount | ${body.reviewRequiredCount} |`);
  lines.push(`| failCount | ${body.failCount} |`);
  lines.push(`| textLengthRatioMin | ${body.textLengthRatioMin} |`);
  lines.push(`| textLengthRatioMax | ${body.textLengthRatioMax} |`);
  lines.push(`| totalMissingRequiredAnchors | ${body.totalMissingRequiredAnchors} |`);
  lines.push(`| totalUnreplacedPlaceholders | ${body.totalUnreplacedPlaceholders} |`);
  lines.push('');

  if (failures.length > 0) {
    lines.push('## FAILURES');
    lines.push('');
    lines.push('| templateCode | reason |');
    lines.push('|--------------|--------|');
    for (const r of failures) {
      const reasons = [
        ...(r.unreplacedPlaceholders.length > 0 ? [`${r.unreplacedPlaceholders.length} unreplaced placeholders`] : []),
        ...r.missingRequiredAnchors.map((a) => `missing ${a.level}: "${a.text.slice(0, 50)}"`),
        ...(r.notes?.filter((n) => n.startsWith('textLengthRatio')) ?? []),
      ];
      lines.push(`| ${r.templateCode} | ${reasons.join('; ') || r.notes?.join('; ') || '-'} |`);
    }
    lines.push('');
  }

  if (reviewRequired.length > 0) {
    lines.push('## REVIEW_REQUIRED');
    lines.push('');
    lines.push('| templateCode | notes | ratio |');
    lines.push('|--------------|-------|-------|');
    for (const r of reviewRequired) {
      lines.push(`| ${r.templateCode} | ${r.notes?.join('; ') ?? '-'} | ${r.textLengthRatio} |`);
    }
    lines.push('');
  }

  if (failures.length === 0 && reviewRequired.length === 0) {
    lines.push('**All 213 BMs PASS. No text fidelity regressions detected.**');
    lines.push('');
  }

  lines.push('## Results table');
  lines.push('');
  lines.push('| templateCode | status | ratio | reqAnchors | missingReq | autoAnchors | missingAuto | unreplaced |');
  lines.push('|--------------|--------|-------|------------|------------|-------------|-------------|------------|');
  for (const r of results) {
    lines.push(
      `| ${r.templateCode} | ${r.status} | ${r.textLengthRatio} | ${r.requiredAnchorsCount} | ${r.missingRequiredAnchors.length} | ${r.autoAnchorsCount} | ${r.missingAutoAnchorsCount} | ${r.unreplacedPlaceholders.length} |`,
    );
  }
  lines.push('');

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`Written: ${jsonPath}\n`);
  process.stderr.write(`Written: ${mdPath}\n`);
  process.stderr.write(
    `Summary: ${passCount} PASS, ${reviewCount} REVIEW_REQUIRED, ${failCount} FAIL\n` +
    `textLengthRatio range: [${minRatio.toFixed(3)}, ${maxRatio.toFixed(3)}]\n` +
    `total missing required anchors: ${totalMissingRequired}\n` +
    `total unreplaced placeholders: ${totalUnreplaced}\n`,
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Load contracts
// ──────────────────────────────────────────────────────────────────────────────

const loadContracts = () => {
  const files = readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'));
  return files
    .map((f) => {
      const full = join(LOCKED_DIR, f);
      const contract = JSON.parse(readFileSync(full, 'utf8'));
      return {
        templateCode: contract.templateCode,
        sourceId: contract._meta?.sourceId ?? null,
        path: full,
      };
    })
    .sort((a, b) => a.templateCode.localeCompare(b.templateCode));
};

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

const main = () => {
  mkdirSync(CACHE_DIR, { recursive: true });

  const contracts = loadContracts();
  const allowlist = loadAllowlist();

  process.stderr.write(
    `[F3] DOCX rendered text fidelity audit\n` +
    `[F3] mode: ${REPORT_ONLY ? 'REPORT_ONLY' : DRY_RUN ? 'DRY_RUN' : 'LIVE'}\n` +
    `[F3] ${contracts.length} contracts loaded\n` +
    `[F3] shared cache: ${CACHE_DIR}\n`,
  );

  const results = [];
  let done = 0;
  const total = TEMPLATE_CODE ? 1 : contracts.length;

  for (const contract of contracts) {
    const code = contract.templateCode;
    if (TEMPLATE_CODE && code !== TEMPLATE_CODE) continue;

    const normPath = join(NORMALIZED_DIR, code, `${code}_normalized.docx`);
    const outBin = join(CACHE_DIR, `${code}.bin`);

    let normBuf = null;
    let rendBuf = null;

    if (existsSync(normPath)) {
      try { normBuf = readFileSync(normPath); } catch { /* skip */ }
    }

    if (REPORT_ONLY && existsSync(outBin)) {
      try { rendBuf = readFileSync(outBin); } catch { /* skip */ }
    }

    if (!rendBuf && !REPORT_ONLY) {
      process.stderr.write(`[${++done}/${total}] ${DRY_RUN ? 'dry-run' : 'rendering'} ${code}...\n`);
      if (!DRY_RUN) {
        rendBuf = renderOneSync(code, contract.path, normPath, outBin);
        if (rendBuf) {
          try { writeFileSync(outBin, rendBuf); } catch { /* ok */ }
        }
      }
    } else if (rendBuf) {
      process.stderr.write(`[${++done}/${total}] cached ${code}\n`);
    }

    if (!normBuf) {
      results.push({
        templateCode: code, sourceId: contract.sourceId,
        status: 'FAIL',
        originalTextLength: 0,
        renderedTextLength: 0,
        textLengthRatio: 0,
        requiredAnchorsCount: 0,
        missingRequiredAnchors: [],
        autoAnchorsCount: 0,
        missingAutoAnchorsCount: 0,
        unreplacedPlaceholders: [],
        notes: ['Normalized DOCX not found on disk.'],
      });
      continue;
    }

    if (!rendBuf) {
      results.push({
        templateCode: code, sourceId: contract.sourceId,
        status: 'FAIL',
        originalTextLength: fullTextFromParts(extractAllTextParts(normBuf)).length,
        renderedTextLength: 0,
        textLengthRatio: 0,
        requiredAnchorsCount: 0,
        missingRequiredAnchors: [],
        autoAnchorsCount: 0,
        missingAutoAnchorsCount: 0,
        unreplacedPlaceholders: [],
        notes: ['Rendered DOCX not available. Run without --report-only.'],
      });
      continue;
    }

    const result = auditOne(code, contract.sourceId, normBuf, rendBuf, allowlist);
    results.push(result);

    if (result.status === 'FAIL') {
      process.stderr.write(`  -> FAIL: ${result.notes?.join('; ')}\n`);
    }
  }

  writeReports(results);

  const failCount = results.filter((r) => r.status === 'FAIL').length;
  if (failCount > 0 && !DRY_RUN) {
    process.stderr.write(`\n[F3] ${failCount} FAIL(s) — exiting 1\n`);
    process.exit(1);
  }
};

main();
