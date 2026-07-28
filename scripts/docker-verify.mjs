#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// CLI argument parsing (portable: no Unix-prefix-env syntax required)
//
// Supported CLI flags (all optional, can be combined):
//   --env-file <path>          Compose env file (overrides QLLAW_DOCKER_VERIFY_ENV)
//   --compose-file <path>      Compose file(s); may appear multiple times
//   --build                    Build images before verification
//   --no-cache                 Pass --no-cache to docker build
//   --boot-result <path>       Path to a boot result JSON for full verification
//   --api-image <image>        Override API image to verify
//   --web-image <image>        Override Web image to verify
//   --font-dir <path>          Times New Roman font directory (strict font probe)
//   --font-policy <policy>     required | fallback-allowed (default: required)
//
// Legacy env-var fallbacks are kept for backwards compatibility but CLI flags
// take precedence.  The old Unix-prefix approach
//   QLLAW_DOCKER_VERIFY_ENV=.env.docker.demo node scripts/docker-verify.mjs
// still works on Linux/macOS but is NOT required on Windows.
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2).filter((a) => a !== "--");
  const result = {
    envFile: null,
    composeFiles: [],
    shouldBuild: false,
    noCache: false,
    bootResultFile: null,
    apiImageOverride: null,
    webImageOverride: null,
    fontDirOverride: null,
    fontPolicy: null,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--build") { result.shouldBuild = true; continue; }
    if (a === "--no-cache") { result.noCache = true; continue; }
    if (a === "--env-file" && args[i + 1]) { result.envFile = args[++i]; continue; }
    if (a === "--compose-file" && args[i + 1]) { result.composeFiles.push(args[++i]); continue; }
    if (a === "--boot-result" && args[i + 1]) { result.bootResultFile = args[++i]; continue; }
    if (a === "--api-image" && args[i + 1]) { result.apiImageOverride = args[++i]; continue; }
    if (a === "--web-image" && args[i + 1]) { result.webImageOverride = args[++i]; continue; }
    if (a === "--font-dir" && args[i + 1]) { result.fontDirOverride = args[++i]; continue; }
    if (a === "--font-policy" && args[i + 1]) { result.fontPolicy = args[++i]; continue; }
  }
  return result;
}

const parsed = parseArgs(process.argv);

// Resolve env file: CLI flag → env var fallback → default
const ENV_FILE = resolve(
  ROOT,
  parsed.envFile ||
  process.env.QLLAW_DOCKER_VERIFY_ENV ||
  ".env.docker.example",
);

// Resolve Compose files: CLI flags → default single prod Compose
const COMPOSE_FILES_RESOLVED =
  parsed.composeFiles.length > 0
    ? parsed.composeFiles.map((f) => resolve(ROOT, f))
    : [resolve(ROOT, "docker-compose.prod.yml")];

const BOOT_RESULT_FILE = parsed.bootResultFile
  ? resolve(ROOT, parsed.bootResultFile)
  : (process.env.QLLAW_DOCKER_VERIFY_BOOT_RESULT
      ? resolve(ROOT, process.env.QLLAW_DOCKER_VERIFY_BOOT_RESULT)
      : null);

const API_IMAGE_OVERRIDE = parsed.apiImageOverride || process.env.QLLAW_DOCKER_VERIFY_API_IMAGE || null;
const WEB_IMAGE_OVERRIDE = parsed.webImageOverride || process.env.QLLAW_DOCKER_VERIFY_WEB_IMAGE || null;

// Phase 8C: optional operator-provided Times New Roman mount used by the
// hardened font probe.
const FONT_DIR_OVERRIDE = parsed.fontDirOverride || process.env.QLLAW_DOCKER_VERIFY_FONT_DIR || null;
const FONT_POLICY_OVERRIDE = parsed.fontPolicy || process.env.QLLAW_DOCKER_VERIFY_FONT_POLICY || "required";

const BM001_DOCX = resolve(
  ROOT,
  "storage",
  "templates",
  "normalized-docx",
  "BM-001",
  "BM-001_normalized.docx",
);
const shouldBuild = parsed.shouldBuild;
const noCache = parsed.noCache;

// Build the compose CLI prefix from resolved files
const composePrefix = [
  "compose",
  "--env-file", ENV_FILE,
  ...COMPOSE_FILES_RESOLVED.flatMap((f) => ["-f", f]),
];

function commandLabel(command, args) {
  return [command, ...args].map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ");
}

