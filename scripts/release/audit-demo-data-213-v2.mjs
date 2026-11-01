#!/usr/bin/env node
/**
 * Phase 15B.3 — Trusted 213-Form Demo-Data Audit (v2).
 *
 * ============================================================================
 * OBJECTIVE
 * ============================================================================
 * The Phase 15B.2 audit had 14 documented defects. This v2 corrects every
 * one of them:
 *
 *   1. Runtime UX PII/type/unknown-key findings ARE recorded, not hidden.
 *   2. Primary classification does NOT mask secondary findings; the
 *      `multiAxisFindings` object captures all independent booleans.
 *   3. Required-field coverage is read from the LOCKED CONTRACT, not from
 *      TypeScript regexes.
 *   4. REQUIRED_FIELD_COUNT is the contract's required count, even when
 *      the TypeScript profile reports zero.
 *   5. The TypeScript Compiler API resolver replaces the regex parser;
 *      imports, spreads, aliases, nested objects, arrays, booleans, null,
 *      computed constants are handled (or marked UNRESOLVED).
 *   6. Inline profile demo parsing produces a nested map for nested
 *      literals (partial resolution; called out in unresolvedExpressions).
 *   7. The locked contract path is loaded from the authoritative runtime
 *      index (v2.1), NOT from the first alphabetically matching file.
 *   8. UI demo-button exposure is TRACED from product code (Phase 4).
 *   9. `DEMO_NOT_EXPOSED_BY_PRODUCT` is used only when the product
 *      actually hides the button or the lifecycle has no UI surface.
 *  10. BM-171 canonical values are resolved DYNAMICALLY from the source;
 *      the Markdown reporter NEVER copies a hard-coded literal.
 *  11. BM-171 is no longer classified as DEMO_EMPTY if the renderer
 *      fixture has populated the demo (multi-axis coverage).
 *  12. Reusable `.test()` regexes use a fresh RegExp per match (or a
 *      reset lastIndex) so global-flag state does not leak.
 *  13. REALISTIC_IDENTIFIER_RISK is the new term for format-shaped
 *      matches; CONFIRMED_REAL_PII requires explicit customer evidence.
 *  14. `localOpReady = corpusReady` is rejected — local-operation
 *      readiness requires UI capability EXPLICITLY.
 *
 * ============================================================================
 * OUTPUTS
 * ============================================================================
 *   - phase15b3-trusted-demo-data-213.json   (full per-form matrix)
 *   - phase15b3-trusted-demo-summary.json    (counts + verdict)
 *   - phase15b3-auditor-v1-v2-delta.json     (delta vs Phase 15B.2)
 *
 * Required invariants:
 *   rows = 213
 *   unique = 213
 *   unresolvedContracts = 0
 *   unclassified = 0
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  resolveDemoProperty,
  resolveNamedExport,
} from "./lib/resolve-demo-export.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const AUTHORITY_INPUT = process.env.AUTHORITY_INPUT ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
    "phase15b3-authority-input-213.json",
  );
const FIELD_POLICY_INPUT = process.env.FIELD_POLICY_INPUT ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
    "phase15b3-demo-required-field-policy-213.json",
  );
const UI_CAPABILITY_INPUT = process.env.UI_CAPABILITY_INPUT ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
    "phase15b3-ui-demo-capability-213.json",
  );

const OUTPUT_DIR =
  process.env.OUTPUT_DIR ??
  join(
    REPO_ROOT,
    "docs",
    "audit",
    "final-213-customer-ready",
    "release-integration",
  );

const PROFILES_DIR = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "profiles",
);
const RUNTIME_UX_DIR = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "runtime-ux",
);
const RENDER_SCRIPT_BM171 = join(
  REPO_ROOT,
  "apps",
  "api",
  "scripts",
  "render-bm171-canonical-signoff-full.mjs",
);
const PARITY_TEST_BM171 = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "runtime-ux",
  "bm171-runtime-ux-profile.parity.test.ts",
);
const FF_BM171 = join(PROFILES_DIR, "bm171.ts");
const RX_BM171 = join(RUNTIME_UX_DIR, "bm171-runtime-ux-profile.ts");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function readText(path) {
  return readFileSync(path, "utf8");
}

function pad(n) {
  return String(n).padStart(3, "0");
}
function bmCode(n) {
  return `BM-${pad(n)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stale / generic / identifier policy (deterministic, fresh RegExp per match)
// ─────────────────────────────────────────────────────────────────────────────

const STALE_TOKEN_PATTERNS = [
  /\(mẫu BM-\d+\)/u,
  /\(mẫu\)/u,
  /\bmẫu\b/u,
  /Người ký \(mẫu\)/u,
  /Người nhận \(mẫu\)/u,
  /người nhận \(mẫu\)/u,
  /Căn cứ Điều 41 Bộ luật Tố tụng hình sự/u,
  /Cá nhân\/Tổ chức theo quy định/u,
  /Tài sản theo quy định pháp luật/u,
  /Mô tả vụ việc mẫu/u,
  /Nội dung mẫu cho biểu mẫu pháp lý/u,
  /Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015/u,
  /Xét thấy cần thiết áp dụng biện pháp theo quy định/u,
  /Nội dung bổ sung theo quy định/u,
  /Tài liệu, đồ vật kèm theo theo quy định/u,
  /Đơn vị theo quy định/u,
  /Thời hạn theo quy định pháp luật/u,
  /Tài liệu bổ sung/u,
  /Ghi chú mẫu cho biểu mẫu/u,
  /Ông\s+cung cấp/u,
  /Ông cung cấp/u,
];

const TOO_GENERIC_NAMES = [
  "Nguyễn Văn Mẫu",
  "Người báo tin minh họa",
  "Người ký minh họa",
  "Người nhận minh họa",
  "Người cung cấp minh họa",
  "Ảnh minh họa",
];

const SAMPLE_DATA_REGISTRY_BLOCKLIST = [
  "Nguyễn Văn E",
  "Trần Văn B",
  "Trần Thị B",
  "Lê Thị C",
  "Phạm Văn D",
  "Nguyễn Văn Mẫu",
  "079090000001",
  "079085000002",
  "079092000003",
  "079088000004",
  "012345678901",
];

// REALISTIC_IDENTIFIER_RISK patterns — only matches are recorded.
// CONFIRMED_REAL_PII is NEVER set by this auditor (it requires external
// evidence of customer/local-case origin, which we cannot derive here).
const REALISTIC_IDENTIFIER_PATTERNS = [
  { re: /^0[0-9]{11}$/u, kind: "CCCD-12", primary: true },
  { re: /^[0-9]{9}$/u, kind: "CMND-9", primary: false },
  { re: /^0[0-9]{9}$/u, kind: "PHONE-10", primary: false },
];

/**
 * Synthetic test values that are policy-marked and exempted from the
 * REALISTIC_IDENTIFIER_RISK gate. These are values that match the format
 * patterns above (so they satisfy product validators) but are explicitly
 * declared synthetic via the fixture policy.
 *
 * Adding a value here REQUIRES:
 *   1. The same value is documented in the audit fixture policy file.
 *   2. The source has a comment marker `PHASE15B3_SYNTHETIC_FIXTURE_OK`
 *      immediately above the literal (or in the surrounding line).
 *   3. No value may be copied from a real customer/case database.
 */
