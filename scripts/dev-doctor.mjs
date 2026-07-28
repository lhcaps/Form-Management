#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { accessSync, constants, existsSync } from "node:fs";
import net from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, "..");
const CONNECT_TIMEOUT_MS = 750;

function executable(name) {
  if (process.platform !== "win32") return name;
  if (["docker", "soffice", "libreoffice"].includes(name)) return `${name}.exe`;
  if (name === "pnpm") return "pnpm.cmd";
  return name;
}

export function pnpmVersionFromUserAgent(userAgent) {
  const match = typeof userAgent === "string" ? userAgent.match(/(?:^|\s)pnpm\/([^\s]+)/) : null;
  return match?.[1] || null;
}

function runVersion(command, args = ["--version"]) {
  const bin = executable(command);
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    // shell: true is required on Windows for .cmd wrappers (e.g. pnpm.cmd)
    // when the caller does not go through cmd.exe PATH resolution automatically.
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  return `${result.stdout || result.stderr}`.trim().split(/\r?\n/, 1)[0] || null;
}

function loadEnvironment(root, inherited = process.env) {
  const env = { ...inherited };
  for (const path of [resolve(root, ".env"), resolve(root, "apps/api/.env")]) {
    if (!existsSync(path)) continue;
    loadDotenv({ path, processEnv: env, override: false, quiet: true });
  }
  return env;
}

export function envPresence(env, names) {
  return names.map((name) => ({
    name,
    status: typeof env[name] === "string" && env[name].trim() ? "SET" : "UNSET",
  }));
}

export function parseDatabaseEndpoint(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "mysql:") return null;
    return { host: url.hostname, port: Number(url.port || 3306) };
  } catch {
    return null;
  }
}

