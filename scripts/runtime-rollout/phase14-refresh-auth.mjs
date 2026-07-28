/**
 * Phase 14 — Refresh Clerk storage state for auth-protected routes.
 *
 * Uses the official @clerk/testing/playwright helper:
 *   1. clerkSetup() — fetches CLERK_TESTING_TOKEN from Clerk Backend API
 *      using CLERK_SECRET_KEY. This token bypasses email verification
 *      and MFA.
 *   2. clerk.signIn({ page, emailAddress }) — creates a sign-in ticket
 *      server-side and calls setActive() in the browser via page.evaluate.
 *   3. Verifies session is active by loading /templates/BM-213.
 *   4. Persists storageState atomically to playwright/.clerk/admin.json.
 *
 * Records ONLY cookie metadata (name, domain, path, expires, present,
 * valid). Never logs cookie values or tokens.
 */
import { chromium } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { writeFile, mkdir, copyFile, stat } from "node:fs/promises";
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

const STORAGE_STATE_PATH = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");
const STORAGE_STATE_BACKUP = path.join(PHASE14_DIR, "auth-storage-state-manifest.json");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Load Clerk credentials from .env.e2e.local (preferred) then .env.
dotenv.config({ path: ".env.e2e.local", override: false });
dotenv.config({ path: ".env", override: false });

const EMAIL = process.env.E2E_CLERK_USER_EMAIL;
if (!EMAIL) {
  console.error("E2E_CLERK_USER_EMAIL must be set");
  process.exit(1);
}

function cookieMeta(c) {
  return {
    name: c.name,
    domain: c.domain,
    path: c.path,
    expires: c.expires,
    httpOnly: c.httpOnly ?? null,
    secure: c.secure ?? null,
    sameSite: c.sameSite ?? null,
    present: true,
    valid: typeof c.expires === "number" && c.expires > 0
      ? c.expires > Date.now() / 1000
      : (c.name === "__cf_bm" || c.name === "_cfuvid" || c.name === "clerk_active_context"),
  };
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  await mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  // Backup existing storage state if present.
  let priorStateSha = null;
  try {
    const s = await stat(STORAGE_STATE_PATH);
    priorStateSha = String(s.size);
    const backupPath = path.join(PHASE14_DIR, "auth-storage-state.backup.json");
    await copyFile(STORAGE_STATE_PATH, backupPath);
  } catch {
    /* no prior state */
  }

  // Step 1: load CLERK_TESTING_TOKEN
  await clerkSetup();

  // Step 2: open browser and authenticate
  const browser = await chromium.launch({ headless: true });
  const evidence = {
    schema: "qllaw.phase14.auth_refresh/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    appBase: APP_BASE,
    storageStatePath: STORAGE_STATE_PATH,
    priorStateBytes: priorStateSha,
    beforeCookies: [],
    afterCookies: [],
    sessionProbeResult: null,
    persistedRouteProbeResult: null,
    standaloneRouteProbeResult: null,
    authVerdict: null,
    repairMethod: "CLERK_TESTING_TICKET_VIA_OFFICIAL_HELPER",
  };

  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${APP_BASE}/sign-in`, { waitUntil: "networkidle" });
    await clerk.signIn({ page, emailAddress: EMAIL });
    // Verify session
    await page.goto(`${APP_BASE}/templates/BM-213`, { waitUntil: "domcontentloaded" });
    const finalUrl = page.url();
    const stillOnSignIn = /\/sign-in|\/sign-up/.test(finalUrl);
    evidence.sessionProbeResult = {
      finalUrl,
      stillOnSignIn,
      ok: !stillOnSignIn,
    };
    if (stillOnSignIn) {
      throw new Error(`Clerk session not active — landed at ${finalUrl}`);
    }
    // Persist storage state
    await ctx.storageState({ path: STORAGE_STATE_PATH });
    await ctx.close();

    // Step 3: probe persisted route with refreshed state
    const ctx2 = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const p2 = await ctx2.newPage();
    await p2.goto(`${APP_BASE}/documents/132`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const persistedFinalUrl = p2.url();
    const persistedOk = !/\/sign-in|\/sign-up/.test(persistedFinalUrl) && /\/documents\//.test(persistedFinalUrl);
    evidence.persistedRouteProbeResult = {
      finalUrl: persistedFinalUrl,
      ok: persistedOk,
    };
    await ctx2.close();

    // Step 4: probe standalone route with refreshed state
    const ctx3 = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const p3 = await ctx3.newPage();
    await p3.goto(`${APP_BASE}/templates/BM-213`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const standaloneFinalUrl = p3.url();
    const standaloneOk = !/\/sign-in|\/sign-up/.test(standaloneFinalUrl) && /\/templates\//.test(standaloneFinalUrl);
    evidence.standaloneRouteProbeResult = {
      finalUrl: standaloneFinalUrl,
      ok: standaloneOk,
    };
    await ctx3.close();

    // Step 5: verify authenticated API call (cases endpoint as smoke)
    const ctx4 = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const p4 = await ctx4.newPage();
    const apiResp = await p4.request.get(`${process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1"}/cases/37`, { failOnStatusCode: false });
    evidence.casesEndpointResult = {
      status: apiResp.status(),
      ok: apiResp.ok(),
    };
    await ctx4.close();

    evidence.authVerdict = evidence.sessionProbeResult.ok &&
      evidence.persistedRouteProbeResult.ok &&
      evidence.standaloneRouteProbeResult.ok &&
      evidence.casesEndpointResult.ok
      ? "AUTH_OK_REFRESH_STORAGE_STATE"
      : "AUTH_REFRESH_PARTIAL";

    // Read refreshed storage state to populate cookie metadata
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(STORAGE_STATE_PATH, "utf8");
    const state = JSON.parse(raw);
    evidence.afterCookies = (state.cookies ?? []).map(cookieMeta);

    await writeFile(STORAGE_STATE_BACKUP, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[phase14-auth-refresh] fatal:", err);
  process.exit(1);
});