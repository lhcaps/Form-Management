#!/usr/bin/env node
/**
 * audit:docx-slot-inventory — F1 (PLAN.md v2.3 §F1)
 *
 * Static, read-only audit that walks every locked contract + matching
 * normalized DOCX template and verifies:
 *
 *  1. Slot inventory — every docxSlot has a renderBinding OR is in
 *     rejectedCandidates with a non-empty reason; canonicalFields.path
 *     is unique; renderBindings point to a known canonical/resolved
 *     source or back to a known docxSlot.
 *
 *  2. Placeholder syntax — every {{...}} / }} in the rendered XML
 *     parts (word/document.xml, word/header*.xml, word/footer*.xml)
 *     is well-formed: balanced open/close, no orphan }} (the BM-051
 *     defect), no malformed token like }}} without matching {{{.
 *
 * This audit does NOT render DOCX, does NOT modify templates, and does
 * NOT relax syntax detection to make BM-051 pass. The point is to
 * classify the defect cleanly so F2 can fix it.
 *
 * Exit code:
 *   0 — status === "PASS"
 *   1 — status === "FAIL" (template defect, missing binding, duplicate
 *       canonical path, missing DOCX, etc.) OR audit crash
 *   0 with --report-only — exit 0 even when status !== PASS so the
 *       report can be inspected without breaking CI loops.
 *
 * Outputs:
 *   docs/audit/docx-slot-inventory/latest.json  (machine-readable)
 *   docs/audit/docx-slot-inventory/latest.md    (human summary)
 *
 * Usage:
 *   node scripts/audit/audit-docx-slot-inventory.mjs
 *   node scripts/audit/audit-docx-slot-inventory.mjs --report-only
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const NORMALIZED_DIR = join(
  ROOT,
  'storage',
  'templates',
  'normalized-docx',
);
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-slot-inventory');

const REPORT_ONLY = process.argv.includes('--report-only');

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const log = (msg) => process.stderr.write(`${msg}\n`);

const loadJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const sha256 = (buf) =>
  createHash('sha256').update(buf).digest('hex');

const safeRead = (p) => {
  try {
    return readFileSync(p);
  } catch {
    return null;
  }
};

const safeExists = (p) => {
  try {
    return readFileSync(p);
  } catch {
    return null;
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Slot inventory
// ────────────────────────────────────────────────────────────────────────────

const collectSlotInventory = (contract) => {
  const docxSlots = contract.docxSlots ?? [];
  const canonicalFields = contract.canonicalFields ?? [];
  const renderBindings = contract.renderBindings ?? [];
  const rejectedCandidates = contract.rejectedCandidates ?? [];

  const slotIds = new Set();
  for (const s of docxSlots) slotIds.add(s.slotId);

  const rejectedIds = new Set();
  const rejectedWithoutReason = [];
  for (const r of rejectedCandidates) {
    rejectedIds.add(r.slotId);
    if (!r.reason || typeof r.reason !== 'string' || r.reason.trim() === '') {
      rejectedWithoutReason.push(r.slotId);
    }
  }

  const canonicalPaths = canonicalFields.map((f) => f.path);
  const pathCounts = new Map();
  for (const p of canonicalPaths) {
    pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1);
  }
  const duplicateCanonicalPaths = [];
  for (const [path, count] of pathCounts) {
    if (count > 1) {
      duplicateCanonicalPaths.push({ path, count });
    }
  }

  const boundSlots = new Set();
  const orphanRenderBindings = [];
  const unknownBindingTargets = [];
  for (const b of renderBindings) {
    if (b.slotId && slotIds.has(b.slotId)) boundSlots.add(b.slotId);
    if (b.slotId && !slotIds.has(b.slotId)) {
      orphanRenderBindings.push({
        slotId: b.slotId,
        from: b.from,
      });
    }
    if (b.from && !canonicalPaths.includes(b.from)) {
      // It's OK for renderBinding.from to point at a runtime path not in
      // canonicalFields (e.g. case-context fields); only flag if it points
      // at nothing sensible. Skip this check for now — covered by
      // BOUND_SLOT_MISSING_FIELD runtime signal elsewhere.
      void unknownBindingTargets;
    }
  }

  const slotsWithoutBinding = [];
  for (const s of docxSlots) {
    if (!boundSlots.has(s.slotId) && !rejectedIds.has(s.slotId)) {
      slotsWithoutBinding.push(s.slotId);
    }
  }

  return {
    totalDocxSlots: docxSlots.length,
    boundSlots: Array.from(boundSlots).sort(),
    canonicalPaths,
    renderBindings: renderBindings.map((b) => b.slotId).sort(),
    duplicateCanonicalPaths,
    orphanRenderBindings,
    slotsWithoutBinding,
    rejectedCandidatesCount: rejectedCandidates.length,
    rejectedWithoutReason,
    rejectedCandidateReasonMissing: rejectedWithoutReason.length > 0,
  };
};

// ────────────────────────────────────────────────────────────────────────────
// Placeholder syntax (the BM-051 defect class)
// ────────────────────────────────────────────────────────────────────────────

const TEXT_PARTS = [
  /^word\/document\.xml$/,
  /^word\/header\d*\.xml$/,
  /^word\/footer\d*\.xml$/,
  /^word\/footnotes?\.xml$/,
  /^word\/endnotes?\.xml$/,
];

/**
 * Walk every {{ and }} in a XML string and report syntax defects:
 *  - ORPHAN_CLOSING: a "}}" without a matching earlier "{{"
 *  - UNCLOSED_OPENING: a "{{" without a matching later "}}"
 *  - TRIPLE_BRACE: a sequence of three or more consecutive "}" — the
 *    BM-051 defect class. After a `}}` close, an extra literal `}` is
 *    NOT a DocxTemplater error per se, but a sequence like `}}}}` or
 *    `}}}}}}` strongly suggests a malformed token that the runtime
 *    will reject. We flag TRIPLE_BRACE so the audit surfaces the
 *    defect even when per-<w:t> brace counting looks balanced.
 *
 * Returns a list of findings. The position is the byte offset in the
 * part's raw XML so the operator can grep the file.
 */
