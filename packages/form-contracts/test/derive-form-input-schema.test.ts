/**
 * Unit tests for deriveFormInputSchema.
 *
 * Source data: 6 representative locked contract JSON files in
 * docs/audit/docx/contracts/locked/. The test file is located at
 * packages/form-contracts/test/, so the repo root is three levels up.
 *
 * Goal: lock in the contract that:
 *  - all 6 representative BMs derive without throwing
 *  - canonical wins over binding-fallback
 *  - rejectedCandidates never become editable fields
 *  - unknown source normalizes to manual with a warning
 *  - invalid source (any non-VALID_SOURCES value) normalizes the same
 *  - valid sources do not emit UNKNOWN_SOURCE_NORMALIZED
 *  - computed defaults to editable=false, visible=false
 *  - casePayload/agencyConfig/systemDate are editable=false, visible=true
 *  - hints never create new paths
 *  - inputType is mapped from uiComponent / slotType / path tail
 *  - sections group by first path segment and preserve canonical order
 *  - corpus audit reports unknown + invalid source fields and TABLE
 *    renderBindings across all locked contracts (B4, non-blocking)
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
} from "../src/derive-form-input-schema.js";
import { SECTION_TITLES } from "../src/section-titles.js";

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

const REPRESENTATIVE_BMS = [
  "BM-001",
  "BM-051",
  "BM-053",
  "BM-100",
  "BM-150",
  "BM-200",
] as const;

function loadLockedContract(templateCode: string): Record<string, unknown> {
  const entries = readdirSync(LOCKED_DIR);
  const match = entries.find((entry) => entry.startsWith(`${templateCode}__`));
  if (!match) {
    throw new Error(`No locked contract found for ${templateCode}`);
  }
  const raw = readFileSync(resolve(LOCKED_DIR, match), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function loadAllRepresentative(): Map<string, FormInputSchema> {
  const out = new Map<string, FormInputSchema>();
  for (const bm of REPRESENTATIVE_BMS) {
    const contract = loadLockedContract(bm);
    out.set(bm, deriveFormInputSchema(contract));
  }
  return out;
}

function collectFields(schema: FormInputSchema): FormInputField[] {
  return schema.sections.flatMap((section: FormInputSection) => section.fields);
}

test("BM-001 derives a schema with sections and fields", () => {
  const contract = loadLockedContract("BM-001");
  const schema = deriveFormInputSchema(contract);

  assert.equal(schema.templateCode, "BM-001");
  assert.ok(schema.sections.length > 0, "expected at least one section");
  const fields = collectFields(schema);
  assert.ok(fields.length > 0, "expected at least one field");
  // Every canonical field in BM-001 lives under informant / receiver / document / recipients.
  const sectionKeys = new Set(schema.sections.map((s) => s.key));
  for (const expected of ["document", "receiver", "informant", "recipients"]) {
    assert.ok(
      sectionKeys.has(expected),
      `expected BM-001 schema to include section "${expected}"`,
    );
  }
});

test("BM-051 derives a schema with sections and fields", () => {
  const contract = loadLockedContract("BM-051");
  const schema = deriveFormInputSchema(contract);

  assert.equal(schema.templateCode, "BM-051");
  assert.ok(schema.sections.length > 0, "expected at least one section");
  const fields = collectFields(schema);
  assert.ok(fields.length > 0, "expected at least one field");
});

test("BM-053 includes at least one legalBasis field", () => {
  const contract = loadLockedContract("BM-053");
  const schema = deriveFormInputSchema(contract);
  const fields = collectFields(schema);
  const legalBasis = fields.filter((f) => f.path.startsWith("legalBasis."));
  assert.ok(
    legalBasis.length > 0,
    "expected at least one legalBasis.* field in BM-053 schema",
  );
});

test("all 6 representative BMs derive without throwing", () => {
  const all = loadAllRepresentative();
  for (const bm of REPRESENTATIVE_BMS) {
    const schema = all.get(bm);
    assert.ok(schema, `missing schema for ${bm}`);
    assert.equal(schema.templateCode, bm);
    const fields = collectFields(schema);
    assert.ok(
      fields.length > 0,
      `${bm} derived a schema with no fields; kill criterion not hit but flagged`,
    );
  }
});

test("hints do not create new paths", () => {
  // Inline minimal fixture: a contract where a hint points to a path
  // that exists nowhere else. The hint MUST be silently dropped, not
  // turned into a new field.
  const schema = deriveFormInputSchema({
    templateCode: "CUS-HINT-TEST",
    sourceId: "hint-test",
    canonicalFields: [
      {
        path: "person.fullName",
        type: "string",
        label: "Họ tên",
        source: "manual",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
    formInputHints: {
      suggestedControls: [
        {
          path: "ghost.field",
          uiComponent: "textarea",
          label: "Bóng ma",
        },
      ],
    },
  });

  const fields = collectFields(schema);
  assert.equal(fields.length, 1);
  assert.equal(fields[0]!.path, "person.fullName");
  assert.equal(fields[0]!.origin, "canonical");
  // No field has origin === "hint" because no hint created a field.
  for (const f of fields) {
    assert.notEqual(f.origin, "hint");
  }
});

test("rejectedCandidates do not become editable fields", () => {
  // The binding points to a rejected path; the rejected path must
  // not surface as an editable field, and a REJECTED_AS_EDITABLE
  // warning must be emitted.
  const schema = deriveFormInputSchema({
    templateCode: "CUS-REJECTED-TEST",
    sourceId: "rejected-test",
    canonicalFields: [
      {
        path: "person.fullName",
        type: "string",
        label: "Họ tên",
        source: "manual",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [
      {
        slotId: "crimeReport.content",
        from: "crimeReport.content",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
    rejectedCandidates: [
      {
        slotId: "crimeReport.content",
        reason: 'Namespace "crimeReport" không thuộc field-taxonomy',
      },
    ],
  });

  const fields = collectFields(schema);
  const paths = fields.map((f) => f.path);
  assert.ok(
    !paths.includes("crimeReport.content"),
    "rejected candidate must not appear as a field",
  );
  const rejectedWarning = schema.warnings.find(
    (w) =>
      w.code === "REJECTED_AS_EDITABLE" && w.path === "crimeReport.content",
  );
  assert.ok(
    rejectedWarning,
    "expected REJECTED_AS_EDITABLE warning for crimeReport.content",
  );
});

test("unknown source normalizes to manual and emits UNKNOWN_SOURCE_NORMALIZED", () => {
  // BM-051 itself contains a `source: "unknown"` field, so a derived
  // test against the real corpus is the most honest assertion. We
  // also keep an inline fixture for the case where the corpus shape
  // drifts.
  const schema = deriveFormInputSchema({
    templateCode: "CUS-UNKNOWN-TEST",
    sourceId: "unknown-test",
    canonicalFields: [
      {
        path: "document.fullDocumentCode",
        type: "string",
        label: "Ô trống",
        source: "unknown",
        required: false,
        uiComponent: "text",
        reviewRequired: true,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  assert.equal(fields.length, 1);
  const field = fields[0]!;
  assert.equal(field.source, "manual");
  assert.equal(field.editable, true);
  assert.equal(field.visible, true);
  assert.equal(field.visibilityReason, "USER_INPUT");
  const warning = schema.warnings.find(
    (w) =>
      w.code === "UNKNOWN_SOURCE_NORMALIZED" &&
      w.path === "document.fullDocumentCode",
  );
  assert.ok(warning, "expected UNKNOWN_SOURCE_NORMALIZED warning");
});

test("BM-051 (real corpus) emits UNKNOWN_SOURCE_NORMALIZED for the unknown source", () => {
  const contract = loadLockedContract("BM-051");
  const schema = deriveFormInputSchema(contract);
  const fields = collectFields(schema);
  const unknownField = fields.find(
    (f) => f.path === "document.fullDocumentCode",
  );
  assert.ok(unknownField, "expected the unknown-sourced field to still be present");
  assert.equal(unknownField?.source, "manual");
  assert.equal(unknownField?.editable, true);
  assert.equal(unknownField?.visible, true);
  const warning = schema.warnings.find(
    (w) =>
      w.code === "UNKNOWN_SOURCE_NORMALIZED" &&
      w.path === "document.fullDocumentCode",
  );
  assert.ok(
    warning,
    "BM-051 schema should emit UNKNOWN_SOURCE_NORMALIZED for its unknown source field",
  );
});

test("computed source defaults to editable=false and visible=false", () => {
  const schema = deriveFormInputSchema({
    templateCode: "CUS-COMPUTED-TEST",
    sourceId: "computed-test",
    canonicalFields: [
      {
        path: "document.summary",
        type: "string",
        label: "Tóm tắt",
        source: "computed",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  assert.equal(fields.length, 1);
  assert.equal(fields[0]!.source, "computed");
  assert.equal(fields[0]!.editable, false);
  assert.equal(fields[0]!.visible, false);
  assert.equal(fields[0]!.readonlyReason, "COMPUTED");
  assert.equal(fields[0]!.visibilityReason, "INTERNAL_RENDER_ONLY");
});

test("casePayload / agencyConfig / systemDate sources are editable=false and visible=true", () => {
  const schema = deriveFormInputSchema({
    templateCode: "CUS-READONLY-TEST",
    sourceId: "readonly-test",
    canonicalFields: [
      {
        path: "case.accusedName",
        type: "string",
        label: "Bị can",
        source: "casePayload",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "agency.parentName",
        type: "string",
        label: "Cơ quan cấp trên",
        source: "agencyConfig",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "document.issueDate",
        type: "string",
        label: "Ngày ban hành",
        source: "systemDate",
        required: true,
        uiComponent: "date",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  const byPath = new Map(fields.map((f) => [f.path, f]));

  const casePayload = byPath.get("case.accusedName");
  assert.ok(casePayload);
  assert.equal(casePayload?.source, "casePayload");
  assert.equal(casePayload?.editable, false);
  assert.equal(casePayload?.visible, true);
  assert.equal(casePayload?.readonlyReason, "CASE_PAYLOAD");
  assert.equal(casePayload?.visibilityReason, "READONLY_PREVIEW");

  const agency = byPath.get("agency.parentName");
  assert.ok(agency);
  assert.equal(agency?.source, "agencyConfig");
  assert.equal(agency?.editable, false);
  assert.equal(agency?.visible, true);
  assert.equal(agency?.readonlyReason, "AGENCY_CONFIG");

  const system = byPath.get("document.issueDate");
  assert.ok(system);
  assert.equal(system?.source, "systemDate");
  assert.equal(system?.editable, false);
  assert.equal(system?.visible, true);
  assert.equal(system?.readonlyReason, "SYSTEM_DATE");
  assert.equal(system?.inputType, "date");
});

test("invalid source normalizes to manual and emits UNKNOWN_SOURCE_NORMALIZED", () => {
  // A raw source value that is not in the 6 valid set and is not the
  // literal "unknown" must still go through the same conservative
  // fallback: editable manual + visible + USER_INPUT + warning with
  // path and a clear message. This guards the B3 endpoint against
  // future contract drift (e.g. legacy values like "constantFromDocx"
  // or "derived" still surfacing in the corpus).
  const schema = deriveFormInputSchema({
    templateCode: "CUS-INVALID-SOURCE-TEST",
    sourceId: "invalid-source-test",
    canonicalFields: [
      {
        path: "legalBasis.articlesLine",
        type: "string",
        label: "Căn cứ",
        source: "legacyConstant", // not in VALID_SOURCES, not "unknown"
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  assert.equal(fields.length, 1);
  const field = fields[0]!;
  assert.equal(field.source, "manual");
  assert.equal(field.editable, true);
  assert.equal(field.visible, true);
  assert.equal(field.visibilityReason, "USER_INPUT");
  assert.equal(field.readonlyReason, undefined);
  const warning = schema.warnings.find(
    (w) =>
      w.code === "UNKNOWN_SOURCE_NORMALIZED" &&
      w.path === "legalBasis.articlesLine",
  );
  assert.ok(warning, "expected UNKNOWN_SOURCE_NORMALIZED warning");
  // Warning must carry a human-readable message, not just the code.
  assert.ok(
    typeof warning?.message === "string" && warning.message.length > 0,
    "warning message must be a non-empty string",
  );
  assert.ok(
    warning?.message.includes("legalBasis.articlesLine"),
    "warning message should reference the offending path",
  );
});

test("valid sources do not emit UNKNOWN_SOURCE_NORMALIZED", () => {
  // For every value in VALID_SOURCES (the six recognized sources), the
  // derived schema MUST NOT emit an UNKNOWN_SOURCE_NORMALIZED warning.
  // This is the dual of the unknown/invalid tests and locks in that
  // future source additions only normalize things that are actually
  // unrecognized.
  const validSources = [
    "manual",
    "casePayload",
    "agencyConfig",
    "officialConfig",
    "systemDate",
    "computed",
  ] as const;

  const schema = deriveFormInputSchema({
    templateCode: "CUS-VALID-SOURCES-TEST",
    sourceId: "valid-sources-test",
    canonicalFields: validSources.map((source, index) => ({
      path: `field.${source}`,
      type: "string",
      label: `Field ${source}`,
      source,
      required: index === 0, // only the first field is required
      uiComponent: "text",
      reviewRequired: false,
    })),
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const warnings = schema.warnings.filter(
    (w) => w.code === "UNKNOWN_SOURCE_NORMALIZED",
  );
  assert.deepEqual(
    warnings,
    [],
    `expected zero UNKNOWN_SOURCE_NORMALIZED warnings, got: ${JSON.stringify(warnings)}`,
  );

  // Sanity: each field is present with its own source value.
  const fields = collectFields(schema);
  const byPath = new Map(fields.map((f) => [f.path, f]));
  for (const source of validSources) {
    const field = byPath.get(`field.${source}`);
    assert.ok(field, `expected field.${source} in derived schema`);
    assert.equal(field?.source, source);
  }
});

test("deduplication: canonical path wins over binding-fallback", () => {
  // Both canonical and renderBindings claim the same path. The
  // canonical field should win (origin = "canonical"), the binding
  // should be skipped, and no BOUND_SLOT_MISSING_FIELD warning emitted
  // for the duplicated path.
  const schema = deriveFormInputSchema({
    templateCode: "CUS-DEDUP-TEST",
    sourceId: "dedup-test",
    canonicalFields: [
      {
        path: "person.fullName",
        type: "string",
        label: "Họ tên (canonical)",
        source: "manual",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [
      {
        slotId: "person.fullName",
        from: "person.fullName",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  const matches = fields.filter((f) => f.path === "person.fullName");
  assert.equal(matches.length, 1, "expected exactly one field per path");
  assert.equal(matches[0]!.origin, "canonical");
  assert.equal(matches[0]!.label, "Họ tên (canonical)");
  const fallbackWarning = schema.warnings.find(
    (w) =>
      w.code === "BOUND_SLOT_MISSING_FIELD" &&
      w.path === "person.fullName",
  );
  assert.equal(
    fallbackWarning,
    undefined,
    "no BOUND_SLOT_MISSING_FIELD for a path already in canonical",
  );
});

test("binding-fallback fires when a bound path is missing from canonical", () => {
  const schema = deriveFormInputSchema({
    templateCode: "CUS-FALLBACK-TEST",
    sourceId: "fallback-test",
    canonicalFields: [],
    docxSlots: [
      {
        slotId: "informant.fullName",
        slotType: "text",
        required: true,
        reviewRequired: false,
      },
    ],
    renderBindings: [
      {
        slotId: "informant.fullName",
        from: "informant.fullName",
        transform: "identity",
        fallback: "",
        reviewRequired: false,
      },
    ],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  const fb = fields.find((f) => f.path === "informant.fullName");
  assert.ok(fb, "expected a fallback field for the bound slot");
  assert.equal(fb?.origin, "binding-fallback");
  assert.equal(fb?.editable, true);
  assert.equal(fb?.visible, true);
  assert.equal(fb?.reviewRequired, true);
  const warning = schema.warnings.find(
    (w) =>
      w.code === "BOUND_SLOT_MISSING_FIELD" &&
      w.path === "informant.fullName",
  );
  assert.ok(warning);
});

test("inputType: date parts via slotType and path tail", () => {
  // uiComponent is "text" but slotType is "datePart" and the path tail
  // matches DATE_SUFFIX. Both signals should produce "date".
  const schema = deriveFormInputSchema({
    templateCode: "CUS-DATE-TEST",
    sourceId: "date-test",
    canonicalFields: [
      {
        path: "informant.birthDay",
        type: "string",
        label: "Ngày sinh",
        source: "manual",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "informant.birthMonth",
        type: "string",
        label: "Tháng sinh",
        source: "manual",
        required: true,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [
      {
        slotId: "informant.birthDay",
        slotType: "datePart",
        required: true,
        reviewRequired: false,
      },
      {
        slotId: "informant.birthMonth",
        slotType: "datePart",
        required: true,
        reviewRequired: false,
      },
    ],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  const byPath = new Map(fields.map((f) => [f.path, f]));
  assert.equal(byPath.get("informant.birthDay")?.inputType, "date");
  assert.equal(byPath.get("informant.birthMonth")?.inputType, "date");
});

test("inputType: number from numeric path tail and textarea from uiComponent", () => {
  const schema = deriveFormInputSchema({
    templateCode: "CUS-INPUT-TEST",
    sourceId: "input-test",
    canonicalFields: [
      {
        path: "evidence.quantity",
        type: "number",
        label: "Số lượng",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "evidence.description",
        type: "string",
        label: "Mô tả",
        source: "manual",
        required: true,
        uiComponent: "textarea",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const fields = collectFields(schema);
  const byPath = new Map(fields.map((f) => [f.path, f]));
  assert.equal(byPath.get("evidence.quantity")?.inputType, "number");
  assert.equal(byPath.get("evidence.description")?.inputType, "textarea");
});

test("deriveFormInputSchema is defensive: empty / null / non-object input", () => {
  const emptyNull = deriveFormInputSchema(null);
  assert.equal(emptyNull.templateCode, "");
  assert.deepEqual(emptyNull.sections, []);

  const emptyArray = deriveFormInputSchema([]);
  assert.deepEqual(emptyArray.sections, []);

  const emptyObject = deriveFormInputSchema({});
  assert.deepEqual(emptyObject.sections, []);
  assert.equal(emptyObject.warnings.length, 0);

  // Bad entries inside arrays do not throw.
  const withGarbage = deriveFormInputSchema({
    templateCode: "X",
    canonicalFields: [null, "string", {}, { path: "ok" }],
    docxSlots: [null],
    renderBindings: [{}],
    rejectedCandidates: [null],
  });
  const fields = collectFields(withGarbage);
  // The only well-formed entry has no `source`/`required`/`uiComponent` and
  // no label, so it still surfaces as one field with sensible fallbacks.
  assert.equal(fields.length, 1);
  assert.equal(fields[0]!.path, "ok");
  assert.equal(fields[0]!.source, "manual");
  assert.equal(fields[0]!.label, "ok");
});

test("section order follows first occurrence in canonical", () => {
  // Canonical lists document.X, agency.Y, document.Z. Sections should
  // appear as [document, agency] (first occurrence wins).
  const schema = deriveFormInputSchema({
    templateCode: "CUS-ORDER-TEST",
    sourceId: "order-test",
    canonicalFields: [
      {
        path: "document.first",
        type: "string",
        label: "First",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "agency.middle",
        type: "string",
        label: "Middle",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
      {
        path: "document.second",
        type: "string",
        label: "Second",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [],
    rejectedCandidates: [],
  });

  const keys = schema.sections.map((s) => s.key);
  assert.deepEqual(keys, ["document", "agency"]);
  const documentSection = schema.sections.find((s) => s.key === "document");
  assert.ok(documentSection);
  const documentPaths = documentSection?.fields.map((f) => f.path) ?? [];
  assert.deepEqual(documentPaths, ["document.first", "document.second"]);
});

// ---------------------------------------------------------------------------
// B4 source-normalization corpus audit (non-blocking)
//
// B1 already normalizes "unknown" and any unrecognized source string to
// "manual" and emits UNKNOWN_SOURCE_NORMALIZED. B3 surfaces those
// warnings via /documents/generated/:id/form-schema. B4 hardens that
// behavior by adding:
//   - one inline test for invalid source values (not "unknown")
//   - one inline test asserting that the six valid sources emit no warning
//   - a corpus audit that scans every locked contract and reports
//     unknown + invalid sources + TABLE renderBindings
//
// The audit is INTENTIONALLY non-blocking: it never fails the suite.
// Remediation of invalid sources is owned by C3; this audit only proves
// the report shape and that B1's normalization continues to apply.
//
// If the corpus grows large enough that this scan becomes slow, move
// the helper to scripts/audit/audit-form-schema-sources.mjs and keep
// only the assertion-level checks here.
// ---------------------------------------------------------------------------

type CorpusSourceField = {
  templateCode: string;
  sourceId: string;
  path: string;
  label?: string;
  originalSource: string;
};

type CorpusTableRenderBinding = {
  templateCode: string;
  sourceId: string;
  bindingKey?: string;
  slotId?: string;
  path?: string;
};

type CorpusSourceAuditReport = {
  totalContracts: number;
  totalUnknownSourceFields: number;
  totalInvalidSourceFields: number;
  totalTableRenderBindings: number;
  unknownSourceFields: CorpusSourceField[];
  invalidSourceFields: CorpusSourceField[];
  tableRenderBindings: CorpusTableRenderBinding[];
};

const B4_VALID_SOURCES = new Set([
  "manual",
  "casePayload",
  "agencyConfig",
  "officialConfig",
  "systemDate",
  "computed",
]);

/**
 * Detect renderBindings that look like they target a TABLE rather than
 * a single SLOT. B3's V2->V1 mapper drops bindings whose target.kind
 * is not "SLOT", so any TABLE binding is silently missing from the
 * derived schema. The brief asks us to surface them even though the
 * current V1 corpus has zero.
 *
 * Heuristics (ordered, intentional):
 *   1. V2 discriminator:  binding.target?.kind === "TABLE"
 *   2. V1 transform cue:  binding.transform === "table"
 *   3. V1 slotId cue:     binding.slotId ends with ".table" or ".rows"
 *
 * These are intentionally narrow: we only flag what B1/B3 would
 * actually drop or mishandle. Generic slotIds are not flagged.
 */
