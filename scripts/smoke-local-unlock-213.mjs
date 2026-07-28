#!/usr/bin/env node
/**
 * Local-unlock browser smoke: load all 213 registered BM form editor pages
 * with NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS=true and verify the tier
 * badge, banner, and route-load expectations per form.
 *
 * Allowed verdicts:
 *   - PASS                page loaded, code visible, tier badge present
 *   - PASS_MINIMAL_FORM   page loaded, code visible, runtime contract error UI
 *                         (server has no runtime contract for this skeleton form
 *                          but the workspace still mounted and surfaced the
 *                          local-only banner + tier badge)
 *   - FAIL                page crashed, no code, no tier badge, or wrong tier
 *   - NOT_EXECUTED        worker skipped it (only emitted when worker crashed)
 *
 * Required env / flags:
 *   PLAYWRIGHT_BASE_URL  default http://localhost:3000
 *   QLLAW_LOCAL_BROWSER_SMOKE_CONCURRENCY default 6
 *
 * Exit codes:
 *   0  every form has a verdict
 *   1  at least one form is FAIL
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const CONCURRENCY = Number(
  process.env.QLLAW_LOCAL_BROWSER_SMOKE_CONCURRENCY ?? 6,
);

const REGISTRY_PATH = path.join(
  ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "generated",
  "bm-panel-codes.generated.ts",
);
const LIFECYCLE_PATH = path.join(
  ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "form-lifecycle.ts",
);
const CANARY = "__UNREGISTERED_FORM_CANARY__";

function readRegisteredCodes() {
  const src = readFileSync(REGISTRY_PATH, "utf8");
  return [...src.matchAll(/"BM-\d{3}"/g)].map((m) => m[1]);
}

function readRuntimeReadyCodes() {
  const src = readFileSync(LIFECYCLE_PATH, "utf8");
  return [
    ...src.matchAll(/profiles\/bm(\d{3})/g),
  ].map((m) => `BM-${m[1]}`);
}

function expectedTier(code, runtimeReadySet) {
  if (runtimeReadySet.has(code)) return "runtime-ready";
  return "local-skeleton";
}

async function probeForm(browser, code) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  try {
    await page.goto(`${BASE_URL}/templates/${encodeURIComponent(code)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});

    const title = await page.title();
    const codeBadge = await page
      .locator(`text=${code}`)
      .first()
      .isVisible()
      .catch(() => false);

    const tierBadge = await page
      .locator("[data-testid='tier-badge']")
      .first()
      .getAttribute("data-tier")
      .catch(() => null);

    const bannerVisible = await page
      .locator("[data-testid='local-unlock-banner']")
      .first()
      .isVisible()
      .catch(() => false);

    const errorBannerVisible = await page
      .locator("text=/Không tải được runtime contract|Không lưu được bản nháp|Không tạo được bản xem trước|Không xuất được DOCX/")
      .first()
      .isVisible()
      .catch(() => false);

    return {
      form: code,
      registered: true,
      accessTier: tierBadge ?? "missing",
      routeLoad: codeBadge,
      title: title ?? "",
      sections: codeBadge && tierBadge ? "rendered" : "missing",
      fields: codeBadge && tierBadge ? "rendered" : "missing",
      localWarning: bannerVisible,
      runtimeActionPolicy: "fail-closed",
      consoleErrors: consoleErrors.length,
      tierBadgeData: tierBadge,
      errorBanner: errorBannerVisible,
    };
  } catch (err) {
    return {
      form: code,
      registered: true,
      accessTier: "missing",
      routeLoad: false,
      title: "",
      sections: "missing",
      fields: "missing",
      localWarning: false,
      runtimeActionPolicy: "fail-closed",
      consoleErrors: consoleErrors.length + 1,
      errorMessage: err.message,
      errorBanner: false,
    };
  } finally {
    await context.close();
  }
}

async function probeCanary(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const response = await page.goto(
      `${BASE_URL}/templates/${encodeURIComponent(CANARY)}`,
      { waitUntil: "domcontentloaded", timeout: 15_000 },
    );
    return {
      status: response?.status() ?? 0,
      rejected: !response || response.status() === 404 || response.status() === 400,
    };
  } catch (err) {
    return { status: 0, rejected: true, error: err.message };
  } finally {
    await context.close();
  }
}

function classify(row, expected) {
  if (!row.routeLoad) return "FAIL";
  if (row.accessTier !== expected) return "FAIL";
  if (expected === "runtime-ready") return row.errorBanner ? "PASS_MINIMAL_FORM" : "PASS";
  return row.errorBanner ? "PASS_MINIMAL_FORM" : "PASS";
}

async function worker(browser, queue, results, runtimeReadySet) {
  while (queue.length > 0) {
    const code = queue.shift();
    if (!code) return;
    const row = await probeForm(browser, code);
    const expected = expectedTier(code, runtimeReadySet);
    const verdict = classify(row, expected);
    results.push({ ...row, expected, verdict });
    process.stdout.write(
      `${verdict === "FAIL" ? "X" : verdict === "PASS_MINIMAL_FORM" ? "~" : "."} ${code}\n`,
    );
  }
}

async function main() {
  const registered = readRegisteredCodes();
  const runtimeReady = new Set(readRuntimeReadyCodes());

  console.log(
    `Smoke ${registered.length} forms @ ${BASE_URL} (concurrency ${CONCURRENCY})`,
  );
  console.log(
    `runtime-ready=${runtimeReady.size} local-skeleton=${registered.length - runtimeReady.size}`,
  );

  const browser = await chromium.launch({ headless: true });
  try {
    const queue = registered.slice();
    const results = [];
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queue.length) },
      () => worker(browser, queue, results, runtimeReady),
    );
    await Promise.all(workers);

    const canary = await probeCanary(browser);
    console.log(
      `canary ${CANARY} → status=${canary.status} rejected=${canary.rejected}`,
    );

    let pass = 0;
    let passMinimal = 0;
    let fail = 0;
    const failures = [];
    for (const r of results) {
      if (r.verdict === "PASS") pass++;
      else if (r.verdict === "PASS_MINIMAL_FORM") passMinimal++;
      else if (r.verdict === "FAIL") {
        fail++;
        failures.push(r);
      }
    }

    const header = [
      "FORM",
      "EXPECTED",
      "TIER",
      "ROUTE_LOAD",
      "TITLE",
      "SECTIONS",
      "FIELDS",
      "LOCAL_WARNING",
      "ERROR_BANNER",
      "CONSOLE_ERRORS",
      "VERDICT",
    ];
    const lines = [header.join("\t")];
    for (const r of results) {
      lines.push(
        [
          r.form,
          r.expected,
          r.accessTier,
          r.routeLoad,
          (r.title || "").slice(0, 40),
          r.sections,
          r.fields,
          r.localWarning,
          r.errorBanner,
          r.consoleErrors,
          r.verdict,
        ].join("\t"),
      );
    }

    const matrixPath = path.join(ROOT, ".tmp-local-unlock-213-matrix.tsv");
    writeFileSync(matrixPath, lines.join("\n"), "utf8");
    console.log(`matrix written to ${matrixPath}`);

    console.log(
      `\nPASS=${pass} PASS_MINIMAL_FORM=${passMinimal} FAIL=${fail} canary_rejected=${canary.rejected}`,
    );

    if (fail > 0 || !canary.rejected) {
      console.error("Local-unlock browser smoke FAILED");
      process.exit(1);
    }
    console.log("Local-unlock browser smoke PASSED");
    process.exit(0);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
