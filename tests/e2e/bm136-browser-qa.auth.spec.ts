/**
 * Authenticated route and responsive QA for the standalone BM-136 template —
 * Biên bản đối chất (confrontation record between two parties).
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-136 = 17). The renderer tags every compiled field with the stable
 *     contract-field-{id} id so we scope the count to that hook rather than
 *     to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Document-type distinction:
 *   BM-136 = Biên bản đối chất (confrontation, two parties, investigation
 *   stage, governed by Điều 178 + Điều 189 BLTTHS). BM-136 is NOT a member
 *   of the BM-134/BM-135 biên-bản family; it is the first curated member of
 *   the đối-chất procedural subfamily. Family boundary is enforced by
 *   profile label semantics — no BM-134/BM-135 labels are rendered.
 *
 * Source-aligned presentation labels (GATE B / Section 7 of the brief) are
 * asserted below as exact visible-text expectations. The historical
 * contract keys remain unchanged; only presentation labels are
 * source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-136.
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
    "BM-136.compiled.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

const COMPILED = loadCompiledContract();
const COMPILED_FIELD_IDS = COMPILED.source.fields.map((field) => field.id);
const COMPILED_FIELD_KEYS = COMPILED.source.fields.map((field) => field.key);

const BM136_CODE = "BM-136";
const BM136_COMPILED_TITLE = "BB đối chất";
const BM136_SECTION_TITLE = "Thông tin biên bản đối chất";
const BM136_FIELDS = 17;
const BM136_SECTIONS = 1;

// Field-id → expected visible label mapping (GATE B / Section 7).
// This is the source-aligned presentation label; if any of these regresses
// to the pre-curation generic wording the spec fails immediately.
const BM136_FIELD_LABELS: Record<string, string> = {
  "field-agency-vienkiem": "Viện kiểm sát thực hiện đối chất",
  "field-signature-positiontitle": "Chức danh người tiến hành đối chất",
  "field-recipients-personline": "Người tiến hành đối chất",
  "field-document-soquyet": "Số biên bản đối chất",
  "field-agency-diadanh": "Địa điểm tiến hành đối chất",
  "field-document-ngayban": "Thời điểm bắt đầu đối chất",
  "field-agency-dongdia": "Dòng địa danh bổ sung (nếu hồ sơ có)",
  "field-document-chuthe": "Người tham gia đối chất thứ hai",
  "field-person-tenbi": "Người tham gia đối chất thứ nhất",
  "field-document-tenvu": "Tên vụ án hoặc vụ việc (nếu hồ sơ có)",
  "field-person-toidanh": "Tội danh liên quan (nếu hồ sơ có)",
  "field-document-sotien": "Số tiền liên quan (nếu hồ sơ có)",
  "field-document-lydo": "Lý do bổ sung (nếu hồ sơ có)",
  "field-recipients-luuho": "Thông tin lưu hồ sơ (nếu hồ sơ có)",
  "field-signature-chedo": "Địa chỉ cư trú của người tham gia đối chất",
  "field-signature-chucvu": "Tư cách tham gia tố tụng của các bên đối chất",
  "field-signature-nguoiky": "Người tham gia đối chất khác (nếu có)",
};

// Anti-pattern tokens that MUST NOT appear anywhere in the rendered DOM.
const BM136_FORBIDDEN_TOKENS = [
  "Số quyết định",
  "BB hỏi cung bị can",
  "BB ghi lời khai",
  "Địa danh", // issuing-locality style only
  "Ngày ban hành", // issue-date style only
  "Tên bị can",
  "Người bị áp dụng",
  "Chủ thể liên quan",
  "/BB-VKS",
  "(mẫu BM-136)",
  // Contract-only fields use literal placeholder text only — no
  // fabricated demo values:
  "100.000.000 đồng",
  "Theo đề nghị của",
  "Căn cứ Điều 178 và Điều 189 của Bộ luật Tố tụng hình sự", // forced legal-basis as control label
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

async function openBm136Form(
  page: Page,
  width: number,
  height: number,
): Promise<BrowserEvidence> {
  const evidence = collectBrowserEvidence(page);
  await page.setViewportSize({ width, height });
  await page.goto("/templates/" + BM136_CODE, { waitUntil: "networkidle" });
  await expect(page).toHaveURL("/templates/" + BM136_CODE);
  await expect(page).not.toHaveURL(/\/documents/iu);
  await expect(page).not.toHaveURL(/\/sign-in/iu);
  return evidence;
}

test(BM136_CODE + " authenticated route stays on /templates", async ({
  page,
}) => {
  const evidence = await openBm136Form(page, 1440, 900);

  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });
  const compiledControls = page.locator('[id^="contract-field-"]');
  const renderedCount = await compiledControls.count();
  expect(
    renderedCount,
    BM136_CODE + " rendered compiled controls must equal compiled field count",
  ).toBe(BM136_FIELDS);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const fatalConsoleErrors = evidence.consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("chunk"),
  );
  expect(fatalConsoleErrors, BM136_CODE + " console errors").toHaveLength(0);
  expect(evidence.pageErrors, BM136_CODE + " page errors").toHaveLength(0);
  expect(
    evidence.documentWrites,
    BM136_CODE + " must not write /api/v1/documents",
  ).toHaveLength(0);
});

test(BM136_CODE + " renders every compiled field exactly once", async ({
  page,
}) => {
  await openBm136Form(page, 1440, 900);
  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

  for (const fieldId of COMPILED_FIELD_IDS) {
    const control = page.locator(fieldSelector(fieldId));
    await expect(
      control,
      BM136_CODE + " compiled field id " + fieldId + " must render exactly once",
    ).toHaveCount(1);
    await expect(
      control,
      BM136_CODE + " compiled field id " + fieldId + " must be editable",
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
    BM136_CODE + " rendered presentation fields outside compiled contract",
  ).toEqual([]);
  expect(
    missingFromRendered,
    BM136_CODE + " compiled fields missing from rendered DOM",
  ).toEqual([]);

  expect(COMPILED_FIELD_KEYS).toHaveLength(BM136_FIELDS);
  expect(new Set(COMPILED_FIELD_KEYS).size).toBe(BM136_FIELDS);
});

test(BM136_CODE + " renders the curated document-type heading", async ({
  page,
}) => {
  await openBm136Form(page, 1440, 900);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: BM136_COMPILED_TITLE,
      exact: true,
    }),
  ).toBeVisible();
});

test(BM136_CODE + " renders the curated section heading exactly once", async ({
  page,
}) => {
  await openBm136Form(page, 1440, 900);
  const sectionHeadings = page.locator(
    '[data-testid="bm-form-section-title"]',
  );
  await expect(
    sectionHeadings,
    BM136_CODE + " must render exactly one curated section",
  ).toHaveCount(BM136_SECTIONS);
  await expect(
    sectionHeadings.first(),
    BM136_CODE + " section heading must be the curated title",
  ).toHaveText(BM136_SECTION_TITLE);
});

test(
  BM136_CODE + " renders all 17 source-aligned field labels exactly",
  async ({ page }) => {
    await openBm136Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    for (const [fieldId, expectedLabel] of Object.entries(BM136_FIELD_LABELS)) {
      const labelLocator = page.locator(`label[for="contract-field-${fieldId}"]`);
      await expect(
        labelLocator,
        `${BM136_CODE} field ${fieldId} must carry curated label "${expectedLabel}"`,
      ).toHaveText(expectedLabel);
    }
  },
);

test(
  BM136_CODE + " rendered DOM contains no forbidden pre-curation tokens",
  async ({ page }) => {
    await openBm136Form(page, 1440, 900);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    const bodyText = await page.locator("body").innerText();
    for (const forbidden of BM136_FORBIDDEN_TOKENS) {
      expect(
        bodyText.includes(forbidden),
        `${BM136_CODE} body must NOT contain forbidden token "${forbidden}"`,
      ).toBe(false);
    }
  },
);

test(BM136_CODE + " responsive — desktop 1440x900 no horizontal overflow", async ({
  page,
}) => {
  await openBm136Form(page, 1440, 900);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM136_CODE + " desktop no horizontal overflow").toBe(false);
});

test(BM136_CODE + " responsive — mobile 390x844 no horizontal overflow", async ({
  page,
}) => {
  await openBm136Form(page, 390, 844);
  const overflow = await page.locator("body").evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1,
  );
  expect(overflow, BM136_CODE + " mobile no horizontal overflow").toBe(false);
});

test(BM136_CODE + " responsive — mobile 390x844 renders single column", async ({
  page,
}) => {
  await openBm136Form(page, 390, 844);
  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });
  // Each rendered field container must sit at full mobile width — i.e.
  // no two fields render on the same horizontal line. The renderer
  // uses `md:grid-cols-12` with the per-field col-span; on mobile
  // (< md) every field must stack into its own row.
  const fieldBoxes = await page.evaluate(() => {
    const ids = Array.from(
      document.querySelectorAll('[id^="contract-field-"]'),
    );
    return ids.map((node) => {
      const rect = (node as HTMLElement).getBoundingClientRect();
      return { id: node.id, top: rect.top, left: rect.left };
    });
  });
  const byTop = new Map<number, string[]>();
  for (const box of fieldBoxes) {
    const key = Math.round(box.top);
    const list = byTop.get(key) ?? [];
    list.push(box.id);
    byTop.set(key, list);
  }
  for (const [top, ids] of byTop) {
    expect(
      ids.length,
      BM136_CODE +
        " mobile must render one field per row (top=" +
        top +
        " rows=" +
        ids.length +
        ")",
    ).toBe(1);
  }
});

test(BM136_CODE + " field order matches presentationSections spec", async ({
  page,
}) => {
  await openBm136Form(page, 1440, 900);
  await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

  // Read the rendered DOM order (top-to-bottom) and confirm it matches
  // the curated presentationSections order from the profile.
  const renderedOrder = await page.evaluate(() => {
    const re = /^contract-field-(.+)$/u;
    return Array.from(document.querySelectorAll('[id^="contract-field-"]'))
      .map((node) => re.exec(node.id)?.[1])
      .filter((id): id is string => Boolean(id));
  });
  const expectedOrder = [
    "field-agency-vienkiem",
    "field-signature-positiontitle",
    "field-recipients-personline",
    "field-document-soquyet",
    "field-agency-diadanh",
    "field-document-ngayban",
    "field-agency-dongdia",
    "field-document-chuthe",
    "field-person-tenbi",
    "field-document-tenvu",
    "field-person-toidanh",
    "field-document-sotien",
    "field-document-lydo",
    "field-recipients-luuho",
    "field-signature-chedo",
    "field-signature-chucvu",
    "field-signature-nguoiky",
  ];
  expect(
    renderedOrder,
    BM136_CODE + " rendered order must equal presentationSections order",
  ).toEqual(expectedOrder);
});