function probeTcp(host, port, timeoutMs = CONNECT_TIMEOUT_MS) {
  return new Promise((resolveProbe) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const finish = (reachable) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolveProbe(reachable);
    };
    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function canAccess(path, mode = constants.R_OK) {
  try {
    accessSync(path, mode);
    return true;
  } catch {
    return false;
  }
}

function hasAny(root, paths) {
  return paths.some((path) => existsSync(resolve(root, path)));
}

function checkPrisma(root) {
  try {
    const requireFromApi = createRequire(resolve(root, "apps/api/package.json"));
    const client = requireFromApi("@prisma/client");
    return typeof client.PrismaClient === "function";
  } catch {
    return false;
  }
}

function checkLibreOffice(env) {
  const configured = env.LIBREOFFICE_PATH?.trim();
  const candidates = [
    configured,
    process.platform === "win32"
      ? resolve(process.env.ProgramFiles || "C:/Program Files", "LibreOffice/program/soffice.exe")
      : "/usr/bin/libreoffice",
  ].filter(Boolean);
  if (candidates.some((path) => existsSync(path))) return true;
  return Boolean(runVersion(process.platform === "win32" ? "soffice" : "libreoffice"));
}

function checkTimesNewRoman() {
  if (process.platform === "win32") {
    const fonts = resolve(process.env.WINDIR || "C:/Windows", "Fonts");
    return ["times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf"].every((name) =>
      existsSync(resolve(fonts, name)),
    );
  }
  const result = spawnSync("fc-list", [":", "family"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return result.status === 0 && /(^|,)Times New Roman(,|$)/im.test(result.stdout || "");
}

function add(rows, category, name, status, severity, detail = "") {
  rows.push({ category, name, status, severity, detail });
}

export async function diagnose(options = {}) {
  const root = resolve(options.root || DEFAULT_ROOT);
  const env = loadEnvironment(root, options.env);
  const rows = [];

  const nodeVersion = process.version;
  add(rows, "tool", "node", /^v22\./.test(nodeVersion) ? "PASS" : "FAIL", "required", nodeVersion);

  const pnpmVersion = pnpmVersionFromUserAgent(env.npm_config_user_agent) || runVersion("pnpm");
  add(rows, "tool", "pnpm", pnpmVersion ? "PASS" : "FAIL", "required", pnpmVersion || "UNAVAILABLE");

  const dockerVersion = runVersion("docker");
  add(rows, "tool", "docker", dockerVersion ? "PASS" : "WARN", "optional", dockerVersion || "UNAVAILABLE");

  const composeVersion = dockerVersion ? runVersion("docker", ["compose", "version"]) : null;
  add(rows, "tool", "docker-compose", composeVersion ? "PASS" : "WARN", "optional", composeVersion || "UNAVAILABLE");

  for (const item of envPresence(env, [
    "DATABASE_URL",
    "API_CORS_ORIGIN",
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ])) {
    add(rows, "env", item.name, item.status, "optional");
  }

  const apiPort = Number(env.API_PORT || 3001);
  const webPort = Number(env.WEB_PORT || 3000);
  for (const [name, port] of [["web", webPort], ["api", apiPort]]) {
    const inUse = Number.isInteger(port) && port > 0 && (await probeTcp("127.0.0.1", port));
    add(rows, "port", name, inUse ? "IN_USE" : "FREE", "informational", String(port));
  }

  const db = parseDatabaseEndpoint(env.DATABASE_URL);
  const dbReachable = db ? await probeTcp(db.host, db.port) : false;
  add(rows, "database", "tcp-reachability", db ? (dbReachable ? "PASS" : "WARN") : "UNSET", "optional");

  const contractsBuilt =
    hasAny(root, ["packages/form-contracts/dist/index.js", "packages/form-contracts/dist/index.cjs"]) &&
    hasAny(root, ["packages/form-contracts/dist/browser.js", "packages/form-contracts/dist/browser.cjs"]);
  add(rows, "artifact", "form-contracts-dist", contractsBuilt ? "PASS" : "FAIL", "required");
  add(rows, "artifact", "prisma-client", checkPrisma(root) ? "PASS" : "FAIL", "required");

  for (const [name, path] of [
    ["storage-root", env.STORAGE_ROOT || "storage"],
    ["generated-files", env.GENERATED_FILES_ROOT || "storage/generated"],
    ["runtime-preview", "storage/runtime-preview-sessions"],
  ]) {
    const absolute = resolve(root, path);
    add(rows, "storage", name, canAccess(absolute, constants.R_OK | constants.W_OK) ? "PASS" : "WARN", "optional");
  }

  add(rows, "renderer", "libreoffice", checkLibreOffice(env) ? "PASS" : "WARN", "optional");
  add(rows, "renderer", "times-new-roman", checkTimesNewRoman() ? "PASS" : "WARN", "optional");

  const clerkState = existsSync(resolve(root, "playwright/.clerk/admin.json"));
  add(rows, "auth", "clerk-e2e-storage-state", clerkState ? "SET" : "UNSET", "optional");

  const failures = rows.filter((row) => row.severity === "required" && row.status === "FAIL");
  const warnings = rows.filter((row) => ["WARN", "UNSET"].includes(row.status));
  return {
    schemaVersion: 1,
    status: failures.length ? "FAIL" : warnings.length ? "WARN" : "PASS",
    failures: failures.length,
    warnings: warnings.length,
    rows,
  };
}

function printHuman(report) {
  for (const row of report.rows) {
    const suffix = row.detail ? ` (${row.detail})` : "";
    process.stdout.write(`${row.status.padEnd(9)} ${row.category}/${row.name}${suffix}\n`);
  }
  process.stdout.write(`\nDEV_DOCTOR=${report.status} requiredFailures=${report.failures} warnings=${report.warnings}\n`);
  process.stdout.write("Sensitive prerequisites are reported as SET/UNSET only.\n");
}

async function main() {
  const report = await diagnose();
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    printHuman(report);
  }
  process.exitCode = report.failures ? 1 : 0;
}

if (resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  await main();
}
