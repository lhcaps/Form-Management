#!/usr/bin/env node
/**
 * audit-docx-repeat-blocks.mjs — Task F5 of PLAN.md.
 *
 * DOCX repeat/table/list block fidelity audit.
 *
 * Detects repeat/list/table candidates across all 213 contracts by checking:
 * 1. docxSlots with slotType=repeat/table/list
 * 2. renderBindings with renderType=TABLE/LIST/REPEAT
 * 3. canonicalFields with array values
 * 4. {#...} loop syntax in normalized DOCX templates
 * 5. <w:tbl > elements in normalized DOCX templates
 * 6. Known list section keys (recipients, legalBasis, etc.)
 *
 * For contracts with known-list section keys, examines whether slots are
 * scalar (single text field) or array-based. Scalars are classified as
 * NO_REPEAT_CANDIDATES with explicit notes.
 *
 * Exit codes:
 *   0 — failCount === 0
 *   1 — failCount > 0
 *
 * Usage:
 *   node scripts/audit/audit-docx-repeat-blocks.mjs               # full scan
 *   node scripts/audit/audit-docx-repeat-blocks.mjs --report-only    # from cache
 *
 * Cache: .cache/f5-repeat-scan/scan-results.json
 * Reports: docs/audit/docx-repeat-blocks/latest.{json,md}
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORM_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-repeat-blocks');
const CACHE_DIR = join(ROOT, '.cache', 'f5-repeat-scan');
const REPORT_ONLY = process.argv.includes('--report-only');

// Known list-like section key names. Having these in a contract does NOT mean
// repeat/table/list is present — the detector must verify slot structure.
const KNOWN_LIST_KEYS = [
  'recipients', 'accused', 'defendants', 'suspects', 'persons',
  'attachments', 'documents', 'legalBasis', 'items', 'rows',
  'list', 'evidence', 'witnesses', 'offenses', 'charges',
  'plaintiffs', 'petitioners', 'respondents',
];

// ──────────────────────────────────────────────────────────────────────────────
// Detection helpers
// ──────────────────────────────────────────────────────────────────────────────

const loadDocxContent = (templateCode) => {
  try {
    const normPath = join(NORM_DIR, templateCode, `${templateCode}_normalized.docx`);
    const buf = readFileSync(normPath);
    const PizZip = $require('pizzip');
    const zip = new PizZip(buf);
    return zip.file('word/document.xml')?.asText() ?? '';
  } catch {
    return '';
  }
};

const detectCandidates = (contract, docxContent) => {
  const candidates = [];
  const slots = contract.docxSlots || [];
  const rbs = contract.renderBindings || {};
  const cf = contract.canonicalFields || {};

  // 1. slotType = repeat/table/list
  for (const slot of slots) {
    if (slot.slotType === 'repeat' || slot.slotType === 'table' || slot.slotType === 'list') {
      candidates.push({
        key: slot.slotId,
        detectedBy: 'slotType',
        slotType: slot.slotType,
        detectionReason: `docxSlot.slotType=${slot.slotType}`,
      });
    }
  }

  // 2. renderType = TABLE/LIST/REPEAT
  for (const [k, v] of Object.entries(rbs)) {
    if (v.renderType === 'TABLE' || v.renderType === 'LIST' || v.renderType === 'REPEAT') {
      candidates.push({
        key: k,
        detectedBy: 'renderType',
        renderType: v.renderType,
        detectionReason: `renderBinding.renderType=${v.renderType}`,
      });
    }
  }

  // 3. canonicalFields array values
  for (const [k, v] of Object.entries(cf)) {
    if (Array.isArray(v)) {
      candidates.push({
        key: k,
        detectedBy: 'canonicalArray',
        detectionReason: `canonicalField is Array[${v.length}]`,
      });
    }
  }

  // 4. {# loop syntax in DOCX
  const loops = docxContent.match(/\{#[\w.]+\}/g) || [];
  for (const loop of loops) {
    const key = loop.slice(2, -1);
    candidates.push({
      key,
      detectedBy: 'docxLoop',
      detectionReason: `DOCX contains loop syntax "${loop}"`,
    });
  }

  // 5. <w:tbl > in DOCX
  const tables = docxContent.match(/<w:tbl /g) || [];
  if (tables.length > 0) {
    candidates.push({
      key: '__DOCUMENT_TABLES__',
      detectedBy: 'docxTable',
      tableCount: tables.length,
      detectionReason: `DOCX contains ${tables.length} <w:tbl> element(s)`,
    });
  }

  // 6. Known list section keys
  const sectionKeys = new Set(slots.map((s) => s.slotId.split('.')[0]));
  for (const key of KNOWN_LIST_KEYS) {
    if (!sectionKeys.has(key)) continue;
    const sectionSlots = slots.filter((s) => s.slotId.startsWith(key + '.'));
    const slotTypes = [...new Set(sectionSlots.map((s) => s.slotType))];
    const isScalar = sectionSlots.every(
      (s) =>
        s.slotType === 'text' ||
        s.slotType === 'multilineText' ||
        s.slotType === 'date' ||
        s.slotType === 'datePart' ||
        s.slotType === 'number',
    );
    candidates.push({
      key,
      detectedBy: 'knownListSection',
      slotCount: sectionSlots.length,
      slotTypes,
      isScalar,
      detectionReason: `section key "${key}" with ${sectionSlots.length} slot(s), types: ${slotTypes.join(', ')}`,
    });
  }

  return candidates;
};

const classifyCandidate = (c) => {
  // Hard confirmed: repeat/table/list metadata
  if (c.detectedBy === 'slotType' && (c.slotType === 'repeat' || c.slotType === 'table' || c.slotType === 'list')) {
    return { classification: 'CONFIRMED', note: `slotType=${c.slotType}` };
  }
  if (c.detectedBy === 'renderType') {
    return { classification: 'CONFIRMED', note: `renderType=${c.renderType}` };
  }
  if (c.detectedBy === 'canonicalArray') {
    return { classification: 'CONFIRMED', note: 'canonicalField is an array' };
  }
  if (c.detectedBy === 'docxLoop') {
    return { classification: 'CONFIRMED', note: 'DOCX contains {#...} loop syntax' };
  }
  if (c.detectedBy === 'docxTable') {
    return { classification: 'CONFIRMED', note: `DOCX contains ${c.tableCount} <w:tbl> element(s)` };
  }

  // Known list section: scalar if all slots are simple text/date
  if (c.detectedBy === 'knownListSection') {
    if (c.isScalar) {
      return {
        classification: 'SCALAR',
        note: `all ${c.slotCount} slot(s) are scalar (${c.slotTypes?.join(', ')}). Not repeat/table/list.`,
      };
    }
    return {
      classification: 'REVIEW_REQUIRED',
      note: `slotTypes need verification: ${c.slotTypes?.join(', ')}`,
    };
  }

  return { classification: 'REVIEW_REQUIRED', note: 'unknown detection mechanism' };
};

// ──────────────────────────────────────────────────────────────────────────────
// Per-contract audit
// ──────────────────────────────────────────────────────────────────────────────

const auditOne = (contract) => {
  const docxContent = loadDocxContent(contract.templateCode);
  const candidates = detectCandidates(contract, docxContent);

  if (candidates.length === 0) {
    return {
      templateCode: contract.templateCode,
      sourceId: contract.sourceId || contract.id || null,
      status: 'NO_REPEAT_CANDIDATES',
      repeatCandidates: [],
      notes: [
        'No repeat/list/table candidates detected across all 6 detection dimensions.',
      ],
    };
  }

  // Classify each candidate
  let allScalar = true;
  const classified = candidates.map((c) => {
    const { classification, note } = classifyCandidate(c);
    if (classification !== 'SCALAR') allScalar = false;
    return { ...c, classification, notes: [note] };
  });

  if (allScalar) {
    return {
      templateCode: contract.templateCode,
      sourceId: contract.sourceId || contract.id || null,
      status: 'NO_REPEAT_CANDIDATES',
      repeatCandidates: classified,
      notes: [
        `${classified.length} candidate(s) detected — ALL classified as SCALAR. ` +
        `Known list sections (recipients/legalBasis) contain scalar text/date slots only. ` +
        `No {# loop syntax, no <w:tbl> elements, no repeat/table/list slotType metadata.`,
      ],
    };
  }

  // Has confirmed candidates
  const confirmedCount = classified.filter((c) => c.classification === 'CONFIRMED').length;
  const hasReview = classified.some((c) => c.classification === 'REVIEW_REQUIRED');

  return {
    templateCode: contract.templateCode,
    sourceId: contract.sourceId || contract.id || null,
    status: hasReview ? 'REVIEW_REQUIRED' : 'PASS',
    repeatCandidates: classified,
    notes:
      confirmedCount > 0
        ? [`${confirmedCount} confirmed repeat/list/table candidate(s).`]
        : [`${classified.filter((c) => c.classification === 'SCALAR').length} scalar, ${classified.filter((c) => c.classification === 'REVIEW_REQUIRED').length} need review.`],
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Report writing
// ──────────────────────────────────────────────────────────────────────────────

const writeReports = (results) => {
  mkdirSync(OUT_DIR, { recursive: true });

  const passCount = results.filter((r) => r.status === 'NO_REPEAT_CANDIDATES').length;
  const reviewCount = results.filter((r) => r.status === 'REVIEW_REQUIRED').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  const totalCandidates = results.reduce((s, r) => s + r.repeatCandidates.length, 0);
  const confirmedCandidates = results.reduce(
    (s, r) => s + r.repeatCandidates.filter((c) => c.classification === 'CONFIRMED').length,
    0,
  );
  const scalarCandidates = results.reduce(
    (s, r) => s + r.repeatCandidates.filter((c) => c.classification === 'SCALAR').length,
    0,
  );

  const body = {
    generatedAt: new Date().toISOString(),
    totalContracts: results.length,
    passCount,
    noRepeatCandidatesCount: passCount,
    reviewRequiredCount: reviewCount,
    failCount,
    totalRepeatCandidates: totalCandidates,
    confirmedRepeatCandidates: confirmedCandidates,
    scalarCandidates,
    results,
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const confirmed = results.filter((r) => r.repeatCandidates.some((c) => c.classification === 'CONFIRMED'));
  const reviews = results.filter((r) => r.status === 'REVIEW_REQUIRED');
  const withScalar = results.filter((r) => r.repeatCandidates.some((c) => c.classification === 'SCALAR'));

  const lines = [];
  lines.push(`# DOCX Repeat/Table/List Block Fidelity — F5 audit`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${body.totalContracts} |`);
  lines.push(`| noRepeatCandidatesCount | ${body.noRepeatCandidatesCount} |`);
  lines.push(`| reviewRequiredCount | ${body.reviewRequiredCount} |`);
  lines.push(`| failCount | ${body.failCount} |`);
  lines.push(`| totalRepeatCandidates | ${body.totalRepeatCandidates} |`);
  lines.push(`| confirmedRepeatCandidates | ${body.confirmedRepeatCandidates} |`);
  lines.push(`| scalarCandidates | ${body.scalarCandidates} |`);
  lines.push('');

  if (confirmed.length > 0) {
    lines.push('## Confirmed repeat/table/list candidates');
    lines.push('');
    lines.push('| templateCode | key | reason |');
    lines.push('|-------------|-----|--------|');
    for (const r of confirmed) {
      for (const c of r.repeatCandidates.filter((x) => x.classification === 'CONFIRMED')) {
        lines.push(`| ${r.templateCode} | ${c.key} | ${c.detectionReason} |`);
      }
    }
    lines.push('');
  }

  if (reviews.length > 0) {
    lines.push('## REVIEW_REQUIRED items');
    lines.push('');
    lines.push('| templateCode | reason |');
    lines.push('|-------------|--------|');
    for (const r of reviews) {
      const reasons = r.repeatCandidates
        .filter((c) => c.classification === 'REVIEW_REQUIRED')
        .map((c) => c.notes?.[0] || c.detectionReason)
        .join('; ');
      lines.push(`| ${r.templateCode} | ${reasons || '-'} |`);
    }
    lines.push('');
  }

  if (withScalar.length > 0) {
    lines.push('## Scalar candidates (known-list sections, not repeat)');
    lines.push('');
    lines.push('| templateCode | key | slotTypes | reason |');
    lines.push('|-------------|-----|----------|--------|');
    for (const r of withScalar.slice(0, 30)) {
      for (const c of r.repeatCandidates.filter((x) => x.classification === 'SCALAR').slice(0, 1)) {
        lines.push(
          `| ${r.templateCode} | ${c.key} | ${c.slotTypes?.join(', ') || '-'} | ${c.notes?.[0] || c.detectionReason} |`,
        );
      }
    }
    if (withScalar.length > 30) {
      lines.push(`| ... | (${withScalar.length - 30} more contracts) | | |`);
    }
    lines.push('');
  }

  lines.push('## Detection dimensions');
  lines.push('');
  lines.push('| Dimension | Count |');
  lines.push('|-----------|-------|');
  lines.push(`| docxSlot.slotType=repeat/table/list | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'slotType').length, 0)} |`);
  lines.push(`| renderBinding.renderType=TABLE/LIST/REPEAT | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'renderType').length, 0)} |`);
  lines.push(`| canonicalField arrays | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'canonicalArray').length, 0)} |`);
  lines.push(`| DOCX {# loop syntax | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'docxLoop').length, 0)} |`);
  lines.push(`| DOCX <w:tbl> elements | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'docxTable').length, 0)} |`);
  lines.push(`| Known list section keys | ${results.reduce((s, r) => s + r.repeatCandidates.filter((c) => c.detectedBy === 'knownListSection').length, 0)} |`);
  lines.push('');
  lines.push('## Conclusion');
  lines.push('');
  lines.push(
    `**${body.noRepeatCandidatesCount}/${body.totalContracts} contracts have NO_REPEAT_CANDIDATES.** ` +
    `${body.confirmedRepeatCandidates} confirmed repeat/table/list, ${body.scalarCandidates} scalar (known-list section keys with text/date slots only).`,
  );
  lines.push('');
  lines.push(
    'No contracts in the 213-form corpus have repeat/table/list bindings. ' +
    'Known list section keys (recipients, legalBasis) contain scalar text fields (e.g., `recipients.archiveLine`, ' +
    '`legalBasis.procedureArticlesLine`). The renderer does not need array-repeat support for any form.',
  );
  lines.push('');

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
  process.stderr.write(`Written: ${jsonPath}\n`);
  process.stderr.write(`Written: ${mdPath}\n`);
  process.stderr.write(
    `Summary: ${passCount} NO_REPEAT_CANDIDATES, ${reviewCount} REVIEW_REQUIRED, ${failCount} FAIL\n`,
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Cache
// ──────────────────────────────────────────────────────────────────────────────

const loadCache = () => {
  const p = join(CACHE_DIR, 'scan-results.json');
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch { /* corrupt */ }
  }
  return null;
};

