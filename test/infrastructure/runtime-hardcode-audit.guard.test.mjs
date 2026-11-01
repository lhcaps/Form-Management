import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const PREVIEW = `${ROOT}/apps/web/src/components/documents/template-preview-workspace.tsx`;

describe("runtime hardcode audit allowlist", () => {
  it("allows exactly one stale-fixture detector literal and no runtime copy leak", () => {
    const run = spawnSync(process.execPath, ["scripts/audit-runtime-hardcodes.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr || run.stdout);

    const source = readFileSync(PREVIEW, "utf8");
    const occurrences = source.split("Nguyễn Văn A").length - 1;
    assert.equal(occurrences, 1);
    assert.match(source, /const STALE_NAMES = new Set\(\["Nguyễn Văn A"/);
  });
});
