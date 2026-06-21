import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

import PizZip from "pizzip";

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}|\{([^{}]{3,})\}\}/g;
const GENERIC_FIELD_PATTERN = /\.[Ff]ield\d+$/u;
const MUTABLE_PACKAGE_PARTS = new Set([
  "[Content_Types].xml",
  "word/document.xml",
]);

function portable(value) {
  return value.split("\\").join("/");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function plainTextFromXml(value) {
  return decodeXml(value.replace(/<[^>]+>/gu, ""));
}

function normalizedDocxPath(repoRoot, code) {
  return join(
    repoRoot,
    "storage",
    "templates",
    "normalized-docx",
    code,
    `${code}_normalized.docx`,
  );
}

function profilePath(repoRoot, code) {
  return join(
    repoRoot,
    "scripts",
    "form-refinement",
    "profiles",
    `${code}.json`,
  );
}

function slotTypeFor(field) {
  if (field.slotType) return field.slotType;
  if (field.uiComponent === "textarea") return "multilineText";
  if (field.uiComponent === "date") return "date";
  if (field.uiComponent === "number") return "number";
  if (field.uiComponent === "table") return "table";
  if (field.path.startsWith("signature.")) return "signature";
  return "text";
}

function evidenceFor(context, path) {
  const rawPattern = `{{${path}}}`;
  const index = context.indexOf(rawPattern);
  if (index < 0) {
    return { textBefore: "", textAfter: "", rawPattern };
  }
  return {
    textBefore: context.slice(Math.max(0, index - 120), index).trim(),
    textAfter: context
      .slice(index + rawPattern.length, index + rawPattern.length + 120)
      .trim(),
    rawPattern,
  };
}

function inspectPackageIntegrity(templateBuffer, renderedBuffer) {
  const templateZip = new PizZip(templateBuffer);
  const renderedZip = new PizZip(renderedBuffer);
  const missingParts = [];
  const changedPreservedParts = [];

  for (const templatePart of Object.values(templateZip.files).filter(
    (part) => !part.dir,
  )) {
    const renderedPart = renderedZip.file(templatePart.name);
    if (!renderedPart) {
      missingParts.push(templatePart.name);
      continue;
    }
    if (
      !MUTABLE_PACKAGE_PARTS.has(templatePart.name) &&
      !templatePart.asNodeBuffer().equals(renderedPart.asNodeBuffer())
    ) {
      changedPreservedParts.push(templatePart.name);
    }
  }

  return {
    status:
      missingParts.length === 0 && changedPreservedParts.length === 0
        ? "pass"
        : "fail",
    missingParts,
    changedPreservedParts,
  };
}

export function parseSelectedCodes(argv) {
  const inline = argv.find((arg) => arg.startsWith("--codes="));
  const index = argv.indexOf("--codes");
  const raw =
    inline?.slice("--codes=".length) ?? (index >= 0 ? argv[index + 1] : "");
  if (!raw) return [];

  const codes = [
    ...new Set(raw.split(/[,\s]+/u).map((value) => value.trim()).filter(Boolean)),
  ];
  const invalid = codes.filter((code) => !/^BM-\d{3}$/u.test(code));
  if (invalid.length > 0) {
    throw new Error(`Invalid BM code(s): ${invalid.join(", ")}`);
  }
  return codes.sort();
}

export function formatRefinementEvidenceMarkdown({
  codes,
  overallStatus,
  results,
}) {
  const lines = [
    "# Form Refinement Evidence",
    "",
    `- Scope: ${codes.join(", ")}`,
    `- Status: **${overallStatus}**`,
    "- Lifecycle: draft / review-required; this report does not grant human legal approval.",
    "- LibreOffice visual QA: not run because LibreOffice/soffice is unavailable; Microsoft Word visual QA is recorded separately when available.",
    "",
    "| BM | Fields | Bindings | Compile | Package | Unresolved placeholders | Missing samples | Literal leakage |",
    "|---|---:|---:|---|---|---:|---:|---:|",
    ...results.map(
      (result) =>
        `| ${result.code} | ${result.fields} | ${result.bindings} | ${result.compile.ok ? "PASS" : "FAIL"} | ${result.packageIntegrity.status.toUpperCase()} | ${result.unresolvedPlaceholders.length} | ${result.missingSampleValues.length} | ${result.literalLeakage.length} |`,
    ),
    "",
    "## Per-form provenance",
    "",
  ];

  results.forEach((result, index) => {
    lines.push(
      `### ${result.code}`,
      "",
      `- Normalized DOCX: \`${result.normalizedDocxPath}\``,
      `- SHA256: \`${result.normalizedDocxSha256}\``,
      `- Result: **${result.status}**`,
    );
    if (result.previewArtifact) {
      lines.push(
        `- Preview DOCX: \`${result.previewArtifact.relativePath}\``,
        `- Preview SHA256: \`${result.previewArtifact.sha256}\``,
        `- Preview bytes: ${result.previewArtifact.byteSize}`,
      );
    }
    if (index < results.length - 1) lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

export function findContractFile(repoRoot, code) {
  const contractsDir = join(repoRoot, "docs", "audit", "docx", "contracts");
  const matches = readdirSync(contractsDir).filter(
    (fileName) =>
      fileName.startsWith(`${code}__`) &&
      fileName.endsWith(".contract.draft.json"),
  );
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one draft contract for ${code}, found ${matches.length}.`,
    );
  }
  return matches[0];
}

export function loadRefinementProfile(repoRoot, code) {
  const filePath = profilePath(repoRoot, code);
  if (!existsSync(filePath)) {
    throw new Error(`Missing refinement profile for ${code}: ${filePath}`);
  }
  const profile = JSON.parse(readFileSync(filePath, "utf8"));
  if (profile.templateCode !== code || !profile.fields) {
    throw new Error(`Invalid refinement profile for ${code}.`);
  }
  return profile;
}

export function discoverNormalizedPlaceholders(repoRoot, code) {
  const filePath = normalizedDocxPath(repoRoot, code);
  if (!existsSync(filePath)) {
    throw new Error(`Missing normalized DOCX for ${code}: ${filePath}`);
  }
  const buffer = readFileSync(filePath);
  const zip = new PizZip(buffer);
  const documentXml = zip.file("word/document.xml")?.asText() ?? "";
  if (!documentXml) {
    throw new Error(`${code} normalized DOCX has no word/document.xml.`);
  }

  const orderedPaths = [];
  const occurrencesByPath = new Map();
  const paragraphs = [
    ...documentXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/gu),
  ];
  paragraphs.forEach((match, index) => {
    const context = plainTextFromXml(match[0]).replace(/\s+/gu, " ").trim();
    for (const placeholder of context.matchAll(PLACEHOLDER_PATTERN)) {
      const path = (placeholder[1] ?? placeholder[2] ?? "").trim();
      if (!path) continue;
      if (!occurrencesByPath.has(path)) {
        orderedPaths.push(path);
        occurrencesByPath.set(path, []);
      }
      occurrencesByPath.get(path).push({
        blockId: `P${String(index + 1).padStart(4, "0")}`,
        context,
      });
    }
  });

  return {
    code,
    filePath,
    relativePath: portable(relative(repoRoot, filePath)),
    sha256: sha256(buffer),
    buffer,
    documentXml,
    orderedPaths,
    occurrencesByPath,
  };
}

export function validateProfileParity(profile, discovery) {
  const profilePaths = Object.keys(profile.fields);
  const placeholderSet = new Set(discovery.orderedPaths);
  const profileSet = new Set(profilePaths);
  const issues = [];

  for (const path of discovery.orderedPaths) {
    if (!profileSet.has(path)) issues.push(`PROFILE_MISSING_FIELD:${path}`);
  }
  for (const path of profilePaths) {
    if (!placeholderSet.has(path)) issues.push(`PROFILE_EXTRA_FIELD:${path}`);
  }
  if (
    issues.length === 0 &&
    profilePaths.some((path, index) => path !== discovery.orderedPaths[index])
  ) {
    issues.push("PROFILE_FIELD_ORDER_MISMATCH");
  }
  return issues;
}

export function buildRefinedContract({
  code,
  profile,
  discovery,
  contract,
}) {
  if (contract.status !== "draft") {
    throw new Error(`${code} contract is ${contract.status}; only draft can refine.`);
  }
  const parityIssues = validateProfileParity(profile, discovery);
  if (parityIssues.length > 0) {
    throw new Error(`${code} profile mismatch: ${parityIssues.join(", ")}`);
  }

  const docxSlots = discovery.orderedPaths.map((path) => {
    const field = profile.fields[path];
    const occurrence = discovery.occurrencesByPath.get(path)?.[0];
    return {
      slotId: path,
      location: {
        partName: "word/document.xml",
        blockId: occurrence?.blockId ?? "P0000",
        tableCellId: null,
      },
      context: occurrence?.context ?? `{{${path}}}`,
      label: field.label,
      slotType: slotTypeFor({ ...field, path }),
      required: Boolean(field.required),
      confidence: 1,
      evidence: evidenceFor(occurrence?.context ?? "", path),
      reviewRequired: true,
    };
  });
  const canonicalFields = discovery.orderedPaths.map((path) => {
    const field = profile.fields[path];
    const cf = {
      path,
      type: field.type ?? "string",
      label: field.label,
      source: "unknown",
      required: Boolean(field.required),
      uiComponent: field.uiComponent,
      section: field.section,
      reviewRequired: true,
    };
    if (field.uiComponent === "select" && field.options) {
      cf.options = field.options;
    }
    return cf;
  });
  const renderBindings = discovery.orderedPaths.map((path) => ({
    slotId: path,
    from: path,
    transform: "identity",
    fallback: "",
    reviewRequired: true,
  }));
  const warning =
    "Refined from normalized DOCX semantic placeholders; human semantic/legal review is still required.";
  const warnings = [
    ...(contract.warnings ?? []).filter(
      (value) =>
        value !== warning && !value.startsWith("Clx parse error:"),
    ),
    warning,
  ];

  return {
    ...contract,
    extractionSource: {
      kind: "normalized-docx",
      relativePath: discovery.relativePath,
      sha256: discovery.sha256,
      format: "docx",
    },
    docxSlots,
    canonicalFields,
    renderBindings,
    unresolvedQuestions: [...(profile.unresolvedQuestions ?? [])],
    warnings,
    formInputHints: {
      ...(contract.formInputHints ?? {}),
      primaryEntities: [
        ...new Set(discovery.orderedPaths.map((path) => path.split(".")[0])),
      ],
      suggestedControls: canonicalFields.map((field) => ({
        path: field.path,
        control: field.uiComponent,
      })),
      previewRequired: true,
      reviewRequired: true,
    },
  };
}

export function prepareContractRefinement(repoRoot, code) {
  const contractFileName = findContractFile(repoRoot, code);
  const contractPath = join(
    repoRoot,
    "docs",
    "audit",
    "docx",
    "contracts",
    contractFileName,
  );
  const original = JSON.parse(readFileSync(contractPath, "utf8"));
  const profile = loadRefinementProfile(repoRoot, code);
  const discovery = discoverNormalizedPlaceholders(repoRoot, code);
  const refined = buildRefinedContract({
    code,
    profile,
    discovery,
    contract: original,
  });
  return {
    code,
    contractPath,
    contractFileName,
    profile,
    discovery,
    original,
    refined,
  };
}

export function renderRefinementPreview({ repoRoot, code, profile }) {
  const discovery = discoverNormalizedPlaceholders(repoRoot, code);
  const parityIssues = validateProfileParity(profile, discovery);
  if (parityIssues.length > 0) {
    throw new Error(`${code} profile mismatch: ${parityIssues.join(", ")}`);
  }

  const requireFromApi = createRequire(join(repoRoot, "apps", "api", "package.json"));
  const Docxtemplater = requireFromApi("docxtemplater");
  const TemplatePizZip = requireFromApi("pizzip");
  const data = Object.fromEntries(
    discovery.orderedPaths.map((path) => [path, profile.fields[path].sample]),
  );
  const document = new Docxtemplater(new TemplatePizZip(discovery.buffer), {
    delimiters: { start: "{{", end: "}}" },
    linebreaks: true,
    paragraphLoop: true,
  });
  document.render(data);
  const renderedBuffer = document.getZip().generate({ type: "nodebuffer" });
  const renderedZip = new PizZip(renderedBuffer);
  const renderedXml = renderedZip.file("word/document.xml")?.asText() ?? "";
  const renderedText = plainTextFromXml(renderedXml).replace(/\s+/gu, " ").trim();
  const unresolvedPlaceholders = [
    ...new Set(
      [...renderedText.matchAll(PLACEHOLDER_PATTERN)].map((match) =>
        match[1].trim(),
      ),
    ),
  ].sort();
  const missingSampleValues = discovery.orderedPaths.filter((path) => {
    const sample = String(profile.fields[path].sample ?? "").trim();
    return sample.length > 0 && !renderedText.includes(sample);
  });
  const literalLeakage = [
    ...new Set(renderedText.match(/\b(?:undefined|null)\b/giu) ?? []),
  ].sort();

  return {
    code,
    renderedBuffer,
    renderedText,
    unresolvedPlaceholders,
    missingSampleValues,
    literalLeakage,
    packageIntegrity: inspectPackageIntegrity(
      discovery.buffer,
      renderedBuffer,
    ),
  };
}

export function writeRefinementPreviewArtifact({
  repoRoot,
  outputRoot,
  batchName,
  code,
  renderedBuffer,
}) {
  if (!Buffer.isBuffer(renderedBuffer) || renderedBuffer.length === 0) {
    throw new Error(`${code} preview buffer is empty or invalid.`);
  }
  const zip = new PizZip(renderedBuffer);
  if (!zip.file("word/document.xml")) {
    throw new Error(`${code} preview is not a complete DOCX package.`);
  }

  const outputDir = join(outputRoot, batchName);
  const filePath = join(outputDir, `${code}-preview.docx`);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(filePath, renderedBuffer);

  return {
    filePath,
    relativePath: portable(relative(repoRoot, filePath)),
    sha256: sha256(renderedBuffer),
    byteSize: renderedBuffer.length,
  };
}

export function resolveRepoRoot(from = process.cwd()) {
  return resolve(from);
}

export function isGenericFieldPath(path) {
  return GENERIC_FIELD_PATTERN.test(path);
}
