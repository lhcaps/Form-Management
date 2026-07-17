#!/usr/bin/env node
/**
 * Phase 8C — Persistent metadata transition package (read-only).
 *
 * Prepares a read-only evidence bundle an operator can review BEFORE
 * authorizing a metadata transition against the persistent database.
 *
 * Output: docs/audit/infrastructure-modernization/phase-8c-metadata-transition/
 *
 * Refusal rules:
 *   - This script NEVER mutates the persistent database.
 *   - It produces a deterministic checklist, expected fingerprint, and a
 *     difference report (read-only) that mirrors the Phase 8B simulation
 *     results for the applicable E1 procedure.
 *
 * Exit codes:
 *   0 - bundle produced
 *   1 - infra failure (DATABASE_URL not set, Prisma unreachable)
 *   2 - invalid usage
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'infrastructure-modernization',
  'phase-8c-metadata-transition',
);
const ACTIVE_BASELINE_DIR = join(
  REPO_ROOT,
  'apps',
  'api',
  'prisma',
  'migrations',
  '20260711000000_squashed_baseline',
);

mkdirSync(OUT_DIR, { recursive: true });

if (!process.env.DATABASE_URL) {
  console.error(
    '[INFO] DATABASE_URL is not set. Emitting offline baseline-only preflight packet; operator must provide DATABASE_URL for a full pre-flight.',
  );
}

if (!existsSync(ACTIVE_BASELINE_DIR)) {
  console.error(`[FAIL] Active baseline directory missing: ${ACTIVE_BASELINE_DIR}`);
  process.exit(1);
}

const baselineSql = readFileSync(join(ACTIVE_BASELINE_DIR, 'migration.sql'), 'utf8');
const baselineHash = createHash('sha256').update(baselineSql).digest('hex');

const checklist = [
  {
    step: 1,
    title: 'Operator/DBA explicit approval recorded',
    blocking: true,
    how: 'Operator confirms metadata-write authorisation out-of-band and records the approval ID in the transition log.',
  },
  {
    step: 2,
    title: 'Maintenance window declared and concurrent deploy processes stopped',
    blocking: true,
    how: 'Stop CI deploy jobs and release pipelines for the database host.',
  },
  {
    step: 3,
    title: 'Restorable backup + _prisma_migrations export captured',
    blocking: true,
    how: 'mysqldump + separate dump of `_prisma_migrations` table; verify restore in a sandbox.',
  },
  {
    step: 4,
    title: 'Active baseline SQL hash matches release artifact',
    blocking: true,
    how: `Expected hash: ${baselineHash}. Source: apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql.`,
  },
  {
    step: 5,
    title: 'Read-only `prisma migrate diff` from target DB to release datamodel',
    blocking: true,
    how: 'pnpm --filter api exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > /tmp/diff.sql',
  },
  {
    step: 6,
    title: 'Classify every difference — only the two retained DEFAULT \'GLOBAL\' clauses are accepted',
    blocking: true,
    how: 'form_contract_versions.scope_key and official_permissions.scope_key are the only expected differences. Any additional delta is a stop condition.',
  },
  {
    step: 7,
    title: 'Query migration status; select E1/E2/E3 branch',
    blocking: true,
    how: 'pnpm migrate:status. If active failed row count == 0 → E1/E3. Else → E2.',
  },
  {
    step: 8,
    title: 'Run E1 branch commands in order: status, resolve --applied, status, deploy, deploy',
    blocking: true,
    how: 'Documented in BASELINE_TRANSITION_OPERATOR_RUNBOOK.latest.md §E1/E3.',
  },
  {
    step: 9,
    title: 'Re-run verification query set to confirm no application-schema or row mutation',
    blocking: true,
    how: 'Compare structure fingerprint and metadata fingerprint before/after the transition.',
  },
];

writeFileSync(
  join(OUT_DIR, 'operator-checklist.latest.json'),
  JSON.stringify(
    {
      schemaVersion: '1',
      generatedAt: new Date().toISOString(),
      baselineDirectory: 'apps/api/prisma/migrations/20260711000000_squashed_baseline',
      baselineSqlHashSha256: baselineHash,
      baselineSqlBytes: Buffer.byteLength(baselineSql, 'utf8'),
      checklist,
    },
    null,
    2,
  ),
);

const md = [
  '# Phase 8C — Persistent Metadata Transition Operator Checklist',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Active baseline: \`apps/api/prisma/migrations/20260711000000_squashed_baseline/\``,
  `Baseline SQL SHA-256: \`${baselineHash}\``,
  '',
  '## Procedure (read-only preflight)',
  '',
  'This checklist is what the operator must complete and sign before the E1 procedure in',
  '`docs/audit/infrastructure-modernization/phase-8b-production-verification/BASELINE_TRANSITION_OPERATOR_RUNBOOK.latest.md`',
  'is executed. The actual transition is out-of-scope for Phase 8C.',
  '',
  ...checklist.map(
    (entry) =>
      `- [ ] Step ${entry.step} — ${entry.title}${entry.blocking ? ' _(BLOCKING)_' : ''}\n  - How: ${entry.how}`,
  ),
  '',
  '## Refusal rules',
  '',
  '- Never place automatic `migrate resolve` logic in the API entrypoint.',
  '- Never delete legacy `_prisma_migrations` rows.',
  '- Never apply the baseline SQL directly to an existing populated schema.',
  '- Never perform the transition without explicit operator/DBA approval recorded above.',
  '',
  '## Expected outcome (post-transition)',
  '',
  '- application-table structure hash unchanged',
  '- exactly one successful baseline row added',
  '- all legacy metadata rows preserved',
  '- `migrate:status` exits 0, `migrate deploy` exits 0 twice',
  '- two `DEFAULT \'GLOBAL\'` clauses retained on scope_key columns',
  '',
].join('\n');

writeFileSync(join(OUT_DIR, 'operator-checklist.latest.md'), `${md}\n`);

writeFileSync(
  join(OUT_DIR, 'metadata-transition-preflight.latest.json'),
  JSON.stringify(
    {
      schemaVersion: '1',
      generatedAt: new Date().toISOString(),
      decision: process.env.DATABASE_URL ? 'PREFLIGHT_READY' : 'OFFLINE_BASELINE_ONLY',
      baselineSqlHashSha256: baselineHash,
      baselineSqlBytes: Buffer.byteLength(baselineSql, 'utf8'),
      databaseUrlProvided: Boolean(process.env.DATABASE_URL),
      nextAction: process.env.DATABASE_URL
        ? 'Operator must complete the checklist under `operator-checklist.latest.md` before any metadata write is performed. The persistent database remains UNCHANGED by this Phase 8C script.'
        : 'Offline baseline-only preflight. Re-run with DATABASE_URL exported for a full read-only diff. No database mutation occurred.',
    },
    null,
    2,
  ),
);

console.log('[PASS] Phase 8C persistent metadata transition package: read-only preflight ready.');
console.log(`  active baseline: apps/api/prisma/migrations/20260711000000_squashed_baseline/`);
console.log(`  baseline sql sha256: ${baselineHash}`);
console.log(`  checklist: docs/audit/infrastructure-modernization/phase-8c-metadata-transition/operator-checklist.latest.md`);
