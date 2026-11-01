/**
 * Authenticated route and responsive QA for BM-159 — QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS.
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled renderable
 *     field count (SYSTEM data-source fields are skipped by the renderer).
 *   - Each compiled field must render exactly once and remain editable.
 *   - Each of the five compiled sections must render its curated
 *     description text.
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
    `[bm159-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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

const FORM = {
  code: "BM-159",
  compiledTitle: "QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS",
  heading: "QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS",
  fieldCount: 15,
  renderableFieldCount: 14,
  sectionDescriptions: [
    "Dòng VIỆN KIỂM SÁT, CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
    "Căn cứ Điều 41 và Điều 239 của Bộ luật Tố tụng hình sự",
    "Phân công Viện kiểm sát thực hành quyền công tố, kiểm sát xét xử sơ thẩm",
    "Tòa án có thẩm quyền xét xử và lưu hồ sơ",
    "Mẫu số 159/HS"
  ],
  forbiddenTokens: ["(mẫu BM-159)"],
} as const;

const compiled = loadCompiledContract(FORM.code);

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

async function runRouteChecks(page: Page): Promise<BrowserEvidence> {
  const route = "/templates/" + FORM.code;

  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  await expect(page).toHaveURL(
    new RegExp(`${route.replace(/\//g, "\\/")}$`),
  );
  expect(page.url()).not.toContain("/documents");

  await expect(
    page.locator(`text=${FORM.compiledTitle}`).first(),
  ).toBeVisible();
  await expect(page.locator(`text=${FORM.heading}`).first()).toBeVisible();

  const renderableFieldIds = compiled.source.fields
    .filter(isRenderableField)
    .map((field) => field.id);
  expect(renderableFieldIds.length).toBe(FORM.renderableFieldCount);
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
  for (const snippet of FORM.sectionDescriptions) {
    expect(bodyText).toContain(snippet);
  }
  for (const token of FORM.forbiddenTokens) {
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

test.describe("BM-159 — authenticated desktop QA", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test(`${FORM.code} desktop 1440x900 — route, headings, section descriptions, fields, no errors`, async ({
    page,
  }) => {
    const evidence = await runRouteChecks(page);
    expect(evidence.consoleErrors).toEqual([]);
    expect(evidence.pageErrors).toEqual([]);
    expect(evidence.documentWrites).toEqual([]);
  });
});

test.describe("BM-159 — authenticated mobile QA", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test(`${FORM.code} mobile 390x844 — single-column, no horizontal overflow`, async ({
    page,
  }) => {
    const evidence = await runRouteChecks(page);
    expect(evidence.consoleErrors).toEqual([]);
    expect(evidence.pageErrors).toEqual([]);
    expect(evidence.documentWrites).toEqual([]);
  });
});
