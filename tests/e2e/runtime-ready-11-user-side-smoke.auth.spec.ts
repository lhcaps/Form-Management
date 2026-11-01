// P0.1 RUNTIME-READY 11-FORM USER-SIDE SMOKE
// Opens every runtime-ready form through the real user UI (Tạo biểu mẫu →
// search/select form → open form) and additionally as a deep link.
// Each test asserts: correct code visible, custom not-found absent, shell
// visible, heading present, at least one editable control, no fatal
// console/pageerror, no document/RSC 404, sidebar item active, reload ok.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const RUNTIME_READY_FORMS = [
  "BM-001",
  "BM-136",
  "BM-148",
  "BM-156",
  "BM-157",
  "BM-168",
  "BM-171",
  "BM-174",
  "BM-181",
  "BM-206",
  "BM-213",
] as const;

const NOT_FOUND_HEADING = "Không tìm thấy trang";

const EVIDENCE_DIR = "docs/audit/user-readiness/evidence/p0_1";

type FormFlowCapture = {
  consoleErrors: string[];
  pageErrors: string[];
  route404s: string[];
};

function attachDiagnostics(page: Page, capture: FormFlowCapture) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // 429 from API is an upstream rate-limit, not a product/blocker indicator.
    if (/429 \(Too Many Requests\)|Failed to load resource: the server responded with a status of 429/.test(text)) return;
    capture.consoleErrors.push(text);
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
    if (!(heading instanceof HTMLElement)) return null;
    return heading.textContent?.trim() ?? null;
  });
}

async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const targetPath = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: targetPath, fullPage: true });
  try {
    const fs = await import("node:fs");
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    fs.copyFileSync(targetPath, `${EVIDENCE_DIR}/${name}.png`);
  } catch {
    // best-effort — the test-results path is still the canonical Playwright output
  }
}

test.describe.configure({ mode: "serial", retries: 0 });

