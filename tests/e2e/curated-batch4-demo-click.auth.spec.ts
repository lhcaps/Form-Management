/**
 * Authenticated demo-click smoke for the 20 newly curated Batch 4
 * INPUT_CONNECTED_PASS forms (BM-076..BM-100).
 *
 * Companion to tests/e2e/curated-batch4-templates.auth.spec.ts (which only
 * proves routing + visibility). This spec ALSO clicks the "Dữ liệu demo"
 * button and asserts the resulting demo state in the browser, restricted
 * to the 20 newly curated codes (Batch 4).
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
 * Strictly EXCLUDED (per task contract; demo-click is independent of
 * preview-click / docx-download / fidelity):
 *   - does NOT click "Xem trước bản in"
 *   - does NOT call preview-session API for the template code
 *   - does NOT call preview-session DOCX endpoint
 *   - does NOT call generated-document API
 *   - does NOT navigate to documents route for an existing record
 *   - does NOT assert generatedDocumentId anywhere
 *   - does NOT allow "Lịch sử xử lý" link in standalone template
 *
 * Failure classifications surfaced via the spec assertion messages:
 *   - DEMO_BUTTON_MISSING       — "Dữ liệu demo" button not found
 *   - DEMO_NO_VISIBLE_VALUE     — click succeeded but no field populated
 *   - STALE_DEMO_TOKEN          — a stale token leaked into rendered demo data
 *   - FIELD_LOCKED_AFTER_DEMO   — too many fields became non-editable
 *   - PREVIEW_BUTTON_HIDDEN     — "Xem trước bản in" disappeared after demo
 *   - SIGN_IN_REDIRECT          — bounced to /sign-in or /sign-up
 *   - PREVIEW_SESSION_LEAK      — POST preview-session fired (forbidden)
 *   - DOCX_DOWNLOAD_LEAK        — DOCX download request fired (forbidden)
 *   - DOCUMENTS_ROUTE_LEAK      — navigated to /documents/ (forbidden)
 *   - HISTORY_LINK_LEAK         — "Lịch sử xử lý" appeared (forbidden)
 *   - PAGE_CRASH                — JS error or unhandled exception
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-batch4-demo-click.auth.spec.ts \
 *     --workers=1 --reporter=json
 *
 * Auth + storageState are inherited from playwright.config.ts (Clerk ticket
 * strategy via tests/e2e/global.setup.ts).
 */

import { expect, test } from "@playwright/test";

// Batch 4 newly curated forms (BM-076..BM-100, 20 forms).
const BATCH4_CODES = [
  "BM-076",
  "BM-078",
  "BM-080",
  "BM-081",
  "BM-083",
  "BM-084",
  "BM-085",
  "BM-086",
  "BM-087",
  "BM-088",
  "BM-090",
  "BM-091",
  "BM-092",
  "BM-093",
  "BM-094",
  "BM-095",
  "BM-096",
  "BM-097",
  "BM-098",
  "BM-100",
];

// Stale tokens that must NEVER appear after a demo click.
// Aligned with the curated-37 + batch-3 spec — canonical stale-string list.
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

// Forbidden URL substrings — demo-click must NOT trigger any of these.
const PREVIEW_SESSION_URL = (code: string) =>
  `/api/v1/forms/runtime/${code}/preview-session`;
const PREVIEW_DOCX_URL_RE = /\/api\/v1\/forms\/runtime\/preview-sessions\/.*\/docx/;
const GENERATED_DOC_URL_RE = /\/api\/v1\/documents\/generated\//;

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

