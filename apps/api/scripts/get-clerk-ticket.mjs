import { createClerkClient } from "@clerk/backend";
import { config as dotenvConfig } from "dotenv";
import fs from "node:fs";

dotenvConfig({ path: ".env.e2e.local", override: false });
const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) { console.error("CLERK_SECRET_KEY not found"); process.exit(1); }

const clerkClient = createClerkClient({ secretKey });
const email = process.env.E2E_CLERK_USER_EMAIL;
const userList = await clerkClient.users.getUserList({ emailAddress: [email] });
if (!userList.data?.length) { console.error("No user found for:", email); process.exit(1); }

const user = userList.data[0];
console.log("User ID:", user.id);

const tokenResponse = await clerkClient.signInTokens.createSignInToken({
  userId: user.id,
  expiresInSeconds: 300,
});

if (!tokenResponse.token) {
  console.error("No token returned");
  process.exit(1);
}

console.log("Token created successfully:", tokenResponse.token.slice(0, 20) + "...");

// Write to a temp env file so playwright can pick it up
const tempEnv = `__E2E_CLERK_TICKET=${tokenResponse.token}`;
fs.writeFileSync(".env.e2e.ticket.tmp", tempEnv);
console.log("Token written to .env.e2e.ticket.tmp");
