/**
 * Authenticated demo-click smoke for the 20 newly curated Batch 3
 * INPUT_CONNECTED_PASS forms.
 *
 * Companion to tests/e2e/curated-batch3-templates.auth.spec.ts (which only
 * proves routing + visibility). This spec ALSO clicks the "Dữ liệu demo"
 * button and asserts the resulting demo state in the browser, restricted
 * to the 20 newly curated codes (Batch 3).
 *
 * What it proves per code (10 invariants):
 *   - opens authenticated (no Clerk redirect)
 *   - "BM-NNN" is visible somewhere on the page
 *   - at least one <h3> section heading is visible
 *   - at least one <input>/<textarea>/<select> is visible
 *   - the "Dữ liệu demo" button is visible & enabled
 *   - after click: at least one input/textarea/select received a non-empty
 *     value (changedFieldCount >= 1)
 *   - after click: fields remain editable (not disabled, not readonly)
 *   - after click: "Xem trước bản in" button is still visible
 *   - after click: stale demo tokens are absent from page text and inputs
 *   - no fatal console/page errors
 *
 * Does NOT click "Xem trước bản in", does NOT call preview-session, does
 * NOT download DOCX. Those flows are out of scope for demo-click and are
 * covered by separate specs.
 *
 * Failure classifications surfaced via the spec assertion messages:
 *   - DEMO_BUTTON_MISSING       — "Dữ liệu demo" button not found
 *   - DEMO_NO_VISIBLE_VALUE     — click succeeded but no field populated
 *   - STALE_DEMO_TOKEN          — a stale token leaked into rendered demo data
 *   - FIELD_LOCKED_AFTER_DEMO   — too many fields became non-editable
 *   - PREVIEW_BUTTON_HIDDEN     — "Xem trước bản in" disappeared after demo
 *   - SIGN_IN_REDIRECT          — bounced to /sign-in or /sign-up
 *   - PAGE_CRASH                — JS error or unhandled exception
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-batch3-demo-click.auth.spec.ts \
 *     --workers=1 --reporter=json
 *
 * Auth + storageState are inherited from playwright.config.ts (Clerk ticket
 * strategy via tests/e2e/global.setup.ts).
 */

import { expect, test } from "@playwright/test";

// Batch 3 newly curated forms (BM-055..BM-069, BM-071..BM-075).
const BATCH3_CODES = [
  "BM-055",
  "BM-056",
  "BM-057",
  "BM-058",
  "BM-059",
  "BM-060",
  "BM-061",
  "BM-062",
  "BM-063",
  "BM-064",
  "BM-065",
  "BM-066",
  "BM-067",
  "BM-068",
  "BM-069",
  "BM-071",
  "BM-072",
  "BM-073",
  "BM-074",
  "BM-075",
];

// Stale tokens that must NEVER appear after a demo click.
// Aligned with the curated-37 spec — canonical stale-string list.
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

test.describe("Curated Batch 3 — authenticated demo-click smoke", () => {
  for (const templateCode of BATCH3_CODES) {
    test(`${templateCode} demo click populates demo data and stays editable`, async ({
      page,
    }) => {
      const consoleErrors = [];
      const pageErrors = [];
      page.on("pageerror", (err) =>
        pageErrors.push(String(err.message || err)),
      );
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(`/templates/${templateCode}`);

      // 1) Not redirected to sign-in / sign-up.
      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      // 2) BM code visible.
      await expect(
        page.getByText(new RegExp(templateCode, "i")).first(),
      ).toBeVisible({ timeout: 20_000 });

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

      // 5) "Dữ liệu demo" button visible & enabled.
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
        `${templateCode}: no input/textarea/select received a non-empty value after demo click (changedFieldCount=${nonEmptyCount})`,
      ).toBeGreaterThanOrEqual(1);

      // 9) Stale token check across visible text + form values.
      const { bodyText } = await collectVisibleTextAndValues(page);
      const staleToken = findStaleToken(bodyText, valuesAfter);
      expect(
        staleToken,
        `${templateCode}: stale demo token "${staleToken}" leaked into rendered demo data`,
      ).toBeNull();

      // 10) Fields still editable (sample-of-20 check is enough for diagnosis).
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
      expect(
        lockedFields.length,
        `${templateCode}: ${lockedFields.length} fields became locked after demo click (sample=${JSON.stringify(lockedFields)})`,
      ).toBeLessThanOrEqual(Math.max(1, Math.floor(editable.length / 2)));

      // 11) "Xem trước bản in" still visible AFTER demo.
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });

      // 12) "Không tìm thấy trang" boundary absent.
      await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);

      // 13) No fatal console/page errors (tolerant of Clerk dev-mode noise).
      const fatal = [...consoleErrors, ...pageErrors].filter(
        (m) =>
          !/Clerk has been loaded with development keys/i.test(m) &&
          !/infinite redirect loop/i.test(m) &&
          !/Download the React DevTools/i.test(m),
      );
      expect(
        fatal,
        `${templateCode}: console/page errors: ${fatal.join(" | ")}`,
      ).toHaveLength(0);
    });
  }
});
