import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRuntimeSyncDecision,
  isActiveRenderBlocker,
  isRuntimeSyncBlocker,
  summarizeRenderReport,
} from "../scripts/audit/build-active-remediation-blocker-pack.mjs";

test("summarizeRenderReport captures binding and literal blockers", () => {
  const summary = summarizeRenderReport("BM-063", {
    status: "FAIL",
    clean: false,
    render: { status: "PASS" },
    textFidelity: { status: "PASS" },
    structureFidelity: { status: "PASS" },
    packageIntegrity: { status: "PASS" },
    bindingFidelity: {
      status: "FAIL",
      templatePlaceholdersWithoutSlots: ["document.fullDocumentCode8"],
      templatePlaceholdersWithoutBindings: ["document.fullDocumentCode8"],
    },
    literalFidelity: {
      status: "FAIL",
      undefinedOrNullLiterals: 8,
    },
    sourcePlaceholders: {
      counts: {
        "document.fullDocumentCode8": 8,
      },
    },
  });

  assert.equal(summary.status, "FAIL");
  assert.equal(summary.renderStatus, "PASS");
  assert.equal(summary.undefinedOrNullLiterals, 8);
  assert.deepEqual(summary.placeholdersWithoutSlots, [
    "document.fullDocumentCode8",
  ]);
  assert.equal(summary.sourcePlaceholderCounts["document.fullDocumentCode8"], 8);
});

test("buildRuntimeSyncDecision points to the matching historical DB version", () => {
  const decision = buildRuntimeSyncDecision(
    "BM-062",
    {
      contractHash: "repo-hash",
      sourceId: "BM-062__source",
    },
    [
      { versionNo: 9, contractHash: "newer-db-hash", publishedAt: "2026-06-28" },
      { versionNo: 7, contractHash: "repo-hash", publishedAt: "2026-06-27" },
    ],
  );

  assert.equal(decision.latestDbVersion.versionNo, 9);
  assert.equal(decision.latestDbVersion.matchesRepo, false);
  assert.equal(decision.matchingDbVersion.versionNo, 7);
  assert.deepEqual(decision.forbiddenWithoutApproval, [
    "DB publish",
    "contract mutation",
    "treating C2 drift as safe",
  ]);
  assert.equal(isRuntimeSyncBlocker(decision), true);
});

test("isRuntimeSyncBlocker returns false when latest DB already matches repo", () => {
  const decision = buildRuntimeSyncDecision(
    "BM-052",
    {
      contractHash: "repo-hash",
      sourceId: "BM-052__source",
    },
    [
      { versionNo: 12, contractHash: "repo-hash", publishedAt: "2026-06-29" },
    ],
  );

  assert.equal(decision.latestDbVersion.matchesRepo, true);
  assert.equal(isRuntimeSyncBlocker(decision), false);
});

test("isActiveRenderBlocker returns false for clean render reports", () => {
  assert.equal(
    isActiveRenderBlocker({
      status: "PASS",
      clean: true,
    }),
    false,
  );
  assert.equal(
    isActiveRenderBlocker({
      status: "FAIL",
      clean: false,
    }),
    true,
  );
});
