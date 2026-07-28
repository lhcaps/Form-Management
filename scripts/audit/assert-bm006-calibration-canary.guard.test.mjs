import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

function runCanary(env = {}) {
  return spawnSync(
    process.execPath,
    ["scripts/audit/assert-bm006-calibration-canary.mjs"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, ...env },
      maxBuffer: 10 * 1024 * 1024,
    },
  );
}

describe("BM-006 calibration canary baseline guard", () => {
  it("does not report PASS when the canary baseline cannot be read", () => {
    const result = runCanary({
      QLLAW_BM006_CANARY_BASELINE_REF: "__missing_bm006_canary_ref__",
    });

    assert.notEqual(
      result.status,
      0,
      `canary must fail/skip honestly when baseline is missing\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /SKIPPED_NO_BASELINE|BASELINE_MISSING|baseline/i,
    );
    assert.doesNotMatch(result.stdout, /Canary completed/i);
  });
});
