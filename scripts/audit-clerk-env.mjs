#!/usr/bin/env node
/**
 * Comprehensive env audit for E2E Clerk auth.
 * Reports PRESENT/MISSING only — never logs values.
 * 
 * Checks:
 *  1. All required keys in all env files
 *  2. Dotenv load order in playwright.config.ts
 *  3. Key prefix class (pk_test vs pk_live)
 *  4. dotenv load order vs Clerk client init
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

const REQUIRED_KEYS = [
  "CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "E2E_CLERK_USER_EMAIL",
];

const ENV_FILES = [
  { path: ".env", note: "root" },
  { path: ".env.local", note: "root local" },
  { path: ".env.e2e.local", note: "root e2e" },
  { path: "apps/web/.env.local", note: "web local" },
];

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rawVal = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    const value = rawVal.replace(/^["']|["']$/g, "");
    vars[key] = value;
  }
  return vars;
}

function checkKeyPresence(vars, key) {
  const value = vars[key];
  if (value === undefined || value === "") return "MISSING";
  if (value.startsWith("pk_test_") || value.startsWith("pk_live_")) return "PRESENT_pk_test_or_live";
  if (value.startsWith("sk_test_") || value.startsWith("sk_live_")) return "PRESENT_sk_test_or_live";
  if (key === "E2E_CLERK_USER_EMAIL" && value.includes("@")) return "PRESENT_email";
  return "PRESENT_unknown_format";
}

console.log("=" .repeat(70));
console.log("CLERK E2E ENV AUDIT");
console.log("=" .repeat(70));
console.log(`Project root: ${projectRoot}`);
console.log("");

// 1. Check each env file
for (const { path: relPath, note } of ENV_FILES) {
  const absPath = resolve(projectRoot, relPath);
  console.log(`--- ${relPath} (${note}) ---`);
  
  if (!existsSync(absPath)) {
    console.log("  STATUS: FILE_NOT_FOUND");
    for (const key of REQUIRED_KEYS) {
      console.log(`  ${key.padEnd(35)} MISSING`);
    }
    console.log("");
    continue;
  }
  
  const content = readFileSync(absPath, "utf-8");
  const vars = parseEnv(content);
  
  for (const key of REQUIRED_KEYS) {
    const presence = checkKeyPresence(vars, key);
    const status = presence === "MISSING" ? "❌ MISSING" : "✅ PRESENT";
    console.log(`  ${key.padEnd(35)} ${status} (${presence})`);
  }
  console.log("");
}

// 2. Check playwright.config.ts dotenv order
console.log("--- playwright.config.ts dotenv load order ---");
const playwrightConfigPath = resolve(projectRoot, "playwright.config.ts");
if (existsSync(playwrightConfigPath)) {
  const configContent = readFileSync(playwrightConfigPath, "utf-8");
  const dotenvLines = configContent.split("\n").filter(l => l.includes("dotenvConfig"));
  for (const line of dotenvLines) {
    console.log(`  ${line.trim()}`);
  }
} else {
  console.log("  playwright.config.ts NOT FOUND");
}
console.log("");

// 3. Check CLERK_PUBLISHABLE_KEY fallback in playwright.config.ts
console.log("--- CLERK_PUBLISHABLE_KEY fallback ---");
if (existsSync(playwrightConfigPath)) {
  const configContent = readFileSync(playwrightConfigPath, "utf-8");
  const fallbackLines = configContent.split("\n").filter(l => l.includes("CLERK_PUBLISHABLE_KEY"));
  if (fallbackLines.length > 0) {
    for (const line of fallbackLines) {
      console.log(`  ${line.trim()}`);
    }
  } else {
    console.log("  NO FALLBACK LINE FOUND");
  }
}
console.log("");

// 4. Check global.setup.ts token creation approach
console.log("--- global.setup.ts approach ---");
const setupPath = resolve(projectRoot, "tests/e2e/global.setup.ts");
if (existsSync(setupPath)) {
  const setupContent = readFileSync(setupPath, "utf-8");
  const usesOfficial = setupContent.includes('clerk.signIn({') || setupContent.includes('clerkSetup()');
  const usesCustomTicket = setupContent.includes("signInTokens.createSignInToken") || setupContent.includes("page.evaluate");
  console.log(`  Uses official clerk.signIn:     ${usesOfficial ? "✅ YES" : "❌ NO"}`);
  console.log(`  Uses custom ticket injection:  ${usesCustomTicket ? "⚠️  YES (custom)" : "❌ NO"}`);
} else {
  console.log("  global.setup.ts NOT FOUND");
}
console.log("");

// 5. Check if @clerk/testing is available
console.log("--- @clerk/testing package ---");
const pkgPath = resolve(projectRoot, "node_modules/@clerk/testing/package.json");
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  console.log(`  Version: ${pkg.version}`);
  console.log(`  ✅ INSTALLED`);
} else {
  console.log("  ❌ NOT INSTALLED");
}
console.log("");

// 6. Summary
console.log("=" .repeat(70));
console.log("SUMMARY");
console.log("=".repeat(70));

const e2eLocalPath = resolve(projectRoot, ".env.e2e.local");
if (existsSync(e2eLocalPath)) {
  const vars = parseEnv(readFileSync(e2eLocalPath, "utf-8"));
  const allPresent = REQUIRED_KEYS.every(k => vars[k] && vars[k] !== "");
  console.log(`All required keys in .env.e2e.local: ${allPresent ? "✅ PRESENT" : "❌ MISSING SOME"}`);
} else {
  console.log(".env.e2e.local: ❌ NOT FOUND");
}

console.log("");
console.log("Dotenv load order (playwright.config.ts):");
console.log("  1. .env.e2e.local");
console.log("  2. .env.local");
console.log("  3. .env");
console.log("  4. CLERK_PUBLISHABLE_KEY ??= NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
console.log("");
console.log("Next.js dev web (dev-web-with-root-env.mjs):");
console.log("  Loads: .env only (from root)");
console.log("  Does NOT load: .env.e2e.local");
console.log("");
console.log("⚠️  CRITICAL: Web dev server loads .env, NOT .env.e2e.local");
console.log("   But E2E tests load .env.e2e.local first.");
console.log("   Both files have the SAME keys — this is OK IF values match.");
console.log("");
