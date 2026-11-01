#!/usr/bin/env node
/**
 * dev-orchestrator.mjs — Portable development orchestrator for QLLaw.
 *
 * Startup sequence:
 *   1. Check Docker Engine
 *   2. Start MariaDB (infra:up) if not already healthy
 *   3. Wait for MariaDB health
 *   4. Validate DATABASE_URL reachability
 *   5. Check Prisma Client generation
 *   6. Non-destructive migration status check (informational only)
 *   7. Start API in background
 *   8. Wait for API /api/v1/health to return 200 (liveness)
 *   8b. Wait for API /api/v1/ready body.ok === true (readiness)
 *   9. Start Web in background
 *  10. Wait for Web /healthz to return 200
 *  11. Print ready URLs + write timing JSON
 *
 * Ctrl+C / SIGTERM: sends SIGTERM to API+Web, waits up to 5s, SIGKILL remainder.
 *
 * Works on: Windows PowerShell, cmd.exe, Linux CI (no Unix-prefix env syntax).
 *
 * Exit codes:
 *   0   All services started successfully (process stays alive until Ctrl+C)
 *   1   Docker Engine not running or unexpected fatal error
 *   2   MariaDB failed to start or become healthy
 *   3   DATABASE_URL invalid or unreachable
 *   4   Prisma Client not generated (run: pnpm install)
 *   5   API failed to start or become ready within timeout
 *   6   Web failed to start or become ready within timeout
 *   130 User interrupted (Ctrl+C)
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import net from "node:net";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMPOSE_DEV = resolve(ROOT, "infra/docker-compose.dev.yml");

// Stable Compose project name scoped to this repo root.
// By default the Compose file's top-level `name: quanlyvks-dev` is used (no -p),
// keeping pnpm db:up / db:down / pnpm dev consistent with the same project.
// Set QLLAW_DEV_COMPOSE_PROJECT to override — useful for two worktrees on one machine.
const _composeProjectOverride = process.env.QLLAW_DEV_COMPOSE_PROJECT;
// Base Compose args: always include -f; only add -p when an explicit override is set.
const COMPOSE_DEV_ARGS = _composeProjectOverride
  ? ["-p", _composeProjectOverride, "-f", COMPOSE_DEV]
  : ["-f", COMPOSE_DEV];
const COMPOSE_PROJECT = _composeProjectOverride ?? "quanlyvks-dev";

// --audit-report: copy sanitized timing to docs/audit (opt-in only).
// By default timing is written to .tmp-qllaw/ which is gitignored.
const AUDIT_REPORT_MODE = process.argv.includes("--audit-report");
const TIMING_DEFAULT_DIR = resolve(ROOT, ".tmp-qllaw/runtime");
const TIMING_AUDIT_DIR = resolve(ROOT, "docs/audit/docker-production/runtime");

const HEALTH_API     = "http://127.0.0.1:3001/api/v1/health";
const READINESS_API  = "http://127.0.0.1:3001/api/v1/ready";
const HEALTH_WEB     = "http://127.0.0.1:3000/healthz";
const HEALTH_TIMEOUT_MS   = 120_000;
const READINESS_TIMEOUT_MS = 60_000;
const HEALTH_POLL_MS = 1_500;

const childProcesses = new Set();
let isShuttingDown = false;

// ─── timing ───────────────────────────────────────────────────────────────────

const timingPhases = {};

function phaseStart(name) {
  timingPhases[name] = { startedAt: new Date().toISOString(), _start: performance.now() };
}

function phaseEnd(name, status = "PASS") {
  const phase = timingPhases[name];
  if (!phase) return;
  const durationMs = Math.round(performance.now() - phase._start);
  phase.finishedAt = new Date().toISOString();
  phase.durationMs = durationMs;
  phase.status = status;
  delete phase._start;
}

function writeTimingReport() {
  // Compute wall-clock total from orchestrator start, not by summing phases
  // (phases can overlap; totalDurationMs is wall-clock from orchestrator start
  //  to Web ready, recorded separately in the total_startup phase).
  const totalPhase = timingPhases["total_startup"];
  const totalDurationMs = totalPhase?.durationMs ??
    Math.round(performance.now() - (timingPhases["preflight"]?._start ?? 0));

  const report = {
    generatedAt: new Date().toISOString(),
    auditReportMode: AUDIT_REPORT_MODE,
    phases: timingPhases,
    totalDurationMs,
    // Summation helper only (informational — may double-count overlapping phases)
    phaseSumMs: Object.values(timingPhases).reduce(
      (sum, p) => sum + (p.durationMs ?? 0), 0
    ),
  };

  // Default: always write to gitignored .tmp-qllaw/
  try {
    mkdirSync(TIMING_DEFAULT_DIR, { recursive: true });
    writeFileSync(
      resolve(TIMING_DEFAULT_DIR, "local-dev-timing.latest.json"),
      JSON.stringify(report, null, 2),
      "utf8",
    );
    log("TIMING", `Report written: .tmp-qllaw/runtime/local-dev-timing.latest.json`);
  } catch (err) {
    warn("TIMING", `Failed to write default timing report: ${err.message}`);
  }

  // --audit-report: also copy sanitized report to docs/ (explicit operator action)
  if (AUDIT_REPORT_MODE) {
    try {
      mkdirSync(TIMING_AUDIT_DIR, { recursive: true });
      writeFileSync(
        resolve(TIMING_AUDIT_DIR, "local-dev-timing.latest.json"),
        JSON.stringify(report, null, 2),
        "utf8",
      );
      log("TIMING", `Audit report written: docs/audit/docker-production/runtime/local-dev-timing.latest.json`);
    } catch (err) {
      warn("TIMING", `Failed to write audit timing report: ${err.message}`);
    }
  }
}

// ─── logging ─────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString().slice(11, 19);
}
function log(tag, msg) {
  process.stdout.write(`[${ts()}] [${tag.padEnd(8)}] ${msg}\n`);
}
function warn(tag, msg) {
  process.stderr.write(`[${ts()}] [${tag.padEnd(8)}] ${msg}\n`);
}

// ─── env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(ROOT, ".env");
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath, processEnv: env, override: false, quiet: true });
  }
  return env;
}

// ─── utilities ───────────────────────────────────────────────────────────────

function runSync(command, args, opts = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.quiet ? "pipe" : "inherit",
    windowsHide: true,
    ...opts,
  });
}

function probeTcp(host, port, ms = 800) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (ok) => { if (settled) return; settled = true; socket.destroy(); resolve(ok); };
    socket.setTimeout(ms, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function httpGet(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    let body = null;
    try {
      const text = await res.text();
      body = text.trim() ? JSON.parse(text) : null;
    } catch {
      // non-JSON response is OK for liveness
    }
    return { ok: res.status < 400, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  } finally {
    clearTimeout(timer);
  }
}

/** Wait for a URL to return HTTP 2xx. Used for liveness. */
async function waitHttp(url, label, timeoutMs = HEALTH_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    const r = await httpGet(url);
    if (r.ok) {
      log(label, `Ready (HTTP ${r.status}, attempt ${attempt})`);
      return true;
    }
    if (attempt % 8 === 0) {
      log(label, `Waiting... (${Math.round((deadline - Date.now()) / 1000)}s remaining)`);
    }
    await new Promise((r) => setTimeout(r, HEALTH_POLL_MS));
  }
  warn(label, `Timeout — did not become ready within ${timeoutMs / 1000}s`);
  return false;
}

