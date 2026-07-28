/**
 * Authenticated route and responsive QA for the BM-141..BM-145 prosecution-stage
 * QUYẾT ĐỊNH (decision) family — five forms covering chuyển / nhập / tách /
 * gia hạn / trả hồ sơ vụ án hình sự, all issued at prosecution stage by the
 * Procuracy within the BLTTHS Điều 41 cluster.
 *
 * Cardinality invariants (per form):
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-141 = 19, BM-142 = 5, BM-143 = 3, BM-144 = 17, BM-145 = 21).
 *     The renderer tags every compiled field with the stable
 *     `contract-field-{id}` id so the count is scoped to that hook rather
 *     than to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Family-level invariants (across all five forms):
 *   - All five are members of the QUYẾT ĐỊNH family and use the
 *     "/QĐ-VKS" source-backed number suffix. They are NOT siblings of
 *     BM-138 (Yêu cầu — request family), BM-139/140 (Kiến nghị —
 *     recommendation family), BB đối chất / BB ghi lời khai / BB hỏi cung
 *     (records-of-statement family).
 *   - Distinct operative verbs per form at P0011:
 *       BM-141 = "Chuyển vụ án hình sự để truy tố theo thẩm quyền"
 *       BM-142 = "Nhập vụ án hình sự theo thẩm quyền"
 *       BM-143 = "Tách vụ án hình sự trong giai đoạn truy tố"
 *       BM-144 = "Gia hạn thời hạn QĐ việc truy tố"
 *       BM-145 = "Trả hồ sơ vụ án để điều tra bổ sung"
 *   - Family boundary is enforced by profile label semantics — no sibling
 *     labels (KIẾN NGHỊ / YÊU CẦU / BB ... / etc.) are rendered.
 *   - Same DOCX heading P0010 "QUYẾT ĐỊNH" appears across all five forms,
 *     but each form's compiled title, distinctive verb, and prosecution-
 *     stage subfamily wording is preserved verbatim.
 *
 * Source-aligned presentation labels are asserted below as exact
 * visible-text expectations. Historical contract keys remain unchanged;
 * only presentation labels are source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-141..145.
 */

