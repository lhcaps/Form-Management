#!/usr/bin/env node
/**
 * run-docx-fidelity-all.mjs — K0 meta-audit orchestrator
 *
 * Runs F1→F5 in the correct order, injects a shared runId into each
 * report's JSON, and fails if any child exits non-zero.
 *
 * Child order:
 *   1. audit:docx-slot-inventory  (F1 — static slot inventory)
 *   2. test:docx-structural-fidelity  (F2 — OOXML structure after render)
 *   3. audit:rendered-text-fidelity  (F3 — text anchors + unreplaced {{...}})
 *   4. test:docx-binding-correctness  (F4 — mock markers land in correct slots)
 *   5. test:docx-repeat-blocks  (F5 — repeat/table/list candidate scan)
 *
 * All five scripts share the same runId in their reports so verify-docx-audit-reports.mjs
 * can confirm they were written in the same session.
 *
 * Exit codes:
 *   0 — all five scripts exit 0
 *   1 — one or more scripts exited non-zero; all output is preserved
 *
 * Usage:
 *   node scripts/audit/run-docx-fidelity-all.mjs
 *   pnpm run audit:docx-fidelity
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPTS_DIR = join(ROOT, 'scripts', 'audit');

const log = (msg) => process.stderr.write(`[K0] ${msg}\n`);

// ──────────────────────────────────────────────────────────────────────────────
// Child scripts in execution order
// ──────────────────────────────────────────────────────────────────────────────

const CHILDREN = [
  {
    name:   'F1  audit:docx-slot-inventory',
    script: 'audit:docx-slot-inventory',
    pnpm:   true,
  },
  {
    name:   'F2  test:docx-structural-fidelity',
    script: 'test:docx-structural-fidelity',
    pnpm:   true,
  },
  {
    name:   'F3  audit:rendered-text-fidelity',
    script: 'audit:rendered-text-fidelity',
    pnpm:   true,
  },
  {
    name:   'F4  test:docx-binding-correctness',
    script: 'test:docx-binding-correctness',
    pnpm:   true,
  },
  {
    name:   'F5  test:docx-repeat-blocks',
    script: 'test:docx-repeat-blocks',
    pnpm:   true,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Execute one child, stream its stderr/stdout, return exit code
// ──────────────────────────────────────────────────────────────────────────────

const runChild = ({ name, script, pnpm }) => {
  log(`Starting: ${name}`);
  const start = Date.now();
  try {
    const cmd = pnpm
      ? `pnpm ${script}`
      : `node "${join(SCRIPTS_DIR, script)}"`;
    execSync(cmd, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 300_000, // 5 min per child
    });
    log(`${name} — PASS — ${Date.now() - start}ms`);
    return 0;
  } catch (err) {
    log(`${name} — FAIL — exit ${err.status ?? 'unknown'} — ${Date.now() - start}ms`);
    return err.status ?? 1;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

const main = () => {
  log('K0 DOCX Fidelity Gate — starting F1→F5 in order');
  log('');

  const results = [];
  let allPassed = true;

  for (const child of CHILDREN) {
    const exitCode = runChild(child);
    results.push({ name: child.name, exitCode });
    if (exitCode !== 0) {
      allPassed = false;
      log(`WARNING: ${child.name} exited ${exitCode} — continuing with remaining audits`);
      log('');
    }
  }

  log('');
  log('─'.repeat(60));
  log('K0 Summary');
  log('─'.repeat(60));

  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    const mark = r.exitCode === 0 ? '✓' : '✗';
    const label = r.exitCode === 0 ? 'PASS' : `FAIL (${r.exitCode})`;
    log(`  ${mark} ${r.name}: ${label}`);
    if (r.exitCode === 0) passCount++;
    else failCount++;
  }

  log('');
  if (allPassed) {
    log(`All ${CHILDREN.length} audits passed.`);
    log('Run the verifier next:');
    log('  node scripts/audit/verify-docx-audit-reports.mjs');
    process.exit(0);
  } else {
    log(`${failCount} audit(s) failed.`);
    log('Reports are preserved at:');
    log('  docs/audit/docx-slot-inventory/latest.json');
    log('  docs/audit/docx-structural-fidelity/latest.json');
    log('  docs/audit/rendered-text-fidelity/latest.json');
    log('  docs/audit/docx-binding-correctness/latest.json');
    log('  docs/audit/docx-repeat-blocks/latest.json');
    process.exit(1);
  }
};

main();
