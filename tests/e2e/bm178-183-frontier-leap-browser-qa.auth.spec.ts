/**
 * Authenticated desktop/mobile QA for the BM-178 through BM-183 frontier leap.
 * The batch spans special-investigation revocation, compulsory treatment, and
 * expedited-procedure decisions without promoting standalone templates.
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type CompiledContract = {
  templateCode: string;
  title: string;
  source: {
    sections: Array<{ id: string }>;
    fields: Array<{ id: string; key: string; dataSource?: { kind?: string } }>;
  };
};

function loadCompiledContract(code: string): CompiledContract {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "docs/audit/docx/compiled-v2", `${code}.compiled.json`),
      "utf8",
    ),
  ) as CompiledContract;
}

const FORMS = [
  {
    code: "BM-178",
    sectionHeading: "Thông tin quyết định hủy bỏ",
    operative: "hủy bỏ quyết định áp dụng biện pháp điều tra tố tụng đặc biệt",
  },
  {
    code: "BM-179",
    sectionHeading: "Thông tin quyết định áp dụng chữa bệnh",
    operative: "áp dụng biện pháp bắt buộc chữa bệnh",
  },
  {
    code: "BM-180",
    sectionHeading: "Thông tin quyết định đình chỉ chữa bệnh",
    operative: "đình chỉ thi hành biện pháp bắt buộc chữa bệnh",
  },
  {
    code: "BM-181",
    sectionHeading: "Thông tin quyết định áp dụng thủ tục rút gọn",
    operative: "áp dụng thủ tục rút gọn",
  },
  {
    code: "BM-182",
    sectionHeading: "Thông tin quyết định hủy bỏ thủ tục rút gọn",
    operative: "hủy bỏ quyết định áp dụng thủ tục rút gọn",
  },
  {
    code: "BM-183",
    sectionHeading: "Thông tin quyết định truy tố rút gọn",
    operative: "truy tố theo thủ tục rút gọn",
  },
] as const;

const COMPILED_BY_CODE = Object.fromEntries(
  FORMS.map((form) => [form.code, loadCompiledContract(form.code)]),
) as Record<(typeof FORMS)[number]["code"], CompiledContract>;

function collectEvidence(page: Page) {
  const evidence = {
    consoleErrors: [] as string[],
    documentWrites: [] as string[],
    pageErrors: [] as string[],
  };
  page.on("console", (message) => {
    if (message.type() === "error") evidence.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (
      request.url().includes("/api/v1/documents") &&
      DOCUMENT_WRITE_METHODS.has(request.method())
    ) {
      evidence.documentWrites.push(`${request.method()} ${request.url()}`);
    }
  });
  return evidence;
}

function renderableFields(compiled: CompiledContract) {
  return compiled.source.fields.filter(
    (field) => field.dataSource?.kind !== undefined && field.dataSource.kind !== "SYSTEM",
  );
}

async function gotoTemplate(page: Page, code: string) {
  await page.goto(`/templates/${code}`, { waitUntil: "load" });
  const rateLimitAlert = page.getByText("ThrottlerException: Too Many Requests", { exact: true });
  const firstControl = page.locator("main [id^='contract-field-']").first();
  const outcome = await Promise.race([
    rateLimitAlert.waitFor({ state: "visible", timeout: 15_000 }).then(() => "RATE_LIMIT" as const),
    firstControl.waitFor({ state: "visible", timeout: 15_000 }).then(() => "RENDERED" as const),
  ]);
  if (outcome === "RATE_LIMIT") {
    await page.waitForTimeout(65_000);
    await page.reload({ waitUntil: "load" });
    await expect(firstControl).toBeVisible({ timeout: 15_000 });
    await expect(rateLimitAlert).toHaveCount(0);
  }
}

async function runRouteChecks(page: Page, form: (typeof FORMS)[number]) {
  const route = `/templates/${form.code}`;
  const compiled = COMPILED_BY_CODE[form.code];
  const evidence = collectEvidence(page);

  await gotoTemplate(page, form.code);
  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
  expect(page.url()).not.toContain("/documents");
  expect(page.url()).not.toContain("/sign-in");
  await expect(page.getByText(compiled.title, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.sectionHeading, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.operative, { exact: false }).first()).toBeVisible();

  const fields = renderableFields(compiled);
  const controls = fields.map((field) => page.locator(`#contract-field-${field.id}`));
  for (const control of controls) {
    await expect(control).toHaveCount(1);
    await expect(control).toBeEditable();
    expect(["input", "select", "textarea"]).toContain(
      await control.evaluate((element) => element.tagName.toLowerCase()),
    );
  }
  await expect(page.locator("main input, main select, main textarea")).toHaveCount(fields.length);

  const renderedIds = await page
    .locator("main input[id^='contract-field-'], main select[id^='contract-field-'], main textarea[id^='contract-field-']")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(renderedIds).toEqual(fields.map((field) => `contract-field-${field.id}`));

  const bodyText = await page.locator("body").innerText();
  for (const field of compiled.source.fields) expect(bodyText).not.toContain(field.key);
  for (const section of compiled.source.sections) expect(bodyText).not.toContain(section.id);
  expect(bodyText).not.toContain("[GENERATED]");
  expect(bodyText).not.toContain("(mẫu BM-");

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  return evidence;
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const) {
  test.describe(`BM-178/183 authenticated ${viewport.name} QA`, () => {
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

async function assertOperative(page: Page, code: string, text: string) {
  await gotoTemplate(page, code);
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}

test("BM-178 revocation remains distinct from BM-177 extension", async ({ page }) => {
  await assertOperative(page, "BM-178", "hủy bỏ quyết định áp dụng biện pháp điều tra tố tụng đặc biệt");
  await expect(page.getByText("gia hạn thời hạn áp dụng", { exact: false })).toHaveCount(0);
  await assertOperative(page, "BM-177", "gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt");
});

test("BM-179 application remains distinct from BM-180 discontinuation", async ({ page }) => {
  await assertOperative(page, "BM-179", "áp dụng biện pháp bắt buộc chữa bệnh");
  await expect(page.getByText("đình chỉ thi hành biện pháp bắt buộc chữa bệnh", { exact: false })).toHaveCount(0);
  await assertOperative(page, "BM-180", "đình chỉ thi hành biện pháp bắt buộc chữa bệnh");
});

test("BM-181 application, BM-182 revocation, and BM-183 prosecution remain distinct", async ({ page }) => {
  await assertOperative(page, "BM-181", "áp dụng thủ tục rút gọn");
  await assertOperative(page, "BM-182", "hủy bỏ quyết định áp dụng thủ tục rút gọn");
  await assertOperative(page, "BM-183", "truy tố theo thủ tục rút gọn");
});
