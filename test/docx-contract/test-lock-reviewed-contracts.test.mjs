import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  applyLock,
  checkLockBlockingIssues,
  collapseExactDuplicates,
  validateMapping,
} from "../../scripts/docx-contract/lock-reviewed-contracts.mjs";

function humanMapping(overrides = {}) {
  return {
    reviewedBy: "Nguyen Van Reviewer",
    reviewedAt: "2026-06-22T00:00:00.000Z",
    reviewKind: "human",
    targets: {
      "BM-999": {
        sourceId: "BM-999__fixture",
        decision: "locked",
        slotMappings: {
          "document.field1": {
            canonicalPath: "document.documentCode",
            source: "manual",
            transform: "identity",
            reviewEvidence: {
              context: "Số:",
              blockId: "P0001",
            },
          },
        },
      },
    },
    ...overrides,
  };
}

function genericContract() {
  return {
    schemaVersion: "1.0",
    sourceId: "BM-999__fixture",
    templateCode: "BM-999",
    status: "draft",
    docxSlots: [
      {
        slotId: "document.field1",
        slotType: "text",
        required: false,
        reviewRequired: true,
        location: { blockId: "P0001" },
      },
      {
        slotId: "document.field1",
        slotType: "text",
        required: false,
        reviewRequired: true,
        location: { blockId: "P0002" },
      },
    ],
    canonicalFields: [
      {
        path: "document.field1",
        source: "unknown",
        required: false,
        reviewRequired: true,
      },
    ],
    renderBindings: [
      {
        slotId: "document.field1",
        from: "document.field1",
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      },
      {
        slotId: "document.field1",
        from: "document.field1",
        transform: "identity",
        fallback: "",
        reviewRequired: true,
      },
    ],
    unresolvedQuestions: [],
    warnings: ["Draft warning"],
  };
}

test("mapping validation requires explicit review provenance", () => {
  assert.deepEqual(validateMapping(humanMapping()), []);

  assert.deepEqual(
    validateMapping(humanMapping({ reviewKind: undefined })),
    ["mapping.reviewKind must be \"human\" or \"automated\""],
  );

  assert.deepEqual(
    validateMapping(
      humanMapping({
        reviewedBy: "system-batch-lock",
        reviewKind: "automated",
      }),
    ),
    [
      "[BM-999] automated review cannot produce decision=\"locked\"",
    ],
  );
});

test("human lock mapping is applied before exact duplicates are collapsed", () => {
  const mapping = humanMapping();
  const target = mapping.targets["BM-999"];

  const locked = applyLock(
    genericContract(),
    target,
    mapping,
    "BM-999__fixture",
  );

  assert.equal(locked.status, "locked");
  assert.equal(locked.reviewKind, "human");
  assert.equal(locked.reviewedBy, "Nguyen Van Reviewer");
  assert.deepEqual(
    locked.docxSlots.map((slot) => slot.slotId),
    ["document.documentCode"],
  );
  assert.deepEqual(
    locked.canonicalFields.map((field) => field.path),
    ["document.documentCode"],
  );
  assert.deepEqual(
    locked.renderBindings.map((binding) => ({
      slotId: binding.slotId,
      from: binding.from,
    })),
    [
      {
        slotId: "document.documentCode",
        from: "document.documentCode",
      },
    ],
  );
  assert.deepEqual(locked.warnings, []);
});

test("conflicting duplicate bindings fail closed", () => {
  const records = [
    {
      slotId: "document.documentCode",
      from: "document.documentCode",
      transform: "identity",
      fallback: "",
      reviewRequired: false,
    },
    {
      slotId: "document.documentCode",
      from: "document.documentCode",
      transform: "trim",
      fallback: "",
      reviewRequired: false,
    },
  ];

  assert.throws(
    () =>
      collapseExactDuplicates(records, {
        key: (record) => record.slotId,
        semanticValue: (record) => ({
          from: record.from,
          transform: record.transform,
          fallback: record.fallback,
        }),
        label: "render binding",
      }),
    /Conflicting duplicate render binding "document\.documentCode"/u,
  );
});

test("unresolved questions remain blockers instead of being deleted", () => {
  const contract = genericContract();
  contract.unresolvedQuestions = ["Xác nhận người nhận"];
  const mapping = humanMapping();
  const locked = applyLock(
    contract,
    mapping.targets["BM-999"],
    mapping,
    "BM-999__fixture",
  );

  assert.deepEqual(locked.unresolvedQuestions, ["Xác nhận người nhận"]);
  assert.deepEqual(checkLockBlockingIssues(locked), [
    "1 unresolved question(s)",
  ]);
});

test("bulk mapping generator emits review-pending automated evidence", () => {
  const source = readFileSync(
    resolve(
      import.meta.dirname,
      "../../scripts/docx-contract/generate-all-lock-mappings-v2.mjs",
    ),
    "utf8",
  );

  assert.match(source, /reviewKind:\s*"automated"/u);
  assert.match(source, /decision:\s*"review-pending"/u);
  assert.doesNotMatch(source, /reviewedBy:\s*"system-batch-lock"/u);
});
