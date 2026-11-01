#!/usr/bin/env node
/**
 * assert-curated-37-evidence-matrix.mjs
 *
 * Read-only guard. Asserts the curated 37 evidence matrix invariants:
 *
 *   - Total rows == 213
 *   - counts.INPUT_CONNECTED_PASS  == 37
 *   - counts.INPUT_CONNECTED_PARTIAL == 176
 *   - For every curated BM-XXX:
 *       status               === "INPUT_CONNECTED_PASS"
 *       sourceRenderVerified === true
 *       browserVerified      === true
 *       demoClickVerified    === true
 *       previewClickVerified === true
 *       docxDownloadVerified === true
 *       fidelityAuditStatus  === "PASS"
 *       fidelityComplete     === false
 *       manualReviewRequired === true
 *   - No non-curated partial row has demoClickVerified / previewClickVerified /
 *     docxDownloadVerified / fidelityAuditStatus truthy unless explicitly
 *     proven by the dedicated holdout runtime evidence artifact.
 *   - No global FIDELITY_COMPLETE_EVIDENCED claim is set on the matrix.
 *   - The FormFlight runtimeReady allowlist (if inspectable) remains
 *     BM-001 + BM-171 only.
 *
 * Exits non-zero on the first invariant failure with a clear error message.
 * Used both as a CI gate and as the "verification" step at the end of
 * scripts/audit/apply-all-curated-evidence.mjs.
 *
 * Usage:
 *   node scripts/audit/assert-curated-37-evidence-matrix.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateHoldoutRuntimeEvidence } from "./holdout-runtime-evidence.mjs";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;

const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const BROWSER_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_BROWSER_SMOKE.latest.json`;
const DEMO_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.json`;
const PREVIEW_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json`;
const DOCX_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json`;
const FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json`;

const CURATED_37 = [
  "BM-001", "BM-005", "BM-006", "BM-007", "BM-008", "BM-009", "BM-010",
  "BM-011", "BM-012", "BM-014", "BM-015", "BM-017", "BM-018", "BM-019",
  "BM-020", "BM-022", "BM-023", "BM-030", "BM-031", "BM-033", "BM-035",
  "BM-036", "BM-037", "BM-038", "BM-040", "BM-042", "BM-043", "BM-044",
  "BM-045", "BM-046", "BM-047", "BM-048", "BM-052", "BM-053", "BM-054",
  "BM-070", "BM-171",
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function loadJson(path, label) {
  if (!existsSync(path)) fail(`missing required artifact: ${label} (${path})`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

function main() {
  const matrix = loadJson(MATRIX, "status matrix");
  const browser = loadJson(BROWSER_ARTIFACT, "browser smoke artifact");
  const demo = loadJson(DEMO_ARTIFACT, "demo click artifact");
  const preview = loadJson(PREVIEW_ARTIFACT, "preview click artifact");
  const docx = loadJson(DOCX_ARTIFACT, "docx download artifact");
  const fidelity = loadJson(FIDELITY_ARTIFACT, "fidelity artifact");
  let approvedHoldoutEvidence;
  try {
    approvedHoldoutEvidence = validateHoldoutRuntimeEvidence(OUT_DIR);
  } catch (error) {
    fail(error.message);
  }

  // 1. Total rows.
  const rows = matrix.rows || [];
  if (matrix.total !== 213 || rows.length !== 213) {
    fail(`matrix.total=${matrix.total} rows.length=${rows.length}; expected 213/213`);
  }

  // 2. Top-level counts. This is a preservation guard: later batches may
  // increase total PASS beyond the original 37/57/77 states, but the curated
  // 37 rows themselves remain strictly checked below.
  const counts = matrix.counts || {};
  if (counts.INPUT_CONNECTED_PASS < 37) {
    fail(`counts.INPUT_CONNECTED_PASS=${counts.INPUT_CONNECTED_PASS}; expected at least 37`);
  }
  if (counts.INPUT_CONNECTED_PARTIAL > 176) {
    fail(`counts.INPUT_CONNECTED_PARTIAL=${counts.INPUT_CONNECTED_PARTIAL}; expected at most 176`);
  }

  // 3. Index curated rows and partial rows.
  const byCode = new Map(rows.map((r) => [r.templateCode, r]));
  const curatedSet = new Set(CURATED_37);
  const curatedRows = [];
  for (const code of CURATED_37) {
    const r = byCode.get(code);
    if (!r) fail(`missing curated row ${code} in matrix`);
    curatedRows.push(r);
  }

  // 4. Per-curated-row invariants.
  for (const r of curatedRows) {
    if (r.status !== "INPUT_CONNECTED_PASS") {
      fail(`curated ${r.templateCode}: status=${r.status}; expected INPUT_CONNECTED_PASS`);
    }
    if (r.sourceRenderVerified !== true) {
      fail(`curated ${r.templateCode}: sourceRenderVerified=${r.sourceRenderVerified}; expected true`);
    }
    if (r.browserVerified !== true) {
      fail(`curated ${r.templateCode}: browserVerified=${r.browserVerified}; expected true`);
    }
    if (r.demoClickVerified !== true) {
      fail(`curated ${r.templateCode}: demoClickVerified=${r.demoClickVerified}; expected true`);
    }
    if (r.previewClickVerified !== true) {
      fail(`curated ${r.templateCode}: previewClickVerified=${r.previewClickVerified}; expected true`);
    }
    if (r.docxDownloadVerified !== true) {
      fail(`curated ${r.templateCode}: docxDownloadVerified=${r.docxDownloadVerified}; expected true`);
    }
    if (r.fidelityAuditStatus !== "PASS") {
      fail(`curated ${r.templateCode}: fidelityAuditStatus=${r.fidelityAuditStatus}; expected PASS`);
    }
    if (r.fidelityComplete !== false) {
      fail(`curated ${r.templateCode}: fidelityComplete=${r.fidelityComplete}; expected false (manual/PDF review required)`);
    }
    if (r.manualReviewRequired !== true) {
      fail(`curated ${r.templateCode}: manualReviewRequired=${r.manualReviewRequired}; expected true`);
    }
  }

  // 5. No partial (non-curated) row has any of the curated-only evidence flags.
  const STRICT_FLAGS = [
    "demoClickVerified",
    "previewClickVerified",
    "docxDownloadVerified",
    "fidelityAuditStatus",
    "fidelityComplete",
    "manualReviewRequired",
  ];
  const violations = [];
  for (const r of rows) {
    if (r.status !== "INPUT_CONNECTED_PARTIAL") continue;
    if (curatedSet.has(r.templateCode)) continue; // curated
    if (approvedHoldoutEvidence.has(r.templateCode)) continue;
    for (const flag of STRICT_FLAGS) {
      const v = r[flag];
      if (v === true || v === "PASS") {
        violations.push(`${r.templateCode}.${flag}=${v}`);
      }
    }
  }
  if (violations.length > 0) {
    fail(`non-curated partial rows leaked curated-only evidence: ${violations.join(", ")}`);
  }

  // 6. No global FIDELITY_COMPLETE_EVIDENCED claim.
  if (matrix.curated37FidelityEvidence?.fidelityCompleteClaimed === true) {
    fail("matrix.curated37FidelityEvidence.fidelityCompleteClaimed===true; not allowed");
  }
  if (fidelity.fidelityCompleteClaimed === true) {
    fail("fidelity artifact fidelityCompleteClaimed===true; not allowed");
  }

  // 7. FormFlight runtimeReady allowlist, if inspectable. Inspect via grep on
  //    any explicit allowlist module. The allowlist is BM-001 + BM-171 only.
  const allowlistCandidates = [
    "apps/web/src/lib/form-flight/runtime-ready-allowlist.ts",
    "apps/web/src/lib/form-flight/profile-registry.ts",
    "apps/web/src/lib/form-flight/index.ts",
  ];
  for (const rel of allowlistCandidates) {
    const p = `${ROOT}/${rel}`;
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    // If the file lists runtimeReady codes by string literal, verify only
    // BM-001 and BM-171 appear.
    const matches = src.match(/BM-\d{3}/g);
    if (!matches) continue;
    const uniq = Array.from(new Set(matches));
    const nonAllowlisted = uniq.filter(
      (c) => c !== "BM-001" && c !== "BM-171",
    );
    if (nonAllowlisted.length > 0) {
      fail(
        `runtimeReady allowlist file ${rel} references non-BM-001/BM-171 codes: ${nonAllowlisted.join(", ")}`,
      );
    }
  }

  // 8. Source artifact totals are coherent (37/37).
  if (demo.formsDemoPassed !== 37) fail(`demo artifact formsDemoPassed=${demo.formsDemoPassed}; expected 37`);
  if (preview.formsPreviewPassed !== 37) fail(`preview artifact formsPreviewPassed=${preview.formsPreviewPassed}; expected 37`);
  if (docx.formsDocxPassed !== 37) fail(`docx artifact formsDocxPassed=${docx.formsDocxPassed}; expected 37`);
  if (fidelity.formsPass !== 37) fail(`fidelity artifact formsPass=${fidelity.formsPass}; expected 37`);
  if (browser.counts?.browserPassed !== 37) fail(`browser artifact counts.browserPassed=${browser.counts.browserPassed}; expected 37`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: 213,
        curated: 37,
        inputConnectedPass: counts.INPUT_CONNECTED_PASS,
        inputConnectedPartial: counts.INPUT_CONNECTED_PARTIAL,
        allCuratedFlagsCorrect: true,
        noPartialLeakage: true,
        fidelityCompleteEvidenced: false,
        formFlightRuntimeReadyPromoted: 0,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main();
