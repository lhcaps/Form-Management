// scripts/audit/build-unified-77-human-review-template.mjs
// Generates:
//   docs/audit/unified-bm-workspace/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json
//   docs/audit/unified-bm-workspace/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.md
//
// Read-only: reads QLLAW_UNIFIED_77_HUMAN_REVIEW_PACK.latest.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT  = `${ROOT}/docs/audit/unified-bm-workspace`;
const PACK_PATH = `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_PACK.latest.json`;

const pack = JSON.parse(readFileSync(PACK_PATH, "utf8"));

const CRITERIA_FIELDS = [
  "samePageCountOrAcceptedDelta",
  "headerLooksCorrect",
  "titleLooksCorrect",
  "bodyLayoutLooksCorrect",
  "tablesLookCorrect",
  "footerSignatureLooksCorrect",
  "noMissingTextVisible",
  "noObviousOverflowOrClipping",
  "acceptableForLegalDemo",
];

// ── priority forms first ────────────────────────────────────────────────────
const priorityCodes = new Set(pack.priorityReviewCodes.map(p => p.code));
const PRIORITY_CODES_ORDER = [
  "BM-015","BM-019","BM-033","BM-040","BM-042",
  "BM-057","BM-062",
];

const priorityRows = [];
for (const code of PRIORITY_CODES_ORDER) {
  const f = pack.forms.find(x => x.code === code);
  if (f) priorityRows.push(f);
}

const remainingRows = pack.forms.filter(f => !priorityCodes.has(f.code));

// ── build template decisions ─────────────────────────────────────────────────
const decisions = pack.forms.map(f => ({
  code:            f.code,
  group:           f.group,
  sourcePdf:       f.sourcePdfPath ? f.sourcePdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "",
  generatedPdf:    f.generatedPdfPath ? f.generatedPdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "",
  priority:        priorityCodes.has(f.code),
  reviewer:        "",
  reviewedAt:      "",
  decision:        "UNCERTAIN",
  criteria: Object.fromEntries(CRITERIA_FIELDS.map(k => [k, null])),
  notes:           "",
}));

// ── JSON template ────────────────────────────────────────────────────────────
const templateJson = {
  scope: "UNIFIED_77_HUMAN_VISUAL_REVIEW",
  totalForms: 77,
  reviewRule: "Human reviewer must compare source PDF and generated PDF side-by-side for each form. Do not mark PASS unless the generated PDF is visually acceptable for legal demo/use.",
  globalFidelityRule: "Global FIDELITY_COMPLETE_EVIDENCED remains false unless all 77 forms are PASS_HUMAN_REVIEWED or accepted equivalent evidence.",
  decisionSchema: {
    allowedDecisionValues: ["PASS", "FAIL", "UNCERTAIN"],
    requiredFields: ["code","sourcePdf","generatedPdf","priority","reviewer","reviewedAt","decision","criteria","notes"],
    criteriaFields: CRITERIA_FIELDS,
    passCriteriaRule: "All nine criteria must be true for decision=PASS. samePageCountOrAcceptedDelta=false requires explicit notes explaining accepted delta.",
    reviewerRule: "reviewer must be a non-empty human identifier (display name or initials). Values like 'ai', 'cursor', 'gpt', 'tool' are rejected.",
    reviewedAtRule: "reviewedAt must be an ISO-8601 timestamp (e.g. 2026-07-09T04:30:00Z).",
    notesRule: "For PASS: notes optional. For FAIL: notes must explain failure. For UNCERTAIN: notes must explain uncertainty or tooling concern.",
    priorityRule: "Priority forms (BM-015, BM-019, BM-033, BM-040, BM-042, BM-057, BM-062) have page-count mismatch and must be reviewed first.",
    forbiddenFields: ["generatedDocumentId","workspace","workspaceId","documentId"],
  },
  decisions,
};

writeFileSync(
  `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json`,
  JSON.stringify(templateJson, null, 2),
  "utf8"
);

// ── markdown template ────────────────────────────────────────────────────────
const lines = [];
lines.push("# QLLAW Unified 77 — Human Visual Review Decision Template\n");
lines.push(`> Generated: ${new Date().toISOString()}`);
lines.push("> Scope: UNIFIED_77_HUMAN_VISUAL_REVIEW — all 77 INPUT_CONNECTED_PASS forms");
lines.push("> Status: NEED_HUMAN_INPUT — no decisions have been made yet");
lines.push("> global FIDELITY_COMPLETE_EVIDENCED: **FALSE** (remains false until all 77 cleared)\n");
lines.push("## Review Rule\n");
lines.push("Human reviewer must compare **source PDF** and **generated PDF** side-by-side for each form.");
lines.push("Do **not** mark PASS unless the generated PDF is visually acceptable for legal demo/use.\n");
lines.push("## Decision Rules\n");
lines.push("- **PASS**: All 9 criteria must be `true`. samePageCountOrAcceptedDelta=false requires explicit notes.");
lines.push("- **FAIL**: Notes must explain what is unacceptable.");
lines.push("- **UNCERTAIN**: Notes must explain uncertainty or tooling concern.");
lines.push("- Reviewer must be a non-AI identifier (not 'ai', 'cursor', 'gpt', 'tool', etc.).");
lines.push("- reviewedAt must be ISO-8601 timestamp.\n");
lines.push("## Global Invariant\n");
lines.push("**FIDELITY_COMPLETE_EVIDENCED = false** — global flag remains false until all 77 forms are cleared.\n");
lines.push("## WARNING\n");
lines.push("> **Do NOT use machine/PDF extraction status (text sanity, image diff ratio) as human signoff.**\n");
lines.push("## Priority Forms (page-count mismatch — review first)\n");