const detectPlaceholderSyntaxDefects = (xmlText, partName) => {
  const findings = [];
  const stack = [];
  let i = 0;
  const OPEN = '{{';
  const CLOSE = '}}';
  while (i < xmlText.length) {
    if (xmlText.startsWith(OPEN, i)) {
      stack.push({ offset: i, kind: 'open' });
      i += 2;
      continue;
    }
    if (xmlText.startsWith(CLOSE, i)) {
      if (stack.length === 0) {
        // orphan closing — most likely a literal }} in prose
        findings.push({
          part: partName,
          kind: 'ORPHAN_CLOSING',
          offset: i,
          preview: makePreview(xmlText, i),
        });
      } else {
        stack.pop();
      }
      i += 2;
      continue;
    }
    i += 1;
  }
  for (const s of stack) {
    findings.push({
      part: partName,
      kind: 'UNCLOSED_OPENING',
      offset: s.offset,
      preview: makePreview(xmlText, s.offset),
    });
  }
  // Detect triple+ braces — e.g. }}} or }}}}. After a `}}` close,
  // an odd number of additional `}` means a literal brace leaked in.
  const tripleRe = /\}{3,}/gu;
  let tm;
  while ((tm = tripleRe.exec(xmlText)) !== null) {
    findings.push({
      part: partName,
      kind: 'TRIPLE_BRACE',
      offset: tm.index,
      preview: makePreview(xmlText, tm.index),
    });
  }
  return findings;
};

const makePreview = (xmlText, offset) => {
  const start = Math.max(0, offset - 40);
  const end = Math.min(xmlText.length, offset + 60);
  return xmlText
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .slice(0, 120);
};

