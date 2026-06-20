import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const DEFAULT_REPO_ROOT = resolve(dirname(THIS_FILE), "..");
const CONTRACT_RE =
  /^(BM-\d{3})__([a-f0-9]+)\.contract\.(draft|locked)\.json$/u;

export function canonicalCodes() {
  return Array.from(
    { length: 213 },
    (_, index) => `BM-${String(index + 1).padStart(3, "0")}`,
  );
}

export function parseSelectedCodes(argv) {
  const inline = argv.find((arg) => arg.startsWith("--codes="));
  const index = argv.indexOf("--codes");
  const raw = inline?.slice("--codes=".length) ?? (index >= 0 ? argv[index + 1] : "");
  if (!raw) return null;

  const codes = [
    ...new Set(raw.split(/[,\s]+/u).map((value) => value.trim()).filter(Boolean)),
  ];
  const invalid = codes.filter((code) => !/^BM-\d{3}$/u.test(code));
  if (invalid.length > 0) {
    throw new Error(`Invalid BM code(s): ${invalid.join(", ")}`);
  }
  return codes.sort();
}

export function selectCanonicalContract(entries) {
  if (entries.length === 0) return null;
  return [...entries].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "locked" ? -1 : 1;
    }
    return left.sourceId.localeCompare(right.sourceId);
  })[0];
}

export function stageCodeFor(templateCode) {
  const number = Number(templateCode.slice(3));
  const ranges = [
    ["01", 1, 30],
    ["02", 31, 69],
    ["03", 70, 84],
    ["04", 85, 140],
    ["05", 141, 168],
    ["06", 169, 173],
    ["07", 174, 178],
    ["08", 179, 184],
    ["09", 185, 213],
  ];
  return ranges.find(([, start, end]) => number >= start && number <= end)?.[0] ?? null;
}

export function collectFilesystemRows(repoRoot = DEFAULT_REPO_ROOT) {
  const contractsByCode = loadContracts(repoRoot);
  const codes = canonicalCodes();
  return codes.map((code) => {
    const contracts = contractsByCode.get(code) ?? [];
    const canonical = selectCanonicalContract(contracts);
    const alternates = contracts
      .filter((entry) => entry.filePath !== canonical?.filePath)
      .map((entry) => entry.sourceId)
      .sort();
    const normalizedPath = join(
      repoRoot,
      "storage",
      "templates",
      "normalized-docx",
      code,
      `${code}_normalized.docx`,
    );
    const rendererKind = inspectLegacyRenderer(repoRoot, code);

    return {
      code,
      stageCode: stageCodeFor(code),
      normalizedPath,
      normalizedExists: existsSync(normalizedPath),
      templateHash: existsSync(normalizedPath)
        ? sha256(readFileSync(normalizedPath))
        : null,
      contract: canonical,
      alternateSourceIds: alternates,
      grade: canonical
        ? canonical.status === "locked"
          ? "LOCKED_VERIFIED"
          : "EXTRACTED_NEEDS_REVIEW"
        : "GENERIC_FALLBACK",
      fieldCount: canonical?.canonicalFields.length ?? 0,
      bindingCount: canonical?.renderBindings.length ?? 0,
      unknownCount: countUnknown(canonical?.canonicalFields ?? []),
      reviewRequiredCount: (canonical?.docxSlots ?? []).filter(
        (slot) => slot.reviewRequired,
      ).length,
      rendererKind,
      issues: [],
      warnings: [],
    };
  });
}

