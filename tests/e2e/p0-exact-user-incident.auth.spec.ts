// P0.1 EXACT USER INCIDENT REPRODUCTION
// Reproduces the user-screenshot failure mode: authenticated sidebar +
// topbar rendered, custom not-found body in the main content area.
// This spec performs the real visible UI click flow and captures URL,
// href, target, and not-found presence at every step.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const NOT_FOUND_HEADING = "Không tìm thấy trang";

type FlowCapture = {
  consoleErrors: string[];
  pageErrors: string[];
  route404s: string[];
};

function attachDiagnostics(page: Page, capture: FlowCapture): void {
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

async function captureBrowserLocation(page: Page) {
  return page.evaluate(() => ({
    href: window.location.href,
    pathname: window.location.pathname,
    title: document.title,
  }));
}

async function captureVisibleHeading(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const heading = document.querySelector("h1, h2, h3, [role='heading']");
    if (!(heading instanceof HTMLElement)) return null;
    return heading.textContent?.trim() ?? null;
  });
}

async function screenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test.describe.configure({ mode: "serial", retries: 0 });

test("P0.1-exact-incident: visible-UI 'Tạo biểu mẫu' click must NOT show custom not-found", async ({ page }, testInfo) => {
  const capture: FlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const sidebarItem = page.getByRole("link", { name: "Tạo biểu mẫu", exact: true });
  await expect(sidebarItem, "Tạo biểu mẫu sidebar link must exist").toBeVisible();
  const sidebarHref = await sidebarItem.first().getAttribute("href");

  const previousLoc = await captureBrowserLocation(page);
  await Promise.all([
    page
      .waitForURL((url) => url.pathname === "/documents", { timeout: 8000 })
      .catch(() => null),
    sidebarItem.first().click(),
  ]);
  const afterLoc = await captureBrowserLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  const shellVisible = await page.getByRole("navigation").first().isVisible();
  const notFoundVisible = await page
    .getByText(NOT_FOUND_HEADING, { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  const reproductionObserved = shellVisible && notFoundVisible;

  await screenshot(page, testInfo, "p0_1-exact-incident-after-sidebar-click");

  console.log("[P0.1 EXACT-INCIDENT FLOW]", {
    sidebarHref,
    previousLoc,
    afterLoc,
    heading,
    notFoundCount,
    shellVisible,
    notFoundVisible,
    reproductionObserved,
    consoleErrors: capture.consoleErrors,
    pageErrors: capture.pageErrors,
    route404s: capture.route404s,
  });

  expect(
    shellVisible && notFoundVisible,
    `Exact-incident detector triggered: shell visible=${shellVisible} notFound visible=${notFoundVisible}. Final URL: ${afterLoc.href}. notFoundCount on page: ${notFoundCount}.`,
  ).toBe(false);
  expect(afterLoc.pathname, "click on 'Tạo biểu mẫu' must navigate to /documents").toBe("/documents");
});

test("P0.1-flow-A: + Tạo mới -> 'Chọn biểu mẫu' from topbar must reach /documents", async ({ page }, testInfo) => {
  const capture: FlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const createButton = page.getByRole("button", { name: /Tạo mới/ }).first();
  await expect(createButton, "Tạo mới button must exist").toBeVisible();
  await createButton.click();

  const menuItem = page.getByRole("menuitem", { name: "Chọn biểu mẫu" }).first();
  await expect(menuItem, "Chọn biểu mẫu menu item must exist").toBeVisible();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/documents", { timeout: 8000 }).catch(() => null),
    menuItem.click(),
  ]);
  const afterLoc = await captureBrowserLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  const notFoundVisible = await page
    .getByText(NOT_FOUND_HEADING, { exact: true })
    .first()
    .isVisible()
    .catch(() => false);

  await screenshot(page, testInfo, "p0_1-flow-A-tao-moi-chon-bieu-mau");

  console.log("[P0.1 FLOW A]", { afterLoc, heading, notFoundVisible, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });

  expect(notFoundVisible, `Flow A reached the custom not-found page. Final URL: ${afterLoc.href}`).toBe(false);
  expect(afterLoc.pathname, "Flow A must navigate to /documents").toBe("/documents");
});

test("P0.1-flow-B: 'Duyệt biểu mẫu' -> click reaches /templates", async ({ page }, testInfo) => {
  const capture: FlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const duyet = page.getByRole("link", { name: "Duyệt biểu mẫu", exact: true });
  await expect(duyet).toBeVisible();
  const duyetHref = await duyet.first().getAttribute("href");
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/templates", { timeout: 8000 }).catch(() => null),
    duyet.first().click(),
  ]);
  const afterLoc = await captureBrowserLocation(page);
  const heading = await captureVisibleHeading(page);
  const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
  const notFoundVisible = await page
    .getByText(NOT_FOUND_HEADING, { exact: true })
    .first()
    .isVisible()
    .catch(() => false);

  await screenshot(page, testInfo, "p0_1-flow-B-duyet-bieu-mau");

  console.log("[P0.1 FLOW B]", { duyetHref, afterLoc, heading, notFoundVisible, notFoundCount, consoleErrors: capture.consoleErrors, pageErrors: capture.pageErrors, route404s: capture.route404s });

  expect(notFoundVisible, `Flow B reached the custom not-found page. Final URL: ${afterLoc.href}`).toBe(false);
  expect(afterLoc.pathname, "Flow B must navigate to /templates").toBe("/templates");
});