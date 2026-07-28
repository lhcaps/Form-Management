import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");

describe("API runtime safety wiring", () => {
  it("loads environment before importing AppModule and enables shutdown hooks", () => {
    const main = readFileSync(`${ROOT}/apps/api/src/main.ts`, "utf8");
    const appModule = readFileSync(`${ROOT}/apps/api/src/app.module.ts`, "utf8");

    const loadIndex = main.indexOf("loadApiEnvironment()");
    const importIndex = main.indexOf("await import('./app.module')");
    assert.ok(loadIndex >= 0, "main must load the API environment");
    assert.ok(importIndex > loadIndex, "AppModule must be imported after env loading");
    assert.match(main, /app\.enableShutdownHooks\(\)/);
    assert.match(appModule, /ignoreEnvFile:\s*true/);
  });

  it("enforces the 50 MiB upload limit before Multer writes the whole file", () => {
    const importsModule = readFileSync(
      `${ROOT}/apps/api/src/modules/imports/imports.module.ts`,
      "utf8",
    );
    assert.match(importsModule, /limits:\s*\{\s*fileSize:\s*MAX_IMPORT_FILE_SIZE_BYTES/);
  });

  it("exposes request correlation and rate-limit headers to browser clients", () => {
    const main = readFileSync(`${ROOT}/apps/api/src/main.ts`, "utf8");

    assert.match(main, /exposedHeaders:/);
    assert.match(main, /X-Request-Id/);
    assert.match(main, /Retry-After/);
    assert.match(main, /X-RateLimit-Limit/);
    assert.match(main, /X-RateLimit-Remaining/);
    assert.match(main, /X-RateLimit-Reset/);
  });
});