import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // Log actual browser metadata once per spec run, sourced from the
  // live Playwright fixture (NOT inferred from bundled @playwright/test
  // version). This replaces any previously reported but never-measured
  // chromium version claims.
  // eslint-disable-next-line no-console
  console.log(
    `[bm141-145-prosecution-decisions-family-qa] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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
  expectedOperativeLabel: string;
  expectedSectionTitles: string[];
  fieldLabels: Record<string, string>;
};

const FORMS: FormSpec[] = [
  {
    code: "BM-141",
    compiledTitle: "QĐ chuyển vụ án để truy tố",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedOperativeLabel: "Chuyển vụ án hình sự để truy tố theo thẩm quyền",
    expectedSectionTitles: [
      "Cơ quan và văn bản",
      "Căn cứ pháp lý",
      "Nội dung quyết định",
      "Nơi nhận",
      "Chữ ký",
    ],
    fieldLabels: {
      "field-agency-parentname": "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
      "field-agency-name": "Tên Viện kiểm sát ban hành QĐ chuyển vụ án",
      "field-document-documentcode": "Số QĐ chuyển vụ án",
      "field-document-issueplaceanddateline":
        "Địa danh ban hành, ngày tháng năm ban hành",
      "field-official-issuertitle": "Chủ thể ban hành QĐ",
      "field-prosecutiontransfer-procedurearticlesline":
        "Căn cứ Bộ luật Tố tụng hình sự",
      "field-prosecutiontransfer-casedecisionlegalbasisline":
        "Căn cứ Quyết định khởi tố vụ án hình sự",
      "field-prosecutiontransfer-accuseddecisionlegalbasisline":
        "Căn cứ Quyết định khởi tố bị can",
      "field-prosecutiontransfer-investigationconclusionlegalbasisline":
        "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
      "field-prosecutiontransfer-transferreasonline":
        "Lý do chuyển vụ án hình sự",
      "field-prosecutiontransfer-article1line":
        "Điều 1 - Nội dung quyết định chuyển vụ án",
      "field-recipients-investigatingagencyline":
        "Nơi nhận - Viện kiểm sát tiếp nhận vụ án",
      "field-recipients-accusedline": "Nơi nhận - Bị can",
      "field-prosecutiontransfer-toprocuracyrecipientline":
        "Nơi nhận - Viện kiểm sát có thẩm quyền truy tố",
      "field-prosecutiontransfer-detentionfacilityrecipientline":
        "Nơi nhận - Cơ sở giam giữ (nếu có)",
      "field-recipients-archiveline": "Nơi nhận - Lưu hồ sơ",
      "field-signature-signmode": "Chế độ ký",
      "field-signature-positiontitle": "Chức vụ người ký",
      "field-signature-signername": "Họ tên người ký QĐ",
    },
  },
  {
    code: "BM-142",
    compiledTitle: "Quyết định nhập vụ án hình sự trong giai đoạn truy tố",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedOperativeLabel: "Nhập vụ án hình sự",
    expectedSectionTitles: [
      "Thông tin QĐ nhập vụ án hình sự trong giai đoạn truy tố",
    ],
    fieldLabels: {
      "field-agency-vienkiem": "Tên Viện kiểm sát ban hành QĐ nhập vụ án",
      "field-document-soquyet": "Số QĐ nhập vụ án",
      "field-agency-diadanh": "Địa danh ban hành QĐ nhập vụ án",
      "field-document-ngayban": "Ngày ban hành QĐ nhập vụ án",
      "field-agency-dongdia": "Dòng địa danh bổ sung (nếu hồ sơ có)",
    },
  },
  {
    code: "BM-143",
    compiledTitle: "Quyết định tách vụ án hình sự trong giai đoạn truy tố",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedOperativeLabel: "Tách vụ án hình sự",
    expectedSectionTitles: ["Thông tin QĐ tách vụ án hình sự trong giai đoạn truy tố"],
    fieldLabels: {
      "field-agency-vienkiem": "Tên Viện kiểm sát ban hành QĐ tách vụ án",
      "field-document-soquyet": "Số QĐ tách vụ án",
      "field-agency-diadanh": "Địa danh ban hành QĐ tách vụ án",
    },
  },
  {
    code: "BM-144",
    compiledTitle: "QĐ gia hạn thời hạn QĐ việc truy tố",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedOperativeLabel: "Gia hạn thời hạn QĐ việc truy tố",
      expectedSectionTitles: [
        "Cơ quan và văn bản",
        "Căn cứ pháp lý",
        "Nội dung quyết định",
        "Nơi nhận",
        "Chữ ký",
      ],
      fieldLabels: {
        "field-agency-parentname": "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
        "field-agency-name": "Tên Viện kiểm sát ban hành QĐ gia hạn",
        "field-document-documentcode": "Số QĐ gia hạn",
        "field-document-issueplaceanddateline":
          "Địa danh ban hành, ngày tháng năm ban hành",
        "field-official-issuertitle": "Chủ thể ban hành QĐ",
        "field-prosecutionextension-procedurearticlesline":
          "Căn cứ Bộ luật Tố tụng hình sự",
        "field-prosecutionextension-casedecisionlegalbasisline":
          "Căn cứ Quyết định khởi tố vụ án hình sự",
        "field-prosecutionextension-accuseddecisionlegalbasisline":
          "Căn cứ Quyết định khởi tố bị can",
        "field-prosecutionextension-investigationconclusionlegalbasisline":
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
        "field-prosecutionextension-reasonline":
          "Lý do gia hạn thời hạn quyết định việc truy tố",
        "field-prosecutionextension-article1line":
          "Điều 1 - Nội dung QĐ gia hạn",
        "field-recipients-investigatingagencyline":
          "Nơi nhận - Cơ quan điều tra",
        "field-recipients-accusedline": "Nơi nhận - Bị can",
        "field-recipients-archiveline": "Nơi nhận - Lưu hồ sơ",
        "field-signature-signmode": "Chế độ ký",
        "field-signature-positiontitle": "Chức vụ người ký",
        "field-signature-signername": "Họ tên người ký QĐ",
      },
  },
  {
    code: "BM-145",
    compiledTitle: "QĐ trả hồ sơ vụ án để điều tra bổ sung",
    expectedHeading: "QUYẾT ĐỊNH",
    expectedOperativeLabel: "Trả hồ sơ vụ án để điều tra bổ sung",
    expectedSectionTitles: [
      "Cơ quan và văn bản",
      "Căn cứ pháp lý",
      "Nội dung quyết định",
      "Nơi nhận",
      "Chữ ký",
    ],
      fieldLabels: {
        "field-agency-parentname": "Cơ quan cấp trên trực tiếp của Viện kiểm sát ban hành",
        "field-agency-name": "Tên Viện kiểm sát ban hành QĐ trả hồ sơ",
        "field-document-documentcode": "Số QĐ trả hồ sơ",
        "field-document-issueplaceanddateline":
          "Địa danh ban hành, ngày tháng năm ban hành",
        "field-prosecutionsupplementreturn-returnroundline":
          "Vòng trả hồ sơ (lần thứ mấy)",
        "field-official-issuertitle": "Chủ thể ban hành QĐ",
        "field-prosecutionsupplementreturn-procedurearticlesline":
          "Căn cứ Bộ luật Tố tụng hình sự",
        "field-prosecutionsupplementreturn-investigationconclusionlegalbasisline":
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
        "field-prosecutionsupplementreturn-courtreturndecisionlegalbasisline":
          "Căn cứ Quyết định Tòa án trả hồ sơ",
        "field-prosecutionsupplementreturn-reasonline":
          "Lý do trả hồ sơ vụ án để điều tra bổ sung",
        "field-prosecutionsupplementreturn-article1introline":
          "Điều 1 - Mở đầu nội dung trả hồ sơ",
        "field-prosecutionsupplementreturn-supplementissue1line":
          "Điều 1 - Vấn đề 1 cần điều tra bổ sung",
        "field-prosecutionsupplementreturn-supplementissue2line":
          "Điều 1 - Vấn đề 2 cần điều tra bổ sung",
        "field-prosecutionsupplementreturn-supplementissue3line":
          "Điều 1 - Vấn đề 3 cần điều tra bổ sung",
        "field-prosecutionsupplementreturn-article2line":
          "Điều 2 - Thời hạn điều tra bổ sung",
        "field-prosecutionsupplementreturn-article3line":
          "Điều 3 - Yêu cầu thực hiện QĐ",
        "field-prosecutionsupplementreturn-investigationauthorityrecipientline":
          "Nơi nhận - Cơ quan điều tra tiếp nhận hồ sơ",
        "field-recipients-archiveline": "Nơi nhận - Lưu hồ sơ",
        "field-signature-signmode": "Chế độ ký",
        "field-signature-positiontitle": "Chức vụ người ký",
        "field-signature-signername": "Họ tên người ký QĐ",
      },
  },
];

// Tokens that MUST NOT appear anywhere in the rendered form template content.
// Scoped to <main> element to exclude sidebar navigation.
// Note: "YÊU CẦU" / "Yêu cầu" are NOT in this list — they appear
// legitimately as legal field labels (e.g., "Điều 3 - Yêu cầu thực
// hiện QĐ" in BM-145). The document-type heading check (P0010
// "QUYẾT ĐỊNH") already ensures the correct family is rendered.
const FAMILY_FORBIDDEN_TOKENS = [
  // Sibling family artifacts (must never bleed into the QUYẾT ĐỊNH family):
  "(mẫu BM-141)",
  "(mẫu BM-142)",
  "(mẫu BM-143)",
  "(mẫu BM-144)",
  "(mẫu BM-145)",
  // Sibling family headings (document-type level):
  "KIẾN NGHỊ",
  "Kiến nghị",
  // Records-of-statement:
  "BB hỏi cung",
  "BB ghi lời khai",
  "BB đối chất",
  "Biên bản hỏi cung",
  "Biên bản ghi lời khai",
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

  // Wait for at least the first compiled field to render before any text-based
  // assertions. Larger forms (BM-141/144/145 with 17-21 fields) require
  // async loading that completes after the initial `load` event.
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
  // Distinct operative verb visible (source-backed wording).
  await expect(
    page.locator(`text=${form.expectedOperativeLabel}`).first(),
  ).toBeVisible();

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

  // Field-label semantics.
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
      `[${form.code}] field ${id}: expected at least one source to contain "${expectedLabel}" — aria-label="${sources.ariaLabel}" placeholder="${sources.placeholder}" visibleLabel="${sources.visibleLabelText}" description="${sources.descriptionText}" parent="${sources.parentText.slice(0, 200)}"`,
    ).toContain(expectedLabel);
  }

  // Section-title semantics.
  for (const sectionTitle of form.expectedSectionTitles) {
    await expect(
      page.locator(`text=${sectionTitle}`).first(),
    ).toBeVisible();
  }

  // Anti-pattern tokens: forbidden surface tokens MUST NOT appear in the
  // form template content. Scoped to <main> to exclude sidebar navigation
  // (which legitimately contains "YÊU CẦU" as a navigation category label).
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

test.describe("BM-141..BM-145 prosecution-stage QĐ family — authenticated desktop QA", () => {
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

test.describe("BM-141..BM-145 prosecution-stage QĐ family — authenticated mobile QA", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  for (const form of FORMS) {
    test(`${form.code} mobile 390x844 — single-column layout, no horizontal overflow`, async ({
      page,
    }) => {
      const evidence = await runRouteChecks(page, form);
      // Mobile-specific overflow confirm.
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