/**
 * Wait for /ready to return HTTP 2xx AND body.ok === true.
 *
 * Per readiness semantics design:
 *   - HTTP 200 + body.ok = true  → READY
 *   - HTTP 200 + body.ok = false → NOT READY (waiter must continue)
 *   - HTTP 503               → NOT READY (service is up but checks failing)
 *   - Non-2xx / network err  → NOT READY (service not up yet)
 *
 * Logs the exact failed check when body.ok = false so the operator can act.
 */
async function waitReadiness(url, label, timeoutMs = READINESS_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  let lastFailReason = "";
  while (Date.now() < deadline) {
    attempt++;
    const r = await httpGet(url);
    if (r.ok && r.body?.ok === true) {
      log(label, `Readiness PASS (HTTP ${r.status}, attempt ${attempt})`);
      return true;
    }
    // Diagnose what failed
    if (r.ok && r.body?.ok === false) {
      const failedChecks = Object.entries(r.body?.checks ?? {})
        .filter(([, v]) => v?.ok === false)
        .map(([k, v]) => `${k}(${v?.status ?? v?.error ?? "FAIL"})`);
      lastFailReason = failedChecks.length
        ? `checks failing: ${failedChecks.join(", ")}`
        : "body.ok=false (no check detail)";
      if (attempt % 8 === 0) {
        log(label, `Readiness NOT_READY — ${lastFailReason} (${Math.round((deadline - Date.now()) / 1000)}s remaining)`);
      }
    } else if (!r.ok) {
      lastFailReason = `HTTP ${r.status || "timeout"}`;
      if (attempt % 8 === 0) {
        log(label, `Readiness waiting... (${lastFailReason}, ${Math.round((deadline - Date.now()) / 1000)}s remaining)`);
      }
    }
    await new Promise((r) => setTimeout(r, HEALTH_POLL_MS));
  }
  warn(label, `Timeout — readiness did not pass within ${timeoutMs / 1000}s`);
  if (lastFailReason) warn(label, `Last failure reason: ${lastFailReason}`);
  return false;
}

