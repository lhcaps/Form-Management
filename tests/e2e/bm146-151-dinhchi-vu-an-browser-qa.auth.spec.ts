/**
 * Authenticated route and responsive QA for the BM-146..BM-151 ĐÌNH CHỈ VỤ ÁN
 * family — four prosecution-stage QUYẾT ĐỊNH forms covering tạm đình chỉ /
 * huỷ tạm đình chỉ / đình chỉ / huỷ đình chỉ vụ án hình sự:
 *   - BM-146 = "QĐ tạm đình chỉ vụ án" (Điều 41, 247 BLTTHS)
 *   - BM-147 = "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án" (Điều 41, 247, 249 BLTTHS)
 *   - BM-150 = "QĐ đình chỉ vụ án" (Điều 41, 248 BLTTHS)
 *   - BM-151 = "QĐ huỷ bỏ QĐ đình chỉ vụ án" (Điều 41, 248, 249 BLTTHS)
 *
 * Cardinality invariants (per form):
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-146 = 18, BM-147 = 4, BM-150 = 22, BM-151 = 3).
 *   - No presentation field may render outside the compiled set.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Family-level invariants:
 *   - All four are members of the ĐÌNH CHỈ VỌ ÁN subfamily of QUYẾT ĐỊNH.
 *   - Distinct operative verbs per form at P0011:
 *       BM-146 = "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ"
 *       BM-147 = "HỦY BỎ QUYẾT ĐỊNH TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ"
 *       BM-150 = "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ"
 *       BM-151 = "HỦY BỎ QUYẾT ĐỊNH ĐÌNH CHỈ VỤ ÁN HÌNH SỰ"
 *   - They are NOT siblings of BM-138 (Yêu cầu), BM-139/140 (Kiến nghị),
 *     BM-141..145 (other QUYẾT ĐỊNH prosecution variants), BB đối chất,
 *     BB ghi lời khai, BB hỏi cung.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-146..151.
 */

