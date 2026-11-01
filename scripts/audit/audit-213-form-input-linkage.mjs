#!/usr/bin/env node
/**
 * audit-213-form-input-linkage.mjs
 *
 * Read-only inventory of the 213-form runtime-ux input linkage. No mutation,
 * no fetch, no DB. Walks:
 *   - docs/audit/docx/compiled-v2/BM-<NNN>.compiled.json  (213 files)
 *   - apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts  (variable)
 *   - apps/web/src/lib/form-flight/profiles/bmNNN.ts  (213 files)
 *   - apps/web/src/components/documents/bm-NNN-form-inputs.tsx  (213 files)
 *   - apps/web/src/lib/runtime-ux/index.ts (registry)
 *   - apps/web/src/lib/form-flight/form-lifecycle.ts (runtime-ready allowlist)
 *   - apps/web/src/features/forms-contracts/sample-data.ts (legacy SAMPLE_REGISTRY)
 *
 * For every BM-NNN it reports:
 *   - exists (compiled + locked + form-flight + component)
 *   - section count / field count / required field count
 *   - runtime-ux profile: exists / sections / fields / smart-key count
 *   - smart-key targets that exist in compiled contract
 *   - smart-key targets missing from compiled contract
 *   - profile.demo legacy-token scan (Nguyễn Văn A / Trần Thị B / 1980 /
 *     Ông  cung cấp / Nguyễn Thị Hồng Hạnh / "undefined" / "null" /
 *     "[object Object]")
 *   - SAMPLE_REGISTRY legacy-token scan (sample-data.ts)
 *   - form-flight skeleton profile: exists / runtimeReady / profileStatus
 *   - runtime-ready allowlist membership
 *   - derived status: INPUT_CONNECTED_PASS / PARTIAL /
 *     ROUTE_BLOCKED / CONTRACT_BLOCKED / PREVIEW_BLOCKED /
 *     FIDELITY_PENDING / FIDELITY_COMPLETE_EVIDENCED
 *
 * Exit codes:
 *   0 = report generated.
 *   1 = STRICT and one or more forms have failures.
 *
 * Usage:
 *   node scripts/audit/audit-213-form-input-linkage.mjs
 *   node scripts/audit/audit-213-form-input-linkage.mjs --strict
 *   node scripts/audit/audit-213-form-input-linkage.mjs --code BM-001
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, sep } from "node:path";

function normalizePath(p) {
  return p.split(sep).join("/");
}

// Build paths using forward-slash string concatenation. `path.join` on
// Windows converts forward slashes back to backslashes, which then breaks
// `fs.readdirSync` and `fs.existsSync` checks downstream.
function rp(...parts) {
  return normalizePath(resolve(...parts));
}

const ROOT = normalizePath(resolve(process.cwd()));
const COMPILED_DIR = `${ROOT}/docs/audit/docx/compiled-v2`;
const LOCKED_DIR = `${ROOT}/docs/audit/docx/contracts/locked`;
const RUNTIME_UX_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const FORM_FLIGHT_PROFILES_DIR = `${ROOT}/apps/web/src/lib/form-flight/profiles`;
const FORM_FLIGHT_LIFECYCLE = `${ROOT}/apps/web/src/lib/form-flight/form-lifecycle.ts`;
const FORM_INPUTS_DIR = `${ROOT}/apps/web/src/components/documents`;
const RUNTIME_UX_INDEX = `${RUNTIME_UX_DIR}/index.ts`;
const SAMPLE_DATA = `${ROOT}/apps/web/src/features/forms-contracts/sample-data.ts`;
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;

const STRICT = process.argv.includes("--strict");
const ONLY_CODE = (() => {
  const idx = process.argv.indexOf("--code");
  return idx >= 0 ? String(process.argv[idx + 1] || "").toUpperCase() : null;
})();

const STALE_TOKENS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông  cung cấp",
  "Ông cung cấp",
  "Nguyễn Thị Hồng Hạnh",
];
const STALE_YEAR_1980 = "1980";
const PLACEHOLDER_VALUES = ["undefined", "null", "[object Object]"];

function listCompiledTemplates() {
  const files = readdirSync(COMPILED_DIR).filter(
    (name) => /^BM-\d{3}\.compiled\.json$/.test(name),
  );
  return files
    .map((f) => {
      const m = /^BM-(\d{3})\.compiled\.json$/.exec(f);
      return m ? { code: `BM-${m[1]}`, file: f } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

import { existsSync } from "node:fs";

function fileExists(path) {
  try {
    if (existsSync(path)) return true;
    // Fallback: try the back-slash variant on Windows.
    const back = path.replace(/\//g, "\\");
    if (back !== path && existsSync(back)) return true;
    return false;
  } catch {
    return false;
  }
}

function listRuntimeUxProfiles() {
  if (!fileExists(RUNTIME_UX_DIR)) return [];
  return readdirSync(RUNTIME_UX_DIR)
    .filter((n) => /^bm\d{3}-runtime-ux-profile\.ts$/.test(n))
    .map((n) => {
      const m = /^bm(\d{3})-runtime-ux-profile\.ts$/.exec(n);
      return m ? `BM-${m[1]}` : null;
    })
    .filter(Boolean);
}

function listFormFlightProfiles() {
  if (!fileExists(FORM_FLIGHT_PROFILES_DIR)) return [];
  return readdirSync(FORM_FLIGHT_PROFILES_DIR)
    .filter((n) => /^bm\d{3}\.ts$/.test(n))
    .map((n) => {
      const m = /^bm(\d{3})\.ts$/.exec(n);
      return m ? `BM-${m[1]}` : null;
    })
    .filter(Boolean);
}

function listLegacyComponents() {
  if (!fileExists(FORM_INPUTS_DIR)) return [];
  return readdirSync(FORM_INPUTS_DIR)
    .filter((n) => /^bm-(\d{3})-form-inputs\.tsx$/.test(n))
    .map((n) => {
      const m = /^bm-(\d{3})-form-inputs\.tsx$/.exec(n);
      return m ? `BM-${m[1]}` : null;
    })
    .filter(Boolean);
}

function listRegisteredInIndex() {
  if (!fileExists(RUNTIME_UX_INDEX)) return new Set();
  const src = readFileSync(RUNTIME_UX_INDEX, "utf8");
  const out = new Set();
  const re = /import\s+["']\.\/bm(\d{3})-runtime-ux-profile["']/g;
  let m;
  while ((m = re.exec(src))) {
    out.add(`BM-${m[1]}`);
  }
  return out;
}

function listRuntimeReadyAllowlist() {
  if (!fileExists(FORM_FLIGHT_LIFECYCLE)) return new Set();
  const src = readFileSync(FORM_FLIGHT_LIFECYCLE, "utf8");
  const m = /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*(\[[^\]]+\])/m.exec(src);
  if (!m) return new Set();
  const set = new Set();
  const re = /"BM-\d{3}"|'BM-\d{3}'/g;
  let g;
  while ((g = re.exec(m[1]))) {
    const t = g[0].replace(/['"]/g, "");
    if (/^BM-\d{3}$/.test(t)) set.add(t);
  }
  return set;
}

function detectStaleInDemoBlock(text) {
  // Scan only the demo block (a `BMNNN_DEMO = { ... } as const` or
  // `BMNNN_DEMO_RUNTIME_UX = { ... } as const` literal). This avoids
  // false positives from comments that mention the tokens.
  const re =
    /\b(?:BM\d{3}_DEMO[A-Z_]*)\s*=\s*\{([\s\S]*?)\}\s*as\s*const/m;
  const m = re.exec(text);
  const block = m ? m[1] : "";
  const hits = [];
  for (const tok of STALE_TOKENS) {
    if (block.includes(tok)) hits.push(tok);
  }
  if (/(^|\W)1980(\W|$)/m.test(block)) hits.push(STALE_YEAR_1980);
  for (const tok of PLACEHOLDER_VALUES) {
    const re2 = new RegExp(`["']${tok}["']`);
    if (re2.test(block)) hits.push(`<placeholder:${tok}>`);
  }
  return hits;
}

function detectStaleInText(text) {
  // Permissive full-text scan used when no demo block can be located.
  const hits = [];
  for (const tok of STALE_TOKENS) {
    if (text.includes(tok)) hits.push(tok);
  }
  if (/(^|\W)1980(\W|$)/m.test(text)) hits.push(STALE_YEAR_1980);
  for (const tok of PLACEHOLDER_VALUES) {
    const re2 = new RegExp(`["']${tok}["']`);
    if (re2.test(text)) hits.push(`<placeholder:${tok}>`);
  }
  return hits;
}

function classifyForm(state) {
  // Route opens iff the locked + compiled contracts + form-flight skeleton +
  // legacy component all exist on disk. We do not call the API here
  // because the audit is read-only.
  if (!state.compiledExists || !state.lockedExists || !state.formFlightExists || !state.legacyComponentExists) {
    return "ROUTE_BLOCKED";
  }
  if (state.runtimeUxProfileRegistered) {
    if (state.runtimeReadyAllowlisted) {
      return "INPUT_CONNECTED_PASS";
    }
    // Profile linked, allowlist not yet. Treat as partial until the
    // Allowlist-promotion path is hand-curated.
    return "INPUT_CONNECTED_PARTIAL";
  }
  // No profile: the renderer uses the generic `getSampleData(...)`
  // heuristic. This is sub-input-usability (legacy tokens can leak).
  return "FIDELITY_PENDING";
}

function buildFormReport(code, compiled, state, globalState) {
  const compiledSource = compiled?.source ?? null;
  const fields = Array.isArray(compiledSource?.fields) ? compiledSource.fields : [];
  const sections = Array.isArray(compiledSource?.sections) ? compiledSource.sections : [];
  const requiredFieldKeys = Array.isArray(compiled?.requiredFieldKeys)
    ? compiled.requiredFieldKeys
    : [];
  const compiledFieldKeys = new Set(fields.map((f) => f.key).filter(Boolean));

  const profileText = state.runtimeUxProfilePath
    ? safeReadFile(state.runtimeUxProfilePath)
    : "";
  const profileStaleHits = profileText ? detectStaleInDemoBlock(profileText) : [];
  // Smart-key extraction (very lightweight): pull every
  // `<key>: { ... smart: { ... kind: "..." } }` literal. Tolerant of
  // BM-001 / BM-171 verbose style.
  const smartRe =
    /["']([a-z][\w.]*)["']\s*:\s*\{[^{}]*?smart\s*:\s*\{[^{}]*?kind\s*:\s*["']([a-z-]+)["']/g;
  const smartEntries = [];
  let sm;
  while ((sm = smartRe.exec(profileText))) {
    smartEntries.push({ key: sm[1], kind: sm[2] });
  }

  // Detect derived targets in the profile
  const derivedTargets = new Set();
  const dtRe =
    /derivedTargets\s*:\s*\[\s*((?:\s*["'][^"']+["'],?)+)\s*\]/g;
  let d;
  while ((d = dtRe.exec(profileText))) {
    const inner = d[1];
    const kRe = /["']([^"']+)["']/g;
    let k;
    while ((k = kRe.exec(inner))) {
      derivedTargets.add(k[1]);
    }
  }

  const compiledSectionIds = new Set(
    sections.map((s) => s.id).filter(Boolean),
  );
  const profileSectionIds = new Set();
  const sectionIdRe = /sectionId\s*:\s*["']([^"']+)["']/g;
  let sId;
  while ((sId = sectionIdRe.exec(profileText))) {
    profileSectionIds.add(sId[1]);
  }

  const smartKeysNotInContract = smartEntries
    .map((e) => e.key)
    .filter((k) => !compiledFieldKeys.has(k));
  const derivedNotInContract = Array.from(derivedTargets).filter(
    (k) => !compiledFieldKeys.has(k),
  );
  const sectionIdsNotInContract = Array.from(profileSectionIds).filter(
    (id) => !compiledSectionIds.has(id),
  );

  const sampleText = safeReadFile(SAMPLE_DATA);
  const sampleHasLegacyToken =
    !!sampleText && STALE_TOKENS.some((t) => sampleText.includes(t));

  const status = classifyForm(state);

  return {
    templateCode: code,
    title: compiled?.title ?? null,
    compiledExists: state.compiledExists,
    lockedExists: state.lockedExists,
    formFlightExists: state.formFlightExists,
    legacyComponentExists: state.legacyComponentExists,
    runtimeUxProfileRegistered: state.runtimeUxProfileRegistered,
    runtimeReadyAllowlisted: state.runtimeReadyAllowlisted,
    sectionCount: sections.length,
    fieldCount: fields.length,
    requiredFieldCount: requiredFieldKeys.length,
    profileSectionCount: profileSectionIds.size,
    profileFieldOverrideCount: countFieldOverrides(profileText),
    smartEntryCount: smartEntries.length,
    smartKeys: smartEntries.map((e) => `${e.key}=${e.kind}`),
    smartKeysNotInContract,
    derivedTargetsNotInContract: derivedNotInContract,
    sectionIdsNotInContract,
    profileStaleTokenHits: profileStaleHits,
    legacySampleDataHasStaleTokens: sampleHasLegacyToken,
    status,
  };
}

function safeReadFile(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function countFieldOverrides(profileText) {
  // Match `key: { ... }` inside the BM001_FIELDS-style consts. Heuristic —
  // counts the number of top-level property entries; overcount is acceptable
  // as long as it is consistent across reports.
  const m = /(?:BM\d{3}_FIELDS|const.*FIELDS\s*=\s*\{)([\s\S]*?)\}\s*(?:as const|;)/m.exec(
    profileText,
  );
  if (!m) return 0;
  const inner = m[1];
  // Count `key: { ... label: ... }` style entries.
  const re = /^\s*["'][a-z][\w.]*["']\s*:/gm;
  const arr = inner.match(re);
  return arr ? arr.length : 0;
}

function main() {
  const forms = listCompiledTemplates();
  const runtimeUxProfiles = new Set(listRuntimeUxProfiles());
  const formFlightProfiles = new Set(listFormFlightProfiles());
  const legacyComponents = new Set(listLegacyComponents());
  const registeredInIndex = listRegisteredInIndex();
  const runtimeReadyAllowlist = listRuntimeReadyAllowlist();

  const reports = [];
  const lockedFiles = readdirSync(LOCKED_DIR);
  for (const { code, file } of forms) {
    if (ONLY_CODE && code !== ONLY_CODE) continue;
    const compiledPath = `${COMPILED_DIR}/${file}`;
    const lockedFile = lockedFiles.find((f) =>
      f.startsWith(`${code}__`),
    );
    const runtimeUxProfilePath = `${RUNTIME_UX_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`;
    const formFlightPath = `${FORM_FLIGHT_PROFILES_DIR}/${code.toLowerCase()}.ts`;
    const legacyCompPath = `${FORM_INPUTS_DIR}/bm-${code.slice(3)}-form-inputs.tsx`;

    let compiled = null;
    if (fileExists(compiledPath)) compiled = readJson(compiledPath);

    const state = {
      compiledExists: fileExists(compiledPath),
      lockedExists: !!lockedFile,
      formFlightExists: formFlightProfiles.has(code),
      legacyComponentExists: legacyComponents.has(code),
      runtimeUxProfileRegistered:
        runtimeUxProfiles.has(code) && registeredInIndex.has(code),
      runtimeReadyAllowlisted: runtimeReadyAllowlist.has(code),
      runtimeUxProfilePath,
    };
    reports.push(buildFormReport(code, compiled, state, { registeredInIndex }));
  }

  const counts = {
    total: reports.length,
    INPUT_CONNECTED_PASS: reports.filter((r) => r.status === "INPUT_CONNECTED_PASS").length,
    INPUT_CONNECTED_PARTIAL: reports.filter(
      (r) => r.status === "INPUT_CONNECTED_PARTIAL",
    ).length,
    FIDELITY_PENDING: reports.filter((r) => r.status === "FIDELITY_PENDING").length,
    ROUTE_BLOCKED: reports.filter((r) => r.status === "ROUTE_BLOCKED").length,
    CONTRACT_BLOCKED: reports.filter((r) => r.status === "CONTRACT_BLOCKED").length,
    PREVIEW_BLOCKED: reports.filter((r) => r.status === "PREVIEW_BLOCKED").length,
  };

  const summary = {
    snapshotDate: new Date().toISOString(),
    onlyCode: ONLY_CODE,
    counts,
    runtimeUxProfilesRegistered: Array.from(runtimeUxProfiles).sort(),
    formFlightProfilesRegistered: formFlightProfiles.size,
    legacyComponentsCount: legacyComponents.size,
    runtimeReadyAllowlist: Array.from(runtimeReadyAllowlist).sort(),
    legacySampleDataHasStaleTokens: STALE_TOKENS.some((t) =>
      safeReadFile(SAMPLE_DATA).includes(t),
    ),
    forms: reports,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = ONLY_CODE
    ? `${OUT_DIR}/QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.${ONLY_CODE}.latest.json`
    : `${OUT_DIR}/QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.json`;
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const md = renderMarkdown(summary);
  const mdPath = ONLY_CODE
    ? `${OUT_DIR}/QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.${ONLY_CODE}.latest.md`
    : `${OUT_DIR}/QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.md`;
  writeFileSync(mdPath, md);

  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${mdPath}`);
  console.log(JSON.stringify(counts, null, 2));

  if (STRICT && (counts.ROUTE_BLOCKED > 0 || counts.CONTRACT_BLOCKED > 0)) {
    process.exitCode = 1;
  }
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# QLLAW 213 Form Input Linkage Matrix — latest");
  lines.push("");
  lines.push(`> **Generated**: ${summary.snapshotDate}`);
  lines.push(`> **Total forms**: ${summary.counts.total}`);
  if (summary.onlyCode) lines.push(`> **Filtered to**: ${summary.onlyCode}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("|---|---|");
  for (const [k, v] of Object.entries(summary.counts)) {
    if (k === "total") continue;
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push("");
  lines.push("## Runtime-ux profiles registered");
  lines.push("");
  lines.push(
    `- Profiles registered: ${summary.runtimeUxProfilesRegistered.join(", ") || "(none)"}`,
  );
  lines.push(
    `- Runtime-ready allowlist: ${summary.runtimeReadyAllowlist.join(", ") || "(empty)"}`,
  );
  lines.push(`- Form-flight profiles: ${summary.formFlightProfilesRegistered}`);
  lines.push(`- Legacy components: ${summary.legacyComponentsCount}`);
  lines.push("");
  if (summary.legacySampleDataHasStaleTokens) {
    lines.push(
      "> NOTE: `apps/web/src/features/forms-contracts/sample-data.ts` still contains legacy stale tokens (`Nguyễn Văn A`, `Trần Thị B`, etc.) in its `SAMPLE_REGISTRY`. The Phase-4 runtime-ux profile generator removes the runtime dependency on this path, but the file is not deleted to preserve the fall-through heuristic for any form that genuinely lacks a profile.",
    );
  }
  lines.push("");
  lines.push("## Per-form linkage");
  lines.push("");
  lines.push(
    "| Code | Title | Sections | Fields | Required | Profile | Smart | Stale tokens | Status |",
  );
  lines.push("|---|---|---:|---:|---:|---|---:|---|---|");
  for (const r of summary.forms) {
    const title = (r.title ?? "").replace(/\|/g, "/").slice(0, 60);
    const profile = r.runtimeUxProfileRegistered ? "YES" : "NO";
    const stale = r.profileStaleTokenHits.length === 0 ? "—" : r.profileStaleTokenHits.join(";");
    lines.push(
      `| ${r.templateCode} | ${title} | ${r.sectionCount} | ${r.fieldCount} | ${r.requiredFieldCount} | ${profile} | ${r.smartEntryCount} | ${stale} | ${r.status} |`,
    );
  }
  lines.push("");
  lines.push("## Profile issues (fields/keys missing from contract)");
  const withIssues = summary.forms.filter(
    (r) =>
      r.smartKeysNotInContract.length > 0 ||
      r.sectionIdsNotInContract.length > 0 ||
      r.derivedTargetsNotInContract.length > 0 ||
      r.profileStaleTokenHits.length > 0,
  );
  if (withIssues.length === 0) {
    lines.push("");
    lines.push("(none)");
  } else {
    for (const r of withIssues) {
      lines.push(`- ${r.templateCode} (status=${r.status})`);
      if (r.smartKeysNotInContract.length > 0) {
        lines.push(
          `  - smart keys not in contract: ${r.smartKeysNotInContract.join(", ")}`,
        );
      }
      if (r.sectionIdsNotInContract.length > 0) {
        lines.push(
          `  - section ids not in contract: ${r.sectionIdsNotInContract.join(", ")}`,
        );
      }
      if (r.derivedTargetsNotInContract.length > 0) {
        lines.push(
          `  - derived targets not in contract: ${r.derivedTargetsNotInContract.join(", ")}`,
        );
      }
      if (r.profileStaleTokenHits.length > 0) {
        lines.push(
          `  - stale tokens in profile: ${r.profileStaleTokenHits.join(" / ")}`,
        );
      }
    }
  }
  return lines.join("\n") + "\n";
}

main();
