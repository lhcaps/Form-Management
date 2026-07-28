// Phase 0 — path-scoped preflight for the locked authority adjudication
// and staged consumer cutover wave. Records:
//   - current HEAD
//   - branch
//   - staged count
//   - pre-existing dirty paths
//   - execution-owned files
//   - before hashes
//   - unrelated dirty paths
//
// Runs independently and produces ONLY:
//   docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/staged-cutover-preflight.json

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/staged-cutover-preflight.json');

const SCOPED_GLOBS = [
  'scripts/runtime-rollout',
  'packages/form-contracts',
  'docs/audit/final-213-customer-ready/runtime-rollout',
  '.cursor/qllaw-goal-state.json',
];

function git(args) {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return err.stdout?.toString?.() ?? '';
  }
}

function gitLines(args) {
  const raw = git(args);
  return raw.split(/\r?\n/).filter((line) => line.length > 0);
}

function sha256File(filePath) {
  if (!existsSync(filePath)) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function withinScope(relativePath, scopedDirs) {
  return scopedDirs.some((dir) => relativePath === dir || relativePath.startsWith(`${dir}/`) || relativePath.startsWith(`${dir}\\`));
}

function isExecutionOwned(relativePath) {
  // Files the wave itself plans to create or modify.
  if (relativePath === '.cursor/qllaw-goal-state.json') return true;
  if (relativePath.startsWith('docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/decompose-drift-2497')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/guard-locked-semantic-consistency')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/inventory-transforms')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/forensic-eight-target')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/phase-')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/run-r1-r2-')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/build-binding-verification-')) return true;
  if (relativePath.startsWith('scripts/runtime-rollout/cutover-')) return true;
  if (relativePath.startsWith('packages/form-contracts/src/runtime-readiness.generated.ts')) return true;
  // We DO NOT touch core build-slot-inventory.mjs / compute-canonical-verdicts.mjs / etc.
  // during this wave's preflight, but Phases 6+ will modify the imports inside them.
  if (/^scripts\/runtime-rollout\/(build-slot-inventory|compute-canonical-verdicts|build-source-slot-debt-family-report|per-form-readiness-reconciliation|guard-runtime-rollout-evidence|build-adapter-resolution|render-runtime-batch|promote-runtime-batch|phase3-generate-roster)\.m?[jt]s$/.test(relativePath.replace(/\\/g, '/'))) {
    return true;
  }
  return false;
}

export function runStagedCutoverPreflight(options = {}) {
  const head = git(['rev-parse', 'HEAD']).trim();
  const branchRaw = git(['status', '--short', '--branch']).split(/\r?\n/)[0] ?? '';
  const branch = branchRaw.replace(/^##\s*/, '');

  const staged = gitLines(['diff', '--cached', '--name-only']).filter((p) => p.length > 0);
  const deleted = gitLines(['ls-files', '--deleted']).filter((p) => p.length > 0);
  const dirtyNameStatus = git(['diff', '--name-status', '--', ...SCOPED_GLOBS]).trim();
  const dirtyLines = dirtyNameStatus.split(/\r?\n/).filter((l) => l.length > 0);

  const allDirty = git(['status', '--porcelain']).split(/\r?\n/).filter((l) => l.length > 0);
  const unrelatedDirty = [];
  const scopedDirty = [];
  for (const line of allDirty) {
    const m = line.match(/^(.{2})\s+(.*)$/);
    if (!m) continue;
    const [, status, rel] = m;
    if (withinScope(rel, SCOPED_GLOBS)) {
      scopedDirty.push({ status: status.trim(), path: rel });
    } else {
      unrelatedDirty.push({ status: status.trim(), path: rel });
    }
  }

  const executionOwned = scopedDirty.filter((d) => isExecutionOwned(d.path));
  const executionOwnedNames = executionOwned.map((d) => d.path).sort();

  // Before-hashes: SHA-256 of every existing artifact the wave will mutate.
  const beforeHashPaths = [
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-crosswalk.json',
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-shadow-transition.json',
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-consumer-trace.json',
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.1.json',
    'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-schema-profile.v2.json',
  ];
  const beforeHashes = Object.fromEntries(beforeHashPaths.map((p) => [p, sha256File(path.join(REPO_ROOT, p))]));

  const report = {
    schema: 'qllaw.213.staged_cutover_preflight/v1',
    generatedAt: new Date().toISOString(),
    head,
    branch,
    stagedCount: staged.length,
    deletedTrackedCount: deleted.length,
    authorityScopeDirtyPathCount: scopedDirty.length,
    executionOwnedCount: executionOwned.length,
    executionOwnedFiles: executionOwnedNames,
    unrelatedDirtyCount: unrelatedDirty.length,
    unrelatedDirtyPreview: unrelatedDirty.slice(0, 20),
    requireZeroStaged: true,
    requireNoUnrelatedMutations: unrelatedDirty.length === 0,
    beforeHashes,
    invariants: {
      headMatchesBaseline: head === 'b0e43be3fd7831db42a88ad521384e0608ee6a18',
      branchMatchesBaseline: branch.startsWith('codex/customer-ready-baseline'),
      stagedCountZero: staged.length === 0,
      unrelatedDirtyZero: unrelatedDirty.length === 0,
    },
  };

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { report, outputPath } = runStagedCutoverPreflight();
  console.log(`OK preflight: head=${report.head} branch=${report.branch} staged=${report.stagedCount} unrelated=${report.unrelatedDirtyCount}`);
  console.log(`     scopedDirty=${report.authorityScopeDirtyPathCount} executionOwned=${report.executionOwnedCount}`);
  console.log(`     invariants:`, JSON.stringify(report.invariants));
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
  if (!report.invariants.stagedCountZero) {
    console.error('FAIL preflight: staged count is not zero');
    process.exit(1);
  }
  if (!report.invariants.unrelatedDirtyZero) {
    console.error('WARN preflight: unrelated dirty paths exist, but will not be touched');
  }
}
