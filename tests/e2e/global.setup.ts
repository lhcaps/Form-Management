/**
 * Clerk Global Setup — authenticates E2E tests via Clerk Backend API directly.
 *
 * Flow (avoids @clerk/testing due to MFA incompatibility with ticket strategy):
 *  1. Call Clerk Backend API to create a sign-in token for E2E_CLERK_USER_EMAIL.
 *  2. Navigate to /sign-in, wait for Clerk SDK to initialize.
 *  3. Inject the ticket into Clerk SDK via page.evaluate().
 *  4. Clerk SDK calls setActive() → session cookie is set in browser.
 *
 * This bypasses:
 *  - Password entry (token is pre-authenticated)
 *  - MFA (ticket strategy completes directly)
 *
 * DO NOT log tokens, cookies, or any auth-related values.
 * Auth state stored at playwright/.clerk/admin.json (gitignored).
 */

import { test as setup, expect } from "@playwright/test";
import { createClerkClient } from "@clerk/backend";
import path from "node:path";

setup.describe.configure({ mode: "serial" });

const authStatePath = path.join(process.cwd(), "playwright", ".clerk", "admin.json");

async function createSignInToken(email: string): Promise<string> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required in .env.e2e.local.");
  }

  const clerkClient = createClerkClient({ secretKey });

  const userList = await clerkClient.users.getUserList({ emailAddress: [email] });
  if (!userList.data || userList.data.length === 0) {
    throw new Error(`No Clerk user found with email: ${email}`);
  }
  const user = userList.data[0];

  const tokenResponse = await clerkClient.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  if (!tokenResponse.token) {
    throw new Error("Clerk did not return a token from signInTokens.createSignInToken.");
  }

  return tokenResponse.token;
}

setup("create sign-in ticket for E2E user", async () => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  if (!email) {
    throw new Error("E2E_CLERK_USER_EMAIL must be set in .env.e2e.local.");
  }

  const ticket = await createSignInToken(email);
  process.env.__E2E_CLERK_TICKET = ticket;
});

setup("authenticate via ticket and persist session state", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  const ticket = process.env.__E2E_CLERK_TICKET;

  if (!email || !ticket) {
    throw new Error(
      "E2E_CLERK_USER_EMAIL and __E2E_CLERK_TICKET must be set. " +
        "Ensure the previous setup step ran first.",
    );
  }

  await page.goto("/sign-in", { waitUntil: "networkidle" });

  // Wait for Clerk SDK and its sign-in resource to be fully initialized.
  // The global object is installed before `loaded` resolves, so checking only
  // for `window.Clerk` races the ticket call on current Clerk builds.
  await page.waitForFunction(
    () => {
      const clerk = (window as unknown as {
        Clerk?: {
          loaded?: boolean;
          client?: { signIn?: unknown };
          signIn?: unknown;
        };
      }).Clerk;
      return Boolean(clerk?.loaded && (clerk.client?.signIn ?? clerk.signIn));
    },
    { timeout: 30_000 },
  );

  // Inject the ticket and call setActive().
  // Clerk SDK shapes differ across compatible @clerk/nextjs releases. Prefer
  // the current client-scoped value but retain the direct value used by the
  // browser SDK exposed by the installed runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate(async (tk: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerk = (window as any).Clerk as {
      client?: {
        signIn?: {
          create: (p: object) => Promise<{ status: string; createdSessionId?: string }>;
        };
      };
      signIn?: {
        create: (p: object) => Promise<{ status: string; createdSessionId?: string }>;
      };
      setActive: (p: { session: string }) => Promise<void>;
    };

    const signIn = clerk.client?.signIn ?? clerk.signIn;
    if (!signIn) {
      throw new Error("Clerk signIn is not available");
    }

    const result = await signIn.create({ strategy: "ticket", ticket: tk });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Sign-in incomplete: status=${result.status}`);
    }
    await clerk.setActive({ session: result.createdSessionId });
  }, ticket);

  // Verify user is set in Clerk SDK.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), { timeout: 15_000 });

  // After setActive(), navigate away — Clerk component doesn't auto-redirect when
  // sign-in is completed via SDK directly (only when using Clerk UI component).
  // Go to root, which the middleware will allow (session cookie is set).
  await page.goto("/", { waitUntil: "networkidle" });

  // Confirm we are not on sign-in.
  await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 30_000 });

  // Confirm /templates/BM-001 is accessible.
  await page.goto("/templates/BM-001");
  await expect(page).not.toHaveURL(/sign-in|sign-up/, { timeout: 15_000 });

  await page.context().storageState({ path: authStatePath });

  delete process.env.__E2E_CLERK_TICKET;
});
