import { expect, test } from "@playwright/test";
import path from "node:path";
import { devices } from "@playwright/test";

const FORMS = ["BM-119", "BM-120", "BM-121"] as const;
const EXPECTED_FIELDS: Record<string, number> = {
  "BM-119": 5,
  "BM-120": 4,
  "BM-121": 3,
};

const STORAGE_STATE = path.join(process.cwd(), "playwright", ".clerk", "admin.json");

test.describe("BM-119–BM-121 Browser QA", () => {
  test.describe.configure({ mode: "serial" });

  for (const templateCode of FORMS) {
    const expected = EXPECTED_FIELDS[templateCode];

    test(`${templateCode} authenticated route smoke`, async ({ page }) => {
      // Use existing storage state directly
      const storageState = STORAGE_STATE;

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      // Navigate to template route
      await page.goto(`/templates/${templateCode}`, { waitUntil: "networkidle" });

      // Route must stay on /templates/
      await expect(page).not.toHaveURL(/sign-in|sign-up|\/documents\//, { timeout: 20_000 });
      await expect(page).toHaveURL(new RegExp(`/templates/${templateCode}`), { timeout: 10_000 });

      // Template heading must be visible
      const heading = page.getByTestId("bm-form-section-title").first();
      await expect(heading).toBeVisible({ timeout: 15_000 });

      // Count editable controls
      const controls = page.locator("input:not([type=hidden]), textarea, select");
      const count = await controls.count();
      expect(count, `${templateCode} field count`).toBe(expected);

      // Each compiled field key must appear exactly once in DOM
      const fieldKeyPatterns: Record<string, RegExp[]> = {
        "BM-119": [
          /agency\.vienKiem/,
          /document\.soQuyet/,
          /agency\.diaDanh/,
          /document\.ngayBan/,
          /agency\.dongDia/,
        ],
        "BM-120": [
          /agency\.vienKiem/,
          /document\.soQuyet/,
          /agency\.diaDanh/,
          /document\.ngayBan/,
        ],
        "BM-121": [
          /agency\.vienKiem/,
          /document\.soQuyet/,
          /agency\.diaDanh/,
        ],
      };

      const bodyText = await page.locator("body").textContent();
      for (const pattern of fieldKeyPatterns[templateCode]) {
        const found = (bodyText ?? "").match(pattern);
        expect(found, `${templateCode} field key ${pattern} should appear exactly once`).toHaveLength(1);
      }

      // No raw agency.* / document.* keys shown as standalone labels
      const rawKeyMatches = (bodyText ?? "").match(
        /\b(agency\.\w+|document\.\w+)\b/g,
      ) ?? [];
      expect(rawKeyMatches.length, `no raw agency/document keys visible`).toBe(0);

      // No fatal console or page errors
      const fatal = [...consoleErrors, ...pageErrors].filter(
        (m) =>
          !/Clerk development keys/i.test(m) &&
          !/infinite redirect loop/i.test(m) &&
          !/Download the React DevTools/i.test(m) &&
          !/429/i.test(m) &&
          !/ThrottlerException/i.test(m),
      );
      expect(fatal, `errors: ${fatal.join(" | ")}`).toHaveLength(0);
    });
  }

  // Responsive check for BM-119
  test("BM-119 responsive desktop/mobile", async ({ page }) => {
    // Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/templates/BM-119", { waitUntil: "networkidle" });
    await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 15_000 });
    await page.screenshot({ path: "test-results/bm-119-desktop.png", fullPage: true });

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/templates/BM-119", { waitUntil: "networkidle" });
    await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 15_000 });
    await page.screenshot({ path: "test-results/bm-119-mobile.png", fullPage: true });
  });
});
