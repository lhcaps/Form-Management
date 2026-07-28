import { expect, test } from '@playwright/test';

test.describe('Persisted template draft bridge', () => {
  test('BM-002 retains its curated template UI before an explicit draft action', async ({
    page,
  }) => {
    await page.goto('/templates/BM-002');

    await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: 'Phiếu chuyển nguồn tin về tội phạm' }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: '1. Cơ quan và phiếu chuyển' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Xác định cơ quan tiếp nhận, cơ quan lập phiếu và thông tin ban hành.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Chọn hồ sơ' }),
    ).toBeVisible();

    const startDraft = page.getByRole('button', {
      name: /Bắt đầu\s*\/\s*tiếp tục bản nháp/i,
    });
    await expect(startDraft).toBeVisible();
    await expect(startDraft).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Tạo văn bản từ hồ sơ' }),
    ).toBeDisabled();
    await expect(
      page.getByText(/chưa thể tạo draft bridge vì render scope/i),
    ).toHaveCount(0);
  });
});