export async function validateAdaptedBaselines(rows, repoRoot = DEFAULT_REPO_ROOT) {
  const requireFromContracts = createRequire(
    join(repoRoot, "packages", "form-contracts", "package.json"),
  );
  const { adaptV1Contract, compileContract, createEmptyContract } =
    requireFromContracts("@qllaw/form-contracts");

  for (const row of rows) {
    if (!row.normalizedExists) {
      row.issues.push("MISSING_NORMALIZED_DOCX");
      continue;
    }
    if (!row.contract) {
      const fallback = createEmptyContract({
        templateCode: row.code,
        title: row.code,
        agencyId: null,
        templateHash: row.templateHash,
        normalizedDocxPath: portable(relative(repoRoot, row.normalizedPath)),
      });
      const compiled = compileContract(fallback);
      if (!compiled.ok) row.issues.push("VIRTUAL_BASELINE_COMPILE_FAILED");
      continue;
    }

    const adapted = adaptV1Contract(
      {
        schemaVersion: "1.0",
        sourceId: row.contract.sourceId,
        templateCode: row.contract.templateCode,
        templateTitle: row.contract.title,
        documentKind: "form",
        status: row.contract.status,
        extractionSource: row.contract.extractionSource,
        docxSlots: row.contract.docxSlots,
        canonicalFields: row.contract.canonicalFields,
        renderBindings: row.contract.renderBindings,
      },
      null,
    );
    adapted.templateHash = row.templateHash;
    adapted.normalizedDocxPath = portable(relative(repoRoot, row.normalizedPath));
    const compiled = compileContract(adapted);
    if (!compiled.ok || !compiled.artifact) {
      row.warnings.push("V1_ADAPTER_COMPILE_REVIEW_REQUIRED");
    }
    if (adapted.fields.length !== row.fieldCount) {
      row.issues.push(
        `FIELD_COUNT_MISMATCH:${row.fieldCount}->${adapted.fields.length}`,
      );
    }
    if (adapted.renderBindings.length !== row.bindingCount) {
      row.issues.push(
        `BINDING_COUNT_MISMATCH:${row.bindingCount}->${adapted.renderBindings.length}`,
      );
    }
    if (
      compiled.ok &&
      compiled.artifact &&
      compiled.artifact.templateHash !== row.templateHash
    ) {
      row.issues.push("TEMPLATE_HASH_MISMATCH");
    }
  }
}

export function generatedRendererManifestCodes(repoRoot = DEFAULT_REPO_ROOT) {
  const filePath = join(
    repoRoot,
    "apps",
    "api",
    "src",
    "modules",
    "form-studio",
    "infrastructure",
    "legacy-renderer-capabilities.generated.ts",
  );
  if (!existsSync(filePath)) return new Set();
  return new Set(
    [...readFileSync(filePath, "utf8").matchAll(/'(BM-\d{3})'/gu)].map(
      (match) => match[1],
    ),
  );
}

export function actualGenericRendererCodes(repoRoot = DEFAULT_REPO_ROOT) {
  const result = new Set();
  for (const code of canonicalCodes()) {
    if (inspectLegacyRenderer(repoRoot, code) === "GENERIC") result.add(code);
  }
  return result;
}

async function collectDatabaseState(repoRoot, codes) {
  loadEnvFile(join(repoRoot, ".env"));
  loadEnvFile(join(repoRoot, "apps", "api", ".env"), true);
  const requireFromApi = createRequire(join(repoRoot, "apps", "api", "package.json"));
  const { PrismaClient } = requireFromApi("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const templates = await prisma.templates.findMany({
      where: { template_code: { in: codes } },
      include: {
        template_versions: {
          where: { is_active: true },
          orderBy: [{ is_default: "desc" }, { version_no: "desc" }],
        },
        form_contract_versions: {
          orderBy: [{ updated_at: "desc" }, { version_no: "desc" }],
        },
      },
    });
    return new Map(templates.map((template) => [template.template_code, template]));
  } finally {
    await prisma.$disconnect();
  }
}

