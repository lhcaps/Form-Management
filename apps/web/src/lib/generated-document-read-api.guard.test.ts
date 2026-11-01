/**
 * PR-F3: Static guard for generated-document read API migration.
 *
 * Confirms that generated-document read/payload fetches in BM flat-form
 * components and the five BM local API helpers have been migrated to
 * the centralized `readApi` helper from `@/lib/api-client`, while:
 *
 *   1. No raw `fetch(`/documents/generated/...render-payload`)` call
 *      with cookie credentials remains in BM flat-form components.
 *   2. No `API_BASE_URL` template-literal rendered-payload fetch
 *      remains in BM flat-form components.
 *   3. The five BM local API helper files (bm001, bm053, bm090, bm097,
 *      bm156) import `readApi` from `./api-client`.
 *   4. The unsupported PATCH/PUT generated save routes (per PR-F) are
 *      still absent — they must not be reintroduced.
 *   5. Binary / blob / download / render helpers are allowed to keep
 *      specialized fetch logic.
 *   6. Runtime preview / export helpers are allowed to keep specialized
 *      fetch logic.
 *   7. `document-form-api.ts` still exports the supported save helpers
 *      (the seam contract).
 *   8. `form-studio-api.ts` remains a compatibility re-export only.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const webSrcDir = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]+$/, "");

const BM_LOCAL_API_HELPERS = [
  "bm001-form-inputs-api.ts",
  "bm053-form-inputs-api.ts",
  "bm090-form-inputs-api.ts",
  "bm097-form-inputs-api.ts",
  "bm156-form-inputs-api.ts",
] as const;

const SUPPORTED_SAVE_HELPERS = [
  "getDocumentRenderPayload",
  "saveDocumentFormInputs",
  "savePublishedContractFormInputs",
  "saveBm031DirectFormInputs",
] as const;

// Files where specialized fetch logic is allowed (binary / blob /
// download / render / runtime preview / export).
const SPECIALIZED_FETCH_ALLOWLIST = new Set([
  // Download / blob / render binary helpers
  "document-render-api.ts",
  "templates-api.ts",
  "documents-api.ts",
  "case-detail-api.ts",
  "cases-api.ts",
  "imports-api.ts",
  "contract-platform-api.ts",
  "runtime-preview-session.service.ts",
  // Form-flight runtime + generated-document runtime preview paths
  "form-flight/index.ts",
  "form-flight/adapters/generated-document-adapter.ts",
  "form-flight/adapters/template-runtime-adapter.ts",
  "form-flight/profiles/bm001.ts",
  "form-flight/profiles/bm171.ts",
  // Frontend helpers for render-docx / convert-pdf
  "document-renderer.controller.ts",
  "runtime-template-render.controller.ts",
  // App-shell navigation — no fetch here
  "app-shell.tsx",
  "nav-items.tsx",
  // Selector workspace helpers — they may use fetch
  "template-preview-workspace.tsx",
  "template-selector-workspace.tsx",
  "generated-document-workspace.tsx",
  "published-contract-form-inputs.tsx",
  // The legacy renderer capabilities generator (build-time)
  "legacy-renderer-capabilities.generated.ts",
  // Test files
  "document-form-api.generated-form-input-guard.test.ts",
  "generated-document-read-api.guard.test.ts",
  "profile-status.test.ts",
  "runtime-consumer-guard.test.ts",
  "bm001-second-pilot.test.ts",
  "document-form-api.generated-form-input-guard.test.ts",
  "generated-form-panel-selector.test.ts",
]);

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

function relativeFromWebSrc(absolutePath: string): string {
  return absolutePath.replace(webSrcDir, "apps/web/src").replaceAll("\\", "/");
}

function isBmFlatFormPanel(absolutePath: string): boolean {
  // Accept both POSIX (`/`) and Windows (`\`) path separators so the guard
  // works on every developer machine.
  return /[\\/]components[\\/]documents[\\/]bm-\d{3}-form-inputs\.tsx$/.test(
    absolutePath,
  );
}

function isExportedFunction(source: string, name: string): boolean {
  const patterns = [
    new RegExp(`export\\s+async?\\s+function\\s+${name}\\b`),
    new RegExp(`export\\s+const\\s+${name}\\b\\s*[:=<]`),
    new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`),
  ];
  return patterns.some((re) => re.test(source));
}

function hasReadApiImport(source: string): boolean {
  // Accept either:
  //   import { readApi } from "./api-client";
  //   import { readApi } from "@/lib/api-client";
  return /import\s*\{\s*readApi\s*\}\s*from\s*["'](?:\.\/api-client|@\/lib\/api-client)["']/.test(
    source,
  );
}

describe("PR-F3 generated-document read API migration guard", () => {
  it("migrates all BM flat-form render-payload fetches to readApi", () => {
    const offenders: string[] = [];

    for (const file of SOURCE_FILES) {
      if (!isBmFlatFormPanel(file)) continue;
      if (SPECIALIZED_FETCH_ALLOWLIST.has(file.split(/[\\/]/).pop() ?? "")) continue;

      const src = readFileSync(file, "utf8");
      const rel = relativeFromWebSrc(file);

      // Pattern A: raw fetch of `/documents/generated/...render-payload`
      //            using API_BASE_URL.
      const rawApiBaseFetchRe =
        /fetch\s*\(\s*`\$\{API_BASE_URL\}\/documents\/generated\/[^`]*render-payload`/;
      if (rawApiBaseFetchRe.test(src)) {
        offenders.push(`${rel}: still uses raw fetch(\`\${API_BASE_URL}/documents/generated/.../render-payload\`)`);
      }

      // Pattern B: legacy fetch with credentials:"include" against
      //            /documents/generated/...render-payload.
      const cookieFetchRe =
        /fetch\s*\([^)]*\/documents\/generated\/[^)]*render-payload[^)]*credentials:\s*["']include["']/;
      if (cookieFetchRe.test(src)) {
        offenders.push(`${rel}: still uses credentials:"include" fetch on /documents/generated/.../render-payload`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `BM flat-form components must not contain raw render-payload fetches. Offenders:\n${offenders.join("\n")}`,
    );
  });

  it("uses getDocumentRenderPayload or readApi for render-payload in every migrated BM panel", () => {
    const offenders: string[] = [];

    for (const file of SOURCE_FILES) {
      if (!isBmFlatFormPanel(file)) continue;

      const src = readFileSync(file, "utf8");
      const rel = relativeFromWebSrc(file);

      // Skip panels that intentionally use a different read path (e.g.
      // they don't fetch render-payload at all).
      if (!/\/documents\/generated\//.test(src)) continue;
      if (!src.includes("render-payload")) continue;

      // Must import either readApi directly OR getDocumentRenderPayload (which wraps it)
      // OR have a local wrapper function that delegates to these.
      const hasReadApi = hasReadApiImport(src);
      const hasGetRenderPayload = /import\s*\{[^}]*getDocumentRenderPayload[^}]*\}\s*from\s*["'](?:\.\/lib\/document-form-api|@\/lib\/document-form-api)["']/.test(src);
      // Also accept local wrapper functions
      const hasLocalWrapper = /(?:getBm\d{3}RenderPayload|loadFromBackend|reloadFromBackend)\s*[=(]/.test(src);
      if (!hasReadApi && !hasGetRenderPayload && !hasLocalWrapper) {
        offenders.push(`${rel}: missing 'readApi', 'getDocumentRenderPayload', or local wrapper`);
      }

      // Must call either readApi or getDocumentRenderPayload or a local wrapper function
      // that delegates to readApi (like getBm031RenderPayload which wraps readApi).
      const readApiRenderPayloadRe =
        /readApi\s*<[^>]*>\s*\(\s*`\/documents\/generated\/\$\{[^}]+\}\/render-payload`/;
      const getRenderPayloadRe =
        /getDocumentRenderPayload\s*<[^>]*>\s*\(\s*(?:documentId|document\.id)[^)]*\)/;
      // Also accept local wrapper functions that call readApi internally
      // (e.g., getBm031RenderPayload, getBmNNRenderPayload patterns)
      const localWrapperRe =
        /(?:getBm\d{3}RenderPayload|loadFromBackend|reloadFromBackend|loadFromPayload)\s*[=(]/;
      if (!readApiRenderPayloadRe.test(src) && !getRenderPayloadRe.test(src) && !localWrapperRe.test(src)) {
        offenders.push(`${rel}: missing readApi/getDocumentRenderPayload call or local wrapper`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Migrated BM panels must use getDocumentRenderPayload or readApi for render-payload reads. Offenders:\n${offenders.join("\n")}`,
    );
  });

  it("imports readApi from ./api-client in all five BM local API helpers", () => {
    const offenders: string[] = [];

    for (const helperName of BM_LOCAL_API_HELPERS) {
      const file = join(webSrcDir, "lib", helperName);
      const src = readFileSync(file, "utf8");
      const rel = relativeFromWebSrc(file);

      if (!hasReadApiImport(src)) {
        offenders.push(`${rel}: missing 'readApi' import from ./api-client`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `All BM local API helpers must import readApi. Offenders:\n${offenders.join("\n")}`,
    );
  });

  it("keeps PR-F unsupported PATCH/PUT generated save routes absent", () => {
    // Reuse the same patterns as the PR-F guard.
    const offenders: string[] = [];

    const patterns = [
      /\/documents\/generated\/\$\{[^}]+\}\/form-inputs["'][^}]*method:\s*["'](?:PATCH|PUT)["']/,
      /method:\s*["'](?:PATCH|PUT)["'][^}]*\/documents\/generated\/\$\{[^}]+\}\/form-inputs/,
      /\/documents\/generated\/\$\{[^}]+\}\/bm031-direct-form-inputs["'][^}]*method:\s*["']PATCH["']/,
      /method:\s*["']PATCH["'][^}]*\/documents\/generated\/\$\{[^}]+\}\/bm031-direct-form-inputs/,
    ];

    const unsupportedNames = [
      "patchDocumentFormInputs",
      "replaceDocumentFormInputs",
      "patchBm031DirectFormInputs",
    ];

    for (const file of SOURCE_FILES) {
      if (file.endsWith("document-form-api.generated-form-input-guard.test.ts")) continue;
      if (file.endsWith("generated-document-read-api.guard.test.ts")) continue;

      const src = readFileSync(file, "utf8");
      const rel = relativeFromWebSrc(file);

      for (const re of patterns) {
        if (re.test(src)) {
          offenders.push(`${rel}: re-introduced unsupported PATCH/PUT generated save route`);
        }
      }

      for (const name of unsupportedNames) {
        const importOrCallRe = new RegExp(
          `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from|\\b${name}\\s*\\(`,
        );
        if (importOrCallRe.test(src.split('"').join("'"))) {
          offenders.push(`${rel}: re-introduced unsupported helper ${name}`);
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `PR-F unsupported PATCH/PUT save routes must stay removed. Offenders:\n${offenders.join("\n")}`,
    );
  });

  it("keeps the supported generated save helpers exported from document-form-api", () => {
    for (const name of SUPPORTED_SAVE_HELPERS) {
      assert.equal(
        isExportedFunction(docFormApiSource, name),
        true,
        `document-form-api.ts must keep exporting supported helper ${name}.`,
      );
    }
  });

  it("keeps form-studio-api.ts as a compatibility re-export only", () => {
    assert.match(
      formStudioApiSource,
      /contract-platform-api/,
      "form-studio-api.ts must re-export from contract-platform-api.",
    );

    for (const name of [
      "patchDocumentFormInputs",
      "replaceDocumentFormInputs",
      "patchBm031DirectFormInputs",
    ]) {
      assert.doesNotMatch(
        formStudioApiSource,
        new RegExp(`\\b${name}\\b`),
        `form-studio-api.ts must not reference unsupported helper ${name}.`,
      );
    }
  });
});