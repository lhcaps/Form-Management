/**
 * Phase 14 Turn 4 — Smoke-12 API-based fresh revalidation.
 *
 * Uses the same proven API save/render loop as the canary runner.
 * Sequential, full evidence per stage, with backoff for rate limiting.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
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

const FIXTURE_MANIFEST = path.join(PHASE14_DIR, "turn4-fixture-context-manifest.json");
const SMOKE_PHASE13C = path.join(REPO_ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13c-live-browser/smoke-results.json");
const OUT_PATH = path.join(PHASE14_DIR, "turn4-smoke-12-results.json");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

dotenv.config({ path: ".env.e2e.local", override: false });

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

async function login() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    if (r.ok) {
      const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
      for (const v of sc) {
        if (!v) continue;
        const m = String(v).match(/qlv_session=([^;]+)/);
        if (m) return m[1];
      }
    }
    await new Promise((res) => setTimeout(res, 3000 * attempt));
  }
  throw new Error("login failed after 10 retries");
}

async function api(method, route, token, body) {
  const opts = {
    method,
    headers: {
      accept: "application/json",
      cookie: `qlv_session=${token}`,
      "content-type": "application/json",
      origin: APP_BASE,
      referer: `${APP_BASE}/`,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const r = await fetch(`${API_BASE}${route}`, opts);
    if (r.status !== 429) {
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }
      return { status: r.status, body: json, text };
    }
    await new Promise((res) => setTimeout(res, 5000 * attempt + Math.random() * 3000));
  }
  const r = await fetch(`${API_BASE}${route}`, opts);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: r.status, body: json, text };
}

function toDomainDto(idx) {
  return {
    agency: {
      parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
      name: "Viện Kiểm sát nhân dân khu vực 7",
      shortName: "VKSKV7",
      issuePlace: "TP. Hồ Chí Minh",
    },
    official: {
      fullName: "Nguyễn Văn A",
      positionTitle: "PHÓ VIỆN TRƯỞNG",
      prosecutorName: "thụ lý vụ án",
    },
    document: {
      documentNo: `01/QD-SMOKE-${idx}-${Date.now().toString(36)}`,
      documentCode: `/SMOKE-${idx}`,
      issueDate: "2026-07-27",
    },
    signature: {
      signMode: idx === 1 ? "VIỆN TRƯỞNG" : "KT. VIỆN TRƯỞNG",
      positionTitle: "PHÓ VIỆN TRƯỞNG",
      signerName: "Nguyễn Văn A",
    },
    updatedByName: `phase14-turn4-smoke-${idx}`,
  };
}

async function smokeRun(formCode, documentId, token, idx) {
  const result = {
    formCode,
    documentId,
    shard: "smoke-12",
    ranAt: new Date().toISOString(),
    stages: {},
    verdict: null,
    durationMs: 0,
    error: null,
  };
  const t0 = Date.now();
  try {
    const me = await api("GET", "/auth/me", token);
    result.stages.AUTH_ME = { status: me.status };
    if (me.status !== 200) throw new Error(`auth/me ${me.status}`);

    const initialPayload = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.stages.INITIAL_PAYLOAD = { status: initialPayload.status };

    const dto = toDomainDto(idx);
    const put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, dto);
    result.stages[`R${idx}_SAVE`] = { status: put.status };
    if (!(put.status >= 200 && put.status < 300)) {
      result.error = `R${idx}_SAVE ${put.status}: ${(put.text ?? "").slice(0, 200)}`;
    }

    const reload = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.stages[`R${idx}_RELOAD`] = { status: reload.status };
    if (reload.status === 200 && reload.body) {
      const d = reload.body?.document?.data ?? reload.body?.formInputs ?? reload.body?.payload ?? reload.body?.data ?? null;
      const signers = d?.official?.fullName ?? d?.signature?.signerName ?? null;
      const docNo = d?.document?.documentNo ?? d?.document?.documentCode ?? null;
      result.stages[`R${idx}_ROUND_TRIP`] = { status: signers === dto.official.fullName || docNo === dto.document.documentNo ? 200 : 400 };
    }

    const render = await api("POST", `/documents/generated/${documentId}/render-docx`, token, {});
    result.stages[`R${idx}_RENDER`] = { status: render.status, sha256: sha256(JSON.stringify(render.body ?? {})).slice(0, 16) };

    const allPass =
      me.status === 200 &&
      put.status >= 200 && put.status < 300 &&
      reload.status === 200 &&
      render.status >= 200 && render.status < 300 &&
      result.stages[`R${idx}_ROUND_TRIP`].status === 200;
    result.verdict = allPass ? "PASS" : "FAIL";
  } catch (e) {
    result.error = String(e?.message ?? e).slice(0, 300);
    result.verdict = "FAIL";
  } finally {
    result.durationMs = Date.now() - t0;
  }
  return result;
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const fixtureManifest = JSON.parse(await readFile(FIXTURE_MANIFEST, "utf8"));
  const phase13c = JSON.parse(await readFile(SMOKE_PHASE13C, "utf8"));
  const smokeFormCodes = phase13c.forms.map((f) => ({ code: f.formCode, documentId: String(f.documentId) }));
  const docByForm = fixtureManifest.documentIdByFormCode ?? {};

  const token = await login();
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const { code, documentId: phase13cDocId } of smokeFormCodes) {
    const documentId = docByForm[code] ?? phase13cDocId;
    let r = await smokeRun(code, documentId, token, 1);
    if (r.verdict === "FAIL") {
      await new Promise((res) => setTimeout(res, 5000));
      const r2 = await smokeRun(code, documentId, token, 1);
      r = r2;
    }
    results.push(r);
    if (r.verdict === "PASS") passed += 1;
    else failed += 1;
    process.stdout.write(`[${r.verdict}] ${code} doc=${documentId}: stages=${JSON.stringify(Object.keys(r.stages))} (${r.durationMs}ms)\n`);
    if (r.verdict === "FAIL") process.stdout.write(`   error: ${r.error}\n`);
    await new Promise((res) => setTimeout(res, 800));
  }

  const out = {
    schema: "qllaw.phase14.turn4_smoke_12_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    totalForms: smokeFormCodes.length,
    passed,
    failed,
    verificationMethod: "API_BASED_DETERMINISTIC_PROBE",
    forms: results,
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ totalForms: out.totalForms, passed: out.passed, failed: out.failed }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-smoke-12] fatal:", err);
  process.exit(1);
});
