#!/usr/bin/env node
/**
 * Phase 8C.2 — Disposable Bootstrap Closure.
 *
 * Sequence (all inside a disposable MariaDB + freshly-built API image):
 *   1. Stand up fresh MariaDB + network + build API image from current source.
 *   2. Run active baseline migration deploy (twice — idempotency proof).
 *   3. Capture readiness BEFORE bootstrap (expect HTTP 503 with contracts.ok=false).
 *   4. Generate bootstrap SQL via corrected generator (schema-aligned).
 *   5. Apply through the official guarded `--apply` command.
 *   6. Apply bootstrap SQL again (idempotency — NO_SEMANTIC_CHANGE).
 *   7. Restart API in production-equivalent mode, capture readiness (expect HTTP 200).
 *   8. Verify counts/fingerprints unchanged after restart.
 *   9. Tear down all Phase 8C.2 disposable resources.
 *
 * Refusal rules:
 *   - Refuses if DATASETS being touched include legacy columns or non-current schema targets.
 *   - Cleanup is final. No persistent resource is reused.
 */

import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.QLLAW_REPO_ROOT || resolve(__dirname, '..', '..');
const RUN_ID =
  process.env.QLLAW_RUN_ID ||
  `phase8c2-${new Date().toISOString().replace(/[-:T]/g, '').replace(/\..*/, 'z').slice(0, 16).toLowerCase()}`;
