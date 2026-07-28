#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputDir = join(root, "docs", "audit", "final-213-customer-ready", "release-integration");
const queuePath = join(outputDir, "phase15b3-ui-demo-queue-213.json");
const resultsPath = join(outputDir, "phase15b3-ui-demo-results-213.json");
const summaryPath = join(outputDir, "phase15b3-ui-demo-summary.json");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/u, ""));
const queue = readJson(queuePath);
const results = queue.rows.map((row) => ({
  FORM_CODE: row.FORM_CODE,
  EXPECTED_ROUTE: row.EXPECTED_ROUTE,
  EFFECTIVE_ROUTE: null,
  IDENTITY_PASS: false,
  EDITOR_PASS: false,
  STATIC_CAPABILITY: row.STATIC_CAPABILITY,
  ACTUAL_BUTTON_STATE: "NOT_OBSERVED",
  CAPABILITY_POLICY_PASS: false,
  DATA_SOURCE_USED: "UNKNOWN_SOURCE",
  CLICK_ATTEMPTED: false,
  CLICK_PASS: false,
  REQUIRED_FIELDS_PASS: false,
  SECTION_COVERAGE_PASS: false,
  CONTROL_TYPE_PASS: false,
  STALE_VALUE_COUNT: null,
  UNKNOWN_KEY_WARNING_COUNT: null,
  IDENTIFIER_POLICY_PASS: false,
  CONSOLE_PASS: false,
  NETWORK_PASS: false,
  FINAL_VERDICT: "UI_DEMO_NOT_EXECUTED",
  BLOCKING_REASON: "WEB_UNAVAILABLE_PREFLIGHT",
  SCREENSHOT_PATH: null,
  TRACE_PATH: null,
  evidenceLayer: "NOT_REAL_UI",
  apiOnlyEvidence: false,
  staticOnlyEvidence: false,
}));

const runId = `PHASE15B3_UI_${new Date().toISOString().replace(/[-:.TZ]/gu, "").slice(0, 14)}`;
const batches = [];
for (let index = 0; index < results.length; index += 10) {
  batches.push({
    batchId: `B${String(Math.floor(index / 10) + 1).padStart(2, "0")}`,
    formCodes: results.slice(index, index + 10).map(({ FORM_CODE }) => FORM_CODE),
    status: "NOT_EXECUTED_WEB_UNAVAILABLE",
  });
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, "phase15b3-ui-demo-run-manifest.json"), JSON.stringify({
  schema: "qllaw.phase15b3.ui_demo_run_manifest/v1",
  runId,
  generatedAt: new Date().toISOString(),
  browserVersion: null,
  viewport: { width: 1440, height: 900 },
  locale: "vi-VN",
  timezone: "Asia/Ho_Chi_Minh",
  batchSize: 10,
  batchCount: batches.length,
  batches,
  sourceHashes: Object.fromEntries(queue.rows.map((row) => [row.FORM_CODE, row.SOURCE_HASHES])),
  resumeSupported: true,
  status: "NOT_EXECUTED_WEB_UNAVAILABLE",
}, null, 2));

writeFileSync(resultsPath, JSON.stringify({
  schema: "qllaw.phase15b3.ui_demo_results/v1",
  runId,
  generatedAt: new Date().toISOString(),
  registeredForms: 213,
  attempted: 0,
  evidenceLayer: "NOT_REAL_UI",
  results,
}, null, 2));

writeFileSync(summaryPath, JSON.stringify({
  schema: "qllaw.phase15b3.ui_demo_summary/v1",
  runId,
  registeredForms: 213,
  attempted: 0,
  exposedExpected: 185,
  hiddenExpected: 28,
  exposedPass: 0,
  hiddenPass: 0,
  fail: 0,
  notExecuted: 213,
  identityFailures: 213,
  capabilityFailures: 213,
  clickFailures: 185,
  fieldFailures: 185,
  controlFailures: 185,
  consoleFailures: 0,
  networkFailures: 213,
  fallbackFailures: 0,
  identifierPolicyFailures: 213,
  finalVerdict: "BLOCKED_AUTH",
  blocker: "WEB_UNAVAILABLE_PREFLIGHT",
  evidenceLayer: "NOT_REAL_UI",
}, null, 2));

writeFileSync(join(outputDir, "phase15b3-ui-demo-hidden-28.json"), JSON.stringify(results.filter((row) => row.STATIC_CAPABILITY === "DEMO_NOT_EXPOSED_BY_PRODUCT"), null, 2));
writeFileSync(join(outputDir, "phase15b3-ui-demo-exposed-185.json"), JSON.stringify(results.filter((row) => row.STATIC_CAPABILITY === "DEMO_READY"), null, 2));
writeFileSync(join(outputDir, "phase15b3-ui-demo-console-network.json"), JSON.stringify(results.map(({ FORM_CODE, CONSOLE_PASS, NETWORK_PASS, BLOCKING_REASON }) => ({ FORM_CODE, CONSOLE_PASS, NETWORK_PASS, BLOCKING_REASON })), null, 2));

if (!existsSync(queuePath)) process.exitCode = 1;
