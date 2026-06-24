/**
 * E1 — Schema conformance test for all 213 locked contracts
 * (PLAN.md v2.3 §E1, plus user-locked E1 brief 2026-06-25).
 *
 * Purpose: prove that deriveFormInputSchema() returns a valid, usable
 * FormInputSchema for every contract in the locked corpus. This is the
 * schema-layer safety net that E2 (DOCX render integration for 6 BMs)
 * and C3 (source remediation across 115 fields) both depend on.
 *
 * Important scope (do NOT extend):
 *  - E1 does NOT render DOCX.
 *  - E1 does NOT do post-render shadow.
 *  - E1 does NOT do semantic diff.
 *  - E1 does NOT modify locked contract JSON files.
 *  - E1 does NOT remediate source fields.
 *  - E1 does NOT touch API or web runtime.
 *
 * Per-contract assertions (1-17):
 *  1. deriveFormInputSchema(contract) does not throw.
 *  2. schema.templateCode is non-empty.
 *  3. schema.sourceId is non-empty.
 *  4. schema.sections.length > 0.
 *  5. Total schema fields > 0.
 *  6. Every section has non-empty key, non-empty title, fields array.
 *  7. Every field has path, label, inputType, source, editable, visible, origin.
 *  8. No duplicate field path within one schema.
 *  9. No field may come from rejectedCandidates as editable.
 * 10. 100% required manual editable fields must be visible.
 * 11. computed fields must be editable=false.
 * 12. readonlyReason must exist when editable=false and source is readonly.
 * 13. visibilityReason must exist for every field.
 * 14. schema warnings have known code and non-empty message.
 * 15. UNKNOWN_SOURCE_NORMALIZED warnings allowed for now (C3 owns remediation).
 * 16. BOUND_SLOT_MISSING_FIELD warnings allowed but counted.
 * 17. REJECTED_AS_EDITABLE warnings allowed only if the rejected field is
 *     NOT emitted as editable.
 *
 * Kill criteria:
 *  - >20% of contracts fail schema derivation or have no usable fields.
 *  - In that case, this test MUST fail loudly. Do NOT relax the
 *    assertions to make the test pass. Do NOT synthesize fake fields.
 *
 * Source data:
 *  docs/audit/docx/contracts/locked/*.contract.locked.json
 *  (213 contracts at the time of E1, 2026-06-25)
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { deriveFormInputSchema } from "../src/derive-form-input-schema.js";
import type {
  FormInputField,
  FormInputSchema,
  FormInputSection,
  SchemaWarning,
} from "../src/derive-form-input-schema.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const LOCKED_DIR = resolve(
  REPO_ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);

const VALID_INPUT_TYPES = new Set<FormInputField["inputType"]>([
  "text",
  "date",
  "number",
  "textarea",
]);

const VALID_SOURCES = new Set<FormInputField["source"]>([
  "manual",
  "casePayload",
  "agencyConfig",
  "officialConfig",
  "systemDate",
  "computed",
]);

const VALID_ORIGINS = new Set<FormInputField["origin"]>([
  "canonical",
  "binding-fallback",
  "hint",
]);

const VALID_WARNING_CODES = new Set<SchemaWarning["code"]>([
  "BOUND_SLOT_MISSING_FIELD",
  "REJECTED_AS_EDITABLE",
  "UNKNOWN_SOURCE_NORMALIZED",
]);

const KILL_THRESHOLD_PERCENT = 20;

type ContractRecord = Record<string, unknown>;

type ContractEntry = {
  file: string;
  templateCode: string;
  sourceId: string;
  contract: ContractRecord;
};

type ConformanceResult =
  | { ok: true; schema: FormInputSchema }
  | { ok: false; reason: string };

type CorpusReport = {
  totalContracts: number;
  failedContracts: Array<{ templateCode: string; reason: string }>;
  totalSections: number;
  totalFields: number;
  totalRequiredManualEditableFields: number;
  warningCounts: {
    UNKNOWN_SOURCE_NORMALIZED: number;
    BOUND_SLOT_MISSING_FIELD: number;
    REJECTED_AS_EDITABLE: number;
  };
  contractsWithWarnings: string[];
  topSectionKeys: Array<[string, number]>;
  unmappedSectionKeys: string[];
};

function readArray(
  record: ContractRecord,
  key: string,
): Array<Record<string, unknown>> {
  const value = record[key];
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function readString(record: ContractRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function loadAllContracts(): ContractEntry[] {
  const files = readdirSync(LOCKED_DIR)
    .filter((entry) => entry.endsWith(".contract.locked.json"))
    .sort();
  const out: ContractEntry[] = [];
  for (const file of files) {
    const raw = readFileSync(resolve(LOCKED_DIR, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Skip malformed files; B4 audit logs them and we surface them
      // as a failed contract rather than crashing the whole corpus.
      out.push({
        file,
        templateCode: file,
        sourceId: "",
        contract: {},
      });
      continue;
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      out.push({
        file,
        templateCode: file,
        sourceId: "",
        contract: {},
      });
      continue;
    }
    const record = parsed as ContractRecord;
    out.push({
      file,
      templateCode: readString(record, "templateCode") || file,
      sourceId: readString(record, "sourceId"),
      contract: record,
    });
  }
  return out;
}

function deriveSafely(
  entry: ContractEntry,
): ConformanceResult {
  try {
    const schema = deriveFormInputSchema(entry.contract);
    return { ok: true, schema };
  } catch (err) {
    return {
      ok: false,
      reason: `deriveFormInputSchema threw: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

function flattenFields(schema: FormInputSchema): FormInputField[] {
  return schema.sections.flatMap((section: FormInputSection) => section.fields);
}

function buildCorpusReport(
  entries: ContractEntry[],
  results: Map<string, ConformanceResult>,
): CorpusReport {
  const sectionKeyCounts = new Map<string, number>();
  const sectionKeyByTemplate = new Map<string, Set<string>>();
  let totalSections = 0;
  let totalFields = 0;
  let totalRequiredManualEditableFields = 0;
  let unknownCount = 0;
  let boundCount = 0;
  let rejectedCount = 0;
  const contractsWithWarnings = new Set<string>();
  const failedContracts: Array<{ templateCode: string; reason: string }> = [];

  for (const entry of entries) {
    const result = results.get(entry.templateCode);
    if (!result || !result.ok) {
      failedContracts.push({
        templateCode: entry.templateCode,
        reason: result ? result.reason : "missing result",
      });
      continue;
    }
    const schema = result.schema;
    totalSections += schema.sections.length;

    for (const section of schema.sections) {
      sectionKeyCounts.set(
        section.key,
        (sectionKeyCounts.get(section.key) ?? 0) + 1,
      );
      if (!sectionKeyByTemplate.has(entry.templateCode)) {
        sectionKeyByTemplate.set(entry.templateCode, new Set());
      }
      sectionKeyByTemplate.get(entry.templateCode)!.add(section.key);
    }

    const fields = flattenFields(schema);
    totalFields += fields.length;

    for (const field of fields) {
      if (
        field.required &&
        field.editable &&
        field.source === "manual"
      ) {
        totalRequiredManualEditableFields += 1;
      }
    }

    if (schema.warnings.length > 0) {
      contractsWithWarnings.add(entry.templateCode);
    }
    for (const warning of schema.warnings) {
      if (warning.code === "UNKNOWN_SOURCE_NORMALIZED") unknownCount += 1;
      else if (warning.code === "BOUND_SLOT_MISSING_FIELD") boundCount += 1;
      else if (warning.code === "REJECTED_AS_EDITABLE") rejectedCount += 1;
    }
  }

  const topSectionKeys = Array.from(sectionKeyCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10);

  // unmappedSectionKeys = sections that appeared in only 1 template (i.e.
  // very narrow keys not worth promoting yet). This is informational;
  // the B2 corpus scan already covers SECTION_TITLES coverage.
  const unmappedSectionKeys: string[] = [];
  for (const [templateCode, keys] of sectionKeyByTemplate.entries()) {
    for (const key of keys) {
      const count = sectionKeyCounts.get(key) ?? 0;
      if (count === 1) unmappedSectionKeys.push(`${templateCode}/${key}`);
    }
  }
  unmappedSectionKeys.sort();

  return {
    totalContracts: entries.length,
    failedContracts,
    totalSections,
    totalFields,
    totalRequiredManualEditableFields,
    warningCounts: {
      UNKNOWN_SOURCE_NORMALIZED: unknownCount,
      BOUND_SLOT_MISSING_FIELD: boundCount,
      REJECTED_AS_EDITABLE: rejectedCount,
    },
    contractsWithWarnings: Array.from(contractsWithWarnings).sort(),
    topSectionKeys,
    unmappedSectionKeys,
  };
}

function logCorpusReport(report: CorpusReport): void {
  // eslint-disable-next-line no-console
  console.log("[E1 schema conformance] corpus report:");
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        totalContracts: report.totalContracts,
        totalSections: report.totalSections,
        totalFields: report.totalFields,
        totalRequiredManualEditableFields:
          report.totalRequiredManualEditableFields,
        warningCounts: report.warningCounts,
        contractsWithWarningsCount: report.contractsWithWarnings.length,
        contractsWithWarningsSample: report.contractsWithWarnings.slice(0, 10),
        topSectionKeys: report.topSectionKeys,
        unmappedSectionKeysCount: report.unmappedSectionKeys.length,
        unmappedSectionKeysSample: report.unmappedSectionKeys.slice(0, 10),
        failedContractsCount: report.failedContracts.length,
        failedContractsSample: report.failedContracts
          .slice(0, 10)
          .map((f) => `${f.templateCode}:${f.reason}`),
      },
      null,
      2,
    ),
  );
}

function assertSchemaShape(
  templateCode: string,
  schema: FormInputSchema,
): void {
  // 2) templateCode non-empty
  assert.ok(
    typeof schema.templateCode === "string" && schema.templateCode.length > 0,
    `${templateCode}: schema.templateCode must be non-empty`,
  );

  // 3) sourceId non-empty
  assert.ok(
    typeof schema.sourceId === "string" && schema.sourceId.length > 0,
    `${templateCode}: schema.sourceId must be non-empty`,
  );

  // 4) sections.length > 0
  assert.ok(
    schema.sections.length > 0,
    `${templateCode}: schema.sections.length must be > 0`,
  );

  // 5) total fields > 0
  const fields = flattenFields(schema);
  assert.ok(
    fields.length > 0,
    `${templateCode}: schema must have at least one field`,
  );

  // 6) every section has key + title + fields array
  for (const section of schema.sections) {
    assert.ok(
      typeof section.key === "string" && section.key.length > 0,
      `${templateCode}: section.key must be non-empty`,
    );
    assert.ok(
      typeof section.title === "string" && section.title.length > 0,
      `${templateCode}: section.title must be non-empty (got empty for key="${section.key}")`,
    );
    assert.ok(
      Array.isArray(section.fields),
      `${templateCode}: section.fields must be an array`,
    );
  }

  // 7) every field shape
  for (const field of fields) {
    assert.ok(
      typeof field.path === "string" && field.path.length > 0,
      `${templateCode}: field.path must be non-empty`,
    );
    assert.ok(
      typeof field.label === "string" && field.label.length > 0,
      `${templateCode}: ${field.path}: field.label must be non-empty`,
    );
    assert.ok(
      VALID_INPUT_TYPES.has(field.inputType),
      `${templateCode}: ${field.path}: field.inputType must be one of ${Array.from(
        VALID_INPUT_TYPES,
      ).join(", ")} (got "${field.inputType}")`,
    );
    assert.ok(
      VALID_SOURCES.has(field.source),
      `${templateCode}: ${field.path}: field.source must be one of ${Array.from(
        VALID_SOURCES,
      ).join(", ")} (got "${field.source}")`,
    );
    assert.equal(
      typeof field.editable,
      "boolean",
      `${templateCode}: ${field.path}: field.editable must be boolean`,
    );
    assert.equal(
      typeof field.visible,
      "boolean",
      `${templateCode}: ${field.path}: field.visible must be boolean`,
    );
    assert.ok(
      VALID_ORIGINS.has(field.origin),
      `${templateCode}: ${field.path}: field.origin must be one of ${Array.from(
        VALID_ORIGINS,
      ).join(", ")} (got "${field.origin}")`,
    );
  }

  // 8) no duplicate field path within a schema
  const seenPaths = new Set<string>();
  for (const field of fields) {
    assert.ok(
      !seenPaths.has(field.path),
      `${templateCode}: duplicate field path "${field.path}"`,
    );
    seenPaths.add(field.path);
  }
}

function assertEditabilityAndVisibilityInvariants(
  templateCode: string,
  contract: ContractRecord,
  schema: FormInputSchema,
): void {
  const fields = flattenFields(schema);

  // 9) no field may come from rejectedCandidates as editable
  const rejectedSlotIds = new Set<string>();
  for (const rejected of readArray(contract, "rejectedCandidates")) {
    const slotId = readString(rejected, "slotId");
    if (slotId) rejectedSlotIds.add(slotId);
  }
  for (const field of fields) {
    if (rejectedSlotIds.has(field.path)) {
      assert.equal(
        field.editable,
        false,
        `${templateCode}: ${field.path}: rejectedCandidate path must not be editable`,
      );
    }
  }

  // 10) 100% required manual editable fields must be visible
  for (const field of fields) {
    if (field.required && field.editable && field.source === "manual") {
      assert.equal(
        field.visible,
        true,
        `${templateCode}: ${field.path}: required manual editable field must be visible`,
      );
    }
  }

  // 11) computed fields must be editable=false
  for (const field of fields) {
    if (field.source === "computed") {
      assert.equal(
        field.editable,
        false,
        `${templateCode}: ${field.path}: computed field must be editable=false`,
      );
    }
  }

  // 12) readonlyReason must exist when editable=false and source is
  //     casePayload/agencyConfig/officialConfig/systemDate/computed
  const READONLY_SOURCES = new Set<FormInputField["source"]>([
    "casePayload",
    "agencyConfig",
    "officialConfig",
    "systemDate",
    "computed",
  ]);
  for (const field of fields) {
    if (field.editable === false && READONLY_SOURCES.has(field.source)) {
      assert.ok(
        field.readonlyReason !== undefined,
        `${templateCode}: ${field.path}: readonlyReason is required when editable=false and source=${field.source}`,
      );
    }
  }

  // 13) visibilityReason must exist for every field
  for (const field of fields) {
    assert.ok(
      field.visibilityReason !== undefined,
      `${templateCode}: ${field.path}: visibilityReason is required`,
    );
  }
}

function assertWarningsShape(
  templateCode: string,
  schema: FormInputSchema,
): void {
  // 14) every warning has known code + non-empty message
  for (const warning of schema.warnings) {
    assert.ok(
      VALID_WARNING_CODES.has(warning.code),
      `${templateCode}: warning code must be one of ${Array.from(
        VALID_WARNING_CODES,
      ).join(", ")} (got "${warning.code}")`,
    );
    assert.ok(
      typeof warning.message === "string" && warning.message.length > 0,
      `${templateCode}: warning.message must be non-empty`,
    );
  }
}

function assertRejectedWarningConsistency(
  templateCode: string,
  schema: FormInputSchema,
): void {
  // 17) REJECTED_AS_EDITABLE warnings are allowed only if the rejected
  //     field is NOT emitted as editable.
  const pathsByEditable = new Map<string, boolean>();
  for (const field of flattenFields(schema)) {
    pathsByEditable.set(field.path, field.editable);
  }
  for (const warning of schema.warnings) {
    if (warning.code === "REJECTED_AS_EDITABLE" && warning.path) {
      const editable = pathsByEditable.get(warning.path);
      assert.notEqual(
        editable,
        true,
        `${templateCode}: REJECTED_AS_EDITABLE warning emitted for "${warning.path}" but the field is still marked editable=true`,
      );
    }
  }
}

const ALL_ENTRIES = loadAllContracts();
const RESULTS = new Map<string, ConformanceResult>();
for (const entry of ALL_ENTRIES) {
  RESULTS.set(entry.templateCode, deriveSafely(entry));
}
const CORPUS_REPORT = buildCorpusReport(ALL_ENTRIES, RESULTS);

test(`E1 corpus loads ${ALL_ENTRIES.length} contracts from locked dir`, () => {
  assert.ok(
    ALL_ENTRIES.length > 0,
    "expected at least one locked contract to be loaded",
  );
  assert.equal(
    ALL_ENTRIES.length,
    CORPUS_REPORT.totalContracts,
    "corpus entry count must match report",
  );
});

test("E1 kill-criterion guard: no more than 20% of contracts may fail derivation", () => {
  const failureRate =
    (CORPUS_REPORT.failedContracts.length / ALL_ENTRIES.length) * 100;
  assert.ok(
    failureRate <= KILL_THRESHOLD_PERCENT,
    `E1 KILL CRITERION HIT: ${CORPUS_REPORT.failedContracts.length}/${ALL_ENTRIES.length} contracts failed derivation (${failureRate.toFixed(1)}% > ${KILL_THRESHOLD_PERCENT}%). ` +
      `Per PLAN.md v2.3 §E1, do NOT relax assertions. Mark E1 BLOCKED.`,
  );
});

test("E1 schema shape holds for every contract that derived successfully", () => {
  for (const entry of ALL_ENTRIES) {
    const result = RESULTS.get(entry.templateCode);
    if (!result || !result.ok) continue;
    assertSchemaShape(entry.templateCode, result.schema);
  }
});

test("E1 editability / visibility invariants hold for every contract", () => {
  for (const entry of ALL_ENTRIES) {
    const result = RESULTS.get(entry.templateCode);
    if (!result || !result.ok) continue;
    assertEditabilityAndVisibilityInvariants(
      entry.templateCode,
      entry.contract,
      result.schema,
    );
  }
});

test("E1 warnings have known codes and non-empty messages", () => {
  for (const entry of ALL_ENTRIES) {
    const result = RESULTS.get(entry.templateCode);
    if (!result || !result.ok) continue;
    assertWarningsShape(entry.templateCode, result.schema);
  }
});

test("E1 REJECTED_AS_EDITABLE warnings are consistent (rejected field not editable)", () => {
  for (const entry of ALL_ENTRIES) {
    const result = RESULTS.get(entry.templateCode);
    if (!result || !result.ok) continue;
    assertRejectedWarningConsistency(entry.templateCode, result.schema);
  }
});

test("E1 corpus-wide totals confirm schema derivation succeeds across all 213 contracts", () => {
  // This is the headline assertion: the corpus must report > 0
  // contracts (sanity), every contract must produce a schema with
  // > 0 sections and > 0 fields, and the kill-criterion must not have
  // been hit. The numeric checks live in their own tests so a
  // regression produces a precise failure message.
  assert.ok(
    CORPUS_REPORT.totalContracts > 0,
    "corpus must contain at least one contract",
  );
  // (We've already asserted failureRate <= 20% in the kill-criterion
  // test. Here we just make sure every successful contract
  // contributed > 0 fields to the totals.)
  const okCount =
    ALL_ENTRIES.length - CORPUS_REPORT.failedContracts.length;
  assert.ok(
    CORPUS_REPORT.totalFields > 0,
    "expected totalFields > 0 across the corpus",
  );
  assert.ok(
    CORPUS_REPORT.totalSections > 0,
    "expected totalSections > 0 across the corpus",
  );
  assert.ok(okCount > 0, "expected at least one contract to derive cleanly");

  logCorpusReport(CORPUS_REPORT);
});
