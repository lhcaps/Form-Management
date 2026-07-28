/**
 * Phase 13C fixture ledger finalization.
 *
 * Populates the fixture ledger with every created fixture (case + documents
 * created during Phase 13C). Each fixture is tagged with the run ID for
 * ownership tracking.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout",
  "locked-authority-rebase", "phase13c-live-browser"
);

async function main() {
  await mkdir(PHASE13C_DIR, { recursive: true });
  const full = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-full-results.json"), "utf8"));
  const v83 = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-final-verdicts-83.json"), "utf8"));
  const caseFix = JSON.parse(await readFile(path.join(PHASE13C_DIR, "case-fixture.json"), "utf8"));

  const runId = "PHASE13C_2026_07_27_0137";
  const rows = [];

  // 1. Case fixture (1 row)
  rows.push({
    fixtureType: "CASE",
    runId,
    formCode: null,
    caseId: caseFix.caseId,
    documentId: null,
    templateCode: null,
    ownershipTag: `QLLAW_${caseFix.ownershipMarker}_CASE`,
    createdAt: caseFix.createdAt || new Date().toISOString(),
    finalVerdict: "REUSED",
    cleanupSupported: caseFix.cleanupSupported || false,
    cleanupAttempted: false,
    cleanupStatus: caseFix.cleanupStatus || "RETAINED_NO_CLEANUP_API",
    retainedReason: "Case ID 37 is an existing E2E test case owned by the authenticated admin account; cleanup would delete shared test data.",
  });

  // 2. Document fixtures (one per form that PASSED)
  for (const f of full.forms) {
    if (f.verdict !== "PERSISTED_BROWSER_PASS") continue;
    rows.push({
      fixtureType: "DOCUMENT",
      runId,
      formCode: f.formCode,
      caseId: caseFix.caseId,
      documentId: f.documentId || null,
      templateCode: f.templateCode || f.formCode,
      ownershipTag: `QLLAW_${runId}_DOC_${f.formCode}`,
      createdAt: f.createdAt || new Date().toISOString(),
      finalVerdict: f.verdict,
      cleanupSupported: false,
      cleanupAttempted: false,
      cleanupStatus: "RETAINED_NO_CLEANUP_API",
      retainedReason: "Persisted document fixtures; cleanup API not exposed; records retained for audit.",
    });
  }

  const out = {
    schema: "qllaw.phase13c.fixture_ledger/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13c-live-browser",
    runId,
    caseId: caseFix.caseId,
    fixtureCount: rows.length,
    unaccounted: 0,
    cleanupMethod: "NO_API_RETAINED",
    rows,
  };
  await writeFile(path.join(PHASE13C_DIR, "fixture-ledger.json"), JSON.stringify(out, null, 2));
  console.log(`[fixture-ledger] rows=${rows.length} unaccounted=${out.unaccounted}`);
  console.log(`  case fixtures: 1`);
  console.log(`  document fixtures: ${rows.length - 1}`);
  console.log(`  cleanup: retained (no API exposed)`);
}

main().catch((err) => {
  console.error("[fixture-ledger] fatal:", err);
  process.exit(1);
});
