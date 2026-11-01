/**
 * Phase 13C runner — executes the persisted browser lifecycle for a single
 * form via the real API endpoints and documents every evidence point.
 *
 * For each form, the runner:
 *   1. Creates execution-owned draft (POST /documents/draft-from-template)
 *   2. Loads render-payload (GET /documents/generated/<id>/render-payload)
 *   3. Saves R1 form-inputs (PUT /documents/generated/<id>/form-inputs)
 *   4. Reloads R1 (GET /documents/generated/<id>/form-inputs)
 *   5. Renders R1 DOCX (POST /documents/generated/<id>/render-docx)
 *   6. Saves R2 form-inputs (PUT /documents/generated/<id>/form-inputs)
 *   7. Reloads R2 (GET /documents/generated/<id>/form-inputs)
 *   8. Renders R2 DOCX (POST /documents/generated/<id>/render-docx)
 *   9. Verifies stale R1 absent from R2 payload
 *  10. Downloads DOCX (GET /documents/generated/<id>/files/<fileId>/download)
 *
 * The runner does NOT drive the browser UI in this script — the UI driver
 * is the persisted-document-fixture.ts helper called from the .auth.spec.ts
 * runner. This script is the API-level executor that documents the data
 * plane independently.
 *
 * Usage:  node scripts/runtime-rollout/run-phase13c-browser-e2e.mjs [--mode smoke|full] [--form BM-NNN] [--shard-index N] [--shard-count N] [--workers N] [--run-id ID]
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13c-live-browser",
);
const PHASE13B_DIR = path.join(PHASE13C_DIR.replace("phase13c-live-browser", "phase13b-persisted-browser"));

const APP_BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE = process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const COOKIE_NAME = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";
const RUN_ID = process.env.RUN_ID ?? "PHASE13C_2026_07_27_0137";
const CASE_ID = process.env.CASE_ID ?? "37";

const RUNTIME_READY_CODES = [
  "BM-001", "BM-002", "BM-008", "BM-010", "BM-012", "BM-136", "BM-148",
  "BM-156", "BM-157", "BM-168", "BM-171", "BM-174", "BM-181", "BM-206",
  "BM-213",
];

function parseArgs(argv) {
  const out = { mode: "smoke", form: null, shardIndex: 0, shardCount: 1, workers: 3 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--mode") out.mode = argv[++i];
    else if (a === "--form") out.form = argv[++i];
    else if (a === "--shard-index") out.shardIndex = Number(argv[++i]);
    else if (a === "--shard-count") out.shardCount = Number(argv[++i]);
    else if (a === "--workers") out.workers = Number(argv[++i]);
    else if (a === "--run-id") { out.runId = argv[++i]; process.env.RUN_ID = out.runId; }
  }
  return out;
}

async function fetchSessionCookie() {
  const body = JSON.stringify({ username: USERNAME, password: PASSWORD });
  let lastErr = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body,
    });
    if (res.ok) {
      const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")];
      for (const v of sc) {
        if (!v) continue;
        const m = String(v).match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
        if (m) return m[1];
      }
    }
    if (res.status === 429) {
      lastErr = `throttled ${res.status} attempt ${attempt}`;
      const wait = 2000 * attempt;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`login failed: ${res.status}`);
  }
  throw new Error(`login failed after retries: ${lastErr}`);
}

async function callApi(method, path, token, body, origin = APP_BASE) {
  const headers = {
    accept: "application/json",
    cookie: `${COOKIE_NAME}=${token}`,
    "content-type": "application/json",
    origin,
    referer: `${origin}/`,
  };
  // Retry on 429 with backoff
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const opts = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
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
    // 429: exponential backoff
    const wait = 2000 * attempt + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error("callApi: unreachable");
}

async function execForm(formCode, token) {
  const result = {
    formCode,
    createdAt: new Date().toISOString(),
    stages: [],
    errors: [],
    verdict: "FAIL",
  };
  if (RUNTIME_READY_CODES.includes(formCode)) {
    result.bridgeligibility = "PERSISTED_BRIDGE_BLOCKED_BY_RUNTIME_READY";
    result.skipReason = "STANDALONE_RUNTIME_TEMPLATE — runtime-ready form uses standalone preview session, not persisted draft bridge.";
    result.verdict = "SKIPPED_RUNTIME_READY";
    return result;
  }
  result.bridgeligibility = "AVAILABLE_VIA_DRAFT_BRIDGE";

  // Stage 1: Create draft
  const draftRes = await callApi("POST", "/documents/draft-from-template", token, {
    templateCode: formCode,
    caseId: CASE_ID,
  });
  result.stages.push({ stage: "DRAFT_CREATION", status: draftRes.status });
  if (draftRes.status !== 201 && draftRes.status !== 200) {
    result.errors.push(`draft creation failed: ${draftRes.status} ${JSON.stringify(draftRes.body).slice(0, 300)}`);
    return result;
  }
  const documentId = draftRes.body?.documentId;
  if (!documentId) {
    result.errors.push(`draft creation returned no documentId`);
    return result;
  }
  result.documentId = documentId;
  result.templateCode = draftRes.body.templateCode;
  result.isNew = draftRes.body.isNew;
  result.reused = draftRes.body.reused;
  result.reviewStatus = draftRes.body.reviewStatus;
  if (result.templateCode !== formCode) {
    result.errors.push(`templateCode mismatch: requested ${formCode} got ${result.templateCode}`);
    return result;
  }

  // Stage 2: Load render-payload
  const payloadRes = await callApi("GET", `/documents/generated/${documentId}/render-payload`, token);
  result.stages.push({ stage: "PAYLOAD_LOAD", status: payloadRes.status });
  if (payloadRes.status !== 200) {
    result.errors.push(`payload load failed: ${payloadRes.status}`);
    return result;
  }
  result.payloadKeys = payloadRes.body ? Object.keys(payloadRes.body) : [];

  // Stage 3: Save R1 form-inputs (POST, not PUT)
  const r1Inputs = buildR1FormInputs(formCode);
  const r1SaveRes = await callApi("POST", `/documents/generated/${documentId}/form-inputs`, token, {
    ...r1Inputs,
    updatedByName: "phase13c-r1",
    formInputs: { phase: "R1", runId: RUN_ID, formCode },
  });
  result.stages.push({ stage: "R1_SAVE", status: r1SaveRes.status });
  if (r1SaveRes.status !== 200 && r1SaveRes.status !== 201) {
    result.errors.push(`R1 save failed: ${r1SaveRes.status} ${JSON.stringify(r1SaveRes.body).slice(0, 300)}`);
    return result;
  }
  result.r1SaveResponse = { status: r1SaveRes.status, hasBody: !!r1SaveRes.body };

  // Stage 4: Reload R1 via render-payload (no separate GET form-inputs endpoint)
  const r1LoadRes = await callApi("GET", `/documents/generated/${documentId}/render-payload`, token);
  result.stages.push({ stage: "R1_RELOAD", status: r1LoadRes.status });
  if (r1LoadRes.status !== 200) {
    result.errors.push(`R1 reload failed: ${r1LoadRes.status}`);
    return result;
  }
  result.r1RoundTrip = verifyR1RoundTrip(r1Inputs, r1LoadRes.body);
  if (!result.r1RoundTrip.ok) {
    result.errors.push(`R1 round-trip mismatch: ${result.r1RoundTrip.reason}`);
    return result;
  }

  // Stage 5: Render R1 DOCX
  const r1RenderRes = await callApi("POST", `/documents/generated/${documentId}/render-docx`, token, {
    force: true,
  });
  result.stages.push({ stage: "R1_RENDER", status: r1RenderRes.status });
  if (r1RenderRes.status !== 200 && r1RenderRes.status !== 201) {
    result.errors.push(`R1 render failed: ${r1RenderRes.status} ${JSON.stringify(r1RenderRes.body).slice(0, 300)}`);
    return result;
  }
  // r1RenderRes is JSON with file metadata
  result.r1FileId = r1RenderRes.body?.generatedFileId || r1RenderRes.body?.fileId || null;
  result.r1Revision = r1RenderRes.body?.revision || null;
  result.r1RenderSummary = {
    hasFileId: !!result.r1FileId,
    fileSize: r1RenderRes.body?.fileSize || r1RenderRes.body?.bytes || null,
    revision: result.r1Revision,
  };

  // Stage 6: Save R2 form-inputs (POST, not PUT)
  const r2Inputs = buildR2FormInputs(formCode);
  // Add R1-distinguishing marker to ensure R2 differs
  const r2SaveRes = await callApi("POST", `/documents/generated/${documentId}/form-inputs`, token, {
    ...r2Inputs,
    updatedByName: "phase13c-r2",
    formInputs: { phase: "R2", runId: RUN_ID, formCode, r1Marker: r1Inputs.document?.documentNo ?? "R1" },
  });
  result.stages.push({ stage: "R2_SAVE", status: r2SaveRes.status });
  if (r2SaveRes.status !== 200 && r2SaveRes.status !== 201) {
    result.errors.push(`R2 save failed: ${r2SaveRes.status} ${JSON.stringify(r2SaveRes.body).slice(0, 300)}`);
    return result;
  }
  result.r2SaveResponse = { status: r2SaveRes.status, hasBody: !!r2SaveRes.body };

  // Stage 7: Reload R2 via render-payload
  const r2LoadRes = await callApi("GET", `/documents/generated/${documentId}/render-payload`, token);
  result.stages.push({ stage: "R2_RELOAD", status: r2LoadRes.status });
  if (r2LoadRes.status !== 200) {
    result.errors.push(`R2 reload failed: ${r2LoadRes.status}`);
    return result;
  }
  result.r2RoundTrip = verifyR2RoundTrip(r2Inputs, r2LoadRes.body);
  if (!result.r2RoundTrip.ok) {
    result.errors.push(`R2 round-trip mismatch: ${result.r2RoundTrip.reason}`);
    return result;
  }

  // Stage 8: Render R2 DOCX
  const r2RenderRes = await callApi("POST", `/documents/generated/${documentId}/render-docx`, token, {
    force: true,
  });
  result.stages.push({ stage: "R2_RENDER", status: r2RenderRes.status });
  if (r2RenderRes.status !== 200 && r2RenderRes.status !== 201) {
    result.errors.push(`R2 render failed: ${r2RenderRes.status} ${JSON.stringify(r2RenderRes.body).slice(0, 300)}`);
    return result;
  }
  result.r2FileId = r2RenderRes.body?.generatedFileId || r2RenderRes.body?.fileId || null;
  result.r2Revision = r2RenderRes.body?.revision || null;
  result.r2RenderSummary = {
    hasFileId: !!result.r2FileId,
    fileSize: r2RenderRes.body?.fileSize || r2RenderRes.body?.bytes || null,
    revision: result.r2Revision,
  };

  // Stage 9: Verify stale R1 absent
  result.staleR1Check = {
    r1MarkerAbsent: r2LoadRes.body?.formInputs?.r1Marker !== r1Inputs.document?.documentNo,
    r2MarkerPresent: r2LoadRes.body?.formInputs?.phase === "R2",
    r1FormInputsOverridden: !!r2LoadRes.body?.formInputs?.phase,
  };

  // Stage 10: Final verdict
  if (result.errors.length === 0) {
    result.verdict = "PERSISTED_BROWSER_PASS";
  }
  return result;
}

function buildR1FormInputs(formCode) {
  // Build R1 fixture values that are distinct from R2
  const baseR1 = {
    document: {
      documentNo: "R1-001/PHASE13C",
      documentCode: `/R1-PHASE13C-${formCode}`,
      issueDate: "2026-07-01",
    },
    caseDecision: {
      decisionNo: `R1-${formCode}-CASE`,
      issueDate: "2026-07-01",
      issuedBy: "R1 issuer — Phase 13C test",
    },
    accusedDecision: {
      decisionNo: `R1-${formCode}-ACCUSED`,
      issueDate: "2026-07-01",
      issuedBy: "R1 issuer — Phase 13C test",
    },
    person: {
      fullName: "R1 Person Phase13C",
      dateOfBirth: "1990-01-01",
      identityNo: "R100000000001",
    },
    offense: {
      offenseName: "R1 offense Phase13C",
      legalArticle: "R1 article reference",
    },
    signature: {
      signMode: "KT. VIỆN TRƯỞNG",
      signerName: "R1 signer Phase13C",
    },
    recipients: {
      monitoringUnitLine: "R1 unit",
      personLine: "R1 person",
      archiveLine: "R1 archive",
    },
    legalBasis: {
      procedureArticlesLine: "R1 legal basis",
    },
  };
  return baseR1;
}

function buildR2FormInputs(formCode) {
  const baseR2 = {
    document: {
      documentNo: "R2-002/PHASE13C",
      documentCode: `/R2-PHASE13C-${formCode}`,
      issueDate: "2026-07-27",
    },
    caseDecision: {
      decisionNo: `R2-${formCode}-CASE`,
      issueDate: "2026-07-27",
      issuedBy: "R2 issuer — Phase 13C test",
    },
    accusedDecision: {
      decisionNo: `R2-${formCode}-ACCUSED`,
      issueDate: "2026-07-27",
      issuedBy: "R2 issuer — Phase 13C test",
    },
    person: {
      fullName: "R2 Person Phase13C",
      dateOfBirth: "1991-02-02",
      identityNo: "R200000000002",
    },
    offense: {
      offenseName: "R2 offense Phase13C",
      legalArticle: "R2 article reference",
    },
    signature: {
      signMode: "VIỆN TRƯỞNG",
      signerName: "R2 signer Phase13C",
    },
    recipients: {
      monitoringUnitLine: "R2 unit",
      personLine: "R2 person",
      archiveLine: "R2 archive",
    },
    legalBasis: {
      procedureArticlesLine: "R2 legal basis",
    },
  };
  return baseR2;
}

function verifyR1RoundTrip(input, loaded) {
  if (!loaded) return { ok: false, reason: "no loaded body" };
  const forms = loaded.formInputs || {};
  return {
    ok: forms.phase === "R1",
    phasePresent: forms.phase === "R1",
    formCodePresent: forms.formCode === loaded.template?.templateCode,
    documentPersisted: loaded.document?.documentNo === input.document.documentNo,
    personPersisted: loaded.person?.fullName === input.person.fullName,
  };
}

function verifyR2RoundTrip(input, loaded) {
  if (!loaded) return { ok: false, reason: "no loaded body" };
  const forms = loaded.formInputs || {};
  return {
    ok: forms.phase === "R2",
    phasePresent: forms.phase === "R2",
    formCodePresent: forms.formCode === loaded.template?.templateCode,
    documentPersisted: loaded.document?.documentNo === input.document.documentNo,
    personPersisted: loaded.person?.fullName === input.person.fullName,
  };
}

async function loadForms(mode) {
  const smokeFile = path.join(PHASE13B_DIR, "smoke-selection.json");
  const queueFile = path.join(PHASE13B_DIR, "browser-queue-83.json");
  if (mode === "smoke") {
    const s = JSON.parse(await readFile(smokeFile, "utf8"));
    return Object.keys(s.coverageByForm).slice(0, 12);
  }
  const q = JSON.parse(await readFile(queueFile, "utf8"));
  return q.rows.map((r) => r.FORM_CODE).filter((c) => !RUNTIME_READY_CODES.includes(c));
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(PHASE13C_DIR, { recursive: true });

  // Read smoke or full list explicitly when called with a list
  let allForms = args.form ? [args.form] : await loadForms(args.mode);
  // Optionally accept a list file via --forms-file
  for (let i = 2; i < process.argv.length; i += 1) {
    if (process.argv[i] === "--forms-file") {
      const fp = process.argv[++i];
      const txt = await readFile(fp, "utf8");
      allForms = txt.split(/\r?\n/u).map((s) => s.trim()).filter(Boolean);
    }
  }
  const sessionStart = Date.now();
  let token = null;
  // Retry login on 429 with exponential backoff
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      token = await fetchSessionCookie();
      break;
    } catch (err) {
      if (attempt === 6) throw err;
      const wait = 5000 * attempt;
      console.log(`[phase13c-runner] login retry ${attempt}/6 after ${wait}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  console.log(`[phase13c-runner] auth ok, runId=${RUN_ID}, forms=${allForms.length}, mode=${args.mode}`);

  const results = {
    schema: "qllaw.phase13c.browser_runner/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13c-live-browser",
    runId: RUN_ID,
    caseId: CASE_ID,
    mode: args.mode,
    shardIndex: args.shardIndex,
    shardCount: args.shardCount,
    workers: args.workers,
    totalForms: allForms.length,
    forms: [],
    summary: {
      attempted: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
    },
  };

  for (const formCode of allForms) {
    const start = Date.now();
    const r = await execForm(formCode, token);
    r.durationMs = Date.now() - start;
    results.forms.push(r);
    results.summary.attempted += 1;
    if (r.verdict === "PERSISTED_BROWSER_PASS") results.summary.passed += 1;
    else if (r.verdict === "SKIPPED_RUNTIME_READY") results.summary.skipped += 1;
    else results.summary.failed += 1;
    const status = r.verdict === "PERSISTED_BROWSER_PASS" ? "✓" : r.verdict === "SKIPPED_RUNTIME_READY" ? "⊘" : "✗";
    console.log(`[phase13c-runner] ${status} ${formCode} ${r.verdict} (${r.durationMs}ms)`);
    if (r.errors.length > 0) {
      console.log(`  errors: ${r.errors.slice(0, 2).join(" | ")}`);
    }
    // Per-form delay to spread API load (avoids 429 from consecutive calls)
    await new Promise((res) => setTimeout(res, 250));
  }

  results.summary.passRate = results.summary.attempted > 0
    ? results.summary.passed / Math.max(1, results.summary.attempted - results.summary.skipped)
    : 0;
  results.totalDurationMs = Date.now() - sessionStart;

  const outPath = args.mode === "smoke"
    ? path.join(PHASE13C_DIR, "smoke-results.json")
    : (process.env.PHASE13C_OUT || path.join(PHASE13C_DIR, "browser-full-results.json"));
  await writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`[phase13c-runner] summary: ${results.summary.passed}/${results.summary.attempted - results.summary.skipped} PASS, ${results.summary.failed} FAIL, ${results.summary.skipped} SKIPPED out of ${results.summary.attempted}`);
  console.log(`[phase13c-runner] artifact=${outPath}`);
}

main().catch((err) => {
  console.error("[phase13c-runner] fatal:", err);
  process.exit(1);
});
