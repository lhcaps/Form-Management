/** Authenticated desktop/mobile QA for the BM-194 through BM-199 semantic frontier. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassNavigations = 0;
let recovered429Count = 0;
let second429Count = 0;

type CompiledContract = {
  title: string;
  source: {
    sections: Array<{ id: string }>;
    fields: Array<{ id: string; key: string; dataSource?: { kind?: string } }>;
  };
};

const FORMS = [
  { code: "BM-194", sectionTitle: "Hủy bỏ quyết định áp dụng xử lý chuyển hướng", description: "tiếp tục giải quyết vụ án hoặc mở lại phiên họp", requiredText: "Viện kiểm sát hủy bỏ quyết định" },
  { code: "BM-195", sectionTitle: "Hủy bỏ quyết định không áp dụng xử lý chuyển hướng", description: "mở lại phiên họp xem xét, quyết định áp dụng", requiredText: "Viện kiểm sát hủy bỏ quyết định" },
  { code: "BM-196", sectionTitle: "Mở phiên họp xem xét xử lý chuyển hướng tại cộng đồng", description: "thời gian, địa điểm và hình thức", requiredText: "Người chưa thành niên được xem xét" },
  { code: "BM-197", sectionTitle: "Biên bản phiên họp xem xét xử lý chuyển hướng", description: "nội dung, diễn biến và quyết định áp dụng hoặc không áp dụng", requiredText: "Quyết định công bố tại phiên họp" },
  { code: "BM-198", sectionTitle: "Hoãn phiên họp xem xét xử lý chuyển hướng", description: "ấn định hoặc thông báo lịch mở lại", requiredText: "Số quyết định hoãn" },
  { code: "BM-199", sectionTitle: "Kiến nghị về quyết định xử lý chuyển hướng của Tòa án", description: "hủy bỏ, sửa đổi hoặc xem xét lại", requiredText: "Nội dung đề nghị xem xét" },
] as const;

function loadCompiledContract(code: string): CompiledContract {
  return JSON.parse(readFileSync(resolve(process.cwd(), "docs/audit/docx/compiled-v2", `${code}.compiled.json`), "utf8")) as CompiledContract;
}

const COMPILED_BY_CODE = Object.fromEntries(FORMS.map((form) => [form.code, loadCompiledContract(form.code)])) as Record<(typeof FORMS)[number]["code"], CompiledContract>;

function collectEvidence(page: Page) {
  const evidence = { consoleErrors: [] as string[], documentWrites: [] as string[], pageErrors: [] as string[] };
  page.on("console", (message) => { if (message.type() === "error") evidence.consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/documents") && DOCUMENT_WRITE_METHODS.has(request.method())) evidence.documentWrites.push(`${request.method()} ${request.url()}`);
  });
  return evidence;
}

const renderableFields = (compiled: CompiledContract) => compiled.source.fields.filter((field) => field.dataSource?.kind !== undefined && field.dataSource.kind !== "SYSTEM");

async function waitForRenderOrRateLimit(page: Page) {
  return Promise.race([
    page.getByText("ThrottlerException: Too Many Requests", { exact: true }).waitFor({ state: "visible", timeout: 15_000 }).then(() => "RATE_LIMIT" as const),
    page.locator("main [id^='contract-field-']").first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "RENDERED" as const),
  ]);
}

async function gotoTemplate(page: Page, code: string) {
  await page.goto(`/templates/${code}`, { waitUntil: "load" });
  const outcome = await waitForRenderOrRateLimit(page);
  if (outcome === "RENDERED") {
    firstPassNavigations += 1;
    return;
  }
  recovered429Count += 1;
  await page.waitForTimeout(65_000);
  await page.reload({ waitUntil: "load" });
  if ((await waitForRenderOrRateLimit(page)) === "RATE_LIMIT") {
    second429Count += 1;
    throw new Error(`Second exact HTTP 429 after bounded recovery for ${code}`);
  }
}

async function runRouteChecks(page: Page, form: (typeof FORMS)[number]) {
  const compiled = COMPILED_BY_CODE[form.code];
  const evidence = collectEvidence(page);
  await gotoTemplate(page, form.code);
  await expect(page).toHaveURL(new RegExp(`/templates/${form.code}$`));
  expect(page.url()).not.toContain("/documents");
  expect(page.url()).not.toContain("/sign-in");
  await expect(page.getByText(compiled.title, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.sectionTitle, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.description, { exact: false }).first()).toBeVisible();
  await expect(page.getByText(form.requiredText, { exact: false }).first()).toBeVisible();

  const fields = renderableFields(compiled);
  for (const field of fields) {
    const control = page.locator(`#contract-field-${field.id}`);
    await expect(control).toHaveCount(1);
    await expect(control).toBeEditable();
  }
  await expect(page.locator("main input, main select, main textarea")).toHaveCount(fields.length);
  const renderedIds = await page.locator("main input[id^='contract-field-'], main select[id^='contract-field-'], main textarea[id^='contract-field-']").evaluateAll((elements) => elements.map((element) => element.id));
  expect(renderedIds).toEqual(fields.map((field) => `contract-field-${field.id}`));

  const bodyText = await page.locator("body").innerText();
  for (const field of compiled.source.fields) expect(bodyText).not.toContain(field.key);
  for (const section of compiled.source.sections) expect(bodyText).not.toContain(section.id);
  expect(bodyText).not.toContain("[GENERATED]");
  expect(bodyText).not.toContain("(mẫu BM-");
  const overflow = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  return evidence;
}

for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }] as const) {
  test.describe(`BM-194/199 authenticated ${viewport.name} QA`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const form of FORMS) {
      test(`${form.code} ${viewport.name} route, semantic fields, and no side effects`, async ({ page }) => {
        const evidence = await runRouteChecks(page, form);
        expect(evidence.consoleErrors).toEqual([]);
        expect(evidence.pageErrors).toEqual([]);
        expect(evidence.documentWrites).toEqual([]);
      });
    }
  });
}

test("application and non-application cancellation outcomes remain distinct", async ({ page }) => {
  await gotoTemplate(page, "BM-194");
  await expect(page.getByText("Hủy bỏ quyết định áp dụng xử lý chuyển hướng", { exact: true })).toBeVisible();
  await expect(page.getByText("mở lại phiên họp xem xét, quyết định áp dụng", { exact: false })).toHaveCount(0);
  await gotoTemplate(page, "BM-195");
  await expect(page.getByText("Hủy bỏ quyết định không áp dụng xử lý chuyển hướng", { exact: true })).toBeVisible();
  await expect(page.getByText("mở lại phiên họp xem xét, quyết định áp dụng", { exact: false })).toBeVisible();
});

test("meeting opening, record, and postponement roles remain distinct", async ({ page }) => {
  await gotoTemplate(page, "BM-196");
  await expect(page.getByText("Mở phiên họp xem xét xử lý chuyển hướng tại cộng đồng", { exact: true })).toBeVisible();
  await expect(page.getByText("Quyết định công bố tại phiên họp", { exact: true })).toHaveCount(0);
  await gotoTemplate(page, "BM-197");
  await expect(page.getByText("Quyết định công bố tại phiên họp", { exact: true })).toBeVisible();
  await expect(page.getByText("Số quyết định hoãn", { exact: true })).toHaveCount(0);
  await gotoTemplate(page, "BM-198");
  await expect(page.getByText("Số quyết định hoãn", { exact: true })).toBeVisible();
  await expect(page.getByText("Quyết định công bố tại phiên họp", { exact: true })).toHaveCount(0);
});

test("BM-193 remains the accepted boundary before BM-194", async ({ page }) => {
  await gotoTemplate(page, "BM-193");
  await expect(page).toHaveURL(/\/templates\/BM-193$/u);
  await expect(page.getByText("Quyết định thay đổi xử lý chuyển hướng tại cộng đồng", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Biện pháp thay thế", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Hủy bỏ quyết định áp dụng xử lý chuyển hướng", { exact: true })).toHaveCount(0);
});

test.afterAll(() => {
  console.log(JSON.stringify({ functionalTests: 15, clerkSetupTests: 2, firstPassNavigations, recovered429Count, second429Count }));
  expect(second429Count).toBe(0);
});