// ─── child process management ────────────────────────────────────────────────

function spawnBackground(args, label, extraEnv = {}) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: extraEnv,
    stdio: "inherit",
    windowsHide: true,
  });
  childProcesses.add(child);
  child.once("exit", (code, signal) => {
    childProcesses.delete(child);
    if (!isShuttingDown) {
      if (signal) warn(label, `Exited by signal ${signal}`);
      else if (code !== 0) warn(label, `Exited with code ${code}`);
    }
  });
  return child;
}

async function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  if (childProcesses.size === 0) return;
  log("CLEANUP", `Stopping ${childProcesses.size} child process(es)…`);
  for (const ch of childProcesses) { try { if (!ch.killed) ch.kill("SIGTERM"); } catch {} }
  const deadline = Date.now() + 5000;
  while (childProcesses.size > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const ch of childProcesses) { try { if (!ch.killed) ch.kill("SIGKILL"); } catch {} }
  log("CLEANUP", "Done.");
}

process.on("SIGINT", async () => {
  log("SIGNAL", "SIGINT (Ctrl+C)");
  writeTimingReport();
  await cleanup();
  process.exit(130);
});
process.on("SIGTERM", async () => {
  log("SIGNAL", "SIGTERM");
  writeTimingReport();
  await cleanup();
  process.exit(0);
});

// ─── compose helpers ─────────────────────────────────────────────────────────

