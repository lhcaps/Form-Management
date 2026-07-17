import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  classifyAuthenticatedThrottlingEvidence,
  classifyThrottlingEvidence,
} from "../../scripts/audit/lib/throttling-classifier.mjs";

const ROOT = resolve(process.cwd());

describe("source/render browser throttling classifier", () => {
  it("requires explicit rate-limit evidence", () => {
    for (const evidence of [
      { httpStatus: 429 },
      { structuredError: { name: "ThrottlerException" } },
      { errorMessage: "HTTP_ERROR status 429 Too Many Requests" },
    ]) {
      assert.equal(classifyThrottlingEvidence(evidence).classification, "THROTTLED_TRANSIENT");
    }
  });

  it("never promotes timing or generic network failures to throttling", () => {
    const cases = [
      [{ errorMessage: "element(s) not found", durationMs: 16_001 }, "TIMING_ONLY_UNVERIFIED"],
      [{ errorMessage: "Timed out waiting", durationMs: 30_000 }, "TIMING_ONLY_UNVERIFIED"],
      [{ errorMessage: "net::ERR_CONNECTION_REFUSED" }, "NETWORK_TRANSIENT_UNVERIFIED"],
      [{ errorMessage: "ECONNRESET" }, "NETWORK_TRANSIENT_UNVERIFIED"],
      [{ errorMessage: "output contained 4299 bytes" }, "UNVERIFIED"],
    ];
    for (const [evidence, expected] of cases) {
      assert.equal(classifyThrottlingEvidence(evidence).classification, expected);
    }
  });

  it("uses the guarded classifier in the source/render browser collector", () => {
    const source = readFileSync(
      resolve(ROOT, "scripts/audit/browser-visibility-source-render-only.mjs"),
      "utf8",
    );
    assert.match(source, /classifyThrottlingEvidence/);
    assert.doesNotMatch(source, /durationMs > 15_000/);
  });

  it("uses only the Phase 8D verified vocabulary for authenticated evidence", () => {
    const cases = [
      [
        { authValid: true, collectorComplete: true, httpStatus: 429 },
        "THROTTLED_VERIFIED",
      ],
      [
        { authValid: true, collectorComplete: true, httpStatus: 200 },
        "NOT_THROTTLED_VERIFIED",
      ],
      [
        { authValid: false, collectorComplete: true, httpStatus: 200 },
        "UNVERIFIED",
      ],
      [
        { authValid: true, collectorComplete: false, httpStatus: 200 },
        "UNVERIFIED",
      ],
      [
        { authValid: true, collectorComplete: true, httpStatus: 503 },
        "UNVERIFIED",
      ],
    ];
    for (const [evidence, expected] of cases) {
      assert.equal(
        classifyAuthenticatedThrottlingEvidence(evidence).classification,
        expected,
      );
    }
  });

  it("keeps the nine-form closure authenticated and payload-free", () => {
    const source = readFileSync(
      resolve(ROOT, "scripts/audit/build-phase-8c-throttling-closure.mjs"),
      "utf8",
    );
    const perFormLoop = source.slice(
      source.indexOf("for (const templateCode of TARGET_FORMS)"),
      source.indexOf("return { authSmoke, perForm }"),
    );
    const smokeBlock = source.slice(
      source.indexOf("const smokeStartedAt = Date.now()"),
      source.indexOf("const perForm = []"),
    );
    assert.match(source, /chromium\.launch/u);
    assert.match(source, /storageState:\s*STORAGE_STATE/u);
    assert.match(source, /classifyAuthenticatedThrottlingEvidence/u);
    assert.match(perFormLoop, /await page\.waitForFunction/u);
    assert.match(perFormLoop, /smokeAuthValid/u);
    assert.match(perFormLoop, /httpStatus === 429/u);
    assert.match(
      smokeBlock,
      /waitForFunction\(\s*\(\) =>\s*Boolean\(window\.Clerk\?\.user\?\.id && window\.Clerk\?\.session\?\.id\)/su,
    );
    assert.doesNotMatch(
      smokeBlock,
      /waitForFunction\(\(\) => Boolean\(window\.Clerk\?\.user\)/u,
    );
    assert.doesNotMatch(source, /spawnSync\(['"]curl/u);
    assert.doesNotMatch(source, /\.body\.html/u);
    assert.doesNotMatch(source, /response\.text\(/u);
    assert.doesNotMatch(source, /readFileSync\(STORAGE_STATE/u);
  });
});
