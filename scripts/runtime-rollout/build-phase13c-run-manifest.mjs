/**
 * Phase 13C run manifest — the authoritative list of 83 forms to execute,
 * their per-form status, and the cross-pipeline shape.
 *
 * Updated by run-phase13c-browser-e2e.mjs as each form progresses.
 */
import { createHash } from "node:crypto";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13c-live-browser",
);
const MANIFEST_PATH = path.join(PHASE13C_DIR, "run-manifest.json");
const QUEUE_PATH = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13b-persisted-browser",
  "browser-queue-83.json",
);

const RUNTIME_READY_CODES = [
  "BM-001", "BM-002", "BM-008", "BM-010", "BM-012", "BM-136", "BM-148",
  "BM-156", "BM-157", "BM-168", "BM-171", "BM-174", "BM-181", "BM-206",
  "BM-213",
];

async function main() {
  await mkdir(PHASE13C_DIR, { recursive: true });
  const queue = JSON.parse(await readFile(QUEUE_PATH, "utf8"));
  const rows = queue.rows.map((r) => {
    const code = r.FORM_CODE || r.formCode;
    const runtimeReady = RUNTIME_READY_CODES.includes(code);
    return {
      FORM_CODE: code,
      RUNTIME_READY: runtimeReady,
      BRIDGE_STATUS: runtimeReady ? "PERSISTED_BRIDGE_BLOCKED_BY_RUNTIME_READY" : "AVAILABLE_VIA_DRAFT_BRIDGE",
      STATE: "QUEUED",
      RUNS: 0,
      LAST_RESULT: null,
      LAST_AT: null,
    };
  });

  const counts = {
    TOTAL: rows.length,
    AVAILABLE: rows.filter((r) => r.BRIDGE_STATUS === "AVAILABLE_VIA_DRAFT_BRIDGE").length,
    BLOCKED_RUNTIME_READY: rows.filter((r) => r.BRIDGE_STATUS === "PERSISTED_BRIDGE_BLOCKED_BY_RUNTIME_READY").length,
  };

  const manifest = {
    schema: "qllaw.phase13c.run_manifest/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13c-live-browser",
    runId: "PHASE13C_2026_07_27_0137",
    counts,
    rows,
    activeShard: 0,
    shardCount: 1,
    workers: 3,
    status: "INITIALIZED",
    lastVerifiedAt: null,
  };

  const hash = createHash("sha256").update(JSON.stringify(rows.map((r) => r.FORM_CODE))).digest("hex");
  manifest.queueHash = hash;

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`[phase13c-run-manifest] total=${counts.TOTAL} available=${counts.AVAILABLE} blocked=${counts.BLOCKED_RUNTIME_READY}`);
  console.log(`[phase13c-run-manifest] artifact=${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("[phase13c-run-manifest] fatal:", err);
  process.exit(1);
});
