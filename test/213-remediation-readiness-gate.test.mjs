import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateReadiness,
  evaluateRemediationReadiness,
  parseContractSyncOutput,
  summarizeRenderAtlas,
  extractActiveRenderBlockers,
} from "../scripts/audit/check-213-remediation-readiness.mjs";

test("parseContractSyncOutput extracts stale template codes", () => {
  const parsed = parseContractSyncOutput(`
Stale contracts (2):
  - BM-052
  - BM-062
CI Gate FAILED
`);

  assert.deepEqual(parsed.stale, ["BM-052", "BM-062"]);
  assert.deepEqual(parsed.missing, []);
});

test("summarizeRenderAtlas counts non-PASS rows and failing templates", () => {
  const summary = summarizeRenderAtlas({
    rows: [
      { templateCode: "BM-001", status: "PASS" },
      { templateCode: "BM-063", status: "FAIL" },
      { templateCode: "BM-066", status: "ERROR" },
    ],
  });

  assert.equal(summary.total, 3);
  assert.equal(summary.pass, 1);
  assert.equal(summary.fail, 1);
  assert.equal(summary.error, 1);
  assert.deepEqual(summary.failingTemplates, ["BM-063", "BM-066"]);
});

test("extractActiveRenderBlockers returns FAIL blockers with humanReviewBlockerPath", () => {
  const pack = {
    renderBlockers: [
      { templateCode: "BM-063", status: "FAIL", humanReviewBlockerPath: "docs/audit/BM-063/blocker.md" },
      { templateCode: "BM-066", status: "FAIL", humanReviewBlockerPath: "docs/audit/BM-066/blocker.md" },
      { templateCode: "BM-999", status: "PASS", humanReviewBlockerPath: "docs/audit/BM-999/blocker.md" },
      { templateCode: "BM-888", status: "FAIL" },
    ],
  };
  assert.deepEqual(extractActiveRenderBlockers(pack), ["BM-063", "BM-066"]);
});

test("extractActiveRenderBlockers returns empty array for null/undefined", () => {
  assert.deepEqual(extractActiveRenderBlockers(null), []);
  assert.deepEqual(extractActiveRenderBlockers(undefined), []);
  assert.deepEqual(extractActiveRenderBlockers({}), []);
});

// --- evaluateRemediationReadiness test cases ---

function makeInput(overrides = {}) {
  return {
    head: "abc123",
    gitStatusShort: "",
    c3: { exitCode: 0 },
    c2: { exitCode: 0, stdout: "", stderr: "" },
    renderAtlas: {
      exists: true,
      summary: { pass: 213, fail: 0, error: 0, missing: 0, failingTemplates: [] },
    },
    decisionGate: {
      exists: true,
      head: "abc123",
      canStart213SemanticRemediation: true,
      blockingDecisions: [],
    },
    ...overrides,
  };
}

test("evaluateRemediationReadiness: no blockers → full and non-blocked both allowed", () => {
  const input = makeInput();
  const verdict = evaluateRemediationReadiness(input);

  assert.equal(verdict.ready, true);
  assert.equal(verdict.remediationScope.canStartFull213Remediation, true);
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, true);
  assert.deepEqual(verdict.remediationScope.blockedBms, []);
  assert.deepEqual(verdict.remediationScope.requiredExclusions, []);
  assert.equal(verdict.remediationScope.allowedRemediationScope, "213 BMs");
  assert.equal(verdict.blockers.length, 0);
});

test("evaluateRemediationReadiness: C3 fail blocks everything", () => {
  const verdict = evaluateRemediationReadiness(makeInput({ c3: { exitCode: 1 } }));

  assert.equal(verdict.ready, false);
  assert.equal(verdict.remediationScope.canStartFull213Remediation, false);
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, false);
  assert.deepEqual(verdict.blockers.map((b) => b.code), ["C3_LOCKED_COMPILED_FAILED"]);
});

test("evaluateRemediationReadiness: C2 fail blocks everything", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({ c2: { exitCode: 1, stdout: "Stale (1):\n  - BM-001\n", stderr: "" } }),
  );

  assert.equal(verdict.ready, false);
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, false);
  assert.equal(verdict.blockers[0].code, "C2_CONTRACT_DB_SYNC_FAILED");
});

test("evaluateRemediationReadiness: unexpected git dirty blocks full-213 only, not non-blocked", () => {
  const verdict = evaluateRemediationReadiness(makeInput({ gitStatusShort: " M file.txt" }));

  assert.equal(verdict.ready, false);
  // non-blocked remediation ignores git dirtiness
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, true);
  // full-213 remediation requires worktree to be acceptable
  assert.equal(verdict.remediationScope.canStartFull213Remediation, false);
  // raw git state is dirty
  assert.equal(verdict.git.rawGitClean, false);
  assert.equal(verdict.git.rawGitStatusCount, 1);
  // worktree is NOT acceptable because "M file.txt" is not an expected dirty path
  assert.equal(verdict.git.worktreeAcceptableForActiveBatch, false);
  // blocked by unexpected dirty file
  assert.deepEqual(verdict.blockers.map((b) => b.code), ["GIT_STATUS_UNEXPECTED_DIRTY"]);
});

