import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateReadiness,
  parseContractSyncOutput,
  summarizeRenderAtlas,
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

test("evaluateReadiness blocks broad remediation on C2 drift and render failures", () => {
  const verdict = evaluateReadiness({
    head: "abc123",
    gitStatusShort: "",
    c3: { exitCode: 0 },
    c2: {
      exitCode: 1,
      stdout: "Stale contracts (1):\n  - BM-052\n",
      stderr: "",
    },
    renderAtlas: {
      exists: true,
      summary: {
        pass: 211,
        fail: 2,
        error: 0,
        missing: 0,
        failingTemplates: ["BM-063", "BM-066"],
      },
    },
    decisionGate: {
      exists: true,
      head: "abc123",
      canStart213SemanticRemediation: false,
      blockingDecisions: [{ templates: ["BM-052", "BM-062"] }],
    },
  });

  assert.equal(verdict.ready, false);
  assert.deepEqual(
    verdict.blockers.map((blocker) => blocker.code),
    [
      "C2_CONTRACT_DB_SYNC_FAILED",
      "RENDER_ATLAS_NOT_CLEAN",
      "ACTIVE_DECISION_GATE_BLOCKED",
    ],
  );
});
