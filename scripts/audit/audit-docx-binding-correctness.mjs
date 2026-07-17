#!/usr/bin/env node
/**
 * audit-docx-binding-correctness.mjs — Task F4 of PLAN.md.
 *
 * Two-tier binding correctness audit:
 * 1. Representative BMs (BM-001, BM-051, BM-053, BM-100, BM-150, BM-200):
 *    - Derive schema via deriveFormInputSchema from @qllaw/form-contracts
 *    - Fill required+editable+manual fields with __PATH__ markers
 *    - Render DOCX
 *    - Extract markers with full OOXML context (paragraph/table/row/cell)
 *    - Verify each marker appears and report XML context match
 * 2. Remaining 207 BMs:
 *    - Text-level smoke check (marker appears in rendered text)
 *    - No XML-context analysis
 *
 * Exit codes:
 *   0 — failCount === 0
 *   1 — failCount > 0
 *
 * Usage:
 *   node scripts/audit/audit-docx-binding-correctness.mjs               # full audit
 *   node scripts/audit/audit-docx-binding-correctness.mjs --report-only  # skip renders, use cache
 *   node scripts/audit/audit-docx-binding-correctness.mjs --template-code BM-001
 *
 * Cache dir: .cache/f4-binding-docx/
 * Allowlist: docs/audit/docx/fidelity-allowlist.json
 * Reports:   docs/audit/docx-binding-correctness/latest.{json,md}
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-binding-correctness');
const CACHE_DIR = join(ROOT, '.cache', 'f4-binding-docx');

const REPORT_ONLY = process.argv.includes('--report-only');
const TEMPLATE_CODE = (() => {
  const idx = process.argv.indexOf('--template-code');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

const REPRESENTATIVE_BMS = ['BM-001', 'BM-051', 'BM-053', 'BM-100', 'BM-150', 'BM-200'];

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const markerForPath = (path) => `__${path.replace(/\W+/g, '_').toUpperCase()}__`;


// ──────────────────────────────────────────────────────────────────────────────
// XML context extractor
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Extract marker occurrences with their OOXML context from a DOCX zip.
 * Returns array of MarkerOccurrence objects.
 *
 * Strategy:
 * 1. For each <w:p> paragraph, assign paragraphIndex
 * 2. For each <w:tr> table row within <w:tbl>, assign tableIndex/rowIndex
 * 3. For each <w:tc> table cell within a row, assign cellIndex
 * 4. Find all <w:t> text nodes containing the marker
 * 5. Extract 40 chars before and after as nearbyText
 */
const extractMarkerOccurrences = (buf, marker) => {
  const PizZip = $require('pizzip');
  const zip = new PizZip(buf);
  const allNames = Object.keys(zip.files);

  // Map part name -> normalized part type
  const partType = (name) => {
    if (name === 'word/document.xml') return 'document';
    if (/^word\/header\d+\.xml$/.test(name)) return 'header';
    if (/^word\/footer\d+\.xml$/.test(name)) return 'footer';
    if (/^word\/footnotes\.xml$/.test(name)) return 'footnotes';
    if (/^word\/endnotes\.xml$/.test(name)) return 'endnotes';
    return 'other';
  };

  const occurrences = [];

  for (const name of allNames) {
    if (!name.endsWith('.xml')) continue;
    const xmlPart = partType(name);
    if (xmlPart === 'other') continue;

    const content = zip.file(name)?.asText();
    if (!content) continue;

    const partOccurrences = extractOccurrencesFromXml(content, marker, xmlPart);
    occurrences.push(...partOccurrences);
  }

  return occurrences;
};

