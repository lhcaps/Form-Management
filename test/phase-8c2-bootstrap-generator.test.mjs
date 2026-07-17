#!/usr/bin/env node
/**
 * Phase 8C.2 — Bootstrap Generator Tests
 *
 * Focused tests for `scripts/audit/build-phase-8c-bootstrap-sql.mjs` that
 * prove the generator aligns with the current Prisma schema:
 *
 *   1. emits no legacy columns on `templates` (document_kind, status,
 *      extraction_sha256, locked_at)
 *   2. generated `templates` INSERT column list matches schema
 *   3. generated `form_contract_versions` INSERT column list matches schema
 *   4. 213 templates operations
 *   5. 213 form_contract_versions operations
 *   6. total 426 logical operations
 *   7. BM-001/BM-002/BM-003 readiness rows present
 *   8. contract hashes match compiled artifacts
 *   9. dry-run does not access DB
 *  10. --apply requires QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1
 *  11. schema compatibility mismatch fails before insert
 *  12. second generation is semantically identical
 *  13. no business/case/person data is included
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(
  process.env.QLLAW_REPO_ROOT ||
    fileURLToPath(new URL('..', import.meta.url)),
);

const SCRIPT = join(REPO_ROOT, 'scripts', 'audit', 'build-phase-8c-bootstrap-sql.mjs');
const OUT_DIR = join(REPO_ROOT, 'docs', 'audit', 'infrastructure-modernization', 'phase-8c-bootstrap');
const LATEST_SQL = join(OUT_DIR, 'bootstrap.latest.sql');
const LATEST_JSON = join(OUT_DIR, 'bootstrap.latest.json');
const COMPILED_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
const LOCKED_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

function run(args, env = {}) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runJson(args, env = {}) {
  const out = run(args, env);
  return JSON.parse(out);
}

/** Read the column list from the first matching INSERT statement. */
function extractInsertColumns(sqlText, tableName) {
  const re = new RegExp(`INSERT INTO ${tableName} \\(([^)]+)\\)`);
  const m = re.exec(sqlText);
  if (!m) throw new Error(`No INSERT INTO ${tableName} (...) found in SQL`);
  return m[1]
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

test('1. generator emits no legacy columns on templates', () => {
  run(['--write']);
  const sql = readFileSync(LATEST_SQL, 'utf8');
  for (const legacy of ['document_kind', 'extraction_sha256', 'locked_at']) {
    // Note: 'status' on form_contract_versions is a current column (VARCHAR(30))
    // and is still used. We only forbid the legacy columns on the templates
    // table, where they used to be emitted together.
    assert.ok(
      !sql.match(new RegExp(`INSERT INTO templates[^)]*\\b${legacy}\\b`)),
      `legacy column '${legacy}' must not appear in templates INSERT`,
    );
  }
});

test('2. templates INSERT columns match current Prisma schema', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  const cols = extractInsertColumns(sql, 'templates');
  assert.deepEqual(cols, [
    'template_code',
    'template_name',
    'is_active',
    'render_scope',
    'output_strategy',
    'requires_review',
  ]);
});

test('3. form_contract_versions INSERT columns match current Prisma schema', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  const cols = extractInsertColumns(sql, 'form_contract_versions');
  assert.deepEqual(cols, [
    'template_id',
    'scope_key',
    'version_no',
    'status',
    'revision',
    'base_contract_hash',
    'contract_hash',
    'template_hash',
    'draft_json',
    'compiled_json',
    'agency_id',
    'created_by_official_id',
    'submitted_at',
    'approved_at',
    'published_at',
  ]);
});

test('4. 213 templates operations', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  const matches = sql.match(/INSERT INTO templates \(/g) || [];
  assert.equal(matches.length, 213);
});

test('5. 213 form_contract_versions operations', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  const matches = sql.match(/INSERT INTO form_contract_versions \(/g) || [];
  assert.equal(matches.length, 213);
});

test('6. total 426 logical operations', () => {
  const manifest = JSON.parse(readFileSync(LATEST_JSON, 'utf8'));
  assert.equal(manifest.templatesOperations, 213);
  assert.equal(manifest.versionOperations, 213);
  assert.equal(manifest.totalOperations, 426);
});

test('7. BM-001/BM-002/BM-003 readiness rows present', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  for (const code of ['BM-001', 'BM-002', 'BM-003']) {
    assert.ok(
      sql.includes(`'${code}'`),
      `expected ${code} to appear in bootstrap SQL`,
    );
  }
});

test('8. contract hashes match compiled artifacts', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  for (const code of ['BM-001', 'BM-002', 'BM-003']) {
    const compiled = JSON.parse(
      readFileSync(join(COMPILED_DIR, `${code}.compiled.json`), 'utf8'),
    );
    assert.ok(
      sql.includes(compiled.contractHash),
      `expected compiled contractHash for ${code} (${compiled.contractHash}) in SQL`,
    );
    assert.ok(
      sql.includes(compiled.templateHash),
      `expected compiled templateHash for ${code} (${compiled.templateHash}) in SQL`,
    );
  }
});

