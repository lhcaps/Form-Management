#!/usr/bin/env node
/**
 * Selects source/render-only browser-visibility smoke candidates.
 *
 * Read-only audit script. It does NOT promote evidence and does NOT
 * mutate DOCX/contracts/DB/schema/route. It enumerates the rows of the
 * 213 matrix that are eligible for a browser-visibility smoke under the
 * source/render-only contract.
 *
 * Selection rule (data-driven; no hardcoded count):
 *   - status === INPUT_CONNECTED_PASS
 *   - sourceRenderVerified === true
 *   - browserVerified is NOT_RUN / false / null / undefined / missing
 *   - NOT in the 12 PARTIAL holdouts (CANARY_HOLDOUT + SPECIAL_SKIP)
 *   - NOT already browserVerified === true unless EXPLICIT_REVERIFY=true
 *
 * Records source-batch provenance per form:
 *   - curated-37     (the original 37)
 *   - batch3         (20 BM-055..BM-069, BM-071..BM-075)
 *   - batch4         (20 BM-076, BM-078, BM-080..BM-083, etc.)
 *   - batch5         (20 BM-101..BM-120)
 *   - batch6         (20 BM-121..BM-140)
 *   - batch7         (20 BM-141..BM-160)
 *   - batch8         (20 BM-161..BM-170, BM-172..BM-181)
 *   - batch9         (20 BM-016, BM-021, BM-025..BM-029, BM-032, BM-034, BM-203..BM-213)
 *   - remaining-source-render-sweep (24 BM-002, BM-003, BM-004, BM-013, BM-182..BM-199, BM-201, BM-202)
 *
 * Outputs:
 *   - docs/audit/unified-bm-workspace/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json
 *   - docs/audit/unified-bm-workspace/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.md
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_SOURCE_RENDER_ONLY_BROWSER_VISIBILITY_CANDIDATES.latest.md`;

// 12 PARTIAL holdouts from previous sweeps. They MUST remain INPUT_CONNECTED_PARTIAL.
const HOLDOUT_PARTIALS = new Set([
  "BM-024", // curated-runtime-ux-batch canary
  "BM-039", // known special/skipped form
  "BM-041",
  "BM-049",
  "BM-050",
  "BM-051",
  "BM-077",
  "BM-079",
  "BM-082",
  "BM-089",
  "BM-099",
  "BM-200", // curated-runtime-ux-batch canary
]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

function codeNumber(code) {
  return Number(String(code).replace(/^BM-/, ""));
}

function isBrowserNotRun(value) {
  if (value === undefined || value === null) return true;
  if (value === false) return true;
  if (value === "NOT_RUN") return true;
  return false;
}

function isStatusNotRun(value) {
  if (value === undefined || value === null) return true;
  if (value === false) return true;
  if (value === "NOT_RUN") return true;
  return false;
}

// Map of code → source batch provenance.
// Returns 'remaining-source-render-sweep' if the code is in the 24-eligible set,
// 'batchN' if it falls in a known batch, or 'curated-37' for the original set.
function assignBatch(code) {
  // Remaining-eligible source/render sweep (24)
  const remainingSet = new Set([
    "BM-002", "BM-003", "BM-004", "BM-013",
    "BM-182", "BM-183", "BM-184", "BM-185", "BM-186", "BM-187",
    "BM-188", "BM-189", "BM-190", "BM-191", "BM-192", "BM-193",
    "BM-194", "BM-195", "BM-196", "BM-197", "BM-198", "BM-199",
    "BM-201", "BM-202",
  ]);
  if (remainingSet.has(code)) return "remaining-source-render-sweep";

  // Batch 9 (20)
  const batch9 = new Set([
    "BM-016", "BM-021", "BM-025", "BM-026", "BM-027", "BM-028", "BM-029",
    "BM-032", "BM-034",
  ]);
  for (let n = 203; n <= 213; n++) batch9.add(`BM-${String(n).padStart(3, "0")}`);
  if (batch9.has(code)) return "batch9";

  // Batch 8 (20): BM-161..BM-170 + BM-172..BM-181
  if (
    (codeNumber(code) >= 161 && codeNumber(code) <= 170) ||
    (codeNumber(code) >= 172 && codeNumber(code) <= 181)
  ) return "batch8";

  // Batch 7 (20): BM-141..BM-160
  if (codeNumber(code) >= 141 && codeNumber(code) <= 160) return "batch7";

  // Batch 6 (20): BM-121..BM-140
  if (codeNumber(code) >= 121 && codeNumber(code) <= 140) return "batch6";

  // Batch 5 (20): BM-101..BM-120
  if (codeNumber(code) >= 101 && codeNumber(code) <= 120) return "batch5";

  // Batch 4 (20): the curated batch4 set
  const batch4 = new Set([
    "BM-076", "BM-078", "BM-080", "BM-081", "BM-083", "BM-084", "BM-085",
    "BM-086", "BM-087", "BM-088", "BM-090", "BM-091", "BM-092", "BM-093",
    "BM-094", "BM-095", "BM-096", "BM-097", "BM-098", "BM-100",
  ]);
  if (batch4.has(code)) return "batch4";

  // Batch 3 (20): BM-055..BM-069 + BM-071..BM-075
  const batch3 = new Set([
    "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060", "BM-061",
    "BM-062", "BM-063", "BM-064", "BM-065", "BM-066", "BM-067", "BM-068",
    "BM-069", "BM-071", "BM-072", "BM-073", "BM-074", "BM-075",
  ]);
  if (batch3.has(code)) return "batch3";

  // Everything else that is INPUT_CONNECTED_PASS is the original curated 37.
  return "curated-37";
}

function renderMd(artifact) {
  const lines = [];
  lines.push("# QLLAW Source/Render-Only Browser Visibility Candidates - latest");
  lines.push("");
  lines.push(`> Generated: ${artifact.snapshotDate}`);
  lines.push(`> Status: ${artifact.status}`);
  lines.push(`> Selected: ${artifact.selectedCodes.length}`);
  lines.push(`> Skipped (already browserVerified): ${artifact.byReason.alreadyBrowserVerified.length}`);
  lines.push(`> Skipped (12 PARTIAL holdouts, none eligible): ${artifact.byReason.holdoutPartial.length}`);
  lines.push("");
  lines.push("## Selection Strategy");
  lines.push("");
  for (const note of artifact.selectionStrategy) lines.push(`- ${note}`);
  lines.push("");
  lines.push("## Selected Candidates");
  lines.push("");
  lines.push("| Code | Batch | browserVerified (before) | status (before) |");
  lines.push("|---|---|---|---|");
  for (const c of artifact.selected) {
    lines.push(
      `| ${c.code} | ${c.batch} | ${c.browserVerifiedBefore} | ${c.status} |`,
    );
  }
  lines.push("");
  lines.push("## Already browserVerified (not selected unless EXPLICIT_REVERIFY=true)");
  lines.push("");
  if (artifact.byReason.alreadyBrowserVerified.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Code | Browser Verified | Demo | Preview | DOCX | Fidelity |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of artifact.byReason.alreadyBrowserVerified) {
      lines.push(
        `| ${r.code} | ${r.browserVerified} | ${r.demoClickVerified} | ${r.previewClickVerified} | ${r.docxDownloadVerified} | ${r.machineCheckableFidelityStatus} |`,
      );
    }
  }
  lines.push("");
  lines.push("## 12 PARTIAL Holdouts (must remain INPUT_CONNECTED_PARTIAL)");
  lines.push("");
  lines.push("| Code | Class | Reason |");
  lines.push("|---|---|---|");
  const HOLD_REASON = {
    "BM-024": "curated-runtime-ux-batch canary (must remain auto-generated)",
    "BM-200": "curated-runtime-ux-batch canary (must remain auto-generated)",
    "BM-039": "known special/skipped form",
    "BM-041": "known special/skipped form",
    "BM-049": "known special/skipped form",
    "BM-050": "known special/skipped form",
    "BM-051": "known special/skipped form",
    "BM-077": "known special/skipped form",
    "BM-079": "known special/skipped form",
    "BM-082": "known special/skipped form",
    "BM-089": "known special/skipped form",
    "BM-099": "known special/skipped form",
  };
  for (const code of artifact.byReason.holdoutPartial) {
    const cls = (code === "BM-024" || code === "BM-200") ? "CANARY_HOLDOUT" : "SPECIAL_SKIP";
    lines.push(`| ${code} | ${cls} | ${HOLD_REASON[code] ?? "n/a"} |`);
  }
  lines.push("");
  lines.push("## Per-Batch Provenance");
  lines.push("");
  lines.push("| Batch | Selected |");
  lines.push("|---|---|");
  for (const [batch, count] of Object.entries(artifact.byBatch)) {
    lines.push(`| ${batch} | ${count} |`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

const matrix = readJson(MATRIX, "status matrix");
const rows = matrix.rows ?? [];
if (rows.length !== 213) fail(`status matrix row count=${rows.length}; expected 213`);

const explicitReverify = process.env.EXPLICIT_REVERIFY === "true";

const selected = [];
const alreadyBrowserVerified = [];
const holdoutPartial = [];
const nonPassSkipped = [];

for (const row of rows) {
  const code = row.templateCode;

  // 12 holdouts: must remain PARTIAL; never select for browser sweep.
  if (HOLDOUT_PARTIALS.has(code)) {
    if (row.status === "INPUT_CONNECTED_PARTIAL") {
      holdoutPartial.push(code);
    }
    continue;
  }

  if (row.status !== "INPUT_CONNECTED_PASS") {
    nonPassSkipped.push({ code, status: row.status });
    continue;
  }

  // Browser-verified gating.
  const isPass =
    row.sourceRenderVerified === true &&
    isBrowserNotRun(row.browserVerified) &&
    isBrowserNotRun(row.browserVerifiedStatus);

  const browserAlready = row.browserVerified === true;

  if (browserAlready && !explicitReverify) {
    alreadyBrowserVerified.push({
      code,
      browserVerified: row.browserVerified,
      browserVerifiedStatus: row.browserVerifiedStatus,
      demoClickVerified: row.demoClickVerified,
      previewClickVerified: row.previewClickVerified,
      docxDownloadVerified: row.docxDownloadVerified,
      machineCheckableFidelityStatus: row.machineCheckableFidelityStatus,
    });
    continue;
  }

  if (!isPass && !explicitReverify) {
    // Pass row but already browserVerified OR missing sourceRender.
    // We will not select this row.
    if (row.sourceRenderVerified !== true) {
      nonPassSkipped.push({ code, status: row.status, sourceRenderVerified: row.sourceRenderVerified });
    }
    continue;
  }

  const batch = assignBatch(code);

  selected.push({
    code,
    batch,
    status: row.status,
    browserVerifiedBefore: row.browserVerified ?? "NOT_RUN",
    browserVerifiedStatusBefore: row.browserVerifiedStatus ?? "NOT_RUN",
    sourceRenderVerified: row.sourceRenderVerified,
    demoClickVerified: row.demoClickVerified ?? false,
    previewClickVerified: row.previewClickVerified ?? false,
    docxDownloadVerified: row.docxDownloadVerified ?? false,
    machineCheckableFidelityStatus: row.machineCheckableFidelityStatus ?? "NOT_RUN",
    visualPdfReviewStatus: row.visualPdfReviewStatus ?? "NOT_RUN",
    humanReviewStatus: row.humanReviewStatus ?? null,
    fidelityComplete: row.fidelityComplete === true,
  });
}

selected.sort((a, b) => codeNumber(a.code) - codeNumber(b.code));
alreadyBrowserVerified.sort((a, b) => codeNumber(a.code) - codeNumber(b.code));
holdoutPartial.sort();

const byBatch = {};
for (const s of selected) {
  byBatch[s.batch] = (byBatch[s.batch] ?? 0) + 1;
}

let status;
let statusNote;
if (selected.length === 0) {
  status = "PASS_INVENTORY_ONLY";
  statusNote = "Zero forms selected for source/render-only browser-visibility smoke.";
} else {
  status = "PASS";
  statusNote = `${selected.length} form(s) selected for source/render-only browser-visibility smoke.`;
}

const artifact = {
  snapshotDate: new Date().toISOString(),
  status,
  statusNote,
  totalRows: rows.length,
  countsBefore: matrix.counts,
  explicitReverify,
  selectedCodes: selected.map((s) => s.code),
  byReason: {
    alreadyBrowserVerified: alreadyBrowserVerified,
    holdoutPartial: holdoutPartial,
    nonPassSkipped: nonPassSkipped,
  },
  byBatch,
  selected,
  selectionStrategy: [
    "Read 213-row matrix from QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json.",
    "Hard gate: status === INPUT_CONNECTED_PASS.",
    "Hard gate: sourceRenderVerified === true.",
    "Hard gate: browserVerified NOT_RUN / false / null / undefined (unless EXPLICIT_REVERIFY=true).",
    "Hard gate: NOT in 12 PARTIAL holdout set (BM-024, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099, BM-200).",
    "Records source-batch provenance per row (curated-37 / batch3..batch9 / remaining-source-render-sweep).",
    "No target count is hardcoded. Selection is fully data-driven from the matrix.",
    "No DOCX/template/contract/DB/schema mutation is performed by this selector.",
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(ARTIFACT_MD, renderMd(artifact));

console.log(
  JSON.stringify(
    {
      ok: artifact.status !== "FAIL",
      status: artifact.status,
      statusNote: artifact.statusNote,
      selectedCount: selected.length,
      selectedCodes: artifact.selectedCodes,
      byBatch: artifact.byBatch,
      alreadyBrowserVerified: alreadyBrowserVerified.length,
      alreadyBrowserVerifiedCodes: alreadyBrowserVerified.map((r) => r.code),
      holdoutPartial: holdoutPartial.length,
      holdoutPartialCodes: holdoutPartial,
      nonPassSkipped: nonPassSkipped.length,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);

if (artifact.status === "FAIL") process.exit(2);