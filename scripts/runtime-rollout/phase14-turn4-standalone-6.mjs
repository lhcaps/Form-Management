/**
 * Phase 14 Turn 4 — Standalone-6 fresh revalidation (BM-157/168/174/181/206/213).
 *
 * For each:
 *   POST /api/v1/forms/runtime/:code/preview-session with R1 data
 *   GET .../preview-sessions/:sessionId/docx for R1 docx
 *   POST preview-session with R2 data
 *   GET .../preview-sessions/:sessionId/docx for R2 docx
 *   Compare R1 vs R2 sha256
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
const OUT_PATH = path.join(PHASE14_DIR, "turn4-standalone-6-results.json");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

dotenv.config({ path: ".env.e2e.local", override: false });

const STANDALONE_FORMS = ["BM-157", "BM-168", "BM-174", "BM-181", "BM-206", "BM-213"];

async function login() {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
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
  throw new Error("login failed");
}

function payload(formCode, idx) {
  return {
    data: {
      agency: {
        parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        name: "Viện Kiểm sát nhân dân khu vực 7",
        shortName: "VKSKV7",
      },
      official: {
        fullName: `Standalone ${idx === 1 ? "First" : "Second"} Pass`,
        positionTitle: "PHÓ VIỆN TRƯỞNG",
      },
      document: {
        documentNo: `01/ST-${formCode}-R${idx}`,
        issueDate: "2026-07-27",
      },
      person: { fullName: `Bị can ${formCode} R${idx}` },
      signature: { signerName: `Standalone ${idx === 1 ? "First" : "Second"} Pass`, positionTitle: "PHÓ VIỆN TRƯỞNG" },
    },
  };
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

async function runStandalone(formCode, token) {
  const r1Session = await api("POST", `/forms/runtime/${formCode}/preview-session`, token, payload(formCode, 1));
  let r1DocxPass = false;
  let r1Sha = null;
  let sessionIdR1 = null;
  if (r1Session.status === 200 && r1Session.body) {
    sessionIdR1 = r1Session.body?.sessionId ?? r1Session.body?.id ?? null;
    if (sessionIdR1) {
      const docx = await api("GET", `/forms/runtime/preview-sessions/${sessionIdR1}/docx`, token);
      r1DocxPass = docx.status === 200;
      r1Sha = createHash("sha256").update(docx.text).digest("hex").slice(0, 16);
    }
  }

  const r2Session = await api("POST", `/forms/runtime/${formCode}/preview-session`, token, payload(formCode, 2));
  let r2DocxPass = false;
  let r2Sha = null;
  let sessionIdR2 = null;
  if (r2Session.status === 200 && r2Session.body) {
    sessionIdR2 = r2Session.body?.sessionId ?? r2Session.body?.id ?? null;
    if (sessionIdR2) {
      const docx = await api("GET", `/forms/runtime/preview-sessions/${sessionIdR2}/docx`, token);
      r2DocxPass = docx.status === 200;
      r2Sha = createHash("sha256").update(docx.text).digest("hex").slice(0, 16);
    }
  }

  const r1SessionPass = r1Session.status === 200;
  const r2SessionPass = r2Session.status === 200;
  const revisionParity = r1Sha && r2Sha && r1Sha !== r2Sha;
  const verdict = r1SessionPass && r2SessionPass && r1DocxPass && r2DocxPass ? "PASS" : "FAIL";

  return {
    formCode,
    R1_SESSION: r1SessionPass,
    R1_DOCX: r1DocxPass,
    R1_SHA: r1Sha,
    R2_SESSION: r2SessionPass,
    R2_DOCX: r2DocxPass,
    R2_SHA: r2Sha,
    REVISION_PARITY: revisionParity,
    sessionIdR1,
    sessionIdR2,
    verdict,
    error: verdict === "FAIL" ? {
      r1Status: r1Session.status,
      r2Status: r2Session.status,
      r1Text: (r1Session.text ?? "").slice(0, 200),
      r2Text: (r2Session.text ?? "").slice(0, 200),
    } : null,
  };
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const token = await login();

  const results = [];
  for (const code of STANDALONE_FORMS) {
    const r = await runStandalone(code, token);
    results.push(r);
    process.stdout.write(`[${r.verdict}] ${code}: R1_SESSION=${r.R1_SESSION} R1_DOCX=${r.R1_DOCX} R2_SESSION=${r.R2_SESSION} R2_DOCX=${r.R2_DOCX} (parity=${r.REVISION_PARITY})\n`);
    if (r.verdict === "FAIL") process.stdout.write(`   err: ${JSON.stringify(r.error).slice(0, 200)}\n`);
    await new Promise((res) => setTimeout(res, 300 + Math.random() * 600));
  }

  const pass = results.filter((r) => r.verdict === "PASS").length;
  const fail = results.filter((r) => r.verdict === "FAIL").length;

  const out = {
    schema: "qllaw.phase14.turn4_standalone_6_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    totalForms: STANDALONE_FORMS.length,
    pass,
    fail,
    verificationMethod: "API_BASED_RUNTIME_PREVIEW_SESSION",
    forms: results,
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ totalForms: out.totalForms, pass: out.pass, fail: out.fail }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-standalone-6] fatal:", err);
  process.exit(1);
});
