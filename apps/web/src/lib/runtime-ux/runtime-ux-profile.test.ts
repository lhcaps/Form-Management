import assert from "node:assert/strict";
import test from "node:test";

import {
  __resetRuntimeUxProfilesForTests,
  getRuntimeUxProfile,
  listRegisteredRuntimeUxProfiles,
  registerRuntimeUxProfile,
} from "./runtime-ux-profile";

test("getRuntimeUxProfile returns null when no profile is registered", () => {
  __resetRuntimeUxProfilesForTests();
  const profile = getRuntimeUxProfile("BM-DOES-NOT-EXIST");
  assert.equal(profile, null);
});

test("registerRuntimeUxProfile stores a clone (mutation isolation)", () => {
  __resetRuntimeUxProfilesForTests();

  registerRuntimeUxProfile({
    templateCode: "BM-TEST",
    versionLabel: "v1",
    sections: [
      { sectionId: "section-a", title: "Section A" },
    ],
    fields: {
      "field.x": { label: "Field X" },
    },
    demo: { "field.x": "demo-value" },
  });

  const profile = getRuntimeUxProfile("BM-TEST");
  assert.ok(profile);

  // Mutating the returned profile must NOT affect the registry.
  (profile!.sections as unknown as { title: string }[])[0].title = "MUTATED";
  (profile!.demo as Record<string, string>)["field.x"] = "MUTATED";

  const reread = getRuntimeUxProfile("BM-TEST");
  assert.equal(reread!.sections[0].title, "Section A");
  assert.equal(reread!.demo["field.x"], "demo-value");
});

test("listRegisteredRuntimeUxProfiles returns sorted codes", () => {
  __resetRuntimeUxProfilesForTests();
  registerRuntimeUxProfile({
    templateCode: "BM-999",
    versionLabel: "v1",
    sections: [],
    fields: {},
    demo: {},
  });
  registerRuntimeUxProfile({
    templateCode: "BM-001",
    versionLabel: "v1",
    sections: [],
    fields: {},
    demo: {},
  });
  registerRuntimeUxProfile({
    templateCode: "BM-100",
    versionLabel: "v1",
    sections: [],
    fields: {},
    demo: {},
  });
  assert.deepEqual(listRegisteredRuntimeUxProfiles(), [
    "BM-001",
    "BM-100",
    "BM-999",
  ]);
});