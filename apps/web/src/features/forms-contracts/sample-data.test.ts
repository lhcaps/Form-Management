import { describe, it } from "node:test";
import assert from "node:assert";
import {
  mergeWithSampleData,
  formatDemoVietnameseLegalDate,
  formatDemoVietnamesePlaceDate,
  getSampleData,
  generateSampleFromFields,
} from "./sample-data";

describe("mergeWithSampleData", () => {
  it("fills empty undefined field with sample value", () => {
    const existing = { name: undefined };
    const sample = { name: "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Nguyễn Văn A");
  });

  it("fills empty null field with sample value", () => {
    const existing = { name: null };
    const sample = { name: "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Nguyễn Văn A");
  });

  it("fills empty string field with sample value", () => {
    const existing = { name: "" };
    const sample = { name: "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Nguyễn Văn A");
  });

  it("fills whitespace-only string field with sample value", () => {
    const existing = { name: "   " };
    const sample = { name: "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Nguyễn Văn A");
  });

  it("preserves non-empty user value", () => {
    const existing = { name: "Trần Văn B" };
    const sample = { name: "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Trần Văn B");
  });

  it("preserves 0 as legitimate user value", () => {
    const existing = { count: 0 };
    const sample = { count: 42 };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.count, 0);
  });

  it("preserves false as legitimate user value", () => {
    const existing = { active: false };
    const sample = { active: true };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.active, false);
  });

  it("fills only missing fields when sample has more entries", () => {
    const existing = { name: "Trần Văn B", age: undefined };
    const sample = { name: "Nguyễn Văn A", age: 30 };
    const result = mergeWithSampleData(existing, sample);
    assert.equal(result.name, "Trần Văn B");
    assert.equal(result.age, 30);
  });

  it("fills nested contract field paths with sample values", () => {
    const existing = { document: { issuePlaceDateLine: "" } };
    const sample = {
      "document.issuePlaceDateLine":
        "TP. Hồ Chí Minh, ngày 30 tháng 6 năm 2026",
    };
    const result = mergeWithSampleData(existing, sample);
    assert.deepEqual(result.document, {
      issuePlaceDateLine: "TP. Hồ Chí Minh, ngày 30 tháng 6 năm 2026",
    });
  });

  it("preserves non-empty user values at nested contract field paths", () => {
    const existing = { receiver: { fullName: "Kiểm sát viên đã nhập" } };
    const sample = { "receiver.fullName": "Nguyễn Văn A" };
    const result = mergeWithSampleData(existing, sample);
    assert.deepEqual(result.receiver, { fullName: "Kiểm sát viên đã nhập" });
  });

  it("does not mutate the original existing object", () => {
    const existing: Record<string, unknown> = { name: "" };
    const sample = { name: "Nguyễn Văn A" };
    mergeWithSampleData(existing, sample);
    assert.equal(existing.name, "");
  });
});

describe("formatDemoVietnameseLegalDate", () => {
  it("formats date as Vietnamese legal date text", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatDemoVietnameseLegalDate(date),
      "ngày 03 tháng 07 năm 2026",
    );
  });

  it("pads single-digit day and month", () => {
    const date = new Date("2026-01-05T00:00:00.000Z");
    assert.strictEqual(
      formatDemoVietnameseLegalDate(date),
      "ngày 05 tháng 01 năm 2026",
    );
  });
});

describe("formatDemoVietnamesePlaceDate", () => {
  it("formats with place prefix", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatDemoVietnamesePlaceDate(date, "TP. Hồ Chí Minh"),
      "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026",
    );
  });

  it("formats without place", () => {
    const date = new Date("2026-07-03T00:00:00.000Z");
    assert.strictEqual(
      formatDemoVietnamesePlaceDate(date),
      "ngày 03 tháng 07 năm 2026",
    );
  });
});

