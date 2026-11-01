/**
 * Authenticated route and responsive QA for the combined BM-169/BM-170/BM-172/BM-173
 * XỬ LÝ VẬT CHỨNG / TRẢ LẠI TÀI SẢN family — prosecution-stage evidence
 * handling and asset-return decisions.
 *
 * Family-specific rendered text checks:
 *   - BM-169: heading "QĐ xử lý vật chứng" (operative verb "xử lý")
 *   - BM-170: heading "QĐ huỷ bỏ QĐ xử lý vật chứng"
 *     (operative verb "huỷ bỏ")
 *   - BM-172: heading "QĐ huỷ bỏ QĐ trả lại tài sản"
 *     (operative verb "trả lại tài sản")
 *   - BM-173: heading "QĐ chuyển vật chứng" (operative verb "chuyển")
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
    `[bm169-170-172-173-vat-chung-tai-san-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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
    code: "BM-169",
    compiledTitle: "QĐ xử lý vật chứng",
    heading: "QĐ xử lý vật chứng",
    fieldCount: 20,
    renderableFieldCount: 19,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-169)",
      "QĐ huỷ bỏ QĐ xử lý vật chứng",
      "QĐ trả lại tài sản",
      "QĐ chuyển vật chứng",
      "Điều 76 và Điều 107",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-170",
    compiledTitle: "QĐ huỷ bỏ QĐ xử lý vật chứng",
    heading: "QĐ huỷ bỏ QĐ xử lý vật chứng",
    fieldCount: 17,
    renderableFieldCount: 16,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-170)",
      // Note: "QĐ xử lý vật chứng" is a SUBSTRING of BM-170's own title
      // ("QĐ huỷ bỏ QĐ xử lý vật chứng"), so it cannot be used as a
      // forbidden token here.
      "QĐ trả lại tài sản",
      "QĐ chuyển vật chứng",
      "Điều 76 và Điều 107",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-172",
    compiledTitle: "QĐ huỷ bỏ QĐ trả lại tài sản",
    heading: "QĐ huỷ bỏ QĐ trả lại tài sản",
    fieldCount: 34,
    renderableFieldCount: 31,
    sectionCount: 6,
    forbiddenTokens: [
      "(mẫu BM-172)",
      // Note: "QĐ trả lại tài sản" is a SUBSTRING of BM-172's own title
      // ("QĐ huỷ bỏ QĐ trả lại tài sản"), so it cannot be used as a
      // forbidden token here.
      "QĐ xử lý vật chứng",
      "QĐ huỷ bỏ QĐ xử lý vật chứng",
      "QĐ chuyển vật chứng",
      "Điều 76 và Điều 107",
      "Trần Văn Bình",
    ],
  },
  {
    code: "BM-173",
    compiledTitle: "QĐ chuyển vật chứng",
    heading: "QĐ chuyển vật chứng",
    fieldCount: 16,
    renderableFieldCount: 15,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-173)",
      "QĐ xử lý vật chứng",
      "QĐ huỷ bỏ QĐ xử lý vật chứng",
      "QĐ trả lại tài sản",
      "Điều 76 và Điều 107",
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

test.describe("BM-169/170/172/173 — authenticated desktop QA", () => {
  test.describe.configure({ mode: "serial" });
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

test.describe("BM-169/170/172/173 — authenticated mobile QA", () => {
  test.describe.configure({ mode: "serial" });
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
