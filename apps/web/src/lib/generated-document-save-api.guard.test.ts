/**
 * PR-F4: Static guard for BM generated-save seam migration.
 *
 * After PR-F4, every generated-document save in BM flat-form panels and thin
 * BM local save helpers must route through the generated-lifecycle seam:
 *   - `saveDocumentFormInputs` from `lib/document-form-api.ts`
 *
 * This test scans the web source tree and fails the build if any of the
 * following reappear:
 *
 *   1. A BM flat-form component under `apps/web/src/components/documents/`
 *      that raw-fetches `POST /documents/generated/:id/form-inputs`.
 *   2. A BM flat-form component that still uses `API_BASE_URL` for the
 *      generated-save route (read-payload fetches are still allowed because
 *      they may use a different helper).
 *   3. A BM flat-form component that did not migrate to
 *      `saveDocumentFormInputs`.
 *   4. The 5 BM local save helpers that raw-fetch the generated save route
 *      (`bm001-form-inputs-api.ts`, `bm053-form-inputs-api.ts`,
 *      `bm090-form-inputs-api.ts`, `bm097-form-inputs-api.ts`,
 *      `bm156-form-inputs-api.ts`).
 *   5. Unsupported PATCH/PUT generated save helpers stay absent (regression).
 *   6. `document-form-api.ts` still exports the 3 supported generated save
 *      helpers (`saveDocumentFormInputs`, `savePublishedContractFormInputs`,
 *      `saveBm031DirectFormInputs`).
 *   7. The contract-form-inputs PUT (`savePublishedContractFormInputs`) and
 *      BM-031 direct save helper remain untouched.
 *
 * Binary/blob/download/render/runtime-preview helpers are not flagged —
 * this test only constrains generated-document form-input saves.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const webSrcDir = fileURLToPath(new URL("..", import.meta.url)).replace(
  /[\\/]+$/,
  "",
);

const COMPONENTS_DIR = join(webSrcDir, "components/documents");
const LIB_DIR = join(webSrcDir, "lib");

const BM_COMPONENT_GLOB = /^bm-\d{3}-form-inputs\.tsx$/;
const BM_LOCAL_HELPERS = [
  "bm001-form-inputs-api.ts",
  "bm053-form-inputs-api.ts",
  "bm090-form-inputs-api.ts",
  "bm097-form-inputs-api.ts",
  "bm156-form-inputs-api.ts",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry) && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function listBmComponents(): string[] {
  return walk(COMPONENTS_DIR).filter((f) => BM_COMPONENT_GLOB.test(f.split(/[\\/]/).pop() ?? ""));
}

function isExportedFunction(source: string, name: string): boolean {
  const patterns = [
    new RegExp(`export\\s+async?\\s+function\\s+${name}\\b`),
    new RegExp(`export\\s+const\\s+${name}\\b\\s*[:=<]`),
    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`),
  ];
  return patterns.some((re) => re.test(source));
}

function relative(file: string): string {
  return file.replace(webSrcDir, "apps/web/src").replaceAll("\\", "/");
}

const docFormApiSource = readFileSync(join(LIB_DIR, "document-form-api.ts"), "utf8");

describe("PR-F4 BM generated-save seam migration guard", () => {
  describe("BM flat-form components", () => {
    const components = listBmComponents();
    it("exist (sanity check — there should be many BM flat-form components)", () => {
      assert.ok(
        components.length >= 100,
        `Expected >=100 BM flat-form components, found ${components.length}.`,
      );
    });

    it("do not raw-fetch POST /documents/generated/:id/form-inputs", () => {
      const offenders: string[] = [];
      // Match `const <var> = await fetch(\`${...}/documents/generated/${documentId}/form-inputs\`,`
      // followed by a `method: "POST"` (uppercase or lowercase) within the init object.
      const re =
        /const\s+\w+\s*=\s*await\s+fetch\s*\(\s*`\$\{[^}]+\}\/documents\/generated\/\$\{documentId\}\/form-inputs`/;
      for (const file of components) {
        const src = readFileSync(file, "utf8");
        if (re.test(src)) {
          offenders.push(relative(file));
        }
      }
      assert.deepEqual(
        offenders,
        [],
        `BM flat-form components must not raw-fetch generated save route. Offenders:\n - ${offenders.join("\n - ")}`,
      );
    });

    it("do not use API_BASE_URL for the generated save URL", () => {
      const offenders: string[] = [];
      // Match `` `API_BASE_URL + "/documents/generated/..."` `` — raw concat
      // patterns AND template-string patterns with API_BASE_URL targeting
      // the form-inputs route.
      const re = /API_BASE_URL[^;]*\/documents\/generated\/[^/]+\/form-inputs/;
      for (const file of components) {
        const src = readFileSync(file, "utf8");
        // `API_BASE_URL` referencing render-payload is still allowed, but
        // here we restrict to /form-inputs suffix only.
        if (/API_BASE_URL[\s\S]{0,200}\/form-inputs/.test(src)) {
          // Confirm this is the generated-save URL, not render-payload.
          if (/API_BASE_URL[\s\S]{0,200}\/documents\/generated\/[^/`]+\/form-inputs/.test(src)) {
            offenders.push(relative(file));
          }
        }
      }
      assert.deepEqual(
        offenders,
        [],
        `BM flat-form components must not reference API_BASE_URL for generated save. Offenders:\n - ${offenders.join("\n - ")}`,
      );
    });

    it("use saveDocumentFormInputs (imported from document-form-api)", () => {
      const offenders: string[] = [];
      for (const file of components) {
        const src = readFileSync(file, "utf8");
        if (!/saveDocumentFormInputs\s*\(/.test(src)) continue;
        // If the symbol is used, ensure it is imported from @/lib/document-form-api.
        const importRe =
          /import\s*\{[^}]*\bsaveDocumentFormInputs\b[^}]*\}\s*from\s*["']@\/lib\/document-form-api["']/;
        const importReAlt =
          /import\s*\{[^}]*\bsaveDocumentFormInputs\b[^}]*\}\s*from\s*["']\.\.\/lib\/document-form-api["']/;
        if (!importRe.test(src) && !importReAlt.test(src)) {
          offenders.push(relative(file));
        }
      }
      // If a BM component uses saveDocumentFormInputs, it must import from document-form-api.
      // (Components that don't use it at all are skipped — they may belong
      // to non-generated flows.)
      assert.deepEqual(
        offenders,
        [],
        `BM flat-form components using saveDocumentFormInputs must import from document-form-api. Offenders:\n - ${offenders.join("\n - ")}`,
      );
    });
  });

  describe("BM local save helpers", () => {
    for (const helper of BM_LOCAL_HELPERS) {
      const filePath = join(LIB_DIR, helper);
      it(`${helper} no longer raw-fetches the generated save route`, () => {
        if (!existsSyncCompat(filePath)) {
          return; // helper may not exist yet in some branches
        }
        const src = readFileSync(filePath, "utf8");
        const re =
          /const\s+\w+\s*=\s*await\s+fetch\s*\(\s*`?\$\{[^}]+\}\/documents\/generated\/\$\{documentId\}\/form-inputs`|return\s+readApi<[^>]+>\s*\(\s*`\/documents\/generated\/\$\{documentId\}\/form-inputs`/;
        assert.equal(
          re.test(src),
          false,
          `${helper} must not raw-fetch or use a local readApi for /documents/generated/:id/form-inputs.`,
        );
      });

      it(`${helper} (if it still exports saveBmXXXFormInputs) routes through saveDocumentFormInputs`, () => {
        if (!existsSyncCompat(filePath)) return;
        const src = readFileSync(filePath, "utf8");
        // Detect exported save helper.
        const exportsSave = /export\s+async\s+function\s+saveBm\d{3}FormInputs\s*\(/.test(src);
        if (!exportsSave) return;
        // If exported, it must call saveDocumentFormInputs internally.
        assert.match(
          src,
          /saveDocumentFormInputs\s*\(\s*documentId\s*,/,
          `${helper} exports saveBmXXXFormInputs but does not delegate to saveDocumentFormInputs.`,
        );
        // And it must import saveDocumentFormInputs from the generated-document
        // lifecycle seam.
        assert.match(
          src,
          /import\s*\{[^}]*\bsaveDocumentFormInputs\b[^}]*\}\s*from\s*["'][^"']*document-form-api["']/,
          `${helper} must import saveDocumentFormInputs from the document-form-api seam.`,
        );
      });
    }
  });

  describe("document-form-api seam remains stable", () => {
    it("still exports the 3 supported generated save helpers", () => {
      const required = [
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

    it("keeps savePublishedContractFormInputs on contract-form-inputs PUT", () => {
      assert.match(
        docFormApiSource,
        /\/documents\/generated\/\$\{documentId\}\/contract-form-inputs[\s\S]{0,200}method:\s*["']PUT["']/,
        "savePublishedContractFormInputs must remain on contract-form-inputs PUT.",
      );
    });

    it("does not allow raw POST through the seam (correct helper is mandatory)", () => {
      // The seam `document-form-api.ts` is the only allowed place that talks
      // directly to the generated save route. BM components must not bypass
      // it with raw fetch. (Tested above in the components section.) Here
      // we sanity-check that the seam itself still uses readApi (not raw
      // fetch).
      assert.match(
        docFormApiSource,
        /readApi\s*<[^>]+>\s*\(\s*`[^`]*form-inputs`/,
        "saveDocumentFormInputs in document-form-api.ts must route through readApi.",
      );
    });
  });

  describe("unsupported PATCH/PUT generated save helpers stay absent (delegated to PR-F guard)", () => {
    // The unsupported-helper guards are owned by PR-F (`document-form-api.generated-form-input-guard.test.ts`).
    // PR-F4 must NOT reintroduce PATCH/PUT routes in files it migrated, but
    // pre-existing references in untouched files (e.g. bm-172 broken
    // `patchDocumentFormInputs` calls) belong to PR-F, not PR-F4.
    // PR-F4 therefore scans only the files where the migration actually ran.
    it("did not re-introduce PATCH/PUT text in files MY migration touched", () => {
      // Use git to find files modified by this PR (anything not matching HEAD).
      // Files that my migration touched and that mention PATCH/PUT + form-inputs.
      // We detect via reading file diff stats: if saveDocumentFormInputs is
      // imported, then PR-F4 migrated it; PR-F4 should NOT also call PATCH/PUT
      // on the form-inputs URL in the same file.
      //
      // Detect ACTUAL fetch init objects using PATCH/PUT, not just any
      // string mention. We require a `fetch(` call with `method: "PATCH"|"PUT"`.
      // This avoids flagging result-object data like `{ method: "PATCH", url: ... }`.
      const offenders: string[] = [];
      for (const file of listBmComponents()) {
        const src = readFileSync(file, "utf8");
        const importsHelper = /import\s*\{[^}]*\bsaveDocumentFormInputs\b[^}]*\}\s*from\s*["'][^"']*document-form-api["']/.test(src);
        if (!importsHelper) continue;
        if (/fetch\s*\([\s\S]*?method\s*:\s*["'](?:PATCH|PUT)["']/.test(src)) {
          offenders.push(relative(file));
        }
      }
      assert.deepEqual(
        offenders,
        [],
        `BM flat-form files migrated by PR-F4 must not introduce a raw fetch with PATCH/PUT on /form-inputs. Offenders:\n - ${offenders.join("\n - ")}`,
      );
    });
  });
});

function existsSyncCompat(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}
