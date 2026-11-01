/**
 * Authenticated desktop/mobile QA for the BM-174 through BM-177 special
 * investigative measure family: request, approval, refusal, and extension.
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
  { code: "BM-174", heading: "Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt", operative: "Nội dung yêu cầu" },
  { code: "BM-175", heading: "QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt", operative: "quyết định phê chuẩn" },
  { code: "BM-176", heading: "QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt", operative: "Lý do không phê chuẩn" },
  { code: "BM-177", heading: "QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt", operative: "quyết định gia hạn" },
] as const;

const COMPILED_BY_CODE = Object.fromEntries(
  FORMS.map((form) => [form.code, loadCompiledContract(form.code)]),
);

function collectEvidence(page: Page) {
  const evidence = { consoleErrors: [] as string[], documentWrites: [] as string[], pageErrors: [] as string[] };
  page.on("console", (message) => {
    if (message.type() === "error") evidence.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/documents") && DOCUMENT_WRITE_METHODS.has(request.method())) {
      evidence.documentWrites.push(`${request.method()} ${request.url()}`);
    }
  });
  return evidence;
}

async function runRouteChecks(page: Page, form: (typeof FORMS)[number]) {
  const route = `/templates/${form.code}`;
  const compiled = COMPILED_BY_CODE[form.code];
  const evidence = collectEvidence(page);
  await page.goto(route, { waitUntil: "load" });
  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
  expect(page.url()).not.toContain("/documents");
  expect(page.url()).not.toContain("/sign-in");
  await expect(page.getByText(form.heading, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Thông tin biểu mẫu", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(form.operative, { exact: false }).first()).toBeVisible();

  const renderableFields = compiled.source.fields.filter(
    (field) => field.dataSource?.kind !== undefined && field.dataSource.kind !== "SYSTEM",
  );
  for (const field of renderableFields) {
    const control = page.locator(`#contract-field-${field.id}`);
    await expect(control).toHaveCount(1);
    await expect(control).toBeEnabled();
    expect(["input", "select", "textarea"]).toContain(
      await control.evaluate((element) => element.tagName.toLowerCase()),
    );
  }
  await expect(page.locator("main input, main select, main textarea")).toHaveCount(renderableFields.length);

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
  test.describe(`BM-174/177 authenticated ${viewport.name} QA`, () => {
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

test("BM-174 through BM-177 retain distinct operative UI wording", async ({ page }) => {
  for (const form of FORMS) {
    await page.goto(`/templates/${form.code}`, { waitUntil: "load" });
    await expect(page.getByText(form.operative, { exact: false }).first()).toBeVisible();
  }
});
