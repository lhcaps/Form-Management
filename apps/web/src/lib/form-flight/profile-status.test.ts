/**
 * Profile runtime-readiness guard test.
 *
 * Adopted in RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER.
 *
 * Proves the cross-template contract for `isRuntimeReadyProfile`:
 *
 *   1. `null` / `undefined`           → not runtime-ready.
 *   2. `runtimeReady: true` + `profileStatus: "runtime-ready"`
 *                                    → runtime-ready (BM-171 shape).
 *   3. `runtimeReady: true` + `profileStatus: "audit-only"`
 *                                    → NOT runtime-ready (status wins).
 *   4. `runtimeReady: false` + `profileStatus: "runtime-ready"`
 *                                    → NOT runtime-ready (runtimeReady wins).
 *   5. `runtimeReady: false` + `profileStatus: "audit-only"`
 *                                    → NOT runtime-ready (BM-001 shape).
 *   6. `runtimeReady: false` + `profileStatus: "skeleton"`
 *                                    → NOT runtime-ready (reserved synonym).
 *   7. Both flags missing / undefined → NOT runtime-ready.
 *      (Fail-closed: a forgotten flag never promotes a profile.)
 *
 * And the downstream contract:
 *
 *   8. `gateRuntimePreview` + `gateGeneratedDocumentSave` use
 *      `isRuntimeReadyProfile` internally — when the registered
 *      profile is not runtime-ready, both gates collapse to the
 *      no-profile default `{ok:true}`.
 *
 *   9. `resolveRuntimeSummary` + `resolveGeneratedDocumentSummary`
 *      return `null` when the registered profile is not runtime-ready.
 *
 *  10. `acceptRuntimeRenderedText` + `acceptGeneratedDocumentRenderedText`
 *      return `{passed:true, missingRequired:[], foundForbidden:[]}`
 *      when the registered profile is not runtime-ready.
 *
 *  11. `listRuntimeMissingFields` + `listGeneratedDocumentMissingFields`
 *      return `[]` when the registered profile is not runtime-ready.
 *
 *  12. `buildRuntimePreviewPayload` + `buildGeneratedDocumentSavePayload`
 *      + `buildGeneratedDocumentDemoPayload` are pass-throughs when the
 *      registered profile is not runtime-ready.
 *
 *  13. The BM-171 baseline (runtime-ready) is unaffected: the gates
 *      still fire on missing required fields and produce the canonical
 *      missing list. Sanity-check that the guard does NOT regress the
 *      BM-171 path.
 *
 * Pure tests; no DOM, no fetch, no React.
 */

import { strict as assert } from "node:assert";
import { describe, it, beforeEach } from "node:test";

import {
  buildRuntimePreviewPayload,
  gateRuntimePreview,
  resolveRuntimeSummary,
  acceptRuntimeRenderedText,
  listRuntimeMissingFields,
} from "./adapters/template-runtime-adapter";
import {
  buildGeneratedDocumentSavePayload,
  buildGeneratedDocumentDemoPayload,
  gateGeneratedDocumentSave,
  resolveGeneratedDocumentSummary,
  acceptGeneratedDocumentRenderedText,
  listGeneratedDocumentMissingFields,
} from "./adapters/generated-document-adapter";
import {
  getFormFlightProfile,
  registerFormFlightProfile,
  __resetFormFlightProfilesForTests,
} from "./registry";
import {
  isRuntimeReadyProfile,
  effectiveProfileStatus,
} from "./profile-status";
import * as profileStatus from "./profile-status";
import type { FormFlightProfile } from "./types";
import { BM171_FORM_FLIGHT_PROFILE } from "./profiles/bm171";
import { BM001_FORM_FLIGHT_PROFILE } from "./profiles/bm001";

function makeProfile(
  templateCode: string,
  partial: Partial<FormFlightProfile>,
): FormFlightProfile {
  return {
    templateCode,
    title: `Test ${templateCode}`,
    fieldPaths: ["foo.bar", "baz.qux"],
    requiredFieldPaths: ["foo.bar"],
    demo: {},
    acceptance: { requiredText: [], forbiddenText: [] },
    ...partial,
  };
}

