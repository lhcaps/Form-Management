#!/usr/bin/env node
/**
 * audit-docx-structural-fidelity.mjs — Task F2 of PLAN.md v2.3.
 *
 * Renders all 213 BMs with deterministic mock values, then compares the
 * OOXML structure of each normalized source DOCX against its rendered output.
 *
 * Exit codes:
 *   0 — all 213 PASS or REVIEW_REQUIRED (with allowlist entries).
 *   1 — one or more FAIL (structural defect not allowlisted).
 *
 * Usage:
 *   node scripts/audit/audit-docx-structural-fidelity.mjs              # render + audit
 *   node scripts/audit/audit-docx-structural-fidelity.mjs --report-only  # skip renders, use cache
 *
 *   --template-code BM-001   # render only one BM (for debugging)
 *   --dry-run               # render all, exit 0, write report
 *
 * Allowlist: docs/audit/docx/fidelity-allowlist.json
 * Reports:   docs/audit/docx-structural-fidelity/latest.{json,md}
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const ALLOWLIST_PATH = join(ROOT, 'docs', 'audit', 'docx', 'fidelity-allowlist.json');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-structural-fidelity');
const CACHE_DIR = join(ROOT, '.cache', 'f2-rendered-docx');

const REPORT_ONLY = process.argv.includes('--report-only');
const DRY_RUN = process.argv.includes('--dry-run');
const TEMPLATE_CODE = (() => {
  const idx = process.argv.indexOf('--template-code');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

// ──────────────────────────────────────────────────────────────────────────────
// OOXML structure extractor
// ──────────────────────────────────────────────────────────────────────────────

const extractStructure = (docxBuffer) => {
  try {
    const PizZip = $require('pizzip');
    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText() ?? '';
    const stylesXml = zip.file('word/styles.xml')?.asText() ?? '';
    const numberingXml = zip.file('word/numbering.xml')?.asText() ?? '';
    const relsXml = zip.file('word/_rels/document.xml.rels')?.asText() ?? '';
    const allNames = Object.keys(zip.files);

    return {
      paragraphCount: (docXml.match(/<w:p\b[^>]*>/gu) || []).length,
      tableCount: (docXml.match(/<w:tbl\b[^>]*>/gu) || []).length,
      sectionPropertiesCount: (docXml.match(/<w:sectPr\b[^>]*>/gu) || []).length,
      styleIdsCount: (stylesXml.match(/<w:style\b[^>]*\bw:styleId="[^"]+"/gu) || []).length,
      numberingDefinitionsCount: (numberingXml.match(/<w:num\b[^>]*>/gu) || []).length,
      relationshipCount: (relsXml.match(/<[^/][^>]*\bRelationship\b[^>]*>/gu) || []).length,
      headerCount: allNames.filter((n) => /^word\/header\d+\.xml$/u.test(n)).length,
      footerCount: allNames.filter((n) => /^word\/footer\d+\.xml$/u.test(n)).length,
    };
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Mock data builder (mirrors E2 convention)
// ──────────────────────────────────────────────────────────────────────────────

const markerForPath = (path) => `__${path.replace(/\W+/g, '_').toUpperCase()}__`;

// ──────────────────────────────────────────────────────────────────────────────
// DOCX pre-processor: fix malformed placeholder patterns before rendering
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Pre-process DOCX XML content to fix malformed placeholder syntax.
 * These are Word XML serialization artifacts where literal brace characters
 * in run content get confused with template delimiters.
 *
 * Fixes:
 *   1. TRIPLE_BRACE:  }}} → }}
 *   2. ORPHAN_BRACE:  } outside {{...}} context → removed
 *   3. TRUNCATED_AT_END: {{ without closing }} → append }}
 */
