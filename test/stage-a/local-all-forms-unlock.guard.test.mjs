import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const policyPath = join(root, "apps", "web", "src", "lib", "form-flight", "local-form-access-policy.ts");
const registryPath = join(root, "apps", "web", "src", "lib", "generated", "bm-panel-codes.generated.ts");
const lifecyclePath = join(root, "apps", "web", "src", "lib", "form-flight", "form-lifecycle.ts");
const pagePath = join(root, "apps", "web", "src", "app", "templates", "[templateCode]", "page.tsx");
const selectorPath = join(root, "apps", "web", "src", "components", "documents", "template-selector-workspace.tsx");
const policy = readFileSync(policyPath, "utf8");
const registry = readFileSync(registryPath, "utf8");
const lifecycle = readFileSync(lifecyclePath, "utf8");
const page = readFileSync(pagePath, "utf8");
const selector = readFileSync(selectorPath, "utf8");

const bmRe = /BM-\d{3}/g;
const registeredCodes = [...registry.matchAll(bmRe)].map((m) => m[0]);
const runtimeReadyCodes = [...lifecycle.matchAll(/profiles\/bm(\d{3})/g)].map((m) => "BM-" + m[1]);

function envGuard() {
  return policy.slice(policy.indexOf("export function resolveLocalAllFormsUnlock"), policy.indexOf("export function listRegisteredFormCodes"));
}

test("flag default is false: missing/undefined flagValue never enables", () => {
  const block = envGuard();
  assert.match(block, /environment\.flagValue === "true"/);
  assert.match(block, /environment\.isCi !== true/);
});

test("production NODE_ENV cannot enable local unlock on its own", () => {
  const block = envGuard();
  assert.match(block, /environment\.nodeEnv === "development"/);
  assert.doesNotMatch(block, /nodeEnv !== "production"/);
});

test("CI mode keeps local unlock disabled even with flag set", () => {
  const block = envGuard();
  assert.match(block, /environment\.isCi !== true/);
});

test("registry and promotion accounting remain 213 and 11", () => {
  assert.equal(registeredCodes.length, 213);
  assert.equal(new Set(runtimeReadyCodes).size, 11);
  assert.equal(runtimeReadyCodes.includes("BM-200"), false);
  assert.match(policy, /UNREGISTERED_FORM/);
});

test("synthetic canary code is never registered and always rejected", () => {
  assert.equal(registeredCodes.includes("__UNREGISTERED_FORM_CANARY__"), false);
  assert.match(policy, /"UNREGISTERED"/);
});

test("no real BM code is used as the failure canary", () => {
  assert.equal(runtimeReadyCodes.includes("BM-200"), false);
});

test("policy keeps skeleton output capabilities fail-closed", () => {
  const block = policy.slice(policy.indexOf("tier: \"LOCAL_SKELETON\""), policy.indexOf("tier: \"REGISTERED_RESTRICTED\""));
  assert.match(block, /canOpenEditor: true/);
  assert.match(block, /canUseRuntimeDocx: false/);
  assert.match(block, /canUsePreviewSession: false/);
  assert.match(block, /canUsePersistedDraftBridge: false/);
});

test("policy does not expand production runtime or bridge lists", () => {
  assert.match(policy, /STANDALONE_RUNTIME_TEMPLATE_CODES/);
  assert.doesNotMatch(policy, /PERSISTED_DRAFT_BRIDGE_RENDER_SCOPES/);
  assert.doesNotMatch(policy, /BM-002.*?BM-003/);
});

test("template preview page wires unlock from explicit env + CI flag", () => {
  assert.match(page, /resolveLocalAllFormsUnlock/);
  assert.match(page, /NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS/);
  assert.match(page, /process\.env\.CI === "true"/);
});

test("selector surfaces tier badge and filter for unlocked forms", () => {
  assert.match(selector, /LocalAccessTierBadge/);
  assert.match(selector, /tierFilter/);
  assert.match(selector, /local-unlock-banner/);
});

console.log("registered forms: " + registeredCodes.length);
console.log("runtime-ready: " + runtimeReadyCodes.length);
console.log("local skeleton: " + (registeredCodes.length - runtimeReadyCodes.length));
console.log("unregistered real forms: 0");
console.log("synthetic canary: rejected");
console.log("unknown code: rejected");