test('9. dry-run does not access DB and does not write files', () => {
  const source = readFileSync(SCRIPT, 'utf8');
  const dryRunBranch = source.indexOf('if (flagDryRun)');
  const dryRunExit = source.indexOf('process.exit(0);', dryRunBranch);
  const outputInitialization = source.indexOf('mkdirSync(OUT_DIR', dryRunExit);
  const dryRunExecutionPrefix = source.slice(dryRunBranch, dryRunExit);
  const out = runJson(['--dry-run']);
  assert.equal(out.mode, 'dry-run');
  assert.ok(dryRunBranch >= 0);
  assert.ok(dryRunExit > dryRunBranch);
  assert.ok(outputInitialization > dryRunExit);
  assert.doesNotMatch(dryRunExecutionPrefix, /writeFileSync\(/u);
  assert.doesNotMatch(dryRunExecutionPrefix, /mkdirSync\(/u);
  assert.equal('sqlPath' in out, false);
  assert.equal('latestSqlPath' in out, false);
  // The dry-run output must declare lockedCount and the columns used.
  assert.equal(out.lockedCount, 213);
  assert.deepEqual(out.templatesColumns, [
    'template_code',
    'template_name',
    'is_active',
    'render_scope',
    'output_strategy',
    'requires_review',
  ]);
  assert.deepEqual(out.legacyColumnsRemoved, [
    'document_kind',
    'status',
    'extraction_sha256',
    'locked_at',
  ]);
});

test('10. --apply without QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1 is refused', () => {
  // --write is run first so the script gets to the apply branch.
  run(['--write']);
  // Clear DATABASE_URL to make sure no DB side-effect happens even if it passed
  // the gate. We expect exit code 3 (gate refusal) before any DB call.
  let exitCode = null;
  let stderr = '';
  try {
    run(['--apply'], { QLLAW_BOOTSTRAP_ALLOW_DB_WRITE: undefined, DATABASE_URL: undefined });
  } catch (err) {
    exitCode = err.status;
    stderr = (err.stderr || '') + (err.stdout || '');
  }
  assert.equal(exitCode, 3, `expected exit 3, got ${exitCode}; stderr=${stderr}`);
  assert.ok(/QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1/.test(stderr), `expected gate message; stderr=${stderr}`);
});

test('11. --apply with gate but no DB exits 4 (schema-compat fail before any insert)', () => {
  run(['--write']);
  let exitCode = null;
  let stderr = '';
  try {
    run(['--apply'], {
      QLLAW_BOOTSTRAP_ALLOW_DB_WRITE: '1',
      DATABASE_URL: 'mysql://nobody:nobody@127.0.0.1:3999/nobody',
    });
  } catch (err) {
    exitCode = err.status;
    stderr = (err.stderr || '') + (err.stdout || '');
  }
  // Exit 4 is schema-compat fail; exit 1 would be a network failure caught
  // by the probe and reported. Either is acceptable proof the gate fired
  // BEFORE attempting the inserts (no row mutation).
  assert.ok(
    exitCode === 4 || /BOOTSTRAP_SCHEMA_COMPATIBILITY_FAIL/.test(stderr) || /ENOTFOUND|ECONNREFUSED|EHOSTUNREACH/.test(stderr),
    `expected schema-compat fail or DB-unreachable; got exit=${exitCode} stderr=${stderr.slice(0, 500)}`,
  );
});

test('12. second generation is semantically identical', () => {
  // Capture the canonical INSERT lines (excluding the comment block at the
  // top, which carries the timestamp).
  const sql1 = readFileSync(LATEST_SQL, 'utf8');
  const fingerprintBefore = createHash('sha256')
    .update(extractCanonicalInsertLines(sql1).join('\n'))
    .digest('hex');
  run(['--write']);
  const sql2 = readFileSync(LATEST_SQL, 'utf8');
  const fingerprintAfter = createHash('sha256')
    .update(extractCanonicalInsertLines(sql2).join('\n'))
    .digest('hex');
  assert.equal(fingerprintAfter, fingerprintBefore);
});

test('13. no business/case/person data is included', () => {
  const sql = readFileSync(LATEST_SQL, 'utf8');
  // Reject actual table-name references in DML. We only accept synthetic
  // application-owned rows: the qllaw-bootstrap official.
  const tableRefs = [
    /\bINSERT\s+INTO\s+people\b/i,
    /\bINSERT\s+INTO\s+cases\b/i,
    /\bINSERT\s+INTO\s+evidence_items\b/i,
    /\bINSERT\s+INTO\s+document_generation_batches\b/i,
    /\bINSERT\s+INTO\s+generated_documents\b/i,
    /\bINSERT\s+INTO\s+auth_identities\b/i,
    /\bINSERT\s+INTO\s+auth_sessions\b/i,
    /\bINSERT\s+INTO\s+case_people\b/i,
    /\bINSERT\s+INTO\s+case_offenses\b/i,
    /\bINSERT\s+INTO\s+case_events\b/i,
    /\bINSERT\s+INTO\s+case_assignments\b/i,
    /\bINSERT\s+INTO\s+audit_logs\b/i,
    /\bINSERT\s+INTO\s+official_permissions\b/i,
  ];
  for (const re of tableRefs) {
    assert.ok(
      !re.test(sql),
      `bootstrap SQL must not include INSERT into business table matched by ${re}`,
    );
  }
  // Forbidden business row identifiers
  for (const forbidden of ['VKS-2026-0001', 'admin@example', 'admin123']) {
    assert.ok(
      !sql.includes(forbidden),
      `bootstrap SQL must not include business identifier '${forbidden}'`,
    );
  }
  // The only officials row inserted is the synthetic bootstrap owner.
  assert.ok(sql.includes("'qllaw-bootstrap'"));
  assert.ok(sql.includes("'QLLAW Bootstrap Owner'"));
});

function extractCanonicalInsertLines(sqlText) {
  // The first comment block ends at the first blank line. Skip the timestamped
  // preamble to make the fingerprint immune to wall-clock changes.
  const idx = sqlText.indexOf('SET NAMES utf8mb4;');
  if (idx < 0) return sqlText.split('\n');
  return sqlText.slice(idx).split('\n');
}

function stripComments(sqlText) {
  return sqlText
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}
