#!/usr/bin/env node
/**
 * Build a read-only decision pack for the active blockers that still prevent
 * broad 213-BM semantic remediation.
 *
 * The script reads repo artifacts and, when DATABASE_URL is available, DB
 * contract versions. It does not compile, publish, repair, or mutate contracts.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const apiRequire = createRequire(path.join(ROOT, "apps", "api", "package.json"));

const OUT_DIR = path.join(ROOT, "docs", "audit", "repo-clean-to-zero-v1");
const OUT_JSON = path.join(OUT_DIR, "active-remediation-blocker-pack.latest.json");
const OUT_MD = path.join(OUT_DIR, "active-remediation-blocker-pack.latest.md");
const REPORT_OUTPUTS = new Set([
  path.relative(ROOT, OUT_JSON).replaceAll("\\", "/"),
  path.relative(ROOT, OUT_MD).replaceAll("\\", "/"),
]);
const ENV_FILE = path.join(ROOT, ".env");
const COMPILED_V2_DIR = path.join(ROOT, "docs", "audit", "docx", "compiled-v2");
const RENDER_DIFF_DIR = path.join(ROOT, "docs", "audit", "per-form-render-accurate");
const HUMAN_BLOCKER_DIR = path.join(
  ROOT,
  "docs",
  "audit",
  "docx-placeholder-renormalization",
);
const ACTIVE_GATE_JSON = path.join(
  ROOT,
  "docs",
  "audit",
  "repo-clean-to-zero-v1",
  "active-decision-gate.latest.json",
);

const RUNTIME_SYNC_CODES = ["BM-052", "BM-062"];
const RENDER_BLOCKER_CODES = ["BM-063", "BM-066"];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  if (process.env.DATABASE_URL) {
    return { value: process.env.DATABASE_URL, source: "process.env" };
  }
  const env = parseEnvFile(ENV_FILE);
  if (env.DATABASE_URL) return { value: env.DATABASE_URL, source: ".env" };
  return { value: null, source: null };
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    command: `git ${args.join(" ")}`,
    exitCode: typeof result.status === "number" ? result.status : 2,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function normalizeStatusPath(line) {
  const value = line.slice(3).trim();
  const renamed = value.split(" -> ");
  return renamed[renamed.length - 1].replaceAll("\\", "/");
}

function filterReportOutputStatus(gitStatusShort) {
  return gitStatusShort
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .filter((line) => !REPORT_OUTPUTS.has(normalizeStatusPath(line)))
    .join("\n");
}

function loadCompiledHash(templateCode) {
  const filePath = path.join(COMPILED_V2_DIR, `${templateCode}.compiled.json`);
  const compiled = readJsonIfExists(filePath);
  return {
    templateCode,
    path: path.relative(ROOT, filePath).replaceAll("\\", "/"),
    exists: compiled !== null,
    contractHash: compiled?.contractHash ?? null,
    sourceId: compiled?.source?.sourceId ?? compiled?.sourceId ?? null,
  };
}

export function summarizeRenderReport(templateCode, report) {
  const binding = report?.bindingFidelity ?? {};
  const literal = report?.literalFidelity ?? {};
  const placeholders = report?.sourcePlaceholders ?? {};

  return {
    templateCode,
    status: report?.status ?? "MISSING",
    clean: report?.clean ?? false,
    renderStatus: report?.render?.status ?? null,
    textFidelityStatus: report?.textFidelity?.status ?? null,
    structureFidelityStatus: report?.structureFidelity?.status ?? null,
    packageIntegrityStatus: report?.packageIntegrity?.status ?? null,
    bindingFidelityStatus: binding.status ?? null,
    literalFidelityStatus: literal.status ?? null,
    undefinedOrNullLiterals: literal.undefinedOrNullLiterals ?? 0,
    placeholdersWithoutSlots: binding.templatePlaceholdersWithoutSlots ?? [],
    placeholdersWithoutBindings: binding.templatePlaceholdersWithoutBindings ?? [],
    sourcePlaceholderCounts: placeholders.counts ?? {},
  };
}

function loadRenderBlocker(templateCode) {
  const reportPath = path.join(RENDER_DIFF_DIR, templateCode, "render-diff.latest.json");
  const report = readJsonIfExists(reportPath);
  const blockerMd = path.join(
    HUMAN_BLOCKER_DIR,
    templateCode,
    "human-review-blocker.latest.md",
  );
  return {
    ...summarizeRenderReport(templateCode, report),
    reportPath: path.relative(ROOT, reportPath).replaceAll("\\", "/"),
    humanReviewBlockerPath: fs.existsSync(blockerMd)
      ? path.relative(ROOT, blockerMd).replaceAll("\\", "/")
      : null,
    requiredDecision:
      templateCode === "BM-063"
        ? [
            "Decide occurrence semantics for document.fullDocumentCode8",
            "Decide occurrence semantics for recipients.personLine5",
          ]
        : [
            "Decide occurrence semantics for recipients.personLine4",
            "Decide occurrence semantics for document.fullDocumentCode4",
          ],
    forbiddenWithoutApproval: [
      "auto slot or binding repair",
      "source DOCX mutation",
      "locked contract mutation",
    ],
  };
}

export function buildRuntimeSyncDecision(templateCode, compiled, versions) {
  const latest = versions[0] ?? null;
  const matchingVersion = versions.find(
    (version) => version.contractHash && version.contractHash === compiled.contractHash,
  );

  return {
    templateCode,
    repoCompiledHash: compiled.contractHash,
    repoSourceId: compiled.sourceId,
    latestDbVersion: latest
      ? {
          versionNo: latest.versionNo,
          contractHash: latest.contractHash,
          publishedAt: latest.publishedAt,
          matchesRepo: latest.contractHash === compiled.contractHash,
        }
      : null,
    matchingDbVersion: matchingVersion
      ? {
          versionNo: matchingVersion.versionNo,
          publishedAt: matchingVersion.publishedAt,
        }
      : null,
    decisionRequired: [
      "Approve publishing the repo rollback/runtime version to DB",
      "or approve/reapply the newer DB latest contract state into repo",
    ],
    forbiddenWithoutApproval: [
      "DB publish",
      "contract mutation",
      "treating C2 drift as safe",
    ],
  };
}

async function loadDbVersions(codes, databaseUrl) {
  if (!databaseUrl.value) {
    return {
      available: false,
      source: null,
      reason: "DATABASE_URL is not available",
      byCode: Object.fromEntries(codes.map((code) => [code, []])),
    };
  }

  let PrismaClient;
  try {
    ({ PrismaClient } = apiRequire("@prisma/client"));
  } catch (error) {
    return {
      available: false,
      source: databaseUrl.source,
      reason: `Unable to load PrismaClient: ${error.message}`,
      byCode: Object.fromEntries(codes.map((code) => [code, []])),
    };
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl.value });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const templates = await prisma.templates.findMany({
      where: { template_code: { in: codes } },
      select: { id: true, template_code: true },
    });
    const idToCode = new Map(templates.map((item) => [item.id, item.template_code]));
    const rows = await prisma.form_contract_versions.findMany({
      where: {
        template_id: { in: templates.map((item) => item.id) },
        status: "PUBLISHED",
        scope_key: "GLOBAL",
        agency_id: null,
      },
      select: {
        template_id: true,
        version_no: true,
        compiled_json: true,
        created_at: true,
        published_at: true,
      },
      orderBy: [{ template_id: "asc" }, { version_no: "desc" }],
    });

    const byCode = Object.fromEntries(codes.map((code) => [code, []]));
    for (const row of rows) {
      const code = idToCode.get(row.template_id);
      if (!code) continue;
      byCode[code].push({
        versionNo: row.version_no,
        contractHash: row.compiled_json?.contractHash ?? null,
        createdAt: row.created_at?.toISOString?.() ?? String(row.created_at ?? ""),
        publishedAt: row.published_at?.toISOString?.() ?? String(row.published_at ?? ""),
      });
    }

    return { available: true, source: databaseUrl.source, byCode };
  } catch (error) {
    return {
      available: false,
      source: databaseUrl.source,
      reason: error.message,
      byCode: Object.fromEntries(codes.map((code) => [code, []])),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# Active Remediation Blocker Pack");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`HEAD: ${report.head}`);
  lines.push(
    `Git status excluding this report output: ${
      report.gitStatusCleanExcludingReportOutputs ? "CLEAN" : "DIRTY"
    }`,
  );
  lines.push("");
  lines.push("## Verdict");
  lines.push("");
  lines.push(`canStart213SemanticRemediation: ${report.canStart213SemanticRemediation ? "YES" : "NO"}`);
  lines.push("");
  lines.push("This pack is read-only evidence for the four live blockers. It is not an approval file.");
  lines.push("");
  lines.push("## Runtime Sync Blockers");
  lines.push("");
  lines.push("| BM | Repo hash | DB latest | Matching DB version | Required decision |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const item of report.runtimeSyncBlockers) {
    const latest = item.latestDbVersion
      ? `v${item.latestDbVersion.versionNo} ${item.latestDbVersion.contractHash}`
      : "missing";
    const matching = item.matchingDbVersion
      ? `v${item.matchingDbVersion.versionNo}`
      : "none in latest history window";
    lines.push(
      `| ${item.templateCode} | ${item.repoCompiledHash ?? "missing"} | ${latest} | ${matching} | publish rollback/runtime version OR approve newer DB state |`,
    );
  }
  lines.push("");
  lines.push("Do not publish DB or mutate contracts until one of those decisions is explicitly approved.");
  lines.push("");
  lines.push("## Render Blockers");
  lines.push("");
  lines.push("| BM | Binding fail | Undefined/null literals | Missing slots | Missing bindings | Human review |");
  lines.push("| --- | --- | ---: | --- | --- | --- |");
  for (const item of report.renderBlockers) {
    lines.push(
      `| ${item.templateCode} | ${item.bindingFidelityStatus ?? "unknown"} | ${item.undefinedOrNullLiterals} | ${item.placeholdersWithoutSlots.join(", ") || "-"} | ${item.placeholdersWithoutBindings.join(", ") || "-"} | ${item.humanReviewBlockerPath ?? "missing"} |`,
    );
  }
  lines.push("");
  lines.push("Automated render, text, structure, and package checks may pass while binding/literal fidelity still fails. These BMs need occurrence-level legal/DOCX review before repair.");
  lines.push("");
  lines.push("## Evidence Inputs");
  lines.push("");
  for (const pathItem of report.evidenceInputs) {
    lines.push(`- ${pathItem}`);
  }
  lines.push("");
  lines.push("## Forbidden Without Approval");
  lines.push("");
  lines.push("- DB publish for BM-052 or BM-062");
  lines.push("- locked contract mutation for BM-052, BM-062, BM-063, or BM-066");
  lines.push("- source DOCX mutation for BM-063 or BM-066");
  lines.push("- auto slot/binding repair for BM-063 or BM-066");
  return `${lines.join("\n")}\n`;
}

export async function buildReport() {
  const head = git(["rev-parse", "--short", "HEAD"]).stdout.trim();
  const gitStatusShort = git(["status", "--short"]).stdout;
  const gitStatusShortExcludingReportOutputs =
    filterReportOutputStatus(gitStatusShort);
  const databaseUrl = resolveDatabaseUrl();
  const db = await loadDbVersions(RUNTIME_SYNC_CODES, databaseUrl);
  const compiledByCode = Object.fromEntries(
    RUNTIME_SYNC_CODES.map((code) => [code, loadCompiledHash(code)]),
  );

  const runtimeSyncBlockers = RUNTIME_SYNC_CODES.map((code) =>
    buildRuntimeSyncDecision(code, compiledByCode[code], db.byCode[code] ?? []),
  );
  const renderBlockers = RENDER_BLOCKER_CODES.map(loadRenderBlocker);
  const activeGate = readJsonIfExists(ACTIVE_GATE_JSON);

  return {
    task: "ACTIVE_REMEDIATION_BLOCKER_PACK_V1",
    generatedAt: new Date().toISOString(),
    head,
    gitStatusShort,
    gitStatusShortExcludingReportOutputs,
    gitStatusClean: gitStatusShort.trim().length === 0,
    gitStatusCleanExcludingReportOutputs:
      gitStatusShortExcludingReportOutputs.trim().length === 0,
    canStart213SemanticRemediation: false,
    activeDecisionGate: activeGate
      ? {
          head: activeGate.head ?? null,
          canStart213SemanticRemediation:
            activeGate.canStart213SemanticRemediation ?? null,
        }
      : null,
    database: {
      available: db.available,
      source: db.source,
      reason: db.reason ?? null,
    },
    runtimeSyncBlockers,
    renderBlockers,
    evidenceInputs: [
      "docs/audit/repo-clean-to-zero-v1/active-decision-gate.latest.json",
      "docs/audit/per-form-render-accurate/BM-063/render-diff.latest.json",
      "docs/audit/per-form-render-accurate/BM-066/render-diff.latest.json",
      "docs/audit/docx-placeholder-renormalization/BM-063/human-review-blocker.latest.md",
      "docs/audit/docx-placeholder-renormalization/BM-066/human-review-blocker.latest.md",
      "docs/audit/repo-clean-to-zero-v1/pending-review/BM-052.pending-review.patch",
      "docs/audit/repo-clean-to-zero-v1/pending-review/BM-062.pending-review.patch",
    ],
  };
}

async function main() {
  const report = await buildReport();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_MD, buildMarkdown(report), "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON).replaceAll("\\", "/")}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD).replaceAll("\\", "/")}`);
  console.log("canStart213SemanticRemediation=NO");
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exit(2);
  });
}
