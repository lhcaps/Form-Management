#!/usr/bin/env node
/**
 * Safely rebuild the 213-form status matrix from evidence already on disk.
 *
 * The default mode is read-only. Use --apply to acquire an exclusive lock,
 * snapshot the evidence directory, run only apply/guard scripts with bounded
 * child-process timeouts, and roll every output back if any step fails.
 * Selectors, render jobs, and the authenticated browser collector are
 * intentionally excluded: those are evidence-generation phases, not apply
 * phases.
 *
 * Usage:
 *   node scripts/audit/apply-all-current-evidence.mjs [--check]
 *   node scripts/audit/apply-all-current-evidence.mjs --apply
 *   node scripts/audit/apply-all-current-evidence.mjs --apply --timeout-ms=60000
 */

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX_JSON = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const MATRIX_MD = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`;
const LOCK_FILE = `${OUT_DIR}/.apply-all-current-evidence.lock`;

const APPLY_EXISTING_STEPS = [
  "scripts/audit/status-matrix-213.mjs",
  "scripts/audit/apply-curated-demo-click-status.mjs",
  "scripts/audit/apply-curated-preview-click-status.mjs",
  "scripts/audit/apply-curated-docx-download-status.mjs",
  "scripts/audit/apply-curated-fidelity-status.mjs",
  "scripts/audit/apply-visual-pdf-status.mjs",
  "scripts/audit/apply-batch3-browser-visibility.mjs",
  "scripts/audit/apply-batch3-demo-click.mjs",
  "scripts/audit/apply-batch3-preview-click.mjs",
  "scripts/audit/apply-batch3-docx-download.mjs",
  "scripts/audit/apply-batch3-fidelity-status.mjs",
  "scripts/audit/apply-batch3-visual-pdf-review.mjs",
  "scripts/audit/apply-batch4-curation.mjs",
  "scripts/audit/apply-batch4-browser-visibility.mjs",
  "scripts/audit/apply-batch4-demo-click.mjs",
  "scripts/audit/apply-batch4-preview-click.mjs",
  "scripts/audit/apply-batch4-docx-download.mjs",
  "scripts/audit/apply-batch4-fidelity-status.mjs",
  "scripts/audit/apply-batch4-visual-pdf-review.mjs",
  "scripts/audit/apply-batch5-curation.mjs",
  "scripts/audit/apply-batch6-curation.mjs",
  "scripts/audit/apply-batch7-curation.mjs",
  "scripts/audit/apply-batch8-curation.mjs",
  "scripts/audit/apply-batch9-curation.mjs",
  "scripts/audit/apply-remaining-source-render-curation.mjs",
  "scripts/audit/apply-source-render-only-browser-visibility.mjs",
  "scripts/audit/assert-curated-37-evidence-matrix.mjs",
  "scripts/audit/assert-curated-57-evidence-matrix.mjs",
  "scripts/audit/assert-curated-77-evidence-matrix.mjs",
  "scripts/audit/assert-curated-97-evidence-matrix.mjs",
  "scripts/audit/assert-curated-117-evidence-matrix.mjs",
  "scripts/audit/assert-curated-137-evidence-matrix.mjs",
  "scripts/audit/assert-curated-157-evidence-matrix.mjs",
  "scripts/audit/assert-curated-177-evidence-matrix.mjs",
  "scripts/audit/assert-curated-remaining-source-render-evidence-matrix.mjs",
  "scripts/audit/assert-source-render-only-browser-visibility-evidence-matrix.mjs",
  "scripts/audit/apply-holdout-runtime-evidence.mjs",
];

const REQUIRED_JSON_ARTIFACTS = [
  "QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.json",
  "QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.json",
  "QLLAW_CURATED_RENDER_SMOKE.latest.json",
  "QLLAW_CURATED_BROWSER_SMOKE.latest.json",
  "QLLAW_CURATED_DEMO_CLICK_SMOKE.latest.json",
  "QLLAW_CURATED_PREVIEW_CLICK_SMOKE.latest.json",
  "QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json",
  "QLLAW_CURATED_GOLDEN_LAYOUT_FIDELITY.latest.json",
  "QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json",
  "QLLAW_BATCH3_BROWSER_VISIBILITY.latest.json",
  "QLLAW_BATCH3_DEMO_CLICK.latest.json",
  "QLLAW_BATCH3_PREVIEW_CLICK.latest.json",
  "QLLAW_BATCH3_DOCX_DOWNLOAD.latest.json",
  "QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json",
  "QLLAW_BATCH3_VISUAL_PDF_REVIEW.latest.json",
  "QLLAW_BATCH4_CURATION.latest.json",
  "QLLAW_BATCH4_BROWSER_VISIBILITY.latest.json",
  "QLLAW_BATCH4_DEMO_CLICK.latest.json",
  "QLLAW_BATCH4_PREVIEW_CLICK.latest.json",
  "QLLAW_BATCH4_DOCX_DOWNLOAD.latest.json",
  "QLLAW_BATCH4_GOLDEN_LAYOUT_FIDELITY.latest.json",
  "QLLAW_BATCH4_VISUAL_PDF_REVIEW.latest.json",
  "QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json",
  "QLLAW_REMAINING_SOURCE_RENDER_SMOKE.latest.json",
  "QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json",
  "QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.json",
  "QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json",
  ...Array.from({ length: 5 }, (_, index) =>
    `QLLAW_BATCH${index + 5}_CANDIDATES.latest.json`,
  ),
  ...Array.from({ length: 5 }, (_, index) =>
    `QLLAW_BATCH${index + 5}_SOURCE_RENDER_SMOKE.latest.json`,
  ),
];

const RAW_INPUT_DEPENDENT_STEPS = new Map([
  ["scripts/audit/apply-batch3-browser-visibility.mjs", [".tmp-batch3-visibility.parsed.json"]],
  ["scripts/audit/apply-batch3-demo-click.mjs", [".tmp-batch3-demo-click.parsed.json"]],
  ["scripts/audit/apply-batch3-preview-click.mjs", [".tmp-batch3-preview-click.parsed.json"]],
  ["scripts/audit/apply-batch3-docx-download.mjs", [".tmp-batch3-docx-download.parsed.json"]],
  ["scripts/audit/apply-batch4-browser-visibility.mjs", [".tmp-batch4-visibility.parsed.json"]],
  ["scripts/audit/apply-batch4-demo-click.mjs", [".tmp-batch4-demo-click.parsed.json"]],
  ["scripts/audit/apply-batch4-preview-click.mjs", [".tmp-batch4-preview-click.parsed.json"]],
  ["scripts/audit/apply-batch4-docx-download.mjs", [".tmp-batch4-docx-download.parsed.json"]],
]);

const PRESERVED_EVIDENCE_FOLLOWER_STEPS = new Set([
  "scripts/audit/apply-batch4-curation.mjs",
  "scripts/audit/apply-batch5-curation.mjs",
  "scripts/audit/apply-batch6-curation.mjs",
  "scripts/audit/apply-batch7-curation.mjs",
  "scripts/audit/apply-batch8-curation.mjs",
  "scripts/audit/apply-batch9-curation.mjs",
  "scripts/audit/apply-remaining-source-render-curation.mjs",
  "scripts/audit/apply-source-render-only-browser-visibility.mjs",
]);

const VOLATILE_KEYS = new Set([
  "snapshotDate",
  "generatedAt",
  "capturedAt",
  "appliedAt",
  "updatedAt",
]);

function fail(message) {
  throw new Error(message);
}

function readJson(path, label = path) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`invalid JSON in ${label}: ${error.message}`);
  }
}

function uniqueCodes(codes, label) {
  if (!Array.isArray(codes)) fail(`${label} must be an array`);
  const normalized = codes.map((entry) =>
    typeof entry === "string" ? entry : entry?.code ?? entry?.templateCode,
  );
  if (normalized.some((code) => !/^BM-\d{3}$/.test(code ?? ""))) {
    fail(`${label} contains an invalid template code`);
  }
  if (new Set(normalized).size !== normalized.length) {
    fail(`${label} contains duplicate template codes`);
  }
  return normalized;
}

function assertSameCodes(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(`${label} code set does not match its candidate artifact`);
  }
}

function validateSourceRenderArtifact(candidate, smoke, label) {
  const selected = uniqueCodes(candidate.selectedCodes, `${label} candidates`);
  const results = uniqueCodes(smoke.results, `${label} smoke results`);
  if (candidate.status !== "PASS") fail(`${label} candidate status is not PASS`);
  if (smoke.status !== "PASS") fail(`${label} smoke status is not PASS`);
  if (selected.length !== 20 || results.length !== 20) {
    fail(`${label} must contain exactly 20 selected and 20 smoke results`);
  }
  if (
    smoke.totalForms !== 20 ||
    smoke.formsSourceRenderPassed !== 20 ||
    smoke.formsSourceRenderFailed !== 0 ||
    smoke.results.some((row) => row.passes !== true || row.sourceRender !== "PASS")
  ) {
    fail(`${label} source/render evidence is incomplete`);
  }
  assertSameCodes(results, selected, label);
}

function validateBrowserArtifact(candidate, artifact) {
  const selected = uniqueCodes(
    candidate.selectedCodes,
    "source/render-only browser candidates",
  );
  const results = uniqueCodes(
    artifact.perForm,
    "source/render-only browser evidence",
  );
  if (candidate.status !== "PASS" || artifact.status !== "PASS") {
    fail("source/render-only browser candidate/evidence status must be PASS");
  }
  if (selected.length !== 124 || results.length !== 124) {
    fail("source/render-only browser evidence must contain exactly 124 forms");
  }
  assertSameCodes(results, selected, "source/render-only browser evidence");
  if (
    artifact.totalForms !== 124 ||
    artifact.formsVisibilitySmoked !== 124 ||
    artifact.formsVisibilityPassed !== 124 ||
    artifact.formsVisibilityFailed !== 0 ||
    artifact.formsVisibilitySkipped !== 0
  ) {
    fail("source/render-only browser aggregate counts are incomplete");
  }
  for (const row of artifact.perForm) {
    if (
      row.browserVerified !== true ||
      row.fieldsVisible !== true ||
      row.labelsOrSectionsVisible !== true ||
      row.stayedOnTemplatesRoute !== true ||
      row.routedToDocuments !== false ||
      row.historyUiVisible !== false ||
      row.fatalError !== false ||
      row.authUsed !== true ||
      row.url !== `/templates/${row.code}`
    ) {
      fail(`unsafe or incomplete browser evidence for ${row.code}`);
    }
  }
  const refusalFields = [
    "sourceDocxMutated",
    "normalizedDocxMutated",
    "lockedContractsMutated",
    "compiledContractsMutated",
    "dbMutated",
    "prismaSchemaMutated",
    "migrationsCreated",
    "publicApiRoutePathsChanged",
    "fidelityCompleteClaimed",
  ];
  for (const field of refusalFields) {
    if (artifact[field] !== false) fail(`browser artifact ${field} must be false`);
  }
}

function validateRemainingEvidence(candidate, smoke) {
  const selected = uniqueCodes(
    candidate.eligibleSelectedCodes,
    "remaining source/render candidates",
  );
  const results = uniqueCodes(smoke.results, "remaining source/render smoke");
  if (candidate.status !== "PASS" || smoke.status !== "PASS") {
    fail("remaining source/render candidate and smoke status must be PASS");
  }
  if (selected.length !== 24 || results.length !== 24) {
    fail("remaining source/render evidence must contain exactly 24 eligible forms");
  }
  if (
    smoke.totalForms !== 24 ||
    smoke.formsSourceRenderPassed !== 24 ||
    smoke.formsSourceRenderFailed !== 0 ||
    smoke.results.some((row) => row.passes !== true || row.sourceRender !== "PASS")
  ) {
    fail("remaining source/render evidence is incomplete");
  }
  assertSameCodes(results, selected, "remaining source/render evidence");
}

function validateHoldoutRuntimeEvidence(artifact) {
  const expected = ["BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051", "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200"];
  const codes = uniqueCodes(artifact.holdoutCodes, "holdout runtime evidence");
  if (artifact.status !== "PASS" || artifact.totalForms !== 12 || artifact.passed !== 12 || artifact.failed !== 0) {
    fail("holdout runtime evidence must be a complete 12-form PASS");
  }
  assertSameCodes(codes, expected, "holdout runtime evidence");
  if (artifact.formFlightRuntimeReadyPromoted !== 0 || artifact.visualHumanReviewPromoted !== 0) {
    fail("holdout runtime evidence must not promote runtimeReady or visual human review");
  }
  if ((artifact.forms ?? []).length !== 12 || artifact.forms.some((row) => row.status !== "PASS" || row.persisted !== false || row.browserVerified !== true || row.demoClickVerified !== true || row.previewClickVerified !== true || row.docxDownloadVerified !== true || row.pdfExportVerified !== true)) {
    fail("holdout runtime per-form evidence is incomplete");
  }
}

function validateMatrixShape(matrix, label) {
  const codes = uniqueCodes(matrix.rows, `${label} rows`);
  if (matrix.total !== 213 || codes.length !== 213) {
    fail(`${label} must contain exactly 213 rows`);
  }
}

function preflight() {
  if (existsSync(LOCK_FILE)) {
    fail(`evidence apply lock already exists: ${LOCK_FILE}`);
  }
  for (const step of APPLY_EXISTING_STEPS) {
    if (!existsSync(`${ROOT}/${step}`)) fail(`missing apply/guard step: ${step}`);
  }
  const artifacts = new Map();
  for (const name of REQUIRED_JSON_ARTIFACTS) {
    artifacts.set(name, readJson(`${OUT_DIR}/${name}`, name));
  }

  const matrix = readJson(MATRIX_JSON, "current status matrix");
  validateMatrixShape(matrix, "current status matrix");

  const base = artifacts.get("QLLAW_CURATED_RENDER_SMOKE.latest.json");
  const baseCodes = uniqueCodes(base.codes, "curated render smoke");
  if (
    base.allPass !== true ||
    baseCodes.length !== 177 ||
    base.codes.some((row) => row.passes !== true)
  ) {
    fail("curated render smoke must contain 177 passing forms");
  }

  for (let batch = 5; batch <= 9; batch += 1) {
    validateSourceRenderArtifact(
      artifacts.get(`QLLAW_BATCH${batch}_CANDIDATES.latest.json`),
      artifacts.get(`QLLAW_BATCH${batch}_SOURCE_RENDER_SMOKE.latest.json`),
      `Batch ${batch}`,
    );
  }
  validateRemainingEvidence(
    artifacts.get("QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json"),
    artifacts.get("QLLAW_REMAINING_SOURCE_RENDER_SMOKE.latest.json"),
  );
  validateBrowserArtifact(
    artifacts.get(
      "QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json",
    ),
    artifacts.get("QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY.latest.json"),
  );
  validateHoldoutRuntimeEvidence(
    artifacts.get("QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json"),
  );

  return {
    status: "PASS",
    matrixPass: matrix.counts?.INPUT_CONNECTED_PASS ?? null,
    matrixPartial: matrix.counts?.INPUT_CONNECTED_PARTIAL ?? null,
    baseSourceRenderForms: baseCodes.length,
    remainingSourceRenderForms: 24,
    storedBrowserForms: 124,
    stepCount: APPLY_EXISTING_STEPS.length,
  };
}

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (path === LOCK_FILE) continue;
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function takeSnapshot() {
  const snapshot = new Map();
  for (const path of walkFiles(OUT_DIR)) {
    const stat = statSync(path);
    snapshot.set(relative(OUT_DIR, path).replace(/\\/g, "/"), {
      content: readFileSync(path),
      mode: stat.mode,
      atime: stat.atime,
      mtime: stat.mtime,
    });
  }
  return snapshot;
}

function restoreSnapshot(snapshot, preservePaths = new Set()) {
  const preserved = new Set(
    [...preservePaths].map((path) => resolve(path).replace(/\\/g, "/")),
  );
  for (const path of walkFiles(OUT_DIR)) {
    const absolute = resolve(path).replace(/\\/g, "/");
    if (preserved.has(absolute)) continue;
    const key = relative(OUT_DIR, path).replace(/\\/g, "/");
    if (!snapshot.has(key)) rmSync(path, { force: true });
  }
  for (const [key, entry] of snapshot) {
    const path = `${OUT_DIR}/${key}`;
    const absolute = resolve(path).replace(/\\/g, "/");
    if (preserved.has(absolute)) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, entry.content);
    chmodSync(path, entry.mode);
    utimesSync(path, entry.atime, entry.mtime);
  }
}

function acquireLock() {
  let descriptor;
  try {
    descriptor = openSync(LOCK_FILE, "wx");
    writeFileSync(
      descriptor,
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (error?.code === "EEXIST") fail(`evidence apply lock already exists: ${LOCK_FILE}`);
    throw error;
  }
  closeSync(descriptor);
}

function releaseLock() {
  if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
}

function semanticValue(value) {
  if (Array.isArray(value)) return value.map(semanticValue);
  if (value === null || typeof value !== "object") return value;
  const result = {};
  for (const key of Object.keys(value).sort()) {
    if (!VOLATILE_KEYS.has(key)) result[key] = semanticValue(value[key]);
  }
  return result;
}

function isSemanticallyEqual(left, right) {
  return JSON.stringify(semanticValue(left)) === JSON.stringify(semanticValue(right));
}

function runStep(step, timeoutMs) {
  console.log(`--- ${step} ---`);
  const env = step.endsWith("status-matrix-213.mjs")
    ? { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "1" }
    : process.env;
  const result = spawnSync(process.execPath, [step], {
    cwd: ROOT,
    stdio: "inherit",
    env,
    timeout: timeoutMs,
    killSignal: "SIGTERM",
  });
  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT";
    fail(`${step} ${timedOut ? `timed out after ${timeoutMs}ms` : result.error.message}`);
  }
  if (result.status !== 0) fail(`${step} exited with status ${result.status}`);
}

function shouldSkipPreservedEvidenceFollower(step) {
  if (PRESERVED_EVIDENCE_FOLLOWER_STEPS.has(step)) return true;
  const requiredInputs = RAW_INPUT_DEPENDENT_STEPS.get(step);
  return requiredInputs?.some((input) => !existsSync(`${ROOT}/${input}`)) ?? false;
}

function validateFinalMatrix() {
  const matrix = readJson(MATRIX_JSON, "applied status matrix");
  validateMatrixShape(matrix, "applied status matrix");
  if (
    matrix.counts?.INPUT_CONNECTED_PASS !== 213 ||
    matrix.counts?.INPUT_CONNECTED_PARTIAL !== 0
  ) {
    fail("applied status matrix must reconcile to 213 PASS / 0 PARTIAL");
  }
  const browserTrue = matrix.rows.filter((row) => row.browserVerified === true).length;
  const browserFalse = matrix.rows.filter((row) => row.browserVerified === false).length;
  const browserUnknown = matrix.rows.filter(
    (row) => row.browserVerified !== true && row.browserVerified !== false,
  ).length;
  const fidelityComplete = matrix.rows.filter((row) => row.fidelityComplete === true).length;
  if (browserTrue !== 213 || browserFalse !== 0 || browserUnknown !== 0) {
    fail(
      `browser tri-state mismatch: true=${browserTrue}, false=${browserFalse}, unknown=${browserUnknown}`,
    );
  }
  if (fidelityComplete !== 0) fail("fidelityComplete must remain false for all 213 forms");
  return { matrix, browserTrue, browserFalse, browserUnknown, fidelityComplete };
}

function parseArguments(argv) {
  let requestedMode;
  let timeoutMs = 60_000;
  for (const argument of argv) {
    if (argument === "--apply") {
      if (requestedMode && requestedMode !== "apply") fail("--apply and --check are mutually exclusive");
      requestedMode = "apply";
    } else if (argument === "--check") {
      if (requestedMode && requestedMode !== "check") fail("--apply and --check are mutually exclusive");
      requestedMode = "check";
    } else if (argument.startsWith("--timeout-ms=")) {
      timeoutMs = Number(argument.slice("--timeout-ms=".length));
    } else if (argument === "--help" || argument === "-h") {
      console.log("Usage: node scripts/audit/apply-all-current-evidence.mjs [--check|--apply] [--timeout-ms=60000]");
      process.exit(0);
    } else {
      fail(`unknown argument: ${argument}`);
    }
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 300_000) {
    fail("--timeout-ms must be an integer between 1000 and 300000");
  }
  const mode = requestedMode ?? "check";
  return { mode, timeoutMs };
}

function main() {
  const { mode, timeoutMs } = parseArguments(process.argv.slice(2));
  const check = preflight();
  if (mode === "check") {
    console.log(JSON.stringify({ mode, ...check, mutation: "NONE" }, null, 2));
    return;
  }

  acquireLock();
  const snapshot = takeSnapshot();
  const before = readJson(MATRIX_JSON, "pre-apply status matrix");
  try {
    for (const step of APPLY_EXISTING_STEPS) {
      if (shouldSkipPreservedEvidenceFollower(step)) {
        console.log(`--- Skipping preserved-evidence follower: ${step} (canonical matrix evidence preserved) ---`);
        continue;
      }
      runStep(step, timeoutMs);
      if (
        process.env.NODE_ENV === "test" &&
        process.env.QLLAW_EVIDENCE_FAULT_AFTER_STEP === step
      ) {
        fail(`test fault injected after ${step}`);
      }
    }
    const final = validateFinalMatrix();
    const noSemanticChange = isSemanticallyEqual(before, final.matrix);
    if (noSemanticChange) {
      restoreSnapshot(snapshot);
    } else {
      restoreSnapshot(snapshot, new Set([MATRIX_JSON, MATRIX_MD]));
    }
    console.log(
      JSON.stringify(
        {
          mode,
          status: "PASS",
          result: noSemanticChange ? "NO_SEMANTIC_CHANGE" : "MATRIX_RECONCILED",
          inputConnectedPass: 213,
          inputConnectedPartial: 0,
          browserVerified: final.browserTrue,
          browserUnknown: final.browserUnknown,
          fidelityComplete: final.fidelityComplete,
          nonCanonicalArtifactsRestored: true,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    restoreSnapshot(snapshot);
    throw error;
  } finally {
    releaseLock();
  }
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
