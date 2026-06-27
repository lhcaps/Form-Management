/**
 * test/remediation-leak-docx-review-2c-report-integrity.test.mjs
 *
 * Tests for DOCX review report integrity validation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REPORT_PATH = join(ROOT, 'docs', 'audit', 'remediation-leak-docx-review-2c', 'latest.json');

function loadReport() {
  return JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
}

describe('DOCX_REVIEW_2C Report Integrity', () => {

  it('approved count must equal approvedItems.length', () => {
    const report = loadReport();
    assert.strictEqual(report.approved, report.approvedItems?.length ?? 0,
      `approved (${report.approved}) must equal approvedItems.length (${report.approvedItems?.length})`);
  });

  it('deferred count must equal deferredItems.length', () => {
    const report = loadReport();
    assert.strictEqual(report.deferred, report.deferredItems?.length ?? 0,
      `deferred (${report.deferred}) must equal deferredItems.length (${report.deferredItems?.length})`);
  });

  it('approved + deferred must equal totalItems', () => {
    const report = loadReport();
    const sum = (report.approved || 0) + (report.deferred || 0);
    assert.strictEqual(sum, report.totalItems,
      `approved + deferred (${sum}) must equal totalItems (${report.totalItems})`);
  });

  it('BM-069/document.fullDocumentCode must NOT be approved', () => {
    const report = loadReport();
    const approved = report.approvedItems?.find(
      i => i.templateCode === 'BM-069' && i.path === 'document.fullDocumentCode'
    );
    assert.strictEqual(approved, undefined,
      'BM-069/document.fullDocumentCode must NOT be in approvedItems');
  });

  it('BM-069/document.fullDocumentCode must be in deferredItems', () => {
    const report = loadReport();
    const deferred = report.deferredItems?.find(
      i => i.templateCode === 'BM-069' && i.path === 'document.fullDocumentCode'
    );
    assert.ok(deferred, 'BM-069/document.fullDocumentCode must be in deferredItems');
  });

  it('BM-069/document.fullDocumentCode deferred reason must be CROSS_BM_EVIDENCE', () => {
    const report = loadReport();
    const deferred = report.deferredItems?.find(
      i => i.templateCode === 'BM-069' && i.path === 'document.fullDocumentCode'
    );
    assert.ok(deferred, 'BM-069/document.fullDocumentCode must be in deferredItems');
    assert.ok(
      deferred.reason === 'CROSS_BM_EVIDENCE_NOT_ACCEPTED' ||
      deferred.reason?.includes('CROSS_BM'),
      `BM-069/document.fullDocumentCode must have CROSS_BM reason, got: ${deferred.reason}`
    );
  });

  it('no approved item may have risk > LOW without APPROVED_FOR_APPLY', () => {
    const report = loadReport();
    for (const item of report.approvedItems || []) {
      if (item.risk && item.risk !== 'low' && item.risk !== 'LOW') {
        const fullItem = report.consolidatedEvidence?.find(
          e => e.templateCode === item.templateCode && e.path === item.path
        );
        assert.ok(
          fullItem?.evidence?.explicitApproval === 'APPROVED_FOR_APPLY',
          `Item ${item.templateCode}/${item.path} has risk="${item.risk}" but no APPROVED_FOR_APPLY`
        );
      }
    }
  });

  it('approvedItems must have no cross-BM evidence', () => {
    const report = loadReport();
    for (const item of report.approvedItems || []) {
      const fullItem = report.consolidatedEvidence?.find(
        e => e.templateCode === item.templateCode && e.path === item.path
      );
      if (fullItem?.evidence?.originalDocPath) {
        const expectedBM = item.templateCode.replace('BM-', '');
        // Check that the evidence path does not contain a different BM number
        const patterns = ['68-', '69-', '70-', '71-', '72-', '73-', '74-', '75-', '76-', '77-', '78-', '79-', '80-', '81-', '82-', '83-', '162-', '163-']
          .filter(p => !p.startsWith(expectedBM));
        for (const pattern of patterns) {
          assert.ok(
            !fullItem.evidence.originalDocPath.includes(pattern),
            `Cross-BM evidence: ${item.templateCode}/${item.path} has evidence from ${pattern}`
          );
        }
      }
    }
  });

  it('totalItems must be 10', () => {
    const report = loadReport();
    assert.strictEqual(report.totalItems, 10, 'totalItems must be 10');
  });

  it('approved must be 0', () => {
    const report = loadReport();
    assert.strictEqual(report.approved, 0, 'approved must be 0');
  });

  it('deferred must be 10', () => {
    const report = loadReport();
    assert.strictEqual(report.deferred, 10, 'deferred must be 10');
  });

  it('batch2C recommendation must be CANNOT_CREATE_BATCH_2C_APPLY', () => {
    const report = loadReport();
    assert.ok(
      report.recommendations?.batch2C === 'CANNOT_CREATE_BATCH_2C_APPLY',
      `batch2C must be CANNOT_CREATE_BATCH_2C_APPLY, got: ${report.recommendations?.batch2C}`
    );
  });
});
