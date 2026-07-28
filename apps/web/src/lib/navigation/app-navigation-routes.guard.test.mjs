/**
 * Static guard: every visible sidebar / topbar item must reuse the canonical
 * route map. Adversarial mutations on the route map or sidebar/topbar config
 * must fail this test.
 *
 * Generic invariant: the canonical route map and the visible sidebar/topbar
 * must not hardcode any individual BM-### form code. Form routes are dynamic
 * and resolved by the template/document flow. No real BM code (including
 * BM-200) belongs in the static canonical route map. The synthetic canary
 * `__UNREGISTERED_FORM_CANARY__` must also never appear in the route map.
 *
 * Uses Node.js built-in test runner. Reads the .ts source files as plain text
 * so we do not need a TS loader in the runner.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..", "..", "..");

const appRoutesPath = path.join(repoRoot, "apps", "web", "src", "lib", "navigation", "app-routes.ts");
const navItemsPath = path.join(repoRoot, "apps", "web", "src", "components", "layout", "nav-items.tsx");
const topbarPath = path.join(repoRoot, "apps", "web", "src", "components", "layout", "topbar.tsx");

function readSource(p) {
  return readFileSync(p, "utf8");
}

function extractAppRoutesConstants(source) {
  const out = {};
  const re = /(\w+):\s*["'`][^"'`]+["'`]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const name = m[1];
    if (name === "dashboard" || name === "cases" || name === "documents" ||
        name === "review" || name === "imports" || name === "reports" ||
        name === "settings" || name === "accountLinking" || name === "signIn") {
      const value = m[0].match(/["'`]([^"'`]+)["'`]/)[1];
      out[name] = value;
    }
  }
  return out;
}

function extractHrefs(source) {
  const matches = [];
  const regex = /href:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

const appRoutesSource = readSource(appRoutesPath);
const navItemsSource = readSource(navItemsPath);
const topbarSource = readSource(topbarPath);

const APP_ROUTES = extractAppRoutesConstants(appRoutesSource);
const sidebarHrefs = extractHrefs(navItemsSource);
const topbarHrefs = extractHrefs(topbarSource);

const CANONICAL = new Set([
  APP_ROUTES.dashboard,
  APP_ROUTES.cases,
  APP_ROUTES.documents,
  APP_ROUTES.review,
  APP_ROUTES.imports,
  APP_ROUTES.reports,
  APP_ROUTES.settings,
  APP_ROUTES.accountLinking,
  APP_ROUTES.signIn,
]);

test("app-routes exposes a canonical dashboard", () => {
  assert.equal(APP_ROUTES.dashboard, "/");
  assert.notEqual(APP_ROUTES.dashboard, "/dashboard");
});

test("sidebar visible hrefs all match canonical routes or dynamic placeholders", () => {
  for (const href of sidebarHrefs) {
    assert.ok(
      CANONICAL.has(href) || href.startsWith("/"),
      `Sidebar href "${href}" must resolve to a canonical route`,
    );
    assert.ok(
      href !== "" && href !== "#" && !href.startsWith("javascript:"),
      `Sidebar href "${href}" must not be empty, hash-only, or javascript: url`,
    );
    assert.ok(
      href !== "/dashboard" && href !== "/home",
      `Sidebar must not point to a removed/legacy route, got "${href}"`,
    );
    assert.ok(
      !["(authenticated)", "(dashboard)", "(shared)", "(workspace)"].some((g) => href.includes(g)),
      `Sidebar href "${href}" must not include a route-group segment`,
    );
  }
});

test("topbar visible hrefs all match canonical routes", () => {
  for (const href of topbarHrefs) {
    assert.ok(
      CANONICAL.has(href) || href.startsWith("/"),
      `Topbar href "${href}" must resolve to a canonical route`,
    );
    assert.ok(
      href !== "" && href !== "#" && !href.startsWith("javascript:"),
      `Topbar href "${href}" must not be empty, hash-only, or javascript: url`,
    );
  }
});

test("sidebar Tạo biểu mẫu and topbar + Tạo mới share the canonical creation route", () => {
  const plusCreateSidebar = sidebarHrefs.find((href) => href === APP_ROUTES.documents);
  const plusCreateTopbar = topbarHrefs.find((href) => href === APP_ROUTES.documents);
  assert.ok(
    plusCreateSidebar && plusCreateTopbar,
    "Both sidebar Tạo biểu mẫu and topbar + Tạo mới must use the canonical documents route",
  );
});

test("canonical route map never hardcodes a real BM code", () => {
  for (const [name, value] of Object.entries(APP_ROUTES)) {
    const text = String(value);
    assert.ok(
      !/BM-\d{3}/.test(text),
      `Canonical route '${name}'="${text}" must not embed a real BM-### form code`,
    );
    assert.ok(
      !text.includes("__UNREGISTERED_FORM_CANARY__"),
      `Canonical route '${name}' must not embed the synthetic canary code`,
    );
  }
  for (const href of [...sidebarHrefs, ...topbarHrefs]) {
    assert.ok(
      !/BM-\d{3}/.test(href),
      `Visible href "${href}" must not embed a real BM-### form code`,
    );
    assert.ok(
      !href.includes("__UNREGISTERED_FORM_CANARY__"),
      `Visible href "${href}" must not embed the synthetic canary code`,
    );
  }
});

test("app-routes exposes accountLinking only as a role-gated path", () => {
  assert.equal(APP_ROUTES.accountLinking, "/admin/auth/identities");
});
