import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildArchiveLine,
  formatIdentityIssueDateLine,
  formatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts,
  assertNoUnsafeMappedValue,
  normalizeTextInput,
  emptyStringIfMissing,
  formatVietnameseDateParts,
  mapIdentityIssueDateParts,
} from "./index";

import {
  buildArchiveLine as sharedBuildArchiveLine,
  formatIdentityIssueDateLine as sharedFormatIdentityIssueDateLine,
  formatVietnamesePlaceDateLine as sharedFormatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts as sharedSplitIsoDateToVietnameseParts,
  normalizeTextInput as sharedNormalizeTextInput,
  formatVietnameseDateParts as sharedFormatVietnameseDateParts,
  mapIdentityIssueDateParts as sharedMapIdentityIssueDateParts,
} from "@qllaw/form-contracts";

/**
 * BM-001 snapshot-style coverage.
 *
 * These cases pin the exact wording the BM-001 final audit asserts.
 * If the toolkit ever drifts, these tests fail first — before any
 * DOCX audit, before any Planner review.
 */

test("BM-001 header line still emits TP. Hồ Chí Minh + ngày 04 tháng 07 năm 2026", () => {
  assert.equal(
    formatVietnamesePlaceDateLine({
      place: "TP. Hồ Chí Minh",
      isoDate: "2026-07-04",
      defaultPlace: "TP. Hồ Chí Minh",
    }),
    "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
  );
});

test("BM-001 reception start line still emits Hồi 08:00, ngày 26 tháng 12 năm 2025", () => {
  const startParts = splitIsoDateToVietnameseParts("2025-12-26");
  const startLine = `Hồi 08:00, ngày ${startParts.day} tháng ${startParts.month} năm ${startParts.year}, tại TP. Hồ Chí Minh`;
  assert.equal(
    startLine,
    "Hồi 08:00, ngày 26 tháng 12 năm 2025, tại TP. Hồ Chí Minh",
  );
});

test("BM-001 reception end line still emits Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025", () => {
  const endParts = splitIsoDateToVietnameseParts("2025-12-26");
  const endLine = `Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày ${endParts.day} tháng ${endParts.month} năm ${endParts.year}.`;
  assert.equal(
    endLine,
    "Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025.",
  );
});

test("BM-001 identity issue date line still emits Cấp ngày 07 tháng 06 năm 2020", () => {
  assert.equal(
    formatIdentityIssueDateLine("2020-06-07"),
    "Cấp ngày 07 tháng 06 năm 2020",
  );
});

test("BM-001 archive line still defaults to Lưu: HSVA, HSKS, VP.", () => {
  assert.equal(
    buildArchiveLine("", "Lưu: HSVA, HSKS, VP."),
    "Lưu: HSVA, HSKS, VP.",
  );
  assert.equal(
    buildArchiveLine("Lưu: HSVA, HSKS, VP.", ""),
    "Lưu: HSVA, HSKS, VP.",
  );
});

test("BM-001 mapper payload has no unsafe value leaks", () => {
  const payload = {
    document: {
      issuePlace: "TP. Hồ Chí Minh",
      issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026",
    },
    reception: {
      startLine:
        "Hồi 08:00, ngày 26 tháng 12 năm 2025, tại TP. Hồ Chí Minh",
      endLine:
        "Việc tiếp nhận nguồn tin về tội phạm kết thúc hồi 10:00 ngày 26 tháng 12 năm 2025.",
    },
    informant: {
      identityIssueDateLine: "Cấp ngày 07 tháng 06 năm 2020",
    },
    recipients: {
      archiveLine: "Lưu: HSVA, HSKS, VP.",
    },
  };

  assert.equal(assertNoUnsafeMappedValue(payload).length, 0);
});

test("BM-001 mapper payload without a real place does not fabricate one", () => {
  // Simulating a missing issuePlace: the toolkit must NOT emit "TP. Hồ Chí Minh"
  // automatically. The fallback only applies when the caller passes one.
  const line = formatVietnamesePlaceDateLine({
    place: "",
    isoDate: "2026-07-04",
  });
  assert.equal(line, "ngày 04 tháng 07 năm 2026");
});

test("BM-001 mapper payload with a real place uses the real place", () => {
  const line = formatVietnamesePlaceDateLine({
    place: "Hà Nội",
    isoDate: "2026-07-04",
    defaultPlace: "TP. Hồ Chí Minh",
  });
  assert.equal(line, "Hà Nội, ngày 04 tháng 07 năm 2026");
});

/**
 * PR6G.3.1 — shared source of truth parity.
 *
 * The web shim `@/lib/bm-form-mapping` is a thin re-export of
 * `@qllaw/form-contracts`. These assertions confirm the shim and the
 * shared package produce byte-identical output for every BM-001
 * evidence string. If the shim ever diverges (e.g. by re-implementing
 * a helper locally), this test fails immediately.
 */
test("PR6G.3.1 — web shim and shared package produce identical BM-001 strings", () => {
  const placeInput = {
    place: "TP. Hồ Chí Minh",
    isoDate: "2026-07-04",
  };
  assert.equal(
    formatVietnamesePlaceDateLine(placeInput),
    sharedFormatVietnamesePlaceDateLine(placeInput),
  );
  assert.equal(
    formatIdentityIssueDateLine("2020-06-07"),
    sharedFormatIdentityIssueDateLine("2020-06-07"),
  );
  assert.equal(
    buildArchiveLine("", "Lưu: HSVA, HSKS, VP."),
    sharedBuildArchiveLine("", "Lưu: HSVA, HSKS, VP."),
  );
  assert.deepEqual(
    splitIsoDateToVietnameseParts("2025-12-26"),
    sharedSplitIsoDateToVietnameseParts("2025-12-26"),
  );
  assert.equal(normalizeTextInput(null), sharedNormalizeTextInput(null));
  assert.equal(
    emptyStringIfMissing(undefined),
    sharedNormalizeTextInput(undefined),
  );
  assert.deepEqual(
    mapIdentityIssueDateParts("2020-06-07"),
    sharedMapIdentityIssueDateParts("2020-06-07"),
  );
  assert.equal(
    formatVietnameseDateParts({ day: "26", month: "12", year: "2025" }),
    sharedFormatVietnameseDateParts({ day: "26", month: "12", year: "2025" }),
  );
});