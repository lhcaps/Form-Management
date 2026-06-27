import assert from "node:assert/strict";
import test from "node:test";
import { adaptV1Contract, buildRenderPayload } from "../src/index.js";

test("v1 adapter preserves binding semantics and payload values", () => {
  const adapted = adaptV1Contract({
    schemaVersion: "1.0",
    sourceId: "BM-001__test",
    templateCode: "BM-001",
    templateTitle: "Biên bản tiếp nhận",
    documentKind: "form",
    status: "locked",
    extractionSource: { sha256: "template-sha" },
    docxSlots: [
      {
        slotId: "receiver.fullName",
        required: true,
        reviewRequired: false,
        label: "Họ tên người tiếp nhận",
      },
    ],
    canonicalFields: [
      {
        path: "receiver.fullName",
        type: "string",
        source: "manual",
        uiComponent: "text",
        section: "Người tiếp nhận",
        required: true,
      },
    ],
    renderBindings: [
      {
        slotId: "receiver.fullName",
        from: "receiver.fullName",
        transform: "identity",
        fallback: "",
      },
    ],
  });

  const payload = buildRenderPayload(adapted, {
    receiver: { fullName: "Nguyễn Văn A" },
  });

  assert.equal(adapted.schemaVersion, "2.0");
  assert.equal(adapted.templateCode, "BM-001");
  assert.equal(adapted.fields[0]?.key, "receiver.fullName");
  assert.deepEqual(payload, { receiver: { fullName: "Nguyễn Văn A" } });
});

test("v1 adapter uses canonical field labels before docx slot labels", () => {
  const adapted = adaptV1Contract({
    schemaVersion: "1.0",
    sourceId: "BM-999__test",
    templateCode: "BM-999",
    templateTitle: "Synthetic label contract",
    documentKind: "form",
    status: "locked",
    extractionSource: { sha256: "template-sha" },
    docxSlots: [
      {
        slotId: "person.fullName",
        required: true,
        reviewRequired: false,
        label: "fullName",
      },
    ],
    canonicalFields: [
      {
        path: "person.fullName",
        type: "string",
        label: "Họ tên",
        source: "manual",
        uiComponent: "text",
        section: "Người tham gia",
        required: true,
      },
    ],
    renderBindings: [
      {
        slotId: "person.fullName",
        from: "person.fullName",
        transform: "identity",
        fallback: "",
      },
    ],
  });

  assert.equal(
    adapted.fields.find((field) => field.key === "person.fullName")?.label,
    "Họ tên",
  );
});
