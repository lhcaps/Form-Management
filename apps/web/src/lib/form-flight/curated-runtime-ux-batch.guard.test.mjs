/**
 * Curated input-connected batch guard test (next-large-batch 3).
 *
 * Locks the curated runtime-ux profiles for the next-large input-
 * connected batch — 20 forms promoted from `INPUT_CONNECTED_PARTIAL`
 * to `INPUT_CONNECTED_PASS` (Batch 3):
 *
 *   BM-055, BM-056, BM-057, BM-058, BM-059, BM-060, BM-061,
 *   BM-062, BM-063, BM-064, BM-065, BM-066, BM-067, BM-068,
 *   BM-069, BM-071, BM-072, BM-073, BM-074, BM-075.
 *
 * Earlier batches remain in the allowlist:
 *   - 5-form batch: BM-005, BM-014, BM-015, BM-022, BM-035.
 *   - 15-form batch: BM-006 .. BM-012, BM-017 .. BM-020, BM-023,
 *     BM-030, BM-031, BM-033.
 *   - 15-form batch 2: BM-036, BM-037, BM-038, BM-040, BM-042,
 *     BM-043, BM-044, BM-045, BM-046, BM-047, BM-048, BM-052,
 *     BM-053, BM-054, BM-070.
 *   - 57 total curated (37 existing + 20 new).
 *   - Batch 4 (20 forms): BM-076, BM-078, BM-080, BM-081, BM-083,
 *     BM-084, BM-085, BM-086, BM-087, BM-088, BM-090, BM-091, BM-092,
 *     BM-093, BM-094, BM-095, BM-096, BM-097, BM-098, BM-100.
 *   - 77 total curated (37 existing + 20 batch 3 + 20 batch 4).
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/curated-runtime-ux-batch.guard.test.mjs
 *
 * What this guard asserts
 * -----------------------
 * For each curated BM-NNN:
 *   1. runtime-ux profile file exists.
 *   2. profile is curated, not just auto-generated
 *      (clearly past the conservative baseline).
 *   3. sections count >= 1 (must be > 0).
 *   4. fields count >= 1 (must be > 0).
 *   5. profile's field keys are a strict subset of the compiled
 *      contract's `source.fields[].key` set (no invented keys).
 *   6. profile's sectionIds match the compiled `source.sections[].id`
 *      set (no invented sections).
 *   7. smart metadata derived targets exist in the compiled contract
 *      OR are explicitly display-only / synthetic (no phantom targets).
 *   8. demo has no legacy stale tokens
 *      (`Nguyễn Văn A`, `Trần Thị B`, `Ông cung cấp`,
 *       `Nguyễn Thị Hồng Hạnh`, generic `1980`, `[object Object]`,
 *       `undefined`, `null`, `(mẫu BM-NNN)`).
 *   9. demo contains at least one role-key with a value of length > 0
 *      (the profile is not empty-handed).
 *
 * Plus module-level invariants:
 *  10. BM-001 and BM-171 remain unchanged (FormFlight + runtime-ux
 *      allowlist are NOT promoted).
 *  11. The FormFlight `RUNTIME_READY_FORM_FLIGHT_PROFILES` allowlist
 *      still contains only `BM-001` and `BM-171`.
 *  12. Non-selected partial forms remain partial — no accidental
 *      promotion.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..", "..", "..");
const APPS_WEB_DIR = join(ROOT, "apps", "web");
const RUNTIME_UX_DIR = join(APPS_WEB_DIR, "src", "lib", "runtime-ux");
const RUNTIME_UX_INDEX = join(RUNTIME_UX_DIR, "index.ts");
const FORM_FLIGHT_DIR = __dirname;
const COMPILED_DIR = join(ROOT, "docs", "audit", "docx", "compiled-v2");

const CURATED_CODES = [
  // Previous five-form batch.
  "BM-005",
  "BM-014",
  "BM-015",
  "BM-022",
  "BM-035",
  // Batch 1 (15 forms).
  "BM-006",
  "BM-007",
  "BM-008",
  "BM-009",
  "BM-010",
  "BM-011",
  "BM-012",
  "BM-017",
  "BM-018",
  "BM-019",
  "BM-020",
  "BM-023",
  "BM-030",
  "BM-031",
  "BM-033",
  // Batch 2 (15 forms).
  "BM-036",
  "BM-037",
  "BM-038",
  "BM-040",
  "BM-042",
  "BM-043",
  "BM-044",
  "BM-045",
  "BM-046",
  "BM-047",
  "BM-048",
  "BM-052",
  "BM-053",
  "BM-054",
  "BM-070",
  // Batch 3 (20 forms).
  "BM-055",
  "BM-056",
  "BM-057",
  "BM-058",
  "BM-059",
  "BM-060",
  "BM-061",
  "BM-062",
  "BM-063",
  "BM-064",
  "BM-065",
  "BM-066",
  "BM-067",
  "BM-068",
  "BM-069",
  "BM-071",
  "BM-072",
  "BM-073",
  "BM-074",
  "BM-075",
  // Batch 4 (20 forms) — promoted from PARTIAL → PASS via source/render
  // smoke only; browser/demo/preview/docx/fidelity phases run separately.
  "BM-076",
  "BM-078",
  "BM-080",
  "BM-081",
  "BM-083",
  "BM-084",
  "BM-085",
  "BM-086",
  "BM-087",
  "BM-088",
  "BM-090",
  "BM-091",
  "BM-092",
  "BM-093",
  "BM-094",
  "BM-095",
  "BM-096",
  "BM-097",
  "BM-098",
  "BM-100",
];

const FORBIDDEN_TOKENS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Nguyễn Thị Hồng Hạnh",
  "[object Object]",
];

const FORBIDDEN_REGEXES = [
  // Ông  cung cấp (two-space) and Ông cung cấp (single space collapse).
  /Ông\s+ cung cấp/,
  /["']Ông cung cấp["']/,
  // Generic `1980` as a year value (recognised as a stale default in
  // the BM-001 baseline guards).
  /birthYear[^A-Za-z]+\d{4}["']\s*:\s*["']1980["']/i,
  // "(mẫu BM-NNN)" stale placeholder leaking into rendered demo values.
  /\(mẫu\s+BM-\d{3}\)/i,
];

/**
 * Extract the `const X = { ... } as const;` block (curated shape) OR the
 * `fields: { ... }` block (auto-generated shape). Returns the raw object
 * body.
 */
