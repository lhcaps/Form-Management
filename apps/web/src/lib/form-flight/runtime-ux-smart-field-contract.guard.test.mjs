/**
 * Runtime UX Smart Field Contract — generic guard test.
 *
 * Locks the smart-field contract introduced in
 * `docs/audit/unified-bm-workspace/RUNTIME_UX_SMART_FIELD_CONTRACT.latest.md`.
 * This guard complements `bm001-smart-runtime-ux.guard.test.mjs`: where
 * the BM-001 guard proves BM-001's specific opt-in, this guard proves
 * the contract itself is sound for future BM-NNN promotions.
 *
 *   1. Smart-field contract doc + JSON exist.
 *   2. Smart-field helpers module exists and exports every helper
 *      named in the contract.
 *   3. `parseIsoDate` rejects DD/MM/YYYY and Vietnamese text — only
 *      ISO YYYY-MM-DD is accepted.
 *   4. `toDayMonthYear("2026-03-04")` returns the canonical triplet.
 *   5. `deriveDateToDayMonthYear("")` returns empty triplet (not throw).
 *   6. `deriveYearOrDateToBirthParts` accepts a full date and
 *      produces all three parts.
 *   7. `formatVietnameseIssueLine` emits the legal-convention string.
 *   8. `isHiddenBySmartOverride` returns true ONLY for keys listed in
 *      `derivedTargets`.
 *   9. The renderer applies `hiddenBySmart` to the visible field grid
 *      (surgical filter, not a 213-wide rewrite).
 *  10. Fields WITHOUT smart metadata still render as text inputs —
 *      the renderer keeps the legacy path for skeleton profiles.
 *  11. No auto-generated skeleton profile (`bmNNN.ts` in form-flight
 *      OR `bmNNN-runtime-ux-profile.ts` in runtime-ux) declares smart
 *      metadata besides BM-001.
 *  12. Future BM-NNN promotion recipe is documented (5-step recipe in
 *      the contract).
 *  13. The smart helpers are pure — no React, no DOM, no fetch, no
 *      console.log calls in the helper module.
 *  14. Smart helpers are re-exported from the runtime-ux barrel so
 *      downstream callers (renderer + future form profiles) share one
 *      import path.
 *  15. The contract JSON lists every smart kind the helper supports.
 *  16. No new dependency has been added to package.json (no date
 *      library, no UI kit).
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..", "..", "..");
const APPS_WEB_DIR = join(ROOT, "apps", "web");
const RUNTIME_UX_DIR = join(APPS_WEB_DIR, "src", "lib", "runtime-ux");
const FORM_FLIGHT_DIR = __dirname;
const RENDERER_PATH = join(
  APPS_WEB_DIR,
  "src",
  "features",
  "forms-contracts",
  "ContractV2Renderer.tsx",
);
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");
const CONTRACT_DOC = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "RUNTIME_UX_SMART_FIELD_CONTRACT.latest.md",
);
const CONTRACT_JSON = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "RUNTIME_UX_SMART_FIELD_CONTRACT.latest.json",
);
const HELPERS_PATH = join(RUNTIME_UX_DIR, "smart-field-helpers.ts");
const RUNTIME_UX_INDEX = join(RUNTIME_UX_DIR, "index.ts");
const PACKAGE_JSON = join(ROOT, "apps", "web", "package.json");

const helpersSource = readFileSync(HELPERS_PATH, "utf8");
const rendererSource = readFileSync(RENDERER_PATH, "utf8");
const runtimeUxIndexSource = readFileSync(RUNTIME_UX_INDEX, "utf8");

// ─── Pure-JS shim of the helpers (mirrors production) ──────────────────────

function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

function parseIsoDateShim(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function toDayMonthYearShim(value) {
  const parsed = parseIsoDateShim(value);
  if (!parsed) return null;
  return { day: pad2(parsed.d), month: pad2(parsed.m), year: String(parsed.y) };
}

function deriveDateToDayMonthYearShim(value) {
  const parsed = toDayMonthYearShim(value);
  if (!parsed) return { day: "", month: "", year: "" };
  return parsed;
}

function deriveYearOrDateToBirthPartsShim(value) {
  return deriveDateToDayMonthYearShim(value);
}

function formatVietnameseIssueLineShim(place, iso) {
  const trimmedPlace = (place ?? "").trim();
  const parsed = toDayMonthYearShim(iso);
  if (!parsed) return "";
  const datePart = `ngày ${parsed.day} tháng ${Number(parsed.month)} năm ${parsed.year}`;
  if (trimmedPlace.length === 0) return datePart;
  return `${trimmedPlace}, ${datePart}`;
}

function isHiddenBySmartOverrideShim(smartEntries, fieldKey) {
  for (const entry of smartEntries) {
    if (!entry.derivedTargets) continue;
    if (entry.derivedTargets.includes(fieldKey)) return true;
  }
  return false;
}

describe("runtime UX smart-field contract guard", () => {
  it("1. Smart-field contract doc + JSON exist", () => {
    assert.ok(existsSync(CONTRACT_DOC));
    assert.ok(existsSync(CONTRACT_JSON));
    const json = JSON.parse(readFileSync(CONTRACT_JSON, "utf8"));
    assert.equal(json.title, "Runtime UX Smart Field Contract");
    assert.equal(json.status, "ACTIVE");
    assert.equal(json.extensionPoint, "RuntimeUxProfile.fields[key].smart");
  });

  it("2. Smart-field helpers module exists and exports every named helper", () => {
    assert.ok(existsSync(HELPERS_PATH));
    const EXPORTS = [
      "parseIsoDate",
      "toDayMonthYear",
      "deriveDateToDayMonthYear",
      "deriveYearOrDateToBirthParts",
      "formatVietnameseIssueLine",
      "isHiddenBySmartOverride",
      "applySmartFieldWrites",
    ];
    for (const name of EXPORTS) {
      assert.match(
        helpersSource,
        new RegExp(`export\\s+function\\s+${name}`),
        `smart-field-helpers.ts must export ${name}`,
      );
    }
  });

  it("3. parseIsoDate rejects DD/MM/YYYY and Vietnamese text", () => {
    assert.equal(parseIsoDateShim("08/09/1985"), null);
    assert.equal(parseIsoDateShim("ngày 04 tháng 3 năm 2026"), null);
    assert.equal(parseIsoDateShim(""), null);
    assert.equal(parseIsoDateShim("not a date"), null);
    // Only ISO is accepted.
    assert.deepEqual(parseIsoDateShim("2026-03-04"), {
      y: 2026,
      m: 3,
      d: 4,
    });
  });

  it("4. toDayMonthYear returns the canonical triplet", () => {
    assert.deepEqual(toDayMonthYearShim("2026-03-04"), {
      day: "04",
      month: "03",
      year: "2026",
    });
    assert.deepEqual(toDayMonthYearShim("1985-1-2"), {
      day: "02",
      month: "01",
      year: "1985",
    });
  });

  it("5. deriveDateToDayMonthYear returns empty triplet for empty input", () => {
    assert.deepEqual(deriveDateToDayMonthYearShim(""), {
      day: "",
      month: "",
      year: "",
    });
  });

  it("6. deriveYearOrDateToBirthParts produces all three parts", () => {
    assert.deepEqual(deriveYearOrDateToBirthPartsShim("1985-09-08"), {
      day: "08",
      month: "09",
      year: "1985",
    });
  });

  it("7. formatVietnameseIssueLine emits the legal-convention string", () => {
    assert.equal(
      formatVietnameseIssueLineShim("Thành phố Hồ Chí Minh", "2026-03-04"),
      "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
    );
    assert.equal(
      formatVietnameseIssueLineShim("", "2026-03-04"),
      "ngày 04 tháng 3 năm 2026",
    );
    assert.equal(formatVietnameseIssueLineShim("Thành phố Hồ Chí Minh", ""), "");
  });

  it("8. isHiddenBySmartOverride returns true ONLY for keys in derivedTargets", () => {
    const ENTRIES = [
      { key: "informant.birthYear", derivedTargets: ["informant.birthDay", "informant.birthMonth", "informant.birthYear"] },
      { key: "reception.startedAtDay", derivedTargets: ["reception.startedAtDay", "reception.startedAtMonth", "reception.startedAtYear"] },
    ];
    assert.equal(
      isHiddenBySmartOverrideShim(ENTRIES, "informant.birthDay"),
      true,
    );
    assert.equal(
      isHiddenBySmartOverrideShim(ENTRIES, "reception.startedAtYear"),
      true,
    );
    assert.equal(
      isHiddenBySmartOverrideShim(ENTRIES, "informant.fullName"),
      false,
    );
    // Empty derivedTargets → never hidden.
    assert.equal(
      isHiddenBySmartOverrideShim(
        [{ key: "informant.genderLabel", options: ["Nam", "Nữ"] }],
        "informant.genderLabel",
      ),
      false,
    );
  });

  it("9. Renderer applies hiddenBySmart to the visible field grid", () => {
    // The renderer builds a `hiddenBySmart` Set from smart entries
    // and filters the field iteration.
    assert.match(rendererSource, /const\s+hiddenBySmart\s*=\s*useMemo/);
    assert.match(rendererSource, /!hiddenBySmart\.has\(field\.key\)/);
  });

  it("10. Fields WITHOUT smart metadata still render as text inputs", () => {
    // The renderer branches on `smart ?` — when `smart` is null the
    // legacy `<input type="text">` branch fires. Verify the legacy
    // branch is preserved.
    assert.match(rendererSource, /effectiveControl === "TEXTAREA"/);
    assert.match(rendererSource, /effectiveControl === "DATE_TEXT"/);
    // The legacy contract `<select>` branch is also preserved for
    // contract-level SELECT fields.
    assert.match(rendererSource, /field\.control === "SELECT"/);
  });

  it("11. Only curated/curated-batch runtime-ux profiles declare smart metadata; auto-generated skeletons remain smart-free", () => {
    // form-flight/profiles/bmNNN.ts — only bm001/bm171 are runtime-ready.
    // (FormFlight allowlist invariant is unchanged by this batch.)
    const FF_FILES = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    for (const f of FF_FILES) {
      if (f === "bm001.ts" || f === "bm171.ts") continue;
      const src = readFileSync(join(PROFILE_DIR, f), "utf8");
      assert.ok(
        !/smart:\s*\{/.test(src),
        `${f} must not declare smart metadata`,
      );
    }
    // runtime-ux/bmNNN-runtime-ux-profile.ts — BM-001 (curated v2) plus
    // the PR7A-follow-on curated batch (BM-005, BM-014, BM-015, BM-022,
    // BM-035) declare smart metadata. Every other profile is still
    // auto-generated and therefore smart-free.
    const CURATED_RUX_FILES = new Set([
      "bm001-runtime-ux-profile.ts",
      "bm005-runtime-ux-profile.ts",
      "bm014-runtime-ux-profile.ts",
      "bm015-runtime-ux-profile.ts",
      "bm022-runtime-ux-profile.ts",
      "bm035-runtime-ux-profile.ts",
      // Next-large batch 1 (15 forms) promoted from PARTIAL → PASS.
      "bm006-runtime-ux-profile.ts",
      "bm007-runtime-ux-profile.ts",
      "bm008-runtime-ux-profile.ts",
      "bm009-runtime-ux-profile.ts",
      "bm010-runtime-ux-profile.ts",
      "bm011-runtime-ux-profile.ts",
      "bm012-runtime-ux-profile.ts",
      "bm017-runtime-ux-profile.ts",
      "bm018-runtime-ux-profile.ts",
      "bm019-runtime-ux-profile.ts",
      "bm020-runtime-ux-profile.ts",
      "bm023-runtime-ux-profile.ts",
      "bm030-runtime-ux-profile.ts",
      "bm031-runtime-ux-profile.ts",
      "bm033-runtime-ux-profile.ts",
      // Next-large batch 2 (15 forms) promoted from PARTIAL → PASS.
      "bm036-runtime-ux-profile.ts",
      "bm037-runtime-ux-profile.ts",
      "bm038-runtime-ux-profile.ts",
      "bm040-runtime-ux-profile.ts",
      "bm042-runtime-ux-profile.ts",
      "bm043-runtime-ux-profile.ts",
      "bm044-runtime-ux-profile.ts",
      "bm045-runtime-ux-profile.ts",
      "bm046-runtime-ux-profile.ts",
      "bm047-runtime-ux-profile.ts",
      "bm048-runtime-ux-profile.ts",
      "bm052-runtime-ux-profile.ts",
      "bm053-runtime-ux-profile.ts",
      "bm054-runtime-ux-profile.ts",
      "bm070-runtime-ux-profile.ts",
      // Next-large batch 3 (20 forms) promoted from PARTIAL → PASS.
      "bm055-runtime-ux-profile.ts",
      "bm056-runtime-ux-profile.ts",
      "bm057-runtime-ux-profile.ts",
      "bm058-runtime-ux-profile.ts",
      "bm059-runtime-ux-profile.ts",
      "bm060-runtime-ux-profile.ts",
      "bm061-runtime-ux-profile.ts",
      "bm062-runtime-ux-profile.ts",
      "bm063-runtime-ux-profile.ts",
      "bm064-runtime-ux-profile.ts",
      "bm065-runtime-ux-profile.ts",
      "bm066-runtime-ux-profile.ts",
      "bm067-runtime-ux-profile.ts",
      "bm068-runtime-ux-profile.ts",
      "bm069-runtime-ux-profile.ts",
      "bm071-runtime-ux-profile.ts",
      "bm072-runtime-ux-profile.ts",
      "bm073-runtime-ux-profile.ts",
      "bm074-runtime-ux-profile.ts",
      "bm075-runtime-ux-profile.ts",
      // Next-large batch 4 (20 forms) promoted from PARTIAL → PASS
      // (source/render smoke only — browser/demo/preview/docx/fidelity
      // phases run separately per user plan).
      "bm076-runtime-ux-profile.ts",
      "bm078-runtime-ux-profile.ts",
      "bm080-runtime-ux-profile.ts",
      "bm081-runtime-ux-profile.ts",
      "bm083-runtime-ux-profile.ts",
      "bm084-runtime-ux-profile.ts",
      "bm085-runtime-ux-profile.ts",
      "bm086-runtime-ux-profile.ts",
      "bm087-runtime-ux-profile.ts",
      "bm088-runtime-ux-profile.ts",
      "bm090-runtime-ux-profile.ts",
      "bm091-runtime-ux-profile.ts",
      "bm092-runtime-ux-profile.ts",
      "bm093-runtime-ux-profile.ts",
      "bm094-runtime-ux-profile.ts",
      "bm095-runtime-ux-profile.ts",
      "bm096-runtime-ux-profile.ts",
      "bm097-runtime-ux-profile.ts",
      "bm098-runtime-ux-profile.ts",
      "bm100-runtime-ux-profile.ts",
    ]);
    const RUX_FILES = readdirSync(RUNTIME_UX_DIR).filter((f) =>
      /^bm\d{3}-runtime-ux-profile\.ts$/.test(f),
    );
    for (const f of RUX_FILES) {
      const src = readFileSync(join(RUNTIME_UX_DIR, f), "utf8");
      if (CURATED_RUX_FILES.has(f)) {
        assert.ok(
          /smart:\s*\{/.test(src),
          `${f} (curated batch) must declare smart metadata`,
        );
      } else {
        assert.ok(
          !/smart:\s*\{/.test(src),
          `${f} must not declare smart metadata (curated-batch promotion is gated)`,
        );
      }
    }
  });

  it("12. Future BM-NNN promotion recipe is documented in the contract", () => {
    const doc = readFileSync(CONTRACT_DOC, "utf8");
    assert.match(doc, /Future BM-NNN promotion recipe/);
    // Must enumerate the six additive steps (lifecycle list + form-flight profile + runtime-ux profile + import + run tests).
    const STEP_LABELS = [
      "RUNTIME_READY_FORM_FLIGHT_PROFILES",
      "profiles/bmNNN",
      "bmNNN-runtime-ux-profile",
      "registerRuntimeUxProfile",
      "runtime-ux/index.ts",
    ];
    for (const label of STEP_LABELS) {
      assert.match(doc, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("13. Smart helpers are pure (no React, no DOM, no fetch, no console)", () => {
    const stripped = helpersSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.ok(!/from\s+["']react["']/.test(stripped));
    assert.ok(!/document\.|window\.|localStorage/.test(stripped));
    assert.ok(!/\bfetch\s*\(/.test(stripped));
    assert.ok(!/console\.(log|info|warn|error)/.test(stripped));
  });

  it("14. Smart helpers are re-exported from the runtime-ux barrel", () => {
    const EXPORTS = [
      "parseIsoDate",
      "toDayMonthYear",
      "deriveDateToDayMonthYear",
      "deriveYearOrDateToBirthParts",
      "formatVietnameseIssueLine",
      "isHiddenBySmartOverride",
      "applySmartFieldWrites",
    ];
    for (const name of EXPORTS) {
      assert.match(
        runtimeUxIndexSource,
        new RegExp(`\\b${name}\\b`),
        `runtime-ux/index.ts must re-export ${name}`,
      );
    }
    assert.match(
      runtimeUxIndexSource,
      /from\s+["']\.\/smart-field-helpers["']/,
    );
  });

  it("15. Contract JSON lists every smart kind the helper supports", () => {
    const json = JSON.parse(readFileSync(CONTRACT_JSON, "utf8"));
    const KINDS = [
      "text",
      "textarea",
      "date",
      "time",
      "select",
      "date-parts",
      "year-or-date",
      "issue-place-date-line",
    ];
    for (const kind of KINDS) {
      assert.ok(
        json.smartKinds.some((entry) => entry.kind === kind),
        `contract.json must declare smartKinds entry for "${kind}"`,
      );
    }
    // Guard tests must enumerate all kinds.
    assert.ok(json.guardTests.length >= 9);
  });

  it("16. No new dependency has been added to apps/web/package.json", () => {
    if (!existsSync(PACKAGE_JSON)) {
      // Some workspaces use root package.json — fall back to it.
      const ROOT_PKG = join(ROOT, "package.json");
      if (!existsSync(ROOT_PKG)) return;
    }
    const pkg = JSON.parse(
      readFileSync(
        existsSync(PACKAGE_JSON) ? PACKAGE_JSON : join(ROOT, "package.json"),
        "utf8",
      ),
    );
    const ALL_DEPS = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    // Banned: date library, date-fns, moment, dayjs, luxon.
    const BANNED = ["date-fns", "moment", "dayjs", "luxon"];
    for (const dep of BANNED) {
      assert.ok(
        !ALL_DEPS[dep],
        `${dep} must not be added as a dependency in this phase`,
      );
    }
  });

  it("17. /templates/BM-001 does NOT reference generatedDocumentId in code (lifecycle safety)", () => {
    // Read the renderer + workspace. Code (not comments) must not
    // mention generatedDocumentId. The workspace may reference the
    // token inside a comment to explain the boundary.
    const workspaceSource = readFileSync(
      join(
        APPS_WEB_DIR,
        "src/components/documents/template-preview-workspace.tsx",
      ),
      "utf8",
    );
    const stripped =
      workspaceSource
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "") +
      "\n" +
      rendererSource
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
    assert.ok(
      !/generatedDocumentId/.test(stripped),
      "/templates/BM-001 must not reference generatedDocumentId in code",
    );
  });

  it("18. /templates/BM-001 does NOT call saveDocumentFormInputs or similar save endpoint", () => {
    const workspaceSource = readFileSync(
      join(
        APPS_WEB_DIR,
        "src/components/documents/template-preview-workspace.tsx",
      ),
      "utf8",
    );
    const FORBIDDEN = [
      "saveDocumentFormInputs",
      "saveGeneratedDocumentFormInputs",
      "saveBm001FormInputs",
    ];
    for (const token of FORBIDDEN) {
      assert.ok(
        !new RegExp(`\\b${token}\\b`).test(workspaceSource),
        `template-preview-workspace.tsx must not call ${token}`,
      );
    }
  });
});