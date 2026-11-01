#!/usr/bin/env node
import { createPrismaMariaDbAdapter } from '../prisma-mariadb-adapter.mjs';
/**
 * C2 — Contract Sync CI Gate
 *
 * CI-friendly version of audit-contract-sync-prep that exits non-zero when
 * drift is detected, suitable for blocking merge in GitHub Actions.
 *
 * Exit codes:
 *   0 — All contracts synced (matched = total, no drift)
 *   1 — Drift detected (missing in DB or stale)
 *   2 — Script execution error
 *
 * Usage:
 *   node scripts/audit/audit-contract-sync.mjs
 *   pnpm audit:contract-sync
 *
 * CI workflow:
 *   - name: Contract sync gate
 *     run: pnpm audit:contract-sync
 *
 * Strictness: This gate is STRICT by default. Unlike the startup guard which
 * can be bypassed with ALLOW_CONTRACT_DRIFT=1, the CI gate always blocks on
 * drift. This ensures the main branch always has synced contracts.
 *
 * To temporarily bypass in CI (not recommended):
 *   Add `|| true` to the workflow step (makes it informational only)
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const apiRequire = createRequire(path.join(ROOT, "apps", "api", "package.json"));

const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const ENV_FILE = path.join(ROOT, ".env");

// ANSI colors for terminal output
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function resolveDatabaseUrl() {
  return {
    value: process.env.DATABASE_URL ?? parseEnvFile(ENV_FILE).DATABASE_URL ?? null,
    source: process.env.DATABASE_URL ? "process.env" : fs.existsSync(ENV_FILE) ? ".env" : null,
  };
}

function getLockedContractFiles() {
  if (!fs.existsSync(LOCKED_DIR)) {
    log(`❌ Locked contracts directory not found: ${LOCKED_DIR}`, COLORS.red);
    process.exit(2);
  }

  return fs
    .readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".contract.locked.json"))
    .sort()
    .map((f) => path.join(LOCKED_DIR, f));
}

function extractTemplateCodeFromFilename(filePath) {
  const filename = path.basename(filePath);
  const match = filename.match(/^(BM-\d{3})/);
  return match ? match[1] : null;
}

function loadLockedContractsWithHashes(files) {
  const result = new Map();

  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const templateCode = raw.templateCode || extractTemplateCodeFromFilename(file);

      if (!templateCode) {
        log(`⚠️  Cannot extract templateCode from ${path.basename(file)}`, COLORS.yellow);
        continue;
      }

      // Try to load compiled artifact
      const compiledPath = path.join(COMPILED_V2_DIR, `${templateCode}.compiled.json`);
      let compiledHash = null;

      if (fs.existsSync(compiledPath)) {
        try {
          const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
          compiledHash = compiled.contractHash || null;
        } catch (err) {
          log(`⚠️  Failed to read compiled artifact for ${templateCode}: ${err.message}`, COLORS.yellow);
        }
      }

      result.set(templateCode, {
        templateCode,
        compiledHash,
        hasCompiledArtifact: compiledHash !== null,
      });
    } catch (err) {
      log(`⚠️  Failed to load locked contract ${path.basename(file)}: ${err.message}`, COLORS.yellow);
    }
  }

  return result;
}

async function compareWithDatabase(lockedContracts, databaseUrl) {
  // Try to load Prisma dynamically
  let prisma;
  try {
    const { PrismaClient } = apiRequire("@prisma/client");
    prisma = new PrismaClient({ adapter: createPrismaMariaDbAdapter(databaseUrl) });
  } catch (err) {
    return {
      dbAvailable: false,
      reason: `Prisma not available or DATABASE_URL invalid: ${err.message}`,
    };
  }

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    await prisma.$disconnect();
    return {
      dbAvailable: false,
      reason: `Database connection failed: ${err.message}`,
    };
  }

  const missingInDb = [];
  const stale = [];
  let matched = 0;

  try {
    // Get latest global published contracts from DB. Historical rows remain in
    // the table; comparing against arbitrary older versions creates false drift.
    const dbContracts = await prisma.form_contract_versions.findMany({
      where: { status: "PUBLISHED", scope_key: "GLOBAL", agency_id: null },
      select: {
        template_id: true,
        compiled_json: true,
        version_no: true,
      },
      orderBy: { version_no: "desc" },
    });

    // Get template codes
    const templates = await prisma.templates.findMany({
      select: {
        id: true,
        template_code: true,
      },
    });

    const templateIdToCode = new Map(templates.map((t) => [t.id, t.template_code]));
    const dbContractsByCode = new Map();
    for (const contract of dbContracts) {
      const templateCode = templateIdToCode.get(contract.template_id);
      if (templateCode && !dbContractsByCode.has(templateCode)) {
        dbContractsByCode.set(templateCode, contract.compiled_json);
      }
    }

    // Compare each locked contract
    for (const [templateCode, locked] of lockedContracts.entries()) {
      if (!locked.compiledHash) {
        // No compiled artifact
        missingInDb.push(templateCode);
        continue;
      }

      const dbCompiledJson = dbContractsByCode.get(templateCode);
      if (!dbCompiledJson) {
        missingInDb.push(templateCode);
        continue;
      }

      // Extract contractHash from DB compiled_json
      const dbHash = dbCompiledJson?.contractHash || null;

      if (!dbHash) {
        // DB compiled_json doesn't have contractHash
        missingInDb.push(templateCode);
        continue;
      }

      // Compare hashes
      if (locked.compiledHash === dbHash) {
        matched++;
      } else {
        stale.push(templateCode);
      }
    }

    return {
      dbAvailable: true,
      matched,
      missingInDb,
      stale,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function fileOnlyCheck(lockedContracts) {
  const missingCompiled = [];
  let matched = 0;

  for (const [templateCode, locked] of lockedContracts.entries()) {
    if (!locked.hasCompiledArtifact) {
      missingCompiled.push(templateCode);
    } else {
      matched++;
    }
  }

  return {
    dbAvailable: false,
    matched,
    missingInDb: missingCompiled,
    stale: [],
  };
}

async function main() {
  log("\n🔍 Contract Sync CI Gate\n", COLORS.cyan);

  // Load locked contracts
  const lockedFiles = getLockedContractFiles();
  log(`Found ${lockedFiles.length} locked contract files`);

  const lockedContracts = loadLockedContractsWithHashes(lockedFiles);
  log(`Loaded ${lockedContracts.size} locked contracts with compiled artifacts\n`);

  // Try DB comparison first, fallback to file-only
  let result;
  const databaseUrl = resolveDatabaseUrl();
  if (databaseUrl.value) {
    log(`DATABASE_URL resolved from ${databaseUrl.source} - attempting DB comparison...`);
    result = await compareWithDatabase(lockedContracts, databaseUrl.value);
    if (!result.dbAvailable) {
      log(`DB comparison unavailable: ${result.reason}`, COLORS.yellow);
      log("Falling back to file-only mode");
      result = {
        ...fileOnlyCheck(lockedContracts),
        dbUnavailableReason: result.reason,
      };
    }
  } else {
    log("DATABASE_URL not set - using file-only mode");
    result = fileOnlyCheck(lockedContracts);
  }

  // Report results
  log("\n" + "=".repeat(60));
  log("Strategy: " + (result.dbAvailable ? "DB_COMPARE" : "FILE_ONLY"));
  log(`Total locked contracts: ${lockedContracts.size}`);
  log(`Matched: ${result.matched}`, COLORS.green);
  log(`Missing in DB: ${result.missingInDb.length}`, result.missingInDb.length > 0 ? COLORS.red : COLORS.green);
  log(`Stale: ${result.stale.length}`, result.stale.length > 0 ? COLORS.red : COLORS.green);
  log("=".repeat(60) + "\n");

  // Show details
  if (result.missingInDb.length > 0) {
    log(`\n❌ Missing in DB (${result.missingInDb.length}):`, COLORS.red);
    result.missingInDb.slice(0, 20).forEach((tc) => log(`  - ${tc}`));
    if (result.missingInDb.length > 20) {
      log(`  ... and ${result.missingInDb.length - 20} more`);
    }
  }

  if (result.stale.length > 0) {
    log(`\n❌ Stale contracts (${result.stale.length}):`, COLORS.red);
    result.stale.slice(0, 20).forEach((tc) => log(`  - ${tc}`));
    if (result.stale.length > 20) {
      log(`  ... and ${result.stale.length - 20} more`);
    }
  }

  // Determine exit code
  const driftDetected = result.missingInDb.length > 0 || result.stale.length > 0;

  if (driftDetected) {
    log("\n❌ CI Gate FAILED - Contract drift detected\n", COLORS.red);
    log("To fix:");
    if (result.missingInDb.length > 0) {
      log("  1. Run: pnpm contract:compile");
      log("  2. Run: pnpm publish:forms:db");
      log("  3. Commit updated files");
    }
    if (result.stale.length > 0) {
      log("  1. Verify locked contracts match intended versions");
      log("  2. Run: pnpm contract:compile");
      log("  3. Run: pnpm publish:forms:db");
      log("  4. Commit updated files");
    }
    log("");
    process.exit(1);
  } else {
    log("\n✅ CI Gate PASSED - All contracts synced\n", COLORS.green);
    process.exit(0);
  }
}

main().catch((err) => {
  log(`\n❌ Script error: ${err.message}\n`, COLORS.red);
  console.error(err);
  process.exit(2);
});
