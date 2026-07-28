/**
 * Clerk Global Setup — uses official @clerk/testing/playwright helper.
 *
 * Flow:
 *  1. clerkSetup() — fetches CLERK_TESTING_TOKEN from Clerk Backend API
 *     using CLERK_SECRET_KEY. This token bypasses email verification
 *     and MFA requirements.
 *  2. clerk.signIn({ emailAddress }) — creates sign-in ticket server-side,
 *     injects via page.evaluate(), calls setActive(). Handles ALL Clerk
 *     SDK versions automatically.
 *  3. Saves authenticated storageState to playwright/.clerk/admin.json.
 *
 * Why official helper over custom implementation:
 *  - Handles Clerk SDK version differences automatically
 *  - Uses CLERK_TESTING_TOKEN (not user-created signInToken)
 *  - Bypasses email verification and MFA requirements
 *  - Sets up route handler to inject testing token into FAPI requests
 *  - Reduces maintenance burden as Clerk SDK evolves
 *
 * DO NOT log tokens, cookies, or any auth-related values.
 * Auth state stored at playwright/.clerk/admin.json (gitignored).
 */

import { test as setup, expect } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import path from "node:path";

setup.describe.configure({ mode: "serial" });

const authStatePath = path.join(process.cwd(), "playwright", ".clerk", "admin.json");

// Step 1: Set up Clerk testing token (fetched from Clerk Backend API)
setup("clerk setup", async () => {
  // clerkSetup() loads .env.local and .env automatically.
  // Ensure CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are available.
  await clerkSetup();
});

// Step 2: Sign in with email and persist state
setup("authenticate and persist state", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  if (!email) {
    throw new Error("E2E_CLERK_USER_EMAIL must be set in .env.e2e.local.");
  }

  // Navigate to sign-in page
  await page.goto("/sign-in", { waitUntil: "networkidle" });

  // clerk.signIn() handles SDK loading, ticket creation, and setActive()
  // using the CLERK_TESTING_TOKEN set up by clerkSetup()
  await clerk.signIn({
    page,
    emailAddress: email,
  });

  // Verify session is active by accessing a protected route
  await page.goto("/templates/BM-001");
  await expect(page).not.toHaveURL(/sign-in|sign-up/, {
    timeout: 30_000,
    message: "Should not redirect to sign-in after authentication",
  });

  // Save authenticated state for subsequent tests
  await page.context().storageState({ path: authStatePath });
});
