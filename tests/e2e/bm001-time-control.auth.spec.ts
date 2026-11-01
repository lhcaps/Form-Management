import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const START_TESTID = "smart-time-field-field-reception-startedattimetext";
const END_TESTID = "smart-time-field-field-reception-endedattimetext";

test("BM-001 time controls preserve canonical HH:mm values during real keyboard entry", async ({ page }, testInfo) => {
  await page.goto("/templates/BM-001", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/sign-in|sign-up/);

  const demoButton = page.getByRole("button", { name: /Dữ liệu demo/i });
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  const start = page.locator(`[data-testid="${START_TESTID}"] input`);
  const end = page.locator(`[data-testid="${END_TESTID}"] input`);
  await expect(start).toBeVisible();
  await expect(end).toBeVisible();

  await expect(start).toHaveValue("08:00");
  await expect(end).toHaveValue("08:30");

  // Digit-by-digit entry of 09:00 and 10:30
  await start.fill("");
  await start.pressSequentially("0900");
  await expect(start).toHaveValue("09:00");

  await end.fill("");
  await end.pressSequentially("1030");
  await expect(end).toHaveValue("10:30");

  // Editing existing values to 14:05 and 16:45
  await start.fill("1405");
  await start.blur();
  await expect(start).toHaveValue("14:05");

  await end.fill("1645");
  await end.blur();
  await expect(end).toHaveValue("16:45");

  // Blur/refocus preservation
  await start.blur();
  await start.focus();
  await expect(start).toHaveValue("14:05");

  await end.blur();
  await end.focus();
  await expect(end).toHaveValue("16:45");

  // Unrelated-field rerender preservation
  const fullName = page.locator('input[id*="receiver-fullName"], input[id*="fullName"]').first();
  if (await fullName.count() > 0) {
    await fullName.fill("Nguyễn Văn Test");
    await expect(start).toHaveValue("14:05");
    await expect(end).toHaveValue("16:45");
  }

  // Local-draft save/reload preservation
  const saveButton = page.getByRole("button", { name: /Lưu bản nháp/i }).first();
  if (await saveButton.count() > 0) {
    await saveButton.click();
    await expect(page.getByText(/Đã lưu bản nháp/i)).toBeVisible({ timeout: 10000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/sign-in|sign-up/);
    const reloadedStart = page.locator(`[data-testid="${START_TESTID}"] input`);
    const reloadedEnd = page.locator(`[data-testid="${END_TESTID}"] input`);
    await expect(reloadedStart).toHaveValue("14:05");
    await expect(reloadedEnd).toHaveValue("16:45");
  }

  // Preview payload preservation
  const previewButtons = page.getByRole("button", { name: /Xem trước bản in/i });
  await expect(previewButtons).toHaveCount(2);
  await previewButtons.nth(0).click();
  await expect(page.getByText(/14 giờ 05 phút/i)).toBeVisible();
  await expect(page.getByText(/16 giờ 45 phút/i)).toBeVisible();

  // Empty-state clearing
  await start.fill("");
  await start.blur();
  await expect(start).toHaveValue("");

  await end.fill("");
  await end.blur();
  await expect(end).toHaveValue("");

  // --:00 and --:-- never submitted as data
  await start.fill("--:00");
  await start.blur();
  await expect(start).toHaveValue("");

  await end.fill("--:--");
  await end.blur();
  await expect(end).toHaveValue("");
});
