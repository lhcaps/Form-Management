#!/usr/bin/env node
/**
 * parse-batch4-visibility.mjs
 *
 * Inline-friendly Playwright --reporter=json parser that tolerates the
 * PowerShell UTF-16 → UTF-8 conversion artifacts AND the dotenv banner
 * lines collapsed together with the JSON body (banner can contain
 * literal `{` / `}` in `tip: ⌘ override existing { override: true }`,
 * which breaks naive brace counting).
 *
 * Strategy: anchor on the canonical Playwright JSON opener `"config"`
 * (which appears exactly once as a top-level key in the report),
 * then locate the last `}` in the file to use as the close.
 *
 * Usage:
 *   node scripts/audit/parse-batch4-visibility.mjs <input.json> <output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error(
    "usage: parse-batch4-visibility.mjs <input.json> <output.json>",
  );
  process.exit(2);
}

const raw = readFileSync(inPath, "utf8");
const cleaned = raw.replace(/^\uFEFF/, "");

const anchor = cleaned.indexOf('"config"');
if (anchor < 0) {
  console.error("could not locate '\"config\"' in", inPath);
  process.exit(1);
}
let start = -1;
for (let i = anchor; i >= 0; i--) {
  if (cleaned[i] === "{") {
    start = i;
    break;
  }
}
if (start < 0) {
  console.error("could not find opening '{' before 'config' anchor in", inPath);
  process.exit(1);
}

// Walk forward tracking brace depth, but skip over JSON strings so
// `{` / `}` inside string values don't pollute the count.
let depth = 0;
let end = -1;
let inString = false;
let escape = false;
for (let i = start; i < cleaned.length; i++) {
  const c = cleaned[i];
  if (escape) { escape = false; continue; }
  if (c === "\\") { escape = true; continue; }
  if (c === '"') { inString = !inString; continue; }
  if (inString) continue;
  if (c === "{") depth++;
  else if (c === "}") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end < 0) {
  console.error("could not find matching close brace in", inPath);
  process.exit(1);
}

const data = JSON.parse(cleaned.slice(start, end));

const codes = [];
function walkSuites(suites) {
  for (const s of suites ?? []) {
    for (const spec of s.specs ?? []) {
      const m = /BM-\d+\b/.exec(spec.title);
      const code = m ? m[0] : null;
      for (const t of spec.tests ?? []) {
        const result = t.results?.[t.results.length - 1];
        codes.push({
          templateCode: code,
          title: spec.title,
          file: spec.file,
          status: result?.status ?? "unknown",
          durationMs: result?.duration ?? null,
          errorMessage: result?.error?.message ?? null,
        });
      }
    }
    walkSuites(s.suites);
  }
}
walkSuites(data.suites);

const summary = {
  stats: data.stats ?? null,
  durationMs: data.stats?.duration ?? null,
  expected: data.stats?.expected ?? null,
  unexpected: data.stats?.unexpected ?? null,
  flaky: data.stats?.flaky ?? null,
  skipped: data.stats?.skipped ?? null,
  passed:
    (data.stats?.expected ?? 0) -
    (data.stats?.unexpected ?? 0) -
    (data.stats?.flaky ?? 0),
  codes,
};
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.stats ?? {}, null, 2));