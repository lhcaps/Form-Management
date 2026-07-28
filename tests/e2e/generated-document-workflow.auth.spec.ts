import { expect, test } from "@playwright/test";

test("authenticated operator can save a contract-native persisted BM-039 document and export it", async ({
  page,
}) => {
  const fixtureCaseCode = "E2E-BM039-CONTRACT";

  await page.goto("/cases", { waitUntil: "networkidle" });
  await expect(page).not.toHaveURL(/sign-in|sign-up/);

  if (await page.getByText(fixtureCaseCode, { exact: true }).count() === 0) {
    const fixtureForm = page.locator("form").filter({
      has: page.getByRole("heading", { name: "Tạo hồ sơ mới" }),
    });
    await fixtureForm.getByLabel("Mã hồ sơ").fill(fixtureCaseCode);
    await fixtureForm.getByLabel("Tên vụ án").fill("Hồ sơ E2E contract-native BM-039");

    const [createCaseResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          /\/cases$/.test(new URL(response.url()).pathname),
      ),
      fixtureForm.getByRole("button", { name: "Tạo hồ sơ" }).click(),
    ]);
    expect(createCaseResponse.ok()).toBeTruthy();
    await expect(page.getByText(fixtureCaseCode, { exact: true })).toBeVisible();
  }

  await page.goto("/documents", { waitUntil: "networkidle" });
  await expect(page).not.toHaveURL(/sign-in|sign-up/);

  const card = page.locator("article").filter({ hasText: "BM-039" }).first();
  await expect(card).toHaveCount(1);

  const openWithCase = card.getByRole("button", { name: "Mở với hồ sơ" });
  await expect(openWithCase).toBeEnabled({ timeout: 60_000 });
  await openWithCase.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const caseChoices = dialog.locator("li > button");
  await expect(caseChoices).not.toHaveCount(0);

  const [batchResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/documents\/cases\/[^/]+\/batches$/.test(
          new URL(response.url()).pathname,
        ),
    ),
    caseChoices.first().click(),
  ]);

  expect(batchResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/documents\/\d+/, { timeout: 60_000 });

  await page.getByRole("button", { name: "Điền dữ liệu mẫu" }).click();

  const [saveResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        /\/documents\/generated\/\d+\/contract-form-inputs$/.test(
          new URL(response.url()).pathname,
        ),
    ),
    page.getByRole("button", { name: "Lưu dữ liệu biểu mẫu" }).click(),
  ]);
  expect(saveResponse.ok()).toBeTruthy();
  await expect(page.getByText("Đã lưu dữ liệu biểu mẫu.")).toBeVisible();

  await page.getByRole("tab", { name: "Tệp đã xuất" }).click();
  await expect(page.getByRole("button", { name: "Xuất Word" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xuất PDF" })).toBeVisible();

  const [docxResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/documents\/generated\/\d+\/render-docx$/.test(
          new URL(response.url()).pathname,
        ),
    ),
    page.getByRole("button", { name: "Xuất Word" }).click(),
  ]);
  expect(docxResponse.ok()).toBeTruthy();
  await expect(page.getByText(/^DOCX\s+-/)).toBeVisible();

  const [pdfResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/documents\/generated\/\d+\/convert-pdf$/.test(
          new URL(response.url()).pathname,
        ),
    ),
    page.getByRole("button", { name: "Xuất PDF" }).click(),
  ]);
  expect(pdfResponse.ok()).toBeTruthy();
  await expect(page.getByText(/^PDF\s+-/)).toBeVisible();
});
