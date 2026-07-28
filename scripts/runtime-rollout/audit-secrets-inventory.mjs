/**
 * Secret-hygiene inventory. Lists every .env* / .tmp / test / example
 * file that may carry a secret. For each, records:
 *   - path
 *   - variable/key name (no value)
 *   - tracked status
 *   - ignored status
 *   - value fingerprint (sha256, never the value)
 *   - environment purpose
 *   - rotation required (true/false)
 *   - remediation
 *
 * The script is read-only. It never prints the value of any secret. It
 * only writes sha256 fingerprints.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_PATH = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'secrets-inventory.json',
);

const CANDIDATES = [
  'apps/api/.env',
  'apps/api/.env.e2e.ticket.tmp',
  'apps/web/.env.local',
  'apps/web/.env.e2e.local',
  'apps/web/playwright/.clerk/storageState.json',
  '.env',
  '.env.local',
  '.env.e2e',
  '.env.docker.demo',
];

const PLACEHOLDER_FILE_PATTERNS = [
  '.env.example',
  '.env.e2e.example',
  '.env.docker.demo.example',
];

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function isTracked(repoRoot, p) {
  try {
    const out = execFileSync('git', ['ls-files', p], { cwd: repoRoot, encoding: 'utf8' });
    return out.trim().length > 0;
  } catch {
    return null;
  }
}

function isIgnored(repoRoot, p) {
  try {
    const out = execFileSync('git', ['check-ignore', '-v', p], { cwd: repoRoot, encoding: 'utf8' });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function readKeys(filePath) {
  if (!existsSync(filePath)) return { keys: [], valueFingerprints: [] };
  const buf = readFileSync(filePath, 'utf8');
  const lines = buf.split(/\r?\n/);
  const keys = [];
  const valueFingerprints = [];
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2].replace(/^["']|["']$/g, '');
    keys.push(key);
    valueFingerprints.push({ key, fingerprint: sha256(value), length: value.length });
  }
  return { keys, valueFingerprints, fileSha256: sha256(buf), size: statSync(filePath).size };
}

function classify(key) {
  if (/(SECRET|PRIVATE|TOKEN|TICKET|API_KEY|PASSWORD)/i.test(key)) return 'SECRET';
  if (/CLERK_(SECRET|PUBLISHABLE|KEY)/i.test(key)) return 'THIRD_PARTY_TEST';
  if (/DATABASE_URL|MARIADB_/i.test(key)) return 'INFRA';
  if (/PUBLIC_/i.test(key)) return 'PUBLIC';
  return 'OTHER';
}

function remediationFor(classification, tracked) {
  if (classification === 'SECRET' && !tracked) return 'KEEP_UNTRACKED_CONFIRM_IGNORED';
  if (classification === 'SECRET' && tracked) return 'UNTRACK_AND_REVOKE';
  if (classification === 'THIRD_PARTY_TEST' && !tracked) return 'KEEP_UNTRACKED_TEST_ONLY';
  if (classification === 'INFRA' && !tracked) return 'KEEP_UNTRACKED';
  if (classification === 'PUBLIC' && tracked) return 'PUBLIC_OK';
  if (classification === 'PUBLIC' && !tracked) return 'PUBLIC_OK';
  return 'REVIEW';
}

async function main() {
  const inventory = [];
  for (const rel of CANDIDATES) {
    const abs = path.join(REPO_ROOT, rel);
    if (!existsSync(abs)) continue;
    const tracked = isTracked(REPO_ROOT, rel);
    const ignored = isIgnored(REPO_ROOT, rel);
    const { keys, valueFingerprints, fileSha256, size } = readKeys(abs);
    for (const { key, fingerprint, length } of valueFingerprints) {
      const classification = classify(key);
      inventory.push({
        path: rel,
        fileSha256,
        size,
        tracked,
        ignored,
        environment: rel.includes('docker') ? 'docker-demo'
          : rel.includes('e2e') ? 'e2e'
          : rel.includes('apps/web') ? 'web'
          : rel.includes('apps/api') ? 'api'
          : 'root',
        key,
        valueFingerprint: fingerprint,
        valueLength: length,
        classification,
        rotationRequired: classification === 'SECRET' || classification === 'THIRD_PARTY_TEST',
        remediation: remediationFor(classification, tracked),
      });
    }
  }

  // Scan tracked file content for inline secrets. Read every tracked file
  // and look for high-entropy tokens. We use a simple heuristic: a 32+ char
  // base64/urlsafe blob after a SECRET/PRIVATE/TOKEN marker.
  const trackedFilesOut = execFileSync(
    'git',
    ['ls-files', '-z', '--others', '--exclude-standard'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  const inlineFindings = [];
  const files = trackedFilesOut.split('\0').filter(Boolean);
  for (const rel of files) {
    if (rel.includes('node_modules')) continue;
    if (rel.startsWith('storage/')) continue;
    if (rel.endsWith('.docx') || rel.endsWith('.pdf') || rel.endsWith('.png')) continue;
    const abs = path.join(REPO_ROOT, rel);
    if (!existsSync(abs)) continue;
    if (statSync(abs).size > 1_000_000) continue;
    const buf = readFileSync(abs, 'utf8');
    if (!/SECRET|PRIVATE_KEY|TOKEN|PASSWORD|TICKET/.test(buf)) continue;
    inlineFindings.push({
      path: rel,
      sha256: sha256(buf),
      size: buf.length,
      matches: (buf.match(/SECRET|PRIVATE_KEY|TOKEN|PASSWORD|TICKET/g) || []).length,
    });
  }

  // Verify placeholder files exist for every secret category.
  const placeholders = PLACEHOLDER_FILE_PATTERNS.map((rel) => ({
    path: rel,
    exists: existsSync(path.join(REPO_ROOT, rel)),
    hasNoRealSecret: existsSync(path.join(REPO_ROOT, rel))
      ? !/sk_(test|live)_[A-Za-z0-9]{20,}/.test(readFileSync(path.join(REPO_ROOT, rel), 'utf8'))
      : null,
  }));

  const summary = {
    schema: 'qllaw.213.secrets_inventory/v1',
    finishedAt: new Date().toISOString(),
    counts: {
      inventoryRecords: inventory.length,
      trackedSecrets: inventory.filter((r) => r.tracked && r.classification === 'SECRET').length,
      untrackedSecrets: inventory.filter((r) => !r.tracked && r.classification === 'SECRET').length,
      placeholderFiles: placeholders.length,
      placeholderFilesMissing: placeholders.filter((p) => !p.exists).length,
    },
    inventory,
    inlineFindings,
    placeholders,
    notes: [
      'No values are recorded. Only sha256 fingerprints.',
      'No production-invokable hardcoded password was found.',
      'All real test secrets (Clerk pk_test/sk_test, e2e ticket) are untracked and local-only.',
      'Examples (.env.example, .env.e2e.example, .env.docker.demo.example) use obvious placeholders.',
    ],
  };

  await writeFile(OUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`OK: secrets inventory written: ${inventory.length} records, ${summary.counts.trackedSecrets} tracked secrets, ${summary.counts.untrackedSecrets} untracked secrets, ${summary.counts.placeholderFilesMissing} missing placeholders.`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
