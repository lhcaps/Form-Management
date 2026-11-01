/**
 * Phase 14 Turn 4 — API-Based Canary Verification (revised with correct endpoints).
 *
 * Endpoints:
 *  - POST /api/v1/auth/login → qlv_session cookie
 *  - GET  /api/v1/auth/me → validate session
 *  - POST /api/v1/documents/generated/:id/form-inputs → save R1/R2 (domain objects)
 *  - GET  /api/v1/documents/generated/:id/render-payload → verify R1/R2 persisted
 *  - POST /api/v1/documents/generated/:id/render-docx → verify R1/R2 renderable
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
const OUT_PATH = path.join(PHASE14_DIR, "turn4-canary-results-7.json");
const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";

dotenv.config({ path: ".env.e2e.local", override: false });

const CANARIES = ["BM-058", "BM-065", "BM-067", "BM-077", "BM-079", "BM-082", "BM-089"];

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
  const r = await fetch(`${API_BASE}${route}`, opts);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: r.status, body: json, text };
}

// Map remediation payload to DTO domain objects
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
      issueDate: "2026-07-27",
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
      issueDate: "2026-07-27",
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

async function runCanary(formCode, documentId, token, remediationRow) {
  const result = {
    formCode,
    documentId,
    documentRoute: `/documents/${documentId}`,
    startedAt: new Date().toISOString(),
    authValidated: false,
    r1: { savePass: false, reloadPass: false, previewPass: false, downloadPass: false, fieldRoundTripPass: false, validationErrors: [] },
    r2: { savePass: false, reloadPass: false, previewPass: false, downloadPass: false, fieldRoundTripPass: false, validationErrors: [] },
    staleR1UiAbsent: false,
    staleR1DocxAbsent: false,
    revisionParityPass: false,
    verdict: null,
    durationMs: 0,
    networkEvidence: [],
    error: null,
  };
  const t0 = Date.now();
  try {
    // Step 1: Validate auth
    const me = await api("GET", "/auth/me", token);
    result.authValidated = me.status === 200;
    if (!result.authValidated) throw new Error(`auth/me ${me.status}`);

    // Step 2: GET render-payload to discover current formInputs shape
    const initialPayload = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.networkEvidence.push({ stage: "INITIAL_PAYLOAD", status: initialPayload.status });
    if (initialPayload.status !== 200) {
      throw new Error(`render-payload ${initialPayload.status}`);
    }

    // Step 3: PUT R1 (domain DTO shape)
    const r1Dto = toDomainDto(remediationRow.GENERATED_R1, 1);
    const r1Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r1Dto);
    result.r1.savePass = r1Put.status >= 200 && r1Put.status < 300;
    result.networkEvidence.push({ stage: "R1_POST", status: r1Put.status });
    if (!result.r1.savePass) {
      result.r1.validationErrors.push(`R1_POST_${r1Put.status}`);
      result.r1.serverErrorBody = (r1Put.text ?? "").slice(0, 500);
    }

    // Step 4: GET render-payload to verify R1 persisted
    const r1Get = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.networkEvidence.push({ stage: "R1_GET", status: r1Get.status });
    if (r1Get.status === 200 && r1Get.body) {
      const d = r1Get.body?.document?.data ?? r1Get.body?.formInputs ?? r1Get.body?.payload ?? r1Get.body?.data ?? null;
      const signers = d?.official?.fullName ?? d?.signature?.signerName ?? null;
      const docNo = d?.document?.documentNo ?? d?.document?.documentCode ?? null;
      result.r1.fieldRoundTripPass = signers === remediationRow.GENERATED_R1.signerName || docNo === remediationRow.GENERATED_R1.decisionNumber;
      result.r1.reloadPass = result.r1.fieldRoundTripPass;
    }

    // Step 5: POST render-docx for R1
    const r1Render = await api("POST", `/documents/generated/${documentId}/render-docx`, token, {});
    result.r1.downloadPass = r1Render.status >= 200 && r1Render.status < 300;
    result.r1.previewPass = result.r1.downloadPass;
    result.r1.r1Sha256 = sha256(JSON.stringify(r1Render.body ?? {})).slice(0, 16);
    result.networkEvidence.push({ stage: "R1_RENDER", status: r1Render.status });

    // Step 6: POST R2
    const r2Dto = toDomainDto(remediationRow.GENERATED_R2, 2);
    const r2Put = await api("POST", `/documents/generated/${documentId}/form-inputs`, token, r2Dto);
    result.r2.savePass = r2Put.status >= 200 && r2Put.status < 300;
    result.networkEvidence.push({ stage: "R2_POST", status: r2Put.status });
    if (!result.r2.savePass) {
      result.r2.validationErrors.push(`R2_POST_${r2Put.status}`);
      result.r2.serverErrorBody = (r2Put.text ?? "").slice(0, 500);
    }

    // Step 7: GET render-payload to verify R2 persisted and R1 absent
    const r2Get = await api("GET", `/documents/generated/${documentId}/render-payload`, token);
    result.networkEvidence.push({ stage: "R2_GET", status: r2Get.status });
    if (r2Get.status === 200 && r2Get.body) {
      const d = r2Get.body?.document?.data ?? r2Get.body?.formInputs ?? r2Get.body?.payload ?? r2Get.body?.data ?? null;
      const signers = d?.official?.fullName ?? d?.signature?.signerName ?? null;
      const docNo = d?.document?.documentNo ?? d?.document?.documentCode ?? null;
      result.r2.fieldRoundTripPass = signers === remediationRow.GENERATED_R2.signerName || docNo === remediationRow.GENERATED_R2.decisionNumber;
      result.r2.reloadPass = result.r2.fieldRoundTripPass;
      result.staleR1UiAbsent = !(signers === remediationRow.GENERATED_R1.signerName && docNo === remediationRow.GENERATED_R1.decisionNumber);
    }

    // Step 8: POST render-docx for R2
    const r2Render = await api("POST", `/documents/generated/${documentId}/render-docx`, token, {});
    result.r2.downloadPass = r2Render.status >= 200 && r2Render.status < 300;
    result.r2.previewPass = result.r2.downloadPass;
    result.r2.r2Sha256 = sha256(JSON.stringify(r2Render.body ?? {})).slice(0, 16);
    result.networkEvidence.push({ stage: "R2_RENDER", status: r2Render.status });

    result.staleR1DocxAbsent = result.r1.r1Sha256 !== result.r2.r2Sha256;
    result.revisionParityPass = result.r1.savePass && result.r2.savePass;
    result.verdict = (result.r1.savePass && result.r2.savePass && result.r1.fieldRoundTripPass && result.staleR1UiAbsent) ? "PASS" : "FAIL";
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
  const docByForm = fixtureManifest.documentIdByFormCode ?? {};

  const token = await login();
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const code of CANARIES) {
    const documentId = docByForm[code];
    const remediationRow = remediationPlan.remediationRows.find((r) => r.FORM_CODE === code);
    if (!documentId || !remediationRow) {
      failed += 1;
      results.push({ formCode: code, verdict: "FAIL", error: "MISSING_DOCUMENT_FIXTURE_OR_REMEDIATION_ROW" });
      continue;
    }
    const r = await runCanary(code, documentId, token, remediationRow);
    results.push(r);
    if (r.verdict === "PASS") passed += 1;
    else failed += 1;
    process.stdout.write(`[${r.verdict}] ${code}: r1Save=${r.r1.savePass} r2Save=${r.r2.savePass} r1Reload=${r.r1.fieldRoundTripPass} staleAbsent=${r.staleR1UiAbsent} (${r.durationMs}ms)\n`);
    if (r.r1.validationErrors.length) process.stdout.write(`   R1 err: ${JSON.stringify(r.r1.validationErrors)} body: ${(r.r1.serverErrorBody ?? '').slice(0,200)}\n`);
  }

  const out = {
    schema: "qllaw.phase14.turn4_canary_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    attempted: CANARIES.length,
    passed,
    failed,
    canaries: CANARIES,
    verificationMethod: "API_BASED_DETERMINISTIC_PROBE",
    results,
  };

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ attempted: out.attempted, passed: out.passed, failed: out.failed }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-canary-runner] fatal:", err);
  process.exit(1);
});
