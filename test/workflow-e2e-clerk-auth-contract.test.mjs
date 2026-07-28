import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../scripts/audit/run-primary-form-export-workflow-e2e.mjs', import.meta.url),
  'utf8',
);

test('primary workflow E2E uses a Clerk storage state and never the retired session login', () => {
  assert.match(workflow, /AUTH_STATE_PATH[\s\S]*"playwright"[\s\S]*"\.clerk"[\s\S]*"admin\.json"/u);
  assert.match(workflow, /storageState:\s*AUTH_STATE_PATH/u);
  assert.match(workflow, /window\.Clerk/u);
  assert.match(workflow, /Mở với hồ sơ/u);
  assert.match(workflow, /Tệp đã xuất/u);
  assert.doesNotMatch(workflow, /auth\/login/u);
  assert.doesNotMatch(workflow, /qlv_session/u);
  assert.doesNotMatch(workflow, /E2E_ADMIN_PASSWORD/u);
});
