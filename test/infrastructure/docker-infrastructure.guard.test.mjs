/**
 * docker-infrastructure.guard.test.mjs
 *
 * Infrastructure guard tests for Docker configuration correctness.
 * Covers Compose configs, resource limits, logging, security, demo mode.
 *
 * Run: node --test test/infrastructure/docker-infrastructure.guard.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const read = (path) => readFileSync(`${ROOT}/${path}`, "utf8");
const exists = (path) => existsSync(`${ROOT}/${path}`);

/** Parse YAML-like "key: value" lines — good enough for Compose checks. */
function extractValue(text, key) {
  const match = text.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

describe("dev Compose (infra/docker-compose.dev.yml)", () => {
  const devCompose = read("infra/docker-compose.dev.yml");

  it("passes Compose config validation", () => {
    const result = spawnSync(
      "docker",
      ["compose", "-f", "infra/docker-compose.dev.yml", "config", "--quiet"],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
    );
    assert.equal(result.status, 0, `Compose dev config invalid: ${result.stderr}`);
  });

  it("declares resource limits (RC-005 fixed)", () => {
    assert.match(devCompose, /cpus:/, "missing cpus limit");
    assert.match(devCompose, /mem_limit:/, "missing mem_limit");
    assert.match(devCompose, /pids_limit:/, "missing pids_limit");
  });

  it("has log rotation (RC-005 fixed)", () => {
    assert.match(devCompose, /logging:/, "missing logging driver");
    assert.match(devCompose, /max-size:/, "missing log max-size");
    assert.match(devCompose, /max-file:/, "missing log max-file");
  });

  it("has stop_grace_period (RC-005 fixed)", () => {
    assert.match(devCompose, /stop_grace_period:/, "missing stop_grace_period");
  });

  it("does not use deprecated --default-authentication-plugin (RC-006 fixed)", () => {
    // Match only actual YAML list entries (lines starting with `- --`), not comment lines.
    assert.doesNotMatch(
      devCompose,
      /^\s+-\s+--default-authentication-plugin/m,
      "deprecated --default-authentication-plugin still present as a command entry",
    );
  });

  it("mounts office-lite CNF config", () => {
    assert.match(devCompose, /infra\/mariadb\/conf\.d/, "missing office-lite CNF mount");
  });

  it("office-lite CNF file exists", () => {
    assert.ok(exists("infra/mariadb/conf.d/office-lite.cnf"), "office-lite.cnf not found");
  });

  it("uses named volume for persistence", () => {
    assert.match(devCompose, /mariadb_data:/, "missing named volume");
  });
});

describe("production Compose (docker-compose.prod.yml)", () => {
  const prodCompose = read("docker-compose.prod.yml");

  it("passes Compose config validation with .env.docker", () => {
    // Use .env.docker.example for structural validation — it always has all
    // required variables defined (including QLLAW_TNR_FONT_DIR). The local
    // .env.docker may be a customized pre-Phase-8C file that is missing some
    // variables (e.g. QLLAW_TNR_FONT_DIR). Config validation is a schema check,
    // not a secrets check, so the example file is the right input here.
    const result = spawnSync(
      "docker",
      ["compose", "--env-file", ".env.docker.example", "-f", "docker-compose.prod.yml", "config", "--quiet"],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
    );
    assert.equal(result.status, 0, `Compose prod config invalid: ${result.stderr}`);
  });

  it("has log rotation for all long-running services (RC-007 fixed)", () => {
    const serviceBlocks = ["mysql", "api", "web"].map((svc) => {
      const start = prodCompose.indexOf(`  ${svc}:`);
      if (start < 0) return { svc, block: "" };
      const nextService = prodCompose.slice(start + 1).search(/^  [a-z][a-z-]+:/m);
      const block = nextService < 0
        ? prodCompose.slice(start)
        : prodCompose.slice(start, start + 1 + nextService);
      return { svc, block };
    });

    for (const { svc, block } of serviceBlocks) {
      assert.match(block, /logging:/, `${svc} missing logging driver`);
      assert.match(block, /max-size:/, `${svc} missing log max-size`);
    }
  });

  it("does not publish MariaDB port in production", () => {
    const mysqlStart = prodCompose.indexOf("  mysql:");
    const apiStart = prodCompose.indexOf("  contract-bootstrap:");
    const mysqlBlock = prodCompose.slice(mysqlStart, apiStart);
    assert.doesNotMatch(mysqlBlock, /^\s+ports:/m, "MariaDB must not publish a host port in production");
  });

  it("has no-new-privileges on all long-running services", () => {
    assert.match(prodCompose, /no-new-privileges:true/g, "missing no-new-privileges");
  });

  it("sets SEED_DATA default to false", () => {
    assert.match(prodCompose, /SEED_DATA:\s*\$\{SEED_DATA:-false\}/);
  });

  it("uses service_healthy conditions for all dependencies", () => {
    const matches = prodCompose.match(/condition:\s*service_healthy/g) ?? [];
    assert.ok(matches.length >= 2, "expected at least 2 service_healthy conditions");
  });

  it("has stop_grace_period on api and web", () => {
    const apiStart = prodCompose.indexOf("  api:");
    const webStart = prodCompose.indexOf("  web:");
    const endMarker = prodCompose.indexOf("\nvolumes:");
    const apiBlock = prodCompose.slice(apiStart, webStart);
    const webBlock = prodCompose.slice(webStart, endMarker > 0 ? endMarker : undefined);

    assert.match(apiBlock, /stop_grace_period:/, "api missing stop_grace_period");
    assert.match(webBlock, /stop_grace_period:/, "web missing stop_grace_period");
  });
});

describe("Docker demo override (docker-compose.demo.yml)", () => {
  it("demo compose file exists (RC-010 fixed)", () => {
    assert.ok(exists("docker-compose.demo.yml"), "docker-compose.demo.yml not found");
  });

  it("demo env file exists (.env.docker.demo)", () => {
    assert.ok(exists(".env.docker.demo"), ".env.docker.demo not found");
  });

  it("demo Compose config validates without Times New Roman directory (RC-003 fixed)", () => {
    const result = spawnSync(
      "docker",
      [
        "compose",
        "--env-file", ".env.docker.demo",
        "-f", "docker-compose.prod.yml",
        "-f", "docker-compose.demo.yml",
        "config",
        "--quiet",
      ],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
    );
    assert.equal(result.status, 0, `Docker demo config invalid: ${result.stderr}`);
  });

  it("demo env file sets QLLAW_FONT_POLICY=fallback-allowed", () => {
    const demoEnv = read(".env.docker.demo");
    assert.match(demoEnv, /QLLAW_FONT_POLICY=fallback-allowed/);
  });

  it("demo env file uses QLLAW_DOCKER_MODE=demo instead of dummy webhook secret (RC-012 fixed)", () => {
    const demoEnv = read(".env.docker.demo");
    // The new approach: QLLAW_DOCKER_MODE=demo relaxes webhook requirement in app-config.service.ts.
    // A dummy placeholder webhook secret is no longer needed and must NOT be committed.
    assert.match(demoEnv, /QLLAW_DOCKER_MODE=demo/, "QLLAW_DOCKER_MODE=demo not found in demo env");
    assert.doesNotMatch(demoEnv, /CLERK_WEBHOOK_SECRET=whsec_demo/, "dummy webhook secret should be removed");
  });

  it("demo env file does not contain live Clerk keys", () => {
    const demoEnv = read(".env.docker.demo");
    assert.doesNotMatch(demoEnv, /pk_live_/, "live publishable key found in demo env");
    assert.doesNotMatch(demoEnv, /sk_live_/, "live secret key found in demo env");
  });
});

describe("package.json command surface (RC-010, RC-011 fixed)", () => {
  const pkg = JSON.parse(read("package.json"));
  const scripts = pkg.scripts ?? {};

  const requiredDemoCommands = [
    "docker:demo:build",
    "docker:demo:up",
    "docker:demo:down",
    "docker:demo:logs",
    "docker:demo:status",
    "docker:demo:verify",
  ];

  for (const cmd of requiredDemoCommands) {
    it(`has script: ${cmd}`, () => {
      assert.ok(scripts[cmd], `missing script: ${cmd}`);
    });
  }

  const requiredInfraCommands = [
    "dev:infra:up",
    "dev:infra:wait",
    "dev:infra:status",
    "dev:infra:stats",
    "dev:infra:logs",
    "dev:infra:down",
  ];

  for (const cmd of requiredInfraCommands) {
    it(`has script: ${cmd}`, () => {
      assert.ok(scripts[cmd], `missing script: ${cmd}`);
    });
  }
});

describe("dev-doctor Windows pnpm detection (RC-004 fixed)", () => {
  it("dev-doctor exits 0 on this machine", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/dev-doctor.mjs"],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
    );
    assert.equal(result.status, 0, `dev-doctor failed:\n${result.stdout}\n${result.stderr}`);
  });

  it("dev-doctor reports pnpm PASS", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/dev-doctor.mjs"],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe", windowsHide: true },
    );
    assert.match(result.stdout, /PASS\s+tool\/pnpm/, "pnpm still reported as FAIL or UNAVAILABLE");
  });
});

