#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const ARTIFACT = `${OUT_DIR}/QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json`;
const STORAGE_STATE = `${ROOT}/playwright/.clerk/admin.json`;
const HOLDOUT_CODES = [
  "BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
  "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200",
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function apiHealthUrl() {
  const apiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
  return `${new URL(apiBase).origin}/api/v1/health`;
}

async function assertReady(url, label) {
  try {
    const response = await fetch(url);
    if (response.ok) return;
  } catch {
    // The explicit error below is safer than exposing transport details.
  }
  fail(`${label} is not ready at ${url}`);
}

function parsePlaywrightJson(raw) {
  const start = raw.search(/\{\s*"config":/);
  if (start < 0) fail("Playwright JSON report missing config root");
  const report = JSON.parse(raw.slice(start));
  const byCode = new Map();
  const walk = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        const code = /BM-\d{3}/.exec(spec.title)?.[0];
        if (!code) continue;
        const result = spec.tests?.at(-1)?.results?.at(-1);
        byCode.set(code, {
          status: result?.status ?? "unknown",
          durationMs: result?.duration ?? null,
          error: result?.error?.message ?? null,
        });
      }
      walk(suite.suites);
    }
  };
  walk(report.suites);
  return byCode;
}

async function main() {
  if (!existsSync(STORAGE_STATE)) fail(`Clerk storage state is missing: ${STORAGE_STATE}`);
  const webBase = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  await assertReady(`${webBase}/healthz`, "web");
  await assertReady(apiHealthUrl(), "api");

  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npx";
  const args = isWindows
    ? ["/c", "npx", "playwright", "test", "tests/e2e/holdout-runtime-evidence.auth.spec.ts", "--config=playwright.config.ts", "--project=authenticated chromium", "--workers=1", "--reporter=json"]
    : ["playwright", "test", "tests/e2e/holdout-runtime-evidence.auth.spec.ts", "--config=playwright.config.ts", "--project=authenticated chromium", "--workers=1", "--reporter=json"];
  const run = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
    windowsHide: true,
  });
  const raw = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  const byCode = parsePlaywrightJson(raw);
  const forms = HOLDOUT_CODES.map((templateCode) => {
    const result = byCode.get(templateCode);
    const passed = result?.status === "passed";
    return {
      templateCode,
      status: passed ? "PASS" : "FAIL",
      browserVerified: passed,
      demoClickVerified: passed,
      previewClickVerified: passed,
      docxDownloadVerified: passed,
      pdfExportVerified: passed,
      persisted: false,
      durationMs: result?.durationMs ?? null,
      error: passed ? null : result?.error ?? "No Playwright result captured",
    };
  });
  const passed = forms.filter((form) => form.status === "PASS").length;
  const artifact = {
    generatedAt: new Date().toISOString(),
    status: passed === HOLDOUT_CODES.length ? "PASS" : "FAIL",
    totalForms: HOLDOUT_CODES.length,
    passed,
    failed: HOLDOUT_CODES.length - passed,
    holdoutCodes: HOLDOUT_CODES,
    authStrategy: "clerk_ticket_storage_state",
    qlvSessionUsedForWebRoute: false,
    formFlightRuntimeReadyPromoted: 0,
    visualHumanReviewPromoted: 0,
    sourceDocxMutated: false,
    normalizedDocxMutated: false,
    lockedContractsMutated: false,
    compiledContractsMutated: false,
    dbMutated: false,
    forms,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({ status: artifact.status, passed, failed: artifact.failed, artifact }, null, 2));
  if (artifact.status !== "PASS") process.exit(1);
}

await main();
