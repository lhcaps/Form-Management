import assert from "node:assert/strict";
import { describe, it } from "node:test";

const launcher = await import("../../scripts/dev-api-with-root-env.mjs");

describe("API root environment launcher", () => {
  it("keeps the root database configuration ahead of a stale package environment", () => {
    const env = launcher.buildApiDevEnvironment({
      inheritedEnv: {
        DATABASE_URL: "mysql://stale-package-env",
        API_PORT: "3101",
        WEB_ORIGIN: "http://localhost:3100",
        API_CORS_ORIGIN: "http://localhost:3100",
      },
      rootEnv: {
        DATABASE_URL: "mysql://root-source-of-truth",
        API_PORT: "3001",
      },
    });

    assert.equal(env.DATABASE_URL, "mysql://root-source-of-truth");
    assert.equal(env.API_PORT, "3101", "an explicit caller port remains usable for isolated smoke tests");
    assert.equal(env.WEB_ORIGIN, "http://localhost:3100");
    assert.equal(env.API_CORS_ORIGIN, "http://localhost:3100");
  });
});
