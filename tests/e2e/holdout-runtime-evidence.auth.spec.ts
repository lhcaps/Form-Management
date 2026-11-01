import PizZip from "pizzip";
import { expect, test, type Page } from "@playwright/test";

const HOLDOUT_CODES = [
  "BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
  "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200",
] as const;

const SESSION_ID_RE = /^runtime_preview_[a-f0-9-]{36}$/;
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3001/api/v1";

type RuntimeSession = {
  persisted?: unknown;
  sessionId?: unknown;
  docxDownloadUrl?: unknown;
  pdfPreviewUrl?: unknown;
};

async function downloadWithClerkToken(
  page: Page,
  url: string,
) {
  return page.evaluate(async ({ targetUrl }) => {
    const clerk = window as typeof window & {
      Clerk?: { session?: { getToken?: () => Promise<string | null> } };
    };
    const token = (await clerk.Clerk?.session?.getToken?.()) ?? null;
    const response = await fetch(targetUrl, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const buffer = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let index = 0; index < buffer.length; index += 0x8000) {
      binary += String.fromCharCode(...buffer.slice(index, index + 0x8000));
    }
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      firstBytes: Array.from(buffer.slice(0, 4)),
      bytes: buffer.length,
      base64: btoa(binary),
      bearerPresent: Boolean(token),
    };
  }, { targetUrl: url });
}

test.describe("12 holdout forms — authenticated runtime evidence", () => {
  for (const templateCode of HOLDOUT_CODES) {
    test(`${templateCode} creates non-persisted DOCX and PDF runtime exports`, async ({ page }) => {
      await page.goto(`/templates/${templateCode}`);
      await expect(page).not.toHaveURL(/sign-in|sign-up|\/documents\//, {
        timeout: 20_000,
      });
      await expect(page.getByText(new RegExp(templateCode, "i")).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator("input, textarea, select").first()).toBeVisible({
        timeout: 20_000,
      });

      const demoButton = page.getByRole("button", { name: /Dữ liệu demo/i }).first();
      await expect(demoButton).toBeEnabled({ timeout: 10_000 });
      await demoButton.click();
      await expect
        .poll(async () => page.locator("input, textarea, select").evaluateAll(
          (fields) => fields.some((field) => String((field as HTMLInputElement).value ?? "").trim().length > 0),
        ))
        .toBe(true);

      const previewResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/forms/runtime/${templateCode}/preview-session`) &&
          response.request().method() === "POST",
        { timeout: 30_000 },
      );
      const previewButton = page.getByRole("button", { name: /Xem trước bản in/i }).first();
      await expect(previewButton).toBeEnabled({ timeout: 10_000 });
      await previewButton.click();

      const response = await previewResponse;
      expect(response.status(), `${templateCode}: preview-session response`).toBeGreaterThanOrEqual(200);
      expect(response.status(), `${templateCode}: preview-session response`).toBeLessThan(300);
      expect(response.headers()["content-type"] ?? "").toContain("application/json");
      const session = (await response.json()) as RuntimeSession;
      expect(session.persisted, `${templateCode}: standalone must not persist`).toBe(false);
      expect(String(session.sessionId ?? "")).toMatch(SESSION_ID_RE);
      expect(String(session.docxDownloadUrl ?? "")).toContain("/preview-sessions/");
      expect(String(session.pdfPreviewUrl ?? ""), `${templateCode}: PDF export URL missing`).toContain("/pdf");
      expect(page.url(), `${templateCode}: standalone route leaked`).not.toMatch(/\/documents\//);

      const apiOrigin = new URL(API_BASE_URL).origin;
      const docx = await downloadWithClerkToken(
        page,
        new URL(String(session.docxDownloadUrl), apiOrigin).toString(),
      );
      expect(docx.bearerPresent, `${templateCode}: Clerk token missing`).toBe(true);
      expect(docx.status, `${templateCode}: DOCX status`).toBe(200);
      expect(docx.firstBytes.slice(0, 2), `${templateCode}: DOCX magic`).toEqual([0x50, 0x4b]);
      expect(docx.bytes, `${templateCode}: DOCX too small`).toBeGreaterThan(5 * 1024);
      const docxZip = new PizZip(Buffer.from(docx.base64, "base64"));
      expect(Object.keys(docxZip.files)).toContain("[Content_Types].xml");
      expect(Object.keys(docxZip.files)).toContain("word/document.xml");

      const pdf = await downloadWithClerkToken(
        page,
        new URL(String(session.pdfPreviewUrl), apiOrigin).toString(),
      );
      expect(pdf.bearerPresent, `${templateCode}: Clerk token missing for PDF`).toBe(true);
      expect(pdf.status, `${templateCode}: PDF status`).toBe(200);
      expect(pdf.firstBytes, `${templateCode}: PDF magic`).toEqual([0x25, 0x50, 0x44, 0x46]);
      expect(pdf.bytes, `${templateCode}: PDF too small`).toBeGreaterThan(1024);
      expect(pdf.contentType.toLowerCase(), `${templateCode}: PDF content type`).toContain("application/pdf");
    });
  }
});
