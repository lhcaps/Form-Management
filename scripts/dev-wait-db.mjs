#!/usr/bin/env node
/**
 * dev-wait-db.mjs — wait for the development MariaDB container to become
 * healthy, then verify TCP reachability. Used by pnpm dev:infra:wait.
 *
 * Exit codes:
 *   0  database is healthy and reachable
 *   1  timeout or connection refused
 */

import net from "node:net";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { parseDatabaseEndpoint } from "./dev-doctor.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WAIT_TIMEOUT_MS = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60_000);
const POLL_INTERVAL_MS = 1_000;
const TCP_TIMEOUT_MS = 750;

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(ROOT, ".env");
  loadDotenv({ path: envPath, processEnv: env, override: false, quiet: true });
  return env;
}

function probeTcp(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(TCP_TIMEOUT_MS, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function composeHealthy() {
  const result = spawnSync(
    "docker",
    ["compose", "-f", "infra/docker-compose.dev.yml", "ps", "--format", "json"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  if (result.status !== 0) return false;
  try {
    const lines = (result.stdout || "").trim().split(/\r?\n/).filter(Boolean);
    // Docker Compose ps --format json outputs one JSON object per line in v5+.
    const services = lines.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    if (services.length === 0) return false;
    return services.every((s) => s.Health === "healthy" || s.Status?.includes("healthy"));
  } catch {
    return false;
  }
}

async function waitForDb() {
  const env = loadEnv();
  const db = parseDatabaseEndpoint(env.DATABASE_URL);
  if (!db) {
    console.error("[dev-wait-db] DATABASE_URL not set or not a mysql:// URL.");
    process.exit(1);
  }

  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let attempt = 0;

  console.log(`[dev-wait-db] Waiting for MariaDB at ${db.host}:${db.port} (timeout ${WAIT_TIMEOUT_MS}ms)…`);

  while (Date.now() < deadline) {
    attempt++;
    const healthy = composeHealthy();
    const reachable = healthy && await probeTcp(db.host, db.port);

    if (healthy && reachable) {
      console.log(`[dev-wait-db] MariaDB healthy and reachable (attempt ${attempt}).`);
      process.exit(0);
    }

    const remaining = Math.round((deadline - Date.now()) / 1000);
    console.log(`[dev-wait-db] Not ready yet (attempt ${attempt}, ${remaining}s remaining)…`);

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.error(`[dev-wait-db] TIMEOUT: MariaDB did not become healthy within ${WAIT_TIMEOUT_MS}ms.`);
  process.exit(1);
}

await waitForDb();
