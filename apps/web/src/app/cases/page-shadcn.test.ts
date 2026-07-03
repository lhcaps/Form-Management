import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const source = readFileSync(sourcePath, "utf8");

test("cases page uses PageShell and shadcn primitives for browse and create controls", () => {
  assert.match(source, /@\/components\/common\/page-shell/);
  assert.match(source, /@\/components\/common\/status-badge/);
  assert.match(source, /@\/components\/ui\/button/);
  assert.match(source, /@\/components\/ui\/input/);
  assert.match(source, /@\/components\/ui\/select/);
  assert.match(source, /@\/components\/ui\/table/);
  assert.match(source, /@\/components\/ui\/textarea/);
});

test("cases page removes inline status tones and hand-built shells", () => {
  assert.doesNotMatch(source, /function statusTone|function priorityTone/);
  assert.doesNotMatch(
    source,
    /bg-blue-50 text-blue-700|bg-indigo-50 text-indigo-700|bg-amber-50 text-amber-700|bg-emerald-50 text-emerald-700|bg-rose-50 text-rose-700|bg-orange-50 text-orange-700/,
  );
  assert.doesNotMatch(source, /<button\b/);
  assert.doesNotMatch(source, /<table\b/);
  assert.doesNotMatch(source, /<svg\b/);
});

// ---------------------------------------------------------------------------
// Phase: global badge tone hotfix — guard cases table badge alignment
// so passive status / priority chips stay compact and do not wrap.
// ---------------------------------------------------------------------------

test("cases table badge cells are align-middle and whitespace-nowrap", () => {
  // The status and priority cells must be `whitespace-nowrap align-middle`
  // so the badge does not wrap on normal desktop width and stays
  // vertically centered relative to the row.
  const statusCellMatch =
    /<TableCell[^>]*>\s*<StatusBadge\s+type="case"[^/]*\/>\s*<\/TableCell>/.exec(source);
  assert.ok(statusCellMatch, "status TableCell wrapper must exist");
  assert.match(statusCellMatch[0], /whitespace-nowrap/);
  assert.match(statusCellMatch[0], /align-middle/);

  const priorityCellMatch =
    /<TableCell[^>]*>\s*<StatusBadge\s+type="priority"[^/]*\/>\s*<\/TableCell>/.exec(source);
  assert.ok(priorityCellMatch, "priority TableCell wrapper must exist");
  assert.match(priorityCellMatch[0], /whitespace-nowrap/);
  assert.match(priorityCellMatch[0], /align-middle/);
});

test("cases page does not introduce font-black on passive badge wrappers", () => {
  // The page-level Badge in the header must not use `font-black` (the
  // passive badge primitive uses `font-medium`).
  const headerBadgeMatch = /<Badge\s+variant="outline"[^>]*>/.exec(source);
  assert.ok(headerBadgeMatch, "cases page header Badge must exist");
  assert.doesNotMatch(
    headerBadgeMatch[0],
    /font-black/,
    "cases page header Badge must not use font-black",
  );
});

test("cases page preserves case API, query, create, and routing contracts", () => {
  assert.match(source, /readApi<CasesResponse>\(`\/cases\?\$\{params\.toString\(\)\}`/);
  assert.match(source, /params\.set\("pageSize", "20"\)/);
  assert.match(source, /router\.replace\(`\/cases/);
  assert.match(source, /readApi<CaseItem>\("\/cases",/);
  assert.match(source, /currentStage: "RECEPTION"/);
  assert.match(source, /currentStatus: "DRAFT"/);
  assert.match(source, /router\.push\(`\/cases\/\$\{item\.id\}`\)/);
});