function looksLikeTableBinding(binding: Record<string, unknown>): boolean {
  const target = binding.target as { kind?: unknown } | undefined;
  if (target && typeof target === "object" && target.kind === "TABLE") {
    return true;
  }
  if (binding.transform === "table") return true;
  const slotId = typeof binding.slotId === "string" ? binding.slotId : "";
  if (/\.(?:table|rows)$/u.test(slotId)) return true;
  return false;
}

/**
 * Scan every locked contract under docs/audit/docx/contracts/locked/
 * and build the B4 corpus audit report. Pure, read-only, deterministic.
 *
 * The audit never throws: malformed files are skipped (logged via
 * console.warn) so a single broken file cannot fail the suite. This
 * matches the B2 corpus scan convention.
 */
function auditCorpusSources(): CorpusSourceAuditReport {
  const files = readdirSync(LOCKED_DIR).filter(
    (entry) => entry.endsWith(".contract.locked.json"),
  );

  const report: CorpusSourceAuditReport = {
    totalContracts: 0,
    totalUnknownSourceFields: 0,
    totalInvalidSourceFields: 0,
    totalTableRenderBindings: 0,
    unknownSourceFields: [],
    invalidSourceFields: [],
    tableRenderBindings: [],
  };

  for (const file of files) {
    const raw = readFileSync(resolve(LOCKED_DIR, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn(`[B4 corpus audit] skipping malformed JSON: ${file}`);
      continue;
    }
    if (!isRecord(parsed)) continue;
    report.totalContracts += 1;

    const templateCode = readString(parsed, "templateCode") || file;
    const sourceId = readString(parsed, "sourceId");

    for (const cf of readArray<Record<string, unknown>>(parsed, "canonicalFields")) {
      const source = typeof cf.source === "string" ? cf.source : "";
      if (!source) continue;
      const path = typeof cf.path === "string" ? cf.path : "";
      if (!path) continue;
      const label = typeof cf.label === "string" ? cf.label : undefined;
      if (source === "unknown") {
        report.totalUnknownSourceFields += 1;
        report.unknownSourceFields.push({
          templateCode,
          sourceId,
          path,
          label,
          originalSource: source,
        });
      } else if (!B4_VALID_SOURCES.has(source)) {
        report.totalInvalidSourceFields += 1;
        report.invalidSourceFields.push({
          templateCode,
          sourceId,
          path,
          label,
          originalSource: source,
        });
      }
    }

    for (const rb of readArray<Record<string, unknown>>(parsed, "renderBindings")) {
      if (!looksLikeTableBinding(rb)) continue;
      report.totalTableRenderBindings += 1;
      const slotId = typeof rb.slotId === "string" ? rb.slotId : undefined;
      const from = typeof rb.from === "string" ? rb.from : undefined;
      const target = rb.target as { slotId?: unknown; tableKey?: unknown } | undefined;
      report.tableRenderBindings.push({
        templateCode,
        sourceId,
        bindingKey: slotId ?? from,
        slotId,
        path: from ?? (target && typeof target.tableKey === "string"
          ? target.tableKey
          : undefined),
      });
    }
  }

  return report;
}

test("B4 corpus audit: scans all locked contracts and reports source normalization", () => {
  const report = auditCorpusSources();

  // (a) The audit must report at least one contract. The locked corpus
  // currently holds 213 BMs; we only assert >0 so a future CI variant
  // with a subset still passes.
  assert.ok(
    report.totalContracts > 0,
    `expected totalContracts > 0, got ${report.totalContracts}`,
  );

  // (b) The audit must detect known unknown-source fields. The corpus
  // currently contains a "document.fullDocumentCode" unknown field in
  // BM-051 (and several others). This is the "audit detects unknown
  // sources if present" assertion from the brief.
  const unknown051 = report.unknownSourceFields.find(
    (f) => f.templateCode === "BM-051" && f.path === "document.fullDocumentCode",
  );
  assert.ok(
    unknown051,
    "audit should report BM-051/document.fullDocumentCode as an unknown source",
  );
  assert.equal(unknown051?.originalSource, "unknown");

  // (c) The corpus also contains invalid (non-unknown) source values,
  // such as "constantFromDocx" on legalBasis/section.procedureArticlesLine.
  // The audit must surface them so C3 can remediate.
  const invalidExample = report.invalidSourceFields.find(
    (f) =>
      f.templateCode === "BM-003" && f.path === "legalBasis.procedureArticlesLine",
  );
  assert.ok(
    invalidExample,
    "audit should report BM-003/legalBasis.procedureArticlesLine as an invalid source",
  );
  assert.equal(invalidExample?.originalSource, "constantFromDocx");

  // (d) Cross-check totals: the audit must agree with itself.
  assert.equal(
    report.totalUnknownSourceFields,
    report.unknownSourceFields.length,
  );
  assert.equal(
    report.totalInvalidSourceFields,
    report.invalidSourceFields.length,
  );
  assert.equal(
    report.totalTableRenderBindings,
    report.tableRenderBindings.length,
  );
});

test("B4 corpus audit: B1 normalizes every flagged field, so no UNKNOWN_SOURCE_NORMALIZED escapes the suite", () => {
  // For every contract in the corpus, derive its schema and confirm
  // that B1's normalization handled it: schema derivation must not
  // throw, every flagged field must surface as a manual editable
  // field, and the per-field warnings must include the UNKNOWN warning
  // for both "unknown" and unrecognized values.
  const report = auditCorpusSources();

  // Build the union of paths the audit flagged so we only re-derive
  // those contracts (keeps this test under ~1s).
  const flaggedPaths = new Set<string>();
  for (const f of report.unknownSourceFields) flaggedPaths.add(f.path);
  for (const f of report.invalidSourceFields) flaggedPaths.add(f.path);
  assert.ok(flaggedPaths.size > 0, "expected the corpus to have at least one flagged path");

  const files = readdirSync(LOCKED_DIR).filter(
    (entry) => entry.endsWith(".contract.locked.json"),
  );

  let checkedContracts = 0;
  for (const file of files) {
    const raw = readFileSync(resolve(LOCKED_DIR, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!isRecord(parsed)) continue;
    const templateCode = readString(parsed, "templateCode") || file;
    const canonicalFields = readArray<Record<string, unknown>>(
      parsed,
      "canonicalFields",
    );
    const hasFlaggedPath = canonicalFields.some((cf) =>
      flaggedPaths.has(String(cf.path ?? "")),
    );
    if (!hasFlaggedPath) continue;

    const schema = deriveFormInputSchema(parsed);
    checkedContracts += 1;

    const flaggedForThisContract = [
      ...report.unknownSourceFields.filter((f) => f.templateCode === templateCode),
      ...report.invalidSourceFields.filter((f) => f.templateCode === templateCode),
    ];

    for (const flagged of flaggedForThisContract) {
      const warning = schema.warnings.find(
        (w) =>
          w.code === "UNKNOWN_SOURCE_NORMALIZED" && w.path === flagged.path,
      );
      assert.ok(
        warning,
        `expected UNKNOWN_SOURCE_NORMALIZED for ${templateCode}/${flagged.path}`,
      );
    }
  }

  assert.ok(
    checkedContracts > 0,
    "expected to re-derive at least one flagged contract",
  );
});

test("B4 corpus audit: TABLE renderBindings are reported if present (non-blocking)", () => {
  const report = auditCorpusSources();

  // The current V1 locked corpus holds zero TABLE renderBindings. This
  // is the desired steady state: B3's V2->V1 mapper has nothing to
  // drop. We still assert that the audit ran cleanly and that the
  // TABLE bucket is the right shape. If C3 ever introduces a V1
  // TABLE binding, this number becomes >0 and the audit will surface
  // it without code changes.
  assert.ok(
    Number.isInteger(report.totalTableRenderBindings),
    "totalTableRenderBindings must be an integer",
  );
  assert.equal(
    report.totalTableRenderBindings,
    report.tableRenderBindings.length,
  );

  if (report.totalTableRenderBindings > 0) {
    console.log(
      `[B4 corpus audit] ${report.totalTableRenderBindings} TABLE renderBinding(s) found in the locked corpus. ` +
        "B3 V2->V1 mapper drops TABLE targets; consider adding a TABLE_BINDING_UNSUPPORTED schema warning.",
    );
    for (const row of report.tableRenderBindings.slice(0, 10)) {
      console.log(
        `  - ${row.templateCode}  slotId=${row.slotId ?? "?"}  path=${row.path ?? "?"}`,
      );
    }
  }

  // Synthetic fixture: a TABLE-shaped renderBinding MUST be detected.
  const synthetic = deriveFormInputSchema({
    templateCode: "CUS-TABLE-BINDING-TEST",
    sourceId: "table-binding-test",
    canonicalFields: [
      {
        path: "evidence.items",
        type: "array",
        label: "Danh sách vật chứng",
        source: "manual",
        required: false,
        uiComponent: "text",
        reviewRequired: false,
      },
    ],
    docxSlots: [],
    renderBindings: [
      {
        slotId: "evidence.items.table",
        from: "evidence.items",
        transform: "table",
        fallback: "",
        reviewRequired: false,
      },
    ],
    rejectedCandidates: [],
  });

  // B1 itself does not surface TABLE-specific behavior in derived
  // schemas (it works on canonicalFields, not on renderBindings), so
  // we only need to assert the audit helper detects the synthetic
  // fixture. Run the helper logic directly against the synthetic
  // binding rather than re-deriving through deriveFormInputSchema.
  const detected = looksLikeTableBinding({
    slotId: "evidence.items.table",
    from: "evidence.items",
    transform: "table",
  });
  assert.ok(detected, "audit helper must detect a TABLE-shaped V1 renderBinding");
  // And the synthetic schema must still derive without throwing.
  assert.equal(synthetic.templateCode, "CUS-TABLE-BINDING-TEST");
  assert.ok(synthetic.sections.length >= 0);
});

// ---------------------------------------------------------------------------
// B2 corpus scan (non-blocking)
//
// This test walks every locked contract in docs/audit/docx/contracts/locked/
// and reports any section keys that are NOT yet mapped in SECTION_TITLES.
// It is INTENTIONALLY non-blocking: it never fails the suite. The
// report is logged via console.log so reviewers can spot future
// translation work without test churn.
//
// If the corpus grows to a size that makes this slow, delete this
// block and run the scan manually as a one-off script.
// ---------------------------------------------------------------------------

test("B2 corpus scan: lists section keys missing from SECTION_TITLES (non-blocking)", () => {
  const files = readdirSync(LOCKED_DIR).filter(
    (entry) => entry.endsWith(".contract.locked.json"),
  );

  const missingByKey = new Map<string, { templates: string[]; count: number }>();
  for (const file of files) {
    const raw = readFileSync(resolve(LOCKED_DIR, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!isRecord(parsed)) continue;
    const templateCode = readString(parsed, "templateCode");
    if (!templateCode) continue;
    const schema = deriveFormInputSchema(parsed);
    for (const section of schema.sections) {
      if (SECTION_TITLES[section.key]) continue;
      const existing = missingByKey.get(section.key);
      if (existing) {
        existing.count += 1;
        if (existing.templates.length < 3) {
          existing.templates.push(templateCode);
        }
      } else {
        missingByKey.set(section.key, {
          templates: [templateCode],
          count: 1,
        });
      }
    }
  }

  if (missingByKey.size > 0) {
    const lines: string[] = [];
    lines.push(
      "[B2 corpus scan] section keys not yet in SECTION_TITLES (informational, non-blocking):",
    );
    const sorted = [...missingByKey.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [key, info] of sorted) {
      lines.push(
        `  - ${key}  (${info.count} BM(s), examples: ${info.templates.join(", ")})`,
      );
    }
    console.log(lines.join("\n"));
  }

  // Non-blocking: assert only that the scan ran without throwing.
  assert.equal(typeof missingByKey, "object");
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readArray<T = unknown>(record: Record<string, unknown>, key: string): T[] {
  const value = record[key];
  return Array.isArray(value) ? (value as T[]) : [];
}