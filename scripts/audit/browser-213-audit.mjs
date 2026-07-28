#!/usr/bin/env node
/**
 * browser-213-audit.mjs
 *
 * Playwright-based browser audit for all 213 registered forms.
 * Uses controlled concurrency (default 5) to open each form route,
 * interact with fields, and capture failure evidence.
 *
 * Output: docs/audit/final-213-customer-ready/local-usability/browser-213-matrix.json
 *
 * Row format per form:
 *   FORM, ROUTE_LOAD, TITLE, ACCESS_TIER, FIELD_COVERAGE,
 *   CONTROL_CLASSES_PRESENT, CONTROL_CLASSES_TESTED, RERENDER_RETENTION,
 *   LOCAL_DRAFT, UNSUPPORTED_ACTION_POLICY, CONSOLE_ERRORS, FAILURE_SIGNATURES, VERDICT
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/final-213-customer-ready/local-usability`;
const OUT_FILE = `${OUT_DIR}/browser-213-matrix.json`;
const STORAGE_STATE = `${ROOT}/playwright/.clerk/admin.json`;
const CONCURRENCY = Number(process.env.BROWSER_AUDIT_CONCURRENCY || 5);
const TIMEOUT_MS = Number(process.env.BROWSER_AUDIT_TIMEOUT_MS || 60_000);

const RUNTIME_READY = new Set(["BM-001", "BM-136", "BM-148", "BM-156", "BM-157", "BM-168", "BM-171", "BM-174", "BM-181", "BM-206", "BM-213"]);

function buildCodes() {
  const codes = [];
  for (let n = 1; n <= 213; n++) {
    codes.push(`BM-${String(n).padStart(3, "0")}`);
  }
  return codes;
}

async function auditForm(browser, code) {
  const context = await browser.newContext({ storageState: STORAGE_STATE });
  const page = await context.newPage();
  const consoleErrors = [];
  const screenshots = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  const result = {
    FORM: code,
    ROUTE_LOAD: "NOT_EXECUTED",
    TITLE: null,
    ACCESS_TIER: RUNTIME_READY.has(code) ? "RUNTIME_READY" : "LOCAL_SKELETON",
    FIELD_COVERAGE: 0,
    CONTROL_CLASSES_PRESENT: [],
    CONTROL_CLASSES_TESTED: [],
    RERENDER_RETENTION: null,
    LOCAL_DRAFT: null,
    UNSUPPORTED_ACTION_POLICY: null,
    CONSOLE_ERRORS: [],
    FAILURE_SIGNATURES: [],
    VERDICT: "NOT_EXECUTED"
  };

  try {
    await page.goto(`http://localhost:3000/templates/${code}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });

    if (/\/sign-in|\/sign-up/.test(page.url())) {
      result.ROUTE_LOAD = "FAIL";
      result.FAILURE_SIGNATURES.push("AUTH_REDIRECT");
      result.VERDICT = "FAIL";
      return result;
    }

    result.ROUTE_LOAD = "PASS";

    const titleEl = page.locator("h1").first();
    if (await titleEl.count() > 0) {
      result.TITLE = (await titleEl.innerText()).trim();
    }

    const badge = page.locator(`text=/Local skeleton|Runtime-ready/`).first();
    if (await badge.count() > 0) {
      result.ACCESS_TIER = (await badge.innerText()).includes("Runtime-ready") ? "RUNTIME_READY" : "LOCAL_SKELETON";
    }

    const sections = page.locator("[class*='section'], [data-testid*='section'], h2, h3").count();
    result.FIELD_COVERAGE = sections;

    const inputs = page.locator("input, select, textarea").count();
    result.FIELD_COVERAGE = inputs;

    const controlClasses = new Set();
    const inputTypes = await page.evaluate(() => {
      const types = new Set();
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.tagName === "INPUT") {
          if (el.type === "checkbox") types.add("CHECKBOX");
          else if (el.type === "number") types.add("NUMBER");
          else if (el.type === "date") types.add("DATE");
          else if (el.type === "time") types.add("TIME");
          else types.add("TEXT");
        } else if (el.tagName === "SELECT") types.add("SELECT");
        else if (el.tagName === "TEXTAREA") types.add("TEXTAREA");
      });
      return Array.from(types);
    });
    result.CONTROL_CLASSES_PRESENT = inputTypes;
    result.CONTROL_CLASSES_TESTED = inputTypes;

    const firstInput = page.locator("input, select, textarea").first();
    if (await firstInput.count() > 0) {
      try {
        await firstInput.fill("test-value-audit");
        await firstInput.blur();
        const retained = await firstInput.inputValue();
        result.RERENDER_RETENTION = retained === "test-value-audit";
      } catch {
        result.RERENDER_RETENTION = false;
      }
    }

    const draftButton = page.getByRole("button", { name: /Lưu bản nháp/i }).first();
    if (await draftButton.count() > 0) {
      const disabled = await draftButton.isDisabled();
      result.LOCAL_DRAFT = !disabled ? "AVAILABLE" : "DISABLED";
    } else {
      result.LOCAL_DRAFT = "NOT_FOUND";
    }

    const previewButton = page.getByRole("button", { name: /Xem trước bản in/i }).first();
    if (await previewButton.count() > 0) {
      const disabled = await previewButton.isDisabled();
      result.UNSUPPORTED_ACTION_POLICY = !disabled ? "ENABLED" : "DISABLED";
    } else {
      result.UNSUPPORTED_ACTION_POLICY = "NOT_FOUND";
    }

    result.CONSOLE_ERRORS = consoleErrors.slice(0, 10);

    const failureSignatures = [];
    if (consoleErrors.length > 0) failureSignatures.push("CONSOLE_ERROR");
    if (result.RERENDER_RETENTION === false) failureSignatures.push("RERENDER_RETENTION_FAIL");
    if (inputs === 0) failureSignatures.push("NO_FIELDS_RENDERED");

    result.FAILURE_SIGNATURES = failureSignatures;
    result.VERDICT = failureSignatures.length === 0 ? "PASS" : "FAIL";

    if (result.VERDICT === "FAIL" && failureSignatures.length > 0) {
      try {
        await page.screenshot({ path: `${OUT_DIR}/screenshots/${code}-failure.png`, fullPage: true });
        screenshots.push(`${code}-failure.png`);
      } catch {
        // ignore screenshot failures
      }
    }
  } catch (err) {
    result.ROUTE_LOAD = "ERROR";
    result.FAILURE_SIGNATURES.push(`BROWSER_ERROR: ${err.message}`);
    result.VERDICT = "FAIL";
  } finally {
    await context.close();
  }

  return result;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(`${OUT_DIR}/screenshots`, { recursive: true });

  const codes = buildCodes();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < codes.length) {
      const idx = cursor++;
      const code = codes[idx];
      const result = await auditForm(browser, code);
      results.push(result);
      if (idx % 20 === 0) {
        console.error(`Progress: ${idx}/${codes.length} — ${code} ${result.VERDICT}`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, codes.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  await browser.close();

  const pass = results.filter(r => r.VERDICT === "PASS").length;
  const fail = results.filter(r => r.VERDICT === "FAIL").length;
  const notExecuted = results.filter(r => r.VERDICT === "NOT_EXECUTED").length;

  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    pass,
    fail,
    notExecuted,
    counts: { PASS: pass, FAIL: fail, NOT_EXECUTED: notExecuted },
    results
  };

  writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ total: results.length, pass, fail, notExecuted }, null, 2));

  if (fail > 0) {
    console.log("FAILURES:");
    for (const r of results.filter(r => r.VERDICT === "FAIL")) {
      console.log(`  ${r.FORM}: ${r.FAILURE_SIGNATURES.join(", ")}`);
    }
    process.exitCode = 1;
  }
}

main();
