import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const ORCHESTRATOR = `${ROOT}/scripts/audit/apply-all-current-evidence.mjs`;

describe("current-evidence orchestrator safety contract", () => {
  it("defaults to a read-only check and requires explicit --apply", () => {
    const source = readFileSync(ORCHESTRATOR, "utf8");

    assert.match(source, /const mode = .*"check"/);
    assert.match(source, /--apply/);
    assert.match(source, /--check/);
    assert.match(source, /acquireLock/);
    assert.match(source, /restoreSnapshot/);
    assert.match(source, /timeout:/);
  });

  it("re-applies stored evidence without selectors, render jobs, or a live browser collector", () => {
    const source = readFileSync(ORCHESTRATOR, "utf8");
    const planMatch = source.match(
      /const APPLY_EXISTING_STEPS = \[(?<plan>[\s\S]*?)\n\];/,
    );
    assert.ok(planMatch?.groups?.plan, "APPLY_EXISTING_STEPS must be declared");

    const plan = planMatch.groups.plan;
    assert.doesNotMatch(plan, /select-/);
    assert.doesNotMatch(plan, /render-smoke-/);
    assert.doesNotMatch(plan, /browser-visibility-source-render-only\.mjs/);
    assert.match(plan, /apply-remaining-source-render-curation\.mjs/);
    assert.match(plan, /apply-source-render-only-browser-visibility\.mjs/);
    assert.match(plan, /apply-holdout-runtime-evidence\.mjs/);
    assert.ok(
      plan.indexOf("apply-holdout-runtime-evidence.mjs") >
        plan.indexOf("assert-source-render-only-browser-visibility-evidence-matrix.mjs"),
      "holdout evidence must be applied after legacy partial-row assertions",
    );
  });

  it("preserves canonical matrix evidence and skips legacy raw-input followers when their raw input is absent", () => {
    const source = readFileSync(ORCHESTRATOR, "utf8");

    assert.match(source, /RAW_INPUT_DEPENDENT_STEPS/);
    assert.match(source, /function shouldSkipPreservedEvidenceFollower/);
    assert.match(source, /QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS: "1"/);
    assert.match(source, /Skipping preserved-evidence follower/);
  });
});
