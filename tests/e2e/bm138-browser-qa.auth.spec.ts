/**
 * Authenticated route and responsive QA for the standalone BM-138 template —
 * Yêu cầu cung cấp tài liệu (request for evidence / procedural documents,
 * investigation stage).
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-138 = 7). The renderer tags every compiled field with the stable
 *     contract-field-{id} id so we scope the count to that hook rather than
 *     to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Document-type distinction:
 *   BM-138 = Yêu cầu cung cấp tài liệu (request for evidence /
 *   procedural documents). BM-138 is an isolated singleton request family;
 *   it is NOT a sibling of BM-139 / BM-140 (Kiến nghị family) nor
 *   BM-141 / BM-142 / BM-143 (Quyết định prosecution family) nor
 *   BM-134 / BM-135 / BM-136 (biên-bản family). Family boundary is
 *   enforced by profile label semantics — no sibling labels are rendered.
 *
 * Source-aligned presentation labels are asserted below as exact
 * visible-text expectations. The historical contract keys remain
 * unchanged; only presentation labels are source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-138.
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
    fields: Array<{ id: string; key: string }>;
  };
};

function loadCompiledContract(): CompiledContract {
  const path = resolve(
    process.cwd(),
    "docs/audit/docx/compiled-v2",
    "BM-138.compiled.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

const COMPILED = loadCompiledContract();
const COMPILED_FIELD_IDS = COMPILED.source.fields.map((field) => field.id);
const COMPILED_FIELD_KEYS = COMPILED.source.fields.map((field) => field.key);

const BM138_CODE = "BM-138";
const BM138_COMPILED_TITLE =
  "Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra";
const BM138_SECTION_TITLE = "Thông tin Yêu cầu cung cấp tài liệu";
const BM138_FIELDS = 7;
const BM138_SECTIONS = 1;

// Field-id → expected visible label mapping (source-aligned presentation
// labels per GATE C of the brief). If any of these regress to the
// pre-curation generic wording the spec fails immediately.
const BM138_FIELD_LABELS: Record<string, string> = {
  "field-agency-vienkiem": "Viện kiểm sát ban hành yêu cầu",
  "field-document-soquyet": "Số yêu cầu cung cấp tài liệu",
  "field-agency-diadanh": "Địa danh ban hành yêu cầu",
  "field-document-ngayban": "Ngày ban hành yêu cầu",
  "field-agency-dongdia": "Dòng địa danh bổ sung (nếu hồ sơ có)",
  "field-document-chuthe": "Cơ quan/tổ chức/cá nhân phải cung cấp",
  "field-person-tenbi": "Họ tên người hoặc tên pháp nhân bị khởi tố",
};

// Anti-pattern tokens that MUST NOT appear anywhere in the rendered DOM.
const BM138_FORBIDDEN_TOKENS = [
  "Số quyết định",
  "BB hỏi cung bị can",
  "BB ghi lời khai",
  "BB đối chất",
  "Tên bị can",
  "Tên bị cáo",
  "Người bị áp dụng",
  "Chủ thể liên quan",
  "/BB-VKS",
  "/VKSKV7",
  "BB-138/VKSKV7",
  "(mẫu BM-138)",
];

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
  page.on("pageerror", (error) => evidence.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (
      DOCUMENT_WRITE_METHODS.has(request.method()) &&
      /\/api\/v1\/documents(?:\/|\?|$)/iu.test(request.url())
    ) {
      evidence.documentWrites.push(request.method() + " " + request.url());
    }
  });

  return evidence;
}

async function openBm138Form(
  page: Page,
  width: number,
  height: number,
): Promise<BrowserEvidence> {
  const evidence = collectBrowserEvidence(page);
  await page.setViewportSize({ width, height });
  await page.goto("/templates/" + BM138_CODE, { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/templates/" + BM138_CODE);
  await expect(page).not.toHaveURL(/\/documents/iu);
  await expect(page).not.toHaveURL(/\/sign-in/iu);
  return evidence;
}

test(BM138_CODE + " authenticated route stays on /templates", async ({
  page,
}) => {
  const evidence = await openBm138Form(page, 1440, 900);

  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });
  const compiledControls = page.locator('[id^="contract-field-"]');
  const renderedCount = await compiledControls.count();
  expect(
    renderedCount,
    BM138_CODE + " rendered compiled controls must equal compiled field count",
  ).toBe(BM138_FIELDS);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const fatalConsoleErrors = evidence.consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("chunk"),
  );
  expect(fatalConsoleErrors, BM138_CODE + " console errors").toHaveLength(0);
  expect(evidence.pageErrors, BM138_CODE + " page errors").toHaveLength(0);
  expect(
    evidence.documentWrites,
    BM138_CODE + " must not write /api/v1/documents",
  ).toHaveLength(0);
});

test(BM138_CODE + " renders every compiled field exactly once", async ({
  page,
}) => {
  await openBm138Form(page, 1440, 900);
  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

  for (const fieldId of COMPILED_FIELD_IDS) {
    const control = page.locator(fieldSelector(fieldId));
    await expect(
      control,
      BM138_CODE + " compiled field id " + fieldId + " must render exactly once",
    ).toHaveCount(1);
    await expect(
      control,
      BM138_CODE + " compiled field id " + fieldId + " must be editable",
    ).toBeEditable();
  }

  const renderedFieldIds = await page.evaluate(() => {
    const re = /^contract-field-(.+)$/u;
    return Array.from(document.querySelectorAll("[id]"))
      .map((node) => node.id)
      .filter((id) => re.test(id))
      .map((id) => re.exec(id)?.[1])
      .filter((id): id is string => Boolean(id));
  });
  const renderedSet = new Set(renderedFieldIds);
  const compiledSet = new Set(COMPILED_FIELD_IDS);
  const outsideCompiled = renderedFieldIds.filter(
    (id) => !compiledSet.has(id),
  );
  const missingFromRendered = COMPILED_FIELD_IDS.filter(
    (id) => !renderedSet.has(id),
  );
  expect(
    outsideCompiled,
    BM138_CODE + " rendered presentation fields outside compiled contract",
  ).toEqual([]);
  expect(
    missingFromRendered,
    BM138_CODE + " compiled fields missing from rendered DOM",
  ).toEqual([]);

  expect(COMPILED_FIELD_KEYS).toHaveLength(BM138_FIELDS);
  expect(new Set(COMPILED_FIELD_KEYS).size).toBe(BM138_FIELDS);
});

test(BM138_CODE + " renders the curated document-type heading", async ({
  page,
}) => {
  await openBm138Form(page, 1440, 900);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: BM138_COMPILED_TITLE,
      exact: true,
    }),
  ).toBeVisible();
});

test(BM138_CODE + " renders the curated section heading exactly once", async ({
  page,
}) => {
  await openBm138Form(page, 1440, 900);
  const sectionHeadings = page.locator(
    '[data-testid="bm-form-section-title"]',
  );
  await expect(
    sectionHeadings,
    BM138_CODE + " must render exactly one curated section",
  ).toHaveCount(BM138_SECTIONS);
  await expect(
    sectionHeadings.first(),
    BM138_CODE + " section heading must be the curated title",
  ).toHaveText(BM138_SECTION_TITLE);
});

test(
  BM138_CODE + " renders all 7 source-aligned field labels exactly",
  async ({ page }) => {
    await openBm138Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    for (const [fieldId, expectedLabel] of Object.entries(BM138_FIELD_LABELS)) {
      const labelLocator = page.locator(`label[for="contract-field-${fieldId}"]`);
      await expect(
        labelLocator,
        `${BM138_CODE} field ${fieldId} must carry curated label "${expectedLabel}"`,
      ).toHaveText(expectedLabel);
    }
  },
);

test(
  BM138_CODE + " rendered DOM contains no forbidden pre-curation tokens",
  async ({ page }) => {
    await openBm138Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    const bodyText = await page.locator("body").innerText();
    for (const forbidden of BM138_FORBIDDEN_TOKENS) {
      expect(
        bodyText.includes(forbidden),
        `${BM138_CODE} body must NOT contain forbidden token "${forbidden}"`,
      ).toBe(false);
    }
  },
);

test(BM138_CODE + " responsive — desktop 1440x900 no horizontal overflow", async ({
  page,
}) => {
  await openBm138Form(page, 1440, 900);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM138_CODE + " desktop no horizontal overflow").toBe(false);
});

test(BM138_CODE + " responsive — mobile 390x844 no horizontal overflow", async ({
  page,
}) => {
  await openBm138Form(page, 390, 844);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM138_CODE + " mobile no horizontal overflow").toBe(false);
});
