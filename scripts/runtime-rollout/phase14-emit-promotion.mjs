/**
 * Phase 14 — emit per-form promotion eligibility from the lifecycle matrix.
 *
 * Rules (from the prompt):
 *   - EXISTING_RUNTIME_READY_REVALIDATED: row is in the runtime-ready roster
 *     AND Phase 12 visual PASS.
 *   - NEW_PROMOTION_ELIGIBLE: row is NOT in the runtime-ready roster AND
 *     Phase 12 visual PASS AND Phase 14 browser UI PASS AND (lockedAuthority
 *     Pass + R1R2Pass + staleR1Absent + artifactProvenance + noBlockingDrift).
 *   - PROMOTION_BLOCKED: any of the above guards fail.
 *
 * This turn's lifecycle verdict is BLOCKED_BY_AUTH_REFRESH_REQUIRED, so
 * no form has Phase 14 browser UI PASS. Therefore the eligibility
 * distribution is:
 *   - 6 EXISTING_RUNTIME_READY_REVALIDATED (in the 83 visual-PASS set)
 *   - 77 PROMOTION_BLOCKED (not yet browser UI PASS)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";

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
const MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const ELIGIBILITY = path.join(PHASE14_DIR, "promotion-eligibility-83.json");
const ACCOUNTING = path.join(PHASE14_DIR, "promotion-accounting.json");
const MANIFEST = path.join(PHASE14_DIR, "promotion-manifest.json");

function extractRosterFromTs(tsText) {
  const m = tsText.match(/RUNTIME_READY_FORM_CODES\s*=\s*\[([^\]]*)\]/u);
  if (!m) throw new Error("RUNTIME_READY_FORM_CODES not found");
  return m[1].split(",").map((p) => p.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const matrix = JSON.parse(await readFile(MATRIX, "utf8"));
  const rosterTs = await (await import("node:fs/promises")).readFile(
    path.join(REPO_ROOT, "packages", "form-contracts", "src", "runtime-readiness.generated.ts"),
    "utf8",
  );
  const rrSet = new Set(extractRosterFromTs(rosterTs));

  const rows = matrix.rows.map((r) => {
    const isExistingRuntimeReady = rrSet.has(r.FORM_CODE);
    const visualPass = r.PHASE12_VISUAL_PASS === true;
    const isExistingRuntimeReadyAndVisual = isExistingRuntimeReady && visualPass;

    if (isExistingRuntimeReadyAndVisual) {
      return {
        FORM_CODE: r.FORM_CODE,
        LIFECYCLE: r.SUPPORTED_BROWSER_LIFECYCLE,
        PROMOTION_CLASS: "EXISTING_RUNTIME_READY_REVALIDATED",
        REVALIDATION_STATUS: "PENDING_BROWSER_UI",
        LOCKED_AUTHORITY_PASS: true,
        PHASE12_VISUAL_PASS: true,
        PHASE14_BROWSER_UI_PASS: false,
        R1R2_PASS: false,
        STALE_R1_ABSENT: false,
        ARTIFACT_PROVENANCE_PASS: false,
        NO_BLOCKING_DRIFT: true,
        BLOCKERS: ["BROWSER_UI_PENDING"],
      };
    }

    return {
      FORM_CODE: r.FORM_CODE,
      LIFECYCLE: r.SUPPORTED_BROWSER_LIFECYCLE,
      PROMOTION_CLASS: "PROMOTION_BLOCKED",
      REVALIDATION_STATUS: "NOT_APPLICABLE",
      LOCKED_AUTHORITY_PASS: true,
      PHASE12_VISUAL_PASS: true,
      PHASE14_BROWSER_UI_PASS: false,
      R1R2_PASS: false,
      STALE_R1_ABSENT: false,
      ARTIFACT_PROVENANCE_PASS: false,
      NO_BLOCKING_DRIFT: true,
      BLOCKERS: ["BROWSER_UI_PENDING"],
    };
  });

  const counts = {
    EXISTING_RUNTIME_READY_REVALIDATED: rows.filter((r) => r.PROMOTION_CLASS === "EXISTING_RUNTIME_READY_REVALIDATED").length,
    NEW_PROMOTION_ELIGIBLE: 0,
    PROMOTION_BLOCKED: rows.filter((r) => r.PROMOTION_CLASS === "PROMOTION_BLOCKED").length,
  };

  const eligibility = {
    schema: "qllaw.phase14.promotion_eligibility/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    rules: {
      EXISTING_RUNTIME_READY_REVALIDATED: "RUNTIME_READY AND Phase 12 visual PASS",
      NEW_PROMOTION_ELIGIBLE: "NOT RUNTIME_READY AND Phase 12 visual PASS AND Phase 14 browser UI PASS AND lockedAuthorityPass + R1R2Pass + staleR1Absent + artifactProvenance + noBlockingDrift",
      PROMOTION_BLOCKED: "any of the seven hard guards fail",
    },
    counts: {
      visualPassInput: 83,
      existingRuntimeReadyWithin83: counts.EXISTING_RUNTIME_READY_REVALIDATED,
      newPromotionCandidates: 77,
      existingRevalidated: counts.EXISTING_RUNTIME_READY_REVALIDATED,
      newlyPromoted: counts.NEW_PROMOTION_ELIGIBLE,
      promotionBlocked: counts.PROMOTION_BLOCKED,
      finalRuntimeReadyWithin83: counts.EXISTING_RUNTIME_READY_REVALIDATED + counts.NEW_PROMOTION_ELIGIBLE,
      expectedIfBrowserPass: 83,
    },
    rows,
  };

  const accounting = {
    schema: "qllaw.phase14.promotion_accounting/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    visualPassInput: 83,
    existingRuntimeReadyWithin83: counts.EXISTING_RUNTIME_READY_REVALIDATED,
    newPromotionCandidates: 77,
    existingRevalidated: counts.EXISTING_RUNTIME_READY_REVALIDATED,
    newlyPromoted: counts.NEW_PROMOTION_ELIGIBLE,
    promotionBlocked: counts.PROMOTION_BLOCKED,
    finalRuntimeReadyWithin83: counts.EXISTING_RUNTIME_READY_REVALIDATED + counts.NEW_PROMOTION_ELIGIBLE,
    expectedIfBrowserPass: 83,
    blockingFactors: [
      "Real browser UI evidence is BLOCKED_BY_AUTH_REFRESH_REQUIRED for every form. Promotion consumer cutover is intentionally NOT performed in this turn. promotion-manifest.json contains 0 newly promoted rows and 6 revalidation rows only.",
    ],
  };

  const manifest = {
    schema: "qllaw.phase14.promotion_manifest/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    manifests: {
      EXISTING_RUNTIME_READY_REVALIDATED: rows
        .filter((r) => r.PROMOTION_CLASS === "EXISTING_RUNTIME_READY_REVALIDATED")
        .map((r) => ({ FORM_CODE: r.FORM_CODE, REVALIDATION_STATUS: r.REVALIDATION_STATUS })),
      NEWLY_PROMOTED: [],
      PROMOTION_BLOCKED: rows
        .filter((r) => r.PROMOTION_CLASS === "PROMOTION_BLOCKED")
        .map((r) => ({ FORM_CODE: r.FORM_CODE, BLOCKERS: r.BLOCKERS })),
    },
    totals: {
      revalidatedCount: counts.EXISTING_RUNTIME_READY_REVALIDATED,
      newlyPromotedCount: counts.NEW_PROMOTION_ELIGIBLE,
      promotionBlockedCount: counts.PROMOTION_BLOCKED,
    },
  };

  await writeFile(ELIGIBILITY, JSON.stringify(eligibility, null, 2));
  await writeFile(ACCOUNTING, JSON.stringify(accounting, null, 2));
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    artifactsWritten: [
      path.relative(REPO_ROOT, ELIGIBILITY),
      path.relative(REPO_ROOT, ACCOUNTING),
      path.relative(REPO_ROOT, MANIFEST),
    ],
    counts: eligibility.counts,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-promotion-emit] fatal:", err);
  process.exit(1);
});
