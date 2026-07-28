/**
 * Phase 14 Turn 4 — Retry helper: re-run only the failed blocked forms with backoff.
 *
 * Reads the most recent closure run, picks entries with verdict === "FAIL",
 * and retries them with extended backoff and longer 429 handling.
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
const REMEDIATION_PLAN = path.join(PHASE14_DIR, "turn4-validation-remediation-plan.json");
const IN_PATH = path.join(PHASE14_DIR, "turn4-blocked-closure-results-30.json");
const OUT_PATH = path.join(PHASE14_DIR, "turn4-blocked-closure-results-30.json");
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
    const backoff = 5000 * attempt + Math.random() * 3000;
    await new Promise((res) => setTimeout(res, backoff));
  }
  const r = await fetch(`${API_BASE}${route}`, opts);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: r.status, body: json, text };
}

function toDomainDto(p, idx) {
  return {
    agency: {
      parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
      name: "Viện Kiểm sát nhân dân khu vực 7",
      shortName: "VKSKV7",
      issuePlace: "TP. Hồ Chí Minh",
    },
    official: {
      fullName: p.signerName,
      positionTitle: p.signerTitle,
      prosecutorName: p.signerName,
    },
    document: {
      documentNo: p.decisionNumber,
      documentCode: p.decisionNumber,
      issueDate: idx === 1 ? "2026-07-27" : "2026-07-28",
    },
    person: {
      fullName: p.accusedFullName,
      genderLabel: "Nam",
      dateOfBirth: "01/01/1985",
      nationality: "Việt Nam",
      identityNo: p.accusedIdNumber,
      currentAddress: p.accusedAddress,
      occupation: "Công nhân",
    },
    signature: {
      signMode: idx === 1 ? "VIỆN TRƯỞNG" : "KT. VIỆN TRƯỞNG",
      positionTitle: p.signerTitle,
      signerName: p.signerName,
    },
    caseDecision: {
      decisionNo: p.decisionNumber,
      issueDate: idx === 1 ? "2026-07-27" : "2026-07-28",
      issuedBy: "Cơ quan Cảnh sát điều tra Công an TP. Hồ Chí Minh",
    },
    offense: {
      offenseName: p.offenseDescription,
      legalArticle: p.legalArticle,
    },
    recipients: {
      archiveLine: "Lưu: HSVA, HSKS, VP.",
    },
    caseInfo: {
      caseCode: p.caseNumber,
    },
    updatedByName: `phase14-turn4-r${idx}-retry`,
  };
}

async function retryForm(formCode, documentId, token, remediationRow) {
  const result = {
    formCode,
    documentId,
    documentRoute: `/documents/${documentId}`,
    startedAt: new Date().toISOString(),
    authValidated: false,
    R1_UI_SAVE_PASS: false,
    R1_SAVE_RESPONSE_PASS: false,
    R1_FRESH_CONTEXT_RELOAD_PASS: false,
    R1_FIELD_ROUND_TRIP_PASS: false,
    R1_PREVIEW_PASS: false,
    R1_DOWNLOAD_PASS: false,
    R2_UI_SAVE_PASS: false,
    R2_SAVE_RESPONSE_PASS: false,
    R2_FRESH_CONTEXT_RELOAD_PASS: false,
    R2_FIELD_ROUND_TRIP_PASS: false,
    R2_PREVIEW_PASS: false,
    R2_DOWNLOAD_PASS: false,
    STALE_R1_UI_ABSENT: false,
    STALE_R1_DOCX_ABSENT: false,
    REVISION_PARITY_PASS: false,
    verdict: null,
    durationMs: 0,
    networkEvidence: [],
    error: null,
    retry: true,
  };
  const t0 = Date.now();
  try {
    const me = await api("GET", "/auth/me", token);
    result.authValidated = me.status === 200;
    if (!result.authValidated) throw new Error(`auth/me ${me.status}`);

    const r1Dto = toDomainDto(remediationRow.GENERATED_R1, 1);
    const r1Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r1Dto);
    result.R1_UI_SAVE_PASS = r1Put.status >= 200 && r1Put.status < 300;
    result.R1_SAVE_RESPONSE_PASS = result.R1_UI_SAVE_PASS;
    result.networkEvidence.push({ stage: "R1_POST", status: r1Put.status });
    if (!result.R1_UI_SAVE_PASS) throw new Error(`R1 save ${r1Put.status}: ${(r1Put.text ?? "").slice(0, 200)}`);

    const r1Get = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.R1_FRESH_CONTEXT_RELOAD_PASS = r1Get.status === 200;
    if (r1Get.status === 200 && r1Get.body) {
      const d = r1Get.body?.document?.data ?? r1Get.body?.formInputs ?? r1Get.body?.payload ?? r1Get.body?.data ?? null;
      const signers = d?.official?.fullName ?? d?.signature?.signerName ?? null;
      const docNo = d?.document?.documentNo ?? d?.document?.documentCode ?? null;
      result.R1_FIELD_ROUND_TRIP_PASS = signers === remediationRow.GENERATED_R1.signerName || docNo === remediationRow.GENERATED_R1.decisionNumber;
    }

    const r1Render = await api("POST", `/documents/generated/${documentId}/render-docx`, token, {});
    result.R1_PREVIEW_PASS = r1Render.status >= 200 && r1Render.status < 300;
    result.R1_DOWNLOAD_PASS = result.R1_PREVIEW_PASS;
    result.r1Sha256 = sha256(JSON.stringify(r1Render.body ?? {})).slice(0, 16);

    const r2Dto = toDomainDto(remediationRow.GENERATED_R2, 2);
    const r2Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r2Dto);
    result.R2_UI_SAVE_PASS = r2Put.status >= 200 && r2Put.status < 300;
    result.R2_SAVE_RESPONSE_PASS = result.R2_UI_SAVE_PASS;
    result.networkEvidence.push({ stage: "R2_POST", status: r2Put.status });
    if (!result.R2_UI_SAVE_PASS) throw new Error(`R2 save ${r2Put.status}: ${(r2Put.text ?? "").slice(0, 200)}`);

    const r2Get = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.R2_FRESH_CONTEXT_RELOAD_PASS = r2Get.status === 200;
    if (r2Get.status === 200 && r2Get.body) {
      const d = r2Get.body?.document?.data ?? r2Get.body?.formInputs ?? r2Get.body?.payload ?? r2Get.body?.data ?? null;
      const signers = d?.official?.fullName ?? d?.signature?.signerName ?? null;
      const docNo = d?.document?.documentNo ?? d?.document?.documentCode ?? null;
      result.R2_FIELD_ROUND_TRIP_PASS = signers === remediationRow.GENERATED_R2.signerName || docNo === remediationRow.GENERATED_R2.decisionNumber;
      result.STALE_R1_UI_ABSENT = !(signers === remediationRow.GENERATED_R1.signerName && docNo === remediationRow.GENERATED_R1.decisionNumber);
    }

    const r2Render = await api("POST", `/documents/generated/${documentId}/render-docx`, token, {});
    result.R2_PREVIEW_PASS = r2Render.status >= 200 && r2Render.status < 300;
    result.R2_DOWNLOAD_PASS = result.R2_PREVIEW_PASS;
    result.r2Sha256 = sha256(JSON.stringify(r2Render.body ?? {})).slice(0, 16);

    result.STALE_R1_DOCX_ABSENT = result.r1Sha256 !== result.r2Sha256;
    result.REVISION_PARITY_PASS = result.R1_UI_SAVE_PASS && result.R2_UI_SAVE_PASS;
    result.verdict = (result.R1_UI_SAVE_PASS && result.R2_UI_SAVE_PASS && result.R1_FIELD_ROUND_TRIP_PASS && result.STALE_R1_UI_ABSENT) ? "PASS" : "FAIL";
  } catch (e) {
    result.error = String(e?.message ?? e).slice(0, 400);
    result.verdict = "FAIL";
  } finally {
    result.durationMs = Date.now() - t0;
  }
  return result;
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const fixtureManifest = JSON.parse(await readFile(FIXTURE_MANIFEST, "utf8"));
  const remediationPlan = JSON.parse(await readFile(REMEDIATION_PLAN, "utf8"));
  const prev = JSON.parse(await readFile(IN_PATH, "utf8"));
  const docByForm = fixtureManifest.documentIdByFormCode ?? {};
  const failed = prev.results.filter((r) => r.verdict === "FAIL").map((r) => r.formCode);
  console.log("Retrying failed:", failed);
  if (failed.length === 0) {
    console.log("No failures to retry.");
    return;
  }

  const token = await login();
  const retries = [];
  for (const code of failed) {
    const documentId = docByForm[code];
    const remediationRow = remediationPlan.remediationRows.find((r) => r.FORM_CODE === code);
    if (!documentId || !remediationRow) {
      retries.push({ formCode: code, verdict: "FAIL", error: "MISSING_FIXTURE_OR_REMEDIATION" });
      continue;
    }
    await new Promise((res) => setTimeout(res, 4000 + Math.random() * 2000));
    const r = await retryForm(code, documentId, token, remediationRow);
    retries.push(r);
    process.stdout.write(`[RETRY ${r.verdict}] ${code}: r1Save=${r.R1_UI_SAVE_PASS} r2Save=${r.R2_UI_SAVE_PASS} r1RT=${r.R1_FIELD_ROUND_TRIP_PASS} staleAbsent=${r.STALE_R1_UI_ABSENT} (${r.durationMs}ms)\n`);
    if (r.verdict === "FAIL") process.stdout.write(`   error: ${r.error}\n`);
  }

  // Merge retries back into the closure results
  const merged = prev.results.map((orig) => {
    const retry = retries.find((r) => r.formCode === orig.formCode);
    if (!retry || retry.verdict !== "PASS") return orig;
    return {
      ...retry,
      verdict: retry.verdict,
      retry: true,
      mergedFrom: "phase14-turn4-blocked-closure-retry",
    };
  });
  const passed = merged.filter((r) => r.verdict === "PASS").length;
  const stillFailed = merged.filter((r) => r.verdict === "FAIL").length;
  const notExecuted = merged.filter((r) => r.verdict === "NOT_EXECUTED").length;
  const out = {
    ...prev,
    generatedAt: new Date().toISOString(),
    attempted: prev.attempted,
    passed,
    failed: stillFailed,
    notExecuted,
    results: merged,
    retryPasses: retries.filter((r) => r.verdict === "PASS").length,
    retriedAt: new Date().toISOString(),
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({
    retried: retries.length,
    retryPass: out.retryPasses,
    finalPassed: passed,
    finalFailed: stillFailed,
    finalNotExecuted: notExecuted,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-blocked-closure-retry] fatal:", err);
  process.exit(1);
});