function composePs() {
  const r = runSync("docker", ["compose", ...COMPOSE_DEV_ARGS, "ps", "--format", "json"], { quiet: true });
  if (r.status !== 0) return [];
  try {
    const lines = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
    return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function isDevDbHealthy() {
  const services = composePs();
  if (services.length === 0) return false;
  return services.every((s) => s.Health === "healthy" || s.Status?.includes("healthy"));
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const totalStart = performance.now();
  log("START", "QLLaw dev-orchestrator");
  phaseStart("preflight");

  const env = loadEnv();
  phaseEnd("preflight");

  // 1. Docker Engine
  phaseStart("docker_detection");
  log("DOCKER", "Checking Docker Engine…");
  const dockerVer = runSync("docker", ["version", "--format", "{{.Server.Version}}"], { quiet: true });
  if (dockerVer.status !== 0) {
    phaseEnd("docker_detection", "FAIL");
    warn("DOCKER", "Docker Engine is not running. Start Docker Desktop and retry.");
    process.exit(1);
  }
  log("DOCKER", `Engine v${(dockerVer.stdout || "").trim()}`);
  phaseEnd("docker_detection");

  // 2 & 3. MariaDB start + health wait
  phaseStart("mariadb_start");
  if (isDevDbHealthy()) {
    log("DB", "MariaDB already healthy — skipping startup.");
    phaseEnd("mariadb_start", "SKIP_ALREADY_HEALTHY");
    phaseStart("mariadb_health_wait");
    phaseEnd("mariadb_health_wait", "SKIP_ALREADY_HEALTHY");
  } else {
    log("DB", `Starting MariaDB dev container (project: ${COMPOSE_PROJECT})…`);
    const up = runSync("docker", ["compose", ...COMPOSE_DEV_ARGS, "up", "-d"]);
    if (up.status !== 0) {
      phaseEnd("mariadb_start", "FAIL");
      warn("DB", "Failed to start MariaDB. Check: pnpm dev:infra:logs");
      process.exit(2);
    }
    phaseEnd("mariadb_start");

    // 3. Wait for MariaDB health
    phaseStart("mariadb_health_wait");
    log("DB", "Waiting for MariaDB to become healthy…");
    const waited = runSync(process.execPath, [resolve(ROOT, "scripts/dev-wait-db.mjs")]);
    if (waited.status !== 0) {
      phaseEnd("mariadb_health_wait", "FAIL");
      warn("DB", "MariaDB did not become healthy. Check: pnpm dev:infra:logs");
      process.exit(2);
    }
    phaseEnd("mariadb_health_wait");
  }

  // 4. DATABASE_URL reachability (environment validation)
  phaseStart("environment_validation");
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    phaseEnd("environment_validation", "FAIL");
    warn("DB", "DATABASE_URL is not set. Check .env file.");
    process.exit(3);
  }
  let dbHost = "127.0.0.1", dbPort = 3307;
  try {
    const u = new URL(dbUrl);
    if (u.protocol !== "mysql:") throw new Error("not mysql://");
    dbHost = u.hostname;
    dbPort = Number(u.port || 3306);
  } catch {
    phaseEnd("environment_validation", "FAIL");
    warn("DB", `DATABASE_URL is not a valid mysql:// URL: ${dbUrl}`);
    process.exit(3);
  }
  const tcpOk = await probeTcp(dbHost, dbPort);
  if (!tcpOk) {
    phaseEnd("environment_validation", "FAIL");
    warn("DB", `Cannot reach database at ${dbHost}:${dbPort}`);
    process.exit(3);
  }
  log("DB", `TCP reachable at ${dbHost}:${dbPort}`);
  phaseEnd("environment_validation");

  // 5. Prisma generation check
  phaseStart("prisma_generation");
  const prismaClient = resolve(ROOT, "node_modules/@prisma/client");
  const prismaClientAlt = resolve(ROOT, "apps/api/node_modules/@prisma/client");
  if (!existsSync(prismaClient) && !existsSync(prismaClientAlt)) {
    phaseEnd("prisma_generation", "FAIL");
    warn("PRISMA", "@prisma/client not found. Run: pnpm install");
    process.exit(4);
  }
  log("PRISMA", "Prisma Client is present.");
  phaseEnd("prisma_generation");

  // 6. Migration status (informational — does NOT run deploy)
  phaseStart("migration_status");
  log("PRISMA", "Checking migration status (non-destructive)…");
  const prismaCliCandidates = [
    resolve(ROOT, "apps/api/node_modules/prisma/build/index.js"),
    resolve(ROOT, "node_modules/.pnpm/node_modules/prisma/build/index.js"),
    resolve(ROOT, "node_modules/prisma/build/index.js"),
  ];
  const prismaCli = prismaCliCandidates.find((p) => existsSync(p));
  if (!prismaCli) {
    warn("PRISMA", "prisma CLI not found — skipping status check.");
    phaseEnd("migration_status", "SKIP_CLI_NOT_FOUND");
  } else {
    const statusResult = runSync(
      process.execPath,
      [prismaCli, "migrate", "status", "--schema", resolve(ROOT, "apps/api/prisma/schema.prisma")],
      { quiet: true, env: { ...env, DATABASE_URL: env.DATABASE_URL }, cwd: resolve(ROOT, "apps/api") },
    );
    if (statusResult.status !== 0) {
      warn("PRISMA", "migrate status is NOT clean:");
      if (statusResult.stdout) process.stderr.write(statusResult.stdout);
      if (statusResult.stderr) process.stderr.write(statusResult.stderr);
      warn("PRISMA", "");
      warn("PRISMA", "Continuing startup. API will attempt prisma migrate deploy.");
      warn("PRISMA", "If this fails, see: docs/audit/docker-production/ROOT_CAUSE_MATRIX.latest.md (RC-001)");
      phaseEnd("migration_status", "DIVERGED");
    } else {
      log("PRISMA", "All migrations applied cleanly.");
      phaseEnd("migration_status");
    }
  }

  // 7. Start API
  phaseStart("api_spawn");
  log("API", "Spawning API (scripts/dev-api-with-root-env.mjs)…");
  spawnBackground([resolve(ROOT, "scripts/dev-api-with-root-env.mjs")], "API", env);
  phaseEnd("api_spawn");

  // 8. Wait for API liveness (/health)
  phaseStart("api_liveness");
  log("API", `Waiting for API liveness at ${HEALTH_API}…`);
  const apiLive = await waitHttp(HEALTH_API, "API_LIVE");
  if (!apiLive) {
    phaseEnd("api_liveness", "FAIL");
    warn("API", "API did not become live — shutting down.");
    writeTimingReport();
    await cleanup();
    process.exit(5);
  }
  phaseEnd("api_liveness");

  // 8b. Wait for API readiness (/ready body.ok === true)
  phaseStart("api_readiness");
  log("API", `Waiting for API readiness at ${READINESS_API} (body.ok=true)…`);
  const apiReady = await waitReadiness(READINESS_API, "API_READY");
  if (!apiReady) {
    phaseEnd("api_readiness", "FAIL");
    warn("API", "API readiness did not pass — shutting down.");
    warn("API", "Check /ready response: body.ok must be true in dev mode.");
    warn("API", "If fonts check fails in dev: verify QLLAW_FONT_POLICY is not 'required'.");
    writeTimingReport();
    await cleanup();
    process.exit(5);
  }
  phaseEnd("api_readiness");

  // 9. Start Web
  phaseStart("web_spawn");
  log("WEB", "Spawning Web (scripts/dev-web-with-root-env.mjs)…");
  spawnBackground([resolve(ROOT, "scripts/dev-web-with-root-env.mjs")], "WEB", env);
  phaseEnd("web_spawn");

  // 10. Wait for Web health
  phaseStart("web_health");
  log("WEB", `Waiting for Web at ${HEALTH_WEB}…`);
  const webReady = await waitHttp(HEALTH_WEB, "WEB");
  if (!webReady) {
    phaseEnd("web_health", "FAIL");
    warn("WEB", "Web did not start — shutting down.");
    writeTimingReport();
    await cleanup();
    process.exit(6);
  }
  phaseEnd("web_health");

  // 11. Ready — wall-clock total from orchestrator start to Web ready
  const totalDurationMs = Math.round(performance.now() - totalStart);
  const apiPort = env.API_PORT || 3001;
  const webPort = env.WEB_PORT || 3000;
  log("READY", "");
  log("READY", "=".repeat(56));
  log("READY", "QLLaw development environment is ready!");
  log("READY", `Total startup: ${totalDurationMs}ms (${(totalDurationMs / 1000).toFixed(1)}s)`);
  log("READY", "");
  log("READY", `  API : http://localhost:${apiPort}/api/v1`);
  log("READY", `  Web : http://localhost:${webPort}`);
  log("READY", "");
  log("READY", "  Ctrl+C to stop all services.");
  if (AUDIT_REPORT_MODE) {
    log("READY", "  --audit-report: timing will also be copied to docs/audit/.");
  }
  log("READY", "=".repeat(56));

  // Record wall-clock total (not sum of phases — phases can overlap)
  timingPhases["total_startup"] = {
    startedAt: new Date(Date.now() - totalDurationMs).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: totalDurationMs,
    status: "PASS",
    note: "wall-clock from orchestrator start to Web /healthz 200",
  };
  writeTimingReport();

  // Keep alive until Ctrl+C
  await new Promise(() => {});
}

main().catch(async (err) => {
  warn("FATAL", err instanceof Error ? err.message : String(err));
  writeTimingReport();
  await cleanup();
  process.exit(1);
});
