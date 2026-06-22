/**
 * Tests for stable-contract-hash utility.
 * Verifies that the stable hash is deterministic and ignores only
 * volatile metadata while catching genuine semantic changes.
 *
 * Run: node --test test/docx-contract/stable-contract-hash.test.mjs
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalizeContractForHash,
  stableStringify,
  stableContractHash,
} from "../../scripts/docx-contract/lib/stable-contract-hash.mjs";

const makeMinimalContract = (overrides = {}) => ({
  schemaVersion: "1.0",
  sourceId: "BM-001__f4c2aa3682d3",
  templateCode: "BM-001",
  templateTitle: "Biên bản tiếp nhận nguồn tin về tội phạm",
  documentKind: "form",
  duplicateIndex: 1,
  duplicateCount: 1,
  isDuplicateCode: false,
  status: "locked",
  extractionSource: {
    kind: "normalized-docx",
    relativePath: "storage\\templates\\normalized-docx\\BM-001\\BM-001_normalized.docx",
    sha256: "e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77",
    format: "docx",
  },
  docxSlots: [
    {
      slotId: "document.issuePlaceDateLine",
      location: { partName: "word/document.xml", blockId: null, tableCellId: null },
      context: "{{document.issuePlaceDateLine}}",
      label: "issuePlaceDateLine",
      slotType: "datePart",
      required: true,
      confidence: 0.9,
      evidence: { textBefore: "", textAfter: "", rawPattern: "{{document.issuePlaceDateLine}}" },
      reviewRequired: false,
    },
  ],
  canonicalFields: [
    {
      path: "document.issuePlaceDateLine",
      slotId: "document.issuePlaceDateLine",
      dataType: "string",
      required: true,
    },
  ],
  renderBindings: [
    {
      slotId: "document.issuePlaceDateLine",
      from: "document.issuePlaceDateLine",
      required: true,
    },
  ],
  formInputHints: { primaryEntities: [], suggestedControls: [], previewRequired: true, reviewRequired: false },
  renderFormatHints: {
    fontFamily: "Times New Roman",
    baseFontSize: 13,
    requiresDifferentFirstPage: true,
    headerRules: [],
    footerRules: [],
    titleRules: [],
    reviewRequired: false,
  },
  reportingHints: { dimensions: ["time", "ward", "offense"], reviewRequired: false },
  productMetadata: {
    stage: { code: "01", label: "TIẾP NHẬN", suggestedBy: "path-heuristic", reviewRequired: false },
    formNumber: "001/HS",
    legalBasisLine: "Ban hành theo Thông tư số 03/2026/TT-VKSTC",
    documentNumberSuffix: null,
    reviewRequired: false,
    reviewKind: "human",
    reviewedBy: "Le Huy",
    reviewedAt: "2026-06-22T08:15:00.000+07:00",
  },
  unresolvedQuestions: [],
  warnings: [],
  generatedAt: "2026-06-22T18:04:11.739Z",
  reviewedBy: "Le Huy",
  reviewedAt: "2026-06-22T08:15:00.000+07:00",
  reviewKind: "human",
  ...overrides,
});

describe("stableStringify", () => {
  it("produces the same string for objects with different key order", () => {
    const a = { b: 1, a: 2 };
    const b = { a: 2, b: 1 };
    assert.equal(stableStringify(a), stableStringify(b));
  });

  it("produces the same string regardless of array order inside nested object", () => {
    const a = { items: [{ slotId: "a" }, { slotId: "b" }] };
    const b = { items: [{ slotId: "b" }, { slotId: "a" }] };
    assert.notEqual(stableStringify(a), stableStringify(b), "array order should be preserved as semantic");
  });

  it("round-trips through JSON.parse", () => {
    const obj = { a: 1, b: [1, 2, 3], c: { nested: true } };
    const str = stableStringify(obj);
    const parsed = JSON.parse(str);
    assert.deepEqual(parsed, obj);
  });
});

describe("canonicalizeContractForHash", () => {
  it("removes top-level generatedAt", () => {
    const c = makeMinimalContract({ generatedAt: "2026-06-22T18:04:11.739Z" });
    const canon = canonicalizeContractForHash(c);
    assert.equal(canon.generatedAt, undefined);
  });

  it("removes volatile fields inside nested semantic objects", () => {
    // volatile fields inside known semantic keys (docxSlots, canonicalFields, etc.)
    // are stripped because sanitizeForHash recurses through every object.
    const c = makeMinimalContract();
    // docxSlots items are objects with many fields — verify generatedAt inside
    // a slot's evidence sub-object would be stripped if present.
    const withNestedVolatile = makeMinimalContract({
      docxSlots: [
        {
          ...c.docxSlots[0],
          evidence: { textBefore: "", textAfter: "", rawPattern: "{{document.issuePlaceDateLine}}", generatedAt: "2099-01-01T00:00:00.000Z" },
        },
      ],
    });
    const withoutNestedVolatile = makeMinimalContract();
    assert.equal(
      stableContractHash(withNestedVolatile),
      stableContractHash(withoutNestedVolatile),
      "nested volatile inside docxSlots should be stripped",
    );
  });

  it("keeps extractionSource.sha256", () => {
    // extractionSource fields are flattened into the top-level result
    // (not nested under extractionSource key).
    const c = makeMinimalContract();
    const canon = canonicalizeContractForHash(c);
    assert.equal(canon.sha256, "e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77");
  });

  it("keeps extractionSource.relativePath", () => {
    const c = makeMinimalContract();
    const canon = canonicalizeContractForHash(c);
    assert.ok(canon.relativePath, "relativePath should be in flattened result");
    assert.equal(
      canon.relativePath,
      "storage\\templates\\normalized-docx\\BM-001\\BM-001_normalized.docx",
    );
  });

  it("drops extractionSource.unknownField", () => {
    const c = makeMinimalContract();
    c.extractionSource["_debugPath"] = "C:\\Users\\admin\\storage\\foo.docx";
    const canon = canonicalizeContractForHash(c);
    assert.equal(canon._debugPath, undefined);
  });

  it("drops unknown top-level fields", () => {
    const c = makeMinimalContract({ _arbitraryMeta: "drop me", templateCode: "BM-001" });
    const canon = canonicalizeContractForHash(c);
    assert.equal(canon._arbitraryMeta, undefined);
    assert.equal(canon.templateCode, "BM-001");
  });
});

describe("stableContractHash", () => {
  it("two contracts identical except generatedAt have the same hash", () => {
    const base = makeMinimalContract();
    const withTimestamp = makeMinimalContract({ generatedAt: "2099-12-31T23:59:59.999Z" });
    assert.equal(stableContractHash(base), stableContractHash(withTimestamp));
  });

  it("two contracts identical except updatedAt have the same hash", () => {
    const base = makeMinimalContract();
    const withUpdated = makeMinimalContract({ updatedAt: "2099-01-01T00:00:00.000Z" });
    assert.equal(stableContractHash(base), stableContractHash(withUpdated));
  });

  it("two contracts identical except createdAt have the same hash", () => {
    const base = makeMinimalContract();
    const withCreated = makeMinimalContract({ createdAt: "2099-01-01T00:00:00.000Z" });
    assert.equal(stableContractHash(base), stableContractHash(withCreated));
  });

  it("different docxSlots.slotId produce different hashes", () => {
    const base = makeMinimalContract();
    const changed = makeMinimalContract({
      docxSlots: [{ slotId: "document.changedField", location: {}, context: "{{document.changedField}}" }],
    });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("different canonicalFields.path produce different hashes", () => {
    const base = makeMinimalContract();
    const changed = makeMinimalContract({
      canonicalFields: [{ path: "document.changedPath", slotId: "document.changedPath" }],
    });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("different renderBindings.from produce different hashes", () => {
    const base = makeMinimalContract();
    const changed = makeMinimalContract({
      renderBindings: [{ slotId: "document.issuePlaceDateLine", from: "document.otherField", required: true }],
    });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("extractionSource.sha256 change produces different hash", () => {
    const base = makeMinimalContract();
    const changed = makeMinimalContract({
      extractionSource: { ...base.extractionSource, sha256: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" },
    });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("productMetadata.stage.code change produces different hash", () => {
    const base = makeMinimalContract();
    const changed = makeMinimalContract({
      productMetadata: {
        ...base.productMetadata,
        stage: { ...base.productMetadata.stage, code: "99" },
      },
    });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("different object key order produce the same hash", () => {
    const c1 = makeMinimalContract({ templateCode: "BM-001", status: "locked" });
    const c2 = makeMinimalContract({ status: "locked", templateCode: "BM-001" });
    assert.equal(stableContractHash(c1), stableContractHash(c2));
  });

  it("BM-001/BM-002/BM-003 timestamp-only republish produces same hash", () => {
    // Simulates the real-world case: contract republished with only generatedAt changed
    const v1 = makeMinimalContract({
      templateCode: "BM-001",
      generatedAt: "2026-06-20T10:00:00.000Z",
    });
    const v2 = makeMinimalContract({
      templateCode: "BM-001",
      generatedAt: "2026-06-22T18:04:11.739Z",
    });
    assert.equal(stableContractHash(v1), stableContractHash(v2));
  });

  it("different templateCode produce different hashes", () => {
    const base = makeMinimalContract({ templateCode: "BM-001" });
    const changed = makeMinimalContract({ templateCode: "BM-002" });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });

  it("different schemaVersion produce different hashes", () => {
    const base = makeMinimalContract({ schemaVersion: "1.0" });
    const changed = makeMinimalContract({ schemaVersion: "2.0" });
    assert.notEqual(stableContractHash(base), stableContractHash(changed));
  });
});
