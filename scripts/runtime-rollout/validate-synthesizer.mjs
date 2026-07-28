/**
 * Phase 14 Turn 3 — Synthesizer Validation Script
 *
 * Standalone test that validates the contract-valid-ui-value-synthesizer
 * without relying on the self-test infrastructure.
 *
 * Usage: node scripts/runtime-rollout/validate-synthesizer.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SYNTH = path.join(REPO_ROOT, "scripts", "runtime-rollout", "lib", "contract-valid-ui-value-synthesizer.mjs");

// Dynamic import to avoid require cache
const mod = await import(`file://${SYNTH}?t=${Date.now()}`);
const { buildValueForField, buildValidR1Value, buildValidR2Value,
        buildValidFormPayload, validateAgainstKnownConstraints } = mod;

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  PASS: ${name}`);
      pass++;
    } else {
      console.log(`  FAIL: ${name} — ${JSON.stringify(result)}`);
      fail++;
    }
  } catch (e) {
    console.log(`  FAIL: ${name} — ${e.message}`);
    console.log(`    Stack: ${e.stack?.split('\n').slice(0,3).join(' | ')}`);
    fail++;
  }
}

function assert(actual, expected, msg) {
  if (actual === expected) return true;
  return `${msg ?? 'assertion'} — expected ${expected}, got ${actual}`;
}

// --- Phase 4: Synthesizer validation ---
console.log("\n[validate-synthesizer] Phase 4: Contract-valid value synthesizer");
console.log("==========================================");

console.log("\nDate generation:");
test("generates valid date structure", () => {
  const r = buildValueForField("doc.date", { type: "date" }, { revision: "R1" });
  return (
    r &&
    typeof r.day === "string" && r.day.length === 2 &&
    typeof r.month === "string" && r.month.length === 2 &&
    typeof r.year === "string" && r.year.length === 4 &&
    typeof r.display === "string" && r.display.includes("/") &&
    r.display === `${r.day}/${r.month}/${r.year}`
  ) || assert(false, true, "date structure");
});

test("R1 and R2 dates differ", () => {
  const r1 = buildValueForField("doc.date", { type: "date" }, { revision: "R1" });
  const r2 = buildValueForField("doc.date", { type: "date" }, { revision: "R2" });
  return (r1.display !== r2.display) || assert(r1.display, r2.display, "dates differ");
});

test("nested object with date field", () => {
  const r = buildValueForField("person", {
    type: "object",
    properties: {
      fullName: { type: "string" },
      dateOfBirth: { type: "date" },
    }
  }, { revision: "R1" });
  return (
    r &&
    typeof r.fullName === "string" &&
    r.fullName.startsWith("[") &&
    typeof r.dateOfBirth === "object" &&
    typeof r.dateOfBirth.display === "string"
  ) || assert(false, true, "nested with date");
});

test("repeater generates minimum items", () => {
  const r = buildValueForField("persons", {
    type: "array",
    minItems: 2,
    items: {
      type: "object",
      properties: {
        name: { type: "string" }
      }
    }
  }, { revision: "R1" });
  return (
    Array.isArray(r) &&
    r.length >= 2 &&
    typeof r[0].name === "string"
  ) || assert(false, true, "repeater minItems");
});

test("enum field returns first value for R1", () => {
  const r = buildValueForField("signMode", {
    type: "string",
    enum: ["MANUAL", "ELECTRONIC"]
  }, { revision: "R1" });
  return r === "MANUAL" || assert(r, "MANUAL", "enum R1");
});

test("enum field returns second value for R2", () => {
  const r = buildValueForField("signMode", {
    type: "string",
    enum: ["MANUAL", "ELECTRONIC"]
  }, { revision: "R2" });
  return r === "ELECTRONIC" || assert(r, "ELECTRONIC", "enum R2");
});

test("select field returns first option", () => {
  const r = buildValueForField("case.type", {
    type: "select",
    options: ["TỐ TỤNG HÌNH SỰ", "TỐ TỤNG DÂN SỰ"]
  }, { revision: "R1" });
  return r === "TỐ TỤNG HÌNH SỰ" || assert(r, "TỐ TỤNG HÌNH SỰ", "select R1");
});

test("boolean field is explicit", () => {
  const r1 = buildValueForField("hasAttachment", { type: "boolean" }, { revision: "R1" });
  const r2 = buildValueForField("hasAttachment", { type: "boolean" }, { revision: "R2" });
  return typeof r1 === "boolean" && typeof r2 === "boolean" && r1 !== r2
    || assert(false, true, "boolean explicit and different");
});

test("read-only fields return undefined", () => {
  const r = buildValueForField("computed.total", { type: "string", readOnly: true }, {});
  return r === undefined || assert(r, undefined, "read-only");
});

test("buildValidR1Value returns string for text", () => {
  const r = buildValidR1Value({ type: "string", key: "person.name" }, {});
  return typeof r === "string" && r.startsWith("[") || assert(false, true, "R1 string");
});

test("buildValidR2Value differs from R1", () => {
  const r1 = buildValidR1Value({ type: "string", key: "person.name" }, {});
  const r2 = buildValidR2Value({ type: "string", key: "person.name" }, {});
  return r1 !== r2 || assert(r1, r2, "R1≠R2");
});

test("buildValidFormPayload includes agency/official/case", () => {
  const payload = buildValidFormPayload("BM-058", {
    "person.fullName": { type: "string" },
    "document.issueDate": { type: "date" },
  }, { caseRequired: true });
  const keys = Object.keys(payload);
  return (
    keys.includes("agency") &&
    keys.includes("official") &&
    keys.includes("case") &&
    payload.agency &&
    payload.official &&
    payload.case
  ) ? true : "payload missing agency/official/case keys";
});

test("validateAgainstKnownConstraints passes for valid payload", () => {
  const payload = {
    "person.fullName": "Test Name",
    "document.issueDate": { day: "15", month: "06", year: "2024" },
  };
  const result = validateAgainstKnownConstraints("BM-058", payload);
  return result.valid === true || assert(result, {valid:true}, "validation");
});

// --- Root-cause family coverage ---
console.log("\nRoot-cause family coverage:");

const families = [
  { name: "REQUIRED_TEXT_MISSING", field: { type: "string" }, context: {} },
  { name: "REQUIRED_DATE_MISSING", field: { type: "date" }, context: {} },
  { name: "INVALID_DATE_SHAPE", field: { type: "date" }, context: {} },
  { name: "REQUIRED_SELECT_MISSING", field: { type: "select", options: ["A", "B"] }, context: {} },
  { name: "INVALID_ENUM_VALUE", field: { type: "string", enum: ["X", "Y"] }, context: {} },
  { name: "REQUIRED_BOOLEAN_MISSING", field: { type: "boolean" }, context: {} },
  { name: "NESTED_OBJECT_MISSING", field: { type: "object", properties: { name: { type: "string" } } }, context: {} },
  { name: "REPEATER_MIN_ITEMS", field: { type: "array", minItems: 1, items: { type: "string" } }, context: {} },
  { name: "AGENCY_CONTEXT_MISSING", field: { type: "object" }, context: {} },
  { name: "R2 differs from R1", field: { type: "string" }, context: {} },
];

for (const tc of families) {
  try {
    const r1 = buildValueForField(tc.name, tc.field, { ...tc.context, revision: "R1" });
    const r2 = buildValueForField(tc.name, tc.field, { ...tc.context, revision: "R2" });
    const valid = r1 !== null && r1 !== undefined;
    if (tc.name === "R2 differs from R1") {
      const ok = r1 !== r2;
      console.log(`  ${ok ? "PASS" : "FAIL"}: ${tc.name} (R1=${String(r1).slice(0,20)} R2=${String(r2).slice(0,20)})`);
      if (ok) pass++; else fail++;
    } else {
      console.log(`  ${valid ? "PASS" : "FAIL"}: ${tc.name} (${JSON.stringify(r1)?.slice(0,40)})`);
      if (valid) pass++; else fail++;
    }
  } catch (e) {
    console.log(`  FAIL: ${tc.name} — ${e.message}`);
    fail++;
  }
}

// --- Summary ---
console.log(`\n==========================================`);
console.log(`[validate-synthesizer] ${pass} passed, ${fail} failed`);

if (fail > 0) {
  process.exit(1);
}
