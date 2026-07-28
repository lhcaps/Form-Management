/**
 * Authenticated DOCX download smoke for the curated INPUT_CONNECTED_PASS forms.
 *
 * Companion to:
 *   - tests/e2e/curated-37-preview-click.auth.spec.ts (preview-session POST)
 *   - tests/e2e/curated-37-demo-click.auth.spec.ts   (demo button + editability)
 *   - tests/e2e/runtime-preview-session.auth.spec.ts  (BM-001 standalone ref)
 *
 * This spec clicks "Dữ liệu demo" + "Xem trước bản in" for every curated code,
 * captures the runtime preview-session JSON (persisted=false, docxDownloadUrl
 * present), then issues an authenticated in-browser fetch against the
 * docxDownloadUrl and validates the binary response end-to-end:
 *
 *   1. /templates/BM-NNN loads authenticated (no Clerk redirect).
 *   2. The "Dữ liệu demo" button is clicked first so the locked-contract
 *      requiredFieldKeys gate does NOT short-circuit the preview-session POST.
 *   3. POST /api/v1/forms/runtime/${code}/preview-session is fired on
 *      "Xem trước bản in" click and returns application/json (not PK).
 *   4. persisted === false (standalone runtime session, never documents workspace).
 *   5. sessionId starts with runtime_preview_.
 *   6. docxDownloadUrl exists and points to /api/v1/forms/runtime/preview-sessions/.
 *   7. No generatedDocumentId in response.
 *   8. No navigation to /documents/.
 *   9. Authenticated GET against docxDownloadUrl returns 200 + DOCX content-type.
 *  10. Response buffer starts with "PK" (ZIP/DOCX magic).
 *  11. Buffer length > 5 KB.
 *  12. Buffer unzips and contains [Content_Types].xml + word/document.xml.
 *  13. word/document.xml text contains no "{{" / "}}" / "undefined" / "null"
 *      placeholders and none of the curated stale demo tokens.
 *  14. No console / page errors logged.
 *
 * Strict lifecycle guarantees (per task contract):
 *   - The endpoint is a runtime preview session: persisted=false, no
 *     /documents navigation, no generatedDocumentId, no /documents/:id route.
 *   - The preview-session response is JSON metadata, not binary DOCX.
 *   - DOCX download is initiated by an explicit in-browser fetch against
 *     the captured docxDownloadUrl. The fetch resolves the Clerk Bearer
 *     token via `window.Clerk.session.getToken()` and calls the API
 *     origin (port 3001) with `Authorization: Bearer <jwt>` — the same
 *     authenticated request the production "Tải DOCX" button ultimately
 *     makes after `installApiFetchDefaults` applies the auth wrapper.
 *   - The returned ArrayBuffer is shipped back to the test runtime as
 *     base64, then written under `.tmp-docx-download-smoke/` (gitignored)
 *     for ZIP / DOCX validation. No real download directory is touched,
 *     no `<a download>` element click is required, and there is zero
 *     browser-side flake.
 *   - "Tải DOCX" button click is intentionally NOT performed in this
 *     phase — we validate the API contract directly, which is the
 *     superset of what the button click ultimately exercises.
 *
 * Failure classifications surfaced via spec title + audit artifact:
 *   - AUTH_FAIL                  — bounced to /sign-in or /sign-up
 *   - ROUTE_RENDER_FAIL          — title/sections/inputs missing
 *   - PREVIEW_BUTTON_MISSING     — "Xem trước bản in" not visible
 *   - PREVIEW_SESSION_FAIL       — POST preview-session failed (status / body)
 *   - DOCX_URL_MISSING           — docxDownloadUrl missing or wrong shape
 *   - DOCX_DOWNLOAD_4XX          — DOCX GET status 400-499
 *   - DOCX_DOWNLOAD_5XX          — DOCX GET status 500-599
 *   - DOCX_DOWNLOAD_NOT_BINARY   — DOCX GET body is not ZIP/PK
 *   - DOCX_DOWNLOAD_TOO_SMALL    — DOCX body < 5 KB
 *   - DOCX_NOT_ZIP               — ZIP structure cannot be parsed
 *   - DOCX_MISSING_CONTENT_TYPES — [Content_Types].xml not in package
 *   - DOCX_MISSING_DOCUMENT_XML  — word/document.xml not in package
 *   - DOCX_PLACEHOLDER_LEAK      — "{{" / "}}" / "undefined" / "null" /
 *                                  "[object Object]" found in word/document.xml
 *   - DOCX_STALE_TOKEN_LEAK      — known stale demo token found
 *                                  (Nguyễn Văn A, Trần Thị B, Ông  cung cấp,
 *                                  Ông cung cấp, Nguyễn Thị Hồng Hạnh)
 *   - GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in preview-session JSON
 *   - HISTORY_LINK_LEAK          — "Lịch sử xử lý" rendered in standalone
 *   - DOCUMENTS_ROUTE_LEAK       — page navigated to /documents/...
 *   - CONSOLE_ERRORS             — unhandled exception / pageerror
 *   - UNKNOWN                    — any other failure
 *
 * Run with:
 *   npx playwright test --project="authenticated chromium" \
 *     tests/e2e/curated-37-docx-download.auth.spec.ts \
 *     --workers=1 --reporter=json
 *
 * Auth + storageState are inherited from playwright.config.ts (Clerk ticket
 * strategy via tests/e2e/global.setup.ts).
 */

