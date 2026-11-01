/**
 * Authenticated route and responsive QA for BM-166/BM-168 — frontier-leap
 * gap closure batch. Two isolated singletons, NOT a legal family:
 *   - BM-166: "QĐ trả hồ sơ vụ án để điều tra lại" (QUYẾT ĐỊNH, Điều 41/174
 *     BLTTHS re-investigation return) — 14 fields, 5 sections.
 *   - BM-168: "BB giao nhận hồ sơ vụ án, vụ việc" (BIÊN BẢN, factual
 *     case-file handover record) — 14 fields, 2 sections.
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
    `[bm166-168-frontier-leap-browser-qa.auth] actual browser.version()=${browser.version()} browser.browserType().executablePath()=${browser.browserType().executablePath() ?? "<bundled>"}`,
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
    code: "BM-166",
    compiledTitle: "QĐ trả hồ sơ vụ án để điều tra lại",
    heading: "QĐ trả hồ sơ vụ án để điều tra lại",
    fieldCount: 14,
    sectionCount: 5,
    forbiddenTokens: [
      "(mẫu BM-166)",
      "BB giao nhận hồ sơ vụ án, vụ việc",
      "điều tra bổ sung",
      "Điều 245",
      "Điều 247",
      "Trần Văn Bình",
    ],
    // BM-166 semantic assertion: decision-number field editable, QĐ suffix
    // present, no TB-suffix regression.
    decisionNumberFieldKey: "document.documentCode",
    decisionNumberFormatRegex: /\/QĐ-VKS/u,
    decisionNumberForbiddenSuffix: /\/TB-VKS/u,
  },
  {
    code: "BM-168",
    compiledTitle: "BB giao nhận hồ sơ vụ án, vụ việc",
    heading: "BB giao nhận hồ sơ vụ án, vụ việc",
    fieldCount: 14,
    sectionCount: 2,
    forbiddenTokens: [
      "(mẫu BM-168)",
      "QĐ trả hồ sơ vụ án để điều tra lại",
      "để điều tra lại",
      "Trần Văn Bình",
    ],
    // BM-168 semantic assertion: date/time handover fields exist in
    // source-aligned order (started-at before ended-at).
    startedAtFieldKey: "caseFileHandover.startedAtLine",
    endedAtFieldKey: "caseFileHandover.endedAtLine",
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

test.describe("BM-166/168 — authenticated desktop QA", () => {
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

test.describe("BM-166/168 — authenticated mobile QA", () => {
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

test.describe("BM-166/168 — semantic/format distinction", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1440, height: 900 } });

  test("BM-166 decision-number field is editable and carries QĐ suffix, no TB suffix regression", async ({
    page,
  }) => {
    const form = FORMS[0];
    await page.goto("/templates/BM-166", { waitUntil: "load" });
    await expect(page.locator(`text=${form.heading}`).first()).toBeVisible({
      timeout: 10000,
    });
    const compiled = COMPILED_BY_CODE[form.code];
    const decisionField = compiled.source.fields.find(
      (f) => f.key === form.decisionNumberFieldKey,
    );
    if (!decisionField) throw new Error("decision-number field not found in compiled contract");
    const handle = page.locator(fieldSelector(decisionField.id));
    await expect(handle).toBeVisible();
    await expect(handle).toBeEditable();
    // Standalone template preview starts with an empty value (no case-bound
    // data); the QĐ-suffix convention is only carried via the placeholder
    // hint, not a pre-filled value. Assert on the placeholder, and confirm
    // the field starts empty (never a pre-baked hardcoded value).
    const initialValue = await handle.inputValue();
    expect(initialValue).toBe("");
    const placeholderText = await handle.getAttribute("placeholder");
    expect(placeholderText).not.toBeNull();
    expect(form.decisionNumberFormatRegex.test(placeholderText ?? "")).toBe(true);
    expect(form.decisionNumberForbiddenSuffix.test(placeholderText ?? "")).toBe(false);
    // Verify user can still edit freely.
    await handle.fill("77/QĐ-VKS-test");
    await expect(handle).toHaveValue("77/QĐ-VKS-test");
  });

  test("BM-168 date/time handover controls appear in source-aligned order (start before end)", async ({
    page,
  }) => {
    const form = FORMS[1];
    await page.goto("/templates/BM-168", { waitUntil: "load" });
    await expect(page.locator(`text=${form.heading}`).first()).toBeVisible({
      timeout: 10000,
    });
    const compiled = COMPILED_BY_CODE[form.code];
    const startedField = compiled.source.fields.find(
      (f) => f.key === form.startedAtFieldKey,
    );
    const endedField = compiled.source.fields.find(
      (f) => f.key === form.endedAtFieldKey,
    );
    if (!startedField) throw new Error("startedAtLine field not found in compiled contract");
    if (!endedField) throw new Error("endedAtLine field not found in compiled contract");
    const startedHandle = page.locator(fieldSelector(startedField.id));
    const endedHandle = page.locator(fieldSelector(endedField.id));
    await expect(startedHandle).toBeVisible();
    await expect(endedHandle).toBeVisible();
    const startedBox = await startedHandle.boundingBox();
    const endedBox = await endedHandle.boundingBox();
    expect(startedBox).not.toBeNull();
    expect(endedBox).not.toBeNull();
    // Source procedure: handover starts before it ends (P0007-P0012 < P0024-P0028).
    expect(startedBox!.y).toBeLessThanOrEqual(endedBox!.y);
  });
});
