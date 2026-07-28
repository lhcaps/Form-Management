/**
 * Authenticated route and responsive QA for the standalone BM-137 template —
 * Biên bản xác minh/làm việc (verification / work session record).
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-137 = 6). The renderer tags every compiled field with the stable
 *     contract-field-{id} id so we scope the count to that hook rather than
 *     to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Document-type distinction:
 *   BM-137 = Biên bản xác minh/làm việc (verification/work session,
 *   investigation stage). BM-137 is a distinct biên-bản procedural
 *   subfamily from BM-134 (ghi lời khai), BM-135 (hỏi cung bị can),
 *   and BM-136 (đối chất). Family boundary is enforced by profile
 *   label semantics — no BM-134/BM-135/BM-136 labels are rendered.
 *
 * Source-aligned presentation labels are asserted below as exact
 * visible-text expectations. The historical contract keys remain
 * unchanged; only presentation labels are source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-137.
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
    "BM-137.compiled.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

const COMPILED = loadCompiledContract();
const COMPILED_FIELD_IDS = COMPILED.source.fields.map((field) => field.id);
const COMPILED_FIELD_KEYS = COMPILED.source.fields.map((field) => field.key);

const BM137_CODE = "BM-137";
const BM137_COMPILED_TITLE = "Biên bản xác minh-làm việc";
const BM137_SECTION_TITLE = "Thông tin biên bản xác minh/làm việc";
const BM137_FIELDS = 6;
const BM137_SECTIONS = 1;

// Field-id → expected visible label mapping (source-aligned presentation
// labels per GATE C of the brief). If any of these regress to the
// pre-curation generic wording the spec fails immediately.
const BM137_FIELD_LABELS: Record<string, string> = {
  "field-agency-vienkiem": "Viện kiểm sát tiến hành xác minh/làm việc",
  "field-document-sobien": "Số biên bản xác minh/làm việc",
  "field-document-noilap": "Nơi lập biên bản",
  "field-document-ngaylap": "Ngày lập biên bản",
  "field-agency-dongdia": "Dòng địa danh bổ sung (nếu hồ sơ có)",
  "field-document-tenvu": "Tên vụ án hoặc vụ việc cần xác minh/làm việc",
};

// Anti-pattern tokens that MUST NOT appear anywhere in the rendered DOM.
const BM137_FORBIDDEN_TOKENS = [
  "Số quyết định",
  "BB hỏi cung bị can",
  "BB ghi lời khai",
  "BB đối chất",
  "Địa danh ban hành",
  "Ngày ban hành",
  "Tên bị can",
  "Tên bị cáo",
  "Người bị áp dụng",
  "Chủ thể liên quan",
  "/BB-VKS",
  "/VKSKV7",
  "BB-137/VKSKV7",
  "(mẫu BM-137)",
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

async function openBm137Form(
  page: Page,
  width: number,
  height: number,
): Promise<BrowserEvidence> {
  const evidence = collectBrowserEvidence(page);
  await page.setViewportSize({ width, height });
  await page.goto("/templates/" + BM137_CODE, { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/templates/" + BM137_CODE);
  await expect(page).not.toHaveURL(/\/documents/iu);
  await expect(page).not.toHaveURL(/\/sign-in/iu);
  return evidence;
}

test(BM137_CODE + " authenticated route stays on /templates", async ({
  page,
}) => {
  const evidence = await openBm137Form(page, 1440, 900);

  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });
  const compiledControls = page.locator('[id^="contract-field-"]');
  const renderedCount = await compiledControls.count();
  expect(
    renderedCount,
    BM137_CODE + " rendered compiled controls must equal compiled field count",
  ).toBe(BM137_FIELDS);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const fatalConsoleErrors = evidence.consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("chunk"),
  );
  expect(fatalConsoleErrors, BM137_CODE + " console errors").toHaveLength(0);
  expect(evidence.pageErrors, BM137_CODE + " page errors").toHaveLength(0);
  expect(
    evidence.documentWrites,
    BM137_CODE + " must not write /api/v1/documents",
  ).toHaveLength(0);
});

test(BM137_CODE + " renders every compiled field exactly once", async ({
  page,
}) => {
  await openBm137Form(page, 1440, 900);
  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

  for (const fieldId of COMPILED_FIELD_IDS) {
    const control = page.locator(fieldSelector(fieldId));
    await expect(
      control,
      BM137_CODE + " compiled field id " + fieldId + " must render exactly once",
    ).toHaveCount(1);
    await expect(
      control,
      BM137_CODE + " compiled field id " + fieldId + " must be editable",
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
    BM137_CODE + " rendered presentation fields outside compiled contract",
  ).toEqual([]);
  expect(
    missingFromRendered,
    BM137_CODE + " compiled fields missing from rendered DOM",
  ).toEqual([]);

  expect(COMPILED_FIELD_KEYS).toHaveLength(BM137_FIELDS);
  expect(new Set(COMPILED_FIELD_KEYS).size).toBe(BM137_FIELDS);
});

test(BM137_CODE + " renders the curated document-type heading", async ({
  page,
}) => {
  await openBm137Form(page, 1440, 900);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: BM137_COMPILED_TITLE,
      exact: true,
    }),
  ).toBeVisible();
});

test(BM137_CODE + " renders the curated section heading exactly once", async ({
  page,
}) => {
  await openBm137Form(page, 1440, 900);
  const sectionHeadings = page.locator(
    '[data-testid="bm-form-section-title"]',
  );
  await expect(
    sectionHeadings,
    BM137_CODE + " must render exactly one curated section",
  ).toHaveCount(BM137_SECTIONS);
  await expect(
    sectionHeadings.first(),
    BM137_CODE + " section heading must be the curated title",
  ).toHaveText(BM137_SECTION_TITLE);
});

test(
  BM137_CODE + " renders all 6 source-aligned field labels exactly",
  async ({ page }) => {
    await openBm137Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    for (const [fieldId, expectedLabel] of Object.entries(BM137_FIELD_LABELS)) {
      const labelLocator = page.locator(`label[for="contract-field-${fieldId}"]`);
      await expect(
        labelLocator,
        `${BM137_CODE} field ${fieldId} must carry curated label "${expectedLabel}"`,
      ).toHaveText(expectedLabel);
    }
  },
);

test(
  BM137_CODE + " rendered DOM contains no forbidden pre-curation tokens",
  async ({ page }) => {
    await openBm137Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    const bodyText = await page.locator("body").innerText();
    for (const forbidden of BM137_FORBIDDEN_TOKENS) {
      expect(
        bodyText.includes(forbidden),
        `${BM137_CODE} body must NOT contain forbidden token "${forbidden}"`,
      ).toBe(false);
    }
  },
);

test(BM137_CODE + " responsive — desktop 1440x900 no horizontal overflow", async ({
  page,
}) => {
  await openBm137Form(page, 1440, 900);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM137_CODE + " desktop no horizontal overflow").toBe(false);
});

test(BM137_CODE + " responsive — mobile 390x844 no horizontal overflow", async ({
  page,
}) => {
  await openBm137Form(page, 390, 844);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM137_CODE + " mobile no horizontal overflow").toBe(false);
});