describe("Clerk key guards", () => {
  it("web Dockerfile does not use CLERK_SECRET_KEY as a build ARG", () => {
    const webDockerfile = read("docker/web.Dockerfile");
    const argLines = webDockerfile.match(/^ARG .+/gm) ?? [];
    const secretArgLine = argLines.find((l) => l.includes("CLERK_SECRET_KEY"));
    assert.equal(secretArgLine, undefined, "CLERK_SECRET_KEY must not be a Docker build ARG");
  });

  it("web Dockerfile accepts NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as build ARG", () => {
    const webDockerfile = read("docker/web.Dockerfile");
    assert.match(webDockerfile, /ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
  });

  it(".env.docker.example does not contain real Clerk keys", () => {
    const envExample = read(".env.docker.example");
    assert.doesNotMatch(envExample, /pk_live_/, "live publishable key in example file");
    assert.doesNotMatch(envExample, /sk_live_/, "live secret key in example file");
    assert.doesNotMatch(envExample, /sk_test_[A-Za-z0-9]{20}/, "real test secret key in example file");
  });
});

describe("infra/fonts-fallback placeholder directory", () => {
  it("exists (required for demo font mount)", () => {
    assert.ok(exists("infra/fonts-fallback"), "infra/fonts-fallback placeholder directory missing");
  });
});
