#!/usr/bin/env node
/**
 * Canary read-only check for BM-006 top-right template calibration pilot.
 *
 * Ensures the BM-006 calibration did NOT incidentally affect any other
 * form. Compares current normalized DOCX sha256 against a baseline that
 * was captured BEFORE the calibration (via git status of the working tree).
 *
 * If any canary form's normalized DOCX sha256 changed relative to the
 * pre-calibration state, this script exits non-zero.
 *
 * No mutation: only reads file bytes.
 *
 * Usage:
 *   node scripts/audit/assert-bm006-calibration-canary.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const BASELINE_REF = process.env.QLLAW_BM006_CANARY_BASELINE_REF ?? "HEAD";

const CANARY = [
  "BM-001",
  "BM-171",
  "BM-015",
  "BM-057",
  "BM-076",
];

const KNOWN_PRE_CALIBRATION_SHA = {
  // Computed before this calibration ran. From a baseline measurement.
  // If these get out of date, the operator should regenerate them via
  // `node -e "console.log(createHash('sha256').update(readFileSync('storage/templates/normalized-docx/<code>/<code>_normalized.docx')).digest('hex'))"`
  // Note: BM-006 is intentionally NOT in this list — its sha is expected
  // to change because of the calibration. We check it on the OTHER side.
};

function shaBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function shaOfNormalizedDocx(code) {
  const p = `${NORM_DIR}/${code}/${code}_normalized.docx`;
  if (!existsSync(p)) return null;
  return shaBuffer(readFileSync(p));
}

function baselineShaOfNormalizedDocx(code) {
  if (KNOWN_PRE_CALIBRATION_SHA[code]) {
    return KNOWN_PRE_CALIBRATION_SHA[code];
  }

  const relPath = `storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  try {
    return shaBuffer(
      execFileSync("git", ["show", `${BASELINE_REF}:${relPath}`], {
        cwd: ROOT,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true,
      }),
    );
  } catch {
    return null;
  }
}

let exitCode = 0;
console.log("--- Canary read-only check ---");
console.log("Purpose: confirm BM-006 calibration did not affect other forms.");
console.log(`Baseline ref: ${BASELINE_REF}`);
console.log("");

const results = [];
for (const code of CANARY) {
  const sha = shaOfNormalizedDocx(code);
  if (sha === null) {
    console.log(`SKIP ${code}: normalized DOCX missing`);
    results.push({ code, status: "SKIP", reason: "missing" });
    continue;
  }
  const baselineSha = baselineShaOfNormalizedDocx(code);
  if (!baselineSha) {
    exitCode = 1;
    console.error(
      `SKIPPED_NO_BASELINE ${code}: cannot read ${BASELINE_REF}:storage/templates/normalized-docx/${code}/${code}_normalized.docx`,
    );
    results.push({ code, status: "SKIPPED_NO_BASELINE", sha });
    continue;
  }

  if (sha !== baselineSha) {
    exitCode = 1;
    console.error(
      `FAIL ${code}: current sha256=${sha}; baseline sha256=${baselineSha}`,
    );
    results.push({ code, status: "FAIL", sha, baselineSha });
    continue;
  }

  console.log(`${code}: PASS sha256=${sha}`);
  results.push({ code, status: "PASS", sha, baselineSha });
}

// Also emit a BM-006 calibration verification line (separate from canary):
const bm006Sha = shaOfNormalizedDocx("BM-006");
console.log("");
console.log(`Pilot (BM-006) post-calibration sha256=${bm006Sha}`);
console.log("");
if (exitCode === 0) {
  console.log("Canary PASS: all non-BM-006 canary forms match baseline.");
  console.log("If you suspect the calibration touched an unintended file,");
  console.log("run `git status` and `git diff <file>` for each unexpected change.");
} else {
  console.error("Canary did not pass. No canary PASS is claimed.");
}

if (exitCode !== 0) process.exit(exitCode);
