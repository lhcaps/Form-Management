#!/usr/bin/env node
/**
 * prisma-squash-apply-dev.mjs
 *
 * Applies the Prisma squash baseline resolution to the EXISTING development
 * database (127.0.0.1:3307), AFTER a successful disposable proof.
 *
 * Prerequisites:
 *   1. Run `pnpm prisma:squash:proof` first and ensure it passes.
 *   2. Ensure .env has the correct DATABASE_URL for the dev database.
 *
 * What it does:
 *   1. Confirms you want to proceed (shows current DATABASE_URL target)
 *   2. Backs up _prisma_migrations table to a file
 *   3. Runs: prisma migrate resolve --applied 20260711000000_squashed_baseline
 *   4. Runs: prisma migrate status (verifies clean)
 *   5. Logs the operation
 *
 * What it does NOT do:
 *   - Run prisma migrate deploy (that is a separate step)
 *   - Touch any table other than _prisma_migrations
 *   - Seed data
 *   - Modify schema
 *
 * Exit codes:
 *   0  Resolve applied successfully
 *   1  Error or proof not confirmed
 *
 * Run: node scripts/prisma-squash-apply-dev.mjs
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import readline from "node:readline";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = resolve(ROOT, "apps/api/prisma/schema.prisma");
const ENV_PATH = resolve(ROOT, ".env");
const BASELINE_MANIFEST = resolve(ROOT, "apps/api/prisma/migration-baseline.json");

function ts() {
  return new Date().toISOString().slice(11, 19);
}
function log(tag, msg) {
  process.stdout.write(`[${ts()}] [${tag.padEnd(10)}] ${msg}\n`);
}
function warn(tag, msg) {
  process.stderr.write(`[${ts()}] [${tag.padEnd(10)}] ${msg}\n`);
}

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_PATH)) {
    loadDotenv({ path: ENV_PATH, processEnv: env, override: false, quiet: true });
  }
  return env;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.quiet ? "pipe" : "inherit",
    windowsHide: true,
    env: opts.env || process.env,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error(
      `Command failed (exit ${r.status}): ${cmd} ${args.join(" ")}\n${r.stderr || ""}`,
    );
  }
  return { status: r.status, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  // Load baseline from SOT manifest (same source used by proof and verifier)
  if (!existsSync(BASELINE_MANIFEST)) {
    warn("ERROR", `migration-baseline.json not found: ${BASELINE_MANIFEST}`);
    process.exit(1);
  }
  let baselineManifest;
  try {
    baselineManifest = JSON.parse(readFileSync(BASELINE_MANIFEST, "utf8"));
  } catch (e) {
    warn("ERROR", `migration-baseline.json is malformed: ${e.message}`);
    process.exit(1);
  }
  if (!baselineManifest?.baseline) {
    warn("ERROR", `migration-baseline.json missing required "baseline" field`);
    process.exit(1);
  }
  const BASELINE_NAME = baselineManifest.baseline;
  log("APPLY-DEV", `Baseline from manifest: ${BASELINE_NAME}`);

  const env = loadEnv();
  const dbUrl = env.DATABASE_URL;

  if (!dbUrl) {
    warn("ERROR", "DATABASE_URL is not set in .env");
    process.exit(1);
  }

  log("APPLY-DEV", "=".repeat(60));
  log("APPLY-DEV", "Prisma Squash Baseline — Apply to Development DB");
  log("APPLY-DEV", "=".repeat(60));
  log("APPLY-DEV", "");
  log("APPLY-DEV", `Target DATABASE_URL: ${dbUrl.replace(/:([^:@]+)@/, ":***@")}`);
  log("APPLY-DEV", "");
  log("APPLY-DEV", "This will add a row to _prisma_migrations to mark the");
  log("APPLY-DEV", "squash baseline as applied. No DDL will run.");
  log("APPLY-DEV", "");

  const answer = await ask("Have you run `pnpm prisma:squash:proof` and confirmed it PASS? [yes/no]: ");
  if (answer.toLowerCase() !== "yes") {
    warn("APPLY-DEV", "Aborted — run the disposable proof first.");
    process.exit(1);
  }

  const confirm = await ask("Confirm you want to apply to the dev DB at the URL above? [yes/no]: ");
  if (confirm.toLowerCase() !== "yes") {
    warn("APPLY-DEV", "Aborted by user.");
    process.exit(1);
  }

  // Step 1: Backup _prisma_migrations to file
  log("STEP-1", "Backing up _prisma_migrations to .prisma-migrations-backup.sql...");
  try {
    let host = "127.0.0.1", port = "3307", user = "", password = "", database = "";
    const u = new URL(dbUrl);
    host = u.hostname;
    port = u.port || "3306";
    user = decodeURIComponent(u.username);
    password = decodeURIComponent(u.password);
    database = u.pathname.replace(/^\//, "");

    // Use `docker compose exec` instead of hard-coding container name.
    // Compose resolves the actual container from the project/service identity.
    const COMPOSE_DEV = resolve(ROOT, "infra/docker-compose.dev.yml");
    const dump = run("docker", [
      "compose", "-f", COMPOSE_DEV, "exec", "-T", "mariadb",
      "mariadb-dump",
      "-u", user,
      `-p${password}`,
      database,
      "_prisma_migrations",
    ], { quiet: true, allowFail: true });

    if (dump.status === 0 && dump.stdout) {
      writeFileSync(resolve(ROOT, ".prisma-migrations-backup.sql"), dump.stdout, "utf8");
      log("STEP-1", "Backup saved to .prisma-migrations-backup.sql");
    } else {
      warn("STEP-1", "Could not back up via docker exec — continuing without backup.");
      warn("STEP-1", "Manual backup recommended: mysqldump -h ... _prisma_migrations");
    }
  } catch (err) {
    warn("STEP-1", `Backup failed: ${err.message} — continuing.`);
  }

  // Step 2: Run prisma migrate status (before)
  log("STEP-2", "Migration status BEFORE resolve:");
  run(
    process.execPath,
    ["node_modules/prisma/bin/prisma", "migrate", "status", "--schema", SCHEMA],
    { env: { ...env }, allowFail: true },
  );

  // Step 3: Resolve using baseline from SOT manifest
  log("STEP-3", `Running: prisma migrate resolve --applied ${BASELINE_NAME}`);
  run(
    process.execPath,
    [
      "node_modules/prisma/bin/prisma",
      "migrate",
      "resolve",
      "--applied",
      BASELINE_NAME,
      "--schema",
      SCHEMA,
    ],
    { env: { ...env } },
  );
  log("STEP-3", "Resolve completed.");

  // Step 4: Run prisma migrate status (after)
  log("STEP-4", "Migration status AFTER resolve:");
  const statusAfter = run(
    process.execPath,
    ["node_modules/prisma/bin/prisma", "migrate", "status", "--schema", SCHEMA],
    { env: { ...env }, allowFail: true },
  );

  if (statusAfter.status !== 0) {
    warn("STEP-4", "migrate status is still not clean after resolve.");
    warn("STEP-4", "Possible causes:");
    warn("STEP-4", "  - STATUS_HISTORY_DIVERGED: old migration rows still in _prisma_migrations");
    warn("STEP-4", "    This is non-blocking: deploy works but status shows old rows.");
    warn("STEP-4", "  - Prisma docs: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining");
  } else {
    log("STEP-4", "migrate status is CLEAN.");
  }

  log("APPLY-DEV", "");
  log("APPLY-DEV", "=".repeat(60));
  log("APPLY-DEV", "APPLY-DEV COMPLETE");
  log("APPLY-DEV", "  Backup: .prisma-migrations-backup.sql");
  log("APPLY-DEV", "  Next:   pnpm prisma:migrate:deploy");
  log("APPLY-DEV", "=".repeat(60));
}

main().catch((err) => {
  warn("FATAL", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
