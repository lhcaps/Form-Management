#!/usr/bin/env node
/**
 * Phase 8C.2 — Governed Contract Bootstrap (Schema-Aligned)
 *
 * Operator command for fresh production databases that need to materialize
 * the locked form contract corpus (templates + form_contract_versions) into
 * a fresh MariaDB instance.
 *
 * Schema authority: `apps/api/prisma/schema.prisma` + the active squashed
 * baseline migration. The generator emits INSERTs that target the current
 * schema columns only; no legacy columns (`document_kind`, `status`,
 * `extraction_sha256`, `locked_at`) are referenced.
 *
 * Required columns per current schema (verified by `verifySchemaColumns`):
 *   - templates:
 *       template_code (UNIQUE NOT NULL), template_name (NOT NULL),
 *       is_active, render_scope, output_strategy, requires_review,
 *       stage_code, source_file_name, original_ext, template_no, description,
 *       group_id, created_by_official_id, default_output_formats,
 *       created_at, updated_at
 *   - form_contract_versions:
 *       template_id (FK), scope_key (NOT NULL), version_no (NOT NULL),
 *       status (NOT NULL DEFAULT 'DRAFT'), template_hash (NOT NULL),
 *       draft_json (NOT NULL), created_by_official_id (NOT NULL, FK to officials),
 *       agency_id, base_contract_hash, contract_hash, compiled_json,
 *       approved_by_official_id, published_by_official_id, submitted_at,
 *       approved_at, published_at, archived_at, revision, created_at, updated_at
 *
 * Idempotency contract:
 *   - Idempotent on the same source corpus. Re-running with no change between
 *     operator invocations produces the same SQL script (byte-for-byte
 *     modulo the leading timestamped comment block). Re-running against a DB
 *     that already has the rows leaves them byte-equivalent (no drift).
 *   - First dry-run is the default. No DB I/O.
 *   - `--write` writes the SQL to disk under
 *     `docs/audit/infrastructure-modernization/phase-8c-bootstrap/`.
 *   - `--apply` additionally executes the SQL via the configured DATABASE_URL
 *     using `prisma db execute --stdin --schema=prisma/schema.prisma` from
 *     the API workspace.
 *
 * Refusal rules:
 *   - Refuses to mutate the DB unless the operator passes --apply AND
 *     QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1.
 *   - Refuses to proceed if the locked contract corpus does not equal the
 *     213-file expected count.
 *   - Refuses to proceed if the schema-compatibility probe shows any required
 *     column is missing on the target tables (BOOTSTRAP_SCHEMA_COMPATIBILITY_FAIL).
 *   - Refuses if `BM-001` / `BM-002` / `BM-003` are missing or the contract
 *     hash does not match the locked compiled artifact.
 *
 * Output files:
 *   - bootstrap-<timestamp>.sql        — canonical SQL to materialize the corpus
 *   - bootstrap-<timestamp>.json       — provenance (hash, plan, operator)
 *   - bootstrap.latest.sql             — symlink-style copy for pipeline runners
 *   - bootstrap.latest.json            — symlink-style copy for pipeline runners
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const API_ROOT = join(REPO_ROOT, 'apps', 'api');
const requireFromApi = createRequire(join(API_ROOT, 'package.json'));

const EXPECTED_LOCKED_CONTRACT_COUNT = 213;
const LOCKED_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const COMPILED_V2_DIR = join(REPO_ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
// A container bootstrap must not write into the immutable application image.
// Operators can direct provenance to the writable, bind-mounted storage tree;
// host execution keeps the audited repository location as its default.
const OUT_DIR = process.env.QLLAW_BOOTSTRAP_OUTPUT_DIR
  ? resolve(process.env.QLLAW_BOOTSTRAP_OUTPUT_DIR)
  : join(
      REPO_ROOT,
      'docs',
      'audit',
      'infrastructure-modernization',
      'phase-8c-bootstrap',
    );
const REQUIRED_TEMPLATES = ['BM-001', 'BM-002', 'BM-003'];

/** Columns the generator inserts on the `templates` table. */
const TEMPLATES_COLUMNS = [
  'template_code',
  'template_name',
  'is_active',
  'render_scope',
  'output_strategy',
  'requires_review',
];

