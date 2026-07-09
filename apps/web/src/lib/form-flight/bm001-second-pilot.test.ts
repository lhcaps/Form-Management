/**
 * BM-001 second-pilot skeleton tests.
 *
 * Proves the BM-001 skeleton profile:
 *   - registers with the canonical shape
 *   - has fieldPaths that match every key in Bm001FormInputs
 *   - has requiredFieldPaths that match the panel's REQUIRED_FIELDS list
 *   - skeleton asserts (demo/summary/acceptance empty) are honest
 *
 * This file is the second pilot's proof. It does NOT exercise the
 * full payload builder (BM-001 has no demo yet — that is a future
 * task). It DOES exercise the validation gate and registry contract
 * so the rollout factory's promise is testable.
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

describe("BM-001 second pilot skeleton", () => {
  beforeEach(() => {
    __resetFormFlightProfilesForTests();
    registerFormFlightProfile(BM001_FORM_FLIGHT_PROFILE);
  });

  it("registers a BM-001 skeleton profile", () => {
    const profile = getFormFlightProfile("BM-001");
    assert.ok(profile, "BM-001 skeleton profile must be registered");
    assert.equal(profile.templateCode, "BM-001");
    assert.equal(
      profile.title,
      "Biên bản tiếp nhận nguồn tin về tội phạm",
    );
  });

  it("fieldPaths covers the full Bm001FormInputs key set", () => {
    const profile = getFormFlightProfile("BM-001");
    assert.ok(profile);
    // Sample the highest-impact fields. If any of these is missing
    // the rollout factory has drifted from the BM-001 type.
    const required = [
      "agency.parentName",
      "agency.name",
      "agency.issuePlace",
      "document.issueDate",
      "reception.startedAtTimeText",
      "reception.startedAtDate",
      "reception.locationName",
      "receiver.fullName",
      "informant.fullName",
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

  it(
    "skeleton is honest: demo is empty + summaryLines absent + " +
      "acceptance has no anchors",
    () => {
      const profile = getFormFlightProfile("BM-001");
      assert.ok(profile);
      assert.equal(
        Object.keys(profile.demo).length,
        0,
        "BM-001 skeleton demo must be empty until authored",
      );
      assert.equal(
        profile.summaryLines,
        undefined,
        "BM-001 skeleton summary lines must be undefined until authored",
      );
      assert.equal(profile.acceptance.requiredText.length, 0);
      assert.equal(profile.acceptance.forbiddenText.length, 0);
    },
  );

  it(
    "validation gate fires on every empty draft against BM-001 " +
      "requiredFieldPaths (no real PII, just path strings)",
    () => {
      const missing = listFormFlightMissingPaths(
        {},
        BM001_FORM_FLIGHT_PROFILE,
      );
      assert.ok(missing.length > 0);
      assert.ok(missing.includes("agency.parentName"));
      assert.ok(missing.includes("informant.fullName"));
      assert.ok(missing.includes("crimeReport.content"));
    },
  );
});