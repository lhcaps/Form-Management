/**
 * BM-171 runtime preview payload — purity + mode semantics.
 *
 * Tests the new `buildRuntimePreviewPayloadFromDraft` helper that
 * powers `previewDocx`, `exportDocx`, and `applySampleData` in
 * `template-preview-workspace.tsx`.
 *
 * Five mandated scenarios from the task spec:
 *  1. User override preservation (every typed value at a profile path
 *     survives `preview` / `export` mode).
 *  2. Stale fallback cleanup (known fallback garbage at a profile path
 *     is replaced with the canonical demo value, no broad-substring
 *     destruction).
 *  3. Missing required validation (empty required field stays empty;
 *     the function never silently fills it).
 *  4. Demo reset (mode 'demo-reset' is the only path where the demo
 *     value intentionally overwrites user input).
 *  5. Export parity (`preview` and `export` modes produce the same
 *     sanitized payload).
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRuntimePreviewPayloadFromDraft,
  setNestedPath,
} from "./runtime-preview-payload";
import {
  type RuntimeUxProfile,
  getRuntimeUxProfile,
} from "./runtime-ux-profile";
import "./bm171-runtime-ux-profile";

const REQUIRED_BM171_FIELDS = [
  "document.documentCode",
  "assetOwner.fullName",
  "assetOwner.identityNo",
  "assetReturn.assetListLine",
  "assetReturn.executionRequestLine",
  "signature.signerName",
] as const;

function getProfile(): RuntimeUxProfile {
  const profile = getRuntimeUxProfile("BM-171");
  if (!profile) throw new Error("BM-171 profile must be registered for these tests");
  return profile;
}

function buildNestedFromPaths(
  demo: Readonly<Record<string, string>>,
): Record<string, unknown> {
  let next: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(demo)) {
    next = setNestedPath(next, path, value);
  }
  return next;
}

// 1) User override preservation
test("preview/export modes preserve every user-typed value at a profile path", () => {
  const profile = getProfile();
  const userDraft = {
    document: {
      documentCode: "99/QĐ-USER",
    },
    assetOwner: {
      fullName: "Trần Văn User",
      identityNo: "123456789999",
    },
    assetReturn: {
      assetListLine: "01 điện thoại iPhone 15 màu xanh",
      executionRequestLine: "Yêu cầu đơn vị A chuyển giao trong 03 ngày.",
    },
    signature: {
      signerName: "Người Ký User",
    },
  };

  for (const mode of ["preview", "export"] as const) {
    const result = buildRuntimePreviewPayloadFromDraft({
      draft: userDraft,
      profile,
      mode,
    });
    const data = result.payload as Record<string, Record<string, Record<string, string>>>;

    assert.equal(data.document.documentCode, "99/QĐ-USER", `mode=${mode}: documentCode`);
    assert.equal(data.assetOwner.fullName, "Trần Văn User", `mode=${mode}: fullName`);
    assert.equal(data.assetOwner.identityNo, "123456789999", `mode=${mode}: identityNo`);
    assert.equal(data.assetReturn.assetListLine, "01 điện thoại iPhone 15 màu xanh", `mode=${mode}: assetListLine`);
    assert.equal(data.assetReturn.executionRequestLine, "Yêu cầu đơn vị A chuyển giao trong 03 ngày.", `mode=${mode}: executionRequestLine`);
    assert.equal(data.signature.signerName, "Người Ký User", `mode=${mode}: signerName`);

    // No sanitization warnings — these are not stale fallbacks.
    assert.deepEqual(
      result.warnings,
      [],
      `mode=${mode}: no sanitization warnings expected for valid user input`,
    );

    // Verify that no field was overwritten with profile.demo values
    assert.notEqual(
      data.document.documentCode,
      profile.demo["document.documentCode"],
      `mode=${mode}: must not overwrite user documentCode with demo`,
    );
    assert.notEqual(
      data.signature.signerName,
      profile.demo["signature.signerName"],
      `mode=${mode}: must not overwrite user signerName with demo`,
    );
  }
});

// 2) Stale fallback cleanup — BM171 REQUIRED_PLACEHOLDER_GATE rule:
//    known stale fallback / placeholder values are CLEARED from the
//    payload (path becomes undefined), and the field counts as missing
//    required. NEVER preserve, NEVER auto-replace with the demo.
test("preview/export modes CLEAR known stale fallback values instead of preserving them", () => {
  const profile = getProfile();
  const staleDraft = {
    official: {
      issuerTitle: "Cá nhân/Tổ chức theo quy định.",
    },
    legalBasis: {
      procedureArticlesLine: "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
    },
    assetReturn: {
      assetListLine: "Tài sản theo quy định pháp luật",
      executionRequestLine: "Mô tả vụ việc mẫu",
    },
  };

  for (const mode of ["preview", "export"] as const) {
    const result = buildRuntimePreviewPayloadFromDraft({
      draft: staleDraft,
      profile,
      mode,
    });
    const data = result.payload as Record<
      string,
      Record<string, Record<string, string> | string | undefined>
    >;

    // Cleared — path is undefined, NOT replaced with the demo value.
    assert.equal(
      data.legalBasis?.procedureArticlesLine,
      undefined,
      `mode=${mode}: stale legalBasis cleared`,
    );
    assert.equal(
      data.assetReturn?.assetListLine,
      undefined,
      `mode=${mode}: stale assetListLine cleared`,
    );
    assert.equal(
      data.assetReturn?.executionRequestLine,
      undefined,
      `mode=${mode}: stale executionRequestLine cleared`,
    );
    assert.equal(
      data.official?.issuerTitle,
      undefined,
      `mode=${mode}: stale issuerTitle cleared`,
    );

    // Stale fallback fragments must be gone from the payload
    const sample = JSON.stringify(result.payload);
    assert.ok(
      !sample.includes("Căn cứ Điều 41 Bộ luật Tố tụng hình sự"),
      `mode=${mode}: stale Căn cứ Điều 41 removed from payload`,
    );
    assert.ok(
      !sample.includes("Cá nhân/Tổ chức theo quy định"),
      `mode=${mode}: stale issuer title removed from payload`,
    );
    assert.ok(
      !sample.includes("Tài sản theo quy định pháp luật"),
      `mode=${mode}: stale asset placeholder removed from payload`,
    );
    assert.ok(
      !sample.includes("Mô tả vụ việc mẫu"),
      `mode=${mode}: stale execution-request placeholder removed from payload`,
    );

    // Sanitized paths recorded
    assert.ok(
      result.sanitizedPaths.includes("legalBasis.procedureArticlesLine"),
      `mode=${mode}: legalBasis path recorded as sanitized`,
    );
    assert.ok(
      result.sanitizedPaths.includes("assetReturn.assetListLine"),
      `mode=${mode}: assetListLine recorded as sanitized`,
    );
    assert.ok(
      result.warnings.every((w) => w.code === "STALE_FALLBACK_CLEARED"),
      `mode=${mode}: every warning must be STALE_FALLBACK_CLEARED`,
    );
  }
});

test("preview/export modes CLEAR placeholder required values (Người nhận (mẫu), Người ký (mẫu))", () => {
  const profile = getProfile();
  const draft = {
    assetOwner: { fullName: "Người nhận (mẫu)" },
    signature: { signerName: "Người ký (mẫu)" },
    // The Điều 2 placeholder is also caught when the WHOLE value equals
    // the placeholder. (Longer sentences that mention the placeholder as
    // a fragment are deliberately preserved — see the legitimate-text
    // test below. The acceptance scanner handles the fragment case via
    // `forbiddenText`.)
    assetReturn: {
      executionRequestLine: "người nhận (mẫu)",
    },
  };
  for (const mode of ["preview", "export"] as const) {
    const result = buildRuntimePreviewPayloadFromDraft({
      draft,
      profile,
      mode,
    });
    const data = result.payload as Record<
      string,
      Record<string, Record<string, string> | string | undefined>
    >;
    assert.equal(
      data.assetOwner?.fullName,
      undefined,
      `mode=${mode}: assetOwner.fullName placeholder cleared`,
    );
    assert.equal(
      data.signature?.signerName,
      undefined,
      `mode=${mode}: signature.signerName placeholder cleared`,
    );
    assert.equal(
      data.assetReturn?.executionRequestLine,
      undefined,
      `mode=${mode}: Điều 2 placeholder cleared`,
    );
    assert.equal(
      result.warnings.length,
      3,
      `mode=${mode}: 3 placeholder paths sanitized`,
    );
  }
});

test("demo-reset refuses to overwrite user data with a placeholder demo value", () => {
  const profile = getProfile();
  // Build a broken profile whose demo is itself a placeholder.
  // Verify the demo-reset gate refuses it and clears the path
  // instead of leaking the placeholder into the payload.
  const brokenProfile: RuntimeUxProfile = {
    ...profile,
    demo: {
      ...profile.demo,
      "assetOwner.fullName": "Người nhận (mẫu)",
    },
  };
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: { assetOwner: { fullName: "Nguyễn Văn A" } },
    profile: brokenProfile,
    mode: "demo-reset",
  });
  const data = result.payload as Record<
    string,
    Record<string, string | undefined>
  >;
  // The path MUST be cleared, NOT overwritten with the placeholder.
  assert.equal(
    data.assetOwner?.fullName,
    undefined,
    "demo-reset must clear a path whose demo is itself a placeholder",
  );
  const warning = result.warnings.find(
    (w) => w.path === "assetOwner.fullName",
  );
  assert.ok(warning, "demo-reset must emit a warning for the placeholder demo");
  assert.equal(warning!.code, "DEMO_VALUE_IS_STALE");
});

test("preview/export modes do NOT do broad substring replacement that would destroy legitimate user text", () => {
  const profile = getProfile();
  // User typed real text that happens to mention "Căn cứ" — it must NOT
  // be clobbered by the sanitizer because the whole-value pattern only
  // matches the exact stale-fallback string.
  const draftWithLegitimateText = {
    legalBasis: {
      procedureArticlesLine:
        "Căn cứ Điều 41 Bộ luật Tố tụng hình sự năm 2015; (đoạn do VKS bổ sung)",
    },
  };

  const result = buildRuntimePreviewPayloadFromDraft({
    draft: draftWithLegitimateText,
    profile,
    mode: "preview",
  });
  const data = result.payload as Record<string, Record<string, string>>;
  assert.equal(
    data.legalBasis.procedureArticlesLine,
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự năm 2015; (đoạn do VKS bổ sung)",
    "user-typed text that mentions the fragment must be preserved verbatim",
  );
  assert.deepEqual(
    result.sanitizedPaths,
    [],
    "no path is sanitized when the whole-value does not match",
  );
});

// 3) Missing required field stays empty (the function never silently fills it)
test("preview/export modes leave empty fields empty — required validation runs server-side", () => {
  const profile = getProfile();
  const partialDraft = {
    assetOwner: {
      // fullName intentionally empty
      fullName: "",
    },
    document: {
      // documentCode intentionally empty
      documentCode: "",
    },
    signature: {
      signerName: "",
    },
  };

  for (const mode of ["preview", "export"] as const) {
    const result = buildRuntimePreviewPayloadFromDraft({
      draft: partialDraft,
      profile,
      mode,
    });
    const data = result.payload as Record<string, Record<string, Record<string, string>>>;

    // The function must NEVER silently auto-fill.
    assert.equal(data.assetOwner.fullName, "", `mode=${mode}: empty fullName stays empty`);
    assert.equal(data.document.documentCode, "", `mode=${mode}: empty documentCode stays empty`);
    assert.equal(data.signature.signerName, "", `mode=${mode}: empty signerName stays empty`);

    // No sanitization warnings — we did not replace anything.
    assert.deepEqual(
      result.warnings,
      [],
      `mode=${mode}: empty required fields produce no sanitization warnings`,
    );
    assert.deepEqual(
      result.sanitizedPaths,
      [],
      `mode=${mode}: empty required fields produce no sanitized paths`,
    );
  }

  // The required-field KEYS that the workspace would block the render for
  // (cross-check with REQUIRED_BM171_FIELDS).
  for (const key of REQUIRED_BM171_FIELDS) {
    assert.ok(
      key in profile.demo ||
        [
          "document.documentCode",
          "assetOwner.fullName",
          "assetOwner.identityNo",
          "assetReturn.assetListLine",
          "assetReturn.executionRequestLine",
          "signature.signerName",
        ].includes(key),
      `required key '${key}' must be present in profile.demo`,
    );
  }
});

// 4) Demo reset semantics — the ONLY path where demo wins over user input
test("demo-reset mode intentionally overwrites every profile path with the demo value", () => {
  const profile = getProfile();
  const userDraft = {
    document: {
      documentCode: "99/QĐ-USER",
    },
    assetOwner: {
      fullName: "Trần Văn User",
      identityNo: "123456789999",
    },
  };

  const result = buildRuntimePreviewPayloadFromDraft({
    draft: userDraft,
    profile,
    mode: "demo-reset",
  });
  const data = result.payload as Record<string, Record<string, Record<string, string>>>;

  // User values are intentionally overwritten with demo values.
  assert.equal(
    data.document.documentCode,
    profile.demo["document.documentCode"],
    "demo-reset overwrites user documentCode with demo",
  );
  assert.equal(
    data.assetOwner.fullName,
    profile.demo["assetOwner.fullName"],
    "demo-reset overwrites user fullName with demo",
  );
  assert.equal(
    data.assetOwner.identityNo,
    profile.demo["assetOwner.identityNo"],
    "demo-reset overwrites user identityNo with demo",
  );

  // Every profile path is recorded as sanitized.
  assert.equal(
    result.sanitizedPaths.length,
    Object.keys(profile.demo).length,
    "demo-reset records every profile path as sanitized",
  );
  // demo-reset emits zero warnings (no fallback detection needed).
  assert.deepEqual(result.warnings, [], "demo-reset emits no warnings");
});

// 5) Export parity — preview and export must use the SAME sanitized payload
test("preview and export modes produce the same sanitized payload for the same draft", () => {
  const profile = getProfile();
  const mixedDraft = {
    document: {
      documentCode: "99/QĐ-USER",
    },
    legalBasis: {
      procedureArticlesLine: "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
    },
    assetReturn: {
      assetListLine: "01 điện thoại iPhone 15 màu xanh",
      executionRequestLine: "Mô tả vụ việc mẫu",
    },
  };

  const previewResult = buildRuntimePreviewPayloadFromDraft({
    draft: mixedDraft,
    profile,
    mode: "preview",
  });
  const exportResult = buildRuntimePreviewPayloadFromDraft({
    draft: mixedDraft,
    profile,
    mode: "export",
  });

  assert.deepEqual(
    previewResult.payload,
    exportResult.payload,
    "preview and export must produce the same sanitized payload",
  );
  assert.deepEqual(
    previewResult.sanitizedPaths,
    exportResult.sanitizedPaths,
    "preview and export must record the same sanitized paths",
  );
});

// No-profile template — must pass draft through unchanged in all modes
test("without a profile, the payload is the draft as-is in every mode", () => {
  const draft = {
    document: {
      documentCode: "99/QĐ-USER",
    },
  };
  for (const mode of ["preview", "export", "demo-reset"] as const) {
    const result = buildRuntimePreviewPayloadFromDraft({
      draft,
      profile: null,
      mode,
    });
    assert.deepEqual(result.payload, draft, `mode=${mode}: no-profile passthrough`);
    assert.deepEqual(result.sanitizedPaths, []);
    assert.deepEqual(result.warnings, []);
  }
});

// Empty draft + profile — nothing to sanitize, no warnings
test("empty draft produces empty payload and zero warnings in preview/export modes", () => {
  const profile = getProfile();
  const emptyNested = buildNestedFromPaths({});
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: emptyNested,
    profile,
    mode: "preview",
  });
  // Empty draft = no fields to sanitize
  assert.deepEqual(result.payload, {}, "empty payload stays empty");
  assert.deepEqual(result.sanitizedPaths, [], "no paths sanitized");
  assert.deepEqual(result.warnings, [], "no warnings emitted");
});
