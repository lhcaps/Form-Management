import { describe, it } from "node:test";
import assert from "node:assert";
import { mergeWithSampleData } from "./sample-data";

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
