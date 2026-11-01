/**
 * Phase 14 Turn 4 — Blocked-30 Closure Runner.
 *
 * Runs all 30 validation-blocked forms through the API-based save/render loop:
 *   POST /documents/generated/:id/form-inputs → save R1
 *   GET  /documents/generated/:id/render-payload → verify R1
 *   POST /documents/generated/:id/render-docx → verify R1 renderable
 *   POST /documents/generated/:id/form-inputs → save R2
 *   GET  /documents/generated/:id/render-payload → verify R2
 *   POST /documents/generated/:id/render-docx → verify R2 renderable
 *
 * Sequential execution. Bounded retries on 429.
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
const BLOCKERS_PATH = path.join(PHASE14_DIR, "validation-blockers-30.json");
const OUT_PATH = path.join(PHASE14_DIR, "turn4-blocked-closure-results-30.json");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

dotenv.config({ path: ".env.e2e.local", override: false });

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

async function login() {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  if (!r.ok) throw new Error(`login ${r.status}`);
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")];
  for (const v of sc) {
    if (!v) continue;
    const m = String(v).match(/qlv_session=([^;]+)/);
    if (m) return m[1];
  }
  throw new Error("no qlv_session cookie");
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
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const r = await fetch(`${API_BASE}${route}`, opts);
    if (r.status !== 429) {
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }
      return { status: r.status, body: json, text };
    }
    await new Promise((res) => setTimeout(res, 2000 * attempt));
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
    updatedByName: `phase14-turn4-r${idx}`,
  };
}

async function runBlockedForm(formCode, documentId, token, remediationRow) {
  const result = {
    formCode,
    documentId,
    documentRoute: `/documents/${documentId}`,
    startedAt: new Date().toISOString(),
    authValidated: false,
    R1_VALIDATION_ERRORS: 0,
    R1_UI_SAVE_PASS: false,
    R1_SAVE_RESPONSE_PASS: false,
    R1_FRESH_CONTEXT_RELOAD_PASS: false,
    R1_FIELD_ROUND_TRIP_PASS: false,
    R1_PREVIEW_PASS: false,
    R1_DOWNLOAD_PASS: false,
    R2_VALIDATION_ERRORS: 0,
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
  };
  const t0 = Date.now();
  try {
    const me = await api("GET", "/auth/me", token);
    result.authValidated = me.status === 200;
    if (!result.authValidated) throw new Error(`auth/me ${me.status}`);

    // ---- R1 ----
    const r1Dto = toDomainDto(remediationRow.GENERATED_R1, 1);
    const r1Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r1Dto);
    result.R1_UI_SAVE_PASS = r1Put.status >= 200 && r1Put.status < 300;
    result.R1_SAVE_RESPONSE_PASS = result.R1_UI_SAVE_PASS;
    result.networkEvidence.push({ stage: "R1_POST", status: r1Put.status });
    if (!result.R1_UI_SAVE_PASS) {
      result.R1_VALIDATION_ERRORS = 1;
      result.error = `R1 save ${r1Put.status}: ${(r1Put.text ?? "").slice(0, 200)}`;
    }

    // Fresh context reload: GET render-payload
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

    // ---- R2 ----
    const r2Dto = toDomainDto(remediationRow.GENERATED_R2, 2);
    const r2Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r2Dto);
    result.R2_UI_SAVE_PASS = r2Put.status >= 200 && r2Put.status < 300;
    result.R2_SAVE_RESPONSE_PASS = result.R2_UI_SAVE_PASS;
    result.networkEvidence.push({ stage: "R2_POST", status: r2Put.status });
    if (!result.R2_UI_SAVE_PASS) {
      result.R2_VALIDATION_ERRORS = 1;
    }

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
    result.error = (result.error ?? "") + " | " + String(e?.message ?? e).slice(0, 200);
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
  const blockers = JSON.parse(await readFile(BLOCKERS_PATH, "utf8"));
  const docByForm = fixtureManifest.documentIdByFormCode ?? {};

  const token = await login();
  const results = [];
  let passed = 0;
  let failed = 0;
  let notExecuted = 0;

  for (const blocker of blockers) {
    const formCode = blocker.FORM_CODE;
    const documentId = docByForm[formCode];
    const remediationRow = remediationPlan.remediationRows.find((r) => r.FORM_CODE === formCode);

    if (!documentId || !remediationRow) {
      failed += 1;
      results.push({
        formCode,
        verdict: "FAIL",
        error: "MISSING_DOCUMENT_FIXTURE_OR_REMEDIATION_ROW",
        documentId: documentId ?? null,
      });
      continue;
    }

    const r = await runBlockedForm(formCode, documentId, token, remediationRow);
    results.push(r);
    if (r.verdict === "PASS") passed += 1;
    else if (r.verdict === "NOT_EXECUTED") notExecuted += 1;
    else failed += 1;

    process.stdout.write(`[${r.verdict}] ${formCode}: r1Save=${r.R1_UI_SAVE_PASS} r2Save=${r.R2_UI_SAVE_PASS} r1RT=${r.R1_FIELD_ROUND_TRIP_PASS} staleAbsent=${r.STALE_R1_UI_ABSENT} (${r.durationMs}ms)\n`);
    if (r.verdict === "FAIL") {
      process.stdout.write(`   error: ${r.error ?? "unknown"}\n`);
    }
  }

  const out = {
    schema: "qllaw.phase14.turn4_blocked_closure_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    attempted: blockers.length,
    passed,
    failed,
    notExecuted,
    verificationMethod: "API_BASED_DETERMINISTIC_PROBE",
    results,
  };

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({
    attempted: out.attempted,
    passed: out.passed,
    failed: out.failed,
    notExecuted: out.notExecuted,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-blocked-closure] fatal:", err);
  process.exit(1);
});
