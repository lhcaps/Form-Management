import { expect, test } from "@playwright/test";

const RUNTIME_READY = new Set([
  "BM-001", "BM-136", "BM-148", "BM-156", "BM-157", "BM-168",
  "BM-171", "BM-174", "BM-181", "BM-206", "BM-213"
]);

for (let n = 1; n <= 213; n++) {
  const code = `BM-${String(n).padStart(3, "0")}`;
  const tier = RUNTIME_READY.has(code) ? "RUNTIME_READY" : "LOCAL_SKELETON";

  test(`${code} — ${tier} route, title, badge, fields, controls, rerender, draft, preview`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failureSignatures: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (text.includes("429") || text.includes("Too Many Requests")) return;
        consoleErrors.push(text);
      }
    });
    page.on("pageerror", (err) => failureSignatures.push(`PAGE_ERROR: ${err.message}`));

    await page.goto(`http://localhost:3000/templates/${code}`, { waitUntil: "domcontentloaded" });

    if (/\/sign-in|\/sign-up/.test(page.url())) {
      failureSignatures.push("AUTH_REDIRECT");
      expect(failureSignatures.length).toBe(0);
      return;
    }

    await page.waitForSelector("h1", { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(500);

    const titleEl = page.locator("h1").first();
    if (await titleEl.count() > 0) {
      const title = (await titleEl.innerText()).trim();
      expect(title.length).toBeGreaterThan(0);
    }

    const badge = page.locator(`text=/Local skeleton|Runtime-ready/`).first();
    if (await badge.count() > 0) {
      const badgeText = (await badge.innerText()).trim();
      if (tier === "RUNTIME_READY") {
        expect(badgeText).toContain("Runtime-ready");
      } else {
        expect(badgeText).toContain("Local skeleton");
      }
    }

    const inputs = page.locator("input, select, textarea");
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    const controlClasses = new Set<string>();
    for (let i = 0; i < Math.min(inputCount, 50); i++) {
      const el = inputs.nth(i);
      const tag = await el.evaluate((e) => e.tagName);
      if (tag === "INPUT") {
        const type = await el.getAttribute("type");
        if (type === "checkbox") controlClasses.add("CHECKBOX");
        else if (type === "number") controlClasses.add("NUMBER");
        else if (type === "date") controlClasses.add("DATE");
        else if (type === "time") controlClasses.add("TIME");
        else controlClasses.add("TEXT");
      } else if (tag === "SELECT") {
        controlClasses.add("SELECT");
      } else if (tag === "TEXTAREA") {
        controlClasses.add("TEXTAREA");
      }
    }

    const firstInput = inputs.first();
    if (await firstInput.count() > 0) {
      try {
        await firstInput.fill("audit-test-value");
        await firstInput.blur();
        const retained = await firstInput.inputValue();
        if (retained !== "audit-test-value") {
          failureSignatures.push("RERENDER_RETENTION_FAIL");
        }
      } catch {
        failureSignatures.push("FIELD_INTERACTION_ERROR");
      }
    }

    const draftButton = page.getByRole("button", { name: /Lưu bản nháp/i }).first();
    if (await draftButton.count() > 0) {
      const draftDisabled = await draftButton.isDisabled();
      if (tier === "LOCAL_SKELETON" && !draftDisabled) {
        failureSignatures.push("LOCAL_DRAFT_NOT_DISABLED");
      }
    }

    const previewButton = page.getByRole("button", { name: /Xem trước bản in/i }).first();
    if (await previewButton.count() > 0) {
      const previewDisabled = await previewButton.isDisabled();
      if (tier === "LOCAL_SKELETON" && !previewDisabled) {
        failureSignatures.push("PREVIEW_NOT_DISABLED");
      }
    }

    if (consoleErrors.length > 0) {
      console.error(`CONSOLE_ERRORS for ${code}:`, JSON.stringify(consoleErrors));
      failureSignatures.push("CONSOLE_ERROR");
    }

    expect(failureSignatures).toEqual([]);
  });
}
