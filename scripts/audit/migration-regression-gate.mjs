#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/u, (match) => match.slice(1))), '..', '..');
const API_ROOT = join(ROOT, 'apps', 'api');
const SCHEMA = join(API_ROOT, 'prisma', 'schema.prisma');
const MIGRATIONS = join(API_ROOT, 'prisma', 'migrations');
const PRISMA_CLI = join(API_ROOT, 'node_modules', 'prisma', 'build', 'index.js');
const FORBIDDEN_RESOURCE_FRAGMENTS = [
  'quanlyvks',
  'hotpot-mysql',
  'hotpot-redis',
];

export function assertSafeResourceNames(resources) {
  for (const [kind, value] of Object.entries(resources)) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized || FORBIDDEN_RESOURCE_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      throw new Error(`Refusing known persistent resource name for ${kind}: ${value}`);
    }
    if (!normalized.startsWith('phase8b-migration-gate-')) {
      throw new Error(`Refusing non-Phase-8B resource name for ${kind}: ${value}`);
    }
  }
}

export async function runWithCleanup(work, cleanup) {
  let value = null;
  let error = null;
  let cleanupResult = null;
  let cleanupError = null;
  try {
    value = await work();
  } catch (caught) {
    error = caught instanceof Error ? caught : new Error(String(caught));
  } finally {
    try {
      cleanupResult = await cleanup();
    } catch (caught) {
      cleanupError = caught instanceof Error ? caught : new Error(String(caught));
    }
  }
  return { value, error, cleanup: cleanupResult, cleanupError };
}

export function evaluateGateResult(result) {
  const failures = [];
  if (result.emptyDatabase !== true) failures.push('empty_database');
  if (result.firstDeployExit !== 0) failures.push('first_deploy');
  if (result.secondDeployExit !== 0) failures.push('second_deploy');
  if (result.failedMigrationRows !== 0) failures.push('failed_migration_rows');
  if (result.statusExit !== 0) failures.push('migrate_status');
  if (result.schemaParity !== true) failures.push('schema_parity');

  const cleanup = result.cleanup ?? {};
  for (const field of ['containerRemoveExit', 'networkRemoveExit', 'volumeRemoveExit']) {
    if (cleanup[field] !== null && cleanup[field] !== undefined && cleanup[field] !== 0) {
      failures.push(`cleanup_${field}`);
    }
  }
  if ((cleanup.leftovers?.length ?? 0) !== 0) failures.push('cleanup_leftovers');
  if ((cleanup.errors?.length ?? 0) !== 0) failures.push('cleanup_errors');

  return {
    pass: failures.length === 0,
    exitCode: failures.length === 0 ? 0 : 1,
    failures,
  };
}

function parseOutputDir(argv) {
  const index = argv.indexOf('--output-dir');
  if (index === -1) return join(ROOT, '.artifacts', 'migration-regression-gate');
  if (!argv[index + 1]) throw new Error('--output-dir requires a path');
  return resolve(ROOT, argv[index + 1]);
}