// Priority table
lines.push("| Code | Group | Src Pages | Gen Pages | Risk Flags | Source PDF | Generated PDF |");
lines.push("|------|-------|----------|----------|------------|-----------|--------------|");
for (const f of priorityRows) {
  const srcPages = f.sourcePageCount ?? "—";
  const genPages = f.generatedPageCount ?? "—";
  const risks = (f.knownRiskFlags || []).filter(r => r !== "PRIORITY_CODE").join(", ") || "—";
  const srcPdf = f.sourcePdfPath ? f.sourcePdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "MISSING";
  const genPdf = f.generatedPdfPath ? f.generatedPdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "MISSING";
  lines.push(`| **${f.code}** | ${f.group} | ${srcPages} | ${genPages} | ${risks} | ${srcPdf} | ${genPdf} |`);
}

lines.push("\n## Decision Checklist\n");
lines.push("Fill in reviewer name, timestamp, decision (PASS/FAIL/UNCERTAIN), criteria, and notes.\n");

lines.push("### Priority Forms — Detail\n");
for (const f of priorityRows) {
  lines.push(`#### ${f.code} (${f.group})`);
  const srcPdf = f.sourcePdfPath ? f.sourcePdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "MISSING";
  const genPdf = f.generatedPdfPath ? f.generatedPdfPath.replace(/^D:\/Study\/Project\/QLLaw-main\//, "") : "MISSING";
  lines.push(`- **Source PDF**: \`${srcPdf}\``);
  lines.push(`- **Generated PDF**: \`${genPdf}\``);
  lines.push(`- **Source pages**: ${f.sourcePageCount ?? "?"}  **Generated pages**: ${f.generatedPageCount ?? "?"}`);
  lines.push(`- **Risk flags**: ${(f.knownRiskFlags || []).filter(r => r !== "PRIORITY_CODE").join(", ") || "none"}`);
  lines.push(`- **Max diff ratio**: ${f.maxDiffRatio ?? "N/A (render failed / diff unavailable)"}`);
  lines.push(`- **Tooling notes**: ${f.toolingNotes || "none"}`);
  lines.push(`- **Reviewer**: ___`);
  lines.push(`- **Reviewed at**: ___`);
  lines.push(`- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN`);
  lines.push(`- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___`);
  lines.push(`- **headerLooksCorrect**: [ ] true  [ ] false`);
  lines.push(`- **titleLooksCorrect**: [ ] true  [ ] false`);
  lines.push(`- **bodyLayoutLooksCorrect**: [ ] true  [ ] false`);
  lines.push(`- **tablesLookCorrect**: [ ] true  [ ] false`);
  lines.push(`- **footerSignatureLooksCorrect**: [ ] true  [ ] false`);
  lines.push(`- **noMissingTextVisible**: [ ] true  [ ] false`);
  lines.push(`- **noObviousOverflowOrClipping**: [ ] true  [ ] false`);
  lines.push(`- **acceptableForLegalDemo**: [ ] true  [ ] false`);
  lines.push(`- **Notes**: ___\n`);
}

lines.push("### Remaining Forms (all groups)\n");

// Group remaining forms
const byGroup = { existing37: [], batch3: [], batch4: [] };
for (const f of remainingRows) {
  byGroup[f.group].push(f);
}

for (const grp of ["existing37", "batch3", "batch4"]) {
  lines.push(`#### ${grp === "existing37" ? "Existing Curated 37" : grp === "batch3" ? "Batch 3 (20 forms)" : "Batch 4 (20 forms)"}`);

  // Summary table per group
  lines.push("| Code | Src Pages | Gen Pages | Risk | Max Diff | Reviewer | Decision | Notes |");
  lines.push("|------|-----------|-----------|------|----------|----------|----------|-------|");
  for (const f of byGroup[grp]) {
    const srcPages = f.sourcePageCount ?? "?";
    const genPages = f.generatedPageCount ?? "?";
    const risks = (f.knownRiskFlags || []).filter(r => !["PRIORITY_CODE","VISUAL_DIFF_UNAVAILABLE"].includes(r)).join(", ") || "—";
    const diffStr = f.maxDiffRatio != null ? f.maxDiffRatio.toFixed(4) : "N/A";
    lines.push(`| ${f.code} | ${srcPages} | ${genPages} | ${risks} | ${diffStr} | ___ | ___ | ___ |`);
  }
  lines.push("");
}

lines.push("## How to Submit Decisions\n");
lines.push("1. Copy `QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json` to `QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.input.json`.");
lines.push("2. Fill in reviewer, reviewedAt, decision, criteria, and notes for each of the 77 forms.");
lines.push("3. Save the file.");
lines.push("4. Run the validator: `node scripts/audit/validate-unified-77-human-review-decisions.mjs`");
lines.push("5. If validation passes, a follow-up apply script will be available to apply decisions.\n");
lines.push("## Invariants (do not violate)\n");
lines.push("- Do not set fidelityComplete=true without explicit human PASS.");
lines.push("- Do not set FIDELITY_COMPLETE_EVIDENCED=true in the input JSON.");
lines.push("- Do not declare generatedDocumentId or workspace fields.");
lines.push("- Do not use AI/tool as reviewer identifier.\n");

writeFileSync(
  `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.md`,
  lines.join("\n"),
  "utf8"
);

console.log(JSON.stringify({
  ok: true,
  templateJson: `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json`,
  templateMd:   `${OUT}/QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.md`,
  totalForms:   77,
  priorityForms: PRIORITY_CODES_ORDER,
}, null, 2));
