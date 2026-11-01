/**
 * Smart-field time helper guard. Pure-JS assertion-only test, mirrors the
 * helper module in lock-step so test runs do not require React/DOM or a
 * TypeScript transpilation step.
 *
 * The helper itself is in
 * `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`; this file
 * duplicates `canonicalizeTimeValue` and `normalizeTimeEditBuffer` so the
 * guard can run via plain `node --test` (matching the convention of
 * `bm001-smart-runtime-ux.guard.test.mjs`).
 *
 * Run with:
 *   node --test apps/web/src/lib/runtime-ux/smart-field-helpers-time.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function canonicalizeTimeValue(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return "";
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(trimmed)) {
    const hours = Number(trimmed.slice(0, 2));
    const minutes = Number(trimmed.slice(2));
    if (hours <= 23 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return "";
  }
  return "";
}

function normalizeTimeEditBuffer(value) {
  const sanitized = String(value).replace(/[^\d:]/g, "");
  const digits = sanitized.replace(/:/g, "").slice(0, 4);
  if (digits.length === 4) {
    return canonicalizeTimeValue(digits) || digits;
  }
  if (sanitized.includes(":")) {
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2);
    return `${hours}:${minutes}`.slice(0, 5);
  }
  return digits;
}

describe("smart-field-helpers / time canonicalization", () => {
  it("canonicalizes a clean HH:mm value", () => {
    assert.equal(canonicalizeTimeValue("09:00"), "09:00");
    assert.equal(canonicalizeTimeValue("9:00"), "09:00");
    assert.equal(canonicalizeTimeValue("23:59"), "23:59");
  });

  it("trims surrounding whitespace before validating", () => {
    assert.equal(canonicalizeTimeValue("  09:30  "), "09:30");
  });

  it("accepts a 4-digit entry form before the colon", () => {
    assert.equal(canonicalizeTimeValue("0900"), "09:00");
    assert.equal(canonicalizeTimeValue("1645"), "16:45");
    assert.equal(canonicalizeTimeValue("0000"), "00:00");
  });

  it("returns the empty string for invalid hour or minute", () => {
    assert.equal(canonicalizeTimeValue("24:00"), "");
    assert.equal(canonicalizeTimeValue("09:60"), "");
    assert.equal(canonicalizeTimeValue("25:30"), "");
    assert.equal(canonicalizeTimeValue("12:99"), "");
    assert.equal(canonicalizeTimeValue("1261"), "");
  });

  it("returns the empty string for empty / garbage / non-string input", () => {
    assert.equal(canonicalizeTimeValue(""), "");
    assert.equal(canonicalizeTimeValue("abcd"), "");
    assert.equal(canonicalizeTimeValue("--:00"), "");
    assert.equal(canonicalizeTimeValue("--:--"), "");
    assert.equal(canonicalizeTimeValue(null), "");
    assert.equal(canonicalizeTimeValue(undefined), "");
    assert.equal(canonicalizeTimeValue(42), "");
  });

  it("never manufactures placeholder tokens like --:00 or --:--", () => {
    for (const raw of ["", "0", "00", "0:", "00:", "ab", "1", "12"]) {
      const out = canonicalizeTimeValue(raw);
      assert.ok(
        !out.includes("--"),
        `canonicalizeTimeValue(${JSON.stringify(raw)}) unexpectedly produced "--" — got ${JSON.stringify(out)}`
      );
    }
  });
});

describe("smart-field-helpers / time editing buffer", () => {
  it("keeps partial single-digit entries visible", () => {
    assert.equal(normalizeTimeEditBuffer("0"), "0");
    assert.equal(normalizeTimeEditBuffer("09"), "09");
  });

  it("strips non-digit characters and limits to four digits", () => {
    assert.equal(normalizeTimeEditBuffer("ab12"), "12");
    // Five digits typed at once — the buffer collapses to the first four
    // and forms a canonical HH:mm (12:34), so the user sees the parsed
    // value immediately on the next render.
    assert.equal(normalizeTimeEditBuffer("12345"), "12:34");
  });

  it("auto-inserts a colon after two digits when four digits are typed", () => {
    assert.equal(normalizeTimeEditBuffer("0900"), "09:00");
    assert.equal(normalizeTimeEditBuffer("1645"), "16:45");
  });

  it("keeps the literal digits so the user can correct invalid input", () => {
    const out = normalizeTimeEditBuffer("1261");
    assert.ok(
      out === "12:61" || out === "1261",
      `expected literal digits visible to user, got ${JSON.stringify(out)}`
    );
    assert.equal(canonicalizeTimeValue(out), "");
  });

  it("never silently fails on the canonical empty case", () => {
    assert.equal(normalizeTimeEditBuffer(""), "");
  });
});

describe("smart-field-helpers / HH:mm invariant", () => {
  it("every canonicalized value matches /^(2[0-3]|[01]\d):[0-5]\d$/", () => {
    const samples = ["09:00", " 9:00 ", "0900", "1645", " 1645 "];
    for (const raw of samples) {
      const out = canonicalizeTimeValue(raw);
      assert.match(out, HHMM, `${raw} → ${out}`);
    }
  });
});