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
// PR #10 — /reports shadcn/PageShell convergence guard
// ---------------------------------------------------------------------------

test("/reports page imports shared primitives (PageShell, PageHeader, PageSection, KpiCard, ErrorBanner, Button, Input, Table)", () => {
  const src = readSource("app/reports/page.tsx");
  assert.match(src, /@\/components\/common\/page-shell/);
  assert.match(src, /@\/components\/common\/kpi-card/);
  assert.match(src, /@\/components\/common\/error-banner/);
  assert.match(src, /@\/components\/ui\/button/);
  assert.match(src, /@\/components\/ui\/input/);
  assert.match(src, /@\/components\/ui\/table/);
});

test("/reports page contains no raw <button>, <input>, <table>, <svg>", () => {
  const src = readSource("app/reports/page.tsx");
  assert.doesNotMatch(src, /<button\b/, "/reports must not use raw <button>");
  assert.doesNotMatch(src, /<input\b/, "/reports must not use raw <input>");
  assert.doesNotMatch(src, /<table\b/, "/reports must not use raw <table>");
  assert.doesNotMatch(src, /<svg\b/, "/reports must not use raw <svg>");
});

test("/reports page no longer uses bg-zinc-950 text-white active period pill", () => {
  const src = readSource("app/reports/page.tsx");
  assert.doesNotMatch(
    src,
    /bg-zinc-950 text-white/,
    "active period pill must not use hardcoded dark slate",
  );
});

test("/reports page no longer uses hardcoded dark surfaces on inputs/cards/tables", () => {
  const src = readSource("app/reports/page.tsx");
  assert.doesNotMatch(src, /bg-slate-950/, "/reports must not use bg-slate-950");
  assert.doesNotMatch(src, /bg-slate-900(?!\/)/, "/reports must not use bg-slate-900");
  assert.doesNotMatch(src, /bg-black(?!\/)/, "/reports must not use bg-black");
});

test("/reports page no longer uses raw bg-red-50 error block", () => {
  const src = readSource("app/reports/page.tsx");
  assert.doesNotMatch(
    src,
    /border-red-200 bg-red-50/,
    "/reports must route errors through ErrorBanner",
  );
});

test("/reports page no longer uses raw bg-emerald-50/sky-50 KPI metric tone classes", () => {
  const src = readSource("app/reports/page.tsx");
  // KpiCard now owns the tone — page-level hardcoded metric text-sky/amber/emerald
  // is removed. Raw KPI article tags are also removed.
  assert.doesNotMatch(
    src,
    /<article\b[^>]*bg-white\b[^>]*p-4\b/,
    "/reports must not use raw KPI <article> cards",
  );
  assert.doesNotMatch(
    src,
    /text-sky-700|text-amber-700|text-emerald-700/,
    "/reports must not use raw KPI value tone classes (KpiCard owns tones)",
  );
});

test("/reports page preserves report API helper names and query params", () => {
  const src = readSource("app/reports/page.tsx");
  // API helpers — must remain wired to preserve behavior.
  assert.match(src, /buildReportCsv/);
  assert.match(src, /buildReportPrintHtml/);
  assert.match(src, /buildReportPath/);
  // Endpoint paths — must remain unchanged.
  assert.match(src, /\/cases\/reports\/summary\?/);
  // URLSearchParams must include period + anchorDate (shorthand or
  // explicit) so the runtime URL still emits period=YYYY-MM-DD.
  assert.match(src, /URLSearchParams/);
  assert.match(src, /period[,\s]/);
  assert.match(src, /anchorDate[,\s]/);
  assert.match(src, /\/document-review-queue/);
  // Period set and default — must remain unchanged.
  assert.match(src, /\["WEEK", "MONTH"\] as const/);
  assert.match(src, /useState<ReportPeriod>\("MONTH"\)/);
});

test("/reports page keeps CSV and print export behavior", () => {
  const src = readSource("app/reports/page.tsx");
  assert.match(src, /bao-cao-\$\{summary\.period\.toLowerCase\(\)\}-\$\{summary\.range\.from\}\.csv/);
  assert.match(src, /text\/csv;charset=utf-8;/);
  assert.match(src, /window\.open\("", "_blank"\)/);
  assert.match(src, /printWindow\.document\.write/);
});

test("/reports page preserves Vietnamese labels and headers", () => {
  const src = readSource("app/reports/page.tsx");
  for (const label of [
    "Báo cáo - Thống kê",
    "Kỳ báo cáo",
    "Ngày neo",
    "Tải lại",
    "Xuất CSV",
    "In / PDF",
    "Hồ sơ trong kỳ",
    "Dòng thống kê",
    "Chờ duyệt biểu mẫu",
    "Đã duyệt biểu mẫu",
    "Theo phường",
    "Theo tội danh",
  ]) {
    assert.match(src, new RegExp(label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")), `${label} must remain in /reports`);
  }
});

test("/reports page preserves rank-list helper (not a UI primitive, intentionally left as-is)", () => {
  const src = readSource("app/reports/page.tsx");
  assert.match(src, /function RankList/);
  // RankList is an internal read-only helper, not a primitive target. It uses
  // hardcoded tailwind classes that are intentional read-only display styling.
  // It must remain present so the byWard/byOffense sections keep rendering.
  assert.match(src, /byWard/);
  assert.match(src, /byOffense/);
});