function applyDatabaseState(rows, databaseByCode) {
  for (const row of rows) {
    const template = databaseByCode.get(row.code);
    row.dbTemplateId = template ? String(template.id) : null;
    row.agencyStatus =
      template?.form_contract_versions.find((version) => version.agency_id !== null)
        ?.status ?? "NONE";
    const agencyPublished = template?.form_contract_versions.find(
      (version) =>
        version.agency_id !== null &&
        version.status === "PUBLISHED" &&
        version.compiled_json,
    );
    const globalPublished = template?.form_contract_versions.find(
      (version) =>
        version.agency_id === null &&
        version.status === "PUBLISHED" &&
        version.compiled_json,
    );
    row.runtimeSource = agencyPublished
      ? "AGENCY_PUBLISHED"
      : globalPublished
        ? "GLOBAL_PUBLISHED"
        : row.contract?.status === "locked"
          ? "LOCKED_FILE"
          : row.rendererKind === "BESPOKE"
            ? "LEGACY_BESPOKE"
            : "GENERIC_FALLBACK";

    if (!template) {
      row.issues.push("MISSING_DB_TEMPLATE");
      continue;
    }
    const activeVersion = template.template_versions[0];
    if (!activeVersion?.normalized_docx_path) {
      row.issues.push("MISSING_DB_NORMALIZED_DOCX");
    }
  }
}

function loadContracts(repoRoot) {
  const contractsRoot = join(repoRoot, "docs", "audit", "docx", "contracts");
  const byCode = new Map();
  for (const filePath of walk(contractsRoot)) {
    const match = basename(filePath).match(CONTRACT_RE);
    if (!match) continue;
    const json = JSON.parse(readFileSync(filePath, "utf8"));
    if (json.documentKind === "reference") continue;
    const entry = {
      filePath,
      sourceId: json.sourceId,
      templateCode: json.templateCode,
      title: json.templateTitle ?? json.title ?? json.templateCode,
      status: json.status,
      extractionSource: json.extractionSource ?? null,
      docxSlots: json.docxSlots ?? [],
      canonicalFields: json.canonicalFields ?? [],
      renderBindings: json.renderBindings ?? [],
    };
    const current = byCode.get(entry.templateCode) ?? [];
    current.push(entry);
    byCode.set(entry.templateCode, current);
  }
  return byCode;
}

function inspectLegacyRenderer(repoRoot, code) {
  const filePath = join(
    repoRoot,
    "apps",
    "web",
    "src",
    "components",
    "documents",
    `${code.toLowerCase()}-form-inputs.tsx`,
  );
  if (!existsSync(filePath)) return "MISSING";
  return readFileSync(filePath, "utf8").includes("GenericTemplateFormInputsPanel")
    ? "GENERIC"
    : "BESPOKE";
}

function countUnknown(fields) {
  return fields.filter(
    (field) =>
      !field.source ||
      field.source === "unknown" ||
      /^\w+\.field\d+$/iu.test(field.path ?? ""),
  ).length;
}

function* walk(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(filePath);
    else yield filePath;
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function portable(value) {
  return value.split("\\").join("/");
}

function loadEnvFile(filePath, override = false) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || !process.env[key]) process.env[key] = value;
  }
}

