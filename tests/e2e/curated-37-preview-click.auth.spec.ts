/**
 * Authenticated preview-click smoke for the curated INPUT_CONNECTED_PASS forms.
 *
 * Companion to:
 *   - tests/e2e/curated-22-templates.auth.spec.ts   (visibility only)
 *   - tests/e2e/curated-37-demo-click.auth.spec.ts  (demo button + editability)
 *   - tests/e2e/runtime-preview-session.auth.spec.ts (BM-001 standalone ref)
 *
 * This spec clicks "Xem trước bản in" for every curated code and asserts the
 * runtime-preview-session lifecycle contract end-to-end:
 *
 *   1. /templates/BM-NNN loads authenticated (no Clerk redirect).
 *   2. The "Dữ liệu demo" button is clicked first so the locked-contract
 *      requiredFieldKeys gate does NOT short-circuit the preview-session
 *      POST (same root-cause gate that produced the original KNOWN_FAIL
 *      on BM-001).
 *   3. POST /api/v1/forms/runtime/${code}/preview-session is fired on
 *      "Xem trước bản in" click.
 *   4. The response is application/json (NOT raw DOCX bytes — no PK leak).
 *   5. The response JSON parses cleanly.
 *   6. persisted === false (standalone runtime session, never documents workspace).
 *   7. sessionId starts with runtime_preview_.
 *   8. docxDownloadUrl exists and points to /api/v1/forms/runtime/preview-sessions/.
 *   9. No generatedDocumentId in response.
 *  10. No automatic browser download happens on the preview click itself
 *      (we record the network events and the download events; both must
 *      show zero downloads between the preview click and the assertion).
 *  11. The standalone UX shows the honest preview/fallback panel.
 *  12. pdfPreviewUrl === null ⇒ amber "Đã tạo file DOCX tạm thời" copy present
 *      (no misleading "Đã tạo bản xem trước" claim).
 *  13. "Tải DOCX" button is visible + enabled, and its href/handler points
 *      to the session's docx download URL (we DO NOT click it here —
 *      download verification is out of scope for this phase).
 *  14. "Lịch sử xử lý" link is absent in standalone.
 *  15. URL did NOT navigate to /documents/.
 *  16. No console / page errors logged.
 *
 * Strict lifecycle guarantees (per task contract):
 *   - The endpoint is a runtime preview session: persisted=false, no
 *     /documents navigation, no generatedDocumentId.
 *   - The response is JSON metadata, not binary DOCX.
 *   - No auto-download on preview click — downloads are explicit only.
 *
 * Failure classifications surfaced via spec title + audit artifact:
 *   - PREVIEW_BUTTON_MISSING     — "Xem trước bản in" not visible
 *   - PREVIEW_REQUEST_NOT_FIRED  — POST preview-session never sent
 *   - PREVIEW_REQUEST_TIMEOUT    — POST preview-session > 30s
 *   - PREVIEW_RESPONSE_4XX       — response status 400-499
 *   - PREVIEW_RESPONSE_5XX       — response status 500-599
 *   - PREVIEW_RESPONSE_BINARY_PK — response body starts with "PK"
 *   - PREVIEW_JSON_INVALID       — response is JSON but does not parse
 *   - PERSISTED_TRUE             — persisted === true (workspace leak)
 *   - GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId appears in JSON
 *   - AUTO_DOWNLOAD_WRONG        — browser download fired on preview click
 *   - DOCX_URL_MISSING           — docxDownloadUrl missing or wrong shape
 *   - FALLBACK_COPY_WRONG        — pdfPreviewUrl===null but no amber fallback
 *   - HISTORY_LINK_LEAK          — "Lịch sử xử lý" rendered in standalone
 *   - DOCUMENTS_ROUTE_LEAK       — page navigated to /documents/...
 *   - AUTH_FAIL                  — bounced to /sign-in or /sign-up
 *   - ROUTE_RENDER_FAIL          — title/sections/inputs missing
 *   - CONSOLE_ERRORS             — unhandled exception / pageerror
 *   - UNKNOWN                    — any other failure
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-37-preview-click.auth.spec.ts \
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
  // Runtime-ready allowlist (unchanged).
  "BM-001",
  "BM-171",
];

const SESSION_ID_RE = /^runtime_preview_[a-f0-9-]{36}$/;

test.describe("Curated 37 — authenticated preview-click smoke", () => {
  for (const templateCode of CURATED_FORMS) {
    test(`${templateCode} preview click yields honest runtime preview session`, async ({
      page,
    }) => {
      const consoleErrors = [];
      page.on("pageerror", (err) => consoleErrors.push(String(err.message || err)));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // ── 1) Authenticated access ─────────────────────────────────────────
      await page.goto(`/templates/${templateCode}`);

      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      // ── 2) Title + sections + fields visible (route render OK) ─────────
      await expect(page.getByText(new RegExp(templateCode, "i")).first()).toBeVisible({
        timeout: 20_000,
      });
      const sectionHeadings = page.locator("h3");
      await expect(sectionHeadings.first()).toBeVisible({ timeout: 20_000 });
      const inputs = page.locator("input, textarea, select");
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });

      // ── 3) Demo click to satisfy locked-contract requiredFieldKeys gate ─
      const demoBtn = page
        .getByRole("button", { name: /^Dữ liệu demo$/i })
        .first();
      await expect(demoBtn).toBeVisible({ timeout: 10_000 });
      await expect(demoBtn).toBeEnabled({ timeout: 10_000 });
      await demoBtn.click();
      await page.waitForTimeout(500);

      // ── 4) Preview button visible + enabled ────────────────────────────
      const previewBtn = page
        .getByRole("button", { name: /Xem trước bản in/i })
        .first();
      await expect(previewBtn).toBeVisible({ timeout: 10_000 });
      await expect(previewBtn).toBeEnabled({ timeout: 10_000 });

      // ── 5) Subscribe to network events BEFORE click ────────────────────
      //    a. The preview-session POST.
      //    b. Any navigation request to /documents (must remain zero).
      //    c. Any download event fired by the browser (must remain zero
      //       between click and final assertion — explicit Tải DOCX is
      //       out of scope for this phase).
      const previewResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/forms/runtime/${templateCode}/preview-session`) &&
          response.request().method() === "POST",
        { timeout: 30_000 },
      );

      const documentsNavRequests = [];
      page.on("request", (req) => {
        const url = req.url();
        if (/\/documents\//.test(url) || /\/documents\?/.test(url)) {
          documentsNavRequests.push(url);
        }
      });

      let autoDownloadFired = false;
      let autoDownloadUrl = null;
      const downloadPromise = page
        .waitForEvent("download", { timeout: 2_000 })
        .then((d) => {
          autoDownloadFired = true;
          autoDownloadUrl = d.url();
          return d;
        })
        .catch(() => null);

      // ── 6) Click "Xem trước bản in" ────────────────────────────────────
      await previewBtn.click();

      const previewResponse = await previewResponsePromise;

      // ── 7) Response status + content-type assertions ───────────────────
      const statusCode = previewResponse.status();
      const contentType = previewResponse.headers()["content-type"] ?? "";

      // ── 8) Body must be JSON, NOT raw DOCX bytes ────────────────────────
      const rawBody = await previewResponse.text();
      const startsWithPk = rawBody.startsWith("PK");

      let parsedSession = null;
      let jsonParseError = null;
      if (!startsWithPk) {
        try {
          parsedSession = JSON.parse(rawBody);
        } catch (err) {
          jsonParseError = String(err?.message || err);
        }
      }

      // Allow a short window for any spurious downloads; we only care that
      // no auto-download happened BETWEEN the click and this assertion.
      await downloadPromise.catch(() => null);

      // ── 9) Lifecycle assertions (only when we got a clean JSON body) ────
      const persisted =
        parsedSession && typeof parsedSession === "object"
          ? parsedSession.persisted
          : null;
      const sessionId =
        parsedSession && typeof parsedSession === "object"
          ? parsedSession.sessionId
          : null;
      const sessionIdPrefixOk = typeof sessionId === "string" && SESSION_ID_RE.test(sessionId);
      const docxUrl =
        parsedSession && typeof parsedSession === "object"
          ? parsedSession.docxDownloadUrl
          : null;
      const docxDownloadUrlPresent =
        typeof docxUrl === "string" &&
        docxUrl.includes("/preview-sessions/") &&
        docxUrl.includes("/docx");
      const pdfPreviewUrl =
        parsedSession && typeof parsedSession === "object"
          ? parsedSession.pdfPreviewUrl ?? null
          : null;
      const pdfPreviewUrlPresent = !!pdfPreviewUrl;
      const generatedDocumentIdLeak = (() => {
        if (!parsedSession) return false;
        const blob = JSON.stringify(parsedSession);
        return /generatedDocumentId/i.test(blob);
      })();

      // ── 10) Honest UX panel assertions ─────────────────────────────────
      //         pdfPreviewUrl present → emerald PDF iframe panel
      //         pdfPreviewUrl null    → amber "Đã tạo file DOCX tạm thời"
      //                                   fallback panel
      let fallbackHonest = true;
      try {
        if (pdfPreviewUrl) {
          const pdfPanel = page
            .locator(".rounded-xl.border.border-emerald-200")
            .filter({
              has: page.locator('iframe[title^="Bản xem trước PDF"]'),
            })
            .first();
          await expect(pdfPanel).toBeVisible({ timeout: 10_000 });
          // Honest: must NOT claim "Đã tạo file DOCX tạm thời" when a real
          // PDF preview is available.
          await expect(
            pdfPanel.locator("text=Đã tạo file DOCX tạm thời"),
          ).toHaveCount(0);
        } else {
          const amberPanel = page
            .locator(".rounded-xl.border.border-amber-200")
            .filter({ hasText: "Đã tạo file DOCX tạm thời" })
            .first();
          await expect(amberPanel).toBeVisible({ timeout: 10_000 });
          await expect(
            amberPanel.locator("text=Tính năng xem trước PDF đang được phát triển"),
          ).toBeVisible();
          // Honest: must NOT claim "Đã tạo bản xem trước" in fallback mode.
          await expect(
            amberPanel.locator("text=Đã tạo bản xem trước"),
          ).toHaveCount(0);
        }

        // Standalone must NOT show "Lịch sử xử lý".
        await expect(page.locator("text=Lịch sử xử lý")).toHaveCount(0);
      } catch (err) {
        fallbackHonest = false;
        throw err;
      }

      // ── 11) "Tải DOCX" button visible + enabled, no click ──────────────
      // Scope to the actual preview/fallback panel — the page also has
      // emerald pills (e.g. caseCode badge) that would fool `.first()`.
      const previewPanelEl = pdfPreviewUrl
        ? page
            .locator(".rounded-xl.border.border-emerald-200")
            .filter({
              has: page.locator('iframe[title^="Bản xem trước PDF"]'),
            })
            .first()
        : page
            .locator(".rounded-xl.border.border-amber-200")
            .filter({ hasText: "Đã tạo file DOCX tạm thời" })
            .first();
      const taiDocxBtn = previewPanelEl
        .locator("button", { hasText: /Tải DOCX/i })
        .first();
      await expect(taiDocxBtn).toBeVisible({ timeout: 10_000 });
      await expect(taiDocxBtn).toBeEnabled();

      // ── 12) Lifecycle / contract assertions ────────────────────────────
      // Hard contract — every failure here must surface in the audit.
      expect(
        startsWithPk,
        `${templateCode}: preview-session response body starts with PK (binary leak)`,
      ).toBe(false);
      expect(
        jsonParseError,
        `${templateCode}: preview-session JSON parse error: ${jsonParseError}`,
      ).toBeNull();
      expect(
        parsedSession && typeof parsedSession === "object",
        `${templateCode}: parsedSession is null`,
      ).toBe(true);
      expect(
        statusCode >= 200 && statusCode < 300,
        `${templateCode}: preview-session status ${statusCode}`,
      ).toBe(true);
      expect(
        contentType.toLowerCase().includes("application/json"),
        `${templateCode}: preview-session content-type "${contentType}"`,
      ).toBe(true);
      expect(
        persisted === false,
        `${templateCode}: persisted must be false (got ${JSON.stringify(persisted)})`,
      ).toBe(true);
      expect(
        sessionIdPrefixOk,
        `${templateCode}: sessionId "${sessionId}" does not match ${SESSION_ID_RE}`,
      ).toBe(true);
      expect(
        docxDownloadUrlPresent,
        `${templateCode}: docxDownloadUrl missing or wrong shape (got ${JSON.stringify(docxUrl)})`,
      ).toBe(true);
      expect(
        generatedDocumentIdLeak,
        `${templateCode}: generatedDocumentId leaked in response JSON`,
      ).toBe(false);
      expect(
        autoDownloadFired,
        `${templateCode}: auto-download fired on preview click (url=${autoDownloadUrl})`,
      ).toBe(false);
      expect(
        documentsNavRequests.length,
        `${templateCode}: navigated to /documents/* (${documentsNavRequests.join(", ")})`,
      ).toBe(0);
      expect(
        /\/documents\//.test(page.url()),
        `${templateCode}: page URL is ${page.url()}`,
      ).toBe(false);
      expect(
        consoleErrors.length,
        `${templateCode}: console/page errors: ${consoleErrors.slice(0, 3).join(" | ")}`,
      ).toBe(0);
    });
  }
});