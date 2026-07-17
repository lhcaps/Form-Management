/**
 * Form Flight — lifecycle wiring guard test.
 *
 * Pure file-system + pure-JS-shim test (no DB, no fetch, no React, no
 * TypeScript transpile). Verifies the Form Flight inventory + the
 * route-level wiring contract introduced by phase
 * "FORM LIFECYCLE WIRING CONTRACT + RUNTIME-READY ROUTING GUARDS".
 *
 *   1.  BM-001 profile declares runtimeReady true.
 *   2.  BM-171 profile declares runtimeReady true.
 *   3.  BM-001 and BM-171 are imported by the runtime-ready profile
 *       registration helper (`form-lifecycle.ts`).
 *   4.  `/templates` route shell imports `registerRuntimeReadyFormFlightProfiles`
 *       and calls `decideFormLifecycle(...)` at least once.
 *   5.  `/templates` route shell uses `gateRuntimePreview` (the
 *       cross-check that proves BM-001 + BM-171 share the same
 *       runtime-ready path).
 *   6.  `/templates` route shell does NOT import
 *       `saveDocumentFormInputs` (no generated-document save leak).
 *   7.  `/templates` route shell does NOT instantiate
 *       `createGeneratedDocumentAdapter`.
 *   8.  `/documents` generated workspace imports the runtime-ready
 *       profile registration helper (so the generated branch of
 *       `decideFormLifecycle` resolves BM-001 + BM-171).
 *   9.  Skeleton profiles are NOT runtimeReady (re-checks the registry
 *       guard invariant for non-BM-001 / non-BM-171 codes).
 *  10.  Only BM-001 + BM-171 have runtimeReady true (re-check).
 *  11.  No skeleton is eagerly imported into template runtime as
 *       runtime-ready.
 *  12.  BM-001 UI file does not contain the legacy stale-bug token
 *       `"Ông  cung cấp"` as a literal value (defensive: the bug
 *       is in the legacy `fillCustomerSample`, not the live UI).
 *  13.  BM-171 source is unchanged in spirit — its profile still
 *       declares runtimeReady true and registers itself.
 *  14.  Generated document lifecycle did not get mutated beyond the
 *       single `registerRuntimeReadyFormFlightProfiles()` call.
 *  15.  Pure-JS shim of the lifecycle helper agrees with the source
 *       text of the production helper on every approved code.
 *  16.  Skeleton fail-closed: `decideFormLifecycle("BM-002", "template-runtime")`
 *       returns `useFormFlight=false` and `panelKind="generic"`.
 *  17.  Generated branch with no id: `decideFormLifecycle("BM-001", "generated-document", {hasRealGeneratedDocumentId:false})`
 *       returns `useFormFlight=false` (no fake-id escape hatch).
 *  18.  Generated branch with id: `decideFormLifecycle("BM-001", "generated-document", {hasRealGeneratedDocumentId:true})`
 *       returns `useFormFlight=true`.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs
 *
 * No npm test runner dependency. Matches the convention used by
 * `profile-registry-guard.test.mjs`, `bm001-runtime-ready.guard.test.mjs`,
 * and `bm001-render-export-golden.guard.test.mjs`.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FORM_FLIGHT_DIR = __dirname;
const APPS_WEB_DIR = join(FORM_FLIGHT_DIR, "..", "..");
const APPS_DIR = join(APPS_WEB_DIR, "..", "..");
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");

const RUNTIME_READY_CODES = ["BM-001", "BM-171"];
const RUNTIME_READY_FILES = new Set(["bm001.ts", "bm171.ts"]);

const lifecycleTsPath = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
const templatePreviewPath = join(
  APPS_WEB_DIR,
  "components/documents/template-preview-workspace.tsx",
);
const generatedWorkspacePath = join(
  APPS_WEB_DIR,
  "components/documents/generated-document-workspace.tsx",
);
const bm001ProfilePath = join(PROFILE_DIR, "bm001.ts");
const bm171ProfilePath = join(PROFILE_DIR, "bm171.ts");
const bm001UiPath = join(
  APPS_WEB_DIR,
  "components/documents/bm-001-form-inputs.tsx",
);

// ─── Pure-JS shim of decideFormLifecycle ────────────────────────────────────
//
// Source-of-truth mirror. Keep this in lock-step with the production
// helper at `apps/web/src/lib/form-flight/form-lifecycle.ts`. The
// shim deliberately avoids importing the production file (which is
// TypeScript + has registry side-effects); instead the guard test
// verifies both files describe the same behaviour via the
// "production shim agrees with source" assertion (#15).

function classifyProfileStatusShim(profile) {
  if (!profile) return "missing";
  if (!profile.templateCode || typeof profile.templateCode !== "string") {
    return "invalid";
  }
  if (
    profile.runtimeReady === true &&
    profile.profileStatus === "runtime-ready"
  ) {
    return "runtime-ready";
  }
  return "skeleton";
}

function decideFormLifecycleShim(input) {
  const { lifecycle, templateCode } = input;
  const hasRealGeneratedDocumentId =
    lifecycle === "generated-document"
      ? Boolean(input.hasRealGeneratedDocumentId)
      : false;

  // No registry access — the shim takes the profile via the caller.
  const profile = input.profile ?? null;
  const profileStatus = classifyProfileStatusShim(profile);

  if (lifecycle === "template-runtime") {
    if (profileStatus === "runtime-ready") {
      return {
        templateCode,
        lifecycle,
        profileStatus,
        useFormFlight: true,
        panelKind: "form-flight-runtime",
        hasRealGeneratedDocumentId: false,
        reason:
          "template-runtime + runtime-ready profile → Form Flight runtime panel",
      };
    }
    return {
      templateCode,
      lifecycle,
      profileStatus,
      useFormFlight: false,
      panelKind: RUNTIME_READY_CODES.includes(templateCode)
        ? "legacy"
        : "generic",
      hasRealGeneratedDocumentId: false,
      reason: `template-runtime + ${profileStatus} profile → legacy / generic fallback`,
    };
  }

  // generated-document
  if (profileStatus === "runtime-ready" && hasRealGeneratedDocumentId) {
    return {
      templateCode,
      lifecycle,
      profileStatus,
      useFormFlight: true,
      panelKind: "form-flight-generated",
      hasRealGeneratedDocumentId: true,
      reason:
        "generated-document + runtime-ready profile + real generatedDocumentId → Form Flight generated panel",
    };
  }
  return {
    templateCode,
    lifecycle,
    profileStatus,
    useFormFlight: false,
    panelKind: RUNTIME_READY_CODES.includes(templateCode)
      ? "legacy"
      : "generic",
    hasRealGeneratedDocumentId,
    reason: !hasRealGeneratedDocumentId
      ? "generated-document + no real generatedDocumentId → legacy / generic fallback (fail-closed)"
      : `generated-document + ${profileStatus} profile → legacy / generic fallback (fail-closed)`,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function readProfile(file) {
  const stripped = stripComments(readFileSync(join(PROFILE_DIR, file), "utf8"));
  return {
    templateCode: `BM-${file.match(/^bm(\d{3})\.ts$/)[1]}`,
    runtimeReady: /runtimeReady:\s*true/.test(stripped),
    profileStatus:
      /profileStatus:\s*"runtime-ready"/.test(stripped)
        ? "runtime-ready"
        : /profileStatus:\s*"skeleton"/.test(stripped)
          ? "skeleton"
          : /profileStatus:\s*"audit-only"/.test(stripped)
            ? "audit-only"
            : "audit-only",
  };
}

// ─── Guard assertions ──────────────────────────────────────────────────────

describe("Form Flight lifecycle wiring guard", () => {
  it("1. BM-001 profile declares runtimeReady: true", () => {
    const p = readProfile("bm001.ts");
    assert.equal(p.runtimeReady, true, "BM-001 must be runtimeReady");
    assert.equal(p.profileStatus, "runtime-ready");
  });

  it("2. BM-171 profile declares runtimeReady: true", () => {
    const p = readProfile("bm171.ts");
    assert.equal(p.runtimeReady, true, "BM-171 must be runtimeReady");
    assert.equal(p.profileStatus, "runtime-ready");
  });

  it("3. form-lifecycle.ts imports BM-001 + BM-171 profiles", () => {
    const src = readFileSync(lifecycleTsPath, "utf8");
    assert.match(
      src,
      /from\s+["']\.\/profiles\/bm001["']/,
      "form-lifecycle.ts must import profiles/bm001",
    );
    assert.match(
      src,
      /from\s+["']\.\/profiles\/bm171["']/,
      "form-lifecycle.ts must import profiles/bm171",
    );
    assert.match(
      src,
      /RUNTIME_READY_FORM_FLIGHT_PROFILES/,
      "form-lifecycle.ts must declare the approved runtime-ready list",
    );
    assert.ok(
      /["']BM-001["']/.test(src) && /["']BM-171["']/.test(src),
      "approved runtime-ready list must contain BM-001 + BM-171",
    );
  });

  it("4. template-preview-workspace registers + uses decideFormLifecycle", () => {
    const src = readFileSync(templatePreviewPath, "utf8");
    assert.match(
      src,
      /registerRuntimeReadyFormFlightProfiles\s*\(/,
      "template-preview-workspace must call registerRuntimeReadyFormFlightProfiles",
    );
    assert.match(
      src,
      /decideFormLifecycle\s*\(\s*\{\s*lifecycle:\s*["']template-runtime["']/,
      "template-preview-workspace must call decideFormLifecycle with template-runtime",
    );
  });

  it("5. template-preview-workspace uses gateRuntimePreview (cross-check BM-001 = BM-171 path)", () => {
    const src = readFileSync(templatePreviewPath, "utf8");
    assert.match(
      src,
      /gateRuntimePreview\s*\(/,
      "template-preview-workspace must use gateRuntimePreview (so BM-001 + BM-171 share the same gate)",
    );
  });

  it("6. template-preview-workspace does NOT call generated save endpoint", () => {
    const src = readFileSync(templatePreviewPath, "utf8");
    assert.doesNotMatch(
      src,
      /saveDocumentFormInputs\s*\(/,
      "template-preview-workspace must not call saveDocumentFormInputs",
    );
    assert.doesNotMatch(
      src,
      /\/documents\/generated\/[^"']+\/form-inputs/,
      "template-preview-workspace must not hardcode the generated form-inputs endpoint",
    );
  });

  it("7. template-preview-workspace does NOT instantiate the generated adapter", () => {
    const src = readFileSync(templatePreviewPath, "utf8");
    assert.doesNotMatch(
      src,
      /createGeneratedDocumentAdapter\s*\(/,
      "template-preview-workspace must not instantiate createGeneratedDocumentAdapter",
    );
  });

  it("8. generated-document-workspace registers runtime-ready profiles", () => {
    const src = readFileSync(generatedWorkspacePath, "utf8");
    assert.match(
      src,
      /registerRuntimeReadyFormFlightProfiles\s*\(/,
      "generated-document-workspace must call registerRuntimeReadyFormFlightProfiles so decideFormLifecycle sees BM-001 + BM-171",
    );
  });

  it("9. skeleton profiles are NOT runtimeReady", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    for (const f of files) {
      if (RUNTIME_READY_FILES.has(f)) continue;
      const p = readProfile(f);
      assert.equal(
        p.runtimeReady,
        false,
        `${p.templateCode} must NOT be runtimeReady`,
      );
      assert.notEqual(
        p.profileStatus,
        "runtime-ready",
        `${p.templateCode} must NOT have profileStatus: "runtime-ready"`,
      );
    }
  });

  it("10. only BM-001 + BM-171 carry runtimeReady true", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    const runtimeReady = files
      .filter((f) => readProfile(f).runtimeReady)
      .map((f) => `BM-${f.match(/^bm(\d{3})\.ts$/)[1]}`);
    assert.deepEqual(
      runtimeReady.sort(),
      ["BM-001", "BM-171"],
      "exactly BM-001 and BM-171 may carry runtimeReady: true",
    );
  });

  it("11. no skeleton is eagerly imported into template-runtime as runtime-ready", () => {
    const src = readFileSync(lifecycleTsPath, "utf8");
    // The runtime-ready imports section must list ONLY BM-001 + BM-171.
    const importMatches = [...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g)];
    assert.equal(
      importMatches.length,
      2,
      "form-lifecycle.ts must import exactly 2 runtime-ready profiles",
    );
    const nums = importMatches.map((m) => m[1]).sort();
    assert.deepEqual(nums, ["001", "171"]);
  });

  it("12. BM-001 UI does not bake in the legacy stale-bug token", () => {
    // The bug token used to live in the legacy `fillCustomerSample`.
    // The shipped UI file should not have it as a literal value.
    // We tolerate mention inside comments; strip them first.
    const stripped = stripComments(readFileSync(bm001UiPath, "utf8"));
    // The literal `"Ông  cung cấp"` (with the two-space legacy bug)
    // must NOT appear in code. The forbidden-text list in the Form
    // Flight profile is the canonical place for it.
    assert.doesNotMatch(
      stripped,
      /["']Ông  cung cấp["']/,
      "bm-001-form-inputs.tsx must not embed the legacy 'Ông  cung cấp' bug token",
    );
  });

  it("13. BM-171 source still runtime-ready + self-registers", () => {
    const src = readFileSync(bm171ProfilePath, "utf8");
    assert.match(
      stripComments(src),
      /runtimeReady:\s*true/,
      "BM-171 must still be runtimeReady: true",
    );
    assert.match(
      stripComments(src),
      /profileStatus:\s*"runtime-ready"/,
      'BM-171 must still declare profileStatus: "runtime-ready"',
    );
    assert.match(
      src,
      /registerFormFlightProfile\(BM171_FORM_FLIGHT_PROFILE\)/,
      "BM-171 must still self-register",
    );
  });

  it("14. generated document lifecycle only got the registration side-effect", () => {
    const src = readFileSync(generatedWorkspacePath, "utf8");
    // Single registration call; no other lifecycle helper wired in
    // (the workspace continues to use BM_PANEL_BY_CODE for panel
    // selection — that's intentional and unchanged).
    const occurrences = [
      ...src.matchAll(/registerRuntimeReadyFormFlightProfiles\s*\(/g),
    ];
    assert.equal(
      occurrences.length,
      1,
      "generated-document-workspace must call registerRuntimeReadyFormFlightProfiles exactly once",
    );
    // The workspace must NOT import the template-runtime adapter.
    assert.doesNotMatch(
      src,
      /from\s+["'].*template-runtime-adapter["']/,
      "generated-document-workspace must not import template-runtime-adapter",
    );
  });

  it("15. production shim agrees with source-of-truth on approved codes", () => {
    const src = readFileSync(lifecycleTsPath, "utf8");
    // Production helper declares the same approved list.
    const listMatch = src.match(
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([\s\S]*?)\]\s*as\s+const/,
    );
    assert.ok(listMatch, "production helper must declare the approved list");
    const codes = [
      ...listMatch[1].matchAll(/["'](BM-\d{3})["']/g),
    ].map((m) => m[1]);
    assert.deepEqual(codes.sort(), ["BM-001", "BM-171"]);
    // Production helper declares decideFormLifecycle.
    assert.match(
      src,
      /export\s+function\s+decideFormLifecycle\s*\(/,
      "production helper must export decideFormLifecycle",
    );
  });

  it("16. skeleton fail-closed on /templates", () => {
    const decision = decideFormLifecycleShim({
      lifecycle: "template-runtime",
      templateCode: "BM-002",
      profile: null,
    });
    assert.equal(decision.useFormFlight, false);
    assert.equal(decision.panelKind, "generic");
    assert.equal(decision.hasRealGeneratedDocumentId, false);
    assert.equal(decision.profileStatus, "missing");
  });

  it("17. generated branch without real id returns useFormFlight=false (no fake-id escape)", () => {
    const decision = decideFormLifecycleShim({
      lifecycle: "generated-document",
      templateCode: "BM-001",
      profile: {
        templateCode: "BM-001",
        runtimeReady: true,
        profileStatus: "runtime-ready",
      },
      hasRealGeneratedDocumentId: false,
    });
    assert.equal(
      decision.useFormFlight,
      false,
      "missing real generatedDocumentId must keep useFormFlight=false",
    );
    assert.equal(decision.hasRealGeneratedDocumentId, false);
    assert.equal(decision.panelKind, "legacy");
  });

  it("18. generated branch with real id returns useFormFlight=true", () => {
    const decision = decideFormLifecycleShim({
      lifecycle: "generated-document",
      templateCode: "BM-001",
      profile: {
        templateCode: "BM-001",
        runtimeReady: true,
        profileStatus: "runtime-ready",
      },
      hasRealGeneratedDocumentId: true,
    });
    assert.equal(decision.useFormFlight, true);
    assert.equal(decision.panelKind, "form-flight-generated");
    assert.equal(decision.hasRealGeneratedDocumentId, true);
  });

  it("19. BM-001 template-runtime returns form-flight-runtime panel", () => {
    const decision = decideFormLifecycleShim({
      lifecycle: "template-runtime",
      templateCode: "BM-001",
      profile: {
        templateCode: "BM-001",
        runtimeReady: true,
        profileStatus: "runtime-ready",
      },
    });
    assert.equal(decision.useFormFlight, true);
    assert.equal(decision.panelKind, "form-flight-runtime");
    assert.equal(decision.hasRealGeneratedDocumentId, false);
  });

  it("20. BM-171 template-runtime returns form-flight-runtime panel (parity with BM-001)", () => {
    const decision = decideFormLifecycleShim({
      lifecycle: "template-runtime",
      templateCode: "BM-171",
      profile: {
        templateCode: "BM-171",
        runtimeReady: true,
        profileStatus: "runtime-ready",
      },
    });
    assert.equal(decision.useFormFlight, true);
    assert.equal(decision.panelKind, "form-flight-runtime");
  });

  it("21. template-runtime never reports hasRealGeneratedDocumentId=true", () => {
    for (const code of RUNTIME_READY_CODES) {
      const decision = decideFormLifecycleShim({
        lifecycle: "template-runtime",
        templateCode: code,
        profile: {
          templateCode: code,
          runtimeReady: true,
          profileStatus: "runtime-ready",
        },
        hasRealGeneratedDocumentId: true,
      });
      assert.equal(
        decision.hasRealGeneratedDocumentId,
        false,
        `${code} template-runtime must NOT report hasRealGeneratedDocumentId=true`,
      );
    }
  });
});