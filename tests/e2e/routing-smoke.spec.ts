/**
 * Routing smoke audit for the BM-001 browser/E2E unblock.
 *
 * Purpose: prove that the Next.js dev server serves the Clerk auth
 * routes and the Clerk-protected /templates/[templateCode] routes
 * end-to-end with the Clerk ticket strategy. This test does NOT
 * exercise the runtime preview UX (which requires pre-filled form
 * data); it focuses on routing + auth + page-load assertions only.
 *
 * Each test in this spec must pass under the documented Clerk
 * ticket strategy (tests/e2e/global.setup.ts) and must NOT depend
 * on `qlv_session`.
 *
 * Run with: pnpm exec playwright test --project="authenticated chromium" \
 *   --grep "routing smoke"
 */

import { expect, test } from "@playwright/test";

const PROTECTED_TEMPLATES = ["BM-001", "BM-171", "BM-002"] as const;

test.describe("Routing smoke — BM-001 unblock audit", () => {
  test("Clerk auth: protected routes do NOT redirect to /sign-in after ticket sign-in", async ({
    page,
  }) => {
    for (const templateCode of PROTECTED_TEMPLATES) {
      await page.goto(`/templates/${templateCode}`);
      await expect(page).not.toHaveURL(/sign-in|sign-up/, {
        timeout: 15_000,
      });
      await expect(page.getByText(/BM-\d+/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("BM-001 page renders the runtime-ready smart-ux shell", async ({
    page,
  }) => {
    await page.goto("/templates/BM-001");

    // Page chrome is present.
    await expect(page.getByText(/BM-001/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Smart-runtime-UX section headings (e.g. "1. Thông tin chung biên bản").
    const sectionHeadings = page.locator("h3", {
      hasText: /Thông tin chung|Người tiếp nhận|Người cung cấp|Nơi lưu hồ sơ|Diễn biến|Nội dung nguồn tin/,
    });
    await expect(sectionHeadings.first()).toBeVisible({ timeout: 15_000 });
    const sectionCount = await sectionHeadings.count();
    expect(sectionCount).toBeGreaterThanOrEqual(4);

    // Form controls are present (textbox + combobox).
    const textboxes = page.locator('input[type="text"], textarea');
    await expect(textboxes.first()).toBeVisible({ timeout: 10_000 });
    const textboxCount = await textboxes.count();
    expect(textboxCount).toBeGreaterThanOrEqual(10);

    // No global not-found boundary.
    await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);

    // Save-to-case CTA is disabled (no hồ sơ selected).
    const saveToCaseBtn = page
      .getByRole("button", { name: /Tạo văn bản từ hồ sơ|Lưu vào hồ sơ/i })
      .first();
    await expect(saveToCaseBtn).toBeVisible();
    await expect(saveToCaseBtn).toBeDisabled();

    // Preview button is present (clicking without prefilled data will
    // surface the required-field validator, which is the expected UX).
    const previewBtn = page
      .getByRole("button", { name: /Xem trước bản in/i })
      .first();
    await expect(previewBtn).toBeVisible();
  });
});