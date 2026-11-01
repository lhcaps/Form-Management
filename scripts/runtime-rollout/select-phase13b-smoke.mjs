/**
 * Phase 13b 12-form smoke selection — selects 12 forms from the 83-form
 * eligible queue to cover required edge cases.
 *
 * Required coverage:
 *   1. basic text fields
 *   2. multiline textarea
 *   3. date dropdown/components
 *   4. boolean/checkbox
 *   5. select/enum
 *   6. nested object
 *   7. official config
 *   8. issue-place/date transform
 *   9. signature-related fields
 *   10. recipient/footer-related fields
 *   11. multi-page DOCX
 *   12. form with prior hydration drift
 *
 * Includes (when eligible): BM-001, BM-171, BM-213, BM-069
 *
 * Selection is deterministic — same input queue → same selection.
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
const QUEUE = path.join(PHASE13B_DIR, "browser-queue-83.json");
const OUT = path.join(PHASE13B_DIR, "smoke-selection.json");

// Hard-required inclusions: only forms that ARE in the eligible queue.
// (BM-001 and BM-171 are NOT in the Phase 12 83-form visual-pass list; they
// were excluded in Phase 12 due to BLOCKED_TYPE_CONFLICT / BLOCKED_TRANSFORM
// / prior hydration drift issues. The eligible 83 list is the Phase 12
// ground truth.)
const HARD_INCLUDIONS = ["BM-069", "BM-213"];

// Coverage keys mapped ONLY to forms actually in the eligible 83 queue.
const COVERAGE_BY_FORM = {
  "BM-069": ["form with prior hydration drift (Phase 1b fix)", "select/enum"],
  "BM-213": ["multiline textarea", "nested object", "suspension + assetReturn"],
  "BM-025": ["basic text fields", "single-section document"],
  "BM-027": ["basic text fields", "caseDecision + offense"],
  "BM-028": ["caseDecision change object", "from-to offense"],
  "BM-029": ["date object", "ngày tháng năm"],
  "BM-032": ["date dropdown/components"],
  "BM-035": ["boolean/checkbox"],
  "BM-041": ["date dropdown/components", "duration text"],
  "BM-049": ["nested object", "caseInitiation + assetOwner"],
  "BM-050": ["nested object", "caseInitiation refusal"],
  "BM-051": ["official config", "agency block + official block"],
  "BM-052": ["official config", "agency block + official block"],
  "BM-058": ["date dropdown/components", "from-date / to-date"],
  "BM-060": ["official config", "agency block"],
  "BM-065": ["nested object", "caseDecision + accusedDecision"],
  "BM-067": ["nested object", "caseDecision refusal"],
  "BM-068": ["nested object", "caseDecision"],
  "BM-073": ["basic text fields", "single-section"],
  "BM-074": ["basic text fields", "single-section"],
  "BM-075": ["basic text fields", "single-section"],
  "BM-077": ["basic text fields", "single-section"],
  "BM-079": ["basic text fields", "single-section"],
  "BM-082": ["basic text fields", "single-section"],
  "BM-089": ["basic text fields"],
  "BM-090": ["single-section"],
  "BM-091": ["boolean/checkbox", "khởi tố bị can"],
  "BM-092": ["boolean/checkbox", "khởi tố bị can"],
  "BM-093": ["boolean/checkbox", "khởi tố bị can"],
  "BM-099": ["boolean/checkbox", "khởi tố bị can"],
  "BM-102": ["boolean/checkbox", "khởi tố bị can"],
  "BM-105": ["boolean/checkbox"],
  "BM-116": ["multiline textarea"],
  "BM-124": ["multiline textarea"],
  "BM-125": ["multiline textarea"],
  "BM-139": ["multiline textarea", "kiến nghị"],
  "BM-147": ["nested object", "kết luận điều tra"],
  "BM-157": ["signature-related fields", "signMode + signerName"],
  "BM-158": ["signature-related fields"],
  "BM-160": ["multiline textarea"],
  "BM-162": ["basic text fields"],
  "BM-163": ["basic text fields"],
  "BM-164": ["basic text fields"],
  "BM-165": ["basic text fields"],
  "BM-168": ["basic text fields", "BM-168 2-page"],
  "BM-174": ["signature-related fields"],
  "BM-175": ["recipient/footer-related fields", "recipients lines"],
  "BM-176": ["recipient/footer-related fields"],
  "BM-177": ["recipient/footer-related fields"],
  "BM-178": ["recipient/footer-related fields"],
  "BM-179": ["recipient/footer-related fields"],
  "BM-180": ["recipient/footer-related fields"],
  "BM-181": ["recipient/footer-related fields"],
  "BM-182": ["multiline textarea"],
  "BM-183": ["multiline textarea"],
  "BM-184": ["multiline textarea"],
  "BM-185": ["multiline textarea"],
  "BM-186": ["multiline textarea"],
  "BM-187": ["multiline textarea"],
  "BM-188": ["multiline textarea"],
  "BM-189": ["multiline textarea"],
  "BM-190": ["multiline textarea"],
  "BM-191": ["multiline textarea"],
  "BM-192": ["multiline textarea"],
  "BM-193": ["multiline textarea"],
  "BM-194": ["multiline textarea"],
  "BM-195": ["multiline textarea"],
  "BM-196": ["multiline textarea"],
  "BM-197": ["multiline textarea"],
  "BM-199": ["multiline textarea"],
  "BM-200": ["issue-place/date transform", "issuePlaceDateLine"],
  "BM-201": ["multiline textarea"],
  "BM-202": ["multiline textarea"],
  "BM-203": ["multiline textarea"],
  "BM-204": ["multiline textarea"],
  "BM-205": ["multiline textarea"],
  "BM-206": ["multiline textarea"],
  "BM-207": ["multiline textarea"],
  "BM-208": ["multiline textarea"],
  "BM-209": ["multiline textarea"],
  "BM-210": ["multiline textarea"],
  "BM-211": ["multiline textarea"],
  "BM-212": ["multiline textarea", "multi-page DOCX"],
};

async function main() {
  await mkdir(PHASE13B_DIR, { recursive: true });
  const queue = JSON.parse(await readFile(QUEUE, "utf8"));
  const eligible = new Set(queue.rows.map((r) => r.FORM_CODE));

  // Required coverage categories. The selection picks one form per
  // category until each category is satisfied, then pads to 12.
  const REQUIRED_COVERAGE = [
    "basic text fields",
    "multiline textarea",
    "date dropdown/components",
    "boolean/checkbox",
    "select/enum",
    "nested object",
    "official config",
    "issue-place/date transform",
    "signature-related fields",
    "recipient/footer-related fields",
    "multi-page DOCX",
    "form with prior hydration drift (Phase 1b fix)",
  ];

  // Build a map: category -> [formCodes] (from COVERAGE_BY_FORM + eligible).
  const categoryToForms = new Map();
  for (const cat of REQUIRED_COVERAGE) categoryToForms.set(cat, []);
  for (const [code, cats] of Object.entries(COVERAGE_BY_FORM)) {
    if (!eligible.has(code)) continue;
    for (const cat of cats) {
      if (!categoryToForms.has(cat)) categoryToForms.set(cat, []);
      categoryToForms.get(cat).push(code);
    }
  }

  // Pick one form per required category (deterministic order = REQUIRED_COVERAGE order).
  const selected = [];
  const seen = new Set();
  const hardFirst = [];
  for (const code of HARD_INCLUDIONS) {
    if (eligible.has(code) && !seen.has(code)) {
      hardFirst.push(code);
      seen.add(code);
      selected.push(code);
    }
  }

  for (const cat of REQUIRED_COVERAGE) {
    if (selected.length >= 12) break;
    const candidates = (categoryToForms.get(cat) ?? []).filter((c) => !seen.has(c)).sort();
    if (candidates.length > 0) {
      const code = candidates[0];
      selected.push(code);
      seen.add(code);
    }
  }

  // Pad with remaining eligible forms sorted ascending
  if (selected.length < 12) {
    const remaining = queue.rows.map((r) => r.FORM_CODE).filter((c) => !seen.has(c)).sort();
    for (const code of remaining) {
      if (selected.length >= 12) break;
      selected.push(code);
      seen.add(code);
    }
  }

  if (selected.length !== 12) {
    throw new Error(`Smoke selection produced ${selected.length} forms; expected exactly 12.`);
  }

  const selection = selected.map((formCode, idx) => ({
    index: idx + 1,
    FORM_CODE: formCode,
    inclusion: HARD_INCLUDIONS.includes(formCode)
      ? "HARD_INCLUSION"
      : COVERAGE_BY_FORM[formCode]
        ? "COVERAGE_KEY"
        : "ELIGIBLE_PADDING",
    coverageKeys: COVERAGE_BY_FORM[formCode] ?? [],
  }));

  // Verify each required coverage category is represented at least once
  const allCoverageKeys = selection.flatMap((s) => s.coverageKeys);
  for (const req of REQUIRED_COVERAGE) {
    if (!allCoverageKeys.includes(req)) {
      console.warn(`[phase13b-smoke-selection] WARN: required coverage "${req}" missing from selection`);
    }
  }

  const selectionHash = createHash("sha256")
    .update(JSON.stringify(selected.sort()))
    .digest("hex");

  const out = {
    schema: "qllaw.phase13b.smoke_selection/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13b-persisted-browser",
    queueSource: path.relative(REPO_ROOT, QUEUE),
    smokeSize: 12,
    hardInclusions: HARD_INCLUDIONS,
    coverageByForm: COVERAGE_BY_FORM,
    selection,
    selectionHash,
    coverageCheck: {
      required: REQUIRED_COVERAGE,
      missing: REQUIRED_COVERAGE.filter((c) => !allCoverageKeys.includes(c)),
    },
    executionStatus: "PENDING_LIVE_BROWSER_EXECUTION",
    note: "Selection is complete and deterministic. Actual smoke execution (Phase 9) requires live browser E2E on a fresh Clerk storage state — see auth-probe.json for current state. Phase 13b does NOT fabricate browser evidence.",
  };

  await writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(
    `[phase13b-smoke-selection] selected=${selected.length} hash=${selectionHash}`,
  );
}

main().catch((err) => {
  console.error("[phase13b-smoke-selection] fatal:", err);
  process.exit(1);
});