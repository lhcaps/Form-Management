/**
 * Browser QA for BM-122/123/124 — investigation approval/evidence family.
 * Uses existing storageState from pnpm test:e2e:auth.
 */
import { test, expect } from '@playwright/test';

const FORMS = [
  { code: 'BM-122', fields: 2 },
  { code: 'BM-123', fields: 2 },
  { code: 'BM-124', fields: 1 },
];

for (const { code, fields } of FORMS) {
  test(`${code} authenticated route`, async ({ page }) => {
    await page.goto(`/templates/${code}`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(`/templates/${code}`);
    await expect(page).not.toHaveURL(/\/documents/, { timeout: 5_000 });

    const controls = page.locator('input:not([type="hidden"]), select, textarea');
    const count = await controls.count();
    expect(count, `${code} field count`).toBeGreaterThanOrEqual(fields);

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1_000);
    const fatalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('chunk')
    );
    expect(fatalErrors, `${code} console errors`).toHaveLength(0);
  });
}

// BM-122 representative responsive — desktop
test('BM-122 desktop 1440×900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/templates/BM-122', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL('/templates/BM-122');
  const body = page.locator('body');
  const overflow = await body.evaluate(el => el.scrollWidth > el.clientWidth);
  expect(overflow, 'BM-122 desktop no horizontal overflow').toBe(false);
});

// BM-122 representative responsive — mobile
test('BM-122 mobile 390×844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/templates/BM-122', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL('/templates/BM-122');
  const body = page.locator('body');
  const overflow = await body.evaluate(el => el.scrollWidth > el.clientWidth);
  expect(overflow, 'BM-122 mobile no horizontal overflow').toBe(false);
});