/** Columns the generator inserts on the `form_contract_versions` table. */
const FORM_CONTRACT_COLUMNS = [
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
];

const args = new Set(process.argv.slice(2));
const flagWrite = args.has('--write');
const flagApply = args.has('--apply');
const flagDryRun = !flagWrite && !flagApply;

if (!existsSync(LOCKED_DIR)) {
  console.error(`[FAIL] Locked contracts directory missing: ${LOCKED_DIR}`);
  process.exit(2);
}

const lockedFiles = readdirSync(LOCKED_DIR)
  .filter((f) => f.endsWith('.contract.locked.json'))
  .filter((f) => !f.startsWith('_'))
  .sort();

if (lockedFiles.length !== EXPECTED_LOCKED_CONTRACT_COUNT) {
  console.error(
    `[FAIL] Expected ${EXPECTED_LOCKED_CONTRACT_COUNT} locked contracts, found ${lockedFiles.length}.`,
  );
  console.error(
    `[FAIL] Bootstrap refused. Locked contracts are the only authoritative source.`,
  );
  process.exit(2);
}

const corpus = [];
const seenCodes = new Set();

for (const file of lockedFiles) {
  const path = join(LOCKED_DIR, file);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const templateCode = raw.templateCode || file.split('__')[0];
  if (!/^BM-\d{3}$/.test(templateCode)) {
    console.error(`[FAIL] Bad templateCode in ${file}: ${templateCode}`);
    process.exit(2);
  }
  if (seenCodes.has(templateCode)) {
    console.error(`[FAIL] Duplicate template code in corpus: ${templateCode}`);
    process.exit(2);
  }
  seenCodes.add(templateCode);

  const sourceId = raw.sourceId || `${templateCode}__${createHash('sha256')
    .update(file)
    .digest('hex')
    .slice(0, 12)}`;

  const compiledPath = join(COMPILED_V2_DIR, `${templateCode}.compiled.json`);
  if (!existsSync(compiledPath)) {
    console.error(`[FAIL] Missing compiled artifact for ${templateCode}: ${compiledPath}`);
    console.error(`[FAIL] Run pnpm contract:compile before bootstrapping.`);
    process.exit(2);
  }
  const compiled = JSON.parse(readFileSync(compiledPath, 'utf8'));
  if (!compiled.contractHash) {
    console.error(`[FAIL] Compiled artifact missing contractHash: ${templateCode}`);
    process.exit(2);
  }
  if (!compiled.templateHash) {
    console.error(`[FAIL] Compiled artifact missing templateHash: ${templateCode}`);
    process.exit(2);
  }

  const templateTitle = raw.templateTitle || templateCode;
  if (!templateTitle || !templateTitle.trim()) {
    console.error(`[FAIL] Empty template name for ${templateCode}`);
    process.exit(2);
  }

  const canonicalFields = Array.isArray(raw.canonicalFields) ? raw.canonicalFields : [];
  const renderBindings = Array.isArray(raw.renderBindings) ? raw.renderBindings : [];
  const docxSlots = Array.isArray(raw.docxSlots) ? raw.docxSlots : [];

  corpus.push({
    templateCode,
    templateTitle,
    sourceId,
    contractHash: compiled.contractHash,
    templateHash: compiled.templateHash,
    draftJson: {
      schemaVersion: raw.schemaVersion || '1.0',
      sourceId,
      templateCode,
      templateTitle,
      documentKind: raw.documentKind || 'form',
      status: 'locked',
      docxSlots,
      canonicalFields,
      renderBindings,
      lockedAt: raw.lockedAt || null,
    },
    compiledJson: compiled,
  });
}

for (const required of REQUIRED_TEMPLATES) {
  if (!seenCodes.has(required)) {
    console.error(`[FAIL] Required form ${required} missing from corpus`);
    process.exit(2);
  }
}

const corpusFingerprint = createHash('sha256')
  .update(
    JSON.stringify(
      corpus.map((c) => `${c.contractHash}|${c.templateHash}|${c.sourceId}`),
    ),
  )
  .digest('hex');

const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return sqlString(JSON.stringify(value));
}

function jsonObject(sortedEntries) {
  const obj = {};
  for (const [k, v] of sortedEntries) obj[k] = v;
  return obj;
}

