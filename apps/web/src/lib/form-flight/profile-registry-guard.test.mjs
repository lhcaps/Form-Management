/**
 * Form Flight profile registry guard test.
 *
 * Pure file-system check (no DB, no fetch, no React). Verifies the
 * Form Flight inventory after the BM-001 + BM-171 baseline plus the
 * 211 generated skeletons shipped in this phase, then updated after
 * the BM-001 second-pilot promotion (Phase
 * "BM-001 Fidelity Repair With Verified Notes").
 *
 *   1. Exactly 213 profile files exist under
 *      `apps/web/src/lib/form-flight/profiles/`.
 *   2. The file naming convention matches `bmNNN.ts` (zero-padded
 *      three-digit suffix) for every code in the verified extract.
 *   3. BM-171 is preserved as runtime-ready (NOT downgraded).
 *   4. BM-001 is preserved as runtime-ready (NOT downgraded) — same
 *      readiness posture as BM-171 since the BM-001 Fidelity Repair
 *      phase promoted it from skeleton to runtime-ready.
 *   5. Every generated skeleton (i.e. every code other than BM-001
 *      and BM-171) is NOT runtime-ready: `runtimeReady: true` and
 *      `profileStatus: "runtime-ready"` are absent from generated
 *      files.
 *   6. Every generated skeleton has an empty `demo: {}` and empty
 *      `acceptance: { requiredText: [], forbiddenText: [] }`.
 *   7. Every profile (skeleton OR runtime-ready) registers its
 *      profile via `registerFormFlightProfile(...)`.
 *   8. No profile file imports the runtime adapters (pure metadata).
 *   9. Every generated skeleton has non-empty fieldPaths.
 *
 * Run with:
 *   node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs
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
const EXTRACT = join(
  ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "QLLAW_DOCX_FIDELITY_SOURCE_EXTRACT.latest.json",
);
const PRESERVED = new Set(["BM-001", "BM-171"]);
// After BM-001 promotion, BM-001 and BM-171 are the ONLY profiles with
// `runtimeReady: true`. The 211 generated skeletons must stay skeleton.
const RUNTIME_READY = new Set(["BM-001", "BM-171"]);

const extract = JSON.parse(readFileSync(EXTRACT, "utf8"));
const allCodes = new Set(extract.forms.map((f) => f.code));
assert.equal(allCodes.size, 213, "extract must contain 213 unique codes");

const files = readdirSync(PROFILE_DIR).filter((f) => /^bm\d{3}\.ts$/.test(f));
const fileToCode = new Map();
for (const f of files) {
  const num = f.match(/^bm(\d{3})\.ts$/)[1];
  fileToCode.set(f, `BM-${num}`);
}

describe("Form Flight profile registry guard", () => {
  it("1. exactly 213 profile files exist", () => {
    assert.equal(files.length, 213, `expected 213, got ${files.length}`);
  });

  it("2. file naming bmNNN.ts matches every extract code", () => {
    for (const code of allCodes) {
      const num = code.split("-")[1].padStart(3, "0");
      const file = `bm${num}.ts`;
      assert.ok(
        files.includes(file),
        `missing profile file for ${code}: ${file}`,
      );
    }
  });

  it("3. BM-171 is preserved runtime-ready", () => {
    const src = readFileSync(join(PROFILE_DIR, "bm171.ts"), "utf8");
    assert.match(src, /runtimeReady:\s*true/);
    assert.match(src, /profileStatus:\s*"runtime-ready"/);
    assert.match(
      src,
      /registerFormFlightProfile\(BM171_FORM_FLIGHT_PROFILE\)/,
    );
  });

  it("4. BM-001 is preserved as runtime-ready (NOT downgraded)", () => {
    const src = readFileSync(join(PROFILE_DIR, "bm001.ts"), "utf8");
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.match(
      stripped,
      /runtimeReady:\s*true/,
      "BM-001 must declare runtimeReady: true",
    );
    assert.match(
      stripped,
      /profileStatus:\s*"runtime-ready"/,
      'BM-001 must declare profileStatus: "runtime-ready"',
    );
  });

  it("4b. only BM-001 and BM-171 carry runtime-ready flags", () => {
    const files = readdirSync(PROFILE_DIR).filter((f) =>
      /^bm\d{3}\.ts$/.test(f),
    );
    for (const f of files) {
      const num = f.match(/^bm(\d{3})\.ts$/)[1];
      const code = `BM-${num}`;
      const stripped = readFileSync(join(PROFILE_DIR, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      const hasRuntimeReady = /runtimeReady:\s*true/.test(stripped);
      const hasProfileStatusRuntime =
        /profileStatus:\s*"runtime-ready"/.test(stripped);
      if (RUNTIME_READY.has(code)) {
        assert.ok(
          hasRuntimeReady,
          `${code} is in RUNTIME_READY — must declare runtimeReady: true`,
        );
        assert.ok(
          hasProfileStatusRuntime,
          `${code} is in RUNTIME_READY — must declare profileStatus: "runtime-ready"`,
        );
      } else {
        assert.ok(
          !hasRuntimeReady,
          `${code} must NOT declare runtimeReady: true`,
        );
        assert.ok(
          !hasProfileStatusRuntime,
          `${code} must NOT declare profileStatus: "runtime-ready"`,
        );
      }
    }
  });

  it("5. every generated skeleton is NOT runtime-ready", () => {
    for (const code of allCodes) {
      if (PRESERVED.has(code)) continue;
      const num = code.split("-")[1].padStart(3, "0");
      const src = readFileSync(join(PROFILE_DIR, `bm${num}.ts`), "utf8");
      // Strip comments so doc comments mentioning the literal phrase
      // don't trigger a false positive. Block + line comments.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.ok(
        !/runtimeReady:\s*true/.test(stripped),
        `${code} must not set runtimeReady: true`,
      );
      assert.ok(
        !/profileStatus:\s*"runtime-ready"/.test(stripped),
        `${code} must not set profileStatus: "runtime-ready"`,
      );
      // Skeletons must explicitly mark themselves skeleton OR
      // audit-only (any non-runtime value, fail-closed).
      assert.ok(
        /profileStatus:\s*"(skeleton|audit-only)"/.test(stripped) ||
          /runtimeReady:\s*false/.test(stripped),
        `${code} must be marked skeleton / audit-only OR have runtimeReady: false`,
      );
    }
  });

  it("6. every generated skeleton has empty demo and empty acceptance", () => {
    for (const code of allCodes) {
      if (PRESERVED.has(code)) continue;
      const num = code.split("-")[1].padStart(3, "0");
      const src = readFileSync(join(PROFILE_DIR, `bm${num}.ts`), "utf8");
      assert.match(src, /demo:\s*\{\s*\}/);
      assert.match(src, /requiredText:\s*\[\s*\],/);
      assert.match(src, /forbiddenText:\s*\[\s*\]/);
    }
  });

  it("7. every generated skeleton self-registers via registerFormFlightProfile", () => {
    for (const code of allCodes) {
      const num = code.split("-")[1].padStart(3, "0");
      const src = readFileSync(join(PROFILE_DIR, `bm${num}.ts`), "utf8");
      assert.match(
        src,
        new RegExp(
          `registerFormFlightProfile\\(BM${num}_FORM_FLIGHT_PROFILE\\)`,
        ),
        `${code} must self-register via registerFormFlightProfile`,
      );
    }
  });

  it("8. no profile file imports the runtime adapters", () => {
    for (const code of allCodes) {
      const num = code.split("-")[1].padStart(3, "0");
      const src = readFileSync(join(PROFILE_DIR, `bm${num}.ts`), "utf8");
      assert.ok(
        !/from\s*["'].*template-runtime-adapter["']/.test(src) &&
          !/from\s*["'].*generated-document-adapter["']/.test(src),
        `${code} must not import runtime adapters (profiles are pure metadata)`,
      );
    }
  });

  it("9. every generated skeleton has non-empty fieldPaths", () => {
    for (const code of allCodes) {
      if (PRESERVED.has(code)) continue;
      const num = code.split("-")[1].padStart(3, "0");
      const src = readFileSync(join(PROFILE_DIR, `bm${num}.ts`), "utf8");
      // Count string literals inside BMxxx_FIELD_PATHS as const
      const m = src.match(/const\s+BM\d+_FIELD_PATHS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
      assert.ok(m, `${code} must declare BMxxx_FIELD_PATHS`);
      const literalCount = (m[1].match(/"/g) || []).length;
      assert.ok(
        literalCount >= 2,
        `${code} must have at least one field path (got ${literalCount / 2})`,
      );
    }
  });
});