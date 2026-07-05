/**
 * Cross-runtime parity smoke test: the public barrel re-exports the same
 * symbols that web's bm-form-mapping used in PR6G.3. This is a no-op
 * compile-time check that the contract surface stayed stable.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import * as bmFormMapping from "../src/bm-form-mapping/index.js";

test("bm-form-mapping barrel exposes every required helper", () => {
  // Date mapping
  assert.equal(typeof bmFormMapping.splitIsoDateToVietnameseParts, "function");
  assert.equal(typeof bmFormMapping.formatVietnameseDateParts, "function");
  assert.equal(typeof bmFormMapping.formatIdentityVietnameseDateParts, "function");
  assert.equal(typeof bmFormMapping.formatSlashDate, "function");

  // Place / date line
  assert.equal(typeof bmFormMapping.formatVietnamesePlaceDateLine, "function");

  // Text mapping
  assert.equal(typeof bmFormMapping.normalizeTextInput, "function");
  assert.equal(typeof bmFormMapping.emptyStringIfMissing, "function");
  assert.equal(typeof bmFormMapping.assertNoUnsafeMappedValue, "function");

  // Archive line
  assert.equal(typeof bmFormMapping.buildArchiveLine, "function");

  // Identity issue date
  assert.equal(typeof bmFormMapping.mapIdentityIssueDateParts, "function");
  assert.equal(typeof bmFormMapping.formatIdentityIssueDateLine, "function");
  assert.equal(bmFormMapping.IDENTITY_ISSUE_DATE_PREFIX, "Cấp ngày");
});

test("bm-form-mapping barrel re-exports produce stable BM-001 evidence strings", () => {
  // Exact strings the BM-001 audit asserts. If any of these drift, the
  // shared source of truth has been broken — fix the toolkit, do not
  // patch the BM-001 mapper to compensate.
  assert.equal(
    bmFormMapping.formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "2026-07-04",
    }),
    "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
  );
  assert.equal(
    bmFormMapping.formatIdentityIssueDateLine("2020-06-07"),
    "Cấp ngày 07 tháng 06 năm 2020",
  );
  assert.equal(
    bmFormMapping.formatVietnameseDateParts({
      day: "26",
      month: "12",
      year: "2025",
    }),
    "ngày 26 tháng 12 năm 2025",
  );
});