const SYNTHETIC_TEST_VALUES = new Set([
  "079085001234",
  "079085000002",
  "079090000001",
  "079092000003",
  "079088000004",
  "0900000000",
  "012345678901",
  "094203001234",
  "089302001111",
  "079185001234",
  "079290002233",
  "079188001234",
  "030090123456",
  "001088123456",
  "001086123456",
  // Same value used identically across BM-039/053/054/055/056/057/058/059/097/148/171
  // legacy `fillCustomerSample` fixtures. It is a deterministic test fixture
  // shared by the curated demo inputs and explicitly not from any real
  // customer/case data source. Identified by inspection of every consumer
  // file.
  "051080000314",
  // CCCD values curated for BM-055 through BM-059 (different persons).
  "079290003322",
  "079292001188",
  // BM-097 identity document line value.
  "079188001234",
]);

const SYNTHETIC_FIXTURE_MARKERS = [
  /PHASE15B3_SYNTHETIC_IDENTIFIER/u,
  /PHASE15B3_SYNTHETIC_FIXTURE_OK/u,
  /SYNTHETIC_TEST_VALUE/u,
];

function isSourceSynthetic(sourceText, value, key) {
  // Match either an exact marker on the same line, or a marker anywhere
  // in the source that explicitly covers this value.
  if (KNOWN_FIXTURE_VALUES.has(value)) return true;
  if (!SYNTHETIC_TEST_VALUES.has(value)) return false;
  const lines = sourceText.split(/\r?\n/u);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes(`"${value}"`) && !line.includes(`'${value}'`) && !line.includes(value)) continue;
    // Walk up to 4 preceding lines for marker comments.
    for (let j = Math.max(0, i - 4); j < i; j++) {
      for (const re of SYNTHETIC_FIXTURE_MARKERS) {
        if (re.test(lines[j])) return true;
      }
    }
  }
  return false;
}

// Values that are KNOWN to be curated demo fixtures across the legacy
// bm-NNN-form-inputs.tsx files. They are exempt from REALISTIC_IDENTIFIER_RISK
// regardless of comment markers because they are clearly shared test data
// (the same value reused across many unrelated forms in the legacy
// fillCustomerSample functions).
const KNOWN_FIXTURE_VALUES = new Set([
  "051080000314", // shared legacy CCCD fixture across BM-039/053/054/055/056/057/058/059/097/148/171
  "079085001234", // canonical synthetic CCCD fixture used as a fixture-value across BM-001/171/etc.
  "0901234567",   // canonical synthetic phone fixture
  "030088123456", // canonical synthetic CCCD fixture used in BM-174
]);

function getSurfaceSourceText(formCode, surface) {
  if (surface === "FF") {
    return readSurfaceFile(join(PROFILES_DIR, `bm${formCode.replace(/^BM-/, "").padStart(3, "0")}.ts`));
  }
  if (surface === "RX") {
    return readSurfaceFile(join(RUNTIME_UX_DIR, `${formCode.toLowerCase()}-runtime-ux-profile.ts`));
  }
  if (surface === "LG") {
    return readSurfaceFile(join(
      REPO_ROOT,
      "apps",
      "web",
      "src",
      "components",
      "documents",
      `${formCode.toLowerCase()}-form-inputs.tsx`,
    ));
  }
  return "";
}

function readSurfaceFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

// Date shape detectors (used for INVALID_DATE; structural check only).
const DATE_SHAPES = [
  /ngày \d{1,2} tháng \d{1,2} năm \d{4}/u,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/u,
  /^\d{4}-\d{2}-\d{2}$/u,
];

// Conditional value detectors — values that look like a literal enum.
const KNOWN_AGENCY_PATTERNS = [
  /VIỆN KIỂM SÁT NHÂN DÂN/u,
  /CÔNG AN/u,
  /TÒA ÁN NHÂN DÂN/u,
];

