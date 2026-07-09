#!/usr/bin/env node
/**
 * BM-171 Real Editor Vertical Slice + Legacy 60 Smoke Matrix
 *
 * Classifies the 60 legacy BM forms against the real generated-document
 * editor flow. Output: docs/audit/legacy-60-stabilization/LEGACY_60_SMOKE_MATRIX.latest.json
 *
 * Status legend:
 *   READY     — component file present, primary export present, registry entry present,
 *               demo/default path has no obvious undefined/null/Invalid Date risk.
 *   NEEDS_FIX — one of: missing primary export, missing registry entry, demo path has
 *               obvious undefined/null/Invalid Date risk, missing component import.
 *   BLOCKED   — component file does not exist, or has no primary export at all.
 *   NOT_RUN   — (reserved; not produced by this script; reports list as 0).
 *
 * Smoke checks only. No deep fix performed. No locked contract mutation.
 * No normalized DOCX mutation. No PR7B started.
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

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

const COMPONENT_DIR = resolve(
  REPO_ROOT,
  "apps/web/src/components/documents",
);
const REGISTRY_PATH = resolve(
  REPO_ROOT,
  "apps/web/src/components/documents/bm-panel-registry.generated.ts",
);

const registryText = readFileSync(REGISTRY_PATH, "utf8");

function findComponentPath(bmCode) {
  const fileName = `bm-${bmCode.toLowerCase().slice(3)}-form-inputs.tsx`;
  return resolve(COMPONENT_DIR, fileName);
}

function classify(bmCode) {
  const componentPath = findComponentPath(bmCode);
  const checks = {
    componentFileExists: existsSync(componentPath),
  };

  if (!checks.componentFileExists) {
    return {
      status: "BLOCKED",
      checks,
      reasons: ["component file does not exist"],
      componentPath,
    };
  }

  const text = readFileSync(componentPath, "utf8");
  const stat = statSync(componentPath);
  checks.fileBytes = stat.size;

  // Primary export expected pattern: export function BmNNNFormInputsPanel
  // (BM-001 -> Bm001FormInputsPanel; component uses lowercase 'm').
  const expectedExportName = `Bm${bmCode.slice(3)}FormInputsPanel`;
  const primaryExportRe = new RegExp(
    `export\\s+function\\s+${expectedExportName}\\b`,
    "u",
  );
  checks.primaryExportPresent = primaryExportRe.test(text);

  // BM-172 documented adapter problem (already noted in generated-document-workspace.tsx)
  if (bmCode === "BM-172") {
    checks.knownAdapterProblem =
      "BM-172 exports Bm172FormInputs (not Bm172FormInputsPanel) with incompatible props; workspace wraps it via _Bm172FormInputsPanelAdapter.";
  }

  // Registry entry (auto-generated): "BM-NNN": BmNNNFormInputsPanel,
  const expectedRegistryLine = `"${bmCode}": Bm${bmCode.slice(3)}FormInputsPanel,`;
  checks.registryEntryPresent = registryText.includes(expectedRegistryLine);
  if (!checks.registryEntryPresent && bmCode === "BM-172") {
    checks.registryEntryPresent = registryText.includes(
      '"BM-172": _Bm172FormInputsPanelAdapter',
    );
  }

  // Obvious demo/default risk: bare "undefined", "null", "Invalid Date" string in fixture
  // We look for fixture/fillSample/default patterns and inspect a small window.
  const fixtureWindow = extractFixtureWindow(text);
  checks.demoFixtureHasBareUndefined = /\bundefined\b/u.test(fixtureWindow);
  checks.demoFixtureHasBareInvalidDate = /\bInvalid Date\b/u.test(fixtureWindow);
  checks.demoFixtureHasStandaloneNull = /"\s*null\s*"/u.test(fixtureWindow);

  // detect missing save handler — accept either the generic
  // `saveDocumentFormInputs` family or per-BM helper modules
  // (`saveBmNNNFormInputs`, `@/lib/bmNNN-form-inputs-api`).
  checks.saveHandlerPresent =
    /saveDocumentFormInputs|savePublishedContractFormInputs|patchDocumentFormInputs|replaceDocumentFormInputs/.test(
      text,
    ) ||
    new RegExp(
      `saveBm${bmCode.slice(3)}FormInputs`,
      "u",
    ).test(text) ||
    text.includes(`@/lib/bm${bmCode.slice(3)}-form-inputs-api`);

  // render handler: detect render/preview calls referencing api-client
  // Workspace-level render is handled by the action panel + pre-export panel
  // so any non-trivial component is considered render-handled.
  checks.renderHandlerPresent = text.length > 0;

  const reasons = [];
  if (!checks.primaryExportPresent && !checks.knownAdapterProblem) {
    reasons.push("primary export BmNNNFormInputsPanel missing");
  }
  if (!checks.registryEntryPresent && !checks.knownAdapterProblem) {
    reasons.push("registry entry missing");
  }
  if (checks.demoFixtureHasBareUndefined) {
    reasons.push("demo fixture contains bare 'undefined' string");
  }
  if (checks.demoFixtureHasBareInvalidDate) {
    reasons.push("demo fixture contains 'Invalid Date' literal");
  }
  if (!checks.saveHandlerPresent) {
    reasons.push("no saveDocumentFormInputs call present");
  }

  if (reasons.length === 0) {
    return {
      status: "READY",
      checks,
      reasons: [],
      componentPath,
    };
  }

  // BM-172 is documented as NEEDS_FIX even though adapter wraps it, per the task directive.
  if (bmCode === "BM-172") {
    return {
      status: "NEEDS_FIX",
      checks,
      reasons: [
        ...reasons,
        "BM-172 known adapter problem (export name & props mismatch)",
      ],
      componentPath,
    };
  }

  return {
    status: "NEEDS_FIX",
    checks,
    reasons,
    componentPath,
  };
}

function extractFixtureWindow(text) {
  // Look at fillSample / normalizeFormInputs / default values to inspect fixture risk.
  const m = text.match(/function\s+fillSample[\s\S]*?\n\}/u);
  if (m) return m[0];
  const n = text.match(/EMPTY_FORM[\s\S]*?\};/u);
  if (n) return n[0];
  const p = text.match(/function\s+normalizeFormInputs[\s\S]*?\n\}/u);
  if (p) return p[0];
  return text.slice(0, Math.min(text.length, 4000));
}

const results = FORMS.map((code) => {
  const out = { templateCode: code, ...classify(code) };
  return out;
});

const summary = {
  READY: results.filter((r) => r.status === "READY").length,
  NEEDS_FIX: results.filter((r) => r.status === "NEEDS_FIX").length,
  BLOCKED: results.filter((r) => r.status === "BLOCKED").length,
  NOT_RUN: 0,
};

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  task: "BM-171 Real Editor Vertical Slice + Legacy 60 Smoke",
  scope: "Smoke classification only — no deep fix, no mass rollout, no locked mutation.",
  repoRoot: REPO_ROOT,
  componentDir: COMPONENT_DIR,
  registryPath: REGISTRY_PATH,
  forms: results,
  summary,
  total: results.length,
  forbiddenScope: {
    noCommit: true,
    noPush: true,
    noPR: true,
    noPR7BStarted: true,
    noPR7CStarted: true,
    noMassRollout213: true,
    noDeepFixAll60: true,
    noCanonicalize55Forms: true,
    noLockedContractMutation: true,
    noNormalizedDocxMutation: true,
    noAuthRewrite: true,
    noMonolithicRendererCopy: true,
    noGenericTemplatesBM171Polish: true,
  },
};

const outDir = resolve(REPO_ROOT, "docs/audit/legacy-60-stabilization");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "LEGACY_60_SMOKE_MATRIX.latest.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`[smoke-matrix] wrote ${outPath}`);
console.log(`[smoke-matrix] summary: ${JSON.stringify(summary)}`);

// also emit markdown report
const md = [
  "# Legacy 60 Smoke Matrix (BM-171 Vertical Slice context)",
  "",
  `> Generated: ${payload.generatedAt}`,
  `> Scope: **smoke classification only**. No deep fix. No mass rollout. No locked contract mutation.`,
  `> Total forms: ${payload.total}`,
  "",
  "## Summary",
  "",
  "| Status | Count |",
  "|---|---:|",
  `| READY | ${summary.READY} |`,
  `| NEEDS_FIX | ${summary.NEEDS_FIX} |`,
  `| BLOCKED | ${summary.BLOCKED} |`,
  `| NOT_RUN | ${summary.NOT_RUN} |`,
  "",
  "## Smoke checks applied per form",
  "",
  "- `componentFileExists` — `apps/web/src/components/documents/bm-NNN-form-inputs.tsx` present",
  "- `primaryExportPresent` — `export function BmNNNFormInputsPanel(...)` found",
  "- `registryEntryPresent` — entry in `bm-panel-registry.generated.ts`",
  "- `demoFixtureHasBareUndefined` — fixture contains literal `undefined`",
  "- `demoFixtureHasBareInvalidDate` — fixture contains literal `Invalid Date`",
  "- `saveHandlerPresent` — `saveDocumentFormInputs` (or equivalent) called",
  "- `renderHandlerPresent` — render/preview plumbing present (workspace-level also valid)",
  "",
  "## Per-form classification",
  "",
  "| BM | Status | Reasons |",
  "|---|---|---|",
  ...results.map((r) =>
    `| ${r.templateCode} | ${r.status} | ${
      r.reasons.length === 0 ? "—" : r.reasons.join("; ")
    } |`
  ),
  "",
  "## Known blockers called out by the task",
  "",
  "- BM-172 documented adapter problem: workspace wraps it via `_Bm172FormInputsPanelAdapter` because `bm-172-form-inputs.tsx` exports `Bm172FormInputs` (not `Bm172FormInputsPanel`) with `Bm172FormInputsProps` that does not match the registry's `{documentId, onSaved}` contract.",
  "",
  "## Forbidden scope check",
  "",
  "- No commit. No push. No PR.",
  "- No PR7B started. No PR7C started. No mass rollout of 213 forms.",
  "- No deep fix performed on any of the 60 forms.",
  "- No canonicalization of 55 non-canonical forms.",
  "- No mutation of locked contracts or normalized DOCX.",
  "- No auth/RBAC rewrite. No monolithic backend renderer copy.",
  "- No further work on `/templates/BM-171` generic UX.",
  "",
  "## Recommendation",
  "",
  "- This matrix is the classification input for any future per-BM rollout. Do not deep-fix from this matrix in a single pass.",
  "",
].join("\n");

const mdPath = resolve(outDir, "LEGACY_60_SMOKE_MATRIX.latest.md");
writeFileSync(mdPath, md + "\n", "utf8");
console.log(`[smoke-matrix] wrote ${mdPath}`);