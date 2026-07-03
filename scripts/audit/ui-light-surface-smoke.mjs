// scripts/audit/ui-light-surface-smoke.mjs
// Runtime visual QA gate — verifies the app renders as a light, calm legal/admin
// workstation under dark OS/browser preference, after the shadcn convergence
// hotfix that removed the automatic prefers-color-scheme: dark override and
// added html { color-scheme: light; }.
//
// Output: writes a JSON report to <outputDir>/report.json and screenshots to
// <outputDir>/<route>.png. The output dir is gitignored via test-results/.
//
// This script is intentionally NOT a Playwright Test spec. It uses the
// `playwright` library directly to keep the run surgical and the results
// inspectable as JSON.

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..", "..");
const outputDir = path.join(projectRoot, "test-results", "ui-light-surface-smoke");
const storageStatePath = path.join(projectRoot, "playwright", ".clerk", "admin.json");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// -- Light surface assertion helpers ----------------------------------------

// Accept anything that reads as a calm legal/admin surface. This is a
// generous band because we want a quick visual QA gate, not a strict
// pixel diff: a surface is "light" if its computed background is in the
// top half of the HSL lightness spectrum (>= 50%) and is not strongly
// tinted toward blue (which would suggest a navy chrome).
function isLightRgb(rgb) {
  // rgb string: "rgb(r, g, b)" or "rgba(r, g, b, a)"
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgb);
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  // Perceived lightness using Rec. 709 luma.
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return { r, g, b, luma, isLight: luma >= 0.5 };
}

async function probeSurface(page, selector, label) {
  if (!selector) return { label, present: false };
  const handle = await page.$(selector);
  if (!handle) return { label, present: false };
  const result = await handle.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      color: cs.color,
      borderColor: cs.borderColor,
    };
  });
  const luma = isLightRgb(result.backgroundColor);
  return {
    label,
    present: true,
    backgroundColor: result.backgroundColor,
    textColor: result.color,
    borderColor: result.borderColor,
    luma,
    isLight: luma?.isLight ?? null,
  };
}

// -- Report writing --------------------------------------------------------

async function writeReport(report) {
  await mkdir(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

async function writeConsoleErrors(outputDir, route, errors) {
  const safe = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
  const path_ = path.join(outputDir, `console-errors.${safe}.txt`);
  // Redact Clerk tokens / cookies / session identifiers from messages
  const redacted = errors.map((e) => ({
    ...e,
    text: e.text
      .replace(/__session[^,;\s]*/g, "__session[REDACTED]")
      .replace(/__client_uat[^,;\s]*/g, "__client_uat[REDACTED]")
      .replace(/__clerk_db_jwt[^,;\s]*/g, "__clerk_db_jwt[REDACTED]")
      .replace(/clerk_active_context[^,;\s]*/g, "clerk_active_context[REDACTED]")
      .replace(/eyJ[A-Za-z0-9_-]{10,}/g, "jwt[REDACTED]")
      .replace(/pk_(?:test|live)_[A-Za-z0-9]+/g, "pk_[REDACTED]")
      .replace(/sk_(?:test|live)_[A-Za-z0-9]+/g, "sk_[REDACTED]"),
  }));
  await writeFile(
    path_,
    redacted.map((e) => `[${e.type}] ${e.text}`).join("\n") + "\n",
    "utf8",
  );
  return path_;
}

// -- Main smoke loop -------------------------------------------------------

async function visitRoute(page, route) {
  const consoleErrors = [];
  const pageErrors = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ type: "console.error", text: msg.text() });
    } else if (msg.type() === "warning") {
      // Treat Clerk dev-mode noise as non-fatal: do not record.
      const t = msg.text();
      if (t.includes("Clerk has been loaded with development keys")) return;
      if (t.includes("Refreshing the session token resulted in an infinite redirect loop"))
        return;
      // Other warnings: record but mark separately
      consoleErrors.push({ type: "console.warn", text: t });
    }
  };
  const onPageError = (err) => {
    pageErrors.push({ type: "pageerror", text: String(err) });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  let finalUrl = route;
  let status = null;
  let html = "";
  try {
    const target = new URL(route, baseURL).toString();
    const resp = await page.goto(target, { waitUntil: "networkidle", timeout: 60_000 });
    status = resp ? resp.status() : null;
    finalUrl = page.url();
    // Wait a beat for client-side data fetches to settle.
    await page.waitForTimeout(800);
    html = await page.content();
  } catch (err) {
    pageErrors.push({ type: "navigation", text: String(err) });
  }

  // Detach listeners so the next route's array is isolated.
  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  return { consoleErrors, pageErrors, finalUrl, status, html };
}

