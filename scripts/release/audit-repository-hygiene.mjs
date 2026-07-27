// Repository hygiene guard
// Verifies tracked + untracked files against the customer-ready baseline.
// Outputs a JSON report at the path given on argv[2] (or repo root by default).

import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, statSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(ROOT, process.argv[2] || 'docs/audit/final-213-customer-ready/release-integration/repository-hygiene.json');

function git(args) {
  const opts = { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 };
  return execFileSync('git', args, opts);
}

function listTracked() {
  return git(['ls-files', '-z']).split('\u0000').filter(Boolean);
}

function listUntracked() {
  return git(['ls-files', '--others', '--exclude-standard', '-z']).split('\u0000').filter(Boolean);
}

const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.docker$/,
  /^\.env\.docker\.demo$/,
  /^\.env\.e2e\.local$/,
  /^playwright\/\.clerk\//,
  /^playwright\/\.auth\//,
  /^storage\/generated\//,
  /^storage\/runtime-preview-sessions\//,
  /^test-results\//,
  /^playwright-report\//,
  /^audit_renders\//,
  /\.sqlite$/,
  /\.sqlite3$/,
  /~$[^/]+\.docx$/,
  /~$[^/]+\.xlsx$/,
  /^scripts\/runtime-rollout\/_probe-.*\.mjs$/,
  /^apps\/api\/scripts\/forensic-.*\.mjs$/,
];

const HUGE_LIMIT = 100 * 1024 * 1024; // 100 MB

function findLargeFiles(paths) {
  const out = [];
  for (const p of paths) {
    const full = resolve(ROOT, p);
    if (!existsSync(full)) continue;
    try {
      const s = statSync(full);
      if (s.isFile() && s.size > HUGE_LIMIT) {
        out.push({ path: p, sizeBytes: s.size });
      }
    } catch {
      // ignore
    }
  }
  return out;
}

function checkCanonicalCounts() {
  const lockedCount = git(['ls-files', '--', 'docs/audit/docx/contracts/locked']).trim().split('\n').filter(Boolean).length;
  const normalizedCount = git(['ls-files', '--', 'storage/templates/normalized-docx']).trim().split('\n').filter(Boolean).length;
  const sourceCount = git(['ls-files', '--', 'storage/templates/source']).trim().split('\n').filter(Boolean).length;
  return { lockedContractsTracked: lockedCount, normalizedDocxTracked: normalizedCount, sourceDocxTracked: sourceCount };
}

function main() {
  const tracked = listTracked();
  const untracked = listUntracked();

  const forbidden = [];
  for (const p of tracked) {
    for (const pat of FORBIDDEN_TRACKED_PATTERNS) {
      if (pat.test(p)) {
        forbidden.push({ path: p, pattern: pat.toString() });
        break;
      }
    }
  }

  const hugeFiles = findLargeFiles(tracked);
  const hugeUntracked = findLargeFiles(untracked);

  const canonical = checkCanonicalCounts();

  const report = {
    schema: 'qllaw.repository_hygiene/v1',
    generatedAt: new Date().toISOString(),
    trackedFiles: tracked.length,
    untrackedFiles: untracked.length,
    forbiddenTrackedCount: forbidden.length,
    hugeTrackedFiles: hugeFiles,
    hugeUntrackedFiles: hugeUntracked,
    forbiddenTracked: forbidden,
    canonical,
    verdict: forbidden.length === 0 && hugeFiles.length === 0 && canonical.lockedContractsTracked >= 213 ? 'PASS' : 'FAIL',
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  process.stdout.write(
    `Repository hygiene: tracked=${tracked.length}, forbidden=${forbidden.length}, huge=${hugeFiles.length}, locked=${canonical.lockedContractsTracked}, normalized=${canonical.normalizedDocxTracked}, verdict=${report.verdict}\n`
  );
  process.exit(report.verdict === 'PASS' ? 0 : 1);
}

main();
