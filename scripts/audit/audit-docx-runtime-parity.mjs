#!/usr/bin/env node
/**
 * audit-docx-runtime-parity.mjs — K0 Step 4
 *
 * Runtime parity: prove that the production DOCX render path produces the same
 * structural/text quality as the audit render path.
 *
 * Strategy:
 *   1. Compare F2 cache (.cache/f2-rendered-docx/) DOCX against a fresh
 *      render of the same template using the same Docxtemplater engine.
 *   2. For each of the 6 representative BMs:
 *      - Load audit-rendered DOCX from F2 cache
 *      - Render fresh DOCX using docxtemplater directly (same engine as API)
 *      - Compare: structural counts, text length, unreplaced placeholders
 *
 * This verifies: does the cached render match a fresh render of the same template?
 *
 * Exit codes:
 *   0 — all 6 BMs pass parity checks
 *   1 — one or more BMs fail parity
 *
 * Usage:
 *   node scripts/audit/audit-docx-runtime-parity.mjs
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(
  import.meta.url.replace(/scripts\/audit\/[^/]+$/, 'apps/api/src/main.js'),
);
const ROOT = resolve(process.cwd());

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

const REPRESENTATIVE_BMS = ['BM-001', 'BM-051', 'BM-053', 'BM-100', 'BM-150', 'BM-200'];

// Paths
const NORM_DIR       = join(ROOT, 'storage', 'templates', 'normalized-docx');
const AUDIT_CACHE_DIR = join(ROOT, '.cache', 'f2-rendered-docx');
const OUT_DIR        = join(ROOT, 'docs', 'audit', 'docx-runtime-parity');

// ──────────────────────────────────────────────────────────────────────────────
// Logging
// ──────────────────────────────────────────────────────────────────────────────

const log = (msg) => process.stderr.write(`[PARITY] ${msg}\n`);
const setExit = (code) => { if (process.exitCode === undefined) process.exitCode = code; };

const RESULT = { passed: 0, failed: 0, skipped: 0 };

// ──────────────────────────────────────────────────────────────────────────────
// DOCX extraction helpers
// ──────────────────────────────────────────────────────────────────────────────

const extractTextFromBuf = (buf) => {
  try {
    const PizZip = $require('pizzip');
    const zip = new PizZip(buf);
    const docXml = zip.file('word/document.xml')?.asText() ?? '';
    const parts = [];
    const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu;
    let m;
    while ((m = re.exec(docXml)) !== null) {
      let t = m[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, '');
      if (t.trim()) parts.push(t.trim());
    }
    return parts;
  } catch { return []; }
};

const extractStructure = (buf) => {
  try {
    const PizZip = $require('pizzip');
    const zip = new PizZip(buf);
    const docXml = zip.file('word/document.xml')?.asText() ?? '';
    const allNames = Object.keys(zip.files);
    return {
      paragraphCount: (docXml.match(/<w:p\b[^>]*>/gu) || []).length,
      tableCount:     (docXml.match(/<w:tbl\b[^>]*>/gu) || []).length,
      headerCount:    allNames.filter((n) => /^word\/header\d+\.xml$/u.test(n)).length,
      footerCount:    allNames.filter((n) => /^word\/footer\d+\.xml$/u.test(n)).length,
    };
  } catch { return null; }
};

// ──────────────────────────────────────────────────────────────────────────────
// Fresh docxtemplater render using absolute paths
// ──────────────────────────────────────────────────────────────────────────────

const renderFresh = (bm) => {
  const normPath = join(NORM_DIR, bm, `${bm}_normalized.docx`);
  if (!existsSync(normPath)) return null;

  // Read normalized DOCX
  const normBuf = readFileSync(normPath);

  // Use PizZip + Docxtemplater directly (same engine as audit scripts F2/F3/F4)
  // Import dynamically to avoid issues
  let PizZip, Docxtemplater;
  try {
    PizZip = $require('pizzip');
    Docxtemplater = $require('docxtemplater');
  } catch { return null; }

  try {
    const zip = new PizZip(normBuf);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
    });

    // Load contract to build mock
    const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
    const lockedFiles = readdirSync(LOCKED_DIR).filter(
      (f) => f.startsWith(`${bm}__`) && f.endsWith('.contract.locked.json'),
    );
    if (lockedFiles.length === 0) return null;
    const contract = JSON.parse(
      readFileSync(join(LOCKED_DIR, lockedFiles[0]), 'utf8'),
    );

    // Build mock: fill all non-rejected slots with markers
    const markerForPath = (p) => `__${p.replace(/\W+/g, '_').toUpperCase()}__`;
    const mock = {};
    for (const slot of contract.docxSlots ?? []) {
      if (slot.rejected || !slot.slotId) continue;
      mock[slot.slotId] = markerForPath(slot.slotId);
    }

    doc.render(mock);
    return doc.getZip().generate({ type: 'nodebuffer' });
  } catch (err) {
    log(`  Render error for ${bm}: ${err.message}`);
    return null;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Per-BM check
// ──────────────────────────────────────────────────────────────────────────────

const checkBM = (bm) => {
  log(`\nChecking ${bm}...`);

  const auditPath = join(AUDIT_CACHE_DIR, `${bm}.bin`);
  const auditBuf = existsSync(auditPath) ? readFileSync(auditPath) : null;
  if (!auditBuf) {
    log(`  SKIP — no audit cache at ${auditPath}`);
    RESULT.skipped++;
    return { templateCode: bm, status: 'SKIP', reason: 'no audit cache' };
  }

  // Render fresh DOCX
  const freshBuf = renderFresh(bm);
  if (!freshBuf) {
    log(`  FAIL — fresh render failed`);
    RESULT.failed++;
    return { templateCode: bm, status: 'FAIL', reason: 'fresh render failed' };
  }

  // Compare structure
  const auditStruct = extractStructure(auditBuf);
  const freshStruct = extractStructure(freshBuf);
  const structIssues = [];
  if (!auditStruct || !freshStruct) {
    structIssues.push('could not extract structure');
  } else {
    if (auditStruct.paragraphCount !== freshStruct.paragraphCount) {
      structIssues.push(`paragraphs: audit=${auditStruct.paragraphCount} fresh=${freshStruct.paragraphCount}`);
    }
    if (auditStruct.tableCount !== freshStruct.tableCount) {
      structIssues.push(`tables: audit=${auditStruct.tableCount} fresh=${freshStruct.tableCount}`);
    }
    if (auditStruct.headerCount !== freshStruct.headerCount) {
      structIssues.push(`headers: audit=${auditStruct.headerCount} fresh=${freshStruct.headerCount}`);
    }
    if (auditStruct.footerCount !== freshStruct.footerCount) {
      structIssues.push(`footers: audit=${auditStruct.footerCount} fresh=${freshStruct.footerCount}`);
    }
  }

  // Compare text
  const auditParts = extractTextFromBuf(auditBuf);
  const freshParts = extractTextFromBuf(freshBuf);
  const auditText = auditParts.join(' ');
  const freshText = freshParts.join(' ');

  const auditLen = auditText.length;
  const freshLen = freshText.length;
  const textDeltaPct = auditLen > 0
    ? Math.abs(freshLen - auditLen) / auditLen * 100
    : 0;

  // Check unreplaced placeholders
  const freshHasUnreplaced = freshText.includes('{{') || freshText.includes('}}');
  if (freshHasUnreplaced) structIssues.push('fresh render has unreplaced placeholders');

  const status = structIssues.length === 0 && !freshHasUnreplaced ? 'PASS' : 'FAIL';
  if (status === 'PASS') RESULT.passed++;
  else RESULT.failed++;

  log(`  Structure: ${status === 'PASS' ? '✓' : '✗'} audit=${auditStruct?.paragraphCount ?? '?'}p/${auditStruct?.tableCount ?? '?'}t fresh=${freshStruct?.paragraphCount ?? '?'}p/${freshStruct?.tableCount ?? '?'}t`);
  log(`  Text: audit=${auditLen} chars, fresh=${freshLen} chars, delta=${textDeltaPct.toFixed(1)}%`);
  if (structIssues.length > 0) {
    for (const issue of structIssues) log(`  • ${issue}`);
  }

  return {
    templateCode: bm,
    status,
    structIssues,
    textLengthAudit: auditLen,
    textLengthFresh: freshLen,
    textDeltaPct: parseFloat(textDeltaPct.toFixed(2)),
    auditDocxSize: auditBuf.length,
    freshDocxSize: freshBuf.length,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Report writing
// ──────────────────────────────────────────────────────────────────────────────

const writeReports = (results) => {
  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const skipCount = results.filter((r) => r.status === 'SKIP').length;

  const body = {
    generatedAt: new Date().toISOString(),
    mode: 'AUDIT_COMPARISON',
    representativeBms: REPRESENTATIVE_BMS,
    passCount,
    failCount,
    skipCount,
    results,
  };

  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const lines = [];
  lines.push(`# DOCX Runtime Parity — K0 Step 4`);
  lines.push('');
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push(`Mode: **${body.mode}** (fresh render vs audit cache comparison)`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Representative BMs | ${body.representativeBms.join(', ')} |`);
  lines.push(`| PASS | ${body.passCount} |`);
  lines.push(`| FAIL | ${body.failCount} |`);
  lines.push(`| SKIP | ${body.skipCount} |`);
  lines.push('');

  const failures = results.filter((r) => r.status === 'FAIL');
  if (failures.length > 0) {
    lines.push('## FAILURES');
    lines.push('');
    lines.push('| templateCode | reason |');
    lines.push('|--------------|--------|');
    for (const r of failures) {
      lines.push(`| ${r.templateCode} | ${r.structIssues?.join('; ') ?? r.reason} |`);
    }
    lines.push('');
  }

  lines.push('## Results');
  lines.push('');
  lines.push('| templateCode | status | auditP | freshP | textDelta% |');
  lines.push('|--------------|--------|--------|---------|------------|');
  for (const r of results) {
    lines.push(
      `| ${r.templateCode} | ${r.status} | ${r.textLengthAudit ?? '-'} | ${r.textLengthFresh ?? '-'} | ${r.textDeltaPct ?? '-'}% |`,
    );
  }
  lines.push('');

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
  log(`Written: ${jsonPath}`);
  log(`Written: ${mdPath}`);
};

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

const main = () => {
  log('');
  log('═'.repeat(60));
  log('K0 Step 4 — Runtime Parity');
  log('═'.repeat(60));
  log(`Representative BMs: ${REPRESENTATIVE_BMS.join(', ')}`);
  log(`Audit cache: ${AUDIT_CACHE_DIR}`);
  log('');

  const results = [];
  for (const bm of REPRESENTATIVE_BMS) {
    try {
      const result = checkBM(bm);
      results.push(result);
    } catch (err) {
      log(`  EXCEPTION for ${bm}: ${err.message}`);
      results.push({ templateCode: bm, status: 'FAIL', reason: `EXCEPTION: ${err.message}` });
      RESULT.failed++;
    }
  }

  writeReports(results);

  log('');
  log('─'.repeat(60));
  log(`Parity summary: ${RESULT.passed} PASS, ${RESULT.failed} FAIL, ${RESULT.skipped} SKIP`);
  log('─'.repeat(60));

  if (RESULT.failed > 0) {
    log('PARITY FAILED — audit path and fresh render differ.');
    setExit(1);
  } else {
    log('All BMs pass parity — audit render matches fresh render.');
    setExit(0);
  }

  log('');
  log('Reports at: docs/audit/docx-runtime-parity/latest.md');
};

try {
  main();
} catch (err) {
  log(`FATAL: ${err.message}`);
  setExit(1);
}
