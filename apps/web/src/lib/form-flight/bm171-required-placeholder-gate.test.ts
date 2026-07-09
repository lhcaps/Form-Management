/**
 * Required-placeholder gate tests for BM-171.
 *
 * These tests pin the BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX
 * invariants at the unit level. The full integration is exercised by the
 * `reproduce-bm171-runtime-*.mjs` scripts in `apps/api/scripts/`.
 *
 * Test groups:
 *  A. Required-field placeholder values count as missing required.
 *  B. Demo reset uses real synthetic person/signer.
 *  C. Preview/export blocks placeholder fullName/signerName.
 *  D. Summary does not display stale placeholder values.
 *  E. executionRequestLine derives from a valid owner name.
 *  F. User override owner/signer preserved.
 *  G. Date output normalized dd/MM/yyyy.
 *  H. No "Người nhận (mẫu)" / "Người ký (mẫu)" in render text.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { collectFormFlightMissingRequired } from "./validation";
import { scanFormFlightAcceptance } from "./acceptance";
import { BM171_FORM_FLIGHT_PROFILE } from "./profiles/bm171";
import { buildRuntimePreviewPayloadFromDraft, getRuntimeUxProfile } from "../runtime-ux";
import { isKnownStaleFallback, listKnownStaleFallbacks } from "../runtime-ux/placeholder-blocklist";

// -- A. Placeholder values count as missing required ---------------------------

test("A1 — assetOwner.fullName='Người nhận (mẫu)' is STALE_FALLBACK, not valid", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const missing = collectFormFlightMissingRequired(
    { assetOwner: { fullName: "Người nhận (mẫu)" } },
    profile,
  );
  const hit = missing.find((m) => m.path === "assetOwner.fullName");
  assert.ok(hit, "placeholder fullName must be flagged");
  assert.equal(hit!.reason, "STALE_FALLBACK");
});

test("A2 — signature.signerName='Người ký (mẫu)' is STALE_FALLBACK, not valid", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const missing = collectFormFlightMissingRequired(
    { signature: { signerName: "Người ký (mẫu)" } },
    profile,
  );
  const hit = missing.find((m) => m.path === "signature.signerName");
  assert.ok(hit, "placeholder signerName must be flagged");
  assert.equal(hit!.reason, "STALE_FALLBACK");
});

test("A3 — executionRequestLine='người nhận (mẫu)' as a whole value is caught by the placeholder blocklist", () => {
  // `executionRequestLine` is a free-text field, not in the locked
  // contract's required set, so the missing-required gate does not
  // fire for it. However, the placeholder blocklist still flags the
  // whole value as a stale fallback so the payload builder clears it
  // during sanitization. The acceptance scanner additionally catches
  // the lowercase fragment in render text (see H3).
  const value = "người nhận (mẫu)";
  assert.ok(isKnownStaleFallback(value));
  // Direct invocation of the gate without a profile:
  assert.equal(
    collectFormFlightMissingRequired(
      { assetReturn: { executionRequestLine: value } },
      { ...BM171_FORM_FLIGHT_PROFILE, requiredFieldPaths: [] },
    ).length,
    0,
    "non-required path is not flagged by the missing-required gate",
  );
});

test("A4 — empty string is still EMPTY (not STALE_FALLBACK) for backwards compat", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const missing = collectFormFlightMissingRequired(
    { assetOwner: { fullName: "" } },
    profile,
  );
  const hit = missing.find((m) => m.path === "assetOwner.fullName");
  assert.ok(hit);
  assert.equal(hit!.reason, "EMPTY");
});

test("A5 — whitespace-only is also EMPTY", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const missing = collectFormFlightMissingRequired(
    { assetOwner: { fullName: "   " } },
    profile,
  );
  const hit = missing.find((m) => m.path === "assetOwner.fullName");
  assert.ok(hit);
  assert.equal(hit!.reason, "EMPTY");
});

test("A6 — listKnownStaleFallbacks includes all mandated placeholder labels", () => {
  const list = listKnownStaleFallbacks();
  for (const expected of [
    "Người nhận (mẫu)",
    "Người ký (mẫu)",
    "Cá nhân/Tổ chức theo quy định.",
    "Tài sản theo quy định pháp luật",
    "Mô tả vụ việc mẫu",
    "Nội dung mẫu cho biểu mẫu pháp lý.",
    "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
  ]) {
    assert.ok(
      list.includes(expected),
      `blocklist must include '${expected}', got: ${list.join(" | ")}`,
    );
  }
});

// -- B. Demo reset uses real synthetic person/signer --------------------------

test("B1 — BM-171 demo assetOwner.fullName is 'Nguyễn Văn A', not 'Người nhận (mẫu)'", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const demo = profile.demo["assetOwner.fullName"];
  assert.ok(demo);
  assert.equal(demo, "Nguyễn Văn A");
  assert.ok(!isKnownStaleFallback(demo));
});

test("B2 — BM-171 demo signature.signerName is 'Trần Thị B', not 'Người ký (mẫu)'", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const demo = profile.demo["signature.signerName"];
  assert.ok(demo);
  assert.equal(demo, "Trần Thị B");
  assert.ok(!isKnownStaleFallback(demo));
});

test("B3 — BM-171 runtime-ux profile demo matches the form-flight profile demo", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  assert.equal(
    ux!.demo["assetOwner.fullName"],
    BM171_FORM_FLIGHT_PROFILE.demo["assetOwner.fullName"],
  );
  assert.equal(
    ux!.demo["signature.signerName"],
    BM171_FORM_FLIGHT_PROFILE.demo["signature.signerName"],
  );
});

test("B4 — BM-171 demo executionRequestLine references the real owner name", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const line = profile.demo["assetReturn.executionRequestLine"];
  assert.ok(line);
  assert.ok(!line.includes("người nhận (mẫu)"));
  assert.ok(line.includes("Nguyễn Văn A"));
});

// -- C. Preview/export blocks placeholder required values ---------------------

test("C1 — preview mode clears assetOwner.fullName placeholder from payload", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: { assetOwner: { fullName: "Người nhận (mẫu)" } },
    profile: ux,
    mode: "preview",
  });
  const owner = result.payload.assetOwner as
    | Record<string, unknown>
    | undefined;
  assert.equal(owner?.fullName, undefined, "placeholder cleared from payload");
  assert.ok(result.warnings.find((w) => w.path === "assetOwner.fullName"));
});

test("C2 — export mode clears signature.signerName placeholder from payload", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: { signature: { signerName: "Người ký (mẫu)" } },
    profile: ux,
    mode: "export",
  });
  const sig = result.payload.signature as
    | Record<string, unknown>
    | undefined;
  assert.equal(sig?.signerName, undefined, "placeholder cleared from payload");
});

test("C3 — demo-reset with a placeholder demo emits DEMO_VALUE_IS_STALE warning", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  // Build a broken profile whose demo is itself a placeholder.
  const broken: typeof ux = {
    ...ux!,
    demo: {
      ...ux!.demo,
      "assetOwner.fullName": "Người nhận (mẫu)",
    },
  };
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: { assetOwner: { fullName: "user value" } },
    profile: broken,
    mode: "demo-reset",
  });
  const owner = result.payload.assetOwner as
    | Record<string, unknown>
    | undefined;
  assert.equal(owner?.fullName, undefined, "broken demo MUST NOT leak");
  const w = result.warnings.find((w) => w.path === "assetOwner.fullName");
  assert.ok(w);
  assert.equal(w!.code, "DEMO_VALUE_IS_STALE");
});

// -- D. Summary does not display stale placeholder values ---------------------

test("D1 — summary 'Người nhận' shows '—' when fullName is the placeholder", () => {
  // BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX: the
  // summary function treats placeholder values as missing, so the
  // summary card shows '—' instead of leaking "Người nhận (mẫu)".
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const line = profile.summaryLines?.find((l) => l.label === "Người nhận");
  assert.ok(line);
  assert.equal(typeof line!.value, "function");
  const value = (line!.value as (data: Record<string, unknown>) => string)({
    assetOwner: { fullName: "Người nhận (mẫu)" },
  });
  assert.equal(value, "—", `placeholder fullName must collapse to '—'`);
});

test("D2 — summary 'Ký' shows '—' when signer is the placeholder", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const line = profile.summaryLines?.find((l) => l.label === "Ký");
  assert.ok(line);
  const value = (line!.value as (data: Record<string, unknown>) => string)({
    signature: { signerName: "Người ký (mẫu)" },
  });
  assert.equal(value, "—", `placeholder signer must collapse to '—'`);
});

// -- E. executionRequestLine derives from a valid owner name ------------------

test("E1 — executionRequestLine preview mode keeps real owner name verbatim", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: {
      assetOwner: { fullName: "Nguyễn Văn A" },
      assetReturn: {
        executionRequestLine:
          "Yêu cầu đơn vị A chuyển giao tài sản cho ông Nguyễn Văn A trong 03 ngày.",
      },
    },
    profile: ux,
    mode: "preview",
  });
  const ar = result.payload.assetReturn as
    | Record<string, unknown>
    | undefined;
  assert.equal(
    ar?.executionRequestLine,
    "Yêu cầu đơn vị A chuyển giao tài sản cho ông Nguyễn Văn A trong 03 ngày.",
  );
});

// -- F. User override owner/signer preserved ----------------------------------

test("F1 — user-typed owner name 'Lê Văn Test' survives preview", () => {
  const ux = getRuntimeUxProfile("BM-171");
  assert.ok(ux);
  const result = buildRuntimePreviewPayloadFromDraft({
    draft: {
      assetOwner: { fullName: "Lê Văn Test" },
      signature: { signerName: "Phạm Thị Test" },
      assetReturn: {
        executionRequestLine:
          "Yêu cầu đơn vị A chuyển giao tài sản cho ông Lê Văn Test trong 03 ngày.",
      },
    },
    profile: ux,
    mode: "preview",
  });
  const data = result.payload as Record<string, Record<string, string>>;
  assert.equal(data.assetOwner?.fullName, "Lê Văn Test");
  assert.equal(data.signature?.signerName, "Phạm Thị Test");
  assert.ok(
    data.assetReturn?.executionRequestLine?.includes("Lê Văn Test"),
  );
});

// -- G. Date output normalized dd/MM/yyyy -------------------------------------

test("G1 — BM-171 demo dateOfBirthText is two-digit day/month (08/09/1985)", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const dob = profile.demo["assetOwner.dateOfBirthText"];
  assert.equal(dob, "08/09/1985");
  assert.match(dob, /^\d{2}\/\d{2}\/\d{4}$/);
});

test("G2 — BM-171 demo identityIssuedDateText is two-digit day/month (14/12/2021)", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const iss = profile.demo["assetOwner.identityIssuedDateText"];
  assert.equal(iss, "14/12/2021");
  assert.match(iss, /^\d{2}\/\d{2}\/\d{4}$/);
});

// -- H. No "Người nhận (mẫu)" / "Người ký (mẫu)" in render text --------------

test("H1 — acceptance scanner flags 'Người nhận (mẫu)' as forbidden", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const result = scanFormFlightAcceptance(
    "QUYẾT ĐỊNH\n01/QĐ-VKSKV7\nNgười nhận (mẫu)",
    profile,
  );
  assert.equal(result.passed, false);
  assert.ok(result.foundForbidden.some((f) => f.includes("Người nhận (mẫu)")));
});

test("H2 — acceptance scanner flags 'Người ký (mẫu)' as forbidden", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const result = scanFormFlightAcceptance(
    "QUYẾT ĐỊNH\n01/QĐ-VKSKV7\nNgười ký (mẫu)",
    profile,
  );
  assert.equal(result.passed, false);
  assert.ok(result.foundForbidden.some((f) => f.includes("Người ký (mẫu)")));
});

test("H3 — acceptance scanner flags 'người nhận (mẫu)' (lowercase, Điều 2) as forbidden", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const result = scanFormFlightAcceptance(
    "QUYẾT ĐỊNH\n01/QĐ-VKSKV7\n... cho người nhận (mẫu) ...",
    profile,
  );
  assert.equal(result.passed, false);
  assert.ok(
    result.foundForbidden.some((f) => f.includes("người nhận (mẫu)")),
  );
});

test("H4 — clean render text with 'Nguyễn Văn A' passes acceptance", () => {
  const profile = BM171_FORM_FLIGHT_PROFILE;
  const text = [
    "QUYẾT ĐỊNH",
    "01/QĐ-VKSKV7",
    "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    "Nguyễn Văn A",
    "Trần Thị B",
  ].join("\n");
  const result = scanFormFlightAcceptance(text, profile);
  assert.equal(result.passed, true);
  assert.deepEqual(result.missingRequired, []);
  assert.deepEqual(result.foundForbidden, []);
});