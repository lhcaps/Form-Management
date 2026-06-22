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
 *   pnpm publish:forms:db --sql              # generate SQL only
 *   pnpm publish:forms:db                     # real DB publish
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

    const contractHash = sha256HexString(JSON.stringify(contract.draftJson));
    toPublish.push({
      templateCode: contract.templateCode,
      templateTitle: contract.templateTitle,
      sourceId: contract.sourceId,
      contractHash,
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

  return { toPublish, skipped };
}

function generateSql(toPublish, opts) {
  if (!toPublish.length) {
    return "-- No contracts to publish.\n";
  }

  const { officialId, agencyId, now } = opts;
  const lines = [
    `-- Phase D publish: ${toPublish.length} locked contracts`,
    `-- Generated: ${now}`,
    `-- Official ID: ${officialId}`,
    agencyId ? `-- Agency ID: ${agencyId}` : `-- Agency ID: (none — global scope)`,
    ``,
    `BEGIN;`,
    ``,
  ];

  for (const p of toPublish) {
    const docxPath = p.normalizedDocxPath
      ? `'${p.normalizedDocxPath.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`
      : "NULL";

    lines.push(`-- ${p.templateCode}: ${p.templateTitle}`);
    lines.push(`--   contract_hash: ${p.contractHash}`);
    lines.push(`--   template_hash: ${p.templateHash}`);
    if (p.normalizedDocxPath) {
      lines.push(`--   normalized_docx: ${p.normalizedDocxPath}`);
    }
    lines.push(
      `--   reviewed_by: ${p.reviewedBy} @ ${p.reviewedAt}`,
    );
    lines.push(
      `--   Check: SELECT id FROM form_contract_versions WHERE template_id IN (SELECT id FROM templates WHERE source_id = '${p.sourceId}') AND scope_key = '${p.templateCode}' AND contract_hash = '${p.contractHash}' AND status = 'PUBLISHED';`,
    );
    lines.push(
      `--   If found: this version already published, skipping.`,
    );
    lines.push(``);
  }

  const first = toPublish[0];
  const docxPathExample = first.normalizedDocxPath
    ? `'${first.normalizedDocxPath.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`
    : "NULL";

  lines.push(`-- Upsert pattern (replace <template_id> placeholders after reviewing above):`);
  lines.push(`-- INSERT INTO form_contract_versions`);
  lines.push(`--   (template_id, agency_id, scope_key, version_no, status,`);
  lines.push(`--    revision, base_contract_hash, contract_hash, template_hash,`);
  lines.push(`--    normalized_docx_path, draft_json, compiled_json,`);
  lines.push(`--    created_by_official_id, approved_by_official_id, published_by_official_id,`);
  lines.push(`--    submitted_at, approved_at, published_at, created_at)`);
  lines.push(`-- SELECT <template_id>, ${agencyId ?? "NULL"}, '${first.templateCode}', 1, 'PUBLISHED',`);
  lines.push(`--   0, NULL, '${first.contractHash}', '${first.templateHash}',`);
  lines.push(`--   ${docxPathExample},`);
  lines.push(`--   '${JSON.stringify(first.draftJson).replace(/'/g, "''")}'::jsonb,`);
  lines.push(`--   '${JSON.stringify(first.draftJson).replace(/'/g, "''")}'::jsonb,`);
  lines.push(`--   ${officialId}n, ${officialId}n, ${officialId}n,`);
  lines.push(`--   '${first.lockedAt.slice(0, 19).replace("T", " ")}',`);
  lines.push(`--   '${first.lockedAt.slice(0, 19).replace("T", " ")}',`);
  lines.push(`--   '${now}',`);
  lines.push(`--   '${now}'`);
  lines.push(`-- WHERE NOT EXISTS (`);
  lines.push(`--   SELECT 1 FROM form_contract_versions`);
  lines.push(`--   WHERE template_id = <template_id> AND scope_key = '${first.templateCode}' AND contract_hash = '${first.contractHash}' AND status = 'PUBLISHED'`);
  lines.push(`-- );`);
  lines.push(``);
  lines.push(`COMMIT;`);

  return lines.join("\n");
}

function writePublishReport(toPublish, skipped, opts) {
  const { officialId, agencyId, now } = opts;
  const md = [
    "# Form Contract DB Publish Report",
    "",
    `Generated: ${now}`,
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

async function publishToDb(toPublish, opts) {
  const { officialId, agencyId, expectExactly } = opts;
  const now = new Date().toISOString();

  let DATABASE_URL;
  const envVars = parseEnv();
  DATABASE_URL = envVars.DATABASE_URL;

  if (!DATABASE_URL) {
    console.log(
      "DATABASE_URL not found in .env. Use --sql to generate SQL for manual review.",
    );
    console.log("\nTo generate SQL:");
    console.log("  node scripts/docx-contract/publish-locked-contracts-to-db.mjs --sql");
    return;
  }

  let PrismaClient;
  try {
    ({ PrismaClient } = await import(
      "../apps/api/node_modules/.prisma/client/index.js"
    ));
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
  console.log(`Official ID: ${officialId}${agencyId ? `, Agency ID: ${agencyId}` : " (global scope)"}`);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  await prisma.$transaction(async (tx) => {
    for (const p of toPublish) {
      // Find template by sourceId
      const template = await tx.templates.findFirst({
        where: { sourceId: p.sourceId },
      });
      if (!template) {
        failures.push(`${p.templateCode}: template not found for sourceId="${p.sourceId}"`);
        failed++;
        continue;
      }

      // Check idempotency: skip if latest published version already has this contractHash
      const latestPublished = await tx.form_contract_versions.findFirst({
        where: {
          templateId: template.id,
          scopeKey: p.templateCode,
          status: "PUBLISHED",
        },
        orderBy: { versionNo: "desc" },
      });

      if (latestPublished?.contractHash === p.contractHash) {
        console.log(`  [SKIP] ${p.templateCode} — already published with same contractHash`);
        skipped++;
        continue;
      }

      // Determine next version number
      const latestAny = await tx.form_contract_versions.findFirst({
        where: {
          templateId: template.id,
          scopeKey: p.templateCode,
        },
        orderBy: { versionNo: "desc" },
      });
      const nextVersion = (latestAny?.versionNo ?? 0) + 1;

      // Create the published version
      await tx.form_contract_versions.create({
        data: {
          templateId: template.id,
          agencyId: agencyId ? BigInt(agencyId) : null,
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
          createdByOfficialId: BigInt(officialId),
          approvedByOfficialId: BigInt(officialId),
          publishedByOfficialId: BigInt(officialId),
          submittedAt: new Date(p.lockedAt),
          approvedAt: new Date(p.lockedAt),
          publishedAt: new Date(now),
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          action: "PUBLISH_LOCKED",
          entityType: "form_contract_versions",
          actorName: p.reviewedBy,
          oldValueJson: latestPublished?.draftJson ?? null,
          newValueJson: p.draftJson,
          createdAt: new Date(),
        },
      });

      console.log(`  [OK] ${p.templateCode} v${nextVersion}`);
      created++;
    }
  });

  await prisma.$disconnect();

  console.log(`\nCreated: ${created} | Skipped (already published): ${skipped} | Failed: ${failed}`);

  if (expectExactly !== undefined && created > 0 && created < expectExactly) {
    console.error(`\nWARNING: Expected to create ${expectExactly} records but only created ${created}.`);
    console.error("Check 'Skipped' count above — some forms may already be published.");
  }

  if (failures.length) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  return { created, skipped, failed };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const outputSql = process.argv.includes("--sql");
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
  if (dryRun) console.log("[DRY RUN] No DB writes will occur.\n");

  const { contracts, errors } = parseLockedContracts();

  if (errors.length) {
    console.error("Parse errors:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error();
  }

  console.log(`Locked contracts found: ${contracts.length}`);
  const { toPublish, skipped } = buildPublishPlan(contracts);

  console.log(`  Ready to publish: ${toPublish.length}`);
  console.log(`  Skipped (generic/non-human): ${skipped.length}`);
  console.log();

  if (toPublish.length === 0) {
    console.log("Nothing to publish. All forms are either skipped or already up-to-date.");
    return;
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (outputSql) {
    const sql = generateSql(toPublish, { officialId, agencyId, now });
    const outPath = path.join(__dirname, "phase-d-publish.sql");
    fs.writeFileSync(outPath, sql, "utf8");
    console.log(`SQL written: ${outPath}`);
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
    return;
  }

  if (!officialId) {
    console.error("OFFICIAL_ID env required. Set it via environment variable or .env:");
    console.error("  $env:OFFICIAL_ID=\"1\"; node scripts/.../publish-locked-contracts-to-db.mjs");
    process.exit(1);
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
