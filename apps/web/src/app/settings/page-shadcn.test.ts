import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const webSrc = dirname(fileURLToPath(import.meta.url));
const webSrcRoot = join(webSrc, "..", "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSource(...segments: string[]) {
  return readFileSync(join(webSrcRoot, ...segments), "utf8");
}

// ---------------------------------------------------------------------------
// PR #11 — /settings PageShell/Table convergence guard
// ---------------------------------------------------------------------------

test("/settings page imports shared primitives (PageShell, PageHeader, PageSection, Button, Badge, Table)", () => {
  const src = readSource("app/settings/page.tsx");
  assert.match(src, /@\/components\/common\/page-shell/);
  assert.match(src, /@\/components\/ui\/button/);
  assert.match(src, /@\/components\/ui\/badge/);
  assert.match(src, /@\/components\/ui\/table/);
});

test("/settings page contains no raw <button>, <table>, <svg>", () => {
  const src = readSource("app/settings/page.tsx");
  assert.doesNotMatch(src, /<button\b/, "/settings must not use raw <button>");
  assert.doesNotMatch(src, /<table\b/, "/settings must not use raw <table>");
  assert.doesNotMatch(src, /<svg\b/, "/settings must not use raw <svg>");
});

test("/settings page no longer uses hardcoded bg-blue-50 text-blue-700 tone-pair badge", () => {
  const src = readSource("app/settings/page.tsx");
  assert.doesNotMatch(
    src,
    /bg-blue-50[^"]*text-blue-700/,
    "/settings must not use raw bg-blue-50 text-blue-700 tone-pair",
  );
  assert.doesNotMatch(
    src,
    /<span[^>]*bg-blue-50\b/,
    "/settings must not use bg-blue-50 on a custom <span> badge",
  );
});

test("/settings page no longer uses dark surface classes", () => {
  const src = readSource("app/settings/page.tsx");
  assert.doesNotMatch(src, /bg-slate-950/, "/settings must not use bg-slate-950");
  assert.doesNotMatch(src, /bg-slate-900(?!\/)/, "/settings must not use bg-slate-900");
  assert.doesNotMatch(src, /bg-black(?!\/)/, "/settings must not use bg-black");
});

test("/settings page does not use bg-primary as card/table/page surface", () => {
  const src = readSource("app/settings/page.tsx");
  // bg-primary is only allowed for primary actions / active nav / brand
  // accents. /settings has no primary action — only a reload button — so
  // bg-primary must not appear on cards/tables/page surface.
  assert.doesNotMatch(
    src,
    /<div[^>]*bg-primary[^"]*p-[0-9]+[^"]*shadow-sm/,
    "/settings must not use bg-primary as card surface",
  );
  assert.doesNotMatch(
    src,
    /<section[^>]*bg-primary\b/,
    "/settings must not use bg-primary as section surface",
  );
});

test("/settings page preserves settings data sources and labels", () => {
  const src = readSource("app/settings/page.tsx");
  // API helpers — must remain wired to preserve behavior.
  assert.match(src, /fetchCurrentAgency/);
  assert.match(src, /fetchOfficials/);
  assert.match(src, /fetchMyTemplates/);
  assert.match(src, /useAuth/);
  // Endpoint — fetchMyTemplates uses readApi internally; surface the
  // endpoint string to confirm the call is unchanged.
  assert.match(src, /templates-api/);
  // Vietnamese labels — all preserved.
  for (const label of [
    "Cấu hình",
    "Thông tin phiên đăng nhập",
    "Tải lại",
    "Đang tải...",
    "Người dùng hiện tại",
    "Cơ quan",
    "Trạng thái hệ thống",
    "Biểu mẫu của tài khoản",
    "Cán bộ đang hoạt động",
    "Tên cơ quan",
    "Mã cơ quan",
    "Cơ quan cấp trên",
    "Chức danh",
    "Auth",
    "Session cookie",
    "Quyền hiện tại",
    "Tài khoản này chưa có biểu mẫu được gắn owner.",
    "Chưa có dữ liệu cán bộ.",
  ]) {
    assert.match(src, new RegExp(label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")), `${label} must remain in /settings`);
  }
});

test("/settings page preserves table column headers (Mã / Tên biểu mẫu / Giai đoạn and Họ tên / Chức vụ / Cơ quan)", () => {
  const src = readSource("app/settings/page.tsx");
  for (const header of [
    "Mã",
    "Tên biểu mẫu",
    "Giai đoạn",
    "Họ tên",
    "Chức vụ",
    "Cơ quan",
  ]) {
    assert.match(src, new RegExp(`>${header}<`), `${header} must remain as a column header`);
  }
});

test("/settings page preserves empty/loading fallback copy", () => {
  const src = readSource("app/settings/page.tsx");
  assert.match(src, /Tài khoản này chưa có biểu mẫu được gắn owner\./);
  assert.match(src, /Chưa có dữ liệu cán bộ\./);
  assert.match(src, /Đang tải\.\.\./);
});

test("/settings page preserves InfoPanel / Row internal helpers (intentional read-only display, not primitive targets)", () => {
  const src = readSource("app/settings/page.tsx");
  assert.match(src, /function InfoPanel/);
  assert.match(src, /function Row/);
  // Row helper preserves dt/dd semantics for label/value display.
  assert.match(src, /<dt[^>]*text-slate-500/);
  assert.match(src, /<dd[^>]*text-right/);
});

test("/settings page preserves slice(0, 12) cap on myTemplates list", () => {
  const src = readSource("app/settings/page.tsx");
  // The original cap of 12 rows must remain — this is a behavior, not a
  // layout choice.
  assert.match(src, /myTemplates\.slice\(0, 12\)/);
});

test("/settings page preserves 3-column info grid (Người dùng hiện tại / Cơ quan / Trạng thái hệ thống)", () => {
  const src = readSource("app/settings/page.tsx");
  assert.match(src, /lg:grid-cols-3/);
  assert.match(src, /<InfoPanel title="Người dùng hiện tại"/);
  assert.match(src, /<h2[^>]*>Cơ quan<\/h2>/);
  assert.match(src, /<h2[^>]*>Trạng thái hệ thống<\/h2>/);
});