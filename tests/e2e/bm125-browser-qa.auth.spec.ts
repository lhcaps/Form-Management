/** Authenticated route and responsive QA for the standalone BM-125 template. */

import { expect, test, type Page } from '@playwright/test';

const TEMPLATE_ROUTE = '/templates/BM-125';
const FIELD_LABELS = [
  'Viện kiểm sát ban hành thông báo',
  'Số thông báo',
  'Địa danh',
  'Ngày ban hành',
  'Dòng địa danh',
] as const;
const LOCALITY_DATE_FIELDS = [
  { label: 'Địa danh', placeholder: 'Địa danh nơi đặt trụ sở Viện kiểm sát ban hành' },
  { label: 'Ngày ban hành', placeholder: 'Ngày, tháng, năm ban hành' },
  { label: 'Dòng địa danh', placeholder: 'Dòng địa danh đầy đủ của Viện kiểm sát ban hành' },
] as const;
const DOCUMENT_WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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

async function openBm125(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  const evidence = collectBrowserEvidence(page);
  await page.goto(TEMPLATE_ROUTE, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(TEMPLATE_ROUTE);
  await expect(page).not.toHaveURL(/\/documents/iu);
  return evidence;
}

async function assertFiveEditableFields(page: Page) {
  let fieldCount = 0;
  for (const label of FIELD_LABELS) {
    const control = page.getByLabel(label, { exact: true });
    await expect(control, `${label} appears exactly once`).toHaveCount(1);
    await expect(control, `${label} is editable`).toBeEditable();
    fieldCount += await control.count();
  }
  expect(fieldCount).toBe(5);
}

async function readLayout(page: Page) {
  return page.evaluate((fieldLabels) => {
    const controls = fieldLabels.map((labelText) => {
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(
        (candidate) => candidate.textContent?.trim() === labelText,
      );
      const control = label?.htmlFor
        ? document.getElementById(label.htmlFor)
        : label?.querySelector('input, select, textarea');
      if (!(label instanceof HTMLElement) || !(control instanceof HTMLElement)) {
        throw new Error(`Missing labelled control: ${labelText}`);
      }
      const labelRect = label.getBoundingClientRect();
      const controlRect = control.getBoundingClientRect();
      return {
        controlRect: {
          bottom: controlRect.bottom,
          left: controlRect.left,
          right: controlRect.right,
          top: controlRect.top,
          width: controlRect.width,
        },
        isLabelClipped:
          label.scrollWidth > label.clientWidth + 1 ||
          label.scrollHeight > label.clientHeight + 1,
        label: labelText,
        labelRect: {
          bottom: labelRect.bottom,
          left: labelRect.left,
          right: labelRect.right,
          top: labelRect.top,
        },
      };
    });

    return {
      controls,
      hasPageOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      viewportWidth: window.innerWidth,
    };
  }, [...FIELD_LABELS]);
}

function controlsOverlap(
  first: Awaited<ReturnType<typeof readLayout>>['controls'][number],
  second: Awaited<ReturnType<typeof readLayout>>['controls'][number],
) {
  const a = first.controlRect;
  const b = second.controlRect;
  return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
}

test('BM-125 authenticated desktop route and form contract', async ({ page }) => {
  const evidence = await openBm125(page, 1440, 900);

  await expect(
    page.getByRole('heading', {
      name: /Thông báo về việc không chấp nhận đề nghị trưng cầu giám định, định giá tài sản/iu,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Thông tin thông báo không chấp nhận đề nghị trưng cầu giám định\/yêu cầu định giá tài sản/iu),
  ).toBeVisible();
  await assertFiveEditableFields(page);

  await expect(page.getByText('Số quyết định', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Số thông báo', { exact: true })).toHaveCount(1);
  await expect(page.getByText(/agency\.|document\./u)).toHaveCount(0);
  await expect(page.getByText('section-thong-tin-bieu-mau', { exact: true })).toHaveCount(0);

  const documentNumber = page.getByLabel('Số thông báo', { exact: true });
  await documentNumber.fill('125/TB-VKS-QA');
  await expect(documentNumber).toHaveValue('125/TB-VKS-QA');

  for (const field of LOCALITY_DATE_FIELDS) {
    await expect(page.getByLabel(field.label, { exact: true })).toHaveAttribute(
      'placeholder',
      field.placeholder,
    );
  }

  const layout = await readLayout(page);
  expect(layout.hasPageOverflow, 'desktop has no horizontal overflow').toBe(false);
  expect(
    layout.controls.every(
      (field) =>
        field.controlRect.left >= 0 &&
        field.controlRect.right <= layout.viewportWidth + 1,
    ),
    'desktop controls stay within the viewport',
  ).toBe(true);
  expect(layout.controls.every((field) => !field.isLabelClipped)).toBe(true);
  for (let index = 0; index < layout.controls.length; index += 1) {
    for (let next = index + 1; next < layout.controls.length; next += 1) {
      expect(
        controlsOverlap(layout.controls[index], layout.controls[next]),
        `${layout.controls[index].label} does not overlap ${layout.controls[next].label}`,
      ).toBe(false);
    }
  }

  expect(evidence.documentWrites, 'standalone template makes no Documents API writes').toEqual([]);
  expect(evidence.consoleErrors, 'desktop console errors').toEqual([]);
  expect(evidence.pageErrors, 'desktop page errors').toEqual([]);
});

test('BM-125 mobile 390×844 remains single-column and ordered', async ({ page }) => {
  const evidence = await openBm125(page, 390, 844);
  await assertFiveEditableFields(page);

  const layout = await readLayout(page);
  expect(layout.hasPageOverflow, 'mobile has no horizontal overflow').toBe(false);
  expect(
    layout.controls.every(
      (field) =>
        field.controlRect.left >= 0 &&
        field.controlRect.right <= layout.viewportWidth + 1,
    ),
    'mobile controls stay within the viewport',
  ).toBe(true);
  expect(layout.controls.every((field) => !field.isLabelClipped)).toBe(true);

  const leftEdges = layout.controls.map((field) => field.controlRect.left);
  expect(Math.max(...leftEdges) - Math.min(...leftEdges), 'mobile controls share one column').toBeLessThanOrEqual(2);
  for (let index = 1; index < layout.controls.length; index += 1) {
    expect(
      layout.controls[index].controlRect.top,
      `${layout.controls[index].label} follows ${layout.controls[index - 1].label}`,
    ).toBeGreaterThan(layout.controls[index - 1].controlRect.bottom);
  }

  expect(evidence.documentWrites, 'mobile makes no Documents API writes').toEqual([]);
  expect(evidence.consoleErrors, 'mobile console errors').toEqual([]);
  expect(evidence.pageErrors, 'mobile page errors').toEqual([]);
});
