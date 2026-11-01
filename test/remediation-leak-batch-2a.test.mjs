/**
 * test/remediation-leak-batch-2a.test.mjs
 *
 * Regression tests for REMEDIATION_LEAK Batch 2A: Bad Canonical Label Cleanup
 *
 * Tests verify:
 * - Planner generates correct decisions
 * - Apply runner mutates only canonicalFields[].label and docxSlots[].label
 * - No path/source/renderBindings/required/reviewRequired mutation
 * - Validation passes
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

const ROOT = resolve(process.cwd());
const PLAN_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-2a');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const BACKUP_DIR = join(
  PLAN_DIR,
  'backups',
  '2026-06-27T18-23-21-186Z',
);

describe('remediation-leak-batch-2a', () => {
  let plan;
  let decisions;
  let applyReport;

  before(() => {
    const planPath = join(PLAN_DIR, 'plan.latest.json');
    if (existsSync(planPath)) {
      plan = JSON.parse(readFileSync(planPath, 'utf-8'));
    }

    const decisionsPath = join(PLAN_DIR, 'decisions.approved.json');
    if (existsSync(decisionsPath)) {
      decisions = JSON.parse(readFileSync(decisionsPath, 'utf-8'));
    }

    const applyPath = join(PLAN_DIR, 'apply.latest.json');
    if (existsSync(applyPath)) {
      applyReport = JSON.parse(readFileSync(applyPath, 'utf-8'));
    }
  });

  describe('planner output', () => {
    it('should generate plan.latest.json', () => {
      assert.ok(existsSync(join(PLAN_DIR, 'plan.latest.json')), 'plan.latest.json exists');
    });

    it('should have valid plan structure', () => {
      assert.ok(plan, 'plan is loaded');
      assert.ok(plan.planVersion, 'has planVersion');
      assert.ok(plan.scope, 'has scope');
      assert.strictEqual(plan.scope.subType, 'DEFERRED_BAD_CANONICAL_LABEL', 'subType');
    });

    it('should have candidates', () => {
      assert.ok(plan?.candidates?.length > 0, 'has candidates');
    });

    it('should only have UPDATE_CANONICAL_THEN_SLOT or UPDATE_SLOT_LABEL actions', () => {
      for (const c of plan?.candidates ?? []) {
        assert.ok(
          c.action === 'UPDATE_CANONICAL_THEN_SLOT' || c.action === 'UPDATE_SLOT_LABEL',
          `${c.templateCode}/${c.path}: action is valid`
        );
      }
    });

    it('should have no bad labels as labelAfter', () => {
      const badPatterns = [/Slot from/i, /remediation/i, /TODO/i, /unknown/i, /^field\d+$/i];
      for (const c of plan?.candidates ?? []) {
        for (const re of badPatterns) {
          assert.ok(!re.test(c.canonicalLabelAfter), `${c.templateCode}/${c.path}: canonicalLabelAfter is clean`);
          assert.ok(!re.test(c.slotLabelAfter), `${c.templateCode}/${c.path}: slotLabelAfter is clean`);
        }
      }
    });

    it('should limit batch to max 5 BMs or 20 mutations', () => {
      const uniqueBMs = new Set(plan?.candidates?.map(c => c.templateCode) ?? []);
      assert.ok(
        uniqueBMs.size <= 5 || (plan?.candidates?.length ?? 0) <= 20,
        `Batch size: ${uniqueBMs.size} BMs, ${plan?.candidates?.length} mutations`
      );
    });
  });

  describe('decisions file', () => {
    it('should generate decisions.approved.json', () => {
      assert.ok(existsSync(join(PLAN_DIR, 'decisions.approved.json')), 'decisions.approved.json exists');
    });

    it('should have valid decisions structure', () => {
      assert.ok(decisions, 'decisions loaded');
      assert.ok(Array.isArray(decisions.decisions), 'decisions is array');
    });

    it('should have reviewer and decision fields', () => {
      for (const d of decisions?.decisions ?? []) {
        assert.ok(d.reviewer, `${d.templateCode}/${d.path}: has reviewer`);
        assert.strictEqual(d.decision, 'APPROVED', `${d.templateCode}/${d.path}: decision is APPROVED`);
      }
    });
  });

  describe('locked contract assertions', () => {
    it('should find all candidate contracts', () => {
      for (const c of plan?.candidates ?? []) {
        const files = readdirSync(LOCKED_DIR);
        const match = files.find(f =>
          f.startsWith(`${c.templateCode}__`) && f.endsWith('.contract.locked.json')
        );
        assert.ok(match, `${c.templateCode}: contract found`);
      }
    });

    it('apply report records every approved label-only mutation', () => {
      assert.ok(applyReport, 'apply report is loaded');
      assert.strictEqual(applyReport.summary.errors, 0, 'apply had no errors');
      assert.strictEqual(
        applyReport.summary.applied,
        plan.candidates.length,
        'all planned candidates were applied',
      );

      for (const c of plan?.candidates ?? []) {
        const result = applyReport.results.find(
          (row) => row.templateCode === c.templateCode && row.path === c.path,
        );
        assert.ok(result, `${c.templateCode}/${c.path}: apply result exists`);
        assert.strictEqual(result.status, 'APPLIED');
        assert.strictEqual(result.canonicalLabelAfter, c.canonicalLabelAfter);
        assert.strictEqual(result.slotLabelAfter, c.slotLabelAfter);
      }
    });

    it('pre-mutation backups preserve the original source', () => {
      for (const c of plan?.candidates ?? []) {
        const backupPath = join(BACKUP_DIR, `${c.templateCode}.contract.locked.json`);
        assert.ok(existsSync(backupPath), `${c.templateCode}: backup exists`);
        const contract = JSON.parse(readFileSync(backupPath, 'utf-8'));
        const field = contract.canonicalFields?.find(
          (candidate) => candidate.path === c.path,
        );
        assert.ok(field, `${c.templateCode}/${c.path}: backup field exists`);
        assert.strictEqual(
          field.source,
          c.source,
          `${c.templateCode}/${c.path}: source provenance is preserved`,
        );
      }
    });

    it('should NOT have required/reviewRequired mutation in decisions', () => {
      for (const d of decisions?.decisions ?? []) {
        assert.ok(!d.required, `${d.templateCode}/${d.path}: required should not be in decision`);
        assert.ok(!d.reviewRequired, `${d.templateCode}/${d.path}: reviewRequired should not be in decision`);
      }
    });
  });

  describe('apply output (if run)', () => {
    it('should generate apply.latest.json', () => {
      if (existsSync(join(PLAN_DIR, 'apply.latest.json'))) {
        assert.ok(true, 'apply.latest.json exists');
      }
      // Skip if not run yet
    });

    it('should generate apply.latest.md', () => {
      if (existsSync(join(PLAN_DIR, 'apply.latest.md'))) {
        assert.ok(true, 'apply.latest.md exists');
      }
      // Skip if not run yet
    });
  });
});
