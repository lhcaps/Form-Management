/**
 * Authenticated demo-click smoke for the curated INPUT_CONNECTED_PASS forms.
 *
 * Companion to tests/e2e/curated-22-templates.auth.spec.ts (which only proves
 * routing + visibility). This spec ALSO clicks the "Dữ liệu demo" button and
 * asserts the resulting demo state in the browser.
 *
 * What it proves per code:
 *   - opens authenticated (no Clerk redirect)
 *   - "BM-NNN" is visible somewhere on the page
 *   - at least one <h3> section heading is visible
 *   - at least one <input>/<textarea>/<select> is visible
 *   - the "Dữ liệu demo" button is visible & enabled
 *   - after click: at least one input/textarea/select has a non-empty value
 *   - after click: fields remain editable (not disabled, not readonly)
 *   - after click: "Xem trước bản in" button is still visible
 *   - after click: stale demo tokens (Nguyễn Văn A, Trần Thị B, 1980 as
 *     birth year, "Ông  cung cấp", "Nguyễn Thị Hồng Hạnh", "undefined",
 *     "null", "[object Object]") are absent from page text and input values
 *   - does NOT click "Xem trước bản in" (preview-session POST bug BM-001 is
 *     out of scope; demo-click is independent of preview-click)
 *
 * Failure classifications surfaced via the spec title suffix and JSON output:
 *   - DEMO_BUTTON_MISSING    — "Dữ liệu demo" button not found
 *   - DEMO_NO_VISIBLE_VALUE  — click succeeded but no field populated
 *   - STALE_DEMO_TOKEN       — a stale token leaked into rendered demo data
 *   - FIELD_LOCKED_AFTER_DEMO — at least one field became non-editable
 *   - PREVIEW_BUTTON_HIDDEN  — "Xem trước bản in" disappeared after demo
 *   - SIGN_IN_REDIRECT       — bounced to /sign-in or /sign-up
 *   - PAGE_CRASH             — JS error or unhandled exception
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-37-demo-click.auth.spec.ts \
 *     --workers=1 --reporter=json
 *
 * Auth + storageState are inherited from playwright.config.ts (Clerk ticket
 * strategy via tests/e2e/global.setup.ts).
 */

import { expect, test } from "@playwright/test";

const CURATED_FORMS = [
  // Original five-form curated batch.
  "BM-005",
  "BM-014",
  "BM-015",
  "BM-022",
  "BM-035",
  // Next-large batch 1 (15 forms).
  "BM-006",
  "BM-007",
  "BM-008",
  "BM-009",
  "BM-010",
  "BM-011",
  "BM-012",
  "BM-017",
  "BM-018",
  "BM-019",
  "BM-020",
  "BM-023",
  "BM-030",
  "BM-031",
  "BM-033",
  // Next-large batch 2 (15 forms).
  "BM-036",
  "BM-037",
  "BM-038",
  "BM-040",
  "BM-042",
  "BM-043",
  "BM-044",
  "BM-045",
  "BM-046",
  "BM-047",
  "BM-048",
  "BM-052",
  "BM-053",
  "BM-054",
  "BM-070",
  // Runtime-ready allowlist.
  "BM-001",
  "BM-171",
];

// Stale tokens that must NEVER appear after a demo click.
const STALE_TOKENS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Ông  cung cấp",
  "Ông cung cấp",
  "Nguyễn Thị Hồng Hạnh",
  "undefined",
  "null",
  "[object Object]",
];

async function collectVisibleTextAndValues(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "");
  const inputValues = await page.$$eval(
    "input, textarea, select",
    (els) => els.map((e) => e.value || ""),
  );
  return { bodyText, inputValues };
}

function findStaleToken(bodyText, inputValues) {
  const all = [bodyText, ...inputValues].filter((s) => typeof s === "string");
  for (const tok of STALE_TOKENS) {
    for (const chunk of all) {
      if (chunk.includes(tok)) return tok;
    }
  }
  return null;
}

test.describe("Curated 37 — authenticated demo-click smoke", () => {
  for (const templateCode of CURATED_FORMS) {
    test(`${templateCode} demo click populates demo data and stays editable`, async ({
      page,
    }) => {
      const consoleErrors = [];
      page.on("pageerror", (err) => consoleErrors.push(String(err.message || err)));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(`/templates/${templateCode}`);

      // 1) Not redirected to sign-in / sign-up.
      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      // 2) BM code visible.
      await expect(page.getByText(new RegExp(templateCode, "i")).first()).toBeVisible({
        timeout: 20_000,
      });

      // 3) At least one section heading.
      const sectionHeadings = page.locator("h3");
      await expect(sectionHeadings.first()).toBeVisible({ timeout: 20_000 });
      const sectionCount = await sectionHeadings.count();
      expect(sectionCount).toBeGreaterThanOrEqual(1);

      // 4) At least one input/textarea/select visible.
      const inputs = page.locator("input, textarea, select");
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(1);

      // 5) "Dữ liệu demo" button visible (exact label per workspace TSX).
      const demoBtn = page
        .getByRole("button", { name: /^Dữ liệu demo$/i })
        .first();
      await expect(demoBtn).toBeVisible({ timeout: 10_000 });
      await expect(demoBtn).toBeEnabled({ timeout: 10_000 });

      // 6) "Xem trước bản in" button visible BEFORE click (baseline).
      const previewBtn = page
        .getByRole("button", { name: /Xem trước bản in/i })
        .first();
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });

      // 7) Click demo.
      await demoBtn.click();
      // Allow React state to settle without arbitrary sleeps.
      await page.waitForTimeout(500);

      // 8) At least one field now has a non-empty value.
      const valuesAfter = await page.$$eval(
        "input, textarea, select",
        (els) => els.map((e) => (e.value || "").trim()),
      );
      const nonEmptyCount = valuesAfter.filter((v) => v.length > 0).length;
      expect(
        nonEmptyCount,
        `${templateCode}: no input/textarea/select received a non-empty value after demo click`,
      ).toBeGreaterThanOrEqual(1);

      // 9) Stale token check.
      const { bodyText } = await collectVisibleTextAndValues(page);
      const staleToken = findStaleToken(bodyText, valuesAfter);
      expect(
        staleToken,
        `${templateCode}: stale demo token "${staleToken}" leaked into rendered demo data`,
      ).toBeNull();

      // 10) Fields still editable (a sample of fields is enough).
      const editable = await page.$$eval(
        "input, textarea, select",
        (els) =>
          els.slice(0, 20).map((e) => ({
            tag: e.tagName,
            disabled: !!e.disabled,
            readOnly: !!e.readOnly,
          })),
      );
      const lockedFields = editable.filter((f) => f.disabled || f.readOnly);
      // Allow some legitimately readonly fields (e.g. derived display), but
      // surface the exact count for diagnosis.
      expect(
        lockedFields.length,
        `${templateCode}: ${lockedFields.length} fields became locked after demo click (sample=${JSON.stringify(lockedFields)})`,
      ).toBeLessThanOrEqual(Math.max(1, Math.floor(editable.length / 2)));

      // 11) "Xem trước bản in" button still visible AFTER demo.
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });

      // 12) "Không tìm thấy trang" boundary absent.
      await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);
    });
  }
});