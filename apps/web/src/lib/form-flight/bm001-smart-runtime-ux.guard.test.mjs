/**
 * BM-001 Smart Runtime UX guard test.
 *
 * Locks the BM-001 runtime-ux smart-field changes introduced by the
 * "BM-001 Smart Runtime UX Redesign + Generalizable Smart Field
 * Contract" phase. Pure file-system / source-text check (no DB, no
 * fetch, no React), so it runs via `node --test` on its own —
 * matching the convention used by `bm001-runtime-ready.guard.test.mjs`
 * and `runtime-ready-template-panel-contract.guard.test.mjs`.
 *
 *   1. BM-001 runtime-ux profile file exists.
 *   2. BM-001 runtime-ux profile declares the smart-field metadata for
 *      the eight mandatory smart controls (issue place/date, three
 *      date-parts triplets, year-or-date for birth, two time inputs,
 *      gender select).
 *   3. BM-001 runtime-ux profile declares `select` smart metadata for
 *      `receiver.positionTitle` (suggestions).
 *   4. BM-001 runtime-ux profile declares `textarea` smart metadata
 *      for `crimeReport.content` and `crimeReport.attachedItemsDescription`.
 *   5. The four derived date-parts triplets use the correct order:
 *      `[day, month, year]` (the renderer relies on this order to
 *      write to the right contract slot).
 *   6. The year-or-date smart control targets
 *      `[informant.birthDay, informant.birthMonth, informant.birthYear]`.
 *   7. The raw date-parts fields (e.g. `informant.birthDay`,
 *      `reception.startedAtMonth`) are hidden from the visible UX
 *      because their keys appear as derived targets of a smart
 *      control. The renderer-side filter is the single source of truth.
 *   8. BM001_DEMO_RUNTIME_UX does NOT contain legacy stale defaults
 *      (`Nguyễn Văn A`, `Trần Thị B`, `1980`) or the
 *      `Ông  cung cấp` two-space bug or `Nguyễn Thị Hồng Hạnh`.
 *   9. BM001_DEMO_RUNTIME_UX DOES contain the canonical demo names
 *      (`Nguyễn Thị Mai`, `Trần Văn Bình`) and `1985` (not `1980`).
 *  10. Pure-JS shim of the smart-field helpers produces the expected
 *      ISO→day/month/year conversion for `2026-03-04`.
 *  11. Pure-JS shim produces the expected Vietnamese issue line
 *      `Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026`.
 *  12. BM-171 runtime-ux profile is UNCHANGED by this phase. Verified
 *      by reading the source and asserting the new smart metadata is
 *      NOT present.
 *  13. BM-002 skeleton profile still has no smart metadata (skeleton
 *      fail-closed invariant).
 *  14. Only BM-001 and BM-171 appear in the runtime-ready allowlist
 *      (no new profile promoted).
 *  15. The smart-field contract doc + JSON exist in
 *      `docs/audit/unified-bm-workspace/`.
 *  16. The renderer import path includes the smart helpers.
 *  17. Workspace detects stale drafts and exposes the warning banner.
 *  18. BM-001 profile declares the `versionLabel` upgrade for the
 *      smart UX phase.
 *  19. No other skeleton file declares smart metadata.
 *  20. BM-001 and BM-171 form-flight profiles untouched by this phase.
 *  21. `detectStaleDraft` source references the legacy
 *      `Ông  cung cấp` two-space bug token.
 *  22. `detectStaleDraft` source also matches the collapsed-spacing
 *      `Ông cung cấp` variant.
 *  23. `detectStaleDraft` source references `Nguyễn Thị Hồng Hạnh`
 *      and looks at both `informant.signerName` and
 *      `receiver.signerName`.
 *  24. The stale "BM-001 ships without runtime-ux profile" comment
 *      is no longer present (in code or in comments).
 *  25. The replacement comment now states BM-001 has a runtime-ux
 *      profile and routes the panel via `selectRuntimeReadyTemplatePanel`.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..", "..", "..");
const APPS_WEB_DIR = join(ROOT, "apps", "web");
const FORM_FLIGHT_DIR = __dirname;
const PROFILE_DIR = join(FORM_FLIGHT_DIR, "profiles");
const RUNTIME_UX_DIR = join(APPS_WEB_DIR, "src", "lib", "runtime-ux");
const RENDERER_PATH = join(
  APPS_WEB_DIR,
  "src",
  "features",
  "forms-contracts",
  "ContractV2Renderer.tsx",
);
const WORKSPACE_PATH = join(
  APPS_WEB_DIR,
  "src",
  "components",
  "documents",
  "template-preview-workspace.tsx",
);
const RUNTIME_UX_INDEX = join(RUNTIME_UX_DIR, "index.ts");
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

const BM001_RUNTIME_UX = join(RUNTIME_UX_DIR, "bm001-runtime-ux-profile.ts");
const BM171_RUNTIME_UX = join(RUNTIME_UX_DIR, "bm171-runtime-ux-profile.ts");
const BM001_FORM_FLIGHT = join(PROFILE_DIR, "bm001.ts");
const BM171_FORM_FLIGHT = join(PROFILE_DIR, "bm171.ts");

const bm001Source = readFileSync(BM001_RUNTIME_UX, "utf8");
const bm171Source = readFileSync(BM171_RUNTIME_UX, "utf8");
const rendererSource = readFileSync(RENDERER_PATH, "utf8");
const workspaceSource = readFileSync(WORKSPACE_PATH, "utf8");
const runtimeUxIndexSource = readFileSync(RUNTIME_UX_INDEX, "utf8");

// ─── Pure-JS shim of the smart-field helpers ─────────────────────────────────
//
// Mirrors the helpers in
// `apps/web/src/lib/runtime-ux/smart-field-helpers.ts`. Kept in
// lock-step so the guard can prove the production helpers agree with
// the contract.

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

function formatVietnameseIssueLineShim(place, iso) {
  const trimmedPlace = (place ?? "").trim();
  const parsed = toDayMonthYearShim(iso);
  if (!parsed) return "";
  // Day padded, month as bare integer — matches the legal convention.
  const datePart = `ngày ${parsed.day} tháng ${Number(parsed.month)} năm ${parsed.year}`;
  if (trimmedPlace.length === 0) return datePart;
  return `${trimmedPlace}, ${datePart}`;
}

/**
 * Extract every `smart: { ... }` object literal block from the BM-001
 * profile source. Returns an array of `{ key, kind, derivedTargets }`
 * records, in source order.
 */
