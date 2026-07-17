#!/usr/bin/env node
/**
 * Selects the Batch 7 source/render curation candidates.
 *
 * This is a read-only audit script. It does not promote evidence and does
 * not mutate DOCX/contracts/DB/schema. The selection rule is intentionally
 * conservative: numeric order after BM-140, exactly 20 INPUT_CONNECTED_PARTIAL
 * rows if available, skipping known special/skipped forms and forms
 * missing any of the hard gates.
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
const CURATION = `${OUT_DIR}/QLLAW_BATCH7_CURATION.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_BATCH7_CANDIDATES.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_BATCH7_CANDIDATES.latest.md`;

// Forms that are intentionally excluded from Batch 7 even though they
// exist; these require contract/template amendment or are reserved for
// later, dedicated curation phases.
const SPECIAL_SKIP = new Set([
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
]);

const TARGET_COUNT = 20;
const PREFERRED_AFTER = 140;

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

function inspectCandidate(row) {
  const code = row.templateCode;
  const originalSourcePath = findOriginalSourceDocx(code);
  const normalizedDocxPath = findNormalizedDocx(code);
  const lockedContractPath = findLockedContract(code);
  const compiledContractPath = `${ROOT}/docs/audit/docx/compiled-v2/${code}.compiled.json`;
  const profilePath = `${ROOT}/apps/web/src/lib/runtime-ux/bm${code.slice(3)}-runtime-ux-profile.ts`;
  const indexPath = `${ROOT}/apps/web/src/lib/runtime-ux/index.ts`;
  const index = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
  const specialSkipped = SPECIAL_SKIP.has(code);
  const normalizedDocxAvailable = pathExists(normalizedDocxPath);
  const compiledContractAvailable = existsSync(compiledContractPath);
  const lockedContractAvailable = pathExists(lockedContractPath);
  const runtimeUxProfileAvailable = existsSync(profilePath);
  const runtimeUxProfileRegistered = index.includes(
    `./bm${code.slice(3)}-runtime-ux-profile`,
  );
  const sourceDocxAvailable = Boolean(originalSourcePath || normalizedDocxPath);
  const eligible =
    row.status === "INPUT_CONNECTED_PARTIAL" &&
    codeNumber(code) > PREFERRED_AFTER &&
    !specialSkipped &&
    sourceDocxAvailable &&
    normalizedDocxAvailable &&
    lockedContractAvailable &&
    compiledContractAvailable &&
    runtimeUxProfileAvailable &&
    runtimeUxProfileRegistered;

  const reasons = [];
  if (row.status !== "INPUT_CONNECTED_PARTIAL") reasons.push(`status=${row.status}`);
  if (codeNumber(code) <= PREFERRED_AFTER) reasons.push(`not after BM-${PREFERRED_AFTER}`);
  if (specialSkipped) reasons.push("known special/skipped form");
  if (!sourceDocxAvailable) reasons.push("missing source/normalized DOCX");
  if (!normalizedDocxAvailable) reasons.push("missing normalized DOCX");
  if (!lockedContractAvailable) reasons.push("missing locked contract");
  if (!compiledContractAvailable) reasons.push("missing compiled contract");
  if (!runtimeUxProfileAvailable) reasons.push("missing runtime UX profile");
  if (!runtimeUxProfileRegistered) reasons.push("runtime UX profile not registered");

  return {
    code,
    currentMatrixStatus: row.status,
    sourceDocxAvailable,
    originalSourceDocxAvailable: Boolean(originalSourcePath),
    normalizedDocxAvailable,
    lockedContractAvailable,
    compiledContractAvailable,
    runtimeUxProfileAvailable,
    runtimeUxProfileRegistered,
    specialSkipped,
    templateOrContractAmendmentRequired: false,
    eligible,
    rejectionReason: eligible ? null : reasons.join("; "),
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
  lines.push("# QLLAW Batch 7 Candidates - latest");
  lines.push("");
  lines.push(`> Generated: ${artifact.snapshotDate}`);
  lines.push(`> Status: ${artifact.status}`);
  lines.push(`> Selected: ${artifact.selectedCodes.join(", ")}`);
  lines.push("");
  lines.push("## Selection Strategy");
  lines.push("");
  for (const note of artifact.selectionStrategy) lines.push(`- ${note}`);
  lines.push("");
  lines.push("## Selected Candidates");
  lines.push("");
  lines.push("| Code | Matrix | Source DOCX | Normalized | Locked | Compiled | Profile | Registered |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const c of artifact.selected) {
    lines.push(
      `| ${c.code} | ${c.currentMatrixStatus} | ${c.sourceDocxAvailable} | ${c.normalizedDocxAvailable} | ${c.lockedContractAvailable} | ${c.compiledContractAvailable} | ${c.runtimeUxProfileAvailable} | ${c.runtimeUxProfileRegistered} |`,
    );
  }
  lines.push("");
  lines.push("## Rejected Candidates");
  lines.push("");
  if (artifact.rejected.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Code | Reason |");
    lines.push("|---|---|");
    for (const r of artifact.rejected) {
      lines.push(`| ${r.code} | ${r.rejectionReason} |`);
    }
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

const matrix = readJson(MATRIX, "status matrix");
const rows = matrix.rows ?? [];
if (rows.length !== 213) fail(`status matrix row count=${rows.length}; expected 213`);

const inspected = rows
  .slice()
  .sort((a, b) => codeNumber(a.templateCode) - codeNumber(b.templateCode))
  .map(inspectCandidate);

function existingCuratedCodes() {
  if (!existsSync(CURATION)) return [];
  try {
    const artifact = JSON.parse(readFileSync(CURATION, "utf8"));
    if (artifact.status !== "PASS") return [];
    if (!Array.isArray(artifact.codes) || artifact.codes.length !== TARGET_COUNT) {
      return [];
    }
    return artifact.codes;
  } catch {
    return [];
  }
}

const selected = [];
const rejected = [];
const existingCodes = existingCuratedCodes();
const existingCodeSet = new Set(existingCodes);

if (existingCodes.length === TARGET_COUNT) {
  for (const code of existingCodes) {
    const candidate = inspected.find((entry) => entry.code === code);
    if (!candidate) fail(`existing Batch 7 curation code ${code} missing from matrix`);
    const reusable =
      candidate.currentMatrixStatus === "INPUT_CONNECTED_PARTIAL" ||
      candidate.currentMatrixStatus === "INPUT_CONNECTED_PASS";
    if (!reusable) {
      fail(`existing Batch 7 curation code ${code} has status=${candidate.currentMatrixStatus}; expected PARTIAL or PASS`);
    }
    selected.push({
      ...candidate,
      eligible: true,
      rejectionReason: null,
      selectionReason: "reused from QLLAW_BATCH7_CURATION.latest.json for idempotence",
    });
  }
}

for (const candidate of inspected) {
  if (selected.length >= TARGET_COUNT && existingCodeSet.has(candidate.code)) {
    continue;
  }
  if (selected.length < TARGET_COUNT && candidate.eligible) {
    selected.push(candidate);
  } else if (codeNumber(candidate.code) > PREFERRED_AFTER) {
    rejected.push({
      ...candidate,
      rejectionReason:
        candidate.rejectionReason ??
        `not selected after first ${TARGET_COUNT} eligible Batch 7 forms`,
    });
  }
}

const artifact = {
  snapshotDate: new Date().toISOString(),
  status: selected.length === TARGET_COUNT ? "PASS" : "NEED_USER_DECISION",
  targetCount: TARGET_COUNT,
  formsSelected: selected.length,
  selectedCodes: selected.map((c) => c.code),
  rejectedCodes: rejected.map((c) => c.code),
  currentCounts: matrix.counts,
  selected,
  rejected,
  selectionStrategy: [
    `Numeric order after BM-${PREFERRED_AFTER}.`,
    "Only INPUT_CONNECTED_PARTIAL rows are eligible.",
    "Known special/skipped forms are rejected.",
    "Normalized DOCX, locked contract, compiled contract, and registered runtime UX profile are hard gates.",
    "Original source DOCX is recorded separately; the runtime render source for this repo is the normalized DOCX.",
    "No DOCX/template/contract/DB/schema mutation is performed by this selector.",
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
writeFileSync(ARTIFACT_MD, renderMd(artifact));

console.log(
  JSON.stringify(
    {
      ok: artifact.status === "PASS",
      status: artifact.status,
      formsSelected: artifact.formsSelected,
      selectedCodes: artifact.selectedCodes,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);

if (artifact.status !== "PASS") process.exit(2);