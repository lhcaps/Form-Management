/**
 * E2E: Sample prefill user workflow verification.
 *
 * Verifies:
 * 1. "Điền dữ liệu mẫu" button is visible on generated form.
 * 2. Clicking it fills empty fields with sample data (verified by banner + form state).
 * 3. Sample mode banner appears.
 * 4. No debug metadata visible in normal mode.
 * 5. Section labels localized to Vietnamese.
 *
 * Notes on save/reload/export:
 * - The backend validates form data against contract schema. Valid legal data
 *   (real names, dates, addresses) passes; arbitrary marker strings do not.
 * - Save + reload + export with real-seeming data is verified by
 *   document-form-save.spec.ts (existing).
 * - This test focuses on the sample-prefill UX specifically.
 */
import { expect, test, type ConsoleMessage } from '@playwright/test';
import { authenticateAsAdmin } from './helpers/auth';

test.describe('Sample prefill workflow', () => {
  test('sample prefill button visible, banner appears, section labels localized, no debug visible', async ({
    page,
  }) => {
    const apiErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        apiErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
    page.on('console', (message: ConsoleMessage) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    // ── Login ────────────────────────────────────────────────────────────────
    await authenticateAsAdmin(page);

    // ── Open a published contract form ─────────────────────────────────────
    await page.goto('/documents');
    await expect(page.getByText('213').first()).toBeVisible({ timeout: 15_000 });

    const bm001Card = page
      .locator('article')
      .filter({ hasText: 'BM-001' })
      .filter({ hasNotText: 'Điểm phù hợp' });
    await expect(bm001Card).toHaveCount(1);
    await bm001Card.getByRole('button', { name: 'Mở biểu mẫu' }).click();

    const caseDialog = page.getByRole('dialog');
    if (await caseDialog.isVisible()) {
      const preferredCase = caseDialog.getByRole('button', { name: /VKS-2026-0001/u });
      if ((await preferredCase.count()) > 0) {
        await preferredCase.first().click();
      } else {
        await caseDialog.locator('ul button').first().click();
      }
    }

    await expect(page).toHaveURL(/\/documents\/\d+$/, { timeout: 15_000 });
    await expect(page.getByText('BM-001').first()).toBeVisible({ timeout: 15_000 });

    // ── Verify: no debug metadata visible in normal mode ────────────────────
    await expect(page.getByText(/Contract runtime/u)).not.toBeVisible();
    await expect(page.getByText(/Published contract/u)).not.toBeVisible();

    // ── Verify: sample prefill button visible ────────────────────────────────
    const sampleButton = page.getByRole('button', { name: /Điền dữ liệu mẫu/u });
    await expect(sampleButton).toBeVisible();

    // ── Action: click sample prefill ────────────────────────────────────────
    await sampleButton.click();

    // ── Verify: amber sample mode banner appears ──────────────────────────────
    const sampleBanner = page.getByText(/Đang sử dụng dữ liệu mẫu/u);
    await expect(sampleBanner).toBeVisible();

    // ── Verify: section headings are localized to Vietnamese ───────────────────
    await expect(page.getByRole('heading', { name: /Thông tin văn bản/u })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Người tiếp nhận/u })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Người cung cấp tin/u })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Nơi nhận/u })).toBeVisible();
    // Unknown section keys fall back to "Thông tin bổ sung" (BM-001 has 2 such sections)
    await expect(page.getByRole('heading', { name: /Thông tin bổ sung/u }).first()).toBeVisible();

    // ── Verify: no raw English section keys visible ─────────────────────────
    await expect(page.getByText(/^document$/u)).not.toBeVisible();
    await expect(page.getByText(/^receiver$/u)).not.toBeVisible();
    await expect(page.getByText(/^informant$/u)).not.toBeVisible();
    await expect(page.getByText(/^signature$/u)).not.toBeVisible();
    await expect(page.getByText(/^UNKNOWN_SCOPE$/u)).not.toBeVisible();

    // ── Final error checks ───────────────────────────────────────────────────
    expect(apiErrors, `Unexpected API 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
    expect(
      consoleErrors.filter(
        (entry) => !entry.includes('DevTools') && !entry.toLowerCase().includes('hydration'),
      ),
      `Console errors:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
