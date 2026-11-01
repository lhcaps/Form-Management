import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const LOCAL_ONLY_PREFIXES = [
  '.artifacts/',
  'storage/generated/',
  'storage/runtime-preview-sessions/',
  'logs/',
];
const LOCAL_ONLY_FILES = new Set([
  'verify-current-state.json',
  'quanlynew-main.zip',
]);

export function classifyReleasePath(inputPath) {
  const normalized = String(inputPath).replaceAll('\\', '/').replace(/^\.\//, '');
  if (LOCAL_ONLY_FILES.has(normalized)) return 'LOCAL_ONLY';
  return LOCAL_ONLY_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    ? 'LOCAL_ONLY'
    : 'RELEASE';
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function parsePorcelain(raw) {
  const records = raw.split('\0').filter(Boolean);
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const status = record.slice(0, 2);
    const path = record.slice(3).replaceAll('\\', '/');
    const renamed = status.includes('R') || status.includes('C');
    const originalPath = renamed ? records[++index]?.replaceAll('\\', '/') ?? null : null;
    entries.push({ status, path, originalPath });
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function sha256IfFile(root, relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) return null;
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
}

export function buildBaselineManifest(root, generatedAt = new Date().toISOString()) {
  const entries = parsePorcelain(git(root, ['status', '--porcelain=v1', '-z'])).map((entry) => ({
    ...entry,
    classification: classifyReleasePath(entry.path),
    sha256: sha256IfFile(root, entry.path),
  }));
  const counts = entries.reduce(
    (result, entry) => {
      result.total += 1;
      result[entry.classification] += 1;
      return result;
    },
    { total: 0, RELEASE: 0, LOCAL_ONLY: 0 },
  );
  return {
    schemaVersion: 1,
    generatedAt,
    head: git(root, ['rev-parse', 'HEAD']),
    branch: git(root, ['branch', '--show-current']),
    counts,
    entries,
  };
}

function main() {
  const root = resolve(process.cwd());
  const outputPath = resolve(
    root,
    process.argv[2] ?? 'docs/audit/release-baseline/manifest.json',
  );
  const manifest = buildBaselineManifest(root);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `Release baseline manifest: ${outputPath}\nEntries: ${manifest.counts.total} release=${manifest.counts.RELEASE} localOnly=${manifest.counts.LOCAL_ONLY}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
