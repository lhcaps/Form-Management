#!/usr/bin/env node
/**
 * generate-runtime-ux-profiles.mjs
 *
 * Generates ONE conservative runtime-ux profile per BM-NNN that does NOT
 * already have one. The generator reads the compiled contract and produces a
 * file under `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts` that:
 *
 *   - registers a populated `RuntimeUxProfile` (so `getRuntimeUxProfile` returns
 *     a non-null record for that template code);
 *   - lists the compiled contract sections in order;
 *   - declares a safe `placeholder`-only override for each contract field
 *     (no smart controls by default — smart controls are only added for
 *     high-confidence field-name patterns, and only when the matching
 *     `derivedTargets` are all present in the contract);
 *   - declares a SAFE synthetic Vietnamese demo fixture whose values come
 *     from a deterministic, recognisably-synthetic generator and NEVER
 *     include legacy tokens (`Nguyễn Văn A`, `Trần Thị B`, `1980`,
 *     `Ông  cung cấp`, `Nguyễn Thị Hồng Hạnh`, `undefined`, `null`,
 *     `[object Object]`).
 *
 * The output is intentionally conservative: each generated profile takes the
 * form from "FIDELITY_PENDING / no smart controls" to "INPUT_CONNECTED_PARTIAL
 * / input UI opens, sections labelled, safe demo". Legal fidelity, hand-curated
 * field labels, and per-form golden-render evidence are NOT produced here.
 *
 * Idempotent: re-running the script overwrites the generated files only when
 * `--force` is passed. Otherwise, files that already exist are left untouched
 * (BM-001 and BM-171 are curated manually — the script never overwrites them).
 *
 * Usage:
 *   node scripts/audit/generate-runtime-ux-profiles.mjs            # all missing
 *   node scripts/audit/generate-runtime-ux-profiles.mjs --code BM-005
 *   node scripts/audit/generate-runtime-ux-profiles.mjs --force    # overwrite
 *   node scripts/audit/generate-runtime-ux-profiles.mjs --dry-run   # print + skip
 *
 * Hard refusals in this script:
 *   - Never touches `docs/audit/docx/contracts/locked/*`.
 *   - Never touches `docs/audit/docx/compiled-v2/*`.
 *   - Never touches `docs/audit/docx/normalized-docx/*`.
 *   - Never imports, registers, or promotes any form into
 *     `RUNTIME_READY_FORM_FLIGHT_PROFILES`. The runtime-ready allowlist stays
 *     at exactly BM-001 + BM-171.
 *   - Never creates a `generatedDocumentId`, never calls the generated-
 *     document save endpoint.
 *   - Never writes legacy tokens into a profile.demo fixture.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";

function normalizePath(p) { return p.split(sep).join("/"); }

const ROOT = normalizePath(resolve(process.cwd()));
const COMPILED_DIR = `${ROOT}/docs/audit/docx/compiled-v2`;
const RUNTIME_UX_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const RUNTIME_UX_INDEX = `${RUNTIME_UX_DIR}/index.ts`;

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_CODE = (() => {
  const idx = process.argv.indexOf("--code");
  if (idx < 0) return null;
  const raw = String(process.argv[idx + 1] || "").toUpperCase();
  return /^BM-\d{3}$/.test(raw) ? raw : null;
})();

const CURATED_PROFILES = new Set(["BM-001", "BM-171"]);

const STALE_TOKENS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông  cung cấp",
  "Ông cung cấp",
  "Nguyễn Thị Hồng Hạnh",
];
const PLACEHOLDER_TOKENS = ["undefined", "null", "[object Object]"];

/**
 * Deterministic recognisably-synthetic Vietnamese demo generator.
 * Each value is recognisably synthetic (placeholder value + form code),
 * so it cannot be confused with real PII. The generator also avoids all
 * known stale tokens.
 */
function demoValueForField(field, code) {
  const key = field.key || "";
  const label = field.label || key;
  const tag = ` (mẫu ${code})`;

  // Pattern-based overrides for high-confidence keys.
  if (/(^|\.)issuePlace|dateLine|issueDate/i.test(key)) {
    return `Địa điểm (mẫu ${code}), ngày 04 tháng 3 năm 2026`;
  }
  if (/(^|\.)gender/i.test(label) || /genderText/i.test(key)) {
    return "Nam";
  }
  if (/(^|\.)nationality/i.test(label)) {
    return "Việt Nam";
  }
  if (/(^|\.)religion/i.test(label)) {
    return "Không";
  }
  if (/(^|\.)ethnicity/i.test(label)) {
    return "Kinh";
  }
  if (/(^|\.)archiveLine/i.test(label) || /archive/i.test(key)) {
    return "Lưu: HSVA, HSKS, VP.";
  }
  if (/(^|\.)time/i.test(label) || /TimeText/i.test(key)) {
    return "08 giờ 00 phút";
  }
  if (/(birthYear)/i.test(key)) {
    return "1985";
  }
  if (/(birthDay|birthMonth)/i.test(key)) {
    return "01";
  }
  if (/(startedAtDay|endedAtDay|.*Day)/i.test(key) && /(Date|Ngày)/i.test(label)) {
    return "04";
  }
  if (/(startedAtMonth|endedAtMonth|.*Month)/i.test(key) && /(Tháng)/i.test(label)) {
    return "03";
  }
  if (/(startedAtYear|endedAtYear|.*Year)/i.test(key) && /(Năm)/i.test(label)) {
    return "2026";
  }

  const labelSnippet = label.length > 40 ? label.slice(0, 37) + "…" : label;
  return `${labelSnippet}${tag}`;
}

