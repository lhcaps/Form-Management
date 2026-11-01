/**
 * Phase 14 — Debug BM-051 to see why save fails.
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
const STORAGE_STATE = path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

dotenv.config({ path: ".env.e2e.local", override: false });
dotenv.config({ path: ".env", override: false });

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
  await mkdir(PHASE14_DIR, { recursive: true });
  const { token, cookieName } = await fetchSessionCookie();
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ storageState: STORAGE_STATE });
    await ctx.addCookies([
      { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
    ]);
    const page = await ctx.newPage();
    const netLog = [];
    page.on("response", (resp) => netLog.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }));
    await page.goto(`${APP_BASE}/documents/141`, { waitUntil: "domcontentloaded", timeout: 30000 });
    let stableUrl = page.url();
    for (let i = 0; i < 60; i += 1) {
      if (stableUrl.includes("/documents/141")) break;
      await page.waitForTimeout(500);
      stableUrl = page.url();
    }
    console.log("URL:", stableUrl);
    await page.waitForTimeout(2000);

    // List all visible inputs
    const inputs = page.locator("main input:not([type='checkbox']):not([type='radio']):not([type='hidden']):not([disabled])");
    const n = await inputs.count();
    console.log("Inputs:", n);

    // Check for agency block first
    const agencyInputs = page.locator("main input[id^='contract-field-field-agency-']:not([disabled])");
    const aCount = await agencyInputs.count();
    console.log("Agency block inputs:", aCount);
    for (let i = 0; i < aCount; i += 1) {
      const inp = agencyInputs.nth(i);
      const id = await inp.getAttribute("id");
      await inp.fill(`[AGENCY-${i}]`);
    }

    // Click fill sample
    const fillSampleBtn = page.getByRole("button", { name: /Điền dữ liệu mẫu/i }).first();
    if (await fillSampleBtn.count()) {
      await fillSampleBtn.click();
      await page.waitForTimeout(2000);
      console.log("Clicked fill sample data");
    }

    // Check save button state
    const saveBtn = page.getByRole("button", { name: /Lưu dữ liệu biểu mẫu/i }).first();
    if (await saveBtn.count()) {
      const dis = await saveBtn.getAttribute("disabled");
      console.log("Save button disabled?", dis);
      // Try clicking
      if (dis === null) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log("Save clicked");
      }
    }

    // Check other save buttons
    const saveButtons = await page.locator("main button").evaluateAll((els) => els.filter(e => /lưu/i.test(e.textContent)).map(e => ({ text: e.textContent.slice(0, 50), disabled: e.disabled })));
    console.log("All save-related buttons:", JSON.stringify(saveButtons, null, 2));

    console.log("\n=== Network ===");
    for (const r of netLog.filter((r) => r.method !== "GET" || r.url.includes("/api/"))) {
      console.log(`  ${r.method} ${r.url.replace(API_BASE, "")} → ${r.status}`);
    }

    await ctx.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });