import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ATTR_DIR = path.join(
  ROOT,
  "docs", "audit",
  "path-domain-binding-batch-1-bm096-single-candidate",
);
const ATTR_JSON = path.join(ATTR_DIR, "delta-attribution.latest.json");

describe("BM096 Apply Delta Attribution — Report Integrity", () => {
  let data;

  it("delta-attribution.latest.json must exist", () => {
    assert.ok(fs.existsSync(ATTR_JSON), `File not found: ${ATTR_JSON}`);
  });

  it("must parse as valid JSON", () => {
    data = JSON.parse(fs.readFileSync(ATTR_JSON, "utf8"));
    assert.ok(data, "parsed data must be truthy");
  });

  it("task must be BM096_APPLY_DELTA_ATTRIBUTION_REVIEW", () => {
    assert.strictEqual(data.task, "BM096_APPLY_DELTA_ATTRIBUTION_REVIEW");
  });

  describe("Issue Delta", () => {
    it("must have exactly 2 removed issues", () => {
      assert.strictEqual(data.issueDelta.removed.length, 2);
    });

    it("removed: BM-096 document.diaChi BAD_LABEL", () => {
      const r = data.issueDelta.removed.find(
        (i) =>
          i.templateCode === "BM-096" &&
          i.path === "document.diaChi" &&
          i.issueCode === "BAD_LABEL",
      );
      assert.ok(r, "BAD_LABEL on document.diaChi must be removed");
      assert.strictEqual(r.severity, "FAIL");
    });

    it("removed: BM-096 document.diaChi GENERIC_FIELD_CANONICALIZATION", () => {
      const r = data.issueDelta.removed.find(
        (i) =>
          i.templateCode === "BM-096" &&
          i.path === "document.diaChi" &&
          i.issueCode === "GENERIC_FIELD_CANONICALIZATION",
      );
      assert.ok(r, "GENERIC_FIELD_CANONICALIZATION on document.diaChi must be removed");
      assert.strictEqual(r.severity, "FAIL");
    });

    it("must have exactly 1 added issue", () => {
      assert.strictEqual(data.issueDelta.added.length, 1);
    });

    it("added: BM-096 person.idNumber REQUIRED_SUSPICIOUS", () => {
      const a = data.issueDelta.added[0];
      assert.strictEqual(a.templateCode, "BM-096");
      assert.strictEqual(a.path, "person.idNumber");
      assert.strictEqual(a.issueCode, "REQUIRED_SUSPICIOUS");
      assert.strictEqual(a.severity, "REVIEW");
    });

    it("no severity-changed issues", () => {
      assert.strictEqual(data.issueDelta.severityChanged.length, 0);
    });
  });

  describe("Metrics Delta", () => {
    it("totalIssues delta must be -1", () => {
      assert.strictEqual(data.metricDelta.totalIssues, -1);
    });

    it("FAIL delta must be -2", () => {
      assert.strictEqual(data.metricDelta.FAIL, -2);
    });

    it("REVIEW delta must be +1", () => {
      assert.strictEqual(data.metricDelta.REVIEW, 1);
    });

    it("BAD_LABEL delta must be -1", () => {
      assert.strictEqual(data.metricDelta.BAD_LABEL, -1);
    });

    it("GENERIC_FIELD_CANONICALIZATION delta must be -1", () => {
      assert.strictEqual(data.metricDelta.GENERIC_FIELD_CANONICALIZATION, -1);
    });

    it("REQUIRED_SUSPICIOUS delta must be +1", () => {
      assert.strictEqual(data.metricDelta.REQUIRED_SUSPICIOUS, 1);
    });

    it("REMEDIATION_LEAK delta must be 0", () => {
      assert.strictEqual(data.metricDelta.REMEDIATION_LEAK, 0);
    });

    it("COMPILED_DRIFT delta must be 0", () => {
      assert.strictEqual(data.metricDelta.COMPILED_DRIFT, 0);
    });

    it("SOURCE_MISMATCH delta must be 0", () => {
      assert.strictEqual(data.metricDelta.SOURCE_MISMATCH, 0);
    });
  });

  describe("REQUIRED_SUSPICIOUS Attribution", () => {
    it("netDelta must be +1", () => {
      assert.strictEqual(data.rsAttribution.netDelta, 1);
    });

    it("isBM096MutationCaused must be true", () => {
      assert.strictEqual(data.rsAttribution.isBM096MutationCaused, true);
    });

    it("bm096Candidate must reference person.idNumber in BM-096", () => {
      const c = data.rsAttribution.bm096Candidate;
      assert.ok(c, "bm096Candidate must exist");
      assert.strictEqual(c.templateCode, "BM-096");
      assert.strictEqual(c.path, "person.idNumber");
      assert.strictEqual(c.severity, "REVIEW");
    });

    it("assessment must indicate INCREASE", () => {
      assert.ok(
        data.rsAttribution.assessment.includes("INCREASE"),
        "assessment must describe the +1 increase",
      );
    });
  });

  describe("REVIEW Attribution", () => {
    it("netDelta must be +1", () => {
      assert.strictEqual(data.reviewAttribution.netDelta, 1);
    });

    it("isBM096MutationCaused must be true", () => {
      assert.strictEqual(data.reviewAttribution.isBM096MutationCaused, true);
    });

    it("newlyAdded must contain BM-096 person.idNumber REQUIRED_SUSPICIOUS REVIEW", () => {
      const a = data.reviewAttribution.newlyAdded.find(
        (i) =>
          i.templateCode === "BM-096" &&
          i.path === "person.idNumber" &&
          i.issueCode === "REQUIRED_SUSPICIOUS",
      );
      assert.ok(a, "BM-096 person.idNumber REQUIRED_SUSPICIOUS must be newly added REVIEW");
    });
  });

  describe("Mutation Assessment", () => {
    it("removedIssues must have 2 FAIL issues from document.diaChi", () => {
      assert.strictEqual(data.mutationAssessment.removedIssues.length, 2);
      data.mutationAssessment.removedIssues.forEach((i) => {
        assert.strictEqual(i.templateCode, "BM-096");
        assert.strictEqual(i.path, "document.diaChi");
        assert.strictEqual(i.severity, "FAIL");
      });
    });

    it("addedIssues must have 1 REVIEW issue on person.idNumber", () => {
      assert.strictEqual(data.mutationAssessment.addedIssues.length, 1);
      const a = data.mutationAssessment.addedIssues[0];
      assert.strictEqual(a.templateCode, "BM-096");
      assert.strictEqual(a.path, "person.idNumber");
      assert.strictEqual(a.severity, "REVIEW");
    });

    it("requiredSuspiciousNote must explain unmasking", () => {
      assert.ok(
        data.mutationAssessment.requiredSuspiciousNote.includes("unmasked") ||
          data.mutationAssessment.requiredSuspiciousNote.includes("UNMASKED"),
        "note must explain that the issue was unmasked, not caused",
      );
    });
  });

  describe("Safety Assertion Correction", () => {
    it("noMetricRegression value must be false (REQUIRED_SUSPICIOUS increased)", () => {
      assert.strictEqual(data.safetyAssertionCorrection.value, false);
    });

    it("isMutationFault must be false", () => {
      assert.strictEqual(data.safetyAssertionCorrection.isMutationFault, false);
    });

    it("isUnmasking must be true", () => {
      assert.strictEqual(data.safetyAssertionCorrection.isUnmasking, true);
    });

    it("followUpNeeded must be true", () => {
      assert.strictEqual(data.safetyAssertionCorrection.followUpNeeded, true);
    });

    it("followUpAction must mention human review of required field", () => {
      assert.ok(
        data.safetyAssertionCorrection.followUpAction.toLowerCase().includes("required"),
        "followUpAction must mention required field review",
      );
    });
  });

  describe("Conclusion", () => {
    it("mutationAccepted must be true", () => {
      assert.strictEqual(data.conclusion.mutationAccepted, true);
    });

    it("rollbackNeeded must be false", () => {
      assert.strictEqual(data.conclusion.rollbackNeeded, false);
    });

    it("nextBatchAllowed must be true", () => {
      assert.strictEqual(data.conclusion.nextBatchAllowed, true);
    });

    it("followUpItems must contain human review item for BM-096 person.idNumber required", () => {
      const item = data.conclusion.followUpItems.find(
        (i) =>
          i.templateCode === "BM-096" &&
          i.path === "person.idNumber",
      );
      assert.ok(item, "followUpItems must include BM-096 person.idNumber");
      assert.strictEqual(item.type, "HUMAN_REVIEW");
    });
  });
});
