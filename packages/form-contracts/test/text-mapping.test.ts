import { test } from "node:test";
import assert from "node:assert/strict";

import {
  emptyStringIfMissing,
  normalizeTextInput,
  assertNoUnsafeMappedValue,
} from "../src/bm-form-mapping/text-mapping.js";

test("normalizeTextInput returns empty string for null", () => {
  assert.equal(normalizeTextInput(null), "");
});

test("normalizeTextInput returns empty string for undefined", () => {
  assert.equal(normalizeTextInput(undefined), "");
});

test("normalizeTextInput returns string as-is", () => {
  assert.equal(normalizeTextInput("Đoàn Văn Dũng"), "Đoàn Văn Dũng");
  assert.equal(normalizeTextInput(""), "");
});

test("normalizeTextInput never returns 'undefined' literal", () => {
  assert.notEqual(normalizeTextInput(undefined), "undefined");
  assert.notEqual(normalizeTextInput(null), "undefined");
});

test("normalizeTextInput never returns 'null' literal", () => {
  assert.notEqual(normalizeTextInput(null), "null");
  assert.notEqual(normalizeTextInput(undefined), "null");
});

test("normalizeTextInput never returns '[object Object]' for objects", () => {
  assert.notEqual(normalizeTextInput({}), "[object Object]");
  assert.notEqual(normalizeTextInput({ foo: "bar" }), "[object Object]");
  assert.notEqual(normalizeTextInput([1, 2, 3]), "[object Object]");
});

test("normalizeTextInput coerces finite numbers", () => {
  assert.equal(normalizeTextInput(2026), "2026");
  assert.equal(normalizeTextInput(0), "0");
});

test("normalizeTextInput coerces booleans", () => {
  assert.equal(normalizeTextInput(true), "true");
  assert.equal(normalizeTextInput(false), "false");
});

test("normalizeTextInput coerces bigints", () => {
  assert.equal(normalizeTextInput(BigInt(42)), "42");
});

test("emptyStringIfMissing mirrors normalizeTextInput", () => {
  assert.equal(emptyStringIfMissing(null), "");
  assert.equal(emptyStringIfMissing(undefined), "");
  assert.equal(emptyStringIfMissing("hello"), "hello");
});

test("assertNoUnsafeMappedValue detects undefined-literal", () => {
  const findings = assertNoUnsafeMappedValue({ a: "undefined" });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.kind, "undefined-literal");
});

test("assertNoUnsafeMappedValue detects null-literal", () => {
  const findings = assertNoUnsafeMappedValue({ a: "null" });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.kind, "null-literal");
});

test("assertNoUnsafeMappedValue detects object-toString", () => {
  const findings = assertNoUnsafeMappedValue({ a: "[object Object]" });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.kind, "object-toString");
});

test("assertNoUnsafeMappedValue detects Invalid Date", () => {
  const findings = assertNoUnsafeMappedValue({ a: "Invalid Date" });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.kind, "invalid-date");
});

test("assertNoUnsafeMappedValue detects mustache placeholder leak", () => {
  const findings = assertNoUnsafeMappedValue({ a: "{{informant.fullName}}" });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.kind, "placeholder-braces");
});

test("assertNoUnsafeMappedValue walks nested objects and arrays", () => {
  const findings = assertNoUnsafeMappedValue({
    informant: {
      fullName: "Đoàn Văn Dũng",
      alias: "undefined",
    },
    list: ["ok", "null"],
  });
  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((f) => f.path.join(".")),
    ["informant.alias", "list.1"],
  );
});

test("assertNoUnsafeMappedValue returns empty for clean payloads", () => {
  const findings = assertNoUnsafeMappedValue({
    informant: {
      fullName: "Đoàn Văn Dũng",
      age: "1985",
      dob: "1985-09-08",
    },
    recipient: {
      archiveLine: "Lưu: HSVA, HSKS, VP.",
    },
  });
  assert.equal(findings.length, 0);
});

test("assertNoUnsafeMappedValue ignores null / undefined values", () => {
  const findings = assertNoUnsafeMappedValue({
    a: null,
    b: undefined,
    c: "",
  });
  assert.equal(findings.length, 0);
});