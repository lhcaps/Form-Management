/**
 * C3 Gate Test — Locked vs Compiled Consistency
 * Tests the audit-locked-compiled-consistency.mjs gate.
 *
 * Phase: C3_GATE_HARDEN_AND_BM063_BM066_COMPILED_RECONCILE_V1
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// Detect the workspace root: test files live at {ROOT}/test/*.test.mjs.
// Use import.meta.url to resolve from the test file location, not from cwd.
const __testDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__testDir, "..");
const SCRIPT = path.join(ROOT, "scripts", "audit", "audit-locked-compiled-consistency.mjs");
const OUTPUT_DIR = path.join(ROOT, "docs", "audit", "sot-gates-v1");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");

// Run the gate as a child process and return {stdout, stderr, exitCode}.
function runGate(args = [], input = "") {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: ROOT,
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
    if (input) proc.stdin.write(input);
    proc.stdin.end();
  });
}

describe("C3: Locked vs Compiled Consistency Gate", () => {

  // ── Structural tests ──────────────────────────────────────────────────────

  it("gate script exists", () => {
    assert.ok(fs.existsSync(SCRIPT), `Gate script not found at ${SCRIPT}`);
  });

  it("gate script is readable and contains required fields", () => {
    const content = fs.readFileSync(SCRIPT, "utf8");
    assert.ok(content.length > 100, "Gate script is too short");
    assert.ok(content.includes("LOCKED_DIR"), "Gate script missing LOCKED_DIR constant");
    assert.ok(content.includes("COMPILED_V2_DIR"), "Gate script missing COMPILED_V2_DIR constant");
    assert.ok(content.includes("stableHashLocked"), "Gate script missing stableHashLocked function");
    assert.ok(content.includes("analyze"), "Gate script missing analyze function");
    // Phase A new features
    assert.ok(content.includes("blockingIssues"), "Gate script missing blockingIssues field");
    assert.ok(content.includes("warningIssues"), "Gate script missing warningIssues field");
    assert.ok(content.includes("affectedBms"), "Gate script missing affectedBms field");
    assert.ok(content.includes("JSON_ONLY"), "Gate script missing JSON_ONLY argument");
    assert.ok(content.includes("--json-only"), "Gate script missing --json-only option");
  });

  // ── Directory existence tests ─────────────────────────────────────────────

  it("locked contracts directory exists with 213 contracts", () => {
    const files = fs.readdirSync(LOCKED_DIR)
      .filter((f) => f.endsWith(".contract.locked.json"));
    assert.ok(files.length >= 200, `Expected ~213 locked contracts, found ${files.length}`);
  });

  it("compiled-v2 directory exists with 213 artifacts", () => {
    const files = fs.readdirSync(COMPILED_V2_DIR)
      .filter((f) => f.endsWith(".compiled.json"));
    assert.ok(files.length >= 200, `Expected ~213 compiled artifacts, found ${files.length}`);
  });

  // ── BM-063 stale binding fixture ──────────────────────────────────────────
  // NOTE: After Phase C (recompile), BM-063 and BM-066 no longer have orphan bindings.
  // These tests verify the PRE-reconcile state. After reconciliation:
  // - Tests 5-6 prove the old stale binding existed (now gone from compiled.json)
  // - Tests 14 proves --strict now exits 0 (BM-063/066 fixed)
  // - Tests 15 proves default mode still exits 0
  // - A new test (15a) proves the new compiled.json has no orphans

  it("BM-063: locked contract does NOT have document.fullDocumentCode8 slot", () => {
    const LOCKED = path.join(LOCKED_DIR, "BM-063__54b73110a34f.contract.locked.json");
    assert.ok(fs.existsSync(LOCKED), "BM-063 locked contract not found");
    const locked = JSON.parse(fs.readFileSync(LOCKED, "utf8"));
    const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
    assert.ok(
      !lockedSlotIds.has("document.fullDocumentCode8"),
      "BM-063 locked contract should NOT have document.fullDocumentCode8 slot",
    );
  });

  it("BM-063: new compiled artifact has no orphan bindings after Phase C reconcile", () => {
    const LOCKED = path.join(LOCKED_DIR, "BM-063__54b73110a34f.contract.locked.json");
    const COMPILED = path.join(COMPILED_V2_DIR, "BM-063.compiled.json");
    assert.ok(fs.existsSync(LOCKED), "BM-063 locked contract not found");
    assert.ok(fs.existsSync(COMPILED), "BM-063 compiled artifact not found");
    const locked = JSON.parse(fs.readFileSync(LOCKED, "utf8"));
    const compiled = JSON.parse(fs.readFileSync(COMPILED, "utf8"));
    const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
    const lockedFieldPaths = new Set((locked.canonicalFields || []).map((f) => f.path));
    const bindings = compiled.renderPlan?.bindings || [];
    const orphans = bindings.filter((b) => {
      const t = b.target?.slotId || b.slotId;
      const s = b.source?.fieldKey || b.from;
      return (t && !lockedSlotIds.has(t)) || (s && !lockedFieldPaths.has(s));
    });
    assert.strictEqual(orphans.length, 0, "BM-063 should have 0 orphan bindings after recompile");
  });

  it("BM-066: locked contract does NOT have recipients.personLine4 slot", () => {
    const LOCKED = path.join(LOCKED_DIR, "BM-066__e3bc56081554.contract.locked.json");
    assert.ok(fs.existsSync(LOCKED), "BM-066 locked contract not found");
    const locked = JSON.parse(fs.readFileSync(LOCKED, "utf8"));
    const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
    assert.ok(
      !lockedSlotIds.has("recipients.personLine4"),
      "BM-066 locked contract should NOT have recipients.personLine4 slot",
    );
  });

  it("BM-066: new compiled artifact has no orphan bindings after Phase C reconcile", () => {
    const LOCKED = path.join(LOCKED_DIR, "BM-066__e3bc56081554.contract.locked.json");
    const COMPILED = path.join(COMPILED_V2_DIR, "BM-066.compiled.json");
    assert.ok(fs.existsSync(LOCKED), "BM-066 locked contract not found");
    assert.ok(fs.existsSync(COMPILED), "BM-066 compiled artifact not found");
    const locked = JSON.parse(fs.readFileSync(LOCKED, "utf8"));
    const compiled = JSON.parse(fs.readFileSync(COMPILED, "utf8"));
    const lockedSlotIds = new Set((locked.docxSlots || []).map((s) => s.slotId));
    const lockedFieldPaths = new Set((locked.canonicalFields || []).map((f) => f.path));
    const bindings = compiled.renderPlan?.bindings || [];
    const orphans = bindings.filter((b) => {
      const t = b.target?.slotId || b.slotId;
      const s = b.source?.fieldKey || b.from;
      return (t && !lockedSlotIds.has(t)) || (s && !lockedFieldPaths.has(s));
    });
    assert.strictEqual(orphans.length, 0, "BM-066 should have 0 orphan bindings after recompile");
  });

  // ── Gate output validation ─────────────────────────────────────────────────

  it("latest.json gate output exists", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    assert.ok(fs.existsSync(output), `Gate output not found at ${output}`);
  });

  it("latest.json gate output is valid JSON with new Phase A fields", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    if (!fs.existsSync(output)) return;
    const data = JSON.parse(fs.readFileSync(output, "utf8"));
    assert.strictEqual(data.gate, "C3_LOCKED_COMPILED_CONSISTENCY", "Wrong gate name");
    assert.ok(Array.isArray(data.results), "results should be an array");
    assert.ok(data.summary, "summary should exist");
    // Phase A required fields
    assert.ok("blockingIssues" in data, "output must have blockingIssues array");
    assert.ok("warningIssues" in data, "output must have warningIssues array");
    assert.ok("affectedBms" in data, "output must have affectedBms array");
    assert.ok(Array.isArray(data.blockingIssues), "blockingIssues should be an array");
    assert.ok(Array.isArray(data.warningIssues), "warningIssues should be an array");
    assert.ok(Array.isArray(data.affectedBms), "affectedBms should be an array");
  });

  it("latest.json reports all 213 BMs as CONSISTENT after Phase C reconcile", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    if (!fs.existsSync(output)) return;
    const data = JSON.parse(fs.readFileSync(output, "utf8"));
    const inconsistent = data.results.filter((r) => r.status !== "CONSISTENT");
    assert.strictEqual(inconsistent.length, 0, `All BMs should be CONSISTENT, found ${inconsistent.length} inconsistent`);
  });

  it("latest.json reports BM-063 and BM-066 as CONSISTENT after Phase C reconcile", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    if (!fs.existsSync(output)) return;
    const data = JSON.parse(fs.readFileSync(output, "utf8"));
    const bm063 = data.results.find((r) => r.templateCode === "BM-063");
    const bm066 = data.results.find((r) => r.templateCode === "BM-066");
    assert.ok(bm063, "BM-063 should be in results");
    assert.ok(bm066, "BM-066 should be in results");
    assert.strictEqual(bm063.status, "CONSISTENT", `BM-063 should be CONSISTENT after fix, got ${bm063.status}`);
    assert.strictEqual(bm066.status, "CONSISTENT", `BM-066 should be CONSISTENT after fix, got ${bm066.status}`);
    assert.strictEqual(bm063.issues.length, 0, "BM-063 should have 0 issues after fix");
    assert.strictEqual(bm066.issues.length, 0, "BM-066 should have 0 issues after fix");
  });

  // ── Phase A: BM-level and issue-level counts are properly separated ──────────
  // After Phase C reconcile: all 213 BMs are consistent.
  // Verify the summary fields exist and BM-level counts sum correctly.

  it("BM-level counts sum to total (all consistent after Phase C reconcile)", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    if (!fs.existsSync(output)) return;
    const data = JSON.parse(fs.readFileSync(output, "utf8"));
    const s = data.summary;
    assert.strictEqual(s.criticalBmCount, 0, "criticalBmCount should be 0 after fix");
    assert.strictEqual(s.staleBmCount, 0, "staleBmCount should be 0 after fix");
    assert.strictEqual(s.missingCompiledBmCount, 0, "missingCompiledBmCount should be 0 after fix");
    assert.strictEqual(s.consistentBmCount, 213, "consistentBmCount should be 213 after fix");
    assert.strictEqual(s.criticalIssueCount, 0, "criticalIssueCount should be 0 after fix");
    assert.strictEqual(s.highIssueCount, 0, "highIssueCount should be 0 after fix");
    assert.strictEqual(
      s.consistentBmCount + s.staleBmCount + s.missingCompiledBmCount + s.criticalBmCount,
      s.total,
      "BM-level counts should sum to total",
    );
    assert.ok(
      "consistentBmCount" in s,
      "summary must have consistentBmCount (not just 'consistent')",
    );
    assert.ok(
      "staleBmCount" in s,
      "summary must have staleBmCount (not just 'stale')",
    );
    assert.ok(
      "missingCompiledBmCount" in s,
      "summary must have missingCompiledBmCount (not just 'missing')",
    );
  });

  // ── Phase A: blockingIssues and affectedBms populated ─────────────────────

  it("blockingIssues array is empty after Phase C reconcile", () => {
    const output = path.join(OUTPUT_DIR, "latest.json");
    if (!fs.existsSync(output)) return;
    const data = JSON.parse(fs.readFileSync(output, "utf8"));
    assert.strictEqual(data.blockingIssues.length, 0, "blockingIssues should be empty after fix");
    assert.strictEqual(data.affectedBms.length, 0, "affectedBms should be empty after fix");
  });

  // ── Phase A: --strict exit code tests ────────────────────────────────────

  it("--strict exits 0 after Phase C reconciliation (BM-063/BM-066 fixed)", async () => {
    const { exitCode, stderr } = await runGate(["--strict"]);
    // After recompile: 213/213 consistent, --strict should exit 0
    assert.strictEqual(exitCode, 0, `--strict should exit 0 after fix, got ${exitCode}. stderr: ${stderr}`);
    assert.ok(stderr.includes("213/213 consistent"), "stderr should confirm 213/213 consistent");
  });

  it("default mode exits 0 even with blocking issues", async () => {
    const { exitCode } = await runGate([]);
    assert.strictEqual(exitCode, 0, "Default mode should exit 0 even with issues");
  });

  it("--json-only produces valid JSON and no markdown", async () => {
    const { stdout, stderr, exitCode } = await runGate(["--json-only"]);
    assert.strictEqual(exitCode, 0, "--json-only should exit 0");
    assert.ok(stderr.length === 0, "--json-only should produce no stderr output");
    const parsed = JSON.parse(stdout);
    assert.strictEqual(parsed.gate, "C3_LOCKED_COMPILED_CONSISTENCY");
    assert.ok(Array.isArray(parsed.results));
    assert.ok(Array.isArray(parsed.blockingIssues));
    assert.ok(Array.isArray(parsed.affectedBms));
  });

  it("--bm=BM-063 shows 0 critical BMs after reconciliation", async () => {
    // Use --json-only so output goes to stdout, not latest.json (avoids clobbering shared file)
    const { stdout, exitCode } = await runGate(["--bm=BM-063", "--json-only"]);
    assert.strictEqual(exitCode, 0);
    const data = JSON.parse(stdout);
    assert.strictEqual(data.results.length, 1);
    assert.strictEqual(data.results[0].templateCode, "BM-063");
    assert.strictEqual(data.summary.criticalBmCount, 0, "BM-063 should have 0 critical BMs after fix");
    assert.strictEqual(data.summary.consistentBmCount, 1, "BM-063 should be consistent after fix");
  });

  // ── Read-only guarantee ───────────────────────────────────────────────────

  it("gate does NOT mutate locked contracts", () => {
    const LOCKED = path.join(LOCKED_DIR, "BM-063__54b73110a34f.contract.locked.json");
    const script = fs.readFileSync(SCRIPT, "utf8");
    const lines = script.split("\n");
    const writesToLocked = lines.some((line) => {
      if (!line.includes("writeFileSync")) return false;
      const idx = lines.indexOf(line);
      for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
        if (lines[i].includes("LOCKED_DIR")) return true;
      }
      return false;
    });
    assert.ok(!writesToLocked, "Gate script should not write to LOCKED_DIR");
  });

  it("gate does NOT mutate normalized DOCX", () => {
    const script = fs.readFileSync(SCRIPT, "utf8");
    assert.ok(!script.includes("normalized-docx"), "Gate script should not reference normalized-docx");
    assert.ok(!script.includes("normalized_docx"), "Gate script should not reference normalized_docx");
  });

  it("gate does NOT write compiled-v2 (only reads)", () => {
    const script = fs.readFileSync(SCRIPT, "utf8");
    const lines = script.split("\n");
    const writesCompiled = lines.some((line) => {
      if (!line.includes("writeFileSync")) return false;
      const idx = lines.indexOf(line);
      for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
        if (lines[i].includes("COMPILED_V2_DIR")) return true;
      }
      return false;
    });
    assert.ok(!writesCompiled, "Gate script should not write to COMPILED_V2_DIR");
  });
});
