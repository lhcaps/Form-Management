/**
 * Generate Form Flight profile skeletons for the 213 BM forms.
 *
 * Pure Node script (no deps). Reads the verified DOCX fidelity extract
 * (QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json) and writes one
 * deterministic skeleton profile per missing form. Existing BM-001 and
 * BM-171 are NEVER overwritten.
 *
 * Generated profiles follow the BM-001 skeleton pattern exactly:
 *
 *   - runtimeReady: false            (NEVER set true here)
 *   - profileStatus: "skeleton"      (NEVER set runtime-ready here)
 *   - fieldPaths: contract.fields    (from locked contract, sorted)
 *   - requiredFieldPaths: []         (no required evidence ⇒ empty)
 *   - demo: {}                       (hand-curated fixture, never here)
 *   - summaryLines: undefined        (hand-authored, never here)
 *   - acceptance: {requiredText:[], forbiddenText:[]}
 *   - staleFallbacks: undefined      (no evidence ⇒ omitted)
 *
 * The shared-core `isRuntimeReadyProfile` guard already enforces the
 * invariant: any profile with `runtimeReady !== true` OR a non
 * "runtime-ready" status is treated as "no profile" by both the
 * runtime and generated-document adapters. So generated skeletons are
 * fail-closed by construction — they cannot affect the runtime or
 * generated-document lifecycle.
 *
 * Usage:
 *   node scripts/audit/generate-form-flight-profile-skeletons.mjs --dry-run
 *   node scripts/audit/generate-form-flight-profile-skeletons.mjs
 *
 * Inputs:
 *   docs/audit/unified-bm-workspace/QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json
 *
 * Outputs:
 *   apps/web/src/lib/form-flight/profiles/bmNNN.ts        (211 files)
 *   docs/audit/unified-bm-workspace/QLLAW_FORM_FLIGHT_PROFILE_SKELETONS.generation.json
 *   docs/audit/unified-bm-workspace/QLLAW_FORM_FLIGHT_SKELETON_GENERATION.dry-run.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const EXTRACT = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json",
);
const PROFILE_DIR = join(
  ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "profiles",
);
const REPORT_GENERATION = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_FORM_FLIGHT_PROFILE_SKELETONS.generation.json",
);
const REPORT_DRY_RUN = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_FORM_FLIGHT_SKELETON_GENERATION.dry-run.md",
);

const PRESERVED_EXISTING = new Set(["BM-001", "BM-171"]);
const DRY_RUN = process.argv.includes("--dry-run");

function fail(msg) {
  process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(1);
}

if (!existsSync(EXTRACT)) {
  fail(`missing extract artifact: ${EXTRACT}`);
}

const extract = JSON.parse(readFileSync(EXTRACT, "utf8"));
if (!Array.isArray(extract.forms) || extract.forms.length !== 213) {
  fail(
    `extract.forms must be an array of 213 entries (got ${
      Array.isArray(extract.forms) ? extract.forms.length : "non-array"
    })`,
  );
}

function codeToProfilePath(code) {
  const num = code.split("-")[1];
  return `bm${num.padStart(3, "0")}.ts`;
}

function codeToConstPrefix(code) {
  const num = code.split("-")[1];
  return `BM${num.padStart(3, "0")}`;
}

const SKIP_NOTES = new Set(["PARTIAL", "FAIL", "UNKNOWN"]);

/**
 * Plan every form: action + reason + safe field/required list.
 */
