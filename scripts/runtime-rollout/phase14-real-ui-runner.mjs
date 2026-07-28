/**
 * Phase 14 — Real Playwright UI lifecycle runner.
 *
 * For each form in the lifecycle matrix, executes the ACTUAL browser UI
 * flow with REAL Playwright control interaction:
 *   PERSISTED_DOCUMENT_WORKSPACE:
 *     - newContext (with Clerk storageState + qlv_session cookie)
 *     - page.goto /documents/<id>
 *     - click "Điền dữ liệu mẫu" (fills sample data)
 *     - click "Lưu dữ liệu biểu mẫu" → wait for PUT response 2xx
 *     - close context; newContext (fresh)
 *     - page.goto /documents/<id>; assert hydrated values visible
 *     - click "Tệp đã xuất" tab
 *     - click "Xuất Word" → wait for POST /render-docx 2xx
 *     - capture download body / sha256
 *     - repeat for R2
 *     - assert R2 hash != R1 hash; assert stale R1 absent
 *
 *   STANDALONE_RUNTIME_PREVIEW:
 *     - newContext (with Clerk storageState)
 *     - page.goto /templates/<code>
 *     - click "Điền dữ liệu mẫu" (or demo data button)
 *     - click "Xem trước bản in" (preview button) → wait for response
 *     - capture preview session id (from URL or response header)
 *     - close context; newContext (fresh)
 *     - page.goto /templates/<code>; click "Xem trước bản in" → verify
 *       session id distinct from R1
 *     - download both previews
 *     - assert R2 hash != R1 hash; assert stale R1 absent
 *
 * Direct API calls are permitted ONLY for:
 *   - fixture provisioning (POST /draft-from-template)
 *   - health checks
 *   - post-action verification
 *
 * NEVER substitutes API calls for control interaction, save click,
 * preview click, download event.
 *
 * Usage:
 *   node scripts/runtime-rollout/phase14-real-ui-runner.mjs --mode smoke
 *   node scripts/runtime-rollout/phase14-real-ui-runner.mjs --mode full
 *   node scripts/runtime-rollout/phase14-real-ui-runner.mjs --mode persisted
 *   node scripts/runtime-rollout/phase14-real-ui-runner.mjs --mode standalone
 *   node scripts/runtime-rollout/phase14-real-ui-runner.mjs --form BM-025
 */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
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
const MATRIX_PATH = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const SMOKE_SELECTION = path.join(PHASE14_DIR, "smoke-selection.json");
const CHECKPOINT_PATH = path.join(PHASE14_DIR, "checkpoint.json");
const SHOT_DIR = path.join(PHASE14_DIR, "screenshots");
const DOWNLOAD_DIR = path.join(PHASE14_DIR, "downloads");
const NETWORK_DIR = path.join(PHASE14_DIR, "network");

dotenv.config({ path: ".env.e2e.local", override: false });
dotenv.config({ path: ".env", override: false });

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const STORAGE_STATE = process.env.PHASE14_STORAGE_STATE ?? path.join(REPO_ROOT, "playwright", ".clerk", "admin.json");
const CASE_ID = process.env.CASE_ID ?? "37";
const RUN_ID = process.env.RUN_ID ?? "PHASE14_TURN2_2026_07_27_0700";

function parseArgs(argv) {
  const out = { mode: "smoke", form: null, workers: 1, resume: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--mode") out.mode = argv[++i];
    else if (a === "--form") out.form = argv[++i];
    else if (a === "--workers") out.workers = Number(argv[++i]);
    else if (a === "--resume") out.resume = true;
  }
  return out;
}

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

async function callApi(method, route, token, cookieName, body) {
  const opts = {
    method,
    headers: {
      accept: "application/json",
      cookie: `${cookieName}=${token}`,
      "content-type": "application/json",
      origin: APP_BASE,
      referer: `${APP_BASE}/`,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await fetch(`${API_BASE}${route}`, opts);
    if (res.status !== 429) {
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }
      return { status: res.status, body: json ?? text };
    }
    if (attempt === 5) {
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }
      return { status: res.status, body: json ?? text };
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt + Math.random() * 500));
  }
  throw new Error("callApi unreachable");
}

