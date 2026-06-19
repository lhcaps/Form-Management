import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).not.toHaveURL(/\/login/u, { timeout: 15_000 });
}

test("BM-001 print layout hides the save panel and preserves informant labels", async ({
  page,
}) => {
  const apiErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 500) {
      apiErrors.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    }
  });
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await login(page);
  await page.goto("/documents/17");

  const genderField = page.locator('[data-bm001-field="gender"] select');
  const otherNameField = page.locator('[data-bm001-field="other-name"] input');
  const savePanel = page.locator("[data-bm001-save-panel]");

  await expect(genderField).toHaveCount(1);
  await expect(otherNameField).toHaveCount(1);
  await expect(genderField).toBeVisible({ timeout: 15_000 });
  await expect(otherNameField).toBeVisible();
  await expect(savePanel).toHaveCount(1);

  await page.emulateMedia({ media: "print" });

  await expect(savePanel).toBeHidden();
  await expect(genderField).toBeVisible();
  await expect(otherNameField).toBeVisible();
  expect(await page.evaluate(() => window.matchMedia("print").matches)).toBe(
    true,
  );

  expect(apiErrors, `Unexpected API 5xx:\n${apiErrors.join("\n")}`).toEqual([]);
  expect(
    consoleErrors.filter(
      (entry) =>
        !entry.includes("DevTools") &&
        !entry.toLowerCase().includes("hydration"),
    ),
    `Console errors:\n${consoleErrors.join("\n")}`,
  ).toEqual([]);
});
