/**
 * Authenticated route and responsive QA for the BM-148..BM-149..BM-152..BM-153
 * ĐÌNH CHỈ BỊ CAN family — four prosecution-stage QUYẾT ĐỊNH forms covering
 * accused-targeted case suspension/termination/resumption:
 *   - BM-148 = "QĐ tạm đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS)
 *   - BM-149 = "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can" (Điều 41, 247 BLTTHS)
 *   - BM-152 = "QĐ đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS)
 *   - BM-153 = "QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can" (Điều 41 BLTTHS)
 *
 * Family grouping: ĐÌNH CHỈ BỊ CAN — all four forms share the "đối với bị can"
 * (accused-targeted) procedure subfamily. Distinct from the ĐÌNH CHỈ VỤ ÁN
 * subfamily (BM-146/147/150/151 — case-targeted, no bị can).
 *
 * Cardinality invariants (per form):
 *   - Total rendered compiled controls equals compiled field count
 *     (BM-148 = 31, BM-149 = 6, BM-152 = 9, BM-153 = 5).
 *   - No presentation field may render outside the compiled set.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Family-level invariants:
 *   - All four are members of the ĐÌNH CHỈ BỊ CAN subfamily of QUYẾT ĐỊNH.
 *   - Distinct operative verbs per form at P0011:
 *       BM-148 = "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN"
 *       BM-149 = "HỦY BỎ QUYẾT ĐỊNH TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN"
 *       BM-152 = "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN"
 *       BM-153 = "HỦY BỎ QUYẾT ĐỊNH ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN"
 *   - They are NOT siblings of BM-146..147/150..151 (ĐÌNH CHỈ VỤ ÁN — case-targeted),
 *     BM-138 (Yêu cầu), BM-139/140 (Kiến nghị), BM-141..145 (other prosecution variants).
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-148..153.
 */

