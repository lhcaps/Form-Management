/**
 * Phase 14 — Manual debug: walk through BM-025 UI flow to see why save fails.
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
    await page.goto(`${APP_BASE}/documents/132`, { waitUntil: "domcontentloaded", timeout: 30000 });
    let stableUrl = page.url();
    for (let i = 0; i < 60; i += 1) {
      if (stableUrl.includes("/documents/132")) break;
      await page.waitForTimeout(500);
      stableUrl = page.url();
    }
    console.log("URL:", stableUrl);
    await page.waitForTimeout(2000);

    // Fill all visible inputs at the top of the page (text/textarea only — skip date/number)
    const inputs = page.locator("main input[type='text']:not([disabled]), main textarea:not([disabled])");
    const n = await inputs.count();
    console.log("Visible text inputs count:", n);
    for (let i = 0; i < n; i += 1) {
      const inp = inputs.nth(i);
      const id = await inp.getAttribute("id");
      const placeholder = await inp.getAttribute("placeholder");
      const type = await inp.getAttribute("type");
      console.log(`  Input ${i}: id=${id} placeholder="${placeholder}" type=${type}`);
      await inp.fill(`debug-${i}-${Date.now()}`);
    }

    // Check save button state
    const saveBtn = page.getByRole("button", { name: /Lưu dữ liệu biểu mẫu/i }).first();
    const saveCount = await saveBtn.count();
    console.log("Save button count:", saveCount);
    if (saveCount) {
      console.log("Save button disabled?", await saveBtn.getAttribute("disabled"));
    }

    // Try clicking sample data button
    const fillSampleBtn = page.getByRole("button", { name: /Điền dữ liệu mẫu/i }).first();
    if (await fillSampleBtn.count()) {
      await fillSampleBtn.click();
      await page.waitForTimeout(2000);
      console.log("Clicked fill sample data");
      // Check save state again
      console.log("Save button disabled after sample?", await saveBtn.getAttribute("disabled"));
    }

    // Snapshot inputs after sample click
    console.log("\n=== After sample click ===");
    for (let i = 0; i < n; i += 1) {
      const inp = inputs.nth(i);
      const value = await inp.inputValue();
      console.log(`  Input ${i}: value="${value.slice(0, 80)}"`);
    }

    // Click save button
    if (saveCount && (await saveBtn.getAttribute("disabled")) === null) {
      console.log("Clicking save button...");
      await saveBtn.click();
      await page.waitForTimeout(2500);
    } else {
      console.log("Save button still disabled");
    }

    // Network log
    console.log("\n=== Network log ===");
    for (const r of netLog.filter((r) => r.method !== "GET" || r.url.includes("/api/"))) {
      console.log(`  ${r.method} ${r.url.replace(API_BASE, "")} → ${r.status}`);
    }

    await ctx.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });