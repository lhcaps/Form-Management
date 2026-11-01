import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const COMPILED_DIR = join(ROOT, "docs", "audit", "docx", "compiled-v2");
const RUNTIME_UX_DIR = join(ROOT, "apps", "web", "src", "lib", "runtime-ux");
const INDEX_PATH = join(RUNTIME_UX_DIR, "index.ts");
const GENERATOR_PATH = join(ROOT, "scripts", "audit", "generate-runtime-ux-profiles.mjs");

function codesFromFiles(directory, expression, format) {
  return readdirSync(directory)
    .map((name) => expression.exec(name))
    .filter(Boolean)
    .map((match) => format(match[1]))
    .sort();
}

test("runtime UX registry has exactly one profile import for each compiled BM contract", () => {
  const compiled = codesFromFiles(
    COMPILED_DIR,
    /^BM-(\d{3})\.compiled\.json$/u,
    (id) => `BM-${id}`,
  );
  const profiles = codesFromFiles(
    RUNTIME_UX_DIR,
    /^bm(\d{3})-runtime-ux-profile\.ts$/u,
    (id) => `BM-${id}`,
  );
  const imports = [...readFileSync(INDEX_PATH, "utf8").matchAll(
    /import\s+["']\.\/bm(\d{3})-runtime-ux-profile["'];?/gu,
  )]
    .map((match) => `BM-${match[1]}`)
    .sort();

  assert.equal(compiled.length, 213);
  assert.deepEqual(profiles, compiled);
  assert.equal(imports.length, 213, "each BM profile must be imported exactly once");
  assert.deepEqual(imports, compiled);
});

test("runtime UX generator refuses force mode even during dry-run", () => {
  const result = spawnSync(process.execPath, [GENERATOR_PATH, "--force", "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0, "--force must be rejected before generation");
  assert.match(result.stderr, /--force.*refused|refus.*--force/iu);
});