const extractOccurrencesFromXml = (xmlContent, marker, xmlPart) => {
  const occurrences = [];

  // Remove self-closing <w:t .../> first
  const stripped = xmlContent.replace(/<w:t(?:\s[^>]*)?\/>/gu, '');

  // Strategy: walk the XML tree to build context (paragraph/table/row/cell indices)
  // We'll use a simple regex approach: find all <w:p> blocks and search within them.
  // For tables, find <w:tbl> blocks and their rows.

  // Get paragraph indices
  const paragraphIndices = getElementIndices(stripped, '<w:p ');
  const tableIndices = getElementIndices(stripped, '<w:tbl ');
  const rowIndices = getElementIndices(stripped, '<w:tr ');
  const cellIndices = getElementIndices(stripped, '<w:tc>');

  // Helper: find which container a position falls in
  const findContainer = (position, elements) => {
    let idx = -1;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i] <= position) idx = i;
      else break;
    }
    return idx;
  };

  // Find all <w:t>...</w:t> containing the marker
  const wTPattern = new RegExp(
    `<w:t(?:\\s[^>]*)?>([\\s\\S]*?)</w:t>`,
    'gu',
  );

  let match;
  while ((match = wTPattern.exec(stripped)) !== null) {
    const fullMatch = match[0];
    const textContent = match[1];
    if (!textContent.includes(marker)) continue;

    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    // Decode XML entities for nearby text
    const decodedContent = textContent
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, '');

    // Find paragraph index
    const paragraphIndex = findContainer(matchStart, paragraphIndices);

    // Find table context
    const tableIdx = findContainer(matchStart, tableIndices);
    const rowIdx = findContainer(matchStart, rowIndices);
    const cellIdx = findContainer(matchStart, cellIndices);

    // Get the full paragraph text for nearbyText
    let nearbyTextBefore = '';
    let nearbyTextAfter = '';

    if (paragraphIndex >= 0) {
      const paraStart = paragraphIndices[paragraphIndex];
      const paraEnd = paragraphIndices[paragraphIndex + 1] ?? stripped.length;
      // Find where this <w:t> starts within the paragraph
      const tStartInPara = matchStart - paraStart;
      const tEndInPara = tStartInPara + fullMatch.length;
      const paraText = stripped.slice(paraStart, paraEnd);

      // Extract text from start of para to marker start
      const beforeChunk = paraText.slice(Math.max(0, tStartInPara - 40), tStartInPara);
      nearbyTextBefore = decodeXmlEntities(extractPlainText(beforeChunk)).slice(-40);

      // Extract from marker end to end of para
      const afterChunk = paraText.slice(tEndInPara, tEndInPara + 40);
      nearbyTextAfter = decodeXmlEntities(extractPlainText(afterChunk)).slice(0, 40);
    }

    occurrences.push({
      xmlPart,
      paragraphIndex: paragraphIndex >= 0 ? paragraphIndex : undefined,
      tableIndex: tableIdx >= 0 ? tableIdx : undefined,
      rowIndex: rowIdx >= 0 ? rowIdx : undefined,
      cellIndex: cellIdx >= 0 ? cellIdx : undefined,
      nearbyTextBefore,
      nearbyTextAfter,
      text: decodedContent,
    });
  }

  return occurrences;
};

const getElementIndices = (xml, tag) => {
  const indices = [];
  let pos = 0;
  const search = tag; // e.g. '<w:p '
  while ((pos = xml.indexOf(search, pos)) !== -1) {
    indices.push(pos);
    pos += search.length;
  }
  return indices;
};

const decodeXmlEntities = (text) => {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, '');
};