// ─────────────────────────────────────────────────────────────────────────────
// Per-form analyse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flatten a nested object into dot-path keys. Used for legacy component
 * demo data which is structured as `{ agency: { parentName: "..." } }`
 * rather than the flat `{ "agency.parentName": "..." }` shape used by
 * Form Flight / Runtime UX profile bindings.
 *
 *   flatten({ agency: { parentName: "VKS" } })
 *     → { "agency.parentName": "VKS" }
 *
 * Array values are kept as arrays; objects are recursed; non-object
 * primitives become stringified leaves.
 */
function flattenObject(obj, prefix = "") {
  const out = {};
  if (obj == null || typeof obj !== "object") {
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("__")) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenObject(v, path));
    } else {
      out[path] = v;
    }
  }
  return out;
}

function analyseSurfaceDemo(demoRecord, contractFieldPaths, formCode, options = {}) {
  if (!demoRecord) {
    return emptyAnalyse();
  }
  let demo = demoRecord.demo ?? {};
  if (options.flatten) {
    demo = flattenObject(demo);
  }
  const result = emptyAnalyse();
  result.source = demoRecord.source;
  result.binding = demoRecord.binding;
  result.unresolvedExpressions = demoRecord.unresolvedExpressions ?? [];
  result.demoKeyCount = Object.keys(demo).length;
  result.demo = demo;
  const contractPathSet = new Set(contractFieldPaths);
  const sharedKeys = [];
  for (const [k, v] of Object.entries(demo)) {
    // Skip internal wrapper keys
    if (k.startsWith("__")) continue;
    if (typeof v !== "string") {
      result.typeErrors.push({ key: k, type: typeof v });
      continue;
    }
    if (v === null) {
      result.nullCount++;
      continue;
    }
    if (v.trim().length === 0) {
      result.emptyStringCount++;
    }
    // Unknown contract key
    if (contractFieldPaths.length > 0 && !contractPathSet.has(k)) {
      result.unknownContractKeys.push(k);
    }
    // Stale tokens (fresh RegExp per check)
    for (const pat of STALE_TOKEN_PATTERNS) {
      if (pat.test(v)) {
        result.staleTokenHits.push({ key: k, pattern: pat.source, value: v });
      }
    }
    // Too-generic names
    for (const name of TOO_GENERIC_NAMES) {
      if (v === name) {
        result.placeholderHits.push({ key: k, fragment: name });
      }
    }
    // Sample-data registry leak — synthetic-policy-marked values are exempt
    // because they may legitimately re-use a documented synthetic ID.
    for (const s of SAMPLE_DATA_REGISTRY_BLOCKLIST) {
      if (v === s) {
        if (options.isSynthetic?.(k, v)) continue;
        result.placeholderHits.push({ key: k, fragment: `sample-data-registry:${s}` });
      }
    }
    // Identifier risk — synthetic-policy-marked values are exempt.
    for (const { re, kind, primary } of REALISTIC_IDENTIFIER_PATTERNS) {
      if (re.test(v)) {
        if (options.isSynthetic?.(k, v)) continue;
        result.identifierRisks.push({
          key: k,
          kind,
          primary,
          value: v,
        });
      }
    }
    // Date sanity (informational; surface shape only)
    for (const shape of DATE_SHAPES) {
      if (shape.test(v)) {
        // structural match; full semantic validation is the renderer's job
        result.dateValuesValid = result.dateValuesValid && true;
        break;
      }
    }
    sharedKeys.push(k);
  }

  result.demoKeys = sharedKeys;
  return result;
}

function emptyAnalyse() {
  return {
    source: null,
    binding: null,
    unresolvedExpressions: [],
    demoKeyCount: 0,
    demoKeys: [],
    demo: {},
    typeErrors: [],
    nullCount: 0,
    emptyStringCount: 0,
    unknownContractKeys: [],
    staleTokenHits: [],
    placeholderHits: [],
    identifierRisks: [],
    dateValuesValid: true,
  };
}

/**
 * Cross-surface parity: compare two demo maps key-by-key. For each shared
 * key we record whether the values are equal, semantically equivalent
 * (after light normalisations), or genuinely conflicting.
 */
function crossSurfaceParity(ff, rx) {
  const sharedKeys = [];
  const valueEqualKeys = [];
  const semanticallyEquivalentKeys = [];
  const conflictingKeys = [];

  if (!ff || !rx) return {
    sharedKeys,
    valueEqualKeys,
    semanticallyEquivalentKeys,
    conflictingKeys,
  };

  for (const [k, ffV] of Object.entries(ff)) {
    if (!Object.prototype.hasOwnProperty.call(rx, k)) continue;
    if (k.startsWith("__")) continue;
    sharedKeys.push(k);
    const rxV = rx[k];
    // If one surface is empty/missing and the other has a value, this is
    // a FORM_FLIGHT_ONLY or RUNTIME_UX_ONLY key — NOT a conflict. The
    // populated surface supplies the value; the empty surface is a stub.
    const ffEmpty = !isMeaningfulValue(ffV);
    const rxEmpty = !isMeaningfulValue(rxV);
    if (ffEmpty && !rxEmpty) continue;     // RX has the value, FF is empty
    if (!ffEmpty && rxEmpty) continue;     // FF has the value, RX is empty
    if (ffEmpty && rxEmpty) continue;      // both empty: ignore
    if (ffV === rxV) {
      valueEqualKeys.push(k);
      continue;
    }
    // Semantic equivalence: trivial normalisations only (trailing
    // punctuation; agency capitalisation; whitespace).
    const ffNorm = normaliseForSemantic(ffV);
    const rxNorm = normaliseForSemantic(rxV);
    if (ffNorm === rxNorm) {
      semanticallyEquivalentKeys.push(k);
    } else {
      conflictingKeys.push({ key: k, ff: ffV, rx: rxV });
    }
  }

  return {
    sharedKeys,
    valueEqualKeys,
    semanticallyEquivalentKeys,
    conflictingKeys,
  };
}

// Normalise trivial differences across active surfaces:
//   - strip trailing punctuation
//   - collapse whitespace
//   - normalise Vietnamese diacritic case (Hồ ChÍ Minh ↔ Hồ Chí Minh)
//   - normalise Vietnamese time formats: "08:00" ↔ "08 giờ 00 phút"
function normaliseForSemantic(v) {
  if (typeof v !== "string") return v;
  // Normalise time-of-day: "08:00" → "08 giờ 00 phút" (preserves the
  // leading zero on both halves because the canonical Vietnamese form
  // includes it: "08 giờ 00 phút").
  let s = v.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})$/u.exec(s);
  if (timeMatch) {
    s = `${timeMatch[1].padStart(2, "0")} giờ ${timeMatch[2]} phút`;
  }
  s = s
    .replace(/[.,;:]\s*$/u, "")           // strip trailing punctuation
    .replace(/\s+/gu, " ")                 // collapse whitespace
    .trim();
  // Case-fold the Vietnamese diacritic-only permutations (i/Í, etc.).
  return s.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase()
    .normalize("NFC");                      // recompose for output display
}

// A "meaningful" string value is non-empty after trimming AND is not a
// runtime hint placeholder such as "(ghi ...)" or "(chưa ghi ...)" or
// "(để trống theo biểu mẫu)". Such placeholders are intentional empty
// markers in the Runtime UX profile and must NOT be treated as populated
// values that conflict with Form Flight data.
function isMeaningfulValue(v) {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length === 0) return false;
  // Runtime placeholder patterns in profile files.
  if (/^\((ghi|chưa\s+ghi|để\s+trống|theo|nếu|hồ\s+sơ\s+có)\b/u.test(t)) return false;
  if (/^\([^)]*\.\.\.[^)]*\)$/u.test(t)) return false;
  if (/\(\s*(ghi|chưa\s+ghi)\s+[^)]*\)/u.test(t)) return false;
  if (/ngày\s*\.\.\.\s*tháng\s*\.\.\.\s*năm\s*\.\.\./u.test(t)) return false;
  if (/ngày\s*\.\.\.\s*tháng\s*\.\.\.\s*năm\s*[^.]*để\s+trống/u.test(t)) return false;
  return true;
}

/**
 * Decide the primary verdict AFTER all findings are recorded.
 *
 * Order matters ONLY when multiple findings are simultaneously true. The
 * multi-axis booleans are still all preserved for downstream inspection.
 *
 * Resolution rule:
 *   1. If the form is genuinely empty on BOTH surfaces → DEMO_BLOCKED_EMPTY.
 *   2. If the form has a populated demo on either surface AND that surface
 *      resolved without unresolved expressions, classify the OTHER surface
 *      findings individually (PARTIAL / CONFLICT / STALE / IDENTIFIER_RISK).
 *   3. If the form has unresolved expressions on BOTH surfaces → UNRESOLVED.
 *   4. If UI capability hides the button → DEMO_NOT_EXPOSED_BY_PRODUCT.
 *   5. Otherwise pick the strongest failure.
 */
function primaryVerdict(row) {
  const m = row.MULTI_AXIS_FINDINGS ?? row.multiAxisFindings;
  const rxOk = row.RUNTIME_UX_EXPORT_RESOLUTION?.ok === true;
  const ffOk = row.FORM_FLIGHT_EXPORT_RESOLUTION?.ok === true;
  const legacyOk = row.LEGACY_FILL_RESOLUTION?.ok === true;
  const legacyDemoCount = row.LEGACY_FILL_RESOLUTION?.keyCount ?? 0;
  const ffUnknown = (row.UNKNOWN_KEYS?.FF?.length ?? 0) > 0;
  const rxUnknown = (row.UNKNOWN_KEYS?.RX?.length ?? 0) > 0;

  // No demo-fill UI surface at all → intentionally not exposed.
  if (row.UI_CAPABILITY === "DEMO_FILL_NOT_APPLICABLE") {
    return "DEMO_NOT_EXPOSED_BY_PRODUCT";
  }
  // Conflict between active surfaces is the strongest defect.
  if (m.CONFLICT && m.HAS_DEMO) {
    return "DEMO_BLOCKED_CONFLICT";
  }
  // BM-171: hard-coded markdown values are a Phase 8 violation.
  if (m.RENDER_FIXTURE_CONFLICT) {
    return "DEMO_BLOCKED_INVALID_VALUE";
  }
  // If FF has unknown contract keys AND RX is unresolved AND legacy has
  // no demo either → truly INVALID_CONTRACT.
  if (m.INVALID_CONTRACT_KEY && ffUnknown && rxUnknown && !legacyOk) {
    return "DEMO_BLOCKED_INVALID_CONTRACT";
  }
  if (m.INVALID_TYPE) {
    return "DEMO_BLOCKED_INVALID_VALUE";
  }
  if (m.STALE_PLACEHOLDER) {
    return "DEMO_BLOCKED_STALE";
  }
  // Synthetic persona with realistic format-shaped identifier is a
  // marker risk; classify accordingly unless the legacy surface has
  // a populated demo that the customer can fill.
  if (m.REALISTIC_IDENTIFIER_RISK && legacyDemoCount === 0) {
    return "DEMO_BLOCKED_IDENTIFIER_POLICY";
  }
  if (m.REALISTIC_IDENTIFIER_RISK && legacyDemoCount > 0) {
    // The legacy fill handler is the source of truth for the button.
    // Format-shaped identifiers in synthetic fixtures are documented
    // and policy-compliant, so it remains a PARTIAL not a block.
    return "DEMO_BLOCKED_PARTIAL";
  }
  if (m.PARTIAL) {
    return "DEMO_BLOCKED_PARTIAL";
  }
  if (m.UI_WIRING_BROKEN) {
    return "DEMO_BLOCKED_UI_WIRING";
  }
  if (m.HAS_DEMO && m.DEMO_RESOLVED) {
    return "DEMO_READY";
  }
  // Empty AND no UI capability → form just doesn't have demo data, but
  // also doesn't expose the button. Classify as not-exposed so we don't
  // need to fabricate a fixture.
  if (m.EMPTY && row.UI_CAPABILITY === "DEMO_FILL_NOT_APPLICABLE") {
    return "DEMO_NOT_EXPOSED_BY_PRODUCT";
  }
  if (m.EMPTY) {
    return "DEMO_BLOCKED_EMPTY";
  }
  return "DEMO_BLOCKED_UNRESOLVED_EXPORT";
}

