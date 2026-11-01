import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../apps/web/src/components/documents/generated-document-workspace.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("persisted document workspace selects the contract-native adapter for every resolved contract", () => {
  assert.match(
    source,
    /createPersistedFormFlightProfile/,
    "workspace must derive persisted readiness from the resolved contract",
  );
  assert.match(
    source,
    /isPersistedReadyProfile/,
    "workspace must fail closed when the derived profile is not persisted-ready",
  );
  assert.match(
    source,
    /selectGeneratedFormPanel/,
    "workspace must use the generated-panel selector",
  );
  assert.doesNotMatch(
    source,
    /PERSISTED_ADAPTER_ALLOWLIST/,
    "a one-form persisted adapter allowlist must not gate the 213 contract-native forms",
  );
});
