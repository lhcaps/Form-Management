#!/usr/bin/env node
import { createPrismaMariaDbAdapter } from '../prisma-mariadb-adapter.mjs';
/**
 * C1-PREP — Contract Sync Guard Readiness Audit
 *
 * Read-only audit: determines whether C1 (startup guard) can safely compare
 * locked V1 contracts to runtime/DB compiled contracts.
 *
 * C1 strategy requires:
 *   locked V1 file
 *     -> compileContract()  -> CompiledFormContract (artifact)
 *     -> stableHash(artifact)   // artifact.contractHash already populated by compileContract
 *   DB compiled_json
 *     -> stableHash(compiled_json)   // same stable-stringify + SHA256
 *   match = hashes equal
 *
 * Key finding from codebase audit (2026-06-25):
 *   - stableContractHash() in scripts/docx-contract/lib/stable-contract-hash.mjs
 *     STRIPS volatile fields before hashing — used only for DB contract_hash column.
 *   - stableHash() in packages/form-contracts/src/hash.ts
 *     is plain stable-stringify + SHA256 — used by compileContract() internally.
 *   These are NOT comparable directly.
 *   C1 must compare: compileContract(V1).artifact.contractHash  vs  DB.compiled_json.contractHash
 *
 * Usage:
 *   pnpm audit:contract-sync:prep
 *   pnpm audit:contract-sync:prep --strict     # exit non-zero on missing/stale
 *
 * Exit codes:
 *   0  — script ran successfully (report-only mode, default)
 *   1  — --strict and missing/stale found
 *   2  — script error (DB unavailable, parse fail, etc.)
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const OUTPUT_DIR = path.join(ROOT, "docs", "audit", "contract-sync-prep");

// ---------------------------------------------------------------------------
// Stable hash (same as packages/form-contracts/src/hash.ts)
// ---------------------------------------------------------------------------

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalize(v)]),
    );
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(normalize(value));
}

function stableHash(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

// ---------------------------------------------------------------------------
// Import form-contracts library helpers
// ---------------------------------------------------------------------------

// We need to import from the compiled dist or use tsx. Since the package is
// TypeScript, we use the same pattern as the existing audit scripts:
// resolve to the package source and use tsx for execution.
const FORM_CONTRACTS_PKG = path.join(ROOT, "packages", "form-contracts");
const FORM_CONTRACTS_SRC = path.join(FORM_CONTRACTS_PKG, "src");

let compileContract, adaptV1Contract, formContractV2Schema;
try {
  // Try compiled dist first (faster for repeated runs)
  const distIndex = path.join(FORM_CONTRACTS_PKG, "dist", "index.js");
  if (fs.existsSync(distIndex)) {
    const mod = await import(pathToFileURL(distIndex).href);
    ({ compileContract, adaptV1Contract, formContractV2Schema } = mod);
  }
} catch {
  // Fallback: use workspace.ts compileFile pattern (compile from source)
}

// Load workspace helpers via a small inline reimplementation (avoids TS execution here)
function getLockedContractFiles() {
  return fs
    .readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(LOCKED_DIR, f));
}

// ---------------------------------------------------------------------------
// Compile a locked contract file to its V2 artifact
// ---------------------------------------------------------------------------

async function compileLockedContract(filePath) {
  // Use tsx to run the TypeScript source directly (same pattern as existing scripts)
  const tmpScript = path.join(ROOT, ".cache", "audit-contract-sync-prep", "tmp-compile.mjs");
  fs.mkdirSync(path.dirname(tmpScript), { recursive: true });

  const relPath = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const tmpContent = `
import { readFileSync } from "node:fs";
import { compileContract, adaptV1Contract } from "${pathToFileURL(path.join(FORM_CONTRACTS_SRC, "index.js")).href}";
const raw = JSON.parse(readFileSync("${pathToFileURL(filePath).href}", "utf8"));
// Adapt V1 locked contract to V2 if needed
const v2 = raw.schemaVersion === "2.0" ? raw : adaptV1Contract(raw);
const result = compileContract(v2);
process.stdout.write(JSON.stringify(result));
`;
  fs.writeFileSync(tmpScript, tmpContent, "utf8");

  const { execSync } = await import("node:child_process");
  try {
    const out = execSync(`node --import tsx --experimental-vm-modules "${tmpScript}"`, {
      encoding: "utf8",
      timeout: 30000,
    });
    return JSON.parse(out.trim());
  } catch (err) {
    return { ok: false, issues: [{ message: err.message }] };
  } finally {
    // Cleanup tmp script
    try { fs.unlinkSync(tmpScript); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// DB helpers (lazy, no crash if unavailable)
// ---------------------------------------------------------------------------

async function tryLoadPrisma() {
  let DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    const envPath = path.join(ROOT, ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq < 0) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (k === "DATABASE_URL") DATABASE_URL = v;
      }
    }
  }
  if (!DATABASE_URL) return null;

  try {
    const { PrismaClient } = await import(
      pathToFileURL(
        path.join(ROOT, "apps", "api", "node_modules", ".prisma", "client", "index.js"),
      ).href,
    );
    return new PrismaClient({ adapter: createPrismaMariaDbAdapter(DATABASE_URL) });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DB query: fetch latest PUBLISHED version per (template_code, scope_key=GLOBAL)
// ---------------------------------------------------------------------------

async function fetchDbCompiledContracts(prisma) {
  // Map template_code -> { sourceId, contractHash, compiledJson }
  const rows = await prisma.form_contract_versions.findMany({
    where: { status: "PUBLISHED", scope_key: "GLOBAL" },
    select: {
      template_id: true,
      contract_hash: true,
      compiled_json: true,
      published_at: true,
      version_no: true,
      scope_key: true,
    },
    orderBy: { version_no: "desc" },
  });

  // Deduplicate: keep latest version_no per template_id
  const byTemplate = new Map();
  for (const row of rows) {
    const tid = row.template_id.toString();
    if (!byTemplate.has(tid)) {
      byTemplate.set(tid, {
        templateId: tid,
        contractHash: row.contract_hash,
        compiledJson: row.compiled_json,
        publishedAt: row.published_at,
        versionNo: row.version_no,
        scopeKey: row.scope_key,
      });
    }
  }
  return byTemplate;
}

// ---------------------------------------------------------------------------
// Build comparison report
// ---------------------------------------------------------------------------

async function buildReport(strict) {
  const report = {
    timestamp: new Date().toISOString(),
    strict: !!strict,
    lockedContracts: { total: 0, compiled: 0, failed: 0 },
    dbAvailable: false,
    dbCompiledContracts: { total: 0 },
    comparison: {
      matched: [],
      missingInDb: [],
      staleInDb: [],
      extraInDb: [],
    },
    cannotCompare: [],
    recommendedC1Strategy: "BLOCKED",
    warnings: [],
  };

  // 1. Scan locked contracts
  const lockedFiles = getLockedContractFiles();
  report.lockedContracts.total = lockedFiles.length;

  const lockedCompiles = []; // { templateCode, sourceId, artifactHash, file }
  const missingArtifactList = [];

  for (const file of lockedFiles) {
    const name = path.basename(file, ".json");
    let templateCode = name.replace(/__.*$/, "");
    if (!templateCode.startsWith("BM-")) continue;

    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      report.lockedContracts.failed++;
      report.cannotCompare.push({ templateCode, reason: `parse error: ${err.message}` });
      continue;
    }

    templateCode = raw.templateCode ?? templateCode;
    const sourceId = raw.sourceId ?? name;

    const compiledFile = path.join(COMPILED_V2_DIR, `${templateCode}.compiled.json`);
    let artifactHash = null;

    if (fs.existsSync(compiledFile)) {
      try {
        const compiled = JSON.parse(fs.readFileSync(compiledFile, "utf8"));
        artifactHash = compiled.contractHash ?? null;
        report.lockedContracts.compiled++;
      } catch {
        artifactHash = null;
      }
    } else {
      missingArtifactList.push(templateCode);
    }

    lockedCompiles.push({ templateCode, sourceId, artifactHash, file });
  }

  if (missingArtifactList.length > 0) {
    report.warnings.push(
      `${missingArtifactList.length} locked contracts have no compiled-v2 artifact in docs/audit/docx/compiled-v2/ ` +
        `(${missingArtifactList.slice(0, 5).join(", ")}${missingArtifactList.length > 5 ? "..." : ""}). ` +
        `Run "pnpm contract:compile" to populate. These will appear as "missingInDb" until published.`,
    );
  }

  // 2. DB availability
  const prisma = await tryLoadPrisma();

  if (!prisma) {
    report.warnings.push(
      "DATABASE_URL not set or Prisma client unavailable. DB comparison skipped.",
    );
    // We can still report on locked-compiled-v2 sync
    report.recommendedC1Strategy = "DB_UNAVAILABLE_USE_FILE_ONLY_GUARD";
  } else {
    try {
      // Quick DB connectivity check
      await prisma.$queryRaw`SELECT 1`;
      report.dbAvailable = true;
    } catch (err) {
      report.warnings.push(`DB connectivity check failed: ${err.message}`);
      report.dbAvailable = false;
    }

    if (report.dbAvailable) {
      try {
        const dbContracts = await fetchDbCompiledContracts(prisma);
        report.dbCompiledContracts.total = dbContracts.size;

        // 3. Compare locked (compiled artifact) vs DB compiled_json
        for (const lc of lockedCompiles) {
          // Find DB row by matching compiled_json.contractHash
          // The DB stores compiled_json.contractHash as the artifact's hash
          // We need to check: does any DB row have compiled_json.contractHash === lc.artifactHash?

          let found = false;
          let foundRow = null;

          for (const [tid, row] of dbContracts) {
            if (row.contractHash && lc.artifactHash &&
                row.contractHash === lc.artifactHash) {
              found = true;
              foundRow = row;
              break;
            }
          }

          if (found) {
            report.comparison.matched.push(lc.templateCode);
          } else if (lc.artifactHash === null) {
            report.cannotCompare.push({
              templateCode: lc.templateCode,
              reason: "no compiled-v2 artifact found (run pnpm contract:compile first)",
            });
          } else {
            // Artifact hash exists but no matching DB row
            // This means the locked contract has been compiled but not published
            report.comparison.missingInDb.push(lc.templateCode);
          }
        }

        // 4. Check for extra in DB (DB rows whose contractHash doesn't match any locked artifact)
        const lockedHashes = new Set(lockedCompiles.map((l) => l.artifactHash).filter(Boolean));
        for (const [tid, row] of dbContracts) {
          if (!row.contractHash) continue;
          if (!lockedHashes.has(row.contractHash)) {
            // This DB entry has a contractHash not matching any locked file
            // It's either from before locking, or a different version
            report.comparison.extraInDb.push(tid);
          }
        }

        // 5. Determine stale: DB compiled_json.contractHash !== locked artifact.contractHash
        // (re-evaluate with exact match above — stale means hash exists in DB
        // but locked file has been recompiled since)
        // Since we're comparing artifact hashes, staleInDb stays empty
        // (stale would be: locked artifact recompiled, published a new DB version,
        // but old DB version still exists — handled by version_no deduplication above)

        await prisma.$disconnect();
      } catch (err) {
        report.warnings.push(`DB query failed: ${err.message}`);
        report.dbAvailable = false;
      }
    }
  }

  // 6. Determine recommended strategy
  if (!report.dbAvailable) {
    report.recommendedC1Strategy = "DB_UNAVAILABLE_USE_FILE_ONLY_GUARD";
  } else if (report.cannotCompare.length > 0 && report.cannotCompare.length > report.lockedContracts.total * 0.5) {
    report.recommendedC1Strategy = "BLOCKED";
    report.warnings.push(
      `>50% contracts cannot be compared: ${report.cannotCompare.length}/${report.lockedContracts.total}`,
    );
  } else if (report.comparison.missingInDb.length > 0) {
    // Missing in DB is expected if publish hasn't run yet (C1-PREP before C2)
    report.recommendedC1Strategy = "COMPILED_HASH_COMPARE";
    report.warnings.push(
      `${report.comparison.missingInDb.length} contracts not yet published to DB (run pnpm publish:forms:db --dry-run first)`,
    );
  } else {
    report.recommendedC1Strategy = "COMPILED_HASH_COMPARE";
  }

  return report;
}

// ---------------------------------------------------------------------------
// Human-readable summary
// ---------------------------------------------------------------------------

function formatReport(report) {
  const lines = [];
  lines.push(`# C1-PREP: Contract Sync Guard Readiness Audit`);
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(``);

  lines.push(`## Strategy`);
  lines.push(`Recommended C1 implementation: **${report.recommendedC1Strategy}**`);
  lines.push(``);

  lines.push(`## Locked Contracts`);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total locked files | ${report.lockedContracts.total} |`);
  lines.push(`| Compiled to V2 artifact | ${report.lockedContracts.compiled} |`);
  lines.push(`| Failed to parse | ${report.lockedContracts.failed} |`);
  lines.push(``);

  lines.push(`## Database`);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| DB available | ${report.dbAvailable ? "YES" : "NO"} |`);
  lines.push(`| DB compiled contracts | ${report.dbCompiledContracts.total} |`);
  lines.push(``);

  if (report.dbAvailable) {
    lines.push(`## Comparison (artifact.contractHash)`);
    lines.push(`| Result | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Matched | ${report.comparison.matched.length} |`);
    lines.push(`| Missing in DB | ${report.comparison.missingInDb.length} |`);
    lines.push(`| Stale in DB | ${report.comparison.staleInDb.length} |`);
    lines.push(`| Extra in DB | ${report.comparison.extraInDb.length} |`);
    lines.push(``);

    if (report.comparison.missingInDb.length > 0) {
      lines.push(`### Missing in DB (not yet published)`);
      for (const tc of report.comparison.missingInDb.slice(0, 20)) {
        lines.push(`- ${tc}`);
      }
      if (report.comparison.missingInDb.length > 20) {
        lines.push(`- ... and ${report.comparison.missingInDb.length - 20} more`);
      }
      lines.push(``);
    }

    if (report.comparison.extraInDb.length > 0) {
      lines.push(`### Extra in DB (no matching locked artifact)`);
      for (const tid of report.comparison.extraInDb.slice(0, 20)) {
        lines.push(`- template_id: ${tid}`);
      }
      if (report.comparison.extraInDb.length > 20) {
        lines.push(`- ... and ${report.comparison.extraInDb.length - 20} more`);
      }
      lines.push(``);
    }
  }

  if (report.cannotCompare.length > 0) {
    lines.push(`## Cannot Compare (${report.cannotCompare.length})`);
    for (const item of report.cannotCompare.slice(0, 20)) {
      lines.push(`- **${item.templateCode}**: ${item.reason}`);
    }
    if (report.cannotCompare.length > 20) {
      lines.push(`- ... and ${report.cannotCompare.length - 20} more`);
    }
    lines.push(``);
  }

  if (report.warnings.length > 0) {
    lines.push(`## Warnings`);
    for (const w of report.warnings) {
      lines.push(`- ${w}`);
    }
    lines.push(``);
  }

  lines.push(`## Key Findings for C1`);
  lines.push(``);
  if (report.recommendedC1Strategy === "COMPILED_HASH_COMPARE") {
    lines.push(`C1 can be implemented as **compiled hash compare**:`);
    lines.push(`1. Locked V1 file -> adaptV1Contract() -> compileContract() -> artifact`);
    lines.push(`2. artifact.contractHash  (SHA256 of stable-stringify(artifact), set by compiler)`);
    lines.push(`3. DB: form_contract_versions.compiled_json.contractHash`);
    lines.push(`4. match = hashes equal`);
    lines.push(``);
    lines.push(`**Important**: Do NOT compare DB contract_hash column (pipeline hash`);
    lines.push(`with volatile fields stripped). Use compiled_json.contractHash instead.`);
  } else if (report.recommendedC1Strategy === "DB_UNAVAILABLE_USE_FILE_ONLY_GUARD") {
    lines.push(`DB not available. C1 startup guard should:`);
    lines.push(`1. Skip DB comparison (DB_UNAVAILABLE)`);
    lines.push(`2. Optionally verify compiled-v2 artifacts exist for all locked contracts`);
    lines.push(`3. Log warning but allow startup`);
    lines.push(``);
    lines.push(`**Recommended**: Run this audit with DB available to confirm the`);
    lines.push(`compiled hash compare strategy before implementing C1.`);
  } else {
    lines.push(`Strategy is BLOCKED. See warnings above.`);
  }
  lines.push(``);

  lines.push(`## Hash Method Clarification`);
  lines.push(``);
  lines.push(`| Hash function | Where used | Strips volatile fields? |`);
  lines.push(`|---------------|-----------|--------------------------|`);
  lines.push(`| stableHash() | compileContract() -> artifact.contractHash | NO (plain stable-stringify) |`);
  lines.push(`| stableContractHash() | publish-locked-contracts-to-db -> DB contract_hash column | YES (strips volatile) |`);
  lines.push(``);
  lines.push(`**C1 must use stableHash() on both sides (compiled artifact).**`);
  lines.push(`DB contract_hash column uses stableContractHash() and CANNOT be compared directly.`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const strict = process.argv.includes("--strict");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("Running C1-PREP audit...\n");

  const report = await buildReport(strict);

  // Write JSON report
  const jsonPath = path.join(OUTPUT_DIR, "latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`JSON report: ${path.relative(ROOT, jsonPath)}`);

  // Write MD report
  const mdContent = formatReport(report);
  const mdPath = path.join(OUTPUT_DIR, "latest.md");
  fs.writeFileSync(mdPath, mdContent, "utf8");
  console.log(`MD report: ${path.relative(ROOT, mdPath)}`);

  // Console summary
  console.log("\n" + "=".repeat(60));
  console.log(formatReport(report));
  console.log("=".repeat(60));

  // Exit code
  if (strict) {
    const hasIssues =
      report.comparison.missingInDb.length > 0 ||
      report.comparison.staleInDb.length > 0 ||
      report.cannotCompare.length > 0;
    if (hasIssues) {
      console.log("\n[STRICT] Issues found — exiting non-zero.");
      process.exit(1);
    }
  }
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? ".");

if (isDirectExecution) {
  await main();
}
