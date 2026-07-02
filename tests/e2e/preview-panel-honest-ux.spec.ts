import { test, expect } from '@playwright/test';

/**
 * Smoke test for honest preview UX after PR #31 UX fix.
 *
 * Uses route mocking to bypass Clerk auth (no real Clerk instance needed in dev).
 * Validates:
 *  1. Panel heading is "Đã tạo file DOCX tạm thời" when no PDF exists
 *  2. Body copy mentions DOCX is temporary
 *  3. PDF note says "Tính năng xem trước PDF đang được phát triển"
 *  4. Tải DOCX button is visible and enabled
 *  5. Save-to-case CTA is disabled with no href
 *  6. No "Lịch sử xử lý" text
 *  7. No misleading "Đã tạo bản xem trước" heading when no PDF
 */
test('BM-001 preview panel — honest messaging when no PDF', async ({ page }) => {
  // ── Auth bypass: mock Clerk session and API auth ──────────────────
  await page.context().addCookies([
    {
      name: '__session',
      value: 'test-session',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);

  // Mock Clerk user endpoint
  await page.route('**/ clerk-api.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user_test123',
        email_addresses: [{ email_address: 'admin@test.local' }],
        first_name: 'Admin',
        last_name: 'Test',
        public_metadata: { role: 'admin' },
      }),
    }),
  );

  // Mock API /auth/me so auth context resolves
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '1',
        username: 'admin',
        fullName: 'Admin Test',
        email: 'admin@test.local',
        role: 'ADMIN',
        agencyId: '1',
        agencyName: 'VKS Test',
        agencyCode: 'VKS01',
        permissions: [],
        isActive: true,
      }),
    }),
  );

  // Mock template runtime contract endpoint (returns form structure)
  await page.route(
    (url) => url.pathname.includes('/forms/runtime/') && url.pathname.includes('/contract'),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'BM-001',
          contractVersion: '2.0',
          contractHash: 'test-hash',
          templateHash: 'test-template-hash',
          compiledContract: {
            templateCode: 'BM-001',
            source: { fields: [] },
            title: 'Đơn ghi chép ý kiến (BM-001)',
          },
        }),
      }),
  );

  // Mock preview session creation
  await page.route(
    (url) => url.pathname.includes('/forms/runtime/') && url.pathname.includes('/preview-session'),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'runtime_preview_test-123-456',
          templateCode: 'BM-001',
          fileName: 'BM-001_preview.docx',
          fileSizeBytes: 12288,
          fileFormat: 'DOCX',
          docxDownloadUrl: '/api/v1/forms/runtime/preview-sessions/runtime_preview_test-123-456/docx',
          pdfPreviewUrl: null, // ← intentionally null — tests the honest fallback
          audit: {
            status: 'PASS',
            summary: { total: 1, pass: 1, warning: 0, fail: 0, notDetectable: 0, notApplicable: 0 },
            findings: [],
          },
          warnings: [],
          missingRequired: [],
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          persisted: false,
        }),
      }),
  );

  // ── Navigate to BM-001 preview page ───────────────────────────────
  await page.goto('/templates/BM-001');
  await page.waitForLoadState('networkidle', { timeout: 30_000 });

  // Wait for form to load
  await page.waitForSelector('text=BM-001', { timeout: 15_000 });

  // ── Click "Xem trước bản in" ──────────────────────────────────────
  const previewButton = page.getByRole('button', { name: /Xem trước bản in/i });
  await expect(previewButton).toBeVisible();
  await previewButton.click();

  // Wait for preview panel to appear
  await page.waitForSelector(/Đã tạo file DOCX tạm thời|Đã tạo bản xem trước/, {
    timeout: 30_000,
  });

  // Take screenshot of the panel
  await page.screenshot({
    path: 'test-results/bm001-preview-panel-honest.png',
    fullPage: false,
  });

  // ── Validation ────────────────────────────────────────────────────
  // 1. Heading is honest — "Đã tạo file DOCX tạm thời" (NOT "Đã tạo bản xem trước")
  const panelEl = page.locator('.rounded-xl.border.border-amber-200');
  await expect(panelEl).toBeVisible();
  const heading = panelEl.locator('p.text-xs').first();
  await expect(heading).toHaveText('Đã tạo file DOCX tạm thời');

  // 2. Body copy mentions DOCX is temporary
  const bodyText = await panelEl.locator('p.text-sm.text-amber-700').first().textContent();
  expect(bodyText?.toLowerCase()).toContain('docx');
  expect(bodyText?.toLowerCase()).toContain('tạm thời');

  // 3. PDF note says PDF is being developed
  await expect(
    panelEl.locator('text=Tính năng xem trước PDF đang được phát triển'),
  ).toBeVisible();

  // 4. Tải DOCX button exists and is enabled
  const taiDocxBtn = page.getByRole('button', { name: /Tải DOCX/i });
  await expect(taiDocxBtn).toBeVisible();
  await expect(taiDocxBtn).toBeEnabled();

  // 5. Save-to-case CTA is disabled with no href
  const saveToCaseBtn = page.getByRole('button', { name: /Tạo văn bản từ hồ sơ/i });
  await expect(saveToCaseBtn).toBeVisible();
  await expect(saveToCaseBtn).toBeDisabled();
  await expect(saveToCaseBtn).toHaveAttribute('href', null);

  // 6. No "Lịch sử xử lý" in preview panel
  await expect(panelEl.locator('text=Lịch sử xử lý')).toHaveCount(0);

  // 7. No misleading "Đã tạo bản xem trước" in the amber panel
  await expect(panelEl.locator('text=Đã tạo bản xem trước')).toHaveCount(0);

  // 8. "Tạo lại" button exists
  await expect(page.getByRole('button', { name: /Tạo lại/i })).toBeVisible();
});
