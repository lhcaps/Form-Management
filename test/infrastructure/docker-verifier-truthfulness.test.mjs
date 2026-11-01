import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  parseBootResultJson,
  validateBootResult,
} from "../../scripts/docker-verify.mjs";

const ROOT = resolve(process.cwd());
const source = readFileSync(resolve(ROOT, "scripts/docker-verify.mjs"), "utf8");
const expectedImages = { apiImage: "phase-api:unique", webImage: "phase-web:unique" };

function passingResult() {
  return {
    verdict: "PASS",
    fatal: null,
    seedData: false,
    temporarySecretsGenerated: true,
    secretsRecorded: false,
    images: { api: expectedImages.apiImage, web: expectedImages.webImage },
    composeConfig: {
      exit: 0,
      apiBuild: false,
      webBuild: false,
      apiPublishedPorts: 0,
      webPublishedPorts: 0,
    },
    up: { mysql: { exit: 0 }, api: { exit: 0 }, web: { exit: 0 } },
    health: {
      mysql: { healthy: true },
      api: { healthy: true },
      web: { healthy: true },
    },
    readiness: { apiExit: 0, apiStatus: "200", webExit: 0, webStatus: "200" },
    users: { apiUid: "1000", webUid: "1000" },
    writableDirectories: { pass: true },
    firstMigration: {
      activeMigrationInLogs: true,
      seedDisabledInLogs: true,
      seedExecutedInLogs: false,
      migrationRows: 1,
      failedRows: 0,
      baselineRows: 1,
    },
    secondMigration: { exit: 0, noPending: true },
    restart: {
      exit: 0,
      healthy: true,
      migrationRowsBefore: 1,
      migrationRowsAfter: 1,
      failedRowsAfter: 0,
      duplicateMigrationMetadata: false,
    },
    shutdown: {
      apiGraceful: true,
      webGraceful: true,
      apiForcedKill: false,
      webForcedKill: false,
    },
    cleanup: { downExit: 0, pass: true, containers: [], networks: [], volumes: [] },
  };
}

describe("Docker verifier truthfulness", () => {
  it("does not report a global PASS when boot evidence was never checked", () => {
    assert.doesNotMatch(source, /DOCKER_VERIFY=PASS_STATIC/);
    assert.match(source, /QLLAW_DOCKER_VERIFY_BOOT_RESULT/);
    assert.match(source, /DOCKER_VERIFY=PASS_IMAGE_ONLY/);
  });

  it("accepts a complete passing boot result even when non-required warnings exist", () => {
    const result = passingResult();
    result.warnings = ["informational only"];
    assert.deepEqual(validateBootResult(result, expectedImages), {
      boot: "PASS",
      migration: "PASS",
      readiness: "PASS",
      restart: "PASS",
      shutdown: "PASS",
      cleanup: "PASS",
    });
  });

  it("accepts the UTF-8 BOM emitted by Windows PowerShell JSON output", () => {
    assert.deepEqual(parseBootResultJson(`\uFEFF${JSON.stringify(passingResult())}`), passingResult());
  });

  it("rejects every required failed stage so PASS cannot coexist with failure", () => {
    const mutations = [
      ["boot", (result) => { result.verdict = "FAIL"; }],
      ["migration", (result) => { result.firstMigration.failedRows = 1; }],
      ["readiness", (result) => { result.readiness.apiStatus = "503"; }],
      ["cleanup", (result) => { result.cleanup.pass = false; }],
    ];
    for (const [label, mutate] of mutations) {
      const result = passingResult();
      mutate(result);
      assert.throws(
        () => validateBootResult(result, expectedImages),
        /Boot verification failed/,
        label,
      );
    }
  });
});