const fixMalformedPlaceholders = (text) => {
  // Fix TRIPLE_BRACE: }}} → }}
  text = text.replace(/\}{3,}/gu, '}}');

  // Fix ORPHAN_BRACE: remove } outside {{...}} delimiter context.
  // This handles literal } characters in <w:t> tags that Word serialized
  // without escaping. An orphan } appears outside any {{...}} block.
  const result = [];
  let depth = 0; // 0=outside, 1+=inside {{...}} block

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      depth++;
      result.push(c);
    } else if (c === '}') {
      if (depth > 0) {
        depth--;
        result.push(c);
      }
      // Orphan } (depth === 0) → silently removed
    } else {
      result.push(c);
    }
  }

  // Fix TRUNCATED_AT_END: append }} if unclosed {{
  const fixed = result.join('');
  const openPairs = (fixed.match(/\{\{/g) || []).length;
  const closePairs = (fixed.match(/\}\}/g) || []).length;
  if (openPairs > closePairs) {
    return fixed + '}}';
  }
  return fixed;
};

/**
 * Apply pre-processing to all XML parts in a DOCX zip.
 * Returns a new zip buffer with fixed XML.
 */
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
        const fixedText = fixMalformedPlaceholders(textContent);
        return fixedText !== textContent ? openTag + fixedText + closeTag : match;
      },
    );

    if (fixed !== content) {
      fixedFiles[name] = fixed;
      changed = true;
    }
  }

  if (!changed) return buf;

  const newZip = new PizZip();
  for (const name of Object.keys(zip.files)) {
    if (fixedFiles[name] !== undefined) {
      newZip.file(name, fixedFiles[name]);
    } else {
      newZip.file(name, zip.files[name].asUint8Array());
    }
  }
  return newZip.generate({ type: 'nodebuffer' });
};

// ──────────────────────────────────────────────────────────────────────────────
// Renderer subprocess
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render one BM by invoking a TypeScript subprocess via pnpm exec tsx.
 * Runs from apps/api to get monorepo workspace module resolution.
 */
