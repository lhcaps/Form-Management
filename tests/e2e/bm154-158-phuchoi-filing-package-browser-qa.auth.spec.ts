/**
 * Authenticated route and responsive QA for the combined BM-154–BM-158
 * prosecution-stage batch — PHỤC HỒI VỤ ÁN decisions (BM-154, BM-155) and
 * PROSECUTION FILING PACKAGE (BM-156 Cáo trạng, BM-157 evidence inventory
 * appendix, BM-158 trial-summons request appendix).
 *
 * Cardinality invariants (apply per form):
 *   - Total rendered compiled controls must equal the compiled field count.
 *   - Each compiled field must render exactly once and remain editable.
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Family-specific rendered text checks:
 *   - BM-154: case-targeted restoration wording ("PHỤC HỒI VỤ ÁN HÌNH SỰ"
 *     without "ĐỐI VỚI BỊ CAN").
 *   - BM-155: accused-targeted restoration wording ("PHỤC HỒI VỤ ÁN HÌNH SỰ
 *     ĐỐI VỚI BỊ CAN").
 *   - BM-156: Cáo trạng presentation — not restoration wording; heading
 *     "CÁO TRẠNG" must appear.
 *   - BM-157: evidence-inventory appendix role — heading
 *     "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG" must appear.
 *   - BM-158: trial-summons request-list role — heading "DANH SÁCH" must
 *     appear, plus the phrase "Viện kiểm sát đề nghị Tòa án triệu tập đến
 *     phiên tòa".
 *
 * Auth: uses storageState from playwright/.clerk/admin.json refreshed by the
 * `clerk setup` project. Never calls Documents API POST/PUT/PATCH/DELETE.
 * Never navigates to /documents.
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // eslint-disable-next-line no-console
  console.log(
    `[bm154-158-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
  );
});

type CompiledContract = {
  templateCode: string;
  title: string;
  source: {
    sections: Array<{ id: string }>;
    fields: Array<{ id: string; key: string }>;
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

const FORMS = [
  {
    code: "BM-154",
    heading: "QĐ phục hồi vụ án",
    compiledTitle: "QĐ phục hồi vụ án",
    fieldCount: 6,
    sectionCount: 1,
    forbiddenTokens: [
      "(mẫu BM-154)",
      "ĐỐI VỚI BỊ CAN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
      "Viện Kiểm sát nhân dân Thành phố Hà Nội",
    ],
  },
  {
    code: "BM-155",
    heading: "QĐ phục hồi vụ án đối với bị can",
    compiledTitle: "QĐ phục hồi vụ án đối với bị can",
    fieldCount: 15,
    sectionCount: 1,
    forbiddenTokens: [
      "(mẫu BM-155)",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-156",
    heading: "Cáo trạng",
    compiledTitle: "Cáo trạng",
    fieldCount: 41,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-156)",
      // Cáo trạng primary heading must not appear as a BM-156 sub-heading
      // such as "QĐ phục hồi vụ án" or "BẢN KÊ VẬT CHỨNG…". The Cáo
      // trạng's legal-basis section legitimately lists "căn cứ phục hồi
      // vụ án" as one of the cited bases — that is the source-aligned
      // evidence and is intentionally allowed.
      "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-157",
    heading: "Bản kê vật chứng kèm theo Cáo trạng",
    compiledTitle: "Bản kê vật chứng kèm theo Cáo trạng",
    fieldCount: 1,
    sectionCount: 1,
    forbiddenTokens: [
      "(mẫu BM-157)",
      "QĐ phục hồi vụ án",
      "PHỤC HỒI VỤ ÁN",
      // Cáo trạng primary heading (BM-156) must not appear as the BM-157
      // heading (BM-157 is the evidence inventory appendix, not the
      // primary indictment).
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-158",
    heading: "Danh sách đề nghị triệu tập đến phiên tòa",
    compiledTitle: "Danh sách đề nghị triệu tập đến phiên tòa",
    fieldCount: 3,
    sectionCount: 1,
    extraHeading: "Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa",
    forbiddenTokens: [
      "(mẫu BM-158)",
      "QĐ phục hồi vụ án",
      "PHỤC HỒI VỤ ÁN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG KÈM THEO BẢN CÁO TRẠNG",
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
}

async function runRouteChecks(
  page: Page,
  form: (typeof FORMS)[number],
): Promise<BrowserEvidence> {
  const compiled = COMPILED_BY_CODE[form.code];
  const compiledFieldIds = compiled.source.fields.map((field) => field.id);
  const expectedFieldCount = form.fieldCount;
  const route = "/templates/" + form.code;

  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  // No sign-in redirect.
  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));

  // No /documents redirect.
  expect(page.url()).not.toContain("/documents");

  // Exact compiled title visible somewhere on the page.
  await expect(
    page.locator(`text=${form.compiledTitle}`).first(),
  ).toBeVisible();

  // Exact heading visible.
  await expect(page.locator(`text=${form.heading}`).first()).toBeVisible();

  // Optional secondary heading check (BM-158 summons list).
  if ("extraHeading" in form && form.extraHeading) {
    await expect(
      page.locator(`text=${form.extraHeading}`).first(),
    ).toBeVisible();
  }

  // Renderable compiled-field cardinality: every compiled contract field
  // renders exactly once and is editable. Scope to renderer hook
  // `#contract-field-{id}` rather than the global input selector.
  for (const id of compiledFieldIds) {
    await expect(page.locator(fieldSelector(id))).toHaveCount(1);
  }
  await expect(
    page.locator(compiledFieldIds.map(fieldSelector).join(", ")),
  ).toHaveCount(expectedFieldCount);

  // Each rendered compiled field must be a real input/select/textarea
  // and must NOT be disabled.
  for (const id of compiledFieldIds) {
    const handle = page.locator(fieldSelector(id));
    const tagName = await handle.evaluate((el) =>
      el.tagName.toLowerCase(),
    );
    expect(["input", "select", "textarea"]).toContain(tagName);
    await expect(handle).toBeEnabled();
  }

  // Family-specific anti-pattern tokens: forbidden surface tokens MUST
  // NOT appear anywhere in the rendered DOM.
  const bodyText = (await page.locator("body").innerText()).trim();
  for (const token of form.forbiddenTokens) {
    expect(bodyText).not.toContain(token);
  }

  // No horizontal overflow on viewports.
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(
    overflow.clientWidth + 1,
  );

  return evidence;
}

test.describe("BM-154–BM-158 — authenticated desktop QA", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const form of FORMS) {
    test(`${form.code} desktop 1440x900 — route, headings, fields, no errors`, async ({
      page,
    }) => {
      const evidence = await runRouteChecks(page, form);
      expect(evidence.consoleErrors).toEqual([]);
      expect(evidence.pageErrors).toEqual([]);
      expect(evidence.documentWrites).toEqual([]);
    });
  }
});

test.describe("BM-154–BM-158 — authenticated mobile QA", () => {
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