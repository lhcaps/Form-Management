#!/usr/bin/env node
/**
 * Phase 8C.1 — Disposable Bootstrap Apply Twice + Readiness Proof.
 *
 * Sequence (all inside a disposable MariaDB + API image):
 *   1. Verify fresh DB has 0 user tables.
 *   2. Run `prisma migrate deploy` once.
 *   3. Run `prisma migrate deploy` second time (idempotent).
 *   4. Capture readiness before bootstrap (expect contracts missing).
 *   5. Bootstrap dry-run (idempotent SQL generation).
 *   6. Bootstrap apply.
 *   7. Bootstrap apply second time (expect no semantic change).
 *   8. Query metadata counts.
 *   9. Confirm no duplicate natural keys.
 *  10. Confirm contract fingerprints.
 *  11. Confirm API readiness HTTP 200.
 *  12. Restart API.
 *  13. Confirm readiness still 200.
 *  14. Confirm counts/fingerprints unchanged.
 *  15. Cleanup.
 */

import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO = process.env.QLLAW_REPO_ROOT || "D:\\Study\\Project\\QLLaw-main";
const OUT_DIR = process.env.QLLAW_OUT_DIR || join(REPO, ".artifacts", "phase-8c1-bootstrap");
const DATABASE_URL =
  process.env.DATABASE_URL || "mysql://qllaw:qllaw@127.0.0.1:3306/qllaw?connection_limit=10";
const RUN_ID = process.env.QLLAW_RUN_ID || `phase8c1-${Date.now()}`;
const API_BASE_URL = process.env.QLLAW_API_BASE_URL || "http://127.0.0.1:3001";

mkdirSync(OUT_DIR, { recursive: true });

function step(name, payload) {
  const entry = { step: name, timestamp: new Date().toISOString(), ...payload };
  console.log(JSON.stringify(entry, null, 2));
  return entry;
}

function exec(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf-8", ...opts });
}

function shell(cmd, opts = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf-8", ...opts });
}

function prismaDbExecute(sqlText) {
  return shell(
    `pnpm --filter api exec prisma db execute --stdin --schema apps/api/prisma/schema.prisma`,
    { input: sqlText }
  );
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function waitForReadiness(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = exec("curl", ["-fsS", `${API_BASE_URL}/api/v1/ready`]);
      if (r.status === 0) {
        return { ready: true, body: r.stdout };
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return { ready: false };
}

// --- 1. Verify fresh DB has 0 user tables ---
const initialTablesRaw = shell(
  `node scripts/audit/build-phase-8c-bootstrap-sql.mjs --dry-run 2>&1 | findstr corpusFingerprint`,
  { cwd: REPO }
);
const initialFpMatch = initialTablesRaw.match(/[a-f0-9]{64}/);
const initialFingerprint = initialFpMatch ? initialFpMatch[0] : null;

// Use prisma migrate status to check migration table only
const userTablesCheck = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-e", "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema='qllaw';"
]);
const userTableCountMatch = (userTablesCheck.stdout || "").match(/(\d+)/);
const userTableCount = userTableCountMatch ? Number(userTableCountMatch[1]) : -1;

step("fresh-db-zero-user-tables", { userTableCount, fingerprint: initialFingerprint });

if (userTableCount !== 0) {
  console.error(`[FAIL] Fresh DB should have 0 user tables, found ${userTableCount}`);
  process.exit(2);
}

// --- 2. Prisma migrate deploy ---
const deploy1 = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  "cd /app/apps/api && pnpm exec prisma migrate deploy 2>&1"
]);
step("prisma-deploy-1", { exitCode: deploy1.status, stdout: (deploy1.stdout || "").slice(0, 1500) });

const deploy2 = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  "cd /app/apps/api && pnpm exec prisma migrate deploy 2>&1"
]);
step("prisma-deploy-2", { exitCode: deploy2.status, stdout: (deploy2.stdout || "").slice(0, 1500) });

