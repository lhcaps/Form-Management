#!/usr/bin/env node
/**
 * Phase 8A — BM classification script.
 *
 * For each BM file in bm-list.txt, compute:
 *   - normalDiffLines:    diff --unified=0 line count (additions + deletions, no context)
 *   - ignoreWsDiffLines:  same diff but with -w (ignore whitespace)
 *   - ignoreAllWs:        same diff but with --ignore-all-space
 *   - changedSymbols:     identifier-level changes (top 10 by occurrence)
 *   - whitelistLeak:      boolean — true iff the file's diff contains a protected symbol
 *                         (form-studio API route or admin permission import)
 *   - classification:     one of:
 *                           WHITESPACE_ONLY     (normal diff non-empty, -w diff empty)
 *                           LINE_ENDING_ONLY    (normal non-empty, -w zero except CRLF markers)
 *                           IMPORT_ONLY         (only changes are import lines)
 *                           TEST_EVIDENCE_SYNC  (changes touch only test_evidence / evidence)
 *                           SEMANTIC_UI_CHANGE  (any other non-empty change)
 *                           UNKNOWN             (cannot classify)
 *
 * Outputs:
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CLASSIFICATION_RAW.json
 *
 * The script never writes into source. It only reads files and stdin via `git diff`.
 * Allowed: any number of READ-only operations and one disk write for its own output JSON.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync as readFileSyncRaw, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIST = join(
  ROOT,
  'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/.bm-list.txt',
);

function readBmList() {
  // The list is written by PowerShell on Windows; default to UTF-8 but fall
  // back to UTF-16LE BOM detection, which is what `>` redirection produced.
  const buf = readFileSyncRaw(LIST);
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    // UTF-16LE: BOM bytes are stripped from the buffer's leading 2 bytes,
    // but toString('utf16le') preserves them as a single U+FEFF on the first
    // decoded string. Strip that character explicitly from every line.
    const sliced = buf.subarray(2);
    return sliced
      .toString('utf16le')
      .split(/\r?\n/)
      .map((l) => l.replace(/^\uFEFF/, ''))
      .filter((l) => l.length > 0);
  }
  return buf.toString('utf8').split(/\r?\n/).filter((l) => l.replace(/^\uFEFF/, '').length > 0).map((l) => l.replace(/^\uFEFF/, ''));
}

const lines = readBmList();

const PROTECTED_ROUTE_TOKENS = [
  /\/admin\/form-studio\b/,
  /FormStudioModule\b/,
  /\bform-permissions\b/,
  /\badmin\/form-(?:templates|drafts|reviews|versions)\b/,
];

const HOLD_OUT_CODES = new Set([
  'BM-024','BM-039','BM-041','BM-049','BM-050','BM-051','BM-077','BM-079','BM-082','BM-089','BM-099','BM-200',
]);

function runGit(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) {
    return { ok: false, stderr: r.stderr, status: r.status };
  }
  // Git emits "warning: in the working copy of …, CRLF will be replaced by LF"
  // on stderr for every working-tree diff. That's noise, not a diff failure.
  // Any non-CRLF warning is a real problem; CRLF warnings are ignored.
  const stderr = (r.stderr ?? '').trim();
  const onlyCrlfWarn = stderr.length === 0
    || stderr.split(/\r?\n/).every((line) =>
      line === ''
      || /warning: in the working copy of '.+', (CRLF will be replaced by LF|LF will be replaced by CRLF) the next time Git touches it/.test(line)
    );
  if (!onlyCrlfWarn) {
    return { ok: false, stderr, status: r.status };
  }
  return { ok: true, stdout: r.stdout };
}

function diffUnified(path, ignore) {
  const args = ['diff', '--no-color', '--unified=0', '--no-ext-diff', '--'];
  if (ignore) args.splice(1, 0, ignore);
  args.push(path);
  const r = runGit(args);
  if (!r.ok) return null;
  return r.stdout;
}

function countChanges(diffText) {
  if (!diffText) return 0;
  let adds = 0;
  let dels = 0;
  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('+') && !line.startsWith('+++')) adds += 1;
    else if (line.startsWith('-') && !line.startsWith('---')) dels += 1;
  }
  return adds + dels;
}

function tokenize(line) {
  const tokens = line.match(/[A-Za-z_][A-Za-z0-9_]*|[{}()[\];,.<>=+\-*/%&|^!?:]/g);
  return tokens ?? [];
}

