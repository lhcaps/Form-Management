import { test } from "node:test";
import assert from "node:assert/strict";

import { buildArchiveLine } from "../src/bm-form-mapping/archive-line.js";

test("buildArchiveLine returns provided value when present", () => {
  assert.equal(
    buildArchiveLine("Lưu: HSVA, HSKS, VP.", "fallback should not apply"),
    "Lưu: HSVA, HSKS, VP.",
  );
});

test("buildArchiveLine returns BM-001 fallback when caller passes it", () => {
  assert.equal(
    buildArchiveLine("", "Lưu: HSVA, HSKS, VP."),
    "Lưu: HSVA, HSKS, VP.",
  );
});

test("buildArchiveLine does not force fallback globally when caller omits it", () => {
  assert.equal(buildArchiveLine("", undefined), "");
  assert.equal(buildArchiveLine("", null), "");
  assert.equal(buildArchiveLine("", ""), "");
});

test("buildArchiveLine trims whitespace from provided value", () => {
  assert.equal(
    buildArchiveLine("  Lưu: HSVA, HSKS, VP.  ", "ignored"),
    "Lưu: HSVA, HSKS, VP.",
  );
});

test("buildArchiveLine treats whitespace-only input as missing", () => {
  assert.equal(
    buildArchiveLine("   ", "Lưu: HSVA, HSKS, VP."),
    "Lưu: HSVA, HSKS, VP.",
  );
});

test("buildArchiveLine coerces non-string values safely", () => {
  assert.equal(buildArchiveLine(null, "Lưu: HSVA, HSKS, VP."), "Lưu: HSVA, HSKS, VP.");
  assert.equal(buildArchiveLine(undefined, "Lưu: HSVA, HSKS, VP."), "Lưu: HSVA, HSKS, VP.");
  assert.equal(buildArchiveLine(0, "Lưu: HSVA, HSKS, VP."), "Lưu: HSVA, HSKS, VP.");
});