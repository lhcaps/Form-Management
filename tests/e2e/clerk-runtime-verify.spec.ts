#!/usr/bin/env node
/**
 * Browser runtime instance verification.
 * Verifies Clerk FAPI hostname matches across env and browser.
 * 
 * Run with Playwright:
 *   node --experimental-vm-modules node_modules/.bin/playwright test \
 *     tests/e2e/clerk-runtime-verify.spec.ts --project=chromium
 */

import { test as setup, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenvConfig({ path: ".env.e2e.local", override: false });
dotenvConfig({ path: ".env.local", override: false });
dotenvConfig({ path: ".env", override: false });

function decodePublishableKeyPrefix(key) {
  if (!key) return null;
  try {
    const parts = key.split("_");
    if (parts.length < 3) return null;
    const instanceIdentifier = parts[2];
    const decoded = Buffer.from(instanceIdentifier, "base64url").toString("utf-8");
    return decoded;
  } catch {
    return null;
  }
}

setup("verify browser Clerk runtime instance", async ({ page }) => {
  // Get expected FAPI from env
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const expectedFapi = decodePublishableKeyPrefix(pubKey);

  console.log("Expected FAPI from env:", expectedFapi ?? "UNKNOWN");

  // Navigate to sign-in and get runtime info
  await page.goto("/sign-in", { waitUntil: "networkidle" });

  // Wait for Clerk SDK
  await page.waitForFunction(
    () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded),
    { timeout: 30_000 },
  );

  // Extract runtime info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtime = await page.evaluate(() => {
    const clerk = (window as any).Clerk as {
      frontendApi?: string;
      publishableKey?: string;
      loaded?: boolean;
    } | undefined;

    if (!clerk) return null;

    const pk = clerk.publishableKey ?? "";
    let fapi = clerk.frontendApi ?? null;
    let pkClass = "unknown";
    if (pk.startsWith("pk_test_")) pkClass = "pk_test";
    else if (pk.startsWith("pk_live_")) pkClass = "pk_live";
    else if (pk) pkClass = "other_prefix";

    return {
      loaded: clerk.loaded ?? false,
      frontendApi: fapi,
      publishableKeyPrefixClass: pkClass,
      // Only return first 10 chars of key for verification
      pkPreview: pk.slice(0, 10) + "...",
    };
  });

  console.log("Browser runtime:", JSON.stringify(runtime, null, 2));

  // Decode runtime FAPI from browser's frontendApi
  let browserFapiFromRuntime = null;
  if (runtime?.frontendApi) {
    const url = new URL(`https://${runtime.frontendApi}`);
    browserFapiFromRuntime = url.hostname;
  }

  console.log("Browser FAPI hostname:", browserFapiFromRuntime ?? "UNKNOWN");
  console.log("Expected FAPI from env:", expectedFapi ?? "UNKNOWN");

  // Verify match
  const instanceMatch = browserFapiFromRuntime === expectedFapi;

  expect(instanceMatch, `FAPI mismatch: browser=${browserFapiFromRuntime}, env=${expectedFapi}`)
    .toBe(true);

  console.log("✅ Instance match verified");
});
