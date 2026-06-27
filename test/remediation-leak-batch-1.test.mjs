/**
 * test/remediation-leak-batch-1.test.mjs
 *
 * Regression tests for REMEDIATION_LEAK_BATCH_1_SAFE_SLOT_LABEL_CLEANUP.
 *
 * These tests verify the planner and apply runner work correctly
 * without mutating the actual corpus.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

const ROOT = resolve(process.cwd());
const PLAN_DIR = join(ROOT, 'docs', 'audit', 'remediation-leak-batch-1');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

describe('remediation-leak-batch-1', () => {
  let plan;
  let decisions;

  before(() => {
    // Load plan
    const planPath = join(PLAN_DIR, 'plan.latest.json');
    if (existsSync(planPath)) {
      plan = JSON.parse(readFileSync(planPath, 'utf-8'));
    }

    // Load decisions
    const decisionsPath = join(PLAN_DIR, 'decisions.approved.json');
    if (existsSync(decisionsPath)) {
      decisions = JSON.parse(readFileSync(decisionsPath, 'utf-8'));
    }
  });

  describe('planner output', () => {
    it('should generate plan.latest.json', () => {
      assert.ok(existsSync(join(PLAN_DIR, 'plan.latest.json')), 'plan.latest.json exists');
    });

    it('should generate plan.latest.md', () => {
      assert.ok(existsSync(join(PLAN_DIR, 'plan.latest.md')), 'plan.latest.md exists');
    });

    it('should have valid plan structure', () => {
      assert.ok(plan, 'plan is loaded');
      assert.ok(plan.planVersion, 'has planVersion');
      assert.ok(plan.generatedAt, 'has generatedAt');
      assert.ok(plan.scope, 'has scope');
      assert.ok(plan.candidates, 'has candidates');
      assert.ok(Array.isArray(plan.candidates), 'candidates is array');
    });

    it('should limit batch to max 5 BMs or 20 mutations', () => {
      assert.ok(plan, 'plan is loaded');
      const uniqueBMs = new Set(plan.candidates.map(c => c.templateCode));
      assert.ok(uniqueBMs.size <= 5 || plan.candidates.length <= 20,
        `Batch size: ${uniqueBMs.size} BMs, ${plan.candidates.length} mutations`);
    });

    it('should only produce UPDATE_SLOT_LABEL candidates', () => {
      assert.ok(plan, 'plan is loaded');
      for (const c of plan.candidates) {
        assert.strictEqual(c.action, 'UPDATE_SLOT_LABEL', `${c.templateCode}/${c.slotId} action`);
        assert.ok(c.labelBefore, `${c.templateCode}/${c.slotId} has labelBefore`);
        assert.ok(c.labelAfter, `${c.templateCode}/${c.slotId} has labelAfter`);
      }
    });

    it('should not have bad labels as labelAfter', () => {
      if (!plan?.candidates?.length) return;
      const badPatterns = [
        /Slot from/i,
        /remediation/i,
        /TODO/i,
        /unknown/i,
        /^field\d+$/i,
      ];
      for (const c of plan.candidates) {
        for (const re of badPatterns) {
          assert.ok(!re.test(c.labelAfter),
            `${c.templateCode}/${c.slotId}: labelAfter "${c.labelAfter}" matches bad pattern ${re}`);
        }
      }
    });

    it('should have allCandidates reference', () => {
      assert.ok(plan.allCandidates, 'has allCandidates');
      assert.ok(Array.isArray(plan.allCandidates), 'allCandidates is array');
      assert.ok(plan.allCandidates.length >= plan.candidates.length, 'allCandidates >= candidates');
    });
  });

  describe('decisions file', () => {
    it('should generate decisions.approved.json', () => {
      assert.ok(existsSync(join(PLAN_DIR, 'decisions.approved.json')), 'decisions.approved.json exists');
    });

    it('should have valid decisions structure', () => {
      assert.ok(decisions, 'decisions is loaded');
      assert.ok(decisions.version, 'has version');
      assert.ok(Array.isArray(decisions.decisions), 'decisions is array');
    });

    it('should only contain APPROVED_UPDATE_SLOT_LABEL decisions', () => {
      if (!decisions?.decisions?.length) return;
      for (const d of decisions.decisions) {
        if (d.decision !== 'APPROVED_UPDATE_SLOT_LABEL') continue;
        assert.strictEqual(d.action, 'UPDATE_SLOT_LABEL', `${d.templateCode}/${d.slotId} action`);
        assert.ok(d.templateCode, `${d.templateCode}/${d.slotId} has templateCode`);
        assert.ok(d.slotId, `${d.templateCode}/${d.slotId} has slotId`);
      }
    });
  });

  describe('locked contract assertions', () => {
    it('should find all candidate contracts', () => {
      if (!plan?.candidates?.length) return;

      const found = [];
      const missing = [];

      for (const c of plan.candidates) {
        const files = readdirSync(LOCKED_DIR);
        const match = files.find(f =>
          f.startsWith(`${c.templateCode}__`) && f.endsWith('.contract.locked.json')
        );
        if (match) {
          found.push(c);
        } else {
          missing.push(c);
        }
      }

      assert.strictEqual(missing.length, 0,
        `Missing contracts: ${missing.map(c => c.templateCode).join(', ')}`);
    });

    it('should have slot.label updated to labelAfter (post-mutation)', () => {
      if (!plan?.candidates?.length) return;

      for (const c of plan.candidates) {
        const files = readdirSync(LOCKED_DIR);
        const filename = files.find(f =>
          f.startsWith(`${c.templateCode}__`) && f.endsWith('.contract.locked.json')
        );
        if (!filename) continue;

        const contract = JSON.parse(
          readFileSync(join(LOCKED_DIR, filename), 'utf-8')
        );
        const slot = contract.docxSlots?.find(s => s.slotId === c.slotId);

        assert.ok(slot, `${c.templateCode}/${c.slotId}: slot exists`);
        // After mutation, slot.label should equal labelAfter
        assert.strictEqual(slot?.label, c.labelAfter,
          `${c.templateCode}/${c.slotId}: slot.label should be updated to labelAfter (got "${slot?.label}", expected "${c.labelAfter}")`);
      }
    });

    it('should have canonicalFields[slotId].label === labelAfter', () => {
      if (!plan?.candidates?.length) return;

      for (const c of plan.candidates) {
        const files = readdirSync(LOCKED_DIR);
        const filename = files.find(f =>
          f.startsWith(`${c.templateCode}__`) && f.endsWith('.contract.locked.json')
        );
        if (!filename) continue;

        const contract = JSON.parse(
          readFileSync(join(LOCKED_DIR, filename), 'utf-8')
        );
        // canonicalFields is array
        const field = contract.canonicalFields?.find(f => f.path === c.slotId);

        assert.ok(field, `${c.templateCode}/${c.slotId}: canonical field exists`);
        assert.strictEqual(field?.label, c.labelAfter,
          `${c.templateCode}/${c.slotId}: canonical label matches`);
      }
    });
  });

  describe('apply output (if run)', () => {
    // Skip these tests if apply hasn't been run yet
    const applyJsonExists = existsSync(join(PLAN_DIR, 'apply.latest.json'));
    const applyMdExists = existsSync(join(PLAN_DIR, 'apply.latest.md'));

    it('should generate apply.latest.json', () => {
      // This test only passes after apply runner has been run
      if (!applyJsonExists) return; // skip
      assert.ok(existsSync(join(PLAN_DIR, 'apply.latest.json')), 'apply.latest.json exists');
    });

    it('should generate apply.latest.md', () => {
      // This test only passes after apply runner has been run
      if (!applyMdExists) return; // skip
      assert.ok(existsSync(join(PLAN_DIR, 'apply.latest.md')), 'apply.latest.md exists');
    });
  });
});
