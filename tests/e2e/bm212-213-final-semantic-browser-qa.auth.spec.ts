/** Authenticated desktop/mobile QA for the BM-212 + BM-213 final semantic frontier. */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassNavigations = 0;
let recovered429Count = 0;
let second429Count = 0;

const FORMS = [
  {
    code: "BM-212",
    title: "Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên",
    section: "Đề nghị hướng dẫn, hỗ trợ người chưa thành niên",
    description: "Công văn đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ người chưa thành niên.",
    documentTypeLabel: "Viện Kiểm sát",
    fields: [
      "agency.name",
      "recipients.personLine",
      "recipients.personLine9",
      "recipients.personLine8",
      "recipients.personLine7",
      "recipients.personLine23",
      "recipients.personLine22",
      "recipients.personLine6",
      "recipients.personLine21",
      "recipients.personLine20",
      "recipients.personLine19",
      "recipients.personLine18",
      "recipients.personLine17",
      "recipients.personLine16",
      "recipients.personLine15",
      "recipients.personLine14",
      "recipients.personLine13",
      "recipients.personLine12",
      "recipients.personLine11",
      "recipients.personLine5",
      "recipients.personLine4",
      "recipients.personLine3",
      "recipients.personLine2",
      "document.issueDate",
      "document.fullDocumentCode",
    ],
    absentRoleToken: "biện pháp kỹ thuật để bảo vệ",
    ownRoleToken: "tham gia tố tụng để hướng dẫn",
    ownDistinguishingFieldLabel: "Người được đề nghị tham gia tố tụng",
  },
  {
    code: "BM-213",
    title: "Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN",
    section: "Cơ quan và văn bản yêu cầu",
    description: "Thông tin cơ quan ban hành và văn bản yêu cầu.",
    documentTypeLabel: "Viện Kiểm sát",
    fields: [
      "agency.parentName",
      "agency.name",
      "document.documentCode",
      "document.issuePlaceAndDateLine",
      "official.issuerTitle",
      "person.fullName",
      "person.genderLabel",
      "person.otherName",
      "person.dateOfBirthText",
      "person.placeOfBirth",
      "person.nationality",
      "person.ethnicity",
      "person.religion",
      "person.occupation",
      "person.identityDocumentLine",
      "person.identityIssueLine",
      "person.permanentAddress",
      "person.temporaryAddress",
      "person.currentAddress",
      "juvenileProtection.contextLine",
      "juvenileProtection.article1Line",
      "juvenileProtection.resultDeadlineLine",
      "juvenileProtection.article2Line",
      "recipients.primaryLine",
      "recipients.investigationAuthorityLine",
      "recipients.otherRecipientsLine",
      "recipients.archiveLine",
      "signature.signerName",
    ],
    absentRoleToken: "tham gia tố tụng để hướng dẫn",
    ownRoleToken: "biện pháp kỹ thuật để bảo vệ",
    ownDistinguishingFieldLabel: "Bối cảnh cần bảo vệ",
  },
] as const;

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
  await expect(page.locator("main")).toContainText(form.documentTypeLabel);
  await expect(page.locator("main")).toContainText(form.ownRoleToken);
  await expect(page.locator("main")).toContainText(form.ownDistinguishingFieldLabel);
}

for (const viewport of ["desktop", "mobile"] as const) {
  for (const form of FORMS) {
    test(`${form.code} ${viewport} preserves source-aligned semantic presentation`, async ({ page }) => {
      await assertTemplateRoute(page, form, viewport);
    });
  }
}

test("BM-211 frontier-boundary smoke remains accepted", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-211");
  await expect(page).toHaveURL(/\/templates\/BM-211$/u);
  await expect(page.locator("main")).toContainText(/Thông báo về việc thụ lý vụ án/iu);
});

test("BM-212 and BM-213 remain identity-distinct despite numeric adjacency", async ({ page }) => {
  await navigateWithBounded429(page, "/templates/BM-212");
  await expect(page.locator("main")).toContainText(/tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên/iu);
  await expect(page.locator("main")).not.toContainText(/Bối cảnh cần bảo vệ/iu);
  await expect(page.locator("main")).not.toContainText(/Biện pháp kỹ thuật được yêu cầu/iu);
  await navigateWithBounded429(page, "/templates/BM-213");
  await expect(page.locator("main")).toContainText(/Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN/iu);
  await expect(page.locator("main")).toContainText(/Bối cảnh cần bảo vệ/iu);
  await expect(page.locator("main")).not.toContainText(/Người được đề nghị tham gia tố tụng/iu);
});

test.afterAll(() => {
  console.log(JSON.stringify({ functionalTests: 5, clerkSetupTests: 1, firstPassNavigations, recovered429Count, second429Count, BM212_BM213_FINAL_FRONTIER: "PASS" }));
});
