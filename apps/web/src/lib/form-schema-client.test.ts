/**
 * Unit tests for the B3 form-schema client + pure helpers.
 *
 * Goals:
 *  - Lock the path-walk semantics for getValueByPath / setValueByPath.
 *  - Lock partitionSchemaFields' behavior: only visible fields,
 *    editable vs readonly split, original order preserved.
 *  - Smoke-test the fetchFormSchema unwrap by stubbing global fetch.
 *  - Tolerate legacy / unknown shapes without throwing (the B3
 *    fallback path in the panel depends on this).
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchFormSchema,
  getValueByPath,
  partitionSchemaFields,
  setValueByPath,
} from "./form-schema-client";
import type { FormInputSchema } from "@qllaw/form-contracts";

function makeSchema(): FormInputSchema {
  return {
    templateCode: "BM-001",
    sourceId: "BM-001",
    warnings: [],
    sections: [
      {
        key: "agency",
        title: "Cơ quan",
        fields: [
          {
            path: "agency.name",
            label: "Tên cơ quan",
            required: true,
            inputType: "text",
            source: "manual",
            editable: true,
            visible: true,
            visibilityReason: "USER_INPUT",
            reviewRequired: false,
            origin: "canonical",
          },
          {
            path: "agency.caseCode",
            label: "Mã hồ sơ",
            required: false,
            inputType: "text",
            source: "casePayload",
            editable: false,
            readonlyReason: "CASE_PAYLOAD",
            visible: true,
            visibilityReason: "READONLY_PREVIEW",
            reviewRequired: false,
            origin: "canonical",
          },
        ],
      },
      {
        key: "internal",
        title: "Internal",
        fields: [
          {
            path: "internal.computed",
            label: "Computed",
            required: false,
            inputType: "text",
            source: "computed",
            editable: false,
            readonlyReason: "COMPUTED",
            visible: false,
            visibilityReason: "INTERNAL_RENDER_ONLY",
            reviewRequired: false,
            origin: "canonical",
          },
        ],
      },
    ],
  };
}

test("getValueByPath reads nested values", () => {
  const data = { agency: { name: "VKS Hà Nội", nested: { value: 1 } } };
  assert.equal(getValueByPath(data, "agency.name"), "VKS Hà Nội");
  assert.equal(getValueByPath(data, "agency.nested.value"), 1);
});

test("getValueByPath returns undefined for missing or invalid paths", () => {
  const data = { agency: { name: "VKS" } };
  assert.equal(getValueByPath(data, "agency.missing"), undefined);
  assert.equal(getValueByPath(data, "missing.name"), undefined);
  assert.equal(getValueByPath(data, "agency.name.deep"), undefined);
  assert.equal(getValueByPath(data, ""), undefined);
});

test("getValueByPath crosses through arrays as undefined (not crash)", () => {
  const data = { list: [{ a: 1 }] };
  assert.equal(getValueByPath(data, "list.a"), undefined);
});

test("setValueByPath creates a new object with the path set", () => {
  const original: Record<string, unknown> = { agency: { name: "Old" } };
  const next = setValueByPath(original, "agency.name", "New");
  assert.equal(getValueByPath(next, "agency.name"), "New");
  // Original must be untouched.
  assert.equal(getValueByPath(original, "agency.name"), "Old");
  assert.notEqual(next, original);
  assert.notEqual(
    getValueByPath(next, "agency"),
    getValueByPath(original, "agency"),
  );
});

test("setValueByPath creates missing intermediate objects", () => {
  const original: Record<string, unknown> = {};
  const next = setValueByPath(original, "person.fullName", "A");
  assert.equal(getValueByPath(next, "person.fullName"), "A");
  assert.equal(getValueByPath(original, "person.fullName"), undefined);
});

test("setValueByPath replaces non-object intermediates", () => {
  const original: Record<string, unknown> = { agency: "not-an-object" };
  const next = setValueByPath(original, "agency.name", "X");
  assert.equal(getValueByPath(next, "agency.name"), "X");
});

test("setValueByPath returns the input unchanged for an empty path", () => {
  const original = { a: 1 };
  assert.equal(setValueByPath(original, "", "x"), original);
});

test("partitionSchemaFields drops hidden fields and splits editable vs readonly", () => {
  const schema = makeSchema();
  const { editable, readonly } = partitionSchemaFields(schema);

  // agency.caseCode is readonly + visible; agency.name is editable + visible;
  // internal.computed is hidden, so it must be excluded.
  const editablePaths = editable.map((f) => f.path);
  const readonlyPaths = readonly.map((f) => f.path);
  assert.deepEqual(editablePaths, ["agency.name"]);
  assert.deepEqual(readonlyPaths, ["agency.caseCode"]);
});

test("partitionSchemaFields preserves the original schema order", () => {
  const schema: FormInputSchema = {
    templateCode: "BM-001",
    sourceId: "BM-001",
    warnings: [],
    sections: [
      {
        key: "a",
        title: "A",
        fields: [
          {
            path: "a.first",
            label: "first",
            required: false,
            inputType: "text",
            source: "manual",
            editable: true,
            visible: true,
            visibilityReason: "USER_INPUT",
            reviewRequired: false,
            origin: "canonical",
          },
          {
            path: "a.second",
            label: "second",
            required: false,
            inputType: "text",
            source: "manual",
            editable: true,
            visible: true,
            visibilityReason: "USER_INPUT",
            reviewRequired: false,
            origin: "canonical",
          },
        ],
      },
      {
        key: "b",
        title: "B",
        fields: [
          {
            path: "b.third",
            label: "third",
            required: false,
            inputType: "text",
            source: "manual",
            editable: true,
            visible: true,
            visibilityReason: "USER_INPUT",
            reviewRequired: false,
            origin: "canonical",
          },
        ],
      },
    ],
  };
  const { editable } = partitionSchemaFields(schema);
  assert.deepEqual(
    editable.map((f) => f.path),
    ["a.first", "a.second", "b.third"],
  );
});

test("partitionSchemaFields returns empty arrays for an empty schema", () => {
  const schema: FormInputSchema = {
    templateCode: "",
    sourceId: "",
    warnings: [],
    sections: [],
  };
  const result = partitionSchemaFields(schema);
  assert.deepEqual(result.editable, []);
  assert.deepEqual(result.readonly, []);
});

test("fetchFormSchema parses a well-formed response", async () => {
  const schema = makeSchema();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        generatedDocumentId: "11",
        templateCode: "BM-001",
        sourceId: "BM-001",
        contractVersionHash: "abc",
        schema,
        values: { "agency.name": "VKS Hà Nội" },
        resolvedValues: { "agency.name": "VKS Hà Nội" },
        validation: { missingRequiredFields: [] },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as unknown as typeof fetch;

  try {
    const result = await fetchFormSchema("11");
    assert.equal(result.generatedDocumentId, "11");
    assert.equal(result.templateCode, "BM-001");
    assert.equal(result.values["agency.name"], "VKS Hà Nội");
    assert.equal(result.validation.missingRequiredFields.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchFormSchema throws on a non-2xx response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response("nope", { status: 500 })) as unknown as typeof fetch;
  try {
    await assert.rejects(() => fetchFormSchema("11"), /HTTP 500/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchFormSchema throws on a malformed payload", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ unexpected: "shape" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;
  try {
    await assert.rejects(
      () => fetchFormSchema("11"),
      /form-schema không đúng định dạng/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
