/**
 * Phase 14 — authoritative lifecycle matrix builder (transactional).
 *
 * Joins three real evidence sources to derive the 83-form lifecycle matrix:
 *   1. Phase 12 visual final verdicts (docs/audit/.../phase12-visual/visual-final-verdicts-213.json)
 *      — determines which 83 of 213 forms are visually PASS.
 *   2. Locked runtime-readiness roster (packages/form-contracts/src/runtime-readiness.generated.ts)
 *      — determines which forms are RUNTIME_READY and therefore use the
 *        STANDALONE_RUNTIME_PREVIEW lifecycle (persisted bridge is blocked).
 *   3. Phase 13c 83-form queue (docs/audit/.../phase13c-live-browser/run-manifest.json)
 *      — provides the bridge_status and queued lifecycle for each form.
 *
 * Lifecycle split is derived from the joined data: a form is STANDALONE iff it
 * is in the runtime-readiness roster AND its Phase 12 visual verdict is PASS.
 * All other visually-pass forms are PERSISTED_DOCUMENT_WORKSPACE.
 *
 * The script writes the full 83-row matrix. It does NOT mutate Phase 12/13
 * artifacts. It does NOT promote any form. It does NOT edit the runtime roster.
 *
 * Usage:  node scripts/runtime-rollout/build-phase14-lifecycle-matrix.mjs
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const VISUAL_VERDICTS = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase12-visual",
  "visual-final-verdicts-213.json",
);
const RUNTIME_READINESS = path.join(
  REPO_ROOT,
  "packages",
  "form-contracts",
  "src",
  "runtime-readiness.generated.ts",
);
const PHASE13C_MANIFEST = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13c-live-browser",
  "run-manifest.json",
);
const PHASE13C_BRIDGE_LIST = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13c-live-browser",
  "browser-full-results.json",
);
const OUT_MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");

function extractRosterFromTs(tsText) {
  // Pull the RUNTIME_READY_FORM_CODES literal array from the generated TS.
  const m = tsText.match(/RUNTIME_READY_FORM_CODES\s*=\s*\[([^\]]*)\]/u);
  if (!m) throw new Error("RUNTIME_READY_FORM_CODES not found in runtime-readiness.generated.ts");
  const inner = m[1];
  const codes = [];
  for (const piece of inner.split(",")) {
    const v = piece.trim().replace(/^['"]|['"]$/g, "");
    if (v) codes.push(v);
  }
  return codes;
}

function deriveLockHash(rows) {
  const json = JSON.stringify(rows);
  return createHash("sha256").update(json).digest("hex");
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });

  const visual = JSON.parse(await readFile(VISUAL_VERDICTS, "utf8"));
  const verdictByCode = new Map();
  for (const r of visual.rows) {
    verdictByCode.set(r.FORM_CODE, r);
  }

  const rosterTs = await readFile(RUNTIME_READINESS, "utf8");
  const runtimeReadyCodes = extractRosterFromTs(rosterTs).slice().sort();

  const p13cManifest = JSON.parse(await readFile(PHASE13C_MANIFEST, "utf8"));
  const manifestByCode = new Map();
  for (const r of p13cManifest.rows) manifestByCode.set(r.FORM_CODE, r);

  const p13cBridge = JSON.parse(await readFile(PHASE13C_BRIDGE_LIST, "utf8"));
  const bridgeByCode = new Map();
  for (const r of p13cBridge.forms) bridgeByCode.set(r.formCode, r);

  const visualPassCodes = visual.rows
    .filter((r) => r.VISUAL_FINAL_VERDICT === "WORD_AND_LIBREOFFICE_PASS")
    .map((r) => r.FORM_CODE)
    .sort();

  // A standalone runtime-ready form is RUNTIME_READY AND visually PASS.
  // All other visually-pass forms are PERSISTED.
  const standaloneSet = new Set(
    visualPassCodes.filter((c) => runtimeReadyCodes.includes(c)),
  );
  const persistedSet = new Set(
    visualPassCodes.filter((c) => !runtimeReadyCodes.includes(c)),
  );

  const rows = [];
  for (const code of visualPassCodes) {
    const verdict = verdictByCode.get(code);
    const m = manifestByCode.get(code);
    const b = bridgeByCode.get(code);
    const lifecycle = standaloneSet.has(code)
      ? "STANDALONE_RUNTIME_PREVIEW"
      : "PERSISTED_DOCUMENT_WORKSPACE";
    const bridge_eligible = !standaloneSet.has(code);
    rows.push({
      FORM_CODE: code,
      PHASE12_VISUAL_PASS: true,
      CURRENT_RUNTIME_READY: standaloneSet.has(code),
      DRAFT_BRIDGE_ELIGIBLE: bridge_eligible,
      SUPPORTED_BROWSER_LIFECYCLE: lifecycle,
      PERSISTED_DOCUMENT_ID: b?.documentId ?? null,
      PERSISTED_FIXTURE_REUSABLE: b?.reused === true && b?.documentId != null,
      STANDALONE_ROUTE: standaloneSet.has(code) ? `/templates/${code}` : null,
      PERSISTED_ROUTE: bridge_eligible ? `/documents/${b?.documentId ?? "?documentId"}` : null,
      LOCKED_EDITABLE_FIELDS: null,
      R1_PAYLOAD_PATH: "scripts/runtime-rollout/run-phase14-browser-ui.mjs#buildR1Inputs",
      R2_PAYLOAD_PATH: "scripts/runtime-rollout/run-phase14-browser-ui.mjs#buildR2Inputs",
      REAL_UI_REQUIRED: true,
      PROMOTION_CLASS: standaloneSet.has(code)
        ? "EXISTING_RUNTIME_READY_REVALIDATION"
        : "NEW_PROMOTION_CANDIDATE",
      PHASE12_EXCLUSION_REASONS: verdict?.EXCLUSION_REASONS ?? [],
      PHASE13C_BRIDGE_STATUS: m?.BRIDGE_STATUS ?? null,
      PHASE13C_LAST_RESULT: m?.LAST_RESULT ?? null,
    });
  }

  const standaloneCount = rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW").length;
  const persistedCount = rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE").length;
  const matrixHash = deriveLockHash(rows);

  const matrix = {
    schema: "qllaw.phase14.lifecycle_matrix/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    runId: process.env.RUN_ID ?? "PHASE14_2026_07_27_0530",
    inputs: {
      visualVerdictsArtifact: path.relative(REPO_ROOT, VISUAL_VERDICTS),
      runtimeReadinessArtifact: path.relative(REPO_ROOT, RUNTIME_READINESS),
      phase13cManifestArtifact: path.relative(REPO_ROOT, PHASE13C_MANIFEST),
      phase13cBridgeArtifact: path.relative(REPO_ROOT, PHASE13C_BRIDGE_LIST),
    },
    totals: {
      rows: rows.length,
      persistedLifecycle: persistedCount,
      standaloneLifecycle: standaloneCount,
      standaloneFormCodes: [...standaloneSet].sort(),
      runtimeReadyRosterSize: runtimeReadyCodes.length,
      runtimeReadyRosterOverlappingVisualPass: standaloneCount,
      runtimeReadyRosterNotInVisualPass: runtimeReadyCodes.filter((c) => !standaloneSet.has(c)),
    },
    counts: {
      persistedLifecycle: persistedCount,
      standaloneLifecycle: standaloneCount,
    },
    expectedVsActual: {
      expectedRows: 83,
      expectedPersisted: 77,
      expectedStandalone: 6,
      actualRows: rows.length,
      actualPersisted: persistedCount,
      actualStandalone: standaloneCount,
      match: rows.length === 83 && persistedCount === 77 && standaloneCount === 6,
    },
    matrixHashSha256: matrixHash,
    rows,
  };

  await writeFile(OUT_MATRIX, JSON.stringify(matrix, null, 2));
  const out = {
    artifactsWritten: [path.relative(REPO_ROOT, OUT_MATRIX)],
    matrixHash,
    rows: rows.length,
    persisted: persistedCount,
    standalone: standaloneCount,
    expectedMatch: matrix.expectedVsActual.match,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("[phase14-lifecycle-matrix] fatal:", err);
  process.exit(1);
});
