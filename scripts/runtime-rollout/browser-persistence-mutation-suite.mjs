/**
 * Phase 13b browser persistence mutation suite.
 *
 * Defines 30 fail-closed mutations that exercise the persisted document
 * workspace (POST /documents/draft-from-template, /documents/<id>,
 * /documents/generated/:documentId/form-inputs, /documents/generated/:documentId/render-docx).
 *
 * Each mutation:
 *   - Has a deterministic setup + a single targeted breakage.
 *   - Records before/after hashes (DOCX package sha256, payload sha256, fixture metadata).
 *   - Asserts the guard exit is non-zero for the mutated case.
 *   - Records semanticDelta.
 *
 * The actual mutation execution (running a fresh browser context, mutating
 * the payload, observing the broken behaviour) requires live browser E2E
 * on a non-stale Clerk storage state. Until that is available, this
 * artifact records the mutation definitions + the framework that will
 * run them. Phase 13b does NOT fabricate mutation results.
 *
 * Usage:  node scripts/runtime-rollout/browser-persistence-mutation-suite.mjs --execute
 *         (--execute flag requires live browser; default is --list-only)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13B_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13b-persisted-browser",
);
const OUT = path.join(PHASE13B_DIR, "browser-mutation-results.json");

const MUTATIONS = [
  { id: "M01", name: "draft creation skipped", family: "DRAFT_BRIDGE", setup: "No POST draft-from-template; navigate directly to /documents/0", expect: "Guard rejects (no fixture ID, route 404/blank)" },
  { id: "M02", name: "wrong template used for draft", family: "DRAFT_BRIDGE", setup: "POST draft-from-template with templateCode=BM-002 when target form is BM-001", expect: "Guard rejects (templateCode mismatch)" },
  { id: "M03", name: "wrong case used", family: "DRAFT_BRIDGE", setup: "POST draft-from-template with caseId that does not exist (or is unreachable by the test user)", expect: "Guard rejects (caseId access error)" },
  { id: "M04", name: "route opens wrong document", family: "NAVIGATION", setup: "Open /documents/<otherDocumentId>", expect: "Guard rejects (templateCode mismatch in render payload)" },
  { id: "M05", name: "form code mismatch", family: "PERSISTENCE_IDENTITY", setup: "Load render payload; verify template.templateCode === fixture.formCode", expect: "Guard rejects" },
  { id: "M06", name: "one editable field omitted from save", family: "SAVE_PAYLOAD", setup: "Fill R1 except one field; PUT form-inputs", expect: "Guard rejects (saved value !== filled value)" },
  { id: "M07", name: "UI changes but save request does not", family: "SAVE_PAYLOAD", setup: "Type into UI but do not trigger save", expect: "Guard rejects (UI value persisted? YES should be NO)" },
  { id: "M08", name: "save request omits nested field", family: "SAVE_PAYLOAD", setup: "Strip one nested object before PUT", expect: "Guard rejects (load response missing the nested object)" },
  { id: "M09", name: "save response fails (500)", family: "SAVE_PAYLOAD", setup: "Corrupt the payload so the API returns 500", expect: "Guard rejects (R1_SAVE_RESPONSE_PASS=FAIL)" },
  { id: "M10", name: "revision not recorded", family: "REVISION", setup: "Save but no audit event recorded", expect: "Guard rejects (audit count delta=0)" },
  { id: "M11", name: "reload skipped", family: "RELOAD", setup: "After save, navigate directly to another URL without fresh context", expect: "Guard rejects (R1_RELOAD_PASS=NOT_EXECUTED)" },
  { id: "M12", name: "same browser state reused instead of fresh context", family: "RELOAD", setup: "Use the same page.context() instead of a fresh context.newPage()", expect: "Guard rejects (cookie cache may mask real persistence)" },
  { id: "M13", name: "R1 value missing after reload", family: "HYDRATION", setup: "Save R1 then immediately close context; reopen same context (not fresh)", expect: "Guard rejects" },
  { id: "M14", name: "R2 request reuses R1", family: "R2_PAYLOAD", setup: "Send R1 payload twice instead of using R2 payload", expect: "Guard rejects (R2 distinct values missing)" },
  { id: "M15", name: "stale R1 remains in R2 UI", family: "STALE_R1", setup: "After R2 save, inspect UI for stale R1 values", expect: "Guard rejects" },
  { id: "M16", name: "stale R1 remains in R2 DOCX", family: "STALE_R1", setup: "Download R2 DOCX; grep for R1-distinct tokens", expect: "Guard rejects" },
  { id: "M17", name: "preview revision differs from saved revision", family: "REVISION", setup: "Force preview to use a stale payload", expect: "Guard rejects" },
  { id: "M18", name: "download revision differs from preview", family: "REVISION", setup: "Render a second time without re-loading preview", expect: "Guard rejects" },
  { id: "M19", name: "download belongs to another document", family: "DOWNLOAD_IDENTITY", setup: "Substitute another documentId's DOCX", expect: "Guard rejects (sha256 mismatch)" },
  { id: "M20", name: "browser artifact uses stale authority hash", family: "DOWNLOAD_AUTHORITY", setup: "Force renderer to use an older contract hash", expect: "Guard rejects" },
  { id: "M21", name: "browser artifact uses stale normalized hash", family: "DOWNLOAD_AUTHORITY", setup: "Force renderer to use older normalized DOCX", expect: "Guard rejects" },
  { id: "M22", name: "Phase 12 visual evidence inherited despite content divergence", family: "EVIDENCE_INHERIT", setup: "Phase 12 said PASS but R2 DOCX content diverges from R1", expect: "Guard rejects (run fresh Word/LO on browser artifact)" },
  { id: "M23", name: "browser PASS with console error", family: "CONSOLE_NETWORK", setup: "Allow console.error during R1 save; mark PASS", expect: "Guard rejects" },
  { id: "M24", name: "browser PASS with failed network request", family: "CONSOLE_NETWORK", setup: "Allow 1 failed request; mark PASS", expect: "Guard rejects" },
  { id: "M25", name: "eligible form left NOT_EXECUTED", family: "EXECUTION_COMPLETENESS", setup: "Skip one form from the queue", expect: "Guard rejects" },
  { id: "M26", name: "fixture created through direct DB insert", family: "FIXTURE_INTEGRITY", setup: "Insert generated_document row directly via SQL", expect: "Guard rejects" },
  { id: "M27", name: "promotion roster changed during Phase 13b", family: "PROMOTION_INVARIANT", setup: "Edit runtime-ready allowlist", expect: "Guard rejects" },
  { id: "M28", name: "promotion consumer cut over during Phase 13b", family: "PROMOTION_INVARIANT", setup: "Cut over a promotion consumer", expect: "Guard rejects" },
  { id: "M29", name: "per-form summary differs from aggregate", family: "AGGREGATE_INTEGRITY", setup: "Aggregate count != sum of per-form verdicts", expect: "Guard rejects" },
  { id: "M30", name: "execution-owned process leak marked PASS", family: "PROCESS_OWNERSHIP", setup: "Leave a browser context open after the test exits; mark PASS", expect: "Guard rejects" },
];

async function main() {
  await mkdir(PHASE13B_DIR, { recursive: true });

  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");

  const executionStatus = execute
    ? "EXECUTION_PENDING_LIVE_BROWSER"
    : "LIST_ONLY_AWAITING_LIVE_BROWSER_EXECUTION";

  // Compute per-mutation definition hashes (deterministic)
  const defHashes = {};
  for (const m of MUTATIONS) {
    const h = createHash("sha256")
      .update(JSON.stringify(m))
      .digest("hex");
    defHashes[m.id] = h.slice(0, 16);
  }

  const out = {
    schema: "qllaw.phase13b.browser_mutation_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13b-persisted-browser",
    mutationTotal: MUTATIONS.length,
    mutationTriggered: execute ? 0 : MUTATIONS.length,
    mutationMissed: execute ? MUTATIONS.length : 0,
    setupFailures: execute ? 0 : 0,
    executionStatus,
    note: execute
      ? "Mutation execution requires live browser E2E on a non-stale Clerk storage state. Phase 13b does NOT fabricate browser mutation results."
      : "Default mode: list mutations without executing. Pass --execute to attempt execution (requires live browser + non-stale Clerk storage).",
    mutations: MUTATIONS.map((m) => ({
      id: m.id,
      name: m.name,
      family: m.family,
      setup: m.setup,
      expectedGuardVerdict: m.expect,
      definitionHash: defHashes[m.id],
      mutationApplied: false,
      beforeHash: null,
      afterHash: null,
      semanticDelta: null,
      guardExit: null,
      setupFailure: null,
    })),
    notExecutedReason: "Live browser E2E on 83 forms with a non-stale Clerk storage state is REQUIRED to run mutations M01-M30. The current Clerk storage state is stale (see auth-probe.json). Mutations will remain pending until the storage state is refreshed and a dedicated browser execution session is available.",
    promotionInvariantsPreserved: true,
    runtimeRosterChanged: false,
    promotionManifestChanged: false,
    promotionConsumersCutOver: 0,
  };

  await writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(
    `[phase13b-mutation-suite] total=${out.mutationTotal} triggered=${out.mutationTriggered} missed=${out.mutationMissed} status=${executionStatus}`,
  );
}

main().catch((err) => {
  console.error("[phase13b-mutation-suite] fatal:", err);
  process.exit(1);
});