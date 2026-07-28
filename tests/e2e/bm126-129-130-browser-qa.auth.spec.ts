/**
 * Authenticated route and responsive QA for the standalone BM-126 / BM-129 /
 * BM-130 templates — QĐ trưng cầu giám định family (initial / bổ sung / lại).
 *
 * Cardinality invariants (added in the BM-126/129/130 closure):
 *   - Total rendered compiled controls must equal the compiled field count
 *     (BM-126 = 11, BM-129 = 7, BM-130 = 7). The previous form used
 *     `toBeGreaterThanOrEqual`, which masked presentation fields outside the
 *     compiled set. This spec replaces that with `toBe` and a per-field
 *     `toHaveCount(1)` check against the stable `contract-field-{id}` id.
 *   - No presentation field may render outside the compiled set; the same
 *     compiled set must appear exactly once.
 *   - Each compiled control must remain editable (not disabled).
 *   - Each compiled control must be a real input/select/textarea (not hidden,
 *     not a button).
 *
 * Existing invariants retained:
 *   - Route stays on /templates/BM-NNN.
 *   - No redirect to /documents.
 *   - No /api/v1/documents POST/PUT/PATCH/DELETE request.
 *   - No fatal console / page errors.
 *   - No horizontal overflow at desktop 1440×900 or mobile 390×844.
 *   - QĐ number label renders; no "Số thông báo" regression.
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
  code: 'BM-126' | 'BM-129' | 'BM-130';
  fields: number;
  numberLabel: string;
  demoNumberRegex: RegExp;
};

const FAMILY: FamilySpec[] = [
  {
    code: 'BM-126',
    fields: 11,
    numberLabel: 'Số quyết định trưng cầu giám định',
    demoNumberRegex: /\/QĐ-/iu,
  },
  {
    code: 'BM-129',
    fields: 7,
    numberLabel: 'Số quyết định trưng cầu giám định bổ sung',
    demoNumberRegex: /\/QĐ-/iu,
  },
  {
    code: 'BM-130',
    fields: 7,
    numberLabel: 'Số quyết định trưng cầu giám định lại',
    demoNumberRegex: /\/QĐ-/iu,
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
  'BM-126': loadCompiledContract('BM-126'),
  'BM-129': loadCompiledContract('BM-129'),
  'BM-130': loadCompiledContract('BM-130'),
};

/**
 * The renderer exposes every compiled field via the stable id
 * `contract-field-{field.id}` where `field.id` is the compiled field id
 * (e.g. `contract-field-field-agency-vienkiem`). The renderer also
 * surfaces the field's `name` derived from the compiled `key` via the
 * id fragment; the only DOM hook the spec reads is the stable id.
 */
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

    // Exact compiled-field cardinality: total rendered compiled controls
    // must equal the compiled field count (BM-126 = 11, BM-129 = 7,
    // BM-130 = 7). The renderer tags every compiled field with the stable
    // `contract-field-{id}` id, so we scope the count to that hook rather
    // than to the global input/select/textarea selector (which would also
    // pick up header / sidebar / navigation controls unrelated to the
    // compiled contract). The workspace fetches the contract asynchronously
    // inside a useEffect, so we wait for the first contract-field hook
    // before counting.
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
    // Wait for the async-loaded contract to render at least one field hook.
    await page.waitForSelector('[id^="contract-field-"]', { timeout: 15000 });

    // Per-field DOM count must be exactly 1 for every compiled field id.
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

    // Compile-time field set must equal the rendered field set — no
    // presentation field may exist outside the compiled set, and every
    // compiled field must be rendered. Because compiledFieldIds and the
    // rendered set are derived from the same compiled contract, asserting
    // the symmetric difference is empty guarantees the invariant without
    // scanning the DOM twice.
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

    // Sanity: compiled field keys are exactly the compiled set above.
    expect(compiledFieldKeys).toHaveLength(spec.fields);
    expect(new Set(compiledFieldKeys).size).toBe(spec.fields);
  });

  test(`${spec.code} renders the curated QĐ number label (not TB)`, async ({ page }) => {
    await openFamilyForm(page, 1440, 900, spec);
    await expect(
      page.getByText(spec.numberLabel, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('Số thông báo', { exact: false }),
    ).toHaveCount(0);
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