#!/usr/bin/env node
/**
 * BM Source Guard — report-only audit script.
 *
 * PR2 deliverable. Default mode: report-only, exits 0.
 *
 * Scope: apps/web/src/components/documents/bm-***-form-inputs.tsx,
 *        apps/web/src/components/documents/bm-form/**,
 *        apps/web/src/lib/dev/**,
 *        apps/web/src/lib/bm-auto-populate/**.
 *
 * Detects:
 *   - CCCD-like 12-digit literals
 *   - Known demo names (Đoàn Văn Dũng, Trần Thanh Nam, …)
 *   - Hardcoded actor fields (createdByName, updatedByName, renderedByName, convertedByName)
 *   - Secret-like key prefixes and forbidden E2E env names
 *     (constructed at runtime from string pieces to avoid being
 *      trivially matched by the repo-wide secret grep itself)
 *   - Clerk-web-route misuse of qlv_session inside auth-clerk-*.spec.ts
 *
 * Strict mode (`--fail`) is reserved for a future PR and is NOT
 * activated by default. PR2 keeps this script report-only.
 *
 * Output:
 *   - Writes docs/audit/bm-input-foundation/source-guards.latest.json
 *   - Prints a one-line summary to stdout
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// `here` is `scripts/audit`. Repo root is two levels up.
const repoRoot = join(here, '..', '..');
// Helpful diagnostic when invoked from a different working directory.
if (process.env.BM_SOURCE_GUARD_TRACE === '1') {
  console.error('[bm-source-guards] here:', here);
  console.error('[bm-source-guards] repoRoot:', repoRoot);
}

const SCAN_ROOTS = [
  'apps/web/src/components/documents',
  'apps/web/src/lib/dev',
  'apps/web/src/lib/bm-auto-populate',
];

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo']);

const SCAN_EXT = new Set(['.ts', '.tsx', '.mjs', '.js']);

const REPORT_PATH = join(
  repoRoot,
  'docs/audit/bm-input-foundation/source-guards.latest.json',
);

// Patterns are kept conservative. Strings use plain JS regex to avoid
// pulling in dependencies.
//
// Secret-prefix and forbidden-env patterns are composed at runtime
// from string pieces so the literal substrings do not appear
// contiguously in this file (which would otherwise trip the repo-wide
// secret grep on the script itself).
const SECRET_KEY_PREFIX = 's' + 'k_';
const SECRET_KEY_SUFFIXES = ['test', 'live'];
const FORBIDDEN_E2E_PASSWORD_ENV = ['E2E', 'CLERK', 'USER', 'PASSWORD'].join('_');

function buildSecretKeyRegex() {
  const group = SECRET_KEY_SUFFIXES.join('|');
  return new RegExp(SECRET_KEY_PREFIX + `(${group})_[A-Za-z0-9]`, 'g');
}

function buildForbiddenEnvRegex() {
  return new RegExp(FORBIDDEN_E2E_PASSWORD_ENV, 'g');
}

const PATTERNS = [
  { id: 'cccd-12-digit', regex: /\b\d{12}\b/g, message: 'Possible CCCD literal (12 consecutive digits).' },
  { id: 'demo-name-dung', regex: /Đoàn Văn Dũng/g, message: 'Known demo name.' },
  { id: 'demo-name-nam', regex: /Trần Thanh Nam/g, message: 'Known demo name.' },
  { id: 'demo-name-hanh-1', regex: /Nguyễn T\. H\. Hạnh/g, message: 'Known demo name variant.' },
  { id: 'demo-name-hanh-2', regex: /Nguyễn Thị Hồng Hạnh/g, message: 'Known demo name variant.' },
  { id: 'actor-createdByName', regex: /\bcreatedByName:\s*"(?!")([^"]+)"/g, message: 'Hardcoded createdByName actor field.' },
  { id: 'actor-updatedByName', regex: /\bupdatedByName:\s*"(?!")([^"]+)"/g, message: 'Hardcoded updatedByName actor field.' },
  { id: 'actor-renderedByName', regex: /\brenderedByName:\s*"(?!")([^"]+)"/g, message: 'Hardcoded renderedByName actor field.' },
  { id: 'actor-convertedByName', regex: /\bconvertedByName:\s*"(?!")([^"]+)"/g, message: 'Hardcoded convertedByName actor field.' },
  { id: 'secret-sk-test', regex: buildSecretKeyRegex(), message: 'Possible Clerk secret key prefix (test or live).' },
  { id: 'forbidden-e2e-password', regex: buildForbiddenEnvRegex(), message: `Forbidden ${FORBIDDEN_E2E_PASSWORD_ENV}-style env name.` },
  {
    id: 'clerk-misuse-qlv-session',
    regex: /qlv_session/g,
    message: 'qlv_session reference in Clerk web route spec file.',
    fileMatch: (rel) => /apps\/web\/src\/.*auth-clerk-.*\.spec\.tsx?$/.test(rel),
  },
];

const WHITELIST_FILES = new Set([
  // sample-data is permitted (mirrors audit-runtime-hardcodes.mjs).
  // The BM-001 generated-document sample helper
  // (apps/web/src/features/forms-contracts/bm-001-generated-document-sample.ts)
  // is intentionally NOT whitelisted here: it lives under
  // apps/web/src/features/forms-contracts/, which is outside the audit
  // scan roots. The whitelist is reserved for files that would
  // otherwise be scanned but are intentionally exempt.
  'apps/web/src/features/forms-contracts/sample-data.ts',
]);

function isWhitelisted(rel) {
  return WHITELIST_FILES.has(rel);
}

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const filePath = join(dir, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      yield* walk(filePath);
      continue;
    }
    if (stat.isFile()) {
      const dot = filePath.lastIndexOf('.');
      if (dot < 0) continue;
      if (!SCAN_EXT.has(filePath.slice(dot))) continue;
      yield filePath;
    }
  }
}

function relPath(absPath) {
  return relative(repoRoot, absPath).split('\\').join('/');
}

const findings = [];

for (const root of SCAN_ROOTS) {
  for (const filePath of walk(join(repoRoot, root))) {
    const rel = relPath(filePath);
    if (isWhitelisted(rel)) continue;
    const text = readFileSync(filePath, 'utf8');
    for (const pattern of PATTERNS) {
      if (typeof pattern.fileMatch === 'function' && !pattern.fileMatch(rel)) {
        continue;
      }
      // Reset regex state on each file
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        const lineNumber = text.slice(0, match.index).split(/\r?\n/).length;
        findings.push({
          file: rel,
          line: lineNumber,
          patternId: pattern.id,
          message: pattern.message,
          snippet: text.slice(Math.max(0, match.index - 10), match.index + match[0].length + 10).replace(/\r?\n/g, ' '),
        });
        // Avoid infinite loop on zero-length matches (none of the patterns above
        // are zero-length, but be defensive).
        if (pattern.regex.lastIndex === match.index) {
          pattern.regex.lastIndex += 1;
        }
      }
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: SCAN_ROOTS,
  mode: 'report-only',
  failOnFindings: false,
  totalFindings: findings.length,
  findings,
};

const reportDir = dirname(REPORT_PATH);
if (!existsSync(reportDir)) {
  mkdirSync(reportDir, { recursive: true });
}
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

const summary = `bm-source-guards: ${findings.length} finding(s); report written to ${relPath(REPORT_PATH)}`;
console.log(summary);

// Default mode: always exit 0. Strict mode is intentionally not exposed
// here; future PR can add `--fail` after demo data is removed from
// bm-001/171/172.
process.exit(0);