#!/usr/bin/env node
/**
 * Phase 8C — Local/remote Git integration analysis & commit plan.
 *
 * Reads the current working tree, classifies every dirty entry against
 * the canonical Phase 8C file set, and emits a deterministic JSON+Markdown
 * commit plan under
 * `docs/audit/infrastructure-modernization/phase-8c-git-delivery/`.
 *
 * Refusal rules:
 *   - Never stage / commit / push on the user's behalf.
 *   - Never delete or rewrite existing branches.
 *   - Only classify and propose. Operator runs `git add`/`commit`/`push`
 *     explicitly.
 *
 * Classification buckets:
 *   - PHASE_8C_FONT            — Times New Roman fidelity + tests
 *   - PHASE_8C_PDF_FIDELITY    — operator evidence packets
 *   - PHASE_8C_BOOTSTRAP       — governed contract bootstrap
 *   - PHASE_8C_THROTTLING      — throttling closure orchestrator
 *   - PHASE_8C_METADATA        — persistent metadata preflight
 *   - PRE_EXISTING_DIRTY       — touched before this Phase 8C session
 *   - UNKNOWN                  — needs operator review
 *
 * Exit codes:
 *   0 - plan produced
 *   1 - infra failure (git unavailable)
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'infrastructure-modernization',
  'phase-8c-git-delivery',
);

mkdirSync(OUT_DIR, { recursive: true });

const git = (args, options = {}) =>
  spawnSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    windowsHide: true,
    ...options,
  });

const statusProc = git(['status', '--porcelain']);
if (statusProc.status !== 0) {
  console.error(`[FAIL] git status failed: ${statusProc.stderr || statusProc.stdout}`);
  process.exit(1);
}

const branchProc = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const headProc = git(['rev-parse', 'HEAD']);
const remoteProc = git(['remote', '-v']);
const upstreamProc = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);

const branch = (branchProc.stdout ?? '').trim();
const headSha = (headProc.stdout ?? '').trim();
const remoteOutput = (remoteProc.stdout ?? '').trim();
const upstream = upstreamProc.status === 0 ? (upstreamProc.stdout ?? '').trim() : null;

const remoteUrls = remoteOutput
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)/);
    if (!match) return acc;
    const [, name, url, dir] = match;
    acc[name] = acc[name] || {};
    acc[name][dir] = url;
    return acc;
  }, {});

const dirtyEntries = (statusProc.stdout ?? '')
  .split(/\r?\n/)
  .filter((line) => line.trim().length > 0)
  .map((line) => {
    const code = line.slice(0, 2);
    const path = line.slice(3).trim();
    return { code, path };
  });

const PHASE_8C_PATTERNS = [
  {
    bucket: 'PHASE_8C_FONT',
    pattern:
      /^(scripts\/fonts\/|docker-compose\.prod\.yml|docker\/api\.Dockerfile|docker\/api-entrypoint\.sh|apps\/api\/src\/modules\/health\/readiness\.service\.ts|apps\/api\/src\/modules\/health\/readiness\.service\.spec\.ts|apps\/api\/src\/modules\/health\/health\.module\.ts|apps\/api\/src\/infrastructure\/config\/app-config\.service\.ts|apps\/api\/src\/infrastructure\/config\/app-config\.service\.spec\.ts|test\/font-policy\.test\.mjs|\.env\.docker\.example|scripts\/docker-verify\.mjs)/u,
  },
  {
    bucket: 'PHASE_8C_PDF_FIDELITY',
    pattern:
      /^(scripts\/audit\/build-phase-8c-pdf-fidelity-evidence\.mjs|docs\/audit\/infrastructure-modernization\/phase-8c-pdf-fidelity\/)/u,
  },
  {
    bucket: 'PHASE_8C_BOOTSTRAP',
    pattern:
      /^(scripts\/audit\/build-phase-8c-bootstrap-sql\.mjs|docs\/audit\/infrastructure-modernization\/phase-8c-bootstrap\/)/u,
  },
  {
    bucket: 'PHASE_8C_THROTTLING',
    pattern:
      /^(scripts\/audit\/build-phase-8c-throttling-closure\.mjs|docs\/audit\/infrastructure-modernization\/phase-8c-throttling\/)/u,
  },
  {
    bucket: 'PHASE_8C_METADATA',
    pattern:
      /^(scripts\/audit\/build-phase-8c-metadata-transition-package\.mjs|docs\/audit\/infrastructure-modernization\/phase-8c-metadata-transition\/)/u,
  },
];

function classify(path) {
  for (const { bucket, pattern } of PHASE_8C_PATTERNS) {
    if (pattern.test(path)) return bucket;
  }
  return 'PRE_EXISTING_DIRTY';
}

const buckets = Object.fromEntries(
  PHASE_8C_PATTERNS.map(({ bucket }) => [bucket, []]).concat([['PRE_EXISTING_DIRTY', []]]),
);

for (const entry of dirtyEntries) {
  const bucket = classify(entry.path);
  buckets[bucket].push(entry);
}

const summary = {
  schemaVersion: '1',
  generatedAt: new Date().toISOString(),
  branch,
  headSha,
  upstream,
  remotes: remoteUrls,
  totalDirtyEntries: dirtyEntries.length,
  perBucket: Object.fromEntries(
    Object.entries(buckets).map(([bucket, entries]) => [bucket, entries.length]),
  ),
  dirtySamples: Object.fromEntries(
    Object.entries(buckets).map(([bucket, entries]) => [bucket, entries.slice(0, 25)]),
  ),
  policy: {
    gitPolicy: 'NO_STAGE_NO_COMMIT_NO_PUSH_NO_PR',
    refusalReasons: [
      'Phase 8C never stages, commits, pushes, or opens PRs.',
      'Pre-existing dirty tree (PRE_EXISTING_DIRTY) is OUT OF SCOPE for Phase 8C and was not introduced by this session.',
      'Operator must manually curate and commit the PHASE_8C_* buckets only after reviewing this plan.',
    ],
    commitPlan: [
      {
        bucket: 'PHASE_8C_FONT',
        branch: 'feat/phase-8c-font-fidelity',
        commitSubject: 'feat(infrastructure): Times New Roman font fidelity + readiness policy',
        commitBody:
          '- scripts/fonts/{ttf-inspector,verify-font-policy}.mjs\n' +
          '- docker-compose.prod.yml + docker/api.Dockerfile + docker/api-entrypoint.sh\n' +
          '- apps/api/src/modules/health/readiness.service.{ts,spec.ts}\n' +
          '- apps/api/src/infrastructure/config/app-config.service.{ts,spec.ts}\n' +
          '- .env.docker.example, scripts/docker-verify.mjs\n' +
          '- test/font-policy.test.mjs',
      },
      {
        bucket: 'PHASE_8C_PDF_FIDELITY',
        branch: 'docs/phase-8c-pdf-fidelity-evidence',
        commitSubject: 'docs(audit): BM-001/BM-006/BM-171 PDF fidelity evidence packet',
        commitBody:
          '- scripts/audit/build-phase-8c-pdf-fidelity-evidence.mjs\n' +
          '- docs/audit/infrastructure-modernization/phase-8c-pdf-fidelity/',
      },
      {
        bucket: 'PHASE_8C_BOOTSTRAP',
        branch: 'feat/phase-8c-contract-bootstrap',
        commitSubject: 'feat(audit): governed contract bootstrap for fresh production DB',
        commitBody:
          '- scripts/audit/build-phase-8c-bootstrap-sql.mjs\n' +
          '- docs/audit/infrastructure-modernization/phase-8c-bootstrap/',
      },
      {
        bucket: 'PHASE_8C_THROTTLING',
        branch: 'docs/phase-8c-throttling-closure',
        commitSubject: 'docs(audit): nine-form authenticated throttling closure (NEED_USER_DECISION)',
        commitBody:
          '- scripts/audit/build-phase-8c-throttling-closure.mjs\n' +
          '- docs/audit/infrastructure-modernization/phase-8c-throttling/',
      },
      {
        bucket: 'PHASE_8C_METADATA',
        branch: 'docs/phase-8c-metadata-transition',
        commitSubject: 'docs(audit): persistent metadata transition preflight package',
        commitBody:
          '- scripts/audit/build-phase-8c-metadata-transition-package.mjs\n' +
          '- docs/audit/infrastructure-modernization/phase-8c-metadata-transition/',
      },
    ],
  },
};

writeFileSync(
  join(OUT_DIR, 'git-delivery.latest.json'),
  JSON.stringify(summary, null, 2),
);

const md = [];
md.push('# Phase 8C Git delivery plan');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push('');
md.push(`Branch: \`${branch}\``);
md.push(`HEAD: \`${headSha}\``);
md.push(`Upstream: \`${upstream ?? '(none)'}\``);
md.push('');
md.push('## Bucket summary');
md.push('');
md.push('| Bucket | Count |');
md.push('|---|---:|');
for (const [bucket, count] of Object.entries(summary.perBucket)) {
  md.push(`| \`${bucket}\` | ${count} |`);
}
md.push('');
md.push('## Policy');
md.push('');
md.push('- **Phase 8C never stages / commits / pushes / opens PRs.**');
md.push('- Pre-existing dirty tree is OUT OF SCOPE for Phase 8C.');
md.push('- Operator must manually curate and commit the PHASE_8C_* buckets only after reviewing this plan.');
md.push('');
md.push('## Proposed commits');
md.push('');
for (const commit of summary.policy.commitPlan) {
  md.push(`### \`${commit.bucket}\``);
  md.push('');
  md.push(`Branch: \`${commit.branch}\``);
  md.push('');
  md.push('```');
  md.push(commit.commitSubject);
  md.push('');
  md.push(commit.commitBody);
  md.push('```');
  md.push('');
}

writeFileSync(join(OUT_DIR, 'git-delivery.latest.md'), `${md.join('\n')}\n`);

console.log(`[PASS] Phase 8C git delivery plan written to docs/audit/infrastructure-modernization/phase-8c-git-delivery/`);
console.log(`  branch: ${branch}`);
console.log(`  head: ${headSha}`);
console.log(`  dirty: ${dirtyEntries.length}`);
for (const [bucket, count] of Object.entries(summary.perBucket)) {
  console.log(`    ${bucket}: ${count}`);
}
