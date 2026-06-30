#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import PizZip from "pizzip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const OUTPUT_DIR = join(
  PROJECT_ROOT,
  "docs",
  "audit",
  "website-requirement-acceptance-v1",
);
const OUTPUT_PATH = join(OUTPUT_DIR, "workflow-e2e.latest.json");

const APP_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const COOKIE_NAME = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";
const TEMPLATE_CODE = process.env.E2E_WORKFLOW_TEMPLATE_CODE ?? "BM-004";
const CASE_CODE = process.env.E2E_WORKFLOW_CASE_CODE ?? "VKS-2026-0001";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSessionCookie(setCookie) {
  const match = String(setCookie ?? "").match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`),
  );
  return match?.[1] ?? null;
}

async function loginWithRetry() {
  let lastError = "";

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (response.ok) {
      const sessionToken = parseSessionCookie(response.headers.get("set-cookie"));
      if (!sessionToken) {
        throw new Error("Login API did not return a qlv_session cookie.");
      }
      return sessionToken;
    }

    const text = await response.text().catch(() => "");
    lastError = `HTTP ${response.status} ${text.slice(0, 300)}`;

    if (![429, 502, 503, 504].includes(response.status) || attempt === 6) {
      break;
    }

    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const fallbackDelay = 1_500 * 2 ** (attempt - 1);
    await sleep(Math.max(retryAfter * 1_000, fallbackDelay));
  }

  throw new Error(`Could not authenticate workflow audit user: ${lastError}`);
}

async function fillVisibleFormControls(page, marker) {
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
    if (!(await control.isVisible()) || !(await control.isEnabled())) continue;
    const tagName = await control.evaluate((element) =>
      element.tagName.toLowerCase(),
    );
    const inputType =
      tagName === "textarea"
        ? "text"
        : ((await control.getAttribute("type")) ?? "text").toLowerCase();
    const value =
      inputType === "date"
        ? "2026-06-30"
        : inputType === "datetime-local"
          ? "2026-06-30T09:30"
          : inputType === "month"
            ? "2026-06"
            : inputType === "number"
              ? "1"
              : inputType === "time"
                ? "09:30"
                : `${marker}-${index + 1}`;

    await control.fill(value);
    filled += 1;
  }

  const selects = page.locator("main select");
  for (let index = 0; index < (await selects.count()); index += 1) {
    const select = selects.nth(index);
    if (!(await select.isVisible()) || !(await select.isEnabled())) continue;
    const optionValues = await select.locator("option").evaluateAll((options) =>
      options
        .map((option) => option.value)
        .filter((value) => value.length > 0),
    );
    if (optionValues[0]) {
      await select.selectOption(optionValues[0]);
      filled += 1;
    }
  }

  if (filled === 0) {
    throw new Error("No editable form controls were found.");
  }

  return filled;
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function inspectDocx(filePath, marker) {
  const zip = new PizZip(readFileSync(filePath));
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) {
    throw new Error(`DOCX ${filePath} does not contain word/document.xml.`);
  }

  const text = decodeXmlEntities(
    documentXml
      .replace(/<w:tab\s*\/>/gu, "\t")
      .replace(/<\/w:p>/gu, "\n")
      .replace(/<[^>]+>/gu, ""),
  );
  const unresolvedPlaceholders = text.match(/\{\{[^}]+\}\}/gu) ?? [];
  const genericBlankLabels = text.match(/Ô trống|O trong|Chỗ trống/giu) ?? [];

  return {
    filePath,
    hasUnresolvedPlaceholders: unresolvedPlaceholders.length > 0,
    unresolvedPlaceholderCount: unresolvedPlaceholders.length,
    unresolvedPlaceholderSamples: unresolvedPlaceholders.slice(0, 10),
    hasGenericBlankLabels: genericBlankLabels.length > 0,
    genericBlankLabelCount: genericBlankLabels.length,
    containsUserEnteredValue: text.includes(marker),
    userEnteredMarker: marker,
    textSample: text.replace(/\s+/gu, " ").trim().slice(0, 500),
  };
}

async function run() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const evidence = {
    schemaVersion: 1,
    status: "FAIL",
    startedAt: new Date().toISOString(),
    completedAt: null,
    appBaseUrl: APP_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    workflow: {
      templateCode: TEMPLATE_CODE,
      caseCode: CASE_CODE,
      selectedCaseLabel: null,
      documentId: null,
      filledControlCount: 0,
      saved: false,
      exported: false,
    },
    exportedDocx: null,
    apiErrors: [],
    apiFailures: [],
    consoleErrors: [],
    pageErrors: [],
    currentUrl: null,
    visibleTextSample: "",
    failureScreenshotPath: null,
    errors: [],
  };

  let browser;
  let page;
  try {
    const sessionToken = await loginWithRetry();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      baseURL: APP_BASE_URL,
      acceptDownloads: true,
    });
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: sessionToken,
        url: APP_BASE_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    page = await context.newPage();
    page.on("popup", (popup) => void popup.close().catch(() => {}));
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() >= 400) {
        evidence.apiFailures.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        );
      }
      if (response.url().includes("/api/") && response.status() >= 500) {
        evidence.apiErrors.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        );
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        evidence.consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => evidence.pageErrors.push(error.message));

    await page.goto("/documents", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Biểu mẫu trong DB")).toBeVisible({
      timeout: 15_000,
    });

    const card = page
      .locator("article")
      .filter({ hasText: TEMPLATE_CODE })
      .filter({ hasNotText: "Điểm phù hợp" });
    await expect(card).toHaveCount(1);
    await card.getByRole("button", { name: "Mở biểu mẫu" }).click();

    const caseDialog = page.getByRole("dialog");
    if (await caseDialog.isVisible()) {
      await expect(caseDialog.getByText("Chọn hồ sơ để mở biểu mẫu")).toBeVisible();
      const caseButtons = caseDialog.locator("ul button");
      await expect(caseButtons.first()).toBeVisible({ timeout: 15_000 });
      const preferredCase = caseDialog.getByRole("button", {
        name: new RegExp(CASE_CODE, "u"),
      });
      const chosenCase =
        (await preferredCase.count()) > 0 ? preferredCase.first() : caseButtons.first();
      evidence.workflow.selectedCaseLabel = await chosenCase.innerText();
      await chosenCase.click();
    }

    await expect(page).toHaveURL(/\/documents\/\d+$/u, { timeout: 30_000 });
    const documentId = page.url().match(/\/documents\/(\d+)$/u)?.[1] ?? null;
    evidence.workflow.documentId = documentId;
    if (!documentId) {
      throw new Error(`Could not extract document id from URL ${page.url()}.`);
    }

    await expect(page.getByText(TEMPLATE_CODE).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/Contract runtime|Form dữ liệu chung/u),
    ).toBeVisible({ timeout: 15_000 });

    const marker = `E2EWORKFLOW${Date.now()}`;
    evidence.workflow.filledControlCount = await fillVisibleFormControls(
      page,
      marker,
    );
    await page.getByRole("button", { name: /Lưu dữ liệu/u }).last().click();
    await expect(
      page.getByText(
        /Đã lưu dữ liệu biểu mẫu|Đã lưu thành công|Đã lưu theo published contract/u,
      ),
    ).toBeVisible({ timeout: 20_000 });
    evidence.workflow.saved = true;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(TEMPLATE_CODE).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("main input, main textarea").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect
      .poll(
        async () =>
          page.locator("main input, main textarea").evaluateAll(
            (controls, expectedMarker) =>
              controls.some((control) =>
                String(control.value ?? "").includes(String(expectedMarker)),
              ),
            marker,
          ),
        {
          message: "Saved form value was not visible after reload.",
          timeout: 20_000,
        },
      )
      .toBe(true);

    await page.getByRole("button", { name: "Tệp đã xuất" }).click();
    await expect(page.getByText("Tùy chỉnh trước khi xuất").first()).toBeVisible({
      timeout: 20_000,
    });

    const renderResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/generated/${documentId}/render-docx`) &&
        response.request().method() === "POST",
      { timeout: 120_000 },
    );
    await page.getByRole("button", { name: "Xuất Word" }).click();
    const renderResponse = await renderResponsePromise;
    const renderBody = await renderResponse.json().catch(() => ({}));
    if (!renderResponse.ok()) {
      throw new Error(
        `DOCX export failed: HTTP ${renderResponse.status()} ${JSON.stringify(renderBody).slice(0, 500)}`,
      );
    }
    evidence.workflow.exported = true;

    const filePath = renderBody?.file?.filePath;
    if (!filePath) {
      throw new Error(
        `DOCX export did not return file.filePath: ${JSON.stringify(renderBody).slice(0, 500)}`,
      );
    }

    evidence.workflow.exportedFile = {
      id: renderBody.file.id ?? null,
      fileName: renderBody.file.fileName ?? null,
      filePath,
      fileSizeBytes: renderBody.file.fileSizeBytes ?? null,
    };
    evidence.exportedDocx = inspectDocx(filePath, marker);

    const docxClean =
      evidence.exportedDocx.hasUnresolvedPlaceholders === false &&
      evidence.exportedDocx.hasGenericBlankLabels === false &&
      evidence.exportedDocx.containsUserEnteredValue === true;
    const consoleClean = evidence.consoleErrors.every(
      (entry) =>
        !entry.includes("DevTools") && !entry.toLowerCase().includes("hydration"),
    );

    if (
      !docxClean ||
      evidence.apiFailures.length > 0 ||
      evidence.apiErrors.length > 0 ||
      evidence.pageErrors.length > 0 ||
      !consoleClean
    ) {
      throw new Error("Workflow completed but exported DOCX/browser evidence is not clean.");
    }

    evidence.status = "PASS";
  } catch (error) {
    evidence.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    evidence.completedAt = new Date().toISOString();
    if (page) {
      evidence.currentUrl = page.url();
      evidence.visibleTextSample = await page
        .locator("body")
        .innerText({ timeout: 2_000 })
        .then((text) => text.replace(/\s+/gu, " ").trim().slice(0, 1200))
        .catch(() => "");
      if (evidence.status !== "PASS") {
        const screenshotPath = join(OUTPUT_DIR, "workflow-e2e.failed.png");
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        evidence.failureScreenshotPath = screenshotPath;
      }
    }
    if (browser) {
      await browser.close();
    }
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf-8");
  }

  if (evidence.status !== "PASS") {
    console.error(`Workflow E2E failed. Evidence: ${OUTPUT_PATH}`);
    console.error(evidence.errors.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Workflow E2E PASS. Evidence: ${OUTPUT_PATH}`);
}

await run();