import PizZip from "pizzip";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TMP_DOWNLOAD_DIR = resolve(
  process.cwd(),
  ".tmp-docx-download-smoke",
).replace(/\\/g, "/");
mkdirSync(TMP_DOWNLOAD_DIR, { recursive: true });

const CURATED_FORMS = [
  "BM-001",
  "BM-005",
  "BM-006",
  "BM-007",
  "BM-008",
  "BM-009",
  "BM-010",
  "BM-011",
  "BM-012",
  "BM-014",
  "BM-015",
  "BM-017",
  "BM-018",
  "BM-019",
  "BM-020",
  "BM-022",
  "BM-023",
  "BM-030",
  "BM-031",
  "BM-033",
  "BM-035",
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
  "BM-171",
];

const SESSION_ID_RE = /^runtime_preview_[a-f0-9-]{36}$/;

const MIN_DOCX_BYTES = 5 * 1024; // 5 KB minimum DOCX size

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\{\{/,
  /\}\}/,
  /\bundefined\b/,
  /\bnull\b/,
  /\[object Object\]/,
];

const STALE_TOKEN_PATTERNS: RegExp[] = [
  /Nguyễn Văn A\b/,
  /Trần Thị B\b/,
  /Ông  cung cấp/, // double space
  /Ông cung cấp/,
  /Nguyễn Thị Hồng Hạnh/,
];

const DOCX_CONTENT_TYPES_OK =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCX_CONTENT_TYPES_OCTET = "application/octet-stream";

