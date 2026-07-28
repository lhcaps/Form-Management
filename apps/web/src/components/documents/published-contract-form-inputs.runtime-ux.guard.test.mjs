import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(
  here,
  "published-contract-form-inputs.tsx",
);
const source = readFileSync(sourcePath, "utf8");

test("published contract inputs resolve the same presentation profile as the template preview", () => {
  assert.match(
    source,
    /import\s*\{\s*getRuntimeUxProfile\s*\}\s*from\s*["']@\/lib\/runtime-ux["']/,
    "the persisted form must resolve the registered per-BM presentation profile",
  );
  assert.match(
    source,
    /getRuntimeUxProfile\(contract\.templateCode\)/,
    "profile lookup must use the compiled contract template code",
  );
  assert.match(
    source,
    /<ContractV2Renderer[\s\S]*?uxProfile=\{uxProfile\}/,
    "the persisted renderer must receive the reviewed presentation profile",
  );
});
