import { expect, test, type ConsoleMessage } from '@playwright/test';
import { authenticateAsAdmin } from './helpers/auth';
import {
  expectAnyControlValueContains,
  fillVisibleDocumentFormControls,
} from './helpers/form-controls';

test.describe('Document form save flow', () => {
  test('login, open a TT 03/2026 template, save form inputs and reload persisted data', async ({
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

    await authenticateAsAdmin(page);

    await page.goto('/documents');
    await expect(page.getByText('Biểu mẫu trong DB')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('213').first()).toBeVisible();

    const bm004Card = page
      .locator('article')
      .filter({ hasText: 'BM-004' })
      .filter({ hasNotText: 'Điểm phù hợp' });
    await expect(bm004Card).toHaveCount(1);
    await bm004Card.getByRole('button', { name: 'Mở biểu mẫu' }).click();

    const caseDialog = page.getByRole('dialog');
    if (await caseDialog.isVisible()) {
      await expect(caseDialog.getByText('Chọn hồ sơ để mở biểu mẫu')).toBeVisible();
      const caseButtons = caseDialog.locator('ul button');
      await expect(caseButtons.first()).toBeVisible({ timeout: 15_000 });
      const preferredCase = caseDialog.getByRole('button', { name: /VKS-2026-0001/u });
      if ((await preferredCase.count()) > 0) {
        await preferredCase.first().click();
      } else {
        await caseButtons.first().click();
      }
    }

    await expect(page).toHaveURL(/\/documents\/\d+$/, { timeout: 15_000 });
    await expect(page.getByText('BM-004').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Contract runtime|Form dữ liệu chung/u)).toBeVisible();

    const savedSummary = `QA lưu biểu mẫu BM-004 ${Date.now()}`;
    await fillVisibleDocumentFormControls(page, savedSummary);
    await page.getByRole('button', { name: /Lưu dữ liệu/u }).last().click();
    await expect(page.getByText(/Đã lưu dữ liệu biểu mẫu|Đã lưu thành công|Đã lưu theo published contract/u)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByText('BM-004').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('main input, main textarea').first()).toBeVisible({ timeout: 20_000 });
    await expectAnyControlValueContains(page, savedSummary);

    expect(apiErrors, `Unexpected API 5xx:\n${apiErrors.join('\n')}`).toEqual([]);
    expect(
      consoleErrors.filter(
        (entry) => !entry.includes('DevTools') && !entry.toLowerCase().includes('hydration'),
      ),
      `Console errors:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
