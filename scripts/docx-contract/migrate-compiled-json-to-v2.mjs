#!/usr/bin/env node
import { createPrismaMariaDbAdapter } from '../prisma-mariadb-adapter.mjs';
/**
 * Phase D hotfix — Migrate compiled_json from V1 to V2 for all published forms.
 *
 * ROOT CAUSE:
 *   The old publish script saved draft_json into compiled_json (V1 shape),
 *   but RuntimeFormContractService.fromDatabase() reads compiled_json as
 *   CompiledFormContract (V2, schemaVersion "2.0"), causing the UI to receive
 *   V1 contracts with missing source.fields / uiSchema.sections / renderPlan.bindings.
 *
 * FIX:
 *   Recompile each V1 contract in-memory using compileContract(), then UPDATE
 *   the compiled_json column with the V2 artifact.
 *
 * Safety guarantees:
 *   - Idempotent: skips records whose compiled_json is already V2 (schemaVersion "2.0")
 *   - Transactional per record (update → audit log)
 *   - Dry-run mode available
 *
 * Usage:
 *   node scripts/docx-contract/migrate-compiled-json-to-v2.mjs --dry-run
 *   node scripts/docx-contract/migrate-compiled-json-to-v2.mjs           # real DB write
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stableContractHash } from "./lib/stable-contract-hash.mjs";
import { adaptV1Contract } from "../../packages/form-contracts/src/v1-adapter.ts";
import { compileContract } from "../../packages/form-contracts/src/compiler.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");

function sha256HexString(str) {
  return createHash("sha256").update(Buffer.from(str, "utf8")).digest("hex");
}

function parseEnv() {
  const envPath = path.join(ROOT, ".env");
  const vars = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      vars[key] = val;
    }
  }
  return vars;
}

function parseLockedContracts() {
  const files = (fs.readdirSync(LOCKED_DIR) ?? [])
    .filter((f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"))
    .sort();

  const contracts = [];
  const errors = [];

  for (const file of files) {
    try {
      const full = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
      contracts.push({
        file,
        templateCode: full.templateCode ?? file.replace(/__.*$/, ""),
        sourceId: full.sourceId ?? "",
        draftJson: full,
        extractionSha256: full.extractionSource?.sha256 ?? null,
        contractHash: stableContractHash(full),
      });
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
    }
  }

  return { contracts, errors };
}

function recompileToV2(contract) {
  const adapted = adaptV1Contract({
    schemaVersion: "1.0",
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    templateTitle: contract.draftJson.templateTitle ?? "",
    documentKind: "form",
    status: "locked",
    extractionSource: {
      sha256: contract.extractionSha256 ?? sha256HexString(contract.templateCode),
    },
    docxSlots: contract.draftJson.docxSlots,
    canonicalFields: contract.draftJson.canonicalFields,
    renderBindings: contract.draftJson.renderBindings,
  });

  const result = compileContract(adapted);
  if (!result.ok || !result.artifact) {
    return { ok: false, issues: result.issues };
  }
  return { ok: true, artifact: result.artifact };
}

async function migrateToDb(contracts, opts) {
  const { dryRun, officialId } = opts;
  let DATABASE_URL = process.env.DATABASE_URL ?? parseEnv().DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("DATABASE_URL not found. Set it in .env or environment.");
    return { updated: 0, skipped: 0, failed: 0 };
  }

  let PrismaClient;
  try {
    ({ PrismaClient } = await import(
      pathToFileURL(path.join(ROOT, "apps/api/node_modules/.prisma/client/index.js")).href
    ));
  } catch {
    try {
      ({ PrismaClient } = await import(
        pathToFileURL(path.join(ROOT, "apps/api/node_modules/@prisma/client/index.js")).href
      ));
    } catch {
      console.error("Could not import PrismaClient. Run 'cd apps/api && pnpm prisma generate' first.");
      process.exit(1);
    }
  }

  const prisma = new PrismaClient({ adapter: createPrismaMariaDbAdapter(DATABASE_URL) });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const contract of contracts) {
    const dbTemplateCode = contract.sourceId.replace(/__.*$/, "");

    // 1. Find the template
    const template = await prisma.templates.findFirst({
      where: { template_code: dbTemplateCode },
    });
    if (!template) {
      console.error(`  [WARN] Template not found: ${dbTemplateCode}`);
      failed++;
      continue;
    }

    // 2. Find the latest PUBLISHED version with this contractHash
    const publishedVersion = await prisma.form_contract_versions.findFirst({
      where: {
        template_id: template.id,
        scope_key: "GLOBAL",
        status: "PUBLISHED",
        contract_hash: contract.contractHash,
      },
      orderBy: { version_no: "desc" },
    });

    if (!publishedVersion) {
      console.log(`  [SKIP] ${contract.templateCode} — no PUBLISHED version with this contractHash`);
      skipped++;
      continue;
    }

    // 3. Check if already V2
    const existing = publishedVersion.compiled_json;
    if (
      existing &&
      typeof existing === "object" &&
      (existing).schemaVersion === "2.0"
    ) {
      console.log(`  [SKIP] ${contract.templateCode} — compiled_json already V2`);
      skipped++;
      continue;
    }

    // 4. Recompile V1 → V2
    const recompile = recompileToV2(contract);
    if (!recompile.ok) {
      console.error(`  [FAIL] ${contract.templateCode} — compile errors:`);
      for (const issue of recompile.issues) {
        console.error(`      [${issue.severity}] ${issue.path}: ${issue.message}`);
      }
      failed++;
      continue;
    }

    // 5. Update compiled_json
    if (dryRun) {
      console.log(`  [DRY] ${contract.templateCode} — would update compiled_json to V2`);
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.form_contract_versions.update({
          where: { id: publishedVersion.id },
          data: { compiled_json: recompile.artifact },
        });
        await tx.audit_logs.create({
          data: {
            action: "MIGRATE_COMPILED_JSON_V2",
            entity_type: "form_contract_versions",
            actor_name: "system-migration",
            old_value_json: existing,
            new_value_json: recompile.artifact,
            created_at: new Date(),
          },
        });
      });
      console.log(`  [OK] ${contract.templateCode} — compiled_json updated to V2`);
    }
    updated++;
  }

  await prisma.$disconnect();
  return { updated, skipped, failed };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("\n=== Phase D Hotfix: Migrate compiled_json V1 → V2 ===\n");
  if (dryRun) console.log("[DRY RUN] No DB writes.\n");

  const { contracts, errors } = parseLockedContracts();

  if (errors.length) {
    console.error("Parse errors:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error();
  }

  console.log(`Locked contracts found: ${contracts.length}`);

  const compileCheck = [];
  const compileErrors = [];

  for (const contract of contracts) {
    const result = recompileToV2(contract);
    if (!result.ok) {
      compileErrors.push({ templateCode: contract.templateCode, issues: result.issues });
    } else {
      compileCheck.push({ ...contract, v2Artifact: result.artifact });
    }
  }

  if (compileErrors.length) {
    console.error(`\n${compileErrors.length} form(s) fail V1→V2 compile:`);
    for (const err of compileErrors) {
      console.error(`  - ${err.templateCode}:`);
      for (const issue of err.issues) {
        console.error(`      [${issue.severity}] ${issue.path}: ${issue.message}`);
      }
    }
    console.error("\nThese forms cannot be migrated. Fix before retrying.");
    process.exit(1);
  }

  console.log(`All ${compileCheck.length} form(s) compile cleanly to V2.\n`);

  const result = await migrateToDb(compileCheck, {
    dryRun,
    officialId: process.env.OFFICIAL_ID ?? parseEnv().OFFICIAL_ID ?? "1",
  });

  console.log(`\nUpdated: ${result.updated} | Skipped: ${result.skipped} | Failed: ${result.failed}`);
  if (result.failed > 0) process.exit(1);
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? ".");

if (isDirectExecution) {
  await main();
}
