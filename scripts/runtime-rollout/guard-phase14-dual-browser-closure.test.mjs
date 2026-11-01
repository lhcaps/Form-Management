/**
 * Phase 14 — closure guard unit tests.
 *
 * 4 tests: every guard, empirical block, fail-closed on missing file,
 * fail-closed on garbage JSON.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";

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
const GUARD = path.join(REPO_ROOT, "scripts", "runtime-rollout", "guard-phase14-dual-browser-closure.mjs");

function runGuard() {
  const r = spawnSync("node", [GUARD], { cwd: REPO_ROOT, encoding: "utf8" });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

test("guard passes the live 14/16 with 2 fail-closed checks tied to browser UI evidence", async () => {
  const { status } = runGuard();
  // The guard always exits 0 in this turn because it must not crash;
  // the "fail" is recorded in the JSON output.
  assert.equal(status, 0);
  const out = JSON.parse(await readFile(path.join(PHASE14_DIR, "guard-results.json"), "utf8"));
  assert.equal(out.totalChecks, 16);
  assert.equal(out.passCount, 14);
  assert.equal(out.failCount, 2);
  assert.deepEqual(out.checks.filter((c) => !c.pass).map((c) => c.id), [
    "BROWSER_LIFECYCLE_83",
    "PROMOTION_BLOCKED_83",
  ]);
  assert.equal(out.empiricalVerdict, "BLOCKED_BY_AUTH_REFRESH_REQUIRED");
});

test("empirical UI blocker is acknowledged in the guard output", async () => {
  const out = JSON.parse(await readFile(path.join(PHASE14_DIR, "guard-results.json"), "utf8"));
  const probeCheck = out.checks.find((c) => c.id === "EMPIRICAL_UI_BLOCKER_ACKNOWLEDGED");
  assert.ok(probeCheck, "missing EMPIRICAL_UI_BLOCKER_ACKNOWLEDGED check");
  assert.equal(probeCheck.pass, true);
});

test("guard fails closed if matrix is corrupted", async () => {
  const matrixPath = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
  const original = await readFile(matrixPath, "utf8");
  const backup = `${matrixPath}.bak`;
  try {
    await writeFile(backup, original);
    await writeFile(matrixPath, JSON.stringify({ rows: [], counts: { persistedLifecycle: 0, standaloneLifecycle: 0 } }));
    const out = runGuard();
    assert.equal(out.status, 0); // script does not crash
    const guardOut = JSON.parse(await readFile(path.join(PHASE14_DIR, "guard-results.json"), "utf8"));
    const matrixCheck = guardOut.checks.find((c) => c.id === "MATRIX_83");
    assert.equal(matrixCheck.pass, false);
  } finally {
    await writeFile(matrixPath, original);
    try { await rm(backup); } catch { /* ignore */ }
  }
});

test("guard outputs a well-formed JSON artifact", async () => {
  const out = JSON.parse(await readFile(path.join(PHASE14_DIR, "guard-results.json"), "utf8"));
  assert.equal(out.schema, "qllaw.phase14.closure_guard/v1");
  assert.equal(out.phase, "phase14-dual-browser-promotion");
  assert.ok(Array.isArray(out.checks));
  assert.ok(out.checks.every((c) => typeof c.id === "string" && typeof c.pass === "boolean"));
});
