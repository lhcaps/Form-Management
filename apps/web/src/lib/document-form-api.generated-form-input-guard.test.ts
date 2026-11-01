/**
 * PR-F: Static guard for unsupported generated form-input helpers.
 *
 * Backend supports exactly three generated save methods (see
 * GeneratedInputSaveOrchestrator + the supported legacy POST route).
 * Frontend must not export or call PATCH/PUT on the generated form-inputs
 * route family. This test scans the web source tree and fails the build
 * if any of the following reappear:
 *
 *   1. Exported helper named `patchDocumentFormInputs`
 *   2. Exported helper named `replaceDocumentFormInputs`
 *   3. Exported helper named `patchBm031DirectFormInputs`
 *   4. Any frontend source (apps/web/src/**) that calls a PATCH or PUT
 *      against `/documents/generated/:id/form-inputs`
 *   5. Any frontend source that calls a PATCH against
 *      `/documents/generated/:id/bm031-direct-form-inputs`
 *
 * The test also asserts the supported helpers remain exported and that
 * `form-studio-api.ts` is a compatibility re-export only.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const webSrcDir = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]+$/, "");

const UNSUPPORTED_HELPER_NAMES = [
  "patchDocumentFormInputs",
  "replaceDocumentFormInputs",
  "patchBm031DirectFormInputs",
] as const;

const UNSUPPORTED_PATH_PATTERNS: ReadonlyArray<{
  test: RegExp;
  description: string;
}> = [
  {
    test: /\/documents\/generated\/\$\{[^}]+\}\/form-inputs["'][^}]*method:\s*["'](?:PATCH|PUT)["']/,
    description:
      "PATCH/PUT on /documents/generated/:id/form-inputs in template-string form",
  },
  {
    test: /method:\s*["'](?:PATCH|PUT)["'][^}]*\/documents\/generated\/\$\{[^}]+\}\/form-inputs/,
    description:
      "PATCH/PUT in template-string form targeting /documents/generated/:id/form-inputs",
  },
  {
    test: /\/documents\/generated\/\$\{[^}]+\}\/bm031-direct-form-inputs["'][^}]*method:\s*["']PATCH["']/,
    description:
      "PATCH on /documents/generated/:id/bm031-direct-form-inputs in template-string form",
  },
  {
    test: /method:\s*["']PATCH["'][^}]*\/documents\/generated\/\$\{[^}]+\}\/bm031-direct-form-inputs/,
    description:
      "PATCH in template-string form targeting /documents/generated/:id/bm031-direct-form-inputs",
  },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (
      /\.(ts|tsx|js|mjs|cjs)$/.test(entry) &&
      !entry.endsWith(".d.ts")
    ) {
      out.push(full);
    }
  }
  return out;
}

const SOURCE_FILES = walk(join(webSrcDir));

const docFormApiSource = readFileSync(
  join(webSrcDir, "lib/document-form-api.ts"),
  "utf8",
);

const formStudioApiSource = readFileSync(
  join(webSrcDir, "lib/form-studio-api.ts"),
  "utf8",
);

function readRelative(absolutePath: string): string {
  return readFileSync(absolutePath, "utf8");
}

function isExportedFunction(source: string, name: string): boolean {
  // Match `export function NAME(<...>(`, `export async function NAME<...>(`,
  // and `export const NAME =` / `export const NAME: ... =` (incl. async arrow).
  // Also accept `export { NAME }` re-exports. We are permissive about
  // parameter types so that generic helpers (e.g. `NAME<T = ...>(`) match.
  const patterns = [
    new RegExp(`export\\s+async?\\s+function\\s+${name}\\b`),
    new RegExp(`export\\s+const\\s+${name}\\b\\s*[:=<]`),
    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`),
  ];
  return patterns.some((re) => re.test(source));
}

describe("PR-F unsupported generated form-input helper guard", () => {
  it("does not export any of the 3 unsupported helpers from document-form-api", () => {
    for (const name of UNSUPPORTED_HELPER_NAMES) {
      assert.equal(
        isExportedFunction(docFormApiSource, name),
        false,
        `document-form-api.ts must not export ${name} — backend does not support this method.`,
      );
    }
  });

  it("keeps the supported generated save helpers exported", () => {
    const required = [
      "getDocumentRenderPayload",
      "saveDocumentFormInputs",
      "savePublishedContractFormInputs",
      "saveBm031DirectFormInputs",
    ];
    for (const name of required) {
      assert.equal(
        isExportedFunction(docFormApiSource, name),
        true,
        `document-form-api.ts must keep exporting supported helper ${name}.`,
      );
    }
  });

  it("keeps the supported PATCH/PUT on different (non-generated-form-inputs) routes", () => {
    // The contract-form-inputs PUT is the supported `savePublishedContractFormInputs` route.
    assert.match(
      docFormApiSource,
      /\/documents\/generated\/\$\{documentId\}\/contract-form-inputs[\s\S]{0,80}method:\s*["']PUT["']/,
      "contract-form-inputs PUT must remain (it is the supported published-contract save).",
    );
  });

  it("scans every web source file for unsupported PATCH/PUT form-inputs route calls", () => {
    const offenders: Array<{ file: string; description: string }> = [];

    for (const file of SOURCE_FILES) {
      // Skip the guard test itself and document-form-api (which is the seam)
      if (file.endsWith("document-form-api.generated-form-input-guard.test.ts")) continue;
      if (file.endsWith("lib/document-form-api.ts")) continue;

      const src = readRelative(file);

      for (const { test, description } of UNSUPPORTED_PATH_PATTERNS) {
        if (test.test(src)) {
          offenders.push({
            file: file.replace(webSrcDir, "apps/web/src").replaceAll("\\", "/"),
            description,
          });
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Frontend must not construct PATCH/PUT generated form-input routes. Offenders:\n${offenders
        .map((o) => ` - ${o.file}: ${o.description}`)
        .join("\n")}`,
    );
  });

  it("scans every web source file for unsupported helper imports / calls", () => {
    const offenders: string[] = [];

    for (const file of SOURCE_FILES) {
      if (file.endsWith("document-form-api.generated-form-input-guard.test.ts")) continue;

      const src = readRelative(file);
      const rel = file.replace(webSrcDir, "apps/web/src").replaceAll("\\", "/");

      for (const name of UNSUPPORTED_HELPER_NAMES) {
        // Match import statements and call sites referencing the unsupported helper.
        // - Named import: `import { NAME }` / `import { NAME, ... }`
        // - Standalone call: `NAME(`
        const safeSource = src.split('"').join("'");
        const importRe = new RegExp(
          `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from|\\b${name}\\s*\\(`,
        );
        if (importRe.test(safeSource)) {
          offenders.push(`${rel}: references unsupported helper ${name}`);
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Frontend must not import or call unsupported helpers. Offenders:\n${offenders.join("\n")}`,
    );
  });

  it("keeps form-studio-api.ts as a compatibility re-export only (no authoring helpers)", () => {
    // PR-B reduced form-studio-api.ts to a thin re-export shim that points
    // at the new contract-platform-api client. No authoring helpers (save
    // / patch / put for any form-inputs route) may live there.
    assert.match(
      formStudioApiSource,
      /contract-platform-api/,
      "form-studio-api.ts must re-export from contract-platform-api.",
    );

    for (const name of UNSUPPORTED_HELPER_NAMES) {
      assert.doesNotMatch(
        formStudioApiSource,
        new RegExp(`\\b${name}\\b`),
        `form-studio-api.ts must not reference unsupported helper ${name}.`,
      );
    }

    for (const path of [
      "/admin/form-templates",
      "/admin/form-drafts",
      "/admin/form-reviews",
      "/admin/form-permissions",
    ]) {
      assert.doesNotMatch(
        formStudioApiSource,
        new RegExp(path.replace(/\//g, "\\/")),
        `form-studio-api.ts must not target retired admin route ${path}.`,
      );
    }
  });
});
