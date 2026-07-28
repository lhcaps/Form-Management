/**
 * Phase 14 — Discover visible form controls on the rendered workspace.
 *
 * Emits the list of input/select/textarea/button/checkable elements that
 * are actually visible in the rendered DOM for a persisted document and a
 * standalone template. This is the empirical input for the real-UI runner
 * which must use Playwright locators (not API calls) to drive these.
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
const STORAGE_STATE = process.env.PHASE14_STORAGE_STATE ?? path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");

dotenv.config({ path: ".env.e2e.local", override: false });
dotenv.config({ path: ".env", override: false });

async function fetchSessionCookie() {
  const username = process.env.E2E_ADMIN_USERNAME ?? "admin";
  const password = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
  const cookieName = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) {
      const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
      for (const v of sc) {
        if (!v) continue;
        const m = String(v).match(new RegExp(`${cookieName}=([^;]+)`));
        if (m) return { token: m[1], cookieName };
      }
    }
    if (r.status === 429) {
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    throw new Error(`login failed: ${r.status}`);
  }
  throw new Error("login failed after retries");
}

async function discoverControls(page) {
  return await page.evaluate(() => {
    function visible(el) {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
    }
    function summarize(el) {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type") ?? null,
        name: el.getAttribute("name") ?? null,
        id: el.id || null,
        placeholder: el.getAttribute("placeholder") ?? null,
        "data-testid": el.getAttribute("data-testid") ?? null,
        "aria-label": el.getAttribute("aria-label") ?? null,
        "data-field": el.getAttribute("data-field") ?? null,
        "data-form-field-key": el.getAttribute("data-form-field-key") ?? null,
        text: el.tagName.toLowerCase() === "button" ? (el.innerText ?? "").slice(0, 80) : null,
        value: "value" in el ? String(el.value ?? "").slice(0, 80) : null,
        checked: el.tagName.toLowerCase() === "input" && el.type === "checkbox" ? el.checked : null,
        disabled: el.disabled ?? false,
        visible: visible(el),
      };
    }
    const inputs = Array.from(document.querySelectorAll("main input, main textarea, main select"));
    const buttons = Array.from(document.querySelectorAll("main button, main [role='button']"));
    return {
      inputs: inputs.map(summarize),
      buttons: buttons.map(summarize),
      summary: {
        inputsVisible: inputs.filter(visible).length,
        inputsTotal: inputs.length,
        buttonsVisible: buttons.filter(visible).length,
        buttonsTotal: buttons.length,
      },
    };
  });
}

const TARGETS = [
  { formCode: "BM-213", route: "/templates/BM-213", lifecycle: "STANDALONE_RUNTIME_PREVIEW" },
  { formCode: "BM-025", route: "/documents/132", lifecycle: "PERSISTED_DOCUMENT_WORKSPACE" },
];

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const { token, cookieName } = await fetchSessionCookie();
  const report = {
    schema: "qllaw.phase14.control_discovery/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    targets: [],
  };

  const browser = await chromium.launch({ headless: true });
  try {
    for (const target of TARGETS) {
      const entry = { ...target, controls: null, screenshotPath: null };
      try {
        const ctx = await browser.newContext({ storageState: STORAGE_STATE });
        await ctx.addCookies([
          { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
        ]);
        const page = await ctx.newPage();
        await page.goto(`${APP_BASE}${target.route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(2500);
        entry.controls = await discoverControls(page);
        // Capture screenshot for evidence
        const shotPath = path.join(PHASE14_DIR, `control-discovery-${target.formCode}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        entry.screenshotPath = path.relative(REPO_ROOT, shotPath);
        await ctx.close();
      } catch (err) {
        entry.error = String(err?.message ?? err);
      }
      report.targets.push(entry);
    }
  } finally {
    await browser.close();
  }

  await writeFile(path.join(PHASE14_DIR, "control-discovery.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });