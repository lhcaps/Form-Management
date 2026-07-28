import { expect, test } from "@playwright/test";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const RUNTIME_READY = new Set([
  "BM-001", "BM-136", "BM-148", "BM-156", "BM-157", "BM-168",
  "BM-171", "BM-174", "BM-181", "BM-206", "BM-213"
]);

const BATCH_SIZE = 15;
const OUT_PATH = join(__dirname, "..", "..", "docs", "audit", "final-213-customer-ready", "local-usability", "browser-213-matrix.json");

async function auditForm(page: PlaywrightTest.Page, code: string) {
  const tier = RUNTIME_READY.has(code) ? "RUNTIME_READY" : "LOCAL_SKELETON";
  const formErrors: string[] = [];

  try {
    await page.goto(`http://localhost:3000/templates/${code}`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    if (/\/sign-in|\/sign-up/.test(page.url())) {
      formErrors.push("AUTH_REDIRECT");
      return { FORM: code, TIER: tier, VERDICT: "FAIL", FAILURES: formErrors };
    }

    await page.waitForSelector("h1", { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(200);

    const titleEl = page.locator("h1").first();
    if (await titleEl.count() > 0) {
      const title = (await titleEl.innerText()).trim();
      if (title.length === 0) formErrors.push("MISSING_TITLE");
    }

    const badge = page.locator(`text=/Local skeleton|Runtime-ready|Đã đăng ký/`).first();
    if (await badge.count() > 0) {
      const badgeText = (await badge.innerText()).trim();
      if (tier === "RUNTIME_READY" && !badgeText.includes("Runtime-ready")) {
        formErrors.push("BADGE_MISMATCH");
      }
    }

    const inputs = page.locator("input, select, textarea");
    const inputCount = await inputs.count();
    if (inputCount === 0) {
      formErrors.push("NO_FIELDS_RENDERED");
    }

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
          formErrors.push("RERENDER_RETENTION_FAIL");
        }
      } catch {
        formErrors.push("FIELD_INTERACTION_ERROR");
      }
    }

    const draftButton = page.getByRole("button", { name: /Lưu bản nháp/i }).first();
    if (await draftButton.count() > 0) {
      const draftDisabled = await draftButton.isDisabled();
      if (tier === "LOCAL_SKELETON" && !draftDisabled) {
        formErrors.push("LOCAL_DRAFT_NOT_DISABLED");
      }
    }

    const previewButton = page.getByRole("button", { name: /Xem trước bản in/i }).first();
    if (await previewButton.count() > 0) {
      const previewDisabled = await previewButton.isDisabled();
      if (tier === "LOCAL_SKELETON" && !previewDisabled) {
        formErrors.push("PREVIEW_NOT_DISABLED");
      }
    }

    return {
      FORM: code,
      TIER: tier,
      FIELD_COUNT: inputCount,
      CONTROL_CLASSES: Array.from(controlClasses),
      VERDICT: formErrors.length === 0 ? "PASS" : "FAIL",
      FAILURES: formErrors,
    };
  } catch (err) {
    formErrors.push(`BROWSER_ERROR: ${err.message}`);
    return { FORM: code, TIER: tier, VERDICT: "FAIL", FAILURES: formErrors };
  }
}

for (let start = 1; start <= 213; start += BATCH_SIZE) {
  const end = Math.min(start + BATCH_SIZE - 1, 213);
  test(`browser audit BM-${String(start).padStart(3, "0")} to BM-${String(end).padStart(3, "0")}`, async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("429") && !text.includes("Too Many Requests")) {
          console.log(`[console] ${text}`);
        }
      }
    });
    page.on("pageerror", (err) => console.log(`[pageerror] ${err.message}`));

    const results: any[] = [];
    for (let n = start; n <= end; n++) {
      const code = `BM-${String(n).padStart(3, "0")}`;
      const result = await auditForm(page, code);
      results.push(result);
      if (result.VERDICT === "FAIL") {
        console.log(`  ${result.FORM}: ${result.FAILURES.join(", ")}`);
      }
    }

    const pass = results.filter(r => r.VERDICT === "PASS").length;
    const fail = results.filter(r => r.VERDICT === "FAIL").length;
    console.log(`BATCH ${start}-${end}: ${pass} PASS, ${fail} FAIL`);

    const existingRaw = await readFile(OUT_PATH, "utf-8").catch(() => "[]");
    const existing = JSON.parse(existingRaw);
    await mkdir(join(__dirname, "..", "..", "docs", "audit", "final-213-customer-ready", "local-usability"), { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify([...existing, ...results], null, 2));

    expect(fail).toBe(0);
  }, 180_000);
}
