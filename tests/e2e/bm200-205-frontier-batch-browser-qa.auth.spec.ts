/** Authenticated desktop/mobile QA for the BM-200 through BM-205 semantic frontier. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassNavigations = 0;
let recovered429Count = 0;
let second429Count = 0;

const FORMS = [
  { code: "BM-200", section: "Tiếp nhận khiếu nại hoặc kiến nghị", description: "xử lý chuyển hướng tại cộng đồng", fields: ["agency.name", "document.fullDocumentCode"], special: true },
  { code: "BM-201", section: "Giải quyết khiếu nại hoặc kiến nghị", description: "hủy bỏ hoặc giữ nguyên", fields: ["agency.name", "recipients.personLine", "recipients.personLine14", "recipients.personLine13", "recipients.personLine12", "document.issueDate", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "document.fullDocumentCode"] },
  { code: "BM-202", section: "Đình chỉ giải quyết khiếu nại hoặc kiến nghị", description: "đình chỉ", fields: ["agency.name", "decision.decisionLine", "document.issueDate", "document.fullDocumentCode"] },
  { code: "BM-203", section: "Thông báo về hoạt động tố tụng", description: "thời gian, địa điểm", fields: ["agency.name", "recipients.personLine", "recipients.personLine5", "recipients.personLine4", "recipients.personLine15", "recipients.personLine3", "recipients.personLine2", "document.issuePlace", "document.issueDate", "case.caseNumber2", "case.caseNumber", "recipients.personLine14", "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "document.fullDocumentCode"] },
  { code: "BM-204", section: "Người đại diện hoặc tổ chức tham gia tố tụng", description: "cá nhân đại diện hoặc người đại diện của tổ chức", fields: ["agency.name", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "case.caseNumber", "document.issueDate", "document.fullDocumentCode"] },
  { code: "BM-205", section: "Áp dụng biện pháp ngăn chặn đối với người chưa thành niên", description: "biện pháp ngăn chặn", fields: ["agency.name", "recipients.personLine", "recipients.personLine14", "recipients.personLine13", "document.fullDocumentCode", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2"] },
];

const readCompiled = (code: string) => JSON.parse(readFileSync(resolve(process.cwd(), `docs/audit/docx/compiled-v2/${code}.compiled.json`), "utf8")) as {
  title: string;
  source: { fields: Array<{ id: string; key: string }>; sections: Array<{ id: string }> };
};

function fieldLocator(page: Page, compiled: ReturnType<typeof readCompiled>, fieldKey: string) {
  const field = compiled.source.fields.find((candidate) => candidate.key === fieldKey);
  if (!field) throw new Error(`Compiled field ${fieldKey} is missing from the contract`);
  return page.locator(`main #contract-field-${field.id}`);
}

async function navigateWithBounded429(page: Page, url: string) {
  let retried = false;
  for (;;) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    if (response?.status() !== 429) {
      if (!response?.ok()) throw new Error(`Navigation failed with HTTP ${response?.status() ?? "no response"}`);
      firstPassNavigations += 1;
      return;
    }
    if (retried) {
      second429Count += 1;
      throw new Error(`Second HTTP 429 for ${url}`);
    }
    retried = true;
    recovered429Count += 1;
    await page.waitForTimeout(750);
  }
}

async function assertTemplateRoute(page: Page, form: (typeof FORMS)[number], viewport: "desktop" | "mobile") {
  const compiled = readCompiled(form.code);
  const documentWrites: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    if (DOCUMENT_WRITE_METHODS.has(request.method()) && /\/documents(?:\/|$)/u.test(request.url())) documentWrites.push(`${request.method()} ${request.url()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await navigateWithBounded429(page, `/templates/${form.code}`);
  await expect(page).toHaveURL(new RegExp(`/templates/${form.code}$`));
  await expect(page).not.toHaveURL(/\/documents|\/sign-in/u);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1")).toContainText(compiled.title);
  await expect(page.locator("main")).toContainText(form.section);
  await expect(page.locator("main")).toContainText(form.description);

  const controls = page.locator("main input, main textarea, main select");
  await expect(controls).toHaveCount(compiled.source.fields.length);
  for (let index = 0; index < await controls.count(); index += 1) {
    await expect(controls.nth(index)).toHaveAttribute("id", /contract-field-.+/u);
  }
  for (const field of form.fields) await expect(fieldLocator(page, compiled, field)).toHaveCount(1);
  for (const field of form.fields) {
    const control = fieldLocator(page, compiled, field);
    await control.fill(`QA ${form.code} ${field}`);
  }
  await expect(page.locator("main")).not.toContainText(/section-[a-z-]+|\[GENERATED\]|Field \d+|personLine\d*/u);
  const body = await page.locator("body").boundingBox();
  const main = await page.locator("main").boundingBox();
  expect(body && main && main.x + main.width).toBeLessThanOrEqual((await page.evaluate(() => document.documentElement.clientWidth)) + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth) + 1);
  expect(pageErrors, `${form.code} ${viewport} page errors`).toEqual([]);
  expect(consoleErrors, `${form.code} ${viewport} console errors`).toEqual([]);
  expect(documentWrites, `${form.code} ${viewport} document writes`).toEqual([]);
  if (form.special) {
    await expect(page.locator("main")).toContainText(/Tiếp nhận khiếu nại|kiến nghị/u);
    await expect(page).not.toHaveURL(/\/documents/u);
  }
}

for (const viewport of ["desktop", "mobile"] as const) {
  for (const form of FORMS) {
    test(`${form.code} ${viewport} preserves source-aligned semantic presentation`, async ({ page }) => {
      await assertTemplateRoute(page, form, viewport);
    });
  }
}

test("BM-199 remains the accepted frontier boundary role", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-199");
  await expect(page).toHaveURL(/\/templates\/BM-199$/u);
  await expect(page.locator("main")).toContainText(/kiến nghị|Tòa án/u);
  await expect(page.locator("main")).not.toContainText(/biện pháp ngăn chặn|giám sát điện tử/u);
});

test("selected scopes remain semantically distinct in the browser", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-203");
  await expect(page.locator("main")).toContainText(/hoạt động tố tụng/u);
  await navigateWithBounded429(page, "/templates/BM-204");
  await expect(page.locator("main")).toContainText(/cá nhân đại diện hoặc người đại diện của tổ chức/u);
  await navigateWithBounded429(page, "/templates/BM-205");
  await expect(page.locator("main")).toContainText(/biện pháp ngăn chặn/u);
});

test.afterAll(() => {
  console.log(JSON.stringify({ functionalTests: 14, clerkSetupTests: 2, firstPassNavigations, recovered429Count, second429Count }));
});