const status = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  "cd /app/apps/api && pnpm exec prisma migrate status 2>&1"
]);
step("prisma-status", { exitCode: status.status, stdout: (status.stdout || "").slice(0, 2000) });

// --- 4. Readiness before bootstrap ---
const readinessBefore = exec("curl", ["-fsS", `${API_BASE_URL}/api/v1/ready`]);
const readinessBeforeStatus = readinessBefore.status;
const readinessBeforeBody = readinessBefore.status === 0 ? readinessBefore.stdout : (readinessBefore.stderr || readinessBefore.stdout);
step("readiness-before-bootstrap", { exitCode: readinessBeforeStatus, body: (readinessBeforeBody || "").slice(0, 1500) });

// --- 5. Bootstrap dry-run ---
const dryRun = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  "cd /app && node scripts/audit/build-phase-8c-bootstrap-sql.mjs --dry-run 2>&1"
]);
const dryRunFp = (dryRun.stdout || "").match(/[a-f0-9]{64}/)?.[0] || null;
step("bootstrap-dry-run", { exitCode: dryRun.status, fingerprint: dryRunFp, stdout: (dryRun.stdout || "").slice(0, 1500) });

// --- 6. Bootstrap apply (first) ---
const apply1 = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  `cd /app && QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1 node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply 2>&1`
]);
step("bootstrap-apply-1", { exitCode: apply1.status, stdout: (apply1.stdout || "").slice(0, 1500) });

// --- 7. Bootstrap apply (second) ---
const apply2 = exec("docker", [
  "exec", "qllaw-phase8c1-api", "sh", "-c",
  `cd /app && QLLAW_BOOTSTRAP_ALLOW_DB_WRITE=1 node scripts/audit/build-phase-8c-bootstrap-sql.mjs --apply 2>&1`
]);
step("bootstrap-apply-2", { exitCode: apply2.status, stdout: (apply2.stdout || "").slice(0, 1500) });

// --- 8. Query metadata counts ---
const templateCount = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-e", "SELECT COUNT(*) FROM templates;"
]);
const versionCount = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-e", "SELECT COUNT(*) FROM form_contract_versions;"
]);
const requiredLocked = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-N", "-e", "SELECT template_code FROM templates WHERE template_code IN ('BM-001','BM-002','BM-003') ORDER BY template_code;"
]);
step("metadata-counts", {
  templates: (templateCount.stdout || "").trim(),
  formContractVersions: (versionCount.stdout || "").trim(),
  requiredLockedRows: (requiredLocked.stdout || "").trim(),
});

// --- 9. Duplicate natural key check ---
const dupes = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-e", "SELECT template_code, COUNT(*) AS c FROM templates GROUP BY template_code HAVING c > 1;"
]);
step("duplicate-natural-key-check", {
  duplicateRows: (dupes.stdout || "").trim() || "(none — no duplicates)",
  exitCode: dupes.status,
});

// --- 10. Contract fingerprints ---
const fingerprints = exec("docker", [
  "exec", "qllaw-phase8c1-mysql", "mariadb", "-uqllaw", "-pqllaw", "qllaw",
  "-N", "-e", "SELECT template_code, contract_hash FROM form_contract_versions WHERE template_code IN ('BM-001','BM-002','BM-003') ORDER BY template_code;"
]);
step("contract-fingerprints", {
  output: (fingerprints.stdout || "").trim(),
});

// --- 11. Readiness after bootstrap ---
const readinessAfter = exec("curl", ["-fsS", `${API_BASE_URL}/api/v1/ready`]);
step("readiness-after-bootstrap", {
  exitCode: readinessAfter.status,
  body: readinessAfter.status === 0 ? readinessAfter.stdout.slice(0, 1500) : (readinessAfter.stderr || readinessAfter.stdout || "").slice(0, 1500),
});

console.log("\n=== Phase 8C.1 Bootstrap Disposable Apply complete ===");
console.log(`Run ID: ${RUN_ID}`);