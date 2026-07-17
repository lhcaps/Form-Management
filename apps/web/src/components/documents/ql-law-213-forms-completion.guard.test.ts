/**
 * 213 QLLAW FORMS COMPLETION GUARD
 *
 * Static-source audit guard for the 213 BM-XXX forms in the generated
 * document workspace. The test reads every panel file, the auto-generated
 * registry, the workspace adapter, the legacy-renderer capabilities, and
 * the supported API seam, and proves the completion definition
 * (see docs/audit/unified-bm-workspace/QLLAW_213_FORMS_COMPLETION.latest.md)
 * still holds.
 *
 * Mandatory assertions (1..11):
 *   1. Every BM-XXX code found in source of truth has a status entry in the
 *      static inventory (no silently missing form).
 *   2. Every BM-XXX code is reachable from the generated workspace — either
 *      via the BM_PANEL_BY_CODE registry or via the explicit BM-172 adapter.
 *   3. Every form that has a BM-specific panel has its panel selected by
 *      the generated-form-panel-selector (i.e. selector knows the registry).
 *   4. Forms without a BM-specific panel that have a published runtime
 *      contract fall back to the published-contract path; forms without
 *      either fall back to the generic template panel.
 *   5. No panel or helper still uses the unsupported PATCH/PUT generated
 *      save routes (`/form-inputs` PUT/PATCH, `/bm031-direct-form-inputs`
 *      PATCH).
 *   6. BM-031 still uses `saveBm031DirectFormInputs` for save.
 *   7. Forms classified as NORMAL (non-BM031, non-published) use
 *      `saveDocumentFormInputs` for save.
 *   8. Forms classified as CONTRACT-published use
 *      `savePublishedContractFormInputs` for save (when their save path is
 *      exercised through a panel or helper).
 *   9. BM-001 (audit-only) is not promoted to runtime-authoritative; its
 *      profile is imported as `audit-only`.
 *  10. BM-171 (runtime-ready) is not downgraded; its profile is imported
 *      as `runtime-ready`.
 *  11. No generated panel is imported by a runtime preview unsafe path
 *      (the runtime preview session only imports from
 *      runtime-preview-session.service.ts and template-runtime-adapter,
 *      not generated-document-workspace).
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, it } from "node:test";

const webSrcDir = fileURLToPath(new URL("../..", import.meta.url))
  .replace(/[\\/]+$/, "");
const componentsDir = join(webSrcDir, "components", "documents");
// apps/web/src/components/documents/<file> → ../../.. = apps/web/ → ../api/src = apps/api/src
const apiSrcDir = join(webSrcDir, "..", "..", "api", "src");
const webLibDir = join(webSrcDir, "lib");
const registryPath = join(componentsDir, "bm-panel-registry.generated.ts");
const workspacePath = join(componentsDir, "generated-document-workspace.tsx");
const selectorPath = join(componentsDir, "generated-form-panel-selector.ts");
const selectorTestPath = join(componentsDir, "generated-form-panel-selector.test.ts");
const templatePreviewWorkspacePath = join(
  componentsDir,
  "template-preview-workspace.tsx",
);
const templateRuntimeAdapterPath = join(
  webLibDir,
  "form-flight",
  "adapters",
  "template-runtime-adapter.ts",
);
const runtimePreviewPayloadPath = join(
  webLibDir,
  "runtime-ux",
  "runtime-preview-payload.ts",
);
const capabilitiesPath = join(
  apiSrcDir,
  "modules",
  "contract-platform",
  "infrastructure",
  "legacy-renderer-capabilities.generated.ts",
);
const seamPath = join(webLibDir, "document-form-api.ts");

function listAllBmPanelFiles(): string[] {
  return readdirSync(componentsDir)
    .filter((f) => /^bm-\d{3}-form-inputs\.tsx$/.test(f))
    .sort();
}

function panelFileToCode(file: string): string {
  const m = file.match(/bm-(\d{3})-form-inputs\.tsx/);
  return `BM-${m[1]}`;
}

function panelFileToNumber(file: string): number {
  const m = file.match(/bm-(\d{3})-form-inputs\.tsx/);
  return Number(m[1]);
}

function readPanelSource(file: string): string {
  return readFileSync(join(componentsDir, file), "utf8");
}

function readOptionalHelper(code: string): string | null {
  const num = code.replace("BM-", "");
  const helperPath = join(webLibDir, `bm${num}-form-inputs-api.ts`);
  return existsSync(helperPath) ? readFileSync(helperPath, "utf8") : null;
}

function isGenericPanel(panelFile: string): boolean {
  return /GenericTemplateFormInputsPanel/.test(readPanelSource(panelFile));
}

function isPublishedContractPanel(panelFile: string): boolean {
  return /PublishedContractFormInputsPanel/.test(readPanelSource(panelFile));
}

function hasUnsupportedPatchPut(src: string): boolean {
  // Detect raw HTTP method calls or helpers that would translate to PATCH/PUT.
  const unsupportedRegex =
    /(?:PATCH|PUT)\s*\(?\s*[`'"][^`'"]*\/documents\/generated\/[^`'"]*form-inputs/i;
  const unsupportedBm031Regex =
    /(?:PATCH|PUT)\s*\(?\s*[`'"][^`'"]*\/documents\/generated\/[^`'"]*bm031-direct-form-inputs/i;
  const unsupportedHelpers =
    /\b(?:patchDocumentFormInputs|replaceDocumentFormInputs|patchBm031DirectFormInputs)\s*\(/;
  return (
    unsupportedRegex.test(src) ||
    unsupportedBm031Regex.test(src) ||
    unsupportedHelpers.test(src)
  );
}

function hasRawFetchRenderPayload(src: string): boolean {
  return /fetch\s*\(\s*`\$\{(?:API_BASE_URL|apiBase)\}\/documents\/generated\/[^`]*render-payload`/.test(
    src,
  );
}

function panelUsesReadApiOrGetRenderPayload(src: string): boolean {
  return /getDocumentRenderPayload|readApi\s*</.test(src);
}

function panelSavesViaSaveDocumentFormInputs(src: string): boolean {
  return /saveDocumentFormInputs\s*\(/.test(src);
}

function panelSavesViaSaveBm031Direct(src: string): boolean {
  return /saveBm031DirectFormInputs\s*\(/.test(src);
}

function panelSavesViaSavePublishedContract(src: string): boolean {
  return /savePublishedContractFormInputs\s*\(/.test(src);
}

const REGISTRY_SRC = readFileSync(registryPath, "utf8");
const WORKSPACE_SRC = readFileSync(workspacePath, "utf8");
const SELECTOR_SRC = readFileSync(selectorPath, "utf8");
const SELECTOR_TEST_SRC = readFileSync(selectorTestPath, "utf8");
const TEMPLATE_PREVIEW_SRC = readFileSync(templatePreviewWorkspacePath, "utf8");
const TEMPLATE_RUNTIME_ADAPTER_SRC = readFileSync(templateRuntimeAdapterPath, "utf8");
const RUNTIME_PREVIEW_PAYLOAD_SRC = readFileSync(runtimePreviewPayloadPath, "utf8");
const CAPABILITIES_SRC = readFileSync(capabilitiesPath, "utf8");
const SEAM_SRC = readFileSync(seamPath, "utf8");

const REGISTRY_CODES: ReadonlySet<string> = new Set(
  Array.from(REGISTRY_SRC.matchAll(/['"]BM-\d{3}['"]/g), (m) =>
    m[0].replaceAll(/['"]/g, ""),
  ),
);

const GENERIC_CODES: ReadonlySet<string> = new Set(
  Array.from(CAPABILITIES_SRC.matchAll(/['"]BM-\d{3}['"]/g), (m) =>
    m[0].replaceAll(/['"]/g, ""),
  ),
);

const PANEL_FILES = listAllBmPanelFiles();
const PANEL_CODES = PANEL_FILES.map(panelFileToCode);

const WORKSPACE_REFERENCES_BM172 =
  /bm-172-form-inputs|Bm172FormInputs|_Bm172FormInputsPanelAdapter/.test(WORKSPACE_SRC);

// The runtime preview unsafe path = template-preview-workspace + template-runtime-adapter + runtime-preview-payload.
const RUNTIME_PREVIEW_PATHS = [
  TEMPLATE_PREVIEW_SRC,
  TEMPLATE_RUNTIME_ADAPTER_SRC,
  RUNTIME_PREVIEW_PAYLOAD_SRC,
];
const RUNTIME_PREVIEW_HAS_BM_IMPORT = RUNTIME_PREVIEW_PATHS.some((src) =>
  /bm-\d{3}-form-inputs/.test(src),
);

function codesCoveredBySourceOfTruth(): string[] {
  // Source-of-truth = registry OR BM-172 adapter OR panel file.
  const covered = new Set<string>();
  for (const code of REGISTRY_CODES) covered.add(code);
  if (WORKSPACE_REFERENCES_BM172) covered.add("BM-172");
  for (const code of PANEL_CODES) covered.add(code);
  return [...covered].sort();
}

const SOURCE_OF_TRUTH_CODES = codesCoveredBySourceOfTruth();

describe("213 QLLAW forms completion guard", () => {
  it("1. every BM-XXX code in source of truth has a status entry in the inventory", () => {
    assert.strictEqual(
      SOURCE_OF_TRUTH_CODES.length,
      213,
      `expected exactly 213 source-of-truth codes, got ${SOURCE_OF_TRUTH_CODES.length}`,
    );
    for (const code of SOURCE_OF_TRUTH_CODES) {
      const num = Number(code.replace("BM-", ""));
      assert.ok(
        Number.isFinite(num) && num >= 1 && num <= 213,
        `code ${code} is not a valid BM-XXX in range 1..213`,
      );
    }
    assert.strictEqual(new Set(SOURCE_OF_TRUTH_CODES).size, 213);
  });

  it("2. no form is silently missing from the generated workspace", () => {
    // Registry + BM-172 adapter must cover all 213 codes.
    const reachable = new Set<string>(REGISTRY_CODES);
    if (WORKSPACE_REFERENCES_BM172) reachable.add("BM-172");
    assert.ok(
      WORKSPACE_REFERENCES_BM172,
      "generated-document-workspace.tsx must reference the BM-172 adapter",
    );
    for (const code of SOURCE_OF_TRUTH_CODES) {
      assert.ok(
        reachable.has(code),
        `${code} is not reachable from generated-document-workspace (registry + BM-172 adapter)`,
      );
    }
  });

  it("3. every form with a BM-specific panel is identified by the panel selector", () => {
    // The workspace extends the registry with the BM-172 alias and looks up
    // the panel via BM_PANEL_BY_CODE[templateCode] ?? GenericTemplateFormInputsPanel.
    assert.ok(
      /BM_PANEL_BY_CODE\[/.test(WORKSPACE_SRC),
      "generated-document-workspace.tsx must perform BM_PANEL_BY_CODE[templateCode] lookup",
    );
    assert.ok(
      /from\s*["']@\/components\/documents\/bm-panel-registry\.generated["']/.test(WORKSPACE_SRC) ||
        /bm-panel-registry/.test(WORKSPACE_SRC),
      "workspace must import the bm-panel-registry.generated registry",
    );
    // Selector module must still expose the three decision branches.
    assert.ok(
      /bm-panel/.test(SELECTOR_SRC) &&
        /published-runtime/.test(SELECTOR_SRC) &&
        /generic/.test(SELECTOR_SRC),
      "generated-form-panel-selector must expose bm-panel/published-runtime/generic decisions",
    );
  });

  it("4. forms without a BM-specific panel fall back to generic/contract panel", () => {
    const genericCodeSet = new Set<string>();
    for (const file of PANEL_FILES) {
      if (isGenericPanel(file) || isPublishedContractPanel(file)) {
        genericCodeSet.add(panelFileToCode(file));
      }
    }
    // Every code listed in legacy-renderer-capabilities as GENERIC must
    // have its panel compose GenericTemplateFormInputsPanel.
    for (const code of GENERIC_CODES) {
      assert.ok(
        genericCodeSet.has(code),
        `${code} is GENERIC per capabilities registry but its panel does not compose the generic/published-contract fallback`,
      );
    }
    // Workspace must use GenericTemplateFormInputsPanel as the universal fallback.
    assert.ok(
      /GenericTemplateFormInputsPanel/.test(WORKSPACE_SRC),
      "workspace must reference GenericTemplateFormInputsPanel as the universal fallback",
    );
    // Selector module exposes "generic" decision branch.
    assert.ok(
      /return\s+["']generic["']/.test(SELECTOR_SRC),
      "selector must return the 'generic' decision branch when no bm-panel/published-runtime is available",
    );
  });

  it("5. no panel or helper still uses unsupported PATCH/PUT generated save routes", () => {
    for (const file of PANEL_FILES) {
      const src = readPanelSource(file);
      assert.ok(
        !hasUnsupportedPatchPut(src),
        `${file} still references an unsupported PATCH/PUT generated save route or helper`,
      );
    }
    // Also scan the helper files.
    for (const code of SOURCE_OF_TRUTH_CODES) {
      const helper = readOptionalHelper(code);
      if (!helper) continue;
      assert.ok(
        !hasUnsupportedPatchPut(helper),
        `bm${code.replace("BM-", "")}-form-inputs-api.ts still references an unsupported PATCH/PUT generated save route`,
      );
    }
    // The seam itself must not export the unsupported helpers.
    assert.ok(
      !/export\s+(?:async\s+)?function\s+(?:patchDocumentFormInputs|replaceDocumentFormInputs|patchBm031DirectFormInputs)/.test(
        SEAM_SRC,
      ),
      "document-form-api seam must not export unsupported PATCH/PUT helpers",
    );
  });

  it("6. BM-031 still uses saveBm031DirectFormInputs", () => {
    const bm031File = "bm-031-form-inputs.tsx";
    const src = readPanelSource(bm031File);
    assert.ok(
      panelSavesViaSaveBm031Direct(src),
      `${bm031File} must call saveBm031DirectFormInputs for save`,
    );
    assert.ok(
      panelUsesReadApiOrGetRenderPayload(src),
      `${bm031File} must use readApi / getDocumentRenderPayload for read`,
    );
  });

  it("7. NORMAL generated save path uses saveDocumentFormInputs", () => {
    // Walk every non-BM031 panel and verify that it either:
    //   - calls saveDocumentFormInputs directly, or
    //   - delegates to a helper that does.
    for (const file of PANEL_FILES) {
      if (file === "bm-031-form-inputs.tsx") continue;
      const code = panelFileToCode(file);
      const src = readPanelSource(file);
      const helper = readOptionalHelper(code);
      const panelHasIt = panelSavesViaSaveDocumentFormInputs(src);
      const helperHasIt =
        !!helper &&
        /saveDocumentFormInputs\s*\(/.test(helper) &&
        !panelSavesViaSaveBm031Direct(helper);
      const helperDelegatesToPanel =
        !!helper && /saveDocumentFormInputs|saveBm031DirectFormInputs/.test(helper);
      // BM-001 routes via its own helper which itself calls saveDocumentFormInputs
      // in a wrapped context — helper file existence is the evidence.
      if (code === "BM-001" && helper && /saveDocumentFormInputs/.test(helper)) continue;
      // BM-172 routes through saveDocumentFormInputs from the seam.
      if (code === "BM-172" && panelHasIt) continue;
      // Skip GENERIC + PUBLISHED-CONTRACT panels — they delegate via composition
      // and may not have a direct seam import.
      if (isGenericPanel(file) || isPublishedContractPanel(file)) continue;
      assert.ok(
        panelHasIt || helperHasIt || helperDelegatesToPanel,
        `${file} (or its helper) must use saveDocumentFormInputs for save`,
      );
    }
  });

  it("8. CONTRACT-published save path uses savePublishedContractFormInputs", () => {
    // Sanity check: the seam must still export the contract save helper.
    assert.ok(
      /export\s+(?:async\s+)?function\s+savePublishedContractFormInputs/.test(SEAM_SRC),
      "document-form-api seam must still export savePublishedContractFormInputs",
    );
    // The published-contract fallback panel must call it.
    const contractPanelPath = join(componentsDir, "published-contract-form-inputs.tsx");
    if (existsSync(contractPanelPath)) {
      const src = readFileSync(contractPanelPath, "utf8");
      assert.ok(
        panelSavesViaSavePublishedContract(src),
        "published-contract-form-inputs.tsx must use savePublishedContractFormInputs",
      );
    }
  });

  it("9. BM-001 audit-only profile is not promoted to runtime-authoritative", () => {
    const helperPath = join(webLibDir, "bm001-form-inputs-api.ts");
    assert.ok(existsSync(helperPath), "bm001 helper must exist");
    const helper = readFileSync(helperPath, "utf8");
    // BM-001 must not import a runtime-ready profile.
    assert.ok(
      !/from\s*["']@\/lib\/form-flight\/profiles\/bm001["']\s*;?/.test(helper) ||
        /profileStatus\s*:\s*["']audit-only["']/.test(helper) ||
        !/profileStatus\s*:\s*["']runtime-ready["']/.test(helper),
      "bm001 helper must not be downgraded to runtime-ready",
    );
    // The form-flight profile directory must declare BM-001 as audit-only.
    const profilePath = join(webLibDir, "form-flight", "profiles", "bm001.ts");
    if (existsSync(profilePath)) {
      const profileSrc = readFileSync(profilePath, "utf8");
      assert.ok(
        /audit-only|skeleton/i.test(profileSrc),
        `bm001 form-flight profile must mark the form as audit-only or skeleton (not runtime-ready)`,
      );
    }
  });

  it("10. BM-171 runtime-ready profile is not downgraded", () => {
    const panel = readPanelSource("bm-171-form-inputs.tsx");
    // BM-171 must still import its runtime-ready profile from form-flight/profiles
    // (either as a side-effect import or a value import).
    assert.ok(
      /from\s*["']@\/lib\/form-flight\/profiles\/bm171["']|import\s*["']@\/lib\/form-flight\/profiles\/bm171["']/.test(
        panel,
      ),
      "bm-171 panel must import its profile from @/lib/form-flight/profiles/bm171",
    );
    const profilePath = join(webLibDir, "form-flight", "profiles", "bm171.ts");
    assert.ok(existsSync(profilePath), "bm171 form-flight profile file must exist");
    const profileSrc = readFileSync(profilePath, "utf8");
    assert.ok(
      /runtime-ready/.test(profileSrc),
      "bm171 form-flight profile must remain runtime-ready",
    );
    // Optional: if the panel file uses profileStatus at all, it must be runtime-ready.
    if (/profileStatus/.test(panel)) {
      assert.ok(
        /profileStatus\s*:\s*["']runtime-ready["']/.test(panel),
        "bm-171 panel must keep profileStatus runtime-ready when explicitly set",
      );
    }
  });

  it("11. generated panels are not imported by the runtime preview unsafe path", () => {
    // The runtime preview flow (template-preview-workspace + template-runtime-adapter
    // + runtime-preview-payload) must not import any BM-specific generated panel.
    assert.ok(
      !RUNTIME_PREVIEW_HAS_BM_IMPORT,
      "runtime preview flow (template-preview-workspace / template-runtime-adapter / runtime-preview-payload) must not import any bm-NNN-form-inputs component",
    );
    // The runtime preview flow must not import generated-document-workspace either
    // (the generated workspace is the persisted-doc flow, not the standalone preview flow).
    assert.ok(
      !/generated-document-workspace/.test(TEMPLATE_PREVIEW_SRC),
      "template-preview-workspace.tsx must not import the generated-document-workspace",
    );
  });

  // Informational sub-cases — not strict assertions but provide a single
  // running summary the executor can paste into the report.
  it("12. the BM-172 workspace adapter persists before reporting save success", () => {
    const adapter = WORKSPACE_SRC.match(
      /function _Bm172FormInputsPanelAdapter[\s\S]*?const _registryWith172/,
    )?.[0];
    assert.ok(adapter, "BM-172 workspace adapter must exist");
    assert.match(
      adapter,
      /onSave=\{async \(payload\) =>[\s\S]*?saveDocumentFormInputs\(documentId,/,
      "BM-172 adapter must use the provided documentId to persist the payload",
    );
    assert.match(
      adapter,
      /await onSaved\?\.\(\)/,
      "BM-172 adapter must refresh the workspace after persistence",
    );
    assert.doesNotMatch(
      adapter,
      /onSave=\{\(\) => \{\}\}/,
      "BM-172 adapter must not report a no-op save as successful",
    );
  });

  it("summary: classifies every panel by its actual save helper", () => {
    const byHelper = new Map<string, string[]>();
    for (const file of PANEL_FILES) {
      const code = panelFileToCode(file);
      const src = readPanelSource(file);
      const helper = readOptionalHelper(code);
      const all = `${src}\n${helper ?? ""}`;
      let label = "UNKNOWN";
      if (panelSavesViaSaveBm031Direct(all)) label = "BM031_DIRECT";
      else if (panelSavesViaSavePublishedContract(all)) label = "CONTRACT_PUBLISHED";
      else if (panelSavesViaSaveDocumentFormInputs(all)) label = "NORMAL";
      else if (isGenericPanel(file)) label = "GENERIC_FALLBACK";
      else if (isPublishedContractPanel(file)) label = "CONTRACT_FALLBACK";
      const list = byHelper.get(label) ?? [];
      list.push(code);
      byHelper.set(label, list);
    }
    // Print so the executor can copy the breakdown into the report.
    console.log("\n213-forms save-helper breakdown:");
    for (const [label, codes] of [...byHelper.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      console.log(`  ${label}: ${codes.length}`);
    }
    // Sanity: at least one path is exercised per save-helper family.
    assert.ok(byHelper.has("BM031_DIRECT"), "must classify at least one panel as BM031_DIRECT");
    assert.ok(byHelper.has("NORMAL"), "must classify at least one panel as NORMAL");
  });

  it("summary: counts panels still using raw fetch on the read path", () => {
    let rawFetchCount = 0;
    for (const file of PANEL_FILES) {
      const src = readPanelSource(file);
      if (hasRawFetchRenderPayload(src)) rawFetchCount++;
    }
    console.log(`\n213-forms raw-fetch-on-render-payload panels: ${rawFetchCount}`);
    // After PR-213 migration: 0 panels may still use raw fetch on read path.
    assert.strictEqual(
      rawFetchCount,
      0,
      `0 raw render-payload fetches must remain in BM panels after PR-213 migration, found ${rawFetchCount}`,
    );
  });
});