test("evaluateRemediationReadiness: unknown render fail blocks non-blocked remediation", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({
      renderAtlas: {
        exists: true,
        summary: {
          pass: 212,
          fail: 1,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-001"],
        },
      },
      decisionGate: {
        exists: true,
        head: "abc123",
        canStart213SemanticRemediation: false,
        blockingDecisions: [],
      },
    }),
  );

  assert.equal(verdict.ready, false);
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, false);
  // RENDER_ATLAS_NOT_CLEAN is NOT added to blockers for non-blocked scope since it
  // applies only to full-213. Blocker list is empty — reason is in renderAtlasBlocker.
  assert.deepEqual(verdict.blockers.map((b) => b.code), []);
});

test("evaluateRemediationReadiness: known active render blockers allow non-blocked remediation", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({
      renderAtlas: {
        exists: true,
        summary: {
          pass: 209,
          fail: 4,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-052", "BM-062", "BM-063", "BM-066"],
        },
      },
      decisionGate: {
        exists: true,
        head: "abc123",
        canStart213SemanticRemediation: false,
        blockingDecisions: [
          { templates: ["BM-063", "BM-066"] },
          { templates: ["BM-052", "BM-062"] },
        ],
      },
    }),
    { knownActiveBlockers: ["BM-052", "BM-062", "BM-063", "BM-066"] },
  );

  assert.equal(verdict.ready, false);
  assert.equal(verdict.remediationScope.canStartFull213Remediation, false);
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, true);
  assert.deepEqual(verdict.remediationScope.blockedBms, ["BM-052", "BM-062", "BM-063", "BM-066"]);
  assert.deepEqual(verdict.remediationScope.requiredExclusions, ["BM-052", "BM-062", "BM-063", "BM-066"]);
  assert.deepEqual(verdict.remediationScope.allowedRemediationScope, "209 BMs (excluding active blockers)");
  // RENDER_ATLAS_NOT_CLEAN not in list because the non-blocked scope verdict allows
  // remediation when every failing template is an explicit active blocker.
  assert.deepEqual(verdict.blockers.map((b) => b.code), []);
});

test("evaluateRemediationReadiness: decision gate with unknown non-render template blocks full-213 only", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({
      renderAtlas: {
        exists: true,
        summary: {
          pass: 209,
          fail: 4,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-052", "BM-062", "BM-063", "BM-066"],
        },
      },
      decisionGate: {
        exists: true,
        head: "abc123",
        canStart213SemanticRemediation: false,
        blockingDecisions: [{ templates: ["BM-052", "BM-062", "BM-063", "BM-066", "BM-001"] }],
      },
    }),
    { knownActiveBlockers: ["BM-052", "BM-062", "BM-063", "BM-066"] },
  );

  // Decision gate blocks full-213 via BM-001 (not a known active blocker).
  // But non-blocked is allowed because all render failures are known active blockers.
  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, true);
  assert.equal(verdict.remediationScope.canStartFull213Remediation, false);
  assert.ok(verdict.blockers.some((b) => b.code === "ACTIVE_DECISION_GATE_BLOCKED"));
});

test("evaluateRemediationReadiness: custom knownActiveBlockers option works", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({
      renderAtlas: {
        exists: true,
        summary: {
          pass: 212,
          fail: 1,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-001"],
        },
      },
      decisionGate: {
        exists: true,
        head: "abc123",
        canStart213SemanticRemediation: false,
        blockingDecisions: [{ templates: ["BM-001"] }],
      },
    }),
    { knownActiveBlockers: ["BM-001"] },
  );

  assert.equal(verdict.remediationScope.canStartNonBlockedRemediation, true);
  assert.deepEqual(verdict.remediationScope.requiredExclusions, ["BM-001"]);
});

// --- backward-compat evaluateReadiness wrapper ---

test("evaluateReadiness (deprecated wrapper): passes through ready, blockers, warnings", () => {
  const input = makeInput({ c3: { exitCode: 1 } });
  const result = evaluateReadiness(input);

  assert.equal(result.ready, false);
  assert.equal(result.blockers[0].code, "C3_LOCKED_COMPILED_FAILED");
  assert.deepEqual(result.warnings, []);
});

test("evaluateReadiness (deprecated wrapper): render fail + decision gate BLOCK → ready=false", () => {
  const verdict = evaluateRemediationReadiness(
    makeInput({
      renderAtlas: {
        exists: true,
        summary: {
          pass: 209,
          fail: 4,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-052", "BM-062", "BM-063", "BM-066"],
        },
      },
      decisionGate: {
        exists: true,
        head: "abc123",
        canStart213SemanticRemediation: false,
        blockingDecisions: [
          { templates: ["BM-063", "BM-066"] },
          { templates: ["BM-052", "BM-062"] },
        ],
      },
    }),
  );
  const result = evaluateReadiness(makeInput({
    renderAtlas: {
      exists: true,
      summary: {
          pass: 209,
          fail: 4,
          error: 0,
          missing: 0,
          failingTemplates: ["BM-052", "BM-062", "BM-063", "BM-066"],
      },
    },
    decisionGate: {
      exists: true,
      head: "abc123",
      canStart213SemanticRemediation: false,
      blockingDecisions: [
        { templates: ["BM-063", "BM-066"] },
        { templates: ["BM-052", "BM-062"] },
      ],
    },
  }));

  assert.equal(result.ready, false);
  assert.deepEqual(result.blockers.map((b) => b.code), []);
});
