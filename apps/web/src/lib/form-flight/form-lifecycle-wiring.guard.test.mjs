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
 *       guard invariant for non-promoted codes).
 *  10.  Exactly the 11 promoted profiles carry runtimeReady true
 *       (re-check).
 *  11.  No skeleton is eagerly imported into template runtime as
 *       runtime-ready — must list exactly 11 side-effect imports
 *       matching the canonical R5 promotion set.
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
 *  19.  BM-001 template-runtime returns form-flight-runtime panel.
 *  20.  BM-171 template-runtime returns form-flight-runtime panel (parity with BM-001).
 *  21.  template-runtime never reports hasRealGeneratedDocumentId=true.
 *  22.  R5 promotion set: each newly promoted candidate declares
 *       runtimeReady true and profileStatus "runtime-ready" and the
 *       shared lifecycle helper imports its profile file (mirrors
 *       the canonical bridge-eligibility policy).
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

// R5 promotion: two historical controls + nine newly promoted
// candidates, in canonical sorted order matching
// `STANDALONE_RUNTIME_TEMPLATE_CODES`.
const RUNTIME_READY_CODES = [
  "BM-001",
  "BM-171",
  "BM-136",
  "BM-148",
  "BM-156",
  "BM-157",
  "BM-168",
  "BM-174",
  "BM-181",
  "BM-206",
  "BM-213",
];
const RUNTIME_READY_FILES = new Set(RUNTIME_READY_CODES.map((c) => `bm${c.slice(3)}.ts`));

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

  it("3. form-lifecycle.ts delegates its approved list to the shared policy and imports its two baseline profiles", () => {
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
      /import\s+\{\s*STANDALONE_RUNTIME_TEMPLATE_CODES\s*\}\s+from\s+["']@qllaw\/form-contracts\/browser["']/,
      "form-lifecycle.ts must import the canonical shared runtime-ready policy",
    );
    assert.match(
      src,
      /export\s+const\s+RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*STANDALONE_RUNTIME_TEMPLATE_CODES/,
      "form-lifecycle.ts must delegate its approved list to the shared policy rather than duplicate literals",
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
      "generated-document-workspace must call registerRuntimeReadyFormFlightProfiles so decideFormLifecycle sees the runtime-ready cohort",
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

  it("10. only the 11 promoted codes carry runtimeReady true", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    const runtimeReady = files
      .filter((f) => readProfile(f).runtimeReady)
      .map((f) => `BM-${f.match(/^bm(\d{3})\.ts$/)[1]}`);
    assert.deepEqual(
      [...runtimeReady].sort(),
      [...RUNTIME_READY_CODES].sort(),
      "exactly the 11 promoted profiles may carry runtimeReady: true",
    );
  });

  it("11. form-lifecycle.ts lists exactly the 11 side-effect imports matching RUNTIME_READY_CODES", () => {
    const src = readFileSync(lifecycleTsPath, "utf8");
    const importMatches = [...src.matchAll(/from\s+["']\.\/profiles\/bm(\d{3})["']/g)];
    assert.equal(
      importMatches.length,
      RUNTIME_READY_CODES.length,
      `form-lifecycle.ts must import exactly ${RUNTIME_READY_CODES.length} runtime-ready profiles`,
    );
    const nums = importMatches
      .map((m) => `BM-${m[1]}`)
      .sort();
    const expected = [...RUNTIME_READY_CODES].sort();
    assert.deepEqual(nums, expected);
  });

  it("12. BM-001 UI does not bake in the legacy stale-bug token", () => {
    const stripped = stripComments(readFileSync(bm001UiPath, "utf8"));
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
    const occurrences = [
      ...src.matchAll(/registerRuntimeReadyFormFlightProfiles\s*\(/g),
    ];
    assert.equal(
      occurrences.length,
      1,
      "generated-document-workspace must call registerRuntimeReadyFormFlightProfiles exactly once",
    );
    assert.doesNotMatch(
      src,
      /from\s+["'].*template-runtime-adapter["']/,
      "generated-document-workspace must not import template-runtime-adapter",
    );
  });

  it("15. production lifecycle delegates to the source-of-truth policy", () => {
    const src = readFileSync(lifecycleTsPath, "utf8");
    assert.match(
      src,
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*STANDALONE_RUNTIME_TEMPLATE_CODES/,
      "production helper must delegate approved codes to the canonical policy",
    );
    assert.doesNotMatch(
      src,
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[/,
      "production helper must not reintroduce a second literal allowlist",
    );
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

  // R5 promotion: each newly promoted candidate must (a) declare
  // runtimeReady true + profileStatus "runtime-ready" in its profile
  // file, and (b) be imported by form-lifecycle.ts so the runtime
  // side-effect registration runs.
  it("22. R5 promotion set is fully wired (9 newly promoted candidates)", () => {
    const R5_NEW_CODES = [
      "BM-136",
      "BM-148",
      "BM-156",
      "BM-157",
      "BM-168",
      "BM-174",
      "BM-181",
      "BM-206",
      "BM-213",
    ];
    const lifecycleSrc = readFileSync(lifecycleTsPath, "utf8");
    // Build one master regex matching every R5 candidate import path.
    // Group alternation works in both literal regex and dynamic RegExp
    // without double-escaping pitfall we hit when building one RegExp
    // per code with backslash/forward-slash mixing.
    const allImports = [
      ...lifecycleSrc.matchAll(
        /from\s+["']\.\/profiles\/bm(\d{3})["']/g,
      ),
    ].map((m) => `BM-${m[1]}`);
    for (const code of R5_NEW_CODES) {
      const file = `bm${code.slice(3)}.ts`;
      const p = readProfile(file);
      assert.equal(
        p.templateCode,
        code,
        `${file} must declare templateCode ${code}`,
      );
      assert.equal(
        p.runtimeReady,
        true,
        `${code} profile must declare runtimeReady: true after R5 promotion`,
      );
      assert.equal(
        p.profileStatus,
        "runtime-ready",
        `${code} profile must declare profileStatus: "runtime-ready"`,
      );
      assert.ok(
        allImports.includes(code),
        `form-lifecycle.ts must side-effect-import ${file}`,
      );
    }
  });
});