const NET_NAME = `${RUN_ID}-net`;
const VOLUME_NAME = `${RUN_ID}-dbdata`;
const MYSQL_NAME = `${RUN_ID}-mysql`;
const API_NAME = `${RUN_ID}-api`;
const IMAGE_TAG = `${RUN_ID}-api:test`;
const DB_PORT = 3306;
const API_CONTAINER_PORT = 3001;
// synchronously pick a port by running a small helper node script.
function findFreePortSync() {
  try {
    const out = execSync(
      `node "${join(__dirname, '_pick-free-port.cjs')}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    return out || '3001';
  } catch (_) {
    return '3001';
  }
}
const MYSQL_HOST_PORT = Number(findFreePortSync());
let API_PORT = null;
const HOST_DATABASE_URL = `mysql://qllaw:qllaw@127.0.0.1:${MYSQL_HOST_PORT}/qllaw`;
const BOOTSTRAP_ENV = {
  ...process.env,
  CI: 'true',
  DATABASE_URL: HOST_DATABASE_URL,
  QLLAW_BOOTSTRAP_ALLOW_DB_WRITE: '1',
};
const OUT_DIR = join(REPO, '.artifacts', 'phase-8c2-bootstrap');

mkdirSync(OUT_DIR, { recursive: true });

const RUN_LOG = [];
const log = (name, payload) => {
  const entry = { step: name, timestamp: new Date().toISOString(), ...payload };
  RUN_LOG.push(entry);
  console.log(JSON.stringify(entry, null, 2));
  writeFileSync(
    join(OUT_DIR, `${RUN_ID}.latest.json`),
    JSON.stringify({ runId: RUN_ID, steps: RUN_LOG }, null, 2),
  );
  return entry;
};

const sh = (cmd, opts = {}) =>
  spawnSync(cmd, { shell: true, encoding: 'utf-8', ...opts });
const shQ = (cmd, opts = {}) =>
  execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...opts });

function docker(...args) {
  return sh(`docker ${args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ')}`);
}

function fingerprintSqlText(sqlText) {
  // Strip the timestamped comment block at the top, fingerprint the canonical insert lines.
  const idx = sqlText.indexOf('SET NAMES utf8mb4;');
  const canonical = idx < 0 ? sqlText : sqlText.slice(idx);
  return createHash('sha256').update(canonical).digest('hex');
}

// -- 0. Capture pre-state (must be zero matching resources) --
{
  const checks = [
    sh(`docker ps -a --filter "name=${RUN_ID}" --format "container|{{.Names}}"`),
    sh(`docker network ls --filter "name=${RUN_ID}" --format "network|{{.Name}}"`),
    sh(`docker volume ls --filter "name=${RUN_ID}" --format "volume|{{.Name}}"`),
    sh(`docker images --filter "reference=${RUN_ID}*" --format "image|{{.Repository}}:{{.Tag}}"`),
  ];
  const matches = checks.flatMap((result) =>
    (result.stdout || '').trim().split('\n').filter(Boolean),
  );
  if (matches.length > 0) {
    console.error(`[FAIL] Pre-existing ${RUN_ID} resources found:\n${matches.join('\n')}`);
    process.exit(2);
  }
}

let cleanupAttempted = false;
function cleanupDisposableResources(reason) {
  if (cleanupAttempted) return null;
  cleanupAttempted = true;
  const containerRm = sh(`docker rm -f ${API_NAME} ${MYSQL_NAME}`);
  const networkRm = sh(`docker network rm ${NET_NAME}`);
  const imageRm = sh(`docker image rm ${IMAGE_TAG}`);
  const volumeRm = sh(`docker volume rm ${VOLUME_NAME}`);
  return {
    reason,
    containerRm: containerRm.status,
    networkRm: networkRm.status,
    imageRm: imageRm.status,
    volumeRm: volumeRm.status,
  };
}

process.on('exit', (code) => {
  const cleanup = cleanupDisposableResources(`process-exit-${code}`);
  if (cleanup && code !== 0) {
    console.error(JSON.stringify({ step: 'failure-cleanup', ...cleanup }));
  }
});
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

// -- 1. Fresh disposable stack --
{
  // Create a dedicated network.
  const r = sh(`docker network create ${NET_NAME}`);
  if (r.status !== 0) {
    console.error(`[FAIL] Could not create network ${NET_NAME}: ${r.stderr || r.stdout}`);
    process.exit(2);
  }
}
{
  const r = sh(`docker volume create ${VOLUME_NAME}`);
  if (r.status !== 0) {
    console.error(`[FAIL] Could not create volume ${VOLUME_NAME}: ${r.stderr || r.stdout}`);
    process.exit(2);
  }
}
{
  // Start MariaDB
  const r = sh(
    `docker run -d --name ${MYSQL_NAME} --network ${NET_NAME} ` +
      `-e MARIADB_ROOT_PASSWORD=rootpw ` +
      `-e MARIADB_DATABASE=qllaw ` +
      `-e MARIADB_USER=qllaw ` +
      `-e MARIADB_PASSWORD=qllaw ` +
      `-p 127.0.0.1:${MYSQL_HOST_PORT}:${DB_PORT} ` +
      `-v ${VOLUME_NAME}:/var/lib/mysql ` +
      `mariadb:11 --port ${DB_PORT}`,
  );
  if (r.status !== 0) {
    console.error(`[FAIL] Could not start MariaDB: ${r.stderr || r.stdout}`);
    process.exit(2);
  }
}

// Wait for MariaDB to be ready
{
  let ready = false;
  for (let i = 0; i < 30; i += 1) {
    const ping = sh(
      `docker exec ${MYSQL_NAME} mariadb -uroot -prootpw -e "SELECT 1" 2>&1`,
    );
    if (ping.status === 0 && /1/.test(ping.stdout || '')) {
      ready = true;
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  if (!ready) {
    console.error('[FAIL] MariaDB did not become ready within 60s');
    process.exit(2);
  }
  API_PORT = Number(findFreePortSync());
}

// -- 2. Pre-migration fresh DB (user tables = 0; _prisma_migrations does not exist yet) --
{
  const c = sh(
    `docker exec ${MYSQL_NAME} mariadb -uroot -prootpw qllaw -e "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema='qllaw'"`,
  );
  const m = (c.stdout || '').match(/(\d+)/);
  const count = m ? Number(m[1]) : -1;
  log('pre-migration-user-tables', { count });
  if (count !== 0) {
    console.error(`[FAIL] Pre-migration user tables should be 0; found ${count}`);
    process.exit(2);
  }
}

let initialMigrationState = null;

// Prove the active migration from the same host-visible disposable database.
{
  const deploy1 = sh('pnpm --filter api exec prisma migrate deploy', {
    cwd: REPO,
    env: BOOTSTRAP_ENV,
  });
  const deploy2 = sh('pnpm --filter api exec prisma migrate deploy', {
    cwd: REPO,
    env: BOOTSTRAP_ENV,
  });
  const status = sh('pnpm --filter api exec prisma migrate status', {
    cwd: REPO,
    env: BOOTSTRAP_ENV,
  });
  const diff = sh(
    `pnpm --filter api exec prisma migrate diff --exit-code --from-url ${HOST_DATABASE_URL} --to-schema-datamodel prisma/schema.prisma`,
    { cwd: REPO, env: BOOTSTRAP_ENV },
  );
  initialMigrationState = readMigrationState();
  if (
    deploy1.status !== 0 ||
    deploy2.status !== 0 ||
    status.status !== 0 ||
    diff.status !== 0 ||
    initialMigrationState.migrationRows !== 1 ||
    initialMigrationState.failedMigrationRows !== 0
  ) {
    console.error('[FAIL] disposable migration deploy/status proof failed');
    process.exit(2);
  }
  log('migration-deploy-status', {
    firstDeployExit: deploy1.status,
    secondDeployExit: deploy2.status,
    statusExit: status.status,
    diffExit: diff.status,
    migrationCount: initialMigrationState.migrationRows,
    failedMigrationCount: initialMigrationState.failedMigrationRows,
    migrationMetadataSha256: initialMigrationState.metadataSha256,
  });
}

// -- Build the API image from current source --
{
  const r = sh(
    `docker build -f docker/api.Dockerfile -t ${IMAGE_TAG} . 2>&1`,
    { cwd: REPO },
  );
  if (r.status !== 0) {
    console.error(
      `[FAIL] docker build failed (exit=${r.status}). Last 2000 chars:\n${(r.stdout || r.stderr || '').slice(-2000)}`,
    );
    process.exit(2);
  }
  const inspect = sh(`docker image inspect ${IMAGE_TAG} --format "{{.Id}}"`);
  if (inspect.status !== 0) {
    console.error(`[FAIL] docker image inspect failed: ${inspect.stderr || inspect.stdout}`);
    process.exit(2);
  }
  log('docker-build', {
    exit: r.status,
    imageId: (inspect.stdout || '').trim(),
  });
}

// Start API container. It runs migrate deploy automatically via entrypoint.
{
  // Use seed disabled, Times New Roman bind-mounted from C:\Windows\Fonts (operator-licensed,
  // host-installed), QLLAW_FONT_POLICY=required, and safe dummy Clerk config (no real secret
  // contact; only format validation accepted by config).
  const run = sh(
    `docker run -d --name ${API_NAME} --network ${NET_NAME} ` +
      `-p 127.0.0.1:${API_PORT}:${API_CONTAINER_PORT} ` +
      `-e NODE_ENV=production ` +
      `-e API_PORT=${API_CONTAINER_PORT} ` +
      `-e DB_HOST=${MYSQL_NAME} ` +
      `-e DB_PORT=${DB_PORT} ` +
      `-e MYSQL_DATABASE=qllaw ` +
      `-e MYSQL_USER=qllaw ` +
      `-e MYSQL_PASSWORD=qllaw ` +
      `-e DATABASE_URL=mysql://qllaw:qllaw@${MYSQL_NAME}:${DB_PORT}/qllaw ` +
      `-e SEED_DATA=false ` +
      `-e ALLOW_CONTRACT_DRIFT=1 ` +
      `-e QLLAW_FONT_POLICY=required ` +
      `-e QLLAW_REQUIRED_FONT_FAMILY="Times New Roman" ` +
      `-e QLLAW_CONTAINER_TNR_FONT_DIR=/opt/qllaw/fonts/times-new-roman ` +
      `-e WEB_ORIGIN=https://disposable.example ` +
      `-e AUTH_COOKIE_SECURE=true ` +
      `-e CLERK_SECRET_KEY=test-clerk-secret-disposable-000000000000000000000000 ` +
      `-e CLERK_WEBHOOK_SECRET=test-clerk-webhook-disposable-0000000000000000000000 ` +
      `-e SEED_ADMIN_PASSWORD=disposable-admin-password-12345 ` +
      `-e STORAGE_ROOT=/app/storage ` +
      `-e LIBREOFFICE_PATH=/usr/bin/libreoffice ` +
      `-v "C:\\Windows\\Fonts:/opt/qllaw/fonts/times-new-roman:ro" ` +
      `${IMAGE_TAG}`,
  );
  if (run.status !== 0) {
    console.error(
      `[FAIL] docker run failed (exit=${run.status}). Stderr: ${run.stderr || run.stdout}`,
    );
    process.exit(2);
  }
  log('docker-run-api', { exit: run.status, port: API_PORT });
}

// -- Wait for API to become ready (any HTTP response = process alive) --
{
  let ready = false;
  for (let i = 0; i < 120; i += 1) {
    const code = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready 2>&1`);
    const status = (code.stdout || '').trim();
    if (status === '200' || status === '503') {
      ready = true;
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  if (!ready) {
    const apiLog = sh(`docker logs ${API_NAME} --tail 50 2>&1`);
    console.error(`[FAIL] API did not become ready. Tail logs:\n${apiLog.stdout}`);
    process.exit(2);
  }
}

// -- 3. Capture readiness BEFORE bootstrap (expect HTTP 503 with contracts missing) --
{
  const r = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready`);
  const body = sh(`curl -s http://127.0.0.1:${API_PORT}/api/v1/ready`);
  const payload = JSON.parse(body.stdout || '{}');
  log('readiness-before-bootstrap', {
    httpCode: r.stdout.trim(),
    body: payload,
  });
  if (r.stdout.trim() !== '503') {
    console.error(`[FAIL] Pre-bootstrap readiness expected 503; got ${r.stdout.trim()}`);
    process.exit(2);
  }
  if (payload?.checks?.contracts?.ok !== false) {
    console.error(`[FAIL] Pre-bootstrap contracts.ok expected false`);
    process.exit(2);
  }
  if (payload?.checks?.fonts?.ok !== true) {
    console.error(`[FAIL] Pre-bootstrap fonts.ok expected true`);
    process.exit(2);
  }
  const expectedMissingLocked = ['BM-001', 'BM-002', 'BM-003'];
  const actualMissingLocked = [...(payload?.checks?.contracts?.missingLocked ?? [])].sort();
  if (JSON.stringify(actualMissingLocked) !== JSON.stringify(expectedMissingLocked)) {
    console.error(
      `[FAIL] Pre-bootstrap missingLocked expected ${expectedMissingLocked.join(',')}; got ${actualMissingLocked.join(',')}`,
    );
    process.exit(2);
  }
}

// -- 4. Generate bootstrap SQL via corrected generator (host-side) --
let bootstrapSql = '';
let bootstrapManifest = null;
{
  const r = sh(
    `node scripts/audit/build-phase-8c-bootstrap-sql.mjs --dry-run`,
    { cwd: REPO },
  );
  if (r.status !== 0) {
    console.error(`[FAIL] generator dry-run failed: ${r.stderr || r.stdout}`);
    process.exit(2);
  }
  bootstrapManifest = JSON.parse(r.stdout);
  log('bootstrap-dry-run', bootstrapManifest);
  // Run a second time — fingerprint must match.
  const r2 = sh(
    `node scripts/audit/build-phase-8c-bootstrap-sql.mjs --dry-run`,
    { cwd: REPO },
  );
  const m2 = JSON.parse(r2.stdout);
  if (m2.corpusFingerprint !== bootstrapManifest.corpusFingerprint) {
    console.error('[FAIL] corpusFingerprint changed between invocations');
    process.exit(2);
  }
  // Write the SQL file out so we can read it back.
  const write = sh(
    `node scripts/audit/build-phase-8c-bootstrap-sql.mjs --write`,
    { cwd: REPO },
  );
  if (write.status !== 0) {
    console.error(`[FAIL] generator write failed: ${write.stderr || write.stdout}`);
    process.exit(2);
  }
  const sqlPath = JSON.parse(write.stdout).latestSqlPath;
  bootstrapSql = readFileSync(sqlPath, 'utf8');
  log('bootstrap-write', {
    sqlBytes: Buffer.byteLength(bootstrapSql, 'utf8'),
    sqlPath,
  });
}

function readBootstrapState() {
  const state = sh(
    `docker exec ${MYSQL_NAME} mariadb -uroot -prootpw qllaw -N -e "SET SESSION group_concat_max_len=16777216; SELECT (SELECT COUNT(*) FROM templates), (SELECT COUNT(*) FROM form_contract_versions), (SELECT COUNT(*) FROM (SELECT template_id, scope_key, version_no, COUNT(*) AS count FROM form_contract_versions GROUP BY template_id, scope_key, version_no HAVING count > 1) AS duplicates), SHA2(GROUP_CONCAT(CONCAT_WS('|', template.template_code, version.scope_key, version.version_no, version.status, version.contract_hash, version.template_hash, SHA2(version.draft_json, 256), SHA2(version.compiled_json, 256)) ORDER BY template.template_code SEPARATOR '\\n'), 256), SHA2(GROUP_CONCAT(CONCAT_WS('|', template.template_code, version.scope_key, version.version_no) ORDER BY template.template_code SEPARATOR '\\n'), 256) FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id;"`,
  );
  if (state.status !== 0) {
    throw new Error(`bootstrap state query failed: ${state.stderr || state.stdout}`);
  }
  const [templates, versions, duplicates, semanticFingerprint, naturalKeyFingerprint] =
    (state.stdout || '').trim().split('\t');
  return {
    templates: Number(templates),
    versions: Number(versions),
    duplicates: Number(duplicates),
    semanticFingerprint,
    naturalKeyFingerprint,
  };
}

function readMigrationState() {
  const state = sh(
    `docker exec ${MYSQL_NAME} mariadb -uroot -prootpw qllaw -N -e "SET SESSION group_concat_max_len=16777216; SELECT COUNT(*), COALESCE(SUM(CASE WHEN finished_at IS NULL AND rolled_back_at IS NULL THEN 1 ELSE 0 END), 0), SHA2(COALESCE(GROUP_CONCAT(CONCAT_WS('|', migration_name, checksum, COALESCE(CAST(UNIX_TIMESTAMP(started_at) AS CHAR), 'NULL'), COALESCE(CAST(UNIX_TIMESTAMP(finished_at) AS CHAR), 'NULL'), COALESCE(CAST(UNIX_TIMESTAMP(rolled_back_at) AS CHAR), 'NULL'), applied_steps_count, COALESCE(logs, '')) ORDER BY migration_name SEPARATOR '::'), ''), 256) FROM _prisma_migrations"`,
  );
  if (state.status !== 0) {
    throw new Error(`migration state query failed: ${state.stderr || state.stdout}`);
  }
  const [migrationRows, failedMigrationRows, metadataSha256] = (state.stdout || '')
    .trim()
    .split('\t');
  return {
    migrationRows: Number(migrationRows),
    failedMigrationRows: Number(failedMigrationRows),
    metadataSha256,
  };
}

// -- 5. Official bootstrap apply #1 --
let postApply1State = null;
{
  const apply = sh(
    'node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply',
    { cwd: REPO, env: BOOTSTRAP_ENV },
  );
  if (apply.status !== 0) {
    console.error(`[FAIL] bootstrap apply 1 failed: ${apply.stderr || apply.stdout}`);
    process.exit(2);
  }
  postApply1State = readBootstrapState();
  if (
    postApply1State.templates !== 213 ||
    postApply1State.versions !== 213 ||
    postApply1State.duplicates !== 0
  ) {
    console.error(`[FAIL] bootstrap apply 1 state invalid: ${JSON.stringify(postApply1State)}`);
    process.exit(2);
  }
  const required = sh(
    `docker exec ${MYSQL_NAME} mariadb -uroot -prootpw qllaw -N -e "SELECT template.template_code, version.contract_hash FROM form_contract_versions AS version JOIN templates AS template ON template.id = version.template_id WHERE template.template_code IN ('BM-001','BM-002','BM-003') ORDER BY template.template_code"`,
  );
  if (required.status !== 0) {
    console.error(`[FAIL] required-contract query failed: ${required.stderr}`);
    process.exit(2);
  }
  log('bootstrap-apply-1', {
    exit: apply.status,
    sqlFingerprint: fingerprintSqlText(bootstrapSql),
    ...postApply1State,
    requiredLockedHashes: (required.stdout || '').trim(),
  });
}

// -- 6. Official bootstrap apply #2 and derived idempotence proof --
{
  const apply = sh(
    'node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply',
    { cwd: REPO, env: BOOTSTRAP_ENV },
  );
  if (apply.status !== 0) {
    console.error(`[FAIL] bootstrap apply 2 failed: ${apply.stderr || apply.stdout}`);
    process.exit(2);
  }
  const postApply2State = readBootstrapState();
  const semanticChange =
    postApply2State.semanticFingerprint === postApply1State.semanticFingerprint &&
    postApply2State.naturalKeyFingerprint === postApply1State.naturalKeyFingerprint &&
    postApply2State.templates === 213 &&
    postApply2State.versions === 213 &&
    postApply2State.duplicates === 0
      ? 'NO_SEMANTIC_CHANGE'
      : 'CHANGED';
  log('bootstrap-apply-2', {
    exit: apply.status,
    ...postApply2State,
    semanticChange,
  });
  if (semanticChange !== 'NO_SEMANTIC_CHANGE') {
    console.error('[FAIL] bootstrap apply 2 changed semantic state');
    process.exit(2);
  }
}

// -- 9. Restart API in production-equivalent mode (no ALLOW_CONTRACT_DRIFT) --
{
  // Stop the existing API container (which still has ALLOW_CONTRACT_DRIFT=1 from initial start).
  sh(`docker stop ${API_NAME}`);
  sh(`docker rm -f ${API_NAME}`);
  const run = sh(
    `docker run -d --name ${API_NAME} --network ${NET_NAME} ` +
      `-p 127.0.0.1:${API_PORT}:${API_CONTAINER_PORT} ` +
      `-e NODE_ENV=production ` +
      `-e API_PORT=${API_CONTAINER_PORT} ` +
      `-e DB_HOST=${MYSQL_NAME} ` +
      `-e DB_PORT=${DB_PORT} ` +
      `-e MYSQL_DATABASE=qllaw ` +
      `-e MYSQL_USER=qllaw ` +
      `-e MYSQL_PASSWORD=qllaw ` +
      `-e DATABASE_URL=mysql://qllaw:qllaw@${MYSQL_NAME}:${DB_PORT}/qllaw ` +
      `-e SEED_DATA=false ` +
      `-e QLLAW_FONT_POLICY=required ` +
      `-e QLLAW_REQUIRED_FONT_FAMILY="Times New Roman" ` +
      `-e QLLAW_CONTAINER_TNR_FONT_DIR=/opt/qllaw/fonts/times-new-roman ` +
      `-e WEB_ORIGIN=https://disposable.example ` +
      `-e AUTH_COOKIE_SECURE=true ` +
      `-e CLERK_SECRET_KEY=test-clerk-secret-disposable-000000000000000000000000 ` +
      `-e CLERK_WEBHOOK_SECRET=test-clerk-webhook-disposable-0000000000000000000000 ` +
      `-e SEED_ADMIN_PASSWORD=disposable-admin-password-12345 ` +
      `-e STORAGE_ROOT=/app/storage ` +
      `-e LIBREOFFICE_PATH=/usr/bin/libreoffice ` +
      `-v "C:\\Windows\\Fonts:/opt/qllaw/fonts/times-new-roman:ro" ` +
      `${IMAGE_TAG}`,
  );
  if (run.status !== 0) {
    console.error(`[FAIL] docker run (prod-equivalent) failed: ${run.stderr || run.stdout}`);
    process.exit(2);
  }
  // Wait for ready
  let ready = false;
  for (let i = 0; i < 120; i += 1) {
    const code = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready 2>&1`);
    const status = (code.stdout || '').trim();
    if (status === '200') {
      ready = true;
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  if (!ready) {
    const apiLog = sh(`docker logs ${API_NAME} --tail 80 2>&1`);
    console.error(`[FAIL] API did not become ready. Tail logs:\n${apiLog.stdout}`);
    process.exit(2);
  }
  // Capture readiness now (expect HTTP 200)
  const r = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready`);
  const body = sh(`curl -s http://127.0.0.1:${API_PORT}/api/v1/ready`);
  const payload = JSON.parse(body.stdout || '{}');
  log('readiness-after-bootstrap', {
    httpCode: r.stdout.trim(),
    body: payload,
  });
  if (r.stdout.trim() !== '200') {
    console.error(`[FAIL] Post-bootstrap readiness expected 200; got ${r.stdout.trim()}`);
    process.exit(2);
  }
  if (payload?.checks?.contracts?.ok !== true) {
    console.error(`[FAIL] Post-bootstrap contracts.ok expected true`);
    process.exit(2);
  }
  if (payload?.checks?.fonts?.ok !== true) {
    console.error(`[FAIL] Post-bootstrap fonts.ok expected true`);
    process.exit(2);
  }
  if (
    !Array.isArray(payload?.checks?.contracts?.missingLocked) ||
    payload.checks.contracts.missingLocked.length !== 0
  ) {
    console.error(`[FAIL] Post-bootstrap missingLocked expected []`);
    process.exit(2);
  }
}

// -- 10. Restart again, verify counts/fingerprints unchanged --
{
  const before = readBootstrapState();
  const migrationStateBefore = readMigrationState();

  sh(`docker restart ${API_NAME}`);
  // Wait ready
  for (let i = 0; i < 60; i += 1) {
    const code = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready 2>&1`);
    const status = (code.stdout || '').trim();
    if (status === '200') break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
  }
  const r = sh(`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${API_PORT}/api/v1/ready`);
  const after = readBootstrapState();
  const migrationStateAfter = readMigrationState();
  const noSemanticChange = JSON.stringify(before) === JSON.stringify(after);
  const noMigrationChange =
    JSON.stringify(migrationStateBefore) === JSON.stringify(migrationStateAfter);
  const migrationStateMatchesInitial =
    JSON.stringify(migrationStateBefore) === JSON.stringify(initialMigrationState) &&
    JSON.stringify(migrationStateAfter) === JSON.stringify(initialMigrationState);

  log('restart-readiness-and-counts', {
    httpCode: r.stdout.trim(),
    templates: after.templates,
    versions: after.versions,
    duplicates: after.duplicates,
    migrationRowsBefore: migrationStateBefore.migrationRows,
    migrationRowsAfter: migrationStateAfter.migrationRows,
    failedMigrationRowsBefore: migrationStateBefore.failedMigrationRows,
    failedMigrationRowsAfter: migrationStateAfter.failedMigrationRows,
    migrationMetadataSha256Before: migrationStateBefore.metadataSha256,
    migrationMetadataSha256After: migrationStateAfter.metadataSha256,
    migrationStateUnchanged: noMigrationChange,
    migrationStateMatchesInitial,
    semanticFingerprintBefore: before.semanticFingerprint,
    semanticFingerprintAfter: after.semanticFingerprint,
    naturalKeyFingerprintBefore: before.naturalKeyFingerprint,
    naturalKeyFingerprintAfter: after.naturalKeyFingerprint,
    noSemanticChange,
  });
  if (r.stdout.trim() !== '200') {
    console.error(`[FAIL] Post-restart readiness expected 200; got ${r.stdout.trim()}`);
    process.exit(2);
  }
  if (!noSemanticChange) {
    console.error(`[FAIL] Contract fingerprint changed across restart`);
    process.exit(2);
  }
  if (!noMigrationChange || !migrationStateMatchesInitial) {
    console.error(`[FAIL] Migration state changed across restart or no longer matches initial 1/0 proof`);
    process.exit(2);
  }
}

// -- 11. Cleanup Phase 8C.2 disposable resources --
{
  const cleanup = cleanupDisposableResources('successful-run');
  log('cleanup', cleanup);
}

// -- 12. Final verify: matching containers / networks / images = 0 --
{
  const c = sh(`docker ps -a --filter "name=${RUN_ID}" --format "{{.Names}}"`);
  const n = sh(`docker network ls --filter "name=${RUN_ID}" --format "{{.Name}}"`);
  const v = sh(`docker volume ls --filter "name=${RUN_ID}" --format "{{.Name}}"`);
  const i = sh(`docker images --filter "reference=${RUN_ID}*" --format "{{.Repository}}:{{.Tag}}"`);
  const cLines = (c.stdout || '').trim().split('\n').filter(Boolean);
  const nLines = (n.stdout || '').trim().split('\n').filter(Boolean);
  const vLines = (v.stdout || '').trim().split('\n').filter(Boolean);
  const iLines = (i.stdout || '').trim().split('\n').filter(Boolean);
  log('final-verification-zero-resources', {
    containers: cLines,
    networks: nLines,
    volumes: vLines,
    images: iLines,
    allZero:
      cLines.length === 0 && nLines.length === 0 && vLines.length === 0 && iLines.length === 0,
  });
  if (cLines.length || nLines.length || vLines.length || iLines.length) {
    console.error('[FAIL] Phase 8C.2 disposable resources still present after cleanup');
    process.exit(2);
  }
}

console.log(`\n=== Phase 8C.2 Bootstrap Disposable Closure complete ===\nRun ID: ${RUN_ID}\nArtifacts: ${OUT_DIR}`);
