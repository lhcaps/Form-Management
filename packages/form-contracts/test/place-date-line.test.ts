import { test } from "node:test";
import assert from "node:assert/strict";

import { formatVietnamesePlaceDateLine } from "../src/bm-form-mapping/place-date-line.js";

test("formatVietnamesePlaceDateLine with place and date", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "2026-07-04",
    }),
    "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
  );
});

test("formatVietnamesePlaceDateLine falls back to defaultPlace when place is empty", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "",
      isoDate: "2026-07-04",
      defaultPlace: "TP. Hồ Chí Minh",
    }),
    "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
  );
});

test("formatVietnamesePlaceDateLine falls back when place is whitespace", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "   ",
      isoDate: "2026-07-04",
      defaultPlace: "Hà Nội",
    }),
    "Hà Nội, ngày 04 tháng 07 năm 2026",
  );
});

test("formatVietnamesePlaceDateLine without place and no default has no fake place", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "",
      isoDate: "2026-07-04",
    }),
    "ngày 04 tháng 07 năm 2026",
  );
});

test("formatVietnamesePlaceDateLine without date does not fabricate a date", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "",
    }),
    "TP. Hồ Chí Minh,",
  );
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: null,
    }),
    "TP. Hồ Chí Minh,",
  );
});

test("formatVietnamesePlaceDateLine with both empty returns empty string", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({ place: "", isoDate: "" }),
    "",
  );
  assert.equal(
    formatVietnamesePlaceDateLine({ place: null, isoDate: undefined }),
    "",
  );
});

test("formatVietnamesePlaceDateLine does not fabricate on malformed date", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "not-a-date",
    }),
    "TP. Hồ Chí Minh,",
  );
});

test("formatVietnamesePlaceDateLine matches BM-001 audit header expectation", () => {
  // The exact line the BM-001 final audit asserts:
  //   "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026"
  // The toolkit emits the leading zeros on day and month so the rendered
  // DOCX text stays byte-stable across BMs.
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "2026-07-04",
      defaultPlace: "TP. Hồ Chí Minh",
    }),
    "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
  );
});