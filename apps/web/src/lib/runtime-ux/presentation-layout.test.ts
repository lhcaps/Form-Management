import { strict as assert } from "node:assert";
import test from "node:test";
import { resolveRuntimeUxPresentationSections } from "./presentation-layout";

const contract = {
  sections: [
    { id: "agency", title: "agency", description: undefined, order: 1 },
    { id: "document", title: "document", description: undefined, order: 2 },
  ],
  fields: [
    { key: "agency.parentName", sectionId: "agency", order: 1 },
    { key: "agency.name", sectionId: "agency", order: 2 },
    { key: "document.code", sectionId: "document", order: 1 },
  ],
};

test("presentation layout can order and regroup existing contract fields without changing keys", () => {
  const result = resolveRuntimeUxPresentationSections(contract, {
    sections: [],
    presentationSections: [
      {
        id: "document-workflow",
        title: "Thông tin văn bản",
        description: "Số và ngày văn bản.",
        fieldKeys: ["document.code"],
      },
      {
        id: "agency-workflow",
        title: "Cơ quan ban hành",
        description: "Cơ quan cấp trên và cơ quan ban hành.",
        fieldKeys: ["agency.parentName", "agency.name"],
      },
    ],
  });

  assert.equal(result.usesPresentationLayout, true);
  assert.deepEqual(
    result.sections.map((section) => section.id),
    ["document-workflow", "agency-workflow"],
  );
  assert.deepEqual(
    result.sections.flatMap((section) => section.fieldKeys),
    ["document.code", "agency.parentName", "agency.name"],
  );
});

test("invalid presentation layout falls back to contract sections without dropping fields", () => {
  const result = resolveRuntimeUxPresentationSections(contract, {
    sections: [],
    presentationSections: [
      {
        id: "invalid",
        title: "Không hợp lệ",
        fieldKeys: ["agency.parentName", "missing.key"],
      },
    ],
  });

  assert.equal(result.usesPresentationLayout, false);
  assert.deepEqual(
    result.sections.map((section) => section.id), ["agency", "document"]);
  assert.deepEqual(
    result.sections.flatMap((section) => section.fieldKeys),
    ["agency.parentName", "agency.name", "document.code"],
  );
});