function redact(value, secrets) {
  let output = String(value ?? '');
  for (const secret of secrets) output = output.replaceAll(secret, '<REDACTED>');
  return output.replace(/mysql:\/\/[^\s'"]+/giu, 'mysql://<REDACTED>');
}

function run(command, args, { cwd = ROOT, env = process.env, input, secrets = [] } = {}) {
  const started = Date.now();
  const child = spawnSync(command, args, {
    cwd,
    env,
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    exit: child.status ?? -1,
    signal: child.signal ?? null,
    stdout: redact(child.stdout, secrets),
    stderr: redact(child.stderr, secrets),
    durationMs: Date.now() - started,
  };
}

function requireExitZero(step, label) {
  if (step.exit !== 0) {
    throw new Error(`${label} failed with exit ${step.exit}: ${step.stderr || step.stdout}`);
  }
  return step;
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitHealthy(container, secrets) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const result = run('docker', ['inspect', '--format', '{{.State.Health.Status}}', container], { secrets });
    if (result.exit === 0 && result.stdout.trim() === 'healthy') return true;
    await sleep(1_500);
  }
  return false;
}

function activeMigrationInventory() {
  if (!existsSync(MIGRATIONS)) throw new Error(`Missing migrations directory: ${MIGRATIONS}`);
  const directories = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (directories.length !== 1) {
    throw new Error(`Expected exactly one active migration directory, found ${directories.length}`);
  }
  const migrationSql = join(MIGRATIONS, directories[0], 'migration.sql');
  if (!existsSync(migrationSql)) throw new Error(`Missing active migration SQL: ${migrationSql}`);
  const sql = readFileSync(migrationSql, 'utf8');
  const dataStatements = sql.match(/\b(?:INSERT\s+INTO|REPLACE\s+INTO|LOAD\s+DATA)\b/giu) ?? [];
  return {
    directories,
    migrationSql,
    dataStatementCount: dataStatements.length,
    requiredBootstrapData: dataStatements.length === 0 ? 'NONE' : 'PRESENT',
  };
}

async function main() {
  const began = Date.now();
  const suffix = `${new Date().toISOString().replace(/[-:TZ.]/gu, '').slice(0, 14)}-${randomBytes(4).toString('hex')}`;
  const runId = `phase8b-migration-gate-${suffix}`;
  const resources = {
    container: `${runId}-db`,
    network: `${runId}-net`,
    volume: `${runId}-data`,
  };
  assertSafeResourceNames(resources);

  const database = 'migration_gate';
  const user = 'migration_gate_user';
  const rootPassword = `root_${randomBytes(20).toString('hex')}`;
  const userPassword = `user_${randomBytes(20).toString('hex')}`;
  const secrets = [rootPassword, userPassword];
  const created = { container: false, network: false, volume: false };
  const outputDir = parseOutputDir(process.argv.slice(2));
  const outputPath = join(outputDir, `${runId}.json`);
  const result = {
    runId,
    startedAt: new Date().toISOString(),
    versions: { node: process.version, prisma: '6.19.3', mariaDbImage: 'mariadb:11' },
    resources,
    persistentCredentialsConsumed: false,
    emptyDatabase: false,
    firstDeployExit: null,
    secondDeployExit: null,
    failedMigrationRows: null,
    statusExit: null,
    schemaParity: false,
    structureCounts: null,
    bootstrap: null,
    steps: {},
    cleanup: null,
  };

  const docker = (args, options = {}) => run('docker', args, { ...options, secrets });
  const execRootSql = (sql) => docker([
    'exec',
    '-e', `MYSQL_PWD=${rootPassword}`,
    resources.container,
    'mariadb',
    '-uroot',
    '--batch',
    '--skip-column-names',
    '-e', sql,
    database,
  ]);

  let databaseUrl = null;
  const prisma = (args, { appendSchema = true } = {}) => run(
    process.execPath,
    [PRISMA_CLI, ...args, ...(appendSchema ? ['--schema', SCHEMA] : [])],
    {
    cwd: API_ROOT,
    env: {
      ...process.env,
      CI: 'true',
      NODE_ENV: 'development',
      DATABASE_URL: databaseUrl,
    },
    secrets,
    },
  );

  async function work() {
    for (const prerequisite of [SCHEMA, PRISMA_CLI]) {
      if (!existsSync(prerequisite)) throw new Error(`Missing prerequisite: ${prerequisite}`);
    }
    result.bootstrap = activeMigrationInventory();

    const staged = requireExitZero(run('git', ['diff', '--cached', '--name-only']), 'git staged precondition');
    if (staged.stdout.trim()) throw new Error('Staged files must remain zero');

    result.steps.dockerVersion = requireExitZero(
      docker(['version', '--format', '{{.Server.Version}}']),
      'Docker server prerequisite',
    );
    result.steps.networkCreate = requireExitZero(docker(['network', 'create', resources.network]), 'network create');
    created.network = true;
    result.steps.volumeCreate = requireExitZero(docker(['volume', 'create', resources.volume]), 'volume create');
    created.volume = true;
    result.steps.containerStart = requireExitZero(docker([
      'run',
      '-d',
      '--name', resources.container,
      '--network', resources.network,
      '-e', `MARIADB_ROOT_PASSWORD=${rootPassword}`,
      '-e', `MARIADB_DATABASE=${database}`,
      '-e', `MARIADB_USER=${user}`,
      '-e', `MARIADB_PASSWORD=${userPassword}`,
      '-p', '127.0.0.1::3306',
      '-v', `${resources.volume}:/var/lib/mysql`,
      '--health-cmd=healthcheck.sh --connect --innodb_initialized',
      '--health-interval=2s',
      '--health-timeout=5s',
      '--health-retries=60',
      'mariadb:11',
      '--character-set-server=utf8mb4',
      '--collation-server=utf8mb4_unicode_ci',
      '--default-time-zone=+07:00',
    ]), 'MariaDB container start');
    created.container = true;
    if (!(await waitHealthy(resources.container, secrets))) {
      throw new Error('Disposable MariaDB did not become healthy');
    }

    const port = requireExitZero(docker(['port', resources.container, '3306/tcp']), 'dynamic port discovery');
    const portMatch = port.stdout.trim().match(/:(\d+)$/u);
    if (!portMatch) throw new Error(`Could not parse dynamic MariaDB port: ${port.stdout}`);
    databaseUrl = `mysql://${user}:${userPassword}@127.0.0.1:${portMatch[1]}/${database}`;

    const empty = requireExitZero(execRootSql(
      `SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${database}';`,
    ), 'empty database check');
    result.initialTableCount = Number(empty.stdout.trim());
    result.emptyDatabase = result.initialTableCount === 0;
    if (!result.emptyDatabase) throw new Error(`Disposable database is not empty: ${result.initialTableCount} tables`);

    result.steps.firstDeploy = prisma(['migrate', 'deploy']);
    result.firstDeployExit = result.steps.firstDeploy.exit;
    requireExitZero(result.steps.firstDeploy, 'first migrate deploy');

    result.steps.secondDeploy = prisma(['migrate', 'deploy']);
    result.secondDeployExit = result.steps.secondDeploy.exit;
    requireExitZero(result.steps.secondDeploy, 'second migrate deploy');

    const failedRows = requireExitZero(execRootSql(
      'SELECT COUNT(*) FROM `_prisma_migrations` WHERE finished_at IS NULL AND rolled_back_at IS NULL;',
    ), 'failed migration row check');
    result.failedMigrationRows = Number(failedRows.stdout.trim());

    result.steps.status = prisma(['migrate', 'status']);
    result.statusExit = result.steps.status.exit;
    requireExitZero(result.steps.status, 'migrate status');

    result.steps.schemaDiff = prisma([
      'migrate', 'diff',
      '--from-url', databaseUrl,
      '--to-schema-datamodel', SCHEMA,
      '--script',
    ], { appendSchema: false });
    requireExitZero(result.steps.schemaDiff, 'database-to-datamodel diff');
    const diffText = result.steps.schemaDiff.stdout.trim();
    result.schemaParity = diffText === '' || /This is an empty migration\./u.test(diffText);

    const counts = requireExitZero(execRootSql([
      'SELECT',
      `(SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${database}'),`,
      `(SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${database}');`,
    ].join(' ')), 'table and column counts');
    const [tables, columns] = counts.stdout.trim().split('\t').map(Number);
    result.structureCounts = { tables, columns };

    if (!result.schemaParity) throw new Error(`Schema parity failed: ${diffText}`);
    if (result.failedMigrationRows !== 0) {
      throw new Error(`Active failed migration rows: ${result.failedMigrationRows}`);
    }
    return result;
  }

  async function cleanup() {
    const cleanupResult = {
      containerRemoveExit: null,
      networkRemoveExit: null,
      volumeRemoveExit: null,
      leftovers: [],
      errors: [],
    };
    if (created.container) {
      const step = docker(['rm', '-f', resources.container]);
      cleanupResult.containerRemoveExit = step.exit;
      if (step.exit !== 0) cleanupResult.errors.push(redact(step.stderr || step.stdout, secrets));
    }
    if (created.network) {
      const step = docker(['network', 'rm', resources.network]);
      cleanupResult.networkRemoveExit = step.exit;
      if (step.exit !== 0) cleanupResult.errors.push(redact(step.stderr || step.stdout, secrets));
    }
    if (created.volume) {
      const step = docker(['volume', 'rm', resources.volume]);
      cleanupResult.volumeRemoveExit = step.exit;
      if (step.exit !== 0) cleanupResult.errors.push(redact(step.stderr || step.stdout, secrets));
    }

    const probes = [
      docker(['ps', '-a', '--filter', `name=^/${resources.container}$`, '--format', '{{.Names}}']),
      docker(['network', 'ls', '--filter', `name=^${resources.network}$`, '--format', '{{.Name}}']),
      docker(['volume', 'ls', '--filter', `name=^${resources.volume}$`, '--format', '{{.Name}}']),
    ];
    cleanupResult.leftovers = probes.flatMap((probe) => (
      probe.stdout.trim() ? probe.stdout.trim().split(/\r?\n/u) : []
    ));
    return cleanupResult;
  }

  const lifecycle = await runWithCleanup(work, cleanup);
  result.cleanup = lifecycle.cleanup ?? {
    containerRemoveExit: null,
    networkRemoveExit: null,
    volumeRemoveExit: null,
    leftovers: [],
    errors: [lifecycle.cleanupError?.message ?? 'cleanup did not return a result'],
  };
  if (lifecycle.error) result.workError = redact(lifecycle.error.message, secrets);
  if (lifecycle.cleanupError) result.cleanupError = redact(lifecycle.cleanupError.message, secrets);
  result.completedAt = new Date().toISOString();
  result.durationMs = Date.now() - began;
  const evaluation = evaluateGateResult(result);
  result.verdict = evaluation.pass ? 'PASS' : 'FAIL';
  result.failures = evaluation.failures;

  try {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    result.verdict = 'FAIL';
    result.failures.push('evidence_write');
    console.error(`Failed to write migration gate evidence: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    runId,
    verdict: result.verdict,
    activeMigration: result.bootstrap?.directories ?? [],
    emptyDatabase: result.emptyDatabase,
    firstDeployExit: result.firstDeployExit,
    secondDeployExit: result.secondDeployExit,
    failedMigrationRows: result.failedMigrationRows,
    statusExit: result.statusExit,
    schemaParity: result.schemaParity,
    structureCounts: result.structureCounts,
    bootstrap: result.bootstrap ? {
      requiredBootstrapData: result.bootstrap.requiredBootstrapData,
      dataStatementCount: result.bootstrap.dataStatementCount,
    } : null,
    cleanup: result.cleanup,
    failures: result.failures,
    evidence: outputPath,
  }, null, 2));
  process.exitCode = evaluation.exitCode;
}

const invokedAsScript = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedAsScript) {
  await main();
}
