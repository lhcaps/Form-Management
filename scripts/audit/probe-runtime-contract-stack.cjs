#!/usr/bin/env node

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs', 'audit', 'runtime-contract-stack');
const OUT_JSON = path.join(OUT_DIR, 'latest.json');
const OUT_MD = path.join(OUT_DIR, 'latest.md');
const COMMAND_TIMEOUT_MS = 30000;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function runCommand(name, command, timeoutMs = COMMAND_TIMEOUT_MS) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
  });
  const timedOut = Boolean(result.error && result.error.code === 'ETIMEDOUT');
  return {
    name,
    command,
    startedAt,
    exitCode: typeof result.status === 'number' ? result.status : null,
    timedOut,
    ok: result.status === 0 && !timedOut,
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr || (result.error ? result.error.message : '')),
  };
}

function trimOutput(value, limit = 6000) {
  const text = String(value ?? '').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n... [truncated ${text.length - limit} chars]`;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function safeDatabaseTarget(databaseUrl) {
  if (!databaseUrl) return null;
  try {
    const parsed = new URL(databaseUrl);
    return {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parsed.port || null,
      database: parsed.pathname.replace(/^\//, '') || null,
      usernameSet: Boolean(parsed.username),
      passwordSet: Boolean(parsed.password),
    };
  } catch (err) {
    return {
      parseError: err.message,
    };
  }
}

function probeTcp(host, port, timeoutMs = 3000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let settled = false;

    function finish(ok, error) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        host,
        port,
        ok,
        error: error ? String(error.message || error) : null,
      });
    }

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, null));
    socket.once('timeout', () => finish(false, new Error('TCP probe timed out')));
    socket.once('error', err => finish(false, err));
    socket.connect(port, host);
  });
}

function parseContractSyncMode(commandResult) {
  const output = `${commandResult.stdout}\n${commandResult.stderr}`;
  const strategy = output.match(/Strategy:\s*([A-Z_]+)/)?.[1] ?? null;
  const matched = Number(output.match(/Matched:\s*(\d+)/)?.[1] ?? NaN);
  const missing = Number(output.match(/Missing in DB:\s*(\d+)/)?.[1] ?? NaN);
  const stale = Number(output.match(/Stale:\s*(\d+)/)?.[1] ?? NaN);
  return {
    strategy,
    matched: Number.isFinite(matched) ? matched : null,
    missingInDb: Number.isFinite(missing) ? missing : null,
    stale: Number.isFinite(stale) ? stale : null,
    databaseUrlMissing: /DATABASE_URL not set/.test(output),
  };
}

function mdEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function buildMarkdown(report) {
  const lines = [
    '# Runtime Contract Stack Probe',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    '| Check | Result | Evidence |',
    '|-------|--------|----------|',
    `| Docker daemon | ${report.summary.dockerDaemonAvailable ? 'PASS' : 'FAIL'} | ${mdEscape(report.summary.dockerReason)} |`,
    `| Dev compose config | ${report.summary.devComposeConfigOk ? 'PASS' : 'FAIL'} | docker compose config --quiet |`,
    `| Prod compose config | ${report.summary.prodComposeConfigOk ? 'PASS' : 'FAIL'} | docker compose config --quiet |`,
    `| DB TCP ${report.database.target?.host ?? 'unknown'}:${report.database.target?.port ?? 'unknown'} | ${report.summary.databaseTcpOpen ? 'PASS' : 'FAIL'} | ${mdEscape(report.summary.databaseReason)} |`,
    `| Prisma migrate status | ${report.summary.prismaMigrateStatusOk ? 'PASS' : 'FAIL'} | ${mdEscape(report.summary.prismaReason)} |`,
    `| Contract sync | ${report.summary.contractSyncOk ? 'PASS' : 'FAIL'} | ${mdEscape(report.summary.contractSyncReason)} |`,
    `| Publish forms DB plan | ${report.summary.publishPlanOk ? 'PASS' : 'FAIL'} | ${mdEscape(report.summary.publishPlanReason)} |`,
    '',
    '## Database URL Evidence',
    '',
    '| Source | Present | Target |',
    '|--------|---------|--------|',
    `| process.env.DATABASE_URL | ${report.database.processEnvPresent ? 'YES' : 'NO'} | ${mdEscape(formatTarget(report.database.processTarget))} |`,
    `| .env DATABASE_URL | ${report.database.dotEnvPresent ? 'YES' : 'NO'} | ${mdEscape(formatTarget(report.database.dotEnvTarget))} |`,
    '',
    '## Command Results',
    '',
  ];

  for (const command of report.commands) {
    lines.push(`### ${command.name}`);
    lines.push('');
    lines.push(`- Command: \`${command.command}\``);
    lines.push(`- Exit: ${command.exitCode}`);
    lines.push(`- Timed out: ${command.timedOut ? 'YES' : 'NO'}`);
    if (command.stdout) {
      lines.push('');
      lines.push('```text');
      lines.push(command.stdout);
      lines.push('```');
    }
    if (command.stderr) {
      lines.push('');
      lines.push('```text');
      lines.push(command.stderr);
      lines.push('```');
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatTarget(target) {
  if (!target) return '-';
  if (target.parseError) return `parse error: ${target.parseError}`;
  return `${target.protocol}://${target.host}${target.port ? `:${target.port}` : ''}/${target.database ?? ''}`;
}

async function main() {
  const dotEnv = parseEnvFile(path.join(ROOT, '.env'));
  const dotEnvTarget = safeDatabaseTarget(dotEnv.DATABASE_URL);
  const processTarget = safeDatabaseTarget(process.env.DATABASE_URL);
  const dbTarget = dotEnvTarget && !dotEnvTarget.parseError
    ? dotEnvTarget
    : processTarget && !processTarget.parseError
      ? processTarget
      : { host: '127.0.0.1', port: '3307' };

  const commands = [
    runCommand('docker version', 'docker version', 15000),
    runCommand('docker context ls', 'docker context ls', 15000),
    runCommand('dev compose config', 'docker compose -f infra\\docker-compose.dev.yml config --quiet', 15000),
    runCommand('prod compose config', 'docker compose --env-file .env.docker.example -f docker-compose.prod.yml config --quiet', 15000),
    runCommand(
      'prisma migrate status',
      'node --env-file=.env apps\\api\\node_modules\\prisma\\build\\index.js migrate status --schema apps\\api\\prisma\\schema.prisma',
      30000,
    ),
    runCommand('contract sync gate', 'node scripts\\audit\\audit-contract-sync.mjs', 30000),
    runCommand(
      'forms DB publish plan',
      'set OFFICIAL_ID=1&& set AGENCY_ID=&& node apps\\api\\node_modules\\tsx\\dist\\cli.mjs scripts\\docx-contract\\publish-locked-contracts-to-db.mjs --plan',
      30000,
    ),
  ];

  const tcpProbe = await probeTcp(dbTarget.host || '127.0.0.1', Number(dbTarget.port || 3306));
  const contractSync = parseContractSyncMode(commands.find(command => command.name === 'contract sync gate'));
  const dockerVersion = commands.find(command => command.name === 'docker version');
  const prismaStatus = commands.find(command => command.name === 'prisma migrate status');
  const publishPlan = commands.find(command => command.name === 'forms DB publish plan');

  const report = {
    schemaVersion: '1.0',
    task: 'RUNTIME_CONTRACT_STACK_PROBE',
    generatedAt: new Date().toISOString(),
    database: {
      processEnvPresent: Boolean(process.env.DATABASE_URL),
      processTarget,
      dotEnvPresent: Boolean(dotEnv.DATABASE_URL),
      dotEnvTarget,
      target: dbTarget,
      tcpProbe,
    },
    commands,
    parsed: {
      contractSync,
    },
    summary: {
      dockerDaemonAvailable: dockerVersion.ok,
      dockerReason: dockerVersion.ok
        ? 'Docker daemon reachable.'
        : 'Docker client is installed, but daemon is not reachable from current context.',
      devComposeConfigOk: commands.find(command => command.name === 'dev compose config').ok,
      prodComposeConfigOk: commands.find(command => command.name === 'prod compose config').ok,
      databaseTcpOpen: tcpProbe.ok,
      databaseReason: tcpProbe.ok
        ? 'TCP connection succeeded.'
        : tcpProbe.error || 'TCP connection failed.',
      prismaMigrateStatusOk: prismaStatus.ok,
      prismaReason: prismaStatus.ok
        ? 'Prisma migrate status completed.'
        : 'Prisma migrate status failed; check DB availability before treating as migration drift.',
      contractSyncOk: commands.find(command => command.name === 'contract sync gate').ok,
      contractSyncReason: contractSync.strategy
        ? `Strategy=${contractSync.strategy}, matched=${contractSync.matched}, stale=${contractSync.stale}.`
        : 'Could not parse contract sync output.',
      publishPlanOk: publishPlan.ok,
      publishPlanReason: publishPlan.ok
        ? 'Publish plan generated successfully.'
        : 'Publish plan failed; check OFFICIAL_ID/AGENCY_ID and script/runtime readiness.',
    },
  };

  ensureDir(OUT_DIR);
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, `${buildMarkdown(report)}\n`);

  console.log(`Written: ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Written: ${path.relative(ROOT, OUT_MD)}`);
  console.log(`Docker daemon: ${report.summary.dockerDaemonAvailable ? 'OK' : 'FAIL'}`);
  console.log(`DB TCP: ${report.summary.databaseTcpOpen ? 'OK' : 'FAIL'}`);
  console.log(`Prisma migrate status: ${report.summary.prismaMigrateStatusOk ? 'OK' : 'FAIL'}`);
  console.log(`Contract sync: ${report.summary.contractSyncReason}`);
  console.log(`Publish plan: ${report.summary.publishPlanOk ? 'OK' : 'FAIL'}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
