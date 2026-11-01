#!/usr/bin/env node
// Repository hygiene guard unit test.
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execSync } from 'node:child_process';

const SAMPLE = {
  trackedEnvFile: '.env',
  trackedClerkAuth: 'playwright/.clerk/admin.json',
  trackedStorageState: 'playwright/storageState.json',
  trackedRuntimeSession: 'storage/runtime-preview-sessions/abc.json',
  trackedTestResults: 'test-results/foo.json',
  trackedScratchProbe: 'scripts/audit/_tmp_xyz.mjs',
  trackedTempSidecar: '.tmp-xyz/file.txt',
  trackedOfficeLock: '~$lock.docx',
  trackedNormalisedDocx: 'storage/templates/normalized-docx/BM-001/BM-001_normalized.docx',
};

function classify(p) {
  if (p === '.env' || p.endsWith('/.env') || p.endsWith('.env.local') || p.endsWith('.env.e2e.local')) return 'tracked_env_file';
  if (p.startsWith('playwright/.clerk/')) return 'tracked_clerk_auth_state';
  if (/storageState|auth-state/i.test(p)) return 'tracked_storage_state';
  if (p.startsWith('storage/runtime-preview-sessions/')) return 'tracked_runtime_preview_session';
  if (p.startsWith('test-results/') || p.startsWith('playwright-report/')) return 'tracked_test_results';
  if (/^scripts\/audit\/_tmp_.+\.mjs$/.test(p) || /^scripts\/release\/_tmp_audit.+\.py$/.test(p)) return 'tracked_scratch_probe';
  if (p.startsWith('.tmp-') || p.includes('/.tmp-')) return 'tracked_temp_sidecar';
  if (p.startsWith('~$') && p.endsWith('.docx')) return 'tracked_office_lock';
  return null;
}

test('classifies all forbidden patterns', () => {
  for (const [k, p] of Object.entries(SAMPLE)) {
    if (k === 'trackedNormalisedDocx') {
      assert.equal(classify(p), null, `${p} must not be flagged`);
      continue;
    }
    assert.ok(classify(p), `${p} must be flagged`);
  }
});

test('hygiene guard script is executable', () => {
  const out = execSync('node scripts/release/audit-repository-hygiene.mjs', { encoding: 'utf-8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.schema, 'qllaw.phase15b.repository_hygiene/v1');
  assert.equal(parsed.pass, true, 'hygiene guard must pass: ' + JSON.stringify(parsed.forbiddenFindings));
});