/**
 * Try to fully fill BM-077 by filling EVERY input (visible + hidden) then check save.
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
  const code = process.argv[2] || "BM-077";
  const docId = process.argv[3] || "156";
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

  // Fill EVERYTHING: ALL inputs, textareas, selects (visible and hidden if scrollable)
  await page.evaluate(() => {
    document.querySelectorAll("main input, main textarea, main select").forEach((el) => {
      if (el.disabled) return;
      const tag = el.tagName;
      const type = el.type || "";
      if (tag === "TEXTAREA") {
        el.value = "Sample text " + Math.random().toString(36).slice(2, 10);
      } else if (tag === "SELECT") {
        if (el.options.length > 0) el.selectedIndex = 0;
      } else if (type === "checkbox" || type === "radio") {
        el.checked = true;
      } else if (type === "date") {
        el.value = "2026-01-15";
      } else if (type === "number") {
        el.value = "1";
      } else if (type === "text" || type === "email" || type === "tel" || type === "url" || type === "") {
        el.value = "Sample " + Math.random().toString(36).slice(2, 10);
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  await page.waitForTimeout(2000);

  const saveBtn = page.locator("button").filter({ hasText: /^Lưu dữ liệu/ }).filter({ hasNotText: /lịch sử/i }).first();
  const dis = await saveBtn.getAttribute("disabled");
  console.log("After mass fill - save button disabled:", dis);

  // Try to find what fields are still empty / unfilled
  const emptyFields = await page.locator("main input, main textarea, main select").evaluateAll((els) =>
    els.map((e) => ({
      id: e.id || "",
      tag: e.tagName,
      type: e.type || "",
      value: (e.value || "").trim(),
    })).filter((f) => !f.value),
  );
  console.log("Empty fields after mass fill:", emptyFields.length);
  for (const f of emptyFields) console.log(`  ${f.tag}[id="${f.id}" type=${f.type}]`);

  // Try clicking save
  if (dis === null) {
    console.log("Save button enabled - clicking");
    await saveBtn.click();
    await page.waitForTimeout(3000);
    console.log("Save clicked");
  }

  await ctx.close();
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });