/**
 * BM-001 runtime-readiness guard test.
 *
 * Verifies the BM-001 Form Flight profile after the
 * "BM-001 Fidelity Repair With Verified Notes" promotion. Pure
 * file-system / source-text check (no DB, no fetch, no React) so it
 * can run via `node --test` on its own, matching the convention used
 * by `profile-registry-guard.test.mjs`.
 *
 *   1. BM-001 profile file exists and self-registers.
 *   2. BM-001 declares `runtimeReady: true`.
 *   3. BM-001 declares `profileStatus: "runtime-ready"`.
 *   4. BM-001 `fieldPaths` length is exactly 39 (locked-contract
 *      docxSlots count from `docs/audit/docx/contracts/locked/BM-001__*.json`).
 *   5. BM-001 `fieldPaths` include every contract-declared slot, in
 *      canonical order matching the locked contract.
 *   6. BM-001 `requiredFieldPaths` is a non-empty subset of `fieldPaths`
 *      and does NOT include the deliberately-optional paths
 *      (phone, temporaryAddress, representedOrganization, identityIssuedDay,
 *      identityIssuedMonth, identityIssuedYear, birthDay, birthMonth,
 *      ethnicity, religion, occupation).
 *   7. BM-001 `demo` is non-empty.
 *   8. BM-001 `summaryLines` is non-empty (≥ 6 lines).
 *   9. BM-001 `acceptance.requiredText` is non-empty and contains
 *      the BM-001 legal headline anchors.
 *  10. BM-001 `acceptance.forbiddenText` contains the legacy bug
 *      patterns `"{{"`, `"}}"`, `"Ông  cung cấp"`, `"undefined"`,
 *      `"null"`, `"[object Object]"`.
 *  11. BM-001 profile does not import any runtime adapter (registry
 *      purity).
 *  12. BM-171 still declares `runtimeReady: true` + `profileStatus: "runtime-ready"`.
 *  13. BM-171 still self-registers.
 *  14. No profile file other than BM-001 / BM-171 declares
 *      `runtimeReady: true` (in particular, no auto-generated skeleton
 *      was promoted).
 *  15. The verified extractor says BM-001 notes status is
 *      `NO_NOTES_WITH_EVIDENCE` and BM-001 has not gained a notes
 *      UI section in the profile.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/bm001-runtime-ready.guard.test.mjs
 *
 * No npm test runner dependency.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(__dirname, "profiles");
const ROOT = join(__dirname, "..", "..", "..", "..", "..");
const EXTRACT_JSON = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json",
);

const BM001_PATH = join(PROFILE_DIR, "bm001.ts");
const BM171_PATH = join(PROFILE_DIR, "bm171.ts");

const RUNTIME_READY_FILES = new Set([
  "bm001.ts",
  "bm171.ts",
  // R5 promoted candidates — must be allowed to declare runtimeReady: true
  // (cross-checked by runtime-readiness-r5-post-promotion-ratification.guard.test.mjs).
  "bm136.ts",
  "bm148.ts",
  "bm156.ts",
  "bm157.ts",
  "bm168.ts",
  "bm174.ts",
  "bm181.ts",
  "bm206.ts",
  "bm213.ts",
]);

// 39 paths the locked contract `docxSlots` declares for BM-001
// (cross-checked against
//  docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json).
const EXPECTED_BM001_FIELD_PATHS = [
  "document.issuePlaceDateLine",
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  "informant.fullName",
  "informant.genderLabel",
  "informant.otherName",
  "informant.birthDay",
  "informant.birthMonth",
  "informant.birthYear",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.ethnicity",
  "informant.religion",
  "informant.occupation",
  "informant.identityNo",
  "informant.identityIssuedDay",
  "informant.identityIssuedMonth",
  "informant.identityIssuedYear",
  "informant.identityIssuedPlace",
  "informant.permanentAddress",
  "informant.temporaryAddress",
  "informant.currentAddress",
  "informant.phone",
  "informant.representedOrganization",
  "informant.signerName",
  "receiver.signerName",
  "recipients.archiveLine",
  "reception.startedAtTimeText",
  "reception.startedAtDay",
  "reception.startedAtMonth",
  "reception.startedAtYear",
  "reception.locationName",
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  "reception.endedAtTimeText",
  "reception.endedAtDay",
  "reception.endedAtMonth",
  "reception.endedAtYear",
];

const EXPECTED_BM001_REQUIRED_FIELD_PATHS = [
  "document.issuePlaceDateLine",
  "reception.startedAtTimeText",
  "reception.startedAtDay",
  "reception.startedAtMonth",
  "reception.startedAtYear",
  "reception.locationName",
  "receiver.fullName",
  "receiver.positionTitle",
  "receiver.departmentName",
  "informant.fullName",
  "informant.genderLabel",
  "informant.birthYear",
  "informant.placeOfBirth",
  "informant.nationality",
  "informant.identityNo",
  "informant.currentAddress",
  "crimeReport.content",
  "crimeReport.attachedItemsDescription",
  "reception.endedAtTimeText",
  "reception.endedAtDay",
  "reception.endedAtMonth",
  "reception.endedAtYear",
  "informant.signerName",
  "receiver.signerName",
  "recipients.archiveLine",
];

/**
 * Pull the BM001_FIELD_PATHS / BM001_REQUIRED_FIELD_PATHS / etc. arrays
 * out of the profile source. We only need the dot-paths and counts so a
 * simple regex capture is sufficient and avoids a TS loader.
 */
function extractPaths(source, label) {
  const re = new RegExp(
    `const\\s+${label}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`,
  );
  const m = source.match(re);
  assert.ok(m, `${label} const-array must be declared`);
  const literals = Array.from(m[1].matchAll(/["']([^"']+)["']/g)).map(
    (mm) => mm[1],
  );
  return literals;
}

function countStringLiterals(source, label) {
  // Matches array literal entries that open with a quoted string —
  // covers both `[ "a", "b" ]` and `[ "a","b"]` shapes.
  return extractPaths(source, label);
}

function extractBm001NotesStatusFromExtract() {
  const json = JSON.parse(readFileSync(EXTRACT_JSON, "utf8"));
  const form = json.forms?.find?.(
    (f) => f && f.code === "BM-001",
  );
  // The verified extractor stores notes status at
  // `coverage.notes` (e.g. "NO_NOTES_WITH_EVIDENCE" / "PASS").
  return form?.coverage?.notes ?? null;
}

/**
 * Extract the literal contents of a `const <name> = { ... } as const`
 * declaration block. Used to scope demo-block assertions.
 */
function extractObjectBlock(source, label) {
  const re = new RegExp(
    `const\\s+${label}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s+as\\s+const`,
  );
  const m = source.match(re);
  return m ? m[1] : null;
}

