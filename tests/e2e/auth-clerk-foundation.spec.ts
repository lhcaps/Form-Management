/**
 * Clerk Foundation E2E Tests — PR-1
 *
 * These tests verify Clerk web route protection behavior.
 *
 * AUTH MODE AWARENESS:
 *  - Clerk mode: When Clerk env vars are set, unauthenticated users are
 *    redirected to /sign-in by clerkMiddleware().
 *  - Legacy mode: When Clerk env vars are absent (dev / E2E), unauthenticated
 *    users are redirected to /login (legacy flow). This keeps existing E2E
 *    tests working without a Clerk test instance.
 *
 * SKIPPED TESTS: Authenticated login tests require a real Clerk test instance
 * with configured test users. These are deferred to PR-7 (E2E Migration).
 */

import { test, expect } from "@playwright/test";

const CLERK_ENABLED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

test.describe("Clerk Foundation — Route Protection", () => {
  test("unauthenticated user visiting /cases redirects to sign-in page", async ({
    page,
  }) => {
    await page.goto("/cases");
    const url = page.url();
    if (CLERK_ENABLED) {
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    } else {
      // Legacy mode: redirects to /login with returnUrl
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    }
  });

  test("sign-in page is accessible (no redirect loop)", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-up page is accessible (no redirect loop)", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("login page is accessible (legacy fallback route)", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("SKIPPED — authenticated user can access /cases", async () => {
    // SKIPPED_REQUIRES_CLERK_TEST_INSTANCE
    // Requires real Clerk dev instance with test user credentials.
    // Implemented in PR-7 (E2E Migration).
    test.skip(true, "Requires Clerk test instance — deferred to PR-7");
  });

  test("SKIPPED — sign out returns to /sign-in", async () => {
    // SKIPPED_REQUIRES_CLERK_TEST_INSTANCE
    // Requires real Clerk dev instance with test user credentials.
    test.skip(true, "Requires Clerk test instance — deferred to PR-7");
  });
});

test.describe("Clerk Foundation — Sign-In / Sign-Up Pages", () => {
  test("sign-in page renders QUANLYVKS branding", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("QUANLYVKS")).toBeVisible();
  });

  test("sign-up page renders QUANLYVKS branding", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText("QUANLYVKS")).toBeVisible();
  });

  test("sign-in page has heading 'Đăng nhập hệ thống'", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /đăng nhập hệ thống/i })).toBeVisible();
  });

  test("sign-up page has heading 'Tạo tài khoản'", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /tạo tài khoản/i })).toBeVisible();
  });
});

test.describe("Clerk Foundation — Legacy Mode Compatibility", () => {
  test("legacy /login page still works when Clerk is not configured", async ({
    page,
  }) => {
    // This test is only meaningful in legacy mode
    if (CLERK_ENABLED) {
      test.skip();
    }
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /đăng nhập/i })
    ).toBeVisible();
  });
});
