/**
 * Authenticated route and responsive QA for the standalone BM-131,
 * BM-132, and BM-133 templates — re-appraisal/re-valuation procedural
 * family.
 *
 * BM-131 = Yêu cầu định giá lại tài sản (request letter, /YC-VKS).
 * BM-132 = QĐ định giá lại tài sản trong trường hợp đặc biệt
 *          (decision, /QĐ-VKS, VKSTC).
 * BM-133 = QĐ giám định lại trong trường hợp đặc biệt
 *          (decision, /QĐ-VKS, VKSTC).
 *
 * The three forms share the re-appraisal/re-valuation procedural
 * domain (Điều 211/212/214/218/220 BLTTHS) but each form is a
 * DISTINCT document type:
 *   - BM-131 = REQUEST (Yêu cầu, /YC-VKS)
 *   - BM-132 = DECISION (Quyết định, /QĐ-VKS, định giá lại)
 *   - BM-133 = DECISION (Quyết định, /QĐ-VKS, giám định lại)
 *
 * Family boundary: BM-134 ("BB ghi lời khai") and BM-135 ("BB hỏi
 * cung bị can") belong to a DIFFERENT family (Điều 183-186 BLTTHS)
 * and are NOT included in this batch even though they are the next
 * two codes in numeric order.
 *
 * Cardinality invariants:
 *   - Total rendered compiled controls must equal the compiled field
 *     count (BM-131 = 6, BM-132 = 3, BM-133 = 5).
 *   - No presentation field may render outside the compiled set; the
 *     same compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *
 * Existing invariants retained:
 *   - Route stays on /templates/BM-NNN.
 *   - No redirect to /documents.
 *   - No /api/v1/documents POST/PUT/PATCH/DELETE request.
 *   - No fatal console / page errors.
 *   - No horizontal overflow at desktop 1440×900 or mobile 390×844.
 *   - Document-type prefix renders: BM-131 = /YC-VKS, BM-132 = /QĐ-VKS,
 *     BM-133 = /QĐ-VKS.
 *
 * Uses existing storageState from `pnpm test:e2e:auth`; never calls
 * /api/v1/documents POST/PUT/PATCH/DELETE; never navigates to /documents
 * from /templates/BM-NNN.
 */

import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DOCUMENT_WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type FamilySpec = {
  code: 'BM-131' | 'BM-132' | 'BM-133';
  fields: number;
  documentTypeLabel: string;
  demoNumberRegex: RegExp;
};

const FAMILY: FamilySpec[] = [
  {
    code: 'BM-131',
    fields: 6,
    documentTypeLabel: 'Yêu cầu định giá lại tài sản',
    demoNumberRegex: /\/YC-VKS/iu,
  },
  {
    code: 'BM-132',
    fields: 3,
    documentTypeLabel: 'QĐ định giá lại tài sản trong trường hợp đặc biệt',
    demoNumberRegex: /\/QĐ-VKS/iu,
  },
  {
    code: 'BM-133',
    fields: 5,
    documentTypeLabel: 'QĐ giám định lại trong trường hợp đặc biệt',
    demoNumberRegex: /\/QĐ-VKS/iu,
  },
];

type CompiledContract = {
  templateCode: string;
  source: {
    sections: Array<{ id: string }>;
    fields: Array<{ id: string; key: string }>;
  };
};

function loadCompiledContract(code: FamilySpec['code']): CompiledContract {
  const path = resolve(
    process.cwd(),
    'docs/audit/docx/compiled-v2',
    `${code}.compiled.json`,
  );
  return JSON.parse(readFileSync(path, 'utf8')) as CompiledContract;
}

const COMPILED_BY_CODE: Record<FamilySpec['code'], CompiledContract> = {
  'BM-131': loadCompiledContract('BM-131'),
  'BM-132': loadCompiledContract('BM-132'),
  'BM-133': loadCompiledContract('BM-133'),
};

function fieldSelector(fieldId: string): string {
  return `#contract-field-${fieldId}`;
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

  page.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('request', (request) => {
    if (
      DOCUMENT_WRITE_METHODS.has(request.method()) &&
      /\/api\/v1\/documents(?:\/|\?|$)/iu.test(request.url())
    ) {
      evidence.documentWrites.push(`${request.method()} ${request.url()}`);
    }
  });

  return evidence;
}