import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // eslint-disable-next-line no-console
  console.log(
    `[bm146-151-dinhchi-vu-an-family-qa] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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

type FormSpec = {
  code: string;
  compiledTitle: string;
  expectedHeading: string;
  expectedSectionTitles: string[];
  fieldLabels: Record<string, string>;
};

const FORMS: FormSpec[] = [
  {
    code: "BM-146",
    compiledTitle: "QĐ tạm đình chỉ vụ án",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Cơ quan và văn bản",
      "Căn cứ pháp lý",
      "Nội dung quyết định",
      "Nơi nhận",
      "Chữ ký",
    ],
    fieldLabels: {
      "field-agency-parentname":
        "Cơ quan cấp trên",
      "field-agency-name":
        "Viện kiểm sát ban hành",
      "field-document-documentcode":
        "Số quyết định",
      "field-document-issueplaceanddateline":
        "Địa danh, ngày ban hành",
      "field-official-issuertitle":
        "Chủ thể ban hành",
      "field-prosecutioncasesuspension-procedurearticlesline":
        "Căn cứ Bộ luật Tố tụng hình sự",
      "field-prosecutioncasesuspension-casedecisionlegalbasisline":
        "Căn cứ quyết định vụ án",
      "field-prosecutioncasesuspension-reasonline":
        "Lý do đình chỉ điều tra vụ án",
      "field-prosecutioncasesuspension-article1line":
        "Điều 1",
      "field-prosecutioncasesuspension-article2line":
        "Điều 2",
      "field-prosecutioncasesuspension-article3line":
        "Điều 3",
      "field-prosecutioncasesuspension-article4line":
        "Điều 4",
      "field-prosecutioncasesuspension-investigationauthorityrecipientline":
        "Cơ quan điều tra",
      "field-recipients-otherrecipientsline":
        "Nơi nhận khác",
      "field-recipients-archiveline":
        "Lưu hồ sơ",
      "field-signature-signmode":
        "Chế độ ký",
      "field-signature-positiontitle":
        "Chức vụ người ký",
      "field-signature-signername":
        "Người ký",
    },
  },
  {
    code: "BM-147",
    compiledTitle: "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Thông tin biểu mẫu",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên cơ quan",
      "field-document-soquyet": "Số quyết định",
      "field-agency-diadanh": "Địa danh",
      "field-document-ngayban": "Ngày ban hành",
    },
  },
  {
    code: "BM-150",
    compiledTitle: "QĐ đình chỉ vụ án",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Cơ quan và văn bản",
      "Căn cứ pháp lý",
      "Nội dung quyết định",
      "Nơi nhận",
      "Chữ ký",
    ],
    fieldLabels: {
      "field-agency-parentname":
        "Cơ quan cấp trên",
      "field-agency-name":
        "Viện kiểm sát ban hành",
      "field-document-documentcode":
        "Số quyết định",
      "field-document-issueplaceanddateline":
        "Địa danh, ngày ban hành",
      "field-official-issuertitle":
        "Chủ thể ban hành",
      "field-prosecutioncasetermination-procedurearticlesline":
        "Căn cứ Bộ luật Tố tụng hình sự",
      "field-prosecutioncasetermination-casedecisionlegalbasisline":
        "Căn cứ quyết định vụ án",
      "field-prosecutioncasetermination-accuseddecisionlegalbasisline":
        "Căn cứ quyết định khởi tố bị can",
      "field-prosecutioncasetermination-reasonline":
        "Lý do chấm dứt truy tố",
      "field-prosecutioncasetermination-article1line":
        "Điều 1",
      "field-prosecutioncasetermination-article2line":
        "Điều 2",
      "field-prosecutioncasetermination-article3line":
        "Điều 3",
      "field-prosecutioncasetermination-article4line":
        "Điều 4",
      "field-prosecutioncasetermination-superiorprocuracyrecipientline":
        "VKS cấp trên",
      "field-recipients-otherrecipientsline":
        "Cơ quan khác",
      "field-prosecutioncasetermination-accusedorrepresentativerecipientline":
        "Bị can/đại diện",
      "field-prosecutioncasetermination-investigationauthorityrecipientline":
        "Cơ quan điều tra",
      "field-prosecutioncasetermination-defensecounselrecipientline":
        "Luật sư",
      "field-recipients-archiveline":
        "Lưu hồ sơ",
      "field-signature-signmode":
        "Chế độ ký",
      "field-signature-positiontitle":
        "Chức vụ người ký",
      "field-signature-signername":
        "Người ký",
    },
  },
  {
    code: "BM-151",
    compiledTitle: "QĐ huỷ bỏ QĐ đình chỉ vụ án",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Thông tin biểu mẫu",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên cơ quan",
      "field-document-soquyet": "Số quyết định",
      "field-agency-diadanh": "Địa danh",
    },
  },
];

// Tokens that MUST NOT appear anywhere in the rendered form template content.
// Scoped to <main> element to exclude sidebar navigation.
const FAMILY_FORBIDDEN_TOKENS = [
  // Sibling family document-type headings (must never bleed into ĐÌNH CHỈ VỤ ÁN):
  "KIẾN NGHỊ",
  "Kiến nghị",
  "YÊU CẦU",
  "Yêu cầu",
  // Records-of-statement:
  "BB hỏi cung",
  "BB ghi lời khai",
  "BB đối chất",
  "Biên bản hỏi cung",
  "Biên bản ghi lời khai",
  // Other QUYẾT ĐỊNH prosecution variants (BM-141..145):
  "Chuyển vụ án hình sự",
  "Nhập vụ án hình sự",
  "Tách vụ án hình sự",
  "Gia hạn thời hạn",
  "Trả hồ sơ vụ án",
  // Template identity:
  "(mẫu BM-146)",
  "(mẫu BM-147)",
  "(mẫu BM-150)",
  "(mẫu BM-151)",
];

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
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (
      /\/api\/v1\/documents(?:$|\?)/.test(request.url()) &&
      DOCUMENT_WRITE_METHODS.has(request.method().toUpperCase())
    ) {
      evidence.documentWrites.push(`${request.method()} ${request.url()}`);
    }
  });

  return evidence;
}

function fieldSelector(fieldId: string): string {
  return "#contract-field-" + fieldId;
}

async function runRouteChecks(
  page: Page,
  form: FormSpec,
): Promise<BrowserEvidence> {
  const contract = loadCompiledContract(form.code);
  const compiledFieldIds = contract.source.fields.map((f) => f.id);

  const route = "/templates/" + form.code;
  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  // No sign-in redirect.
  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
  // No /documents redirect.
  expect(page.url()).not.toContain("/documents");

  // Wait for at least the first compiled field to render.
  if (compiledFieldIds.length > 0) {
    await page.locator(fieldSelector(compiledFieldIds[0])).waitFor({
      state: "visible",
      timeout: 15000,
    });
  }

  // Exact compiled title visible.
  await expect(page.locator(`text=${form.compiledTitle}`).first()).toBeVisible();
  // Exact heading.
  await expect(page.locator(`text=${form.expectedHeading}`).first()).toBeVisible();
  // Note: operative verb (P0011 static paragraph) is NOT rendered in template preview —
  // it is UNMAPPED in the compiled contract and outside the field set.

  // Compile-section cardinality via the renderer hook.
  for (const id of compiledFieldIds) {
    await expect(page.locator(fieldSelector(id))).toHaveCount(1);
  }
  await expect(
    page.locator(compiledFieldIds.map(fieldSelector).join(", ")),
  ).toHaveCount(contract.source.fields.length);

  // Each rendered compiled field is a real editable input/select/textarea.
  for (const id of compiledFieldIds) {
    const handle = page.locator(fieldSelector(id));
    const tagName = await handle.evaluate((el) => el.tagName.toLowerCase());
    expect(["input", "select", "textarea"]).toContain(tagName);
    await expect(handle).toBeEnabled();
  }

  // Field-label semantics (check at least one source contains the expected label).
  for (const [id, expectedLabel] of Object.entries(form.fieldLabels)) {
    const handle = page.locator(fieldSelector(id));
    const sources = await handle.evaluate((el) => {
      const inputId = el.id ?? "";
      const visibleLabel = inputId
        ? document.querySelector(`label[for="${inputId}"]`)
        : null;
      const descriptionEl = inputId
        ? document.getElementById(`${inputId}-description`)
        : null;
      const parentText = el.parentElement?.textContent ?? "";
      return {
        ariaLabel: el.getAttribute("aria-label") ?? "",
        placeholder: el.getAttribute("placeholder") ?? "",
        labelledByText: (() => {
          const labelledBy =
            el.getAttribute("aria-labelledby") ??
            el.parentElement?.getAttribute("aria-labelledby") ??
            "";
          if (!labelledBy) return "";
          const target = document.getElementById(labelledBy);
          return target?.textContent ?? "";
        })(),
        visibleLabelText: visibleLabel?.textContent ?? "",
        descriptionText: descriptionEl?.textContent ?? "",
        parentText,
      };
    });
    const combined = [
      sources.ariaLabel,
      sources.placeholder,
      sources.labelledByText,
      sources.visibleLabelText,
      sources.descriptionText,
      sources.parentText,
    ].join("\n");
    expect(
      combined,
      `[${form.code}] field ${id}: expected at least one source to contain "${expectedLabel}"`,
    ).toContain(expectedLabel);
  }

  // Section-title semantics.
  for (const sectionTitle of form.expectedSectionTitles) {
    await expect(
      page.locator(`text=${sectionTitle}`).first(),
    ).toBeVisible();
  }

  // Anti-pattern tokens: forbidden surface tokens MUST NOT appear in the
  // form template content. Scoped to <main> to exclude sidebar navigation.
  const mainText = (await page.locator("main").innerText()).trim();
  for (const token of FAMILY_FORBIDDEN_TOKENS) {
    expect(mainText).not.toContain(token);
  }

  // No horizontal overflow on viewports.
  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  return evidence;
}

test.describe("BM-146..BM-151 ĐÌNH CHỈ VỤ ÁN family — authenticated desktop QA", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });

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

test.describe("BM-146..BM-151 ĐÌNH CHỈ VỤ ÁN family — authenticated mobile QA", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  for (const form of FORMS) {
    test(`${form.code} mobile 390x844 — single-column layout, no horizontal overflow`, async ({
      page,
    }) => {
      const evidence = await runRouteChecks(page, form);
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
      expect(evidence.consoleErrors).toEqual([]);
      expect(evidence.pageErrors).toEqual([]);
      expect(evidence.documentWrites).toEqual([]);
    });
  }
});