describe("BM-001 runtime-readiness guard", () => {
  it("1. BM-001 profile file exists and self-registers", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    assert.match(
      src,
      /registerFormFlightProfile\(BM001_FORM_FLIGHT_PROFILE\)/,
      "BM-001 profile must self-register",
    );
  });

  it("2. BM-001 declares runtimeReady: true", () => {
    const src = readFileSync(BM001_PATH, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.match(
      src,
      /runtimeReady:\s*true/,
      "BM-001 must declare runtimeReady: true",
    );
  });

  it("3. BM-001 declares profileStatus: \"runtime-ready\"", () => {
    const src = readFileSync(BM001_PATH, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.match(
      src,
      /profileStatus:\s*"runtime-ready"/,
      'BM-001 must declare profileStatus: "runtime-ready"',
    );
  });

  it("4. BM-001 fieldPaths length is 39", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    const paths = countStringLiterals(src, "BM001_FIELD_PATHS");
    assert.equal(
      paths.length,
      39,
      `expected 39 BM001_FIELD_PATHS entries, got ${paths.length}`,
    );
  });

  it("5. BM-001 fieldPaths match the locked contract canonical order", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    const paths = countStringLiterals(src, "BM001_FIELD_PATHS");
    assert.deepEqual(
      paths,
      EXPECTED_BM001_FIELD_PATHS,
      "BM001_FIELD_PATHS must match the locked contract order (39 entries)",
    );
  });

  it("6. BM-001 requiredFieldPaths is a subset of fieldPaths and deliberate", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    const all = countStringLiterals(src, "BM001_FIELD_PATHS");
    const required = countStringLiterals(
      src,
      "BM001_REQUIRED_FIELD_PATHS",
    );
    assert.ok(
      required.length > 0,
      "BM-001 must declare at least one requiredFieldPath",
    );
    for (const path of required) {
      assert.ok(
        all.includes(path),
        `${path} must be in BM001_FIELD_PATHS`,
      );
    }
    // Drift guard: the UI's optional set (per PHASE 4 reconciliation)
    // must NOT be marked required in the profile.
    const OPTIONAL_PATHS = [
      "informant.phone",
      "informant.temporaryAddress",
      "informant.representedOrganization",
      "informant.identityIssuedDay",
      "informant.identityIssuedMonth",
      "informant.identityIssuedYear",
      "informant.birthDay",
      "informant.birthMonth",
      "informant.ethnicity",
      "informant.religion",
      "informant.occupation",
    ];
    for (const opt of OPTIONAL_PATHS) {
      assert.ok(
        !required.includes(opt),
        `${opt} must remain optional (not in requiredFieldPaths)`,
      );
    }
    // Sanity: required list matches what the phase prompt mandates.
    assert.deepEqual(
      required,
      EXPECTED_BM001_REQUIRED_FIELD_PATHS,
      "BM001_REQUIRED_FIELD_PATHS must match the prompt-specified canonical list",
    );
  });

  it("7. BM-001 demo is non-empty and bug-free", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    const demoBlock = extractObjectBlock(src, "BM001_DEMO");
    assert.ok(
      demoBlock !== null,
      "BM001_DEMO must be declared as a const object",
    );
    // Demo bug guards — see PHASE 3 §BM001_DEMO.
    // Scope to the demo block so the forbiddenText + staleFallbacks
    // declarations elsewhere in the profile do NOT trip this check
    // (those are guards AGAINST the bug, not the bug itself).
    assert.ok(
      !/Ông\s+ cung cấp/.test(demoBlock),
      'BM001_DEMO must not contain the legacy "Ông  cung cấp" bug',
    );
    assert.ok(
      /["']Trần Văn Bình["']/.test(demoBlock),
      "BM001_DEMO must include the synthetic informant name",
    );
    assert.ok(
      /["']Nguyễn Thị Mai["']/.test(demoBlock),
      "BM001_DEMO must include the synthetic receiver name",
    );
    assert.ok(
      !/["']Nguyễn Thị Hồng Hạnh["']/.test(demoBlock),
      "BM001_DEMO must not reuse the legacy receiver-name-as-signer fallback",
    );
    assert.ok(
      !/\{\{/.test(demoBlock),
      "BM001_DEMO must not contain literal '{{' template placeholders",
    );
    assert.ok(
      !/\}\}/.test(demoBlock),
      "BM001_DEMO must not contain literal '}}' template placeholders",
    );
  });

  it("8. BM-001 summaryLines is non-empty (>= 6)", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    const m = src.match(/const\s+BM001_SUMMARY_LINES\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
    assert.ok(m, "BM001_SUMMARY_LINES must be declared");
    const lineEntries = (m[1].match(/\{\s*label:\s*["'][^"']+["']/g) || []).length;
    assert.ok(
      lineEntries >= 6,
      `BM001_SUMMARY_LINES must have >=6 entries (got ${lineEntries})`,
    );
  });

  it("9. BM-001 acceptance.requiredText is non-empty and contains BM-001 anchors", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    assert.match(src, /const\s+BM001_ACCEPTANCE\s*=\s*\{/);
    assert.match(src, /requiredText:\s*\[/);
    const REQUIRED_ANCHORS = [
      "BIÊN BẢN",
      "Tiếp nhận nguồn tin về tội phạm",
      "Căn cứ các điều 133, 144, 145 và 146 của Bộ luật Tố tụng hình sự",
      "I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM",
      "II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO",
      "Việc tiếp nhận nguồn tin về tội phạm kết thúc",
      "NGƯỜI CUNG CẤP",
      "NGƯỜI TIẾP NHẬN",
    ];
    for (const anchor of REQUIRED_ANCHORS) {
      const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`["']${esc}["']`);
      assert.match(
        src,
        re,
        `BM001_ACCEPTANCE.requiredText must include "${anchor}"`,
      );
    }
    // Demo-name anchors must use the SAME names as BM001_DEMO.
    assert.match(src, /["']Nguyễn Thị Mai["']/);
    assert.match(src, /["']Trần Văn Bình["']/);
  });

  it("10. BM-001 acceptance.forbiddenText contains legacy bug tokens", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    assert.match(src, /forbiddenText:\s*\[/);
    const FORBIDDEN = [
      "{{",
      "}}",
      "Ông  cung cấp",
      "undefined",
      "null",
      "[object Object]",
    ];
    for (const token of FORBIDDEN) {
      const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`["']${esc}["']`);
      assert.match(
        src,
        re,
        `BM001_ACCEPTANCE.forbiddenText must include "${token}"`,
      );
    }
  });

  it("11. BM-001 profile does not import runtime adapters (registry purity)", () => {
    const src = readFileSync(BM001_PATH, "utf8");
    assert.ok(
      !/from\s*["'].*template-runtime-adapter["']/.test(src),
      "BM-001 must not import template-runtime-adapter",
    );
    assert.ok(
      !/from\s*["'].*generated-document-adapter["']/.test(src),
      "BM-001 must not import generated-document-adapter",
    );
  });

  it("12. BM-171 still declares runtime-ready flags", () => {
    const src = readFileSync(BM171_PATH, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.match(src, /runtimeReady:\s*true/);
    assert.match(src, /profileStatus:\s*"runtime-ready"/);
  });

  it("13. BM-171 still self-registers", () => {
    const src = readFileSync(BM171_PATH, "utf8");
    assert.match(
      src,
      /registerFormFlightProfile\(BM171_FORM_FLIGHT_PROFILE\)/,
    );
  });

  it("14. No auto-generated skeleton declares runtimeReady: true", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    for (const f of files) {
      if (RUNTIME_READY_FILES.has(f)) continue;
      const src = readFileSync(join(PROFILE_DIR, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.ok(
        !/runtimeReady:\s*true/.test(src),
        `${f} must not set runtimeReady: true`,
      );
      assert.ok(
        !/profileStatus:\s*"runtime-ready"/.test(src),
        `${f} must not set profileStatus: "runtime-ready"`,
      );
    }
  });

  it("15. BM-001 notes status remains NO_NOTES_WITH_EVIDENCE", () => {
    const status = extractBm001NotesStatusFromExtract();
    assert.equal(
      status,
      "NO_NOTES_WITH_EVIDENCE",
      `expected BM-001 notesStatus NO_NOTES_WITH_EVIDENCE, got ${status}`,
    );
    // Belt-and-braces: the BM-001 profile must not have grown an
    // explicit notes section.
    const src = readFileSync(BM001_PATH, "utf8");
    assert.ok(
      !/notesSection/i.test(src),
      "BM-001 profile must not introduce a notesSection (NO_NOTES_WITH_EVIDENCE)",
    );
  });
});
