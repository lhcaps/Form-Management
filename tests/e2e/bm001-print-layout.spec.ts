import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { authenticateAsAdmin } from "./helpers/auth";

test("BM-001 runtime form renders printable labels without generic blanks", async ({
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

  await authenticateAsAdmin(page);
  await page.goto("/documents/17");

  await expect(page.getByText("BM-001").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Contract runtime · BM-001/u)).toBeVisible();
  await expect(page.getByText("Ô trống")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Lưu dữ liệu/u }).last()).toBeVisible();

  await page.emulateMedia({ media: "print" });

  await expect(page.getByText("BM-001").first()).toBeVisible();
  await expect(page.getByText("Ô trống")).toHaveCount(0);
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