describe("generateSampleFromFields — demo safety guards", () => {
  it("does NOT fill ngày sinh via generic ngày heuristic", () => {
    const fields = [{ key: "accused.birthDay", label: "Ngày sinh", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["accused.birthDay"], undefined);
  });

  it("does NOT fill năm sinh via generic năm heuristic", () => {
    const fields = [{ key: "accused.birthYear", label: "Năm sinh", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["accused.birthYear"], undefined);
  });

  it("does NOT fill tháng sinh via generic tháng heuristic", () => {
    const fields = [{ key: "accused.birthMonth", label: "Tháng sinh", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["accused.birthMonth"], undefined);
  });

  it("does NOT fill ngày bắt via generic ngày heuristic", () => {
    const fields = [{ key: "detentionArrest.detentionDate", label: "Ngày bắt", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["detentionArrest.detentionDate"], undefined);
  });

  it("does NOT fill ngày tạm giữ via generic ngày heuristic", () => {
    const fields = [{ key: "detentionArrest.detentionDate", label: "Ngày tạm giữ", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["detentionArrest.detentionDate"], undefined);
  });

  it("does NOT fill ngày phạm tội via generic ngày heuristic", () => {
    const fields = [{ key: "offense.dateOfOffense", label: "Ngày phạm tội", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["offense.dateOfOffense"], undefined);
  });

  it("does NOT fill ngày khởi tố via generic ngày heuristic", () => {
    const fields = [{ key: "prosecution.prosecutionDate", label: "Ngày khởi tố", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["prosecution.prosecutionDate"], undefined);
  });

  it("does NOT fill ngày cấp via generic ngày heuristic", () => {
    const fields = [{ key: "person.identityIssueDate", label: "ngày cấp", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssueDate"], undefined);
  });

  it("does NOT fill ngày tiếp nhận via generic ngày heuristic", () => {
    const fields = [{ key: "sourceReport.receivedDateLine", label: "Ngày tiếp nhận", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["sourceReport.receivedDateLine"], undefined);
  });

  it("does NOT fill từ ngày via generic ngày heuristic", () => {
    const fields = [{ key: "investigationExtension.fromDate", label: "Từ ngày", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["investigationExtension.fromDate"], undefined);
  });

  it("does NOT fill tội danh via generic ngày heuristic", () => {
    const fields = [{ key: "offense.legalArticle", label: "Tội danh", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["offense.legalArticle"], undefined);
  });

  // ── Identity issue date guards (label variants) ──────────────────────────────────

  it("does NOT fill ngày cấp CCCD via generic ngày heuristic", () => {
    const fields = [{ key: "person.identityIssuedDay", label: "Ngày cấp CCCD", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssuedDay"], undefined);
  });

  it("does NOT fill ngày cấp CMND via generic ngày heuristic", () => {
    const fields = [{ key: "person.identityIssuedDay", label: "Ngày cấp CMND", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssuedDay"], undefined);
  });

  it("does NOT fill Cấp ngày via generic label heuristic", () => {
    const fields = [{ key: "person.identityIssuedDay", label: "Cấp ngày", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssuedDay"], undefined);
  });

  it("does NOT fill Năm cấp CCCD via generic năm heuristic", () => {
    const fields = [{ key: "person.identityIssuedYear", label: "Năm cấp CCCD", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssuedYear"], undefined);
  });

  // ── Broad năm heuristic guards ────────────────────────────────────────────────

  it("does NOT fill Năm sinh via generic năm heuristic", () => {
    const fields = [{ key: "accused.birthYear", label: "Năm sinh", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["accused.birthYear"], undefined);
  });

  it("does NOT fill Năm tạm giữ via generic năm heuristic", () => {
    const fields = [{ key: "detentionArrest.detentionDate", label: "Năm tạm giữ", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["detentionArrest.detentionDate"], undefined);
  });

  it("does NOT fill Năm phạm tội via generic năm heuristic", () => {
    const fields = [{ key: "offense.dateOfOffense", label: "Năm phạm tội", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["offense.dateOfOffense"], undefined);
  });

  // ── Identity issue path guards (blocks even when label is generic) ──────────────

  it("does NOT fill informant.identityIssuedDay via generic fallback", () => {
    // Label is generic "Ngày" — must NOT be auto-filled via path guard
    const fields = [{ key: "informant.identityIssuedDay", label: "Ngày", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["informant.identityIssuedDay"], undefined);
  });

  it("does NOT fill reporter.identityIssueDateLine via generic fallback", () => {
    // Label is generic "Ngày" — must NOT be auto-filled via path guard
    const fields = [{ key: "reporter.identityIssueDateLine", label: "Ngày", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["reporter.identityIssueDateLine"], undefined);
  });

  it("does NOT fill person.identityIssueDateLine via generic fallback", () => {
    // Full date path — should be blocked by path guard
    const fields = [{ key: "person.identityIssueDateLine", label: "Ngày cấp", required: true }];
    const result = generateSampleFromFields(fields);
    assert.strictEqual(result["person.identityIssueDateLine"], undefined);
  });

  // ── Safe document metadata ──────────────────────────────────────────────────────

  it("fills safe ngày (document metadata) when not guarded", () => {
    const fields = [{ key: "document.ngayBan", label: "Ngày ban hành", required: true }];
    const result = generateSampleFromFields(fields);
    // "Ngày ban hành" matches label heuristic → demo place-date string
    assert.strictEqual(
      result["document.ngayBan"],
      "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    );
  });

  it("fills ngày with địa điểm, ngày as safe demo place-date string", () => {
    const fields = [{ key: "document.ngayBan", label: "Địa điểm, ngày lập văn bản", required: true }];
    const result = generateSampleFromFields(fields);
    // "Địa điểm, ngày lập văn bản" has "địa điểm" → demo place-date string
    assert.strictEqual(
      result["document.ngayBan"],
      "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    );
  });
});

describe("getSampleData — demo data separation", () => {
  it("BM-001 registry does NOT include hardcoded stale issuePlaceDateLine", () => {
    const result = getSampleData("BM-001");
    // The registry no longer forces a stale date — document.issuePlaceDateLine
    // is NOT in the BM-001 registry after cleanup
    assert.strictEqual(result["document.issuePlaceDateLine"], undefined);
  });

  it("BM-002 registry does NOT include hardcoded stale issueDate", () => {
    const result = getSampleData("BM-002");
    assert.strictEqual(result["document.issueDate"], undefined);
  });

  it("BM-003 registry does NOT include hardcoded stale issueDate", () => {
    const result = getSampleData("BM-003");
    assert.strictEqual(result["document.issueDate"], undefined);
  });

  it("returns demo informant data for known person fields", () => {
    const result = getSampleData("BM-001");
    // Informant person data is in BM-001 registry (demo data, not auto-filled)
    assert.strictEqual(result["informant.fullName"], "Trần Thị B");
    assert.strictEqual(result["informant.birthYear"], "1980");
  });
});
