import { describe, it } from "node:test";
import assert from "node:assert";
import { localizeSectionTitle } from "./form-section-labels";

describe("localizeSectionTitle", () => {
  it("maps known technical keys to Vietnamese", () => {
    assert.equal(localizeSectionTitle("document"), "Thông tin văn bản");
    assert.equal(localizeSectionTitle("receiver"), "Người tiếp nhận");
    assert.equal(localizeSectionTitle("informant"), "Người cung cấp tin");
    assert.equal(localizeSectionTitle("agency"), "Cơ quan ban hành");
    assert.equal(localizeSectionTitle("case"), "Thông tin vụ án");
    assert.equal(localizeSectionTitle("signature"), "Chữ ký");
    assert.equal(localizeSectionTitle("recipients"), "Nơi nhận");
    assert.equal(localizeSectionTitle("suspect"), "Bị can / Người liên quan");
    assert.equal(localizeSectionTitle("defendant"), "Bị can");
    assert.equal(localizeSectionTitle("victim"), "Bị hại");
    assert.equal(localizeSectionTitle("witness"), "Người làm chứng");
    assert.equal(localizeSectionTitle("decision"), "Nội dung quyết định");
    assert.equal(localizeSectionTitle("legalBasis"), "Căn cứ pháp lý");
    assert.equal(localizeSectionTitle("measure"), "Biện pháp áp dụng");
  });

  it("is case-insensitive", () => {
    assert.equal(localizeSectionTitle("DOCUMENT"), "Thông tin văn bản");
    assert.equal(localizeSectionTitle("Document"), "Thông tin văn bản");
    assert.equal(localizeSectionTitle("  Case  "), "Thông tin vụ án");
  });

  it("falls back to 'Thông tin bổ sung' for unknown keys", () => {
    assert.equal(localizeSectionTitle("unknown_section"), "Thông tin bổ sung");
    assert.equal(localizeSectionTitle(""), "Thông tin bổ sung");
    assert.equal(localizeSectionTitle("xyz"), "Thông tin bổ sung");
  });
});
