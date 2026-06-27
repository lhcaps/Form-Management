#!/usr/bin/env node
/**
 * audit-forms-root-cause.mjs - AUDIT_FORMS_ROOT_CAUSE v2 repair.
 *
 * Improvements over v1:
 * - Rule independence: every rule runs for every field, not gated by BAD_LABEL.
 * - parseRawPattern helper: strips {{ and }} cleanly, no trailing brace bug.
 * - SOURCE_MISMATCH considers rawPattern domain + context + source together.
 * - GENERIC_FIELD_CANONICALIZATION runs even when label is good.
 * - WEAK_EVIDENCE_AUTO_LOCKED runs even when label is good.
 * - SHOULD_BE_READONLY runs for all fields, independent of source value.
 * - UI_VISIBLE_BAD_METADATA is explicit, not suppressed by BAD_LABEL.
 * - BM-050/BM-068 callouts list ALL issues.
 * - Built-in smoke tests with synthetic in-memory contracts.
 * - Report versioning: auditVersion: "v2".
 *
 * Exit codes:
 *   0 - report generated (always; strict mode controls exit 1).
 *   1 - strict mode and one or more FAIL issues exist.
 *
 * Usage:
 *   node scripts/audit/audit-forms-root-cause.mjs                    # audit
 *   node scripts/audit/audit-forms-root-cause.mjs --strict          # strict
 *   node scripts/audit/audit-forms-root-cause.mjs --template-code BM-050
 *   node scripts/audit/audit-forms-root-cause.mjs --smoke-test        # self-test only
 *   pnpm audit:forms-root-cause
 *   pnpm audit:forms-root-cause:strict
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const COMPILED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
const OUT_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause');

const STRICT = process.argv.includes('--strict');
const SMOKE_TEST = process.argv.includes('--smoke-test');
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
// DOMAIN HELPERS
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

/**
 * Parse a raw DOCX pattern like "{{decision.field2}}" or "{{document.field3}}".
 * Returns { rawKey, rawDomain, rawTail } or null for invalid input.
 * Never returns values with braces attached.
 */
function parseRawPattern(rawPattern) {
  if (!rawPattern || typeof rawPattern !== 'string') return null;
  const trimmed = rawPattern.trim();
  if (!trimmed.startsWith('{{') || !trimmed.endsWith('}}')) return null;
  const inner = trimmed.slice(2, -2).trim();
  const dotIdx = inner.indexOf('.');
  if (dotIdx < 0) return null;
  const rawDomain = inner.slice(0, dotIdx);
  const rawTail = inner.slice(dotIdx + 1);
  if (!rawDomain || !rawTail) return null;
  return {
    rawKey: inner,
    rawDomain: DOMAIN_KEYS.has(rawDomain) ? rawDomain : 'unknown',
    rawTail,
  };
}

function rawPatternDomain(rawPattern) {
  const parsed = parseRawPattern(rawPattern);
  return parsed ? parsed.rawDomain : 'unknown';
}

function normalizeCompiledSourceKind(kind) {
  switch (String(kind ?? '').toUpperCase()) {
    case 'MANUAL':
      return 'manual';
    case 'CASE':
      return 'casePayload';
    case 'AGENCY':
      return 'agencyConfig';
    case 'OFFICIAL':
      return 'officialConfig';
    case 'SYSTEM':
      return 'systemDate';
    case 'COMPUTED':
      return 'computed';
    case 'CONSTANT':
      return 'constantFromDocx';
    default:
      return String(kind ?? '');
  }
}

