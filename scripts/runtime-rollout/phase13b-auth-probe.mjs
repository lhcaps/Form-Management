/**
 * Phase 13b auth probe — verifies the cached Clerk storage state at
 * playwright/.clerk/admin.json still authenticates against the live web +
 * API. The probe is read-only: it does not mutate state, does not create
 * fixtures, and does not perform browser interactions.
 *
 * Evidence is written to phase13b-persisted-browser/auth-probe.json.
 * The script does not throw — failures are recorded in the artifact so
 * Phase 13b can decide what to do (refresh storage state, switch to a
 * ticket sign-in, etc.).
 *
 * Usage:  node scripts/runtime-rollout/phase13b-auth-probe.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13B_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13b-persisted-browser",
);
const ARTIFACT = path.join(PHASE13B_DIR, "auth-probe.json");

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const STORAGE_STATE = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

function redact(value) {
  if (!value) return null;
  const s = String(value);
  if (s.length <= 8) return "[REDACTED]";
  return `${s.slice(0, 4)}…[${s.length - 8}b]…${s.slice(-4)}`;
}

async function main() {
  await mkdir(PHASE13B_DIR, { recursive: true });

  const probe = {
    schema: "qllaw.phase13b.auth_probe/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13b-persisted-browser",
    appBase: APP_BASE,
    apiBase: API_BASE,
    storageStatePath: STORAGE_STATE,
    storageStateExists: false,
    storageStateSizeBytes: 0,
    storageStateMtime: null,
    probes: {},
    decidedAt: null,
    decision: null,
  };

  // Storage state file existence
  try {
    const fs = await import("node:fs/promises");
    const stat = await fs.stat(STORAGE_STATE);
    probe.storageStateExists = true;
    probe.storageStateSizeBytes = stat.size;
    probe.storageStateMtime = stat.mtime.toISOString();
  } catch {
    probe.storageStateExists = false;
  }

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: probe.storageStateExists ? STORAGE_STATE : undefined });
    const page = await context.newPage();

    // Probe 1: navigate to a Clerk-protected route and check for redirect
    try {
      const resp = await page.goto(`${APP_BASE}/templates/BM-001`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const url = page.url();
      const isSignedOut = /sign-in|sign-up/u.test(url);
      probe.probes.protectedRoute = {
        status: resp ? resp.status() : null,
        finalUrl: redact(url),
        isSignedOut,
        ok: resp != null && resp.status() < 400 && !isSignedOut,
      };
    } catch (err) {
      probe.probes.protectedRoute = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    // Probe 2: get Clerk session info from window (does not expose token)
    try {
      const clerkInfo = await page.evaluate(() => {
        const w = window;
        if (!w.Clerk || !w.Clerk.session) return { hasClerk: !!w.Clerk, hasSession: false };
        // Do NOT extract the actual JWT — only report shape.
        return {
          hasClerk: true,
          hasSession: true,
          sessionStatus: w.Clerk.session.status ?? null,
          userIdShape: w.Clerk.user && w.Clerk.user.id ? String(w.Clerk.user.id).slice(0, 6) + "…(redacted)" : null,
        };
      });
      probe.probes.clerkBootstrap = {
        ok: !!(clerkInfo.hasClerk && clerkInfo.hasSession),
        ...clerkInfo,
      };
    } catch (err) {
      probe.probes.clerkBootstrap = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    // Probe 3: API auth — list cases (read-only)
    try {
      const authHeaders = await page.evaluate(() => {
        const w = window;
        if (!w.Clerk || !w.Clerk.session) return null;
        // Use Clerk's built-in getToken() but DO NOT echo the token into the artifact.
        return w.Clerk.session.status ?? null;
      });
      const apiResp = await page.request.get(`${API_BASE}/cases?limit=1`, { failOnStatusCode: false, timeout: 30_000 });
      const apiBody = apiResp.ok()
        ? await apiResp.json().catch(() => null)
        : await apiResp.text().catch(() => "");
      const items = apiBody && typeof apiBody === "object"
        ? (Array.isArray(apiBody?.items) ? apiBody.items : Array.isArray(apiBody) ? apiBody : apiBody?.data?.items)
        : null;
      probe.probes.apiCases = {
        status: apiResp.status(),
        ok: apiResp.ok(),
        sessionStatus: authHeaders,
        itemCount: Array.isArray(items) ? items.length : 0,
        firstItemIdShape: Array.isArray(items) && items[0] ? String(items[0].id ?? items[0].caseId ?? "").slice(0, 4) + "…" : null,
      };
    } catch (err) {
      probe.probes.apiCases = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    await context.close();
  } catch (err) {
    probe.probes.launchError = err instanceof Error ? err.message : String(err);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }

  // Decide
  const okProtected = probe.probes.protectedRoute?.ok === true;
  const okClerk = probe.probes.clerkBootstrap?.ok === true;
  const okApi = probe.probes.apiCases?.ok === true;
  probe.decidedAt = new Date().toISOString();
  probe.decision =
    okProtected && okClerk && okApi
      ? "AUTH_OK_REUSE_STORAGE_STATE"
      : probe.storageStateExists
        ? "AUTH_STALE_REFRESH_VIA_CLERK_SIGN_IN_REQUIRED"
        : "AUTH_MISSING_BUILD_STORAGE_STATE_VIA_CLERK_SIGN_IN";

  await writeFile(ARTIFACT, JSON.stringify(probe, null, 2));
  console.log(`[phase13b-auth-probe] decision=${probe.decision} artifact=${ARTIFACT}`);
}

main().catch((err) => {
  console.error("[phase13b-auth-probe] fatal:", err);
  process.exit(1);
});