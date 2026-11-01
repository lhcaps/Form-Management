#!/usr/bin/env node
/**
 * Content-based maturity audit for the 213 template-runtime form profiles.
 *
 * Default mode is read-only and prints JSON to stdout. `--write-report` is an
 * explicit opt-in for refreshing the audit artifact; neither mode mutates a
 * DOCX contract, a runtime-ux profile, a lifecycle decision, or a registry.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(process.cwd());
const COMPILED_DIR = join(ROOT, "docs", "audit", "docx", "compiled-v2");
const PROFILES_DIR = join(ROOT, "apps", "web", "src", "lib", "runtime-ux");
const PROFILE_INDEX = join(PROFILES_DIR, "index.ts");
const RUNTIME_READY_POLICY = join(
  ROOT,
  "packages",
  "form-contracts",
  "src",
  "bridge-eligibility.ts",
);
const PROVENANCE_PATH = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md",
);
const REFERENCE_PROFILE_CODES = new Set(["BM-001", "BM-171"]);
const APPROVED_REFERENCE_PRESENTATION_EXCEPTIONS = new Map([
  [
    "BM-171",
    new Set(["section-noi-dung-quyet-inh"]),
  ],
]);
const REPORT_PATH = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_213_SEMANTIC_UI_MATURITY.latest.json",
);

const WRITE_REPORT = process.argv.includes("--write-report");
const CHECK = process.argv.includes("--check") || !WRITE_REPORT;
const codesIndex = process.argv.indexOf("--codes");
const REQUESTED_CODES = codesIndex < 0
  ? null
  : String(process.argv[codesIndex + 1] ?? "")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);

function readUtf8(path) {
  return readFileSync(path, "utf8");
}

function listCompiledCodes() {
  return readdirSync(COMPILED_DIR)
    .map((file) => /^BM-(\d{3})\.compiled\.json$/.exec(file))
    .filter(Boolean)
    .map((match) => `BM-${match[1]}`)
    .sort();
}

function listProfileCodes() {
  return readdirSync(PROFILES_DIR)
    .map((file) => /^bm(\d{3})-runtime-ux-profile\.ts$/.exec(file))
    .filter(Boolean)
    .map((match) => `BM-${match[1]}`)
    .sort();
}

function listIndexImports() {
  const source = readUtf8(PROFILE_INDEX);
  const imports = [];
  const pattern = /import\s+["']\.\/bm(\d{3})-runtime-ux-profile["'];?/gu;
  for (const match of source.matchAll(pattern)) imports.push(`BM-${match[1]}`);
  return imports;
}

function parseRuntimeReadyCodes() {
  const source = readUtf8(RUNTIME_READY_POLICY);
  const match = source.match(
    /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/u,
  );
  if (!match) throw new Error("Cannot parse STANDALONE_RUNTIME_TEMPLATE_CODES");
  return [...match[1].matchAll(/["'](BM-\d{3})["']/gu)]
    .map((item) => item[1])
    .sort();
}

function listProvenanceCodes() {
  if (!existsSync(PROVENANCE_PATH)) return [];
  return [...readUtf8(PROVENANCE_PATH).matchAll(/^\|\s*(BM-\d{3})\s*\|/gmu)]
    .map((match) => match[1])
    .sort();
}

function isApprovedReferenceDescriptionOmission(code, sectionId) {
  return APPROVED_REFERENCE_PRESENTATION_EXCEPTIONS.get(code)?.has(sectionId) ?? false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractBalancedObject(source, objectStart) {
  const open = source.indexOf("{", objectStart);
  if (open < 0) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return null;
}

function stringProperty(body, property) {
  if (!body) return null;
  const pattern = new RegExp(
    `${escapeRegExp(property)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`,
    "u",
  );
  return pattern.exec(body)?.[2]?.trim() ?? null;
}

function extractSection(source, sectionId) {
  const marker = new RegExp(
    `sectionId\\s*:\\s*["']${escapeRegExp(sectionId)}["']`,
    "u",
  );
  const match = marker.exec(source);
  if (!match) return null;
  const body = extractBalancedObject(source, source.lastIndexOf("{", match.index));
  return {
    sectionId,
    title: stringProperty(body, "title"),
    description: stringProperty(body, "description"),
  };
}

function extractField(source, fieldKey) {
  const marker = new RegExp(
    `["']${escapeRegExp(fieldKey)}["']\\s*:\\s*\\{`,
    "u",
  );
  const match = marker.exec(source);
  if (!match) return null;
  const body = extractBalancedObject(source, match.index);
  return {
    fieldKey,
    label: stringProperty(body, "label"),
    placeholder: stringProperty(body, "placeholder"),
    control: stringProperty(body, "control"),
  };
}

function extractBalancedArray(source, arrayStart) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart + 1, index);
    }
  }
  return null;
}

function extractPresentationSections(source) {
  const marker = /presentationSections\s*:\s*(\[|[A-Za-z][A-Za-z0-9_]*)/u.exec(source);
  if (!marker) return null;
  const arrayStart = marker[1] === "["
    ? source.indexOf("[", marker.index)
    : source.search(
      new RegExp(
        `const\\s+${escapeRegExp(marker[1])}\\s*=\\s*\\[`,
        "u",
      ),
    );
  const resolvedArrayStart = arrayStart < 0 ? -1 : source.indexOf("[", arrayStart);
  const body = resolvedArrayStart < 0 ? null : extractBalancedArray(source, resolvedArrayStart);
  if (body === null) return [];

  const sections = [];
  for (const match of body.matchAll(/\{([\s\S]*?)\}/gu)) {
    const entry = match[1];
    const fieldKeysMatch = /fieldKeys\s*:\s*\[([\s\S]*?)\]/u.exec(entry);
    if (!fieldKeysMatch) continue;
    sections.push({
      id: stringProperty(entry, "id"),
      title: stringProperty(entry, "title"),
      description: stringProperty(entry, "description"),
      fieldKeys: [...fieldKeysMatch[1].matchAll(/["']([^"']+)["']/gu)].map(
        (field) => field[1],
      ),
    });
  }
  return sections;
}

function isTechnicalHeading(value) {
  if (!value) return true;
  const normalized = value.trim();
  return /^[a-z][a-zA-Z0-9_-]*$/u.test(normalized)
    || normalized.toLowerCase() === "thông tin bổ sung"
    || normalized.toLowerCase() === "thã´ng tin bá»• sung";
}

function isTechnicalLabel(value, fieldKey) {
  if (!value) return true;
  const normalized = value.trim();
  return normalized === fieldKey
    || /^[a-z][a-zA-Z0-9_.-]*$/u.test(normalized);
}

function hasGeneratedMarker(source) {
  const contentBlocks = [];
  const declaration = /const\s+BM\d{3}_(?:FIELDS|DEMO(?:_RUNTIME_UX)?)\s*=\s*\{/gu;
  for (const match of source.matchAll(declaration)) {
    const body = extractBalancedObject(source, match.index);
    if (body) contentBlocks.push(body);
  }
  return contentBlocks.some((body) => /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(body));
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ code: value, count }))
    .sort((left, right) => left.code.localeCompare(right.code));
}

function auditForm(code, registeredCodes, runtimeReadyCodes, provenanceCodes) {
  const profilePath = join(PROFILES_DIR, `bm${code.slice(3)}-runtime-ux-profile.ts`);
  const compiledPath = join(COMPILED_DIR, `${code}.compiled.json`);
  const compiled = JSON.parse(readUtf8(compiledPath));
  const sections = Array.isArray(compiled.source?.sections) ? compiled.source.sections : [];
  const fields = Array.isArray(compiled.source?.fields) ? compiled.source.fields : [];
  const issues = [];
  const approvedReferencePresentationExceptions = [];

  if (!existsSync(profilePath)) {
    issues.push({ code: "PROFILE_MISSING", detail: profilePath });
  }
  if (!registeredCodes.has(code)) {
    issues.push({ code: "PROFILE_NOT_REGISTERED", detail: code });
  }

  const profile = existsSync(profilePath) ? readUtf8(profilePath) : "";
  const profileSectionIds = [...profile.matchAll(/sectionId\s*:\s*["']([^"']+)["']/gu)]
    .map((match) => match[1]);
  const compiledSectionIds = new Set(sections.map((section) => section.id).filter(Boolean));

  for (const sectionId of profileSectionIds) {
    if (!compiledSectionIds.has(sectionId)) {
      issues.push({ code: "SECTION_NOT_IN_CONTRACT", sectionId });
    }
  }

  for (const section of sections) {
    if (!section.id) continue;
    const metadata = extractSection(profile, section.id);
    if (!metadata) {
      issues.push({ code: "CONTRACT_SECTION_UNREPRESENTED", sectionId: section.id });
      continue;
    }
    if (isTechnicalHeading(metadata.title)) {
      issues.push({
        code: "TECHNICAL_SECTION_TITLE",
        sectionId: section.id,
        value: metadata.title,
      });
    }
    if (!metadata.description) {
      if (isApprovedReferenceDescriptionOmission(code, section.id)) {
        approvedReferencePresentationExceptions.push({
          code: "DESCRIPTION_OMITTED",
          sectionId: section.id,
        });
      } else {
        issues.push({ code: "SECTION_DESCRIPTION_MISSING", sectionId: section.id });
      }
    }
  }

  for (const field of fields) {
    if (!field.key) continue;
    const metadata = extractField(profile, field.key);
    if (!metadata) {
      issues.push({ code: "FIELD_OVERRIDE_MISSING", fieldKey: field.key });
      continue;
    }
    if (isTechnicalLabel(metadata.label, field.key)) {
      issues.push({
        code: "TECHNICAL_FIELD_LABEL",
        fieldKey: field.key,
        value: metadata.label,
      });
    }
  }

  const presentationSections = extractPresentationSections(profile);
  let presentationLayout = { status: "ABSENT", sectionCount: 0 };
  if (presentationSections !== null) {
    const contractFieldKeys = new Set(fields.map((field) => field.key).filter(Boolean));
    const seenSectionIds = new Set();
    const seenFieldKeys = new Set();
    let valid = presentationSections.length > 0;

    for (const section of presentationSections) {
      if (!section.id || !section.title || !section.description || seenSectionIds.has(section.id)) {
        valid = false;
        issues.push({ code: "PRESENTATION_SECTION_INVALID", sectionId: section.id ?? null });
      }
      if (section.id) seenSectionIds.add(section.id);
      for (const fieldKey of section.fieldKeys) {
        if (!contractFieldKeys.has(fieldKey)) {
          valid = false;
          issues.push({ code: "PRESENTATION_FIELD_NOT_IN_CONTRACT", fieldKey });
        } else if (seenFieldKeys.has(fieldKey)) {
          valid = false;
          issues.push({ code: "PRESENTATION_FIELD_DUPLICATED", fieldKey });
        }
        seenFieldKeys.add(fieldKey);
      }
    }
    for (const fieldKey of contractFieldKeys) {
      if (!seenFieldKeys.has(fieldKey)) {
        valid = false;
        issues.push({ code: "PRESENTATION_FIELD_MISSING", fieldKey });
      }
    }
    presentationLayout = {
      status: valid ? "PASS" : "INVALID",
      sectionCount: presentationSections.length,
    };
  }

  if (hasGeneratedMarker(profile)) {
    issues.push({ code: "GENERATED_MARKER_PRESENT", detail: "profile source contains a generated placeholder marker" });
  }

  return {
    templateCode: code,
    title: compiled.title ?? null,
    inputLinkage: {
      status: existsSync(profilePath) && registeredCodes.has(code) ? "PASS" : "FAIL",
      profileExists: existsSync(profilePath),
      registered: registeredCodes.has(code),
    },
    semanticUi: {
      status: issues.length === 0 ? "PASS" : "INCOMPLETE",
      contractSectionCount: sections.length,
      contractFieldCount: fields.length,
      profileSectionCount: profileSectionIds.length,
      profileFieldOverrideCount: fields.filter((field) => field.key && extractField(profile, field.key)).length,
      presentationLayout,
      approvedReferencePresentationExceptions,
      issues,
    },
    runtimeReadiness: {
      status: runtimeReadyCodes.includes(code) ? "RUNTIME_READY" : "NOT_PROMOTED",
    },
    docxLegalFidelity: { status: "NOT_ASSESSED" },
    provenance: {
      status: provenanceCodes.has(code) ? "PRESENT" : "MISSING",
      evidenceKind: REFERENCE_PROFILE_CODES.has(code) ? "REFERENCE" : "CURATION",
    },
  };
}

function main() {
  if (!existsSync(COMPILED_DIR) || !existsSync(PROFILES_DIR) || !existsSync(PROFILE_INDEX)) {
    throw new Error("Required compiled-contract or runtime-ux directories are missing");
  }

  const compiledCodes = listCompiledCodes();
  const profileCodes = listProfileCodes();
  const imports = listIndexImports();
  const registeredCodes = new Set(imports);
  const runtimeReadyCodes = parseRuntimeReadyCodes();
  const provenanceEntries = listProvenanceCodes();
  const provenanceCodes = new Set(provenanceEntries);
  const requested = REQUESTED_CODES ? [...new Set(REQUESTED_CODES)].sort() : compiledCodes;

  const unknown = requested.filter((code) => !compiledCodes.includes(code));
  if (unknown.length > 0) throw new Error(`Unknown compiled template code(s): ${unknown.join(", ")}`);

  const forms = requested.map((code) =>
    auditForm(code, registeredCodes, runtimeReadyCodes, provenanceCodes),
  );
  const duplicateImports = duplicateValues(imports);
  const provenanceDuplicateCodes = duplicateValues(provenanceEntries);
  const report = {
    auditVersion: "1.0.0",
    snapshotDate: new Date().toISOString(),
    mode: CHECK ? "CHECK" : "WRITE_REPORT",
    summary: {
      total: forms.length,
      semanticPass: forms.filter((form) => form.semanticUi.status === "PASS").length,
      semanticIncomplete: forms.filter((form) => form.semanticUi.status !== "PASS").length,
      inputLinkagePass: forms.filter((form) => form.inputLinkage.status === "PASS").length,
      provenancePresent: forms.filter((form) => form.provenance.status === "PRESENT").length,
      provenanceMissing: forms.filter((form) => form.provenance.status !== "PRESENT").length,
      provenanceDuplicateCodes,
      runtimeReady: runtimeReadyCodes,
      compiledCodes,
      profileCodes,
      registeredCodes: [...registeredCodes].sort(),
      duplicateImports,
    },
    forms,
  };

  if (WRITE_REPORT) {
    mkdirSync(resolve(REPORT_PATH, ".."), { recursive: true });
    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
