import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectGeneratedFormPanel } from "./generated-form-panel-selector";

const bm001Panel = { name: "Bm001FormInputsPanel" };
const bm171Panel = { name: "Bm171FormInputsPanel" };
const publishedRuntime = { contractHash: "published-runtime-contract" };

describe("generated document form panel selector", () => {
  it("keeps BM-001 existing-good panel ahead of generic fallback", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-001",
        bmPanel: bm001Panel,
        publishedRuntime: null,
        profileStatus: "audit-only",
      }),
      "bm-panel",
    );
  });

  it("does not let BM-001 audit-only profile supersede its BM panel", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-001",
        bmPanel: bm001Panel,
        publishedRuntime,
        profileStatus: "audit-only",
      }),
      "bm-panel",
    );
  });

  it("does not let skeleton profile supersede an existing BM panel", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-001",
        bmPanel: bm001Panel,
        publishedRuntime,
        profileStatus: "skeleton",
      }),
      "bm-panel",
    );
  });

  it("keeps BM-171 panel selected by default", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-171",
        bmPanel: bm171Panel,
        publishedRuntime,
        profileStatus: "runtime-ready",
      }),
      "bm-panel",
    );
  });

  it("allows published runtime override only with explicit generated-ready status", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-171",
        bmPanel: bm171Panel,
        publishedRuntime,
        profileStatus: "generated-ready",
      }),
      "published-runtime",
    );
  });

  it("allows a persisted-ready Form Flight profile to select the contract-native panel", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-002",
        bmPanel: bm001Panel,
        publishedRuntime,
        profileStatus: "persisted-ready" as never,
      }),
      "published-runtime",
    );
  });

  it("uses published runtime when no BM-specific panel exists", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-999",
        bmPanel: null,
        publishedRuntime,
        profileStatus: null,
      }),
      "published-runtime",
    );
  });

  it("falls back to generic when no BM panel or published runtime exists", () => {
    assert.equal(
      selectGeneratedFormPanel({
        templateCode: "BM-999",
        bmPanel: null,
        publishedRuntime: null,
        profileStatus: null,
      }),
      "generic",
    );
  });
});
