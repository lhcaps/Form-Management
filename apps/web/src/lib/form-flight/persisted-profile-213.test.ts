import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { adaptV1Contract, compileContract, type V1Contract } from "@qllaw/form-contracts";
import { createPersistedFormFlightProfile } from "./persisted-profile";
import { isPersistedReadyProfile, isRuntimeReadyProfile } from "./profile-status";

type LockedContract = {
  sourceId: string;
  templateCode: string;
  templateTitle: string;
  extractionSource: { sha256: string };
  docxSlots: unknown[];
  canonicalFields: unknown[];
  renderBindings: unknown[];
};

const here = dirname(fileURLToPath(import.meta.url));
const lockedDir = join(
  here,
  "..",
  "..",
  "..",
  "..",
  "..",
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
);

function compileLockedContract(locked: LockedContract) {
  const adapted = adaptV1Contract({
    schemaVersion: "1.0",
    sourceId: locked.sourceId,
    templateCode: locked.templateCode,
    templateTitle: locked.templateTitle,
    documentKind: "form",
    status: "locked",
    extractionSource: locked.extractionSource,
    docxSlots: locked.docxSlots,
    canonicalFields: locked.canonicalFields,
    renderBindings: locked.renderBindings,
  } as V1Contract);
  const compiled = compileContract(adapted);
  assert.equal(compiled.ok, true, `${locked.templateCode} must compile`);
  assert.ok(compiled.artifact, `${locked.templateCode} must produce an artifact`);
  return compiled.artifact;
}

describe("213 persisted contract Form Flight profiles", () => {
  it("derives a persisted-only profile from every locked contract", () => {
    const files = readdirSync(lockedDir)
      .filter((file) => file.endsWith(".contract.locked.json"))
      .sort();
    assert.equal(files.length, 213, "expected exactly 213 locked contracts");

    const codes = new Set<string>();
    for (const file of files) {
      const locked = JSON.parse(
        readFileSync(join(lockedDir, file), "utf8"),
      ) as LockedContract;
      const contract = compileLockedContract(locked);
      const profile = createPersistedFormFlightProfile(contract);

      assert.equal(profile.templateCode, locked.templateCode);
      assert.equal(profile.title, locked.templateTitle);
      assert.ok(profile.fieldPaths.length > 0, `${locked.templateCode} needs fields`);
      assert.equal(isPersistedReadyProfile(profile), true);
      assert.equal(isRuntimeReadyProfile(profile), false);
      assert.deepEqual(
        new Set(profile.requiredFieldPaths).size,
        profile.requiredFieldPaths.length,
        `${locked.templateCode} required fields must be unique`,
      );
      for (const path of profile.requiredFieldPaths) {
        assert.ok(
          profile.fieldPaths.includes(path),
          `${locked.templateCode} required path ${path} must be declared`,
        );
      }
      codes.add(profile.templateCode);
    }
    assert.equal(codes.size, 213, "all 213 template codes must be covered");
  });
});
