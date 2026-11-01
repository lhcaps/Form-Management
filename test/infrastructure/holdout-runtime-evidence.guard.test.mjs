import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const RUNNER = `${ROOT}/scripts/audit/run-holdout-runtime-evidence.mjs`;
const APPLIER = `${ROOT}/scripts/audit/apply-holdout-runtime-evidence.mjs`;
const E2E_SPEC = `${ROOT}/tests/e2e/holdout-runtime-evidence.auth.spec.ts`;
const CURATED_37_ASSERTION = `${ROOT}/scripts/audit/assert-curated-37-evidence-matrix.mjs`;
const VALIDATOR = `${ROOT}/scripts/audit/holdout-runtime-evidence.mjs`;

test("holdout runtime evidence is isolated and can never promote Form Flight readiness", () => {
  assert.ok(existsSync(RUNNER), "missing holdout runtime evidence runner");
  assert.ok(existsSync(APPLIER), "missing holdout runtime evidence applier");
  assert.ok(existsSync(E2E_SPEC), "missing holdout runtime evidence E2E spec");

  const runner = readFileSync(RUNNER, "utf8");
  const applier = readFileSync(APPLIER, "utf8");
  const e2e = readFileSync(E2E_SPEC, "utf8");

  for (const code of [
    "BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
    "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200",
  ]) {
    assert.match(runner, new RegExp(code));
  }

  assert.match(runner, /QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE\.latest\.json/);
  assert.match(runner, /raw\.search\(\/\\\{\\s\*"config":\//);
  assert.match(e2e, /persisted.*toBe\(false\)/);
  assert.match(e2e, /pdfPreviewUrl/);
  assert.match(e2e, /docxDownloadUrl/);
  assert.doesNotMatch(runner, /runtimeReady:\s*true/);

  assert.match(applier, /INPUT_CONNECTED_PARTIAL/);
  assert.match(applier, /INPUT_CONNECTED_PASS/);
  assert.match(applier, /runtimeReady/);
  assert.match(applier, /must remain false/);
  assert.match(applier, /pdfExportVerified/);
  assert.match(applier, /docxDownloadVerified/);
  assert.match(applier, /MATRIX_MD/);
  assert.match(applier, /writeFileSync\(MATRIX_MD/);
});

test("the legacy curated-37 guard accepts holdout export evidence only through its dedicated artifact", () => {
  assert.ok(existsSync(CURATED_37_ASSERTION), "missing curated-37 assertion");
  const assertion = readFileSync(CURATED_37_ASSERTION, "utf8");

  assert.match(assertion, /validateHoldoutRuntimeEvidence/);
  assert.match(assertion, /approvedHoldoutEvidence/);
});

test("holdout evidence validation is shared by every legacy partial-row guard", () => {
  assert.ok(existsSync(VALIDATOR), "missing shared holdout evidence validator");
  const validator = readFileSync(VALIDATOR, "utf8");

  assert.match(validator, /QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE\.latest\.json/);
  assert.match(validator, /pdfExportVerified/);
  assert.match(validator, /persisted === false/);
  for (const script of [
    CURATED_37_ASSERTION,
    `${ROOT}/scripts/audit/assert-curated-57-evidence-matrix.mjs`,
    `${ROOT}/scripts/audit/assert-curated-77-evidence-matrix.mjs`,
  ]) {
    assert.match(readFileSync(script, "utf8"), /validateHoldoutRuntimeEvidence/);
  }
});
