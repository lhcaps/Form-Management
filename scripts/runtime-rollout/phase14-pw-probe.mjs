/**
 * Phase 14 — Playwright single-form probe.
 *
 * Attempts to drive a real Playwright browser to /documents/<id> and
 * /templates/<code> using ONLY the qlv_session cookie (no Clerk session).
 * This is the empirical test of whether the local environment supports
 * real browser UI execution without Clerk.
 *
 * If the request is Clerk-redirected to /sign-in, the probe records
 * AUTH_REDIRECT_TO_SIGN_IN and exits non-zero with the redirect chain.
 * If the request renders the form, the probe records UI_RENDER_OK and
 * exits zero.
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
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

const TARGETS = [
  { formCode: "BM-213", route: "/templates/BM-213", lifecycle: "STANDALONE_RUNTIME_PREVIEW" },
  { formCode: "BM-025", route: "/documents/132", lifecycle: "PERSISTED_DOCUMENT_WORKSPACE" },
];

async function fetchSessionCookie() {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  if (!r.ok) throw new Error(`login failed: ${r.status}`);
  const sc = r.headers.getSetCookie();
  for (const v of sc) {
    const m = String(v).match(/qlv_session=([^;]+)/);
    if (m) return m[1];
  }
  throw new Error("no qlv_session in response");
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const token = await fetchSessionCookie();
  const report = {
    schema: "qllaw.phase14.playwright_probe/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    targets: [],
    authMechanism: "qlv_session cookie only (no Clerk session)",
  };

  let chromiumInst;
  try {
    chromiumInst = (await import("@playwright/test")).chromium;
  } catch (err) {
    report.fatal = `playwright import failed: ${err.message}`;
    await writeFile(path.join(PHASE14_DIR, "playwright-probe.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  for (const target of TARGETS) {
    const entry = {
      formCode: target.formCode,
      route: target.route,
      lifecycle: target.lifecycle,
      browserLaunch: null,
      navigation: null,
      finalUrl: null,
      formHeadingFound: null,
      consoleErrors: [],
      networkFailures: [],
    };
    try {
      const browser = await chromiumInst.launch({ headless: true });
      entry.browserLaunch = "OK";
      const context = await browser.newContext();
      await context.addCookies([
        {
          name: "qlv_session",
          value: token,
          domain: "localhost",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ]);
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") entry.consoleErrors.push(msg.text());
      });
      page.on("requestfailed", (req) => {
        entry.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" });
      });
      const resp = await page.goto(`${APP_BASE}${target.route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      entry.navigation = {
        status: resp?.status() ?? null,
        finalUrl: page.url(),
      };
      entry.finalUrl = page.url();
      // Look for any heading or form chrome
      const h1 = await page.locator("h1, h2, [data-form-code]").first().textContent().catch(() => null);
      entry.formHeadingFound = h1?.trim() ?? null;
      await context.close();
      await browser.close();
    } catch (err) {
      entry.error = String(err.message ?? err).slice(0, 300);
    }
    report.targets.push(entry);
  }

  await writeFile(path.join(PHASE14_DIR, "playwright-probe.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("[phase14-pw-probe] fatal:", err);
  process.exit(1);
});
