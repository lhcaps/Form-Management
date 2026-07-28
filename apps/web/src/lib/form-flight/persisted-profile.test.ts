import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CompiledFormContract } from "@qllaw/form-contracts";
import { isRuntimeReadyProfile } from "./profile-status";
import * as persistedProfile from "./persisted-profile";

const contract = {
  templateCode: "BM-002",
  title: "Biểu mẫu kiểm thử",
  source: {
    fields: [
      { key: "document.code", required: true },
      { key: "sender.name", required: false },
      { key: "document.code", required: true },
    ],
  },
} as unknown as CompiledFormContract;

describe("persisted contract Form Flight profile", () => {
  it("derives a persisted-only profile from the authoritative compiled contract", () => {
    const createPersistedFormFlightProfile = (
      persistedProfile as typeof persistedProfile & {
        createPersistedFormFlightProfile?: (
          value: CompiledFormContract,
        ) => {
          templateCode: string;
          title: string;
          fieldPaths: readonly string[];
          requiredFieldPaths: readonly string[];
          persistedReady?: boolean;
          profileStatus?: string;
        };
      }
    ).createPersistedFormFlightProfile;

    assert.equal(typeof createPersistedFormFlightProfile, "function");
    const profile = createPersistedFormFlightProfile?.(contract);
    assert.ok(profile);
    assert.equal(profile.templateCode, "BM-002");
    assert.equal(profile.title, "Biểu mẫu kiểm thử");
    assert.deepEqual(profile.fieldPaths, ["document.code", "sender.name"]);
    assert.deepEqual(profile.requiredFieldPaths, ["document.code"]);
    assert.equal(profile.persistedReady, true);
    assert.equal(profile.profileStatus, "persisted-ready");
    assert.equal(isRuntimeReadyProfile(profile), false);
  });
});
