import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ATLAS_SCHEMA_VERSION = '1.0.0';
export const ATLAS_TASK = 'DOCX_ATLAS_V1_BUILD';
export const DEFAULT_ATLAS_OUT_DIR = join('docs', 'audit', 'docx-atlas-v1');

export function compareCode(a, b) {
  const left = Number(/^BM-(\d{3})$/u.exec(a)?.[1] ?? 0);
  const right = Number(/^BM-(\d{3})$/u.exec(b)?.[1] ?? 0);
  return left - right || String(a).localeCompare(String(b));
}

export function parseAtlasArgs(argv, options = {}) {
  const parsed = {
    root: process.cwd(),
    outDir: null,
    templateCodes: [],
    limit: null,
    force: false,
    cacheOnly: false,
    concurrency: options.defaultConcurrency ?? 2,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      parsed.root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--out-dir') {
      parsed.outDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--template-code') {
      parsed.templateCodes.push(String(argv[index + 1]).trim().toUpperCase());
      index += 1;
      continue;
    }
    if (arg === '--limit') {
      parsed.limit = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--concurrency') {
      parsed.concurrency = Math.max(1, Number(argv[index + 1] ?? 1));
      index += 1;
      continue;
    }
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--cache-only') {
      parsed.cacheOnly = true;
      continue;
    }
  }

  parsed.root = resolve(parsed.root);
  parsed.outDir = parsed.outDir
    ? isAbsolute(parsed.outDir)
      ? parsed.outDir
      : join(parsed.root, parsed.outDir)
    : join(parsed.root, DEFAULT_ATLAS_OUT_DIR);

  return parsed;
}

export function normalizedDocxRoot(root) {
  return join(root, 'storage', 'templates', 'normalized-docx');
}

export function lockedContractsRoot(root) {
  return join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
}

export function discoverTemplateCodes(root) {
  const normalRoot = normalizedDocxRoot(root);
  if (!existsSync(normalRoot)) return [];
  return readdirSync(normalRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^BM-\d{3}$/u.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareCode);
}

export function selectTemplateCodes(root, args) {
  const codes = args.templateCodes.length > 0 ? args.templateCodes : discoverTemplateCodes(root);
  const unique = [...new Set(codes)].filter((code) => /^BM-\d{3}$/u.test(code));
  unique.sort(compareCode);
  return Number.isFinite(args.limit) && args.limit > 0 ? unique.slice(0, args.limit) : unique;
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function readJsonIfExists(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  return readJson(filePath);
}

export function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

export function rel(root, filePath) {
  if (!filePath) return null;
  return relative(root, filePath).replace(/\\/g, '/');
}

export function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const RISK_RANK = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function highestRiskLevel(levels) {
  let selected = 'NONE';
  for (const level of levels.filter(Boolean)) {
    const normalized = String(level).toUpperCase();
    if ((RISK_RANK[normalized] ?? -1) > (RISK_RANK[selected] ?? -1)) {
      selected = normalized;
    }
  }
  return selected;
}

export function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const separator = header.map(() => '---');
  return [header, separator, ...body]
    .map((row) => `| ${row.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`)
    .join('\n');
}

export function byTemplate(rows) {
  return Object.fromEntries((rows ?? []).map((row) => [row.templateCode, row]));
}

export function collectBoardIssueCodes(row) {
  return [
    ...Object.keys(row?.rootCause?.issueCounts ?? {}),
    ...(row?.baseline?.findings ?? []),
  ].filter(Boolean);
}

export function atlasSafetyAssertions() {
  return {
    canApplyRunNow: false,
    canMarkDone: false,
    noNormalizedDocxMutation: true,
    noLockedContractMutation: true,
    noCompiledV2Mutation: true,
    noDbPublish: true,
    noRendererMutation: true,
    noApprovedDecisions: true,
    noApplyRunner: true,
  };
}

export async function runCli(importMetaUrl, main) {
  const thisFile = fileURLToPath(importMetaUrl);
  if (resolve(process.argv[1] ?? '') !== resolve(thisFile)) return;
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}