describe("profile runtime-readiness guard", () => {
  beforeEach(() => {
    __resetFormFlightProfilesForTests();
  });

  // ─── isRuntimeReadyProfile / effectiveProfileStatus ─────────────────────

  it("returns false for null / undefined", () => {
    assert.equal(isRuntimeReadyProfile(null), false);
    assert.equal(isRuntimeReadyProfile(undefined), false);
  });

  it("returns true only when both flags are present and correct (BM-171 shape)", () => {
    const ok = makeProfile("BM-171", {
      runtimeReady: true,
      profileStatus: "runtime-ready",
    });
    assert.equal(isRuntimeReadyProfile(ok), true);
    assert.equal(effectiveProfileStatus(ok), "runtime-ready");
  });

  it("returns false when runtimeReady is missing", () => {
    const missing = makeProfile("BM-001", {
      profileStatus: "runtime-ready",
    });
    assert.equal(isRuntimeReadyProfile(missing), false);
    assert.equal(effectiveProfileStatus(missing), "audit-only");
  });

  it("returns false when profileStatus is missing", () => {
    const missing = makeProfile("BM-001", {
      runtimeReady: true,
    });
    assert.equal(isRuntimeReadyProfile(missing), false);
    assert.equal(effectiveProfileStatus(missing), "audit-only");
  });

  it("returns false when runtimeReady=true but profileStatus='audit-only'", () => {
    const mixed = makeProfile("BM-001", {
      runtimeReady: true,
      profileStatus: "audit-only",
    });
    assert.equal(isRuntimeReadyProfile(mixed), false);
    assert.equal(effectiveProfileStatus(mixed), "audit-only");
  });

  it("returns false when runtimeReady=false but profileStatus='runtime-ready'", () => {
    const mixed = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "runtime-ready",
    });
    assert.equal(isRuntimeReadyProfile(mixed), false);
    // Both flags disagree → fail-closed → "audit-only".
    assert.equal(effectiveProfileStatus(mixed), "audit-only");
  });

  it("returns false for the BM-001 audit-only shape", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
    });
    assert.equal(isRuntimeReadyProfile(auditOnly), false);
    assert.equal(effectiveProfileStatus(auditOnly), "audit-only");
  });

  it("returns false for the reserved 'skeleton' status", () => {
    const skeleton = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "skeleton",
    });
    assert.equal(isRuntimeReadyProfile(skeleton), false);
    assert.equal(effectiveProfileStatus(skeleton), "skeleton");
  });

  it("fails closed when both flags are missing", () => {
    const forgotten = makeProfile("BM-001", {});
    assert.equal(isRuntimeReadyProfile(forgotten), false);
    assert.equal(effectiveProfileStatus(forgotten), "audit-only");
  });

  // ─── Adapter helpers: must skip non-runtime-ready profiles ─────────────

  it("gate helpers collapse to the no-profile default for non-runtime-ready profiles", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
      requiredFieldPaths: ["foo.bar"],
    });
    registerFormFlightProfile(auditOnly);
    const runtime = gateRuntimePreview({}, "BM-001");
    const document = gateGeneratedDocumentSave({}, "BM-001");
    assert.deepEqual(runtime, { ok: true });
    assert.deepEqual(document, { ok: true });
  });

  it("summary helpers return null for non-runtime-ready profiles", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
    });
    registerFormFlightProfile(auditOnly);
    assert.equal(resolveRuntimeSummary({ foo: { bar: "x" } }, "BM-001"), null);
    assert.equal(
      resolveGeneratedDocumentSummary({ foo: { bar: "x" } }, "BM-001"),
      null,
    );
  });

  it("acceptance helpers return {passed:true, ...[]} for non-runtime-ready profiles", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
    });
    registerFormFlightProfile(auditOnly);
    const runtime = acceptRuntimeRenderedText("any text", "BM-001");
    const document = acceptGeneratedDocumentRenderedText("any text", "BM-001");
    assert.deepEqual(runtime, {
      passed: true,
      missingRequired: [],
      foundForbidden: [],
    });
    assert.deepEqual(document, {
      passed: true,
      missingRequired: [],
      foundForbidden: [],
    });
  });

  it("missing-field list helpers return [] for non-runtime-ready profiles", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
      requiredFieldPaths: ["foo.bar"],
    });
    registerFormFlightProfile(auditOnly);
    assert.equal(listRuntimeMissingFields({}, "BM-001").length, 0);
    assert.equal(listGeneratedDocumentMissingFields({}, "BM-001").length, 0);
  });

  it("payload builders are pass-throughs for non-runtime-ready profiles", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
      demo: { "foo.bar": "DEMO_VALUE" }, // Must NOT be applied
    });
    registerFormFlightProfile(auditOnly);
    const draft = { foo: { bar: "user typed this" } };
    const runtime = buildRuntimePreviewPayload(draft, "BM-001", "preview");
    const save = buildGeneratedDocumentSavePayload(draft, "BM-001");
    const demo = buildGeneratedDocumentDemoPayload(draft, "BM-001");
    assert.deepEqual(runtime.payload, draft);
    assert.deepEqual(save.payload, draft);
    assert.deepEqual(demo.payload, draft);
    assert.equal(runtime.sanitizedPaths.length, 0);
    assert.equal(save.sanitizedPaths.length, 0);
    assert.equal(demo.sanitizedPaths.length, 0);
  });

  // ─── Regression sanity: BM-171 runtime-ready path still fires ──────────

  it("BM-171 (runtime-ready) gate still fires on missing required fields", () => {
    const bm171 = makeProfile("BM-171", {
      runtimeReady: true,
      profileStatus: "runtime-ready",
      requiredFieldPaths: ["foo.bar", "baz.qux"],
    });
    registerFormFlightProfile(bm171);
    const runtime = gateRuntimePreview({}, "BM-171");
    const document = gateGeneratedDocumentSave({}, "BM-171");
    assert.equal(runtime.ok, false);
    assert.equal(document.ok, false);
    if (!runtime.ok && !document.ok) {
      assert.deepEqual(
        [...runtime.missing].sort(),
        ["baz.qux", "foo.bar"],
      );
      assert.deepEqual(
        [...document.missing].sort(),
        ["baz.qux", "foo.bar"],
      );
    }
  });

  it("BM-171 (runtime-ready) summary returns a real summary, not null", () => {
    const bm171 = makeProfile("BM-171", {
      runtimeReady: true,
      profileStatus: "runtime-ready",
    });
    registerFormFlightProfile(bm171);
    const runtime = resolveRuntimeSummary({ foo: { bar: "x" } }, "BM-171");
    const document = resolveGeneratedDocumentSummary(
      { foo: { bar: "x" } },
      "BM-171",
    );
    assert.ok(runtime, "BM-171 must surface a runtime summary");
    assert.ok(document, "BM-171 must surface a generated-document summary");
    assert.deepEqual(runtime, document);
  });

  // ─── Registry lookup shape ──────────────────────────────────────────────

  it("getFormFlightProfile returns the registered profile unchanged (audit-only or runtime-ready)", () => {
    const auditOnly = makeProfile("BM-001", {
      runtimeReady: false,
      profileStatus: "audit-only",
    });
    registerFormFlightProfile(auditOnly);
    const fetched = getFormFlightProfile("BM-001");
    assert.ok(fetched);
    assert.equal(fetched.runtimeReady, false);
    assert.equal(fetched.profileStatus, "audit-only");
  });

  // ─── Real exported production profiles ─────────────────────────────────
  //
  // BM-001 and BM-171 are the two approved runtime-ready pilots. These
  // assertions lock the export-level contract so a future edit cannot
  // silently regress either profile into the unguarded no-profile path.

  it("real BM171_FORM_FLIGHT_PROFILE is runtime-ready (PR-A3)", () => {
    // Direct on the exported constant — does not depend on the registry.
    assert.equal(
      isRuntimeReadyProfile(BM171_FORM_FLIGHT_PROFILE),
      true,
      "BM171_FORM_FLIGHT_PROFILE must satisfy isRuntimeReadyProfile",
    );
    assert.equal(
      effectiveProfileStatus(BM171_FORM_FLIGHT_PROFILE),
      "runtime-ready",
    );
    assert.equal(BM171_FORM_FLIGHT_PROFILE.runtimeReady, true);
    assert.equal(BM171_FORM_FLIGHT_PROFILE.profileStatus, "runtime-ready");
  });

  it("real BM001_FORM_FLIGHT_PROFILE is runtime-ready", () => {
    assert.equal(
      isRuntimeReadyProfile(BM001_FORM_FLIGHT_PROFILE),
      true,
      "BM001_FORM_FLIGHT_PROFILE must satisfy isRuntimeReadyProfile",
    );
    assert.equal(
      effectiveProfileStatus(BM001_FORM_FLIGHT_PROFILE),
      "runtime-ready",
    );
    assert.equal(BM001_FORM_FLIGHT_PROFILE.runtimeReady, true);
    assert.equal(BM001_FORM_FLIGHT_PROFILE.profileStatus, "runtime-ready");
  });

  it("PR-A3 promotion does not weaken the readiness guard (BM-171 path still fires)", () => {
    // Register the real BM-171 profile and confirm the runtime-ready
    // gate actually consults the profile (returns ok=false on missing
    // required fields). This re-asserts PR-A2R invariant 13 against
    // the real exported profile, not a synthetic one.
    registerFormFlightProfile(BM171_FORM_FLIGHT_PROFILE);
    const runtime = gateRuntimePreview({}, "BM-171");
    const document = gateGeneratedDocumentSave({}, "BM-171");
    assert.equal(runtime.ok, false, "BM-171 gate must still fire");
    assert.equal(document.ok, false, "BM-171 gate must still fire");
    if (!runtime.ok && !document.ok) {
      assert.deepEqual(
        [...runtime.missing].sort(),
        [...document.missing].sort(),
        "runtime and document gates must agree on missing required fields",
      );
    }
  });

  it("BM-001 runtime-ready profile enforces the same cross-flow gates", () => {
    registerFormFlightProfile(BM001_FORM_FLIGHT_PROFILE);
    const runtime = gateRuntimePreview({}, "BM-001");
    const document = gateGeneratedDocumentSave({}, "BM-001");
    assert.equal(runtime.ok, false, "BM-001 runtime gate must fire");
    assert.equal(document.ok, false, "BM-001 document gate must fire");
    if (!runtime.ok && !document.ok) {
      assert.ok(runtime.missing.length > 0);
      assert.deepEqual(
        [...runtime.missing].sort(),
        [...document.missing].sort(),
        "runtime and document gates must agree on missing required fields",
      );
    }

    const runtimeSummary = resolveRuntimeSummary({}, "BM-001");
    const documentSummary = resolveGeneratedDocumentSummary({}, "BM-001");
    assert.ok(runtimeSummary, "BM-001 must surface a runtime summary");
    assert.deepEqual(runtimeSummary, documentSummary);

    const runtimeAcceptance = acceptRuntimeRenderedText("any", "BM-001");
    const documentAcceptance = acceptGeneratedDocumentRenderedText(
      "any",
      "BM-001",
    );
    assert.equal(runtimeAcceptance.passed, false);
    assert.deepEqual(runtimeAcceptance, documentAcceptance);
    assert.ok(runtimeAcceptance.missingRequired.length > 0);

    const runtimeMissing = listRuntimeMissingFields({}, "BM-001");
    const documentMissing = listGeneratedDocumentMissingFields({}, "BM-001");
    assert.ok(runtimeMissing.length > 0);
    assert.deepEqual(runtimeMissing, documentMissing);
  });

  it("recognizes persisted-ready without promoting it to runtime-ready", () => {
    const persisted = makeProfile("BM-002", {
      persistedReady: true,
      profileStatus: "persisted-ready",
    } as Partial<FormFlightProfile>);
    const isPersistedReadyProfile = (
      profileStatus as typeof profileStatus & {
        isPersistedReadyProfile?: (profile: FormFlightProfile) => boolean;
      }
    ).isPersistedReadyProfile;

    assert.equal(typeof isPersistedReadyProfile, "function");
    assert.equal(isPersistedReadyProfile?.(persisted), true);
    assert.equal(isRuntimeReadyProfile(persisted), false);
  });
});
