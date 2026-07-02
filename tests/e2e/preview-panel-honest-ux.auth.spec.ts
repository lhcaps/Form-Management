import { expect, test, type Page } from "@playwright/test";

const EXPECTED_API_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1",
).origin;

/**
 * Authenticated smoke tests for standalone runtime preview UX.
 *
 * /templates is Clerk-protected, so these tests run in the authenticated
 * Playwright project and mock only the runtime contract/session API surface.
 */
test("BM-001 preview panel shows honest fallback when no PDF exists", async ({
  page,
}) => {
  await mockStandaloneTemplatePreview(page, {
    sessionId: "runtime_preview_123e4567-e89b-12d3-a456-426614174001",
    pdfPreviewUrl: null,
  });

  await page.goto("/templates/BM-001");
  await expect(page.getByText("BM-001").first()).toBeVisible({
    timeout: 15_000,
  });

  const previewResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/forms/runtime/BM-001/preview-session") &&
      response.request().method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /Xem trước bản in/i }).first().click();
  const previewResponse = await previewResponsePromise;
  expect(previewResponse.ok()).toBeTruthy();

  const panelEl = page
    .locator(".rounded-xl.border.border-amber-200")
    .filter({ hasText: "Đã tạo file DOCX tạm thời" })
    .first();
  await expect(panelEl).toBeVisible({ timeout: 10_000 });
  await expect(panelEl.locator("p.text-xs").first()).toHaveText(
    "Đã tạo file DOCX tạm thời",
  );

  const bodyText = await panelEl
    .locator("p.text-sm.text-amber-700")
    .first()
    .textContent();
  expect(bodyText?.toLowerCase()).toContain("docx");
  expect(bodyText?.toLowerCase()).toContain("tạm thời");
  await expect(
    panelEl.locator("text=Tính năng xem trước PDF đang được phát triển"),
  ).toBeVisible();

  const taiDocxBtn = page.getByRole("button", { name: /Tải DOCX/i });
  await expect(taiDocxBtn).toBeVisible();
  await expect(taiDocxBtn).toBeEnabled();

  const saveToCaseBtn = page.getByRole("button", {
    name: /Tạo văn bản từ hồ sơ/i,
  }).first();
  await expect(saveToCaseBtn).toBeVisible();
  await expect(saveToCaseBtn).toBeDisabled();
  await expect(saveToCaseBtn).not.toHaveAttribute("href");

  await expect(panelEl.locator("text=Lịch sử xử lý")).toHaveCount(0);
  await expect(panelEl.locator("text=Đã tạo bản xem trước")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Tạo lại/i })).toBeVisible();
});

test("BM-001 preview panel renders inline PDF when preview URL exists", async ({
  page,
}) => {
  const sessionId = "runtime_preview_123e4567-e89b-12d3-a456-426614174000";
  const pdfPreviewUrl = `/api/v1/forms/runtime/preview-sessions/${sessionId}/pdf`;

  await mockStandaloneTemplatePreview(page, {
    sessionId,
    pdfPreviewUrl,
  });

  await page.goto("/templates/BM-001");
  await expect(page.getByText("BM-001").first()).toBeVisible({
    timeout: 15_000,
  });

  const previewRequestPromise = page.waitForRequest(
    (request) =>
      request.url().includes("/api/v1/forms/runtime/BM-001/preview-session") &&
      request.method() === "POST",
    { timeout: 30_000 },
  );

  await page.getByRole("button", { name: /Xem trước bản in/i }).first().click();

  const previewRequest = await previewRequestPromise;
  expect(previewRequest.url()).toContain("/preview-session");
  expect(previewRequest.url()).not.toContain("/render-docx");

  const panelEl = page
    .locator(".rounded-xl.border.border-emerald-200")
    .filter({
      has: page.locator('iframe[title^="Bản xem trước PDF"]'),
    })
    .first();
  await expect(panelEl).toBeVisible({ timeout: 10_000 });
  await expect(panelEl.locator("text=Đã tạo bản xem trước")).toBeVisible();
  await expect(panelEl.locator("text=Đã tạo file DOCX tạm thời")).toHaveCount(0);

  const iframe = panelEl.locator('iframe[title^="Bản xem trước PDF"]');
  await expect(iframe).toBeVisible();
  const iframeSrc = await iframe.getAttribute("src");
  // iframe src must be a blob: URL, NOT a raw protected API URL
  // iframe navigation cannot attach Bearer token, so blob fetch is required
  expect(iframeSrc).not.toBeNull();
  expect(iframeSrc?.startsWith("blob:")).toBeTruthy();
  // Verify no raw API URL appears as iframe src
  expect(iframeSrc).not.toContain("/api/v1/forms/runtime/");
  expect(iframeSrc).not.toContain("/pdf");
  // Verify page does not contain JSON 401 error
  await expect(page.locator("text=Thiếu hoặc sai session token")).toHaveCount(0);

  const taiDocxBtn = page.getByRole("button", { name: /Tải DOCX/i });
  await expect(taiDocxBtn).toBeVisible();
  await expect(taiDocxBtn).toBeEnabled();

  const saveToCaseBtn = page.getByRole("button", {
    name: /Tạo văn bản từ hồ sơ/i,
  }).first();
  await expect(saveToCaseBtn).toBeVisible();
  await expect(saveToCaseBtn).toBeDisabled();
  await expect(page.locator("text=Lịch sử xử lý")).toHaveCount(0);
});

async function mockStandaloneTemplatePreview(
  page: Page,
  session: {
    sessionId: string;
    pdfPreviewUrl: string | null;
  },
) {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "1",
        username: "admin",
        fullName: "Admin Test",
        email: "admin@test.local",
        role: "ADMIN",
        agencyId: "1",
        agencyName: "VKS Test",
        agencyCode: "VKS01",
        permissions: [],
        isActive: true,
      }),
    }),
  );

  await page.route(
    (url) =>
      url.pathname.includes("/forms/runtime/") &&
      url.pathname.includes("/contract"),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source: "BM-001",
          contractVersion: "2.0",
          contractHash: "test-hash",
          templateHash: "test-template-hash",
          compiledContract: {
            templateCode: "BM-001",
            source: { fields: [] },
            title: "Đơn ghi chép ý kiến (BM-001)",
          },
        }),
      }),
  );

  await page.route(
    (url) =>
      url.pathname.includes("/forms/runtime/") &&
      url.pathname.includes("/preview-session"),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sessionId: session.sessionId,
          templateCode: "BM-001",
          fileName: "BM-001_preview.docx",
          fileSizeBytes: 12288,
          fileFormat: "DOCX",
          docxDownloadUrl: `/api/v1/forms/runtime/preview-sessions/${session.sessionId}/docx`,
          pdfPreviewUrl: session.pdfPreviewUrl,
          audit: {
            status: "PASS",
            summary: {
              total: 1,
              pass: 1,
              warning: 0,
              fail: 0,
              notDetectable: 0,
              notApplicable: 0,
            },
            findings: [],
          },
          warnings: [],
          missingRequired: [],
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          persisted: false,
        }),
      }),
  );

  if (session.pdfPreviewUrl) {
    await page.route(`**${session.pdfPreviewUrl}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.7\nbody\n%%EOF",
      }),
    );
  }
}
