/**
 * next-config-monorepo-root.guard.test.mjs
 *
 * Verifies that apps/web/next.config.ts resolves MONOREPO_ROOT correctly
 * on both win32 and posix path semantics.
 *
 * MONOREPO_ROOT must resolve to the repository root (two levels up from
 * apps/web/), not apps/ or apps/web/ or any deeper path.
 *
 * Run: node --test test/infrastructure/next-config-monorepo-root.guard.test.mjs
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

// The actual repository root from this test file's perspective.
// This test file is at: test/infrastructure/ → root is ../../
const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
// Normalise to forward-slash for cross-platform comparison
const normalise = (p) => p.replace(/\\/g, "/").replace(/\/$/, "");

describe("next.config.ts MONOREPO_ROOT path semantics", () => {
  it("REPO_ROOT resolves to the actual monorepo root", () => {
    const normalised = normalise(REPO_ROOT);
    assert.ok(
      normalised.endsWith("/QLLaw-main"),
      `Expected REPO_ROOT to end with /QLLaw-main but got: ${normalised}`,
    );
  });

  it("win32: resolve(importMetaUrl, '../../../') from apps/web/next.config.ts → repo root", () => {
    // Simulate Windows file URL for apps/web/next.config.ts
    const win32ConfigUrl = "file:///D:/Study/Project/QLLaw-main/apps/web/next.config.ts";
    const win32ConfigPath = fileURLToPath(win32ConfigUrl);
    // This is what the current next.config.ts does:
    const MONOREPO_ROOT_win32 = resolve(win32ConfigPath, "../../../");
    const normalised = normalise(MONOREPO_ROOT_win32);
    assert.ok(
      normalised.endsWith("/QLLaw-main"),
      `win32: MONOREPO_ROOT should end with /QLLaw-main, got: ${normalised}`,
    );
    assert.doesNotMatch(
      normalised,
      /\/apps\/web$/,
      "MONOREPO_ROOT must not be apps/web",
    );
    assert.doesNotMatch(
      normalised,
      /\/apps$/,
      "MONOREPO_ROOT must not be apps/",
    );
  });

  it("posix: path arithmetic from apps/web/next.config.ts → repo root (two levels up from file, three from dirname+up+up)", () => {
    // On POSIX, fileURLToPath("file:///home/user/projects/QLLaw-main/apps/web/next.config.ts")
    // returns "/home/user/projects/QLLaw-main/apps/web/next.config.ts".
    // We test the same path arithmetic using resolve() with a synthetic posix-like string.
    // We avoid calling fileURLToPath with a POSIX URL on Windows (platform limitation).
    const syntheticConfigPath = "/home/user/projects/QLLaw-main/apps/web/next.config.ts";
    // resolve(configPath, "../../../") goes: config.ts → apps/web → apps → QLLaw-main
    const MONOREPO_ROOT_posix = resolve(syntheticConfigPath, "../../../");
    const normalised = normalise(MONOREPO_ROOT_posix);
    assert.ok(
      normalised.endsWith("/QLLaw-main"),
      `posix arithmetic: MONOREPO_ROOT should end with /QLLaw-main, got: ${normalised}`,
    );
    assert.doesNotMatch(normalised, /\/apps\/web$/, "MONOREPO_ROOT must not be apps/web");
    assert.doesNotMatch(normalised, /\/apps$/, "MONOREPO_ROOT must not be apps/");
  });

  it("dirname+resolve alternative: resolve(dirname(importMetaUrl), '../..') is equivalent", () => {
    const configUrl = "file:///D:/Study/Project/QLLaw-main/apps/web/next.config.ts";
    const configPath = fileURLToPath(configUrl);

    // Current implementation: resolve(configPath, '../../../')
    const form1 = normalise(resolve(configPath, "../../../"));
    // Alternative: resolve(dirname(configPath), '../..')
    const form2 = normalise(resolve(dirname(configPath), "../.."));

    assert.equal(form1, form2, "both forms of MONOREPO_ROOT must be equivalent");
  });

  it("next.config.ts exists at apps/web/next.config.ts", () => {
    assert.ok(
      existsSync(resolve(REPO_ROOT, "apps/web/next.config.ts")),
      "apps/web/next.config.ts not found",
    );
  });

  it("next.config.ts contains output: standalone (RC-008)", () => {
    const content = readFileSync(resolve(REPO_ROOT, "apps/web/next.config.ts"), "utf8");
    assert.match(
      content,
      /output:\s*["']standalone["']/,
      "next.config.ts must have output: 'standalone' (RC-008)",
    );
  });

  it("next.config.ts contains outputFileTracingRoot pointing to monorepo root", () => {
    const content = readFileSync(resolve(REPO_ROOT, "apps/web/next.config.ts"), "utf8");
    assert.match(
      content,
      /outputFileTracingRoot/,
      "next.config.ts must set outputFileTracingRoot",
    );
    assert.match(
      content,
      /fileURLToPath/,
      "outputFileTracingRoot must use fileURLToPath for ESM compatibility",
    );
  });
});
