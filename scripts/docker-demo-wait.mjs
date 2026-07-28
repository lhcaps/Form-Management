#!/usr/bin/env node
/**
 * docker-demo-wait.mjs — Wait for the Docker demo stack (prod + demo override)
 * to report all services healthy, then check HTTP readiness of API and Web.
 *
 * Used by: pnpm docker:demo:wait and docker-demo.mjs (Step 4).
 * Exit 0 on success, exit 1 on timeout.
 */

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.docker.demo");
const COMPOSE_FILES = ["-f", resolve(ROOT, "docker-compose.prod.yml"), "-f", resolve(ROOT, "docker-compose.demo.yml")];

const WAIT_TIMEOUT_MS = Number(process.env.DEMO_WAIT_TIMEOUT_MS ?? 300_000); // 5min
const POLL_MS = 3_000;
const HTTP_TIMEOUT_MS = 4_000;

const API_HEALTH_URL = process.env.DEMO_API_URL ?? "http://127.0.0.1:3001/api/v1/health";
const WEB_HEALTH_URL = process.env.DEMO_WEB_URL ?? "http://127.0.0.1:3000/healthz";

function ts() {
  return new Date().toISOString().slice(11, 19);
}
function log(msg) { process.stdout.write(`[${ts()}] [demo-wait] ${msg}\n`); }
function warn(msg) { process.stderr.write(`[${ts()}] [demo-wait] ${msg}\n`); }

function composePs() {
  const r = spawnSync(
    "docker",
    ["compose", "--env-file", ENV_FILE, ...COMPOSE_FILES, "ps", "--format", "json"],
    { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
  );
  if (r.status !== 0) return [];
  try {
    const lines = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
    return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

function allHealthy(services) {
  if (services.length === 0) return false;
  // Only check long-running services (not bootstrap profiles)
  const targets = services.filter((s) => ["mysql", "api", "web"].includes(s.Service));
  if (targets.length < 3) return false;
  return targets.every((s) => s.Health === "healthy" || s.Status?.includes("healthy"));
}

async function httpOk(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.status < 400;
  } catch { return false; }
  finally { clearTimeout(timer); }
}

async function waitForDemo() {
  log(`Waiting for demo stack (timeout ${WAIT_TIMEOUT_MS / 1000}s)…`);
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    const services = composePs();
    const healthy = allHealthy(services);

    if (healthy) {
      // Also check HTTP endpoints
      const [apiOk, webOk] = await Promise.all([
        httpOk(API_HEALTH_URL),
        httpOk(WEB_HEALTH_URL),
      ]);

      if (apiOk && webOk) {
        log(`All services healthy and HTTP-ready (attempt ${attempt}).`);
        log(`  API: ${API_HEALTH_URL} → 200`);
        log(`  Web: ${WEB_HEALTH_URL} → 200`);
        return true;
      }

      if (attempt % 5 === 0) {
        const remaining = Math.round((deadline - Date.now()) / 1000);
        log(`Containers healthy — waiting for HTTP (api=${apiOk}, web=${webOk}, ${remaining}s remaining)…`);
      }
    } else {
      if (attempt % 5 === 0) {
        const remaining = Math.round((deadline - Date.now()) / 1000);
        const names = services.map((s) => `${s.Service}=${s.Health ?? s.Status}`).join(", ");
        log(`Not ready yet (${names || "no containers"}, attempt ${attempt}, ${remaining}s remaining)…`);
      }
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  warn(`TIMEOUT after ${WAIT_TIMEOUT_MS / 1000}s`);
  const services = composePs();
  if (services.length > 0) {
    warn("Final container state:");
    for (const s of services) {
      warn(`  ${s.Service}: Health=${s.Health ?? "?"} Status=${s.Status ?? "?"}`);
    }
  }
  return false;
}

const ok = await waitForDemo();
process.exit(ok ? 0 : 1);
