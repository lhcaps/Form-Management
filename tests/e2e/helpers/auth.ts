import { expect, type Page } from "@playwright/test";

const APP_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? "http://localhost:3001/api/v1";
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const COOKIE_NAME = process.env.E2E_AUTH_COOKIE_NAME ?? "qlv_session";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSessionCookie(setCookieValues: string[]) {
  for (const value of setCookieValues) {
    const match = value.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function authenticateAsAdmin(page: Page) {
  let lastError = "";

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: USERNAME,
        password: PASSWORD,
      },
      failOnStatusCode: false,
      timeout: 30_000,
    });

    if (response.ok()) {
      const setCookieValues = response
        .headersArray()
        .filter((header) => header.name.toLowerCase() === "set-cookie")
        .map((header) => header.value);
      const sessionToken = parseSessionCookie(setCookieValues);

      if (!sessionToken) {
        throw new Error("Login API did not return a qlv_session cookie.");
      }

      await page.context().addCookies([
        {
          name: COOKIE_NAME,
          value: sessionToken,
          url: APP_BASE_URL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/login/u, { timeout: 15_000 });
      return;
    }

    const body = await response.text().catch(() => "");
    lastError = `HTTP ${response.status()} ${body.slice(0, 300)}`;

    if (![429, 502, 503, 504].includes(response.status()) || attempt === 6) {
      break;
    }

    const retryAfter = Number(response.headers()["retry-after"] ?? 0);
    const fallbackDelay = 1_500 * 2 ** (attempt - 1);
    await sleep(Math.max(retryAfter * 1_000, fallbackDelay));
  }

  throw new Error(`Could not authenticate E2E admin user: ${lastError}`);
}
