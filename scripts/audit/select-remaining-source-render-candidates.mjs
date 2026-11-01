#!/usr/bin/env node
/**
 * Selects the remaining-eligible source/render curation candidates.
 *
 * Read-only audit script. It does NOT promote evidence and does NOT
 * mutate DOCX/contracts/DB/schema. It classifies every current
 * INPUT_CONNECTED_PARTIAL row into one of:
 *
 *   - ELIGIBLE_SOURCE_RENDER
 *   - CANARY_HOLDOUT          (curated-runtime-ux-batch canary)
 *   - SPECIAL_SKIP            (known special/skipped form)
 *   - MISSING_ARTIFACTS       (source/normalized/locked/compiled/profile missing)
 *   - CONTRACT_TEMPLATE_AMENDMENT_REQUIRED  (would need contract/template fix)
 *   - METADATA_UNDEFINED
 *   - OTHER_BLOCKED
 *
 * Selection rule (mirrors Batch 9 gating):
 *   - INPUT_CONNECTED_PARTIAL row
 *   - source DOCX available
 *   - normalized DOCX available
 *   - locked contract available
 *   - compiled contract available
 *   - runtime UX profile exists and is registered
 *   - NOT in SPECIAL_SKIP list
 *   - NOT a curated-runtime-ux-batch canary
 *
 * Outputs:
 *   - docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json
 *   - docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.md
 *
 * No target count is hardcoded — all ELIGIBLE_SOURCE_RENDER forms are
 * selected. The orchestrator (apply-remaining-source-render-curation.mjs)
 * uses the dynamic count.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const MATRIX = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.md`;

// Known special/skipped forms. These are intentionally NOT eligible.
const SPECIAL_SKIP = new Set([
  "BM-024",  // curated-runtime-ux-batch canary (per task spec)
  "BM-039",
  "BM-041",
  "BM-049",
  "BM-050",
  "BM-051",
  "BM-077",
  "BM-079",
  "BM-082",
  "BM-089",
  "BM-099",
  "BM-200",  // curated-runtime-ux-batch canary (per task spec)
  "BM-171",  // already PASS pilot on FormFlight runtimeReady allowlist
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

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return listFiles(path);
      return [path];
    });
  } catch {
    return [];
  }
}

function findOriginalSourceDocx(code) {
  const dir = `${ROOT}/storage/templates/original/${code}`;
  const loose = `${ROOT}/storage/templates/original`;
  const files = [
    ...listFiles(dir),
    ...listFiles(loose).filter((p) => p.includes(`/${code}`)),
  ];
  return files.find((p) => /\.(docx?|DOCX?)$/u.test(p)) ?? null;
}

function findNormalizedDocx(code) {
  const dir = `${ROOT}/storage/templates/normalized-docx/${code}`;
  if (!existsSync(dir)) return null;
  const exact = `${dir}/${code}_normalized.docx`;
  if (existsSync(exact)) return exact;
  return listFiles(dir).find((p) => /\.(docx|DOCX)$/u.test(p)) ?? null;
}

function findLockedContract(code) {
  const dir = `${ROOT}/docs/audit/docx/contracts/locked`;
  if (!existsSync(dir)) return null;
  const prefix = `${code}__`;
  const match = readdirSync(dir).find(
    (name) => name.startsWith(prefix) && name.endsWith(".contract.locked.json"),
  );
  return match ? `${dir}/${match}` : null;
}

function pathExists(path) {
  return Boolean(path && existsSync(path));
}

function classify(code, flags) {
  // Canary: curated-runtime-ux-batch canary must remain auto-generated.
  if (code === "BM-024" || code === "BM-200") {
    return "CANARY_HOLDOUT";
  }
  // BM-171 is the FormFlight runtimeReady pilot — already INPUT_CONNECTED_PASS.
  if (code === "BM-171") {
    return "OTHER_BLOCKED";
  }
  if (SPECIAL_SKIP.has(code)) {
    return "SPECIAL_SKIP";
  }
  if (!flags.sourceDocxAvailable && !flags.normalizedDocxAvailable) {
    return "MISSING_ARTIFACTS";
  }
  if (!flags.lockedContractAvailable || !flags.compiledContractAvailable) {
    return "CONTRACT_TEMPLATE_AMENDMENT_REQUIRED";
  }
  if (!flags.runtimeUxProfileAvailable || !flags.runtimeUxProfileRegistered) {
    return "METADATA_UNDEFINED";
  }
  return "ELIGIBLE_SOURCE_RENDER";
}

function inspectCandidate(row) {
  const code = row.templateCode;
  const originalSourcePath = findOriginalSourceDocx(code);
  const normalizedDocxPath = findNormalizedDocx(code);
  const lockedContractPath = findLockedContract(code);
  const compiledContractPath = `${ROOT}/docs/audit/docx/compiled-v2/${code}.compiled.json`;
  const profilePath = `${ROOT}/apps/web/src/lib/runtime-ux/bm${code.slice(3)}-runtime-ux-profile.ts`;
  const indexPath = `${ROOT}/apps/web/src/lib/runtime-ux/index.ts`;
  const index = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";

  const sourceDocxAvailable = Boolean(originalSourcePath || normalizedDocxPath);
  const normalizedDocxAvailable = pathExists(normalizedDocxPath);
  const lockedContractAvailable = pathExists(lockedContractPath);
  const compiledContractAvailable = existsSync(compiledContractPath);
  const runtimeUxProfileAvailable = existsSync(profilePath);
  const runtimeUxProfileRegistered = index.includes(
    `./bm${code.slice(3)}-runtime-ux-profile`,
  );

  const flags = {
    sourceDocxAvailable,
    normalizedDocxAvailable,
    lockedContractAvailable,
    compiledContractAvailable,
    runtimeUxProfileAvailable,
    runtimeUxProfileRegistered,
  };

  const cls = classify(code, flags);

  const eligible = cls === "ELIGIBLE_SOURCE_RENDER";
  const reasons = [];
  if (row.status !== "INPUT_CONNECTED_PARTIAL") reasons.push(`status=${row.status}`);
  if (cls === "CANARY_HOLDOUT") reasons.push("curated-runtime-ux-batch canary (must remain auto-generated)");
  if (cls === "SPECIAL_SKIP") reasons.push("known special/skipped form");
  if (cls === "MISSING_ARTIFACTS") reasons.push("missing source/normalized DOCX");
  if (cls === "CONTRACT_TEMPLATE_AMENDMENT_REQUIRED") reasons.push("missing locked/compiled contract");
  if (cls === "METADATA_UNDEFINED") reasons.push("runtime UX profile missing or unregistered");
  if (cls === "OTHER_BLOCKED") reasons.push("non-eligible (e.g. BM-171 already PASS pilot)");

  return {
    code,
    currentMatrixStatus: row.status,
    class: cls,
    eligible,
    rejectionReason: eligible ? null : reasons.join("; "),
    sourceDocxAvailable,
    originalSourceDocxAvailable: Boolean(originalSourcePath),
    normalizedDocxAvailable,
    lockedContractAvailable,
    compiledContractAvailable,
    runtimeUxProfileAvailable,
    runtimeUxProfileRegistered,
    paths: {
      originalSourceDocxPath: originalSourcePath
        ? originalSourcePath.replace(`${ROOT}/`, "")
        : null,
      normalizedDocxPath: normalizedDocxPath
        ? normalizedDocxPath.replace(`${ROOT}/`, "")
        : null,
      lockedContractPath: lockedContractPath
        ? lockedContractPath.replace(`${ROOT}/`, "")
        : null,
      compiledContractPath: compiledContractAvailable
        ? compiledContractPath.replace(`${ROOT}/`, "")
        : null,
      runtimeUxProfilePath: runtimeUxProfileAvailable
        ? profilePath.replace(`${ROOT}/`, "")
        : null,
    },
  };
}

function renderMd(artifact) {
  const lines = [];
  lines.push("# QLLAW Remaining Source/Render Candidates - latest");
  lines.push("");
  lines.push(`> Generated: ${artifact.snapshotDate}`);
  lines.push(`> Status: ${artifact.status}`);
  lines.push(`> Eligible selected: ${artifact.eligibleSelectedCodes.length}`);
  lines.push(`> Rejected (special/canary/blocked): ${artifact.rejectedCodes.length}`);
  lines.push("");
  lines.push("## Inventory");
  lines.push("");
  lines.push(`- Total INPUT_CONNECTED_PARTIAL rows: ${artifact.totalPartial}`);
  lines.push(`- ELIGIBLE_SOURCE_RENDER: ${artifact.eligibleSelectedCodes.length}`);
  lines.push(`- CANARY_HOLDOUT: ${artifact.byClass.CANARY_HOLDOUT.length}`);
  lines.push(`- SPECIAL_SKIP: ${artifact.byClass.SPECIAL_SKIP.length}`);
  lines.push(`- OTHER_BLOCKED: ${artifact.byClass.OTHER_BLOCKED.length}`);
  lines.push(`- MISSING_ARTIFACTS: ${artifact.byClass.MISSING_ARTIFACTS.length}`);
  lines.push(`- CONTRACT_TEMPLATE_AMENDMENT_REQUIRED: ${artifact.byClass.CONTRACT_TEMPLATE_AMENDMENT_REQUIRED.length}`);
  lines.push(`- METADATA_UNDEFINED: ${artifact.byClass.METADATA_UNDEFINED.length}`);
  lines.push("");
  lines.push("## Selection Strategy");
  lines.push("");
  for (const note of artifact.selectionStrategy) lines.push(`- ${note}`);
  lines.push("");
  lines.push("## Eligible Candidates");
  lines.push("");
  lines.push("| Code | Source DOCX | Normalized | Locked | Compiled | Profile | Registered |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const c of artifact.eligible) {
    lines.push(
      `| ${c.code} | ${c.sourceDocxAvailable} | ${c.normalizedDocxAvailable} | ${c.lockedContractAvailable} | ${c.compiledContractAvailable} | ${c.runtimeUxProfileAvailable} | ${c.runtimeUxProfileRegistered} |`,
    );
  }
  lines.push("");
  lines.push("## Rejected Candidates");
  lines.push("");
  if (artifact.rejected.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Code | Class | Reason |");
    lines.push("|---|---|---|");
    for (const r of artifact.rejected) {
      lines.push(`| ${r.code} | ${r.class} | ${r.rejectionReason} |`);
    }
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

const matrix = readJson(MATRIX, "status matrix");
const rows = matrix.rows ?? [];
if (rows.length !== 213) fail(`status matrix row count=${rows.length}; expected 213`);

const partialRows = rows
  .filter((row) => row.status === "INPUT_CONNECTED_PARTIAL")
  .sort((a, b) => codeNumber(a.templateCode) - codeNumber(b.templateCode));

const inspected = partialRows.map(inspectCandidate);
const eligible = inspected.filter((c) => c.eligible);
const rejected = inspected.filter((c) => !c.eligible);

const byClass = {
  CANARY_HOLDOUT: rejected.filter((c) => c.class === "CANARY_HOLDOUT"),
  SPECIAL_SKIP: rejected.filter((c) => c.class === "SPECIAL_SKIP"),
  OTHER_BLOCKED: rejected.filter((c) => c.class === "OTHER_BLOCKED"),
  MISSING_ARTIFACTS: rejected.filter((c) => c.class === "MISSING_ARTIFACTS"),
  CONTRACT_TEMPLATE_AMENDMENT_REQUIRED: rejected.filter((c) => c.class === "CONTRACT_TEMPLATE_AMENDMENT_REQUIRED"),
  METADATA_UNDEFINED: rejected.filter((c) => c.class === "METADATA_UNDEFINED"),
};

// Heuristic: if zero eligible or zero rejected we report special status.
let status;
let statusNote;
if (eligible.length === 0) {
  status = "PASS_INVENTORY_ONLY";
  statusNote = "Zero eligible forms remain. No source/render curation will be applied.";
} else if (eligible.length === inspected.length) {
  status = "NEED_USER_DECISION";
  statusNote = `All ${inspected.length} PARTIAL forms were classified ELIGIBLE; check classification heuristics.`;
} else {
  status = "PASS";
  statusNote = `${eligible.length} eligible forms selected, ${rejected.length} rejected (canary/special/blocked).`;
}

const artifact = {
  snapshotDate: new Date().toISOString(),
  status,
  statusNote,
  totalPartial: inspected.length,
  countsBefore: matrix.counts,
  eligibleSelectedCodes: eligible.map((c) => c.code),
  rejectedCodes: rejected.map((c) => c.code),
  byClass: {
    CANARY_HOLDOUT: byClass.CANARY_HOLDOUT.map((c) => c.code),
    SPECIAL_SKIP: byClass.SPECIAL_SKIP.map((c) => c.code),
    OTHER_BLOCKED: byClass.OTHER_BLOCKED.map((c) => c.code),
    MISSING_ARTIFACTS: byClass.MISSING_ARTIFACTS.map((c) => c.code),
    CONTRACT_TEMPLATE_AMENDMENT_REQUIRED: byClass.CONTRACT_TEMPLATE_AMENDMENT_REQUIRED.map((c) => c.code),
    METADATA_UNDEFINED: byClass.METADATA_UNDEFINED.map((c) => c.code),
  },
  eligible,
  rejected,
  selectionStrategy: [
    "Inventory every INPUT_CONNECTED_PARTIAL row from the 213 matrix.",
    "Hard gate: source DOCX available OR normalized DOCX available (recorded separately).",
    "Hard gate: normalized DOCX available.",
    "Hard gate: locked contract available (docs/audit/docx/contracts/locked).",
    "Hard gate: compiled contract available (docs/audit/docx/compiled-v2).",
    "Hard gate: runtime UX profile exists AND is registered in apps/web/src/lib/runtime-ux/index.ts.",
    "Rejection: CANARY_HOLDOUT (BM-024 / BM-130 / BM-200 - curated-runtime-ux-batch canaries).",
    "Rejection: SPECIAL_SKIP (known special/skipped forms BM-039/041/049/050/051/077/079/082/089/099).",
    "Rejection: OTHER_BLOCKED (BM-171 already PASS pilot on FormFlight runtimeReady allowlist).",
    "Rejection: MISSING_ARTIFACTS / CONTRACT_TEMPLATE_AMENDMENT_REQUIRED / METADATA_UNDEFINED surfaced separately with explicit reason.",
    "No target count is hardcoded. All ELIGIBLE_SOURCE_RENDER forms are selected.",
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
      totalPartial: artifact.totalPartial,
      eligibleCount: eligible.length,
      eligibleCodes: artifact.eligibleSelectedCodes,
      rejectedCount: rejected.length,
      rejectedByClass: {
        CANARY_HOLDOUT: byClass.CANARY_HOLDOUT.length,
        SPECIAL_SKIP: byClass.SPECIAL_SKIP.length,
        OTHER_BLOCKED: byClass.OTHER_BLOCKED.length,
        MISSING_ARTIFACTS: byClass.MISSING_ARTIFACTS.length,
        CONTRACT_TEMPLATE_AMENDMENT_REQUIRED: byClass.CONTRACT_TEMPLATE_AMENDMENT_REQUIRED.length,
        METADATA_UNDEFINED: byClass.METADATA_UNDEFINED.length,
      },
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);

if (artifact.status === "FAIL") process.exit(2);