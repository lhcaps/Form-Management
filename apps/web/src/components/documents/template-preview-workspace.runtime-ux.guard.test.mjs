import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const workspaceSource = readFileSync(
  resolve(here, "template-preview-workspace.tsx"),
  "utf8",
);
const bm002ProfileSource = readFileSync(
  resolve(
    here,
    "../../lib/runtime-ux/bm002-runtime-ux-profile.ts",
  ),
  "utf8",
);

test("template workspace resolves the profile by compiled contract code and passes it to the renderer", () => {
  assert.match(
    workspaceSource,
    /getRuntimeUxProfile\(runtime\.compiledContract\.templateCode\)/,
    "template route must resolve presentation metadata from the loaded compiled contract",
  );
  assert.match(
    workspaceSource,
    /<ContractV2Renderer[\s\S]*?uxProfile=\{uxProfile\}/,
    "template route must pass the reviewed presentation profile to ContractV2Renderer",
  );
});

test("BM-002 remains a non-runtime-ready profile while its template route receives reviewed UI metadata", () => {
  assert.match(bm002ProfileSource, /templateCode:\s*"BM-002"/);
  assert.doesNotMatch(
    bm002ProfileSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
    /runtimeReady:\s*true/,
    "BM-002 must not be promoted merely to receive a curated presentation",
  );
  assert.match(
    bm002ProfileSource,
    /description:\s*"[^"]+"/,
    "BM-002 profile must carry a reviewed workflow description",
  );
});

test("template workspace creates a persisted draft only from the explicit bridge action", () => {
  const bridgeCalls = workspaceSource.match(/createDraftFromTemplate\(\{/g) ?? [];
  assert.equal(bridgeCalls.length, 1, "template workspace must have one draft-bridge call site");
  assert.match(
    workspaceSource,
    /async function startOrContinueBridgeDraft\(\)[\s\S]*?createDraftFromTemplate\(\{/,
    "draft creation must remain inside the explicit bridge action",
  );
  assert.match(
    workspaceSource,
    /onClick=\{\(\) => void startOrContinueBridgeDraft\(\)\}/,
    "the bridge action must be initiated by an explicit user click",
  );
});