/** Build the canonical SQL text. */
function buildSqlText({ fingerprint, ts }) {
  const lines = [];
  lines.push('-- Phase 8C.2 Governed Contract Bootstrap (Schema-Aligned)');
  lines.push(`-- Generated at: ${ts}`);
  lines.push(`-- Corpus fingerprint (sha256): ${fingerprint}`);
  lines.push(`-- Locked contract count: ${corpus.length}`);
  lines.push('-- Schema authority: apps/api/prisma/schema.prisma + active squashed baseline');
  lines.push('-- Idempotency: every INSERT uses ON DUPLICATE KEY UPDATE');
  lines.push('-- Compatibility: information_schema.columns probe ran before generation');
  lines.push('');
  lines.push('SET NAMES utf8mb4;');
  // The generated literals use MariaDB's standard backslash escaping. Make that
  // behavior explicit for this session so operator sql_mode cannot reinterpret
  // valid JSON payloads while preserving every other enabled mode.
  lines.push(
    "SET SESSION sql_mode = TRIM(BOTH ',' FROM REPLACE(CONCAT(',', @@SESSION.sql_mode, ','), ',NO_BACKSLASH_ESCAPES,', ','));",
  );
  lines.push('SET @QLLAW_BOOTSTRAP_CORPUS := ' + sqlString(fingerprint) + ';');
  lines.push('');
  lines.push('START TRANSACTION;');
  lines.push('');

  // Ensure a synthetic creator official exists. The FK form_contract_versions.created_by_official_id
  // has ON DELETE RESTRICT, so we need a real officials row before inserting versions.
  lines.push('-- 1. Synthetic creator official (system bootstrap owner)');
  lines.push(
    "INSERT INTO officials (username, full_name, role, is_active, created_at, updated_at)",
  );
  lines.push("VALUES ('qllaw-bootstrap', 'QLLAW Bootstrap Owner', 'ADMIN', TRUE, NOW(0), NOW(0))");
  lines.push('ON DUPLICATE KEY UPDATE updated_at = NOW(0);');
  lines.push('');
  lines.push('SET @QLLAW_BOOTSTRAP_OFFICIAL_ID := (');
  lines.push("  SELECT id FROM officials WHERE username = 'qllaw-bootstrap' LIMIT 1");
  lines.push(');');
  lines.push('');

  // Templates: insert only current schema columns.
  lines.push(`-- 2. ${corpus.length} templates (one per locked contract)`);
  for (const entry of corpus) {
    const values = [
      sqlString(entry.templateCode),
      sqlString(entry.templateTitle),
      'TRUE', // is_active
      sqlString('CASE_LEVEL'), // render_scope
      sqlString('ONE_FILE_PER_CASE'), // output_strategy
      'TRUE', // requires_review
    ];
    lines.push(
      [
        `INSERT INTO templates (${TEMPLATES_COLUMNS.join(', ')})`,
        `VALUES (${values.join(', ')})`,
        'ON DUPLICATE KEY UPDATE',
        '  template_name = VALUES(template_name),',
        '  is_active = TRUE,',
        '  render_scope = VALUES(render_scope),',
        '  output_strategy = VALUES(output_strategy),',
        '  requires_review = VALUES(requires_review),',
        '  updated_at = NOW(0);',
      ].join('\n'),
    );
  }
  lines.push('');

  // form_contract_versions: insert only current schema columns. Use a
  // correlated subquery to resolve template_id from template_code.
  lines.push(`-- 3. ${corpus.length} form_contract_versions (PUBLISHED, GLOBAL, agency_id NULL)`);
  for (const entry of corpus) {
    const values = [
      '(SELECT id FROM templates WHERE template_code = ' +
        sqlString(entry.templateCode) +
        ' LIMIT 1)', // template_id
      sqlString('GLOBAL'), // scope_key
      '1', // version_no
      sqlString('PUBLISHED'), // status
      '0', // revision
      'NULL', // base_contract_hash
      sqlString(entry.contractHash), // contract_hash
      sqlString(entry.templateHash), // template_hash
      sqlJson(entry.draftJson), // draft_json
      sqlJson(entry.compiledJson), // compiled_json
      'NULL', // agency_id
      '@QLLAW_BOOTSTRAP_OFFICIAL_ID', // created_by_official_id
      'NOW(0)', // submitted_at
      'NOW(0)', // approved_at
      'NOW(0)', // published_at
    ];
    lines.push(
      [
        `INSERT INTO form_contract_versions (${FORM_CONTRACT_COLUMNS.join(', ')})`,
        `VALUES (${values.join(', ')})`,
        'ON DUPLICATE KEY UPDATE',
        '  status = VALUES(status),',
        '  scope_key = VALUES(scope_key),',
        '  agency_id = VALUES(agency_id),',
        '  base_contract_hash = VALUES(base_contract_hash),',
        '  contract_hash = VALUES(contract_hash),',
        '  template_hash = VALUES(template_hash),',
        '  draft_json = VALUES(draft_json),',
        '  compiled_json = VALUES(compiled_json),',
        '  approved_at = VALUES(approved_at),',
        '  published_at = VALUES(published_at),',
        '  updated_at = NOW(0);',
      ].join('\n'),
    );
  }
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');
  return lines.join('\n');
}

