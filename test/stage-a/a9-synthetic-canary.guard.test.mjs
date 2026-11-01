// A9 dedicated synthetic-canary guard.
// Asserts the production-grade architecture for defect A9:
//   - The synthetic canary is the literal sentinel UNREGISTERED_FORM_CANARY.
//   - The synthetic canary fails closed via UNREGISTERED_FORM reason.
//   - BM-200 is an ordinary real form whose eligibility is decided
//     by the same allowlist as every other form.
//   - No production code tree excludes BM-200 by code identity.
//   - No production code tree elevates BM-200 to runtime-ready.
//   - No other real BM code has been quietly pressed into service
//     as a permanent negative-control canary.
// The guard exits non-zero when any assertion fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const BRIDGE_PATH = join(ROOT, "packages", "form-contracts", "src", "bridge-eligibility.ts");
const FORM_LIFECYCLE_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "form-lifecycle.ts");
const REGISTRY_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "registry.ts");
const PROFILE_STATUS_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "profile-status.ts");
const APP_ROUTES_PATH = join(ROOT, "apps", "web", "src", "lib", "navigation", "app-routes.ts");
const NAV_GUARD_PATH = join(ROOT, "apps", "web", "src", "lib", "navigation", "app-navigation-routes.guard.test.mjs");
const BM200_PROFILE_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "profiles", "bm200.ts");
const CURATED_GUARD_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "curated-runtime-ux-batch.guard.test.mjs");
const BM001_GUARD_PATH = join(ROOT, "apps", "web", "src", "lib", "form-flight", "bm001-smart-runtime-ux.guard.test.mjs");
const bridgeSrc = readFileSync(BRIDGE_PATH, "utf8");
// Strip block comments and JS regex literals so the test does not flag itself.
function stripPolicies(s) {
  let out = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // Strip JS regex literals: /.../x?  (greedy match between non-escaped slashes).
  out = out.replace(/\/(?:[^\/\\\n]|\\.)+\/[gimsuy]*/g, "\"STRIPPED\"");
  return out;
}
// Strip block comments and // line comments.
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

test("A9.1: synthetic canary sentinel is the canonical string", () => {
  assert.match(bridgeSrc, /UNREGISTERED_FORM_CANARY\s*=\s*["']__UNREGISTERED_FORM_CANARY__["']/);
});

test("A9.2: synthetic canary is not in the runtime-ready allowlist", () => {
  const m = bridgeSrc.match(/STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  assert.ok(m, "STANDALONE_RUNTIME_TEMPLATE_CODES must be defined");
  const listed = m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  for (const code of ["BM-001","BM-136","BM-148","BM-156","BM-157","BM-168","BM-171","BM-174","BM-181","BM-206","BM-213"]) {
    assert.ok(listed.includes(code), "Roster missing " + code);
  }
  assert.ok(!listed.includes("__UNREGISTERED_FORM_CANARY__"), "Synthetic canary must NEVER be in the runtime-ready allowlist");
  assert.ok(!listed.includes("BM-200"), "BM-200 must not be in the runtime-ready allowlist (it is a real form not yet promoted)");
});

test("A9.3: production code exports the synthetic canary", () => {
  const browserSrc = readFileSync(join(ROOT, "packages", "form-contracts", "src", "browser.ts"), "utf8");
  assert.match(browserSrc, /UNREGISTERED_FORM_CANARY/);
});

test("A9.4: synthetic canary rejected with UNREGISTERED_FORM via policy source", () => {
  assert.match(bridgeSrc, /UNREGISTERED_FORM_CANARY[\s\S]{0,200}?UNREGISTERED_FORM/);
});

test("A9.5: no production codepath excludes BM-200 by code identity", () => {
  const guarded = [BRIDGE_PATH, FORM_LIFECYCLE_PATH, REGISTRY_PATH, PROFILE_STATUS_PATH, APP_ROUTES_PATH];
  for (const f of guarded) {
    if (!existsSync(f)) continue;
    const src = stripComments(readFileSync(f, "utf8"));
    const cm = [
      /formCode\s*===\s*["']BM-200["']/,
      /code\s*===\s*["']BM-200["']/,
      /templateCode\s*===\s*["']BM-200["']/,
      /["']BM-200["']\s*:\s*\{/,
    ];
    for (const rx of cm) {
      assert.ok(!rx.test(src), f + " contains BM-200 code-identity branch");
    }
  }
});

test("A9.6: BM-200 not auto-promoted to runtime-ready in code", () => {
  if (existsSync(BM200_PROFILE_PATH)) {
    const bm200 = stripComments(readFileSync(BM200_PROFILE_PATH, "utf8"));
    assert.ok(!/\bruntimeReady:\s*true\b/.test(bm200), "bm200.ts must not be runtime-ready");
    assert.ok(!/\bprofileStatus:\s*["']runtime-ready["']/.test(bm200), "bm200.ts must not carry profileStatus = runtime-ready");
  }
});

test("A9.7: curated guard no longer pins BM-200 as canary", () => {
  const curatedGuard = stripComments(readFileSync(CURATED_GUARD_PATH, "utf8"));
  assert.ok(!/canaries\s*=\s*\[[^\]]*["']BM-200["']/i.test(curatedGuard), "curated guard must not pin BM-200 as canary");
});

test("A9.7b: navigation guard enforces generic no-BM-digits invariant", () => {
  const navGuard = readFileSync(NAV_GUARD_PATH, "utf8");
  assert.ok(!/BM-200 policy is unchanged/i.test(navGuard), "nav-routes guard must not test BM-200-specific policy");
  assert.ok(/BM-\d{3}/.test(navGuard), "nav-routes guard must enforce no-BM-digits invariant");
});

test("A9.8: no permanent-canary phrases appear in current guards", () => {
  const guardFiles = [CURATED_GUARD_PATH, BM001_GUARD_PATH];
  for (const f of guardFiles) {
    const src = stripPolicies(readFileSync(f, "utf8"));
    const phrases = [/permanently excluded/, /stays excluded by design/, /POLICY_EXCLUDED/, /permanent canary/, /policy canary/];
    for (const rx of phrases) {
      assert.ok(!rx.test(src), f + " still describes permanent canary policy: " + rx);
    }
  }
});

test("A9.9: BM-200 not referenced by literal in bridge-eligibility source", () => {
  const body = stripComments(bridgeSrc);
  assert.ok(!/["']BM-200["']/.test(body), "bridge-eligibility must not mention BM-200 by literal");
  assert.ok(/UNREGISTERED_FORM_CANARY/.test(body), "bridge-eligibility must reference UNREGISTERED_FORM_CANARY");
});

test("A9.10: synthetic canary alone yields UNREGISTERED_FORM", () => {
  const standalone = bridgeSrc.match(/STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  const listed = standalone[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  assert.ok(!listed.includes("__UNREGISTERED_FORM_CANARY__"));
  assert.ok(!listed.includes("BM-200"));
});

test("A9.11: A2 regression guard still exists", () => {
  const a2 = join(ROOT, "test", "document-fidelity", "document-header-integrity.guard.test.mjs");
  assert.ok(existsSync(a2));
});