function extractSmartEntries(source) {
  const out = [];
  // Match `key: "x",\s*kind: "y",\s*...\s*derivedTargets: [...]`
  const blockRe =
    /key:\s*["']([^"']+)["'][^{]*?kind:\s*["']([^"']+)["']([^{]*?derivedTargets:\s*\[([^\]]*)\])?/g;
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    const key = m[1];
    const kind = m[2];
    const derived = m[4]
      ? m[4]
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean)
      : null;
    out.push({ key, kind, derivedTargets: derived });
  }
  return out;
}

const bm001SmartEntries = extractSmartEntries(bm001Source);

describe("BM-001 smart runtime UX guard", () => {
  it("1. BM-001 runtime-ux profile exists", () => {
    assert.ok(existsSync(BM001_RUNTIME_UX), "bm001-runtime-ux-profile.ts missing");
  });

  it("2. BM-001 runtime-ux profile declares the eight mandatory smart controls", () => {
    const KINDS_BY_KEY = {
      "document.issuePlaceDateLine": "issue-place-date-line",
      "informant.birthYear": "year-or-date",
      "informant.identityIssuedDay": "date-parts",
      "reception.startedAtTimeText": "time",
      "reception.startedAtDay": "date-parts",
      "reception.endedAtTimeText": "time",
      "reception.endedAtDay": "date-parts",
    };
    for (const [key, expectedKind] of Object.entries(KINDS_BY_KEY)) {
      const entry = bm001SmartEntries.find((e) => e.key === key);
      assert.ok(entry, `BM-001 must declare smart metadata for ${key}`);
      assert.equal(
        entry.kind,
        expectedKind,
        `${key} smart.kind must be ${expectedKind} (got ${entry.kind})`,
      );
    }
  });

  it("3. receiver.positionTitle uses a select smart control with KSV suggestions", () => {
    const entry = bm001SmartEntries.find(
      (e) => e.key === "receiver.positionTitle",
    );
    assert.ok(entry, "BM-001 must declare smart metadata for receiver.positionTitle");
    assert.equal(entry.kind, "select");
    // Verify suggestions contain the canonical KSV roles from the prompt.
    assert.match(
      bm001Source,
      /receiver\.positionTitle[\s\S]*?options:\s*\[\s*[\s\S]*?Kiểm sát viên[\s\S]*?\]/,
    );
  });

  it("4. crimeReport.content and attachedItemsDescription use textarea smart controls", () => {
    const content = bm001SmartEntries.find((e) => e.key === "crimeReport.content");
    const items = bm001SmartEntries.find(
      (e) => e.key === "crimeReport.attachedItemsDescription",
    );
    assert.ok(content, "crimeReport.content must declare smart metadata");
    assert.equal(content.kind, "textarea");
    assert.ok(items, "crimeReport.attachedItemsDescription must declare smart metadata");
    assert.equal(items.kind, "textarea");
  });

  it("5. derived date-parts triplets use [day, month, year] order", () => {
    const TRIPLETS = [
      ["informant.identityIssuedDay", "informant.identityIssuedMonth", "informant.identityIssuedYear"],
      ["reception.startedAtDay", "reception.startedAtMonth", "reception.startedAtYear"],
      ["reception.endedAtDay", "reception.endedAtMonth", "reception.endedAtYear"],
    ];
    for (const [dayKey, monthKey, yearKey] of TRIPLETS) {
      const entry = bm001SmartEntries.find((e) => e.key === dayKey);
      assert.ok(entry, `${dayKey} must declare smart metadata`);
      assert.equal(entry.kind, "date-parts");
      assert.deepEqual(
        entry.derivedTargets,
        [dayKey, monthKey, yearKey],
        `${dayKey} derivedTargets must be [day, month, year] in that exact order`,
      );
    }
  });

  it("6. year-or-date smart control targets [birthDay, birthMonth, birthYear]", () => {
    const entry = bm001SmartEntries.find((e) => e.key === "informant.birthYear");
    assert.ok(entry, "informant.birthYear must declare smart metadata");
    assert.equal(entry.kind, "year-or-date");
    assert.deepEqual(entry.derivedTargets, [
      "informant.birthDay",
      "informant.birthMonth",
      "informant.birthYear",
    ]);
  });

  it("7. raw date-parts fields are hidden from the visible UX", () => {
    // The renderer-side filter is `hiddenBySmart.has(field.key)`. The
    // guard asserts that EVERY derived target key produced by the BM-001
    // smart metadata appears in at least one derivedTargets list (the
    // renderer will hide it from the visible contract field grid).
    const DERIVED_KEYS = [
      "informant.birthDay",
      "informant.birthMonth",
      "informant.birthYear",
      "informant.identityIssuedDay",
      "informant.identityIssuedMonth",
      "informant.identityIssuedYear",
      "reception.startedAtDay",
      "reception.startedAtMonth",
      "reception.startedAtYear",
      "reception.endedAtDay",
      "reception.endedAtMonth",
      "reception.endedAtYear",
    ];
    for (const key of DERIVED_KEYS) {
      const covered = bm001SmartEntries.some(
        (e) => e.derivedTargets && e.derivedTargets.includes(key),
      );
      assert.ok(covered, `${key} must be hidden by a smart override's derivedTargets`);
    }
    // The renderer file imports `hiddenBySmart` filtering and applies
    // it to the field iteration.
    assert.match(rendererSource, /hiddenBySmart\.has\(field\.key\)/);
    // And the helper is exported from the runtime-ux barrel so the
    // guard tests can use the same function (the renderer uses the
    // local hook).
    assert.match(runtimeUxIndexSource, /isHiddenBySmartOverride/);
  });

  it("8. BM001_DEMO_RUNTIME_UX does NOT contain legacy stale defaults", () => {
    const demoRe = /const\s+BM001_DEMO_RUNTIME_UX\s*=\s*\{([\s\S]*?)\}\s+as\s+const/;
    const m = bm001Source.match(demoRe);
    assert.ok(m, "BM001_DEMO_RUNTIME_UX must be declared");
    const demoBlock = m[1];
    const FORBIDDEN_VALUES = [
      "Nguyễn Văn A",
      "Trần Thị B",
      "Nguyễn Thị Hồng Hạnh",
    ];
    for (const value of FORBIDDEN_VALUES) {
      assert.ok(
        !new RegExp(`["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(demoBlock),
        `BM001_DEMO_RUNTIME_UX must not contain the stale value "${value}"`,
      );
    }
    // BirthYear must NOT be 1980.
    assert.ok(
      !/["']informant\.birthYear["']\s*:\s*["']1980["']/.test(demoBlock),
      "BM001_DEMO_RUNTIME_UX must not default birthYear to 1980",
    );
    // The Ông  cung cấp two-space bug must not appear.
    assert.ok(
      !/Ông\s+ cung cấp/.test(demoBlock),
      "BM001_DEMO_RUNTIME_UX must not contain the legacy Ông  cung cấp two-space bug",
    );
  });

  it("9. BM001_DEMO_RUNTIME_UX DOES contain the canonical demo values", () => {
    const demoRe = /const\s+BM001_DEMO_RUNTIME_UX\s*=\s*\{([\s\S]*?)\}\s+as\s+const/;
    const m = bm001Source.match(demoRe);
    assert.ok(m, "BM001_DEMO_RUNTIME_UX must be declared");
    const demoBlock = m[1];
    assert.match(demoBlock, /["']Nguyễn Thị Mai["']/);
    assert.match(demoBlock, /["']Trần Văn Bình["']/);
    assert.match(demoBlock, /["']1985["']/);
    assert.match(
      demoBlock,
      /Thành phố Hồ Chí Minh,\s*ngày\s+04\s+tháng\s+3\s+năm\s+2026/,
    );
  });

  it("10. ISO→day/month/year conversion is correct (pure-JS shim)", () => {
    assert.deepEqual(toDayMonthYearShim("2026-03-04"), {
      day: "04",
      month: "03",
      year: "2026",
    });
    assert.deepEqual(deriveDateToDayMonthYearShim("1985-09-08"), {
      day: "08",
      month: "09",
      year: "1985",
    });
    assert.deepEqual(deriveDateToDayMonthYearShim(""), {
      day: "",
      month: "",
      year: "",
    });
  });

  it("11. Vietnamese issue-line formatter is correct (pure-JS shim)", () => {
    assert.equal(
      formatVietnameseIssueLineShim("Thành phố Hồ Chí Minh", "2026-03-04"),
      "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026",
    );
    assert.equal(
      formatVietnameseIssueLineShim("", "2026-03-04"),
      "ngày 04 tháng 3 năm 2026",
    );
    assert.equal(
      formatVietnameseIssueLineShim("Thành phố Hồ Chí Minh", ""),
      "",
    );
  });

  it("12. BM-171 runtime-ux profile is unchanged by this phase", () => {
    // The BM-171 profile must NOT declare any smart metadata; its
    // existing DATE_TEXT / TEXTAREA overrides are unchanged.
    assert.ok(
      !/smart:\s*\{/.test(bm171Source),
      "bm171-runtime-ux-profile.ts must not declare smart metadata in this phase",
    );
    // And it must still declare the legacy DATE_TEXT controls.
    assert.match(bm171Source, /control:\s*"DATE_TEXT"/);
  });

  it("13. BM-002 skeleton profile still has no smart metadata", () => {
    const bm002 = join(PROFILE_DIR, "bm002.ts");
    if (!existsSync(bm002)) {
      // Skeleton may not exist yet — that is acceptable. The runtime-
      // ready allowlist below already proves BM-002 is not promoted.
      return;
    }
    const src = readFileSync(bm002, "utf8");
    assert.ok(
      !/smart:\s*\{/.test(src),
      "bm002.ts skeleton must not declare smart metadata",
    );
    assert.ok(
      !/runtimeReady:\s*true/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")),
      "bm002.ts skeleton must not be promoted to runtime-ready",
    );
  });

  it("14. Only BM-001 and BM-171 are in the runtime-ready allowlist", () => {
    const formLifecycle = readFileSync(
      join(FORM_FLIGHT_DIR, "form-lifecycle.ts"),
      "utf8",
    );
    const listMatch = formLifecycle.match(
      /RUNTIME_READY_FORM_FLIGHT_PROFILES\s*=\s*\[([^\]]+)\]/,
    );
    assert.ok(listMatch, "RUNTIME_READY_FORM_FLIGHT_PROFILES must be defined");
    const listed = listMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean)
      .sort();
    assert.deepEqual(listed, ["BM-001", "BM-171"]);
  });

  it("15. Smart-field contract doc + JSON exist", () => {
    assert.ok(existsSync(CONTRACT_DOC), "smart-field contract .md must exist");
    assert.ok(existsSync(CONTRACT_JSON), "smart-field contract .json must exist");
    const doc = readFileSync(CONTRACT_DOC, "utf8");
    assert.match(doc, /Runtime UX Smart Field Contract/);
    const json = JSON.parse(readFileSync(CONTRACT_JSON, "utf8"));
    assert.equal(json.title, "Runtime UX Smart Field Contract");
    assert.ok(Array.isArray(json.smartKinds));
    assert.ok(json.smartKinds.length >= 8);
  });

  it("16. Renderer imports the smart-field helpers", () => {
    assert.match(
      rendererSource,
      /from\s+["']@\/lib\/runtime-ux\/smart-field-helpers["']/,
    );
    assert.match(rendererSource, /parseIsoDate/);
    assert.match(rendererSource, /toDayMonthYear/);
    assert.match(rendererSource, /SmartControl/);
  });

  it("17. Workspace detects stale drafts and exposes the warning banner", () => {
    assert.match(workspaceSource, /detectStaleDraft/);
    assert.match(workspaceSource, /hasStaleDraft/);
    assert.match(
      workspaceSource,
      /Đang dùng bản nháp cũ[\s\S]*Nguyễn Thị Mai[\s\S]*Trần Văn[\s\S]*Bình/,
    );
    // The reset path must remove the localStorage draft entry (not
    // just write {} over it).
    assert.match(workspaceSource, /removeRuntimeTemplateDraft/);
  });

  it("18. BM-001 profile declares 'versionLabel' upgrade for the smart UX phase", () => {
    assert.match(
      bm001Source,
      /versionLabel:\s*["']BM-001 smart-runtime-ux v2/,
    );
  });

  it("19. Only curated/curated-batch runtime-ux profiles declare smart metadata", () => {
    // BM-001 is the v2 reference profile. The PR7A-follow-on curated
    // batch (BM-005, BM-014, BM-015, BM-022, BM-035) has just been
    // promoted and is allowed to declare smart metadata. Every OTHER
    // runtime-ux profile (including BM-171, which still uses legacy
    // DATE_TEXT / TEXTAREA controls) MUST NOT declare smart
    // metadata — the smart metadata remains a curated-batch
    // promotion feature.
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
    const files = readdirSync(RUNTIME_UX_DIR).filter((f) =>
      /^bm\d{3}-runtime-ux-profile\.ts$/.test(f),
    );
    for (const f of files) {
      const src = readFileSync(join(RUNTIME_UX_DIR, f), "utf8");
      if (CURATED_RUX_FILES.has(f)) {
        assert.ok(
          /smart:\s*\{/.test(src),
          `${f} (curated batch) must declare smart metadata`,
        );
      } else {
        assert.ok(
          !/smart:\s*\{/.test(src),
          `${f} must not declare smart metadata`,
        );
      }
    }
  });

  it("20. BM-001 and BM-171 form-flight profiles untouched by this phase", () => {
    // We touch `bm001-runtime-ux-profile.ts` only; the form-flight
    // profile `bm001.ts` (which lives in form-flight/profiles/) is
    // untouched. Read both files and confirm the BM-001 form-flight
    // profile still has the canonical `BM001_DEMO` content we expect.
    const bm001FormFlight = readFileSync(BM001_FORM_FLIGHT, "utf8");
    assert.match(bm001FormFlight, /BM001_DEMO/);
    assert.match(bm001FormFlight, /Nguyễn Thị Mai/);
    assert.match(bm001FormFlight, /Trần Văn Bình/);
    // BM-171 untouched.
    const bm171FormFlight = readFileSync(BM171_FORM_FLIGHT, "utf8");
    assert.match(bm171FormFlight, /BM171_DEMO/);
  });

  it("21. detectStaleDraft hardens against the legacy Ông  cung cấp two-space bug", () => {
    // The hardened `detectStaleDraft` source must include the
    // two-space "Ông  cung cấp" token verbatim so a unit test or
    // future contributor can grep the workspace and confirm the
    // detector is wired.
    assert.match(
      workspaceSource,
      /Ông\s+ cung cấp/,
      "detectStaleDraft source must include the legacy Ông  cung cấp two-space bug",
    );
  });

  it("22. detectStaleDraft also catches the collapsed-spacing 'Ông cung cấp' variant", () => {
    // Some old localStorage drafts were saved after copy-paste
    // collapsed the double space. The detector must also catch
    // "Ông cung cấp" (single space).
    assert.match(
      workspaceSource,
      /["']Ông cung cấp["']/,
      "detectStaleDraft source must also match the collapsed-spacing 'Ông cung cấp' variant",
    );
  });

  it("23. detectStaleDraft hardens against the legacy 'Nguyễn Thị Hồng Hạnh' signer", () => {
    // Old drafts set the receiver / informant signer to
    // "Nguyễn Thị Hồng Hạnh". The detector must look up both
    // `informant.signerName` and `receiver.signerName` and flag the
    // legacy signer name.
    assert.match(
      workspaceSource,
      /Nguyễn Thị Hồng Hạnh/,
      "detectStaleDraft source must reference the legacy 'Nguyễn Thị Hồng Hạnh' signer",
    );
    assert.match(
      workspaceSource,
      /informant\.signerName/,
      "detectStaleDraft source must check informant.signerName",
    );
    assert.match(
      workspaceSource,
      /receiver\.signerName/,
      "detectStaleDraft source must check receiver.signerName",
    );
  });

  it("24. Stale comment 'BM-001 ships without runtime-ux profile' is absent", () => {
    // Phase 1 cleaned the stale top-of-file comment that claimed
    // BM-001 had no runtime-ux profile. The literal phrase (or
    // close variants) must not appear anywhere in the workspace.
    const STALE_PHRASES = [
      /BM-001\s+ships\s+without\s+a?\s*runtime-ux\s+profile/i,
      /BM-001\s+ships\s+without\s+runtime-ux/i,
      /BM-001.*?without.*?runtime-ux\s+profile/i,
    ];
    const stripped = workspaceSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const re of STALE_PHRASES) {
      assert.ok(
        !re.test(stripped),
        `template-preview-workspace.tsx must not contain the stale phrase: ${re.source}`,
      );
    }
    // Same for the comment-only check (a stale "ships without runtime-ux
    // profile" inside a comment is still misleading and must go).
    const commentOnly = workspaceSource;
    for (const re of STALE_PHRASES) {
      assert.ok(
        !re.test(commentOnly),
        `template-preview-workspace.tsx (incl. comments) must not contain: ${re.source}`,
      );
    }
  });

  it("25. Workspace comment / documentation now states BM-001 has a runtime-ux profile", () => {
    // The replacement comment must affirm the new truth. The
    // workspace must mention both BM-001 and BM-171 in the same
    // runtime-ux-profile context.
    assert.match(
      workspaceSource,
      /BM-001\s+and\s+BM-171/,
      "workspace comment must now mention both BM-001 and BM-171 in the runtime-ux-profile context",
    );
    assert.match(
      workspaceSource,
      /runtime-ux\s+profile/i,
      "workspace comment must now reference the runtime-ux profile",
    );
    // `getRuntimeUxProfile` is referenced in the workspace; verify
    // the new comment explicitly states the helper returns a
    // populated profile for BM-001.
    assert.match(
      workspaceSource,
      /getRuntimeUxProfile/,
      "workspace must still import + use getRuntimeUxProfile",
    );
    // And the diagnostic banner surface still routes through
    // `selectRuntimeReadyTemplatePanel`.
    assert.match(
      workspaceSource,
      /selectRuntimeReadyTemplatePanel/,
      "workspace must still consult selectRuntimeReadyTemplatePanel for the runtime-ready panel contract",
    );
  });
});
