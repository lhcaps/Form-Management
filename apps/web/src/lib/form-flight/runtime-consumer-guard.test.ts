import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const formFlightDir = fileURLToPath(new URL(".", import.meta.url));
const webSrcDir = join(formFlightDir, "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(webSrcDir, relativePath), "utf8");
}

describe("runtime-authoritative Form Flight consumer guard", () => {
  it("keeps TemplatePreviewWorkspace on guarded Form Flight helpers", () => {
    const source = readSource("components/documents/template-preview-workspace.tsx");

    assert.doesNotMatch(
      source,
      /getFormFlightProfile\s*\(/,
      "runtime workspace must not use raw Form Flight registry profile as authority",
    );
    assert.match(
      source,
      /gateRuntimePreview/,
      "runtime workspace should use guarded Form Flight helper when consulting Form Flight",
    );
    assert.doesNotMatch(
      source,
      /from\s+["']@\/components\/documents\/generated-document-workspace["']/,
      "runtime workspace must not import generated document workspace",
    );
    assert.doesNotMatch(
      source,
      /from\s+["']@\/components\/documents\/generated-form-panel-selector["']/,
      "runtime workspace must not import generated document selector",
    );
    assert.doesNotMatch(
      source,
      /from\s+["']@\/components\/documents\/published-contract-form-inputs["']/,
      "runtime workspace must not import generated document panels",
    );
  });

  it("keeps Form Flight adapters behind isRuntimeReadyProfile", () => {
    const runtimeAdapter = readSource("lib/form-flight/adapters/template-runtime-adapter.ts");
    const generatedAdapter = readSource("lib/form-flight/adapters/generated-document-adapter.ts");

    for (const source of [runtimeAdapter, generatedAdapter]) {
      assert.match(source, /isRuntimeReadyProfile/);
      assert.match(source, /getFormFlightProfile/);
    }
  });
});
