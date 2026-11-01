/**
 * BM-001 second-pilot runtime-ready tests.
 *
 * Proves that the promoted BM-001 profile:
 *   - registers with the canonical runtime-ready shape
 *   - covers all 39 locked-contract field paths
 *   - keeps requiredFieldPaths inside fieldPaths
 *   - provides authored demo, summary, and acceptance evidence
 *   - blocks an empty draft on the required legal fields
 */

import { strict as assert } from "node:assert";
import { describe, it, beforeEach } from "node:test";

import {
  getFormFlightProfile,
  registerFormFlightProfile,
  __resetFormFlightProfilesForTests,
} from "./registry";
import { BM001_FORM_FLIGHT_PROFILE } from "./profiles/bm001";
import { assertProfileInvariant } from "./adapters/generated-document-adapter";
import { listFormFlightMissingPaths } from "./validation";

describe("BM-001 second pilot runtime-ready profile", () => {
  beforeEach(() => {
    __resetFormFlightProfilesForTests();
    registerFormFlightProfile(BM001_FORM_FLIGHT_PROFILE);
  });

  it("registers the BM-001 runtime-ready profile", () => {
    const profile = getFormFlightProfile("BM-001");
    assert.ok(profile, "BM-001 runtime-ready profile must be registered");
    assert.equal(profile.templateCode, "BM-001");
    assert.equal(
      profile.title,
      "Biên bản tiếp nhận nguồn tin về tội phạm",
    );
    assert.equal(profile.runtimeReady, true);
    assert.equal(profile.profileStatus, "runtime-ready");
  });

  it("fieldPaths covers the full Bm001FormInputs key set", () => {
    const profile = getFormFlightProfile("BM-001");
    assert.ok(profile);
    // Sample the highest-impact fields. If any of these is missing
    // the rollout factory has drifted from the BM-001 type.
    const required = [
      "document.issuePlaceDateLine",
      "receiver.fullName",
      "receiver.positionTitle",
      "receiver.departmentName",
      "informant.fullName",
      "informant.birthYear",
      "reception.startedAtTimeText",
      "reception.startedAtDay",
      "reception.locationName",
      "crimeReport.content",
      "recipients.archiveLine",
    ];
    for (const path of required) {
      assert.ok(
        profile.fieldPaths.includes(path),
        `fieldPaths must contain ${path}`,
      );
    }
  });

  it(
    "requiredFieldPaths includes the BM-001 mandatory keys " +
      "(reception.startedAtTimeText, informant.fullName, crimeReport.content)",
    () => {
      const profile = getFormFlightProfile("BM-001");
      assert.ok(profile);
      assert.ok(
        profile.requiredFieldPaths.includes("reception.startedAtTimeText"),
      );
      assert.ok(
        profile.requiredFieldPaths.includes("informant.fullName"),
      );
      assert.ok(profile.requiredFieldPaths.includes("crimeReport.content"));
    },
  );

  it("profile invariant holds: requiredFieldPaths ⊆ fieldPaths", () => {
    assert.equal(assertProfileInvariant(BM001_FORM_FLIGHT_PROFILE), "");
  });

  it("ships authored runtime-ready demo, summary, and acceptance evidence", () => {
    const profile = getFormFlightProfile("BM-001");
    assert.ok(profile);
    assert.equal(
      Object.keys(profile.demo).length,
      profile.fieldPaths.length,
      "BM-001 demo must cover every locked-contract field path",
    );
    assert.equal(profile.fieldPaths.length, 39);
    assert.equal(profile.summaryLines?.length, 8);
    assert.ok(profile.acceptance.requiredText.length > 0);
    assert.ok(profile.acceptance.forbiddenText.length > 0);
  });

  it(
    "validation gate fires on every empty draft against BM-001 " +
      "requiredFieldPaths (no real PII, just path strings)",
    () => {
      const missing = listFormFlightMissingPaths(
        {},
        BM001_FORM_FLIGHT_PROFILE,
      );
      assert.ok(missing.length > 0);
      assert.ok(missing.includes("document.issuePlaceDateLine"));
      assert.ok(missing.includes("informant.fullName"));
      assert.ok(missing.includes("crimeReport.content"));
    },
  );
});
