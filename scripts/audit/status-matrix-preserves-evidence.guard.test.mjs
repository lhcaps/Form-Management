import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it, before, after } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const STATUS_MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const STATUS_MATRIX_BACKUP = `${STATUS_MATRIX}.guard-test-backup.json`;

const BASE_ROW_FIELDS = new Set([
  "templateCode",
  "status",
  "compiledExists",
  "lockedExists",
  "runtimeUxProfileExists",
  "runtimeUxProfileRegistered",
  "formFlightProfileExists",
  "legacyComponentExists",
  "routeHttpStatus",
  "routeHasCodeInBody",
  "sourceRenderVerified",
]);

function readMatrix() {
  return JSON.parse(readFileSync(STATUS_MATRIX, "utf8"));
}

function writeMatrix(data) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(STATUS_MATRIX, JSON.stringify(data, null, 2));
}

function getRow(code) {
  const matrix = readMatrix();
  const row = matrix.rows.find((r) => r.templateCode === code);
  assert.ok(row, `missing row for ${code}`);
  return row;
}

describe("status-matrix-213 evidence preservation", () => {
  before(() => {
    if (existsSync(STATUS_MATRIX)) {
      copyFileSync(STATUS_MATRIX, STATUS_MATRIX_BACKUP);
    }
  });

  after(() => {
    if (existsSync(STATUS_MATRIX_BACKUP)) {
      copyFileSync(STATUS_MATRIX_BACKUP, STATUS_MATRIX);
      unlinkSync(STATUS_MATRIX_BACKUP);
    }
  });

  it("preserves apply-owned evidence fields when status-matrix-213 runs standalone", () => {
    // Step 1: run status-matrix-213 once to establish a clean baseline
    const baseline = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "0" },
    });
    assert.equal(baseline.status, 0, `baseline status-matrix-213 failed:\n${baseline.stderr}`);

    // Step 2: inject apply-owned evidence fields directly into BM-001 row
    const matrix = readMatrix();
    const row = matrix.rows.find((r) => r.templateCode === "BM-001");
    assert.ok(row, "BM-001 row must exist after baseline run");

    // Simulate what apply-all-curated-evidence.mjs writes:
    // demoClickVerified/previewClickVerified/docxDownloadVerified/fidelityAuditStatus
    // are apply-owned fields (NOT in BASE_ROW_FIELDS)
    row.demoClickVerified = true;
    row.previewClickVerified = true;
    row.docxDownloadVerified = true;
    row.fidelityAuditStatus = "PASS";
    row.fidelityComplete = false;
    // Also inject a custom apply-owned field to verify arbitrary field preservation
    row.curatedBatchEvidence = "batch-3";
    row.browserVisibilityResult = "passed";
    row.docxLeakCheck = "clean";
    row.lastReviewer = "test-agent";
    writeMatrix(matrix);

    // Step 3: re-run status-matrix-213 with PRESERVE_APPLY_FIELDS=1 (default)
    const rerun = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "1" },
    });
    assert.equal(rerun.status, 0, `status-matrix-213 rerun failed:\n${rerun.stderr}`);

    // Step 4: verify evidence fields survived
    const after = getRow("BM-001");

    // All apply-owned fields must be preserved
    assert.equal(after.demoClickVerified, true, "demoClickVerified must be preserved");
    assert.equal(after.previewClickVerified, true, "previewClickVerified must be preserved");
    assert.equal(after.docxDownloadVerified, true, "docxDownloadVerified must be preserved");
    assert.equal(after.fidelityAuditStatus, "PASS", "fidelityAuditStatus must be preserved");
    assert.equal(after.fidelityComplete, false, "fidelityComplete must be preserved");
    assert.equal(after.curatedBatchEvidence, "batch-3", "curatedBatchEvidence must be preserved");
    assert.equal(after.browserVisibilityResult, "passed", "browserVisibilityResult must be preserved");
    assert.equal(after.docxLeakCheck, "clean", "docxLeakCheck must be preserved");
    assert.equal(after.lastReviewer, "test-agent", "lastReviewer must be preserved");

    // Base fields must be recomputed (may differ from injected values)
    // So we only assert that they exist and are valid types
    assert.ok(BASE_ROW_FIELDS.has("templateCode"));
    assert.equal(after.templateCode, "BM-001", "templateCode must be preserved as base field");
  });

  it("resets apply-owned evidence flags to defaults when PRESERVE_APPLY_FIELDS=0", () => {
    // Run with PRESERVE_APPLY_FIELDS=0: all apply-owned fields should be absent
    const run = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "0" },
    });
    assert.equal(run.status, 0, `status-matrix-213 with PRESERVE=0 failed:\n${run.stderr}`);

    const after = getRow("BM-001");
    assert.equal(after.demoClickVerified, false, "demoClickVerified should reset to false");
    assert.equal(after.previewClickVerified, false, "previewClickVerified should reset to false");
    assert.equal(after.fidelityComplete, false, "fidelityComplete should reset to false");
    assert.equal(after.fidelityAuditStatus, undefined, "fidelityAuditStatus should be absent");
    assert.equal(after.docxDownloadVerified, undefined, "docxDownloadVerified should be absent");
    assert.equal(after.curatedBatchEvidence, undefined, "curatedBatchEvidence should be absent");
  });

  it("only preserves fields not in BASE_ROW_FIELDS", () => {
    const matrix = readMatrix();
    const row = matrix.rows.find((r) => r.templateCode === "BM-001");
    assert.ok(row);

    // Inject conflicting values for a base field and an apply-owned field
    row.routeHttpStatus = 999; // this is a base field (should be overwritten)
    row.customApplyField = "must-preserve"; // this is apply-owned (should be preserved)
    writeMatrix(matrix);

    const run = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "1" },
    });
    assert.equal(run.status, 0, `status-matrix-213 failed:\n${run.stderr}`);

    const after = getRow("BM-001");
    assert.notEqual(after.routeHttpStatus, 999, "base field routeHttpStatus must be recomputed");
    assert.equal(after.customApplyField, "must-preserve", "apply-owned field must be preserved");
  });

  it("preserves explicit remaining-source promotions and top-level apply summaries", () => {
    const baseline = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "0" },
    });
    assert.equal(baseline.status, 0, `baseline status-matrix-213 failed:\n${baseline.stderr}`);

    const matrix = readMatrix();
    const row = matrix.rows.find((candidate) => candidate.templateCode === "BM-002");
    assert.ok(row, "BM-002 row must exist after baseline run");
    assert.equal(row.status, "INPUT_CONNECTED_PARTIAL");

    row.status = "INPUT_CONNECTED_PASS";
    row.sourceRenderVerified = true;
    row.remainingSourceRenderVerified = true;
    matrix.remainingSourceRenderCurationEvidence = {
      status: "PASS",
      codes: ["BM-002"],
    };
    writeMatrix(matrix);

    const rerun = spawnSync(process.execPath, ["scripts/audit/status-matrix-213.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "1" },
    });
    assert.equal(rerun.status, 0, `status-matrix-213 rerun failed:\n${rerun.stderr}`);

    const afterMatrix = readMatrix();
    const after = afterMatrix.rows.find((candidate) => candidate.templateCode === "BM-002");
    assert.ok(after);
    assert.equal(after.status, "INPUT_CONNECTED_PASS");
    assert.equal(after.sourceRenderVerified, true);
    assert.equal(after.remainingSourceRenderVerified, true);
    assert.deepEqual(afterMatrix.remainingSourceRenderCurationEvidence, {
      status: "PASS",
      codes: ["BM-002"],
    });
    assert.equal(afterMatrix.counts.INPUT_CONNECTED_PASS, 178);
    assert.equal(afterMatrix.counts.INPUT_CONNECTED_PARTIAL, 35);
  });
});
