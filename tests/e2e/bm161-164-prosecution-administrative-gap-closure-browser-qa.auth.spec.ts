/**
 * Authenticated browser QA for BM-161–BM-164 prosecution administrative forms.
 * Verifies route access, field rendering, and absence of phantom sections.
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';

const authStatePath = path.join(process.cwd(), 'playwright', '.clerk', 'admin.json');

test.use({ storageState: authStatePath });

test.describe('BM-161–BM-164 Prosecution Administrative Forms', () => {
  test('BM-161 desktop render', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/templates/BM-161');
    await expect(page).toHaveURL(/\/templates\/BM-161$/);
    await expect(page).not.toHaveURL(/sign-in|documents/);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Phiếu yêu cầu trích xuất/i })).toBeVisible({ timeout: 10000 });
    // Scope to <main> to exclude the header's "Tìm kiếm nhanh" search box,
    // which is a sibling of main and shares the input/select/textarea tags.
    const fields = page.locator('main input, main select, main textarea');
    await expect(fields).toHaveCount(8, { timeout: 10000 });
  });

  test('BM-162 desktop render', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/templates/BM-162');
    await expect(page).toHaveURL(/\/templates\/BM-162$/);
    await expect(page).not.toHaveURL(/sign-in|documents/);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Giấy mời/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Kính mời/i')).toBeVisible();
    const fields = page.locator('main input, main select, main textarea');
    await expect(fields).toHaveCount(8, { timeout: 10000 });
  });

  test('BM-163 desktop render', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/templates/BM-163');
    await expect(page).toHaveURL(/\/templates\/BM-163$/);
    await expect(page).not.toHaveURL(/sign-in|documents/);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Giấy triệu tập/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Yêu cầu/i')).toBeVisible();
    const fields = page.locator('main input, main select, main textarea');
    await expect(fields).toHaveCount(11, { timeout: 10000 });
  });

  test('BM-164 desktop render', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/templates/BM-164');
    await expect(page).toHaveURL(/\/templates\/BM-164$/);
    await expect(page).not.toHaveURL(/sign-in|documents/);
    // Actual DOCX title uses the abbreviation "BB" (Biên bản), not the
    // spelled-out word — match the literal curated heading text.
    await expect(page.locator('h1, h2, h3').filter({ hasText: /BB giao nhận/i })).toBeVisible({ timeout: 10000 });
    const fields = page.locator('main input, main select, main textarea');
    await expect(fields).toHaveCount(9, { timeout: 10000 });
  });

  test('BM-162/BM-163 semantic distinction', async ({ page }) => {
    await page.goto('/templates/BM-162');
    await expect(page.locator('text=/Kính mời/i')).toBeVisible({ timeout: 10000 });
    await page.goto('/templates/BM-163');
    await expect(page.locator('text=/Yêu cầu/i')).toBeVisible({ timeout: 10000 });
  });
});
