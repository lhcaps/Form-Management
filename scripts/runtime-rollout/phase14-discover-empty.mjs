/**
 * For BM-058 (422): find which fields are failing validation.
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

  // Click fill-sample
  const fillSampleBtn = page.locator("button").filter({ hasText: /Điền dữ liệu mẫu/i }).first();
  if (await fillSampleBtn.count()) {
    await fillSampleBtn.click({ timeout: 10000 });
    await page.waitForTimeout(2000);
  }

  // Count fields
  const totalFields = await page.locator("main input, main textarea, main select").count();
  const emptyFields = await page.locator("main input, main textarea, main select").evaluateAll((els) =>
    els.filter((e) => !e.value || !String(e.value).trim()).map((e) => ({
      id: e.id || "",
      tag: e.tagName,
      type: e.type || "",
      name: e.name || "",
    })),
  );
  console.log(`Total controls: ${totalFields}, Empty after fill-sample: ${emptyFields.length}`);
  for (const f of emptyFields.slice(0, 30)) console.log(`  ${f.tag}[id="${f.id}" name="${f.name}" type=${f.type}]`);

  // Look for error messages
  const errors = await page.locator("[class*='error'], [class*='red'], [role='alert']").evaluateAll((els) =>
    els.map((e) => e.textContent?.trim() || "").filter((t) => t.length > 0 && t.length < 200),
  );
  console.log(`\nError/alert messages (${errors.length}):`);
  for (const e of errors.slice(0, 10)) console.log(`  "${e}"`);

  await ctx.close();
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });