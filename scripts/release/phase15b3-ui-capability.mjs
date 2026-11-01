#!/usr/bin/env node
/**
 * Phase 15B.3 — Phase 4: Actual UI Demo-Capability Map.
 *
 * ============================================================================
 * PURPOSE
 * ============================================================================
 * For every form, record what the UI actually exposes for "Điền dữ liệu mẫu".
 * Do NOT infer from profile-file existence. Trace the product code:
 *
 *   1. `apps/web/src/components/documents/bm-NNN-form-inputs.tsx` legacy
 *      component — contains the demo button + `fillCustomerSample` handler.
 *      File presence + presence of the button text → DEMO_FILL_EXPOSED.
 *   2. `apps/web/src/lib/runtime-ux/bmNNN-runtime-ux-profile.ts` — the
 *      standalone-template lifecycle profile. Its `demo` Object.keys() > 0
 *      → DEMO_FILL_EXPOSED in the runtime preview path.
 *   3. `apps/web/src/lib/form-flight/profiles/bmNNN.ts` — the
 *      generated-document lifecycle profile. Its `demo` Object.keys() > 0
 *      → DEMO_FILL_EXPOSED in the persisted-document lifecycle.
 *
 * Forms with NO legacy component AND NO populated demo in either profile
 * are intentionally DEMO_FILL_NOT_APPLICABLE — there is no UI surface that
 * would surface the button to the customer.
 *
 * Allowed verdicts (per brief):
 *   DEMO_FILL_EXPOSED
 *   DEMO_FILL_INTENTIONALLY_HIDDEN
 *   DEMO_FILL_NOT_APPLICABLE
 *   DEMO_FILL_BROKEN
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveDemoProperty,
} from "./lib/resolve-demo-export.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const AUTHORITY_INPUT = process.env.AUTHORITY_INPUT ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
    "phase15b3-authority-input-213.json",
  );

const OUTPUT_PATH = process.env.OUTPUT_PATH ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
    "phase15b3-ui-demo-capability-213.json",
  );

const FORM_FLIGHT_DIR = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "profiles",
);
const RUNTIME_UX_DIR = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "runtime-ux",
);
const LEGACY_COMPONENT_DIR = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "components",
  "documents",
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pad(n) {
  return String(n).padStart(3, "0");
}

function bmCode(n) {
  return `BM-${pad(n)}`;
}

function formFlightProfilePath(n) {
  return join(FORM_FLIGHT_DIR, `bm${pad(n)}.ts`);
}

function runtimeUxProfilePath(n) {
  return join(RUNTIME_UX_DIR, `bm${pad(n)}-runtime-ux-profile.ts`);
}

function legacyComponentPath(n) {
  return join(LEGACY_COMPONENT_DIR, `bm-${pad(n)}-form-inputs.tsx`);
}

function hasButtonText(filePath) {
  if (!existsSync(filePath)) return false;
  const src = readFileSync(filePath, "utf8");
  // Direct text match for the demo button label.
  if (src.includes("Điền dữ liệu mẫu")) return true;
  return false;
}

function hasFillCustomerSample(filePath) {
  if (!existsSync(filePath)) return false;
  const src = readFileSync(filePath, "utf8");
  return src.includes("fillCustomerSample");
}

/**
 * Resolve the runtime-ux demo for a given form. Uses the TS resolver.
 */
function resolveRuntimeUxDemo(n) {
  const p = runtimeUxProfilePath(n);
  if (!existsSync(p)) return null;
  const src = readFileSync(p, "utf8");
  const r = resolveDemoProperty({ sourceText: src, sourcePath: p });
  if (!r.ok && !r.demo) return null;
  const keys = Object.keys(r.demo ?? {}).filter(
    (k) => !k.startsWith("__"),
  );
  return {
    present: keys.length > 0,
    keyCount: keys.length,
    source: r.source,
    binding: r.binding,
    unresolvedExpressions: r.unresolvedExpressions,
  };
}

/**
 * Resolve the form-flight demo for a given form.
 */
function resolveFormFlightDemo(n) {
  const p = formFlightProfilePath(n);
  if (!existsSync(p)) return null;
  const src = readFileSync(p, "utf8");
  const r = resolveDemoProperty({ sourceText: src, sourcePath: p });
  if (!r.ok && !r.demo) return null;
  const keys = Object.keys(r.demo ?? {}).filter(
    (k) => !k.startsWith("__"),
  );
  return {
    present: keys.length > 0,
    keyCount: keys.length,
    source: r.source,
    binding: r.binding,
    unresolvedExpressions: r.unresolvedExpressions,
  };
}

function classifyUiCapability({
  legacyButton,
  legacyFillHandler,
  runtimeUxPresent,
  runtimeUxDemoPresent,
  runtimeUxDemoKeyCount,
  formFlightDemoPresent,
  formFlightDemoKeyCount,
}) {
  // DEMO_FILL_EXPOSED: at least one user-facing path renders the button
  // and has a populated demo.
  if (legacyButton && legacyFillHandler) {
    // Legacy path is exposed. The handler either populates from inline
    // fillCustomerSample() or falls back to getSampleData heuristic.
    // We treat this as DEMO_FILL_EXPOSED regardless of profile demo.
    return {
      capability: "DEMO_FILL_EXPOSED",
      reason: "legacy-bm-NNN-form-inputs-has-demo-button",
    };
  }
  if (runtimeUxDemoPresent && runtimeUxDemoKeyCount > 0) {
    return {
      capability: "DEMO_FILL_EXPOSED",
      reason: "runtime-ux-profile-demo-populated",
    };
  }
  if (formFlightDemoPresent && formFlightDemoKeyCount > 0) {
    return {
      capability: "DEMO_FILL_EXPOSED",
      reason: "form-flight-profile-demo-populated",
    };
  }
  // No demo anywhere — the UI may still render the button via
  // fallback registry, but the customer sees an empty form.
  if (legacyButton) {
    return {
      capability: "DEMO_FILL_BROKEN",
      reason: "legacy-button-present-but-no-demo-fixture",
    };
  }
  // No button anywhere. The product never exposes demo-fill for this form.
  return {
    capability: "DEMO_FILL_NOT_APPLICABLE",
    reason: "no-ui-surface-renders-demo-button",
  };
}

function main() {
  const input = readJson(AUTHORITY_INPUT);
  if (!input.rows || input.rows.length !== 213) {
    throw new Error(`Expected 213 rows in ${AUTHORITY_INPUT}`);
  }

  const rows = [];
  for (let n = 1; n <= 213; n++) {
    const code = bmCode(n);
    const legacyPath = legacyComponentPath(n);
    const legacyExists = existsSync(legacyPath);
    const legacyButton = legacyExists && hasButtonText(legacyPath);
    const legacyFillHandler = legacyExists && hasFillCustomerSample(legacyPath);

    const rx = resolveRuntimeUxDemo(n);
    const ff = resolveFormFlightDemo(n);

    const rxPresent = !!rx?.present;
    const rxKeyCount = rx?.keyCount ?? 0;
    const ffPresent = !!ff?.present;
    const ffKeyCount = ff?.keyCount ?? 0;

    const cls = classifyUiCapability({
      legacyButton,
      legacyFillHandler,
      runtimeUxPresent: !!rx,
      runtimeUxDemoPresent: rxPresent,
      runtimeUxDemoKeyCount: rxKeyCount,
      formFlightDemoPresent: ffPresent,
      formFlightDemoKeyCount: ffKeyCount,
    });

    rows.push({
      FORM_CODE: code,
      LEGACY_COMPONENT_EXISTS: legacyExists,
      LEGACY_BUTTON_RENDERED: legacyButton,
      LEGACY_FILL_HANDLER_PRESENT: legacyFillHandler,
      RUNTIME_UX_PROFILE_PRESENT: !!rx,
      RUNTIME_UX_DEMO_PRESENT: rxPresent,
      RUNTIME_UX_DEMO_KEY_COUNT: rxKeyCount,
      RUNTIME_UX_DEMO_SOURCE: rx?.source ?? null,
      RUNTIME_UX_DEMO_BINDING: rx?.binding ?? null,
      FORM_FLIGHT_PROFILE_PRESENT: !!ff,
      FORM_FLIGHT_DEMO_PRESENT: ffPresent,
      FORM_FLIGHT_DEMO_KEY_COUNT: ffKeyCount,
      FORM_FLIGHT_DEMO_SOURCE: ff?.source ?? null,
      FORM_FLIGHT_DEMO_BINDING: ff?.binding ?? null,
      UI_CAPABILITY: cls.capability,
      UI_CAPABILITY_REASON: cls.reason,
    });
  }

  // Aggregate
  const byCapability = {};
  for (const r of rows) {
    byCapability[r.UI_CAPABILITY] = (byCapability[r.UI_CAPABILITY] ?? 0) + 1;
  }

  const out = {
    schema: "qllaw.phase15b3.ui_demo_capability/v1",
    runId: "PHASE15B3_PHASE4_UI_CAPABILITY",
    generatedAt: new Date().toISOString(),
    sourceAuthorityInput: AUTHORITY_INPUT,
    invariants: {
      formsCount: rows.length,
      legacyComponentExistsCount: rows.filter((r) => r.LEGACY_COMPONENT_EXISTS).length,
      legacyButtonRenderedCount: rows.filter((r) => r.LEGACY_BUTTON_RENDERED).length,
      runtimeUxDemoPresentCount: rows.filter((r) => r.RUNTIME_UX_DEMO_PRESENT).length,
      formFlightDemoPresentCount: rows.filter((r) => r.FORM_FLIGHT_DEMO_PRESENT).length,
      byCapability,
    },
    rows,
  };

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));

  console.log(JSON.stringify({
    ok: true,
    outPath: OUTPUT_PATH,
    invariants: out.invariants,
  }, null, 2));
}

main();
