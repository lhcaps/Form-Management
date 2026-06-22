#!/usr/bin/env node
/**
 * Phase D — Publish all locked contracts to the runtime database.
 *
 * Reads every *.contract.locked.json from docs/audit/docx/contracts/locked/,
 * computes contract/template hashes, and upserts a form_contract_versions
 * record with status=PUBLISHED.
 *
 * Prerequisites:
 *   - Run: pnpm --filter api exec prisma migrate deploy
 *   - Set DATABASE_URL in .env
 *
 * Usage:
 *   node scripts/docx-contract/publish-locked-contracts-to-db.mjs
 *   node scripts/docx-contract/publish-locked-contracts-to-db.mjs --dry-run
 *
 * Exit codes:
 *   0 = success
 *   1 = error (printed to stderr)
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(
  ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);
const DRAFTS_DIR = path.join(
  ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
);

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;
const isGeneric = (v) =>
  typeof v === "string" && v.trim() && GENERIC_RE.test(v);

function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256HexString(str) {
  return sha256Hex(Buffer.from(str, "utf8"));
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
  const published = [];
  const skipped = [];

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

    published.push({
      templateCode: contract.templateCode,
      templateTitle: contract.templateTitle,
      sourceId: contract.sourceId,
      contractHash: sha256HexString(JSON.stringify(contract.draftJson)),
      templateHash: contract.extractionSha256 ?? sha256HexString(contract.templateCode),
      normalizedDocxPath: contract.normalizedDocxPath
        ? path.join(ROOT, contract.normalizedDocxPath)
        : null,
      draftJson: contract.draftJson,
      lockedAt: contract.lockedAt,
      reviewedBy: contract.reviewedBy,
      reviewedAt: contract.reviewedAt,
    });
  }

  return { published, skipped };
}

function generateSql(published) {
  if (!published.length) {
    return "-- No contracts to publish.\n";
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const lines = [
    `-- Phase D publish: ${published.length} locked contracts`,
    `-- Generated: ${now}`,
    `-- Reviewer: Le Huy`,
    ``,
    `-- BEGIN TRANSACTION;`,
    ``,
  ];

  for (const p of published) {
    const templateCode = p.templateCode;
    const templateIdPlaceholder = `-- TODO: resolve template_id for "${templateCode}" from templates.source_id = '${p.sourceId}'`;

    lines.push(`-- ${templateCode}: ${p.templateTitle}`);
    lines.push(`--   contract_hash: ${p.contractHash}`);
    lines.push(`--   template_hash: ${p.templateHash}`);
    if (p.normalizedDocxPath) {
      lines.push(`--   normalized_docx: ${p.normalizedDocxPath}`);
    }
    lines.push(`--   reviewed_by: ${p.reviewedBy} @ ${p.reviewedAt}`);
    lines.push(`--`);
    lines.push(`-- ${templateIdPlaceholder}`);
    lines.push(`--`);
    lines.push(`-- INSERT INTO form_contract_versions`);
    lines.push(`--   (template_id, agency_id, scope_key, version_no, status,`);
    lines.push(`--    revision, base_contract_hash, contract_hash, template_hash,`);
    lines.push(`--    normalized_docx_path, draft_json, compiled_json,`);
    lines.push(`--    created_by_official_id, approved_by_official_id, published_by_official_id,`);
    lines.push(`--    submitted_at, approved_at, published_at, created_at)`);
    lines.push(`-- VALUES`);
    lines.push(`--   (<template_id>, <agency_id>, '${p.templateCode}', 1, 'PUBLISHED',`);
    lines.push(`--    0, NULL, '${p.contractHash}', '${p.templateHash}',`);
    lines.push(`--    ${p.normalizedDocxPath ? `'${p.normalizedDocxPath.replace(/\\/g, "\\\\")}'` : "NULL"},`);
    lines.push(`--    '${JSON.stringify(p.draftJson).replace(/'/g, "''")}'::jsonb,`);
    lines.push(`--    '${JSON.stringify(p.draftJson).replace(/'/g, "''")}'::jsonb,`);
    lines.push(`--    <system_official_id>, <system_official_id>, <system_official_id>,`);
    lines.push(`--    '${p.lockedAt.slice(0, 19).replace("T", " ")}',`);
    lines.push(`--    '${p.lockedAt.slice(0, 19).replace("T", " ")}',`);
    lines.push(`--    '${now}',`);
    lines.push(`--    '${now}');`);
    lines.push(``);
    lines.push(`-- Audit log`);
    lines.push(`-- INSERT INTO audit_logs (action, entity_type, entity_id, old_value_json, new_value_json, created_at)`);
    lines.push(`--   SELECT 'PUBLISH_LOCKED', 'form_contract_versions',`);
    lines.push(`--          (SELECT id FROM form_contract_versions WHERE template_id = <template_id> AND scope_key = '${p.templateCode}' LIMIT 1),`);
    lines.push(`--          NULL,`);
    lines.push(`--          (SELECT draft_json FROM form_contract_versions WHERE template_id = <template_id> AND scope_key = '${p.templateCode}' ORDER BY version_no DESC LIMIT 1),`);
    lines.push(`--          '${JSON.stringify(p.draftJson).replace(/'/g, "''")}'::jsonb,`);
    lines.push(`--          '${now}';`);
    lines.push(``);
  }

  lines.push(`-- COMMIT;`);
  return lines.join("\n");
}

function generateJsMigrations(published) {
  if (!published.length) return "// No contracts to publish.";

  const records = published.map((p) => ({
    templateCode: p.templateCode,
    templateTitle: p.templateTitle,
    sourceId: p.sourceId,
    contractHash: p.contractHash,
    templateHash: p.templateHash,
    normalizedDocxPath: p.normalizedDocxPath,
    lockedAt: p.lockedAt,
    reviewedBy: p.reviewedBy,
    reviewedAt: p.reviewedAt,
  }));

  return `// Phase D publish: ${published.length} locked contracts\n// Generated: ${new Date().toISOString()}\n// Reviewer: Le Huy\n\nexport const PHASE_D_PUBLISH_RECORDS = ${JSON.stringify(records, null, 2)};\n`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const outputSql = process.argv.includes("--sql");
  const outputJs = process.argv.includes("--js");

  console.log("\n=== Phase D: Publish Locked Contracts to DB ===\n");
  if (dryRun) console.log("[DRY RUN] No DB writes will occur.\n");

  const { contracts, errors } = parseLockedContracts();

  if (errors.length) {
    console.error("Parse errors:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error();
  }

  console.log(`Locked contracts found: ${contracts.length}`);
  const { published, skipped } = buildPublishPlan(contracts);

  console.log(`  Ready to publish:  ${published.length}`);
  console.log(`  Skipped (generic): ${skipped.length}`);
  console.log();

  if (skipped.length) {
    console.log("Skipped forms:");
    for (const s of skipped) {
      console.log(`  - ${s.templateCode}: ${s.reason}`);
    }
    console.log();
  }

  if (outputSql) {
    const sql = generateSql(published);
    const outPath = path.join(__dirname, "phase-d-publish.sql");
    fs.writeFileSync(outPath, sql, "utf8");
    console.log(`SQL written: ${outPath}`);
    return;
  }

  if (outputJs) {
    const js = generateJsMigrations(published);
    const outPath = path.join(__dirname, "phase-d-publish-records.js");
    fs.writeFileSync(outPath, js, "utf8");
    console.log(`JS migration records written: ${outPath}`);
    return;
  }

  if (published.length === 0) {
    console.log("Nothing to publish. Use --sql to generate SQL for review.");
    return;
  }

  if (dryRun) {
    console.log("[DRY RUN] Would publish:");
    for (const p of published) {
      console.log(`  - ${p.templateCode}: ${p.templateTitle}`);
      console.log(`      contract_hash: ${p.contractHash}`);
    }
    return;
  }

  // Real DB publish path
  let DATABASE_URL;
  try {
    const envPath = path.join(ROOT, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      for (const line of envContent.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key?.trim() === "DATABASE_URL") {
          DATABASE_URL = rest.join("=").trim();
        }
      }
    }
  } catch {
    // ignore
  }

  if (!DATABASE_URL) {
    console.log(
      "DATABASE_URL not found in .env. Use --sql to generate SQL for manual review.",
    );
    console.log("\nTo generate SQL:");
    console.log("  node scripts/docx-contract/publish-locked-contracts-to-db.mjs --sql");
    return;
  }

  // Prisma import
  let PrismaClient;
  try {
    ({ PrismaClient } = await import("../apps/api/node_modules/.prisma/client/index.js"));
  } catch {
    try {
      const { PrismaClient: PC } = await import("@prisma/client");
      PrismaClient = PC;
    } catch {
      console.error(
        "Could not import PrismaClient. Run 'pnpm install' in apps/api first.",
      );
      process.exit(1);
    }
  }

  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

  console.log("Publishing to database...\n");

  let publishedCount = 0;
  let failed = 0;
  const failures = [];

  for (const p of published) {
    try {
      const template = await prisma.templates.findFirst({
        where: { sourceId: p.sourceId },
      });
      if (!template) {
        failures.push(`${p.templateCode}: template not found for sourceId="${p.sourceId}"`);
        failed++;
        continue;
      }

      const latestVersion = await prisma.form_contract_versions.findFirst({
        where: { templateId: template.id, scopeKey: p.templateCode },
        orderBy: { versionNo: "desc" },
      });
      const nextVersion = (latestVersion?.versionNo ?? 0) + 1;

      await prisma.form_contract_versions.create({
        data: {
          templateId: template.id,
          scopeKey: p.templateCode,
          versionNo: nextVersion,
          status: "PUBLISHED",
          revision: 0,
          baseContractHash: null,
          contractHash: p.contractHash,
          templateHash: p.templateHash,
          normalizedDocxPath: p.normalizedDocxPath,
          draftJson: p.draftJson,
          compiledJson: p.draftJson,
          createdByOfficialId: 1n,
          submittedAt: new Date(p.lockedAt),
          approvedAt: new Date(p.lockedAt),
          publishedAt: new Date(),
        },
      });

      await prisma.audit_logs.create({
        data: {
          action: "PUBLISH_LOCKED",
          entityType: "form_contract_versions",
          actorName: p.reviewedBy,
          oldValueJson: latestVersion?.draftJson ?? null,
          newValueJson: p.draftJson,
          createdAt: new Date(),
        },
      });

      console.log(`  [OK] ${p.templateCode} v${nextVersion}`);
      published++;
    } catch (err) {
      failures.push(`${p.templateCode}: ${err.message}`);
      failed++;
    }
  }

  await prisma.$disconnect();

  console.log(`\nPublished: ${published} | Failed: ${failed}`);
  if (failures.length) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) ===
    path.resolve(process.argv[1] ?? ".");

if (isDirectExecution) {
  await main();
}