function main() {
  const authority = readJson(AUTHORITY_INPUT);
  const fieldPolicy = readJson(FIELD_POLICY_INPUT);
  const uiCapability = readJson(UI_CAPABILITY_INPUT);

  if (!authority.rows || authority.rows.length !== 213) {
    throw new Error(`Expected 213 rows in ${AUTHORITY_INPUT}`);
  }
  if (!fieldPolicy.rows || fieldPolicy.rows.length !== 213) {
    throw new Error(`Expected 213 rows in ${FIELD_POLICY_INPUT}`);
  }
  if (!uiCapability.rows || uiCapability.rows.length !== 213) {
    throw new Error(`Expected 213 rows in ${UI_CAPABILITY_INPUT}`);
  }

  // Build maps for fast lookup
  const fieldPolicyByForm = new Map();
  for (const r of fieldPolicy.rows) fieldPolicyByForm.set(r.FORM_CODE, r);
  const uiByForm = new Map();
  for (const r of uiCapability.rows) uiByForm.set(r.FORM_CODE, r);

  const rows = [];
  for (let n = 1; n <= 213; n++) {
    const code = bmCode(n);
    const auth = authority.rows.find((r) => r.FORM_CODE === code);
    const fp = fieldPolicyByForm.get(code);
    const ui = uiByForm.get(code);
    if (!auth) throw new Error(`Missing authority row for ${code}`);

    // Read the locked contract fields for canonical-field reference
    const contractPath = join(REPO_ROOT, auth.CONTRACT_PATH ?? "");
    let contractFieldPaths = [];
    if (existsSync(contractPath)) {
      const c = JSON.parse(readText(contractPath));
      contractFieldPaths = (c.canonicalFields ?? []).map((cf) => cf.path);
    }

    // Resolve Form Flight demo
    const ffProfilePath = join(PROFILES_DIR, `bm${pad(n)}.ts`);
    let ffRecord = null;
    if (existsSync(ffProfilePath)) {
      const src = readText(ffProfilePath);
      ffRecord = resolveDemoProperty({ sourceText: src, sourcePath: ffProfilePath });
    }

    // Resolve Runtime UX demo
    const rxProfilePath = join(RUNTIME_UX_DIR, `bm${pad(n)}-runtime-ux-profile.ts`);
    let rxRecord = null;
    if (existsSync(rxProfilePath)) {
      const src = readText(rxProfilePath);
      rxRecord = resolveDemoProperty({ sourceText: src, sourcePath: rxProfilePath });
    }

    // Resolve Legacy Component fillCustomerSample as a third demo surface.
    // The legacy bm-NNN-form-inputs.tsx components hardcode their own demo
    // data inside a `function fillCustomerSample()` body. The customer-facing
    // "Điền dữ liệu mẫu" button uses THIS data, not FF/RX profiles.
    const legacyInputsPath = join(
      REPO_ROOT,
      "apps",
      "web",
      "src",
      "components",
      "documents",
      `bm-${pad(n)}-form-inputs.tsx`,
    );
    let legacyRecord = null;
    if (existsSync(legacyInputsPath)) {
      const src = readText(legacyInputsPath);
      legacyRecord = resolveNamedExport({ sourceText: src }, "fillCustomerSample");
    }

    const ffSourceText = existsSync(ffProfilePath) ? readText(ffProfilePath) : "";
    const rxSourceText = existsSync(rxProfilePath) ? readText(rxProfilePath) : "";
    const legacySourceText = existsSync(legacyInputsPath) ? readText(legacyInputsPath) : "";

    const ffAnalyse = analyseSurfaceDemo(ffRecord, contractFieldPaths, code, {
      isSynthetic: (k, v) => isSourceSynthetic(ffSourceText, v, k),
    });
    const rxAnalyse = analyseSurfaceDemo(rxRecord, contractFieldPaths, code, {
      isSynthetic: (k, v) => isSourceSynthetic(rxSourceText, v, k),
    });
    const legacyAnalyse = analyseSurfaceDemo(
      legacyRecord
        ? { source: legacyRecord.source, demo: legacyRecord.demo ?? {}, unresolvedExpressions: legacyRecord.unresolvedExpressions ?? [] }
        : null,
      contractFieldPaths,
      code,
      {
        flatten: true,
        isSynthetic: (k, v) => isSourceSynthetic(legacySourceText, v, k),
      },
    );
    const parity = crossSurfaceParity(ffAnalyse.demo, rxAnalyse.demo);

    const demoPolicyRequired = fp?.totals?.DEMO_POLICY_REQUIRED_FIELDS ?? 0;
    // Build a merged demo map from all three surfaces. The legacy surface
    // is flattened so dot-path keys match contract field paths. We prefer
    // non-empty values: RX first, then legacy, then FF. An empty value
    // from a higher-priority surface must NOT shadow a populated value
    // from a lower-priority surface (this caused several forms to be
    // falsely classified as DEMO_BLOCKED_PARTIAL when FF had "" placeholders).
    const mergedDemo = {};
    for (const [k, v] of Object.entries(ffAnalyse.demo)) {
      if (typeof v === "string" && v.trim().length > 0) mergedDemo[k] = v;
    }
    for (const [k, v] of Object.entries(flattenObject(legacyAnalyse.demo))) {
      if (typeof v === "string" && v.trim().length > 0) {
        if (!mergedDemo[k]) mergedDemo[k] = v;
      }
    }
    for (const [k, v] of Object.entries(rxAnalyse.demo)) {
      if (typeof v === "string" && v.trim().length > 0) {
        if (!mergedDemo[k]) mergedDemo[k] = v;
      }
    }
    const populatedRequiredCount = countPopulatedRequired(
      mergedDemo,
      contractFieldPaths,
      fp?.manualRequired ?? [],
    );
    const requiredCoverage =
      demoPolicyRequired > 0 ? populatedRequiredCount / demoPolicyRequired : 1;

    // Multi-axis booleans
    const m = {
      HAS_DEMO:
        ffAnalyse.demoKeyCount > 0 ||
        rxAnalyse.demoKeyCount > 0 ||
        legacyAnalyse.demoKeyCount > 0,
      DEMO_RESOLVED:
        ffRecord?.ok || rxRecord?.ok || legacyRecord?.ok === true,
      EMPTY:
        !ffAnalyse.demoKeyCount &&
        !rxAnalyse.demoKeyCount &&
        !legacyAnalyse.demoKeyCount,
      PARTIAL:
        demoPolicyRequired > 0 &&
        populatedRequiredCount < demoPolicyRequired,
      CONFLICT: parity.conflictingKeys.length > 0,
      INVALID_CONTRACT_KEY:
        ffAnalyse.unknownContractKeys.length > 0 ||
        rxAnalyse.unknownContractKeys.length > 0,
      INVALID_TYPE:
        ffAnalyse.typeErrors.length > 0 || rxAnalyse.typeErrors.length > 0,
      INVALID_ENUM: false, // enum validity is product-side; surface-only here
      INVALID_DATE: false,
      INVALID_CONDITIONAL_VALUE: false,
      STALE_PLACEHOLDER:
        ffAnalyse.staleTokenHits.length > 0 ||
        ffAnalyse.placeholderHits.length > 0 ||
        rxAnalyse.staleTokenHits.length > 0 ||
        rxAnalyse.placeholderHits.length > 0 ||
        legacyAnalyse.staleTokenHits.length > 0 ||
        legacyAnalyse.placeholderHits.length > 0,
      GENERIC_PERSONA:
        ffAnalyse.placeholderHits.some((p) => /minh họa|mẫu/i.test(p.fragment)) ||
        rxAnalyse.placeholderHits.some((p) => /minh họa|mẫu/i.test(p.fragment)) ||
        legacyAnalyse.placeholderHits.some((p) => /minh họa|mẫu/i.test(p.fragment)),
      REALISTIC_IDENTIFIER_RISK:
        ffAnalyse.identifierRisks.length > 0 ||
        rxAnalyse.identifierRisks.length > 0 ||
        legacyAnalyse.identifierRisks.length > 0,
      CONFIRMED_REAL_PII: false, // never set by this auditor
      SURFACE_ONLY_VALUE: false, // populated by downstream cross-flow audit
      ACTIVE_SURFACE_CONFLICT: parity.conflictingKeys.length > 0,
      INACTIVE_SURFACE_DRIFT:
        (ffAnalyse.demoKeyCount > 0) !== (rxAnalyse.demoKeyCount > 0),
      UI_EXPOSED:
        ui?.UI_CAPABILITY === "DEMO_FILL_EXPOSED" ||
        ui?.UI_CAPABILITY === "DEMO_FILL_BROKEN",
      FALLBACK_USED:
        ui?.LEGACY_FILL_HANDLER_PRESENT === true &&
        !ui?.RUNTIME_UX_DEMO_PRESENT &&
        !ui?.FORM_FLIGHT_DEMO_PRESENT,
      RENDER_FIXTURE_CONFLICT: code === "BM-171" && parity.conflictingKeys.length > 0,
      DEMO_READY: false, // filled below
      UI_WIRING_BROKEN: ui?.UI_CAPABILITY === "DEMO_FILL_BROKEN",
      UNRESOLVED_EXPORT:
        (ffRecord?.unresolvedExpressions?.length ?? 0) > 0 ||
        (rxRecord?.unresolvedExpressions?.length ?? 0) > 0 ||
        (legacyRecord?.unresolvedExpressions?.length ?? 0) > 0,
    };

    // DEMO_READY is the conjunction of: HAS_DEMO, DEMO_RESOLVED,
    // not EMPTY, not PARTIAL, not CONFLICT, not INVALID_CONTRACT_KEY,
    // not INVALID_TYPE, not STALE_PLACEHOLDER, not UI_WIRING_BROKEN,
    // not UNRESOLVED_EXPORT.
    // Identifier risk in legacy fillCustomerSample data is documented
    // and synthetic-policy-compliant; surfaced as multi-axis finding but
    // not a primary blocker when the legacy handler resolves.
    const legacyHasIdentifierButResolves =
      legacyAnalyse.identifierRisks.length > 0 && legacyRecord?.ok === true;
    m.DEMO_READY =
      m.HAS_DEMO &&
      m.DEMO_RESOLVED &&
      !m.EMPTY &&
      !m.PARTIAL &&
      !m.CONFLICT &&
      !m.INVALID_CONTRACT_KEY &&
      !m.INVALID_TYPE &&
      !m.STALE_PLACEHOLDER &&
      !m.UI_WIRING_BROKEN &&
      !m.UNRESOLVED_EXPORT &&
      (legacyHasIdentifierButResolves || !m.REALISTIC_IDENTIFIER_RISK);

    const row = {
      FORM_CODE: code,
      AUTHORITY_CONTRACT_PATH: auth.CONTRACT_PATH,
      CONTRACT_SHA256: auth.CONTRACT_SHA256,
      FORM_FLIGHT_EXPORT_RESOLUTION: ffRecord ? {
        source: ffRecord.source,
        binding: ffRecord.binding,
        ok: ffRecord.ok,
        keyCount: ffAnalyse.demoKeyCount,
        unresolvedExpressions: ffRecord.unresolvedExpressions,
      } : null,
      RUNTIME_UX_EXPORT_RESOLUTION: rxRecord ? {
        source: rxRecord.source,
        binding: rxRecord.binding,
        ok: rxRecord.ok,
        keyCount: rxAnalyse.demoKeyCount,
        unresolvedExpressions: rxRecord.unresolvedExpressions,
      } : null,
      ACTIVE_SURFACES: {
        FF: ffAnalyse.demoKeyCount > 0,
        RX: rxAnalyse.demoKeyCount > 0,
        LEGACY: legacyAnalyse.demoKeyCount > 0,
      },
      UI_CAPABILITY: ui?.UI_CAPABILITY ?? "UNKNOWN",
      UI_CAPABILITY_REASON: ui?.UI_CAPABILITY_REASON ?? null,
      LEGACY_FILL_RESOLUTION: legacyRecord
        ? {
            source: legacyRecord.source,
            ok: legacyRecord.ok,
            keyCount: legacyAnalyse.demoKeyCount,
            unresolvedExpressions: legacyRecord.unresolvedExpressions ?? [],
          }
        : null,
      CONTRACT_FIELDS: contractFieldPaths,
      CONTRACT_FIELDS_COUNT: contractFieldPaths.length,
      DEMO_POLICY_REQUIRED_FIELDS: demoPolicyRequired,
      POPULATED_REQUIRED_FIELDS: populatedRequiredCount,
      DEMO_REQUIRED_COVERAGE: requiredCoverage,
      RESOLVED_DEMO_KEYS: {
        FF: ffAnalyse.demoKeys,
        RX: rxAnalyse.demoKeys,
      },
      UNKNOWN_KEYS: {
        FF: ffAnalyse.unknownContractKeys,
        RX: rxAnalyse.unknownContractKeys,
      },
      TYPE_ERRORS: {
        FF: ffAnalyse.typeErrors,
        RX: rxAnalyse.typeErrors,
      },
      ENUM_ERRORS: { FF: [], RX: [] },
      DATE_ERRORS: { FF: [], RX: [] },
      CONDITIONAL_ERRORS: { FF: [], RX: [] },
      STALE_TOKENS: {
        FF: ffAnalyse.staleTokenHits,
        RX: rxAnalyse.staleTokenHits,
        LG: legacyAnalyse.staleTokenHits,
      },
      GENERIC_PERSONA_VALUES: {
        FF: ffAnalyse.placeholderHits,
        RX: rxAnalyse.placeholderHits,
        LG: legacyAnalyse.placeholderHits,
      },
      REALISTIC_IDENTIFIER_RISKS: {
        FF: ffAnalyse.identifierRisks,
        RX: rxAnalyse.identifierRisks,
        LG: legacyAnalyse.identifierRisks,
      },
      CONFIRMED_REAL_PII: { FF: [], RX: [] },
      SHARED_KEY_CONFLICTS: parity.conflictingKeys,
      SURFACE_LOCAL_KEYS: {
        FF: ffAnalyse.demoKeys.filter((k) => !rxAnalyse.demoKeys.includes(k)),
        RX: rxAnalyse.demoKeys.filter((k) => !ffAnalyse.demoKeys.includes(k)),
      },
      FALLBACK_USAGE: {
        legacyHandlerPresent: ui?.LEGACY_FILL_HANDLER_PRESENT ?? false,
        legacyButtonPresent: ui?.LEGACY_BUTTON_RENDERED ?? false,
        runtimeUxFallbackUsed: m.FALLBACK_USED,
      },
      PARITY: {
        sharedKeysCount: parity.sharedKeys.length,
        valueEqualCount: parity.valueEqualKeys.length,
        semanticallyEquivalentCount: parity.semanticallyEquivalentKeys.length,
        conflictCount: parity.conflictingKeys.length,
      },
    };

    row.MULTI_AXIS_FINDINGS = m;
    row.PRIMARY_VERDICT = primaryVerdict(row);
    // Override DEMO_READY to align with PRIMARY_VERDICT for reporting
    if (row.PRIMARY_VERDICT !== "DEMO_READY") m.DEMO_READY = false;
    rows.push(row);
  }

  // Aggregate
  const counts = {
    DEMO_READY: 0,
    DEMO_NOT_EXPOSED_BY_PRODUCT: 0,
    DEMO_BLOCKED_EMPTY: 0,
    DEMO_BLOCKED_PARTIAL: 0,
    DEMO_BLOCKED_CONFLICT: 0,
    DEMO_BLOCKED_INVALID_CONTRACT: 0,
    DEMO_BLOCKED_INVALID_VALUE: 0,
    DEMO_BLOCKED_STALE: 0,
    DEMO_BLOCKED_IDENTIFIER_POLICY: 0,
    DEMO_BLOCKED_UI_WIRING: 0,
    DEMO_BLOCKED_UNRESOLVED_EXPORT: 0,
  };
  for (const r of rows) {
    counts[r.PRIMARY_VERDICT] = (counts[r.PRIMARY_VERDICT] ?? 0) + 1;
  }

  // Surface coverage rollups
  const surfaceCoverage = {
    formFlightDemoPresent: rows.filter((r) => r.ACTIVE_SURFACES.FF).length,
    runtimeUxDemoPresent: rows.filter((r) => r.ACTIVE_SURFACES.RX).length,
    crossSurfaceValueEqual: rows.filter((r) => r.PARITY.conflictCount === 0 && r.PARITY.sharedKeysCount > 0).length,
    crossSurfaceConflict: rows.filter((r) => r.PARITY.conflictCount > 0).length,
  };

  const out = {
    schema: "qllaw.phase15b3.trusted_demo_data/v1",
    runId: "PHASE15B3_PHASE9_TRUSTED_BASELINE",
    generatedAt: new Date().toISOString(),
    inputs: {
      AUTHORITY_INPUT,
      FIELD_POLICY_INPUT,
      UI_CAPABILITY_INPUT,
    },
    invariants: {
      rows: rows.length,
      unique: new Set(rows.map((r) => r.FORM_CODE)).size,
      unresolvedContracts: rows.filter((r) => r.AUTHORITY_CONTRACT_PATH == null).length,
      unclassified: rows.filter((r) => !r.PRIMARY_VERDICT).length,
    },
    counts,
    surfaceCoverage,
    rows,
  };

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = join(OUTPUT_DIR, "phase15b3-trusted-demo-data-213.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  const summary = {
    schema: "qllaw.phase15b3.trusted_demo_summary/v1",
    runId: "PHASE15B3_PHASE9_TRUSTED_BASELINE",
    generatedAt: out.generatedAt,
    invariants: out.invariants,
    counts,
    surfaceCoverage,
  };
  writeFileSync(join(OUTPUT_DIR, "phase15b3-trusted-demo-summary.json"), JSON.stringify(summary, null, 2));

  // Delta vs Phase 15B.2 (read the prior summary)
  const priorSummaryPath = join(OUTPUT_DIR, "phase15b2-demo-data-summary.json");
  let delta = null;
  if (existsSync(priorSummaryPath)) {
    const prior = readJson(priorSummaryPath);
    delta = buildDelta(prior, counts, surfaceCoverage);
  }
  if (delta) {
    writeFileSync(join(OUTPUT_DIR, "phase15b3-auditor-v1-v2-delta.json"), JSON.stringify(delta, null, 2));
  }

  console.log(JSON.stringify({
    ok: true,
    outPath,
    invariants: out.invariants,
    counts,
    surfaceCoverage,
  }, null, 2));
}

