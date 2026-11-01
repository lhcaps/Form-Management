#!/usr/bin/env node
/**
 * parse-playwright-json.mjs
 *
 * Reads a Playwright --reporter=json output file and emits a small JSON
 * file of per-test results.
 *
 * Usage: node scripts/audit/parse-playwright-json.mjs <input.txt> <output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: parse-playwright-json.mjs <input.txt> <output.json>");
  process.exit(2);
}

const raw = readFileSync(inPath, "utf8");
// The dotenv banner lines start with `◇`. Strip them and find the JSON blob.
// Strip dotenv banner lines (the banner uses the U+25C7 diamond glyph —
// tolerate any encoding artifact, e.g. UTF-8 mis-decoded as Latin-1).
const stripped = raw
  .split(/\r?\n/)
  .filter(
    (line) =>
      !line.includes("injected env") && !line.includes("dotenvx.com"),
  )
  .join("\n");
// Find first `{` of the JSON object — Playwright emits a single JSON object.
const start = stripped.indexOf("{");
if (start < 0) {
  console.error("could not locate JSON start");
  process.exit(1);
}
// Walk to find matching close brace at depth 0 (object is at depth 0).
let depth = 0;
let end = -1;
for (let i = start; i < stripped.length; i++) {
  const c = stripped[i];
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
  console.error("could not find matching close brace");
  process.exit(1);
}

const jsonText = stripped.slice(start, end);
const data = JSON.parse(jsonText);

const codes = [];
function walkSuites(suites) {
  for (const s of suites ?? []) {
    for (const spec of s.specs ?? []) {
      const titleMatch = /BM-\d+\b/.exec(spec.title);
      const code = titleMatch ? titleMatch[0] : null;
      for (const t of spec.tests ?? []) {
        // `tests[]` is the retry chain; the last entry is the final result.
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
  passed: (data.stats?.expected ?? 0) - (data.stats?.unexpected ?? 0) - (data.stats?.flaky ?? 0),
  codes,
};
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.stats ?? {}, null, 2));