function outputRows(rows, repoRoot, selection) {
  const outDir = join(repoRoot, "docs", "audit", "form-authoring-baselines");
  mkdirSync(outDir, { recursive: true });
  const suffix = selection ? `selection-${selection.join("-")}` : "matrix";
  const csvPath = join(outDir, `${suffix}.csv`);
  const mdPath = join(
    outDir,
    selection ? `${suffix}.md` : "audited.md",
  );
  const columns = [
    "BM",
    "DOCX",
    "Base grade",
    "Fields",
    "Bindings",
    "Unknown",
    "Review required",
    "Bespoke/Generic",
    "Agency status",
    "Runtime source",
    "Source ID",
    "Alternate sources",
    "Warnings",
    "Issues",
  ];
  const values = rows.map((row) => [
    row.code,
    row.normalizedExists ? "YES" : "NO",
    row.grade,
    row.fieldCount,
    row.bindingCount,
    row.unknownCount,
    row.reviewRequiredCount,
    row.rendererKind,
    row.agencyStatus ?? "NONE",
    row.runtimeSource ?? "UNAVAILABLE",
    row.contract?.sourceId ?? "",
    row.alternateSourceIds.join(" | "),
    row.warnings.join(" | "),
    row.issues.join(" | "),
  ]);
  writeFileSync(
    csvPath,
    [columns, ...values]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n"),
    "utf8",
  );

  const failed = rows.filter((row) => row.issues.length > 0);
  const md = [
    "# Form Authoring Baselines Audit",
    "",
    "Snapshot: deterministic from current repository state",
    "",
    `- Scope: ${selection ? selection.join(", ") : "BM-001..BM-213"}`,
    `- Rows: ${rows.length}`,
    `- Normalized DOCX: ${rows.filter((row) => row.normalizedExists).length}/${rows.length}`,
    `- Authoring baseline resolved: ${rows.filter((row) => row.issues.length === 0).length}/${rows.length}`,
    `- LOCKED_VERIFIED: ${rows.filter((row) => row.grade === "LOCKED_VERIFIED").length}`,
    `- EXTRACTED_NEEDS_REVIEW: ${rows.filter((row) => row.grade === "EXTRACTED_NEEDS_REVIEW").length}`,
    `- GENERIC_FALLBACK: ${rows.filter((row) => row.grade === "GENERIC_FALLBACK").length}`,
    `- Compile/refinement warnings: ${rows.filter((row) => row.warnings.length > 0).length}`,
    "",
    "This report proves authoring coverage and provenance. It does not certify legal or semantic correctness.",
    "",
    "## Findings",
    "",
    ...(failed.length === 0
      ? ["- PASS: no structural baseline blockers."]
      : failed.map((row) => `- ${row.code}: ${row.issues.join(", ")}`)),
    "",
    `CSV: ${relative(repoRoot, csvPath)}`,
  ];
  writeFileSync(mdPath, md.join("\n"), "utf8");
  return { csvPath, mdPath, failed };
}

async function main() {
  const repoRoot = DEFAULT_REPO_ROOT;
  const selected = parseSelectedCodes(process.argv.slice(2));
  const allRows = collectFilesystemRows(repoRoot);
  if (allRows.length !== 213) {
    throw new Error(`Expected 213 canonical rows, received ${allRows.length}.`);
  }
  const requested = selected
    ? allRows.filter((row) => selected.includes(row.code))
    : allRows;
  if (selected && requested.length !== selected.length) {
    throw new Error("One or more selected BM codes are outside BM-001..BM-213.");
  }

  await validateAdaptedBaselines(requested, repoRoot);
  const database = await collectDatabaseState(
    repoRoot,
    requested.map((row) => row.code),
  );
  applyDatabaseState(requested, database);

  const actualGeneric = actualGenericRendererCodes(repoRoot);
  const generatedGeneric = generatedRendererManifestCodes(repoRoot);
  const manifestMismatch = [
    ...[...actualGeneric].filter((code) => !generatedGeneric.has(code)),
    ...[...generatedGeneric].filter((code) => !actualGeneric.has(code)),
  ];
  if (manifestMismatch.length > 0) {
    for (const row of requested) {
      if (manifestMismatch.includes(row.code)) {
        row.issues.push("LEGACY_RENDERER_MANIFEST_STALE");
      }
    }
  }

  const bm139 = allRows.find((row) => row.code === "BM-139");
  if (
    !bm139?.contract ||
    bm139.contract.sourceId !== "BM-139__23306e6022bd" ||
    !bm139.alternateSourceIds.includes("BM-139__9795f14f931c")
  ) {
    throw new Error("BM-139 canonical/alternate source policy is not deterministic.");
  }

  const result = outputRows(requested, repoRoot, selected);
  console.log("=== audit:form-authoring-baselines ===");
  console.log(`Scope: ${selected ? selected.join(", ") : "213 canonical forms"}`);
  console.log(`Resolved: ${requested.length - result.failed.length}/${requested.length}`);
  console.log(`Report: ${relative(repoRoot, result.mdPath)}`);
  console.log(`Matrix: ${relative(repoRoot, result.csvPath)}`);
  if (result.failed.length > 0) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? "") === resolve(THIS_FILE)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
