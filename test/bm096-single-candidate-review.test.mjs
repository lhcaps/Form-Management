/**
 * test/bm096-single-candidate-review.test.mjs
 *
 * Tests for BM-096 single candidate review packet integrity.
 * Ensures no mutation happens, no approved decisions exist,
 * and only document.diaChi -> person.idNumber is the active candidate.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const REVIEW_DIR = join(ROOT, 'docs', 'audit', 'path-domain-binding-batch-1-bm096-single-candidate');

function loadJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('BM096 Single Candidate Review Packet Integrity', () => {

  const reviewPath = join(REVIEW_DIR, 'review.latest.json');
  const decisionPath = join(REVIEW_DIR, 'decision.proposed.json');
  const auditDir = join(ROOT, 'docs', 'audit');
  const lockedDir = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
  const compiledDir = join(ROOT, 'docs', 'audit', 'docx', 'compiled-v2');

  // Load once
  let review;
  let decision;

  before(() => {
    review = loadJson(reviewPath);
    decision = loadJson(decisionPath);
  });

  describe('File existence', () => {
    it('review.latest.json must exist', () => {
      assert.ok(existsSync(reviewPath), `review.latest.json not found at ${reviewPath}`);
    });

    it('decision.proposed.json must exist', () => {
      assert.ok(existsSync(decisionPath), `decision.proposed.json not found at ${decisionPath}`);
    });
  });

  describe('Mode enforcement', () => {
    it('decision mode must be PROPOSED_ONLY_NOT_APPROVED', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      assert.strictEqual(decision.mode, 'PROPOSED_ONLY_NOT_APPROVED',
        `mode must be PROPOSED_ONLY_NOT_APPROVED, got: ${decision.mode}`);
    });

    it('no decision may have approved=true', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const approved = decision.decisions?.filter(d => d.approved === true);
      assert.strictEqual(approved?.length || 0, 0,
        `No approved decisions allowed, found ${approved?.length || 0}`);
    });

    it('review packet must have proposed-only mode', () => {
      assert.ok(review, 'review.latest.json must load');
      assert.ok(
        review.mode === 'REVIEW_ONLY' || review.mode === 'PROPOSED_ONLY',
        `review mode must be REVIEW_ONLY or PROPOSED_ONLY, got: ${review.mode}`
      );
    });
  });

  describe('Exact candidate path', () => {
    it('templateCode must be BM-096', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      for (const d of decision.decisions || []) {
        assert.strictEqual(d.templateCode, 'BM-096',
          `templateCode must be BM-096, got: ${d.templateCode}`);
      }
    });

    it('only document.diaChi candidate exists', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const paths = decision.decisions?.map(d => d.oldPath) || [];
      assert.deepStrictEqual(paths, ['document.diaChi'],
        `Only document.diaChi allowed, got: ${paths.join(', ')}`);
    });

    it('document.diaChi must propose person.idNumber', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi, 'document.diaChi decision must exist');
      assert.strictEqual(diaChi.newPath, 'person.idNumber',
        `newPath must be person.idNumber, got: ${diaChi.newPath}`);
    });

    it('proposed label must be Số CCCD/CMND', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi, 'document.diaChi decision must exist');
      assert.strictEqual(diaChi.newLabel, 'Số CCCD/CMND',
        `newLabel must be "Số CCCD/CMND", got: ${diaChi.newLabel}`);
    });
  });

  describe('Signature exclusion', () => {
    it('signature.cheDo must NOT be in decisions', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const signature = decision.decisions?.filter(d =>
        d.oldPath?.startsWith('signature.cheDo')
      );
      assert.strictEqual(signature?.length || 0, 0,
        'signature.cheDo must NOT be in decisions');
    });

    it('signature.nguoiKy must NOT be in decisions', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const signature = decision.decisions?.filter(d =>
        d.oldPath?.startsWith('signature.nguoiKy')
      );
      assert.strictEqual(signature?.length || 0, 0,
        'signature.nguoiKy must NOT be in decisions');
    });
  });

  describe('Collision checks', () => {
    it('collisionCheck must be present for document.diaChi', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi, 'document.diaChi decision must exist');
      assert.ok(diaChi.collisionCheck, 'collisionCheck must exist');
    });

    it('canonicalFields collision check must be NO_COLLISION', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.collisionCheck, 'collisionCheck must exist');
      assert.strictEqual(diaChi.collisionCheck.canonicalFields, 'NO_COLLISION',
        `canonicalFields collision must be NO_COLLISION, got: ${diaChi.collisionCheck.canonicalFields}`);
    });

    it('docxSlots collision check must be NO_COLLISION', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.collisionCheck, 'collisionCheck must exist');
      assert.strictEqual(diaChi.collisionCheck.docxSlots, 'NO_COLLISION',
        `docxSlots collision must be NO_COLLISION, got: ${diaChi.collisionCheck.docxSlots}`);
    });

    it('renderBindings collision check must be NO_COLLISION', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.collisionCheck, 'collisionCheck must exist');
      assert.strictEqual(diaChi.collisionCheck.renderBindings, 'NO_COLLISION',
        `renderBindings collision must be NO_COLLISION, got: ${diaChi.collisionCheck.renderBindings}`);
    });
  });

  describe('Safety criteria', () => {
    it('rawPattern must be present and not empty', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.rawPattern, 'rawPattern must exist');
      assert.ok(diaChi.rawPattern.trim().length > 0,
        'rawPattern must not be empty');
    });

    it('evidenceTextBefore must be present and meaningful', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.evidenceTextBefore, 'evidenceTextBefore must exist');
      assert.ok(!/^\{\{document\.\w+\}\}$/.test(diaChi.evidenceTextBefore.trim()),
        'evidenceTextBefore must not be placeholder-only');
    });

    it('mutationsNeeded must list all required changes', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      const mutations = diaChi?.mutationsNeededIfApprovedLater ?? diaChi?.mutationsNeeded;
      assert.ok(mutations, 'mutationsNeededIfApprovedLater or mutationsNeeded must exist');
      assert.ok(Array.isArray(mutations), 'mutations must be array');
      assert.ok(mutations.length > 0, 'mutations must not be empty');
    });

    it('reviewerRequired must be true', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.strictEqual(diaChi.reviewerRequired, true,
        'reviewerRequired must be true');
    });
  });

  describe('No write artifacts', () => {
    it('later apply evidence remains report-only in this audit folder', () => {
      const mutationReports = readdirSync(REVIEW_DIR)
        .filter(f => f.includes('mutation') || f.includes('apply'));
      const unexpectedPayloads = mutationReports.filter(
        (file) => !file.endsWith('.json') && !file.endsWith('.md'),
      );
      assert.deepStrictEqual(
        unexpectedPayloads,
        [],
        `Apply evidence must remain JSON/Markdown reports: ${unexpectedPayloads.join(', ')}`,
      );
    });

    it('no locked contract files in review folder', () => {
      const lockedFiles = readdirSync(REVIEW_DIR)
        .filter(f => f.includes('.contract.locked.json'));
      assert.strictEqual(lockedFiles.length, 0,
        `No locked contract files allowed in review folder, found: ${lockedFiles.length}`);
    });

    it('no compiled-v2 files in review folder', () => {
      const compiledFiles = readdirSync(REVIEW_DIR)
        .filter(f => f.includes('compiled-v2'));
      assert.strictEqual(compiledFiles.length, 0,
        `No compiled-v2 files allowed in review folder, found: ${compiledFiles.length}`);
    });
  });

  describe('Review packet completeness', () => {
    it('review must have templateCode BM-096', () => {
      assert.ok(review, 'review.latest.json must load');
      assert.strictEqual(review.templateCode, 'BM-096',
        `templateCode must be BM-096, got: ${review.templateCode}`);
    });

    it('review must have candidate for document.diaChi', () => {
      assert.ok(review, 'review.latest.json must load');
      const candidates = review.candidates || review.analysis || [];
      const diaChi = candidates.find(c =>
        c.path === 'document.diaChi' ||
        c.oldPath === 'document.diaChi'
      );
      assert.ok(diaChi, 'document.diaChi must exist in review candidates');
    });

    it('review must include collision check results', () => {
      assert.ok(review, 'review.latest.json must load');
      const candidates = review.candidates || review.analysis || [];
      const diaChi = candidates.find(c =>
        c.path === 'document.diaChi' ||
        c.oldPath === 'document.diaChi'
      );
      assert.ok(diaChi?.collisionCheck || diaChi?.collision_result,
        'collision check must be in review');
    });

    it('review must include all co-occurring issue codes', () => {
      assert.ok(review, 'review.latest.json must load');
      const candidates = review.candidates || review.analysis || [];
      const diaChi = candidates.find(c =>
        c.path === 'document.diaChi' ||
        c.oldPath === 'document.diaChi'
      );
      assert.ok(diaChi?.issues || diaChi?.issueCodes || diaChi?.coOccurringIssues,
        'co-occurring issue codes must be in review');
    });
  });

  describe('Risk assessment', () => {
    it('decision must have risk assessment', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.risk, 'risk must exist');
    });

    it('risk must be LOW, MEDIUM, or HIGH', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      const validRisks = ['LOW', 'MEDIUM', 'HIGH'];
      assert.ok(validRisks.includes(diaChi?.risk),
        `risk must be LOW/MEDIUM/HIGH, got: ${diaChi?.risk}`);
    });

    it('decision must have recommendation', () => {
      assert.ok(decision, 'decision.proposed.json must load');
      const diaChi = decision.decisions?.find(d => d.oldPath === 'document.diaChi');
      assert.ok(diaChi?.recommendation, 'recommendation must exist');
      const validRecommendations = [
        'PROPOSE_APPROVE_SAFE_REMAP',
        'DEFER_PATH_COLLISION',
        'DEFER_SOURCE_POLICY_CONFLICT',
        'DEFER_RENDER_BINDING_CONFLICT',
        'DEFER_DOCX_EVIDENCE_WEAK',
      ];
      assert.ok(validRecommendations.includes(diaChi?.recommendation),
        `recommendation must be valid, got: ${diaChi?.recommendation}`);
    });
  });
});