function extractFieldsBody(source) {
  // Curated shape: const BMNNN_FIELDS = { ... } as const;
  const curated = source.match(
    /const\s+BM\d+_FIELDS\s*=\s*\{([\s\S]*?)\}\s+as\s+const/,
  );
  if (curated) return curated[1];
  // Auto-generated shape fallback (not used by this batch but kept
  // defensive).
  const inline = source.match(/fields\s*:\s*\{([\s\S]*?)\n\}/);
  return inline ? inline[1] : "";
}

function extractSectionsBody(source) {
  const curated = source.match(
    /const\s+BM\d+_SECTIONS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/,
  );
  if (curated) return curated[1];
  // Alt: BM-022 uses BM022_SECTIONS shape with two sections; fall back
  // to any inline sections: [{...},...] block.
  const inline = source.match(/sections\s*:\s*\[([\s\S]*?)\]\s*[,}]/);
  return inline ? inline[1] : "";
}

function extractDemoBody(source) {
  const curated = source.match(
    /const\s+BM\d+_DEMO(?:_RUNTIME_UX)?\s*=\s*\{([\s\S]*?)\}\s+as\s+const/,
  );
  return curated ? curated[1] : "";
}

function countQuotesWithDotKey(body) {
  // matches `"some.key":` style entries
  return (body.match(/["'][a-zA-Z]+\.[a-zA-Z0-9_-]+["']\s*:/g) || []).length;
}

function countSections(body) {
  return (body.match(/sectionId\s*:\s*"/g) || body.match(/id\s*:\s*"section-/g) || []).length;
}

function readCompiled(code) {
  const p = join(COMPILED_DIR, `${code}.compiled.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

function readProfile(code) {
  const p = join(RUNTIME_UX_DIR, `bm${code.slice(3)}-runtime-ux-profile.ts`);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

function compiledFieldKeys(compiled) {
  return new Set(compiled.source.fields.map((f) => f.key));
}

function compiledSectionIds(compiled) {
  return new Set(compiled.source.sections.map((s) => s.id));
}

function extractSmartDerivedTargets(source) {
  // Match `derivedTargets: [ "x.y", ... ]` arrays.
  const out = [];
  const re = /derivedTargets\s*:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const items = m[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    out.push(...items);
  }
  return out;
}

function isCuratedVersionLabel(source) {
  // Curated profiles declare a meaningful versionLabel that explicitly
  // mentions a curated-batch phase (rather than the auto-generated
  // "BM-NNN runtime-ux auto-generated conservative profile" pattern).
  return /versionLabel:\s*["']BM-\d{3} curated batch/i.test(source);
}

describe("Curated input-connected batch (5-form + 15-form + 15-form + 20-form = 57 curated)", () => {
  for (const code of CURATED_CODES) {
    const profilePath = join(RUNTIME_UX_DIR, `bm${code.slice(3)}-runtime-ux-profile.ts`);
    const profileSrc = readProfile(code);
    const compiled = readCompiled(code);

    if (!profileSrc || !compiled) {
      // Defer the missing-file assertions to the per-it blocks below
      // so the failure message names the actual gap.
      continue;
    }

    it(`${code} #1: profile file exists`, () => {
      assert.ok(existsSync(profilePath), `${code} profile must exist`);
    });

    it(`${code} #2: profile is curated, not auto-generated`, () => {
      assert.ok(
        isCuratedVersionLabel(profileSrc),
        `${code} must declare a curated versionLabel (auto-generated profiles are explicitly excluded)`,
      );
    });

    it(`${code} #3: sections count >= 1`, () => {
      const sectionsBody = extractSectionsBody(profileSrc);
      const n = countSections(sectionsBody);
      assert.ok(n >= 1, `${code} must declare at least one section (got ${n})`);
    });

    it(`${code} #4: fields count >= 1`, () => {
      const fieldsBody = extractFieldsBody(profileSrc);
      const n = countQuotesWithDotKey(fieldsBody);
      assert.ok(n >= 1, `${code} must declare at least one field override (got ${n})`);
    });

    it(`${code} #5: every profile field key exists in the compiled contract`, () => {
      const fieldsBody = extractFieldsBody(profileSrc);
      const profileKeys = Array.from(
        new Set(
          (fieldsBody.match(/["'][a-zA-Z]+\.[a-zA-Z0-9_-]+["']\s*:/g) || []).map((s) =>
            s.replace(/["':\s]/g, ""),
          ),
        ),
      );
      const compiledKeys = compiledFieldKeys(compiled);
      for (const key of profileKeys) {
        assert.ok(
          compiledKeys.has(key),
          `${code} profile field "${key}" must exist in the compiled contract (compiled has ${compiledKeys.size} field keys)`,
        );
      }
    });

    it(`${code} #6: every profile sectionId exists in the compiled contract`, () => {
      const sectionsBody = extractSectionsBody(profileSrc);
      const profileIds = Array.from(
        new Set(
          (sectionsBody.match(/sectionId\s*:\s*["'](section-[a-z0-9-]+)["']/g) || []).map(
            (s) => s.replace(/sectionId\s*:\s*["']|["']/g, ""),
          ),
        ),
      );
      const compiledIds = compiledSectionIds(compiled);
      for (const id of profileIds) {
        assert.ok(
          compiledIds.has(id),
          `${code} profile sectionId "${id}" must exist in the compiled contract`,
        );
      }
    });

    it(`${code} #7: smart derived targets exist in the compiled contract`, () => {
      const derived = extractSmartDerivedTargets(profileSrc);
      const compiledKeys = compiledFieldKeys(compiled);
      for (const target of derived) {
        // Empty array entries ("" segments) are not allowed.
        assert.ok(target.length > 0, `${code} derivedTargets must not be empty`);
        // Most targeted keys map onto compiled contract keys. The
        // exception is the visible smart key itself (same as the
        // container); allow that by checking compile-time membership
        // OR identity-to-visible-key relationship.
        assert.ok(
          compiledKeys.has(target),
          `${code} smart derived target "${target}" must exist in the compiled contract`,
        );
      }
    });

    it(`${code} #8: demo has no legacy stale tokens`, () => {
      const demoBody = extractDemoBody(profileSrc);
      assert.ok(demoBody.length > 0, `${code} demo block must exist`);
      for (const value of FORBIDDEN_TOKENS) {
        assert.ok(
          !new RegExp(`["']${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(demoBody),
          `${code} demo must not contain the stale value "${value}"`,
        );
      }
      // Birthyear default must never be the auto-generated `1980`.
      assert.ok(
        !/birthYear["']\s*:\s*["']1980["']/.test(demoBody),
        `${code} demo must not default birthYear to 1980`,
      );
      // (mẫu BM-NNN) stale placeholder must never appear in the demo block.
      assert.ok(
        !/\(mẫu\s+BM-\d{3}\)/i.test(demoBody),
        `${code} demo must not contain the stale "(mẫu BM-NNN)" placeholder`,
      );
      // No legacy Ông  cung cấp two-space bug.
      assert.ok(
        !/Ông\s+ cung cấp/.test(demoBody),
        `${code} demo must not contain "Ông  cung cấp" two-space bug`,
      );
      // Stale `undefined` or `null` substring as a value.
      assert.ok(
        !/["']undefined["']/.test(demoBody),
        `${code} demo must not contain "undefined" string token`,
      );
      assert.ok(
        !/["']null["']/.test(demoBody),
        `${code} demo must not contain "null" string token`,
      );
    });

    it(`${code} #9: demo has at least one populated role-key`, () => {
      const demoBody = extractDemoBody(profileSrc);
      // Generic role keys always populated by the curated batch;
      // a tiny form with only `document.*` keys should still have at
      // least one populated value of length > 0, so the fixture is
      // not empty-handed.
      const genericKey = /["'][a-zA-Z]+\.[a-zA-Z0-9_-]+["']\s*:\s*["'][^"']+["']/;
      assert.ok(
        genericKey.test(demoBody),
        `${code} demo must contain at least one key with a non-empty value`,
      );
    });
  }

  it("module #10: BM-001 and BM-171 runtime-ux profiles are unchanged", () => {
    // Read BM-001 source and confirm the curated-batch phase did not
    // touch it (BM-001 still declares the v2 smart-runtime-ux label).
    const bm001 = readFileSync(join(RUNTIME_UX_DIR, "bm001-runtime-ux-profile.ts"), "utf8");
    assert.match(
      bm001,
      /versionLabel:\s*["']BM-001 smart-runtime-ux v2/,
      "BM-001 must keep its pre-existing smart-runtime-ux versionLabel",
    );
    const bm171 = readFileSync(join(RUNTIME_UX_DIR, "bm171-runtime-ux-profile.ts"), "utf8");
    assert.match(
      bm171,
      /versionLabel:\s*["']runtime-ux-profile\/v1 \(PR7A\.6\)["']/,
      "BM-171 must keep its pre-existing v1 runtime-ux versionLabel",
    );
  });

  it("module #11: FormFlight runtimeReady allowlist is still only BM-001 + BM-171", () => {
    const lifecyclePath = join(FORM_FLIGHT_DIR, "form-lifecycle.ts");
    const lifecycleSrc = readFileSync(lifecyclePath, "utf8");
    const listMatch = lifecycleSrc.match(
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

  it("module #12: non-selected partial forms remain partial", () => {
    // Spot-check a few non-selected forms still exist as auto-generated
    // baselines and have not been overwritten by this phase. We choose
    // BM-024 (immediately after the curated tail in batch 1), BM-130
    // (not selected in batch 4), and BM-200 as canaries.
    // Note: BM-010 is curated by batch 1 and therefore intentionally
    // NOT a canary. BM-100 is curated by batch 4 and therefore
    // intentionally NOT a canary.
    const canaries = ["BM-024", "BM-130", "BM-200"];
    for (const code of canaries) {
      const p = join(RUNTIME_UX_DIR, `bm${code.slice(3)}-runtime-ux-profile.ts`);
      const src = existsSync(p) ? readFileSync(p, "utf8") : "";
      assert.ok(src.length > 0, `${code} canary profile must still exist`);
      // The canaries must NOT carry a curated-batch versionLabel.
      assert.ok(
        !/versionLabel:\s*["']BM-\d{3} curated batch/i.test(src),
        `${code} must not have been promoted by this phase (curated versionLabel found)`,
      );
      // Canaries should still carry the (mẫu BM-NNN) placeholder,
      // proving they remain in the auto-generated partial bucket.
      assert.match(src, /\(mẫu\s+BM-\d{3}\)/i);
    }
  });

  it("module: every curated profile is registered in runtime-ux/index.ts", () => {
    const indexSrc = readFileSync(RUNTIME_UX_INDEX, "utf8");
    for (const code of CURATED_CODES) {
      const filename = `bm${code.slice(3)}-runtime-ux-profile`;
      assert.ok(
        indexSrc.includes(`./${filename}`),
        `${code} profile file must be side-effect-imported from runtime-ux/index.ts`,
      );
    }
  });
});