const renderOneSync = (templateCode, contractPath, normalizedDocxPath, outputBinPath) => {
  const { writeFileSync, readFileSync: readF, existsSync, mkdirSync } = $require('node:fs');
  const { join: j2join } = $require('node:path');
  const scriptDir = j2join(ROOT, 'apps', 'api', '.cache', `f2-render-${process.pid}`);
  mkdirSync(scriptDir, { recursive: true });
  const scriptPath = j2join(scriptDir, `_render_${templateCode}.ts`);

  // __dirname in tsx (running from apps/api) = apps/api/
  const REPO_ROOT = '../..';

  const renderScript = `
// Minimal render script for F2 structural fidelity audit.
// Uses pnpm exec tsx so docxtemplater/pizzip are resolved correctly.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const REPO_ROOT = resolve('${REPO_ROOT.replace(/\\/g, '\\\\')}');
const LOCKED_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORM_DIR = join(REPO_ROOT, 'storage', 'templates', 'normalized-docx');

const markerForPath = (p) => '__' + p.replace(/\\W+/g, '_').toUpperCase() + '__';

// Pre-process: fix malformed placeholder patterns in DOCX XML
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

// Fill ALL slots with markers (mirrors renderShadow's formData fallback)
const mock = {};
for (const slot of contract.docxSlots ?? []) {
  if (slot.rejected || !slot.slotId) continue;
  mock[slot.slotId] = markerForPath(slot.slotId);
}

// Read + preprocess
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

  const { execSync } = $require('node:child_process');
  const { unlinkSync, rmdirSync } = $require('node:fs');

  try {
    execSync(
      `pnpm exec tsx "${scriptPath}"`,
      { cwd: join(ROOT, 'apps', 'api'), stdio: ['pipe', 'pipe', 'pipe'], timeout: 60_000 },
    );
    if (existsSync(outputBinPath)) {
      return readF(outputBinPath);
    }
  } catch (error) {
    const detail = String(error.stderr ?? error.message ?? error)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 800);
    process.stderr.write(`[F2] renderer failed for ${templateCode}: ${detail || 'unknown subprocess error'}\n`);
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
  paragraphDeltaPercent: 15,
  allowedMissingStyleIds: [],
  allowedTableDelta: 0,
  allowedHeaderDelta: 0,
  allowedFooterDelta: 0,
  allowedNumberingDelta: 0,
  allowedSectionPropertiesDelta: 0,
  notes: 'Default structural fidelity thresholds',
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

const computeDeltaPercent = (original, rendered) => {
  if (original === 0) return 0;
  return Math.abs(rendered - original) / original * 100;
};

const auditOne = (templateCode, sourceId, normBuf, rendBuf, allowlist) => {
  const original = extractStructure(normBuf);
  const rendered = extractStructure(rendBuf);

  if (!original || !rendered) {
    return {
      templateCode, sourceId,
      status: 'FAIL',
      original: original ?? { error: 'extract failed' },
      rendered: rendered ?? { error: 'extract failed' },
      deltas: {},
      notes: ['Failed to extract structure from one or both DOCX.'],
    };
  }

  const t = getThresholds(allowlist, templateCode);
  const notes = [];

  const paraDelta = computeDeltaPercent(original.paragraphCount, rendered.paragraphCount);
  const tableDelta = rendered.tableCount - original.tableCount;
  const headerDelta = rendered.headerCount - original.headerCount;
  const footerDelta = rendered.footerCount - original.footerCount;
  const numDelta = rendered.numberingDefinitionsCount - original.numberingDefinitionsCount;
  const sectDelta = rendered.sectionPropertiesCount - original.sectionPropertiesCount;
  const styleDelta = rendered.styleIdsCount - original.styleIdsCount;

  const failures = [];
  const warnings = [];

  if (tableDelta < -t.allowedTableDelta) failures.push(`tableCount decreased by ${Math.abs(tableDelta)}`);
  if (headerDelta !== 0 && Math.abs(headerDelta) > t.allowedHeaderDelta) failures.push(`headerCount changed by ${headerDelta}`);
  if (footerDelta !== 0 && Math.abs(footerDelta) > t.allowedFooterDelta) failures.push(`footerCount changed by ${footerDelta}`);
  if (numDelta < -t.allowedNumberingDelta) failures.push(`numberingDefinitions decreased by ${Math.abs(numDelta)}`);
  if (sectDelta < -t.allowedSectionPropertiesDelta) failures.push(`sectionProperties decreased by ${Math.abs(sectDelta)}`);
  if (paraDelta > t.paragraphDeltaPercent) failures.push(`paragraphDeltaPercent=${paraDelta.toFixed(1)}% exceeds threshold ${t.paragraphDeltaPercent}%`);

  // Special notes for F1_FIX-repaired BMs
  if (['BM-031', 'BM-059'].includes(templateCode)) {
    warnings.push('F1_FIX UNBALANCED_IN_RUN merge: style/paragraph changes may be present from cross-run formatting boundary merge.');
  }
  if (templateCode === 'BM-167') {
    warnings.push('F1_FIX TRUNCATED_AT_END repair: section/paragraph boundary may have changed from appended closing braces.');
  }

  let status = 'PASS';
  let allowlistApplied = false;

  if (failures.length > 0) {
    const bmEntry = allowlist[templateCode];
    if (bmEntry) {
      status = 'REVIEW_REQUIRED';
      allowlistApplied = true;
      notes.push(`Allowlist applied: ${bmEntry.notes ?? ''}`);
    } else {
      status = 'FAIL';
    }
  } else if (warnings.length > 0) {
    const bmEntry = allowlist[templateCode];
    if (bmEntry) {
      status = 'REVIEW_REQUIRED';
      allowlistApplied = true;
      notes.push(`Allowlist applied: ${bmEntry.notes ?? ''}`);
    }
    notes.push(...warnings);
  }

  const deltas = {
    paragraphDeltaPercent: parseFloat(paraDelta.toFixed(2)),
    tableDelta,
    headerDelta,
    footerDelta,
    numberingDelta: numDelta,
    sectionPropertiesDelta: sectDelta,
    styleIdsDelta: styleDelta,
    relationshipDelta: rendered.relationshipCount - original.relationshipCount,
    styleIdsCountOriginal: original.styleIdsCount,
    styleIdsCountRendered: rendered.styleIdsCount,
  };

  return {
    templateCode, sourceId, status,
    original, rendered, deltas,
    allowlistApplied,
    notes: failures.length > 0 || warnings.length > 0 ? [...notes, ...failures, ...warnings] : notes,
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

  const body = {
    generatedAt: new Date().toISOString(),
    totalContracts: results.length,
    passCount,
    reviewRequiredCount: reviewCount,
    failCount,
    results,
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const failures = results.filter((r) => r.status === 'FAIL');
  const reviewRequired = results.filter((r) => r.status === 'REVIEW_REQUIRED');
  const allowlist = loadAllowlist();

  const lines = [];
  lines.push(`# DOCX Structural Fidelity — F2 audit`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${body.totalContracts} |`);
  lines.push(`| passCount | ${body.passCount} |`);
  lines.push(`| reviewRequiredCount | ${body.reviewRequiredCount} |`);
  lines.push(`| failCount | ${body.failCount} |`);
  lines.push('');

  if (failures.length > 0) {
    lines.push('## FAILURES (structural defect, not allowlisted)');
    lines.push('');
    lines.push('| templateCode | sourceId | reason |');
    lines.push('|--------------|----------|--------|');
    for (const r of failures) {
      lines.push(`| ${r.templateCode} | ${r.sourceId ?? '-'} | ${r.notes.join('; ')} |`);
    }
    lines.push('');
  }

  if (reviewRequired.length > 0) {
    lines.push('## REVIEW_REQUIRED (allowlisted — confirm benign)');
    lines.push('');
    lines.push('| templateCode | allowlist notes | deltas |');
    lines.push('|--------------|----------------|--------|');
    for (const r of reviewRequired) {
      const bmEntry = allowlist[r.templateCode];
      const deltaStr = Object.entries(r.deltas)
        .filter(([, v]) => typeof v === 'number' && v !== 0)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      lines.push(`| ${r.templateCode} | ${bmEntry?.notes ?? '(default)'} | ${deltaStr} |`);
    }
    lines.push('');
  }

  if (failures.length === 0 && reviewRequired.length === 0) {
    lines.push('**All 213 BMs PASS. No structural regressions detected.**');
    lines.push('');
  }

  lines.push('## Results table');
  lines.push('');
  lines.push('| templateCode | status | paraDelta% | tableΔ | headerΔ | footerΔ | styleIdsΔ |');
  lines.push('|--------------|--------|-----------|--------|---------|---------|-----------|');
  for (const r of results) {
    const s = r.deltas;
    lines.push(
      `| ${r.templateCode} | ${r.status} | ${s.paragraphDeltaPercent} | ${s.tableDelta} | ${s.headerDelta} | ${s.footerDelta} | ${s.styleIdsDelta} |`,
    );
  }
  lines.push('');

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`Written: ${jsonPath}\n`);
  process.stderr.write(`Written: ${mdPath}\n`);
  process.stderr.write(`Summary: ${passCount} PASS, ${reviewCount} REVIEW_REQUIRED, ${failCount} FAIL\n`);
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
    `[F2] DOCX structural fidelity audit\n` +
    `[F2] mode: ${REPORT_ONLY ? 'REPORT_ONLY' : DRY_RUN ? 'DRY_RUN' : 'LIVE'}\n` +
    `[F2] ${contracts.length} contracts loaded\n`,
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
        original: { error: 'normalized DOCX not found' },
        rendered: rendBuf ? (extractStructure(rendBuf) ?? { error: 'render failed' }) : { error: 'not rendered' },
        deltas: {},
        notes: ['Normalized DOCX not found on disk.'],
      });
      continue;
    }

    if (!rendBuf) {
      results.push({
        templateCode: code, sourceId: contract.sourceId,
        status: 'FAIL',
        original: extractStructure(normBuf),
        rendered: { error: 'not rendered (--report-only with no cache)' },
        deltas: {},
        notes: ['Rendered DOCX not available. Run without --report-only.'],
      });
      continue;
    }

    const result = auditOne(code, contract.sourceId, normBuf, rendBuf, allowlist);
    results.push(result);

    if (result.status === 'FAIL') {
      process.stderr.write(`  -> FAIL: ${result.notes.join('; ')}\n`);
    }
  }

  writeReports(results);

  const failCount = results.filter((r) => r.status === 'FAIL').length;
  if (failCount > 0 && !DRY_RUN) {
    process.stderr.write(`\n[F2] ${failCount} FAIL(s) — exiting 1\n`);
    process.exit(1);
  }
};

main();
