#!/usr/bin/env node
/**
 * Phase D — Publish all locked contracts to the runtime database.
 *
 * Reads every *.contract.locked.json from docs/audit/docx/contracts/locked/,
 * computes contract/template hashes, and upserts form_contract_versions
 * records with status=PUBLISHED.
 *
 * Safety guarantees:
 *   - Idempotent: skips forms whose latest version already has the same contractHash
 *   - Atomic: all-or-nothing via transaction
 *   - Envs required: OFFICIAL_ID (createdBy/approvedBy/publishedBy), optional AGENCY_ID
 *   - Fails if published != expected (default 213)
 *
 * Prerequisites:
 *   - Run: pnpm --filter api exec prisma migrate deploy
 *   - Set DATABASE_URL in .env
 *
 * Usage:
 *   pnpm publish:forms:db --dry-run
 *   pnpm publish:forms:db --plan             # generate human-readable plan only
 *   pnpm publish:forms:db                     # real DB publish
 *
 * Exit codes:
 *   0 = success
 *   1 = error (printed to stderr)
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
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;
const isGeneric = (v) =>
  typeof v === "string" && v.trim() && GENERIC_RE.test(v);

function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256HexString(str) {
  return sha256Hex(Buffer.from(str, "utf8"));
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
      const full = JSON.parse(
        fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"),
      );
      const genericSlots = (full.docxSlots ?? []).filter(
        (s) => isGeneric(s.slotId),
      ).length;
      const genericFields = (full.canonicalFields ?? []).filter(
        (f) => isGeneric(f.path),
      ).length;
      contracts.push({
        file,
        templateCode: full.templateCode ?? file.replace(/__.*$/, ""),
        templateTitle: full.templateTitle ?? "",
        sourceId: full.sourceId ?? "",
        reviewKind: full.productMetadata?.reviewKind ?? "unknown",
        genericSlots,
        genericFields,
        draftJson: full,
        normalizedDocxPath: full.extractionSource?.relativePath ?? null,
        extractionSha256: full.extractionSource?.sha256 ?? null,
        lockedAt: full.productMetadata?.lockedAt ?? new Date().toISOString(),
        reviewedBy: full.productMetadata?.reviewedBy ?? "Le Huy",
        reviewedAt: full.productMetadata?.reviewedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
    }
  }

  return { contracts, errors };
}

function buildPublishPlan(contracts) {
  const toPublish = [];
  const skipped = [];
  const compileErrors = [];

  for (const contract of contracts) {
    if (contract.reviewKind !== "human") {
      skipped.push({
        templateCode: contract.templateCode,
        reason: `reviewKind=${contract.reviewKind} (not human)`,
      });
      continue;
    }
    if (contract.genericSlots > 0 || contract.genericFields > 0) {
      skipped.push({
        templateCode: contract.templateCode,
        reason: `generic paths remaining (${contract.genericSlots} slots, ${contract.genericFields} fields)`,
      });
      continue;
    }

    const contractHash = stableContractHash(contract.draftJson);
    const dbTemplateCode = contract.sourceId.replace(/__.*$/, "");

    // Compile V1 → V2 before storing in DB. Runtime reads compiled_json as
    // CompiledFormContract (schemaVersion "2.0", uiSchema.sections, renderPlan.bindings).
    // Storing the raw V1 draft would cause ContractV2Renderer to crash at runtime.
    const adapted = adaptV1Contract({
      schemaVersion: "1.0",
      sourceId: contract.sourceId,
      templateCode: contract.templateCode,
      templateTitle: contract.templateTitle,
      documentKind: "form",
      status: "locked",
      extractionSource: {
        sha256: contract.extractionSha256 ?? sha256HexString(contract.templateCode),
        relativePath: contract.normalizedDocxPath ?? null,
      },
      docxSlots: contract.draftJson.docxSlots,
      canonicalFields: contract.draftJson.canonicalFields,
      renderBindings: contract.draftJson.renderBindings,
    });
    const compileResult = compileContract(adapted);
    if (!compileResult.ok || !compileResult.artifact) {
      compileErrors.push({
        templateCode: contract.templateCode,
        issues: compileResult.issues,
      });
      continue;
    }

    toPublish.push({
      templateCode: contract.templateCode,
      dbTemplateCode,
      templateTitle: contract.templateTitle,
      sourceId: contract.sourceId,
      contractHash,
      templateHash: contract.extractionSha256 ?? sha256HexString(contract.templateCode),
      normalizedDocxPath: contract.normalizedDocxPath
        ? path.join(ROOT, contract.normalizedDocxPath)
        : null,
      draftJson: contract.draftJson,
      compiledArtifact: compileResult.artifact,
      lockedAt: contract.lockedAt,
      reviewedBy: contract.reviewedBy,
      reviewedAt: contract.reviewedAt,
    });
  }

  return { toPublish, skipped, compileErrors };
}

function generatePlan(toPublish, opts) {
  if (!toPublish.length) {
    return "No contracts to publish.\n";
  }

  const { officialId, agencyId, now } = opts;
  const lines = [
    `# Phase D publish plan — ${toPublish.length} locked contracts`,
    `# Generated: ${now}`,
    `# Official ID: ${officialId}`,
    agencyId ? `# Agency ID: ${agencyId}` : `# Agency ID: (none — global scope)`,
    ``,
    `# For each form below, the script will:`,
    `#   1. Find the template by template_code in the DB`,
    `#   2. Check idempotency: skip if latest PUBLISHED version has the same contractHash`,
    `#   3. Upsert form_contract_versions with:`,
    `#      - status: PUBLISHED`,
    `#      - draft_json: V1 locked contract (raw)`,
    `#      - compiled_json: CompiledFormContract (V2, schemaVersion "2.0")`,
    `#      - contract_hash: stable-semantic-v1 hash of the V1 contract`,
    `#      - template_hash: SHA256 of the normalized DOCX`,
    ``,
  ];

  for (const p of toPublish) {
    lines.push(`## ${p.templateCode}: ${p.templateTitle}`);
    lines.push(`- contract_hash: ${p.contractHash}`);
    lines.push(`- template_hash: ${p.templateHash.slice(0, 16)}...`);
    if (p.normalizedDocxPath) {
      lines.push(`- normalized_docx: ${p.normalizedDocxPath}`);
    }
    lines.push(`- reviewed_by: ${p.reviewedBy} @ ${p.reviewedAt}`);
    lines.push(``);
  }

  lines.push(`# Total: ${toPublish.length} form(s) to publish`);
  lines.push(`# This is a HUMAN-READABLE PLAN. Run without --plan to execute actual DB writes.`);

  return lines.join("\n");
}

function writePublishReport(toPublish, skipped, opts) {
  const { officialId, agencyId, now } = opts;
  const md = [
    "# Form Contract DB Publish Report",
    "",
    `Generated: ${now}`,
    `Hash mode: stable-semantic-v1`,
    `Total locked contracts: ${toPublish.length + skipped.length}`,
    `Ready to publish: ${toPublish.length}`,
    `Skipped: ${skipped.length}`,
    "",
    `Official ID: ${officialId}`,
    agencyId ? `Agency ID: ${agencyId}` : "Agency ID: (none — global scope)",
    "",
    "## Skipped Forms",
    "",
  ];

  if (skipped.length === 0) {
    md.push("_No forms skipped._");
  } else {
    for (const s of skipped) {
      md.push(`- **${s.templateCode}**: ${s.reason}`);
    }
  }

  md.push("");
  md.push("## Published Forms");
  md.push("");
  md.push("| BM | Contract Hash | Template Hash | Normalized DOCX |");
  md.push("|---|---|---|---|");
  for (const p of toPublish) {
    md.push(
      `| ${p.templateCode} | ${p.contractHash.slice(0, 16)}... | ${p.templateHash.slice(0, 16)}... | ${p.normalizedDocxPath ? "yes" : "no"} |`,
    );
  }

  const reportPath = path.join(REPORTS_DIR, "FORM-CONTRACT-DB-PUBLISH.md");
  fs.writeFileSync(reportPath, md.join("\n"), "utf8");
  return reportPath;
}

async function preflightTemplates(toPublish, prisma) {
  const dbCodes = toPublish.map((p) => p.dbTemplateCode);
  const found = await prisma.templates.findMany({
    where: { template_code: { in: dbCodes } },
    select: { template_code: true, id: true },
  });
  const foundSet = new Set(found.map((t) => t.template_code));

  const missing = toPublish.filter((p) => !foundSet.has(p.dbTemplateCode));
  if (missing.length > 0) {
    throw new Error(
      `Preflight failed: ${missing.length} template(s) not found in DB:\n` +
      missing.map((p) => `  - ${p.templateCode} (template_code="${p.dbTemplateCode}")`).join("\n") +
      "\nEnsure all 213 templates exist before running publish.",
    );
  }

  return found;
}

async function publishToDb(toPublish, opts) {
  const { officialId, agencyId, expectExactly } = opts;
  const now = new Date().toISOString();

  let DATABASE_URL = process.env.DATABASE_URL ?? parseEnv().DATABASE_URL;

  if (!DATABASE_URL) {
    console.log(
      "DATABASE_URL not found in .env. Use --sql to generate SQL for manual review.",
    );
    console.log("\nTo generate SQL:");
    console.log("  node scripts/docx-contract/publish-locked-contracts-to-db.mjs --sql");
    return { created: 0, skipped: 0, failed: 0, preflightFailed: false };
  }

  let PrismaClient;
  try {
    // Try .prisma/client first (generated via `prisma generate`)
    ({ PrismaClient } = await import(
      pathToFileURL(path.join(ROOT, "apps/api/node_modules/.prisma/client/index.js")).href
    ));
  } catch {
    try {
      // Fallback to @prisma/client (installed but .prisma not yet generated)
      ({ PrismaClient } = await import(
        pathToFileURL(path.join(ROOT, "apps/api/node_modules/@prisma/client/index.js")).href
      ));
    } catch {
      console.error(
        "Could not import PrismaClient. Run 'cd apps/api && pnpm prisma generate && pnpm install' first.",
      );
      process.exit(1);
    }
  }

  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  console.log("Publishing to database...\n");
  console.log(`Official ID: ${officialId}${agencyId ? `, Agency ID: ${agencyId}` : " (global scope)"}`);

  // Preflight: verify ALL templates exist before touching any data
  console.log("[preflight] Verifying all templates exist in DB...");
  await preflightTemplates(toPublish, prisma);
  console.log("[preflight] All templates found. Proceeding to transaction.\n");

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  await prisma.$transaction(async (tx) => {
    for (const p of toPublish) {
      // Find template by template_code (derived from sourceId: "BM-001__hash" -> "BM-001")
      const template = await tx.templates.findFirst({
        where: { template_code: p.dbTemplateCode },
      });
      if (!template) {
        throw new Error(
          `Template not found for template_code="${p.dbTemplateCode}" (${p.templateCode}). ` +
          `Preflight should have caught this. Rolling back transaction.`,
        );
      }

      // Check idempotency: skip if latest published version already has this contractHash
      const latestPublished = await tx.form_contract_versions.findFirst({
        where: {
          template_id: template.id,
          scope_key: "GLOBAL",
          status: "PUBLISHED",
        },
        orderBy: { version_no: "desc" },
      });

      if (latestPublished?.contract_hash === p.contractHash) {
        console.log(`  [SKIP] ${p.templateCode} — already published with same contractHash`);
        skipped++;
        continue;
      }

      // Determine next version number
      const latestAny = await tx.form_contract_versions.findFirst({
        where: {
          template_id: template.id,
          scope_key: "GLOBAL",
        },
        orderBy: { version_no: "desc" },
      });
      const nextVersion = (latestAny?.version_no ?? 0) + 1;

      // Create the published version (all snake_case, BigInt objects for @db.UnsignedBigInt fields)
      await tx.form_contract_versions.create({
        data: {
          template_id: BigInt(template.id.toString()),
          agency_id: agencyId ? BigInt(agencyId) : null,
          scope_key: "GLOBAL",
          version_no: nextVersion,
          status: "PUBLISHED",
          revision: 0,
          base_contract_hash: null,
          contract_hash: p.contractHash,
          template_hash: p.templateHash,
          normalized_docx_path: p.normalizedDocxPath,
          draft_json: p.draftJson,
          compiled_json: p.compiledArtifact,
          created_by_official_id: BigInt(officialId),
          approved_by_official_id: BigInt(officialId),
          published_by_official_id: BigInt(officialId),
          submitted_at: new Date(p.lockedAt),
          approved_at: new Date(p.lockedAt),
          published_at: new Date(now),
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          action: "PUBLISH_LOCKED",
          entity_type: "form_contract_versions",
          actor_name: p.reviewedBy,
          old_value_json: latestPublished?.draft_json ?? null,
          new_value_json: p.draftJson,
          created_at: new Date(),
        },
      });

      console.log(`  [OK] ${p.templateCode} v${nextVersion}`);
      created++;
    }
  }); // transaction auto-commits on success, rolls back on throw

  await prisma.$disconnect();

  console.log(`\nCreated: ${created} | Skipped (already published): ${skipped} | Failed: ${failed}`);

  const total = created + skipped;
  if (total !== toPublish.length) {
    console.error(
      `\nASSERTION FAILED: created(${created}) + skipped(${skipped}) = ${total} ` +
      `but expected ${toPublish.length}. Something went wrong.`,
    );
    process.exit(1);
  }

  if (expectExactly !== undefined && created > 0 && created < expectExactly) {
    console.error(
      `\nASSERTION FAILED: created ${created} < expected ${expectExactly}. ` +
      `Some forms may already be published or blocked.`,
    );
    process.exit(1);
  }

  if (failed > 0) {
    console.error(`\nASSERTION FAILED: ${failed} record(s) failed.`);
    process.exit(1);
  }

  return { created, skipped, failed };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const outputPlan = process.argv.includes("--plan");
  const envVars = parseEnv();

  // Required: OFFICIAL_ID
  const officialId = process.env.OFFICIAL_ID ?? envVars.OFFICIAL_ID;
  // Optional: AGENCY_ID
  const agencyId = process.env.AGENCY_ID ?? envVars.AGENCY_ID ?? null;
  // Expected count (default 213)
  const expectExactly = parseInt(
    process.env.EXPECT_COUNT ?? String(213),
    10,
  );

  console.log("\n=== Phase D: Publish Locked Contracts to DB ===\n");
  console.log("Hash mode: stable-semantic-v1\n");
  if (dryRun) console.log("[DRY RUN] No DB writes will occur.\n");

  const { contracts, errors } = parseLockedContracts();

  if (errors.length) {
    console.error("Parse errors:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error();
  }

  console.log(`Locked contracts found: ${contracts.length}`);
  const { toPublish, skipped, compileErrors } = buildPublishPlan(contracts);

  if (compileErrors.length) {
    console.error(`\nCompile errors for ${compileErrors.length} form(s):`);
    for (const err of compileErrors) {
      console.error(`  - ${err.templateCode}:`);
      for (const issue of err.issues) {
        console.error(`      [${issue.severity}] ${issue.path}: ${issue.message}`);
      }
    }
    console.error(
      `\nThese forms cannot be published. Fix the contract issues above before retrying.`,
    );
    process.exit(1);
  }

  console.log(`  Ready to publish: ${toPublish.length}`);
  console.log(`  Skipped (generic/non-human): ${skipped.length}`);
  console.log();

  if (toPublish.length === 0) {
    console.log("Nothing to publish. All forms are either skipped or already up-to-date.");
    return;
  }

  // OFFICIAL_ID is required for ALL modes including --plan (it appears in the generated output)
  if (!officialId) {
    console.error("OFFICIAL_ID env required. Set it via environment variable or .env:");
    console.error("  $env:OFFICIAL_ID=\"1\"; node scripts/.../publish-locked-contracts-to-db.mjs");
    process.exit(1);
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (outputPlan) {
    const sql = generatePlan(toPublish, { officialId, agencyId, now });
    const outPath = path.join(__dirname, "phase-d-publish-plan.txt");
    fs.writeFileSync(outPath, sql, "utf8");
    console.log(`Plan written: ${outPath}`);
    const reportPath = writePublishReport(toPublish, skipped, { officialId, agencyId, now });
    console.log(`Report written: ${reportPath}`);
    return;
  }

  if (dryRun) {
    console.log("[DRY RUN] Would publish:");
    for (const p of toPublish) {
      console.log(`  - ${p.templateCode}: ${p.templateTitle}`);
      console.log(`      contract_hash: ${p.contractHash}`);
      console.log(`      template_hash: ${p.templateHash}`);
    }
    console.log();
    console.log(`Would create: ${toPublish.length}`);
    console.log(`Would skip: ${skipped.length}`);
    console.log(`Already published: ${skipped.filter((s) => s.reason?.includes("already published")).length}`);
    return;
  }

  const result = await publishToDb(toPublish, {
    officialId,
    agencyId,
    expectExactly,
  });

  const reportPath = writePublishReport(toPublish, skipped, { officialId, agencyId, now });
  console.log(`\nPublish report: ${reportPath}`);
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? ".");

if (isDirectExecution) {
  await main();
}
