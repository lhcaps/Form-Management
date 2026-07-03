import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("admin auth identities shadcn migration", () => {
  it("uses the local shadcn primitives for the major workflow surfaces", () => {
    assert.match(source, /@\/components\/ui\/dialog/);
    assert.match(source, /@\/components\/ui\/alert-dialog/);
    assert.match(source, /@\/components\/ui\/table/);
    assert.match(source, /@\/components\/ui\/input/);
    assert.match(source, /@\/components\/ui\/badge/);
    assert.match(source, /from "lucide-react"/);
  });

  it("does not keep the hand-rolled modal, table, button, or inline svg shells", () => {
    assert.doesNotMatch(source, /function (RefreshIcon|SearchIcon|LinkIcon|UnlinkIcon|CloseIcon)/);
    assert.doesNotMatch(source, /<button\b/);
    assert.doesNotMatch(source, /<table\b/);
    assert.doesNotMatch(source, /<svg\b/);
    assert.doesNotMatch(source, /bg-black\/40|bg-rose-600|focus:ring-blue-100/);
  });
});
