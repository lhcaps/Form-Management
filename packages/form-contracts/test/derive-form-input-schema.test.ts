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
 *  - computed defaults to editable=false, visible=false
 *  - casePayload/agencyConfig/systemDate are editable=false, visible=true
 *  - hints never create new paths
 *  - inputType is mapped from uiComponent / slotType / path tail
 *  - sections group by first path segment and preserve canonical order
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