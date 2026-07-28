import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const sourcePath = resolve(
  "apps/web/src/components/documents/bm-213-form-inputs.tsx",
);

test("BM-213 uses a bespoke form aligned with its semantic DOCX contract", () => {
  const source = readFileSync(sourcePath, "utf8");

  assert.doesNotMatch(source, /GenericTemplateFormInputsPanel/u);
  assert.match(source, /BmFormSection/u);
  assert.match(source, /getDocumentRenderPayload/u);
  assert.match(source, /saveDocumentFormInputs/u);

  for (const field of [
    "fullName",
    "identityIssueLine",
    "contextLine",
    "article1Line",
    "resultDeadlineLine",
    "article2Line",
    "investigationAuthorityLine",
    "otherRecipientsLine",
    "signerName",
  ]) {
    assert.match(source, new RegExp(`\\b${field}\\b`, "u"));
  }
});
