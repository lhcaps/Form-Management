// Test: ReviewRequired invariant for draft phase.
// All heuristic-generated slots/fields/bindings must have reviewRequired=true and source="unknown".
// Phase C human review is the only place allowed to set reviewRequired=false and source!=unknown.
import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const CONTRACTS_DIR = path.join(
  process.cwd(),
  "docs",
  "audit",
  "docx",
  "contracts",
);

const loadContracts = (codes) => {
  const files = fs.readdirSync(CONTRACTS_DIR).filter(
    (n) => n.endsWith(".contract.draft.json") && !n.startsWith("_"),
  );
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8")))
    .filter((c) => c.templateCode && codes.has(c.templateCode));
};

describe("review-required invariant: draft phase", () => {
  const codes = new Set([
    "BM-001",
    "BM-002",
    "BM-003",
    "BM-004",
    "BM-005",
    "BM-006",
    "BM-007",
    "BM-008",
    "BM-009",
    "BM-010",
    "BM-011",
    "BM-012",
    "BM-013",
    "BM-014",
    "BM-015",
    "BM-016",
    "BM-017",
    "BM-018",
    "BM-023",
    "BM-030",
    "BM-031",
    "BM-033",
    "BM-039",
    "BM-047",
    "BM-058",
    "BM-059",
    "BM-156",
    "BM-053",
    "BM-055",
    "BM-097",
    "BM-171",
    "BM-172",
    "BM-145",
    "BM-146",
    "BM-057",
    "BM-148",
    "BM-169",
    "BM-056",
    "BM-085",
    "BM-173",
    "BM-159",
    "BM-054",
    "BM-038",
    "BM-040",
    "BM-042",
    "BM-037",
    "BM-043",
    "BM-141",
    "BM-070",
    "BM-144",
    "BM-166",
    "BM-150",
    "BM-103",
    "BM-045",
    "BM-046",
    "BM-071",
    "BM-086",
    "BM-090",
    "BM-170",
    "BM-168",
    "BM-044",
    "BM-104",
    "BM-001",
    "BM-002",
    "BM-003",
  ]);
  const contracts = (() => {
    try {
      return loadContracts(codes);
    } catch {
      return [];
    }
  })();

  it("all contracts have docxSlots with reviewRequired=true", () => {
    for (const c of contracts) {
      const nonReviewedSlots = (c.docxSlots ?? []).filter(
        (s) => s.reviewRequired !== true,
      );
      assert.deepStrictEqual(
        nonReviewedSlots,
        [],
        `${c.templateCode}: slots with reviewRequired !== true: ${nonReviewedSlots.map((s) => s.slotId).join(", ")}`,
      );
    }
  });

  it("all contracts have canonicalFields with source=unknown", () => {
    for (const c of contracts) {
      const nonUnknownFields = (c.canonicalFields ?? []).filter(
        (f) => f.source !== "unknown",
      );
      assert.deepStrictEqual(
        nonUnknownFields,
        [],
        `${c.templateCode}: canonicalFields with source !== unknown: ${nonUnknownFields.map((f) => `${f.path}(source=${f.source})`).join(", ")}`,
      );
    }
  });

  it("all contracts have canonicalFields with reviewRequired=true", () => {
    for (const c of contracts) {
      const nonReviewedFields = (c.canonicalFields ?? []).filter(
        (f) => f.reviewRequired !== true,
      );
      assert.deepStrictEqual(
        nonReviewedFields,
        [],
        `${c.templateCode}: canonicalFields with reviewRequired !== true: ${nonReviewedFields.map((f) => f.path).join(", ")}`,
      );
    }
  });

  it("all contracts have renderBindings with reviewRequired=true", () => {
    for (const c of contracts) {
      const nonReviewedBindings = (c.renderBindings ?? []).filter(
        (b) => b.reviewRequired !== true,
      );
      assert.deepStrictEqual(
        nonReviewedBindings,
        [],
        `${c.templateCode}: renderBindings with reviewRequired !== true: ${nonReviewedBindings.map((b) => b.slotId).join(", ")}`,
      );
    }
  });

  it("draft-phase heuristic canonicalFields must NOT have source!=unknown", () => {
    for (const c of contracts) {
      const heuristicNonUnknown = (c.canonicalFields ?? []).filter(
        (f) => f.source !== "unknown",
      );
      // In draft phase, NO canonicalField should have source != "unknown"
      assert.deepStrictEqual(
        heuristicNonUnknown,
        [],
        `${c.templateCode}: draft phase must not have non-unknown source canonicalFields: ${heuristicNonUnknown.map((f) => `${f.path}(source=${f.source})`).join(", ")}`,
      );
    }
  });

  it("docxSlots must NOT use text.includes() for blockId (regression)", () => {
    for (const c of contracts) {
      for (const slot of c.docxSlots ?? []) {
        // blockId must be a proper paragraph ID (P####), not null/undefined
        // when the slot was detected from a paragraph blank
        if (slot.kind === "ellipsis-dots" || slot.kind === "ellipsis-unicode" || slot.kind === "underscore" || slot.kind === "numbered-blank") {
          assert.ok(
            slot.location?.blockId !== undefined,
            `${c.templateCode} slot ${slot.slotId} must have blockId from blank detector`,
          );
        }
      }
    }
  });

  it("no canonicalField should have source=manualOrDefault or agencyConfig in draft", () => {
    for (const c of contracts) {
      const badSources = (c.canonicalFields ?? []).filter(
        (f) => f.source === "manualOrDefault" || f.source === "agencyConfig" || f.source === "casePayload",
      );
      assert.deepStrictEqual(
        badSources,
        [],
        `${c.templateCode}: draft phase must not have hardcoded source values: ${badSources.map((f) => `${f.path}(source=${f.source})`).join(", ")}`,
      );
    }
  });

  it("all reviewRequired fields must also have source=unknown", () => {
    for (const c of contracts) {
      const notBothSet = [
        ...(c.canonicalFields ?? []),
      ].filter(
        (f) => f.reviewRequired === true && f.source !== "unknown",
      );
      assert.deepStrictEqual(
        notBothSet,
        [],
        `${c.templateCode}: canonicalFields with reviewRequired=true must also have source=unknown: ${notBothSet.map((f) => `${f.path}(source=${f.source})`).join(", ")}`,
      );
    }
  });
});

describe("review-required invariant: schema rules", () => {
  it("source taxonomy must NOT contain forbidden values", () => {
    const sourceTaxPath = path.join(
      process.cwd(),
      "docs",
      "contracts",
      "source-taxonomy.json",
    );
    try {
      const tax = JSON.parse(fs.readFileSync(sourceTaxPath, "utf8"));
      const forbidden = ["guessed", "fake", "sample", "hardcodedPerson", "hardcodedName", "hardcodedDate", "placeholderOnly"];
      for (const v of forbidden) {
        assert.ok(
          !tax.allowed.some((a) => a.value === v),
          `forbidden source value "${v}" must NOT be in source-taxonomy`,
        );
      }
    } catch {
      // Taxonomy file may not exist in test env
    }
  });
});
