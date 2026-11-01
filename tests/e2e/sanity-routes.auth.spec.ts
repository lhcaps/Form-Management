// P0.1 SANITY: directly navigate to /documents and /templates via page.goto
// to confirm whether routes resolve and what content they render.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const NOT_FOUND_HEADING = "Không tìm thấy trang";

function attachDiagnostics(page: Page, capture: { consoleErrors: string[]; pageErrors: string[]; route404s: string[]; }) {
  page.on("console", (message) => {
    if (message.type() === "error") capture.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => capture.pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() !== 404) return;
    const request = response.request();
    const headers = request.headers();
    const isRouteRequest =
      request.resourceType() === "document" ||
      headers.rsc === "1" ||
      response.url().includes("_rsc=");
    if (isRouteRequest) capture.route404s.push(`${request.method()} ${response.url()}`);
  });
}

async function captureLocation(page: Page) {
  return page.evaluate(() => ({
    href: window.location.href,
    pathname: window.location.pathname,
    title: document.title,
  }));
}

async function captureVisibleHeading(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const heading = document.querySelector("h1, h2, h3, [role='heading']");
    return heading instanceof HTMLElement ? heading.textContent?.trim() ?? null : null;
  });
}

test.describe.configure({ mode: "serial", retries: 0 });

test("sanity: navigate to / via root", async ({ page }, testInfo) => {
  const capture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);
  const resp = await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const loc = await captureLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath("sanity-root.png"), fullPage: true });
  console.log("[SANITY /]", { status: resp?.status(), loc, heading, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });
  expect(resp?.status()).toBe(200);
});

test("sanity: navigate to /documents via root", async ({ page }, testInfo) => {
  const capture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);
  const resp = await page.goto("/documents", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const loc = await captureLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath("sanity-documents.png"), fullPage: true });
  console.log("[SANITY /documents]", { status: resp?.status(), loc, heading, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });
});

test("sanity: navigate to /templates via root", async ({ page }, testInfo) => {
  const capture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);
  const resp = await page.goto("/templates", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const loc = await captureLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath("sanity-templates.png"), fullPage: true });
  console.log("[SANITY /templates]", { status: resp?.status(), loc, heading, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });
});

test("sanity: navigate to /templates/BM-001 (deep link)", async ({ page }, testInfo) => {
  const capture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);
  const resp = await page.goto("/templates/BM-001", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const loc = await captureLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath("sanity-templates-BM-001.png"), fullPage: true });
  console.log("[SANITY /templates/BM-001]", { status: resp?.status(), loc, heading, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });
});

test("sanity: navigate to /templates/__stale_missing_form__", async ({ page }, testInfo) => {
  const capture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);
  const resp = await page.goto("/templates/__stale_missing_form__", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const loc = await captureLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath("sanity-templates-unknown.png"), fullPage: true });
  console.log("[SANITY /templates/__stale_missing_form__]", { status: resp?.status(), loc, heading, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });
});