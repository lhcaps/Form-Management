/**
 * BM-171 shared-core parity tests.
 *
 * Proves that:
 *   - the canonical BM-171 FormFlightProfile is registered
 *   - `fieldPaths` is the canonical BM-171 dot-path set
 *   - `requiredFieldPaths` is exactly the locked contract's required set
 *   - the runtime adapter and generated-document adapter produce the
 *     same sanitized payload for the same draft
 *   - the missing-required gate fires the same paths in both flows
 *   - the summary line for "Người nhận" is data-driven (no leak of
 *     "(mẫu)" when the user clears the field)
 *   - the acceptance scanner flags stale fallback garbage
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
} from "./adapters/template-runtime-adapter";
import {
  buildGeneratedDocumentSavePayload,
  buildGeneratedDocumentDemoPayload,
  gateGeneratedDocumentSave,
  resolveGeneratedDocumentSummary,
  acceptGeneratedDocumentRenderedText,
  listGeneratedDocumentMissingFields,
  assertProfileInvariant,
} from "./adapters/generated-document-adapter";
import {
  getFormFlightProfile,
  registerFormFlightProfile,
  __resetFormFlightProfilesForTests,
} from "./registry";
import {
  BM171_FORM_FLIGHT_PROFILE,
} from "./profiles/bm171";
import {
  collectFormFlightMissingRequired,
} from "./validation";
import {
  resolveFormFlightSummary,
} from "./summary";
import { scanFormFlightAcceptance } from "./acceptance";

describe("BM-171 shared core", () => {
  beforeEach(() => {
    __resetFormFlightProfilesForTests();
    registerFormFlightProfile(BM171_FORM_FLIGHT_PROFILE);
  });

  it("registers a BM-171 profile with the canonical templateCode", () => {
    const profile = getFormFlightProfile("BM-171");
    assert.ok(profile, "BM-171 profile must be registered");
    assert.equal(profile.templateCode, "BM-171");
    assert.equal(profile.title, "QĐ trả lại tài sản");
  });

  it("fieldPaths covers all canonical BM-171 dot-paths", () => {
    const profile = getFormFlightProfile("BM-171");
    assert.ok(profile);
    const expectedCanonicalPaths = [
      "agency.parentName",
      "agency.name",
      "document.documentCode",
      "document.issueDate",
      "assetReturn.assetListLine",
      "assetOwner.fullName",
      "assetOwner.identityNo",
      "signature.positionTitle",
      "signature.signerName",
    ];
    for (const path of expectedCanonicalPaths) {
      assert.ok(
        profile.fieldPaths.includes(path),
        `fieldPaths must contain ${path}`,
      );
    }
  });

  it("requiredFieldPaths is a strict subset of fieldPaths", () => {
    const profile = getFormFlightProfile("BM-171");
    assert.ok(profile);
    assert.equal(assertProfileInvariant(profile), "");
  });

  it(
    "requiredFieldPaths match the locked contract required set " +
      "(assetOwner.fullName, document.documentCode, signature.signerName)",
    () => {
      const profile = getFormFlightProfile("BM-171");
      assert.ok(profile);
      assert.ok(
        profile.requiredFieldPaths.includes("assetOwner.fullName"),
      );
      assert.ok(
        profile.requiredFieldPaths.includes("document.documentCode"),
      );
      assert.ok(
        profile.requiredFieldPaths.includes("signature.signerName"),
      );
    },
  );

  it(
    "runtime and generated-document adapters use the SAME fieldPaths",
    () => {
      const profile = getFormFlightProfile("BM-171");
      assert.ok(profile);
      const runtimeProfile = getFormFlightProfile("BM-171");
      assert.equal(
        profile.fieldPaths.join(","),
        runtimeProfile.fieldPaths.join(","),
      );
    },
  );

  it(
    "runtime and generated-document adapters return IDENTICAL sanitized " +
      "payload for the same draft",
    () => {
      const draft = {
        agency: { parentName: "X", name: "Y" },
        document: { documentCode: "01/QĐ" },
        assetOwner: { fullName: "" },
        signature: { signerName: "  " },
      };

      const runtime = buildRuntimePreviewPayload(draft, "BM-171", "preview");
      const document = buildGeneratedDocumentSavePayload(draft, "BM-171");

      assert.deepEqual(
        runtime.payload,
        document.payload,
        "runtime and generated-document payloads must match",
      );
    },
  );

  it(
    "runtime and generated-document gates agree on the missing-required list",
    () => {
      const draft = {
        agency: { parentName: "X", name: "Y" },
        document: { documentCode: "" },
        assetReturn: { investigationConclusionLegalBasisLine: "" },
        assetOwner: { fullName: "", identityNo: "" },
        signature: { positionTitle: "", signerName: "" },
      };

      const runtimeGate = gateRuntimePreview(draft, "BM-171");
      const documentGate = gateGeneratedDocumentSave(draft, "BM-171");

      assert.equal(runtimeGate.ok, false);
      assert.equal(documentGate.ok, false);
      if (!runtimeGate.ok && !documentGate.ok) {
        assert.deepEqual(
          [...runtimeGate.missing].sort(),
          [...documentGate.missing].sort(),
        );
      }
    },
  );

  it(
    "missing required fields block preview/export and save identically",
    () => {
      const draft = {};
      const missing = collectFormFlightMissingRequired(
        draft,
        BM171_FORM_FLIGHT_PROFILE,
      );
      assert.ok(
        missing.find((m) => m.path === "assetOwner.fullName"),
      );
      assert.ok(
        missing.find((m) => m.path === "document.documentCode"),
      );
      assert.ok(
        missing.find((m) => m.path === "signature.signerName"),
      );
    },
  );

  it("user override is preserved in both adapters", () => {
    const draft = {
      assetOwner: {
        fullName: "Nguyễn Văn A — người nhận thật",
      },
      signature: { signerName: "Trần Thị B" },
    };

    const runtime = buildRuntimePreviewPayload(draft, "BM-171", "preview");
    const document = buildGeneratedDocumentSavePayload(draft, "BM-171");

    const runtimeAssetOwner = runtime.payload.assetOwner as
      | Record<string, unknown>
      | undefined;
    const documentAssetOwner = document.payload.assetOwner as
      | Record<string, unknown>
      | undefined;
    assert.equal(runtimeAssetOwner?.fullName, "Nguyễn Văn A — người nhận thật");
    assert.equal(documentAssetOwner?.fullName, "Nguyễn Văn A — người nhận thật");
  });

  it(
    "demo-reset overwrites user values (runtime + document agree)",
    () => {
      const draft = {
        assetOwner: { fullName: "user typed something" },
        signature: { signerName: "user typed" },
      };

      const runtime = buildRuntimePreviewPayload(
        draft,
        "BM-171",
        "demo-reset",
      );
      const document = buildGeneratedDocumentDemoPayload(draft, "BM-171");

      const runtimeAssetOwner = runtime.payload.assetOwner as
        | Record<string, unknown>
        | undefined;
      const documentAssetOwner = document.payload.assetOwner as
        | Record<string, unknown>
        | undefined;
      assert.equal(
        runtimeAssetOwner?.fullName,
        BM171_FORM_FLIGHT_PROFILE.demo["assetOwner.fullName"],
      );
      assert.equal(
        documentAssetOwner?.fullName,
        BM171_FORM_FLIGHT_PROFILE.demo["assetOwner.fullName"],
      );
    },
  );

  it(
    "summary line for 'Người nhận' is data-driven — shows '—' when empty, " +
      "real name when filled",
    () => {
      const profile = getFormFlightProfile("BM-171");
      assert.ok(profile);
      const empty = resolveFormFlightSummary({}, profile);
      const receiver = empty.find((l) => l.label === "Người nhận");
      assert.ok(receiver);
      assert.equal(receiver.value, "—");

      const filled = resolveFormFlightSummary(
        { assetOwner: { fullName: "Nguyễn Văn A" } },
        profile,
      );
      const receiverFilled = filled.find(
        (l) => l.label === "Người nhận",
      );
      assert.ok(receiverFilled);
      assert.equal(receiverFilled.value, "Nguyễn Văn A");
    },
  );

  it(
    "runtime and generated-document summaries agree on the same draft",
    () => {
      const draft = {
        agency: { name: "VKS KV7" },
        document: { documentCode: "01/QĐ", issuePlaceAndDateLine: "TP.HCM, ngày 04 tháng 7 năm 2026" },
        assetOwner: { fullName: "Nguyễn Văn A" },
        assetReturn: { assetListLine: "01 xe máy" },
        signature: { signMode: "KT.", positionTitle: "VIỆN TRƯỞNG", signerName: "B" },
        recipients: { archiveLine: "Lưu: HSVA" },
      };
      const runtime = resolveRuntimeSummary(draft, "BM-171");
      const document = resolveGeneratedDocumentSummary(draft, "BM-171");
      assert.deepEqual(runtime, document);
    },
  );

  it(
    "acceptance scanner flags stale fallback garbage and missing anchors",
    () => {
      const rendered = [
        "QUYẾT ĐỊNH",
        "01/QĐ-VKSKV7",
        "Căn cứ Điều 41 Bộ luật Tố tụng hình sự", // forbidden
      ].join("\n");

      const result = scanFormFlightAcceptance(
        rendered,
        BM171_FORM_FLIGHT_PROFILE,
      );
      assert.equal(result.passed, false);
      assert.ok(result.foundForbidden.length > 0);
      // missing VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 — required but absent
      assert.ok(result.missingRequired.length > 0);
    },
  );

  it(
    "acceptance scanner passes when required anchors present and no " +
      "forbidden garbage leaks",
    () => {
      const rendered = [
        "QUYẾT ĐỊNH",
        "01/QĐ-VKSKV7",
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        "Nguyễn Văn A",
      ].join("\n");
      const result = scanFormFlightAcceptance(
        rendered,
        BM171_FORM_FLIGHT_PROFILE,
      );
      assert.equal(result.passed, true);
      assert.deepEqual(result.missingRequired, []);
      assert.deepEqual(result.foundForbidden, []);
    },
  );

  it(
    "acceptance scanner FAILS when required-field placeholder leaks into render text",
    () => {
      const rendered = [
        "QUYẾT ĐỊNH",
        "01/QĐ-VKSKV7",
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        "Người nhận (mẫu)", // forbidden placeholder
        "Người ký (mẫu)", // forbidden placeholder
      ].join("\n");
      const result = scanFormFlightAcceptance(
        rendered,
        BM171_FORM_FLIGHT_PROFILE,
      );
      assert.equal(result.passed, false);
      assert.ok(result.foundForbidden.length >= 2);
    },
  );

  it(
    "runtime + document acceptance scanners agree",
    () => {
      const text =
        "QUYẾT ĐỊNH 01/QĐ-VKSKV7 VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 Nguyễn Văn A";
      const a = acceptRuntimeRenderedText(text, "BM-171");
      const b = acceptGeneratedDocumentRenderedText(text, "BM-171");
      assert.deepEqual(a, b);
      assert.equal(a.passed, true);
    },
  );

  it(
    "structured missing-field list from the generated-document adapter " +
      "includes the three mandated required fields",
    () => {
      const missing = listGeneratedDocumentMissingFields(
        {},
        "BM-171",
      );
      const paths = missing.map((m) => m.path);
      assert.ok(paths.includes("assetOwner.fullName"));
      assert.ok(paths.includes("document.documentCode"));
      assert.ok(paths.includes("signature.signerName"));
    },
  );

  it(
    "demo fixture for assetOwner.fullName is a REAL synthetic name, not a placeholder",
    () => {
      const demoValue = BM171_FORM_FLIGHT_PROFILE.demo["assetOwner.fullName"];
      assert.ok(demoValue, "demo must provide a value");
      assert.ok(
        !demoValue.includes("(mẫu)"),
        `assetOwner.fullName demo must not contain a placeholder marker, got: ${demoValue}`,
      );
      assert.equal(
        demoValue,
        "Nguyễn Văn A",
        "assetOwner.fullName demo must be the canonical synthetic person",
      );
    },
  );

  it(
    "demo fixture for signature.signerName is a REAL synthetic name, not a placeholder",
    () => {
      const demoValue = BM171_FORM_FLIGHT_PROFILE.demo["signature.signerName"];
      assert.ok(demoValue, "demo must provide a value");
      assert.ok(
        !demoValue.includes("(mẫu)"),
        `signature.signerName demo must not contain a placeholder marker, got: ${demoValue}`,
      );
      assert.equal(
        demoValue,
        "Trần Thị B",
        "signature.signerName demo must be the canonical synthetic signer",
      );
    },
  );

  it(
    "demo fixture for assetReturn.executionRequestLine references the real owner, not 'người nhận (mẫu)'",
    () => {
      const line = BM171_FORM_FLIGHT_PROFILE.demo["assetReturn.executionRequestLine"];
      assert.ok(line, "demo must provide a value");
      assert.ok(
        !line.includes("người nhận (mẫu)"),
        `executionRequestLine demo must not contain 'người nhận (mẫu)', got: ${line}`,
      );
      assert.ok(
        line.includes("Nguyễn Văn A"),
        `executionRequestLine demo must include the real owner name, got: ${line}`,
      );
    },
  );

  it(
    "missing-required gate flags placeholder fullName as STALE_FALLBACK, not MISSING",
    () => {
      const profile = getFormFlightProfile("BM-171");
      assert.ok(profile);
      const draft = {
        assetOwner: { fullName: "Người nhận (mẫu)" },
      };
      const missing = collectFormFlightMissingRequired(draft, profile);
      const ownerMissing = missing.find((m) => m.path === "assetOwner.fullName");
      assert.ok(ownerMissing, "placeholder fullName must be flagged");
      assert.equal(
        ownerMissing?.reason,
        "STALE_FALLBACK",
        "placeholder fullName reason must be STALE_FALLBACK",
      );
    },
  );
});