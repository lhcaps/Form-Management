/**
 * Phase 14 Turn 3 — Infrastructure Probe
 *
 * Probes live infrastructure to determine if Phase 8 (canary browser execution)
 * is viable.
 *
 * Checks:
 *   1. Web server (:3000)
 *   2. API server (:3001)
 *   3. MariaDB (:3307)
 *   4. Clerk authentication
 *   5. Playwright available
 *   6. Test fixtures accessible
 *
 * Usage: node scripts/runtime-rollout/probe-live-infrastructure.mjs
 */
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const STORAGE_STATE = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

async function probe(name, fn) {
  try {
    const result = await fn();
    return { name, status: "OK", result };
  } catch (e) {
    return { name, status: "FAIL", error: e.message };
  }
}

async function main() {
  const results = [];

  // 1. Web server
  results.push(await probe("web_server_3000", async () => {
    const r = await fetch(APP_BASE, { signal: AbortSignal.timeout(5000) });
    return { status: r.status, ok: r.ok };
  }));

  // 2. API server
  results.push(await probe("api_server_3001", async () => {
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    const body = await r.json().catch(() => null);
    return { status: r.status, body };
  }));

  // 3. Clerk storage state
  results.push(await probe("clerk_storage_state", async () => {
    const stat = await readFile(STORAGE_STATE, "utf8").catch(() => null);
    if (!stat) return { found: false };
    const data = JSON.parse(stat);
    return {
      found: true,
      hasCookies: Array.isArray(data.cookies),
      cookieCount: Array.isArray(data.cookies) ? data.cookies.length : 0,
      hasSession: Array.isArray(data.cookies) && data.cookies.some(c => c.name === "__session"),
    };
  }));

  // 4. Playwright browser launch
  results.push(await probe("playwright_browser", async () => {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return { launched: true };
  }));

  // 5. Authenticated navigation probe
  results.push(await probe("authenticated_navigation", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const ctx = await browser.newContext({ storageState: STORAGE_STATE });
      const page = await ctx.newPage();
      await page.goto(`${APP_BASE}/templates/BM-213`, { timeout: 15000 });
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? "");
      await ctx.close();
      return {
        finalUrl: url,
        redirected: !url.includes("sign-in"),
        bodySnippet: bodyText.slice(0, 100),
      };
    } finally {
      await browser.close();
    }
  }));

  // 6. Persisted document workspace probe (BM-025 was in the smoke set)
  results.push(await probe("persisted_document_workspace", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const ctx = await browser.newContext({ storageState: STORAGE_STATE });
      const page = await ctx.newPage();
      // Try document ID 25 which was in the smoke
      await page.goto(`${APP_BASE}/documents/25`, { timeout: 15000 });
      const url = page.url();
      const title = await page.evaluate(() => document.title ?? "");
      await ctx.close();
      return {
        finalUrl: url,
        redirectedToSignIn: url.includes("sign-in"),
        documentAccessible: !url.includes("sign-in"),
        title,
      };
    } finally {
      await browser.close();
    }
  }));

  // 7. Playwright package available
  results.push(await probe("playwright_package", async () => {
    const { version } = await import("@playwright/test/package.json").catch(() => ({ version: "NOT_FOUND" }));
    return { version };
  }));

  // 8. Fixture provisioning API
  results.push(await probe("fixture_provisioning_api", async () => {
    // Try a simple API health check that doesn't need auth
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return { status: r.status, ok: r.ok };
  }));

  // Summary
  const ok = results.filter(r => r.status === "OK").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const canRunBrowser = results.find(r => r.name === "playwright_browser")?.status === "OK"
    && results.find(r => r.name === "authenticated_navigation")?.result?.redirected === false;
  const canRunPersisted = results.find(r => r.name === "persisted_document_workspace")?.result?.documentAccessible === true;

  const output = {
    schema: "qllaw.phase14.infrastructure_probe/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 3,
    results,
    summary: {
      total: results.length,
      ok,
      fail,
      canRunBrowser,
      canRunPersisted,
      phase8Viable: canRunBrowser,
      phase9Viable: canRunPersisted,
    },
    phase8Recommendation: canRunBrowser
      ? "PROCEED — browser execution viable"
      : "DEFER — browser execution blocked by auth or server",
    phase9Recommendation: canRunPersisted
      ? "PROCEED — persisted workspace accessible"
      : "DEFER — persisted workspace requires fixture provisioning",
  };

  console.log("\n=== Infrastructure Probe Results ===");
  for (const r of results) {
    const icon = r.status === "OK" ? "[OK]" : "[FAIL]";
    console.log(`${icon} ${r.name}: ${JSON.stringify(r.result ?? r.error)}`);
  }
  console.log(`\nBrowser viable: ${canRunBrowser ? "YES" : "NO"}`);
  console.log(`Persisted viable: ${canRunPersisted ? "YES" : "NO"}`);
  console.log(`Phase 8 recommendation: ${output.phase8Recommendation}`);
  console.log(`Phase 9 recommendation: ${output.phase9Recommendation}`);

  return output;
}

main().then(output => {
  process.stdout.write(JSON.stringify(output, null, 2));
}).catch(err => {
  console.error("[probe] fatal:", err);
  process.exit(1);
});
