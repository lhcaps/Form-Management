import assert from "node:assert/strict";
import test from "node:test";

import { getFieldLabel } from "../src/field-labels.js";

test("getFieldLabel preserves reviewed contract labels", () => {
  assert.equal(getFieldLabel("person.fullName", "Họ và tên bị can"), "Họ và tên bị can");
});

test("getFieldLabel replaces generic or raw labels with reviewed path labels", () => {
  assert.equal(getFieldLabel("document.fullDocumentCode", "Ô trống"), "Số văn bản");
  assert.equal(getFieldLabel("signature.signMode", "signMode"), "Phương thức ký");
});

test("getFieldLabel falls back to a non-empty humanized label", () => {
  assert.equal(getFieldLabel("custom.longFieldName"), "Long Field Name");
});