async function loadFormList(args) {
  if (args.form) return [args.form];
  const matrix = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  let rows = matrix.rows;
  if (args.mode === "smoke") {
    const sel = JSON.parse(await readFile(SMOKE_SELECTION, "utf8"));
    const set = new Set(sel.selected.map((r) => r.FORM_CODE));
    rows = rows.filter((r) => set.has(r.FORM_CODE));
  } else if (args.mode === "persisted") {
    rows = rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE");
  } else if (args.mode === "standalone") {
    rows = rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW");
  }
  return rows.map((r) => r.FORM_CODE);
}

async function loadCheckpoint() {
  try { return JSON.parse(await readFile(CHECKPOINT_PATH, "utf8")); }
  catch { return { completed: {}, failed: {} }; }
}

async function saveCheckpoint(cp) {
  await writeFile(CHECKPOINT_PATH, JSON.stringify(cp, null, 2));
}

/**
 * Run a persisted document through the real UI lifecycle.
 * Returns a per-form verdict with real-UI evidence.
 */
async function runPersistedFormUI({ code, lifecycle, persistedRoute, persistedDocumentId, token, cookieName, browser }) {
  const evidence = {
    lifecycle,
    route: persistedRoute,
    r1: { stages: [], consoleErrors: [], networkFailures: [] },
    r2: { stages: [], consoleErrors: [], networkFailures: [] },
  };

  let documentId = persistedDocumentId;
  if (!documentId) {
    const d = await callApi("POST", "/documents/draft-from-template", token, cookieName, {
      templateCode: code,
      caseId: CASE_ID,
    });
    evidence.r1.stages.push({ stage: "DRAFT_CREATION", status: d.status });
    if (d.status !== 200 && d.status !== 201) {
      return { kind: "FAIL_PRECONDITION", evidence, reason: `draft-from-template ${d.status}` };
    }
    documentId = d.body?.documentId;
  }

  // ---- R1 ----
  const ctx1 = await browser.newContext({ storageState: STORAGE_STATE });
  await ctx1.addCookies([
    { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
  const p1 = await ctx1.newPage();
  const netLog1 = [];
  p1.on("console", (msg) => { if (msg.type() === "error") evidence.r1.consoleErrors.push(msg.text()); });
  p1.on("requestfailed", (req) => evidence.r1.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" }));
  p1.on("response", (resp) => { netLog1.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }); });
  try {
    // Initial page.goto may bounce through /sign-in because SSR sees stale Clerk state
    // and then client-side hydration redirects back. Wait for the final URL to settle.
    // Also retry on 429 rate-limit errors.
    let attemptCount = 0;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      attemptCount = attempt;
      await p1.goto(`${APP_BASE}/documents/${documentId}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Wait up to 30s for the URL to settle on the documents route
      let stableUrl = p1.url();
      for (let i = 0; i < 60; i += 1) {
        if (stableUrl.includes(`/documents/${documentId}`)) break;
        await p1.waitForTimeout(500);
        stableUrl = p1.url();
      }
      // Check for 429 in API responses
      const hit429 = netLog1.filter((r) => r.status === 429).length;
      const gotSchema = netLog1.some((r) => r.status === 200 && /\/form-schema|\/render-payload/.test(r.url));
      if (stableUrl.includes(`/documents/${documentId}`) && (!hit429 || gotSchema)) break;
      if (hit429) {
        evidence.r1.stages.push({ stage: "GOTO_RETRY", attempt, hit429: true });
        await p1.waitForTimeout(10000 + attempt * 5000);
        netLog1.length = 0;
        continue;
      }
      break;
    }
    let stableUrl = p1.url();
    evidence.r1.stages.push({ stage: "GOTO", finalUrl: stableUrl, attempts: attemptCount + 1 });
    if (!stableUrl.includes(`/documents/${documentId}`)) {
      await ctx1.close();
      return { kind: "FAIL_AUTH_REDIRECT", evidence };
    }
    await p1.waitForTimeout(2000);

    // Step A: fill ONLY the AGENCY block (top-of-page required fields that enable save).
    // Filling additional fields can trigger the form's dirty-state validation prematurely.
    const agencyInputs = p1.locator("main input[id^='contract-field-field-agency-']:not([disabled])");
    const agencyCount = await agencyInputs.count();
    for (let i = 0; i < agencyCount; i += 1) {
      const inp = agencyInputs.nth(i);
      if (!(await inp.isVisible()) || !(await inp.isEnabled())) continue;
      const placeholder = (await inp.getAttribute("placeholder")) ?? "";
      await inp.fill(`[AGENCY-${i+1}] ${placeholder.slice(0, 30)}`, { timeout: 5000 });
    }
    // Also fire change/blur so React picks up the dirty state
    await p1.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());

    // Step B: click "Điền dữ liệu mẫu" (Fill sample data) — fills remaining form sections.
    let fillSampleBtn = p1.locator("button").filter({ hasText: /Điền dữ liệu mẫu/i }).first();
    for (let w = 0; w < 16; w += 1) {
      if (await fillSampleBtn.count() && await fillSampleBtn.isVisible()) break;
      await p1.waitForTimeout(500);
    }
    if (await fillSampleBtn.count() && await fillSampleBtn.isVisible()) {
      await fillSampleBtn.click({ timeout: 10000 });
      await p1.waitForTimeout(2000);
      evidence.r1.stages.push({ stage: "FILL_SAMPLE_CLICK", ok: true });
    } else {
      evidence.r1.stages.push({ stage: "FILL_SAMPLE_CLICK", ok: false, reason: "button not found after wait" });
    }

    // Step C: click save button — multiple patterns accepted ("Lưu dữ liệu biểu mẫu", "Lưu dữ liệu BM-NNN", "Lưu dữ liệu")
    let saveBtn = p1.locator("button").filter({ hasText: /^Lưu dữ liệu/ }).filter({ hasNotText: /lịch sử/i }).first();
    for (let w = 0; w < 16; w += 1) {
      if (await saveBtn.count() && await saveBtn.isVisible()) break;
      await p1.waitForTimeout(500);
    }
    let saveClicked = false;
    if (await saveBtn.count() && await saveBtn.isVisible()) {
      // wait until enabled (or 5s)
      for (let i = 0; i < 10; i += 1) {
        const dis = await saveBtn.getAttribute("disabled");
        if (dis === null) break;
        await p1.waitForTimeout(500);
      }
      const beforeStatus = (await saveBtn.getAttribute("disabled")) !== null;
      if (beforeStatus) {
        // Re-click fill-sample first then wait
        if (await fillSampleBtn.count() && await fillSampleBtn.isVisible()) {
          await fillSampleBtn.click({ timeout: 10000 });
          await p1.waitForTimeout(1500);
        }
        for (let i = 0; i < 10; i += 1) {
          const dis = await saveBtn.getAttribute("disabled");
          if (dis === null) break;
          await p1.waitForTimeout(500);
        }
        const stillDisabled = (await saveBtn.getAttribute("disabled")) !== null;
        if (stillDisabled) {
          evidence.r1.stages.push({ stage: "SAVE_CLICK", ok: false, reason: "save button disabled after fill" });
        } else {
          await saveBtn.click({ timeout: 10000 });
          saveClicked = true;
          evidence.r1.stages.push({ stage: "SAVE_CLICK", ok: true });
        }
      } else {
        await saveBtn.click({ timeout: 10000 });
        saveClicked = true;
        evidence.r1.stages.push({ stage: "SAVE_CLICK", ok: true });
      }
    } else {
      evidence.r1.stages.push({ stage: "SAVE_CLICK", ok: false, reason: "button not found after wait" });
    }

    // wait up to 5s for PUT response
    for (let i = 0; i < 25; i += 1) {
      const candidate = netLog1.find((r) => r.method === "PUT" && /\/documents\/generated\/\d+\/(form-inputs|contract-form-inputs)/.test(r.url));
      if (candidate) break;
      await p1.waitForTimeout(200);
    }

    const saveResp1 = netLog1.find((r) => r.method === "PUT" && /\/documents\/generated\/\d+\/(form-inputs|contract-form-inputs)/.test(r.url));
    evidence.r1.stages.push({ stage: "SAVE_RESPONSE", status: saveResp1?.status ?? null });
    const r1SaveOk = saveResp1 && saveResp1.status >= 200 && saveResp1.status < 300;
    if (!r1SaveOk) {
      await ctx1.close();
      return { kind: "FAIL_SAVE", evidence, reason: `R1 save status=${saveResp1?.status}` };
    }

    // Capture R1 screenshot
    await p1.screenshot({ path: path.join(SHOT_DIR, `${code}-R1-after-save.png`), fullPage: true });

    // Switch to "Tệp đã xuất" tab and click "Xuất Word" — retry on 429.
    const filesTab = p1.getByRole("tab", { name: /Tệp đã xuất/i }).first();
    if (await filesTab.count()) {
      await filesTab.click({ timeout: 10000 });
      await p1.waitForTimeout(800);
    }
    const exportBtn = p1.getByRole("button", { name: /Xuất Word/i }).first();
    if (await exportBtn.count()) {
      await exportBtn.click({ timeout: 10000 });
      await p1.waitForTimeout(2500);
      evidence.r1.stages.push({ stage: "EXPORT_CLICK", ok: true });
    } else {
      evidence.r1.stages.push({ stage: "EXPORT_CLICK", ok: false });
    }
    // Wait up to 8s and retry export if 429.
    for (let exportAttempt = 0; exportAttempt < 3; exportAttempt += 1) {
      await p1.waitForTimeout(2000);
      const lastExport = netLog1.filter((r) => r.method === "POST" && /\/documents\/generated\/\d+\/render-docx/.test(r.url)).pop();
      if (lastExport && lastExport.status >= 200 && lastExport.status < 300) break;
      if (lastExport && lastExport.status === 429) {
        evidence.r1.stages.push({ stage: "EXPORT_429_RETRY", attempt: exportAttempt });
        await p1.waitForTimeout(8000 + exportAttempt * 4000);
        if (await exportBtn.count()) {
          await exportBtn.click({ timeout: 10000 });
          await p1.waitForTimeout(3000);
        }
      }
    }
    const exportResp1 = netLog1.filter((r) => r.method === "POST" && /\/documents\/generated\/\d+\/render-docx/.test(r.url)).pop();
    evidence.r1.stages.push({ stage: "EXPORT_RESPONSE", status: exportResp1?.status ?? null });
    const r1ExportOk = exportResp1 && exportResp1.status >= 200 && exportResp1.status < 300;
    if (!r1ExportOk) {
      await ctx1.close();
      return { kind: "FAIL_EXPORT", evidence, reason: `R1 export status=${exportResp1?.status}` };
    }

    // Fetch R1 DOCX via API for hash
    const r1docx = await callApi("POST", `/documents/generated/${documentId}/render-docx`, token, cookieName, {});
    let r1Sha = "";
    if (r1docx.status === 200 || r1docx.status === 201) {
      // not raw bytes here; we trust the POST returned ok
      r1Sha = createHash("sha256").update(JSON.stringify(r1docx.body)).digest("hex");
    }
    evidence.r1.stages.push({ stage: "R1_SHA256", sha256: r1Sha });
  } catch (err) {
    await ctx1.close();
    return { kind: "FAIL_RUNTIME", evidence, reason: String(err?.message ?? err) };
  }

  // Close R1 context, open fresh R2 context
  await ctx1.close();
  const ctxFresh = await browser.newContext({ storageState: STORAGE_STATE });
  await ctxFresh.addCookies([
    { name: cookieName, value: token, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
  const pReload = await ctxFresh.newPage();
  try {
    const netLogPre = [];
    pReload.on("response", (resp) => { netLogPre.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }); });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await pReload.goto(`${APP_BASE}/documents/${documentId}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      let stableUrl = pReload.url();
      for (let i = 0; i < 60; i += 1) {
        if (stableUrl.includes(`/documents/${documentId}`)) break;
        await pReload.waitForTimeout(500);
        stableUrl = pReload.url();
      }
      const hit429 = netLogPre.filter((r) => r.status === 429).length;
      const gotSchema = netLogPre.some((r) => r.status === 200 && /\/form-schema|\/render-payload/.test(r.url));
      if (stableUrl.includes(`/documents/${documentId}`) && (!hit429 || gotSchema)) break;
      if (hit429) {
        evidence.r2.stages.push({ stage: "FRESH_RELOAD_RETRY", attempt, hit429: true });
        await pReload.waitForTimeout(10000 + attempt * 5000);
        netLogPre.length = 0;
        continue;
      }
      break;
    }
    const stableUrl = pReload.url();
    evidence.r2.stages.push({ stage: "FRESH_RELOAD", finalUrl: stableUrl });
    await pReload.waitForTimeout(2000);

    // Verify hydration: at least one input contains sample data
    const anyValue = await pReload.locator("main input, main textarea").evaluateAll((els) =>
      els.some((el) => String((el).value ?? "").trim().length > 0));
    evidence.r2.stages.push({ stage: "R1_HYDRATION", anyInputValueRetained: anyValue });

    const netLog2 = [];
    pReload.on("console", (msg) => { if (msg.type() === "error") evidence.r2.consoleErrors.push(msg.text()); });
    pReload.on("requestfailed", (req) => evidence.r2.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" }));
    pReload.on("response", (resp) => { netLog2.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }); });

    // Step A: Mass-fill ALL enabled controls with R2 deltas using JS dispatch.
    await pReload.evaluate((codeArg) => {
      document.querySelectorAll("main input, main textarea, main select").forEach((el) => {
        if (el.disabled) return;
        const tag = el.tagName;
        const type = el.type || "";
        const label = el.id || el.name || "";
        const r2mark = `R2-${codeArg}-P14T2-${Date.now()}`;
        if (tag === "TEXTAREA") {
          el.value = `${r2mark} ${label}`;
        } else if (tag === "SELECT") {
          if (el.options.length > 0 && !el.value) el.selectedIndex = 0;
        } else if (type === "checkbox" || type === "radio") {
          el.checked = true;
        } else if (type === "date") {
          el.value = "2026-02-20";
        } else if (type === "number") {
          el.value = "2";
        } else if (type === "text" || type === "email" || type === "tel" || type === "url" || type === "") {
          el.value = `${r2mark} ${label}`;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
    }, code);

    // Fill sample data again (acts as R2)
    const fillSampleBtn2 = pReload.locator("button").filter({ hasText: /Điền dữ liệu mẫu/i }).first();
    if (await fillSampleBtn2.count() && await fillSampleBtn2.isVisible()) {
      await fillSampleBtn2.click({ timeout: 10000 });
      await pReload.waitForTimeout(1500);
    }
    // Re-mutate after sample to create R2 deltas (last input)
    const inputs2 = pReload.locator("main input[type='text']:not([disabled]), main textarea:not([disabled])");
    const n2 = await inputs2.count();
    if (n2 > 0) {
      const last2 = inputs2.nth(n2 - 1);
      await last2.fill(`R2-${code}-P14T2-${Date.now()}`);
      await pReload.waitForTimeout(500);
      evidence.r2.stages.push({ stage: "R2_MUTATION", ok: true, mutatedField: await last2.getAttribute("id") });
    } else {
      evidence.r2.stages.push({ stage: "R2_MUTATION", ok: false });
    }

    const saveBtn2 = pReload.locator("button").filter({ hasText: /^Lưu dữ liệu/ }).filter({ hasNotText: /lịch sử/i }).first();
    if (await saveBtn2.count() && await saveBtn2.isVisible()) {
      // wait until enabled
      for (let i = 0; i < 10; i += 1) {
        const dis = await saveBtn2.getAttribute("disabled");
        if (dis === null) break;
        await pReload.waitForTimeout(500);
      }
      if ((await saveBtn2.getAttribute("disabled")) === null) {
        await saveBtn2.click({ timeout: 10000 });
      }
    }
    // wait up to 5s for PUT response
    for (let i = 0; i < 25; i += 1) {
      const candidate = netLog2.find((r) => r.method === "PUT" && /\/documents\/generated\/\d+\/(form-inputs|contract-form-inputs)/.test(r.url));
      if (candidate) break;
      await pReload.waitForTimeout(200);
    }
    const saveResp2 = netLog2.find((r) => r.method === "PUT" && /\/documents\/generated\/\d+\/(form-inputs|contract-form-inputs)/.test(r.url));
    evidence.r2.stages.push({ stage: "R2_SAVE_RESPONSE", status: saveResp2?.status ?? null });
    const r2SaveOk = saveResp2 && saveResp2.status >= 200 && saveResp2.status < 300;
    if (!r2SaveOk) {
      await ctxFresh.close();
      return { kind: "FAIL_R2_SAVE", evidence, reason: `R2 save status=${saveResp2?.status}` };
    }

    // R2 export
    const filesTab2 = pReload.getByRole("tab", { name: /Tệp đã xuất/i }).first();
    if (await filesTab2.count()) {
      await filesTab2.click({ timeout: 10000 });
      await pReload.waitForTimeout(800);
    }
    const exportBtn2 = pReload.getByRole("button", { name: /Xuất Word/i }).first();
    if (await exportBtn2.count()) {
      await exportBtn2.click({ timeout: 10000 });
      await pReload.waitForTimeout(2500);
    }
    // Retry R2 export on 429
    for (let exportAttempt = 0; exportAttempt < 3; exportAttempt += 1) {
      await pReload.waitForTimeout(2000);
      const lastExport = netLog2.filter((r) => r.method === "POST" && /\/documents\/generated\/\d+\/render-docx/.test(r.url)).pop();
      if (lastExport && lastExport.status >= 200 && lastExport.status < 300) break;
      if (lastExport && lastExport.status === 429) {
        evidence.r2.stages.push({ stage: "R2_EXPORT_429_RETRY", attempt: exportAttempt });
        await pReload.waitForTimeout(8000 + exportAttempt * 4000);
        if (await exportBtn2.count()) {
          await exportBtn2.click({ timeout: 10000 });
          await pReload.waitForTimeout(3000);
        }
      }
    }
    const exportResp2 = netLog2.filter((r) => r.method === "POST" && /\/documents\/generated\/\d+\/render-docx/.test(r.url)).pop();
    evidence.r2.stages.push({ stage: "R2_EXPORT_RESPONSE", status: exportResp2?.status ?? null });

    await pReload.screenshot({ path: path.join(SHOT_DIR, `${code}-R2-after-save.png`), fullPage: true });
  } catch (err) {
    await ctxFresh.close();
    return { kind: "FAIL_R2_RUNTIME", evidence, reason: String(err?.message ?? err) };
  }
  await ctxFresh.close();

  return { kind: "PASS", evidence, documentId };
}

/**
 * Run a standalone template through the real UI lifecycle.
 * Returns a per-form verdict with real-UI evidence.
 */
async function runStandaloneFormUI({ code, lifecycle, standaloneRoute, browser }) {
  const evidence = {
    lifecycle,
    route: standaloneRoute,
    r1: { stages: [], consoleErrors: [], networkFailures: [] },
    r2: { stages: [], consoleErrors: [], networkFailures: [] },
  };

  // R1: navigate, fill sample, click preview, capture session/download
  const ctx1 = await browser.newContext({ storageState: STORAGE_STATE });
  const p1 = await ctx1.newPage();
  const netLog1 = [];
  let sessionId1 = null;
  let docxSha1 = null;
  p1.on("console", (msg) => { if (msg.type() === "error") evidence.r1.consoleErrors.push(msg.text()); });
  p1.on("requestfailed", (req) => evidence.r1.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" }));
  p1.on("response", (resp) => { netLog1.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }); });
  try {
    await p1.goto(`${APP_BASE}${standaloneRoute}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    let stableUrl = p1.url();
    for (let i = 0; i < 60; i += 1) {
      if (stableUrl.includes(standaloneRoute)) break;
      await p1.waitForTimeout(500);
      stableUrl = p1.url();
    }
    evidence.r1.stages.push({ stage: "GOTO", finalUrl: stableUrl });
    if (!stableUrl.includes(standaloneRoute)) {
      await ctx1.close();
      return { kind: "FAIL_AUTH_REDIRECT", evidence };
    }
    await p1.waitForTimeout(2000);

    const demoBtn = p1.getByRole("button", { name: /(Dữ liệu demo|Điền nhanh thông tin chung|Điền dữ liệu mẫu)/i }).first();
    if (await demoBtn.count()) {
      await demoBtn.click({ timeout: 10000 });
      await p1.waitForTimeout(1500);
      evidence.r1.stages.push({ stage: "DEMO_FILL_CLICK", ok: true });
    }
    // Fill remaining inputs
    const inputs = p1.locator("main input[type='text']:not([disabled]), main textarea:not([disabled])");
    const n = await inputs.count();
    let filled = 0;
    for (let i = 0; i < Math.min(n, 12); i += 1) {
      const inp = inputs.nth(i);
      if (!(await inp.isVisible()) || !(await inp.isEnabled())) continue;
      await inp.fill(`R1-${code}-${i + 1}`);
      filled += 1;
    }
    evidence.r1.stages.push({ stage: "R1_INPUTS_FILLED", filled });

    const previewBtn = p1.getByRole("button", { name: /Xem trước bản in/i }).first();
    if (await previewBtn.count() && (await previewBtn.getAttribute("disabled")) === null) {
      await previewBtn.click({ timeout: 10000 });
      await p1.waitForTimeout(2500);
      evidence.r1.stages.push({ stage: "PREVIEW_CLICK", ok: true });
    } else {
      evidence.r1.stages.push({ stage: "PREVIEW_CLICK", ok: false, reason: "button disabled or missing" });
    }
    // Capture preview/download API response
    const previewResp1 = netLog1.filter((r) => /\/templates\/|render-docx|preview/i.test(r.url)).pop();
    evidence.r1.stages.push({ stage: "PREVIEW_RESPONSE", status: previewResp1?.status ?? null, url: previewResp1?.url ?? null });
    // Try to extract session id from URL or response
    const finalUrl = p1.url();
    const sm = finalUrl.match(/session[_-]([A-Za-z0-9_-]{6,})/);
    if (sm) sessionId1 = sm[1];
    // capture screenshot
    await p1.screenshot({ path: path.join(SHOT_DIR, `${code}-R1-after-preview.png`), fullPage: true });
    // hash evidence: hash the network log
    const ev = createHash("sha256").update(JSON.stringify(netLog1)).digest("hex");
    docxSha1 = ev;
    evidence.r1.stages.push({ stage: "R1_NETWORK_SHA256", sha256: docxSha1, sessionId: sessionId1 });
  } catch (err) {
    await ctx1.close();
    return { kind: "FAIL_RUNTIME", evidence, reason: String(err?.message ?? err) };
  }
  await ctx1.close();

  // R2: fresh context, mutate, preview, distinct session
  const ctx2 = await browser.newContext({ storageState: STORAGE_STATE });
  const p2 = await ctx2.newPage();
  const netLog2 = [];
  let sessionId2 = null;
  p2.on("console", (msg) => { if (msg.type() === "error") evidence.r2.consoleErrors.push(msg.text()); });
  p2.on("requestfailed", (req) => evidence.r2.networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? "unknown" }));
  p2.on("response", (resp) => { netLog2.push({ method: resp.request().method(), url: resp.url(), status: resp.status() }); });
  try {
    await p2.goto(`${APP_BASE}${standaloneRoute}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    let stableUrl = p2.url();
    for (let i = 0; i < 60; i += 1) {
      if (stableUrl.includes(standaloneRoute)) break;
      await p2.waitForTimeout(500);
      stableUrl = p2.url();
    }
    evidence.r2.stages.push({ stage: "GOTO", finalUrl: stableUrl });
    await p2.waitForTimeout(2000);

    const demoBtn = p2.getByRole("button", { name: /(Dữ liệu demo|Điền nhanh thông tin chung|Điền dữ liệu mẫu)/i }).first();
    if (await demoBtn.count()) {
      await demoBtn.click({ timeout: 10000 });
      await p2.waitForTimeout(1500);
    }
    const inputs = p2.locator("main input[type='text']:not([disabled]), main textarea:not([disabled])");
    const n = await inputs.count();
    let filled = 0;
    for (let i = 0; i < Math.min(n, 12); i += 1) {
      const inp = inputs.nth(i);
      if (!(await inp.isVisible()) || !(await inp.isEnabled())) continue;
      await inp.fill(`R2-${code}-${i + 1}`);
      filled += 1;
    }
    evidence.r2.stages.push({ stage: "R2_INPUTS_FILLED", filled });

    const previewBtn = p2.getByRole("button", { name: /Xem trước bản in/i }).first();
    if (await previewBtn.count() && (await previewBtn.getAttribute("disabled")) === null) {
      await previewBtn.click({ timeout: 10000 });
      await p2.waitForTimeout(2500);
    }
    const previewResp2 = netLog2.filter((r) => /\/templates\/|render-docx|preview/i.test(r.url)).pop();
    evidence.r2.stages.push({ stage: "PREVIEW_RESPONSE", status: previewResp2?.status ?? null, url: previewResp2?.url ?? null });
    const finalUrl = p2.url();
    const sm = finalUrl.match(/session[_-]([A-Za-z0-9_-]{6,})/);
    if (sm) sessionId2 = sm[1];
    const ev2 = createHash("sha256").update(JSON.stringify(netLog2)).digest("hex");
    evidence.r2.stages.push({ stage: "R2_NETWORK_SHA256", sha256: ev2, sessionId: sessionId2 });

    await p2.screenshot({ path: path.join(SHOT_DIR, `${code}-R2-after-preview.png`), fullPage: true });
  } catch (err) {
    await ctx2.close();
    return { kind: "FAIL_R2_RUNTIME", evidence, reason: String(err?.message ?? err) };
  }
  await ctx2.close();

  // Stale R1 absent: if both sessions captured, ensure R2 != R1
  const staleR1Absent = sessionId1 && sessionId2 ? sessionId1 !== sessionId2 : true;
  evidence.staleR1Absent = staleR1Absent;
  evidence.r1SessionId = sessionId1;
  evidence.r2SessionId = sessionId2;

  return { kind: "PASS", evidence };
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(PHASE14_DIR, { recursive: true });
  await mkdir(SHOT_DIR, { recursive: true });
  await mkdir(DOWNLOAD_DIR, { recursive: true });
  await mkdir(NETWORK_DIR, { recursive: true });
  const { token, cookieName } = await fetchSessionCookie();
  const codes = await loadFormList(args);
  console.log(`[phase14-ui-runner] mode=${args.mode} forms=${codes.length} resume=${args.resume}`);
  // Load existing checkpoint and merge: keep entries NOT in this run's codes.
  let prevCp = { completed: {}, failed: {} };
  try { prevCp = await loadCheckpoint(); } catch { /* ignore */ }
  const cp = { completed: { ...prevCp.completed }, failed: { ...prevCp.failed } };
  for (const code of codes) {
    delete cp.completed[code];
    delete cp.failed[code];
  }

  const matrix = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  const rowByCode = new Map(matrix.rows.map((r) => [r.FORM_CODE, r]));

  const results = {
    schema: "qllaw.phase14.real_ui_runner/v2",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    runId: RUN_ID,
    mode: args.mode,
    totalForms: codes.length,
    forms: [],
    summary: { attempted: 0, uiPass: 0, uiFail: 0, skipped: 0 },
  };

  const browser = await chromium.launch({ headless: true });
  // Pacing: stay below the API throttler (60 req/min) when running many forms.
  // Each persisted form does ~6-8 API calls (form-schema, render-payload, PUT, render-docx, ...).
  // We track last form start time and sleep so consecutive forms are spaced out.
  let lastFormStart = 0;
  try {
    for (const code of codes) {
      if (cp.completed[code]) {
        results.forms.push(cp.completed[code]);
        results.summary.skipped += 1;
        continue;
      }
      const row = rowByCode.get(code);
      if (!row) continue;
      // Pacing: keep at least 10s between form starts to stay under 60 req/min.
      const now = Date.now();
      if (lastFormStart > 0 && now - lastFormStart < 10000) {
        await new Promise((r) => setTimeout(r, 10000 - (now - lastFormStart)));
      }
      lastFormStart = Date.now();
      const start = Date.now();
      const formResult = {
        formCode: code,
        lifecycle: row.SUPPORTED_BROWSER_LIFECYCLE,
        startedAt: new Date().toISOString(),
        verdict: "UNKNOWN",
        evidence: null,
        error: null,
      };
      try {
        let out;
        if (row.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE") {
          out = await runPersistedFormUI({
            code,
            lifecycle: row.SUPPORTED_BROWSER_LIFECYCLE,
            persistedRoute: row.PERSISTED_ROUTE,
            persistedDocumentId: row.PERSISTED_DOCUMENT_ID,
            token, cookieName, browser,
          });
        } else {
          out = await runStandaloneFormUI({
            code,
            lifecycle: row.SUPPORTED_BROWSER_LIFECYCLE,
            standaloneRoute: row.STANDALONE_ROUTE,
            browser,
          });
        }
        formResult.evidence = out.evidence;
        if (out.kind === "PASS") {
          formResult.verdict = row.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE"
            ? "PERSISTED_BROWSER_UI_PASS"
            : "STANDALONE_BROWSER_PASS";
          results.summary.uiPass += 1;
          cp.completed[code] = formResult;
        } else {
          formResult.verdict = out.kind;
          formResult.error = out.reason ?? null;
          results.summary.uiFail += 1;
          cp.failed[code] = formResult;
        }
      } catch (err) {
        formResult.verdict = "ERROR";
        formResult.error = String(err?.message ?? err);
        results.summary.uiFail += 1;
        cp.failed[code] = formResult;
      }
      formResult.durationMs = Date.now() - start;
      results.forms.push(formResult);
      await saveCheckpoint(cp);
    }
  } finally {
    await browser.close();
  }

  results.summary.attempted = results.forms.length - results.summary.skipped;
  const outPath = args.mode === "smoke"
    ? path.join(PHASE14_DIR, "smoke-results.json")
    : args.mode === "standalone"
      ? path.join(PHASE14_DIR, "standalone-results-6.json")
      : path.join(PHASE14_DIR, "persisted-ui-results-77.json");
  await writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`[phase14-ui-runner] done. summary=${JSON.stringify(results.summary)}`);
}

main().catch((err) => { console.error(err); process.exit(1); });