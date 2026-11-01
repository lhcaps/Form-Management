/**
 * Phase 14 Turn 4 — Canonical 83-form roster generator.
 *
 * Produces a single canonical roster file representing the lifecycle forms
 * validated under Phase 14 Turn 4 (77 persisted + 6 standalone = 83).
 *
 * This is the "83-form canonical roster" referenced in the task spec.
 * The bridge-eligibility consumer picks these up via runtime-readiness.generated.ts.
 *
 * Writes:
 *   packages/form-contracts/src/runtime-readiness.generated.ts (via phase3)
 *   docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/canonical-83-form-roster.json
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const FINAL83 = path.join(PHASE14_DIR, "turn4-final-83-form-lifecycle-verdicts.json");
const CANONICAL_TS = path.join(REPO_ROOT, "packages/form-contracts/src/runtime-readiness.generated.ts");
const BRIDGE_ELIG = path.join(REPO_ROOT, "packages/form-contracts/src/bridge-eligibility.ts");
const OUT = path.join(PHASE14_DIR, "canonical-83-form-roster.json");

function sha(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const final83 = JSON.parse(await readFile(FINAL83, "utf8"));

  const canonical = final83.rows.map((r) => ({
    formCode: r.FORM_CODE,
    lifecycle: r.LIFECYCLE,
    route: r.ROUTE,
    promotionClass: r.PROMOTION_CLASS,
    evidenceSource: r.EVIDENCE_SOURCE,
    crosswalkVerdict: r.CROSSWALK_VERDICT,
    evidenceSha256: r.DOCX_SHA,
  }));

  const persisted = canonical.filter((r) => r.lifecycle === "PERSISTED_DOCUMENT_WORKSPACE");
  const standalone = canonical.filter((r) => r.lifecycle === "STANDALONE_RUNTIME_PREVIEW");

  // Verify bridge-eligibility.ts consumed the new roster
  const bridgeContents = await readFile(BRIDGE_ELIG, "utf8");
  const usesAlias = /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*RUNTIME_READY_FORM_CODES/.test(bridgeContents);

  // Verify runtime-readiness.generated.ts contains all 83 codes
  const tsContents = await readFile(CANONICAL_TS, "utf8");
  const tsCodes = [...new Set((tsContents.match(/"BM-\d{3}"/g) || []).map((s) => s.replace(/"/g, "")))];

  const out = {
    schema: "qllaw.phase14.canonical_83_form_roster/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    summary: {
      totalForms: canonical.length,
      persistedLifecycleCount: persisted.length,
      standaloneLifecycleCount: standalone.length,
      bridgeEligibilityUsesGeneratedAlias: usesAlias,
      runtimeReadinessGeneratedContainsAll83: tsCodes.length >= canonical.length && canonical.every((r) => tsCodes.includes(r.formCode)),
      canonicalSize: canonical.length,
    },
    forms: canonical,
    integrity: {
      sourceArtifact: path.relative(REPO_ROOT, FINAL83),
      generatedTsPath: path.relative(REPO_ROOT, CANONICAL_TS),
      bridgeEligibilityPath: path.relative(REPO_ROOT, BRIDGE_ELIG),
    },
    note: "Canonical 83-form roster = 77 persisted-document-workspace forms + 6 standalone-runtime-preview forms. Generated from turn4-final-83-form-lifecycle-verdicts.json. Promoted through phase3-generate-roster.mjs which writes runtime-readiness.generated.ts. bridge-eligibility.ts consumes via alias STANDALONE_RUNTIME_TEMPLATE_CODES = RUNTIME_READY_FORM_CODES.",
  };

  await writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out.summary, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-canonical-83-roster] fatal:", err);
  process.exit(1);
});
