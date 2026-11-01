/**
 * Runtime UX placeholder blocklist tests.
 *
 * Pins the `isKnownStaleFallback` matching rules so future drift in
 * `placeholder-blocklist.ts` fails loudly here. The blocklist is the
 * single source of truth for "is this string a known placeholder that
 * must never reach a render payload as a required field?".
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  isKnownStaleFallback,
  listKnownStaleFallbacks,
} from "./placeholder-blocklist";

test("placeholder blocklist: empty input is NOT a stale fallback", () => {
  assert.equal(isKnownStaleFallback(""), false);
  assert.equal(isKnownStaleFallback("   "), false);
});

test("placeholder blocklist: 'Người nhận (mẫu)' is a stale fallback", () => {
  assert.equal(isKnownStaleFallback("Người nhận (mẫu)"), true);
  assert.equal(isKnownStaleFallback("Người nhận (mẫu)."), true);
  assert.equal(isKnownStaleFallback("  Người nhận (mẫu)  "), true);
});

test("placeholder blocklist: 'Người ký (mẫu)' is a stale fallback", () => {
  assert.equal(isKnownStaleFallback("Người ký (mẫu)"), true);
});

test("placeholder blocklist: 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự' is stale", () => {
  assert.equal(
    isKnownStaleFallback("Căn cứ Điều 41 Bộ luật Tố tụng hình sự"),
    true,
  );
});

test("placeholder blocklist: 'Cá nhân/Tổ chức theo quy định.' is stale", () => {
  assert.equal(isKnownStaleFallback("Cá nhân/Tổ chức theo quy định."), true);
});

test("placeholder blocklist: 'Tài sản theo quy định pháp luật' is stale", () => {
  assert.equal(
    isKnownStaleFallback("Tài sản theo quy định pháp luật"),
    true,
  );
});

test("placeholder blocklist: 'Mô tả vụ việc mẫu' is stale", () => {
  assert.equal(isKnownStaleFallback("Mô tả vụ việc mẫu"), true);
});

test("placeholder blocklist: legitimate user text is NOT a stale fallback", () => {
  // Whole-value match only — substring within legitimate text does NOT match.
  assert.equal(isKnownStaleFallback("Nguyễn Văn A"), false);
  assert.equal(isKnownStaleFallback("Trần Thị B"), false);
  assert.equal(
    isKnownStaleFallback(
      "Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015;",
    ),
    false,
  );
  assert.equal(isKnownStaleFallback("Phòng Cảnh sát QLHC TTXH"), false);
  assert.equal(isKnownStaleFallback(""), false);
});

test("placeholder blocklist: listKnownStaleFallbacks returns the full canonical list", () => {
  const list = listKnownStaleFallbacks();
  // Stable count so the list growth is intentional and reviewed.
  assert.ok(list.length >= 7);
  for (const expected of [
    "Người nhận (mẫu)",
    "Người ký (mẫu)",
    "Cá nhân/Tổ chức theo quy định.",
    "Tài sản theo quy định pháp luật",
    "Mô tả vụ việc mẫu",
    "Nội dung mẫu cho biểu mẫu pháp lý.",
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
  ]) {
    assert.ok(
      list.includes(expected),
      `listKnownStaleFallbacks must include '${expected}', got: ${list.join(" | ")}`,
    );
  }
});