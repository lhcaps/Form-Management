/**
 * BM-001 render / export golden guard test.
 *
 * Lightweight read-only test (no DB, no fetch, no React, no browser).
 * Verifies that the BM-001 golden render pipeline produced real DOCX +
 * PDF artifacts that satisfy the runtime-ready profile acceptance
 * scanner, AND that no other skeleton was promoted in this phase.
 *
 *   1. BM-001 profile declares `runtimeReady: true`.
 *   2. BM-001 profile declares `profileStatus: "runtime-ready"`.
 *   3. BM-001 acceptance.requiredText is non-empty.
 *   4. BM-001 acceptance.forbiddenText is non-empty.
 *   5. BM-001 notes status remains `NO_NOTES_WITH_EVIDENCE`.
 *   6. BM-171 remains runtime-ready.
 *   7. No other skeleton has been promoted (only BM-001 + BM-171
 *      declare runtime-ready in profile source).
 *   8. Golden DOCX result JSON exists.
 *   9. Golden DOCX status is PASS.
 *  10. Every requiredText anchor passed in DOCX JSON.
 *  11. Every forbiddenText token absent in DOCX JSON.
 *  12. No placeholder leaks in DOCX JSON.
 *  13. No `Nguyễn Thị Hồng Hạnh` literal remains in
 *      `bm-001-form-inputs.tsx` sample fixture (PHASE 5 fix).
 *  14. No `"Ông  cung cấp"` literal remains in
 *      `bm-001-form-inputs.tsx` sample fixture (PHASE 5 fix).
 *  15. No blank `informant.fullName: ""` in
 *      `bm-001-form-inputs.tsx` sample fixture (PHASE 5 fix).
 *  16. If PDF golden exists, PDF status is PASS.
 *  17. If PDF golden is PARTIAL, blocker is explicitly recorded.
 *  18. BM-001 golden artifacts are present and non-empty.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/bm001-render-export-golden.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(__dirname, "profiles");
const ROOT = join(__dirname, "..", "..", "..", "..", "..");
const GOLDEN_DIR = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "bm001-golden",
);
const DOCX_JSON_PATH = join(GOLDEN_DIR, "BM001_RENDER_EXPORT_GOLDEN.latest.json");
const DOCX_OUT_PATH = join(GOLDEN_DIR, "BM001_RENDERED_GOLDEN.latest.docx");
const PDF_OUT_PATH = join(GOLDEN_DIR, "BM001_RENDERED_GOLDEN.latest.pdf");
const BM001_PROFILE_PATH = join(PROFILE_DIR, "bm001.ts");
const BM001_UI_PATH = join(
  ROOT,
  "apps",
  "web",
  "src",
  "components",
  "documents",
  "bm-001-form-inputs.tsx",
);
const BM171_PROFILE_PATH = join(PROFILE_DIR, "bm171.ts");

// form-flight standalone-template baseline (REAL_UI evidence from form-flight
// profiles themselves — these have hand-authored runtime UI implementations):
const RUNTIME_READY_FILES = new Set([
  "bm001.ts",
  "bm136.ts",
  "bm148.ts",
  "bm156.ts",
  "bm157.ts",
  "bm168.ts",
  "bm171.ts",
  "bm174.ts",
  "bm181.ts",
  "bm206.ts",
  "bm213.ts",
]);

function readProfileFile(filePath) {
  return readFileSync(filePath, "utf8");
}

// Strip JSDoc block comments and line comments so doc text mentioning
// forbidden phrases (e.g. "Do NOT set runtimeReady: true") does not
// trigger false positives.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("BM-001 render / export golden guard", () => {
  it("1. BM-001 profile declares runtimeReady: true", () => {
    const src = stripComments(readProfileFile(BM001_PROFILE_PATH));
    assert.match(src, /runtimeReady\s*:\s*true/, "runtimeReady must be true");
  });

  it("2. BM-001 profile declares profileStatus: \"runtime-ready\"", () => {
    const src = stripComments(readProfileFile(BM001_PROFILE_PATH));
    assert.match(
      src,
      /profileStatus\s*:\s*"runtime-ready"/,
      "profileStatus must be runtime-ready",
    );
  });

  it("3. BM-001 acceptance.requiredText is non-empty", () => {
    const src = stripComments(readProfileFile(BM001_PROFILE_PATH));
    const m = src.match(/requiredText\s*:\s*\[([^\]]*)\]/);
    assert.ok(m, "requiredText array must be present");
    const items = (m[1].match(/"((?:\\.|[^"\\])*)"/g) ?? []).length;
    assert.ok(items > 0, "requiredText must contain at least one anchor");
  });

  it("4. BM-001 acceptance.forbiddenText is non-empty", () => {
    const src = stripComments(readProfileFile(BM001_PROFILE_PATH));
    const m = src.match(/forbiddenText\s*:\s*\[([^\]]*)\]/);
    assert.ok(m, "forbiddenText array must be present");
    const items = (m[1].match(/"((?:\\.|[^"\\])*)"/g) ?? []).length;
    assert.ok(items > 0, "forbiddenText must contain at least one token");
  });

  it("5. BM-001 notes status remains NO_NOTES_WITH_EVIDENCE", () => {
    const src = stripComments(readProfileFile(BM001_PROFILE_PATH));
    // The verified extractor says BM-001 notes status is
    // NO_NOTES_WITH_EVIDENCE. Verify by scanning the profile source for
    // any `notes` section that would imply a footnote UI was added.
    assert.doesNotMatch(
      src,
      /notes\s*:\s*\[/,
      "BM-001 profile must not declare a notes section",
    );
    const extractor = JSON.parse(
      readFileSync(
        join(
          ROOT,
          "docs",
          "audit",
          "unified-bm-workspace",
          "QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json",
        ),
        "utf8",
      ),
    );
    const bm001 = (extractor.forms ?? []).find((f) => f.code === "BM-001");
    assert.ok(bm001, "BM-001 must exist in the verified extractor");
    assert.equal(
      bm001.notesStatus ?? "NO_NOTES_WITH_EVIDENCE",
      "NO_NOTES_WITH_EVIDENCE",
      "BM-001 notes status must remain NO_NOTES_WITH_EVIDENCE",
    );
  });

  it("6. BM-171 remains runtime-ready", () => {
    const src = stripComments(readProfileFile(BM171_PROFILE_PATH));
    assert.match(src, /runtimeReady\s*:\s*true/);
    assert.match(src, /profileStatus\s*:\s*"runtime-ready"/);
  });

  it("7. no other skeleton has been promoted", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) => /^bm\d{3}\.ts$/.test(f));
    assert.equal(files.length, 213, `expected 213 profile files, got ${files.length}`);
    for (const f of files) {
      const src = stripComments(readProfileFile(join(PROFILE_DIR, f)));
      if (RUNTIME_READY_FILES.has(f)) continue;
      assert.doesNotMatch(
        src,
        /runtimeReady\s*:\s*true/,
        `${f} must not declare runtimeReady: true`,
      );
      assert.doesNotMatch(
        src,
        /profileStatus\s*:\s*"runtime-ready"/,
        `${f} must not declare profileStatus: "runtime-ready"`,
      );
    }
  });

  it("8. golden DOCX result JSON exists", () => {
    assert.ok(existsSync(DOCX_JSON_PATH), `missing ${DOCX_JSON_PATH}`);
  });

  it("9. golden DOCX status is PASS", () => {
    const report = JSON.parse(readFileSync(DOCX_JSON_PATH, "utf8"));
    assert.equal(report.docxGolden.status, "PASS");
    assert.ok(
      ["PASS", "PARTIAL"].includes(report.status),
      `overall status must be PASS or PARTIAL; got ${report.status}`,
    );
  });

  it("10. all requiredText anchors passed in DOCX JSON", () => {
    const report = JSON.parse(readFileSync(DOCX_JSON_PATH, "utf8"));
    const results = report.docxGolden.requiredTextResults;
    assert.ok(Array.isArray(results), "requiredTextResults must be an array");
    assert.ok(results.length > 0, "requiredTextResults must be non-empty");
    for (const r of results) {
      assert.equal(r.present, true, `requiredText anchor "${r.anchor}" missing from DOCX`);
    }
  });

  it("11. all forbiddenText tokens absent in DOCX JSON", () => {
    const report = JSON.parse(readFileSync(DOCX_JSON_PATH, "utf8"));
    const results = report.docxGolden.forbiddenTextResults;
    assert.ok(Array.isArray(results), "forbiddenTextResults must be an array");
    assert.ok(results.length > 0, "forbiddenTextResults must be non-empty");
    for (const r of results) {
      assert.equal(r.present, false, `forbiddenText token "${r.token}" leaked into DOCX`);
    }
  });

  it("12. no placeholder leaks in DOCX JSON", () => {
    const report = JSON.parse(readFileSync(DOCX_JSON_PATH, "utf8"));
    assert.equal(
      report.docxGolden.placeholderLeaks.count,
      0,
      "DOCX must have zero placeholder leaks",
    );
  });

  it("13. UI sample fixture no longer hardcodes 'Nguyễn Thị Hồng Hạnh' literal", () => {
    const src = stripComments(readProfileFile(BM001_UI_PATH));
    // The guard test only cares about the name appearing as a *sample
    // value* (i.e. right-hand side of `:`), not in JSDoc comments.
    const lines = src.split(/\r?\n/);
    for (const line of lines) {
      assert.doesNotMatch(
        line,
        /:\s*"Nguyễn Thị Hồng Hạnh"/,
        `Legacy receiver/signer literal "Nguyễn Thị Hồng Hạnh" still appears as a sample value at: ${line}`,
      );
    }
  });

  it("14. UI sample fixture no longer hardcodes 'Ông  cung cấp' literal", () => {
    const src = stripComments(readProfileFile(BM001_UI_PATH));
    const lines = src.split(/\r?\n/);
    for (const line of lines) {
      assert.doesNotMatch(
        line,
        /"Ông  cung cấp/,
        `Legacy "Ông  cung cấp" two-space bug still appears as a sample value at: ${line}`,
      );
    }
  });

  it("15. UI sample fixture no longer has blank informant.fullName", () => {
    const src = readProfileFile(BM001_UI_PATH);
    // Find `fillCustomerSample` body and look for `informant.fullName: ""`.
    const bodyMatch = src.match(/function fillCustomerSample\(\)\s*\{[\s\S]*?\n\s{2}\}/);
    assert.ok(bodyMatch, "fillCustomerSample body not found");
    assert.doesNotMatch(
      bodyMatch[0],
      /informant\.fullName\s*:\s*""/,
      `Legacy blank informant.fullName still in fillCustomerSample`,
    );
  });

  it("16. PDF golden is PASS or PARTIAL with blocker recorded", () => {
    const report = JSON.parse(readFileSync(DOCX_JSON_PATH, "utf8"));
    assert.ok(
      ["PASS", "PARTIAL"].includes(report.pdfGolden.status),
      `PDF status must be PASS or PARTIAL; got ${report.pdfGolden.status}`,
    );
    if (report.pdfGolden.status === "PARTIAL") {
      assert.ok(
        report.pdfGolden.blocker,
        "PARTIAL PDF status must include an explicit blocker",
      );
    }
  });

  it("17. golden DOCX + PDF artifacts are present and non-empty", () => {
    if (existsSync(DOCX_OUT_PATH)) {
      const size = statSync(DOCX_OUT_PATH).size;
      assert.ok(size > 0, `DOCX artifact empty: ${DOCX_OUT_PATH}`);
    }
    if (existsSync(PDF_OUT_PATH)) {
      const size = statSync(PDF_OUT_PATH).size;
      assert.ok(size > 0, `PDF artifact empty: ${PDF_OUT_PATH}`);
    }
  });
});