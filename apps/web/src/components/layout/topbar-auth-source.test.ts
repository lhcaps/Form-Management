import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("./topbar.tsx", import.meta.url), "utf8");

describe("Topbar auth source", () => {
  it("uses the app auth session, not Clerk alone, for sign-in visibility", () => {
    assert.match(source, /@\/lib\/auth-context/);
    assert.doesNotMatch(source, /isSignedIn/);
    assert.doesNotMatch(source, /useAuth,\s*SignInButton/);
  });
});
