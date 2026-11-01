/**
 * Phase 13C auth probe — verifies the test infrastructure can authenticate
 * against the live web + API using the same flow that
 * tests/e2e/helpers/auth.ts uses (POST /auth/login → qlv_session cookie).
 *
 * The Playwright storageState at playwright/.clerk/admin.json contains
 * Clerk cookies for the Next.js middleware redirect. The qlv_session cookie
 * is what authenticates the API and the persisted workspace. Both are
 * required for Phase 13C.
 *
 * Evidence is written to phase13c-live-browser/auth-refresh-evidence.json.
 * The script does NOT throw — failures are recorded in the artifact so the
 * orchestrator can decide what to do next.
 *
 * Usage:  node scripts/runtime-rollout/phase13c-auth-probe.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, request as playwrightRequest } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13c-live-browser",
);
const ARTIFACT = path.join(PHASE13C_DIR, "auth-refresh-evidence.json");

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const STORAGE_STATE = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const COOKIE_NAME = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";

function safeDigest(token) {
  if (!token) return null;
  return createHash("sha256").update(token).digest("hex");
}

function redact(value) {
  if (!value) return null;
  const s = String(value);
  if (s.length <= 8) return "[REDACTED]";
  return `${s.slice(0, 4)}…[${s.length - 8}b]…${s.slice(-4)}`;
}

async function fetchSessionCookie() {
  const body = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, body: text.slice(0, 400), sessionToken: null };
  }
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")].filter(Boolean);
  let sessionToken = null;
  for (const value of setCookie) {
    if (!value) continue;
    const m = value.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (m && m[1]) {
      sessionToken = m[1];
      break;
    }
  }
  return { ok: true, status: res.status, sessionToken, body: null };
}

function parseSetCookie(setCookie) {
  // Playwright's request context returns cookies as string array
  if (!setCookie) return null;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const value of arr) {
    if (!value) continue;
    const m = String(value).match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (m && m[1]) return m[1];
  }
  return null;
}

async function main() {
  const fs = await import("node:fs/promises");
  await mkdir(PHASE13C_DIR, { recursive: true });

  const evidence = {
    schema: "qllaw.phase13c.auth_refresh_evidence/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13c-live-browser",
    runId: "PHASE13C_2026_07_27_0137",
    appBase: APP_BASE,
    apiBase: API_BASE,
    storageStatePath: STORAGE_STATE,
    storageStateExists: false,
    storageStateSizeBytes: 0,
    storageStateMtime: null,
    storageStateSha256: null,
    createdAt: null,
    validatedAt: null,
    webAuthenticated: false,
    apiAuthenticated: false,
    casesEndpointStatus: null,
    redirectLoop: false,
    sessionBootstrapStatus: null,
    decision: null,
    probes: {},
  };

  // Storage state file check
  try {
    const stat = await fs.stat(STORAGE_STATE);
    evidence.storageStateExists = true;
    evidence.storageStateSizeBytes = stat.size;
    evidence.storageStateMtime = stat.mtime.toISOString();
    evidence.createdAt = stat.mtime.toISOString();
    evidence.storageStateSha256 = createHash("sha256")
      .update(await fs.readFile(STORAGE_STATE))
      .digest("hex");
  } catch {
    evidence.storageStateExists = false;
  }

  // Probe A: qlv_session login via API → fresh APIRequestContext
  try {
    const loginResult = await fetchSessionCookie();
    evidence.probes.qlvLogin = {
      ok: loginResult.ok,
      status: loginResult.status,
      tokenDigest: safeDigest(loginResult.sessionToken),
      tokenLength: loginResult.sessionToken ? loginResult.sessionToken.length : null,
      body: loginResult.ok ? null : loginResult.body,
    };

    if (loginResult.ok && loginResult.sessionToken) {
      // Use direct fetch with cookie header (this is what the web app does)
      const casesResp = await fetch(`${API_BASE}/cases?pageSize=10`, {
        headers: {
          accept: "application/json",
          cookie: `${COOKIE_NAME}=${loginResult.sessionToken}`,
        },
      });
      const body = casesResp.ok
        ? await casesResp.json().catch(() => null)
        : await casesResp.text().catch(() => "");
      const items = body && typeof body === "object"
        ? (Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : body?.data?.items)
        : null;
      evidence.probes.apiCases = {
        status: casesResp.status,
        ok: casesResp.ok,
        itemCount: Array.isArray(items) ? items.length : 0,
        firstItemIdShape: Array.isArray(items) && items[0]
          ? String(items[0].id ?? items[0].caseId ?? "").slice(0, 4) + "…"
          : null,
        firstItemCodeShape: Array.isArray(items) && items[0]
          ? String(items[0].code ?? items[0].caseCode ?? "").slice(0, 12) + "…"
          : null,
      };
      evidence.apiAuthenticated = casesResp.ok;
      evidence.casesEndpointStatus = casesResp.status;
    }
  } catch (err) {
    evidence.probes.apiCases = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Probe B: Web route + qlv_session cookie attached to browser context
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    // Build a context with BOTH the Clerk storageState cookies AND the qlv_session cookie
    const storageState = evidence.storageStateExists ? JSON.parse(await fs.readFile(STORAGE_STATE, "utf8")) : { cookies: [] };
    const E2E_COMMON = path.resolve(REPO_ROOT, "tests", "e2e", "helpers", "auth.ts");
    // We need the actual token, not the digest. Refetch if needed.
    let qlvRawToken = null;
    if (evidence.probes.qlvLogin?.ok) {
      // Re-issue login to get the raw token
      const re = await fetchSessionCookie();
      if (re.ok) qlvRawToken = re.sessionToken;
    }

    const cookies = [
      ...storageState.cookies,
      ...(qlvRawToken
        ? [
            {
              name: COOKIE_NAME,
              value: qlvRawToken,
              domain: "localhost",
              path: "/",
              httpOnly: true,
              secure: false,
              sameSite: "Lax",
            },
            {
              name: COOKIE_NAME,
              value: qlvRawToken,
              domain: "127.0.0.1",
              path: "/",
              httpOnly: true,
              secure: false,
              sameSite: "Lax",
            },
          ]
        : []),
    ];

    const context = await browser.newContext({ storageState: { cookies, origins: storageState.origins ?? [] } });
    const page = await context.newPage();

    // Probe 1: protected route
    try {
      const resp = await page.goto(`${APP_BASE}/templates/BM-001`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      const url = page.url();
      const isSignedOut =
        /sign-in|sign-up/u.test(url) &&
        !url.includes("/templates/") &&
        !url.includes("/documents/");
      evidence.probes.protectedRoute = {
        status: resp ? resp.status() : null,
        finalUrl: redact(url),
        isSignedOut,
        ok: resp != null && resp.status() < 400,
      };
      evidence.webAuthenticated = evidence.probes.protectedRoute.ok === true;
    } catch (err) {
      evidence.probes.protectedRoute = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Probe 2: documents workspace route (the actual Phase 13C target)
    try {
      const resp = await page.goto(`${APP_BASE}/documents/1`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      const url = page.url();
      evidence.probes.documentsRoute = {
        status: resp ? resp.status() : null,
        finalUrl: redact(url),
        ok: resp != null && resp.status() < 500,
      };
    } catch (err) {
      evidence.probes.documentsRoute = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Probe 3: API cases via page.request (shares cookies)
    try {
      const casesResp = await page.request.get(`${API_BASE}/cases?pageSize=1`, {
        failOnStatusCode: false,
        timeout: 30_000,
      });
      const body = casesResp.ok()
        ? await casesResp.json().catch(() => null)
        : await casesResp.text().catch(() => "");
      const items = body && typeof body === "object"
        ? (Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : body?.data?.items)
        : null;
      evidence.probes.apiCasesViaPage = {
        status: casesResp.status(),
        ok: casesResp.ok(),
        itemCount: Array.isArray(items) ? items.length : 0,
      };
    } catch (err) {
      evidence.probes.apiCasesViaPage = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    await context.close();
  } catch (err) {
    evidence.probes.launchError = err instanceof Error ? err.message : String(err);
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }

  // Probe C: API health (no auth required)
  try {
    const healthResp = await fetch(`${API_BASE}/health`);
    evidence.probes.apiHealth = {
      status: healthResp.status,
      ok: healthResp.ok,
    };
  } catch (err) {
    evidence.probes.apiHealth = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  evidence.validatedAt = new Date().toISOString();
  const ok =
    evidence.webAuthenticated === true &&
    evidence.apiAuthenticated === true;
  evidence.decision = ok ? "AUTH_OK_REUSE_STORAGE_STATE" : "AUTH_STALE_REFRESH_VIA_CLERK_SIGN_IN_REQUIRED";

  await writeFile(ARTIFACT, JSON.stringify(evidence, null, 2));
  console.log(`[phase13c-auth-probe] decision=${evidence.decision} artifact=${ARTIFACT}`);
}

main().catch((err) => {
  console.error("[phase13c-auth-probe] fatal:", err);
  process.exit(1);
});
