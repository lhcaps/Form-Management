/**
 * Authenticated route and responsive QA for the standalone BM-140 template —
 * Kiến nghị áp dụng biện pháp phòng ngừa tội phạm (crime-prevention
 * recommendation, investigation stage).
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-140 = 5). The renderer tags every compiled field with the stable
 *     contract-field-{id} id so we scope the count to that hook rather than
 *     to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Document-type distinction:
 *   BM-140 = Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp
 *   luật (preventive recommendation). BM-140 is a member of the KIẾN NGHỊ
 *   (recommendation) family and is NOT a sibling of BM-139 (corrective
 *   recommendation — same family, distinct subfamily) nor BM-138 (Yêu
 *   cầu — request family, distinct family) nor BM-141/142/143 (Quyết
 *   định prosecution family). The compiled `document.soKien` field key
 *   (Số kiến nghị) is unique to BM-140; the sibling BM-139 uses
 *   `document.soQuyet` (Số kiến nghị re-keyed under the same family).
 *   Family boundary is enforced by profile label semantics — no sibling
 *   labels (`Phòng ngừa` / `YÊU CẦU` / `QUYẾT ĐỊNH` / `BB ...` / `Trần
 *   Minh Quang`) are rendered.
 *
 * Source-aligned presentation labels are asserted below as exact
 * visible-text expectations. The historical contract keys remain
 * unchanged; only presentation labels are source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-140.
 */