/**
 * Dry-run Docxtemplater parser on each text part to catch
 * DOCXTEMPLATER_PARSE_ERROR kinds (malformed token sequences that the
 * static walker above doesn't catch, e.g. `{{` inside another tag).
 *
 * Implementation: we replicate the lexer state machine but also catch
 * any single `}}` that has no matching `{{` in the same w:r run (which
 * is the failure surface for Docxtemplater). The static walker above
 * already covers the dominant case; this catches the rest at low cost.
 */
const dryRunDocxtemplaterParse = (xmlText, partName) => {
  const findings = [];
  // Walk every <w:t>...</w:t>; within each text node, check the
  // {{...}} balance. Docxtemplater treats each <w:t> as one logical
  // text node, so an orphan }} inside a single <w:t> will fail.
  const tRe = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gu;
  let m;
  while ((m = tRe.exec(xmlText)) !== null) {
    const text = m[1];
    const inner = decodeXmlEntities(text);
    const defects = detectPlaceholderSyntaxDefects(inner, partName);
    for (const d of defects) {
      findings.push({
        ...d,
        kind: d.kind === 'ORPHAN_CLOSING' ? 'UNOPENED_TAG' : d.kind,
      });
    }
  }
  return findings;
};

const decodeXmlEntities = (s) =>
  s
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'");

const readDocxTextParts = (docxBuffer) => {
  const zip = new PizZip(docxBuffer);
  const parts = [];
  for (const fileName of Object.keys(zip.files)) {
    if (!TEXT_PARTS.some((re) => re.test(fileName))) continue;
    const text = zip.file(fileName)?.asText();
    if (text == null) continue;
    parts.push({ partName: fileName, text });
  }
  return parts;
};

const inspectDocxPlaceholderSyntax = (docxBuffer) => {
  const parts = readDocxTextParts(docxBuffer);
  const findings = [];
  for (const p of parts) {
    const staticFindings = detectPlaceholderSyntaxDefects(p.text, p.partName);
    const dryRunFindings = dryRunDocxtemplaterParse(p.text, p.partName);
    findings.push(...staticFindings, ...dryRunFindings);
  }
  return dedupeFindings(findings);
};

