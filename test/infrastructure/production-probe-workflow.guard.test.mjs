import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd());
const workflow = readFileSync(
  resolve(ROOT, ".github/workflows/production-probe.yml"),
  "utf8",
);

describe("production probe workflow release contract", () => {
  it("verifies the exact four-style font policy before the Docker probe", () => {
    const fontVerifier = workflow.indexOf("scripts/fonts/verify-font-policy.mjs");
    const probe = workflow.indexOf('name: Run isolated production probe');

    assert.ok(fontVerifier >= 0, "workflow must invoke the governed font verifier");
    assert.ok(probe >= 0, "workflow must contain the Docker probe step");
    assert.ok(fontVerifier < probe, "font verification must precede the Docker probe");
    assert.match(workflow, /QLLAW_FONT_POLICY=required/);
    assert.match(workflow, /QLLAW_REQUIRED_FONT_FAMILY=['"]Times New Roman['"]/);
  });

  it("creates an immutable release tag only after the probe job succeeds", () => {
    assert.match(workflow, /inputs:\s*\n\s+release_tag:/);
    assert.match(
      workflow,
      /^  tag:\n[\s\S]*?^    needs:\s*probe/m,
    );
    assert.match(workflow, /contents:\s*write/);
    assert.match(workflow, /git tag --annotate/);
    assert.match(workflow, /git push origin "refs\/tags\/\$tag"/);
    assert.doesNotMatch(workflow, /-e \\\"SELECT COUNT/);
  });
});