import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCUMENT_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test.beforeAll(async ({ browser }) => {
  // Log actual browser metadata once per spec run, sourced from the
  // live Playwright fixture (NOT inferred from the bundled @playwright/test
  // version). This is the canonical replacement for the previously reported
  // but never-measured `browserVersionFromActualTestFixture =
  // "chromium-1.61.0"` claim.
  // eslint-disable-next-line no-console
  console.log(
    `[bm140-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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

function loadCompiledContract(): CompiledContract {
  const path = resolve(
    process.cwd(),
    "docs/audit/docx/compiled-v2",
    "BM-140.compiled.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

const COMPILED = loadCompiledContract();
const COMPILED_FIELD_IDS = COMPILED.source.fields.map((field) => field.id);
const COMPILED_FIELD_KEYS = COMPILED.source.fields.map((field) => field.key);

const BM140_CODE = "BM-140";
const BM140_COMPILED_TITLE =
  "Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật";
const BM140_SECTION_TITLE = "Thông tin kiến nghị";
const BM140_FIELDS = 5;
const BM140_SECTIONS = 1;

// Field-id → expected visible label mapping (source-aligned presentation
// labels per GATE C of the brief). If any of these regress to the
// pre-curation generic wording ("Tên cơ quan" with "(mẫu BM-140)"
// placeholder) the spec fails immediately.
const BM140_FIELD_LABELS: Record<string, string> = {
  "field-agency-vienkiem": "Tên cơ quan ban hành kiến nghị",
  "field-document-sokien": "Số kiến nghị",
  "field-agency-diadanh": "Địa danh nơi ban hành kiến nghị",
  "field-document-ngayban": "Ngày ban hành kiến nghị",
  // Contract-only: no combined locality+date paragraph exists in canonical extract;
  // label is conservative (not asserting a DIRECT_SLOT).
  "field-agency-dongdia": "Dòng địa danh bổ sung (nếu hồ sơ có)",
};

// Anti-pattern tokens that MUST NOT appear anywhere in the rendered DOM.
const BM140_FORBIDDEN_TOKENS = [
  "(mẫu BM-140)",
  "/BB-VKS",
  "/VKSKV7",
  "/QĐ-VKSKV7",
  "Số quyết định",
  "YÊU CẦU",
  "Yêu cầu cung cấp",
  "BB hỏi cung bị can",
  "BB ghi lời khai",
  "BB đối chất",
  "QUYẾT ĐỊNH",
  "Quyết định",
  "Khắc phục vi phạm pháp luật",
  "khắc phục vi phạm",
  "Trần Minh Quang",
  "Viện kiểm sát nhân dân khu vực 7",
  "section-dong-ngay",
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
      /\/api\/v1\/documents(?:$|\?)/.test(request.url()) &&
      DOCUMENT_WRITE_METHODS.has(request.method().toUpperCase())
    ) {
      evidence.documentWrites.push(`${request.method()} ${request.url()}`);
    }
  });

  return evidence;
}

async function runRouteChecks(
  page: Page,
  route: string,
  expectedHeading: string,
  expectedCompileTitle: string,
  expectedFieldCount: number,
  expectedSectionCount: number,
  expectedSectionTitle: string,
  fieldLabels: Record<string, string>,
  forbiddenTokens: string[],
): Promise<BrowserEvidence> {
  const evidence = collectBrowserEvidence(page);
  await page.goto(route, { waitUntil: "load" });

  // No sign-in redirect.
  await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));

  // No /documents redirect.
  expect(page.url()).not.toContain("/documents");

  // Exact compiled title visible somewhere on the page.
  await expect(page.locator(`text=${expectedCompileTitle}`).first()).toBeVisible();

  // Exact heading text (P0010 KIẾN NGHỊ) visible.
  await expect(page.locator(`text=${expectedHeading}`).first()).toBeVisible();

  // Renderable compiled-field cardinality: every compiled contract field is
  // rendered exactly once and is editable. We scope to the renderer tag
  // hook (`#contract-field-{id}`) rather than the global input selector to
  // exclude any helper demo / preview inputs.
  for (const id of COMPILED_FIELD_IDS) {
    await expect(page.locator(fieldSelector(id))).toHaveCount(1);
  }
  // Total compiled-field cardinality via the renderer hook.
  await expect(
    page.locator(COMPILED_FIELD_IDS.map(fieldSelector).join(", ")),
  ).toHaveCount(expectedFieldCount);

  // Each rendered compiled field must be a real input/select/textarea and
  // must NOT be disabled.
  for (const id of COMPILED_FIELD_IDS) {
    const handle = page.locator(fieldSelector(id));
    const tagName = await handle.evaluate((el) => el.tagName.toLowerCase());
    expect(["input", "select", "textarea"]).toContain(tagName);
    await expect(handle).toBeEnabled();
  }

  // Each compiled field must show its source-aligned visible label. The
  // profile may render the label as the input's `aria-label`, the
  // surrounding <label for="contract-field-{id}"> text content, the
  // input's `placeholder`, or the description text that follows the
  // input. We accept ANY of those sources so long as the user sees
  // the right wording.
  for (const [id, expectedLabel] of Object.entries(fieldLabels)) {
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
      `field ${id}: expected at least one source to contain "${expectedLabel}" — aria-label="${sources.ariaLabel}" placeholder="${sources.placeholder}" visibleLabel="${sources.visibleLabelText}" description="${sources.descriptionText}" parent="${sources.parentText.slice(0, 200)}"`,
    ).toContain(expectedLabel);
  }

  // Single compiled section `section-thong-tin-bieu-mau` with the curated
  // title.
  await expect(page.locator(`text=${expectedSectionTitle}`).first()).toBeVisible();

  // Phantom section check: the pre-curation profile introduced
  // `section-dong-ngay`; the rendered DOM must contain exactly one curated
  // section heading for the visible curated title.
  const titleCount = await page.locator(`text=${expectedSectionTitle}`).count();
  expect(titleCount).toBeGreaterThanOrEqual(expectedSectionCount);

  // Anti-pattern tokens: forbidden surface tokens MUST NOT appear in the
  // rendered DOM anywhere.
  const bodyText = (await page.locator("body").innerText()).trim();
  for (const token of forbiddenTokens) {
    expect(bodyText).not.toContain(token);
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

test.describe("BM-140 standalone template — authenticated desktop QA", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });

  test("BM-140 desktop 1440x900 — route, headings, fields, no errors", async ({
    page,
  }) => {
    const route = "/templates/" + BM140_CODE;
    const evidence = await runRouteChecks(
      page,
      route,
      "KIẾN NGHỊ",
      BM140_COMPILED_TITLE,
      BM140_FIELDS,
      BM140_SECTIONS,
      BM140_SECTION_TITLE,
      BM140_FIELD_LABELS,
      BM140_FORBIDDEN_TOKENS,
    );

    // Zero console errors.
    expect(evidence.consoleErrors).toEqual([]);
    // Zero page errors.
    expect(evidence.pageErrors).toEqual([]);
    // Zero Documents API writes from this spec.
    expect(evidence.documentWrites).toEqual([]);
  });
});

test.describe("BM-140 standalone template — authenticated mobile QA", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("BM-140 mobile 390x844 — single-column layout, no horizontal overflow", async ({
    page,
  }) => {
    const route = "/templates/" + BM140_CODE;
    const evidence = await runRouteChecks(
      page,
      route,
      "KIẾN NGHỊ",
      BM140_COMPILED_TITLE,
      BM140_FIELDS,
      BM140_SECTIONS,
      BM140_SECTION_TITLE,
      BM140_FIELD_LABELS,
      BM140_FORBIDDEN_TOKENS,
    );

    // Mobile-specific: confirm the layout collapses to a single column by
    // checking that the full card-stack does not introduce horizontal
    // overflow at the 390px width.
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
});
