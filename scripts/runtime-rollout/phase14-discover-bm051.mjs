/**
 * Phase 14 — Discover ALL inputs and field structure for BM-051.
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
  const { token, cookieName } = await fetchSessionCookie();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: STORAGE_STATE });
  await ctx.addCookies([
    { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${APP_BASE}/documents/141`, { waitUntil: "domcontentloaded", timeout: 30000 });
  let stableUrl = page.url();
  for (let i = 0; i < 60; i += 1) {
    if (stableUrl.includes("/documents/141")) break;
    await page.waitForTimeout(500);
    stableUrl = page.url();
  }
  await page.waitForTimeout(2000);

  // Get all input/textarea/select fields
  const fields = await page.locator("main input, main textarea, main select").evaluateAll((els) =>
    els.map((e) => ({
      tag: e.tagName,
      id: e.id,
      name: e.name,
      type: e.type || null,
      placeholder: e.placeholder || null,
      disabled: e.disabled,
      readonly: e.readOnly,
      visible: e.offsetParent !== null,
      required: e.required || e.getAttribute("aria-required") === "true",
      value: e.value || null,
    })),
  );
  console.log(`Total form controls: ${fields.length}`);
  for (const f of fields.slice(0, 40)) {
    console.log(`  ${f.tag}[id="${f.id}", type=${f.type}, name=${f.name}, disabled=${f.disabled}, visible=${f.visible}, required=${f.required}, value="${(f.value||"").slice(0,30)}"]`);
  }

  // Find buttons
  const buttons = await page.locator("main button").evaluateAll((els) =>
    els.map((e) => ({
      text: (e.textContent || "").trim().slice(0, 60),
      disabled: e.disabled,
      visible: e.offsetParent !== null,
    })),
  );
  console.log(`\nButtons: ${buttons.length}`);
  for (const b of buttons) console.log(`  "${b.text}" (disabled=${b.disabled}, visible=${b.visible})`);

  await ctx.close();
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });