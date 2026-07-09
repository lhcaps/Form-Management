import { test } from "node:test";
import assert from "node:assert/strict";

import {
  splitIsoDateToVietnameseParts,
  formatVietnameseDateParts,
  formatIdentityVietnameseDateParts,
  formatSlashDate,
  type VietnameseDateParts,
} from "../src/bm-form-mapping/date-mapping.js";

test("splitIsoDateToVietnameseParts parses YYYY-MM-DD", () => {
  const parts = splitIsoDateToVietnameseParts("2025-12-26");
  assert.equal(parts.day, "26");
  assert.equal(parts.month, "12");
  assert.equal(parts.year, "2025");
});

test("splitIsoDateToVietnameseParts keeps leading zeros", () => {
  const parts = splitIsoDateToVietnameseParts("2026-07-04");
  assert.deepEqual(parts, { day: "04", month: "07", year: "2026" });
});

test("splitIsoDateToVietnameseParts returns empty parts for empty input", () => {
  assert.deepEqual(splitIsoDateToVietnameseParts(""), {
    day: "",
    month: "",
    year: "",
  });
});

test("splitIsoDateToVietnameseParts returns empty parts for null / undefined", () => {
  assert.deepEqual(splitIsoDateToVietnameseParts(null), {
    day: "",
    month: "",
    year: "",
  });
  assert.deepEqual(splitIsoDateToVietnameseParts(undefined), {
    day: "",
    month: "",
    year: "",
  });
});

test("splitIsoDateToVietnameseParts returns empty parts for malformed input", () => {
  assert.deepEqual(splitIsoDateToVietnameseParts("not-a-date"), {
    day: "",
    month: "",
    year: "",
  });
  assert.deepEqual(splitIsoDateToVietnameseParts("2025/12/26"), {
    day: "",
    month: "",
    year: "",
  });
  assert.deepEqual(splitIsoDateToVietnameseParts("2025-1-1"), {
    day: "",
    month: "",
    year: "",
  });
});

test("splitIsoDateToVietnameseParts does not shift values via Date", () => {
  // The host timezone could be UTC-12 .. UTC+14. A pure string parser must
  // never depend on the system clock. The fixture below is the BM-001
  // identity-issue-date ISO; parsing it must always return the same parts.
  const parts = splitIsoDateToVietnameseParts("2020-06-07");
  assert.equal(parts.day, "07");
  assert.equal(parts.month, "06");
  assert.equal(parts.year, "2020");
});

test("formatVietnameseDateParts preserves leading zeros", () => {
  const parts: VietnameseDateParts = { day: "04", month: "07", year: "2026" };
  assert.equal(
    formatVietnameseDateParts(parts),
    "ngày 04 tháng 07 năm 2026",
  );
});

test("formatIdentityVietnameseDateParts omits the leading 'ngày'", () => {
  const parts: VietnameseDateParts = { day: "07", month: "06", year: "2020" };
  assert.equal(
    formatIdentityVietnameseDateParts(parts),
    "07 tháng 06 năm 2020",
  );
});

test("formatIdentityVietnameseDateParts returns empty for incomplete parts", () => {
  assert.equal(formatIdentityVietnameseDateParts(null), "");
  assert.equal(
    formatIdentityVietnameseDateParts({ day: "07", month: "", year: "2020" }),
    "",
  );
});

test("formatVietnameseDateParts returns empty string for incomplete parts", () => {
  assert.equal(
    formatVietnameseDateParts({ day: "", month: "07", year: "2026" }),
    "",
  );
  assert.equal(
    formatVietnameseDateParts({ day: "04", month: "", year: "2026" }),
    "",
  );
  assert.equal(
    formatVietnameseDateParts({ day: "04", month: "07", year: "" }),
    "",
  );
  assert.equal(formatVietnameseDateParts(null), "");
  assert.equal(formatVietnameseDateParts(undefined), "");
});

test("formatSlashDate emits dd/mm/yyyy with leading zeros preserved", () => {
  assert.equal(
    formatSlashDate({ day: "04", month: "07", year: "2026" }),
    "04/07/2026",
  );
  assert.equal(
    formatSlashDate({ day: "26", month: "12", year: "2025" }),
    "26/12/2025",
  );
});

test("formatSlashDate returns empty string for incomplete parts", () => {
  assert.equal(formatSlashDate(null), "");
  assert.equal(formatSlashDate({ day: "04", month: "", year: "2026" }), "");
});