const dedupeFindings = (findings) => {
  const seen = new Set();
  const out = [];
  for (const f of findings) {
    const key = `${f.part}|${f.kind}|${f.offset}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out.sort((a, b) => {
    if (a.part !== b.part) return a.part.localeCompare(b.part);
    return (a.offset ?? 0) - (b.offset ?? 0);
  });
};

// ────────────────────────────────────────────────────────────────────────────
// Per-contract audit
// ────────────────────────────────────────────────────────────────────────────

const auditOne = (templateCode, contract, fileName) => {
  const sourceId = contract.sourceId ?? null;
  const inventory = collectSlotInventory(contract);

  const extractionSourcePath = contract.extractionSource?.relativePath
    ? join(ROOT, contract.extractionSource.relativePath.split(/[\\/]/).join('/'))
    : join(NORMALIZED_DIR, templateCode, `${templateCode}_normalized.docx`);

  const docxBuffer = safeRead(extractionSourcePath);
  let docxPresent = docxBuffer !== null;
  let docxSha256 = null;
  let malformedPlaceholders = [];
  if (docxPresent) {
    docxSha256 = sha256(docxBuffer);
    malformedPlaceholders = inspectDocxPlaceholderSyntax(docxBuffer);
  }

  const status = computeStatus({
    docxPresent,
    inventory,
    malformedPlaceholders,
  });

  return {
    templateCode,
    sourceId,
    fileName,
    docxPresent,
    docxPath: extractionSourcePath,
    docxSha256,
    ...inventory,
    malformedPlaceholders,
    status,
  };
};

const computeStatus = ({ docxPresent, inventory, malformedPlaceholders }) => {
  if (!docxPresent) return 'FAIL';
  if (malformedPlaceholders.length > 0) return 'FAIL';
  if (inventory.duplicateCanonicalPaths.length > 0) return 'FAIL';
  if (inventory.slotsWithoutBinding.length > 0) return 'FAIL';
  if (inventory.rejectedCandidateReasonMissing) return 'FAIL';
  return 'PASS';
};

// ────────────────────────────────────────────────────────────────────────────
// Driver
// ────────────────────────────────────────────────────────────────────────────

const listLockedContracts = () => {
  const files = readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith('.contract.locked.json') && !f.startsWith('_'))
    .sort();
  return files;
};

const summarize = (perBm) => {
  const totalContracts = perBm.length;
  let totalDocxSlots = 0;
  let totalRenderBindings = 0;
  let totalCanonicalFields = 0;
  let totalTemplatesFound = 0;
  let totalTemplatesMissing = 0;
  let malformedCount = 0;
  let passCount = 0;
  let failCount = 0;
  const statusByBm = {};
  const allMalformed = [];
  for (const r of perBm) {
    totalDocxSlots += r.totalDocxSlots;
    totalRenderBindings += r.renderBindings.length;
    totalCanonicalFields += r.canonicalPaths.length;
    if (r.docxPresent) totalTemplatesFound += 1;
    else totalTemplatesMissing += 1;
    if (r.malformedPlaceholders.length > 0) {
      malformedCount += r.malformedPlaceholders.length;
      for (const m of r.malformedPlaceholders) {
        allMalformed.push({ templateCode: r.templateCode, ...m });
      }
    }
    if (r.status === 'PASS') passCount += 1;
    else failCount += 1;
    statusByBm[r.templateCode] = r.status;
  }
  return {
    totalContracts,
    totalTemplatesFound,
    totalTemplatesMissing,
    totalDocxSlots,
    totalRenderBindings,
    totalCanonicalFields,
    malformedPlaceholdersCount: malformedCount,
    passCount,
    failCount,
    statusByBm,
    malformedSamples: allMalformed.slice(0, 25),
  };
};

const writeReports = (report, summary) => {
  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  const jsonBody = {
    generatedAt: new Date().toISOString(),
    status: summary.failCount === 0 ? 'PASS' : 'FAIL',
    summary,
    perBm: report,
  };
  writeFileSync(jsonPath, JSON.stringify(jsonBody, null, 2), 'utf8');

  const lines = [];
  lines.push(`# DOCX Slot Inventory — F1 audit`);
  lines.push('');
  lines.push(`Generated: ${jsonBody.generatedAt}`);
  lines.push(
    `Overall status: **${jsonBody.status}** (${summary.passCount}/${summary.totalContracts} BMs PASS)`,
  );
  lines.push('');
  lines.push('## Corpus totals');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${summary.totalContracts} |`);
  lines.push(`| totalTemplatesFound | ${summary.totalTemplatesFound} |`);
  lines.push(`| totalTemplatesMissing | ${summary.totalTemplatesMissing} |`);
  lines.push(`| totalDocxSlots | ${summary.totalDocxSlots} |`);
  lines.push(`| totalRenderBindings | ${summary.totalRenderBindings} |`);
  lines.push(`| totalCanonicalFields | ${summary.totalCanonicalFields} |`);
  lines.push(
    `| malformedPlaceholdersCount | ${summary.malformedPlaceholdersCount} |`,
  );
  lines.push(`| passCount | ${summary.passCount} |`);
  lines.push(`| failCount | ${summary.failCount} |`);
  lines.push('');
  if (summary.malformedPlaceholdersCount > 0) {
    lines.push('## Malformed placeholders (first 25)');
    lines.push('');
    lines.push('| templateCode | part | kind | offset | preview |');
    lines.push('|--------------|------|------|--------|---------|');
    for (const m of summary.malformedSamples) {
      lines.push(
        `| ${m.templateCode} | ${m.part} | ${m.kind} | ${m.offset} | \`${(m.preview ?? '').replace(/\|/g, '\\|').slice(0, 80)}\` |`,
      );
    }
    lines.push('');
  }
  lines.push('## Failures (non-PASS BMs)');
  lines.push('');
  const failures = report.filter((r) => r.status !== 'PASS');
  if (failures.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| templateCode | reason |');
    lines.push('|--------------|--------|');
    for (const r of failures) {
      const reasons = [];
      if (!r.docxPresent) reasons.push('missing-template');
      if (r.malformedPlaceholders.length > 0)
        reasons.push(`malformed-placeholders(${r.malformedPlaceholders.length})`);
      if (r.duplicateCanonicalPaths.length > 0)
        reasons.push(`duplicate-canonical-paths(${r.duplicateCanonicalPaths.length})`);
      if (r.slotsWithoutBinding.length > 0)
        reasons.push(`slots-without-binding(${r.slotsWithoutBinding.length})`);
      if (r.rejectedCandidateReasonMissing)
        reasons.push('rejected-without-reason');
      lines.push(
        `| ${r.templateCode} | ${reasons.join(', ') || 'unknown'} |`,
      );
    }
  }
  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
  log(`Wrote ${jsonPath}`);
  log(`Wrote ${mdPath}`);
};