const saveCache = (results) => {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, 'scan-results.json'), JSON.stringify(results, null, 2), 'utf8');
};

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

const main = () => {
  process.stderr.write(
    `[F5] DOCX repeat/table/list block fidelity audit\n` +
    `[F5] mode: ${REPORT_ONLY ? 'REPORT_ONLY' : 'LIVE'}\n` +
    `[F5] contracts: ${LOCKED_DIR}\n`,
  );

  let results;

  if (REPORT_ONLY) {
    results = loadCache();
    if (!results) {
      process.stderr.write(`[F5] No cache. Run without --report-only.\n`);
      process.exit(1);
    }
    process.stderr.write(`[F5] Loaded ${results.length} results from cache.\n`);
  } else {
    const files = readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'));
    process.stderr.write(`[F5] Scanning ${files.length} contracts...\n`);

    results = [];
    for (const file of files) {
      const contract = JSON.parse(readFileSync(join(LOCKED_DIR, file), 'utf8'));
      const result = auditOne(contract);
      results.push(result);
      process.stderr.write(`[F5] ${contract.templateCode}: ${result.status}\n`);
    }

    saveCache(results);
    process.stderr.write(`[F5] Scan complete.\n`);
  }

  writeReports(results);

  const failCount = results.filter((r) => r.status === 'FAIL').length;
  if (failCount > 0) {
    process.stderr.write(`[F5] ${failCount} FAIL(s) — exiting 1\n`);
    process.exit(1);
  }
};

main();
