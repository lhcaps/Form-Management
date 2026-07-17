import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const read = (path) => readFileSync(`${ROOT}/${path}`, "utf8");

describe("production Docker runtime contract", () => {
  it("keeps shell entrypoints LF-only and fail-closed", () => {
    const entrypointBytes = readFileSync(`${ROOT}/docker/api-entrypoint.sh`);
    const entrypoint = entrypointBytes.toString("utf8");
    const bootstrapEntrypointBytes = readFileSync(`${ROOT}/docker/contract-bootstrap-entrypoint.sh`);
    const bootstrapEntrypoint = bootstrapEntrypointBytes.toString("utf8");
    const attributes = read(".gitattributes");

    assert.equal(entrypointBytes.includes(13), false, "entrypoint contains CR bytes");
    assert.match(attributes, /\*\.sh\s+text\s+eol=lf/);
    assert.doesNotMatch(entrypoint, /\|\|\s*true/);
    assert.doesNotMatch(entrypoint, /CREATE DATABASE/);
    assert.doesNotMatch(entrypoint, /pnpm db:seed/);
    assert.match(entrypoint, /pnpm seed/);
    assert.equal(bootstrapEntrypointBytes.includes(13), false, "bootstrap entrypoint contains CR bytes");
    assert.doesNotMatch(bootstrapEntrypoint, /\|\|\s*true/);
    assert.match(bootstrapEntrypoint, /pnpm exec prisma migrate deploy/);
    assert.match(bootstrapEntrypoint, /build-phase-8c-bootstrap-sql\.mjs --apply/);
  });

  it("ships governed assets, isolated LibreOffice conversion, healthchecks and non-root users", () => {
    const api = read("docker/api.Dockerfile");
    const web = read("docker/web.Dockerfile");
    const wrapper = read("docker/libreoffice-wrapper.sh");

    assert.match(api, /docs\/audit\/docx\/contracts\/locked/);
    assert.match(api, /docs\/audit\/docx\/compiled-v2/);
    assert.match(api, /COPY --chmod=755 docker\/libreoffice-wrapper\.sh/);
    assert.match(api, /COPY --chmod=755 docker\/contract-bootstrap-entrypoint\.sh/);
    assert.match(api, /USER node/);
    assert.match(api, /HEALTHCHECK/);
    assert.match(web, /USER node/);
    assert.match(web, /HEALTHCHECK/);
    assert.match(
      web,
      /CMD \["node", "node_modules\/next\/dist\/bin\/next", "start"/,
    );
    assert.doesNotMatch(web, /CMD \["pnpm", "start"/);
    assert.match(wrapper, /mktemp -d/);
    assert.match(wrapper, /UserInstallation=file:\/\//);
    assert.match(wrapper, /timeout/);
    assert.match(wrapper, /trap .*EXIT/);
    assert.doesNotMatch(wrapper, /args:\s*\$\*/);
  });

  it("provides the Prisma schema before root postinstall runs in every dependency stage", () => {
    const dockerfiles = ["docker/api.Dockerfile", "docker/web.Dockerfile"];

    for (const dockerfilePath of dockerfiles) {
      const dockerfile = read(dockerfilePath);
      const install = dockerfile.indexOf("RUN pnpm install --frozen-lockfile");
      const prismaConfig = dockerfile.indexOf(
        "COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts",
      );
      const prismaSchema = dockerfile.indexOf(
        "COPY apps/api/prisma/schema.prisma ./apps/api/prisma/schema.prisma",
      );

      assert.ok(install >= 0, `${dockerfilePath} must install workspace dependencies`);
      assert.ok(
        prismaConfig >= 0 && prismaConfig < install,
        `${dockerfilePath} must copy Prisma config before postinstall`,
      );
      assert.ok(
        prismaSchema >= 0 && prismaSchema < install,
        `${dockerfilePath} must copy Prisma schema before postinstall`,
      );
    }
  });

  it("resolves Compose's default built image name before relying on BuildKit labels", () => {
    const verifier = read("scripts/docker-verify.mjs");
    const defaultImage = verifier.indexOf("const defaultImage = `${project}-${service}`;");
    const labelFallback = verifier.indexOf("label=com.docker.compose.project=${project}");

    assert.ok(defaultImage >= 0, "image verifier must try Compose's default image name");
    assert.ok(labelFallback >= 0, "image verifier must retain the label fallback");
    assert.ok(defaultImage < labelFallback, "default image resolution must precede label lookup");
  });

  it("keeps Compose private-by-default and health-gated", () => {
    const compose = read("docker-compose.prod.yml");

    assert.doesNotMatch(compose, /MYSQL_HOST_PORT/);
    assert.match(compose, /SEED_DATA:\s*\$\{SEED_DATA:-false\}/);
    assert.match(compose, /MYSQL_USER:\s*\$\{MYSQL_USER\}/);
    assert.match(compose, /MYSQL_PASSWORD:\s*\$\{MYSQL_PASSWORD\}/);
    assert.match(
      compose,
      /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:\s*\$\{NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\}/,
    );
    assert.match(compose, /condition:\s*service_healthy/);
    assert.match(compose, /entrypoint: \["\/usr\/local\/bin\/contract-bootstrap-entrypoint\.sh"\]/);
    assert.match(compose, /stop_grace_period:/);
    assert.match(compose, /no-new-privileges:true/);
  });

  it("sets bounded CPU, memory, and process limits for every long-running service", () => {
    const compose = read("docker-compose.prod.yml");

    for (const service of ["mysql", "api", "web"]) {
      const start = compose.indexOf(`  ${service}:`);
      const nextService = compose.slice(start + 1).search(/^  [a-z][a-z-]+:/m);
      const block =
        start < 0
          ? ""
          : compose.slice(start, nextService < 0 ? undefined : start + 1 + nextService);

      assert.ok(block, `missing ${service} Compose service block`);
      assert.match(block, /^    cpus:/m, `${service} must declare a CPU cap`);
      assert.match(block, /^    mem_limit:/m, `${service} must declare a memory cap`);
      assert.match(block, /^    pids_limit:/m, `${service} must declare a process cap`);
    }
  });

  it("uses the mounted container font path inside the API process", () => {
    const compose = read("docker-compose.prod.yml");

    assert.match(
      compose,
      /QLLAW_TNR_FONT_DIR:\s*\/opt\/qllaw\/fonts\/times-new-roman/,
      "the API process must not inherit the host-only font path from env_file",
    );
    assert.match(
      compose,
      /QLLAW_CONTAINER_TNR_FONT_DIR:\s*\/opt\/qllaw\/fonts\/times-new-roman/,
    );
  });

  it("keeps secrets, auth state, temp output and bulk docs out of build context", () => {
    const dockerignore = read(".dockerignore");

    for (const pattern of [
      ".env.docker",
      "playwright/.auth",
      "playwright/.clerk",
      "test-results",
      "storage",
      ".codegraph",
      "docs/**",
    ]) {
      assert.ok(dockerignore.includes(pattern), `missing .dockerignore rule: ${pattern}`);
    }
    assert.match(dockerignore, /!docs\/audit\/docx\/contracts\/locked\/\*\*/);
    assert.match(dockerignore, /!docs\/audit\/docx\/compiled-v2\/\*\*/);
  });

  it("has the exact governed 213 locked and compiled artifacts", () => {
    const locked = readdirSync(
      `${ROOT}/docs/audit/docx/contracts/locked`,
    ).filter((name) => name.endsWith(".contract.locked.json"));
    const compiled = readdirSync(`${ROOT}/docs/audit/docx/compiled-v2`).filter(
      (name) => name.endsWith(".compiled.json"),
    );
    assert.equal(locked.length, 213);
    assert.equal(compiled.length, 213);
  });
});