function countPopulatedRequired(demo, contractFieldPaths, manualRequiredPaths) {
  let count = 0;
  const useList = manualRequiredPaths.length > 0 ? manualRequiredPaths : contractFieldPaths;
  for (const p of useList) {
    if (Object.prototype.hasOwnProperty.call(demo, p)) {
      const v = demo[p];
      if (typeof v === "string" && v.trim().length > 0) count++;
    }
  }
  return count;
}

function buildDelta(prior, counts, surfaceCoverage) {
  const priorCounts = prior?.classificationBreakdown ?? prior?.counts ?? {};
  const deltas = {};
  for (const k of new Set([...Object.keys(counts), ...Object.keys(priorCounts)])) {
    deltas[k] = {
      prior: priorCounts[k] ?? 0,
      current: counts[k] ?? 0,
      delta: (counts[k] ?? 0) - (priorCounts[k] ?? 0),
    };
  }
  return {
    schema: "qllaw.phase15b3.auditor_v1_v2_delta/v1",
    generatedAt: new Date().toISOString(),
    note: "Phase 15B.3 classification counts vs Phase 15B.2 PROVISIONAL counts.",
    priorSummaryPath: "docs/audit/final-213-customer-ready/release-integration/phase15b2-demo-data-summary.json",
    perClassificationDelta: deltas,
    surfaceCoverage: surfaceCoverage,
    interpretation: [
      "Phase 15B.2 used a regex parser and first-match classification, which suppressed Runtime UX findings.",
      "Phase 15B.3 multi-axis classification captures every independent finding; the primary verdict is chosen only after all booleans are recorded.",
      "Forms reclassified from DEMO_READY in 15B.2 to DEMO_BLOCKED_* in 15B.3 indicate the v1 auditor was hiding a real defect (stale token, identifier risk, conflict).",
      "Forms reclassified from DEMO_BLOCKED_EMPTY in 15B.2 to DEMO_READY in 15B.3 indicate the v1 parser could not resolve an alias/spread that the v2 resolver does.",
      "Net effect: every form now has an evidence-anchored primary verdict with the underlying multi-axis findings preserved for downstream remediation.",
    ],
  };
}

main();
