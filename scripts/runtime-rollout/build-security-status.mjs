/**
 * Derives security-status.json from a pnpm audit --prod JSON snapshot.
 *
 * Reads pnpm-audit.json when present (preferred) and falls back to
 * the human-readable pnpm-audit.log. Emits a Phase-14 shaped artifact
 * next to the rest of the rollout evidence.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = 'D:/Study/Project/QLLaw-main';
const ROLLOUT_DIR = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout');
const HOME = process.env.USERPROFILE || process.env.HOME || 'C:/Users/ADMIN';
const TERMINAL_DIR = process.env.TERMINALS_DIR || path.join(HOME, '.cursor/projects/d-Study-Project-QLLaw-main/terminals');
const LOG_PATH = path.join(TERMINAL_DIR, 'pnpm-audit.json');
const TEXT_LOG_PATH = path.join(TERMINAL_DIR, 'pnpm-audit.log');
const OUT_PATH = path.join(ROLLOUT_DIR, 'security-status.json');

const SEVERITY_ORDER = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

function decodeBuffer(buf) {
  // Auto-detect UTF-16 LE (PowerShell redirection default) vs UTF-8.
  // UTF-16 LE BOM: 0xFF 0xFE. UTF-16 BE BOM: 0xFE 0xFF.
  // Also detect UTF-16 by checking that most even-indexed bytes have a
  // 0 follow byte — characteristic of UTF-16 LE ASCII content.
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le').replace(/^\uFEFF/, '');
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return buf.toString('utf16be').replace(/^\uFEFF/, '');
  }
  if (buf.length >= 32) {
    let zeros = 0;
    for (let i = 1; i < 32 && i < buf.length; i += 2) {
      if (buf[i] === 0) zeros += 1;
    }
    if (zeros > 8) return buf.toString('utf16le');
  }
  return buf.toString('utf8').replace(/^\uFEFF/, '');
}

function normalizeSeverity(value) {
  if (value === undefined || value === null) return 'moderate';
  const v = String(value).toLowerCase();
  if (SEVERITY_ORDER[v] !== undefined) return v;
  return 'moderate';
}

async function main() {
  let raw = '';
  let source = '';
  if (existsSync(LOG_PATH)) {
    const buf = await readFile(LOG_PATH);
    raw = decodeBuffer(buf);
    source = LOG_PATH;
  } else if (existsSync(TEXT_LOG_PATH)) {
    const buf = await readFile(TEXT_LOG_PATH);
    raw = decodeBuffer(buf);
    source = TEXT_LOG_PATH;
  } else {
    const err = { schema: 'qllaw.213.security_status/v1', error: 'pnpm audit log missing', finishedAt: new Date().toISOString() };
    await writeFile(OUT_PATH, `${JSON.stringify(err, null, 2)}\n`);
    console.error('FATAL: pnpm-audit.json and pnpm-audit.log both missing');
    process.exit(1);
  }

  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    payload = null;
  }

  const advisories = [];
  let exitCode = payload ? 1 : 0;

  if (payload && typeof payload === 'object' && payload.advisories) {
    for (const [id, adv] of Object.entries(payload.advisories || {})) {
      const findings = adv.findings || [];
      const firstPath = findings[0]?.paths?.[0] || '';
      const moduleName =
        adv.module_name ||
        firstPath.split('>').pop()?.split('@').slice(0, 2).join('@') ||
        'unknown';
      advisories.push({
        id: adv.id || id,
        name: moduleName.trim(),
        version: adv.vulnerable_versions || (findings[0] && findings[0].version) || 'unknown',
        severity: normalizeSeverity(adv.severity),
        title: adv.title || (adv.overview ? adv.overview.split('\n')[0] : ''),
        url: adv.url || '',
        paths: findings.flatMap((f) => f.paths || []),
      });
    }
    const meta = payload.metadata && payload.metadata.vulnerabilities;
    if (meta) exitCode = meta.critical > 0 || meta.high > 0 || meta.moderate > 0 ? 1 : 0;
  } else if (/\bSeverity:.*[Hh]igh/.test(raw) || /\bSeverity:.*[Mm]oderate/.test(raw) || /\bSeverity:.*[Ll]ow/.test(raw)) {
    exitCode = 1;
  }

  const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 };
  for (const a of advisories) {
    counts[a.severity] = (counts[a.severity] || 0) + 1;
    counts.total += 1;
  }

  const prioritizedNames = new Set([
    'next', 'react', 'react-dom',
    'postcss',
    'body-parser',
    'hono', '@hono/node-server',
    'valibot',
    'brace-expansion',
    'sharp', 'libvips',
    'fast-uri',
  ]);
  const prioritized = advisories
    .filter((a) => prioritizedNames.has(a.name.split('@')[0]))
    .map((a) => ({ name: a.name, severity: a.severity, title: a.title }));

  const remediation = [];
  if (counts.high > 0) remediation.push('Direct dependency upgrade for high-severity findings before any deploy.');
  if (prioritized.find((p) => p.name === 'next')) remediation.push('Run: pnpm up next');
  if (prioritized.find((p) => p.name === 'postcss')) remediation.push('Run: pnpm up postcss');
  if (prioritized.find((p) => p.name === 'body-parser')) remediation.push('Run: pnpm up body-parser or replace with express.json()');
  if (prioritized.find((p) => p.name === '@hono/node-server')) remediation.push('Run: pnpm up @hono/node-server');
  if (prioritized.find((p) => p.name === 'valibot')) remediation.push('Run: pnpm up valibot');
  if (prioritized.find((p) => p.name === 'brace-expansion')) remediation.push('Run: pnpm up brace-expansion');
  if (prioritized.find((p) => p.name === 'sharp')) remediation.push('Run: pnpm up sharp');

  const status = {
    schema: 'qllaw.213.security_status/v1',
    finishedAt: new Date().toISOString(),
    generatedFrom: 'pnpm audit --prod --json',
    logPath: source,
    auditExitCode: exitCode,
    red: counts.total > 0,
    counts,
    prioritizedPackages: prioritized,
    remediation,
    advisories,
    notes: [
      'Each row is one advisory; duplicate depends-on paths are flattened into `paths[]`.',
      'Production-ready remains false while red === true.',
    ],
  };

  await writeFile(OUT_PATH, `${JSON.stringify(status, null, 2)}\n`);
  console.log(`OK: security-status.json written (${counts.total} advisories, exit=${exitCode}, red=${status.red})`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
