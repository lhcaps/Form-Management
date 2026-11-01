import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPS_WEB_DIR = join(__dirname, "..", "..");

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const runtimePreviewPath = join(
  APPS_WEB_DIR,
  "lib/runtime-template-preview.ts",
);
const templatePreviewPath = join(
  APPS_WEB_DIR,
  "components/documents/template-preview-workspace.tsx",
);

const runtimePreviewSource = stripComments(
  readFileSync(runtimePreviewPath, "utf8"),
);
const templatePreviewSource = stripComments(
  readFileSync(templatePreviewPath, "utf8"),
);

describe("runtime preview-session client contract guard", () => {
  it("guards the standalone preview-session response contract", () => {
    assert.match(runtimePreviewSource, /persisted\s*!==\s*false/);
    assert.match(runtimePreviewSource, /runtime_preview_/);
    assert.match(runtimePreviewSource, /docxDownloadUrl/);
    assert.match(runtimePreviewSource, /generatedDocumentId/);
    assert.match(runtimePreviewSource, /\/documents\//);
  });

  it("keeps the templates workspace out of generated-document persistence", () => {
    assert.doesNotMatch(templatePreviewSource, /generatedDocumentId/);
    assert.doesNotMatch(templatePreviewSource, /createGeneratedDocumentAdapter/);
    assert.doesNotMatch(templatePreviewSource, /saveDocumentFormInputs/);
    assert.doesNotMatch(templatePreviewSource, /\/documents\/generated/);
    assert.doesNotMatch(templatePreviewSource, /router\.push\([^)]*\/documents/);
    assert.doesNotMatch(templatePreviewSource, /window\.location/);
    assert.doesNotMatch(templatePreviewSource, /L\u1ecbch s\u1eed x\u1eed l\u00fd/);
  });
});