function run(command, args, options = {}) {
  process.stdout.write(`\n> ${commandLabel(command, args)}\n`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture ? `${result.stderr || result.stdout}`.trim() : "";
    throw new Error(`Command failed (${result.status}): ${commandLabel(command, args)}${detail ? `\n${detail}` : ""}`);
  }
  return options.capture ? `${result.stdout}`.trim() : "";
}

function compose(args, options) {
  return run("docker", [...composePrefix, ...args], options);
}

function composeConfig() {
  return JSON.parse(
    compose(["config", "--format", "json"], { capture: true }),
  );
}

function imageExistsLocally(image) {
  if (!image) return false;
  const result = spawnSync("docker", ["image", "inspect", image], {
    cwd: ROOT,
    windowsHide: true,
    stdio: "ignore",
  });
  return !result.error && result.status === 0;
}

function imageFor(config, service) {
  const override = service === "api" ? API_IMAGE_OVERRIDE : WEB_IMAGE_OVERRIDE;
  if (override) {
    if (!imageExistsLocally(override)) {
      throw new Error(`Requested ${service} verification image is not present locally: ${override}`);
    }
    return override;
  }
  const explicitImage = config.services?.[service]?.image || null;
  if (imageExistsLocally(explicitImage)) return explicitImage;

  const project = config.name;
  if (!project) return null;
  // BuildKit's Compose labels are not guaranteed on images emitted by every
  // Docker Engine/Compose version. Compose's documented default tag remains
  // stable, so resolve it before the legacy label lookup.
  const defaultImage = `${project}-${service}`;
  if (imageExistsLocally(defaultImage)) return defaultImage;
  return run(
    "docker",
    [
      "image",
      "ls",
      "--quiet",
      "--filter",
      `label=com.docker.compose.project=${project}`,
      "--filter",
      `label=com.docker.compose.service=${service}`,
    ],
    { capture: true },
  ).split(/\r?\n/).filter(Boolean)[0] || null;
}

function required(condition, message) {
  if (!condition) throw new Error(`Boot verification failed: ${message}`);
}

function emptyList(value) {
  return Array.isArray(value) && value.length === 0;
}

export function validateBootResult(result, expectedImages = {}) {
  required(result && typeof result === "object", "result must be an object");
  required(result.verdict === "PASS", `verdict=${result.verdict ?? "missing"}`);
  required(result.fatal == null, "fatal error is present");
  required(result.seedData === false, "SEED_DATA was not false");
  required(result.temporarySecretsGenerated === true, "temporary secrets were not generated");
  required(result.secretsRecorded === false, "secrets were recorded in the boot artifact");

  if (expectedImages.apiImage) {
    required(result.images?.api === expectedImages.apiImage, "API image does not match the probed image");
  }
  if (expectedImages.webImage) {
    required(result.images?.web === expectedImages.webImage, "Web image does not match the probed image");
  }

  required(result.composeConfig?.exit === 0, "Compose config failed");
  required(result.composeConfig?.apiBuild === false, "boot rebuilt the API image");
  required(result.composeConfig?.webBuild === false, "boot rebuilt the Web image");
  required(result.composeConfig?.apiPublishedPorts === 0, "API published a host port");
  required(result.composeConfig?.webPublishedPorts === 0, "Web published a host port");
  required(result.up?.mysql?.exit === 0, "MariaDB boot failed");
  required(result.up?.api?.exit === 0, "API boot failed");
  required(result.up?.web?.exit === 0, "Web boot failed");
  required(result.health?.mysql?.healthy === true, "MariaDB health failed");
  required(result.health?.api?.healthy === true, "API health failed");
  required(result.health?.web?.healthy === true, "Web health failed");
  required(result.readiness?.apiExit === 0 && `${result.readiness?.apiStatus}` === "200", "API readiness failed");
  required(result.readiness?.webExit === 0 && `${result.readiness?.webStatus}` === "200", "Web readiness failed");
  required(`${result.users?.apiUid}` !== "0" && `${result.users?.webUid}` !== "0", "a service ran as root");
  required(result.writableDirectories?.pass === true, "required API directories were not writable");

  required(result.firstMigration?.activeMigrationInLogs === true, "active baseline was absent from first-start logs");
  required(result.firstMigration?.seedDisabledInLogs === true, "seed-disabled log was absent");
  required(result.firstMigration?.seedExecutedInLogs === false, "seed executed during boot");
  required(result.firstMigration?.migrationRows === 1, "first deploy did not leave exactly one migration row");
  required(result.firstMigration?.failedRows === 0, "first deploy left a failed migration row");
  required(result.firstMigration?.baselineRows === 1, "active baseline was not recorded exactly once");
  required(result.secondMigration?.exit === 0, "second migration deploy failed");
  required(result.secondMigration?.noPending === true, "second migration deploy was not clean");

  required(result.restart?.exit === 0 && result.restart?.healthy === true, "API restart failed");
  required(result.restart?.migrationRowsBefore === result.restart?.migrationRowsAfter, "restart duplicated migration metadata");
  required(result.restart?.failedRowsAfter === 0, "restart left a failed migration row");
  required(result.restart?.duplicateMigrationMetadata === false, "restart reported duplicate migration metadata");
  required(result.shutdown?.apiGraceful === true && result.shutdown?.webGraceful === true, "SIGTERM shutdown was not graceful");
  required(result.shutdown?.apiForcedKill === false && result.shutdown?.webForcedKill === false, "a service required a forced kill");

  required(result.cleanup?.downExit === 0, "Compose cleanup command failed");
  required(result.cleanup?.pass === true, "cleanup verdict failed");
  required(emptyList(result.cleanup?.containers), "containers remain after cleanup");
  required(emptyList(result.cleanup?.networks), "networks remain after cleanup");
  required(emptyList(result.cleanup?.volumes), "volumes remain after cleanup");

  return {
    boot: "PASS",
    migration: "PASS",
    readiness: "PASS",
    restart: "PASS",
    shutdown: "PASS",
    cleanup: "PASS",
  };
}

