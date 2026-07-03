import assert from "node:assert/strict";
import Module from "node:module";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type StatusType =
  | "review"
  | "case"
  | "priority"
  | "formAuthoring"
  | "formRuntime"
  | "import";

const webSrcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cjsModule = Module as unknown as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown,
  ) => string;
};
const resolveFilename = cjsModule._resolveFilename;

cjsModule._resolveFilename = (request, parent, isMain, options) => {
  if (request.startsWith("@/")) {
    return resolveFilename.call(
      cjsModule,
      join(webSrcRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return resolveFilename.call(cjsModule, request, parent, isMain, options);
};

async function renderStatusBadge(type: StatusType, value: string) {
  const { StatusBadge } = await import("./status-badge");

  return renderToStaticMarkup(createElement(StatusBadge, { type, value }));
}

test("StatusBadge renders cases list status API values with domain labels", async () => {
  const received = await renderStatusBadge("case", "RECEIVED");
  const inProgress = await renderStatusBadge("case", "IN_PROGRESS");
  const waitingReview = await renderStatusBadge("case", "WAITING_REVIEW");
  const closed = await renderStatusBadge("case", "CLOSED");
  const draft = await renderStatusBadge("case", "DRAFT");

  assert.match(received, /Đã tiếp nhận/);
  assert.match(inProgress, /Đang xử lý/);
  assert.match(waitingReview, /Chờ duyệt/);
  assert.match(closed, /Đã đóng/);
  assert.match(draft, /Nháp/);
});

test("StatusBadge renders cases list priority API values with domain labels", async () => {
  const low = await renderStatusBadge("priority", "LOW");
  const normal = await renderStatusBadge("priority", "NORMAL");
  const high = await renderStatusBadge("priority", "HIGH");
  const urgent = await renderStatusBadge("priority", "URGENT");

  assert.match(low, /Thấp/);
  assert.match(normal, /Bình thường/);
  assert.match(high, /Cao/);
  assert.match(urgent, /Khẩn/);
});

// ---------------------------------------------------------------------------
// Phase: global badge tone hotfix — pin key variant decisions so a future
// regression that re-introduces a primary-navy `default` or a saturated
// passive variant is caught at the unit-test layer.
// ---------------------------------------------------------------------------

test("StatusBadge maps NORMAL priority to muted, not default/primary", async () => {
  const { StatusBadge } = await import("./status-badge");
  const markup = renderToStaticMarkup(
    createElement(StatusBadge, { type: "priority", value: "NORMAL" }),
  );
  assert.match(markup, /Bình thường/);
  // NORMAL must NOT use bg-primary text-primary-foreground (default).
  assert.doesNotMatch(
    markup,
    /bg-primary\s+text-primary-foreground/,
    "NORMAL priority must not render as a primary action chip",
  );
  assert.match(
    markup,
    /bg-muted\s+text-muted-foreground/,
    "NORMAL priority must render with the muted surface",
  );
});

test("StatusBadge maps HIGH priority to warning, URGENT to destructive", async () => {
  const { StatusBadge } = await import("./status-badge");
  const high = renderToStaticMarkup(
    createElement(StatusBadge, { type: "priority", value: "HIGH" }),
  );
  const urgent = renderToStaticMarkup(
    createElement(StatusBadge, { type: "priority", value: "URGENT" }),
  );
  assert.match(high, /Cao/);
  assert.match(
    high,
    /bg-amber-50\s+text-amber-700/,
    "HIGH priority must use the warning (amber-50) passive tint",
  );
  assert.match(urgent, /Khẩn/);
  assert.match(
    urgent,
    /bg-rose-50\s+text-rose-700/,
    "URGENT priority must use the destructive (rose-50) passive tint",
  );
});

test("StatusBadge maps DRAFT case status to muted", async () => {
  const { StatusBadge } = await import("./status-badge");
  const markup = renderToStaticMarkup(
    createElement(StatusBadge, { type: "case", value: "DRAFT" }),
  );
  assert.match(markup, /Nháp/);
  assert.match(
    markup,
    /bg-muted\s+text-muted-foreground/,
    "DRAFT case status must render with the muted surface",
  );
  assert.doesNotMatch(
    markup,
    /bg-primary\s+text-primary-foreground/,
    "DRAFT case status must not render as a primary action chip",
  );
});

test("StatusBadge maps RECEIVED case status to success (subtle emerald)", async () => {
  const { StatusBadge } = await import("./status-badge");
  const markup = renderToStaticMarkup(
    createElement(StatusBadge, { type: "case", value: "RECEIVED" }),
  );
  assert.match(markup, /Đã tiếp nhận/);
  assert.match(
    markup,
    /bg-emerald-50\s+text-emerald-700/,
    "RECEIVED case status must use the success (emerald-50) passive tint",
  );
});

test("StatusBadge renders every frozen import status with the canonical Vietnamese label", async () => {
  // PR #14 centralized the eight frozen import statuses in
  // status-badge.tsx (IMPORT_CONFIG). Labels are pinned here so a future
  // accidental rename shows up as a unit failure rather than a silent
  // visual change in the workspace.
  const expectations: Array<[string, RegExp]> = [
    ["UPLOADED", /Đã tải lên/],
    ["PARSED", /Đã trích xuất/],
    ["PARTIAL", /Có cảnh báo/],
    ["FAILED", /Lỗi/],
    ["CONFIRMED", /Đã xác nhận/],
    ["STORED_ONLY", /Đã lưu file/],
    ["PARSED_WITH_WARNINGS", /Có cảnh báo/],
    ["REJECTED", /Bị từ chối/],
  ];

  for (const [value, labelRe] of expectations) {
    const markup = await renderStatusBadge("import", value);
    assert.match(markup, labelRe, `import status ${value} should render ${labelRe}`);
  }
});

test("importStatusLabel returns the canonical Vietnamese label for every frozen status", async () => {
  const { importStatusLabel } = await import("./status-badge");

  const expectations: Array<[string, string]> = [
    ["UPLOADED", "Đã tải lên"],
    ["PARSED", "Đã trích xuất"],
    ["PARTIAL", "Có cảnh báo"],
    ["FAILED", "Lỗi"],
    ["CONFIRMED", "Đã xác nhận"],
    ["STORED_ONLY", "Đã lưu file"],
    ["PARSED_WITH_WARNINGS", "Có cảnh báo"],
    ["REJECTED", "Bị từ chối"],
  ];

  for (const [value, label] of expectations) {
    assert.equal(importStatusLabel(value), label);
  }

  // Defensive fallback: unknown / future statuses should pass through so
  // callers can render defensively without a guard.
  assert.equal(importStatusLabel("FUTURE_STATUS"), "FUTURE_STATUS");
});
