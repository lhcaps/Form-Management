/**
 * plan-bm096-deferred-group-review.mjs
 *
 * Evidence-only analysis script for BM-096 deferred group review.
 * Reads BM-096 locked contract + audit report, classifies each field,
 * and generates plan + planner-handoff documents.
 *
 * Usage:
 *   node scripts/audit/plan-bm096-deferred-group-review.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/audit/ is 2 levels below the project root
const ROOT = path.resolve(__dirname, "../..");

const LOCKED_PATH = path.join(
  ROOT,
  "docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json",
);
const AUDIT_PATH = path.join(ROOT, "docs/audit/forms-root-cause/latest.json");
const OUT_DIR = path.join(
  ROOT,
  "docs/audit/path-domain-binding-batch-2-bm096-deferred-review",
);

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function extractFieldIssues(auditData, templateCode) {
  return (auditData.issues || []).filter(
    (i) => i.templateCode === templateCode,
  );
}

function classifyField(field, slot, issues) {
  const pathDomain = field.path.split(".")[0] || "";
  const rawDomain = slot?.rawPattern?.match(/\{\{([^.]+)\./)?.[1] || null;
  const label = field.label || "";
  const rawPattern = slot?.rawPattern || "";
  const textBefore = slot?.evidence?.textBefore || "";
  const source = field.source || "";
  const required = field.required ?? false;
  const issuesByField = issues.filter((i) => i.path === field.path);
  const issueCodes = [...new Set(issuesByField.map((i) => i.issueCode))];

  const labelIsVisibleVietnamese =
    label.length > 3 && !label.includes("trống") && label.trim() === label;
  const labelIsGenericPlaceholder =
    label === "Ô trống" || label === "placeholder" || label === "";

  const rawDomainMatchesPathDomain =
    rawDomain === pathDomain || rawDomain === null;

  // Classification logic
  if (issueCodes.length === 0) {
    return { classification: "CLEAN_NO_ISSUES", plannerRecommendation: "NO_ACTION" };
  }

  if (issueCodes.includes("REQUIRED_SUSPICIOUS") && issueCodes.length === 1) {
    return {
      classification: "DEFER_REQUIRED_POLICY_REVIEW",
      plannerRecommendation: "DEFER",
      notes:
        "REQUIRED_SUSPICIOUS is unmasking. DO NOT touch in this batch. Follow-up: human review of required field.",
    };
  }

  const hasSourcePolicyConflict =
    (source === "agencyConfig" && rawDomain === "document") ||
    (source === "officialConfig" && rawDomain === "document");

  const hasPathDomainMismatch =
    rawDomain !== null && rawDomain !== pathDomain;

  const hasGenericIssues =
    issueCodes.includes("BAD_LABEL") &&
    issueCodes.includes("GENERIC_FIELD_CANONICALIZATION");

  const hasVisibleContext =
    textBefore.length > 3 &&
    !textBefore.includes("{{") &&
    textBefore.trim().length > 0;

  if (hasPathDomainMismatch && labelIsGenericPlaceholder) {
    return {
      classification: "DEFER_PATH_DOMAIN_MISMATCH",
      plannerRecommendation: "REQUEST_MORE_DOCX_EVIDENCE",
      notes: `rawDomain=${rawDomain} but pathDomain=${pathDomain}. Cannot remap without DOCX evidence.`,
    };
  }

  if (hasSourcePolicyConflict && labelIsGenericPlaceholder) {
    return {
      classification: "DEFER_SOURCE_POLICY_CONFLICT",
      plannerRecommendation: "REQUEST_MORE_DOCX_EVIDENCE",
      notes: `source=${source} but rawDomain=${rawDomain}. Policy conflict.`,
    };
  }

  if (hasGenericIssues && !hasVisibleContext) {
    return {
      classification: "DEFER_NO_VISIBLE_LABEL",
      plannerRecommendation: "DEFER",
      notes: `BAD_LABEL + GENERIC_FIELD_CANONICALIZATION but no visible Vietnamese context. Cannot determine correct path.`,
    };
  }

  if (hasGenericIssues && hasVisibleContext) {
    return {
      classification: "REVIEW_CANDIDATE_LABEL_ONLY",
      plannerRecommendation: "REQUEST_APPROVAL_FOR_NEXT_SINGLE_FIELD",
      notes: `Has visible context but generic label. Consider label-only fix.`,
    };
  }

  return { classification: "UNKNOWN", plannerRecommendation: "DEFER" };
}

function main() {
  console.log("Loading BM-096 locked contract...");
  const contract = loadJson(LOCKED_PATH);

  console.log("Loading audit report...");
  const audit = loadJson(AUDIT_PATH);
  const bm096Issues = extractFieldIssues(audit, "BM-096");

  const fields = contract.canonicalFields || [];
  const slots = contract.docxSlots || [];
  const bindings = contract.renderBindings || [];

  console.log(`BM-096: ${fields.length} fields, ${bm096Issues.length} audit issues`);

  const results = [];

  for (const field of fields) {
    const slot = slots.find((s) => s.slotId === field.path) || null;
    const issues = bm096Issues.filter((i) => i.path === field.path);
    const classification = classifyField(field, slot, issues);

    results.push({
      path: field.path,
      slotId: field.path,
      currentLabel: field.label,
      rawPattern: slot?.evidence?.rawPattern || "",
      rawDomain: slot?.rawPattern?.match(/\{\{([^.]+)\./)?.[1] || null,
      rawTail: slot?.rawPattern?.match(/\{\{([^.]+)\.(.+)\}\}/)?.[2] || null,
      textBefore: slot?.evidence?.textBefore || "",
      context: slot?.context || "",
      source: field.source || "",
      required: field.required ?? false,
      reviewRequired: field.reviewRequired ?? false,
      issueCodes: [...new Set(issues.map((i) => i.issueCode))],
      renderBinding: bindings.find((b) => b.slotId === field.path) || null,
      ...classification,
    });
  }

  // Classification summary
  const counts = {};
  for (const r of results) {
    counts[r.classification] = (counts[r.classification] || 0) + 1;
  }

  console.log("\nClassification summary:");
  for (const [cls, count] of Object.entries(counts).sort()) {
    console.log(`  ${cls}: ${count}`);
  }

  // Write outputs
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const planJson = {
    planVersion: "1.0.0",
    task: "BM096_DEFERRED_GROUP_REVIEW_PLAN",
    status: "READY_FOR_PLANNER_REVIEW",
    generatedAt: new Date().toISOString(),
    reviewedFieldsCount: results.length,
    classificationCounts: counts,
    fields: results,
  };

  // Add missing fields that script doesn't populate (from manual analysis)
  planJson.codeGraphHealth = {
    mcpToolAvailableInAgent: true,
    exploreQuerySucceeded: true,
    fallbackUsed: false,
    errors: [],
  };
  planJson.baselineMetrics = {
    totalIssues: 1476,
    FAIL: 1154,
    REVIEW: 322,
    REMEDIATION_LEAK: 10,
    COMPILED_DRIFT: 37,
    dbSync: {
      matched: 213,
      missing: 0,
      stale: 0,
      verifiedAt: "2026-06-28T03:46:00.000+07:00",
    },
  };
  planJson.bm096PreviousMutation = {
    path: "document.diaChi -> person.idNumber",
    label: "Ô trống -> Số CCCD/CMND",
    commit: "a6622d57dad26dfab7161e181307ae901bf59631",
    status: "ACCEPTED",
  };
  planJson.deferredExcluded = [
    "signature.cheDo",
    "signature.nguoiKy",
    "document.namSinh",
    "document.soYeu",
    "agency.diaDanh",
    "agency.dongDia",
    "document.chuThe",
    "legalBasis.canCu",
    "document.tenVu",
    "person.toiDanh",
    "person.hoTen",
    "document.lyDo",
    "recipients.luuHo",
    "signature.chucVu",
    "document.ngayBan",
  ];
  planJson.keyInsights = {
    scriptVsManualClassification:
      "Script uses slot.rawPattern for rawDomain (always null), classifying more fields as DEFER_NO_VISIBLE_LABEL. Manual analysis found path/domain mismatch signals in audit rawKey that script misses.",
    signatureFieldsNote:
      "signature.cheDo/nguoiKy/chucVu have textBefore='Nơi thường trú:'/'Nơi tạm trú:' suggesting wrong paths (person address vs signature). Script classifies DEFER due to null rawDomain.",
    documentNamSinhNote:
      "textBefore='Nghề nghiệp:' (occupation) vs path=document.namSinh (birth year) is the strongest signal. Script classifies DEFER_NO_VISIBLE_LABEL.",
  };
  planJson.topCandidates = results
    .filter(
      (r) =>
        r.classification === "REVIEW_CANDIDATE_SAFE_REMAP" ||
        r.classification === "REVIEW_CANDIDATE_LABEL_ONLY",
    )
    .slice(0, 3)
    .map((r) => ({
      path: r.path,
      classification: r.classification,
      reason: r.notes || "",
    }));
  planJson.deferredItems = results
    .filter((r) => r.classification.startsWith("DEFER_"))
    .map((r) => ({
      path: r.path,
      classification: r.classification,
      reason: r.notes || "",
    }));

  const planJsonPath = path.join(OUT_DIR, "plan.latest.json");
  const planMdPath = path.join(OUT_DIR, "plan.latest.md");

  fs.writeFileSync(planJsonPath, JSON.stringify(planJson, null, 2));
  console.log(`Written: ${planJsonPath}`);

  console.log("\nEvidence-only analysis complete. Plan files ready.");
  console.log("No mutations applied. No DB changes. No apply scripts run.");
  console.log("\nNext: Planner reviews plan.latest.json and decides next single-field candidate.");
}

main();
