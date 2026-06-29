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
const ACTIVE_GATE_JSON = path.join(OUT_DIR, "active-decision-gate.latest.json");
const ACTIVE_GATE_MD = path.join(OUT_DIR, "active-decision-gate.latest.md");
const REPORT_OUTPUTS = new Set([
  path.relative(ROOT, OUT_JSON).replaceAll("\\", "/"),
  path.relative(ROOT, OUT_MD).replaceAll("\\", "/"),
  path.relative(ROOT, ACTIVE_GATE_JSON).replaceAll("\\", "/"),
  path.relative(ROOT, ACTIVE_GATE_MD).replaceAll("\\", "/"),
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
const RUNTIME_SYNC_CODES = ["BM-052", "BM-062"];
const RENDER_BLOCKER_CODES = ["BM-052", "BM-062", "BM-063", "BM-066"];
const RENDER_BLOCKER_DECISIONS = {
  "BM-052": [
    "Decide occurrence semantics for remaining recipients.personLine6 placeholders",
  ],
  "BM-062": [
    "Decide occurrence semantics for remaining recipients.personLine5 placeholders",
  ],
  "BM-063": [
    "Decide occurrence semantics for document.fullDocumentCode8",
    "Decide occurrence semantics for recipients.personLine5",
  ],
  "BM-066": [
    "Decide occurrence semantics for recipients.personLine4",
    "Decide occurrence semantics for document.fullDocumentCode4",
  ],
};

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
    requiredDecision: RENDER_BLOCKER_DECISIONS[templateCode] ?? [
      "Decide occurrence semantics for remaining render blockers",
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

export function isRuntimeSyncBlocker(decision) {
  return decision?.latestDbVersion?.matchesRepo !== true;
}

export function isActiveRenderBlocker(item) {
  const status = String(item?.status ?? "MISSING").toUpperCase();
  return item?.clean !== true || status === "FAIL" || status === "ERROR" || status === "MISSING";
}

function buildDecisionGate(report) {
  const blockingDecisions = [];
  if (report.runtimeSyncBlockers.length > 0) {
    blockingDecisions.push({
      id: "RUNTIME_SYNC_BLOCKERS",
      type: "RUNTIME_SYNC",
      templates: report.runtimeSyncBlockers.map((item) => item.templateCode),
      reason: "Latest published GLOBAL DB contract does not match repo compiled contract",
    });
  }
  if (report.renderBlockers.length > 0) {
    blockingDecisions.push({
      id: "RENDER_FIDELITY_BLOCKERS",
      type: "RENDER_FIDELITY",
      templates: report.renderBlockers.map((item) => item.templateCode),
      reason: "Render fidelity report is not clean",
    });
  }

  return {
    artifact: "active-decision-gate",
    generatedAt: report.generatedAt,
    head: report.head,
    canStart213SemanticRemediation: blockingDecisions.length === 0,
    blockingDecisions,
    summary: {
      runtimeSyncBlockers: report.runtimeSyncBlockers.length,
      renderBlockers: report.renderBlockers.length,
      runtimeSyncCandidatesChecked: report.runtimeSyncCandidates.length,
      renderCandidatesChecked: report.renderBlockerCandidates.length,
    },
    evidenceInputs: report.evidenceInputs,
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
  lines.push("This pack is read-only evidence for active blockers. It is not an approval file.");
  lines.push("");
  lines.push("## Runtime Sync Blockers");
  lines.push("");
  lines.push("| BM | Repo hash | DB latest | Matching DB version | Required decision |");
  lines.push("| --- | --- | --- | --- | --- |");
  if (report.runtimeSyncBlockers.length === 0) {
    lines.push("| - | - | - | - | none |");
  }
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
  if (report.renderBlockers.length === 0) {
    lines.push("| - | - | 0 | - | - | none |");
  }
  for (const item of report.renderBlockers) {
    lines.push(
      `| ${item.templateCode} | ${item.bindingFidelityStatus ?? "unknown"} | ${item.undefinedOrNullLiterals} | ${item.placeholdersWithoutSlots.join(", ") || "-"} | ${item.placeholdersWithoutBindings.join(", ") || "-"} | ${item.humanReviewBlockerPath ?? "missing"} |`,
    );
  }
  lines.push("");
  lines.push("Automated render, text, structure, and package checks must all pass before a BM is removed from active blockers.");
  lines.push("");
  lines.push("## Checked Candidates");
  lines.push("");
  lines.push(`Runtime sync candidates checked: ${report.runtimeSyncCandidates.map((item) => item.templateCode).join(", ") || "none"}`);
  lines.push(`Render candidates checked: ${report.renderBlockerCandidates.map((item) => item.templateCode).join(", ") || "none"}`);
  lines.push("");
  lines.push("## Evidence Inputs");
  lines.push("");
  for (const pathItem of report.evidenceInputs) {
    lines.push(`- ${pathItem}`);
  }
  lines.push("");
  lines.push("## Forbidden Without Approval");
  lines.push("");
  if (report.canStart213SemanticRemediation) {
    lines.push("- none; no active blocker remains in this pack");
  } else {
    lines.push("- DB publish for active runtime-sync blockers");
    lines.push("- locked contract mutation for active render blockers");
    lines.push("- source DOCX mutation outside approved occurrence-level decisions");
    lines.push("- auto slot/binding repair for active render blockers");
  }
  return `${lines.join("\n")}\n`;
}

function buildDecisionGateMarkdown(gate) {
  const lines = [];
  lines.push("# Active Decision Gate");
  lines.push("");
  lines.push(`Generated: ${gate.generatedAt}`);
  lines.push(`HEAD: ${gate.head}`);
  lines.push("");
  lines.push(`canStart213SemanticRemediation: ${gate.canStart213SemanticRemediation ? "YES" : "NO"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Runtime sync blockers: ${gate.summary.runtimeSyncBlockers}`);
  lines.push(`- Render blockers: ${gate.summary.renderBlockers}`);
  lines.push(`- Runtime sync candidates checked: ${gate.summary.runtimeSyncCandidatesChecked}`);
  lines.push(`- Render candidates checked: ${gate.summary.renderCandidatesChecked}`);
  lines.push("");
  lines.push("## Blocking Decisions");
  lines.push("");
  if (gate.blockingDecisions.length === 0) {
    lines.push("None.");
  } else {
    for (const decision of gate.blockingDecisions) {
      lines.push(`- ${decision.id}: ${decision.templates.join(", ")} — ${decision.reason}`);
    }
  }
  lines.push("");
  lines.push("## Evidence Inputs");
  lines.push("");
  for (const item of gate.evidenceInputs) {
    lines.push(`- ${item}`);
  }
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

  const runtimeSyncCandidates = RUNTIME_SYNC_CODES.map((code) =>
    buildRuntimeSyncDecision(code, compiledByCode[code], db.byCode[code] ?? []),
  );
  const runtimeSyncBlockers = runtimeSyncCandidates.filter(isRuntimeSyncBlocker);
  const renderBlockerCandidates = RENDER_BLOCKER_CODES.map(loadRenderBlocker);
  const renderBlockers = renderBlockerCandidates.filter(isActiveRenderBlocker);
  const canStart213SemanticRemediation =
    runtimeSyncBlockers.length === 0 && renderBlockers.length === 0;

  return {
    task: "ACTIVE_REMEDIATION_BLOCKER_PACK_V1",
    generatedAt: new Date().toISOString(),
    head,
    gitStatusShort,
    gitStatusShortExcludingReportOutputs,
    gitStatusClean: gitStatusShort.trim().length === 0,
    gitStatusCleanExcludingReportOutputs:
      gitStatusShortExcludingReportOutputs.trim().length === 0,
    canStart213SemanticRemediation,
    database: {
      available: db.available,
      source: db.source,
      reason: db.reason ?? null,
    },
    runtimeSyncCandidates,
    runtimeSyncBlockers,
    renderBlockerCandidates,
    renderBlockers,
    evidenceInputs: [
      "docs/audit/repo-clean-to-zero-v1/active-decision-gate.latest.json",
      "docs/audit/per-form-render-accurate/BM-052/render-diff.latest.json",
      "docs/audit/per-form-render-accurate/BM-062/render-diff.latest.json",
      "docs/audit/per-form-render-accurate/BM-063/render-diff.latest.json",
      "docs/audit/per-form-render-accurate/BM-066/render-diff.latest.json",
      "docs/audit/docx-placeholder-renormalization/BM-052/planner-handoff.latest.md",
      "docs/audit/docx-placeholder-renormalization/BM-062/planner-handoff.latest.md",
      "docs/audit/docx-placeholder-renormalization/BM-063/human-review-blocker.latest.md",
      "docs/audit/docx-placeholder-renormalization/BM-066/human-review-blocker.latest.md",
      "docs/audit/repo-clean-to-zero-v1/pending-review/BM-052.pending-review.patch",
      "docs/audit/repo-clean-to-zero-v1/pending-review/BM-062.pending-review.patch",
    ],
  };
}

async function main() {
  const report = await buildReport();
  const decisionGate = buildDecisionGate(report);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_MD, buildMarkdown(report), "utf8");
  fs.writeFileSync(ACTIVE_GATE_JSON, `${JSON.stringify(decisionGate, null, 2)}\n`, "utf8");
  fs.writeFileSync(ACTIVE_GATE_MD, buildDecisionGateMarkdown(decisionGate), "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON).replaceAll("\\", "/")}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD).replaceAll("\\", "/")}`);
  console.log(`Wrote ${path.relative(ROOT, ACTIVE_GATE_JSON).replaceAll("\\", "/")}`);
  console.log(`Wrote ${path.relative(ROOT, ACTIVE_GATE_MD).replaceAll("\\", "/")}`);
  console.log(`canStart213SemanticRemediation=${decisionGate.canStart213SemanticRemediation ? "YES" : "NO"}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exit(2);
  });
}