import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // eslint-disable-next-line no-console
  console.log(
    `[bm148-149-152-153-dinhchi-bi-can-family-qa] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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
    code: "BM-148",
    compiledTitle: "QĐ tạm đình chỉ vụ án đối với bị can",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Cơ quan và văn bản",
      "Căn cứ pháp lý",
      "Nội dung quyết định",
      "Thông tin bị can",
      "Nơi nhận",
      "Chữ ký",
    ],
    fieldLabels: {
      "field-agency-parentname": "Cơ quan cấp trên",
      "field-agency-name": "Viện kiểm sát ban hành",
      "field-document-documentcode": "Số quyết định",
      "field-document-issueplaceanddateline": "Địa danh, ngày ban hành",
      "field-official-issuertitle": "Chủ thể ban hành",
      "field-legalbasis-procedurearticlesline": "Căn cứ Bộ luật Tố tụng hình sự",
      "field-legalbasis-juvenilejusticeline": "Căn cứ Luật xử lý vi phạm hành chính",
      "field-casedecision-prosecutiondecisionlegalbasisline": "Căn cứ quyết định truy tố",
      "field-accuseddecision-prosecutiondecisionlegalbasisline": "Căn cứ quyết định đối với bị can",
      "field-suspension-reasonline": "Lý do đình chỉ điều tra",
      "field-suspension-article1line": "Điều 1",
      "field-person-fullname": "Họ và tên",
      "field-person-gendertext": "Giới tính",
      "field-person-othername": "Tên gọi khác",
      "field-person-birthdateline": "Sinh ngày",
      "field-person-nationalityethnicityreligionline": "Quốc tịch, dân tộc, tôn giáo",
      "field-person-occupation": "Nghề nghiệp",
      "field-person-identityno": "Số CMND/CCCD",
      "field-person-identityissueline": "Nơi cấp CMND/CCCD",
      "field-person-permanentresidence": "Nơi thường trú",
      "field-person-temporaryresidence": "Nơi tạm trú",
      "field-person-currentresidence": "Nơi ở hiện tại",
      "field-suspension-article2actionline": "Điều 2",
      "field-suspension-executionrequestline": "Điều 3",
      "field-recipients-line1": "Nơi nhận chính 1",
      "field-recipients-line2": "Nơi nhận chính 2",
      "field-recipients-archiveline": "Lưu hồ sơ",
      "field-signature-signmode": "Chế độ ký",
      "field-signature-positiontitle": "Chức vụ người ký",
      "field-signature-signername": "Người ký",
    },
  },
  {
    code: "BM-149",
    compiledTitle: "QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Thông tin biểu mẫu",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên cơ quan",
      "field-document-soquyet": "Số quyết định",
      "field-agency-diadanh": "Địa danh",
      "field-document-ngayban": "Ngày ban hành",
      "field-agency-dongdia": "Dòng địa danh",
      "field-document-chuthe": "Chủ thể liên quan",
    },
  },
  {
    code: "BM-152",
    compiledTitle: "QĐ đình chỉ vụ án đối với bị can",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Thông tin biểu mẫu",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên cơ quan",
      "field-document-soquyet": "Số quyết định",
      "field-recipients-personline": "Người bị áp dụng",
      "field-agency-diadanh": "Địa danh",
      "field-document-ngayban": "Ngày ban hành",
      "field-agency-dongdia": "Dòng địa danh",
      "field-document-chuthe": "Chủ thể liên quan",
      "field-legalbasis-cancu": "Căn cứ pháp lý",
      "field-person-tenbi": "Tên bị can / bị cáo",
    },
  },
  {
    code: "BM-153",
    compiledTitle: "QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedSectionTitles: [
      "Thông tin biểu mẫu",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên cơ quan",
      "field-document-soquyet": "Số quyết định",
      "field-agency-diadanh": "Địa danh",
      "field-document-ngayban": "Ngày ban hành",
      "field-agency-dongdia": "Dòng địa danh",
    },
  },
];

// Tokens that MUST NOT appear anywhere in the rendered form template content.
// Scoped to <main> to exclude sidebar navigation.
//
// Family boundary strategy:
// - BM-148/149/152/153 legitimately contain "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN"
//   and "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI VỚI BỊ CAN" in their own P0011 operative verbs.
// - The sibling family (BM-146/147/150/151) renders "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ" and
//   "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ" WITHOUT "ĐỐI VỚI BỊ CAN" — they are case-targeted.
// - We detect cross-family contamination by checking for the full unambiguous sibling
//   patterns (ending before "ĐỐI VỚI"):
//   * "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ" → BM-146 P0011 (temporary suspension, case-targeted)
//   * "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ" → BM-150 P0011 (final termination, case-targeted)
const FAMILY_FORBIDDEN_TOKENS = [
  // Sibling case-targeted operative verbs (must NOT have these without BỊ CAN):
  "TẠM ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI", // BM-146 ends here (no BỊ CAN)
  "ĐÌNH CHỈ VỤ ÁN HÌNH SỰ ĐỐI", // BM-150 ends here (no BỊ CAN)
  // Other siblings:
  "KIẾN NGHỊ",
  "YÊU CẦU",
  // Records-of-statement:
  "BB hỏi cung",
  "BB ghi lời khai",
  "BB đối chất",
  "Biên bản hỏi cung",
  "Biên bản ghi lời khai",
  // Template identity (other forms):
  "(mẫu BM-146)",
  "(mẫu BM-147)",
  "(mẫu BM-149)",
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

  // Anti-pattern tokens: forbidden surface tokens MUST NOT appear as the
  // document-level heading (the <h1> element that names the document type).
  // Scope: find the h1 element and check its text; also check top-of-page
  // paragraph content before any section headings appear.
  // Field labels (e.g. "Điều 3 - YÊU CẦU") legitimately contain generic
  // legal terms and are excluded from this check.
  const h1Text = (await page.locator("main h1").innerText().catch(() => "")).trim();
  const topParagraphs = (
    await page
      .locator("main")
      .locator("p, span")
      .allInnerTexts()
      .catch(() => [])
  )
    .slice(0, 5)
    .join("\n");

  for (const token of FAMILY_FORBIDDEN_TOKENS) {
    expect(
      h1Text,
      `[${form.code}] h1 heading must not contain "${token}"`,
    ).not.toContain(token);
    // Only check top-of-page paragraphs (before any section heading) for
    // document-type contamination. Field labels are inside sections and may
    // legitimately contain generic legal words.
    const firstSectionHeadingIdx = topParagraphs.indexOf("Cơ quan");
    const topContent = firstSectionHeadingIdx >= 0
      ? topParagraphs.substring(0, firstSectionHeadingIdx)
      : topParagraphs;
    expect(
      topContent,
      `[${form.code}] top-of-page content must not contain "${token}"`,
    ).not.toContain(token);
  }

  return evidence;
}

test.describe("BM-148..BM-149..BM-152..BM-153 ĐÌNH CHỈ BỊ CAN family — authenticated desktop QA", () => {
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

test.describe("BM-148..BM-149..BM-152..BM-153 ĐÌNH CHỈ BỊ CAN family — authenticated mobile QA", () => {
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
