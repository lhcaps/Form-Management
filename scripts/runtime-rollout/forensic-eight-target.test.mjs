// Phase 4 — eight target forensic tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { runForensicEightTarget } from './forensic-eight-target.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/eight-target-forensic.json');

const ALLOWED_CAUSES = new Set([
  'LOCKED_LOCATION_INCOMPLETE',
  'TARGET_MOVED_WITHIN_SAME_DOCX',
  'SPLIT_RUN_EXTRACTION_GAP',
  'TEXTBOX_EXTRACTION_GAP',
  'CONTENT_CONTROL_EXTRACTION_GAP',
  'NORMALIZED_TEMPLATE_DRIFT',
  'LOCKED_BINDING_CORRUPT',
  'SOURCE_TARGET_GENUINELY_ABSENT',
]);

test('forensic runs and writes artifact', () => {
  const { summary } = runForensicEightTarget();
  assert.ok(summary.totalRows >= 4, `expected at least 4 rows, got ${summary.totalRows}`);
});

test('all 4 MISSING rows are investigated', () => {
  const { summary } = runForensicEightTarget();
  const missing = summary.rows.filter((r) => r.LOCKED_REVIEW_KIND === 'MISSING');
  assert.ok(missing.length >= 4, `expected >= 4 MISSING rows, got ${missing.length}`);
  // Each row must enumerate a forensic set.
  for (const row of missing) {
    assert.ok(typeof row.NORMALIZED_DOCX_PATH === 'string', 'missing row missing DOCX path');
    assert.ok(typeof row.LOCKED_RAW_PATTERN === 'string' || row.LOCKED_RAW_PATTERN === null, 'rawPattern must be string or null');
  }
});

test('root causes restricted to declared set', () => {
  const summary = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const r of summary.rows) {
    if (r.ROOT_CAUSE && r.ROOT_CAUSE !== 'UNKNOWN') {
      assert.ok(ALLOWED_CAUSES.has(r.ROOT_CAUSE), `unknown root cause: ${r.ROOT_CAUSE}`);
    }
  }
});

test('every row has a CURRENT_STATUS', () => {
  const summary = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  for (const r of summary.rows) {
    assert.ok(typeof r.CURRENT_STATUS === 'string' && r.CURRENT_STATUS.length > 0, 'CURRENT_STATUS missing');
  }
});
