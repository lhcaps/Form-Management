#!/usr/bin/env node
/**
 * Phase 8A — Backfill jest summary fields in the seq-* summary files.
 *
 * After the fix to summarizeJest() to read both stdout and stderr, the already-
 * captured seq-a/b/c/d.json records have `suiteLine: null` / `testLine: null`
 * because the original writers used the old version. This backfill reads the
 * per-run stderr.txt that the harness preserved unfiltered and re-extracts.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOG_DIR = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');

function summarize(stdout, stderr) {
  const combined = `${stdout}\n${stderr}`;
  const out = { suiteLine: null, testLine: null };
  for (const line of combined.split(/\r?\n/)) {
    const m = line.match(/^(Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites\.)\s*(.*)$/);
    if (m) {
      if (m[1].startsWith('Test Suites')) out.suiteLine = `${m[1]} ${m[2]}`.trim();
      else if (m[1].startsWith('Tests')) out.testLine = `${m[1]} ${m[2]}`.trim();
    }
  }
  return out;
}

function backfill(file) {
  const data = JSON.parse(readFileSync(join(LOG_DIR, file), 'utf8'));
  let updated = false;
  function fix(rec) {
    if (!rec) return;
    let stderrText = '';
    if (rec.stderrPath && typeof rec.stderrPath === 'string') {
      try {
        stderrText = readFileSync(rec.stderrPath, 'utf8');
      } catch { /* missing file */ }
    }
    let stdoutText = '';
    if (rec.stdoutPath && typeof rec.stdoutPath === 'string') {
      try {
        stdoutText = readFileSync(rec.stdoutPath, 'utf8');
      } catch { /* missing file */ }
    }
    const s = summarize(stdoutText, stderrText);
    if (rec.suiteLine == null && s.suiteLine) { rec.suiteLine = s.suiteLine; updated = true; }
    if (rec.testLine == null && s.testLine) { rec.testLine = s.testLine; updated = true; }
  }
  if (Array.isArray(data.runs)) {
    for (const r of data.runs) fix(r);
  }
  if (Array.isArray(data.cycles)) {
    for (const c of data.cycles) {
      if (c.api) fix(c.api);
    }
  }
  if (data.combined) fix(data.combined);
  if (updated) {
    writeFileSync(join(LOG_DIR, file), JSON.stringify(data, null, 2));
  }
  return { file, updated };
}

const results = [];
for (const name of readdirSync(LOG_DIR)) {
  if (/^seq-[a-d]-summary\.json$/.test(name)) {
    results.push(backfill(name));
  }
}

console.log(JSON.stringify(results, null, 2));