function normalizeLockedSourceKind(source) {
  return String(source ?? '').trim();
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
  const tail = path?.split('.')?.at(-1) ?? '';
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
// KNOWN GOOD LABEL VALUES
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

const GENERIC_RAW_TAIL_RE = /^field\d+$/i;

function isGenericRawTail(tail) {
  return GENERIC_RAW_TAIL_RE.test(tail ?? '');
}

// =============================================================================
// REMEDIATION LEAK DETECTION
// =============================================================================

const REMEDIATION_RE = [/wave/i, /remediation/i];

function containsRemediationLeak(str) {
  if (!str) return false;
  return REMEDIATION_RE.some((re) => re.test(str));
}

// =============================================================================
// WEAK EVIDENCE DETECTION
// =============================================================================

function isWeakEvidence(context, textBefore, rawPattern, reviewRequired) {
  if (reviewRequired) return false;
  const parsed = parseRawPattern(rawPattern);
  const isAutoGen = context?.startsWith('[Auto-generated]') ?? false;
  const isShortContext = !context || context.length < 10;
  const isNoisyTextBefore = Boolean(textBefore && /^[0-9.,:; ]+$/.test(textBefore.trim()));
  const isGenericRaw = parsed ? isGenericRawTail(parsed.rawTail) : false;
  return (isAutoGen || isShortContext) && (isNoisyTextBefore || isGenericRaw || !context);
}

// =============================================================================
// SHOULD_BE_READONLY PATTERNS
// =============================================================================

const READONLY_PATH_PATTERNS = [
  {
    re: /^agency\.(name|parentName|shortName|nameUpper|parentNameUpper)$/i,
    reason: 'agency name field',
    allowedSources: new Set(['agencyConfig', 'computed']),
  },
  {
    re: /^legalBasis\.(procedureArticlesLine|articleLine)$/i,
    reason: 'fixed legal text',
    allowedSources: new Set(['constantFromDocx', 'computed']),
  },
  {
    re: /^signature\.signDate$/i,
    reason: 'system-generated sign date',
    allowedSources: new Set(['systemDate', 'computed']),
  },
  {
    re: /^document\.(issuePlaceDateLine|issuePlaceAndDateLine|issueOffice|legalBasisLine|formNumber|documentNumberSuffix)$/i,
    reason: 'fixed/generated administrative field',
    allowedSources: new Set(['agencyConfig', 'systemDate', 'computed', 'constantFromDocx']),
  },
];

function detectReadonlyReason(path, source, context) {
  for (const { re, reason, allowedSources } of READONLY_PATH_PATTERNS) {
    if (!re.test(path)) continue;
    if (allowedSources?.has(source)) return null;
    return reason;
  }
  if (path.toLowerCase().includes('upper') && !['agencyConfig', 'computed'].includes(source)) {
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
// SUGGESTIONS (path -> corrected path/label)
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
  const parsed = rawPattern ? parseRawPattern(rawPattern) : null;
  return {
    templateCode, sourceId, path, slotId,
    rawPattern,
    rawKey: parsed?.rawKey ?? null,
    rawDomain: parsed?.rawDomain ?? null,
    rawTail: parsed?.rawTail ?? null,
    label, source,
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
    for (const f of readdirSync(COMPILED_DIR).filter((f) => f.endsWith('.compiled.json'))) {
      const code = f.replace('.compiled.json', '');
      try { map.set(code, JSON.parse(readFileSync(join(COMPILED_DIR, f), 'utf8'))); }
      catch { /* skip */ }
    }
  } catch { /* dir missing */ }
  return map;
}

function loadContracts() {
  const contracts = [];
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    if (TEMPLATE_CODE && code !== TEMPLATE_CODE) continue;
    try { contracts.push(JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8'))); }
    catch { /* skip */ }
  }
  return contracts.sort((a, b) => a.templateCode.localeCompare(b.templateCode));
}

// =============================================================================
// PER-FIELD AUDIT (each rule is independent)
// =============================================================================

/**
 * Run all independent rules for a single canonical field.
 * Rules are NOT gated by BAD_LABEL or any other rule.
 */
function auditField({ field, slot, contract, templateCode, sourceId }) {
  const issues = [];
  const path = field.path;
  const label = field.label;
  const source = field.source;
  const reviewRequired = field.reviewRequired ?? false;
  const required = field.required ?? false;

  const parsed = slot ? parseRawPattern(slot.evidence?.rawPattern ?? '') : null;
  const rawPattern = slot?.evidence?.rawPattern ?? null;
  const context = slot?.context ?? '';
  const textBefore = slot?.evidence?.textBefore ?? '';

  const pathDom = pathDomain(path);
  const rawDom = parsed ? parsed.rawDomain : 'unknown';

  // ---- RULE 1: BAD_LABEL ----
  {
    const { bad, reason } = isBadLabel(label, path);
    if (bad) {
      const severity = ['empty string', '"Ô trống"', 'raw generic fieldN'].some((r) => reason?.includes(r))
        ? 'FAIL' : 'REVIEW';
      issues.push(makeIssue({
        templateCode, sourceId, path, slotId: path,
        rawPattern, label, source,
        issueCode: ISSUE.BAD_LABEL,
        severity,
        reason: `Canonical field label is "${label}" (${reason}). This will appear in UI.`,
        context,
        confidence: reason === 'empty string' ? 'HIGH' : 'MEDIUM',
      }));
    }
  }

  // ---- RULE 2: RAW_PATTERN_DOMAIN_MISMATCH ----
  // Always check: label good or bad does not matter
  if (
    parsed &&
    !isGenericRawTail(parsed.rawTail) &&
    parsed.rawDomain !== 'unknown' &&
    pathDom !== 'unknown' &&
    parsed.rawDomain !== pathDom
  ) {
    issues.push(makeIssue({
      templateCode, sourceId, path, slotId: path,
      rawPattern, label, source,
      issueCode: ISSUE.RAW_PATTERN_DOMAIN_MISMATCH,
      severity: 'FAIL',
      reason: `rawPattern domain "${parsed.rawDomain}" ({{${parsed.rawKey}}}) does not match canonical path domain "${pathDom}". Context: "${context.slice(0, 80)}"`,
      context,
      suggestedPath: `${parsed.rawDomain}.${parsed.rawTail}`,
      confidence: 'HIGH',
    }));
  }

  // ---- RULE 3: SOURCE_MISMATCH ----
  // Consider: rawPattern domain vs source vs context all together
  {
    // agencyConfig source but path/rawPattern is decision/document/person => mismatch
    if (source === 'agencyConfig') {
      if (pathDom === 'decision' || pathDom === 'person' || pathDom === 'document' || pathDom === 'caseInfo') {
        issues.push(makeIssue({
          templateCode, sourceId, path, slotId: path,
          rawPattern, label, source,
          issueCode: ISSUE.SOURCE_MISMATCH,
          severity: 'FAIL',
          reason: `source="agencyConfig" but path="${path}" is a ${pathDom} field. agencyConfig should only apply to agency.* fields. rawPattern=${rawPattern ?? '-'}, context="${context.slice(0, 60)}"`,
          context,
          suggestedSource: pathDom === 'decision' || pathDom === 'person' || pathDom === 'document' ? 'manual' : 'casePayload',
          confidence: 'HIGH',
        }));
      }
    }

    // manual source but context is fixed legal text
    if (source === 'manual' && /^(Căn cứ|Luật|Điều|Bộ luật)/.test(context)) {
      issues.push(makeIssue({
        templateCode, sourceId, path, slotId: path,
        rawPattern, label, source,
        issueCode: ISSUE.SOURCE_MISMATCH,
        severity: 'REVIEW',
        reason: `source="manual" but context contains fixed legal text. Verify this really needs user input. context="${context.slice(0, 80)}"`,
        context,
        confidence: 'MEDIUM',
      }));
    }

    // rawPattern domain is decision/document but source is agencyConfig => mismatch
    if (
      source === 'agencyConfig' &&
      parsed &&
      !isGenericRawTail(parsed.rawTail) &&
      (parsed.rawDomain === 'decision' || parsed.rawDomain === 'document' || parsed.rawDomain === 'person')
    ) {
      issues.push(makeIssue({
        templateCode, sourceId, path, slotId: path,
        rawPattern, label, source,
        issueCode: ISSUE.SOURCE_MISMATCH,
        severity: 'FAIL',
        reason: `source="agencyConfig" but rawPattern "{{${parsed.rawKey}}}" is from "${parsed.rawDomain}" domain. agencyConfig cannot provide decision/document/person data.`,
        context,
        suggestedSource: parsed.rawDomain === 'decision' ? 'casePayload' : 'manual',
        confidence: 'HIGH',
      }));
    }
  }

  // ---- RULE 4: WEAK_EVIDENCE_AUTO_LOCKED ----
  // Always check regardless of label quality
  if (!reviewRequired && isWeakEvidence(context, textBefore, rawPattern, reviewRequired)) {
    issues.push(makeIssue({
      templateCode, sourceId, path, slotId: path,
      rawPattern, label, source,
      issueCode: ISSUE.WEAK_EVIDENCE_AUTO_LOCKED,
      severity: 'FAIL',
      reason: `reviewRequired=false but context is auto-generated/short/noisy. Evidence too weak to justify locking without review. textBefore="${textBefore.slice(0, 40)}", rawDomain="${rawDom}", rawTail="${parsed?.rawTail ?? '-'}"`,
      context,
      confidence: 'HIGH',
      requiresHumanReview: true,
    }));
  }

  // ---- RULE 5: GENERIC_FIELD_CANONICALIZATION ----
  // Always check: generic raw mapped to semantic path (label good OR bad does not matter)
  if (parsed && isGenericRawTail(parsed.rawTail)) {
    const { bad: labelBad } = isBadLabel(label, path);
    const isWeak = isWeakEvidence(context, textBefore, rawPattern, reviewRequired);
    if (labelBad || isWeak) {
      issues.push(makeIssue({
        templateCode, sourceId, path, slotId: path,
        rawPattern, label, source,
        issueCode: ISSUE.GENERIC_FIELD_CANONICALIZATION,
        severity: 'FAIL',
        reason: `Generic raw pattern "{{${parsed.rawKey}}}" mapped to "${path}" but has problems (label="${label}" ${labelBad ? '(bad)' : '(good)'}, weak_evidence=${isWeak}). Generic fieldN should be replaced with correct semantic path.`,
        context,
        confidence: isWeak ? 'HIGH' : 'MEDIUM',
        requiresHumanReview: true,
      }));
    }
  }

  // ---- RULE 8: REQUIRED_SUSPICIOUS ----
  // Always check regardless of source
  if (!required) {
    const reqReason = detectRequiredReason(path);
    if (reqReason) {
      issues.push(makeIssue({
        templateCode, sourceId, path,
        label, source,
        issueCode: ISSUE.REQUIRED_SUSPICIOUS,
        severity: 'REVIEW',
        reason: `Field looks required (${reqReason}) but required=false.`,
        confidence: 'MEDIUM',
      }));
    }
  }

  // ---- RULE 9: SHOULD_BE_READONLY ----
  // Always check: if path looks computed/system/agency but source is manual
  {
    const readonlyReason = detectReadonlyReason(path, source, context);
    if (readonlyReason) {
      issues.push(makeIssue({
        templateCode, sourceId, path,
        label, source,
        issueCode: ISSUE.SHOULD_BE_READONLY,
        severity: 'REVIEW',
        reason: `Field appears to be a computed/agency/official field (${readonlyReason}). source="${source}" is likely wrong.`,
        suggestedSource: 'agencyConfig',
        confidence: 'MEDIUM',
      }));
    }

    // Additional: manual source + rawPattern suggests system data
    if (source === 'manual' && parsed && (parsed.rawDomain === 'document' || parsed.rawDomain === 'agency')) {
      const tail = parsed.rawTail;
      if (
        /^(issuePlaceDateLine|issuePlaceAndDateLine|issueOffice|name|parentName)$/i.test(tail) ||
        /upper/i.test(tail)
      ) {
        issues.push(makeIssue({
          templateCode, sourceId, path, slotId: path,
          rawPattern, label, source,
          issueCode: ISSUE.SHOULD_BE_READONLY,
          severity: 'REVIEW',
          reason: `source="manual" but rawPattern "{{${parsed.rawKey}}}" suggests this is a system-generated/agency field. Likely should be agencyConfig or computed.`,
          context,
          suggestedSource: 'agencyConfig',
          confidence: 'HIGH',
        }));
      }
    }
  }

  return issues;
}

// =============================================================================
// PER-CONTRACT AUDIT
// =============================================================================

function auditContract(contract, compiledMap, deriveFn) {
  const issues = [];
  const { templateCode, sourceId, docxSlots = [], canonicalFields = [] } = contract;

  const slotById = new Map(docxSlots.map((s) => [s.slotId, s]));
  const canonicalByPath = new Map(canonicalFields.map((f) => [f.path, f]));

  // ---- RULES 1-9 on each canonical field (all independent) ----
  for (const field of canonicalFields) {
    const slot = slotById.get(field.path) ?? null;
    issues.push(...auditField({ field, slot, contract, templateCode, sourceId }));
  }

  // ---- RULE 10: REMEDIATION_LEAK on docxSlots ----
  for (const slot of docxSlots) {
    const slotLabel = slot.label ?? '';
    const ctx = slot.context ?? '';
    const rawP = slot.evidence?.rawPattern ?? '';

    if (containsRemediationLeak(slotLabel)) {
      issues.push(makeIssue({
        templateCode, sourceId, path: slot.slotId, slotId: slot.slotId,
        rawPattern: rawP, label: slotLabel,
        source: canonicalByPath.get(slot.slotId)?.source,
        issueCode: ISSUE.REMEDIATION_LEAK,
        severity: 'FAIL',
        reason: `Slot label "${slotLabel}" contains remediation metadata. This leaks internal process language into user-facing UI.`,
        context: ctx,
        confidence: 'HIGH',
      }));
    }

    if (containsRemediationLeak(ctx) && !containsRemediationLeak(slotLabel)) {
      issues.push(makeIssue({
        templateCode, sourceId, path: slot.slotId, slotId: slot.slotId,
        rawPattern: rawP, label: slotLabel,
        source: canonicalByPath.get(slot.slotId)?.source,
        issueCode: ISSUE.REMEDIATION_LEAK,
        severity: 'REVIEW',
        reason: `Slot context contains remediation keyword: "${ctx.slice(0, 100)}"`,
        context: ctx,
        confidence: 'MEDIUM',
      }));
    }
  }

  // ---- RULE 7: COMPILED_DRIFT ----
  const compiled = compiledMap.get(templateCode);
  if (compiled) {
    // Deduplicate compiled fields by key (v2 may have duplicates from old+new)
    const seenKeys = new Set();
    const compiledFields = [];
    for (const section of compiled.uiSchema?.sections ?? []) {
      for (const field of section.fields ?? []) {
        if (!seenKeys.has(field.key)) {
          seenKeys.add(field.key);
          compiledFields.push(field);
        }
      }
    }

    if (compiledFields.length !== canonicalFields.length) {
      issues.push(makeIssue({
        templateCode, sourceId, path: '—',
        issueCode: ISSUE.COMPILED_DRIFT,
        severity: 'REVIEW',
        reason: `Field count mismatch: locked=${canonicalFields.length} vs compiled=${compiledFields.length} (deduplicated).`,
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

      // Label drift
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

      // Required drift
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

      // dataSource drift
      const compiledSrc = compiledField.dataSource?.kind;
      const lockedSrc = cf.source;
      if (compiledSrc && lockedSrc) {
        const normCompiled = normalizeCompiledSourceKind(compiledSrc);
        const normLocked = normalizeLockedSourceKind(lockedSrc);
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

  // ---- RULE 6: UI_VISIBLE_BAD_METADATA via deriveFormInputSchema ----
  if (deriveFn) {
    try {
      const schema = deriveFn(contract);
      const lockedPaths = new Set(issues.filter((i) => i.issueCode === ISSUE.BAD_LABEL).map((i) => i.path));

      for (const section of schema.sections) {
        for (const field of section.fields) {
          if (!field.visible) continue;
          const { bad, reason } = isBadLabel(field.label, field.path);
          if (!bad) continue;
          // Always emit UI_VISIBLE_BAD_METADATA if bad label reaches the UI
          issues.push(makeIssue({
            templateCode, sourceId, path: field.path,
            label: field.label, source: field.source,
            issueCode: ISSUE.UI_VISIBLE_BAD_METADATA,
            severity: 'FAIL',
            reason: `Visible field resolves to bad label "${field.label}" (${reason}) after full label resolution chain. This WILL appear in UI.`,
            confidence: reason === 'empty string' ? 'HIGH' : 'MEDIUM',
          }));
        }
      }
    } catch (err) {
      process.stderr.write(`[${templateCode}] deriveFormInputSchema failed: ${err.message}\n`);
    }
  }

  return issues;
}

// =============================================================================
// SMOKE TESTS
// =============================================================================

function runSmokeTests() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      const got = fn();
      if (got === true) {
        results.push(`  PASS  ${name}`);
        passed++;
      } else {
        results.push(`  FAIL  ${name}: ${got}`);
        failed++;
      }
    } catch (err) {
      results.push(`  FAIL  ${name}: ${err.message}`);
      failed++;
    }
  }

  // parseRawPattern
  test('parseRawPattern: strips braces cleanly', () => {
    const r = parseRawPattern('{{decision.field2}}');
    if (!r) return 'returned null';
    if (r.rawKey !== 'decision.field2') return `rawKey="${r.rawKey}" expected "decision.field2"`;
    if (r.rawDomain !== 'decision') return `rawDomain="${r.rawDomain}" expected "decision"`;
    if (r.rawTail !== 'field2') return `rawTail="${r.rawTail}" expected "field2"`;
    if (r.rawKey.includes('{') || r.rawKey.includes('}')) return 'rawKey still contains braces';
    if (r.rawTail.endsWith('}')) return 'rawTail ends with }';
    return true;
  });

  test('parseRawPattern: strips braces on document.field3', () => {
    const r = parseRawPattern('{{document.field3}}');
    if (!r) return 'returned null';
    if (r.rawTail !== 'field3') return `rawTail="${r.rawTail}" expected "field3"`;
    return true;
  });

  test('parseRawPattern: strips braces on person.permanentAddress', () => {
    const r = parseRawPattern('{{person.permanentAddress}}');
    if (!r) return 'returned null';
    if (r.rawTail !== 'permanentAddress') return `rawTail="${r.rawTail}"`;
    return true;
  });

  test('parseRawPattern: null on invalid input', () => {
    if (parseRawPattern(null) !== null) return 'should return null for null';
    if (parseRawPattern('') !== null) return 'should return null for empty';
    if (parseRawPattern('field2}}') !== null) return 'should return null for missing {{';
    if (parseRawPattern('{{field2') !== null) return 'should return null for missing }}';
    return true;
  });

  test('normalizeCompiledSourceKind: V2 enum kinds map to locked V1 source strings', () => {
    const cases = [
      ['MANUAL', 'manual'],
      ['CASE', 'casePayload'],
      ['AGENCY', 'agencyConfig'],
      ['OFFICIAL', 'officialConfig'],
      ['SYSTEM', 'systemDate'],
      ['COMPUTED', 'computed'],
      ['CONSTANT', 'constantFromDocx'],
    ];
    for (const [input, expected] of cases) {
      const actual = normalizeCompiledSourceKind(input);
      if (actual !== expected) return `${input} mapped to ${actual}, expected ${expected}`;
    }
    return true;
  });

  // Good label + semantic rawPattern domain mismatch flags RAW_PATTERN_DOMAIN_MISMATCH
  test('Good label + domain mismatch still flags RAW_PATTERN_DOMAIN_MISMATCH', () => {
    const field = { path: 'agency.coQuan', label: 'Cơ quan', source: 'manual', required: false, reviewRequired: false };
    const slot = { context: 'Xét hồ sơ đề nghị', evidence: { rawPattern: '{{decision.requestingAgencyName}}', textBefore: '' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.RAW_PATTERN_DOMAIN_MISMATCH);
    return found || 'RAW_PATTERN_DOMAIN_MISMATCH not found';
  });

  // Good label + agencyConfig + semantic rawPattern decision.* flags SOURCE_MISMATCH
  test('Good label + agencyConfig + decision rawPattern flags SOURCE_MISMATCH', () => {
    const field = { path: 'agency.coQuan', label: 'Cơ quan', source: 'agencyConfig', required: false, reviewRequired: false };
    const slot = { context: 'Xét hồ sơ', evidence: { rawPattern: '{{decision.requestingAgencyName}}', textBefore: '' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.SOURCE_MISMATCH);
    return found || 'SOURCE_MISMATCH not found';
  });

  // Generic fieldN placeholders are not semantic domain evidence.
  test('generic rawPattern domain does not force mismatch', () => {
    const field = { path: 'agency.name', label: 'Agency name', source: 'agencyConfig', required: false, reviewRequired: false };
    const slot = { context: 'VIEN KIEM SAT {{document.field1}}', evidence: { rawPattern: '{{document.field1}}', textBefore: 'VIEN KIEM SAT' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const hasDomain = issues.some((i) => i.issueCode === ISSUE.RAW_PATTERN_DOMAIN_MISMATCH);
    const hasSource = issues.some((i) => i.issueCode === ISSUE.SOURCE_MISMATCH);
    if (hasDomain) return 'RAW_PATTERN_DOMAIN_MISMATCH should not be emitted for generic fieldN rawPattern';
    if (hasSource) return 'SOURCE_MISMATCH should not be emitted for generic fieldN rawPattern';
    return true;
  });

  // Good label + document.field1 + weak context flags GENERIC_FIELD_CANONICALIZATION
  test('Good label + generic raw + weak context flags GENERIC_FIELD_CANONICALIZATION', () => {
    const field = { path: 'document.someField', label: 'Tên trường', source: 'manual', required: false, reviewRequired: false };
    const slot = { context: '[Auto-generated]', evidence: { rawPattern: '{{document.field1}}', textBefore: '11' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.GENERIC_FIELD_CANONICALIZATION);
    return found || 'GENERIC_FIELD_CANONICALIZATION not found';
  });

  // Good label + document.field1 + weak context also flags WEAK_EVIDENCE_AUTO_LOCKED
  test('Generic raw + weak context also flags WEAK_EVIDENCE_AUTO_LOCKED', () => {
    const field = { path: 'document.someField', label: 'Tên trường', source: 'manual', required: false, reviewRequired: false };
    const slot = { context: '[Auto-generated]', evidence: { rawPattern: '{{document.field1}}', textBefore: '11' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.WEAK_EVIDENCE_AUTO_LOCKED);
    return found || 'WEAK_EVIDENCE_AUTO_LOCKED not found';
  });

  // document.fullDocumentCode is user-entered administrative data unless
  // a contract explicitly models it as computed.
  test('manual + document.fullDocumentCode does not flag SHOULD_BE_READONLY', () => {
    const field = { path: 'document.fullDocumentCode', label: 'Số văn bản', source: 'manual', required: false, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.SHOULD_BE_READONLY);
    return !found || 'SHOULD_BE_READONLY should not be emitted for document.fullDocumentCode manual source';
  });

  // agencyConfig + semantic rawPattern decision flags both RAW_PATTERN_DOMAIN_MISMATCH and SOURCE_MISMATCH
  test('agencyConfig + decision rawPattern flags both MISMATCH rules', () => {
    const field = { path: 'agency.coQuan', label: 'Cơ quan', source: 'agencyConfig', required: false, reviewRequired: false };
    const slot = { context: 'Xét hồ sơ', evidence: { rawPattern: '{{decision.requestingAgencyName}}', textBefore: '' } };
    const issues = auditField({ field, slot, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const hasDomain = issues.some((i) => i.issueCode === ISSUE.RAW_PATTERN_DOMAIN_MISMATCH);
    const hasSource = issues.some((i) => i.issueCode === ISSUE.SOURCE_MISMATCH);
    if (!hasDomain) return 'RAW_PATTERN_DOMAIN_MISMATCH not found';
    if (!hasSource) return 'SOURCE_MISMATCH not found';
    return true;
  });

  // agencyConfig is already readonly in the derived form schema.
  test('agency.nameUpper + agencyConfig does not flag SHOULD_BE_READONLY', () => {
    const field = { path: 'agency.nameUpper', label: 'Tên viết hoa', source: 'agencyConfig', required: false, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.SHOULD_BE_READONLY);
    return !found || 'SHOULD_BE_READONLY should not be emitted for agencyConfig';
  });

  // manual + agency nameUpper still flags SHOULD_BE_READONLY
  test('agency.nameUpper + manual flags SHOULD_BE_READONLY', () => {
    const field = { path: 'agency.nameUpper', label: 'Agency uppercase', source: 'manual', required: false, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.SHOULD_BE_READONLY);
    return found || 'SHOULD_BE_READONLY not found';
  });

  // document numbers are user-entered administrative data unless a
  // contract explicitly models them as computed.
  test('document.documentCode + manual does not flag SHOULD_BE_READONLY', () => {
    const field = { path: 'document.documentCode', label: 'Document number', source: 'manual', required: true, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.SHOULD_BE_READONLY);
    return !found || 'SHOULD_BE_READONLY should not be emitted for document.documentCode manual source';
  });

  // required=false + signerName flags REQUIRED_SUSPICIOUS
  test('required=false + signerName flags REQUIRED_SUSPICIOUS', () => {
    const field = { path: 'signature.signerName', label: 'Người ký', source: 'manual', required: false, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.some((i) => i.issueCode === ISSUE.REQUIRED_SUSPICIOUS);
    return found || 'REQUIRED_SUSPICIOUS not found';
  });

  // Empty label flags BAD_LABEL (severity FAIL)
  test('Empty label flags BAD_LABEL as FAIL', () => {
    const field = { path: 'agency.coQuan', label: '', source: 'manual', required: false, reviewRequired: false };
    const issues = auditField({ field, slot: null, contract: {}, templateCode: 'BM-TEST', sourceId: 't' });
    const found = issues.find((i) => i.issueCode === ISSUE.BAD_LABEL && i.severity === 'FAIL');
    return found ? true : 'BAD_LABEL FAIL not found';
  });

  // Remediation label flags REMEDIATION_LEAK
  test('Remediation label in slot flags REMEDIATION_LEAK', () => {
    const issues = [];
    const slot = { slotId: 'person.name', label: 'Slot from Wave 02 DOCX remediation', context: 'Họ tên:', evidence: { rawPattern: '{{person.name}}', textBefore: 'Họ tên:' } };
    if (containsRemediationLeak(slot.label)) {
      issues.push(makeIssue({
        templateCode: 'BM-TEST', sourceId: 't',
        path: slot.slotId, slotId: slot.slotId,
        rawPattern: slot.evidence.rawPattern,
        label: slot.label,
        issueCode: ISSUE.REMEDIATION_LEAK,
        severity: 'FAIL',
        reason: `Slot label leak`,
        context: slot.context,
        confidence: 'HIGH',
      }));
    }
    const found = issues.some((i) => i.issueCode === ISSUE.REMEDIATION_LEAK);
    return found || 'REMEDIATION_LEAK not found';
  });

  console.log('\n=== SMOKE TESTS ===');
  for (const line of results) console.log(line);
  console.log(`\nSmoke tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
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
    auditVersion: 'v2',
    repairedFrom: 'AUDIT_FORMS_ROOT_CAUSE',
    ruleIndependence: true,
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
      // Include ALL issues (not just top 5)
      allIssues: r.issues,
    })),
  };

  const jsonPath = join(OUT_DIR, 'latest.json');
  const mdPath = join(OUT_DIR, 'latest.md');
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  // ---- Markdown report ----
  const lines = [];
  lines.push(`# AUDIT_FORMS_ROOT_CAUSE v2 - Form Metadata Root-Cause Audit (Repaired)`);
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push(`Audit version: v2 (rule independence: true)`);
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

  // ---- BM-050 and BM-068 callouts: ALL issues, no truncation ----
  for (const code of ['BM-050', 'BM-068']) {
    const bm = body.byTemplate.find((b) => b.templateCode === code);
    if (!bm) continue;
    lines.push(`### ${code} Findings`);
    lines.push('');
    lines.push(`**${bm.title ?? ''}**`);
    lines.push('');
    lines.push(`Total: ${bm.issueCount} issues (${bm.failCount} FAIL, ${bm.reviewCount} REVIEW)`);
    lines.push('');
    if (bm.issueCount === 0) {
      lines.push('No issues found.');
    } else {
      for (const issue of bm.allIssues) {
        lines.push(`- **${issue.issueCode}** [${issue.severity}] \`${issue.path}\``);
        lines.push(`  - Label: \`${issue.label ?? '-'}\` | rawPattern: \`${issue.rawPattern ?? '-'}\` | rawDomain: \`${issue.rawDomain ?? '-'}\` | rawTail: \`${issue.rawTail ?? '-'}\` | source: \`${issue.source ?? '-'}\``);
        lines.push(`  - Reason: ${issue.reason}`);
        if (issue.suggestedPath) lines.push(`  - Suggested path: \`${issue.suggestedPath}\``);
        if (issue.suggestedLabel) lines.push(`  - Suggested label: \`${issue.suggestedLabel}\``);
        if (issue.suggestedSource) lines.push(`  - Suggested source: \`${issue.suggestedSource}\``);
        lines.push(`  - Confidence: ${issue.confidence} | requiresHumanReview: ${issue.requiresHumanReview}`);
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
    [ISSUE.SHOULD_BE_READONLY, 'SHOULD_BE_READONLY'],
    [ISSUE.REQUIRED_SUSPICIOUS, 'REQUIRED_SUSPICIOUS'],
    [ISSUE.COMPILED_DRIFT, 'COMPILED_DRIFT'],
    [ISSUE.UI_VISIBLE_BAD_METADATA, 'UI_VISIBLE_BAD_METADATA'],
  ]) {
    const codeIssues = allIssues.filter((i) => i.issueCode === code);
    if (codeIssues.length === 0) continue;
    lines.push(`### ${label} (${codeIssues.length})`);
    lines.push('');
    lines.push('| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |');
    lines.push('|--------------|------|-------|----------|---------|--------|----------|------------|');
    for (const issue of codeIssues.slice(0, 100)) {
      lines.push(`| ${issue.templateCode} | \`${issue.path}\` | \`${(issue.label ?? '-').slice(0, 25)}\` | ${issue.rawDomain ?? '-'} | ${issue.rawTail ?? '-'} | ${issue.source ?? '-'} | ${issue.severity} | ${issue.confidence} |`);
    }
    if (codeIssues.length > 100) lines.push(`| ... | | | | | | | ${codeIssues.length - 100} more |`);
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

  return { failCount, reviewCount, totalIssues, issueCounts };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  // ---- Smoke tests first ----
  const smoke = runSmokeTests();
  if (SMOKE_TEST) {
    process.exit(smoke.failed > 0 ? 1 : 0);
  }

  const compiledMap = loadCompiled();
  const contracts = loadContracts();

  // Load deriveFormInputSchema. Direct Node execution may not have pnpm's
  // workspace package resolver, so prefer the local built artifact first.
  let deriveFn = null;
  const deriveLoadErrors = [];
  const deriveLoaders = [
    async () => import(pathToFileURL(join(ROOT, 'packages', 'form-contracts', 'dist', 'index.js')).href),
    async () => $require('@qllaw/form-contracts'),
  ];
  for (const load of deriveLoaders) {
    try {
      const mod = await load();
      if (typeof mod.deriveFormInputSchema === 'function') {
        deriveFn = mod.deriveFormInputSchema;
        break;
      }
    } catch (err) {
      deriveLoadErrors.push(err.message);
    }
  }
  if (!deriveFn && deriveLoadErrors.length > 0) {
    process.stderr.write(`[AUDIT] Could not load deriveFormInputSchema: ${deriveLoadErrors.join(' | ')}\n`);
  }

  process.stderr.write(
    `[AUDIT_FORMS_ROOT_CAUSE v2] Form metadata root-cause audit\n` +
    `[AUDIT] strict=${STRICT} | template=${TEMPLATE_CODE ?? 'ALL'}\n` +
    `[AUDIT] ${contracts.length} contracts loaded\n` +
    `[AUDIT] ${compiledMap.size} compiled artifacts loaded\n` +
    `[AUDIT] deriveFn available: ${deriveFn !== null}\n` +
    `[AUDIT] smoke tests: ${smoke.passed} passed, ${smoke.failed} failed\n`,
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

  const { failCount, issueCounts } = writeReports(results);

  if (STRICT && failCount > 0) {
    process.stderr.write(`\n[AUDIT] strict mode: ${failCount} FAIL issues found - exiting 1\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`[AUDIT] Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
