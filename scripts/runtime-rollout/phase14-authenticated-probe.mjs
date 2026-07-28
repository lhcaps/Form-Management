/**
 * Phase 14 — Combined Playwright probe with full auth (Clerk + qlv_session).
 *
 * Both lifecycles (persisted + standalone) are exercised with:
 *   - Clerk storage state (for web middleware)
 *   - qlv_session cookie (for API data-plane calls within the same context)
 *
 * Verifies the form chrome renders and the API endpoint is reachable.
 * This is the empirical authentication proof before full UI execution.
 */
import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

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
const STORAGE_STATE = process.env.PHASE14_STORAGE_STATE ?? path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

dotenv.config({ path: ".env.e2e.local", override: false });
dotenv.config({ path: ".env", override: false });

const TARGETS = [
  { formCode: "BM-213", route: "/templates/BM-213", lifecycle: "STANDALONE_RUNTIME_PREVIEW" },
  { formCode: "BM-025", route: "/documents/132", lifecycle: "PERSISTED_DOCUMENT_WORKSPACE" },
];

async function fetchSessionCookie() {
  const username = process.env.E2E_ADMIN_USERNAME ?? "admin";
  const password = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
  const cookieName = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) {
      const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
      for (const v of sc) {
        if (!v) continue;
        const m = String(v).match(new RegExp(`${cookieName}=([^;]+)`));
        if (m) return { token: m[1], cookieName };
      }
    }
    if (r.status === 429) {
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    throw new Error(`login failed: ${r.status}`);
  }
  throw new Error("login failed after retries");
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const { token, cookieName } = await fetchSessionCookie();
  const report = {
    schema: "qllaw.phase14.authenticated_probe/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    storageState: STORAGE_STATE,
    targets: [],
    authMechanism: "Clerk storageState + qlv_session cookie",
    authVerdict: null,
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
        apiAuthCheck: null,
        verdict: "PENDING",
      };

      try {
        const ctx = await browser.newContext({ storageState: STORAGE_STATE });
        await ctx.addCookies([
          { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
        ]);
        const page = await ctx.newPage();
        page.on("console", (msg) => { if (msg.type() === "error") entry.consoleErrors.push(msg.text()); });
        page.on("requestfailed", (req) => { entry.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" }); });
        const resp = await page.goto(`${APP_BASE}${target.route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
        entry.navigation = { status: resp?.status() ?? null };
        entry.finalUrl = page.url();
        // wait briefly for client-side render
        await page.waitForTimeout(2000);
        const headingLoc = page.locator("h1, h2, [data-form-code], [data-form-heading]").first();
        if (await headingLoc.count()) {
          entry.formHeadingFound = (await headingLoc.textContent())?.slice(0, 200) ?? "";
        }
        const onSignIn = /\/sign-in|\/sign-up/.test(entry.finalUrl);
        // verify API reachability with qlv_session (in-context)
        const apiResp = await page.request.get(`${API_BASE}/cases/37`, { failOnStatusCode: false });
        entry.apiAuthCheck = { status: apiResp.status(), ok: apiResp.ok() };
        entry.verdict = onSignIn ? "AUTH_REDIRECT" : "AUTH_OK_BROWSER_RENDER";
        await ctx.close();
      } catch (err) {
        entry.error = String(err?.message ?? err);
        entry.verdict = "ERROR";
      }

      report.targets.push(entry);
    }
  } finally {
    await browser.close();
  }

  const allOk = report.targets.every((t) => t.verdict === "AUTH_OK_BROWSER_RENDER" && (t.apiAuthCheck?.ok ?? false));
  report.authVerdict = allOk ? "AUTH_OK_REUSE_STORAGE_STATE" : "AUTH_PARTIAL";
  await writeFile(path.join(PHASE14_DIR, "authenticated-playwright-probe.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("[phase14-auth-probe] fatal:", err);
  process.exit(1);
});