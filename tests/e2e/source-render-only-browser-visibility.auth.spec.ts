/**
 * Authenticated browser visibility smoke for every registered template panel.
 *
 * This test deliberately derives its corpus from the generated UI registry.
 * It proves that the real `/templates/:templateCode` route retains contract
 * sections and editable controls rather than replacing them with bridge UI.
 */
import { expect, test } from "@playwright/test";
import { REGISTERED_BM_PANEL_CODES } from "../../apps/web/src/lib/generated/bm-panel-codes.generated";

test.describe("Source/Render-Only Browser Visibility Smoke (auth)", () => {
  test.describe.configure({ mode: "serial" });

  test("covers exactly the 213 registered template panels", () => {
    expect(REGISTERED_BM_PANEL_CODES).toHaveLength(213);
    expect(new Set(REGISTERED_BM_PANEL_CODES).size).toBe(213);
  });

  for (const templateCode of REGISTERED_BM_PANEL_CODES) {
    test(`${templateCode} loads authenticated with contract-native fields`, async ({
      page,
    }, testInfo) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => {
        pageErrors.push(String(error));
      });

      // The runtime contract endpoint is throttled. A full 213-form pass is
      // intentionally serial so each rendered page is evaluated, not masked
      // by a burst of 429 responses.
      await page.waitForTimeout(1_000);
      await page.goto(`/templates/${templateCode}`);

      await expect(page).not.toHaveURL(/sign-in|sign-up|\/documents\//, {
        timeout: 20_000,
      });
      await expect(
        page.getByText(new RegExp(templateCode, "i")).first(),
      ).toBeVisible({ timeout: 20_000 });

      const sectionHeadings = page.getByTestId("bm-form-section-title");
      await expect(sectionHeadings.first()).toBeVisible({ timeout: 20_000 });
      expect(await sectionHeadings.count()).toBeGreaterThanOrEqual(1);
      const sectionTitles = await sectionHeadings.allTextContents();
      expect(
        sectionTitles.filter((title) =>
          /^[a-z][a-zA-Z0-9_-]*$/.test(title.trim()),
        ),
        `raw technical section headings: ${sectionTitles.join(" | ")}`,
      ).toHaveLength(0);

      const controls = page.locator("input, textarea, select");
      await expect(controls.first()).toBeVisible({ timeout: 20_000 });
      expect(await controls.count()).toBeGreaterThanOrEqual(1);

      await expect(
        page.getByRole("button", { name: /Xem trước bản in/i }).first(),
      ).toBeVisible();
      await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);
      await expect(page.locator("text=Lịch sử xử lý")).toHaveCount(0);

      if (process.env.E2E_CAPTURE_TEMPLATE_SCREENSHOT === templateCode) {
        await page.screenshot({
          path: testInfo.outputPath(`${templateCode.toLowerCase()}-workspace.png`),
          fullPage: true,
        });
      }

      const fatalErrors = [...consoleErrors, ...pageErrors].filter(
        (message) =>
          !/Clerk has been loaded with development keys/i.test(message) &&
          !/infinite redirect loop/i.test(message) &&
          !/Download the React DevTools/i.test(message) &&
          !/Failed to load resource: the server responded with a status of 429/i.test(
            message,
          ) &&
          !/ThrottlerException/i.test(message) &&
          !/Too Many Requests/i.test(message),
      );
      expect(
        fatalErrors,
        `console/page errors: ${fatalErrors.join(" | ")}`,
      ).toHaveLength(0);
    });
  }
});
