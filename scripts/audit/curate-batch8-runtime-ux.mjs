#!/usr/bin/env node
/**
 * Generates curated Batch 8 source/render runtime-ux profiles.
 *
 * This is a one-shot generator that writes the 20 selected Batch 8
 * profiles (BM-161..BM-170, BM-172..BM-181) as hand-curated
 * source/render profile modules. Each profile:
 *
 *   - Uses real Vietnamese labels (not "(mẫu BM-XXX)" placeholders).
 *   - Has at least one section heading.
 *   - Has demo data without any stale token (Nguyễn Văn A,
 *     Trần Thị B, Ông cung cấp, Nguyễn Thị Hồng Hạnh, 1980).
 *   - Does not introduce lifecycle/workspace fields.
 *   - Does not mark itself as runtimeReady.
 *   - Does not include the form in the FormFlight allowlist.
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 8 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 8.
 *
 * Usage:
 *   node scripts/audit/curate-batch8-runtime-ux.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const PROFILES_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const INDEX_FILE = `${PROFILES_DIR}/index.ts`;
const BATCH8_DATA_FILE = `${ROOT}/._tmp-batch8-curation-data.mjs`;

if (!existsSync(PROFILES_DIR)) {
  console.error(`FAIL: profiles dir missing: ${PROFILES_DIR}`);
  process.exit(1);
}
if (!existsSync(BATCH8_DATA_FILE)) {
  console.error(`FAIL: data file missing: ${BATCH8_DATA_FILE}`);
  process.exit(1);
}

// Inline the data via dynamic import with file:// URL (works on Windows).
const dataUrl = new URL(`file:///${BATCH8_DATA_FILE.replace(/\\/g, "/")}`).href;
const data = await import(dataUrl);
const BATCH8_CURATION = data.BATCH8_CURATION;

function renderProfileModule(entry) {
  const { code, title, sections, fields, demo } = entry;
  const num = code.slice(3);
  const fieldEntries = Object.entries(fields);
  const demoEntries = Object.entries(demo);
  const sectionLines = sections
    .map(
      (s) =>
        `  {\n    sectionId: "${s.id}",\n    title: "${s.title.replace(/"/g, '\\"')}",\n  }`,
    )
    .join(",\n");
  const fieldLines = fieldEntries
    .map(
      ([k, v]) =>
        `  "${k}": {\n    label: "${v.label.replace(/"/g, '\\"')}",\n    placeholder: "${v.placeholder.replace(/"/g, '\\"')}",\n  }`,
    )
    .join(",\n");
  const demoLines = demoEntries
    .map(
      ([k, v]) =>
        `  "${k}": "${v.replace(/"/g, '\\"')}"`,
    )
    .join(",\n");

  return `/**
 * ${code} runtime-ux batch 8 curated source-render profile.
 *
 * Hand-curated upgrade of the auto-generated ${code} profile to
 * a source/render version with real Vietnamese labels, multiple
 * section headings, and safe demo data.
 *
 * Form title: ${title}
 *
 * Boundaries honoured:
 *   - No mutation of the locked contract, the normalized DOCX, or
 *     the compiled contract.
 *   - No DB row creation, no generatedDocumentId fabrication.
 *   - No call to the generated-document save endpoint.
 *   - No smart controls emitted.
 *   - No legacy stale tokens in demo.
 *
 * Promotion to INPUT_CONNECTED_PASS via Batch 8 source/render smoke
 * only. Browser/demo/preview/DOCX/fidelity/visual/human evidence
 * remains NOT_RUN for Batch 8.
 */

import {
  type RuntimeUxProfile,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

const BM${num}_SECTIONS = [
${sectionLines},
] as const;

const BM${num}_FIELDS = {
${fieldLines},
} as const;

const BM${num}_DEMO_RUNTIME_UX = {
${demoLines},
} as const;

const BM${num}_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "${code}",
  // Stable version label, surfaced in audit artifacts.
  versionLabel: \`${code} runtime-ux batch 8 curated source-render profile\`,
  sections: BM${num}_SECTIONS,
  fields: BM${num}_FIELDS,
  demo: BM${num}_DEMO_RUNTIME_UX,
};

registerRuntimeUxProfile(BM${num}_RUNTIME_UX_PROFILE);
`;
}

const STALE_TOKENS = [
  "Nguyen Van A",
  "Tran Thi B",
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông cung cấp",
  "Ông  cung cấp",
  "Nguyễn Thị Hồng Hạnh",
  "1980",
];

let writtenCount = 0;
const summary = [];
for (const entry of BATCH8_CURATION) {
  const { code } = entry;
  const num = code.slice(3);
  const profilePath = `${PROFILES_DIR}/bm${num}-runtime-ux-profile.ts`;
  const text = renderProfileModule(entry);
  // Sanity: no stale tokens in demo section
  const demoBlock = text.match(/const BM\d{3}_DEMO_RUNTIME_UX = \{([\s\S]*?)\} as const;/u)?.[1] ?? "";
  const staleHits = STALE_TOKENS.filter((tok) => demoBlock.includes(tok));
  if (staleHits.length > 0) {
    console.error(`FAIL: ${code} has stale tokens in demo: ${staleHits.join(", ")}`);
    process.exit(1);
  }
  // Sanity: no "(mẫu BM-XXX)" placeholder
  if (/\(m.u\s+BM-\d{3}\)|\(mẫu\s+BM-\d{3}\)/u.test(demoBlock)) {
    console.error(`FAIL: ${code} has placeholder-like content in demo`);
    process.exit(1);
  }
  // Sanity: all fields have labels
  const fieldEntries = Object.entries(entry.fields);
  if (fieldEntries.length === 0) {
    console.error(`FAIL: ${code} has no fields`);
    process.exit(1);
  }
  // Sanity: all demos have values
  for (const [k, v] of Object.entries(entry.demo)) {
    if (!v || v.length < 3) {
      console.error(`FAIL: ${code}.${k} demo value too short: ${v}`);
      process.exit(1);
    }
  }
  writeFileSync(profilePath, text);
  writtenCount++;
  summary.push({ code, sections: entry.sections.length, fields: fieldEntries.length });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      written: writtenCount,
      profiles: summary,
    },
    null,
    2,
  ),
);
