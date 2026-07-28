#!/usr/bin/env node
/**
 * docker-demo.mjs — Orchestrator for `pnpm docker:demo`.
 *
 * Sequence:
 *   1. Validate demo env file exists
 *   2. Render Compose config (docker compose config) — proves override works
 *   3. Build if images absent or --build flag passed
 *   4. Up
 *   5. Wait for health (docker:demo:wait)
 *   6. Run verifier (docker:demo:verify)
 *   7. Print summary of URLs + resources
 *
 * Options:
 *   --build      Force image rebuild before up
 *   --no-cache   Pass --no-cache to docker build
 *   --down       Bring demo stack down instead of up
 *
 * This script does NOT rebuild every run unless explicitly requested.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.docker.demo");
const PROD_COMPOSE = resolve(ROOT, "docker-compose.prod.yml");
const DEMO_COMPOSE = resolve(ROOT, "docker-compose.demo.yml");

const COMPOSE_FILES = ["-f", PROD_COMPOSE, "-f", DEMO_COMPOSE];
const COMPOSE_PREFIX = ["compose", "--env-file", ENV_FILE, ...COMPOSE_FILES];

const rawArgs = process.argv.slice(2);
const shouldBuild = rawArgs.includes("--build");
const noCache = rawArgs.includes("--no-cache");
const shouldDown = rawArgs.includes("--down");

function run(command, args, opts = {}) {
  process.stdout.write(`\n> ${[command, ...args].join(" ")}\n`);
  const r = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.quiet ? "pipe" : "inherit",
    windowsHide: true,
  });
  if (r.error) throw r.error;
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error(
      `Command failed (exit ${r.status}): ${[command, ...args].join(" ")}` +
        (opts.quiet && r.stderr ? `\n${r.stderr}` : ""),
    );
  }
  return opts.quiet ? (r.stdout || "").trim() : "";
}

function compose(args, opts = {}) {
  return run("docker", [...COMPOSE_PREFIX, ...args], opts);
}

function imageExistsLocally(name) {
  const r = spawnSync("docker", ["image", "inspect", name], {
    cwd: ROOT,
    stdio: "ignore",
    windowsHide: true,
  });
  return !r.error && r.status === 0;
}

function resolveImages() {
  const configJson = compose(["config", "--format", "json"], { quiet: true });
  const config = JSON.parse(configJson);
  const projectName = config.name || "quanlyvks";

  const apiCandidates = [
    config.services?.api?.image,
    `${projectName}-api`,
  ].filter(Boolean);
  const webCandidates = [
    config.services?.web?.image,
    `${projectName}-web`,
  ].filter(Boolean);

  const apiImage = apiCandidates.find(imageExistsLocally);
  const webImage = webCandidates.find(imageExistsLocally);
  return { apiImage: apiImage || null, webImage: webImage || null };
}

async function main() {
  process.stdout.write("=".repeat(60) + "\n");
  process.stdout.write("QLLaw Docker Demo Orchestrator\n");
  process.stdout.write("=".repeat(60) + "\n\n");

  // Validate demo env file
  if (!existsSync(ENV_FILE)) {
    process.stderr.write(
      `ERROR: Demo env file not found: ${ENV_FILE}\n` +
        `Copy .env.docker.demo and fill in your Clerk test keys.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(`DEMO_ENV_FILE = ${ENV_FILE}\n`);
  process.stdout.write(`COMPOSE_FILES = ${PROD_COMPOSE}, ${DEMO_COMPOSE}\n\n`);

  if (shouldDown) {
    compose(["down"]);
    process.stdout.write("\nDEMO_STACK = DOWN\n");
    return;
  }

  // Step 1: Validate merged Compose config
  process.stdout.write("STEP 1: Validating merged Compose config…\n");
  compose(["config", "--quiet"]);
  process.stdout.write("COMPOSE_CONFIG = PASS\n\n");

  // Step 2: Build if needed
  let { apiImage, webImage } = resolveImages();
  const needsBuild = shouldBuild || !apiImage || !webImage;

  if (needsBuild) {
    process.stdout.write(
      shouldBuild
        ? "STEP 2: Building images (--build flag)…\n"
        : "STEP 2: Images not found locally — building…\n",
    );
    const buildArgs = ["build"];
    if (noCache) buildArgs.push("--no-cache");
    compose(buildArgs);
    process.stdout.write("BUILD = PASS\n\n");

    const resolved = resolveImages();
    apiImage = resolved.apiImage;
    webImage = resolved.webImage;
    if (!apiImage || !webImage) {
      process.stderr.write("ERROR: Could not resolve api/web images after build.\n");
      process.exit(1);
    }
  } else {
    process.stdout.write("STEP 2: Reusing local images (skip --build).\n");
    process.stdout.write(`  api  = ${apiImage}\n`);
    process.stdout.write(`  web  = ${webImage}\n\n`);
  }

  // Step 3: Up
  process.stdout.write("STEP 3: Starting demo stack…\n");
  compose(["up", "-d"]);
  process.stdout.write("DEMO_STACK = UP\n\n");

  // Step 4: Wait for health
  process.stdout.write("STEP 4: Waiting for services to be healthy…\n");
  const waitResult = spawnSync(
    process.execPath,
    [resolve(ROOT, "scripts/docker-demo-wait.mjs")],
    { cwd: ROOT, stdio: "inherit", windowsHide: true },
  );
  if (waitResult.status !== 0) {
    process.stderr.write("HEALTH_WAIT = FAIL\n");
    process.stderr.write("Check logs: pnpm docker:demo:logs\n");
    process.exit(1);
  }
  process.stdout.write("HEALTH_WAIT = PASS\n\n");

  // Step 5: Verify
  process.stdout.write("STEP 5: Running demo verifier…\n");
  const verifyResult = spawnSync(
    process.execPath,
    [
      resolve(ROOT, "scripts/docker-verify.mjs"),
      "--env-file", ENV_FILE,
      "--compose-file", PROD_COMPOSE,
      "--compose-file", DEMO_COMPOSE,
    ],
    { cwd: ROOT, stdio: "inherit", windowsHide: true },
  );
  if (verifyResult.status !== 0) {
    process.stderr.write("DOCKER_VERIFY = FAIL\n");
    process.exit(1);
  }
  process.stdout.write("DOCKER_VERIFY = PASS\n\n");

  // Step 6: Summary
  const psOutput = compose(["ps"], { quiet: true });
  process.stdout.write("\n" + "=".repeat(60) + "\n");
  process.stdout.write("DOCKER DEMO READY\n\n");
  process.stdout.write("  Web  : http://localhost:3000\n");
  process.stdout.write("  API  : http://localhost:3001/api/v1\n");
  process.stdout.write("  DB   : 127.0.0.1:3307\n\n");
  process.stdout.write("  API Image : " + (apiImage || "unknown") + "\n");
  process.stdout.write("  Web Image : " + (webImage || "unknown") + "\n\n");
  process.stdout.write("Compose files used:\n");
  process.stdout.write("  " + PROD_COMPOSE + "\n");
  process.stdout.write("  " + DEMO_COMPOSE + "\n");
  process.stdout.write("\nTo stop: pnpm docker:demo:down\n");
  process.stdout.write("=".repeat(60) + "\n");
}

main().catch((err) => {
  process.stderr.write(`\nFATAL: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
