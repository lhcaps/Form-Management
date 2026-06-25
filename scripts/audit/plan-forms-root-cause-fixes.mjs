#!/usr/bin/env node
/**
 * plan-forms-root-cause-fixes.mjs - FORMS_ROOT_CAUSE_FIX_PLAN task.
 *
 * Reads v2 root-cause audit issues and classifies each into actionable groups:
 *   AUTO_FIX_CANDIDATE    — safe, high-confidence, deterministic fix
 *   REVIEW_FIX_CANDIDATE  — fixable but needs human review
 *   MANUAL_LEGAL_REVIEW   — requires legal/procedural judgment
 *   DO_NOT_FIX_NOISE_OR_DERIVED — noise, duplicates, or derived from other issues
 *   BLOCKED_BY_DOCX_AUTHORING — needs DOCX reauthoring
 *   BLOCKED_BY_COMPILED_DRIFT_REBUILD — fix is "recompile compiled-v2"
 *
 * Exit codes:
 *   0 — report generated.
 *   1 — unclassifiedCount > 0 OR any AUTO_FIX_CANDIDATE has applySafe=false.
 *
 * Usage:
 *   node scripts/audit/plan-forms-root-cause-fixes.mjs
 *   pnpm plan:forms-root-cause-fixes
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const AUDIT_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause');
const PLAN_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan');
const AUDIT_JSON = join(AUDIT_DIR, 'latest.json');

// =============================================================================
// CLASSIFICATION BUCKETS
// =============================================================================

const CLASS = {
  AUTO_FIX: 'AUTO_FIX_CANDIDATE',
  REVIEW_FIX: 'REVIEW_FIX_CANDIDATE',
  MANUAL_LEGAL: 'MANUAL_LEGAL_REVIEW',
  NOISE_OR_DERIVED: 'DO_NOT_FIX_NOISE_OR_DERIVED',
  BLOCKED_DOCX: 'BLOCKED_BY_DOCX_AUTHORING',
  BLOCKED_COMPILED: 'BLOCKED_BY_COMPILED_DRIFT_REBUILD',
};

// =============================================================================
// KNOWN LABEL MAPPINGS (from field-labels.ts PATH_OVERRIDES)
// =============================================================================

const KNOWN_LABEL_OVERRIDE = {
  // Document
  'document.issuePlaceDateLine': 'Địa điểm, ngày lập',
  'document.fullDocumentCode': 'Số văn bản',
  'document.documentCode': 'Số văn bản',
  'document.issueDate': 'Ngày ban hành',
  'document.issueNumber': 'Số ký hiệu',
  'document.issueOffice': 'Cơ quan ban hành',
  'document.signerTitle': 'Chức danh người ký',
  'document.signerName': 'Người ký',
  // Receiver
  'receiver.fullName': 'Họ tên người tiếp nhận',
  'receiver.positionTitle': 'Chức vụ',
  'receiver.departmentName': 'Đơn vị công tác',
  'receiver.signerName': 'Người ký',
  'receiver.name': 'Tên người tiếp nhận',
  // Informant
  'informant.fullName': 'Họ tên người cung cấp tin',
  'informant.genderLabel': 'Giới tính',
  'informant.otherName': 'Tên gọi khác',
  'informant.birthDay': 'Ngày sinh',
  'informant.birthMonth': 'Tháng sinh',
  'informant.birthYear': 'Năm sinh',
  'informant.birthDate': 'Ngày sinh',
  'informant.placeOfBirth': 'Nơi sinh',
  'informant.nationality': 'Quốc tịch',
  'informant.ethnicity': 'Dân tộc',
  'informant.religion': 'Tôn giáo',
  'informant.address': 'Địa chỉ',
  'informant.job': 'Nghề nghiệp',
  'informant.workplace': 'Nơi làm việc',
  'informant.signerName': 'Người ký',
  // Agency
  'agency.name': 'Tên cơ quan',
  'agency.parentName': 'Cơ quan cấp trên',
  'agency.parentNameUpper': 'Cơ quan cấp trên viết hoa',
  'agency.shortName': 'Tên viết tắt',
  // Legal Basis
  'legalBasis.procedureArticlesLine': 'Căn cứ pháp lý',
  'legalBasis.articleLine': 'Điều luật',
  // Case
  'caseInfo.caseNumber': 'Số vụ án',
  'caseInfo.investigatorUnit': 'Đơn vị điều tra',
  'caseInfo.prosecutorName': 'Kiểm sát viên',
  'caseInfo.investigatorName': 'Điều tra viên',
  'caseInfo.reviewProsecutorName': 'Kiểm sát viên rào xét',
  'caseInfo.accusedName': 'Bị can / Bị cáo',
  'caseInfo.arrestDate': 'Ngày bắt',
  'caseInfo.arrestPlace': 'Nơi bắt',
  'caseInfo.crimeDate': 'Ngày phạm tội',
  'caseInfo.crimePlace': 'Nơi phạm tội',
  // Offense
  'offense.articleNumber': 'Điều luật',
  'offense.offenseName': 'Tội danh',
  'offense.lawClause': 'Khoản',
  // Person
  'person.fullName': 'Họ tên',
  'person.birthDay': 'Ngày sinh',
  'person.birthMonth': 'Tháng sinh',
  'person.birthYear': 'Năm sinh',
  'person.genderLabel': 'Giới tính',
  'person.positionTitle': 'Chức vụ',
  'person.departmentName': 'Đơn vị công tác',
  'person.address': 'Địa chỉ',
  // Reporter
  'reporter.fullName': 'Họ tên người báo tin',
  'reporter.genderLabel': 'Giới tính',
  'reporter.birthDay': 'Ngày sinh',
  'reporter.birthMonth': 'Tháng sinh',
  'reporter.birthYear': 'Năm sinh',
  'reporter.positionTitle': 'Chức vụ',
  'reporter.departmentName': 'Đơn vị công tác',
  'reporter.address': 'Địa chỉ',
  'reporter.nationality': 'Quốc tịch',
  // Official
  'official.fullName': 'Họ tên',
  'official.positionTitle': 'Chức vụ',
  'official.departmentName': 'Đơn vị công tác',
  // Signature
  'signature.signerName': 'Người ký',
  'signature.signerTitle': 'Chức danh',
  'signature.signerPosition': 'Chức vụ',
  'signature.positionTitle': 'Chức vụ',
  'signature.signDate': 'Ngày ký',
  // Proposal
  'proposal.prosecutorName': 'Kiểm sát viên',
  'proposal.decisionDate': 'Ngày quyết định',
  // Decision
  'decision.decisionNumber': 'Số quyết định',
  'decision.decisionDate': 'Ngày quyết định',
  'decision.decisionPlace': 'Nơi ban hành',
  'decision.signerName': 'Người ký',
  'decision.signerTitle': 'Chức danh',
};

// Paths that have known label override (high confidence for auto-fix)
const HAS_KNOWN_LABEL = new Set(Object.keys(KNOWN_LABEL_OVERRIDE));

// =============================================================================
// DOMAIN / SOURCE HELPERS
// =============================================================================

const LEGAL_BASIS_PATHS = /^legalBasis\./;
const LEGAL_DECISION_PATHS = /^(decision|measure|approval|prosecution|investigation)\./;
const LEGAL_FIELDS = /^(legalBasis|decision|measure|approval|prosecution|investigation|offense|caseInfo|casePayload)\./;
const GENERIC_RAW_TAIL = /^field\d+$/i;

const READONLY_SOURCES = new Set(['agencyConfig', 'officialConfig', 'systemDate', 'computed']);

// =============================================================================
// CLASSIFICATION ENGINE
// =============================================================================

function classifyIssue(issue) {
  const {
    templateCode, path, label, source, rawPattern, rawTail, rawDomain,
    issueCode, severity, reason, context, suggestedPath, suggestedLabel,
    suggestedSource, confidence, requiresHumanReview
  } = issue;

  // ---- COMPILED_DRIFT: check if it's purely drift (compiled artifact stale) ----
  if (issueCode === 'COMPILED_DRIFT') {
    // If reason mentions "Field count mismatch", likely compiled is stale
    if (/field count mismatch/i.test(reason ?? '')) {
      return { classification: CLASS.BLOCKED_COMPILED, action: 'RECOMPILE', reason: 'Field count drift; fix is recompile compiled-v2 artifact, not locked contract', applySafe: true };
    }
    // Label drift between locked and compiled: compiled wins, so this is noise
    if (/label drift/i.test(reason ?? '')) {
      return { classification: CLASS.NOISE_OR_DERIVED, action: 'NO_OP', reason: 'Label drift between locked and compiled is resolved by compilation; not a locked contract defect', applySafe: true };
    }
    // Required drift: check if it's a normalization difference
    if (/required drift/i.test(reason ?? '')) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_REQUIRED', reason: 'required drift between locked and compiled; needs review to determine correct value', applySafe: false };
    }
    // dataSource drift: check if it's enum normalization
    const normCompiled = (reason ?? '').match(/compiled="([^"]+)"/)?.[1] ?? '';
    const normLocked = (reason ?? '').match(/locked="([^"]+)"/)?.[1] ?? '';
    if (
      (normCompiled === 'AGENCY' && normLocked === 'agencyConfig') ||
      (normCompiled === 'OFFICIAL' && normLocked === 'officialConfig') ||
      (normCompiled === 'SYSTEM' && normLocked === 'systemDate')
    ) {
      return { classification: CLASS.NOISE_OR_DERIVED, action: 'NO_OP', reason: 'Enum normalization difference between locked (snake) and compiled (uppercase); not a defect', applySafe: true };
    }
    return { classification: CLASS.REVIEW_FIX, action: 'NO_OP', reason: 'COMPILED_DRIFT needs review to determine if locked or compiled is correct', applySafe: false };
  }

  // ---- BAD_LABEL ----
  if (issueCode === 'BAD_LABEL') {
    // Has known label override → auto-fix candidate
    if (HAS_KNOWN_LABEL.has(path)) {
      return {
        classification: CLASS.AUTO_FIX,
        action: 'UPDATE_LABEL',
        proposedLabel: KNOWN_LABEL_OVERRIDE[path],
        reason: `BAD_LABEL="${label}" on path "${path}" has known Vietnamese label override "${KNOWN_LABEL_OVERRIDE[path]}". Path is already semantically correct.`,
        applySafe: true,
      };
    }
    // Remediated label leak → blocked by DOCX authoring (path needs review too)
    if (/Slot from.*remediation/i.test(label ?? '')) {
      return { classification: CLASS.BLOCKED_DOCX, action: 'DOCX_REAUTHOR', reason: `Remediation label leak "${label}" on path "${path}"; path may also be wrong. Requires DOCX review.`, applySafe: false };
    }
    // Raw generic fieldN label → needs review (path may be wrong)
    if (/^field\d+$/i.test(label ?? '')) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_PATH', reason: `Raw generic label "${label}" on path "${path}"; path may need correction to match semantic content`, applySafe: false };
    }
    // Empty string → review (need to determine correct label from context)
    if (label === '' || label === 'Ô trống') {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_LABEL', reason: `Bad label "${label}" on path "${path}"; context="${(context ?? '').slice(0, 60)}" — needs review to determine correct label`, applySafe: false };
    }
    // Generic camelCase no Vietnamese → review
    if (/raw camelCase/i.test(reason ?? '')) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_LABEL', reason: `Raw camelCase label "${label}" on path "${path}" needs review`, applySafe: false };
    }
    // Starts with "Slot from" → DOCX authoring
    if (/^Slot from/i.test(label ?? '')) {
      return { classification: CLASS.BLOCKED_DOCX, action: 'DOCX_REAUTHOR', reason: `Slot label "${label}" on path "${path}"; needs DOCX authoring review`, applySafe: false };
    }
    // Contains "remediation" → DOCX authoring
    if (/remediation/i.test(label ?? '')) {
      return { classification: CLASS.BLOCKED_DOCX, action: 'DOCX_REAUTHOR', reason: `Label contains remediation metadata "${label}"`, applySafe: false };
    }
    // Everything else → review
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_LABEL', reason: `BAD_LABEL "${label}" on path "${path}" — needs review`, applySafe: false };
  }

  // ---- UI_VISIBLE_BAD_METADATA ----
  if (issueCode === 'UI_VISIBLE_BAD_METADATA') {
    // If path has known label override → auto-fix
    if (HAS_KNOWN_LABEL.has(path)) {
      return {
        classification: CLASS.AUTO_FIX,
        action: 'UPDATE_LABEL',
        proposedLabel: KNOWN_LABEL_OVERRIDE[path],
        reason: `UI_VISIBLE_BAD_METADATA caused by bad label that has known override. Fixing label resolves UI issue.`,
        applySafe: true,
      };
    }
    // Otherwise → review
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_LABEL', reason: `UI_VISIBLE_BAD_METADATA on path "${path}" with label "${label}" — needs review`, applySafe: false };
  }

  // ---- RAW_PATTERN_DOMAIN_MISMATCH ----
  if (issueCode === 'RAW_PATTERN_DOMAIN_MISMATCH') {
    // If suggestedPath is a generic fieldN → DO NOT auto-fix (path unknown)
    if (suggestedPath && GENERIC_RAW_TAIL.test(suggestedPath.split('.').pop() ?? '')) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_PATH', reason: `RAW_PATTERN_DOMAIN_MISMATCH suggested "${suggestedPath}" but suggestedPath contains generic fieldN. Requires review to find correct semantic path.`, applySafe: false };
    }
    // If suggestedPath is a known path → auto-fix candidate
    if (suggestedPath && HAS_KNOWN_LABEL.has(suggestedPath)) {
      return {
        classification: CLASS.AUTO_FIX,
        action: 'UPDATE_PATH',
        proposedPath: suggestedPath,
        proposedLabel: KNOWN_LABEL_OVERRIDE[suggestedPath],
        reason: `Domain mismatch: raw="${rawPattern}" on path "${path}". suggestedPath="${suggestedPath}" is a known semantic path with known label. Auto-fix path and label.`,
        applySafe: true,
      };
    }
    // If context strongly supports the suggested path → review-fix
    if (suggestedPath && (context ?? '').length > 10) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_PATH', reason: `RAW_PATTERN_DOMAIN_MISMATCH suggested="${suggestedPath}" on path="${path}"; context supports review but needs human validation`, applySafe: false };
    }
    // Generic suggestedPath with weak context → manual legal
    return { classification: CLASS.MANUAL_LEGAL, action: 'MANUAL_REVIEW', reason: `RAW_PATTERN_DOMAIN_MISMATCH with generic suggested="${suggestedPath}" and weak context; path decision requires legal domain knowledge`, applySafe: false };
  }

  // ---- SOURCE_MISMATCH ----
  if (issueCode === 'SOURCE_MISMATCH') {
    // source=agencyConfig on decision/document/person fields → review-fix
    if (source === 'agencyConfig') {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `SOURCE_MISMATCH: source="agencyConfig" on path="${path}" (${rawDomain ?? '?'} domain). Needs review to determine correct source.`, applySafe: false };
    }
    // source=manual but context is fixed legal text → manual legal
    if (source === 'manual' && /^(Căn cứ|Luật|Điều|Bộ luật)/.test(context ?? '')) {
      return { classification: CLASS.MANUAL_LEGAL, action: 'MANUAL_REVIEW', reason: `SOURCE_MISMATCH: source="manual" on path="${path}" but context is fixed legal text. May be correct or may need system source. Legal judgment needed.`, applySafe: false };
    }
    // source=agencyConfig + rawPattern is decision/document → review-fix
    if (source === 'agencyConfig' && (rawDomain === 'decision' || rawDomain === 'document' || rawDomain === 'person')) {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `SOURCE_MISMATCH: source="agencyConfig" but rawPattern is ${rawDomain} domain. Needs review for correct source.`, applySafe: false };
    }
    // Everything else → review-fix
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `SOURCE_MISMATCH on path="${path}" with source="${source}" — needs review`, applySafe: false };
  }

  // ---- GENERIC_FIELD_CANONICALIZATION ----
  if (issueCode === 'GENERIC_FIELD_CANONICALIZATION') {
    // Generic raw pattern + known path + known label → auto-fix label only
    if (HAS_KNOWN_LABEL.has(path)) {
      return {
        classification: CLASS.AUTO_FIX,
        action: 'UPDATE_LABEL',
        proposedLabel: KNOWN_LABEL_OVERRIDE[path],
        reason: `GENERIC_FIELD_CANONICALIZATION: generic raw "${rawPattern}" on path "${path}" which has known label. Fixing label only (path is correct).`,
        applySafe: true,
      };
    }
    // Generic raw on non-known path → manual legal (path may be completely wrong)
    return { classification: CLASS.MANUAL_LEGAL, action: 'MANUAL_REVIEW', reason: `GENERIC_FIELD_CANONICALIZATION: generic raw "${rawPattern}" on path="${path}" with no known label override. Path may be wrong. Needs legal/procedural review.`, applySafe: false };
  }

  // ---- WEAK_EVIDENCE_AUTO_LOCKED ----
  if (issueCode === 'WEAK_EVIDENCE_AUTO_LOCKED') {
    // reviewRequired=false + generic raw + weak context → review-fix
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `WEAK_EVIDENCE_AUTO_LOCKED: reviewRequired=false with generic raw="${rawPattern}" and weak context="${(context ?? '').slice(0, 50)}". Needs review to determine correct source or required flag.`, applySafe: false };
  }

  // ---- REQUIRED_SUSPICIOUS ----
  if (issueCode === 'REQUIRED_SUSPICIOUS') {
    // Required decision on legal basis / decision fields → manual legal
    if (LEGAL_FIELDS.test(path ?? '')) {
      return { classification: CLASS.MANUAL_LEGAL, action: 'UPDATE_REQUIRED', reason: `REQUIRED_SUSPICIOUS on path="${path}" which is a legal/procedural field. Required decision has legal implications — needs manual review.`, applySafe: false };
    }
    // Identity fields (signerName, fullName, etc.) → review-fix
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_REQUIRED', reason: `REQUIRED_SUSPICIOUS: field "${path}" looks required but required=false. Review to determine correct required value.`, applySafe: false };
  }

  // ---- SHOULD_BE_READONLY ----
  if (issueCode === 'SHOULD_BE_READONLY') {
    // If source is already a readonly source and suggestedSource matches → NOISE
    if (READONLY_SOURCES.has(source ?? '')) {
      if (suggestedSource === source || !suggestedSource) {
        return { classification: CLASS.NOISE_OR_DERIVED, action: 'NO_OP', reason: `SHOULD_BE_READONLY on path="${path}" but source="${source}" is already a readonly source. suggestedSource="${suggestedSource ?? source}" matches. Noise — no fix needed.`, applySafe: true };
      }
    }
    // Source is manual on computed-looking path → review-fix
    if (source === 'manual') {
      return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `SHOULD_BE_READONLY: path="${path}" looks computed/system but source="manual". Needs review to determine correct source.`, applySafe: false };
    }
    // Everything else → review-fix
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_SOURCE', reason: `SHOULD_BE_READONLY on path="${path}" with source="${source}" — needs review`, applySafe: false };
  }

  // ---- REMEDIATION_LEAK ----
  if (issueCode === 'REMEDIATION_LEAK') {
    // If path has known label override and context is not critical → auto-fix label
    if (HAS_KNOWN_LABEL.has(path)) {
      return {
        classification: CLASS.AUTO_FIX,
        action: 'UPDATE_LABEL',
        proposedLabel: KNOWN_LABEL_OVERRIDE[path],
        reason: `REMEDIATION_LEAK on path="${path}" which has known label override. Label fix resolves leak; path is semantically correct.`,
        applySafe: true,
      };
    }
    // Slot from Wave 02 without known path → blocked by DOCX authoring
    if (/Slot from.*Wave 02/i.test(label ?? '')) {
      return { classification: CLASS.BLOCKED_DOCX, action: 'DOCX_REAUTHOR', reason: `REMEDIATION_LEAK: Wave 02 slot "${label}" on path="${path}". Needs DOCX review to determine correct path and label.`, applySafe: false };
    }
    // Remediated context → blocked by DOCX
    if (/remediation/i.test(context ?? '')) {
      return { classification: CLASS.BLOCKED_DOCX, action: 'DOCX_REAUTHOR', reason: `REMEDIATION_LEAK: context contains remediation keyword on path="${path}". Needs DOCX review.`, applySafe: false };
    }
    // Everything else → review-fix
    return { classification: CLASS.REVIEW_FIX, action: 'UPDATE_LABEL', reason: `REMEDIATION_LEAK "${label}" on path="${path}" — needs review`, applySafe: false };
  }

  // Fallback: unclassified
  return { classification: null, action: 'NO_OP', reason: `No classification rule matched for issueCode="${issueCode}" path="${path}"`, applySafe: false };
}

// =============================================================================
// PLAN GENERATION
// =============================================================================

function buildPlan(auditData) {
  const plans = [];
  const byTemplate = new Map();

  // Group issues by template
  const byTemplateMap = new Map();
  for (const issue of auditData.issues) {
    const tc = issue.templateCode;
    if (!byTemplateMap.has(tc)) byTemplateMap.set(tc, []);
    byTemplateMap.get(tc).push(issue);
  }

  for (const [templateCode, issues] of byTemplateMap) {
    const templateTitle = issues[0]?.label ?? templateCode; // will be overwritten from auditData
    const planList = [];

    for (const issue of issues) {
      const result = classifyIssue(issue);

      plans.push({
        templateCode: issue.templateCode,
        path: issue.path,
        issueCodes: [issue.issueCode],
        current: {
          label: issue.label ?? undefined,
          path: issue.path,
          source: issue.source ?? undefined,
          rawPattern: issue.rawPattern ?? undefined,
          context: issue.context ?? undefined,
        },
        proposed: {
          label: result.proposedLabel ?? undefined,
          path: result.proposedPath ?? undefined,
          source: result.proposedSource ?? undefined,
          action: result.action,
        },
        classification: result.classification ?? 'UNCLASSIFIED',
        reason: result.reason,
        confidence: issue.confidence,
        requiresHumanReview: result.classification !== CLASS.AUTO_FIX,
        applySafe: result.applySafe ?? false,
      });

      planList.push({ ...issue, _class: result.classification, _applySafe: result.applySafe });
    }

    // Per-template summary
    const counts = {};
    let risk = 'LOW';
    let recommendedAction = 'No action needed';
    for (const p of planList) {
      const cls = p._class ?? 'UNCLASSIFIED';
      counts[cls] = (counts[cls] ?? 0) + 1;
    }
    if ((counts[CLASS.BLOCKED_DOCX] ?? 0) > 5 || (counts[CLASS.MANUAL_LEGAL] ?? 0) > 3) {
      risk = 'HIGH';
      recommendedAction = 'Manual legal review + DOCX authoring required';
    } else if ((counts[CLASS.REVIEW_FIX] ?? 0) > 5) {
      risk = 'MEDIUM';
      recommendedAction = 'Batch review of review-fix candidates';
    } else if ((counts[CLASS.AUTO_FIX] ?? 0) > 0) {
      risk = 'LOW';
      recommendedAction = 'Auto-fix candidates available';
    }

    byTemplate.set(templateCode, {
      templateCode,
      title: templateTitle,
      totalIssues: issues.length,
      classificationCounts: counts,
      recommendedAction,
      risk,
    });
  }

  // Compute overall classification counts
  const classificationCounts = {};
  for (const plan of plans) {
    const cls = plan.classification;
    classificationCounts[cls] = (classificationCounts[cls] ?? 0) + 1;
  }

  const unclassifiedCount = classificationCounts['UNCLASSIFIED'] ?? 0;
  const totalClassified = plans.length - unclassifiedCount;

  return {
    generatedAt: new Date().toISOString(),
    sourceAuditVersion: 'v2',
    totalIssuesInput: auditData.totalIssues,
    totalClassified,
    unclassifiedCount,
    classificationCounts,
    byTemplate: [...byTemplate.values()],
    plans,
  };
}

// =============================================================================
// REPORT WRITING
// =============================================================================

function writeReports(plan) {
  mkdirSync(PLAN_DIR, { recursive: true });

  // Separate bucket files
  const buckets = {
    'auto-fix-candidates': plan.plans.filter((p) => p.classification === CLASS.AUTO_FIX),
    'review-fix-candidates': plan.plans.filter((p) => p.classification === CLASS.REVIEW_FIX),
    'manual-review-required': plan.plans.filter((p) => p.classification === CLASS.MANUAL_LEGAL),
    'noise-or-derived': plan.plans.filter((p) => p.classification === CLASS.NOISE_OR_DERIVED),
    'blocked-by-docx-authoring': plan.plans.filter((p) => p.classification === CLASS.BLOCKED_DOCX),
    'blocked-by-compiled-drift-rebuild': plan.plans.filter((p) => p.classification === CLASS.BLOCKED_COMPILED),
  };

  for (const [name, items] of Object.entries(buckets)) {
    writeFileSync(
      join(PLAN_DIR, `${name}.json`),
      JSON.stringify(items, null, 2),
      'utf8',
    );
    process.stderr.write(`[PLAN] ${name}: ${items.length} items\n`);
  }

  // Main JSON report
  writeFileSync(join(PLAN_DIR, 'latest.json'), JSON.stringify(plan, null, 2), 'utf8');

  // Markdown report
  const lines = [];
  lines.push(`# Form Root-Cause Fix Plan`);
  lines.push(`Generated: ${plan.generatedAt}`);
  lines.push(`Source audit: v2`);
  lines.push('');

  // Executive summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalIssues | ${plan.totalIssuesInput} |`);
  lines.push(`| totalClassified | ${plan.totalClassified} |`);
  lines.push(`| unclassifiedCount | ${plan.unclassifiedCount} |`);
  lines.push('');
  lines.push(`| Classification | Count |`);
  lines.push(`|---------------|-------|`);
  const sortedClasses = Object.entries(plan.classificationCounts).sort((a, b) => b[1] - a[1]);
  for (const [cls, count] of sortedClasses) {
    lines.push(`| ${cls} | ${count} |`);
  }
  lines.push('');

  // Classification breakdown table
  lines.push('## Classification Breakdown');
  lines.push('');

  // Auto-fix candidates
  const autoFix = buckets['auto-fix-candidates'];
  lines.push(`### AUTO_FIX_CANDIDATE (${autoFix.length})`);
  lines.push('');
  lines.push('These are safe, high-confidence fixes. They do NOT modify locked contracts — they represent the safest batch for automated application.');
  lines.push('');
  if (autoFix.length > 0) {
    lines.push('| templateCode | path | action | proposedLabel | proposedPath | reason |');
    lines.push('|--------------|------|--------|--------------|-------------|--------|');
    for (const p of autoFix.slice(0, 50)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.proposed?.action ?? '-'} | ${p.proposed?.label ? `\`${p.proposed.label}\`` : '-'} | ${p.proposed?.path ? `\`${p.proposed.path}\`` : '-'} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (autoFix.length > 50) lines.push(`| ... | | | | | ${autoFix.length - 50} more |`);
    lines.push('');
  }

  // Review-fix candidates
  const reviewFix = buckets['review-fix-candidates'];
  lines.push(`### REVIEW_FIX_CANDIDATE (${reviewFix.length})`);
  lines.push('');
  lines.push('These need human review before fixing. Common: SOURCE_MISMATCH, REQUIRED_SUSPICIOUS, SHOULD_BE_READONLY, GENERIC_FIELD_CANONICALIZATION with unknown path.');
  lines.push('');
  if (reviewFix.length > 0) {
    lines.push('| templateCode | path | issueCodes | action | reason |');
    lines.push('|--------------|------|------------|--------|--------|');
    for (const p of reviewFix.slice(0, 50)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.issueCodes.join(', ')} | ${p.proposed?.action ?? '-'} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (reviewFix.length > 50) lines.push(`| ... | | | | ${reviewFix.length - 50} more |`);
    lines.push('');
  }

  // Manual legal review
  const manualLegal = buckets['manual-review-required'];
  lines.push(`### MANUAL_LEGAL_REVIEW (${manualLegal.length})`);
  lines.push('');
  lines.push('These involve legal/procedural judgment. Required: legal expert review before any change.');
  lines.push('');
  if (manualLegal.length > 0) {
    lines.push('| templateCode | path | issueCodes | reason |');
    lines.push('|--------------|------|------------|--------|');
    for (const p of manualLegal.slice(0, 30)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.issueCodes.join(', ')} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (manualLegal.length > 30) lines.push(`| ... | | | ${manualLegal.length - 30} more |`);
    lines.push('');
  }

  // Noise/derived
  const noise = buckets['noise-or-derived'];
  lines.push(`### DO_NOT_FIX_NOISE_OR_DERIVED (${noise.length})`);
  lines.push('');
  lines.push('These are NOT defects: compiled normalization, SHOULD_BE_READONLY noise where source is already correct, duplicate issues.');
  lines.push('');
  if (noise.length > 0) {
    lines.push('| templateCode | path | issueCodes | reason |');
    lines.push('|--------------|------|------------|--------|');
    for (const p of noise.slice(0, 30)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.issueCodes.join(', ')} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (noise.length > 30) lines.push(`| ... | | | ${noise.length - 30} more |`);
    lines.push('');
  }

  // Blocked DOCX
  const blockedDocx = buckets['blocked-by-docx-authoring'];
  lines.push(`### BLOCKED_BY_DOCX_AUTHORING (${blockedDocx.length})`);
  lines.push('');
  lines.push('These need DOCX template reauthoring. Cannot be fixed by metadata changes alone.');
  lines.push('');
  if (blockedDocx.length > 0) {
    lines.push('| templateCode | path | issueCodes | reason |');
    lines.push('|--------------|------|------------|--------|');
    for (const p of blockedDocx.slice(0, 30)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.issueCodes.join(', ')} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (blockedDocx.length > 30) lines.push(`| ... | | | ${blockedDocx.length - 30} more |`);
    lines.push('');
  }

  // Blocked compiled
  const blockedCompiled = buckets['blocked-by-compiled-drift-rebuild'];
  lines.push(`### BLOCKED_BY_COMPILED_DRIFT_REBUILD (${blockedCompiled.length})`);
  lines.push('');
  lines.push('Fix is to recompile the compiled-v2 artifact, not to modify the locked contract.');
  lines.push('');
  if (blockedCompiled.length > 0) {
    lines.push('| templateCode | path | issueCodes | reason |');
    lines.push('|--------------|------|------------|--------|');
    for (const p of blockedCompiled.slice(0, 30)) {
      lines.push(`| ${p.templateCode} | \`${p.path}\` | ${p.issueCodes.join(', ')} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    if (blockedCompiled.length > 30) lines.push(`| ... | | | ${blockedCompiled.length - 30} more |`);
    lines.push('');
  }

  // BM-050 detailed plan
  const bm050Plans = plan.plans.filter((p) => p.templateCode === 'BM-050');
  lines.push('## BM-050 Detailed Fix Plan');
  lines.push('');
  lines.push(`Total: ${bm050Plans.length} issues classified`);
  lines.push('');
  if (bm050Plans.length > 0) {
    lines.push('| path | classification | action | proposed | reason |');
    lines.push('|------|----------------|--------|---------|--------|');
    for (const p of bm050Plans) {
      const proposed = [p.proposed?.label, p.proposed?.path, p.proposed?.action].filter(Boolean).join(', ');
      lines.push(`| \`${p.path}\` | ${p.classification} | ${p.proposed?.action ?? '-'} | ${proposed || '-'} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    lines.push('');
  }

  // BM-068 detailed plan
  const bm068Plans = plan.plans.filter((p) => p.templateCode === 'BM-068');
  lines.push('## BM-068 Detailed Fix Plan');
  lines.push('');
  lines.push(`Total: ${bm068Plans.length} issues classified`);
  lines.push('');
  if (bm068Plans.length > 0) {
    lines.push('| path | classification | action | proposed | reason |');
    lines.push('|------|----------------|--------|---------|--------|');
    for (const p of bm068Plans) {
      const proposed = [p.proposed?.label, p.proposed?.path, p.proposed?.action].filter(Boolean).join(', ');
      lines.push(`| \`${p.path}\` | ${p.classification} | ${p.proposed?.action ?? '-'} | ${proposed || '-'} | ${(p.reason ?? '').slice(0, 80)} |`);
    }
    lines.push('');
  }

  // Top 20 highest-risk BMs
  const highRisk = plan.byTemplate
    .filter((b) => b.risk === 'HIGH' || b.risk === 'MEDIUM')
    .sort((a, b) => (b.risk === 'HIGH' ? 1 : 0) - (a.risk === 'HIGH' ? 1 : 0) || b.totalIssues - a.totalIssues)
    .slice(0, 20);
  if (highRisk.length > 0) {
    lines.push('## Top 20 Highest-Risk BMs');
    lines.push('');
    lines.push('| templateCode | totalIssues | risk | recommendedAction |');
    lines.push('|--------------|-------------|------|-------------------|');
    for (const bm of highRisk) {
      lines.push(`| ${bm.templateCode} | ${bm.totalIssues} | ${bm.risk} | ${bm.recommendedAction} |`);
    }
    lines.push('');
  }

  // Recommended next task
  const autoFixUnsafe = autoFix.filter((p) => !p.applySafe).length;
  const hasUnclassified = plan.unclassifiedCount > 0;
  const nextTask = (hasUnclassified || autoFixUnsafe > 0) ? 'FORMS_ROOT_CAUSE_REVIEW_BATCH_1' : 'FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES';

  lines.push('## Recommended Next Task');
  lines.push('');
  lines.push(`**${nextTask}**`);
  lines.push('');
  if (nextTask === 'FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES') {
    lines.push(`${autoFix.length} AUTO_FIX_CANDIDATE items with applySafe=true are ready for application.`);
    lines.push('');
    lines.push('**Action**: Apply only AUTO_FIX_CANDIDATE with applySafe=true. These:');
    lines.push('1. Update labels using known Vietnamese label overrides');
    lines.push('2. Update paths where suggestedPath is a known semantic path');
    lines.push('3. Do NOT modify DOCX templates');
    lines.push('4. Do NOT modify compiled artifacts');
    lines.push('5. Regenerate compiled-v2 after locked contract changes');
  } else {
    lines.push(`Cannot proceed to auto-apply. Reasons:`);
    if (hasUnclassified) lines.push(`- ${plan.unclassifiedCount} unclassified issues`);
    if (autoFixUnsafe > 0) lines.push(`- ${autoFixUnsafe} AUTO_FIX_CANDIDATE with applySafe=false`);
    lines.push('');
    lines.push('**Action**: Run FORMS_ROOT_CAUSE_REVIEW_BATCH_1 to triage remaining issues.');
  }

  writeFileSync(join(PLAN_DIR, 'latest.md'), lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`\n[PLAN] Written: ${join(PLAN_DIR, 'latest.json')}\n`);
  process.stderr.write(`[PLAN] Written: ${join(PLAN_DIR, 'latest.md')}\n`);
  for (const name of Object.keys(buckets)) {
    process.stderr.write(`[PLAN] Written: ${join(PLAN_DIR, `${name}.json`)}\n`);
  }

  return { nextTask, unclassifiedCount: plan.unclassifiedCount, autoFixUnsafe };
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write('[PLAN] FORMS_ROOT_CAUSE_FIX_PLAN\n');

  if (!readFileSync(AUDIT_JSON, 'utf8')) {
    process.stderr.write(`[PLAN] ERROR: Cannot read ${AUDIT_JSON}\n`);
    process.exit(1);
  }

  const auditData = JSON.parse(readFileSync(AUDIT_JSON, 'utf8'));
  process.stderr.write(`[PLAN] Loaded audit: ${auditData.totalIssues} issues from ${auditData.totalContracts} contracts\n`);
  process.stderr.write(`[PLAN] Audit version: ${auditData.auditVersion ?? 'unknown'}\n`);

  const plan = buildPlan(auditData);
  const { nextTask, unclassifiedCount, autoFixUnsafe } = writeReports(plan);

  process.stderr.write(
    `[PLAN] Classification complete:\n` +
    `  AUTO_FIX_CANDIDATE: ${plan.classificationCounts[CLASS.AUTO_FIX] ?? 0}\n` +
    `  REVIEW_FIX_CANDIDATE: ${plan.classificationCounts[CLASS.REVIEW_FIX] ?? 0}\n` +
    `  MANUAL_LEGAL_REVIEW: ${plan.classificationCounts[CLASS.MANUAL_LEGAL] ?? 0}\n` +
    `  NOISE_OR_DERIVED: ${plan.classificationCounts[CLASS.NOISE_OR_DERIVED] ?? 0}\n` +
    `  BLOCKED_BY_DOCX_AUTHORING: ${plan.classificationCounts[CLASS.BLOCKED_DOCX] ?? 0}\n` +
    `  BLOCKED_BY_COMPILED_DRIFT_REBUILD: ${plan.classificationCounts[CLASS.BLOCKED_COMPILED] ?? 0}\n` +
    `  UNCLASSIFIED: ${plan.unclassifiedCount}\n` +
    `  Next task: ${nextTask}\n`,
  );

  if (unclassifiedCount > 0) {
    process.stderr.write(`[PLAN] WARNING: ${unclassifiedCount} unclassified issues — exiting 1\n`);
    process.exit(1);
  }

  if (autoFixUnsafe > 0) {
    process.stderr.write(`[PLAN] WARNING: ${autoFixUnsafe} AUTO_FIX_CANDIDATE with applySafe=false — exiting 1\n`);
    process.exit(1);
  }

  process.stderr.write('[PLAN] Plan generated successfully.\n');
}

main();
