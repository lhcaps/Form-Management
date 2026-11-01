/**
 * Authenticated routing/visibility smoke for the curated
 * INPUT_CONNECTED_PASS forms.
 *
 * Run history:
 *   - 22 templates after the curated-batch 1 + initial 5 (early 2026).
 *   - 37 templates after the next-large batch 1 (15 forms) — same file,
 *     list extended.
 *   - 52 templates after the next-large batch 2 (15 forms) — list
 *     extended again (this revision). Test name kept as
 *     `curated-22-templates.auth.spec.ts` for backwards compatibility
 *     with the audit artifact filenames; the iteration count has
 *     drifted from the literal `22`.
 *
 * Purpose: prove that every curated template loads behind real Clerk auth
 * (via the existing ticket strategy in tests/e2e/global.setup.ts) and that
 * the page exposes the runtime-ux shell elements required by
 * `docs/audit/unified-bm-workspace/QLLAW_CURATED_BROWSER_SMOKE.latest.json`.
 *
 * Asserts per code:
 *   - not redirected to /sign-in or /sign-up
 *   - "BM-NNN" is visible somewhere on the page
 *   - at least one <h3> section heading is visible
 *   - at least one <input> or <textarea> is visible
 *   - "Xem trước bản in" button is visible
 *   - page does not show the "Không tìm thấy trang" boundary
 *
 * Does NOT click preview, does NOT click demo, does NOT exercise the
 * preview-session API. Those flows are covered by separate specs and
 * are intentionally out of scope for this routing/visibility smoke.
 *
 * Run with: pnpm test:e2e:auth -- tests/e2e/curated-22-templates.auth.spec.ts
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
  // Runtime-ready allowlist (unchanged).
  "BM-001",
  "BM-171",
];

test.describe("Curated INPUT_CONNECTED_PASS templates — authenticated routing/visibility smoke", () => {
  for (const templateCode of CURATED_FORMS) {
    test(`${templateCode} loads authenticated with runtime-ux shell`, async ({ page }) => {
      await page.goto(`/templates/${templateCode}`);

      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      await expect(page.getByText(new RegExp(templateCode, "i")).first()).toBeVisible({
        timeout: 20_000,
      });

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
    });
  }
});
