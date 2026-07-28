/**
 * Discover buttons on BM-058 (typical fail pattern).
 */
import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const STORAGE_STATE = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");
dotenv.config({ path: ".env.e2e.local", override: false });

async function fetchSessionCookie() {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
  for (const v of sc) {
    if (!v) continue;
    const m = String(v).match(/qlv_session=([^;]+)/);
    if (m) return { token: m[1], cookieName: "qlv_session" };
  }
  throw new Error("no session");
}

async function main() {
  const code = process.argv[2] || "BM-058";
  const docId = process.argv[3] || "148";
  const { token, cookieName } = await fetchSessionCookie();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: STORAGE_STATE });
  await ctx.addCookies([
    { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${APP_BASE}/documents/${docId}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  let stableUrl = page.url();
  for (let i = 0; i < 60; i += 1) {
    if (stableUrl.includes(`/documents/${docId}`)) break;
    await page.waitForTimeout(500);
    stableUrl = page.url();
  }
  await page.waitForTimeout(3000);

  // All buttons
  const buttons = await page.locator("main button").evaluateAll((els) =>
    els.map((e) => ({
      text: (e.textContent || "").trim().slice(0, 80),
      disabled: e.disabled,
      visible: e.offsetParent !== null,
      type: e.type,
    })),
  );
  console.log(`=== ${code} (doc ${docId}) buttons ===`);
  for (const b of buttons) console.log(`  "${b.text}" disabled=${b.disabled}, visible=${b.visible}, type=${b.type}`);

  // Look at form input count
  const inputs = await page.locator("main input, main textarea").evaluateAll((els) =>
    els.map((e) => ({
      id: e.id, type: e.type, name: e.name, disabled: e.disabled, value: (e.value||"").slice(0,30),
    })),
  );
  console.log(`\n=== inputs (${inputs.length}) ===`);
  for (const i of inputs.slice(0, 20)) console.log(`  ${i.id || i.name} type=${i.type} disabled=${i.disabled} val="${i.value}"`);

  await ctx.close();
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });