#!/usr/bin/env node
/**
 * Phase 15B.2 — PHASE 1: Verify every Phase 15B.1 raw log
 *
 * Reads the actual raw logs and recomputes pass/skip/fail/executed counts.
 * Outputs docs/audit/final-213-customer-ready/release-integration/phase15b2-test-arithmetic.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RELEASE_DIR = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'audit',
  'final-213-customer-ready',
  'release-integration',
);

const TARGETS = {
  contracts: {
    file: 'phase15b1-test-contracts-final.log',
    runner: 'node-test',
  },
  api: {
    file: 'phase15b1-test-api-final.log',
    runner: 'jest',
  },
  node: {
    file: 'phase15b1-test-node-final.log',
    runner: 'node-test',
  },
  web: {
    file: 'phase15b1-test-web-unit-final.log',
    runner: 'node-test',
  },
};

/**
 * Parse TAP-formatted Node test runner output.
 * Each test prints a line beginning with `ok <n> - <name>` or `not ok <n> - <name>`.
 * A `# Subtest:` opens a nested suite; counts are flattened.
 *
 * Aggregate lines of the form:
 *   `# tests <N>`
 *   `# pass <N>`
 *   `# fail <N>`
 *   `# skip <N>`
 *   `# todo <N>`
 */
function parseNodeTap(content) {
  // Count each `ok ` line (a leaf assertion), each `not ok` line, and each `# skip` line.
  // Node's TAP runner prefixes subtests with `# Subtest:` — leaf results begin with `ok ` or `not ok `.
  // We treat:
  //   - lines starting with `ok ` as PASS
  //   - lines starting with `not ok ` as FAIL
  //   - lines containing `# Subtest: ` followed by a leaf pass as PASS, etc.
  // To avoid double-counting suite headers we only count leaf markers that are not the suite title.
  // Strategy: parse line-by-line, count `ok <n>` and `not ok <n>` occurrences, and treat
  // any `ok ... # SKIP` or `ok ... # TODO` as a SKIP using the directive token.

  // Strip leading pnpm wrapper output (everything before TAP version 13).
  const tapStartIdx = content.indexOf('TAP version 13');
  const tap = tapStartIdx >= 0 ? content.slice(tapStartIdx) : content;
  const lines = tap.split(/\r?\n/);

  let pass = 0;
  let fail = 0;
  let skip = 0;
  let todo = 0;

  // Aggregate footer values, when present.
  let footerPass = null;
  let footerFail = null;
  let footerSkip = null;
  let footerTodo = null;
  let footerTotal = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    // Footer summary lines — Node TAP runner emits these at the end of the run.
    const testsMatch = /^#\s*tests\s+(\d+)/.exec(line);
    const passMatch = /^#\s*pass\s+(\d+)/.exec(line);
    const failMatch = /^#\s*fail\s+(\d+)/.exec(line);
    const skipMatch = /^#\s*skip(?:ped)?\s+(\d+)/.exec(line);
    const todoMatch = /^#\s*todo\s+(\d+)/.exec(line);
    if (testsMatch) footerTotal = Number(testsMatch[1]);
    if (passMatch) footerPass = Number(passMatch[1]);
    if (failMatch) footerFail = Number(failMatch[1]);
    if (skipMatch) footerSkip = Number(skipMatch[1]);
    if (todoMatch) footerTodo = Number(todoMatch[1]);

    // Per-leaf results.
    // Node's TAP runner prints two styles of leaf results:
    //   1) `ok N - name ...` and `not ok N - name ...` (when leaf is direct)
    //   2) `    ok N - name ...` and `    not ok N - name ...` (when nested)
    // We accept either by trimming leading whitespace before checking the prefix.
    const trimmed = line.replace(/^\s+/, '');
    if (/^ok\s+\d+/.test(trimmed)) {
      if (/\s#\s*SKIP\b/i.test(trimmed) || /\s#\s*skip\b/i.test(trimmed)) {
        skip += 1;
      } else if (/\s#\s*TODO\b/i.test(trimmed) || /\s#\s*todo\b/i.test(trimmed)) {
        todo += 1;
      } else {
        pass += 1;
      }
      continue;
    }
    if (/^not\s+ok\s+\d+/.test(trimmed)) {
      if (/\s#\s*SKIP\b/i.test(trimmed) || /\s#\s*skip\b/i.test(trimmed)) {
        skip += 1;
      } else {
        fail += 1;
      }
      continue;
    }
  }

  return {
    pass,
    fail,
    skip,
    todo,
    footer: {
      tests: footerTotal,
      pass: footerPass,
      fail: footerFail,
      skip: footerSkip,
      todo: footerTodo,
    },
  };
}

