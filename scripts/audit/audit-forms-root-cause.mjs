#!/usr/bin/env node
/**
 * audit-forms-root-cause.mjs - AUDIT_FORMS_ROOT_CAUSE task.
 *
 * Scans all 213 locked form contracts for semantic/schema/UI metadata issues.
 *
 * Exit codes:
 *   0 - report generated (regardless of issue count).
 *   1 - strict mode and one or more FAIL issues exist.
 *
 * Usage:
 *   node scripts/audit/audit-forms-root-cause.mjs
 *   node scripts/audit/audit-forms-root-cause.mjs --strict
 *   node scripts/audit/audit-forms-root-cause.mjs --template-code BM-050
 *   pnpm audit:forms-root-cause
 *   pnpm audit:forms-root-cause:strict
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const COMPILED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause');

const STRICT = process.argv.includes('--strict');
const TEMPLATE_CODE = (() => {
  const idx = process.argv.indexOf('--template-code');
  return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
})();

// =============================================================================
// ISSUE CODES
// =============================================================================

const ISSUE = {
  BAD_LABEL: 'BAD_LABEL',
  RAW_PATTERN_DOMAIN_MISMATCH: 'RAW_PATTERN_DOMAIN_MISMATCH',
  SOURCE_MISMATCH: 'SOURCE_MISMATCH',
  WEAK_EVIDENCE_AUTO_LOCKED: 'WEAK_EVIDENCE_AUTO_LOCKED',
  GENERIC_FIELD_CANONICALIZATION: 'GENERIC_FIELD_CANONICALIZATION',
  UI_VISIBLE_BAD_METADATA: 'UI_VISIBLE_BAD_METADATA',
  COMPILED_DRIFT: 'COMPILED_DRIFT',
  REQUIRED_SUSPICIOUS: 'REQUIRED_SUSPICIOUS',
  SHOULD_BE_READONLY: 'SHOULD_BE_READONLY',
  REMEDIATION_LEAK: 'REMEDIATION_LEAK',
};

// =============================================================================
// DOMAIN MAPS
// =============================================================================

const DOMAIN_KEYS = new Set([
  'agency','document','decision','person','caseInfo','casePayload',
  'informant','reporter','receiver','legalBasis','offense','measure',
  'proposal','signature','official','attachments','indictment','monitoring',
  'investigation','investigationConclusion','caseJoinder','caseRecovery',
  'investigationExtension','prosecutionExtension','prosecutionTransfer',
  'approval','recipients','content',
]);

function pathDomain(path) {
  const head = path?.split('.')[0] ?? '';
  return DOMAIN_KEYS.has(head) ? head : 'unknown';
}

function rawPatternDomain(rawPattern) {
  if (!rawPattern) return 'unknown';
  const match = rawPattern.match(/\{\{([^.]+)\./);
  if (match) return DOMAIN_KEYS.has(match[1]) ? match[1] : 'unknown';
  return 'unknown';
}

// =============================================================================
// LABEL DETECTION
// =============================================================================

const BAD_LABEL_RE = [
  [/^$/, 'empty string'],
  [/^Ô trống$/, '"Ô trống"'],
  [/^Slot from/i, 'starts with "Slot from"'],
  [/remediation/i, 'contains "remediation"'],
  [/TODO/i, 'contains "TODO"'],
  [/unknown/i, 'contains "unknown"'],
  [/^field\d+$/i, 'raw generic fieldN'],
  [/^[a-z][a-z0-9]+$/i, 'raw camelCase no Vietnamese'],
];

const VIETNAMESE_RE = /[À-ỹ]/;

function isBadLabel(label, path) {
  if (!label) return { bad: true, reason: 'empty string' };
  for (const [re, desc] of BAD_LABEL_RE) {
    if (re.test(label)) return { bad: true, reason: desc };
  }
  const tail = path?.split('.').at(-1) ?? '';
  if (
    /^[a-z][a-zA-Z0-9]+$/.test(label) &&
    !VIETNAMESE_RE.test(label) &&
    label.length > 2 &&
    !PATH_OVERRIDE_VALUES.has(label)
  ) {
    return { bad: true, reason: `raw camelCase label "${label}" with no Vietnamese` };
  }
  return { bad: false, reason: null };
}

// =============================================================================
// KNOWN GOOD LABEL VALUES (from field-labels.ts PATH_OVERRIDES)
// =============================================================================

const PATH_OVERRIDE_VALUES = new Set([
  'Địa điểm, ngày lập', 'Số văn bản', 'Ngày ban hành', 'Số ký hiệu',
  'Cơ quan ban hành', 'Chức danh người ký', 'Người ký',
  'Họ tên người tiếp nhận', 'Chức vụ', 'Đơn vị công tác',
  'Tên người tiếp nhận', 'Họ tên người cung cấp tin', 'Giới tính',
  'Tên gọi khác', 'Nơi sinh', 'Quốc tịch', 'Dân tộc', 'Tôn giáo',
  'Địa chỉ', 'Nghề nghiệp', 'Nơi làm việc',
  'Tên cơ quan', 'Cơ quan cấp trên', 'Cơ quan cấp trên viết hoa', 'Tên viết tắt',
  'Căn cứ pháp lý', 'Điều luật', 'Tội danh', 'Khoản',
  'Số vụ án', 'Đơn vị điều tra', 'Kiểm sát viên', 'Điều tra viên',
  'Kiểm sát viên rào xét', 'Bị can / Bị cáo', 'Ngày bắt', 'Nơi bắt',
  'Ngày phạm tội', 'Nơi phạm tội',
  'Họ tên', 'Ngày sinh', 'Tháng sinh', 'Năm sinh',
  'Họ tên người báo tin',
  'Nơi ban hành', 'Ngày quyết định', 'Số quyết định',
  'Chức danh', 'Ngày ký',
]);

// =============================================================================
// GENERIC RAW PATTERN DETECTION
// =============================================================================

const GENERIC_RAW_RE = /^(document|decision|person|caseInfo|informant|reporter|legalBasis|offense|measure|proposal|official)\.field\d+$/i;

// =============================================================================
// REMEDIATION LEAK DETECTION
// =============================================================================

const REMEDIATION_RE = [/wave/i, /remediation/i];

function containsRemediationLeak(str) {
  if (!str) return false;
  return REMEDIATION_RE.some((re) => re.test(str));
}

// =============================================================================
// SOURCE CLASSIFICATION
// =============================================================================

function isSystemSource(source) {
  return ['agencyConfig', 'officialConfig', 'systemDate', 'computed'].has(source);
}

// =============================================================================
// WEAK EVIDENCE DETECTION
// =============================================================================

function isWeakEvidence(context, textBefore, rawPattern, reviewRequired) {
  if (reviewRequired) return false;
  const isAutoGen = context?.startsWith('[Auto-generated]');
  const isShortContext = !context || context.length < 10;
  const isNoisyTextBefore = textBefore && /^[0-9.,:; ]+$/.test(textBefore.trim());
  const isGenericRaw = GENERIC_RAW_RE.test(rawPattern ?? '');
  return (isAutoGen || isShortContext) && (isNoisyTextBefore || isGenericRaw || !context);
}

// =============================================================================
// SHOULD_BE_READONLY DETECTION
// =============================================================================

const READONLY_PATH_PATTERNS = [
  [/^(document|agency)\.(nameUpper|fullDocumentCode|issuePlaceDateLine|documentCode|issueNumber|issueOffice|legalBasisLine|formNumber|documentNumberSuffix)$/i, 'fixed/generated administrative field'],
  [/^legalBasis\.(procedureArticlesLine|articleLine)$/i, 'fixed legal text'],
  [/^signature\.signDate$/i, 'system-generated sign date'],
  [/^agency\.(name|parentName|shortName)$/i, 'agency name field'],
];

function detectReadonlyReason(path, source) {
  if (source === 'manual') return null;
  for (const [re, reason] of READONLY_PATH_PATTERNS) {
    if (re.test(path)) return reason;
  }
  if (path.toLowerCase().includes('upper') && source !== 'manual') {
    return 'uppercase transform indicates agency/official field';
  }
  return null;
}

// =============================================================================
// REQUIRED LOOKING PATTERNS
// =============================================================================

const REQUIRED_LOOKING_RE = [
  [/\.(signerName|fullName|fullDocumentCode|decisionNumber|accusedName|prosecutorName|investigatorName)$/i, 'identity/key field likely required'],
  [/\.(decisionDate|issueDate|signDate|arrestDate|crimeDate|birthDate)$/i, 'date field likely required'],
  [/\.(idNumber|cmnd|passport)$/i, 'ID field likely required'],
  [/\.(address|occupation|birthPlace)$/i, 'person info field likely required'],
];

function detectRequiredReason(path) {
  for (const [re, reason] of REQUIRED_LOOKING_RE) {
    if (re.test(path)) return reason;
  }
  return null;
}

// =============================================================================
// SUGGESTIONS
// =============================================================================

const PATH_SUGGESTIONS = {
  'agency.coQuan': 'decision.requestingAgencyName',
  'agency.diaDanh': 'document.issuePlaceDateLine',
  'agency.tenVien': 'agency.name',
};

const LABEL_SUGGESTIONS = {
  'agency.coQuan': 'Cơ quan ra quyết định đề nghị phê chuẩn',
  'agency.diaDanh': 'Địa điểm, ngày lập văn bản',
  'agency.tenVien': 'Tên cơ quan',
};

// =============================================================================
// ISSUE FACTORY
// =============================================================================

function makeIssue({ templateCode, sourceId, path, slotId, rawPattern, label, source, issueCode, severity, reason, context, suggestedPath, suggestedLabel, suggestedSource, confidence, requiresHumanReview }) {
  return {
    templateCode, sourceId, path, slotId, rawPattern, label, source,
    issueCode, severity, reason, context,
    suggestedPath: suggestedPath ?? PATH_SUGGESTIONS[path],
    suggestedLabel: suggestedLabel ?? LABEL_SUGGESTIONS[path],
    suggestedSource,
    confidence: confidence ?? 'MEDIUM',
    requiresHumanReview: requiresHumanReview ?? (severity === 'REVIEW'),
  };
}

// =============================================================================
// CONTRACT / COMPILED LOADERS
// =============================================================================

function loadCompiled() {
  const map = new Map();
  try {
    const files = readdirSync(COMPILED_DIR).filter((f) => f.endsWith('.compiled.json'));
    for (const f of files) {
      const code = f.replace('.compiled.json', '');
      try {
        map.set(code, JSON.parse(readFileSync(join(COMPILED_DIR, f), 'utf8')));
      } catch { /* skip */ }
    }
  } catch { /* dir missing */ }
  return map;
}