test.describe("Curated 37 — authenticated DOCX download smoke", () => {
  for (const templateCode of CURATED_FORMS) {
    test(`${templateCode} downloads a real DOCX from runtime preview session`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) =>
        consoleErrors.push(String(err.message || err)),
      );
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // ── 1) Authenticated access ─────────────────────────────────────────
      await page.goto(`/templates/${templateCode}`);
      await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 20_000 });

      // ── 2) Title + sections + fields visible (route render OK) ─────────
      await expect(page.getByText(new RegExp(templateCode, "i")).first()).toBeVisible(
        { timeout: 20_000 },
      );
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
      const previewResponsePromise = page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              `/api/v1/forms/runtime/${templateCode}/preview-session`,
            ) && response.request().method() === "POST",
        { timeout: 30_000 },
      );

      const documentsNavRequests: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (/\/documents\//.test(url) || /\/documents\?/.test(url)) {
          documentsNavRequests.push(url);
        }
      });

      // ── 6) Click "Xem trước bản in" ────────────────────────────────────
      await previewBtn.click();
      const previewResponse = await previewResponsePromise;

      const previewStatus = previewResponse.status();
      const previewContentType =
        previewResponse.headers()["content-type"] ?? "";
      const previewRawBody = await previewResponse.text();
      const previewStartsWithPk = previewRawBody.startsWith("PK");

      let parsedSession: Record<string, unknown> | null = null;
      if (!previewStartsWithPk) {
        try {
          parsedSession = JSON.parse(previewRawBody);
        } catch {
          parsedSession = null;
        }
      }

      const persisted =
        parsedSession && typeof parsedSession.persisted === "boolean"
          ? parsedSession.persisted
          : null;
      const sessionId =
        parsedSession && typeof parsedSession.sessionId === "string"
          ? parsedSession.sessionId
          : null;
      const docxUrl =
        parsedSession && typeof parsedSession.docxDownloadUrl === "string"
          ? parsedSession.docxDownloadUrl
          : null;
      const sessionIdPrefixOk =
        typeof sessionId === "string" && SESSION_ID_RE.test(sessionId);
      const docxDownloadUrlPresent =
        typeof docxUrl === "string" &&
        docxUrl.includes("/preview-sessions/") &&
        docxUrl.includes("/docx");
      const generatedDocumentIdLeak = (() => {
        if (!parsedSession) return false;
        return /generatedDocumentId/i.test(JSON.stringify(parsedSession));
      })();

      // ── 7) Honor lifecycle assertions (same hard contract as preview-click) ──
      expect(
        previewStartsWithPk,
        `${templateCode}: preview-session response body starts with PK (binary leak)`,
      ).toBe(false);
      expect(
        parsedSession,
        `${templateCode}: preview-session response did not parse as JSON`,
      ).not.toBeNull();
      expect(
        previewStatus >= 200 && previewStatus < 300,
        `${templateCode}: preview-session status ${previewStatus}`,
      ).toBe(true);
      expect(
        previewContentType.toLowerCase().includes("application/json"),
        `${templateCode}: preview-session content-type "${previewContentType}"`,
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
        documentsNavRequests.length,
        `${templateCode}: navigated to /documents/* (${documentsNavRequests.join(", ")})`,
      ).toBe(0);
      expect(
        /\/documents\//.test(page.url()),
        `${templateCode}: page URL is ${page.url()}`,
      ).toBe(false);
      await expect(page.locator("text=Lịch sử xử lý")).toHaveCount(0);

      // ── 8) Authenticated DOCX GET against docxDownloadUrl ─────────────
      // The frontend's patched window.fetch routes /api/v1/* requests to
      // the API origin (port 3001) and attaches the Clerk Bearer token
      // via `installApiFetchDefaults`. We exercise that exact path:
      //   1. Resolve the Clerk session token via window.Clerk in-page.
      //   2. Issue the GET against the API origin with `Authorization:
      //      Bearer <token>`. This is the same authenticated request the
      //      production "Tải DOCX" button ultimately makes after the
      //      installApiFetchDefaults wrapper is applied.
      // The response ArrayBuffer is shipped back to the test runtime as
      // base64 (ArrayBuffers cannot cross the evaluate boundary directly).
      const apiOrigin = new URL(
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1",
      ).origin;
      const absoluteDocxUrl = new URL(docxUrl!, apiOrigin).toString();

      const fetchResult = await page.evaluate(
        async ({ url, origin }: { url: string; origin: string }) => {
          // Resolve Clerk session token from the in-page SDK so we can
          // carry it as Authorization: Bearer <jwt> to the API origin.
          // This mirrors what `installApiFetchDefaults` does internally
          // via `getApiAuthToken` → `useClerkAuth().getToken()`.
          const w = window as unknown as {
            Clerk?: {
              session?: { getToken: () => Promise<string | null> };
            };
          };
          let bearer: string | null = null;
          try {
            bearer = (await w.Clerk?.session?.getToken?.()) ?? null;
          } catch {
            bearer = null;
          }

          const headers: Record<string, string> = {
            Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          };
          if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

          const r = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers,
          });
          const buffer = await r.arrayBuffer();
          const headerBytes = new Uint8Array(buffer).slice(0, 4);
          // base64-encode the entire buffer for shipping across the
          // page.evaluate boundary. ArrayBuffers cannot be serialized, so
          // we hand back a base64 string and let Node decode it.
          const bytes = new Uint8Array(buffer);
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(
              ...bytes.subarray(i, Math.min(i + chunk, bytes.length)),
            );
          }
          return {
            status: r.status,
            contentType: r.headers.get("content-type") ?? "",
            byteLength: buffer.byteLength,
            header: Array.from(headerBytes),
            bufferBase64: typeof btoa === "function" ? btoa(binary) : "",
            bearerPresent: Boolean(bearer),
            requestedOrigin: origin,
          };
        },
        { url: absoluteDocxUrl, origin: apiOrigin },
      );

      const docxStatus = fetchResult.status;
      const docxContentType = fetchResult.contentType;
      const docxBuffer = Buffer.from(fetchResult.bufferBase64, "base64");
      const docxByteLength = docxBuffer.length;
      const docxStartsWithPk =
        docxByteLength >= 2 &&
        docxBuffer[0] === 0x50 /* P */ &&
        docxBuffer[1] === 0x4b; /* K */

      // Persist the raw DOCX buffer under the ignored temp dir so the
      // audit smoke script and humans can independently re-open it
      // (PizZip, 7-Zip, Word) without re-issuing the request. Files are
      // gitignored; we only need the bytes to live long enough for the
      // post-run artifact collection.
      writeFileSync(`${TMP_DOWNLOAD_DIR}/${templateCode}.docx`, docxBuffer);

      // ── 9) Hard DOCX response assertions ─────────────────────────────
      expect(
        docxStatus === 200,
        `${templateCode}: DOCX GET status ${docxStatus}`,
      ).toBe(true);

      const ct = docxContentType.toLowerCase();
      const contentTypeOk =
        ct.includes(DOCX_CONTENT_TYPES_OK) ||
        ct.includes(DOCX_CONTENT_TYPES_OCTET) ||
        ct.includes("zip");
      expect(
        contentTypeOk,
        `${templateCode}: DOCX content-type "${docxContentType}" is not DOCX/octet/zip`,
      ).toBe(true);

      expect(
        docxStartsWithPk,
        `${templateCode}: DOCX buffer does not start with PK magic bytes`,
      ).toBe(true);

      expect(
        docxByteLength >= MIN_DOCX_BYTES,
        `${templateCode}: DOCX byte length ${docxByteLength} < ${MIN_DOCX_BYTES}`,
      ).toBe(true);

      // ── 10) Validate DOCX ZIP package structure ───────────────────────
      // PizZip accepts a Buffer directly. We use it read-only (no .generate).
      const zip = new PizZip(docxBuffer);
      const entryNames = Object.keys(zip.files);

      const contentTypesXmlPresent = entryNames.includes("[Content_Types].xml");
      const relsPresent = entryNames.includes("_rels/.rels");
      const wordDocumentXmlPresent = entryNames.includes("word/document.xml");

      expect(
        contentTypesXmlPresent,
        `${templateCode}: DOCX package missing [Content_Types].xml (entries=${entryNames.length})`,
      ).toBe(true);
      expect(
        relsPresent,
        `${templateCode}: DOCX package missing _rels/.rels`,
      ).toBe(true);
      expect(
        wordDocumentXmlPresent,
        `${templateCode}: DOCX package missing word/document.xml`,
      ).toBe(true);

      // ── 11) Inspect word/document.xml for placeholder / stale-token leaks ──
      const docEntry = zip.file("word/document.xml");
      const docXml = docEntry ? docEntry.asText() : "";

      // XML tags strip — only visible text counts. Removing angle-bracketed
      // segments keeps "<w:t>Nguyễn Văn A</w:t>" as text but strips all tags.
      const visibleText = docXml.replace(/<[^>]+>/g, " ");
      // Collapse whitespace to make boundary matches deterministic.
      const normalized = visibleText.replace(/\s+/g, " ");

      const placeholderMatches: string[] = [];
      for (const re of PLACEHOLDER_PATTERNS) {
        const m = normalized.match(re);
        if (m) placeholderMatches.push(`pattern=${re.source} match="${m[0]}"`);
      }

      const staleTokenMatches: string[] = [];
      for (const re of STALE_TOKEN_PATTERNS) {
        const m = normalized.match(re);
        if (m) staleTokenMatches.push(`pattern=${re.source} match="${m[0]}"`);
      }

      expect(
        placeholderMatches.length,
        `${templateCode}: word/document.xml placeholder leak(s): ${placeholderMatches.join(" | ")}`,
      ).toBe(0);
      expect(
        staleTokenMatches.length,
        `${templateCode}: word/document.xml stale-token leak(s): ${staleTokenMatches.join(" | ")}`,
      ).toBe(0);

      // ── 12) Console / page error guard ─────────────────────────────────
      expect(
        consoleErrors.length,
        `${templateCode}: console/page errors: ${consoleErrors.slice(0, 3).join(" | ")}`,
      ).toBe(0);
    });
  }
});