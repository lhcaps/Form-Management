/** Authenticated desktop/mobile QA for BM-188 through BM-193 semantic frontier. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassWithoutThrottleRecovery = 0;
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
  { code: "BM-188", sectionTitle: "Đề nghị giải quyết bồi thường thiệt hại", description: "bồi thường thiệt hại và tịch thu tài sản", requiredText: "Tòa án có thẩm quyền" },
  { code: "BM-189", sectionTitle: "Yêu cầu thực hiện thủ tục đề nghị giáo dưỡng", description: "cơ quan điều tra làm thủ tục đề nghị Tòa án", requiredText: "Cơ quan điều tra được yêu cầu" },
  { code: "BM-190", sectionTitle: "Đề nghị Tòa án áp dụng biện pháp giáo dưỡng", description: "Đề nghị trực tiếp Tòa án", requiredText: "Tòa án có thẩm quyền" },
  { code: "BM-191", sectionTitle: "Quyết định áp dụng xử lý chuyển hướng tại cộng đồng", description: "trách nhiệm thi hành quyết định áp dụng", requiredText: "Biện pháp xử lý chuyển hướng" },
  { code: "BM-192", sectionTitle: "Quyết định không áp dụng xử lý chuyển hướng tại cộng đồng", description: "tiếp tục giải quyết vụ án", requiredText: "Lý do và căn cứ không áp dụng" },
  { code: "BM-193", sectionTitle: "Quyết định thay đổi xử lý chuyển hướng tại cộng đồng", description: "biện pháp đang áp dụng, biện pháp thay thế", requiredText: "Biện pháp thay thế" },
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
    firstPassWithoutThrottleRecovery += 1;
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
  test.describe(`BM-188/193 authenticated ${viewport.name} QA`, () => {
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

test("BM-189 intermediary request remains distinct from BM-190 direct Court proposal", async ({ page }) => {
  await gotoTemplate(page, "BM-189");
  await expect(page.getByText("Cơ quan điều tra được yêu cầu", { exact: true })).toBeVisible();
  await expect(page.getByText("Đề nghị trực tiếp Tòa án", { exact: false })).toHaveCount(0);
  await gotoTemplate(page, "BM-190");
  await expect(page.getByText("Đề nghị trực tiếp Tòa án", { exact: false })).toBeVisible();
  await expect(page.getByText("Cơ quan điều tra được yêu cầu", { exact: true })).toHaveCount(0);
});

test("community diversion application, refusal, and change outcomes remain distinct", async ({ page }) => {
  await gotoTemplate(page, "BM-191");
  await expect(page.getByText("Biện pháp xử lý chuyển hướng", { exact: true })).toBeVisible();
  await expect(page.getByText("Biện pháp thay thế", { exact: true })).toHaveCount(0);
  await gotoTemplate(page, "BM-192");
  await expect(page.getByText("Lý do và căn cứ không áp dụng", { exact: true })).toBeVisible();
  await expect(page.getByText("Biện pháp thay thế", { exact: true })).toHaveCount(0);
  await gotoTemplate(page, "BM-193");
  await expect(page.getByText("Biện pháp đang áp dụng", { exact: true })).toBeVisible();
  await expect(page.getByText("Biện pháp thay thế", { exact: true })).toBeVisible();
});

test("BM-187 remains the accepted boundary before BM-188", async ({ page }) => {
  await gotoTemplate(page, "BM-187");
  await expect(page).toHaveURL(/\/templates\/BM-187$/u);
  await expect(page.getByText("Yêu cầu xây dựng kế hoạch xử lý chuyển hướng", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("kế hoạch xử lý chuyển hướng bổ sung", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Đề nghị giải quyết bồi thường thiệt hại", { exact: true })).toHaveCount(0);
});

test.afterAll(() => {
  console.log(JSON.stringify({ firstPassWithoutThrottleRecovery, recovered429Count, second429Count }));
  expect(second429Count).toBe(0);
});