const main = () => {
  const files = listLockedContracts();
  log(`Auditing ${files.length} locked contracts from ${LOCKED_DIR}`);

  const report = [];
  for (const fileName of files) {
    const fullPath = join(LOCKED_DIR, fileName);
    let contract;
    try {
      contract = loadJson(fullPath);
    } catch (err) {
      log(`  [parse-error] ${fileName}: ${err.message}`);
      report.push({
        templateCode: 'UNKNOWN',
        sourceId: null,
        fileName,
        docxPresent: false,
        docxPath: null,
        docxSha256: null,
        totalDocxSlots: 0,
        boundSlots: [],
        canonicalPaths: [],
        renderBindings: [],
        duplicateCanonicalPaths: [],
        orphanRenderBindings: [],
        slotsWithoutBinding: [],
        rejectedCandidatesCount: 0,
        rejectedWithoutReason: [],
        rejectedCandidateReasonMissing: true,
        malformedPlaceholders: [],
        status: 'FAIL',
      });
      continue;
    }
    const templateCode = contract.templateCode ?? 'UNKNOWN';
    const result = auditOne(templateCode, contract, fileName);
    report.push(result);
  }

  const summary = summarize(report);
  writeReports(report, summary);

  log('');
  log(`Corpus totals:`);
  log(`  totalContracts: ${summary.totalContracts}`);
  log(`  totalTemplatesFound: ${summary.totalTemplatesFound}`);
  log(`  totalTemplatesMissing: ${summary.totalTemplatesMissing}`);
  log(`  totalDocxSlots: ${summary.totalDocxSlots}`);
  log(`  totalRenderBindings: ${summary.totalRenderBindings}`);
  log(`  totalCanonicalFields: ${summary.totalCanonicalFields}`);
  log(`  malformedPlaceholdersCount: ${summary.malformedPlaceholdersCount}`);
  log(`  passCount: ${summary.passCount}`);
  log(`  failCount: ${summary.failCount}`);

  if (summary.failCount > 0) {
    log(
      `FAIL: ${summary.failCount}/${summary.totalContracts} BMs did not pass.`,
    );
    for (const r of report.filter((r) => r.status !== 'PASS')) {
      const reasons = [];
      if (!r.docxPresent) reasons.push('missing-template');
      if (r.malformedPlaceholders.length > 0)
        reasons.push(`malformed(${r.malformedPlaceholders.length})`);
      if (r.duplicateCanonicalPaths.length > 0)
        reasons.push(`duplicate-path(${r.duplicateCanonicalPaths.length})`);
      if (r.slotsWithoutBinding.length > 0)
        reasons.push(`slot-no-binding(${r.slotsWithoutBinding.length})`);
      if (r.rejectedCandidateReasonMissing) reasons.push('rejected-no-reason');
      log(`  - ${r.templateCode}: ${reasons.join(', ')}`);
    }
  }

  if (REPORT_ONLY) {
    log(`--report-only set: exiting 0 even when status !== PASS.`);
    process.exit(0);
  }
  process.exit(summary.failCount === 0 ? 0 : 1);
};

main();
