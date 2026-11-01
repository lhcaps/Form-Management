/**
 * Authenticated routing/visibility smoke for the 20 newly curated
 * Batch 4 INPUT_CONNECTED_PASS forms.
 *
 * Purpose: prove that every newly curated template loads behind real Clerk
 * auth (via the existing ticket strategy in tests/e2e/global.setup.ts) and
 * that the page exposes the runtime-ux shell elements required for
 * browser-visibility PASS evidence, WITHOUT clicking demo, preview, or
 * calling preview-session.
 *
 * Asserts per code:
 *   - not redirected to /sign-in or /sign-up
 *   - "BM-NNN" is visible somewhere on the page
 *   - at least one <h3> section heading is visible
 *   - at least one <input> or <textarea> or <select> is visible
 *   - "Xem trước bản in" button is visible
 *   - page does not show the "Không tìm thấy trang" boundary
 *   - no fatal console errors
 *
 * Does NOT click preview, does NOT click demo, does NOT exercise the
 * preview-session API, does NOT download DOCX. Those flows are covered
 * by separate specs and are intentionally out of scope for this
 * routing/visibility smoke.
 *
 * Source/render invariants for these 20 forms are already covered by
 * scripts/audit/render-smoke-curated.mjs. The 20 codes are extracted
 * from QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json (status ===
 * "INPUT_CONNECTED_PASS" and templateCode in BATCH4_CODES).
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-batch4-templates.auth.spec.ts \
 *     --workers=1 --reporter=json
 */
import { expect, test } from "@playwright/test";

// Batch 4 newly curated forms (BM-076, BM-078, BM-080, BM-081, BM-083,
// BM-084, BM-085, BM-086, BM-087, BM-088, BM-090, BM-091, BM-092,
// BM-093, BM-094, BM-095, BM-096, BM-097, BM-098, BM-100).
//
// Excludes the existing 37 + Batch 3 (57 already in
// curated-22-templates.auth.spec.ts + curated-batch3-templates.auth.spec.ts)
// and BM-077, BM-079, BM-082, BM-089, BM-099 (not selected for Batch 4 —
// see selection rationale in QLLAW_BATCH4_CURATION.latest.md).
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

test.describe("Curated Batch 4 templates — authenticated routing/visibility smoke", () => {
  for (const templateCode of BATCH4_CODES) {
    test(`${templateCode} loads authenticated with runtime-ux shell`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(String(err));
      });

      await page.goto(`/templates/${templateCode}`);

      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      await expect(
        page.getByText(new RegExp(templateCode, "i")).first(),
      ).toBeVisible({ timeout: 20_000 });

      const sectionHeadings = page.locator("h3");
      await expect(sectionHeadings.first()).toBeVisible({ timeout: 20_000 });
      const sectionCount = await sectionHeadings.count();
      expect(sectionCount).toBeGreaterThanOrEqual(1);

      const inputs = page.locator("input, textarea, select");
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(1);

      const previewBtn = page
        .getByRole("button", { name: /Xem trước bản in/i })
        .first();
      await expect(previewBtn).toBeVisible();

      await expect(page.locator("text=Không tìm thấy trang")).toHaveCount(0);

      // No fatal page-level errors. We tolerate Clerk dev-mode warnings
      // (which fire a known dev-keys info message) and unrelated warnings
      // (e.g. dev-only react warnings) but the first line of this
      // assertion is the strict gate.
      const fatal = [...consoleErrors, ...pageErrors].filter(
        (m) =>
          !/Clerk has been loaded with development keys/i.test(m) &&
          !/infinite redirect loop/i.test(m) &&
          !/Download the React DevTools/i.test(m),
      );
      expect(fatal, `console/page errors: ${fatal.join(" | ")}`).toHaveLength(0);
    });
  }
});