const extractPlainText = (xmlChunk) => {
  return xmlChunk
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// ──────────────────────────────────────────────────────────────────────────────
// Text extraction (fallback for smoke check)
// ──────────────────────────────────────────────────────────────────────────────

const extractAllText = (buf) => {
  const PizZip = $require('pizzip');
  const zip = new PizZip(buf);
  const results = [];
  const allNames = Object.keys(zip.files);

  for (const name of allNames) {
    if (!/^word\//.test(name)) continue;
    if (!name.endsWith('.xml')) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;

    // Remove self-closing <w:t .../>
    const stripped = content.replace(/<w:t(?:\s[^>]*)?\/>/gu, '');
    const matches = [...stripped.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)];
    for (const m of matches) {
      let t = m[1];
      t = decodeXmlEntities(t).replace(/<[^>]*>/g, '');
      if (t.trim()) results.push(t.trim());
    }
  }
  return results;
};

const fullTextFromParts = (parts) => parts.join(' ').replace(/\s+/g, ' ').trim();

// ──────────────────────────────────────────────────────────────────────────────
// DOCX pre-processor (reused from F2/F3)
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
// Render + derive schema + extract context (TypeScript subprocess)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Run a combined TypeScript subprocess that:
 * 1. Loads the locked contract
 * 2. Derives schema via deriveFormInputSchema
 * 3. Builds mock form data (required + editable + manual fields)
 * 4. Renders the DOCX
 * 5. Extracts all marker occurrences with OOXML context
 * 6. Returns structured JSON result
 *
 * This runs from apps/api via pnpm exec tsx to get @qllaw/form-contracts resolved.
 */
const runBindingAnalysis = (
  templateCode,
  contractPath,
  normalizedDocxPath,
  outputBinPath,
) => {
  const { writeFileSync, readFileSync: readF, existsSync, mkdirSync } = $require('node:fs');
  const { join: j2join } = $require('node:path');
  const scriptDir = j2join(ROOT, 'apps', 'api', '.cache', `f4-binding-${process.pid}`);
  mkdirSync(scriptDir, { recursive: true });
  const scriptPath = j2join(scriptDir, `_binding_${templateCode}.ts`);

  const REPO_ROOT = '../..';

  const renderScript = `
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { deriveFormInputSchema } from '@qllaw/form-contracts';

const REPO_ROOT = resolve('${REPO_ROOT.replace(/\\/g, '\\\\')}');
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

const decodeXmlEntities = (text) =>
  text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#xD;/g,'');

const extractPlainText = (chunk) =>
  chunk.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();

const getElementIndices = (xml, tag) => {
  const indices = [];
  let pos = 0;
  while ((pos = xml.indexOf(tag, pos)) !== -1) { indices.push(pos); pos += tag.length; }
  return indices;
};

const extractOccurrencesFromXml = (xmlContent, marker, xmlPart) => {
  const occurrences = [];
  const stripped = xmlContent.replace(/<w:t(?:\\s[^>]*)?\\/>/gu, '');
  const paraIdx = getElementIndices(stripped, '<w:p ');
  const tableIdx = getElementIndices(stripped, '<w:tbl ');
  const rowIdx = getElementIndices(stripped, '<w:tr ');
  const cellIdx = getElementIndices(stripped, '<w:tc>');

  const findContainer = (pos, arr) => {
    let i = -1;
    for (let j = 0; j < arr.length; j++) { if (arr[j] <= pos) i = j; else break; }
    return i;
  };

  const wTRe = /<w:t(?:\\s[^>]*)?>([\\s\\S]*?)<\\/w:t>/gu;
  let m;
  while ((m = wTRe.exec(stripped)) !== null) {
    if (!m[1].includes(marker)) continue;
    const full = m[0];
    const start = m.index;
    const end = start + full.length;
    const decoded = decodeXmlEntities(m[1]);
    const pIdx = findContainer(start, paraIdx);
    const tIdx = findContainer(start, tableIdx);
    const rIdx = findContainer(start, rowIdx);
    const cIdx = findContainer(start, cellIdx);

    let nb = '', na = '';
    if (pIdx >= 0) {
      const ps = paraIdx[pIdx];
      const pe = paraIdx[pIdx + 1] ?? stripped.length;
      const tInP = start - ps;
      const paraText = stripped.slice(ps, pe);
      const beforeChunk = paraText.slice(Math.max(0, tInP - 40), tInP);
      const afterChunk = paraText.slice(tInP + full.length, tInP + full.length + 40);
      nb = decodeXmlEntities(extractPlainText(beforeChunk)).slice(-40);
      na = decodeXmlEntities(extractPlainText(afterChunk)).slice(0, 40);
    }

    occurrences.push({
      xmlPart,
      paragraphIndex: pIdx >= 0 ? pIdx : undefined,
      tableIndex: tIdx >= 0 ? tIdx : undefined,
      rowIndex: rIdx >= 0 ? rIdx : undefined,
      cellIndex: cIdx >= 0 ? cIdx : undefined,
      nearbyTextBefore: nb,
      nearbyTextAfter: na,
      text: decoded,
    });
  }
  return occurrences;
};

const extractAllOccurrences = (buf, marker) => {
  const zip = new PizZip(buf);
  const allNames = Object.keys(zip.files);
  const results = [];
  const partType = (n) => {
    if (n === 'word/document.xml') return 'document';
    if (/^word\\/header\\d+\\.xml$/.test(n)) return 'header';
    if (/^word\\/footer\\d+\\.xml$/.test(n)) return 'footer';
    if (n === 'word/footnotes.xml') return 'footnotes';
    if (n === 'word/endnotes.xml') return 'endnotes';
    return 'other';
  };
  for (const name of allNames) {
    if (!name.endsWith('.xml')) continue;
    const pt = partType(name);
    if (pt === 'other') continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;
    results.push(...extractOccurrencesFromXml(content, marker, pt));
  }
  return results;
};

const contractPath = '${contractPath.replace(/\\/g, '\\\\')}';
const normPath = '${normalizedDocxPath.replace(/\\/g, '\\\\')}';
const outPath = '${outputBinPath.replace(/\\/g, '\\\\')}';

try {
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  const schema = deriveFormInputSchema(contract);

  // Build mock: required + editable + manual fields (E2 strategy)
  const mock = {};
  const requiredFields = [];
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.required === true && field.editable === true && field.source === 'manual') {
        const marker = markerForPath(field.path);
        mock[field.path] = marker;
        // The form field path can differ from the literal DOCX slot ID.
        // Mirror the production render binding so the fidelity audit checks
        // the actual placeholder rather than treating a mapped slot as absent.
        for (const binding of contract.renderBindings ?? []) {
          if (binding.from === field.path) mock[binding.slotId] = marker;
        }
        requiredFields.push(field.path);
      }
    }
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

  // Extract all marker occurrences
  const markers = {};
  for (const path of requiredFields) {
    const marker = mock[path];
    const occurrences = extractAllOccurrences(outBuf, marker);
    markers[path] = {
      marker,
      occurrences,
      multiplicity: occurrences.length,
    };
  }

  const result = {
    success: true,
    templateCode: '${templateCode}',
    requiredFields,
    mock,
    markers,
  };
  process.stdout.write(JSON.stringify(result));
} catch (err) {
  const result = { success: false, templateCode: '${templateCode}', error: String(err) };
  process.stdout.write(JSON.stringify(result));
}
`.trim();

  writeFileSync(scriptPath, renderScript, 'utf8');

  const { execSync, unlinkSync, rmdirSync } = $require('node:child_process');

  try {
    const output = execSync(
      `pnpm exec tsx "${scriptPath}"`,
      { cwd: join(ROOT, 'apps', 'api'), stdio: ['pipe', 'pipe', 'pipe'], timeout: 120_000 },
    );
    return JSON.parse(output.toString());
  } catch (err) {
    const stderr = err.stderr?.toString() ?? '';
    try {
      // May have partial JSON output even on error
      const lines = stderr.split('\n').filter(Boolean);
      for (const line of lines) {
        try { return JSON.parse(line); } catch { /* try next */ }
      }
    } catch { /* no parse */ }
    return { success: false, templateCode, error: stderr || String(err) };
  } finally {
    try { unlinkSync(scriptPath); } catch { /* ok */ }
    try { rmdirSync(scriptDir); } catch { /* ok */ }
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Smoke check render (for non-representative BMs)
// ──────────────────────────────────────────────────────────────────────────────

const renderOneSync = (templateCode, contractPath, normalizedDocxPath, outputBinPath) => {
  const { writeFileSync, readFileSync: readF, existsSync, mkdirSync } = $require('node:fs');
  const { join: j2join } = $require('node:path');
  const scriptDir = j2join(ROOT, 'apps', 'api', '.cache', `f4-smoke-${process.pid}`);
  mkdirSync(scriptDir, { recursive: true });
  const scriptPath = j2join(scriptDir, `_smoke_${templateCode}.ts`);

  const REPO_ROOT = '../..';

  const renderScript = `
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { deriveFormInputSchema } from '@qllaw/form-contracts';

const REPO_ROOT = resolve('${REPO_ROOT.replace(/\\/g, '\\\\')}');
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

try {
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  const schema = deriveFormInputSchema(contract);
  const mock = {};
  const requiredFields = [];
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.required === true && field.editable === true && field.source === 'manual') {
        const marker = markerForPath(field.path);
        mock[field.path] = marker;
        // Keep corpus smoke aligned with representative binding analysis.
        for (const binding of contract.renderBindings ?? []) {
          if (binding.from === field.path) mock[binding.slotId] = marker;
        }
        requiredFields.push(field.path);
      }
    }
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

  // Smoke: extract all text and check markers
  const stripped = buf.toString('utf8').replace(/<w:t(?:\\s[^>]*)?\\/>/gu, '');

  const decodeEntities = (s) =>
    s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
     .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#xD;/g,'');

  const textParts = [];
  const wTRe = /<w:t(?:\\s[^>]*)?>([\\s\\S]*?)<\\/w:t>/gu;
  let m;
  while ((m = wTRe.exec(stripped)) !== null) {
    const t = decodeEntities(m[1]).replace(/<[^>]*>/g, '');
    if (t.trim()) textParts.push(t.trim());
  }

  const renderedStripped = outBuf.toString('utf8').replace(/<w:t(?:\\s[^>]*)?\\/>/gu, '');
  const renderedParts = [];
  const wTRe2 = /<w:t(?:\\s[^>]*)?>([\\s\\S]*?)<\\/w:t>/gu;
  while ((m = wTRe2.exec(renderedStripped)) !== null) {
    const t = decodeEntities(m[1]).replace(/<[^>]*>/g, '');
    if (t.trim()) renderedParts.push(t.trim());
  }

  const fullText = renderedParts.join(' ').replace(/\\s+/g, ' ').trim();
  const hasUnreplaced = ['{{', '}}', '{#', '{/'].some(t => fullText.includes(t));

  const missingMarkers = [];
  for (const path of requiredFields) {
    const marker = mock[path];
    if (!fullText.includes(marker)) {
      missingMarkers.push({ path, marker });
    }
  }

  process.stdout.write(JSON.stringify({
    success: true,
    templateCode: '${templateCode}',
    requiredFields,
    mock,
    markerMissingCount: missingMarkers.length,
    missingMarkers,
    markerFoundCount: requiredFields.length - missingMarkers.length,
    hasUnreplaced,
    textLength: fullText.length,
  }));
} catch (err) {
  process.stdout.write(JSON.stringify({ success: false, templateCode: '${templateCode}', error: String(err) }));
}
`.trim();

  writeFileSync(scriptPath, renderScript, 'utf8');

  const { execSync, unlinkSync, rmdirSync } = $require('node:child_process');

  try {
    const output = execSync(
      `pnpm exec tsx "${scriptPath}"`,
      { cwd: join(ROOT, 'apps', 'api'), stdio: ['pipe', 'pipe', 'pipe'], timeout: 120_000 },
    );
    return JSON.parse(output.toString());
  } catch (err) {
    const stderr = err.stderr?.toString() ?? '';
    try {
      const lines = stderr.split('\n').filter(Boolean);
      for (const line of lines) {
        try { return JSON.parse(line); } catch { /* try next */ }
      }
    } catch { /* no parse */ }
    return { success: false, templateCode, error: stderr || String(err) };
  } finally {
    try { unlinkSync(scriptPath); } catch { /* ok */ }
    try { rmdirSync(scriptDir); } catch { /* ok */ }
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Per-BM audit logic
// ──────────────────────────────────────────────────────────────────────────────

const determineMarkerStatus = (markerData, contract, templateCode) => {
  const { marker, occurrences } = markerData;
  const multiplicity = occurrences.length;

  if (multiplicity === 0) {
    return {
      path: Object.keys(contract.renderBindings || {}).find(
        (k) => contract.renderBindings[k].slotId === markerData.path,
      ) || markerData.path,
      marker,
      observedMultiplicity: 0,
      expectedSlotId: markerData.path,
      locations: [],
      status: 'FAIL',
      notes: ['Marker not found in rendered DOCX.'],
    };
  }

  // Check if marker appears in expected XML part (document vs header vs footer)
  // The contract says where the placeholder was (location.partName)
  const slot = (contract.docxSlots || []).find((s) => s.slotId === markerData.path);
  const expectedPart = slot?.location?.partName?.replace('word/', '') || 'document';

  const docOccurrences = occurrences.filter((o) => o.xmlPart === 'document');
  const headerOccurrences = occurrences.filter((o) => o.xmlPart === 'header');
  const footerOccurrences = occurrences.filter((o) => o.xmlPart === 'footer');
  const noteOccurrences = occurrences.filter((o) => ['footnotes', 'endnotes'].includes(o.xmlPart));

  // STRICT_PASS: appears in expected part
  // REVIEW_REQUIRED: appears but not in expected part, or multiplicity > 1 for single-value field
  let status = 'PASS';
  const notes = [];

  if (expectedPart !== 'document' && docOccurrences.length > 0 && !occurrences.some((o) => o.xmlPart === expectedPart)) {
    status = 'REVIEW_REQUIRED';
    notes.push(`Marker found in document.xml but expected ${expectedPart}.`);
  }

  if (multiplicity > 1) {
    // Multiplicity > 1: might be intentional (repeated section) or wrong
    const isIntentional = (contract.renderBindings?.[markerData.path]?.repeat ?? false) ||
                         (slot?.slotType === 'repeat');
    if (!isIntentional) {
      if (status !== 'REVIEW_REQUIRED') {
        status = 'REVIEW_REQUIRED';
      }
      notes.push(`Multiplicity=${multiplicity} for single-value field.`);
    }
  }

  return {
    path: markerData.path,
    marker,
    observedMultiplicity: multiplicity,
    expectedSlotId: markerData.path,
    locations: occurrences.map((o) => ({
      xmlPart: o.xmlPart,
      paragraphIndex: o.paragraphIndex,
      tableIndex: o.tableIndex,
      rowIndex: o.rowIndex,
      cellIndex: o.cellIndex,
      nearbyTextBefore: o.nearbyTextBefore,
      nearbyTextAfter: o.nearbyTextAfter,
    })),
    status,
    notes: notes.length > 0 ? notes : undefined,
  };
};

const auditRepresentative = (code, contractPath, normPath, outBin, cache) => {
  const subResult = runBindingAnalysis(code, contractPath, normPath, outBin);

  if (!subResult.success) {
    return {
      templateCode: code,
      status: 'FAIL',
      requiredManualEditableFieldCount: 0,
      markerFoundCount: 0,
      markerMissingCount: 0,
      xmlContextPassed: false,
      xmlContextReviewRequired: false,
      markers: [],
      error: subResult.error,
      notes: [`Render/derive failed: ${subResult.error}`],
    };
  }

  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  const { requiredFields, markers } = subResult;

  const markerResults = [];
  let allPass = true;
  let allReviewed = true;
  let failCount = 0;

  for (const path of requiredFields) {
    // Skip paths not in mock (non-manual fields that don't get marker values)
    if (!subResult.mock || subResult.mock[path] === undefined) continue;

    const md = markers[path];
    if (!md) {
      // Marker from schema not found in renderBindings (shouldn't happen)
      markerResults.push({
        path,
        marker: subResult.mock[path],
        observedMultiplicity: 0,
        expectedSlotId: path,
        locations: [],
        status: 'FAIL',
        notes: ['Marker not generated in render output.'],
      });
      failCount++;
      allPass = false;
      allReviewed = false;
      continue;
    }

    const result = determineMarkerStatus(md, contract, code);
    markerResults.push(result);

    if (result.status === 'FAIL') {
      failCount++;
      allPass = false;
      allReviewed = false;
    } else if (result.status === 'REVIEW_REQUIRED') {
      allPass = false;
    }
  }

  const checkedCount = markerResults.length;
  const markerMissingCount = markerResults.filter((r) => r.status === 'FAIL' && r.observedMultiplicity === 0).length;
  const markerFoundCount = checkedCount - markerMissingCount;

  let overallStatus = 'PASS';
  if (failCount > 0) overallStatus = 'FAIL';
  else if (!allPass) overallStatus = 'REVIEW_REQUIRED';

  return {
    templateCode: code,
    status: overallStatus,
    requiredManualEditableFieldCount: requiredFields.length,
    markerFoundCount,
    markerMissingCount,
    xmlContextPassed: allPass && allReviewed,
    xmlContextReviewRequired: !allPass && !allReviewed === false,
    markers: markerResults,
  };
};

const auditSmoke = (code, contractPath, normPath, outBin, cache) => {
  const subResult = runBindingAnalysis(code, contractPath, normPath, outBin);

  if (!subResult.success) {
    return {
      templateCode: code,
      status: 'FAIL',
      requiredManualEditableFieldCount: 0,
      markerFoundCount: 0,
      markerMissingCount: 0,
      error: subResult.error,
      notes: [`Render/derive failed: ${subResult.error}`],
    };
  }

  const { requiredFields, markers, mock } = subResult;

  // Compute missing/found from markers map — only check paths that ARE in the mock
  // (non-manual fields like agency.parentName are NOT in mock and should not be checked)
  let foundCount = 0;
  let missingCount = 0;
  const missingMarkers = [];

  for (const path of requiredFields) {
    // Only check paths that have a corresponding entry in mock (manual fields)
    if (!mock || mock[path] === undefined) continue;

    const md = markers?.[path];
    if (md && md.multiplicity > 0) {
      foundCount++;
    } else {
      missingCount++;
      missingMarkers.push({ path, marker: mock[path] ?? markerForPath(path) });
    }
  }

  // Check for unreplaced placeholders in the rendered DOCX.
  // Distinguish: required+editable+manual fields (in mock) vs non-required (not in mock).
  let unreplacedRequiredTokens = [];
  let unreplacedNonRequiredTokens = [];
  try {
    const PizZip = $require('pizzip');
    const binPath = join(CACHE_DIR, `${code}.bin`);
    if (existsSync(binPath)) {
      const buf = readFileSync(binPath);
      const zip = new PizZip(buf);
      for (const name of Object.keys(zip.files)) {
        if (!name.endsWith('.xml')) continue;
        const content = zip.file(name)?.asText() ?? '';
        const found = content.match(/\{\{([^}]+)\}\}/g) || [];
        for (const token of found) {
          const path = token.slice(2, -2).trim();
          if (mock && mock[path] !== undefined) {
            unreplacedRequiredTokens.push(token);
          } else {
            unreplacedNonRequiredTokens.push(token);
          }
        }
      }
    }
  } catch { /* ignore */ }

  if (unreplacedRequiredTokens.length > 0) {
    return {
      templateCode: code,
      status: 'FAIL',
      requiredManualEditableFieldCount: requiredFields.length,
      markerFoundCount: foundCount,
      markerMissingCount: missingCount,
      notes: [
        `${unreplacedRequiredTokens.length} required+editable+manual placeholder(s) left unreplaced: ${unreplacedRequiredTokens.slice(0, 3).join(', ')}${unreplacedRequiredTokens.length > 3 ? '...' : ''}`,
      ],
    };
  }

  if (unreplacedNonRequiredTokens.length > 0) {
    return {
      templateCode: code,
      status: 'REVIEW_REQUIRED',
      requiredManualEditableFieldCount: requiredFields.length,
      markerFoundCount: foundCount,
      markerMissingCount: missingCount,
      notes: [
        `${unreplacedNonRequiredTokens.length} non-required placeholder(s) left unreplaced: ${[...new Set(unreplacedNonRequiredTokens)].slice(0, 5).join(', ')}. These fields are not required/editable/manual and the mock did not fill them.`,
      ],
    };
  }

  if (missingCount > 0) {
    return {
      templateCode: code,
      status: 'FAIL',
      requiredManualEditableFieldCount: requiredFields.length,
      markerFoundCount: foundCount,
      markerMissingCount: missingCount,
      notes: [
        `${missingCount} required manual editable marker(s) missing: ${missingMarkers.slice(0, 5).map((m) => m.marker).join(', ')}${missingMarkers.length > 5 ? '...' : ''}`,
      ],
    };
  }

  return {
    templateCode: code,
    status: 'PASS',
    requiredManualEditableFieldCount: requiredFields.length,
    markerFoundCount: foundCount,
    markerMissingCount: missingCount,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Report writing
// ──────────────────────────────────────────────────────────────────────────────

const writeReports = (repResults, smokeResults) => {
  mkdirSync(OUT_DIR, { recursive: true });

  const allResults = [...repResults, ...smokeResults];
  const passCount = allResults.filter((r) => r.status === 'PASS').length;
  const reviewCount = allResults.filter((r) => r.status === 'REVIEW_REQUIRED').length;
  const failCount = allResults.filter((r) => r.status === 'FAIL').length;
  const noReqCount = allResults.filter((r) => r.status === 'NO_REQUIRED_MANUAL_FIELDS').length;

  const body = {
    generatedAt: new Date().toISOString(),
    totalContracts: allResults.length,
    renderedCount: allResults.filter((r) => r.status !== 'FAIL' || r.error).length,
    passCount,
    reviewRequiredCount: reviewCount,
    failCount,
    noRequiredManualFieldsCount: noReqCount,
    representativeResults: repResults,
    corpusSmokeResults: smokeResults,
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const failures = allResults.filter((r) => r.status === 'FAIL');
  const reviews = allResults.filter((r) => r.status === 'REVIEW_REQUIRED');

  const lines = [];
  lines.push(`# DOCX Binding Correctness — F4 audit`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${body.totalContracts} |`);
  lines.push(`| passCount | ${body.passCount} |`);
  lines.push(`| reviewRequiredCount | ${body.reviewRequiredCount} |`);
  lines.push(`| failCount | ${body.failCount} |`);
  lines.push(`| noRequiredManualFields | ${body.noRequiredManualFieldsCount} |`);
  lines.push('');

  if (failures.length > 0) {
    lines.push('## FAILURES');
    lines.push('');
    lines.push('| templateCode | type | reason |');
    lines.push('|--------------|------|--------|');
    for (const r of failures) {
      const type = repResults.includes(r) ? 'representative' : 'smoke';
      const reasons = [];
      if (r.markerMissingCount > 0) reasons.push(`${r.markerMissingCount} marker(s) missing`);
      if (r.error) reasons.push(`render error: ${r.error}`);
      if (r.notes?.[0]) reasons.push(r.notes[0]);
      lines.push(`| ${r.templateCode} | ${type} | ${reasons.join('; ')} |`);
    }
    lines.push('');
  }

  if (reviews.length > 0) {
    lines.push('## REVIEW_REQUIRED');
    lines.push('');
    lines.push('| templateCode | type | reason |');
    lines.push('|--------------|------|--------|');
    for (const r of reviews) {
      const type = repResults.includes(r) ? 'representative' : 'smoke';
      lines.push(`| ${r.templateCode} | ${type} | ${r.notes?.join('; ') ?? '-'} |`);
    }
    lines.push('');
  }

  lines.push('## Representative BMs');
  lines.push('');
  lines.push('| templateCode | status | reqFields | found | missing | xmlContext |');
  lines.push('|--------------|--------|-----------|-------|---------|------------|');
  for (const r of repResults) {
    lines.push(
      `| ${r.templateCode} | ${r.status} | ${r.requiredManualEditableFieldCount} | ${r.markerFoundCount} | ${r.markerMissingCount} | ${r.xmlContextPassed ? 'PASS' : 'REVIEW'} |`,
    );
  }
  lines.push('');

  lines.push('## Corpus smoke summary');
  lines.push('');
  lines.push('| status | count |');
  lines.push('|--------|-------|');
  const smokeByStatus = {};
  for (const r of smokeResults) {
    smokeByStatus[r.status] = (smokeByStatus[r.status] || 0) + 1;
  }
  for (const [s, c] of Object.entries(smokeByStatus)) {
    lines.push(`| ${s} | ${c} |`);
  }
  lines.push('');

  if (failures.length === 0 && reviews.length === 0) {
    lines.push('**All BMs PASS. No binding correctness issues detected.**');
    lines.push('');
  }

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`Written: ${jsonPath}\n`);
  process.stderr.write(`Written: ${mdPath}\n`);
  process.stderr.write(
    `Summary: ${passCount} PASS, ${reviewCount} REVIEW_REQUIRED, ${failCount} FAIL\n`,
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
  process.stderr.write(
    `[F4] DOCX binding correctness audit\n` +
    `[F4] mode: ${REPORT_ONLY ? 'REPORT_ONLY' : 'LIVE'}\n` +
    `[F4] ${contracts.length} contracts loaded\n` +
    `[F4] representative BMs: ${REPRESENTATIVE_BMS.join(', ')}\n`,
  );

  const repResults = [];
  const smokeResults = [];
  let done = 0;
  const total = contracts.length;

  for (const contract of contracts) {
    const code = contract.templateCode;
    if (TEMPLATE_CODE && code !== TEMPLATE_CODE) continue;

    const normPath = join(NORMALIZED_DIR, code, `${code}_normalized.docx`);
    const outBin = join(CACHE_DIR, `${code}.bin`);

    if (!existsSync(normPath)) {
      process.stderr.write(`[${++done}/${total}] SKIP ${code}: normalized DOCX not found\n`);
      smokeResults.push({
        templateCode: code, status: 'FAIL',
        requiredManualEditableFieldCount: 0, markerFoundCount: 0, markerMissingCount: 0,
        notes: ['Normalized DOCX not found.'],
      });
      continue;
    }

    const isRepresentative = REPRESENTATIVE_BMS.includes(code);

    if (REPORT_ONLY && existsSync(outBin)) {
      process.stderr.write(`[${++done}/${total}] cached ${code} (${isRepresentative ? 'rep' : 'smoke'})\n`);
      // Use cached result would require pre-computed JSON; skip for report-only
      // For now: re-run to get result (it's fast enough since we skip re-render)
    }

    process.stderr.write(`[${++done}/${total}] ${REPORT_ONLY ? 're-running' : 'auditing'} ${code} (${isRepresentative ? 'rep' : 'smoke'})\n`);

    if (isRepresentative) {
      const result = auditRepresentative(code, contract.path, normPath, outBin, null);
      repResults.push(result);
      if (result.status === 'FAIL') {
        process.stderr.write(`  -> FAIL: ${result.notes?.join('; ') || result.error}\n`);
      }
    } else {
      const result = auditSmoke(code, contract.path, normPath, outBin, null);
      smokeResults.push(result);
      if (result.status === 'FAIL') {
        process.stderr.write(`  -> FAIL: ${result.notes?.join('; ') || result.error}\n`);
      }
    }
  }

  writeReports(repResults, smokeResults);

  const failCount = [...repResults, ...smokeResults].filter((r) => r.status === 'FAIL').length;
  if (failCount > 0) {
    process.stderr.write(`\n[F4] ${failCount} FAIL(s) — exiting 1\n`);
    process.exit(1);
  }
};

main();
