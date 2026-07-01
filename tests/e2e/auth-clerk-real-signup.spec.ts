import { expect, test, type Page } from "@playwright/test";

const RUN_REAL_CLERK_SIGNUP = process.env.CLERK_REAL_SIGNUP_E2E === "1";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_BASE_URL = "https://api.clerk.com/v1";

test.describe("Clerk real sign-up workflow", () => {
  // Skip by default - requires:
  // 1. CLERK_REAL_SIGNUP_E2E=1 env var
  // 2. Valid CLERK_SECRET_KEY
  // 3. Clerk testing token to be created and injected into browser context
  // 4. Clerk development instance to have testing mode enabled
  test.skip(
    !RUN_REAL_CLERK_SIGNUP,
    "Set CLERK_REAL_SIGNUP_E2E=1 to create and clean up a real Clerk test user.",
  );
  test.skip(
    !CLERK_SECRET_KEY,
    "CLERK_SECRET_KEY is required for Clerk cleanup.",
  );

  test("signs up with a Clerk test email and stays on the requested return_url", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const testingToken = await createTestingToken();

    // Intercept Clerk requests to inject testing token
    // Note: This requires Clerk testing mode to be enabled in the development instance
    await page.context().route("**/clerk.accounts.dev/**", async (route) => {
      const url = new URL(route.request().url());
      url.searchParams.set("__clerk_testing_token", testingToken);
      await route.continue({ url: url.toString() });
    });

    const stamp = Date.now();
    const email = `codex+clerk_test_${stamp}@example.com`;
    const password = `CodexTest!${stamp}`;
    let userId: string | null = null;

    try {
      await page.goto("/sign-up?return_url=%2Ftemplates");
      await expect(page.locator(".cl-signUp-root")).toBeVisible();

      // Clerk's sign-up form flow:
      // 1. Enter email -> Continue
      // 2. Enter password + optional fields -> Continue
      // 3. Enter verification code (if testing mode not bypassed) -> Continue
      // 4. Redirect to return_url

      const emailInput = page.getByRole("textbox", { name: /email/i });
      await expect(emailInput).toBeVisible({ timeout: 10_000 });
      await emailInput.fill(email);

      await page.getByRole("button", { name: /continue/i }).click();

      // Wait for password step
      await page.waitForTimeout(2_000);

      const passwordInput = page.getByRole("textbox", { name: /password/i }).first();
      if (await passwordInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await passwordInput.fill(password);
        await page.getByRole("button", { name: /continue/i }).click();
      }

      // Wait for verification code step or redirect
      await page.waitForTimeout(3_000);

      const codeInput = page
        .getByRole("textbox", { name: /verification|code/i })
        .first();
      if (await codeInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await codeInput.fill("424242");
        await page.getByRole("button", { name: /continue/i }).click();
      }

      // Wait for redirect to templates
      await page.waitForURL("**/templates", {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      });

      await expect(page).not.toHaveURL(/\/sign-in/);
      await expect(page.locator("body")).toContainText("QUANLYVKS");

      userId = await page.evaluate(() => {
        const clerk = (
          window as Window & { Clerk?: { user?: { id?: string } | null } }
        ).Clerk;
        return clerk?.user?.id ?? null;
      });
      expect(userId).toMatch(/^user_/);
    } finally {
      const id = userId ?? (await findUserIdByEmail(email));
      if (id) await deleteUser(id);
    }
  });
});

async function routeClerkTestingToken(page: Page, token: string) {
  await page.route("https://*.clerk.accounts.dev/**", async (route) => {
    const url = new URL(route.request().url());
    url.searchParams.set("__clerk_testing_token", token);
    await route.continue({ url: url.toString() });
  });
}

async function fillIfVisible(page: Page, selector: string, value: string) {
  const locator = page.locator(selector);
  if ((await locator.count()) === 1 && (await locator.isVisible())) {
    await locator.fill(value);
  }
}

async function checkIfVisible(page: Page, selector: string) {
  const locator = page.locator(selector);
  if ((await locator.count()) === 1 && (await locator.isVisible())) {
    await locator.check();
  }
}

async function createTestingToken(): Promise<string> {
  const response = await clerkFetch("/testing_tokens", { method: "POST" });
  const body = (await response.json()) as { token?: string };
  if (!body.token)
    throw new Error("Clerk testing token response missed token.");
  return body.token;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const candidates = [
    `/users?email_address=${encodeURIComponent(email)}`,
    `/users?email_address[]=${encodeURIComponent(email)}`,
  ];

  for (const path of candidates) {
    const response = await clerkFetch(path);
    const body = (await response.json()) as { data?: Array<{ id?: string }> };
    const id = body.data?.find((user) => user.id)?.id;
    if (id) return id;
  }

  return null;
}

async function deleteUser(userId: string): Promise<void> {
  await clerkFetch(`/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

async function clerkFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${CLERK_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clerk API request failed: ${response.status} ${body}`);
  }

  return response;
}