function sanitizeDemoValue(value) {
  if (typeof value !== "string") return "";
  let trimmed = value.trim();
  for (const tok of STALE_TOKENS) {
    if (trimmed.includes(tok)) {
      trimmed = trimmed.split(tok).join("").trim();
    }
  }
  for (const tok of PLACEHOLDER_TOKENS) {
    if (trimmed === tok) return "";
  }
  if (trimmed === "1980") trimmed = "1985";
  return trimmed;
}

function buildFieldsBlock(fields, code) {
  const lines = [];
  lines.push("const BM<NNN>_FIELDS = {");
  for (const field of fields) {
    const key = field.key;
    if (!key) continue;
    const label = field.label || key;
    const placeholder = demoValueForField({ ...field, label }, code);
    lines.push(`  ${JSON.stringify(key)}: {`);
    lines.push(`    label: ${JSON.stringify(label)},`);
    lines.push(`    placeholder: ${JSON.stringify(placeholder)},`);
    lines.push(`  },`);
  }
  lines.push("} as const;");
  lines.push("");
  return lines.join("\n");
}

function buildSectionsBlock(sections, _code) {
  const lines = [];
  lines.push("const BM<NNN>_SECTIONS = [");
  for (const section of sections) {
    if (!section.id) continue;
    lines.push("  {");
    lines.push(`    sectionId: ${JSON.stringify(section.id)},`);
    lines.push(`    title: ${JSON.stringify(section.title || section.id)},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}

function buildDemoBlock(fields, code) {
  const lines = [];
  lines.push("const BM<NNN>_DEMO_RUNTIME_UX = {");
  for (const field of fields) {
    const key = field.key;
    if (!key) continue;
    let value = demoValueForField(field, code);
    value = sanitizeDemoValue(value);
    if (!value) continue;
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  }
  lines.push("} as const;");
  lines.push("");
  return lines.join("\n");
}

function buildProfile(code, sections, fields, placeholderTitle) {
  // Replace BM<NNN> token with the actual code in the boilerplate above.
  const n = code.slice(3);
  return [
    `/**`,
    ` * Auto-generated runtime-ux profile for ${code}.`,
    ` *`,
    ` * Generated by: scripts/audit/generate-runtime-ux-profiles.mjs`,
    ` * Generator phase: 213-form input linkage, conservative template.`,
    ` *`,
    ` * This profile lifts ${code} from FIDELITY_PENDING (generic`,
    ` * getSampleData fallback) to INPUT_CONNECTED_PARTIAL (route opens,`,
    ` * sections labelled, safe synthetic demo, no smart controls).`,
    ` *`,
    ` * Boundaries honoured here:`,
    ` *   - No mutation of the locked contract, the normalized DOCX, or`,
    ` *     the compiled contract.`,
    ` *   - No DB row creation, no generatedDocumentId fabrication.`,
    ` *   - No call to the generated-document save endpoint.`,
    ` *   - No smart controls emitted. Hand-curated smart controls are`,
    ` *     added by a separate, code-by-code promotion (see BM-001 /`,
    ` *     BM-171 for the reference shape).`,
    ` *   - No legacy stale tokens in demo (Nguyễn Văn A / Trần Thị B /`,
    ` *     1980 / Ông  cung cấp / Nguyễn Thị Hồng Hạnh).`,
    ` *`,
    ` * Promotion to INPUT_CONNECTED_PASS requires:`,
    ` *   - Hand-curated labels for the high-importance fields,`,
    ` *   - Smart controls only where evidence permits,`,
    ` *   - Golden-render + browser smoke evidence.`,
    ` *`,
    ` * See \`QLLAW_FORM_INPUT_LINKAGE_CONTRACT.latest.md\` for the contract`,
    ` * status codex.`,
    ` */`,
    ``,
    `import {`,
    `  type RuntimeUxProfile,`,
    `  registerRuntimeUxProfile,`,
    `} from "./runtime-ux-profile";`,
    ``,
    buildSectionsBlock(sections, code).replace(/BM<NNN>/g, `BM${n}`),
    buildFieldsBlock(fields, code).replace(/BM<NNN>/g, `BM${n}`),
    buildDemoBlock(fields, code).replace(/BM<NNN>/g, `BM${n}`),
    `const BM${n}_RUNTIME_UX_PROFILE: RuntimeUxProfile = {`,
    `  templateCode: ${JSON.stringify(code)},`,
    `  // Stable version label, surfaced in audit artifacts.`,
    `  versionLabel: \`${code} runtime-ux auto-generated conservative profile\`,`,
    `  sections: BM${n}_SECTIONS,`,
    `  fields: BM${n}_FIELDS,`,
    `  demo: BM${n}_DEMO_RUNTIME_UX,`,
    `};`,
    ``,
    `registerRuntimeUxProfile(BM${n}_RUNTIME_UX_PROFILE);`,
    ``,
  ].join("\n");
}

function ensureIndexImport(code) {
  const current = readFileSync(RUNTIME_UX_INDEX, "utf8");
  const n = code.slice(3);
  const expected = `./bm${n}-runtime-ux-profile`;
  // Idempotent: skip if already imported (with or without quotes).
  const re = new RegExp(`from\\s+["']${expected.replace(/\./g, "\\.")}["']`);
  if (re.test(current)) return false;
  const importLine = `import "./bm${n}-runtime-ux-profile";\n`;
  // Insert AFTER the existing BM-001 / BM-171 imports, before the
  // first `export {` line. If the export line is missing for some reason,
  // append at the end.
  const exportRe = /\nexport\s*\{/m;
  const match = exportRe.exec(current);
  let updated;
  if (match) {
    // Find the position right before the export line and append
    // the new import as a single contiguous block (no blank lines).
    updated =
      current.slice(0, match.index) +
      importLine +
      current.slice(match.index);
  } else {
    updated = current + importLine;
  }
  // Collapse any blank lines immediately surrounding the new import
  // to keep the import block tight.
  updated = updated.replace(/\n{3,}/g, "\n\n");
  if (!DRY_RUN) writeFileSync(RUNTIME_UX_INDEX, updated);
  return updated !== current;
}

function main() {
  const compiledFiles = readdirSync(COMPILED_DIR)
    .filter((n) => /^BM-\d{3}\.compiled\.json$/.test(n))
    .map((n) => {
      const m = /^BM-(\d{3})\.compiled\.json$/.exec(n);
      return m ? `BM-${m[1]}` : null;
    })
    .filter(Boolean)
    .sort();

  const existing = new Set(
    readdirSync(RUNTIME_UX_DIR)
      .filter((n) => /^bm\d{3}-runtime-ux-profile\.ts$/.test(n))
      .map((n) => {
        const m = /^bm(\d{3})-runtime-ux-profile\.ts$/.exec(n);
        return m ? `BM-${m[1]}` : null;
      })
      .filter(Boolean),
  );

  let generated = 0;
  let skipped = 0;
  let updatedIndex = false;
  let indexImportsAdded = 0;

  for (const code of compiledFiles) {
    if (ONLY_CODE && code !== ONLY_CODE) continue;

    if (CURATED_PROFILES.has(code)) {
      skipped++;
      continue;
    }
    const alreadyImported = (() => {
      try {
        const cur = readFileSync(RUNTIME_UX_INDEX, "utf8");
        const expected = `./bm${code.slice(3)}-runtime-ux-profile`;
        const re = new RegExp(`from\\s+["']${expected.replace(/\./g, "\\.")}["']`);
        return re.test(cur);
      } catch {
        return false;
      }
    })();
    const fileExistsOnDisk = existsSync(`${RUNTIME_UX_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`);
    if (fileExistsOnDisk && alreadyImported && !FORCE) {
      skipped++;
      continue;
    }

    const compiledPath = `${COMPILED_DIR}/${code}.compiled.json`;
    let compiled;
    try {
      compiled = JSON.parse(readFileSync(compiledPath, "utf8"));
    } catch (err) {
      console.error(`skip ${code}: cannot read compiled contract (${err.message})`);
      skipped++;
      continue;
    }
    const compiledSource = compiled.source || {};
    const sections = Array.isArray(compiledSource.sections)
      ? compiledSource.sections
      : [];
    const fields = Array.isArray(compiledSource.fields)
      ? compiledSource.fields
      : [];

    if (!fileExistsOnDisk || FORCE) {
      const content = buildProfile(code, sections, fields, compiled.title || code);
      const profilePath = `${RUNTIME_UX_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`;
      if (!DRY_RUN) writeFileSync(profilePath, content);
      generated++;
    }

    if (!alreadyImported && !DRY_RUN) {
      const did = ensureIndexImport(code);
      if (did) {
        updatedIndex = true;
        indexImportsAdded++;
      }
    }
  }

  console.log(JSON.stringify({
    generated,
    skipped,
    indexUpdated: updatedIndex,
    indexImportsAdded,
    dryRun: DRY_RUN,
    force: FORCE,
    onlyCode: ONLY_CODE,
  }, null, 2));
}

main();