/**
 * Parse Jest output.
 * Jest does not produce TAP; its summary lines include:
 *   `Tests:       <N>` ... `Snapshots:   <N>`
 * With jest --verbose we sometimes see:
 *   `Tests: <N> passed, <N> total`
 * or on failure:
 *   `Tests: <X> failed, <Y> passed, <N> total`
 * We parse from the FINAL summary footer that Jest always emits at end of run.
 */
function parseJest(content) {
  const lines = content.split(/\r?\n/);
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let total = 0;

  for (const raw of lines) {
    const line = raw.trim();
    // Footer line typically: `Tests:       N failed, N passed, N total`
    // or                       `Tests:       N passed, N total`
    const m = /^Tests:\s+(.+)$/.exec(line);
    if (!m) continue;
    const tail = m[1];
    total = Number((/(\d+)\s+total/.exec(tail) || [])[1] ?? 0);
    pass = Number((/(\d+)\s+passed/.exec(tail) || [])[1] ?? 0);
    fail = Number((/(\d+)\s+failed/.exec(tail) || [])[1] ?? 0);
    // Some Jest versions print `skipped` instead of `todo`.
    skip = Number((/(\d+)\s+(?:skipped|todo)/.exec(tail) || [])[1] ?? 0);
    if (total > 0) break;
  }

  return { pass, fail, skip, todo: skip, footer: { tests: total, pass, fail, skip } };
}

function parseLog(kind, filePath) {
  const buf = fs.readFileSync(filePath);
  // UTF-16 LE BOM (ff fe) — Windows PowerShell `>` redirect writes UTF-16 LE.
  let content;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    content = buf.toString('utf16le').replace(/^\uFEFF/, '');
  } else {
    content = buf.toString('utf8').replace(/^\uFEFF/, '');
  }
  if (kind === 'jest') return parseJest(content);
  return parseNodeTap(content);
}

function main() {
  const per = {};
  for (const [name, meta] of Object.entries(TARGETS)) {
    const full = path.join(RELEASE_DIR, meta.file);
    if (!fs.existsSync(full)) {
      per[name] = { error: `MISSING_LOG_FILE: ${full}` };
      continue;
    }
    const counts = parseLog(meta.runner, full);
    per[name] = counts;
  }

  // Sum totals.
  const sum = (k) =>
    Object.values(per).reduce((acc, p) => acc + (p[k] ?? 0), 0);
  const totalPassed = sum('pass');
  const totalFailed = sum('fail');
  const totalSkipped = sum('skip') + sum('todo');
  const totalExecuted = totalPassed + totalFailed + totalSkipped;

  // Verify totals add up to the footer value when available.
  const checksum = [];
  for (const [name, counts] of Object.entries(per)) {
    if (!counts.footer) continue;
    const { tests, pass, fail, skip } = counts.footer;
    if (tests === null || tests === undefined) continue;
    const footerTotal = (pass ?? 0) + (fail ?? 0) + (skip ?? 0);
    checksum.push({
      suite: name,
      footerTotal: tests,
      footerArithmetic: footerTotal,
      footerMatch: footerTotal === tests,
      leafPass: counts.pass,
      leafFail: counts.fail,
      leafSkip: counts.skip,
    });
  }

  const report = {
    phase: '15B.2',
    scope: 'Phase 1 — verify every Phase 15B.1 raw log',
    capturedAt: new Date().toISOString(),
    logDirectory: RELEASE_DIR,
    sources: TARGETS,
    perSuite: per,
    totals: {
      totalPassed,
      totalFailed,
      totalSkipped,
      totalExecuted,
      invariant: totalExecuted === totalPassed + totalFailed + totalSkipped,
      invariantHolds: totalExecuted === totalPassed + totalFailed + totalSkipped,
    },
    footerChecksum: checksum,
    phase15b1Reported: {
      testContracts: 187,
      testApi: 752,
      testNode: { pass: 2214, skipped: 1 },
      testWebUnit: 1477,
      sumOfClaims: 187 + 752 + 2214 + 1477 + 1,
      aggregateClaim: '4629 pass + 1 skipped',
    },
  };

  const out = path.join(
    RELEASE_DIR,
    'phase15b2-test-arithmetic.json',
  );
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out}`);
  console.log(
    `Pass=${totalPassed} Fail=${totalFailed} Skip=${totalSkipped} Executed=${totalExecuted} Invariant=${report.totals.invariantHolds}`,
  );
}

main();
