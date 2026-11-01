import assert from "node:assert/strict";
import { describe, it } from "node:test";

const launcher = await import("../../scripts/dev-web-with-root-env.mjs");

describe("web root environment launcher", () => {
  it("takes the Clerk public key from root .env while allowing an isolated API origin", () => {
    const env = launcher.buildWebDevEnvironment({
      inheritedEnv: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_stale",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3101/api/v1",
      },
      rootEnv: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_root_source_of_truth",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001/api/v1",
        CLERK_SECRET_KEY: "root-secret",
      },
    });

    assert.equal(
      env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      "pk_test_root_source_of_truth",
    );
    assert.equal(env.CLERK_SECRET_KEY, "root-secret");
    assert.equal(
      env.NEXT_PUBLIC_API_BASE_URL,
      "http://127.0.0.1:3101/api/v1",
    );
  });

  it("strips pnpm's argument separator before invoking Next", () => {
    assert.deepEqual(
      launcher.normalizeNextArgs(["--", "--port", "3100"]),
      ["--port", "3100"],
    );
    assert.deepEqual(launcher.normalizeNextArgs(["-p", "3100"]), ["-p", "3100"]);
  });
});
