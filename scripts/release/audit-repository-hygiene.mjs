#!/usr/bin/env node
// Repository hygiene guard.
// Refuses release if any tracked file matches a forbidden pattern.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const forbiddenSizeCheck = (() => {
  // Build a path -> size map once, using git ls-tree on HEAD.
  let sizes = new Map();
  try {
    const out = execSync('git ls-tree -r -l HEAD', { encoding: 'utf-8' });
    for (const line of out.split('\n')) {
      // <mode> SP <type> SP <object> SP <size> TAB <path>
      const tabIdx = line.indexOf('\t');
      if (tabIdx < 0) continue;
      const meta = line.substring(0, tabIdx);
      const path = line.substring(tabIdx + 1);
      const parts = meta.split(' ');
      const size = parseInt(parts[3], 10);
      if (Number.isFinite(size)) sizes.set(path, size);
    }
  } catch {}
  return (p) => (sizes.get(p) || 0) > 100 * 1024 * 1024;
})();

const FORBIDDEN_PATTERNS = [
  { name: 'tracked_env_file', test: (p) => p === '.env' || p.endsWith('/.env') || p.endsWith('.env.local') || p.endsWith('.env.e2e.local') },
  { name: 'tracked_clerk_auth_state', test: (p) => p.startsWith('playwright/.clerk/') },
  { name: 'tracked_storage_state', test: (p) => /storageState|auth-state/i.test(p) },
  { name: 'tracked_runtime_preview_session', test: (p) => p.startsWith('storage/runtime-preview-sessions/') },
  { name: 'tracked_test_results', test: (p) => p.startsWith('test-results/') || p.startsWith('playwright-report/') },
  { name: 'tracked_scratch_probe', test: (p) => /^scripts\/audit\/_tmp_.+\.mjs$/.test(p) || /^scripts\/release\/_tmp_audit.+\.py$/.test(p) },
  { name: 'tracked_temp_sidecar', test: (p) => p.startsWith('.tmp-') || p.includes('/.tmp-') },
  { name: 'tracked_office_lock', test: (p) => p.startsWith('~$') && p.endsWith('.docx') },
  { name: 'tracked_local_db', test: (p) => /\.(sqlite|sqlite3|db)$/.test(p) && !p.startsWith('audit/') },
  { name: 'tracked_large_file_over_100mb', test: forbiddenSizeCheck },
];

const REQUIRED_PATTERNS_EXIST = [
  { name: 'normalized_docx_dir', test: () => existsSync(resolve('storage/templates/normalized-docx')) },
  { name: 'apps_api_dir', test: () => existsSync(resolve('apps/api')) },
  { name: 'apps_web_dir', test: () => existsSync(resolve('apps/web')) },
  { name: 'packages_form_contracts_dir', test: () => existsSync(resolve('packages/form-contracts')) },
];

const tracked = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const findings = [];
for (const p of tracked) {
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.test(p)) findings.push({ rule: rule.name, path: p });
  }
}

const missingRequired = REQUIRED_PATTERNS_EXIST.filter((r) => !r.test()).map((r) => r.name);

const result = {
  schema: 'qllaw.phase15b.repository_hygiene/v1',
  generatedAt: new Date().toISOString(),
  trackedFileCount: tracked.length,
  forbiddenFindings: findings,
  missingRequired,
  pass: findings.length === 0 && missingRequired.length === 0,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);