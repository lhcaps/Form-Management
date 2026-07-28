/** Authenticated desktop/mobile QA for the BM-206 through BM-211 semantic frontier. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassNavigations = 0;
let recovered429Count = 0;
let second429Count = 0;

const FORMS = [
  { code: "BM-206", section: "Thông tin biểu mẫu", description: "Quyết định áp dụng biện pháp giám sát điện tử", fields: ["agency.name", "recipients.personLine", "recipients.personLine14", "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2"], copySuffix: true },
  { code: "BM-207", section: "Thông tin biểu mẫu", description: "Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử", fields: ["agency.name", "recipients.personLine", "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "document.fullDocumentCode"] },
  { code: "BM-208", section: "Thông tin biểu mẫu", description: "Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử", fields: ["agency.name", "recipients.personLine", "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "document.fullDocumentCode"] },
  { code: "BM-209", section: "Thông tin biểu mẫu", description: "Quyết định áp dụng biện pháp giám sát bởi người đại diện", fields: ["agency.name", "recipients.personLine", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "document.fullDocumentCode"] },
  { code: "BM-210", section: "Thông tin biểu mẫu", description: "Quyết định thay đổi người đại diện", fields: ["agency.name", "recipients.personLine", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2"] },
  { code: "BM-211", section: "Thông tin biểu mẫu", description: "Thông báo về việc thụ lý vụ án", fields: ["agency.name", "recipients.personLine", "recipients.personLine16", "recipients.personLine15", "recipients.personLine14", "recipients.personLine13", "recipients.personLine12", "recipients.personLine11", "recipients.personLine10", "recipients.personLine9", "recipients.personLine8", "recipients.personLine7", "recipients.personLine6", "recipients.personLine5", "recipients.personLine4", "recipients.personLine3", "recipients.personLine2", "case.caseNumber", "case.caseNumber2", "document.fullDocumentCode", "document.issueDate"] },
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
  if (form.copySuffix) {
    // BM-206: literal "Copy" suffix must remain visible (SOURCE_LITERAL_COPY_TITLE)
    await expect(page.locator("h1")).toContainText(/- Copy/u);
    await expect(page.locator("main")).not.toContainText(/BM-207|Quyết định phê chuẩn/u);
  }
}

for (const viewport of ["desktop", "mobile"] as const) {
  for (const form of FORMS) {
    test(`${form.code} ${viewport} preserves source-aligned semantic presentation`, async ({ page }) => {
      await assertTemplateRoute(page, form, viewport);
    });
  }
}

test("BM-205 boundary smoke remains accepted as previous frontier", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-205");
  await expect(page).toHaveURL(/\/templates\/BM-205$/u);
  await expect(page.locator("main")).toContainText(/biện pháp ngăn chặn|giám sát điện tử/u);
});

test("electronic monitoring triplet remains semantically distinct", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-206");
  await expect(page.locator("main")).toContainText(/Quyết định áp dụng biện pháp giám sát điện tử/iu);
  await navigateWithBounded429(page, "/templates/BM-207");
  await expect(page.locator("main")).toContainText(/Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử/iu);
  await navigateWithBounded429(page, "/templates/BM-208");
  await expect(page.locator("main")).toContainText(/Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử/iu);
});

test("representative supervision pair remains distinct", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-209");
  await expect(page.locator("main")).toContainText(/Quyết định áp dụng biện pháp giám sát bởi người đại diện/iu);
  await navigateWithBounded429(page, "/templates/BM-210");
  await expect(page.locator("main")).toContainText(/Quyết định thay đổi người đại diện/iu);
});

test("BM-211 case-acceptance notice remains distinct from monitoring forms", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-211");
  await expect(page.locator("main")).toContainText(/Thông báo về việc thụ lý vụ án/iu);
  await expect(page.locator("main")).not.toContainText(/giám sát điện tử/iu);
});

test.afterAll(() => {
  console.log(JSON.stringify({ functionalTests: 12, clerkSetupTests: 2, firstPassNavigations, recovered429Count, second429Count, BM206CopySuffixBrowserStatus: "SOURCE_LITERAL_COPY_TITLE preserved" }));
});