function loadContracts() {
  const files = readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'));
  const contracts = [];
  for (const f of files) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    if (TEMPLATE_CODE && code !== TEMPLATE_CODE) continue;
    try {
      contracts.push(JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8')));
    } catch { /* skip */ }
  }
  return contracts.sort((a, b) => a.templateCode.localeCompare(b.templateCode));
}

// =============================================================================
// PER-CONTRACT AUDIT
// =============================================================================

function auditContract(contract, compiledMap, deriveFn) {
  const issues = [];
  const { templateCode, sourceId, docxSlots = [], canonicalFields = [] } = contract;

  const slotById = new Map(docxSlots.map((s) => [s.slotId, s]));
  const canonicalByPath = new Map(canonicalFields.map((f) => [f.path, f]));

  // -------------------------------------------------------------------------
  // 1. BAD_LABEL on canonicalFields
  // -------------------------------------------------------------------------
  for (const field of canonicalFields) {
    const { bad, reason } = isBadLabel(field.label, field.path);
    if (!bad) continue;

    const slot = slotById.get(field.path);
    const severity = ['empty string', '"Ô trống"', 'raw generic fieldN'].some((r) => reason?.includes(r))
      ? 'FAIL' : 'REVIEW';

    issues.push(makeIssue({
      templateCode, sourceId, path: field.path,
      rawPattern: slot?.evidence?.rawPattern,
      label: field.label,
      source: field.source,
      issueCode: ISSUE.BAD_LABEL,
      severity,
      reason: `Canonical field label is "${field.label}" (${reason}). This will appear in UI.`,
      context: slot?.context,
      confidence: reason === 'empty string' ? 'HIGH' : 'MEDIUM',
    }));

    // -------------------------------------------------------------------------
    // 2. RAW_PATTERN_DOMAIN_MISMATCH
    // -------------------------------------------------------------------------
    if (slot) {
      const rawPattern = slot.evidence?.rawPattern;
      if (rawPattern) {
        const rawDom = rawPatternDomain(rawPattern);
        const pathDom = pathDomain(field.path);
        if (rawDom !== 'unknown' && pathDom !== 'unknown' && rawDom !== pathDom) {
          issues.push(makeIssue({
            templateCode, sourceId, path: field.path, slotId: field.path,
            rawPattern, label: field.label, source: field.source,
            issueCode: ISSUE.RAW_PATTERN_DOMAIN_MISMATCH,
            severity: 'FAIL',
            reason: `rawPattern domain "${rawDom}" does not match canonical path domain "${pathDom}". DOCX slot extracted from "${rawDom}" but mapped to "${pathDom}".`,
            context: slot.context,
            suggestedPath: `${rawDom}.${rawPattern.split('.').at(-1)}`,
            confidence: 'HIGH',
          }));
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. SOURCE_MISMATCH
    // -------------------------------------------------------------------------
    if (slot) {
      const rawPattern = slot.evidence?.rawPattern;
      const pathDom = pathDomain(field.path);
      const src = field.source;

      if (src === 'agencyConfig' && pathDom === 'decision') {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path, slotId: field.path,
          rawPattern, label: field.label, source: src,
          issueCode: ISSUE.SOURCE_MISMATCH,
          severity: 'FAIL',
          reason: `source="agencyConfig" but path="${field.path}" is a decision/document/person field. agencyConfig should only apply to agency.* fields.`,
          context: slot.context,
          suggestedSource: 'casePayload',
          confidence: 'HIGH',
        }));
      }

      if (src === 'agencyConfig' && pathDom === 'document') {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path, slotId: field.path,
          rawPattern, label: field.label, source: src,
          issueCode: ISSUE.SOURCE_MISMATCH,
          severity: 'FAIL',
          reason: `source="agencyConfig" but path="${field.path}" is a document field. agencyConfig should only apply to agency.* fields.`,
          context: slot.context,
          suggestedSource: 'manual',
          confidence: 'HIGH',
        }));
      }

      if (src === 'agencyConfig' && pathDom === 'person') {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path, slotId: field.path,
          rawPattern, label: field.label, source: src,
          issueCode: ISSUE.SOURCE_MISMATCH,
          severity: 'FAIL',
          reason: `source="agencyConfig" but path="${field.path}" is a person field. Should be manual or casePayload.`,
          context: slot.context,
          suggestedSource: 'manual',
          confidence: 'HIGH',
        }));
      }

      if (src === 'manual' && /^(Căn cứ|Luật|Điều|Bộ luật)/.test(slot.context ?? '')) {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path, slotId: field.path,
          rawPattern, label: field.label, source: src,
          issueCode: ISSUE.SOURCE_MISMATCH,
          severity: 'REVIEW',
          reason: `source="manual" but context contains fixed legal text. Verify this really needs user input.`,
          context: slot.context,
          confidence: 'MEDIUM',
        }));
      }
    }

    // -------------------------------------------------------------------------
    // 4. WEAK_EVIDENCE_AUTO_LOCKED
    // -------------------------------------------------------------------------
    if (!field.reviewRequired && slot) {
      const context = slot.context ?? '';
      const textBefore = slot.evidence?.textBefore ?? '';
      const rawPattern = slot.evidence?.rawPattern ?? '';
      if (isWeakEvidence(context, textBefore, rawPattern, field.reviewRequired)) {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path, slotId: field.path,
          rawPattern, label: field.label, source: field.source,
          issueCode: ISSUE.WEAK_EVIDENCE_AUTO_LOCKED,
          severity: 'FAIL',
          reason: `reviewRequired=false but context is auto-generated/short/noisy. Evidence too weak to justify locking without review. Context: "${context.slice(0, 80)}"`,
          confidence: 'HIGH',
          requiresHumanReview: true,
        }));
      }
    }

    // -------------------------------------------------------------------------
    // 5. GENERIC_FIELD_CANONICALIZATION
    // -------------------------------------------------------------------------
    if (slot) {
      const rawPattern = slot.evidence?.rawPattern ?? '';
      if (GENERIC_RAW_RE.test(rawPattern)) {
        const { bad: labelBad } = isBadLabel(field.label, field.path);
        const isWeak = isWeakEvidence(slot.context ?? '', slot.evidence?.textBefore ?? '', rawPattern, field.reviewRequired);
        if (labelBad || isWeak) {
          issues.push(makeIssue({
            templateCode, sourceId, path: field.path, slotId: field.path,
            rawPattern, label: field.label, source: field.source,
            issueCode: ISSUE.GENERIC_FIELD_CANONICALIZATION,
            severity: 'FAIL',
            reason: `Generic raw pattern "${rawPattern}" mapped to "${field.path}" but has problems (label="${field.label}", weak_evidence=${isWeak}).`,
            context: slot.context,
            confidence: isWeak ? 'HIGH' : 'MEDIUM',
            requiresHumanReview: true,
          }));
        }
      }
    }

    // -------------------------------------------------------------------------
    // 8. REQUIRED_SUSPICIOUS
    // -------------------------------------------------------------------------
    if (!field.required) {
      const reqReason = detectRequiredReason(field.path);
      if (reqReason) {
        issues.push(makeIssue({
          templateCode, sourceId, path: field.path,
          label: field.label, source: field.source,
          issueCode: ISSUE.REQUIRED_SUSPICIOUS,
          severity: 'REVIEW',
          reason: `Field looks required (${reqReason}) but required=false.`,
          confidence: 'MEDIUM',
        }));
      }
    }

    // -------------------------------------------------------------------------
    // 9. SHOULD_BE_READONLY
    // -------------------------------------------------------------------------
    const readonlyReason = detectReadonlyReason(field.path, field.source);
    if (readonlyReason && field.source === 'manual') {
      issues.push(makeIssue({
        templateCode, sourceId, path: field.path,
        label: field.label, source: field.source,
        issueCode: ISSUE.SHOULD_BE_READONLY,
        severity: 'REVIEW',
        reason: `Field appears to be a computed/agency/official field (${readonlyReason}) but source="manual".`,
        suggestedSource: 'agencyConfig',
        confidence: 'MEDIUM',
      }));
    }
  }

  // -------------------------------------------------------------------------
  // 10. REMEDIATION_LEAK on docxSlots
  // -------------------------------------------------------------------------
  for (const slot of docxSlots) {
    const slotLabel = slot.label ?? '';
    const context = slot.context ?? '';
    const rawPattern = slot.evidence?.rawPattern ?? '';

    if (containsRemediationLeak(slotLabel)) {
      issues.push(makeIssue({
        templateCode, sourceId, path: slot.slotId, slotId: slot.slotId,
        rawPattern, label: slotLabel,
        source: canonicalByPath.get(slot.slotId)?.source,
        issueCode: ISSUE.REMEDIATION_LEAK,
        severity: 'FAIL',
        reason: `Slot label "${slotLabel}" contains remediation metadata. This leaks internal process language into user-facing UI.`,
        context,
        confidence: 'HIGH',
      }));
    }

    if (containsRemediationLeak(context) && !containsRemediationLeak(slotLabel)) {
      issues.push(makeIssue({
        templateCode, sourceId, path: slot.slotId, slotId: slot.slotId,
        rawPattern, label: slotLabel,
        source: canonicalByPath.get(slot.slotId)?.source,
        issueCode: ISSUE.REMEDIATION_LEAK,
        severity: 'REVIEW',
        reason: `Slot context contains remediation keyword: "${context.slice(0, 100)}"`,
        confidence: 'MEDIUM',
      }));
    }
  }

  // -------------------------------------------------------------------------
  // 7. COMPILED_DRIFT
  // -------------------------------------------------------------------------
  const compiled = compiledMap.get(templateCode);
  if (compiled) {
    const compiledFields = [];
    for (const section of compiled.uiSchema?.sections ?? []) {
      for (const field of section.fields ?? []) {
        compiledFields.push(field);
      }
    }

    if (compiledFields.length !== canonicalFields.length) {
      issues.push(makeIssue({
        templateCode, sourceId, path: '—',
        issueCode: ISSUE.COMPILED_DRIFT,
        severity: 'REVIEW',
        reason: `Field count mismatch: locked=${canonicalFields.length} vs compiled=${compiledFields.length}.`,
        confidence: 'HIGH',
      }));
    }

    for (const cf of canonicalFields) {
      const compiledField = compiledFields.find((f) => f.key === cf.path);
      if (!compiledField) {
        issues.push(makeIssue({
          templateCode, sourceId, path: cf.path,
          label: cf.label, source: cf.source,
          issueCode: ISSUE.COMPILED_DRIFT,
          severity: 'REVIEW',
          reason: `Canonical field "${cf.path}" missing from compiled artifact.`,
          confidence: 'HIGH',
        }));
        continue;
      }

      if (compiledField.label !== cf.label &&
          !['Ô trống', 'Slot from Wave 02 DOCX remediation'].includes(cf.label)) {
        issues.push(makeIssue({
          templateCode, sourceId, path: cf.path,
          label: cf.label, source: cf.source,
          issueCode: ISSUE.COMPILED_DRIFT,
          severity: 'REVIEW',
          reason: `Label drift: locked="${cf.label}" vs compiled="${compiledField.label}".`,
          context: `compiled.label="${compiledField.label}"`,
          confidence: 'MEDIUM',
        }));
      }

      if (compiledField.required !== cf.required) {
        issues.push(makeIssue({
          templateCode, sourceId, path: cf.path,
          label: cf.label, source: cf.source,
          issueCode: ISSUE.COMPILED_DRIFT,
          severity: 'REVIEW',
          reason: `required drift: locked=${cf.required} vs compiled=${compiledField.required}.`,
          confidence: 'HIGH',
        }));
      }

      const compiledSrc = compiledField.dataSource?.kind;
      const lockedSrc = cf.source;
      if (compiledSrc && lockedSrc) {
        const normCompiled = compiledSrc.toLowerCase().replace('agency', 'agencyConfig').replace('official', 'officialConfig');
        const normLocked = lockedSrc.toLowerCase();
        if (normCompiled !== normLocked) {
          issues.push(makeIssue({
            templateCode, sourceId, path: cf.path,
            label: cf.label, source: lockedSrc,
            issueCode: ISSUE.COMPILED_DRIFT,
            severity: 'REVIEW',
            reason: `dataSource drift: locked="${lockedSrc}" vs compiled="${compiledSrc}".`,
            confidence: 'MEDIUM',
          }));
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 6. UI_VISIBLE_BAD_METADATA via deriveFormInputSchema
  // -------------------------------------------------------------------------
  if (deriveFn) {
    try {
      const schema = deriveFn(contract);
      for (const section of schema.sections) {
        for (const field of section.fields) {
          if (!field.visible) continue;
          const { bad, reason } = isBadLabel(field.label, field.path);
          if (!bad) continue;
          // Only flag if this isn't already covered by BAD_LABEL on canonicalFields
          const alreadyFlagged = issues.some(
            (i) => i.templateCode === templateCode && i.path === field.path && i.issueCode === ISSUE.BAD_LABEL
          );
          if (!alreadyFlagged) {
            issues.push(makeIssue({
              templateCode, sourceId, path: field.path,
              label: field.label, source: field.source,
              issueCode: ISSUE.UI_VISIBLE_BAD_METADATA,
              severity: 'FAIL',
              reason: `Visible field resolves to bad label "${field.label}" (${reason}) after full label resolution. This will appear in UI.`,
              confidence: reason === 'empty string' ? 'HIGH' : 'MEDIUM',
            }));
          }
        }
      }
    } catch (err) {
      process.stderr.write(`[${templateCode}] deriveFormInputSchema failed: ${err.message}\n`);
    }
  }

  return issues;
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function countIssues(allIssues) {
  const counts = {};
  for (const code of Object.values(ISSUE)) counts[code] = 0;
  for (const issue of allIssues) counts[issue.issueCode] = (counts[issue.issueCode] ?? 0) + 1;
  return counts;
}

function writeReports(results) {
  mkdirSync(OUT_DIR, { recursive: true });

  const totalContracts = results.length;
  const totalFields = results.reduce((s, r) => s + (r.fieldCount ?? 0), 0);
  const allIssues = results.flatMap((r) => r.issues);
  const totalIssues = allIssues.length;
  const failCount = allIssues.filter((i) => i.severity === 'FAIL').length;
  const reviewCount = allIssues.filter((i) => i.severity === 'REVIEW').length;
  const issueCounts = countIssues(allIssues);

  const body = {
    generatedAt: new Date().toISOString(),
    totalContracts,
    totalFields,
    totalIssues,
    failCount,
    reviewCount,
    issueCounts,
    issues: allIssues,
    byTemplate: results.map((r) => ({
      templateCode: r.templateCode,
      title: r.title,
      fieldCount: r.fieldCount ?? 0,
      issueCount: r.issues.length,
      failCount: r.issues.filter((i) => i.severity === 'FAIL').length,
      reviewCount: r.issues.filter((i) => i.severity === 'REVIEW').length,
      topIssues: r.issues.slice(0, 5),
    })),
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  // ---- Markdown report ----
  const lines = [];
  lines.push(`# AUDIT_FORMS_ROOT_CAUSE - Form Metadata Root-Cause Audit`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push('');

  // Executive summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalContracts | ${totalContracts} |`);
  lines.push(`| totalFields | ${totalFields} |`);
  lines.push(`| totalIssues | ${totalIssues} |`);
  lines.push(`| **FAIL** | **${failCount}** |`);
  lines.push(`| REVIEW | ${reviewCount} |`);
  lines.push('');

  lines.push('### Issue Counts by Category');
  lines.push('');
  lines.push(`| Issue Code | Count |`);
  lines.push(`|------------|-------|`);
  for (const [code, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    if (count > 0) lines.push(`| ${code} | ${count} |`);
  }
  lines.push('');

  // Top 20 worst BMs
  const sortedBMs = [...body.byTemplate].sort((a, b) =>
    b.failCount - a.failCount || b.issueCount - a.issueCount
  );
  const top20 = sortedBMs.filter((b) => b.failCount > 0 || b.issueCount > 0).slice(0, 20);
  if (top20.length > 0) {
    lines.push('### Top 20 BMs by Issue Count');
    lines.push('');
    lines.push('| templateCode | title | failCount | reviewCount | totalIssues |');
    lines.push('|--------------|-------|-----------|-------------|-------------|');
    for (const bm of top20) {
      lines.push(`| ${bm.templateCode} | ${(bm.title ?? '').slice(0, 50)} | ${bm.failCount} | ${bm.reviewCount} | ${bm.issueCount} |`);
    }
    lines.push('');
  }

  // BM-050 and BM-068 callouts
  for (const code of ['BM-050', 'BM-068']) {
    const bm = body.byTemplate.find((b) => b.templateCode === code);
    if (!bm) continue;
    lines.push(`### ${code} Findings`);
    lines.push('');
    lines.push(`**${bm.title ?? ''}**`);
    lines.push('');
    if (bm.issueCount === 0) {
      lines.push('No issues found.');
    } else {
      for (const issue of bm.topIssues) {
        lines.push(`- **${issue.issueCode}** [${issue.severity}] \`${issue.path}\``);
        lines.push(`  - Label: \`${issue.label ?? '-'}\` | rawPattern: \`${issue.rawPattern ?? '-'}\` | source: \`${issue.source ?? '-'}\``);
        lines.push(`  - Reason: ${issue.reason}`);
        if (issue.suggestedPath) lines.push(`  - Suggested path: \`${issue.suggestedPath}\``);
        if (issue.suggestedLabel) lines.push(`  - Suggested label: \`${issue.suggestedLabel}\``);
        if (issue.suggestedSource) lines.push(`  - Suggested source: \`${issue.suggestedSource}\``);
        lines.push(`  - Confidence: ${issue.confidence} | requiresHumanReview: ${issue.requiresHumanReview}`);
      }
      if (bm.issueCount > bm.topIssues.length) {
        lines.push(`  ... and ${bm.issueCount - bm.topIssues.length} more issues`);
      }
    }
    lines.push('');
  }

  // Top issue tables
  for (const [code, label] of [
    [ISSUE.BAD_LABEL, 'BAD_LABEL'],
    [ISSUE.RAW_PATTERN_DOMAIN_MISMATCH, 'RAW_PATTERN_DOMAIN_MISMATCH'],
    [ISSUE.SOURCE_MISMATCH, 'SOURCE_MISMATCH'],
    [ISSUE.REMEDIATION_LEAK, 'REMEDIATION_LEAK'],
    [ISSUE.WEAK_EVIDENCE_AUTO_LOCKED, 'WEAK_EVIDENCE_AUTO_LOCKED'],
    [ISSUE.GENERIC_FIELD_CANONICALIZATION, 'GENERIC_FIELD_CANONICALIZATION'],
  ]) {
    const codeIssues = allIssues.filter((i) => i.issueCode === code);
    if (codeIssues.length === 0) continue;
    lines.push(`### ${label} (${codeIssues.length})`);
    lines.push('');
    lines.push('| templateCode | path | label | rawPattern | source | severity | confidence |');
    lines.push('|--------------|------|-------|------------|--------|----------|------------|');
    for (const issue of codeIssues.slice(0, 50)) {
      lines.push(`| ${issue.templateCode} | \`${issue.path}\` | \`${(issue.label ?? '-').slice(0, 30)}\` | \`${(issue.rawPattern ?? '-').slice(0, 25)}\` | ${issue.source ?? '-'} | ${issue.severity} | ${issue.confidence} |`);
    }
    if (codeIssues.length > 50) lines.push(`| ... | | | | | | ${codeIssues.length - 50} more |`);
    lines.push('');
  }

  // Proposed fix plan
  lines.push('## Proposed Fix Plan');
  lines.push('');
  const autoFix = allIssues.filter((i) => i.severity === 'FAIL' && i.confidence === 'HIGH' && !i.requiresHumanReview);
  const reviewFix = allIssues.filter((i) => i.severity === 'FAIL' && (i.confidence === 'MEDIUM' || i.requiresHumanReview));
  const manualReview = allIssues.filter((i) => i.severity === 'REVIEW');
  lines.push(`- **HIGH confidence auto-fix candidates**: ${autoFix.length}`);
  lines.push(`- **MEDIUM confidence / requires review (FAIL)**: ${reviewFix.length}`);
  lines.push(`- **REVIEW only (not auto-fix)**: ${manualReview.length}`);
  lines.push('');

  if (autoFix.length > 0) {
    lines.push('### Auto-fix Candidates (HIGH confidence, no human review needed)');
    lines.push('');
    lines.push('| templateCode | path | suggestedPath | suggestedLabel | reason |');
    lines.push('|--------------|------|---------------|---------------|--------|');
    for (const issue of autoFix.slice(0, 30)) {
      lines.push(`| ${issue.templateCode} | \`${issue.path}\` | ${issue.suggestedPath ? `\`${issue.suggestedPath}\`` : '-'} | ${issue.suggestedLabel ? `\`${issue.suggestedLabel}\`` : '-'} | ${issue.reason?.slice(0, 80)} |`);
    }
    if (autoFix.length > 30) lines.push(`| ... | | | | ${autoFix.length - 30} more |`);
    lines.push('');
  }

  if (manualReview.length > 0) {
    lines.push('### Manual Review Required');
    lines.push('');
    lines.push('| templateCode | path | issueCode | reason |');
    lines.push('|--------------|------|----------|--------|');
    for (const issue of manualReview.slice(0, 30)) {
      lines.push(`| ${issue.templateCode} | \`${issue.path}\` | ${issue.issueCode} | ${issue.reason?.slice(0, 80)} |`);
    }
    if (manualReview.length > 30) lines.push(`| ... | | | ${manualReview.length - 30} more |`);
    lines.push('');
  }

  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');

  process.stderr.write(`Written: ${jsonPath}\n`);
  process.stderr.write(`Written: ${mdPath}\n`);
  process.stderr.write(
    `Summary: ${totalContracts} contracts, ${totalFields} fields, ${totalIssues} issues\n` +
    `  FAIL: ${failCount} | REVIEW: ${reviewCount}\n` +
    `  By code: ${JSON.stringify(issueCounts)}\n`,
  );

  return { failCount, reviewCount, totalIssues };
}

// =============================================================================
// MAIN
// =============================================================================

const compiledMap = loadCompiled();
const contracts = loadContracts();

// Load deriveFormInputSchema once
let deriveFn = null;
try {
  const mod = $require('@qllaw/form-contracts');
  deriveFn = mod.deriveFormInputSchema;
} catch (err) {
  process.stderr.write(`[AUDIT] Could not load deriveFormInputSchema: ${err.message}\n`);
  // Try workspace resolve
  try {
    const pkgPath = join(ROOT, 'packages', 'form-contracts', 'dist', 'index.js');
    const { deriveFormInputSchema: df } = await import('file://' + pkgPath);
    deriveFn = df;
  } catch { /* still noop */ }
}

process.stderr.write(
  `[AUDIT_FORMS_ROOT_CAUSE] Form metadata root-cause audit\n` +
  `[AUDIT] strict=${STRICT} | template=${TEMPLATE_CODE ?? 'ALL'}\n` +
  `[AUDIT] ${contracts.length} contracts loaded\n` +
  `[AUDIT] ${compiledMap.size} compiled artifacts loaded\n` +
  `[AUDIT] deriveFn available: ${deriveFn !== null}\n`,
);

const results = [];
for (let i = 0; i < contracts.length; i++) {
  const contract = contracts[i];
  process.stderr.write(`[${i + 1}/${contracts.length}] auditing ${contract.templateCode}...\n`);
  const issues = auditContract(contract, compiledMap, deriveFn);
  results.push({
    templateCode: contract.templateCode,
    sourceId: contract.sourceId,
    title: contract.templateTitle,
    fieldCount: (contract.canonicalFields ?? []).length,
    issues,
  });
  if (issues.some((i) => i.severity === 'FAIL')) {
    const byCode = {};
    for (const issue of issues) byCode[issue.issueCode] = (byCode[issue.issueCode] ?? 0) + 1;
    process.stderr.write(`  -> FAILs: ${issues.filter((i2) => i2.severity === 'FAIL').length}, codes: ${JSON.stringify(byCode)}\n`);
  }
}

const { failCount } = writeReports(results);

if (STRICT && failCount > 0) {
  process.stderr.write(`\n[AUDIT] strict mode: ${failCount} FAIL issues found - exiting 1\n`);
  process.exit(1);
}
