import { describe, it } from "node:test";
import assert from "node:assert";
import {
  formatVietnameseLegalDate,
  formatVietnamesePlaceDate,
  getSmartPrefillClassification,
  getSmartPrefillKind,
  getSmartGenericPrefillData,
  mergeWithSmartPrefill,
  DEFAULT_RUNTIME_TEMPLATE_PLACE,
  DEFAULT_RUNTIME_TEMPLATE_TIMEZONE,
} from "./smart-generic-prefill";

describe("formatVietnameseLegalDate", () => {
  it("formats 2026-07-03 as 'ngày 03 tháng 07 năm 2026'", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatVietnameseLegalDate(date),
      "ngày 03 tháng 07 năm 2026",
    );
  });

  it("formats single-digit day and month with leading zeros", () => {
    const date = new Date("2026-01-05T00:00:00.000Z");
    assert.strictEqual(
      formatVietnameseLegalDate(date),
      "ngày 05 tháng 01 năm 2026",
    );
  });

  it("formats year correctly", () => {
    const date = new Date("2025-12-31T00:00:00.000Z");
    assert.strictEqual(
      formatVietnameseLegalDate(date),
      "ngày 31 tháng 12 năm 2025",
    );
  });
});

describe("formatVietnamesePlaceDate", () => {
  it("includes place and date text", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatVietnamesePlaceDate(date, "TP. Hồ Chí Minh"),
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
  });

  it("returns date text only when place is omitted", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatVietnamesePlaceDate(date),
      "ngày 03 tháng 07 năm 2026",
    );
  });

  it("returns date text only when place is undefined", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatVietnamesePlaceDate(date, undefined),
      "ngày 03 tháng 07 năm 2026",
    );
  });
});

describe("getSmartPrefillClassification", () => {
  it("marks document.issuePlaceDateLine as SAFE_RUNTIME_DEFAULT", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "document.issuePlaceDateLine",
        label: "Địa điểm, ngày lập",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      }),
      "SAFE_RUNTIME_DEFAULT",
    );
  });

  it("marks document.issuePlaceAndDateLine as SAFE_RUNTIME_DEFAULT", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "document.issuePlaceAndDateLine",
        label: "Địa danh, ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      }),
      "SAFE_RUNTIME_DEFAULT",
    );
  });

  it("marks document.issueDate with SYSTEM/CURRENT_DATE as SAFE_RUNTIME_DEFAULT", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "document.issueDate",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      }),
      "SAFE_RUNTIME_DEFAULT",
    );
  });

  it("marks document.ngayBan as SAFE_RUNTIME_DEFAULT", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "document.ngayBan",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      }),
      "SAFE_RUNTIME_DEFAULT",
    );
  });

  it("marks recipients.archiveLine as SAFE_GENERIC_PREFILL", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "recipients.archiveLine",
        label: "Nơi lưu",
        dataSource: { kind: "MANUAL" },
      }),
      "SAFE_GENERIC_PREFILL",
    );
  });

  it("marks accused.fullName as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "accused.fullName",
        label: "Họ tên bị can",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks informant.birthDay as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "informant.birthDay",
        label: "Ngày sinh",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks offense.legalArticle as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "offense.legalArticle",
        label: "Điều luật",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks decision.decisionCode as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "decision.decisionCode",
        label: "Số quyết định",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks person.dateOfBirth as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "person.dateOfBirth",
        label: "Ngày sinh",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks detentionArrest.detentionDate as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "detentionArrest.detentionDate",
        label: "Ngày tạm giữ",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks offense.dateOfOffense as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "offense.dateOfOffense",
        label: "Ngày phạm tội",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks sourceReport.receivedDateLine as NEVER_AUTO (tiếp nhận matches NEVER_AUTO pattern)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "sourceReport.receivedDateLine",
        label: "Ngày tiếp nhận",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks reporter.birthDateLine as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "reporter.birthDateLine",
        label: "Sinh ngày",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks agency.name as NEVER_AUTO (no real profile in v1)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "agency.name",
        label: "Tên cơ quan",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks signature.signerName as NEVER_AUTO (no real profile in v1)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "signature.signerName",
        label: "Người ký",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks decision.decisionDate as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "decision.decisionDate",
        label: "Ngày quyết định",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks prosecution.prosecutionDate as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "prosecution.prosecutionDate",
        label: "Ngày khởi tố",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks investigation.investigationStartDate as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "investigation.investigationStartDate",
        label: "Ngày bắt đầu điều tra",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks victim.fullName as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "victim.fullName",
        label: "Họ tên bị hại",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks witness.fullName as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "witness.fullName",
        label: "Họ tên người làm chứng",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks measure.description as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "measure.description",
        label: "Nội dung biện pháp",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks indictment.caseCode as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "indictment.caseCode",
        label: "Số vụ án",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks person.identityIssueDate as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "person.identityIssueDate",
        label: "Ngày cấp",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks offense.description as NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "offense.description",
        label: "Mô tả hành vi",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks sourceSuspension.suspensionDate as NEVER_AUTO (quyết định tạm đình chỉ → NEVER_AUTO)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "sourceSuspension.suspensionDate",
        label: "Ngày quyết định tạm đình chỉ",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks investigationExtension.fromDate as NEVER_AUTO (Từ ngày → NEVER_AUTO pattern)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "investigationExtension.fromDate",
        label: "Từ ngày",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("defaults unknown fields to NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "someUnknown.field",
        label: "Some unknown field",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });

  it("marks person.birthInfoLine as NEVER_AUTO (has birth in path)", () => {
    assert.strictEqual(
      getSmartPrefillClassification({
        key: "person.birthInfoLine",
        label: "Sinh ngày, tháng, năm, nơi sinh",
        dataSource: { kind: "MANUAL" },
      }),
      "NEVER_AUTO",
    );
  });
});

