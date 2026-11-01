import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const read = (path) => readFileSync(`${ROOT}/${path}`, "utf8");
const doctor = await import(pathToFileURL(`${ROOT}/scripts/dev-doctor.mjs`));

describe("developer verification command surface", () => {
  it("exposes one quick, full, CI, doctor, and Docker verification entrypoint", () => {
    const pkg = JSON.parse(read("package.json"));

    for (const name of [
      "verify:quick",
      "verify:full",
      "verify:ci",
      "dev:doctor",
      "docker:verify",
    ]) {
      assert.equal(typeof pkg.scripts[name], "string", `missing pnpm ${name}`);
    }

    assert.match(pkg.scripts["verify:quick"], /typecheck/);
    assert.match(pkg.scripts["verify:full"], /test/);
    assert.match(pkg.scripts["verify:full"], /build/);
    assert.match(pkg.scripts["verify:ci"], /verify:full/);
    assert.match(pkg.scripts["verify:ci"], /audit:docx:verify-locked:ci/);

    assert.equal(
      pkg.scripts["audit:docx:verify-locked:ci"],
      "node scripts/docx-contract/verify-locked-contracts.mjs",
      "CI must not retain a resolved BM-006 allowlist entry",
    );
  });

  it("keeps the BM-006 CI debt explicit, exact, and fail-closed", () => {
    const source = read("scripts/docx-contract/verify-locked-contracts.mjs");

    assert.match(source, /--allow-known-blocker=/);
    assert.match(source, /Acknowledged Known Blockers/);
    assert.match(source, /Unacknowledged blocking issues/);
    assert.match(source, /allowlist entries were not observed/);
  });

  it("keeps doctor output presence-only for sensitive prerequisites", () => {
    const source = read("scripts/dev-doctor.mjs");

    assert.match(source, /SET|UNSET/);
    assert.doesNotMatch(source, /console\.log\([^\n]*(DATABASE_URL|CLERK_SECRET_KEY)/);
    assert.doesNotMatch(source, /password\s*[:=]\s*url\.password/);
  });

  it("detects pnpm from the package-manager user agent on Windows", () => {
    assert.equal(
      doctor.pnpmVersionFromUserAgent("pnpm/10.33.2 npm/? node/v22.23.1 win32 x64"),
      "10.33.2",
    );
    assert.equal(doctor.pnpmVersionFromUserAgent(undefined), null);
  });

  it("uses the production Compose definition and probes governed image invariants", () => {
    const source = read("scripts/docker-verify.mjs");

    assert.match(source, /docker-compose\.prod\.yml/);
    assert.match(source, /config["'],\s*["']--format["'],\s*["']json/);
    assert.doesNotMatch(source, /images["'],\s*["']--quiet/);
    assert.match(source, /BM-001_normalized\.docx/);
    assert.match(source, /powershell\.exe/);
    assert.match(source, /fc-match/);
    assert.match(source, /213/);
    assert.match(source, /User/);
    assert.match(source, /Healthcheck/);
  });

  it("documents production lifecycle and database recovery constraints", () => {
    const dockerRunbook = read("docs/operations/PRODUCTION_DOCKER_RUNBOOK.md");
    const databaseRunbook = read("docs/operations/DATABASE_BACKUP_RESTORE.md");
    const verification = read("docs/operations/DEVELOPER_VERIFICATION.md");
    const compose = read("docker-compose.prod.yml");
    const dockerfile = read("docker/api.Dockerfile");
    const dockerignore = read(".dockerignore");
    const bootstrap = read("scripts/audit/build-phase-8c-bootstrap-sql.mjs");

    assert.match(dockerRunbook, /migrate deploy/i);
    assert.match(dockerRunbook, /SEED_DATA=false/);
    assert.match(dockerRunbook, /20260711000000_squashed_baseline/);
    assert.match(dockerRunbook, /contract-bootstrap/);
    assert.match(dockerRunbook, /--profile bootstrap run --rm contract-bootstrap/);
    assert.doesNotMatch(dockerRunbook, /Do not treat a blank-database deployment as ready yet/);
    assert.match(compose, /contract-bootstrap:/);
    assert.match(compose, /profiles: \["bootstrap"\]/);
    assert.match(compose, /QLLAW_BOOTSTRAP_ALLOW_DB_WRITE: "1"/);
    assert.match(compose, /CLERK_SECRET_KEY: \$\{CLERK_SECRET_KEY\}/);
    assert.match(dockerfile, /build-phase-8c-bootstrap-sql\.mjs/);
    assert.match(dockerignore, /!scripts\/audit\/build-phase-8c-bootstrap-sql\.mjs/);
    assert.match(bootstrap, /QLLAW_BOOTSTRAP_OUTPUT_DIR/);
    assert.match(databaseRunbook, /mariadb-dump/);
    assert.match(databaseRunbook, /restore/i);
    assert.match(databaseRunbook, /_prisma_migrations/);
    assert.match(verification, /Windows/i);
    assert.match(verification, /WSL/i);
  });
});
