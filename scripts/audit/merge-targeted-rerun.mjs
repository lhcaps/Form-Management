#!/usr/bin/env node
/**
 * One-time merge tool for the targeted BM-048/BM-052/BM-053 rerun.
 *
 * Goal: replace the 3 failed rows in .visibility-run.latest.json with the
 * targeted rerun results in .visibility-run.targeted.latest.json, while
 * preserving the 34 other PASS rows and the global.setup.ts setup rows.
 *
 * Does NOT mutate any other artifact; the consumer (curated-22-browser-smoke.mjs)
 * re-renders QLLAW_CURATED_BROWSER_SMOKE.latest.json + .md and
 * QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json from this merged file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const CANON = `${ROOT}/docs/audit/unified-bm-workspace/.visibility-run.latest.json`;
const TARGETED = `${ROOT}/docs/audit/unified-bm-workspace/.visibility-run.targeted.latest.json`;

const canon = JSON.parse(readFileSync(CANON, "utf8"));
const targeted = JSON.parse(readFileSync(TARGETED, "utf8"));

// Index targeted by templateCode.
const targetedByCode = new Map();
for (const row of targeted.codes) {
  if (row.templateCode) targetedByCode.set(row.templateCode, row);
}

const REPLACED = ["BM-048", "BM-052", "BM-053"];

let replaced = 0;
for (const row of canon.codes) {
  if (row.templateCode && REPLACED.includes(row.templateCode)) {
    const newRow = targetedByCode.get(row.templateCode);
    if (!newRow) {
      throw new Error(
        `Targeted run did not contain ${row.templateCode}; cannot merge.`,
      );
    }
    row.status = newRow.status;
    row.durationMs = newRow.durationMs;
    row.errorMessage = newRow.errorMessage;
    replaced++;
  }
}
if (replaced !== REPLACED.length) {
  throw new Error(
    `Expected to replace ${REPLACED.length} rows; replaced ${replaced}.`,
  );
}

// Recompute the stats block so expected/unexpected/passed reflect the
// post-merge state. expected = 36 spec rows (the 3 setup rows from
// global.setup.ts have templateCode=null and are not counted in expected).
const specRows = canon.codes.filter((c) => c.templateCode);
const expected = specRows.length;
const unexpected = specRows.filter((c) => c.status === "failed" || c.status === "timedOut").length;
const flaky = specRows.filter((c) => c.status === "flaky").length;
const passed = expected - unexpected - flaky;
canon.stats = {
  ...canon.stats,
  expected,
  unexpected,
  flaky,
  passed,
};
canon.passed = passed;
canon.unexpected = unexpected;
canon.flaky = flaky;
canon.skipped = 0;
canon.expected = expected;
canon.durationMs = canon.stats.duration;
canon.targetedRerun = {
  snapshotDate: new Date().toISOString(),
  replacedCodes: REPLACED,
  sourceJson: TARGETED,
  authStrategy: "clerk_ticket_storage_state",
  workers: 1,
  note: "Targeted rerun replaced only BM-048/BM-052/BM-053. Other 34 rows preserved from the prior full run.",
};

writeFileSync(CANON, JSON.stringify(canon, null, 2));
console.log(
  JSON.stringify(
    {
      replaced,
      expected,
      unexpected,
      passed,
      statsSource: TARGETED,
    },
    null,
    2,
  ),
);