describe("getSmartPrefillKind", () => {
  it("returns DOCUMENT_PLACE_DATE for document.issuePlaceDateLine", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issuePlaceDateLine", label: "Địa điểm, ngày lập" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_PLACE_DATE",
    );
  });

  it("returns DOCUMENT_PLACE_DATE for document.issuePlaceAndDateLine", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issuePlaceAndDateLine", label: "Địa danh, ngày ban hành" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_PLACE_DATE",
    );
  });

  it("returns DOCUMENT_DATE_ISO for document.issueDate with DATE control", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issueDate", label: "Ngày ban hành", control: "DATE" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_DATE_ISO",
    );
  });

  it("returns DOCUMENT_DATE_TEXT for document.issueDate without DATE control", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issueDate", label: "Ngày ban hành", control: "TEXT" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_DATE_TEXT",
    );
  });

  it("returns DOCUMENT_DATE_DAY for document.ngayBan", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.ngayBan", label: "Ngày ban hành" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_DATE_DAY",
    );
  });

  it("returns DOCUMENT_DATE_MONTH for document.issueMonth", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issueMonth", label: "Tháng ban hành" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_DATE_MONTH",
    );
  });

  it("returns DOCUMENT_DATE_YEAR for document.issueYear", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "document.issueYear", label: "Năm ban hành" },
        "SAFE_RUNTIME_DEFAULT",
      ),
      "DOCUMENT_DATE_YEAR",
    );
  });

  it("returns GENERIC_TEXT for recipients.archiveLine", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "recipients.archiveLine", label: "Nơi lưu" },
        "SAFE_GENERIC_PREFILL",
      ),
      "GENERIC_TEXT",
    );
  });

  it("returns NONE for NEVER_AUTO", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "accused.fullName", label: "Họ tên bị can" },
        "NEVER_AUTO",
      ),
      "NONE",
    );
  });

  it("returns NONE for REVIEW_REQUIRED", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "sourceReport.receivedDateLine", label: "Ngày tiếp nhận" },
        "REVIEW_REQUIRED",
      ),
      "NONE",
    );
  });

  it("returns NONE for SAFE_GENERIC_PREFILL without known value provider", () => {
    assert.strictEqual(
      getSmartPrefillKind(
        { key: "legalBasis.procedureArticlesLine", label: "Căn cứ" },
        "SAFE_GENERIC_PREFILL",
      ),
      "NONE",
    );
  });
});