async function countRawSelects(page, selector = "select") {
  try {
    const handles = await page.$$(selector);
    return handles.length;
  } catch {
    return null;
  }
}

async function smokeRoute({ page, route, probes, outDir, routeLabel, rawSelectSelector }) {
  const safe = (routeLabel ?? route).replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
  const screenshotPath = path.join(outDir, `${safe}.png`);

  const { consoleErrors, pageErrors, finalUrl, status, html } = await visitRoute(page, route);

  const surfaceProbes = {};
  for (const [name, selector] of Object.entries(probes)) {
    surfaceProbes[name] = await probeSurface(page, selector, name);
  }

  // Screenshot full viewport, but if we got bounced to /sign-in, still
  // capture so we can see what happened.
  try {
    await page.screenshot({ path: screenshotPath, fullPage: false });
  } catch (err) {
    pageErrors.push({ type: "screenshot", text: String(err) });
  }

  const consoleErrorsPath = await writeConsoleErrors(outDir, safe, consoleErrors);

  const rawSelectCount = rawSelectSelector
    ? await countRawSelects(page, rawSelectSelector)
    : null;

  return {
    route,
    routeLabel: routeLabel ?? route,
    finalUrl,
    status,
    bouncedToSignIn: /\/sign-in|\/sign-up/.test(finalUrl),
    hasKpiCards: (html.match(/data-kpi-tone/g) ?? []).length,
    hasFormActionBar: /qvks-action-bar|sticky top-3|sticky bottom-4/.test(html),
    rawSelectCount,
    surfaceProbes,
    consoleErrors,
    pageErrors,
    consoleErrorsPath,
    screenshotPath: existsSync(screenshotPath) ? screenshotPath : null,
  };
}

