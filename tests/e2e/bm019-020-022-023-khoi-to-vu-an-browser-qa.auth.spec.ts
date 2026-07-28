/**
 * Authenticated route and responsive QA for the combined BM-019/BM-020/BM-022/BM-023
 * KHỞI TỐ VỤ ÁN family — investigation-stage prosecution requests and decisions.
 *
 * Family-specific rendered text checks:
 *   - BM-019: YÊU CẦU framing + heading "Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự"
 *     (operative verb "bổ sung" distinguishes from BM-020).
 *   - BM-020: YÊU CẦU framing + heading "Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố"
 *     (operative verb "hủy bỏ" distinguishes from BM-019).
 *   - BM-022: QUYẾT ĐỊNH framing + heading "QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự"
 *     (operative verb "HỦY BỎ QUYẾT ĐỊNH KHÔNG KHỞI TỐ").
 *   - BM-023: QUYẾT ĐỊNH framing + heading "QĐ khởi tố vụ án hình sự"
 *     (operative verb "KHỞI TỐ VỤ ÁN HÌNH SỰ").
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
    `[bm019-020-022-023-khoi-to-vu-an-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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

// Renderable fields are the ones the renderer actually mounts as DOM
// inputs. SYSTEM data sources (e.g. CURRENT_DATE auto-fill) and
// COMPUTED fields (resolved from another field) are intentionally
// excluded from the rendered contract-field-{id} selector scope.
type RawField = CompiledContract["source"]["fields"][number];
function isRenderableField(field: RawField): boolean {
  const kind = field.dataSource?.kind;
  // SYSTEM data sources (e.g. CURRENT_DATE auto-fill) are intentionally
  // skipped by the renderer; everything else (MANUAL, AGENCY, OFFICIAL,
  // COMPUTED) is mounted as an editable input/select/textarea.
  return kind !== undefined && kind !== "SYSTEM";
}

const FORMS = [
  {
    code: "BM-019",
    compiledTitle: "Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự",
    heading: "Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự",
    familyHeading: "YÊU CẦU",
    fieldCount: 17,
    renderableFieldCount: 15,
    sectionCount: 5,
    // Note: "QĐ khởi tố vụ án hình sự" appears as a SUBSTRING of BM-019's
    // own title, so it cannot be used as a forbidden token here.
    forbiddenTokens: [
      "(mẫu BM-019)",
      "Yêu cầu ra QĐ hủy bỏ",
      "QĐ huỷ bỏ QĐ không khởi tố",
      "PHỤC HỒI VỤ ÁN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-020",
    compiledTitle: "Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố",
    heading: "Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố",
    familyHeading: "YÊU CẦU",
    fieldCount: 13,
    renderableFieldCount: 12,
    sectionCount: 4,
    forbiddenTokens: [
      "(mẫu BM-020)",
      "Yêu cầu ra QĐ bổ sung",
      "QĐ huỷ bỏ QĐ không khởi tố",
      "QĐ khởi tố vụ án hình sự",
      "PHỤC HỒI VỤ ÁN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-022",
    compiledTitle: "QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự",
    heading: "QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự",
    familyHeading: "QUYẾT ĐỊNH",
    fieldCount: 4,
    renderableFieldCount: 3,
    sectionCount: 2,
    forbiddenTokens: [
      "(mẫu BM-022)",
      // Family-distinct: BM-022 must not render the sibling QĐ khởi tố
      // heading as a primary heading. Cáo trạng + restoration + summons
      // family phrasings are also forbidden.
      "QĐ khởi tố vụ án hình sự",
      "Yêu cầu ra QĐ",
      "PHỤC HỒI VỤ ÁN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-023",
    compiledTitle: "QĐ khởi tố vụ án hình sự",
    heading: "QĐ khởi tố vụ án hình sự",
    familyHeading: "QUYẾT ĐỊNH",
    fieldCount: 17,
    renderableFieldCount: 16,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-023)",
      "QĐ huỷ bỏ QĐ không khởi tố",
      "Yêu cầu ra QĐ",
      "PHỤC HỒI VỤ ÁN",
      "CÁO TRẠNG",
      "BẢN KÊ VẬT CHỨNG",
      "DANH SÁCH ĐỀ NGHỊ TRIỆU TẬP",
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
  const route = "/templates/" + form.code;

  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
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

test.describe("BM-019/020/022/023 — authenticated desktop QA", () => {
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

test.describe("BM-019/020/022/023 — authenticated mobile QA", () => {
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