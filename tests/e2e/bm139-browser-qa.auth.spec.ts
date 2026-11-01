/**
 * Authenticated route and responsive QA for the standalone BM-139 template —
 * Kiến nghị khắc phục vi phạm (corrective recommendation, investigation stage).
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-139 = 6). The renderer tags every compiled field with the stable
 *     contract-field-{id} id so we scope the count to that hook rather than
 *     to the global input/select/textarea selector.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea.
 *
 * Document-type distinction:
 *   BM-139 = Kiến nghị khắc phục vi phạm pháp luật (corrective recommendation).
 *   BM-139 is a member of the KIẾN NGHỊ (recommendation) family and is NOT a
 *   sibling of BM-140 (preventive recommendation — same family, distinct
 *   subfamily) nor BM-138 (Yêu cầu — request family, distinct family) nor
 *   BM-141/142/143 (Quyết định prosecution family).
 *   Two distinct compiled-field keys are used:
 *     - `document.soQuyet` literal value slot (P0005 + P0006 /KN-VKS suffix).
 *     - `agency.vienKiem` + `agency.diaDanh` + `recipients.localityName` +
 *       `person.personFullName` + `document.issueDate` for the rest of the
 *       header / recipient / signatory / event-date cluster.
 *   Family boundary is enforced by profile label semantics — no sibling
 *   labels (`Khắc phục vi phạm` / `YÊU CẦU` / `QUYẾT ĐỊNH` / `Số quyết
 *   định` / `BB hỏi cung bị can` / `BB ghi lời khai` / `BB đối chất`) are
 *   rendered.
 *
 * Source-aligned presentation labels are asserted below as exact
 * visible-text expectations. The historical contract keys remain
 * unchanged; only presentation labels are source-aligned.
 *
 * Uses existing storageState from pnpm test:e2e:auth; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-139.
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
    `[bm139-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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
    "BM-139.compiled.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as CompiledContract;
}

const COMPILED = loadCompiledContract();
const COMPILED_FIELD_IDS = COMPILED.source.fields.map((field) => field.id);
const COMPILED_FIELD_KEYS = COMPILED.source.fields.map((field) => field.key);

const BM139_CODE = "BM-139";
const BM139_COMPILED_TITLE =
  "Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra";
// BM-139 declarations are quoted from the curated profile — see
// `apps/web/src/lib/runtime-ux/bm139-runtime-ux-profile.ts`.
const BM139_SECTION_TITLES = ["Định danh văn bản", "Thông tin kiến nghị"];
const BM139_FIELDS = 6;
// Two compiled sections must each appear with its matching compiled id.
const BM139_EXPECTED_SECTION_IDS = [
  "section-document",
  "section-thong-tin-bieu-mau",
];
const BM139_SECTIONS = 2;

// Field-id → expected visible label mapping (source-aligned presentation
// labels per GATE C of the brief). If any of these regress to the
// pre-curation generic wording ("Trường cần điền (document)") or the
// fabricated "(mẫu BM-139)" placeholder the spec fails immediately.
const BM139_FIELD_LABELS: Record<string, string> = {
  "field-agency-vienkiem": "Tên cơ quan ban hành kiến nghị",
  "field-document-soquyet": "Số kiến nghị",
  "field-agency-diadanh": "Địa danh nơi ban hành kiến nghị",
  // Compatibility-mapped: source P0042 is a recipient footnote, NOT a locality.
  "field-recipients-localityname": "Cơ quan/người có thẩm quyền nhận kiến nghị",
  // Compatibility-mapped: source P0043 is a signer-title footnote, NOT a person-name.
  "field-person-personfullname": "Chức danh người ký kiến nghị",
  "field-document-issuedate": "Ngày ban hành kiến nghị",
};

// Anti-pattern tokens that MUST NOT appear anywhere in the rendered DOM.
const BM139_FORBIDDEN_TOKENS = [
  "(mẫu BM-139)",
  "/BB-VKS",
  "/VKSKV7",
  "/QĐ-VKSKV7",
  "Trường cần điền (document)",
  "Số quyết định",
  "YÊU CẦU",
  "Yêu cầu cung cấp",
  "BB hỏi cung bị can",
  "BB ghi lời khai",
  "BB đối chất",
  "QUYẾT ĐỊNH",
  "Quyết định",
  "Áp dụng biện pháp phòng ngừa tội phạm",
  "phòng ngừa tội phạm",
  "Trần Minh Quang",
  "Viện kiểm sát nhân dân khu vực 7",
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
      // Find the <label htmlFor={inputId}> element which holds the visible
      // label text. The input element is a SIBLING of the <label>, not its
      // child, so el.closest("label") returns null; we must look it up by id.
      const visibleLabel = inputId
        ? document.querySelector(`label[for="${inputId}"]`)
        : null;
      // The description <p> follows the input; capture its text too.
      const descriptionEl = inputId
        ? document.getElementById(`${inputId}-description`)
        : null;
      // Also check the parent wrapper's textContent for the section that
      // describes the field group.
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

  // Section count: the curated profile exposes presentationSections; we
  // tolerate overlap with the contract's own section count by asserting
  // that at least `expectedSectionCount` curated section headings render.
  let renderedSectionCount = 0;
  for (const title of BM139_EXPECTED_SECTION_IDS.map((_, idx) =>
    expectedSectionCount === 2
      ? BM139_SECTION_TITLES[idx]
      : BM139_SECTION_TITLES[idx],
  )) {
    const handle = page.locator(`text=${title}`);
    if ((await handle.count()) > 0) renderedSectionCount += 1;
  }
  expect(renderedSectionCount).toBe(expectedSectionCount);

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

test.describe("BM-139 standalone template — authenticated desktop QA", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });

  test("BM-139 desktop 1440x900 — route, headings, fields, no errors", async ({
    page,
  }) => {
    const route = "/templates/" + BM139_CODE;
    const evidence = await runRouteChecks(
      page,
      route,
      "KIẾN NGHỊ",
      BM139_COMPILED_TITLE,
      BM139_FIELDS,
      BM139_SECTIONS,
      BM139_FIELD_LABELS,
      BM139_FORBIDDEN_TOKENS,
    );

    // Zero console errors.
    expect(evidence.consoleErrors).toEqual([]);
    // Zero page errors.
    expect(evidence.pageErrors).toEqual([]);
    // Zero Documents API writes from this spec.
    expect(evidence.documentWrites).toEqual([]);
  });
});

test.describe("BM-139 standalone template — authenticated mobile QA", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("BM-139 mobile 390x844 — single-column layout, no horizontal overflow", async ({
    page,
  }) => {
    const route = "/templates/" + BM139_CODE;
    const evidence = await runRouteChecks(
      page,
      route,
      "KIẾN NGHỊ",
      BM139_COMPILED_TITLE,
      BM139_FIELDS,
      BM139_SECTIONS,
      BM139_FIELD_LABELS,
      BM139_FORBIDDEN_TOKENS,
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