function readBootResult(path) {
  if (!existsSync(path)) throw new Error(`Docker boot result is missing: ${path}`);
  try {
    return parseBootResultJson(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Docker boot result is invalid JSON: ${error.message}`);
  }
}

export function parseBootResultJson(text) {
  return JSON.parse(`${text}`.replace(/^\uFEFF/, ""));
}

function assertImageRuntime(image, service) {
  const configRaw = run(
    "docker",
    ["image", "inspect", "--format", "{{json .Config}}", image],
    { capture: true },
  );
  const config = JSON.parse(configRaw);
  if (!config.User || ["root", "0", "0:0"].includes(config.User)) {
    throw new Error(`${service} image must declare a non-root Config.User`);
  }
  if (!config.Healthcheck?.Test?.length) {
    throw new Error(`${service} image must declare Config.Healthcheck`);
  }
  process.stdout.write(`PASS ${service}: User=${config.User}; Healthcheck configured\n`);
}

function probeImages(apiImage, webImage, options = {}) {
  assertImageRuntime(apiImage, "api");
  assertImageRuntime(webImage, "web");

  run("docker", [
    "run", "--rm", "--entrypoint", "sh", apiImage, "-lc",
    "set -eu; locked=$(find /app/docs/audit/docx/contracts/locked -maxdepth 1 -name '*.contract.locked.json' | wc -l); compiled=$(find /app/docs/audit/docx/compiled-v2 -maxdepth 1 -name '*.compiled.json' | wc -l); test \"$locked\" -eq 213; test \"$compiled\" -eq 213; test -f /app/apps/api/prisma/seed.ts; test -f /app/apps/web/src/lib/vks-template-catalog.ts",
  ]);
  if (!existsSync(BM001_DOCX)) {
    throw new Error(`BM-001 renderer probe input is missing: ${BM001_DOCX}`);
  }
  // Phase 8C: hardened font probe. By default the verifier requires the
  // exact Times New Roman family in all four styles. Callers may opt out
  // of the hard requirement by passing { allowFallback: true } (used by
  // development docker:verify runs that still want image-only success).
  const fontMount = options.fontMount || null;
  const fontPolicy = options.fontPolicy || "required";
  const fontProbeArgs = [
    "run",
    "--rm",
    "--mount",
    `type=bind,source=${BM001_DOCX},target=/tmp/BM-001_normalized.docx,readonly`,
    "--entrypoint",
    "sh",
    apiImage,
    "-lc",
    [
      "set -eu",
      'test "$(id -u)" -ne 0',
      "command -v libreoffice >/dev/null",
      "command -v fc-match >/dev/null",
      "test -x /usr/local/bin/powershell.exe",
      "libreoffice --version",
      "font=$(fc-match -f '%{family}' 'Times New Roman' | head -n 1)",
      'test -n "$font"',
      'echo "FONT_SUBSTITUTE=$font"',
      "/usr/local/bin/powershell.exe -InputPath /tmp/BM-001_normalized.docx -OutputPath /tmp/BM-001_normalized.pdf",
      "test -s /tmp/BM-001_normalized.pdf",
      'echo "BM001_PDF_BYTES=$(stat -c %s /tmp/BM-001_normalized.pdf)"',
    ].join("; "),
  ];
  if (fontMount) {
    fontProbeArgs.splice(2, 0, "--mount", fontMount);
  }
  run("docker", fontProbeArgs);
  // Phase 8C: invoke the in-image font-policy verifier so the docker-verify
  // pass/fail decision reflects the operator-mounted TNR family, not just
  // the metric-compatible substitution that fc-match surfaces.
  run("docker", [
    "run",
    "--rm",
    "-e",
    `QLLAW_FONT_POLICY=${fontPolicy}`,
    "-e",
    "QLLAW_REQUIRED_FONT_FAMILY=Times New Roman",
    "-e",
    "QLLAW_CONTAINER_TNR_FONT_DIR=/opt/qllaw/fonts/times-new-roman",
    ...(fontMount
      ? ["--mount", fontMount]
      : []),
    "--entrypoint",
    "node",
    apiImage,
    "/app/scripts/fonts/verify-font-policy.mjs",
    "--stdout",
  ]);
  run("docker", [
    "run", "--rm", "--entrypoint", "node", apiImage, "-e",
    "import('@qllaw/form-contracts').then(m=>process.exit(Object.keys(m).length?0:1)).catch(()=>process.exit(1))",
  ]);
  run("docker", [
    "run", "--rm", "--entrypoint", "node", webImage, "-e",
    "import('@qllaw/form-contracts/browser').then(m=>process.exit(typeof m.readPath==='function'&&typeof m.evaluateExpression==='function'?0:1)).catch(()=>process.exit(1))",
  ]);
}

function main() {
  if (Boolean(API_IMAGE_OVERRIDE) !== Boolean(WEB_IMAGE_OVERRIDE)) {
    throw new Error("QLLAW_DOCKER_VERIFY_API_IMAGE and QLLAW_DOCKER_VERIFY_WEB_IMAGE must be supplied together");
  }

  // Report which Compose files are actually in use — required so we can prove
  // the demo override is not being silently skipped.
  process.stdout.write("DOCKER_VERIFY env_file=" + ENV_FILE + "\n");
  for (const f of COMPOSE_FILES_RESOLVED) {
    process.stdout.write("DOCKER_VERIFY compose_file=" + f + "\n");
  }

  run(process.execPath, ["--test", "test/infrastructure/production-runtime.guard.test.mjs"]);
  process.stdout.write("DOCKER_STEP infrastructure=PASS\n");
  run("docker", ["compose", "version"]);
  compose(["config", "--quiet"]);
  process.stdout.write("DOCKER_STEP compose_config=PASS\n");

  if (shouldBuild) {
    const buildArgs = ["build"];
    if (noCache) buildArgs.push("--no-cache");
    compose(buildArgs);
    process.stdout.write("DOCKER_STEP build=PASS\n");
  } else {
    process.stdout.write("DOCKER_STEP build=REUSED_LOCAL_IMAGE\n");
  }

  const config = composeConfig();
  const apiImage = imageFor(config, "api");
  const webImage = imageFor(config, "web");
  if (!apiImage || !webImage) {
    throw new Error(
      shouldBuild
        ? "Compose build completed without resolvable api/web images"
        : "Compose images are not present locally. Re-run with --build or supply exact image overrides.",
    );
  }

  const fontMount = FONT_DIR_OVERRIDE
    ? `type=bind,source=${FONT_DIR_OVERRIDE},target=/opt/qllaw/fonts/times-new-roman,readonly`
    : null;
  probeImages(apiImage, webImage, {
    fontMount,
    fontPolicy: FONT_POLICY_OVERRIDE,
  });
  process.stdout.write("DOCKER_STEP image_runtime=PASS\n");
  process.stdout.write("DOCKER_STEP font=PASS\n");

  if (!BOOT_RESULT_FILE) {
    process.stdout.write("DOCKER_STEP boot=NOT_VERIFIED\n");
    process.stdout.write("DOCKER_STEP migration=NOT_VERIFIED\n");
    process.stdout.write("DOCKER_STEP readiness=NOT_VERIFIED\n");
    process.stdout.write("DOCKER_STEP cleanup=NOT_VERIFIED\n");
    process.stdout.write("\nDOCKER_VERIFY=PASS_IMAGE_ONLY\n");
    return;
  }

  const boot = validateBootResult(readBootResult(BOOT_RESULT_FILE), { apiImage, webImage });
  for (const [step, status] of Object.entries(boot)) {
    process.stdout.write(`DOCKER_STEP ${step}=${status}\n`);
  }
  process.stdout.write("\nDOCKER_VERIFY=PASS\n");
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`\nDOCKER_VERIFY=FAIL\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
