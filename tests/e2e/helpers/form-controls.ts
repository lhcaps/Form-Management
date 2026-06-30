import { expect, type Page } from "@playwright/test";

function valueForInputType(type: string, marker: string, index: number) {
  switch (type) {
    case "date":
      return "2026-06-30";
    case "datetime-local":
      return "2026-06-30T09:30";
    case "month":
      return "2026-06";
    case "number":
      return "1";
    case "time":
      return "09:30";
    default:
      return `${marker} ${index + 1}`;
  }
}

export async function fillVisibleDocumentFormControls(
  page: Page,
  marker: string,
) {
  let filled = 0;
  const inputs = page.locator(
    [
      'main textarea',
      'main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"])',
    ].join(","),
  );
  await expect(inputs.first()).toBeVisible({ timeout: 20_000 });

  for (let index = 0; index < (await inputs.count()); index += 1) {
    const control = inputs.nth(index);
    if (!(await control.isVisible()) || !(await control.isEnabled())) {
      continue;
    }
    const tagName = await control.evaluate((element) =>
      element.tagName.toLowerCase(),
    );
    const inputType =
      tagName === "textarea"
        ? "text"
        : ((await control.getAttribute("type")) ?? "text").toLowerCase();

    await control.fill(valueForInputType(inputType, marker, index));
    filled += 1;
  }

  const selects = page.locator("main select");
  for (let index = 0; index < (await selects.count()); index += 1) {
    const select = selects.nth(index);
    if (!(await select.isVisible()) || !(await select.isEnabled())) {
      continue;
    }
    const optionValues = await select.locator("option").evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0),
    );
    if (optionValues[0]) {
      await select.selectOption(optionValues[0]);
      filled += 1;
    }
  }

  expect(filled, "expected at least one editable form control").toBeGreaterThan(
    0,
  );
  return filled;
}

export async function expectAnyControlValueContains(page: Page, marker: string) {
  await expect
    .poll(
      async () =>
        page.locator("main input, main textarea").evaluateAll(
          (controls, expectedMarker) =>
            controls.some((control) =>
              String(
                (control as HTMLInputElement | HTMLTextAreaElement).value ?? "",
              ).includes(String(expectedMarker)),
            ),
          marker,
        ),
      {
        message: `expected at least one persisted control value to contain ${marker}`,
        timeout: 20_000,
      },
    )
    .toBe(true);
}
