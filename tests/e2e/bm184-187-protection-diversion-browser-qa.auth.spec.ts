/**
 * Authenticated desktop/mobile QA for the BM-184 through BM-187 frontier.
 * Protection-measure and juvenile-diversion roles remain separate presentation flows.
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let firstPassWithoutThrottleRecovery = 0;
let recovered429Count = 0;
let second429Count = 0;

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
    code: "BM-184",
    sectionTitle: "Đề nghị áp dụng biện pháp bảo vệ",
    description: "Cơ quan gửi đề nghị, người được bảo vệ, lý do và biện pháp bảo vệ",
    requiredText: "Biện pháp bảo vệ đề nghị áp dụng",
  },
  {
    code: "BM-185",
    sectionTitle: "Yêu cầu lập Báo cáo điều tra xã hội bổ sung",
    description: "Căn cứ, người chưa thành niên, người làm công tác xã hội",
    requiredText: "Báo cáo điều tra xã hội bổ sung",
  },
  {
    code: "BM-186",
    sectionTitle: "Thông báo áp dụng thủ tục xử lý chuyển hướng",
    description: "Căn cứ và nội dung thông báo việc áp dụng hoặc không áp dụng",
    requiredText: "Thông báo áp dụng thủ tục xử lý chuyển hướng",
  },
  {
    code: "BM-187",
    sectionTitle: "Yêu cầu xây dựng kế hoạch xử lý chuyển hướng",
    description: "kế hoạch xử lý chuyển hướng hoặc kế hoạch xử lý chuyển hướng bổ sung",
    requiredText: "Người làm công tác xã hội",
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

async function waitForRenderOrRateLimit(page: Page) {
  const rateLimitAlert = page.getByText("ThrottlerException: Too Many Requests", { exact: true });
  const firstControl = page.locator("main [id^='contract-field-']").first();
  return Promise.race([
    rateLimitAlert.waitFor({ state: "visible", timeout: 15_000 }).then(() => "RATE_LIMIT" as const),
    firstControl.waitFor({ state: "visible", timeout: 15_000 }).then(() => "RENDERED" as const),
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
  const retryOutcome = await waitForRenderOrRateLimit(page);
  if (retryOutcome === "RATE_LIMIT") {
    second429Count += 1;
    throw new Error(`Second exact HTTP 429 after bounded recovery for ${code}`);
  }
  await expect(page.getByText("ThrottlerException: Too Many Requests", { exact: true })).toHaveCount(0);
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
  await expect(page.getByText(form.sectionTitle, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.description, { exact: false }).first()).toBeVisible();
  await expect(page.getByText(form.requiredText, { exact: false }).first()).toBeVisible();

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
  test.describe(`BM-184/187 authenticated ${viewport.name} QA`, () => {
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

test("protection roles remain distinct at the BM-184/BM-185 boundary", async ({ page }) => {
  await gotoTemplate(page, "BM-184");
  await expect(page.getByText("Đề nghị áp dụng biện pháp bảo vệ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Yêu cầu lập Báo cáo điều tra xã hội bổ sung", { exact: true })).toHaveCount(0);
  await gotoTemplate(page, "BM-185");
  await expect(page.getByText("Yêu cầu lập Báo cáo điều tra xã hội bổ sung", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Biện pháp bảo vệ đề nghị áp dụng", { exact: false })).toHaveCount(0);
});

test("diversion notification remains distinct from diversion plan request", async ({ page }) => {
  await gotoTemplate(page, "BM-186");
  await expect(page.getByText("Thông báo áp dụng thủ tục xử lý chuyển hướng", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("xây dựng kế hoạch xử lý chuyển hướng", { exact: false })).toHaveCount(0);
  await gotoTemplate(page, "BM-187");
  await expect(page.getByText("Yêu cầu xây dựng kế hoạch xử lý chuyển hướng", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("kế hoạch xử lý chuyển hướng bổ sung", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Thông báo áp dụng thủ tục xử lý chuyển hướng", { exact: true })).toHaveCount(0);
});

test("BM-183 remains the prior frontier boundary before BM-184", async ({ page }) => {
  await gotoTemplate(page, "BM-183");
  await expect(page).toHaveURL(/\/templates\/BM-183$/u);
  await expect(page.getByText("QĐ truy tố theo thủ tục rút gọn", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Đề nghị áp dụng biện pháp bảo vệ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Thông báo áp dụng thủ tục xử lý chuyển hướng", { exact: true })).toHaveCount(0);
});

test.afterAll(() => {
  console.log(JSON.stringify({ firstPassWithoutThrottleRecovery, recovered429Count, second429Count }));
  expect(second429Count).toBe(0);
});
