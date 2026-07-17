/**
 * BM-001 template runtime visual guard (pure file-system + pure-JS-shim).
 *
 * Purpose
 * -------
 * Locks the BM-001 visual template parity outcome documented in
 * `docs/audit/unified-bm-workspace/BM001_TEMPLATE_RUNTIME_VISUAL_TARGET.latest.md`.
 *
 * Assertions (14):
 *
 *   1. BM-001 profile is runtime-ready (Form Flight side).
 *   2. BM-171 profile is runtime-ready (regression guard).
 *   3. BM-001 is in the runtime-ready allowlist (form-lifecycle side).
 *   4. BM-171 is in the runtime-ready allowlist (regression guard).
 *   5. The runtime-ux barrel imports `bm001-runtime-ux-profile`
 *      side-effect register (so `getRuntimeUxProfile("BM-001")` returns
 *      the populated profile at render time).
 *   6. The runtime-ux barrel still imports `bm171-runtime-ux-profile`
 *      (regression guard).
 *   7. The runtime-ux profile file declares `templateCode: "BM-001"`.
 *   8. The runtime-ux profile file sections include a known BM-001
 *      section id (`section-tiep-nhan-nguon-tin`).
 *   9. The runtime-ux profile file `demo` does NOT contain the legacy
 *      stale values (Nguyễn Văn A / Trần Thị B / 1980 / Ông  cung cấp /
 *      Nguyễn Thị Hồng Hạnh).
 *  10. The runtime-ux profile file `demo` DOES contain
 *      (Nguyễn Thị Mai / Trần Văn Bình / 1985).
 *  11. The BM-001 template runtime host (`template-preview-workspace.tsx`)
 *      does NOT import the generated-document save endpoint.
 *  12. The BM-001 template runtime host does NOT instantiate a
 *      generated-document adapter.
 *  13. The BM-001 template runtime host still mounts `<ContractV2Renderer>`
 *      with `uxProfile` (so the BM-171-style runtime-ready UI is the
 *      single rendered panel).
 *  14. Only BM-001 and BM-171 declare `runtimeReady: true` —
 *      file-system level (regression guard).
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/bm001-template-runtime-visual.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FORM_FLIGHT_DIR = __dirname;
const APPS_WEB_DIR = join(FORM_FLIGHT_DIR, "..", "..");
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");
const RUNTIME_UX_DIR = join(APPS_WEB_DIR, "lib/runtime-ux");

const RUNTIME_READY_CODES = ["BM-001", "BM-171"];
const SKELETON_CODE = "BM-002";

const bm001ProfilePath = join(PROFILE_DIR, "bm001.ts");
const bm171ProfilePath = join(PROFILE_DIR, "bm171.ts");
const formLifecyclePath = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
const templatePreviewPath = join(
  APPS_WEB_DIR,
  "components/documents/template-preview-workspace.tsx",
);
const runtimeUxIndexPath = join(RUNTIME_UX_DIR, "index.ts");
const bm001RuntimeUxPath = join(RUNTIME_UX_DIR, "bm001-runtime-ux-profile.ts");

const bm001ProfileSource = readFileSync(bm001ProfilePath, "utf8");
const bm171ProfileSource = readFileSync(bm171ProfilePath, "utf8");
const formLifecycleSource = readFileSync(formLifecyclePath, "utf8");
const templatePreviewSource = readFileSync(templatePreviewPath, "utf8");
const runtimeUxIndexSource = readFileSync(runtimeUxIndexPath, "utf8");
const bm001RuntimeUxSource = readFileSync(bm001RuntimeUxPath, "utf8");

describe("BM-001 template runtime visual guard", () => {
  it("1. BM-001 profile is runtime-ready (Form Flight side)", () => {
    assert.ok(
      /runtimeReady:\s*true/.test(bm001ProfileSource),
      "BM-001 profile must declare runtimeReady: true",
    );
    assert.ok(
      /profileStatus:\s*["']runtime-ready["']/.test(bm001ProfileSource),
      "BM-001 profile must declare profileStatus: runtime-ready",
    );
  });

  it("2. BM-171 profile is runtime-ready (regression guard)", () => {
    assert.ok(
      /runtimeReady:\s*true/.test(bm171ProfileSource),
      "BM-171 profile must still declare runtimeReady: true",
    );
  });

  it("3. BM-001 is in the runtime-ready allowlist (form-lifecycle side)", () => {
    const listMatch = formLifecycleSource.match(
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([^\]]+)\]/,
    );
    assert.ok(listMatch, "RUNTIME_READY_FORM_FLIGHT_PROFILES must be defined");
    const listed = listMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    assert.ok(
      listed.includes("BM-001"),
      "BM-001 must be in the runtime-ready allowlist",
    );
  });

  it("4. BM-171 is in the runtime-ready allowlist (regression guard)", () => {
    const listMatch = formLifecycleSource.match(
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([^\]]+)\]/,
    );
    const listed = listMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    assert.ok(
      listed.includes("BM-171"),
      "BM-171 must still be in the runtime-ready allowlist",
    );
  });

  it("5. The runtime-ux barrel imports the BM-001 runtime-ux profile (side-effect register)", () => {
    assert.ok(
      runtimeUxIndexSource.includes("bm001-runtime-ux-profile"),
      "runtime-ux/index.ts must import the BM-001 profile",
    );
    assert.ok(
      runtimeUxIndexSource.match(
        /import\s+["']\.\/bm001-runtime-ux-profile["']/,
      ),
      "runtime-ux/index.ts must import the BM-001 profile via the side-effect path",
    );
  });

  it("6. The runtime-ux barrel still imports the BM-171 profile (regression guard)", () => {
    assert.ok(
      runtimeUxIndexSource.includes("bm171-runtime-ux-profile"),
      "runtime-ux/index.ts must still import the BM-171 profile",
    );
  });

  it("7. The BM-001 runtime-ux profile declares templateCode: BM-001", () => {
    assert.ok(
      /templateCode:\s*["']BM-001["']/.test(bm001RuntimeUxSource),
      "BM-001 runtime-ux profile must declare templateCode BM-001",
    );
    assert.ok(
      /registerRuntimeUxProfile\s*\(/.test(bm001RuntimeUxSource),
      "BM-001 runtime-ux profile must register itself",
    );
  });

  it("8. The BM-001 runtime-ux profile includes a known BM-001 section id", () => {
    assert.ok(
      /sectionId:\s*["']section-tiep-nhan-nguon-tin["']/.test(
        bm001RuntimeUxSource,
      ),
      "BM-001 runtime-ux profile must include section-tiep-nhan-nguon-tin",
    );
    assert.ok(
      /sectionId:\s*["']section-noi-dung-nguon-tin["']/.test(
        bm001RuntimeUxSource,
      ),
      "BM-001 runtime-ux profile must include section-noi-dung-nguon-tin",
    );
  });

  it("9. The BM-001 runtime-ux profile demo does NOT contain legacy stale tokens", () => {
    // Strip TypeScript comments so the regex does not match
    // documentation prose that literally lists the forbidden tokens.
    const stripped = bm001RuntimeUxSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const forbiddenTokens = [
      "Nguyễn Văn A", // legacy person.fullName default
      "Trần Thị B", // legacy informant.fullName / reporter.fullName default
      "1980", // legacy birthYear default
      "Ông  cung cấp", // legacy two-space bug in crimeReport.content
      "Nguyễn Thị Hồng Hạnh", // legacy receiver-name stale fallback
    ];
    for (const token of forbiddenTokens) {
      assert.ok(
        !stripped.includes(token),
        `BM-001 runtime-ux profile must not contain legacy token: ${token}`,
      );
    }
  });

  it("10. The BM-001 runtime-ux profile demo DOES contain the BM001_DEMO-aligned values", () => {
    const requiredTokens = [
      "Nguyễn Thị Mai", // demo receiver
      "Trần Văn Bình", // demo informant
      "1985", // demo birthYear
      "Viện Kiểm sát nhân dân Khu vực 7", // receiver department
      "HSVA, HSKS, VP.", // archive line
    ];
    for (const token of requiredTokens) {
      assert.ok(
        bm001RuntimeUxSource.includes(token),
        `BM-001 runtime-ux profile must contain the demo token: ${token}`,
      );
    }
  });

  it("11. The BM-001 template runtime host does NOT import the generated-document save endpoint", () => {
    const forbidden = [
      "saveDocumentFormInputs",
      "saveGeneratedDocumentFormInputs",
      "saveBm001FormInputs",
    ];
    for (const token of forbidden) {
      assert.ok(
        !templatePreviewSource.includes(token),
        `template-preview-workspace must not mention ${token}`,
      );
    }
  });

  it("12. The BM-001 template runtime host does NOT instantiate a generated-document adapter", () => {
    assert.ok(
      !/createGeneratedDocumentAdapter\s*\(/.test(templatePreviewSource),
      "template-preview-workspace must not instantiate createGeneratedDocumentAdapter",
    );
    assert.ok(
      !/getGeneratedDocumentProfile/.test(templatePreviewSource),
      "template-preview-workspace must not import generated-document profile helpers",
    );
  });

  it("13. The template runtime host still mounts <ContractV2Renderer> with uxProfile", () => {
    assert.ok(
      /<ContractV2Renderer\b/.test(templatePreviewSource),
      "template-preview-workspace must still mount ContractV2Renderer",
    );
    assert.ok(
      templatePreviewSource.match(/<ContractV2Renderer[^>]*uxProfile=/s) ||
        /<ContractV2Renderer[\s\S]*?uxProfile=/m.test(templatePreviewSource),
      "template-preview-workspace must still pass uxProfile to ContractV2Renderer",
    );
    // The runtime-ready template panel selector must now be wired so
    // future BM-NNN promotions route through the same banner surface.
    assert.ok(
      templatePreviewSource.includes("selectRuntimeReadyTemplatePanel"),
      "template-preview-workspace must invoke selectRuntimeReadyTemplatePanel",
    );
    assert.ok(
      templatePreviewSource.includes("Runtime-ready template panel"),
      "template-preview-workspace must surface the runtime-ready panel banner",
    );
  });

  it("14. Only BM-001 and BM-171 declare runtimeReady: true (file-system level)", () => {
    // Enumerate profile files and assert exactly two carry the flag.
    // The regex anchors on `true` followed by a value terminator
    // (`,`, `;`, newline, `}`) so `runtimeReady: false` does not
    // produce a false positive.
    const files = readdirSync(PROFILE_DIR).filter(
      (f) => f.endsWith(".ts") && /^bm\d+\.ts$/.test(f),
    );
    const runtimeReadyFiles = [];
    for (const file of files) {
      const stripped = readFileSync(join(PROFILE_DIR, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      if (/runtimeReady\s*:\s*true\s*[,;\n}]/.test(stripped)) {
        runtimeReadyFiles.push(file);
      }
    }
    assert.deepEqual(
      runtimeReadyFiles.sort(),
      ["bm001.ts", "bm171.ts"],
      `only bm001.ts + bm171.ts must declare runtimeReady: true; got: ${runtimeReadyFiles.join(", ")}`,
    );
  });
});
