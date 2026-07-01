/**
 * Clerk Foundation E2E Tests — PR-1
 *
 * These tests verify Clerk web route protection behavior.
 *
 * AUTH MODE AWARENESS:
 *  - Clerk mode: When Clerk env vars are set, unauthenticated users are
 *    redirected to /sign-in by clerkMiddleware().
 *  - Legacy mode: When Clerk env vars are absent (dev / E2E), unauthenticated
 *    users are redirected to /sign-in by the compatibility fallback.
 *
 * SKIPPED TESTS: Authenticated login tests require a real Clerk test instance
 * with configured test users. These are deferred to PR-7 (E2E Migration).
 */

import { test, expect } from "@playwright/test";

const CLERK_ENABLED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

function expectSignInRedirect(pageUrl: string, expectedReturnPath?: string) {
  const url = new URL(pageUrl);
  expect(url.pathname).toContain("/sign-in");
  if (expectedReturnPath) {
    const redirectUrl =
      url.searchParams.get("return_url") ?? url.searchParams.get("redirect_url");
    expect(redirectUrl).toBeTruthy();
    const parsedRedirect = new URL(redirectUrl ?? "/", url.origin);
    expect(`${parsedRedirect.pathname}${parsedRedirect.search}`).toBe(
      expectedReturnPath,
    );
  }
}

test.describe("Clerk Foundation — Route Protection", () => {
  test("unauthenticated user visiting /cases redirects to sign-in page", async ({
    page,
  }) => {
    await page.goto("/cases");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    if (!CLERK_ENABLED) expectSignInRedirect(page.url(), "/cases");
  });

  test("unauthenticated user visiting /documents redirects to sign-in page", async ({
    page,
  }) => {
    await page.goto("/documents");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    if (!CLERK_ENABLED) expectSignInRedirect(page.url(), "/documents");
  });

  test("sign-in page is accessible (no redirect loop)", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-up page is accessible (no redirect loop)", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("legacy /login redirects to canonical sign-in preserving returnUrl", async ({
    page,
  }) => {
    await page.goto("/login?returnUrl=/documents");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    expectSignInRedirect(page.url(), "/documents");
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
    await expect(page.getByText("QUANLYVKS").first()).toBeVisible();
  });

  test("sign-up page renders QUANLYVKS branding", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText("QUANLYVKS").first()).toBeVisible();
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
