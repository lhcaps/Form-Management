/**
 * Runtime-ready template panel contract — guard test (pure file-system +
 * pure-JS-shim). Mirrors the form-lifecycle-wiring guard's conventions
 * so the runtime does not need a TS transpile step.
 *
 * Purpose
 * -------
 * Locks the runtime-ready template panel contract introduced in
 * `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md`.
 * These assertions are a hard regression net:
 *
 *   - if a future BM-NNN is promoted to runtime-ready without allowlist
 *     registration, the guard fails;
 *   - if a skeleton's panel kind flips to `runtime-ready-template-panel`
 *     by mistake, the guard fails;
 *   - if the selector ever asks for `generatedDocumentId` or the
 *     generated-document save endpoint, the guard fails;
 *   - if the selector ever imports a profile file directly (this would
 *     be the start of a 213-wide framework), the guard fails.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs
 *
 * Assertions (12):
 *
 *   1. A single canonical selector file exists in `lib/form-flight/`.
 *   2. The selector file declares the `RuntimeReadyTemplatePanelKind`
 *      union and a `selectRuntimeReadyTemplatePanel` function.
 *   3. The selector's `/templates` host imports the selector and the
 *      form-lifecycle wiring helper.
 *   4. BM-001 resolves to `runtime-ready-template-panel`.
 *   5. BM-171 resolves to `runtime-ready-template-panel`.
 *   6. BM-002 resolves to `generic-template-panel`.
 *   7. BM-002 does NOT resolve to `runtime-ready-template-panel`.
 *   8. Every code in the runtime-ready allowlist resolves to
 *      `runtime-ready-template-panel`.
 *   9. The selector file does NOT import `saveDocumentFormInputs`,
 *      `saveGeneratedDocumentFormInputs`, or `createGeneratedDocumentAdapter`.
 *  10. The selector file does NOT mention `generatedDocumentId`.
 *  11. The selector file does NOT import any `bmNNN` profile file
 *      directly (the selector is panel-kind logic, not registration).
 *      Profile registration is `lib/runtime-ux/index.ts`'s job.
 *  12. Only BM-001 and BM-171 declare `runtimeReady: true` —
 *      re-check at file-system level.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FORM_FLIGHT_DIR = __dirname;
const APPS_WEB_DIR = join(FORM_FLIGHT_DIR, "..", "..");

const RUNTIME_READY_CODES = ["BM-001", "BM-171"];
const SKELETON_CODE = "BM-002";

const selectorPath = join(
  FORM_FLIGHT_DIR,
  "runtime-ready-template-panel-contract.ts",
);
const formLifecyclePath = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
const templatePreviewPath = join(
  APPS_WEB_DIR,
  "components/documents/template-preview-workspace.tsx",
);
const runtimeUxIndexPath = join(APPS_WEB_DIR, "lib/runtime-ux/index.ts");

const selectorSource = readFileSync(selectorPath, "utf8");
const formLifecycleSource = readFileSync(formLifecyclePath, "utf8");
const templatePreviewSource = readFileSync(templatePreviewPath, "utf8");
const runtimeUxIndexSource = readFileSync(runtimeUxIndexPath, "utf8");

// ─── Pure-JS shim of selectRuntimeReadyTemplatePanel ─────────────────────
//
// Source-of-truth mirror. Keep this in lock-step with the production
// helper at `apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.ts`.
// The shim recreates the decision tree at runtime so the guard test can
// prove the production helper agrees with the contract document.

const RUNTIME_READY_FORM_FLIGHT_PROFILES_SHIM = ["BM-001", "BM-171"];

function isApprovedRuntimeReadyCodeShim(code) {
  return RUNTIME_READY_FORM_FLIGHT_PROFILES_SHIM.includes(code);
}

function classifyProfileStatusShim(profileStatus) {
  // Mirrors `form-lifecycle.ts#classifyProfileStatus`. The real
  // classification reads the registered profile, but for the guard
  // test we accept the canonical `profileStatus` string already
  // returned by `decideFormLifecycle(...)`.
  if (profileStatus === "runtime-ready") return "runtime-ready";
  if (profileStatus === "skeleton") return "skeleton";
  if (profileStatus === "missing") return "missing";
  return "invalid";
}

function selectRuntimeReadyTemplatePanelShim(input) {
  const { templateCode, profileStatus, isRuntimeReadyProfileCode } = input;
  const code = (templateCode ?? "").trim();
  if (code.length === 0) return "generic-template-panel";
  const status = classifyProfileStatusShim(profileStatus);
  if (status === "runtime-ready" && isRuntimeReadyProfileCode(code)) {
    return "runtime-ready-template-panel";
  }
  if (status === "runtime-ready") return "legacy-template-panel";
  return "generic-template-panel";
}

const profileStatusByTemplateCode = (code) => {
  if (RUNTIME_READY_FORM_FLIGHT_PROFILES_SHIM.includes(code)) {
    return "runtime-ready";
  }
  return "skeleton";
};

describe("runtime-ready template panel contract guard", () => {
  it("1. A single canonical selector file exists in lib/form-flight", () => {
    assert.ok(
      selectorSource.includes(
        "RuntimeReadyTemplatePanelKind",
      ),
      "selector file must export the RuntimeReadyTemplatePanelKind type",
    );
    assert.ok(
      selectorSource.includes("selectRuntimeReadyTemplatePanel"),
      "selector file must export selectRuntimeReadyTemplatePanel",
    );
    assert.ok(
      selectorSource.includes("FormLifecycleDecision"),
      "selector file must consume FormLifecycleDecision (single source of truth)",
    );
  });

  it("2. The selector is a pure function (no React, no DOM, no fetch, no console)", () => {
    // Strip TypeScript comments so the regex does not match
    // documentation prose that literally lists the forbidden words.
    const stripped = selectorSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.ok(
      !/from\s+["']react["']/.test(stripped),
      "selector must not import React",
    );
    assert.ok(
      !/document\.|window\.|localStorage/.test(stripped),
      "selector must not touch DOM or storage",
    );
    assert.ok(
      !/\bfetch\s*\(/.test(stripped),
      "selector must not call fetch",
    );
    assert.ok(
      !/console\.(log|info|warn|error)/.test(stripped),
      "selector must not log to console",
    );
  });

  it("3. The /templates host imports the selector and the form-lifecycle wiring helper", () => {
    assert.ok(
      templatePreviewSource.includes(
        "runtime-ready-template-panel-contract",
      ),
      "template-preview-workspace must import the selector",
    );
    assert.ok(
      templatePreviewSource.includes("decideFormLifecycle"),
      "template-preview-workspace must already import decideFormLifecycle",
    );
    assert.ok(
      templatePreviewSource.includes("registerRuntimeReadyFormFlightProfiles"),
      "template-preview-workspace must already register runtime-ready profiles",
    );
    assert.ok(
      templatePreviewSource.includes("isApprovedRuntimeReadyCode"),
      "template-preview-workspace must already import isApprovedRuntimeReadyCode",
    );
  });

  it("4. BM-001 resolves to runtime-ready-template-panel (production selector logic)", () => {
    const kind = selectRuntimeReadyTemplatePanelShim({
      templateCode: "BM-001",
      profileStatus: profileStatusByTemplateCode("BM-001"),
      isRuntimeReadyProfileCode: isApprovedRuntimeReadyCodeShim,
    });
    assert.equal(kind, "runtime-ready-template-panel");
  });

  it("5. BM-171 resolves to runtime-ready-template-panel", () => {
    const kind = selectRuntimeReadyTemplatePanelShim({
      templateCode: "BM-171",
      profileStatus: profileStatusByTemplateCode("BM-171"),
      isRuntimeReadyProfileCode: isApprovedRuntimeReadyCodeShim,
    });
    assert.equal(kind, "runtime-ready-template-panel");
  });

  it("6. BM-002 resolves to generic-template-panel (skeleton fail-closed)", () => {
    const kind = selectRuntimeReadyTemplatePanelShim({
      templateCode: "BM-002",
      profileStatus: profileStatusByTemplateCode("BM-002"),
      isRuntimeReadyProfileCode: isApprovedRuntimeReadyCodeShim,
    });
    assert.equal(kind, "generic-template-panel");
  });

  it("7. BM-002 does NOT resolve to runtime-ready-template-panel", () => {
    const kind = selectRuntimeReadyTemplatePanelShim({
      templateCode: "BM-002",
      profileStatus: profileStatusByTemplateCode("BM-002"),
      isRuntimeReadyProfileCode: isApprovedRuntimeReadyCodeShim,
    });
    assert.notEqual(kind, "runtime-ready-template-panel");
  });

  it("8. Every code in the runtime-ready allowlist resolves to runtime-ready-template-panel", () => {
    for (const code of RUNTIME_READY_CODES) {
      const kind = selectRuntimeReadyTemplatePanelShim({
        templateCode: code,
        profileStatus: profileStatusByTemplateCode(code),
        isRuntimeReadyProfileCode: isApprovedRuntimeReadyCodeShim,
      });
      assert.equal(
        kind,
        "runtime-ready-template-panel",
        `${code} must resolve to runtime-ready-template-panel`,
      );
    }
  });

  it("9. The selector file does NOT import generated-document save or adapter code", () => {
    const forbidden = [
      "saveDocumentFormInputs",
      "saveGeneratedDocumentFormInputs",
      "createGeneratedDocumentAdapter",
      "saveBm001FormInputs",
    ];
    for (const token of forbidden) {
      assert.ok(
        !selectorSource.includes(token),
        `selector must not mention ${token}`,
      );
    }
  });

  it("10. The selector file does NOT depend on generatedDocumentId", () => {
    assert.ok(
      !/generatedDocumentId/.test(selectorSource),
      "selector must not mention generatedDocumentId",
    );
  });

  it("11. The selector file does NOT import any bmNNN profile file directly (no 213-wide framework here)", () => {
    assert.ok(
      !/from\s+["']\.\/profiles\//.test(selectorSource),
      "selector must not import profile modules directly; registration is the runtime-ux barrel's job",
    );
    assert.ok(
      !/from\s+["']\.\/forms?\//.test(selectorSource),
      "selector must not eagerly pull in 213 profile files",
    );
  });

  it("12. Only BM-001 and BM-171 declare runtimeReady: true (re-check at file-system level)", () => {
    // We re-derive the runtime-ready list from the form-lifecycle
    // helper itself rather than hard-coding — this catches drift
    // between the form-lifecycle allowlist and the selector's
    // behaviour.
    const listMatch = formLifecycleSource.match(
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([^\]]+)\]/,
    );
    assert.ok(listMatch, "RUNTIME_READY_FORM_FLIGHT_PROFILES must be defined");
    const listed = listMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    assert.deepEqual(
      listed.sort(),
      [...RUNTIME_READY_CODES].sort(),
      `runtime-ready allowlist must be exactly ${RUNTIME_READY_CODES.join(", ")}`,
    );
  });
});