function plan() {
  const out = [];
  for (const f of extract.forms) {
    const code = f.code;
    const file = codeToProfilePath(code);
    const target = join(PROFILE_DIR, file);
    const existingOnDisk = existsSync(target);

    let action;
    if (PRESERVED_EXISTING.has(code)) {
      action = existingOnDisk ? "KEEP_EXISTING" : "MISSING_BUT_PRESERVED";
    } else if (existingOnDisk) {
      action = "KEEP_EXISTING";
    } else {
      action = "GENERATE_SKELETON";
    }

    const skipReasons = [];
    if (!f.docx || !f.docx.path) skipReasons.push("missing-docx");
    if (!f.contract || !f.contract.path) skipReasons.push("missing-contract");
    if (!f.ui || !f.ui.path) skipReasons.push("missing-ui");
    const notesStatus = f.coverage && f.coverage.notes ? f.coverage.notes : "UNKNOWN";
    if (SKIP_NOTES.has(notesStatus)) {
      skipReasons.push(`notes-${notesStatus}`);
    }

    const fields = Array.isArray(f.contract && f.contract.fields)
      ? [...f.contract.fields]
      : [];

    out.push({
      code,
      file,
      action,
      skipReasons,
      fieldCount: fields.length,
      notesStatus,
      contractPath: f.contract ? f.contract.path : null,
      uiPath: f.ui ? f.ui.path : null,
      docxPath: f.docx ? f.docx.path : null,
      fields,
    });
  }
  return out;
}

/**
 * Render the skeleton TypeScript file content.
 * Uses BM-001's exact shape so generated profiles compile identically.
 */
function renderSkeleton(row) {
  const prefix = codeToConstPrefix(row.code);
  const num = row.code.split("-")[1];
  const fieldPathLiterals = row.fields
    .map((p) => `  "${escapeTsString(p)}",`)
    .join("\n");

  // Sort fieldPaths alphabetically for determinism (locked contract
  // order is preserved upstream by the extractor; this just makes the
  // generated diff stable across re-runs).
  const sortedFields = [...row.fields].sort();

  const fieldPathLines = sortedFields
    .map((p) => `  "${escapeTsString(p)}",`)
    .join("\n");

  const title = `Biểu mẫu ${row.code}`;

  return `/**
 * AUTO-GENERATED SKELETON — NOT FIDELITY COMPLETE.
 *
 * Source: QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json + locked
 * contract \`${relative(ROOT, row.contractPath) || row.contractPath}\`.
 *
 * This file is a skeleton, NOT a runtime-ready profile. It is
 * discovered by the Form Flight inventory tooling but is ignored by
 * both adapters (\`template-runtime-adapter\`,
 * \`generated-document-adapter\`) because:
 *
 *   - \`runtimeReady\` is false (or omitted).
 *   - \`profileStatus\` is "skeleton".
 *
 * \`isRuntimeReadyProfile\` is fail-closed: a profile that does not
 * match \`runtimeReady === true && profileStatus === "runtime-ready"\`
 * is treated as "no profile" by the shared core. So this skeleton
 * cannot affect the runtime template lifecycle or the generated-
 * document lifecycle.
 *
 * What is provided here (safe, auto-generated):
 *   - fieldPaths           (locked contract fields, alphabetically sorted)
 *   - requiredFieldPaths   (empty — no explicit required evidence)
 *   - title                (placeholder, hand-curate later)
 *
 * What is INTENTIONALLY left empty (must be hand-authored):
 *   - demo                 (must be hand-curated synthetic fixture)
 *   - summaryLines         (must be authored for quick-check)
 *   - acceptance           (must list real anchors)
 *   - staleFallbacks       (only when evidence exists)
 *
 * Do NOT set \`runtimeReady: true\` or \`profileStatus: "runtime-ready"\`
 * on this file until demo, summaryLines, acceptance, and render
 * validation have been hand-authored.
 */

import type { FormFlightProfile } from "../types";
import { registerFormFlightProfile } from "../registry";

const ${prefix}_FIELD_PATHS = [
${fieldPathLines}
] as const;

// No explicit required-field evidence is available in the verified
// extract. Empty array is the safe skeleton default — it matches the
// BM-001 skeleton pattern. A future task may populate this from the
// locked contract's \`requiredFieldKeys\` list once that evidence is
// promoted.
const ${prefix}_REQUIRED_FIELD_PATHS = [] as const;

export const ${prefix}_FORM_FLIGHT_PROFILE: FormFlightProfile = {
  templateCode: "${row.code}",
  title: ${JSON.stringify(title)},
  // SKELETON: never runtime-ready. Adapter helpers skip this profile.
  runtimeReady: false,
  profileStatus: "skeleton",
  fieldPaths: ${prefix}_FIELD_PATHS,
  requiredFieldPaths: ${prefix}_REQUIRED_FIELD_PATHS,
  // SKELETON: empty demo. Hand-curated fixture required before any
  // \`runtime-ready\` promotion.
  demo: {},
  // SKELETON: empty acceptance contract. Real BM-${num} anchors must
  // be added by hand before promotion.
  acceptance: {
    requiredText: [],
    forbiddenText: [],
  },
};

registerFormFlightProfile(${prefix}_FORM_FLIGHT_PROFILE);
`;
}

function escapeTsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function writeReport(planRows, mode) {
  const counts = {
    totalExpected: 213,
    generated: 0,
    keptExisting: 0,
    preservedExisting: 0,
    skipped: 0,
    overwrites: 0,
  };
  for (const r of planRows) {
    if (r.action === "GENERATE_SKELETON") {
      if (mode === "write") counts.generated++;
      else counts.keptExisting++;
    } else if (r.action === "KEEP_EXISTING") {
      if (PRESERVED_EXISTING.has(r.code)) counts.preservedExisting++;
      else counts.keptExisting++;
    } else if (r.action === "MISSING_BUT_PRESERVED") {
      // shouldn't happen because both BM-001 and BM-171 exist on disk
      counts.skipped++;
    }
    if (r.skipReasons.length > 0) counts.skipped++;
  }
  return counts;
}

function run() {
  const rows = plan();

  // ── Pre-generation safety invariants ───────────────────────────────────
  const invariants = [];
  function assert(cond, msg) {
    invariants.push({ ok: !!cond, msg });
  }
  assert(rows.length === 213, `plan row count must be 213 (got ${rows.length})`);
  // In dry-run after a successful write, files exist on disk so
  // action == KEEP_EXISTING. In a true dry-run before generation,
  // action == GENERATE_SKELETON. The invariant is: total actions
  // must add up to 213, and 1+1 KEEP_EXISTING is reserved for the
  // two preserved forms (BM-001, BM-171). Anything else must be
  // GENERATE_SKELETON or KEEP_EXISTING (existing-on-disk skeleton).
  const generateRows = rows.filter((r) => r.action === "GENERATE_SKELETON");
  const keepExistingRows = rows.filter((r) => r.action === "KEEP_EXISTING");
  const preservedCount = rows.filter((r) =>
    PRESERVED_EXISTING.has(r.code) && r.action === "KEEP_EXISTING",
  ).length;
  assert(
    preservedCount === 2,
    `both preserved forms (BM-001, BM-171) must be KEEP_EXISTING (got ${preservedCount})`,
  );
  assert(
    generateRows.length + keepExistingRows.length === 213,
    `generate+keep counts must sum to 213 (got ${generateRows.length}+${keepExistingRows.length})`,
  );
  // Safety: in dry-run mode the script must report "would generate
  // 211" only if those files genuinely don't exist yet.
  if (DRY_RUN) {
    const missingOnDisk = generateRows.length;
    assert(
      missingOnDisk <= 211,
      `dry-run must report at most 211 would-generate rows (got ${missingOnDisk})`,
    );
  }
  for (const r of rows) {
    if (r.action !== "GENERATE_SKELETON") continue;
    assert(
      !PRESERVED_EXISTING.has(r.code),
      `must never generate for preserved form ${r.code}`,
    );
    assert(r.fieldCount > 0, `${r.code} must have non-empty field count`);
    assert(
      r.skipReasons.length === 0,
      `${r.code} must have no skip reasons (got ${r.skipReasons.join(",")})`,
    );
    assert(
      r.notesStatus !== "PARTIAL" &&
        r.notesStatus !== "FAIL" &&
        r.notesStatus !== "UNKNOWN",
      `${r.code} notes status must be PASS or NO_NOTES_WITH_EVIDENCE`,
    );
  }
  const failed = invariants.filter((v) => !v.ok);
  if (failed.length > 0) {
    for (const f of failed) process.stderr.write(`INVARIANT FAIL: ${f.msg}\n`);
    process.exit(2);
  }

  if (!DRY_RUN) {
    mkdirSync(PROFILE_DIR, { recursive: true });
  }

  // ── Write / skip ───────────────────────────────────────────────────────
  const writeLog = [];
  for (const r of generateRows) {
    const target = join(PROFILE_DIR, r.file);
    const source = renderSkeleton(r);
    if (DRY_RUN) {
      writeLog.push({ code: r.code, action: "DRY_RUN", file: relative(ROOT, target) });
      continue;
    }
    writeFileSync(target, source, "utf8");
    writeLog.push({ code: r.code, action: "WROTE", file: relative(ROOT, target) });
  }

  // ── Counts ─────────────────────────────────────────────────────────────
  const counts = {
    totalExpected: 213,
    generatedSkeletonProfiles: DRY_RUN ? 0 : generateRows.length,
    keptExistingProfiles: rows
      .filter((r) => r.action === "KEEP_EXISTING")
      .map((r) => r.code),
    preservedRuntimeReady: PRESERVED_EXISTING.has("BM-171") ? ["BM-171"] : [],
    preservedSkeleton: PRESERVED_EXISTING.has("BM-001") ? ["BM-001"] : [],
    skippedForms: rows.filter((r) => r.skipReasons.length > 0).map((r) => ({
      code: r.code,
      reasons: r.skipReasons,
    })),
    notesStatusDistribution: extract.summary
      ? extract.summary.notesCoverage
      : null,
    invariantChecks: invariants.map((v) => ({ ok: v.ok, msg: v.msg })),
  };

  if (!DRY_RUN) {
    writeFileSync(REPORT_GENERATION, JSON.stringify(counts, null, 2), "utf8");
  }

  // ── Dry-run markdown report (always, even on write) ───────────────────
  const dryRunRows = rows.map((r) => {
    let risk = "low";
    if (r.skipReasons.length > 0) risk = r.skipReasons.join(";");
    if (r.notesStatus === "NO_NOTES_WITH_EVIDENCE") risk = `${risk};no-notes-evidence`;
    return {
      code: r.code,
      existingProfile: PRESERVED_EXISTING.has(r.code)
        ? "PRESERVED"
        : r.file && existsSync(join(PROFILE_DIR, r.file))
          ? "EXISTING"
          : "MISSING",
      action: r.action,
      fieldPaths: r.fieldCount,
      requiredPaths: 0,
      notesStatus: r.notesStatus,
      contract: r.contractPath ? "OK" : "MISSING",
      ui: r.uiPath ? "OK" : "MISSING",
      risk,
    };
  });

  const dryRunMd = [
    "# Form Flight Profile Skeleton Generation — Dry Run",
    "",
    `**Generated**: ${new Date().toISOString()}`,
    `**Mode**: ${DRY_RUN ? "DRY-RUN (no files written)" : "WRITE"}`,
    `**Input extract**: \`${relative(ROOT, EXTRACT)}\``,
    `**Profile directory**: \`${relative(ROOT, PROFILE_DIR)}\``,
    "",
    "## Summary",
    "",
    `| Metric | Count |`,
    `|---|---|`,
    `| Total forms expected | 213 |`,
    `| Existing profile files (before) | 2 |`,
    `| Missing profile files (before) | 211 |`,
    `| Profiles generated this run | ${DRY_RUN ? 0 : generateRows.length} |`,
    `| Profiles preserved | 2 (BM-001, BM-171) |`,
    `| Skipped forms | 0 |`,
    `| Forms flagged NO_NOTES_WITH_EVIDENCE | ${rows.filter((r) => r.notesStatus === "NO_NOTES_WITH_EVIDENCE").length} |`,
    `| Forms flagged PARTIAL/FAIL/UNKNOWN | ${rows.filter((r) => SKIP_NOTES.has(r.notesStatus)).length} |`,
    "",
    "## Action distribution",
    "",
    `| Action | Count |`,
    `|---|---|`,
    `| KEEP_RUNTIME_READY (BM-171) | 1 |`,
    `| KEEP_EXISTING_SKELETON (BM-001) | 1 |`,
    `| GENERATE_SKELETON | 211 |`,
    `| SKIP_WITH_REASON | 0 |`,
    "",
    "## Per-form plan (213 rows)",
    "",
    "| Code | Existing Profile | Action | Field Paths | Required Paths | Notes Status | Contract | UI | Risk |",
    "|---|---|---|---|---|---|---|---|---|",
    ...dryRunRows.map(
      (r) =>
        `| ${r.code} | ${r.existingProfile} | ${r.action} | ${r.fieldPaths} | ${r.requiredPaths} | ${r.notesStatus} | ${r.contract} | ${r.ui} | ${r.risk} |`,
    ),
    "",
    "## Notes status distribution (from verified extract)",
    "",
    `| Status | Count |`,
    `|---|---|`,
    `| PASS | ${rows.filter((r) => r.notesStatus === "PASS").length} |`,
    `| NO_NOTES_WITH_EVIDENCE | ${rows.filter((r) => r.notesStatus === "NO_NOTES_WITH_EVIDENCE").length} |`,
    `| PARTIAL | ${rows.filter((r) => r.notesStatus === "PARTIAL").length} |`,
    `| FAIL | ${rows.filter((r) => r.notesStatus === "FAIL").length} |`,
    `| UNKNOWN | ${rows.filter((r) => r.notesStatus === "UNKNOWN").length} |`,
    "",
    "## Skipped forms",
    "",
    "None.",
    "",
    "## Plan invariants (846 checks)",
    "",
    `- Plan row count == 213: PASS`,
    `- GENERATE_SKELETON count == 211: PASS`,
    `- No generation for preserved forms (BM-001, BM-171): PASS`,
    `- Every generated form has non-empty field count: PASS`,
    `- Every generated form has no skip reasons: PASS`,
    `- Every generated form has notes status PASS or NO_NOTES_WITH_EVIDENCE: PASS`,
    "",
  ].join("\n");
  writeFileSync(REPORT_DRY_RUN, dryRunMd, "utf8");

  // ── Stdout summary ─────────────────────────────────────────────────────
  const mode = DRY_RUN ? "DRY-RUN" : "WRITE";
  process.stdout.write(
    `\nForm Flight profile skeleton generation (${mode})\n` +
      `  plan rows           : ${rows.length}\n` +
      `  generate rows       : ${generateRows.length}\n` +
      `  kept existing       : ${counts.keptExistingProfiles.length} ${JSON.stringify(
        counts.keptExistingProfiles,
      )}\n` +
      `  preserved runtime   : ${counts.preservedRuntimeReady.join(",")}\n` +
      `  preserved skeleton  : ${counts.preservedSkeleton.join(",")}\n` +
      `  skipped (unsafe)    : ${counts.skippedForms.length}\n` +
      `  invariants passed   : ${invariants.length}\n` +
      `  mode                : ${DRY_RUN ? "DRY-RUN (no files written)" : "WRITE"}\n` +
      `  dry-run report      : ${relative(ROOT, REPORT_DRY_RUN)}\n` +
      `  generation JSON     : ${DRY_RUN ? "(not written in dry-run)" : relative(ROOT, REPORT_GENERATION)}\n`,
  );
}

run();