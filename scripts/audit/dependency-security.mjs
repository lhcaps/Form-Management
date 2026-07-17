import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const OUTPUT_DIR = join(ROOT, '.artifacts', 'dependency-security');
const SBOM_PATH = join(OUTPUT_DIR, 'sbom.cdx.json');
const AUDIT_PATH = join(OUTPUT_DIR, 'pnpm-audit-prod.json');
const OSV_LOCK_PATH = join(OUTPUT_DIR, 'osv-lockfile.json');
const OSV_SBOM_PATH = join(OUTPUT_DIR, 'osv-sbom.json');
const PNPM_COMMAND = process.env.npm_execpath ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const PNPM_PREFIX = process.env.npm_execpath ? [process.env.npm_execpath] : [];
const OSV_SCANNER = process.env.OSV_SCANNER || 'osv-scanner';
const OSV_IMAGE = process.env.OSV_SCANNER_IMAGE || 'ghcr.io/google/osv-scanner:latest';
const COMMAND_TIMEOUT_MS = Number(process.env.DEPENDENCY_SECURITY_TIMEOUT_MS ?? 120_000);
const PRODUCTION_WORKSPACES = ['api', 'web', '@qllaw/form-contracts'];

function run(command, args, outputPath, {
  allowNonZeroJson = false,
  shell = false,
  env,
  timeoutMs = COMMAND_TIMEOUT_MS,
} = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell,
    env: { ...process.env, ...env },
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) {
    const reason = result.error.code === 'ETIMEDOUT'
      ? `timed out after ${timeoutMs}ms`
      : `could not start: ${result.error.message}`;
    throw new Error(`${command} ${reason}`);
  }
  const stdout = `${result.stdout ?? ''}`;
  const output = `${stdout}${result.stderr ?? ''}`;
  // Security evidence paths must be parseable artifacts. Diagnostics remain in
  // the failure message/terminal instead of contaminating JSON scanner output.
  if (outputPath) writeFileSync(outputPath, stdout, 'utf8');
  if (result.status !== 0 && !allowNonZeroJson) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit ${result.status ?? 'unknown'}: ${output.trim().slice(0, 500)}`,
    );
  }
  return { output, stdout, status: result.status ?? 1 };
}

function parseJson(label, output) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} did not return JSON; refusing to report a false PASS.`);
  }
}

function runPnpm(args, outputPath, options) {
  return run(PNPM_COMMAND, [...PNPM_PREFIX, ...args], outputPath, {
    ...options,
    shell: options?.shell ?? (process.platform === 'win32' && PNPM_PREFIX.length === 0),
  });
}

function runOsv(scanArgs, outputPath) {
  try {
    return run(OSV_SCANNER, ['scan', 'source', ...scanArgs, '--format', 'json'], outputPath, {
      allowNonZeroJson: true,
    });
  } catch (error) {
    if (!String(error).includes('could not start')) throw error;
  }

  const mountPath = relative(ROOT, scanArgs.at(-1)).replaceAll('\\', '/');
  return run('docker', [
    'run', '--rm',
    '--mount', `type=bind,source=${ROOT},target=/src,readonly`,
    OSV_IMAGE,
    'scan', 'source', ...scanArgs.slice(0, -1), `/src/${mountPath}`,
    '--format', 'json',
  ], outputPath, { allowNonZeroJson: true });
}

function highOrCritical(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(highOrCritical);
  const severity = String(value.severity ?? value.database_specific?.severity ?? '').toLowerCase();
  if (severity === 'high' || severity === 'critical') return true;
  return Object.values(value).some(highOrCritical);
}

function componentPurl(name, version) {
  return `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
}

function collectProductionDependencies(dependencies, components) {
  if (!dependencies || typeof dependencies !== 'object') return;
  for (const [name, dependency] of Object.entries(dependencies)) {
    if (!dependency || typeof dependency !== 'object') continue;
    const version = String(dependency.version ?? '');
    // `pnpm list --prod` can expose link: values when an undeclared dev package
    // happens to be installed. They are not resolved production components.
    if (version && !version.startsWith('link:')) {
      components.set(`${name}@${version}`, {
        type: 'library',
        name,
        version,
        purl: componentPurl(name, version),
      });
    }
    collectProductionDependencies(dependency.dependencies, components);
  }
}

function buildProductionSbom() {
  const components = new Map();
  for (const workspace of PRODUCTION_WORKSPACES) {
    const result = runPnpm(
      ['--filter', workspace, 'list', '--prod', '--json', '--depth', 'Infinity'],
      undefined,
    );
    const projects = parseJson(`pnpm production dependency graph for ${workspace}`, result.stdout);
    if (!Array.isArray(projects) || projects.length !== 1) {
      throw new Error(`pnpm production dependency graph for ${workspace} was incomplete.`);
    }
    collectProductionDependencies(projects[0].dependencies, components);
  }
  if (components.size === 0) {
    throw new Error('production dependency graph was empty; refusing to produce an empty SBOM.');
  }

  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: { type: 'application', name: 'quanlyvks', version: '0.1.0' },
      tools: [{ vendor: 'pnpm', name: 'pnpm', version: process.env.npm_package_manager ?? 'unknown' }],
    },
    components: [...components.values()].sort((left, right) => left.purl.localeCompare(right.purl)),
  };
  writeFileSync(SBOM_PATH, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
  return sbom;
}

function main() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const auditResult = runPnpm(['audit', '--prod', '--json'], AUDIT_PATH, {
    allowNonZeroJson: true,
  });
  const audit = parseJson('pnpm audit --prod --json', auditResult.stdout);
  const auditVulnerabilities = audit.metadata?.vulnerabilities ?? {};
  if ((auditVulnerabilities.high ?? 0) > 0 || (auditVulnerabilities.critical ?? 0) > 0) {
    throw new Error('pnpm audit found high/critical production vulnerabilities.');
  }

  const sbom = buildProductionSbom();
  const osvLock = parseJson(
    'OSV lockfile scan',
    runOsv(['--lockfile', 'pnpm-lock.yaml'], OSV_LOCK_PATH).stdout,
  );
  const osvSbom = parseJson(
    'OSV SBOM scan',
    runOsv(['--sbom', SBOM_PATH], OSV_SBOM_PATH).stdout,
  );
  // The lockfile is deliberately scanned as broad supply-chain evidence, so it
  // includes development tools. Only the production SBOM decides this release
  // gate; `pnpm audit --prod` independently checks the same production scope.
  if (highOrCritical(osvSbom)) {
    throw new Error('OSV found high/critical production vulnerabilities.');
  }

  writeFileSync(
    join(OUTPUT_DIR, 'summary.json'),
    `${JSON.stringify({
      status: 'PASS',
      auditExit: auditResult.status,
      productionSbomComponents: sbom.components.length,
      lockfileHasHighOrCritical: highOrCritical(osvLock),
    }, null, 2)}\n`,
    'utf8',
  );
  console.log(`Dependency security gate passed. Evidence: ${OUTPUT_DIR}`);
}

try {
  main();
} catch (error) {
  console.error(`Dependency security gate failed: ${error.message}`);
  process.exitCode = 1;
}
