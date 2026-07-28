/**
 * Authenticated route and responsive QA for the combined
 * BM-160/BM-165/BM-167 THÔNG BÁO TỐ TỤNG family — procedural
 * notices/records issued by Viện kiểm sát during giai đoạn truy tố.
 *
 * Family-specific rendered text checks:
 *   - BM-160: heading "Biên bản niêm yết công khai văn bản tố tụng"
 *     (Biên bản, Điều 140 BLTTHS)
 *   - BM-165: heading "Thông báo về việc vụ án có bị can bị tạm giam"
 *     (Thông báo, Điều 42 và Điều 244 BLTTHS)
 *   - BM-167: heading "Thông báo về việc trả hồ sơ, ban hành cáo trạng"
 *     (Thông báo, Điều 42 và khoản 2 Điều 240 BLTTHS)
 *
 * Auth: uses storageState from playwright/.clerk/admin.json refreshed by
 * the `clerk setup` project. Never calls Documents API POST/PUT/PATCH/DELETE.
 * Never navigates to /documents.
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // eslint-disable-next-line no-console
  console.log(
    `[bm160-165-167-thongbao-truyto-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
  );
});

type CompiledContract = {
  templateCode: string;
  title: string;
  source: {
    sections: Array<{ id: string }>;
    fields: Array<{ id: string; key: string; dataSource?: { kind?: string } }>;
  };
};

function loadCompiledContract(code: string): CompiledContract {
  const path = resolve(
    process.cwd(),
    "docs/audit/docx/compiled-v2",
    `${code}.compiled.json`,
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

// Renderable fields: SYSTEM data sources are intentionally skipped by the
// renderer; everything else (MANUAL, AGENCY, OFFICIAL, COMPUTED) is mounted
// as an editable input/select/textarea.
type RawField = CompiledContract["source"]["fields"][number];
function isRenderableField(field: RawField): boolean {
  const kind = field.dataSource?.kind;
  return kind !== undefined && kind !== "SYSTEM";
}

const FORMS = [
  {
    code: "BM-160",
    compiledTitle: "Biên bản niêm yết công khai văn bản tố tụng",
    heading: "Biên bản niêm yết công khai văn bản tố tụng",
    fieldCount: 2,
    renderableFieldCount: 2,
    sectionCount: 1,
    sectionDescriptions: [
      "Tên Viện kiểm sát lập biên bản và số biên bản niêm yết công khai văn bản tố tụng, căn cứ Điều 140 Bộ luật Tố tụng hình sự (bổ sung Điều 243 nếu niêm yết Cáo trạng).",
    ],
    forbiddenTokens: [
      "(mẫu BM-160)",
      "Thông báo về việc vụ án có bị can bị tạm giam",
      "Thông báo về việc trả hồ sơ, ban hành cáo trạng",
      "Tran Van Binh",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-165",
    compiledTitle: "Thông báo về việc vụ án có bị can bị tạm giam",
    heading: "Thông báo về việc vụ án có bị can bị tạm giam",
    fieldCount: 2,
    renderableFieldCount: 2,
    sectionCount: 1,
    sectionDescriptions: [
      "Tên Viện kiểm sát và số thông báo gửi Tòa án về việc vụ án có bị can bị tạm giam, căn cứ Điều 42 và Điều 244 Bộ luật Tố tụng hình sự.",
    ],
    forbiddenTokens: [
      "(mẫu BM-165)",
      "Biên bản niêm yết công khai văn bản tố tụng",
      "Thông báo về việc trả hồ sơ, ban hành cáo trạng",
      "Tran Van Binh",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-167",
    compiledTitle: "Thông báo về việc trả hồ sơ, ban hành cáo trạng",
    heading: "Thông báo về việc trả hồ sơ, ban hành cáo trạng",
    fieldCount: 2,
    renderableFieldCount: 2,
    sectionCount: 2,
    sectionDescriptions: [
      "Tên Viện kiểm sát ban hành thông báo, căn cứ Điều 42 và khoản 2 Điều 240 Bộ luật Tố tụng hình sự, Điều 2 Luật Tư pháp người chưa thành niên.",
      "Số văn bản thông báo về việc trả hồ sơ, ban hành cáo trạng.",
    ],
    forbiddenTokens: [
      "(mẫu BM-167)",
      "Biên bản niêm yết công khai văn bản tố tụng",
      "Thông báo về việc vụ án có bị can bị tạm giam",
      "Tran Van Binh",
      "Trần Văn Bình",
    ],
  },
] as const;

const COMPILED_BY_CODE = Object.fromEntries(
  FORMS.map((form) => [form.code, loadCompiledContract(form.code)]),
);

function fieldSelector(fieldId: string): string {
  return "#contract-field-" + fieldId;
}

type BrowserEvidence = {
  consoleErrors: string[];
  documentWrites: string[];
  pageErrors: string[];
};

function collectBrowserEvidence(page: Page): BrowserEvidence {
  const evidence: BrowserEvidence = {
    consoleErrors: [],
    documentWrites: [],
    pageErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error")
      evidence.consoleErrors.push(message.text());
  });
  page.on("pageerror", (err) => {
    evidence.pageErrors.push(err.message);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/v1/documents") || url.includes("/documents")) {
      if (DOCUMENT_WRITE_METHODS.has(request.method())) {
        evidence.documentWrites.push(`${request.method()} ${url}`);
      }
    }
  });

  return evidence;
}﻿
async function runRouteChecks(
  page: Page,
  form: (typeof FORMS)[number],
): Promise<BrowserEvidence> {
  const compiled = COMPILED_BY_CODE[form.code];
  const route = "/templates/" + form.code;

  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  await expect(page).toHaveURL(
    new RegExp(`${route.replace(/\//g, "\\/")}$`),
  );
  expect(page.url()).not.toContain("/documents");

  await expect(
    page.locator(`text=${form.compiledTitle}`).first(),
  ).toBeVisible();
  await expect(page.locator(`text=${form.heading}`).first()).toBeVisible();

  // Renderable compiled-field cardinality: every MANUAL/AGENCY/OFFICIAL
  // compiled contract field renders exactly once and is editable.
  const renderableFieldIds = compiled.source.fields
    .filter(isRenderableField)
    .map((field) => field.id);
  expect(renderableFieldIds.length).toBe(form.renderableFieldCount);
  for (const id of renderableFieldIds) {
    await expect(page.locator(fieldSelector(id))).toHaveCount(1);
  }
  await expect(
    page.locator(renderableFieldIds.map(fieldSelector).join(", ")),
  ).toHaveCount(renderableFieldIds.length);

  for (const id of renderableFieldIds) {
    const handle = page.locator(fieldSelector(id));
    const tagName = await handle.evaluate((el) =>
      el.tagName.toLowerCase(),
    );
    expect(["input", "select", "textarea"]).toContain(tagName);
    await expect(handle).toBeEnabled();
  }

  const bodyText = (await page.locator("body").innerText()).trim();
  for (const snippet of form.sectionDescriptions) {
    expect(bodyText).toContain(snippet);
  }
  for (const token of form.forbiddenTokens) {
    expect(bodyText).not.toContain(token);
  }

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(
    overflow.clientWidth + 1,
  );

  return evidence;
}

test.describe("BM-160/165/167 — authenticated desktop QA", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const form of FORMS) {
    test(`${form.code} desktop 1440x900 — route, headings, section descriptions, fields, no errors`, async ({
      page,
    }) => {
      const evidence = await runRouteChecks(page, form);
      expect(evidence.consoleErrors).toEqual([]);
      expect(evidence.pageErrors).toEqual([]);
      expect(evidence.documentWrites).toEqual([]);
    });
  }
});

test.describe("BM-160/165/167 — authenticated mobile QA", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const form of FORMS) {
    test(`${form.code} mobile 390x844 — single-column, no horizontal overflow`, async ({
      page,
    }) => {
      const evidence = await runRouteChecks(page, form);
      expect(evidence.consoleErrors).toEqual([]);
      expect(evidence.pageErrors).toEqual([]);
      expect(evidence.documentWrites).toEqual([]);
    });
  }
});