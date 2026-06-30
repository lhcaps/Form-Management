import assert from "node:assert/strict";
import test from "node:test";
import {
  collectDocxSlotOptions,
  lifecycleLabel,
  mergeCanonicalFormCatalog,
  runtimeBadge,
  studioPrimaryAction,
} from "./form-platform-catalog";

test("maps all Form Studio lifecycle states to explicit Vietnamese labels", () => {
  assert.equal(lifecycleLabel("NOT_INITIALIZED"), "Chưa khởi tạo");
  assert.equal(lifecycleLabel("DRAFT"), "Đang biên tập");
  assert.equal(lifecycleLabel("CHANGES_REQUESTED"), "Cần chỉnh sửa");
  assert.equal(lifecycleLabel("IN_REVIEW"), "Chờ duyệt");
  assert.equal(lifecycleLabel("APPROVED"), "Đã duyệt");
  assert.equal(lifecycleLabel("PUBLISHED"), "Đã xuất bản");
  assert.equal(lifecycleLabel("ARCHIVED"), "Đã lưu trữ");
});

test("maps lifecycle states to an actionable primary command", () => {
  assert.deepEqual(studioPrimaryAction("NOT_INITIALIZED"), {
    label: "Mở thiết kế",
    opensExistingVersion: false,
  });
  assert.deepEqual(studioPrimaryAction("IN_REVIEW"), {
    label: "Xem bản chờ duyệt",
    opensExistingVersion: true,
  });
  assert.deepEqual(studioPrimaryAction("PUBLISHED"), {
    label: "Tạo phiên bản mới",
    opensExistingVersion: false,
  });
  assert.deepEqual(studioPrimaryAction("ARCHIVED"), {
    label: "Xem lịch sử",
    opensExistingVersion: true,
  });
});

test("derives honest runtime badges independently from authoring status", () => {
  assert.deepEqual(runtimeBadge("AGENCY_PUBLISHED", true), {
    label: "Sẵn sàng mở",
    tone: "success",
  });
  assert.deepEqual(runtimeBadge("LOCKED_FILE", true), {
    label: "Đã xác minh",
    tone: "warning",
  });
  assert.deepEqual(runtimeBadge("LEGACY_BESPOKE", true), {
    label: "Tuỳ chỉnh legacy",
    tone: "legacy",
  });
  assert.deepEqual(runtimeBadge("GENERIC_FALLBACK", true), {
    label: "Mẫu chung",
    tone: "neutral",
  });
  assert.deepEqual(runtimeBadge("UNAVAILABLE", false), {
    label: "Chưa sẵn sàng",
    tone: "danger",
  });
});

test("merges legal metadata and platform state into one item per template code", () => {
  const merged = mergeCanonicalFormCatalog(
    [
      { code: "BM-001", title: "Legal title 1", number: 1 },
      { code: "BM-002", title: "Legal title 2", number: 2 },
      { code: "BM-001", title: "Duplicate should be ignored", number: 1 },
    ],
    [
      {
        templateCode: "BM-001",
        title: "DB title 1",
        runtime: {
          available: true,
          source: "LOCKED_FILE" as const,
          contractHash: null,
        },
      },
      {
        templateCode: "BM-002",
        title: "DB title 2",
        runtime: {
          available: false,
          source: "UNAVAILABLE" as const,
          contractHash: null,
        },
      },
    ],
  );

  assert.equal(merged.length, 2);
  assert.deepEqual(
    merged.map((item) => item.code),
    ["BM-001", "BM-002"],
  );
  assert.equal(merged[0]?.platform?.runtime.source, "LOCKED_FILE");
});

test("collects unique DOCX slot options from the selected baseline only", () => {
  assert.deepEqual(
    collectDocxSlotOptions({
      renderBindings: [
        { target: { kind: "SLOT", slotId: "document.number" } },
        { target: { kind: "SLOT", slotId: "document.date" } },
        { target: { kind: "SLOT", slotId: "document.number" } },
        { target: { kind: "TABLE", tableKey: "people" } },
      ],
    }),
    ["document.date", "document.number"],
  );
});
