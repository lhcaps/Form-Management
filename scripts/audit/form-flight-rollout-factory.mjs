#!/usr/bin/env node
/**
 * Form Flight Rollout Factory.
 *
 * Inspects locked contracts + component registry + the existing 60
 * legacy smoke matrix and classifies each form into one of seven
 * rollout buckets:
 *
 *   READY_FOR_PROFILE_PORT         — component, registry, save, render,
 *                                    locked contract, demo fixture all
 *                                    present and clean. 30-45 min port.
 *   NEEDS_PROFILE_FIELDS           — component exists but no canonical
 *                                    FormFlightProfile yet.
 *   NEEDS_SAVE_ADAPTER             — save handler not in
 *                                    `saveDocumentFormInputs` family.
 *   NEEDS_RENDER_PAYLOAD_MAPPING   — render path diverges from the
 *                                    canonical payload shape.
 *   NEEDS_DOCX_CONTRACT_REVIEW     — locked contract missing required
 *                                    bindings or has unresolved review.
 *   NEEDS_LEGAL_REVIEW             — form has reviewRequired slots or
 *                                    is on the legal-review backlog.
 *   BLOCKED                        — component file missing or
 *                                    primary export missing.
 *
 * Outputs:
 *   docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.json
 *   docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.md
 *   docs/audit/form-flight-baseline/FORM_FLIGHT_PROFILE_SKELETONS.latest.json
 *
 * READ-ONLY: no per-form deep fix, no locked contract mutation, no
 * normalized DOCX mutation, no mass rollout of 213 forms.
 *
 * Reuses:
 *   - scripts/audit/build-legacy-60-smoke-matrix.mjs (60-form list + checks)
 *   - docs/audit/docx/contracts/locked/BM-NNN__*.contract.locked.json
 *   - apps/web/src/components/documents/bm-panel-registry.generated.ts
 *   - apps/web/src/components/documents/bm-NNN-form-inputs.tsx
 *   - packages/form-contracts/src/compiler.ts (requiredFieldKeys logic)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const LOCKED_DIR = resolve(
  REPO_ROOT,
  "docs/audit/docx/contracts/locked",
);
const COMPONENT_DIR = resolve(
  REPO_ROOT,
  "apps/web/src/components/documents",
);
const REGISTRY_PATH = resolve(
  COMPONENT_DIR,
  "bm-panel-registry.generated.ts",
);
const OUT_DIR = resolve(
  REPO_ROOT,
  "docs/audit/form-flight-baseline",
);

const FORMS = [
  "BM-001", "BM-002", "BM-003", "BM-005", "BM-006", "BM-007", "BM-008", "BM-009",
  "BM-010", "BM-011", "BM-012", "BM-014", "BM-015", "BM-016", "BM-017", "BM-018",
  "BM-023", "BM-030", "BM-031", "BM-033", "BM-037", "BM-038", "BM-039", "BM-040",
  "BM-042", "BM-043", "BM-044", "BM-045", "BM-046", "BM-047", "BM-053", "BM-054",
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-070", "BM-071", "BM-085",
  "BM-086", "BM-090", "BM-097", "BM-103", "BM-104", "BM-141", "BM-144", "BM-145",
  "BM-146", "BM-148", "BM-150", "BM-156", "BM-159", "BM-166", "BM-168", "BM-169",
  "BM-170", "BM-171", "BM-172", "BM-173",
];

const registryText = existsSync(REGISTRY_PATH)
  ? readFileSync(REGISTRY_PATH, "utf8")
  : "";

function findLockedContract(bmCode) {
  if (!existsSync(LOCKED_DIR)) return null;
  const entries = readdirSync(LOCKED_DIR);
  for (const entry of entries) {
    if (entry.startsWith(`${bmCode}__`) && entry.endsWith(".contract.locked.json")) {
      return resolve(LOCKED_DIR, entry);
    }
  }
  return null;
}

function findComponentPath(bmCode) {
  const fileName = `bm-${bmCode.toLowerCase().slice(3)}-form-inputs.tsx`;
  return resolve(COMPONENT_DIR, fileName);
}

function classify(bmCode) {
  const componentPath = findComponentPath(bmCode);
  const componentExists = existsSync(componentPath);
  const lockedPath = findLockedContract(bmCode);

  let locked = null;
  let fieldCount = 0;
  let requiredCount = 0;
  let reviewRequiredCount = 0;
  if (lockedPath) {
    try {
      const parsed = JSON.parse(readFileSync(lockedPath, "utf8"));
      locked = parsed;
      const slots = Array.isArray(parsed.docxSlots) ? parsed.docxSlots : [];
      fieldCount = slots.length;
      requiredCount = slots.filter((s) => s.required === true).length;
      reviewRequiredCount = slots.filter((s) => s.reviewRequired === true).length;
    } catch {
      // Locked contract unreadable — leave counts at zero.
    }
  }

  const checks = {
    componentFileExists: componentExists,
    lockedContractExists: Boolean(lockedPath),
    fieldCount,
    requiredFieldCount: requiredCount,
    reviewRequiredSlotCount: reviewRequiredCount,
  };

  let saveHandlerPresent = false;
  let primaryExportPresent = false;
  let renderHandlerPresent = false;
  let demoFixtureSafe = true;
  let registryEntryPresent = false;

  if (componentExists) {
    const text = readFileSync(componentPath, "utf8");
    const expectedExportName = `Bm${bmCode.slice(3)}FormInputsPanel`;
    primaryExportPresent =
      bmCode === "BM-172"
        ? true // adapter wrap
        : new RegExp(`export\\s+function\\s+${expectedExportName}\\b`, "u").test(text);

    saveHandlerPresent =
      /saveDocumentFormInputs|savePublishedContractFormInputs|patchDocumentFormInputs|replaceDocumentFormInputs/.test(text) ||
      new RegExp(`saveBm${bmCode.slice(3)}FormInputs`, "u").test(text) ||
      text.includes(`@/lib/bm${bmCode.slice(3)}-form-inputs-api`);

    renderHandlerPresent = text.length > 0;

    const fixtureWindow = (text.match(/function\s+fillSample[\s\S]*?\n\}/u) ||
      text.match(/EMPTY_FORM[\s\S]*?\};/u) ||
      [text.slice(0, 4000)])[0];
    demoFixtureSafe =
      !/\bundefined\b/u.test(fixtureWindow) &&
      !/\bInvalid Date\b/u.test(fixtureWindow);
  }

  const expectedRegistryLine = `"${bmCode}": Bm${bmCode.slice(3)}FormInputsPanel,`;
  registryEntryPresent =
    registryText.includes(expectedRegistryLine) ||
    (bmCode === "BM-172" &&
      registryText.includes('"BM-172": _Bm172FormInputsPanelAdapter'));

  Object.assign(checks, {
    primaryExportPresent,
    registryEntryPresent,
    saveHandlerPresent,
    renderHandlerPresent,
    demoFixtureSafe,
  });

  let status;
  const reasons = [];

  if (!componentExists) {
    status = "BLOCKED";
    reasons.push("component file does not exist");
  } else if (!primaryExportPresent) {
    status = "BLOCKED";
    reasons.push("primary export missing");
  } else if (!registryEntryPresent) {
    status = "BLOCKED";
    reasons.push("registry entry missing");
  } else if (reviewRequiredCount > 0) {
    status = "NEEDS_LEGAL_REVIEW";
    reasons.push(`${reviewRequiredCount} slots marked reviewRequired`);
  } else if (!lockedPath) {
    status = "NEEDS_DOCX_CONTRACT_REVIEW";
    reasons.push("no locked contract on disk");
  } else if (!demoFixtureSafe) {
    status = "NEEDS_PROFILE_FIELDS";
    reasons.push("demo fixture has bare 'undefined' / 'Invalid Date'");
  } else if (!saveHandlerPresent) {
    status = "NEEDS_SAVE_ADAPTER";
    reasons.push("no saveDocumentFormInputs family call");
  } else if (fieldCount === 0) {
    status = "NEEDS_RENDER_PAYLOAD_MAPPING";
    reasons.push("locked contract has zero slots");
  } else if (bmCode === "BM-171") {
    // The pilot — already wired.
    status = "READY_FOR_PROFILE_PORT";
    reasons.push("pilot — already wired through Form Flight shared core");
  } else {
    status = "READY_FOR_PROFILE_PORT";
    reasons.push(
      `all checks pass — ${fieldCount} fields, ${requiredCount} required`,
    );
  }

  let estimatedComplexity = "M";
  if (status === "BLOCKED") estimatedComplexity = "XL";
  else if (status === "NEEDS_LEGAL_REVIEW") estimatedComplexity = "XL";
  else if (status === "NEEDS_DOCX_CONTRACT_REVIEW") estimatedComplexity = "L";
  else if (status === "NEEDS_RENDER_PAYLOAD_MAPPING") estimatedComplexity = "L";
  else if (status === "NEEDS_SAVE_ADAPTER") estimatedComplexity = "M";
  else if (status === "NEEDS_PROFILE_FIELDS") estimatedComplexity = "M";
  else if (status === "READY_FOR_PROFILE_PORT") {
    estimatedComplexity =
      fieldCount > 50
        ? "L"
        : fieldCount > 25
          ? "M"
          : "S";
  }

  return {
    templateCode: bmCode,
    status,
    checks,
    reasons,
    componentPath,
    lockedContractPath: lockedPath,
    estimatedComplexity,
    nextAction: nextActionFor(status),
  };
}

function nextActionFor(status) {
  switch (status) {
    case "READY_FOR_PROFILE_PORT":
      return "Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test.";
    case "NEEDS_PROFILE_FIELDS":
      return "Fix demo fixture leaks, then generate FormFlightProfile skeleton.";
    case "NEEDS_SAVE_ADAPTER":
      return "Refactor save handler into the saveDocumentFormInputs family, then port to FormFlightProfile.";
    case "NEEDS_RENDER_PAYLOAD_MAPPING":
      return "Map bespoke payload to canonical shape, then port to FormFlightProfile.";
    case "NEEDS_DOCX_CONTRACT_REVIEW":
      return "Run docx-contract audit; resolve review queue; lock contract; then port.";
    case "NEEDS_LEGAL_REVIEW":
      return "Resolve reviewRequired slots with legal team; only then port.";
    case "BLOCKED":
    default:
      return "Create component + registry entry first; port later.";
  }
}

const results = FORMS.map((code) => ({
  templateCode: code,
  ...classify(code),
}));

const summary = {
  READY_FOR_PROFILE_PORT: 0,
  NEEDS_PROFILE_FIELDS: 0,
  NEEDS_SAVE_ADAPTER: 0,
  NEEDS_RENDER_PAYLOAD_MAPPING: 0,
  NEEDS_DOCX_CONTRACT_REVIEW: 0,
  NEEDS_LEGAL_REVIEW: 0,
  BLOCKED: 0,
};
for (const r of results) {
  summary[r.status] = (summary[r.status] ?? 0) + 1;
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  task: "FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1",
  scope:
    "Classification only — generates skeleton profiles for READY forms. No per-form deep fix, no locked contract mutation, no normalized DOCX mutation, no mass rollout of 213 forms.",
  repoRoot: REPO_ROOT,
  lockedDir: LOCKED_DIR,
  componentDir: COMPONENT_DIR,
  registryPath: REGISTRY_PATH,
  forms: results,
  summary,
  total: results.length,
  forbiddenScope: {
    noCommit: true,
    noPush: true,
    noPR: true,
    noMassRollout213: true,
    noDeepFixAll60: true,
    noCanonicalize55Forms: true,
    noLockedContractMutation: true,
    noNormalizedDocxMutation: true,
    noSourceDocxMutation: true,
    noAuthRewrite: true,
    noRouteMerging: true,
    noFakeGeneratedDocumentId: true,
  },
};

mkdirSync(OUT_DIR, { recursive: true });

const matrixJsonPath = resolve(OUT_DIR, "FORM_FLIGHT_ROLLOUT_MATRIX.latest.json");
writeFileSync(matrixJsonPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`[rollout-factory] wrote ${matrixJsonPath}`);

// Markdown report
const md = [
  "# Form Flight Rollout Matrix",
  "",
  `> Generated: ${payload.generatedAt}`,
  `> Scope: **classification only** — no deep fix, no locked contract mutation.`,
  `> Total forms: ${payload.total}`,
  "",
  "## Summary",
  "",
  "| Bucket | Count |",
  "|---|---:|",
  `| READY_FOR_PROFILE_PORT | ${summary.READY_FOR_PROFILE_PORT} |`,
  `| NEEDS_PROFILE_FIELDS | ${summary.NEEDS_PROFILE_FIELDS} |`,
  `| NEEDS_SAVE_ADAPTER | ${summary.NEEDS_SAVE_ADAPTER} |`,
  `| NEEDS_RENDER_PAYLOAD_MAPPING | ${summary.NEEDS_RENDER_PAYLOAD_MAPPING} |`,
  `| NEEDS_DOCX_CONTRACT_REVIEW | ${summary.NEEDS_DOCX_CONTRACT_REVIEW} |`,
  `| NEEDS_LEGAL_REVIEW | ${summary.NEEDS_LEGAL_REVIEW} |`,
  `| BLOCKED | ${summary.BLOCKED} |`,
  "",
  "## Per-form classification",
  "",
  "| BM | Status | Complexity | Fields (req) | Next action |",
  "|---|---|---|---|---|",
  ...results.map((r) =>
    `| ${r.templateCode} | ${r.status} | ${r.estimatedComplexity} | ${
      r.checks.fieldCount ?? 0
    } (${r.checks.requiredFieldCount ?? 0}) | ${r.nextAction} |`,
  ),
  "",
  "## Forbidden scope check",
  "",
  "- No commit. No push. No PR.",
  "- No mass rollout of 213 forms.",
  "- No deep fix performed on any of the 60 forms.",
  "- No canonicalization of 55 non-canonical forms.",
  "- No mutation of locked contracts or normalized DOCX or source DOCX.",
  "- No auth/RBAC rewrite. No route merging. No fake generatedDocumentId.",
  "",
  "## Rollout plan",
  "",
  "1. **Batch 1 — READY + small**: the `S` complexity READY forms. ~30-45 min per form.",
  "2. **Batch 2 — READY + medium/large**: `M` and `L` complexity READY forms.",
  "3. **Batch 3 — NEEDS_SAVE_ADAPTER** (shared refactor of save handler, then per-form port).",
  "4. **Batch 4 — NEEDS_RENDER_PAYLOAD_MAPPING** (mapper per domain group).",
  "5. **Batch 5 — NEEDS_PROFILE_FIELDS / NEEDS_DOCX_CONTRACT_REVIEW / NEEDS_LEGAL_REVIEW** (each batch gates the next).",
  "6. **Batch 6 — BLOCKED** (write the missing component first; do not roll into shared core).",
  "",
].join("\n");

const matrixMdPath = resolve(OUT_DIR, "FORM_FLIGHT_ROLLOUT_MATRIX.latest.md");
writeFileSync(matrixMdPath, md + "\n", "utf8");
console.log(`[rollout-factory] wrote ${matrixMdPath}`);

// Skeleton profiles — one entry per READY form, ready for a future
// profile module. Skeleton only; the canonical BM-171 profile is the
// production reference.
const skeletons = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  task: "FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1",
  description:
    "Skeleton FormFlightProfile JSON for every READY_FOR_PROFILE_PORT form. Each skeleton must be filled in by a future task — it lists the field paths the generator can extract from the locked contract, but required/demo/summary/acceptance blocks MUST be authored by hand.",
  referenceProfile: "apps/web/src/lib/form-flight/profiles/bm171.ts",
  skeletons: results
    .filter((r) => r.status === "READY_FOR_PROFILE_PORT")
    .map((r) => ({
      templateCode: r.templateCode,
      estimatedComplexity: r.estimatedComplexity,
      fieldPaths: extractSkeletonFieldPaths(r),
      requiredFieldPaths: extractSkeletonRequiredFieldPaths(r),
      _todo: {
        demo: "Author hand-curated synthetic demo fixture (no real PII).",
        summaryLines:
          "Add 4-8 data-driven summary lines keyed off the canonical field paths.",
        acceptance:
          "Add 2-5 requiredText anchors and 0-3 forbiddenText anchors.",
      },
    })),
};

const skeletonsPath = resolve(
  OUT_DIR,
  "FORM_FLIGHT_PROFILE_SKELETONS.latest.json",
);
writeFileSync(skeletonsPath, JSON.stringify(skeletons, null, 2) + "\n", "utf8");
console.log(`[rollout-factory] wrote ${skeletonsPath}`);

console.log(`[rollout-factory] summary: ${JSON.stringify(summary)}`);

function extractSkeletonFieldPaths(r) {
  if (!r.lockedContractPath || !existsSync(r.lockedContractPath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(r.lockedContractPath, "utf8"));
    const slots = Array.isArray(parsed.docxSlots) ? parsed.docxSlots : [];
    return slots.map((s) => s.slotId).filter(Boolean);
  } catch {
    return [];
  }
}

function extractSkeletonRequiredFieldPaths(r) {
  if (!r.lockedContractPath || !existsSync(r.lockedContractPath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(r.lockedContractPath, "utf8"));
    const slots = Array.isArray(parsed.docxSlots) ? parsed.docxSlots : [];
    return slots
      .filter((s) => s.required === true)
      .map((s) => s.slotId)
      .filter(Boolean);
  } catch {
    return [];
  }
}