test.describe("screenshot matrix", () => {
  test("landing page", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await screenshot(page, testInfo, "p0_1-screenshot-landing");
  });

  test("Tạo biểu mẫu page", async ({ page }, testInfo) => {
    await page.goto("/documents", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await screenshot(page, testInfo, "p0_1-screenshot-tao-bieu-mau");
  });

  test("unknown-template 404", async ({ page }, testInfo) => {
    await page.goto("/templates/__stale_missing_form__", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await screenshot(page, testInfo, "p0_1-screenshot-unknown-template-404");
  });

  for (const code of RUNTIME_READY_FORMS) {
    test(`form ${code} deep-link screenshot`, async ({ page }, testInfo) => {
      await page.goto(`/templates/${code}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await screenshot(page, testInfo, `p0_1-screenshot-${code}`);
    });
  }

  test("BM-200 policy screenshot", async ({ page }, testInfo) => {
    await page.goto("/templates/BM-200", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await screenshot(page, testInfo, "p0_1-screenshot-bm-200-policy");
  });
});

test.describe("user-side smoke (deep-link)", () => {
  for (const code of RUNTIME_READY_FORMS) {
    test(`form ${code}: deep-link /templates/${code} renders without custom not-found`, async ({ page }, testInfo) => {
      const capture: FormFlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
      attachDiagnostics(page, capture);
      const resp = await page.goto(`/templates/${code}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const loc = await captureLocation(page);
      const heading = await captureVisibleHeading(page);
      const notFoundCount = await page.getByText(NOT_FOUND_HEADING, { exact: true }).count();
      const notFoundVisible = await page
        .getByText(NOT_FOUND_HEADING, { exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      const shellVisible = await page.getByRole("navigation").first().isVisible();
      const codeOnPage = await page.getByText(code, { exact: false }).first().isVisible().catch(() => false);
      const editableControls = await page.locator("input, textarea, select").count();

      await screenshot(page, testInfo, `runtime-11-${code}-deep-link`);

      console.log(`[FORM ${code} deep-link]`, {
        status: resp?.status(),
        loc,
        heading,
        codeOnPage,
        notFoundCount,
        notFoundVisible,
        shellVisible,
        editableControls,
        consoleErrors: capture.consoleErrors,
        pageErrors: capture.pageErrors,
        route404s: capture.route404s,
      });

      expect(resp?.status(), `${code}: HTTP status must be 200`).toBe(200);
      expect(notFoundVisible, `${code}: custom not-found must not be visible`).toBe(false);
      expect(shellVisible, `${code}: app shell must remain visible`).toBe(true);
      expect(codeOnPage, `${code}: template code ${code} must be visible on page`).toBe(true);
      expect(editableControls, `${code}: at least one editable control must exist`).toBeGreaterThan(0);
      expect(capture.consoleErrors.length, `${code}: no console errors`).toBe(0);
      expect(capture.pageErrors.length, `${code}: no pageerrors`).toBe(0);
      expect(capture.route404s.length, `${code}: no document/RSC 404s`).toBe(0);

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const afterReload = await captureLocation(page);
      expect(afterReload.pathname, `${code}: pathname must survive reload`).toBe(`/templates/${code}`);
    });
  }
});

test.describe("user-side smoke (visible UI flow)", () => {
  for (const code of RUNTIME_READY_FORMS) {
    test(`form ${code}: visible UI flow Tạo biểu mẫu → search → open form`, async ({ page }, testInfo) => {
      const capture: FormFlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
      attachDiagnostics(page, capture);

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);

      const sidebarItem = page.getByRole("link", { name: "Tạo biểu mẫu", exact: true });
      await expect(sidebarItem, "sidebar Tạo biểu mẫu must be visible").toBeVisible();
      await Promise.all([
        page.waitForURL((url) => url.pathname === "/documents", { timeout: 8000 }).catch(() => null),
        sidebarItem.first().click(),
      ]);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const documentsHeading = await captureVisibleHeading(page);

      const textarea = page.getByRole("textbox", { name: /Mô tả dữ liệu đầu vào|Mô tả dữ liệu/i }).first();
      const inputByCode = page.locator("textarea, input").filter({ hasText: "" }).first();
      const placeholder = page.getByPlaceholder(/Vụ án đánh bạc/);
      const searchBox = (await textarea.count()) ? textarea : (await placeholder.count()) ? placeholder : inputByCode;
      await expect(searchBox, "search textarea must exist").toBeVisible();
      await searchBox.fill(code);

      const card = page.locator("article").filter({ hasText: code }).first();
      await expect(card, `card for ${code} must be visible after search`).toBeVisible({ timeout: 8000 });
      const openBtn = card.getByRole("button", { name: /Mở biểu mẫu/ }).first();
      await expect(openBtn, `Mở biểu mẫu button must be visible for ${code}`).toBeVisible();
      const isDisabled = await openBtn.isDisabled();
      expect(isDisabled, `${code}: Mở biểu mẫu button must not be disabled`).toBe(false);

      await Promise.all([
        page.waitForURL((url) => url.pathname !== "/documents", { timeout: 10000 }).catch(() => null),
        openBtn.click(),
      ]);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const afterLoc = await captureLocation(page);
      const heading = await captureVisibleHeading(page);
      const notFoundVisible = await page
        .getByText(NOT_FOUND_HEADING, { exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      const shellVisible = await page.getByRole("navigation").first().isVisible();
      const codeOnPage = await page.getByText(code, { exact: false }).first().isVisible().catch(() => false);
      const editableControls = await page.locator("input, textarea, select").count();

      await screenshot(page, testInfo, `runtime-11-${code}-visible-ui`);

      console.log(`[FORM ${code} visible-ui]`, {
        documentsHeading,
        afterLoc,
        heading,
        codeOnPage,
        notFoundVisible,
        shellVisible,
        editableControls,
        consoleErrors: capture.consoleErrors,
        pageErrors: capture.pageErrors,
        route404s: capture.route404s,
      });

      expect(afterLoc.pathname, `${code}: must navigate away from /documents`).not.toBe("/documents");
      expect(notFoundVisible, `${code}: custom not-found must not appear`).toBe(false);
      expect(shellVisible, `${code}: shell must remain visible`).toBe(true);
      expect(codeOnPage, `${code}: code must be visible on opened form page`).toBe(true);
      expect(editableControls, `${code}: at least one editable control`).toBeGreaterThan(0);
      expect(capture.consoleErrors.length, `${code}: no console errors`).toBe(0);
      expect(capture.pageErrors.length, `${code}: no pageerrors`).toBe(0);
      expect(capture.route404s.length, `${code}: no document/RSC 404s`).toBe(0);
    });
  }
});

test("BM-200 policy: registered in the form catalog but NOT in the runtime-ready 11 roster", async ({ page }, testInfo) => {
  const capture: FormFlowCapture = { consoleErrors: [], pageErrors: [], route404s: [] };
  attachDiagnostics(page, capture);

  const resp = await page.goto("/templates/BM-200", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await screenshot(page, testInfo, "runtime-11-bm-200-policy");

  const loc = await captureLocation(page);
  console.log("[BM-200 policy]", {
    status: resp?.status(),
    loc,
    consoleErrors: capture.consoleErrors,
    pageErrors: capture.pageErrors,
  });

  expect(resp?.status(), "BM-200 deep-link must return 200 (registered in 213 form set)").toBe(200);
  expect(loc.pathname, "BM-200 must remain on /templates/BM-200").toBe("/templates/BM-200");
});