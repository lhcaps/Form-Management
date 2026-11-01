#!/usr/bin/env node
/**
 * parse-batch4-preview-click.mjs
 *
 * Inline-friendly Playwright --reporter=json parser for the batch 4
 * preview-click smoke. Tolerates PowerShell UTF-16 LE (BOM FF FE) capture
 * and dotenv banner lines that may collapse onto the JSON.
 *
 * Usage:
 *   node scripts/audit/parse-batch4-preview-click.mjs <input.json> <output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error(
    "usage: parse-batch4-preview-click.mjs <input.json> <output.json>",
  );
  process.exit(2);
}

const buf = readFileSync(inPath);
// Auto-detect UTF-16 LE BOM (FF FE). PowerShell `>` redirection of an npx
// process routinely emits UTF-16 LE; re-decode as such.
let raw;
if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
  raw = buf.toString("utf16le");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
} else {
  raw = buf.toString("utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
}

// Find the JSON payload. PowerShell may prepend dotenv-like banner lines
// before the '{' that begins the Playwright JSON.
const anchor = raw.indexOf('"config":');
if (anchor < 0) {
  console.error("could not locate '\"config\":' in", inPath);
  process.exit(1);
}
let start = -1;
for (let i = anchor; i >= 0; i--) {
  if (raw[i] === "{") {
    start = i;
    break;
  }
}
if (start < 0) {
  console.error(
    "could not find opening '{' before 'config' anchor in",
    inPath,
  );
  process.exit(1);
}

let depth = 0;
let end = -1;
for (let i = start; i < raw.length; i++) {
  const c = raw[i];
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

const data = JSON.parse(raw.slice(start, end));

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
