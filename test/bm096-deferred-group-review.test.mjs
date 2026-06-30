/**
 * bm096-deferred-group-review.test.mjs
 *
 * Tests for BM-096 deferred group review plan.
 * Validates plan structure, classification counts, and safety assertions.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLAN_DIR = path.join(
  ROOT,
  "docs/audit/path-domain-binding-batch-2-bm096-deferred-review",
);
const LOCKED_PATH = path.join(
  ROOT,
  "docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json",
);

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

describe("BM096 Deferred Group Review Plan", () => {
  describe("plan.latest.json", () => {
    it("must exist", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      assert.ok(fs.existsSync(fp), "plan.latest.json must exist");
    });

    it("must parse as valid JSON", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.ok(typeof data === "object");
    });

    it("must have task = BM096_DEFERRED_GROUP_REVIEW_PLAN", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.equal(data.task, "BM096_DEFERRED_GROUP_REVIEW_PLAN");
    });

    it("must have status READY_FOR_PLANNER_REVIEW", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.equal(data.status, "READY_FOR_PLANNER_REVIEW");
    });

    it("must have codeGraphHealth block", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.ok(data.codeGraphHealth);
      assert.equal(data.codeGraphHealth.mcpToolAvailableInAgent, true);
    });
  });

  describe("planner-handoff.latest.json", () => {
    it("must exist", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      assert.ok(fs.existsSync(fp), "planner-handoff.latest.json must exist");
    });

    it("must have canApplyRunNow = false", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.equal(data.canApplyRunNow, false);
    });

    it("must have correct baseline metrics", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.equal(data.baselineMetrics.totalIssues, 1476);
      assert.equal(data.baselineMetrics.FAIL, 1154);
      assert.equal(data.baselineMetrics.REVIEW, 322);
      assert.equal(data.baselineMetrics.REMEDIATION_LEAK, 10);
      assert.equal(data.baselineMetrics.dbSync.matched, 213);
      assert.equal(data.baselineMetrics.dbSync.stale, 0);
    });

    it("must have plannerDecisionNeeded block", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.ok(data.plannerDecisionNeeded);
      assert.ok(Array.isArray(data.plannerDecisionNeeded.options));
      assert.ok(data.plannerDecisionNeeded.executorRecommendation.length > 0);
    });

    it("must have safetyAssertions with all true", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.ok(data.safetyAssertions);
      assert.equal(data.safetyAssertions.noLockedContractMutation, true);
      assert.equal(data.safetyAssertions.noCompiledV2Change, true);
      assert.equal(data.safetyAssertions.noDbPublish, true);
      assert.equal(data.safetyAssertions.noApplyRun, true);
      assert.equal(data.safetyAssertions.noDecisionsApproved, true);
    });
  });

  describe("Field Classification", () => {
    it("must have exactly 18 fields reviewed", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.equal(data.reviewedFieldsCount, 18);
      assert.equal(data.fields.length, 18);
    });

    it("must have exactly 2 CLEAN_NO_ISSUES fields", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const clean = data.fields.filter(
        (f) => f.classification === "CLEAN_NO_ISSUES",
      );
      assert.equal(clean.length, 2, "Must have exactly 2 clean fields");
    });

    it("must classify person.idNumber as DEFER_REQUIRED_POLICY_REVIEW", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const idNumber = data.fields.find((f) => f.path === "person.idNumber");
      assert.ok(idNumber, "person.idNumber must be in plan");
      assert.equal(idNumber.classification, "DEFER_REQUIRED_POLICY_REVIEW");
    });

    it("must have exactly 4 REVIEW_CANDIDATE_LABEL_ONLY fields", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const labelOnly = data.fields.filter(
        (f) => f.classification === "REVIEW_CANDIDATE_LABEL_ONLY",
      );
      assert.equal(labelOnly.length, 4, "Must have exactly 4 label-only candidates");
    });

    it("must have at least 11 DEFER_NO_VISIBLE_LABEL fields", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const defer = data.fields.filter(
        (f) => f.classification === "DEFER_NO_VISIBLE_LABEL",
      );
      assert.ok(
        defer.length >= 11,
        `Must have at least 11 deferred fields, got ${defer.length}`,
      );
    });

    it("must NOT have REVIEW_CANDIDATE_SAFE_REMAP", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const safeRemap = data.fields.filter(
        (f) => f.classification === "REVIEW_CANDIDATE_SAFE_REMAP",
      );
      assert.equal(safeRemap.length, 0, "No safe remap candidates in this batch");
    });

    it("classificationCounts must sum to 18", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      const total = Object.values(data.classificationCounts).reduce(
        (s, v) => s + v,
        0,
      );
      assert.equal(total, 18, "Classification counts must sum to 18");
    });
  });

  describe("Planner Handoff", () => {
    it("topCandidates must exist", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.ok(Array.isArray(data.topCandidates));
    });

    it("deferredItems must have at least 10 items", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.ok(data.deferredItems.length >= 10);
    });

    it("executorRecommendation must be non-empty", () => {
      const fp = path.join(PLAN_DIR, "planner-handoff.latest.json");
      const data = loadJson(fp);
      assert.ok(
        data.plannerDecisionNeeded.executorRecommendation.length > 0,
      );
    });
  });

  describe("Key Insights", () => {
    it("must have keyInsights block", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.ok(data.keyInsights, "keyInsights block must exist");
    });

    it("must note signature fields concern in keyInsights", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.ok(data.keyInsights.signatureFieldsNote || data.keyInsights.signatureFieldsMisclassified,
        "keyInsights must mention signature fields");
    });

    it("must note document.namSinh mismatch in keyInsights", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      assert.ok(
        data.keyInsights.documentNamSinhNote || data.keyInsights.document_namSinh,
        "keyInsights must mention document.namSinh",
      );
    });
  });

  describe("Safety Assertions", () => {
    it("no DECISIONS_APPROVED or APPLY files must be created", () => {
      const planFiles = fs.readdirSync(PLAN_DIR);
      const badFiles = planFiles.filter(
        (f) =>
          f.includes("decisions.approved") ||
          f.includes("decisions.draft") ||
          f.includes("apply."),
      );
      assert.equal(
        badFiles.length,
        0,
        `Must not create approval/apply files: ${badFiles.join(", ")}`,
      );
    });
  });

  describe("Evidence Quality", () => {
    it("every field must have path, label, rawPattern, and classification", () => {
      const fp = path.join(PLAN_DIR, "plan.latest.json");
      const data = loadJson(fp);
      for (const f of data.fields) {
        assert.ok(f.path, `${f.path}: must have path`);
        assert.ok(f.currentLabel !== undefined, `${f.path}: must have label`);
        assert.ok(f.rawPattern !== undefined, `${f.path}: must have rawPattern`);
        assert.ok(f.classification, `${f.path}: must have classification`);
      }
    });
  });
});
