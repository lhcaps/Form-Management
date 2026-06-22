import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import PizZip from "pizzip";

import {
  evaluateFormArtifact,
  isGenericContractPath,
} from "../../scripts/docx-contract/lib/form-corpus-quality.mjs";

function makeDocx(placeholders = ["document.code"]) {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
  zip.file(
    "word/document.xml",
    [
      '<?xml version="1.0"?>',
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
      "<w:body>",
      ...placeholders.map(
        (placeholder) => `<w:p><w:r><w:t>{{${placeholder}}}</w:t></w:r></w:p>`,
      ),
      "</w:body>",
      "</w:document>",
    ].join(""),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

function makeContract(buffer, overrides = {}) {
  return {
    schemaVersion: "1.0",
    sourceId: "BM-999__fixture",
    templateCode: "BM-999",
    status: "locked",
    reviewedBy: "Nguyen Van Reviewer",
    reviewedAt: "2026-06-22T00:00:00.000Z",
    reviewKind: "human",
    extractionSource: {
      relativePath:
        "storage/templates/normalized-docx/BM-999/BM-999_normalized.docx",
      sha256: createHash("sha256").update(buffer).digest("hex"),
    },
    docxSlots: [
      {
        slotId: "document.code",
        reviewRequired: false,
      },
    ],
    canonicalFields: [
      {
        path: "document.code",
        source: "manual",
        reviewRequired: false,
      },
    ],
    renderBindings: [
      {
        slotId: "document.code",
        from: "document.code",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
    unresolvedQuestions: [],
    ...overrides,
  };
}

test("recognizes broad generated field paths", () => {
  assert.equal(isGenericContractPath("document.field"), true);
  assert.equal(isGenericContractPath("document.field12"), true);
  assert.equal(isGenericContractPath("recipients.field_2"), true);
  assert.equal(isGenericContractPath("document.placeholder_01"), true);
  assert.equal(isGenericContractPath("document.documentCode"), false);
});

test("reports VERIFIED only for a clean human-reviewed artifact", () => {
  const buffer = makeDocx();
  const result = evaluateFormArtifact({
    contract: makeContract(buffer),
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "VERIFIED");
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.templatePlaceholders, ["document.code"]);
});

test("reports PACKAGE_REPAIR_REQUIRED when a required OOXML part is missing", () => {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", "<Types/>");
  const buffer = zip.generate({ type: "nodebuffer" });

  const result = evaluateFormArtifact({
    contract: makeContract(buffer),
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "PACKAGE_REPAIR_REQUIRED");
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ["DOCX_REQUIRED_PART_MISSING"],
  );
  assert.deepEqual(result.issues[0].details, [
    "_rels/.rels",
    "word/document.xml",
  ]);
});

test("reports hash and placeholder parity failures as contract repair blockers", () => {
  const buffer = makeDocx(["document.actual"]);
  const contract = makeContract(buffer, {
    extractionSource: {
      relativePath: "fixture.docx",
      sha256: "0".repeat(64),
    },
  });

  const result = evaluateFormArtifact({
    contract,
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "CONTRACT_REPAIR_REQUIRED");
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    [
      "EXTRACTION_HASH_MISMATCH",
      "TEMPLATE_PLACEHOLDER_WITHOUT_SLOT",
      "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
      "BINDING_WITHOUT_TEMPLATE_PLACEHOLDER",
    ],
  );
});

test("reports generic paths as semantic remediation blockers", () => {
  const buffer = makeDocx(["document.field"]);
  const contract = makeContract(buffer, {
    docxSlots: [{ slotId: "document.field", reviewRequired: false }],
    canonicalFields: [
      {
        path: "document.field",
        source: "manual",
        reviewRequired: false,
      },
    ],
    renderBindings: [
      {
        slotId: "document.field",
        from: "document.field",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
  });

  const result = evaluateFormArtifact({
    contract,
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "SEMANTIC_REMEDIATION_REQUIRED");
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    [
      "GENERIC_SLOT_PATH",
      "GENERIC_CANONICAL_PATH",
      "GENERIC_BINDING_PATH",
    ],
  );
});

test("distinguishes exact duplicate records from conflicting duplicates", () => {
  const buffer = makeDocx();
  const base = makeContract(buffer);
  const exactDuplicate = structuredClone(base.docxSlots[0]);
  const conflictingDuplicate = {
    ...structuredClone(base.renderBindings[0]),
    from: "document.otherCode",
  };
  const contract = {
    ...base,
    docxSlots: [...base.docxSlots, exactDuplicate],
    renderBindings: [...base.renderBindings, conflictingDuplicate],
  };

  const result = evaluateFormArtifact({
    contract,
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "CONTRACT_REPAIR_REQUIRED");
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ["EXACT_DUPLICATE_SLOT", "CONFLICTING_DUPLICATE_BINDING"],
  );
});

test("keeps structurally clean automated locks pending human review", () => {
  const buffer = makeDocx();
  const contract = makeContract(buffer, {
    reviewedBy: "system-batch-lock",
    reviewKind: "automated",
  });

  const result = evaluateFormArtifact({
    contract,
    normalizedDocxBuffer: buffer,
  });

  assert.equal(result.state, "AUTOMATED_REVIEW_PENDING");
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ["HUMAN_REVIEW_NOT_APPROVED"],
  );
});
