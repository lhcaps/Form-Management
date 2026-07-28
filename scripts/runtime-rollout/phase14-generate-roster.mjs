/**
 * Phase 14 — generate the CANDIDATE runtime roster from promotion manifests.
 *
 * The current live roster is in
 *   packages/form-contracts/src/runtime-readiness.generated.ts
 * which is consumed by the runtime app via the bridge-eligibility.ts
 * alias. This script does NOT modify the live roster; it emits a
 * CANDIDATE roster that becomes the new live roster ONLY after the
 * closure guard passes with a real browser UI verdict.
 *
 * Inputs (all machine-readable):
 *   - lifecycle-matrix-83.json (83 rows of SUPPORTED_BROWSER_LIFECYCLE)
 *   - promotion-eligibility-83.json (per-form PROMOTION_CLASS)
 *   - packages/form-contracts/src/runtime-readiness.generated.ts (current roster)
 *
 * Output:
 *   - generated-runtime-roster.json (CANDIDATE)
 *   - generated-runtime-roster.ts   (CANDIDATE, no compile impact because
 *                                   not imported; lives in the audit dir)
 *   - runtime-roster-accounting.json (counts, no live roster mutation)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);
const ELIGIBILITY = path.join(PHASE14_DIR, "promotion-eligibility-83.json");
const MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const OUT_JSON = path.join(PHASE14_DIR, "generated-runtime-roster.json");
const OUT_TS = path.join(PHASE14_DIR, "generated-runtime-roster.ts");
const OUT_ACC = path.join(PHASE14_DIR, "runtime-roster-accounting.json");

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const eligibility = JSON.parse(await readFile(ELIGIBILITY, "utf8"));
  const matrix = JSON.parse(await readFile(MATRIX, "utf8"));

  // The candidate roster in this turn is empty because promotion is blocked.
  // The structure is still produced so the cutover guard can verify the
  // shape, the deterministic ordering, and the source provenance.
  const candidateCodes = [];
  const evidenceByForm = new Map();
  for (const r of matrix.rows) {
    evidenceByForm.set(r.FORM_CODE, {
      lifecycle: r.SUPPORTED_BROWSER_LIFECYCLE,
      evidencePath: "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/lifecycle-matrix-83.json",
    });
  }

  const candidate = {
    schema: "qllaw.phase14.candidate_runtime_roster/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    sourceManifest: "promotion-eligibility-83.json",
    sourceLifecycleMatrix: "lifecycle-matrix-83.json",
    currentLiveRoster: {
      path: "packages/form-contracts/src/runtime-readiness.generated.ts",
      note: "MUST NOT BE OVERWRITTEN until phase closure guard passes with real browser UI verdict",
    },
    codes: candidateCodes,
    rows: [],
    deterministicOrdering: candidateCodes,
    duplicateCount: 0,
    blockedFormsPresent: false,
    lifecycleClassOverlap: 0,
    rosterHashSha256: sha256(JSON.stringify(candidateCodes)),
  };

  // TypeScript candidate (non-imported, lives in audit dir)
  const candidateTs = `/**
 * CANDIDATE runtime roster — Phase 14.
 *
 * DO NOT IMPORT FROM THIS FILE. The live roster is in
 * packages/form-contracts/src/runtime-readiness.generated.ts.
 *
 * This file is emitted by scripts/runtime-rollout/phase14-generate-roster.mjs
 * and exists for closure-guard verification only.
 *
 * Roster is empty in this turn because Phase 14 browser UI evidence is
 * BLOCKED_BY_AUTH_REFRESH_REQUIRED. When the next turn produces real
 * Playwright browser UI verdicts for all 83 forms, this file will be
 * regenerated and used as the source for a controlled cutover to the
 * live roster.
 *
 * Generated at: ${new Date().toISOString()}
 */
export const PHASE14_CANDIDATE_RUNTIME_ROSTER = ${JSON.stringify(candidateCodes, null, 2)} as const;
export const PHASE14_CANDIDATE_ROSTER_HASH_SHA256 = "${candidate.rosterHashSha256}";
export const PHASE14_CANDIDATE_ROSTER_GENERATED_AT = "${new Date().toISOString()}";
`;

  const accounting = {
    schema: "qllaw.phase14.runtime_roster_accounting/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    candidateRosterCount: candidateCodes.length,
    runtimeReadyCount: candidateCodes.length,
    skeletonCount: 213 - candidateCodes.length,
    reconciliation: {
      visualPassInput: 83,
      existingRuntimeReadyWithin83: 6,
      newPromotionCandidates: 77,
      expectedIfBrowserPass: 83,
      currentCandidate: candidateCodes.length,
      delta: candidateCodes.length - 83,
      deltaReason: "Real browser UI evidence is BLOCKED_BY_AUTH_REFRESH_REQUIRED. Candidate roster stays empty. The next turn with fresh Clerk storage state will produce a non-empty candidate.",
    },
    rosterGuardChecks: {
      promotionRowsEqual83: false,
      duplicateCount: 0,
      blocked130FormsNotAdded: true,
      noLiveRosterOverwrite: true,
      aggregateTotals: "213=runtimeReady+scaffold(130)+blockedForms(0) — wait, no: 213 forms total. The 83 visual-PASS + 130 UPSTREAM_RENDER_BLOCKED = 213. The candidate roster contains 0 of the 83 in this turn.",
    },
    noCommit: true,
    noPush: true,
    noDeploy: true,
    noLiveRosterEdit: true,
  };

  await writeFile(OUT_JSON, JSON.stringify(candidate, null, 2));
  await writeFile(OUT_TS, candidateTs);
  await writeFile(OUT_ACC, JSON.stringify(accounting, null, 2));

  console.log(JSON.stringify({
    artifactsWritten: [
      path.relative(REPO_ROOT, OUT_JSON),
      path.relative(REPO_ROOT, OUT_TS),
      path.relative(REPO_ROOT, OUT_ACC),
    ],
    candidateRosterCount: candidateCodes.length,
    rosterHash: candidate.rosterHashSha256,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-roster] fatal:", err);
  process.exit(1);
});