describe("getSmartGenericPrefillData", () => {
  const fixedDate = new Date("2026-07-03T00:00:00.000Z");

  it("fills document.issuePlaceDateLine with current place-date", () => {
    const fields = [
      {
        key: "document.issuePlaceDateLine",
        label: "Địa điểm, ngày lập",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
      defaultPlace: "TP. Hồ Chí Minh",
    });

    assert.strictEqual(
      result.values["document.issuePlaceDateLine"],
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
    assert.ok(result.appliedKeys.includes("document.issuePlaceDateLine"));
  });

  it("fills document.ngayBan with current day", () => {
    const fields = [
      {
        key: "document.ngayBan",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["document.ngayBan"], "03");
    assert.ok(result.appliedKeys.includes("document.ngayBan"));
  });

  it("fills document.issueDate with ISO date for DATE control", () => {
    const fields = [
      {
        key: "document.issueDate",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
        control: "DATE",
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["document.issueDate"], "2026-07-03");
  });

  it("fills document.issueDate with text date for TEXT control", () => {
    const fields = [
      {
        key: "document.issueDate",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
        control: "TEXT",
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(
      result.values["document.issueDate"],
      "ngày 03 tháng 07 năm 2026",
    );
  });

  it("fills recipients.archiveLine with generic text", () => {
    const fields = [
      {
        key: "recipients.archiveLine",
        label: "Nơi lưu",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["recipients.archiveLine"], "Lưu: HSVA, HSKS, VP.");
    assert.ok(result.appliedKeys.includes("recipients.archiveLine"));
  });

  it("does NOT fill accused.fullName", () => {
    const fields = [
      {
        key: "accused.fullName",
        label: "Họ tên bị can",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["accused.fullName"], undefined);
    assert.ok(!result.appliedKeys.includes("accused.fullName"));
    assert.ok(result.skipped.find((s) => s.key === "accused.fullName"));
  });

  it("does NOT fill birth date fields", () => {
    const fields = [
      {
        key: "informant.birthDay",
        label: "Ngày sinh",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["informant.birthDay"], undefined);
    assert.ok(!result.appliedKeys.includes("informant.birthDay"));
  });

  it("does NOT fill offense fields", () => {
    const fields = [
      {
        key: "offense.legalArticle",
        label: "Điều luật",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["offense.legalArticle"], undefined);
    assert.ok(!result.appliedKeys.includes("offense.legalArticle"));
  });

  it("does NOT fill decision fields", () => {
    const fields = [
      {
        key: "decision.decisionCode",
        label: "Số quyết định",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["decision.decisionCode"], undefined);
  });

  it("does NOT fill agency.name in v1", () => {
    const fields = [
      {
        key: "agency.name",
        label: "Tên cơ quan",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["agency.name"], undefined);
    assert.ok(!result.appliedKeys.includes("agency.name"));
  });

  it("does NOT fill signature.signerName in v1", () => {
    const fields = [
      {
        key: "signature.signerName",
        label: "Người ký",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["signature.signerName"], undefined);
    assert.ok(!result.appliedKeys.includes("signature.signerName"));
  });

  it("does NOT fill legalBasis fields (no trusted provider in v1)", () => {
    const fields = [
      {
        key: "legalBasis.procedureArticlesLine",
        label: "Căn cứ",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.values["legalBasis.procedureArticlesLine"], undefined);
  });

  it("returns accurate summary counts", () => {
    const fields = [
      {
        key: "document.issuePlaceDateLine",
        label: "Địa điểm, ngày lập",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      },
      {
        key: "recipients.archiveLine",
        label: "Nơi lưu",
        dataSource: { kind: "MANUAL" },
      },
      {
        key: "accused.fullName",
        label: "Họ tên bị can",
        dataSource: { kind: "MANUAL" },
      },
      {
        key: "sourceReport.receivedDateLine",
        label: "Ngày tiếp nhận",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    assert.strictEqual(result.summary.safeRuntimeDefault, 1);
    assert.strictEqual(result.summary.safeGenericPrefill, 1);
    assert.strictEqual(result.summary.neverAuto, 2);
    assert.strictEqual(result.summary.reviewRequired, 0);
  });

  it("uses default context when not provided", () => {
    const fields = [
      {
        key: "document.ngayBan",
        label: "Ngày ban hành",
        dataSource: { kind: "SYSTEM", value: "CURRENT_DATE" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields);

    assert.ok(result.values["document.ngayBan"] !== undefined);
    assert.ok(result.appliedKeys.includes("document.ngayBan"));
  });

  it("records skipped fields with reasons", () => {
    const fields = [
      {
        key: "accused.fullName",
        label: "Họ tên bị can",
        dataSource: { kind: "MANUAL" },
      },
    ];
    const result = getSmartGenericPrefillData("BM-001", fields, {
      now: fixedDate,
    });

    const skippedAccused = result.skipped.find(
      (s) => s.key === "accused.fullName",
    );
    assert.ok(skippedAccused !== undefined);
    assert.strictEqual(skippedAccused?.classification, "NEVER_AUTO");
    assert.ok(skippedAccused?.reason !== undefined);
  });
});

describe("mergeWithSmartPrefill", () => {
  it("fills empty string field", () => {
    const current = { "document.issuePlaceDateLine": "" };
    const prefill = {
      "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(
      result.data["document.issuePlaceDateLine"],
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
    assert.ok(result.appliedKeys.includes("document.issuePlaceDateLine"));
  });

  it("fills null field", () => {
    const current = { "document.issuePlaceDateLine": null };
    const prefill = {
      "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(
      result.data["document.issuePlaceDateLine"],
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
  });

  it("fills undefined field", () => {
    const current = {};
    const prefill = {
      "document.ngayBan": "03",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(result.data["document.ngayBan"], "03");
  });

  it("never overwrites existing non-empty string", () => {
    const current = {
      "document.issuePlaceDateLine":
        "User-entered place, ngày 10 tháng 03 năm 2025",
    };
    const prefill = {
      "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(
      result.data["document.issuePlaceDateLine"],
      "User-entered place, ngày 10 tháng 03 năm 2025",
    );
    assert.ok(result.preservedKeys.includes("document.issuePlaceDateLine"));
    assert.ok(!result.appliedKeys.includes("document.issuePlaceDateLine"));
  });

  it("never overwrites existing 0 number", () => {
    const current = { someField: 0 };
    const prefill = { someField: "filled value" };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(result.data["someField"], 0);
    assert.ok(result.preservedKeys.includes("someField"));
  });

  it("never overwrites existing false boolean", () => {
    const current = { someField: false };
    const prefill = { someField: "filled value" };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(result.data["someField"], false);
  });

  it("never overwrites existing non-empty nested object field", () => {
    const current: Record<string, unknown> = {
      person: { fullName: "Nguyễn Văn User" },
    };
    const prefill = { person: { fullName: "Nguyễn Văn Prefill" } };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(
      (result.data["person"] as Record<string, unknown>)["fullName"],
      "Nguyễn Văn User",
    );
  });

  it("fills multiple empty fields at once", () => {
    const current = {};
    const prefill = {
      "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
      "document.ngayBan": "03",
      "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(
      result.data["document.issuePlaceDateLine"],
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
    assert.strictEqual(result.data["document.ngayBan"], "03");
    assert.strictEqual(
      result.data["recipients.archiveLine"],
      "Lưu: HSVA, HSKS, VP.",
    );
    assert.strictEqual(result.appliedKeys.length, 3);
  });

  it("does NOT mutate the input current object", () => {
    const current: Record<string, unknown> = {};
    const prefill = { "document.ngayBan": "03" };
    const original = { ...current };
    mergeWithSmartPrefill(current, prefill);

    assert.deepStrictEqual(current, original);
  });

  it("does NOT mutate the input prefill object", () => {
    const current: Record<string, unknown> = {};
    const prefill = { "document.ngayBan": "03" };
    const original = { ...prefill };
    mergeWithSmartPrefill(current, prefill);

    assert.deepStrictEqual(prefill, original);
  });

  it("fills whitespace-only string field", () => {
    const current = { someField: "   " };
    const prefill = { someField: "filled" };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.strictEqual(result.data["someField"], "filled");
  });

  it("returns appliedKeys and preservedKeys accurately", () => {
    const current = {
      field1: "",
      field2: "existing",
      // field3 is absent (undefined)
    };
    const prefill = {
      field1: "value1",
      field2: "value2",
      field3: "value3",
      field4: "value4",
    };
    const result = mergeWithSmartPrefill(current, prefill);

    assert.ok(result.appliedKeys.includes("field1"));
    assert.ok(result.appliedKeys.includes("field3"));
    assert.ok(result.appliedKeys.includes("field4"));
    assert.ok(result.preservedKeys.includes("field2"));
    assert.ok(!result.appliedKeys.includes("field2"));
  });
});

describe("constants", () => {
  it("DEFAULT_RUNTIME_TEMPLATE_PLACE is TP. Hồ Chí Minh", () => {
    assert.strictEqual(DEFAULT_RUNTIME_TEMPLATE_PLACE, "TP. Hồ Chí Minh");
  });

  it("DEFAULT_RUNTIME_TEMPLATE_TIMEZONE is Asia/Ho_Chi_Minh", () => {
    assert.strictEqual(DEFAULT_RUNTIME_TEMPLATE_TIMEZONE, "Asia/Ho_Chi_Minh");
  });
});
