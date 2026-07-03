import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");
const source = readFileSync(sourcePath, "utf8");

test("dashboard uses the shared KpiCard instead of raw KPI article markup", () => {
  assert.match(source, /@\/components\/common\/kpi-card/);
  assert.doesNotMatch(source, /<article\b/);
  assert.doesNotMatch(
    source,
    /bg-blue-50 text-blue-700|bg-indigo-50 text-indigo-700|bg-amber-50 text-amber-700|bg-emerald-50 text-emerald-700/,
  );
});

test("dashboard reload action uses shadcn Button instead of a hand-built button", () => {
  assert.match(source, /@\/components\/ui\/button/);
  assert.doesNotMatch(source, /<button\b/);
});
