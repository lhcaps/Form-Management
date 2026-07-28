import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8");

test("static verification builds the workspace contract package before typechecking consumers", () => {
  const staticJob = workflow.slice(
    workflow.indexOf("  static-verification:"),
    workflow.indexOf("  migration-regression-gate:"),
  );
  const buildContracts = staticJob.indexOf("pnpm build:contracts");
  const verify = staticJob.indexOf("pnpm verify:ci");

  assert.ok(buildContracts >= 0, "CI must build @qllaw/form-contracts after a clean install");
  assert.ok(verify >= 0, "CI must run the deterministic verification command");
  assert.ok(buildContracts < verify, "contract build must precede verification consumers");
});
