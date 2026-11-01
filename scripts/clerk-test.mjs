/**
 * Clerk auth setup — uses @clerk/testing/playwright.
 * Writes to playwright/.clerk/admin.json.
 */
import { createClerkClient } from "@clerk/testing/playwright";
import { chromium, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

dotenv.config({ path: ".env.e2e.local" });

const authStatePath = path.join(process.cwd(), "playwright", ".clerk", "admin.json");

const secretKey = process.env.CLERK_SECRET_KEY;
const email = process.env.E2E_CLERK_USER_EMAIL;

if (!secretKey || !email) {
  console.error("CLERK_SECRET_KEY and E2E_CLERK_USER_EMAIL must be set");
  process.exit(1);
}

async function main() {
  const { client } = await createClerkClient({ secretKey });

  // List users to verify credentials
  const userList = await client.users.getUserList({ emailAddress: [email] });
  if (!userList.data?.length) {
    console.error("No user found:", email);
    process.exit(1);
  }
  const user = userList.data[0];
  console.log("User:", user.id);

  // Use the playwright helper from @clerk/testing
  const { getContext } = await import("@clerk/testing/playwright");
  console.log("Clerk testing playwright helper loaded.");

  // Start browser with Clerk auth
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Use Clerk's built-in auth - try to use signInTokens approach
  const page = await context.newPage();

  // Go to sign-in
  await page.goto("http://localhost:3000/sign-in", { waitUntil: "networkidle" });
  console.log("Page:", page.url());

  // Wait for Clerk SDK
  await page.waitForFunction(
    () => Boolean(window.Clerk?.loaded && (window.Clerk.client?.signIn ?? window.Clerk.signIn)),
    { timeout: 15000 },
  );
  console.log("SDK ready.");

  // Create sign-in ticket
  const tokenResponse = await client.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });
  const ticket = tokenResponse.token;
  console.log("Ticket:", ticket?.slice(0, 20) + "...");

  // Use ticket strategy
  const result = await page.evaluate(async (tk) => {
    const clerk = window.Clerk;
    const signIn = clerk.client?.signIn ?? clerk.signIn;
    const r = await signIn.create({ strategy: "ticket", ticket: tk });
    return { status: r.status, sessionId: r.createdSessionId };
  }, ticket);
  console.log("Ticket result:", JSON.stringify(result));

  await browser.close();
  console.log("DONE (manual ticket approach needed)");
}

main().catch(e => { console.error(e.message); process.exit(1); });
