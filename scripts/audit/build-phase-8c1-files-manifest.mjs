#!/usr/bin/env node
/**
 * Phase 8C.1 — Reconcile file manifest from actual Git state.
 * Reads `git status --porcelain=v2` and `git ls-files --others --exclude-standard`,
 * classifies every entry by Phase / generated evidence / pre-existing / private.
 *
 * Output:
 *   docs/audit/infrastructure-modernization/phase-8c-final-report/FILES_MANIFEST.latest.json
 *   docs/audit/infrastructure-modernization/phase-8c-final-report/FILES_MANIFEST.latest.md
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.env.QLLAW_REPO_ROOT || 'D:\\Study\\Project\\QLLaw-main';
const OUT_DIR = join(ROOT, 'docs', 'audit', 'infrastructure-modernization', 'phase-8c-final-report');
mkdirSync(OUT_DIR, { recursive: true });

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
}

function readPorcelain() {
  const r = run('git', ['status', '--porcelain=v2']);
  return r.stdout || '';
}

function readNumstat() {
  const r = run('git', ['diff', '--numstat']);
  return r.stdout || '';
}

function readUntracked() {
  const r = run('git', ['ls-files', '--others', '--exclude-standard']);
  return r.stdout || '';
}

function readShow(file, ref) {
  const r = run('git', ['show', `${ref}:${file}`]);
  return r.status === 0 ? r.stdout : null;
}

function headBlob(file) {
  return readShow(file, 'HEAD');
}

function workingBlob(file) {
  const full = join(ROOT, file);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function sha256(text) {
  if (text === null || text === undefined) return null;
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function additionsDeletions(line) {
  // numstat format: "<add>\t<del>\t<path>"
  const parts = line.split('\t');
  return {
    additions: parts[0] === '-' ? 0 : Number(parts[0]),
    deletions: parts[1] === '-' ? 0 : Number(parts[1]),
  };
}

const PHASE_8B_PATTERNS = [
  /^apps\/api\/src\/modules\/health\/readiness\.service\.(ts|spec\.ts)$/,
  /^apps\/api\/src\/modules\/health\/health\.module\.ts$/,
  /^apps\/api\/src\/infrastructure\/config\/app-config\.service\.(ts|spec\.ts)$/,
  /^docker-compose\.prod\.yml$/,
  /^docker\/api\.Dockerfile$/,
  /^docker\/api-entrypoint\.sh$/,
  /^\.env\.docker(\.example)?$/,
  /^scripts\/docker-verify\.mjs$/,
];

const PHASE_8C_FONT_PATTERNS = [
  /^scripts\/fonts\//,
  /^test\/font-policy\.test\.mjs$/,
];

const PHASE_8C_AUDIT_PATTERNS = [
  /^scripts\/audit\/build-phase-8c-(bootstrap-sql|pdf-fidelity-evidence|throttling-closure|metadata-transition-package|git-delivery-plan)\.mjs$/,
];

const PHASE_8C_1_AUDIT_PATTERNS = [
  /^scripts\/audit\/build-phase-8c1-bootstrap-disposable-apply\.mjs$/,
  /^scripts\/audit\/build-phase-8c1-files-manifest\.mjs$/,
];

const PHASE_8C_1_DOCKER_PATTERNS = [
  /^docker\/qllaw-fonts\.conf$/,
];

const PHASE_8C_1_DOCKERIGNORE_PATTERNS = [
  /^\.dockerignore$/,
];

const PHASE_8C_DOCS_PATTERNS = [
  /^docs\/audit\/infrastructure-modernization\/phase-8c-/,
];

const PHASE_8C1_DOCS_PATTERNS = [
  /^docs\/audit\/infrastructure-modernization\/phase-8c1-/,
];

const GENERATED_ARTIFACT_PATTERNS = [
  /^\.artifacts\/phase-8c/,
  /^\.artifacts\//,
  /^\.tmp-/,
];

const PRIVATE_IGNORED_PATTERNS = [
  /^playwright\/\.clerk\//,
];

const PRE_EXISTING_PATTERNS = [
  /^apps\//,
  /^docs\/audit\/(?!infrastructure-modernization\/phase-8c)/,
  /^storage\//,
  /^test\//,
  /^tests\//,
  /^\.ai\//,
  /^\.harness\//,
  /^\.github\//,
];

function expandIfDirectory(p) {
  const full = join(ROOT, p);
  if (!existsSync(full)) return [p];
  const st = statSync(full);
  if (!st.isDirectory()) return [p];
  // Expand directory recursively
  const out = [];
  function walk(d, prefix) {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      const fp = join(d, e.name);
      if (e.isDirectory()) walk(fp, rel);
      else out.push(rel);
    }
  }
  walk(full, p);
  return out;
}

function classify(file) {
  if (PHASE_8C_1_AUDIT_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_1_CURSOR';
  if (PHASE_8C_1_DOCKER_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_1_CURSOR';
  if (PHASE_8C_1_DOCKERIGNORE_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_1_CURSOR';
  if (PHASE_8B_PATTERNS.some((p) => p.test(file))) return 'PHASE_8B_CODEX';
  if (PHASE_8C_FONT_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_CURSOR';
  if (PHASE_8C_AUDIT_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_CURSOR';
  if (PHASE_8C1_DOCS_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_1_CURSOR';
  if (PHASE_8C_DOCS_PATTERNS.some((p) => p.test(file))) return 'PHASE_8C_CURSOR';
  if (GENERATED_ARTIFACT_PATTERNS.some((p) => p.test(file))) return 'GENERATED_EVIDENCE';
  if (PRIVATE_IGNORED_PATTERNS.some((p) => p.test(file))) return 'PRIVATE_SECRET';
  if (PRE_EXISTING_PATTERNS.some((p) => p.test(file))) return 'PRE_EXISTING_DIRTY';
  return 'UNKNOWN';
}

const porcelain = readPorcelain();
const numstat = readNumstat();

const numstatByFile = new Map();
for (const line of numstat.split('\n')) {
  if (!line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const file = parts[2];
  numstatByFile.set(file, { additions: Number(parts[0]), deletions: Number(parts[1]) });
}

const items = [];
const counts = {
  PHASE_8B_CODEX: 0,
  PHASE_8C_CURSOR: 0,
  PHASE_8C_1_CURSOR: 0,
  GENERATED_EVIDENCE: 0,
  PRE_EXISTING_DIRTY: 0,
  PRIVATE_SECRET: 0,
  UNRELATED: 0,
  UNKNOWN: 0,
};

for (const line of porcelain.split('\n')) {
  if (!line) continue;
  // porcelain v2 line shapes:
  //   "1 <XY> <sub> <mH> <mI> <mW> <path>"
  //   "2 <XY> <sub> <mH> <mI> <mW> <path>"
  //   "? <path>"
  let filePath;
  let tracked;
  if (line.startsWith('? ')) {
    filePath = line.slice(2);
    tracked = false;
  } else {
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;
    if (!['1', '2'].includes(parts[0])) continue;
    filePath = parts[parts.length - 1];
    tracked = parts[0] === '1';
  }
  if (!filePath) continue;
  // Classify the path as listed (no expansion). Phase 8C source files count individually;
  // directory entries (e.g. `.artifacts/`) are summarized under the directory label.
  const classified = classify(filePath);
  items.push({
    path: filePath,
    tracked,
    status: tracked ? 'modified' : 'untracked',
    additions: numstatByFile.get(filePath)?.additions ?? 0,
    deletions: numstatByFile.get(filePath)?.deletions ?? 0,
    classification: classified,
  });
}

// SHA256 + binary detection for tracked diff
for (const item of items) {
  if (!item.tracked) {
    // untracked — hash working file
    const full = join(ROOT, item.path);
    if (existsSync(full)) {
      const st = statSync(full);
      if (st.isDirectory()) {
        item.byteLength = 0;
        item.sha256_working = createHash('sha256').update(`dir:${full}`).digest('hex');
      } else {
        const buf = readFileSync(full);
        item.sha256_working = createHash('sha256').update(buf).digest('hex');
        item.byteLength = buf.byteLength;
      }
    }
    continue;
  }
  const head = headBlob(item.path);
  const work = workingBlob(item.path);
  item.sha256_head = sha256(head);
  item.sha256_working = sha256(work);
  item.byteLength = work ? work.length : null;
}

// Tally
for (const item of items) {
  const c = item.classification;
  if (counts[c] !== undefined) counts[c] += 1;
  else if (c === 'UNRELATED') counts.UNRELATED += 1;
}

// Reconcile: total dirty = sum of all categories
const totalDirty = items.length;
const phase8B = counts.PHASE_8B_CODEX;
const phase8C = counts.PHASE_8C_CURSOR;
const phase8C1 = counts.PHASE_8C_1_CURSOR;
const generated = counts.GENERATED_EVIDENCE;
const preExisting = counts.PRE_EXISTING_DIRTY;
const privateIgnored = counts.PRIVATE_SECRET;
const unrelated = counts.UNRELATED;
const unknown = counts.UNKNOWN;

const phase8CTotal = phase8C + phase8C1;
const accounted = phase8B + phase8CTotal + generated + preExisting + privateIgnored + unrelated + unknown;
const reconciliation = {
  total_dirty: totalDirty,
  PHASE_8B: phase8B,
  PHASE_8C_source: phase8C,
  PHASE_8C_1_source: phase8C1,
  PHASE_8C_total: phase8CTotal,
  GENERATED_EVIDENCE: generated,
  PRE_EXISTING_DIRTY: preExisting,
  PRIVATE_SECRET: privateIgnored,
  UNRELATED: unrelated,
  UNKNOWN: unknown,
  sums_to_total: accounted === totalDirty,
  delta: accounted - totalDirty,
};

const manifest = {
  schemaVersion: '1',
  generatedAt: new Date().toISOString(),
  repository: 'D:\\Study\\Project\\QLLaw-main',
  branch: run('git', ['branch', '--show-current']).stdout.trim(),
  head: run('git', ['rev-parse', 'HEAD']).stdout.trim(),
  classifications_used: [
    'PHASE_8B_CODEX',
    'PHASE_8C_CURSOR',
    'PHASE_8C_1_CURSOR',
    'GENERATED_EVIDENCE',
    'PRE_EXISTING_DIRTY',
    'PRIVATE_SECRET',
    'UNRELATED',
    'UNKNOWN',
  ],
  counts,
  reconciliation,
  items,
};

writeFileSync(
  join(OUT_DIR, 'FILES_MANIFEST.latest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

// Markdown
const lines = [];
lines.push('# QLLAW Phase 8C.1 — File Manifest (Git-derived)');
lines.push('');
lines.push(`Generated at: ${manifest.generatedAt}`);
lines.push(`Repository: \`${manifest.repository}\``);
lines.push(`Branch: \`${manifest.branch}\``);
lines.push(`HEAD: \`${manifest.head}\``);
lines.push('');
lines.push('## Totals');
lines.push('');
lines.push(`- Total dirty entries: **${reconciliation.total_dirty}**`);
lines.push(`- PHASE_8B_CODEX: **${phase8B}**`);
lines.push(`- PHASE_8C_CURSOR: **${phase8C}**`);
lines.push(`- PHASE_8C_1_CURSOR: **${phase8C1}**`);
lines.push(`- PHASE_8C_total (8C + 8C.1): **${phase8CTotal}**`);
lines.push(`- GENERATED_EVIDENCE: **${generated}**`);
lines.push(`- PRE_EXISTING_DIRTY: **${preExisting}**`);
lines.push(`- PRIVATE_SECRET: **${privateIgnored}**`);
lines.push(`- UNRELATED: **${unrelated}**`);
lines.push(`- UNKNOWN: **${unknown}**`);
lines.push(`- Sum of categories: **${accounted}** (delta: **${reconciliation.delta}**)`);
lines.push('');
lines.push('## Items');
lines.push('');
lines.push('| Path | Tracked | Class | Add | Del | SHA-256 (working) |');
lines.push('|---|---|---|---:|---:|---|');
for (const item of items) {
  lines.push(
    `| \`${item.path}\` | ${item.tracked ? 'yes' : 'no'} | ${item.classification} | ${item.additions} | ${item.deletions} | \`${item.sha256_working ? item.sha256_working.slice(0, 12) : ''}\` |`,
  );
}
writeFileSync(join(OUT_DIR, 'FILES_MANIFEST.latest.md'), lines.join('\n') + '\n', 'utf8');

console.log(JSON.stringify({ counts, reconciliation, outDir: OUT_DIR }, null, 2));
