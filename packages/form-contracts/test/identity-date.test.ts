import { test } from "node:test";
import assert from "node:assert/strict";

import {
  IDENTITY_ISSUE_DATE_PREFIX,
  formatIdentityIssueDateLine,
  mapIdentityIssueDateParts,
} from "../src/bm-form-mapping/identity-date.js";

test("mapIdentityIssueDateParts splits ISO date", () => {
  const parts = mapIdentityIssueDateParts("2020-06-07");
  assert.equal(parts.day, "07");
  assert.equal(parts.month, "06");
  assert.equal(parts.year, "2020");
});

test("mapIdentityIssueDateParts returns empty parts for empty input", () => {
  assert.deepEqual(mapIdentityIssueDateParts(""), {
    day: "",
    month: "",
    year: "",
  });
  assert.deepEqual(mapIdentityIssueDateParts(null), {
    day: "",
    month: "",
    year: "",
  });
  assert.deepEqual(mapIdentityIssueDateParts(undefined), {
    day: "",
    month: "",
    year: "",
  });
});

test("formatIdentityIssueDateLine emits BM-001 expected wording", () => {
  // The exact sentence the BM-001 final audit asserts:
  //   "Cấp ngày 07 tháng 06 năm 2020"
  // Leading zeros on day and month are preserved by the toolkit so the
  // wording matches the BM-001 DOCX template's expected text.
  assert.equal(
    formatIdentityIssueDateLine("2020-06-07"),
    "Cấp ngày 07 tháng 06 năm 2020",
  );
});

test("formatIdentityIssueDateLine returns empty for missing input", () => {
  assert.equal(formatIdentityIssueDateLine(""), "");
  assert.equal(formatIdentityIssueDateLine(null), "");
  assert.equal(formatIdentityIssueDateLine(undefined), "");
});

test("formatIdentityIssueDateLine uses the canonical prefix", () => {
  assert.equal(IDENTITY_ISSUE_DATE_PREFIX, "Cấp ngày");
});