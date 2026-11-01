#!/usr/bin/env node
/**
 * smoke-213-template-routes.mjs
 *
 * Lightweight browser-less smoke test over /templates/BM-NNN for all 213
 * forms. Hits the local dev server and asserts:
 *
 *   - HTTP 200 (no global 404 / 5xx).
 *   - Response body contains the BM-NNN code text (so we know the page
 *     route actually rendered that template, not some "not found" stub).
 *
 * This is a ROUTE-LEVEL smoke. It does NOT authenticate with Clerk and
 * does NOT click the preview button. The full browser-smoke (preview,
 * save, export) is gated on the project-approved Clerk ticket strategy
 * which is out of scope for this task.
 *
 * Usage:
 *   node scripts/audit/smoke-213-template-routes.mjs            # full sweep
 *   node scripts/audit/smoke-213-template-routes.mjs --code BM-001
 *
 * Exit codes:
 *   0 = all routes returned 200.
 *   1 = at least one route returned non-200.
 */

import { setTimeout as sleep } from "node:timers/promises";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const ONLY_CODE = (() => {
  const idx = process.argv.indexOf("--code");
  if (idx < 0) return null;
  const raw = String(process.argv[idx + 1] || "").toUpperCase();
  return /^BM-\d{3}$/.test(raw) ? raw : null;
})();

const HOST = process.env.SMOKE_HOST || "http://localhost:3000";
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY || 8);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 30_000);
const RETRY_ON_5XX = Number(process.env.SMOKE_RETRY || 1);

function buildCodes() {
  const codes = [];
  for (let n = 1; n <= 213; n++) {
    codes.push(`BM-${String(n).padStart(3, "0")}`);
  }
  return codes;
}

async function checkRoute(code) {
  const url = `${HOST}/templates/${code}`;
  for (let attempt = 0; attempt <= RETRY_ON_5XX; attempt++) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const res = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (res.status >= 500 && attempt < RETRY_ON_5XX) {
        await sleep(500);
        continue;
      }
      const body = await res.text();
      const hasCode = body.includes(code);
      return {
        templateCode: code,
        url,
        status: res.status,
        bodyBytes: body.length,
        hasCodeInBody: hasCode,
        attempt,
      };
    } catch (err) {
      if (attempt < RETRY_ON_5XX) {
        await sleep(500);
        continue;
      }
      return {
        templateCode: code,
        url,
        status: 0,
        bodyBytes: 0,
        hasCodeInBody: false,
        attempt,
        error: String(err?.message || err),
      };
    }
  }
}

async function main() {
  const codes = ONLY_CODE ? [ONLY_CODE] : buildCodes();
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < codes.length) {
      const idx = cursor++;
      const code = codes[idx];
      results.push(await checkRoute(code));
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, codes.length); i++) workers.push(worker());
  await Promise.all(workers);

  const counts = {
    total: results.length,
    http200: results.filter((r) => r.status === 200).length,
    httpNon200: results.filter((r) => r.status !== 200).length,
    hasCodeInBody: results.filter((r) => r.hasCodeInBody).length,
  };

  const failed = results.filter((r) => r.status !== 200 || !r.hasCodeInBody);
  const summary = {
    snapshotDate: new Date().toISOString(),
    host: HOST,
    onlyCode: ONLY_CODE,
    counts,
    failed: failed.map((r) => ({
      templateCode: r.templateCode,
      status: r.status,
      hasCodeInBody: r.hasCodeInBody,
      error: r.error,
    })),
    results,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = ONLY_CODE
    ? `${OUT_DIR}/QLLAW_213_TEMPLATE_BROWSER_SMOKE.${ONLY_CODE}.latest.json`
    : `${OUT_DIR}/QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.json`;
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const md = renderMarkdown(summary);
  const mdPath = ONLY_CODE
    ? `${OUT_DIR}/QLLAW_213_TEMPLATE_BROWSER_SMOKE.${ONLY_CODE}.latest.md`
    : `${OUT_DIR}/QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.md`;
  writeFileSync(mdPath, md);

  console.log(JSON.stringify(counts, null, 2));
  if (failed.length > 0) {
    console.log("FAILURES:");
    for (const f of failed) {
      console.log(`  ${f.templateCode}: status=${f.status} hasCode=${f.hasCodeInBody}`);
    }
    process.exitCode = 1;
  }
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# QLLAW 213 Template Browser Smoke — latest");
  lines.push("");
  lines.push(`> **Generated**: ${summary.snapshotDate}`);
  lines.push(`> **Host**: ${summary.host}`);
  lines.push(`> **Total**: ${summary.counts.total}`);
  if (summary.onlyCode) lines.push(`> **Filtered to**: ${summary.onlyCode}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---|");
  lines.push(`| HTTP 200 | ${summary.counts.http200} |`);
  lines.push(`| HTTP non-200 | ${summary.counts.httpNon200} |`);
  lines.push(`| Body contains BM code | ${summary.counts.hasCodeInBody} |`);
  lines.push("");
  if (summary.failed.length === 0) {
    lines.push("## Failures");
    lines.push("");
    lines.push("(none)");
  } else {
    lines.push("## Failures");
    lines.push("");
    lines.push("| Code | Status | Body has code | Error |");
    lines.push("|---|---|---|---|");
    for (const f of summary.failed) {
      lines.push(`| ${f.templateCode} | ${f.status} | ${f.hasCodeInBody} | ${f.error ?? "—"} |`);
    }
  }
  return lines.join("\n") + "\n";
}

main();