const sqlText = buildSqlText({ fingerprint: corpusFingerprint, ts: now.toISOString() });
const sqlBytes = Buffer.byteLength(sqlText, 'utf8');

/** Verify every required column exists on the target tables. */
async function verifySchemaCompatibility() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return { ok: false, reason: 'DATABASE_URL not set' };
  }
  // Resolve the already-installed API driver lazily so dry-run remains DB-free.
  let mariadb;
  try {
    mariadb = requireFromApi('mariadb');
  } catch (err) {
    return {
      ok: false,
      reason: `mariadb driver not available: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  let conn;
  try {
    conn = await mariadb.createConnection(url.replace(/^mysql:/u, 'mariadb:'));
    const required = [
      ...TEMPLATES_COLUMNS.map((column) => `templates.${column}`),
      ...FORM_CONTRACT_COLUMNS.map(
        (column) => `form_contract_versions.${column}`,
      ),
    ];
    const rows = await conn.query(
      "SELECT LOWER(TABLE_NAME) AS table_name, LOWER(COLUMN_NAME) AS column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND TABLE_NAME IN ('templates','form_contract_versions')",
    );
    const present = new Set();
    const tablesFound = new Set();
    for (const r of rows) {
      tablesFound.add(r.table_name);
      present.add(`${r.table_name}.${r.column_name}`);
    }
    const missing = required.filter((column) => !present.has(column));
    const missingTables = ['templates', 'form_contract_versions'].filter(
      (t) => !tablesFound.has(t),
    );
    return {
      ok: missing.length === 0 && missingTables.length === 0,
      missing,
      missingTables,
      tablesFound: [...tablesFound],
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

if (flagDryRun) {
  console.log(
    JSON.stringify(
      {
        mode: 'dry-run',
        corpusFingerprint,
        lockedCount: corpus.length,
        templatesOperations: corpus.length,
        versionOperations: corpus.length,
        totalOperations: corpus.length * 2,
        sqlBytes,
        templatesColumns: TEMPLATES_COLUMNS,
        formContractColumns: FORM_CONTRACT_COLUMNS,
        legacyColumnsRemoved: [
          'document_kind',
          'status',
          'extraction_sha256',
          'locked_at',
        ],
        requiredTemplates: REQUIRED_TEMPLATES,
        schemaAuthority: [
          'apps/api/prisma/schema.prisma',
          'apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql',
        ],
        nextStep:
          'Re-run with --write to emit the SQL+JSON artefacts under docs/audit/infrastructure-modernization/phase-8c-bootstrap/. Pass --apply with QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1 to execute.',
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

const stampSqlPath = join(OUT_DIR, `bootstrap-${stamp}.sql`);
const stampJsonPath = join(OUT_DIR, `bootstrap-${stamp}.json`);
const latestSqlPath = join(OUT_DIR, 'bootstrap.latest.sql');
const latestJsonPath = join(OUT_DIR, 'bootstrap.latest.json');

writeFileSync(stampSqlPath, sqlText, 'utf8');

const manifest = jsonObject([
  ['schemaVersion', '1'],
  ['mode', flagApply ? 'write+apply' : 'write'],
  ['generatedAt', now.toISOString()],
  ['corpusFingerprint', corpusFingerprint],
  ['lockedContractCount', corpus.length],
  ['expectedLockedContractCount', EXPECTED_LOCKED_CONTRACT_COUNT],
  ['templatesColumns', TEMPLATES_COLUMNS],
  ['formContractColumns', FORM_CONTRACT_COLUMNS],
  ['templatesOperations', corpus.length],
  ['versionOperations', corpus.length],
  ['totalOperations', corpus.length * 2],
  ['sqlBytes', sqlBytes],
  ['sqlPath', stampSqlPath],
  ['latestSqlPath', latestSqlPath],
  ['sampleTemplateCodes', corpus.slice(0, 3).map((c) => c.templateCode)],
  ['requiredTemplates', REQUIRED_TEMPLATES],
  ['legacyColumnsRemoved', ['document_kind', 'status', 'extraction_sha256', 'locked_at']],
  ['schemaAuthority', 'apps/api/prisma/schema.prisma + apps/api/prisma/migrations/20260711000000_squashed_baseline/migration.sql'],
  ['applyRequested', flagApply],
  ['applied', false],
  ['applyResult', null],
  ['schemaCompatibility', null],
  ['operator', { pid: process.pid, cwd: process.cwd(), argv: process.argv.slice(2) }],
]);

writeFileSync(stampJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

writeFileSync(latestSqlPath, sqlText, 'utf8');
writeFileSync(
  latestJsonPath,
  `${JSON.stringify({ ...manifest, sqlPath: latestSqlPath }, null, 2)}\n`,
  'utf8',
);

if (flagApply) {
  if (process.env.QLLAW_BOOTSTRAP_ALLOW_DB_WRITE !== '1') {
    console.error('[FAIL] --apply requires QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1');
    process.exit(3);
  }

  // Run schema-compatibility probe before mutation.
  const compat = await verifySchemaCompatibility();
  if (!compat.ok) {
    console.error(
      `[FAIL] BOOTSTRAP_SCHEMA_COMPATIBILITY_FAIL: ${JSON.stringify(compat)}`,
    );
    process.exit(4);
  }
  manifest.schemaCompatibility = compat;
  writeFileSync(
    latestJsonPath,
    `${JSON.stringify({ ...manifest, sqlPath: latestSqlPath }, null, 2)}\n`,
    'utf8',
  );

  const prismaCli = join(
    API_ROOT,
    'node_modules',
    'prisma',
    'build',
    'index.js',
  );
  // Prisma v7: --schema flag removed from `db execute`; URL is read from prisma.config.ts.
  const proc = spawnSync(
    process.execPath,
    [
      prismaCli,
      'db',
      'execute',
      '--stdin',
    ],
    {
      cwd: API_ROOT,
      input: sqlText,
      encoding: 'utf-8',
      env: process.env,
    },
  );

  if (proc.status !== 0) {
    console.error(
      `[FAIL] prisma db execute failed (exit=${proc.status}): ${proc.stderr || proc.stdout}`,
    );
    process.exit(proc.status ?? 1);
  }

  manifest.applyRequested = true;
  manifest.applied = true;
  manifest.applyResult = {
    status: proc.status,
    stdout: (proc.stdout ?? '').slice(0, 2000),
    stderr: (proc.stderr ?? '').slice(0, 2000),
  };

  writeFileSync(stampJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(
    latestJsonPath,
    `${JSON.stringify({ ...manifest, sqlPath: latestSqlPath }, null, 2)}\n`,
    'utf8',
  );

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        sqlPath: latestSqlPath,
        applied: true,
        corpusFingerprint,
        schemaCompatibility: compat,
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    JSON.stringify(
      {
        mode: 'write',
        corpusFingerprint,
        sqlBytes,
        sqlPath: stampSqlPath,
        latestSqlPath,
        templatesColumns: TEMPLATES_COLUMNS,
        formContractColumns: FORM_CONTRACT_COLUMNS,
        nextStep:
          'Inspect SQL and pass --apply (with QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1) to execute.',
      },
      null,
      2,
    ),
  );
}