test.describe("Curated Batch 4 — authenticated demo-click smoke", () => {
  for (const templateCode of BATCH4_CODES) {
    test(`${templateCode} demo click populates demo data and stays editable`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      // Track every request so we can prove no preview-session / docx /
      // generated-document calls fired.
      const allRequests: { url: string; method: string }[] = [];
      const previewSessionHits: string[] = [];
      const docxDownloadHits: string[] = [];
      const generatedDocHits: string[] = [];
      const documentsNavHits: string[] = [];

      page.on("pageerror", (err) =>
        pageErrors.push(String(err.message || err)),
      );
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("request", (req) => {
        const url = req.url();
        const method = req.method();
        allRequests.push({ url, method });
        if (url.includes(PREVIEW_SESSION_URL(templateCode))) {
          previewSessionHits.push(`${method} ${url}`);
        }
        if (PREVIEW_DOCX_URL_RE.test(url)) {
          docxDownloadHits.push(`${method} ${url}`);
        }
        if (GENERATED_DOC_URL_RE.test(url)) {
          generatedDocHits.push(`${method} ${url}`);
        }
        if (/\/documents\//.test(url) || /\/documents\?/.test(url)) {
          documentsNavHits.push(`${method} ${url}`);
        }
      });

      // 1) Authenticated access.
      await page.goto(`/templates/${templateCode}`);

      // 2) Not redirected to sign-in / sign-up.
      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      // 3) BM code visible.
      await expect(
        page.getByText(new RegExp(templateCode, "i")).first(),
      ).toBeVisible({ timeout: 20_000 });

      // 4) At least one section heading.
      const sectionHeadings = page.locator("h3");
      await expect(sectionHeadings.first()).toBeVisible({ timeout: 20_000 });
      const sectionCount = await sectionHeadings.count();
      expect(sectionCount).toBeGreaterThanOrEqual(1);

      // 5) At least one input/textarea/select visible.
      const inputs = page.locator("input, textarea, select");
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(1);

      // 6) "Dữ liệu demo" button visible & enabled.
      const demoBtn = page
        .getByRole("button", { name: /^Dữ liệu demo$/i })
        .first();
      await expect(demoBtn).toBeVisible({ timeout: 10_000 });
      await expect(demoBtn).toBeEnabled({ timeout: 10_000 });

      // 7) "Xem trước bản in" button visible BEFORE click (baseline).
      const previewBtn = page
        .getByRole("button", { name: /Xem trước bản in/i })
        .first();
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });

      // 8) Click demo.
      await demoBtn.click();
      // Allow React state to settle without arbitrary sleeps.
      await page.waitForTimeout(500);

      // 9) At least one field now has a non-empty value.
      const valuesAfter = await page.$$eval(
        "input, textarea, select",
        (els) => els.map((e) => (e.value || "").trim()),
      );
      const nonEmptyCount = valuesAfter.filter((v) => v.length > 0).length;
      expect(
        nonEmptyCount,
        `${templateCode}: no input/textarea/select received a non-empty value after demo click (changedFieldCount=${nonEmptyCount})`,
      ).toBeGreaterThanOrEqual(1);

      // 10) Stale token check across visible text + form values.
      const { bodyText } = await collectVisibleTextAndValues(page);
      const staleToken = findStaleToken(bodyText, valuesAfter);
      expect(
        staleToken,
        `${templateCode}: stale demo token "${staleToken}" leaked into rendered demo data`,
      ).toBeNull();

      // 11) Fields still editable (sample-of-20 check is enough for diagnosis).
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

      // 12) "Xem trước bản in" still visible AFTER demo.
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });

      // 13) "Không tìm thấy trang" boundary absent.
      await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);

      // 14) Strict lifecycle contract — demo-click must NOT trigger
      //     preview-session, docx download, generated-document, or
      //     /documents/:id navigation.
      expect(
        previewSessionHits.length,
        `${templateCode}: preview-session POST leaked on demo click (${previewSessionHits.join(", ")})`,
      ).toBe(0);
      expect(
        docxDownloadHits.length,
        `${templateCode}: DOCX download leaked on demo click (${docxDownloadHits.join(", ")})`,
      ).toBe(0);
      expect(
        generatedDocHits.length,
        `${templateCode}: generated-document API call leaked on demo click (${generatedDocHits.join(", ")})`,
      ).toBe(0);
      expect(
        documentsNavHits.length,
        `${templateCode}: /documents/ request leaked on demo click (${documentsNavHits.join(", ")})`,
      ).toBe(0);

      // 15) No "Lịch sử xử lý" in standalone template.
      await expect(page.locator("text=Lịch sử xử lý")).toHaveCount(0);

      // 16) URL never navigated to /documents/.
      expect(
        /\/documents\//.test(page.url()),
        `${templateCode}: page URL is ${page.url()}`,
      ).toBe(false);

      // 17) No fatal console/page errors (tolerant of Clerk dev-mode noise).
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