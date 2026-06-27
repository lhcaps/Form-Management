/**
 * test/path-domain-batch-1-bm096-plan-integrity.test.mjs
 *
 * Tests for BM-096 path-domain binding plan integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REPORT_PATH = join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1', 'bm-096-latest.json');

function loadReport() {
  return JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
}

describe('BM-096 Path Domain Plan Integrity', () => {

  it('signature.cheDo must NOT be SAFE_LABEL_CLEANUP', () => {
    const report = loadReport();
    const item = report.safeCleanupCandidates?.find(i => i.path === 'signature.cheDo');
    assert.strictEqual(item, undefined, 'signature.cheDo must NOT be in safeCleanupCandidates');
  });

  it('signature.nguoiKy must NOT be SAFE_LABEL_CLEANUP', () => {
    const report = loadReport();
    const item = report.safeCleanupCandidates?.find(i => i.path === 'signature.nguoiKy');
    assert.strictEqual(item, undefined, 'signature.nguoiKy must NOT be in safeCleanupCandidates');
  });

  it('signature.cheDo must be DEFER_PATH_DOMAIN_MISMATCH or deferred', () => {
    const report = loadReport();
    const item = report.analysis?.find(i => i.path === 'signature.cheDo');
    assert.ok(item, 'signature.cheDo must exist in analysis');
    const isSafe = item.classification === 'SAFE_LABEL_CLEANUP';
    assert.ok(!isSafe, `signature.cheDo must NOT be SAFE_LABEL_CLEANUP, got: ${item.classification}`);
  });

  it('signature.nguoiKy must be DEFER_PATH_DOMAIN_MISMATCH or deferred', () => {
    const report = loadReport();
    const item = report.analysis?.find(i => i.path === 'signature.nguoiKy');
    assert.ok(item, 'signature.nguoiKy must exist in analysis');
    const isSafe = item.classification === 'SAFE_LABEL_CLEANUP';
    assert.ok(!isSafe, `signature.nguoiKy must NOT be SAFE_LABEL_CLEANUP, got: ${item.classification}`);
  });

  it('signature.cheDo rationale must mention domain mismatch', () => {
    const report = loadReport();
    const item = report.analysis?.find(i => i.path === 'signature.cheDo');
    assert.ok(item, 'signature.cheDo must exist in analysis');
    const rationale = (item.rationale || '').toLowerCase();
    assert.ok(
      rationale.includes('domain') || rationale.includes('signature') || rationale.includes('unsafe'),
      `signature.cheDo rationale must mention domain/unsafe, got: ${item.rationale}`
    );
  });

  it('signature.nguoiKy rationale must mention domain mismatch', () => {
    const report = loadReport();
    const item = report.analysis?.find(i => i.path === 'signature.nguoiKy');
    assert.ok(item, 'signature.nguoiKy must exist in analysis');
    const rationale = (item.rationale || '').toLowerCase();
    assert.ok(
      rationale.includes('domain') || rationale.includes('signature') || rationale.includes('unsafe'),
      `signature.nguoiKy rationale must mention domain/unsafe, got: ${item.rationale}`
    );
  });

  it('safeLabelCleanup count must be 0', () => {
    const report = loadReport();
    assert.strictEqual(report.summary?.safeLabelCleanup, 0,
      `safeLabelCleanup must be 0, got: ${report.summary?.safeLabelCleanup}`);
  });

  it('safeCleanupCandidates must be empty', () => {
    const report = loadReport();
    assert.strictEqual(report.safeCleanupCandidates?.length || 0, 0,
      `safeCleanupCandidates must be empty, got: ${report.safeCleanupCandidates?.length}`);
  });

  it('approvedForBatch1 must be 1 (only document.diaChi)', () => {
    const report = loadReport();
    assert.strictEqual(report.summary?.approvedForBatch1, 1,
      `approvedForBatch1 must be 1, got: ${report.summary?.approvedForBatch1}`);
  });

  it('document.diaChi must be SAFE_PATH_REMAP', () => {
    const report = loadReport();
    const item = report.safeRemapCandidates?.find(i => i.path === 'document.diaChi');
    assert.ok(item, 'document.diaChi must be in safeRemapCandidates');
    assert.strictEqual(item.classification, 'SAFE_PATH_REMAP',
      `document.diaChi classification must be SAFE_PATH_REMAP, got: ${item.classification}`);
  });

  it('document.diaChi must have collisionCheck', () => {
    const report = loadReport();
    const item = report.safeRemapCandidates?.find(i => i.path === 'document.diaChi');
    assert.ok(item, 'document.diaChi must be in safeRemapCandidates');
    assert.ok(item.collisionCheck, 'document.diaChi must have collisionCheck');
    assert.strictEqual(item.collisionCheck.safeToRemap, true,
      'document.diaChi collisionCheck.safeToRemap must be true');
  });

  it('document.diaChi proposedPath must be person.idNumber', () => {
    const report = loadReport();
    const item = report.safeRemapCandidates?.find(i => i.path === 'document.diaChi');
    assert.ok(item, 'document.diaChi must be in safeRemapCandidates');
    assert.strictEqual(item.proposedPath, 'person.idNumber',
      `document.diaChi proposedPath must be person.idNumber, got: ${item.proposedPath}`);
  });

  it('approvedForBatch1 must equal safeCleanup + safeRemap', () => {
    const report = loadReport();
    const expected = (report.safeCleanupCandidates?.length || 0) + (report.safeRemapCandidates?.length || 0);
    assert.strictEqual(report.summary?.approvedForBatch1, expected,
      `approvedForBatch1 (${report.summary?.approvedForBatch1}) must equal safeCleanup + safeRemap (${expected})`);
  });

  it('total paths with issues must be 16', () => {
    const report = loadReport();
    assert.strictEqual(report.summary?.totalPathsWithIssues, 16,
      `totalPathsWithIssues must be 16, got: ${report.summary?.totalPathsWithIssues}`);
  });

  it('deferred count must be 15', () => {
    const report = loadReport();
    assert.strictEqual(report.summary?.deferred, 15,
      `deferred must be 15, got: ${report.summary?.deferred}`);
  });

  it('total analysis items must be 16', () => {
    const report = loadReport();
    assert.strictEqual(report.analysis?.length || 0, 16,
      `analysis must have 16 items, got: ${report.analysis?.length}`);
  });

  it('deferredCandidates count must match deferred summary', () => {
    const report = loadReport();
    const deferredCount = report.deferredCandidates?.length || 0;
    assert.strictEqual(report.summary?.deferred, deferredCount,
      `deferred summary (${report.summary?.deferred}) must equal deferredCandidates.length (${deferredCount})`);
  });
});