async function openFamilyForm(
  page: Page,
  width: number,
  height: number,
  spec: FamilySpec,
): Promise<BrowserEvidence> {
  const evidence = collectBrowserEvidence(page);
  await page.setViewportSize({ width, height });
  await page.goto(`/templates/${spec.code}`, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(`/templates/${spec.code}`);
  await expect(page).not.toHaveURL(/\/documents/iu);
  return evidence;
}

for (const spec of FAMILY) {
  const compiled = COMPILED_BY_CODE[spec.code];
  const compiledFieldIds = compiled.source.fields.map((field) => field.id);
  const compiledFieldKeys = compiled.source.fields.map((field) => field.key);

  test(`${spec.code} authenticated route stays on /templates`, async ({ page }) => {
    const evidence = await openFamilyForm(page, 1440, 900, spec);

    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });
    const compiledControls = page.locator('[id^="contract-field-"]');
    const renderedCount = await compiledControls.count();
    expect(
      renderedCount,
      `${spec.code} total rendered compiled controls must equal compiled field count`,
    ).toBe(spec.fields);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const fatalConsoleErrors = evidence.consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('chunk'),
    );
    expect(fatalConsoleErrors, `${spec.code} console errors`).toHaveLength(0);
    expect(evidence.pageErrors, `${spec.code} page errors`).toHaveLength(0);
    expect(
      evidence.documentWrites,
      `${spec.code} must not write /api/v1/documents`,
    ).toHaveLength(0);
  });

  test(`${spec.code} renders every compiled field exactly once`, async ({ page }) => {
    await openFamilyForm(page, 1440, 900, spec);
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    for (const fieldId of compiledFieldIds) {
      const control = page.locator(fieldSelector(fieldId));
      await expect(
        control,
        `${spec.code} compiled field id ${fieldId} must render exactly once`,
      ).toHaveCount(1);
      await expect(
        control,
        `${spec.code} compiled field id ${fieldId} must be editable`,
      ).toBeEditable();
    }

    const renderedFieldIds = await page.evaluate(() => {
      const re = /^contract-field-(.+)$/u;
      return Array.from(document.querySelectorAll('[id]'))
        .map((node) => node.id)
        .filter((id) => re.test(id))
        .map((id) => re.exec(id)?.[1])
        .filter((id): id is string => Boolean(id));
    });
    const renderedSet = new Set(renderedFieldIds);
    const compiledSet = new Set(compiledFieldIds);
    const outsideCompiled = renderedFieldIds.filter((id) => !compiledSet.has(id));
    const missingFromRendered = compiledFieldIds.filter((id) => !renderedSet.has(id));
    expect(
      outsideCompiled,
      `${spec.code} rendered presentation fields outside compiled contract`,
    ).toEqual([]);
    expect(
      missingFromRendered,
      `${spec.code} compiled fields missing from rendered DOM`,
    ).toEqual([]);

    expect(compiledFieldKeys).toHaveLength(spec.fields);
    expect(new Set(compiledFieldKeys).size).toBe(spec.fields);
  });

  test(`${spec.code} renders the curated document-type label and prefix`, async ({ page }) => {
    await openFamilyForm(page, 1440, 900, spec);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: spec.documentTypeLabel,
        exact: true,
      }),
    ).toBeVisible();
    const pageHtml = await page.content();
    expect(
      spec.demoNumberRegex.test(pageHtml),
      `${spec.code} demo number must carry ${spec.demoNumberRegex} prefix`,
    ).toBe(true);
  });

  test(`${spec.code} responsive — desktop 1440×900`, async ({ page }) => {
    await openFamilyForm(page, 1440, 900, spec);
    const overflow = await page.locator('body').evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(overflow, `${spec.code} desktop no horizontal overflow`).toBe(false);
  });

  test(`${spec.code} responsive — mobile 390×844`, async ({ page }) => {
    await openFamilyForm(page, 390, 844, spec);
    const overflow = await page.locator('body').evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(overflow, `${spec.code} mobile no horizontal overflow`).toBe(false);
  });
}
