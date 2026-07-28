/**
 * Phase 14 — Clerk storage state probe.
 *
 * Attempts to drive a real Playwright browser to /documents/<id> and
 * /templates/<code> using the existing Clerk storage state at
 * playwright/.clerk/admin.json.
 *
 * This is the empirical test of whether the existing Clerk storage state
 * is sufficient to authenticate against the Clerk-enabled middleware.
 */
import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const STORAGE_STATE = process.env.PHASE14_STORAGE_STATE ?? path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

const TARGETS = [
  { formCode: "BM-213", route: "/templates/BM-213", lifecycle: "STANDALONE_RUNTIME_PREVIEW" },
  { formCode: "BM-025", route: "/documents/132", lifecycle: "PERSISTED_DOCUMENT_WORKSPACE" },
];

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const report = {
    schema: "qllaw.phase14.clerk_storage_probe/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    storageState: STORAGE_STATE,
    targets: [],
    authMechanism: "Clerk storageState at playwright/.clerk/admin.json",
  };

  const browser = await chromium.launch({ headless: true });
  try {
    for (const target of TARGETS) {
      const entry = {
        formCode: target.formCode,
        route: target.route,
        lifecycle: target.lifecycle,
        browserLaunch: "OK",
        navigation: null,
        finalUrl: null,
        formHeadingFound: null,
        consoleErrors: [],
        networkFailures: [],
      };

      try {
        const ctx = await browser.newContext({ storageState: STORAGE_STATE });
        const page = await ctx.newPage();
        page.on("console", (msg) => {
          if (msg.type() === "error") entry.consoleErrors.push(msg.text());
        });
        page.on("requestfailed", (req) => {
          entry.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" });
        });
        const resp = await page.goto(`${APP_BASE}${target.route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
        entry.navigation = { status: resp?.status() ?? null };
        entry.finalUrl = page.url();
        // Wait a bit for client-side hydration to mount the form.
        await page.waitForTimeout(2000);
        const headingLoc = page.locator("h1, h2, [data-form-code], [data-form-heading]").first();
        if (await headingLoc.count()) {
          entry.formHeadingFound = (await headingLoc.textContent())?.slice(0, 200) ?? "";
        }
        await ctx.close();
      } catch (err) {
        entry.error = String(err?.message ?? err);
      }

      report.targets.push(entry);
    }
  } finally {
    await browser.close();
  }

  await writeFile(
    path.join(PHASE14_DIR, "clerk-storage-probe.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("[phase14-clerk-probe] fatal:", err);
  process.exit(1);
});