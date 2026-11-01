import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import {
  actualGenericRendererCodes,
  canonicalCodes,
  collectFilesystemRows,
  gradeFromQualityState,
  generatedRendererManifestCodes,
  legacyRendererManifestExists,
  parseSelectedCodes,
  selectCanonicalContract,
  stageCodeFor,
} from "../scripts/audit-form-authoring-baselines.mjs";

const repoRoot = resolve(import.meta.dirname, "..");

test("authoring corpus exposes exactly BM-001 through BM-213", () => {
  const codes = canonicalCodes();
  assert.equal(codes.length, 213);
  assert.equal(codes[0], "BM-001");
  assert.equal(codes.at(-1), "BM-213");
  assert.equal(new Set(codes).size, 213);
});

test("all 213 authoring baselines have a normalized DOCX and V1 contract", () => {
  const rows = collectFilesystemRows(repoRoot);
  assert.equal(rows.length, 213);
  assert.deepEqual(
    rows.filter((row) => !row.normalizedExists).map((row) => row.code),
    [],
  );
  assert.deepEqual(
    rows.filter((row) => !row.contract).map((row) => row.code),
    [],
  );
});

test("authoring grades require artifact quality instead of trusting locked status", () => {
  assert.equal(gradeFromQualityState("VERIFIED"), "LOCKED_VERIFIED");
  assert.equal(
    gradeFromQualityState("AUTOMATED_REVIEW_PENDING"),
    "EXTRACTED_NEEDS_REVIEW",
  );
  assert.equal(
    gradeFromQualityState("SEMANTIC_REMEDIATION_REQUIRED"),
    "EXTRACTED_NEEDS_REVIEW",
  );
  assert.equal(
    gradeFromQualityState("PACKAGE_REPAIR_REQUIRED"),
    "GENERIC_FALLBACK",
  );
});

test("locked contracts win and BM-139 duplicate selection is deterministic", () => {
  assert.equal(
    selectCanonicalContract([
      { status: "draft", sourceId: "BM-001__a" },
      { status: "locked", sourceId: "BM-001__z" },
    ]).sourceId,
    "BM-001__z",
  );

  const bm139 = collectFilesystemRows(repoRoot).find(
    (row) => row.code === "BM-139",
  );
  assert.equal(bm139?.contract?.sourceId, "BM-139__23306e6022bd");
  assert.deepEqual(bm139?.alternateSourceIds, ["BM-139__9795f14f931c"]);
});

test("stage and selected-code parsing support repeatable one-or-many BM work", () => {
  assert.equal(stageCodeFor("BM-030"), "01");
  assert.equal(stageCodeFor("BM-031"), "02");
  assert.deepEqual(parseSelectedCodes(["--codes", "BM-027,BM-004"]), [
    "BM-004",
    "BM-027",
  ]);
  assert.deepEqual(parseSelectedCodes(["--codes", "BM-027 BM-004"]), [
    "BM-004",
    "BM-027",
  ]);
});

test("generated legacy renderer manifest matches current component sources", () => {
  if (!legacyRendererManifestExists(repoRoot)) {
    assert.equal(generatedRendererManifestCodes(repoRoot).size, 0);
    return;
  }
  assert.deepEqual(
    [...generatedRendererManifestCodes(repoRoot)].sort(),
    [...actualGenericRendererCodes(repoRoot)].sort(),
  );
});
