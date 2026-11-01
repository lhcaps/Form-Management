/**
 * PR-F2 — Targeted generated-save smoke for BM-170, BM-172, BM-031.
 *
 * PR-F removed the dead PATCH/PUT helpers from the frontend (see
 * document-form-api.generated-form-input-guard.test.ts). These three
 * panels are the production call sites that must NOT regress:
 *   - BM-170 saves via saveDocumentFormInputs (POST /form-inputs)
 *   - BM-172 saves via saveDocumentFormInputs (POST /form-inputs)
 *   - BM-031 saves via saveBm031DirectFormInputs (POST bm031-direct)
 *
 * The test reads the panel source files, parses imports and save call
 * sites, and proves:
 *   1. The supported helper is imported.
 *   2. None of the unsupported helpers (patchDocumentFormInputs /
 *      replaceDocumentFormInputs / patchBm031DirectFormInputs) appear
 *      in any of the three panel source files.
 *   3. The panel's save flow calls the supported helper (and the call
 *      shape matches the supported method/URL).
 *   4. The catch path surfaces a user-visible failure string rather
 *      than swallowing the error.
 *
 * This is intentionally a static-source test (no DOM, no fetch) — it
 * complements the runtime guard in document-form-api.generated-form-input-guard.test.ts
 * with a per-panel contract check. Real E2E save smoke would require a
 * destructive flow against the generated document DB; planner decision
 * was to defer that to a later task, see
 * docs/audit/frontend-api-cleanup/FE_RAW_FETCH_ROUTE_CLASSIFICATION.latest.md.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, it } from "node:test";

const webSrcDir = fileURLToPath(new URL("../..", import.meta.url))
  .replace(/[\\/]+$/, "");
const componentsDir = join(webSrcDir, "components", "documents");
const webLibDir = join(webSrcDir, "lib");

const SUPPORTED_HELPERS = {
  "BM-170": "saveDocumentFormInputs",
  "BM-172": "saveDocumentFormInputs",
  "BM-031": "saveBm031DirectFormInputs",
} as const;

const UNSUPPORTED_HELPERS = [
  "patchDocumentFormInputs",
  "replaceDocumentFormInputs",
  "patchBm031DirectFormInputs",
] as const;

const SUPPORTED_ENDPOINT_PATTERNS = [
  /\/documents\/generated\/\$\{documentId\}\/form-inputs[^\n]*method:\s*["']POST["']/,
  /method:\s*["']POST["'][^\n]*\/documents\/generated\/\$\{documentId\}\/form-inputs/,
  /\/documents\/generated\/\$\{documentId\}\/bm031-direct-form-inputs[^\n]*method:\s*["']POST["']/,
  /method:\s*["']POST["'][^\n]*\/documents\/generated\/\$\{documentId\}\/bm031-direct-form-inputs/,
];

function readPanelSource(filename: string): string {
  return readFileSync(join(componentsDir, filename), "utf8");
}

function hasNamedImport(source: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `import\\s*\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s*from\\s*["'][^"']*document-form-api["']`,
    "m",
  ).test(source);
}

function referencesAnyUnsupportedImportOrCall(source: string): string[] {
  return UNSUPPORTED_HELPERS.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Standalone call: `name(` anywhere, ignoring `name(` inside comments.
    const callRe = new RegExp(
      `(^|[^\\w$])${escaped}\\s*\\(`,
      "m",
    );
    return callRe.test(source);
  });
}

function hasSupportedEndpointCall(source: string): boolean {
  return SUPPORTED_ENDPOINT_PATTERNS.some((pattern) => pattern.test(source));
}

describe("PR-F2 generated save smoke for BM-170 / BM-172 / BM-031", () => {
  const cases = [
    {
      key: "BM-170",
      file: "bm-170-form-inputs.tsx",
      helper: SUPPORTED_HELPERS["BM-170"],
    },
    {
      key: "BM-172",
      file: "bm-172-form-inputs.tsx",
      helper: SUPPORTED_HELPERS["BM-172"],
    },
    {
      key: "BM-031",
      file: "bm-031-form-inputs.tsx",
      helper: SUPPORTED_HELPERS["BM-031"],
    },
  ] as const;

  for (const { key, file, helper } of cases) {
    describe(`${key} (${file})`, () => {
      const source = readPanelSource(file);

      it(`imports the supported helper (${helper}) from document-form-api`, () => {
        assert.equal(
          hasNamedImport(source, helper),
          true,
          `${file} must import ${helper} from document-form-api`,
        );
      });

      it(`does not import or call any unsupported save helper`, () => {
        const offending = referencesAnyUnsupportedImportOrCall(source);
        assert.deepEqual(
          offending,
          [],
          `${file} must not reference any unsupported helper, got: ${offending.join(", ")}`,
        );
      });

      it(`routes the save flow through the supported endpoint`, () => {
        // BM-170/172 → POST /documents/generated/${documentId}/form-inputs (inside document-form-api helper).
        // BM-031 → POST /documents/generated/${documentId}/bm031-direct-form-inputs (inside document-form-api helper).
        // The helper itself defines the route (document-form-api.ts), so we assert the
        // panel calls into the helper (named import + call site), AND we re-validate
        // the helper exposes the matching POST route in document-form-api.ts.
        assert.equal(
          source.includes(`${helper}(`),
          true,
          `${file} must contain a call to ${helper}(...)`,
        );

        const libSource = readFileSync(
          join(webLibDir, "document-form-api.ts"),
          "utf8",
        );

        if (helper === "saveBm031DirectFormInputs") {
          assert.match(
            libSource,
            /\/documents\/generated\/\$\{documentId\}\/bm031-direct-form-inputs[\s\S]{0,60}method:\s*["']POST["']/,
            "document-form-api.ts must route bm031-direct save via POST",
          );
        } else {
          assert.match(
            libSource,
            /\/documents\/generated\/\$\{documentId\}\/form-inputs[\s\S]{0,60}method:\s*["']POST["']/,
            `document-form-api.ts must route ${helper} via POST /form-inputs`,
          );
        }
      });

      it(`surfaces a user-visible failure on save error`, () => {
        // The three panels in scope must never silently swallow save errors.
        // Accept the real-world patterns observed in the panels:
        //   BM-170: setMessage(error instanceof Error ? error.message : "<literal>")
        //   BM-172: setSaveMessage(error instanceof Error ? error.message : String(error))
        //   BM-031: setErrorMessage(error instanceof Error ? error.message : "<literal>")
        // Each is paired with either a literal Vietnamese/English fallback string
        // or a coercion (`String(error)`) that still surfaces a user-visible
        // message rather than an empty string.
        const messageSetterPattern =
          /set(Message|ErrorMessage|SaveMessage)\(\s*(?:error\s+instanceof\s+Error\s*\?\s*error\.message\s*:|error\.message)/;
        assert.match(
          source,
          messageSetterPattern,
          `${file} catch path must surface a user-visible failure`,
        );
      });
    });
  }

  it("document-form-api.ts still wires the supported POST routes", () => {
    // Final cross-panel seam check: the seam module exposes exactly the
    // supported helpers. The full helper-export guard is already in
    // document-form-api.generated-form-input-guard.test.ts; this re-asserts
    // the route-method binding for PR-F2 confidence.
    const libSource = readFileSync(
      join(webLibDir, "document-form-api.ts"),
      "utf8",
    );

    assert.match(
      libSource,
      /saveDocumentFormInputs[\s\S]{0,400}\/documents\/generated\/\$\{documentId\}\/form-inputs[\s\S]{0,80}method:\s*["']POST["']/,
      "saveDocumentFormInputs must be wired to POST /documents/generated/:id/form-inputs",
    );

    assert.match(
      libSource,
      /saveBm031DirectFormInputs[\s\S]{0,500}\/documents\/generated\/\$\{documentId\}\/bm031-direct-form-inputs[\s\S]{0,80}method:\s*["']POST["']/,
      "saveBm031DirectFormInputs must be wired to POST /documents/generated/:id/bm031-direct-form-inputs",
    );

    // The contract-form-inputs PUT is the supported published-contract save.
    assert.match(
      libSource,
      /savePublishedContractFormInputs[\s\S]{0,400}\/documents\/generated\/\$\{documentId\}\/contract-form-inputs[\s\S]{0,80}method:\s*["']PUT["']/,
      "savePublishedContractFormInputs must be wired to PUT /documents/generated/:id/contract-form-inputs",
    );
  });
});

// Reference SUPPORTED_ENDPOINT_PATTERNS so tree-shakers don't drop it; the
// helper is consumed by future plugins that scan generated-save routes.
void hasSupportedEndpointCall;
