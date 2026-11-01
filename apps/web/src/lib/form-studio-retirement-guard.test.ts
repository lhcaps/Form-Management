import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const webSrcDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(webSrcDir, "..", "..", "..");

function readWebSource(relativePath: string): string {
  return readFileSync(join(webSrcDir, relativePath), "utf8");
}

function readRepoSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("customer-facing Form Studio retirement guard", () => {
  it("removes customer-facing Form Studio pages and navigation", () => {
    assert.equal(
      existsSync(join(webSrcDir, "app/admin/(shared)/form-studio/page.tsx")),
      false,
    );
    assert.equal(
      existsSync(join(webSrcDir, "app/admin/(shared)/form-studio/permissions/page.tsx")),
      false,
    );

    const navSource = readWebSource("components/layout/nav-items.tsx");
    assert.doesNotMatch(navSource, /\/admin\/form-studio/);
    assert.doesNotMatch(navSource, /Form Studio/);
  });

  it("keeps runtime contract resolution and generated save endpoints", () => {
    const runtimeWorkspace = readWebSource("components/documents/template-preview-workspace.tsx");
    assert.match(runtimeWorkspace, /getRuntimeFormContract/);

    const runtimeClient = readWebSource("lib/contract-platform-api.ts");
    assert.match(runtimeClient, /\/forms\/runtime/);
    assert.doesNotMatch(runtimeClient, /\/admin\/form-templates/);
    assert.doesNotMatch(runtimeClient, /\/admin\/form-drafts/);
    assert.doesNotMatch(runtimeClient, /\/admin\/form-reviews/);
    assert.doesNotMatch(runtimeClient, /\/admin\/form-permissions/);

    const compatibilityClient = readWebSource("lib/form-studio-api.ts");
    assert.match(compatibilityClient, /contract-platform-api/);
    assert.doesNotMatch(compatibilityClient, /\/admin\/form-/);

    const contractSaveController = readRepoSource(
      "apps/api/src/modules/contract-platform/contract-form-inputs.controller.ts",
    );
    assert.match(contractSaveController, /documents\/generated/);
    assert.match(contractSaveController, /contract-form-inputs/);

    const legacySaveController = readRepoSource(
      "apps/api/src/modules/documents/document-renderer.controller.ts",
    );
    assert.match(legacySaveController, /generated\/:documentId\/form-inputs/);

    const bm031DirectController = readRepoSource(
      "apps/api/src/modules/bm031-direct/bm031-direct.controller.ts",
    );
    assert.match(bm031DirectController, /bm031-direct-form-inputs/);
  });
});