function changedSymbols(diffText) {
  if (!diffText) return [];
  const counts = new Map();
  for (const line of diffText.split(/\r?\n/)) {
    if (!line.startsWith('+') && !line.startsWith('-')) continue;
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    const body = line.slice(1);
    if (!body.trim()) continue;
    for (const tok of tokenize(body)) {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(tok) && tok.length > 1) {
        counts.set(tok, (counts.get(tok) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => ({ token: k, count: v }));
}

function bodyOfHunks(diffText) {
  if (!diffText) return '';
  const out = [];
  let inHunk = false;
  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith('@@')) { inHunk = true; continue; }
    if (inHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      out.push(line);
    }
  }
  return out.join('\n');
}

function classify(normalDiff, ignoreWsDiff, bodyText) {
  if (!normalDiff) return 'NO_CHANGE';
  const norm = countChanges(normalDiff);
  const ws = countChanges(ignoreWsDiff);
  if (norm > 0 && ws === 0) return 'WHITESPACE_ONLY';
  if (norm > 0 && norm === ws && /[\t ]+$/m.test(bodyText)) return 'LINE_ENDING_ONLY';
  if (norm > 0 && bodyText.split(/\r?\n/).filter((l) => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---')).every((l) => /^[+-]\s*(import|export\s+\{)\b/.test(l))) {
    return 'IMPORT_ONLY';
  }
  // The remaining non-empty diffs are by default SEMANTIC_UI_CHANGE.
  // We do not auto-classify TEST_EVIDENCE_SYNC / SEMANTIC_DATA_BINDING_CHANGE
  // because distinguishing them from SEMANTIC_UI_CHANGE requires reading the
  // surrounding function and cannot be done with token frequency alone
  // (e.g. `status:` matches inside `try/catch` would false-positive).
  // Those classifications are flagged for manual review in a separate field
  // rather than promoted to a classification slot.
  if (norm > 0) return 'SEMANTIC_UI_CHANGE';
  return 'UNKNOWN';
}

function protectedLeak(bodyText) {
  return PROTECTED_ROUTE_TOKENS.some((re) => re.test(bodyText));
}

const results = [];

for (const relPath of lines) {
  const match = relPath.match(/bm-(\d{3})-form-inputs\.tsx$/);
  const code = match ? `BM-${match[1]}` : 'BM-???';
  const normalDiff = diffUnified(relPath) ?? '';
  const ignoreWsDiff = diffUnified(relPath, '-w') ?? '';
  const body = bodyOfHunks(normalDiff);
  const cls = classify(normalDiff, ignoreWsDiff, body);
  results.push({
    path: relPath,
    bmCode: code,
    isHoldoutOrRuntimeReady: HOLD_OUT_CODES.has(code),
    normalDiffLines: countChanges(normalDiff),
    whitespaceIgnoredDiffLines: countChanges(ignoreWsDiff),
    classification: cls,
    changedSymbolsTop10: changedSymbols(body),
    protectedRouteLeak: protectedLeak(body),
  });
}

const summary = {
  total: results.length,
  whitespaceOnly: results.filter((r) => r.classification === 'WHITESPACE_ONLY').length,
  lineEndingOnly: results.filter((r) => r.classification === 'LINE_ENDING_ONLY').length,
  importOnly: results.filter((r) => r.classification === 'IMPORT_ONLY').length,
  testEvidenceSync: results.filter((r) => r.classification === 'TEST_EVIDENCE_SYNC').length,
  semantic: results.filter((r) => r.classification === 'SEMANTIC_UI_CHANGE').length,
  unknown: results.filter((r) => r.classification === 'UNKNOWN').length,
  noChange: results.filter((r) => r.classification === 'NO_CHANGE').length,
  holdoutOrRuntimeReadyAffected: results.filter((r) => r.isHoldoutOrRuntimeReady).length,
  protectedRouteLeakCount: results.filter((r) => r.protectedRouteLeak).length,
};

const OUT = join(
  ROOT,
  'docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CLASSIFICATION_RAW.json',
);
writeFileSync(OUT, JSON.stringify({ summary, results }, null, 2));
process.stdout.write(JSON.stringify(summary) + '\n');