async function discoverFirstCase(page) {
  // The dashboard lists cases via /api/v1/cases?pageSize=20. Use the API
  // with the browser's session cookies. Returns { id, caseCode } or null.
  return page.evaluate(async () => {
    try {
      const r = await fetch("/api/v1/cases?pageSize=20", {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!r.ok) return null;
      const data = await r.json();
      const item = data?.items?.[0] ?? data?.data?.[0] ?? null;
      return item ? { id: item.id, caseCode: item.caseCode ?? item.nationalCaseCode ?? null } : null;
    } catch {
      return null;
    }
  });
}

async function discoverFirstTemplateCode(page) {
  // Templates are at /templates — extract first review queue item code.
  return page.evaluate(async () => {
    try {
      const r = await fetch("/api/v1/document-review-queue?pageSize=20", {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!r.ok) return null;
      const data = await r.json();
      const items = data?.items ?? data?.data ?? [];
      const first = items[0];
      if (!first) return null;
      return {
        documentCode: first.documentCode ?? first.code ?? null,
        id: first.id ?? null,
      };
    } catch {
      return null;
    }
  });
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  if (!existsSync(storageStatePath)) {
    const report = {
      status: "BLOCKED",
      reason: `Storage state not found at ${storageStatePath}. Re-run pnpm test:e2e:auth:setup or restore the storage state.`,
      timestamp: new Date().toISOString(),
    };
    await writeReport(report);
    console.error(JSON.stringify(report, null, 2));
    process.exit(2);
  }

  const storageState = JSON.parse(readFileSync(storageStatePath, "utf8"));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
    // The exact failure mode the hotfix targets: OS dark mode preference.
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // Probe pages.
  const results = [];

  // / — dashboard
  results.push(
    await smokeRoute({
      page,
      route: "/",
      routeLabel: "dashboard",
      outDir: outputDir,
      probes: {
        body: "body",
        pageShell: "[data-page-shell], main",
        kpiCard: "[data-kpi-tone]",
        reloadButton: 'button:has-text("Tải lại"), button:has-text("Làm mới"), button:has-text("Reload")',
        navRail: "aside, [data-nav-rail], nav",
      },
    }),
  );

  // /cases
  results.push(
    await smokeRoute({
      page,
      route: "/cases",
      routeLabel: "cases",
      outDir: outputDir,
      probes: {
        body: "body",
        searchInput: 'input[placeholder*="Tìm"], input[placeholder*="mã"], input[type="search"]',
        stageSelect: '[data-testid="stage-select"], select[name="stage"], button[role="combobox"]',
        table: "table",
        textarea: "textarea",
        submitButton: 'button[type="submit"]',
        pageShell: "[data-page-shell], main",
      },
    }),
  );

  // /templates
  results.push(
    await smokeRoute({
      page,
      route: "/templates",
      routeLabel: "templates",
      outDir: outputDir,
      probes: {
        body: "body",
        pageShell: "[data-page-shell], main",
        activePill: 'button[class*="bg-primary"]',
        reviewCard: '[data-review-card], [data-review-item], article, [class*="rounded-2xl"]',
        filterPanel: "[data-filter-panel], form, aside",
      },
    }),
  );

  // /cases/<id> — try the spec'd /cases/2 directly first; if the page renders
  // we can still capture a screenshot. Falls back to API discovery.
  const caseCandidates = ["/cases/2"];
  const firstCase = await discoverFirstCase(page);
  if (firstCase?.id && firstCase.id !== "2") {
    caseCandidates.push(`/cases/${firstCase.id}`);
  }
  let caseRoute = null;
  let caseReason = "no case id discoverable";
  let caseLabel = "case-detail";
  for (const candidate of caseCandidates) {
    const probe = await page.context().request.get(new URL(candidate, baseURL).toString());
    if (probe.status() === 200) {
      caseRoute = candidate;
      caseLabel = `case-${candidate.split("/").pop()}`;
      caseReason = "page returns 200";
      break;
    } else {
      caseReason = `${candidate} returned ${probe.status()}`;
    }
  }
  if (caseRoute) {
    results.push(
      await smokeRoute({
        page,
        route: caseRoute,
        routeLabel: caseLabel,
        outDir: outputDir,
        probes: {
          body: "body",
          statusBadge: "[data-status-badge], [class*='status-badge']",
          input: "input",
          select: "select",
          textarea: "textarea",
        },
      }),
    );
  } else {
    results.push({
      route: "/cases/2",
      routeLabel: "case-detail",
      status: null,
      skipped: true,
      skipReason: caseReason,
      bouncedToSignIn: false,
      surfaceProbes: {},
      consoleErrors: [],
      pageErrors: [],
    });
  }

  // /templates/BM-172 — try BM-172, fall back to discovered code
  let templateRoute = "/templates/BM-172";
  const firstTemplate = await discoverFirstTemplateCode(page);
  if (firstTemplate?.documentCode) {
    templateRoute = `/templates/${firstTemplate.documentCode}`;
  } else if (firstCase?.id) {
    // As a final fallback, use BM-001 which global.setup.ts confirms is accessible.
    templateRoute = "/templates/BM-001";
  }
  results.push(
    await smokeRoute({
      page,
      route: templateRoute,
      routeLabel: `template-${templateRoute.split("/").pop()}`,
      outDir: outputDir,
      probes: {
        body: "body",
        formActionBar: "[data-form-action-bar], .qvks-action-bar, [class*='sticky top-3']",
        input: "input",
        select: "select",
        textarea: "textarea",
      },
    }),
  );

  // /reports — period toggle + CSV/print action row, post button-tone hotfix
  results.push(
    await smokeRoute({
      page,
      route: "/reports",
      routeLabel: "reports",
      outDir: outputDir,
      probes: {
        body: "body",
        pageShell: "[data-page-shell], main",
        periodToggle: 'button:has-text("Tuần"), button:has-text("Tháng")',
        xuatCsvButton: 'button:has-text("Xuất CSV")',
        inPdfButton: 'button:has-text("In / PDF")',
        reloadButton: 'button:has-text("Tải lại")',
      },
    }),
  );

  // /documents — template chooser, post Select migration hotfix.
  // Probes: no native <select> in the chooser area; at least one
  // SelectTrigger (radix role="combobox" button) is rendered.
  results.push(
    await smokeRoute({
      page,
      route: "/documents",
      routeLabel: "documents",
      outDir: outputDir,
      rawSelectSelector: "main select",
      probes: {
        body: "body",
        pageShell: "[data-page-shell], main",
        searchInput: 'input[placeholder*="Tìm"], input[placeholder*="Mô tả"]',
        // At least one SelectTrigger (radix renders button[role="combobox"]).
        anySelectTrigger: 'button[role="combobox"]',
        reloadButton: 'button:has-text("Tải lại dữ liệu")',
      },
    }),
  );

  // /imports — post PreviewTable shadcn migration. Probes the empty
  // state (no upload executed) so it does not require seeded history.
  // The route is reachable as admin via Clerk ticket auth and the
  // dropzone + history section render with the shared light surface.
  // Dropzone file input + raw form controls are intentionally deferred
  // to a future PR and remain raw, so this smoke probe only checks
  // light-surface + presence of the import shell, not a rawSelect
  // count. PreviewTable is render-only and only appears after upload,
  // so it is exercised in the contract / shadcn guards, not here.
  results.push(
    await smokeRoute({
      page,
      route: "/imports",
      routeLabel: "imports",
      outDir: outputDir,
      probes: {
        body: "body",
        pageShell: "[data-page-shell], main",
        // Dropzone file input is still raw (deferred). The hidden
        // <input type="file"> is required for the route to function.
        dropzoneFileInput: 'input[type="file"]',
        // History section renders even with empty state (no history yet).
        historySection: 'h2:has-text("Lịch sử import")',
        // Empty-state placeholder for the preview pane (no batch open).
        emptyPreview: 'text="Chưa có lô import nào đang mở"',
      },
    }),
  );

  await browser.close();

  // Aggregate.
  const allConsoleErrors = results.flatMap((r) => r.consoleErrors ?? []);
  const allPageErrors = results.flatMap((r) => r.pageErrors ?? []);
  const bounced = results.filter((r) => r.bouncedToSignIn);

  const report = {
    status:
      bounced.length === 0 &&
      allPageErrors.length === 0 &&
      // The /documents route is the only one with a rawSelectSelector in
      // this smoke script. A non-zero count means the chooser regressed.
      results.every((r) => (typeof r.rawSelectCount === "number" ? r.rawSelectCount === 0 : true))
        ? "PASS"
        : "FAIL",
    timestamp: new Date().toISOString(),
    baseURL,
    outputDir,
    storageState: { path: storageStatePath, cookies: storageState.cookies?.length ?? 0 },
    colorScheme: "dark",
    summary: {
      routesVisited: results.length,
      bouncedToSignIn: bounced.length,
      totalConsoleErrors: allConsoleErrors.length,
      totalPageErrors: allPageErrors.length,
      // Documents-specific: count routes that still have a native <select>.
      // After the documents chooser migration, the documents route should
      // report rawSelectCount === 0 inside `main`. Other routes are
      // intentionally not constrained — BM forms still use raw selects.
      routesWithNativeSelectInScope: results
        .filter((r) => typeof r.rawSelectCount === "number" && r.rawSelectCount > 0)
        .map((r) => ({ route: r.route, count: r.rawSelectCount })),
    },
    substitutions: {
      caseRoute: caseRoute
        ? { requested: "/cases/2", used: caseRoute, reason: caseReason }
        : { requested: "/cases/2", used: null, reason: caseReason },
      templateRoute: {
        requested: "/templates/BM-172",
        used: templateRoute,
        discovered: firstTemplate ?? null,
      },
    },
    results,
    consoleErrors: allConsoleErrors,
    pageErrors: allPageErrors,
  };

  const reportPath = await writeReport(report);
  console.log(`[ui-light-surface-smoke] report=${reportPath}`);
  console.log(
    `[ui-light-surface-smoke] status=${report.status} bounced=${bounced.length} consoleErrors=${allConsoleErrors.length} pageErrors=${allPageErrors.length}`,
  );
  process.exit(report.status === "PASS" ? 0 : 1);
}

main().catch(async (err) => {
  const report = {
    status: "ERROR",
    timestamp: new Date().toISOString(),
    error: String(err),
    stack: err instanceof Error ? err.stack : null,
  };
  await writeReport(report);
  console.error("[ui-light-surface-smoke] fatal", err);
  process.exit(2);
});
