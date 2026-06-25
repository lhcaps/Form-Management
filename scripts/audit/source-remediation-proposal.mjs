#!/usr/bin/env node
/**
 * source-remediation-proposal.mjs — C3-PREP
 *
 * Scans all locked contracts for invalid sources (unknown, constantFromDocx, derived)
 * and produces deterministic remediation proposals.
 *
 * Heuristic rules:
 *   constantFromDocx + legalBasis/Line patterns  → officialConfig (fixed legal text)
 *   constantFromDocx + agency.uppercase patterns → computed (uppercase of agency data)
 *   constantFromDocx + issuePlace patterns      → computed (derived place)
 *   derived + nameUpper patterns                 → computed (uppercase transform)
 *   derived + date patterns                     → computed (date text)
 *   derived + Line patterns                      → computed (derived line)
 *   unknown + documentCode patterns              → manual (user-editable document ref)
 *   unknown + decisionLine patterns              → computed (derived from decision data)
 *   unknown + issuePlaceAndDateLine              → computed (composed line)
 *
 * Output:
 *   docs/audit/source-remediation/source-remediation-proposal.json
 *   docs/audit/source-remediation/source-remediation-proposal.md
 *
 * Usage: node scripts/audit/source-remediation-proposal.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const F4_REPORT   = join(ROOT, 'docs', 'audit', 'docx-binding-correctness', 'latest.json');
const OUT_DIR     = join(ROOT, 'docs', 'audit', 'source-remediation');

const VALID_SOURCES = new Set([
  'agencyConfig', 'officialConfig', 'systemDate', 'manual', 'casePayload', 'computed',
]);

// ──────────────────────────────────────────────────────────────────────────────
// Proposal logic
// ──────────────────────────────────────────────────────────────────────────────

const classify = (field) => {
  const { path, source, required } = field;

  if (source === 'constantFromDocx') {
    // Fixed legal text references — user should not edit these
    if (/legalBasis\.(procedure|juvenileJustice)Line/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal procedure reference from DOCX template; not user-editable.' };
    }
    // Specific decision-type legal basis lines
    if (/caseDecision\.|accusedDecision\.|investigationRecovery\./.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal basis line for a specific decision type; sourced from DOCX template.' };
    }
    // Generic legalBasis.procedureArticlesLine
    if (/legalBasis\.(procedure)?Line/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal procedure reference line from DOCX template.' };
    }
    // Prosecution/transfer procedure lines
    if (/prosecution(Transfer|Extension|SupplementReturn|CaseSuspension|CaseTermination)\./.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal basis line for prosecution phase document type.' };
    }
    // Subordinate/joiner/recovery/investigationConclusion/indictment legal lines
    if (/subordinateProcuracyTrialAssignment\.|caseJoinder\.|caseRecovery\.|investigationConclusion\./.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal basis line for specialized document section.' };
    }
    // Indictment specific lines
    if (/indictment\.(summaryConclusionLine|article1Line|replacementLine)/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal text line for indictment document.' };
    }
    // Juvenile protection article lines
    if (/juvenileProtection\.(article1|article2)Line/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal article reference for juvenile protection document.' };
    }
    // Detention article lines (BM-058, BM-213)
    if (/measure\.(detentionArticle1|detentionArticle2)Line/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed detention legal basis article line from DOCX template.' };
    }
    // Source verification procedure line
    if (/sourceVerification\.(procedure)?Line/.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal procedure reference in source verification document.' };
    }
    // Case initiation request
    if (/caseInitiationRequest\./.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal basis line for case initiation request document.' };
    }
    // Case investigation transfer procedure
    if (/caseInvestigationTransfer\./.test(path)) {
      return { proposedSource: 'officialConfig', confidence: 'HIGH',
        reason: 'Fixed legal procedure reference for investigation transfer.' };
    }
    // Uppercase agency parent name — uppercase transform of parentName, NOT manual
    if (/agency\.parentNameUpper/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Uppercase transform of agency.parentName; computed from agency config, not manual input.' };
    }
    // Agency name uppercase
    if (/agency\.nameUpper/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Uppercase transform of agency.name; computed from agency config, not manual input.' };
    }
    // Agency issue place — derived from agency config
    if (/agency\.issuePlace/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Derived from agency config; place of issue is not a free-form manual field.' };
    }
    // Decision summary line — derived from decision content
    if (/decision\.summaryLine/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Summary line derived from decision data; not a user-typed fixed text.' };
    }
    // Generic fallback for constantFromDocx
    return { proposedSource: 'officialConfig', confidence: 'MEDIUM',
      reason: 'Source is constantFromDocx; treating as officialConfig (fixed legal/official text). User review recommended for document types not covered by naming patterns.' };
  }

  if (source === 'derived') {
    // Uppercase agency name — uppercase transform
    if (/agency\.nameUpper/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Uppercase transform of agency.name; computed from agency config, not user input.' };
    }
    // Uppercase agency parent name
    if (/agency\.parentNameUpper/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Uppercase transform of agency.parentName; computed from agency config.' };
    }
    // Date text fields (derived from date)
    if (/document\.(issueDate|dateOfBirthText)/.test(path) || /person\.dateOfBirthText/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Date text derived from a date field; computed, not a manual string.' };
    }
    // Detention date text fields
    if (/measure\.detention(From|To)DateText/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Detention date text derived from detention date; computed field.' };
    }
    // Issue place and date line — composed from place + date
    if (/document\.issuePlaceAndDateLine/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Composed line: place + date. Derived, not manual.' };
    }
    // Identity issue line for juvenile
    if (/person\.identityIssueLine/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Derived line about identity document issue; computed from case data.' };
    }
    // Generic fallback for derived
    return { proposedSource: 'computed', confidence: 'MEDIUM',
      reason: 'Source is derived; computing from other fields is appropriate. Mark computed.' };
  }

  if (source === 'unknown') {
    // Document code fields — user-editable document reference numbers
    if (/document\.(fullDocumentCode|fullDocumentCode2)/.test(path)) {
      return { proposedSource: 'manual', confidence: 'HIGH',
        reason: 'Document code fields are user-entered document references; should be manual.' };
    }
    // Decision line — derived from decision content
    if (/decision\.decisionLine/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Decision line is derived from decision content; computed, not free-form manual.' };
    }
    // Issue place and date line — composed from place + date
    if (/document\.issuePlaceAndDateLine/.test(path)) {
      return { proposedSource: 'computed', confidence: 'HIGH',
        reason: 'Composed issue place and date line; derived, not a free-form user field.' };
    }
    // Generic fallback for unknown
    return { proposedSource: 'manual', confidence: 'LOW',
      reason: 'Source is unknown; treating as manual by default. Human review required to confirm whether this field is user-editable or should be computed.',
        requiresHumanReview: true };
  }

  // Should never reach here
  return { proposedSource: 'manual', confidence: 'LOW',
    reason: 'Unexpected source value. Defaulting to manual. Human review required.',
      requiresHumanReview: true };
};

// ──────────────────────────────────────────────────────────────────────────────
// Load data
// ──────────────────────────────────────────────────────────────────────────────

const log = (msg) => process.stderr.write(`[C3-PREP] ${msg}\n`);

log('Scanning locked contracts...');

const lockedFiles = readdirSync(LOCKED_DIR).filter(
  (f) => f.endsWith('.contract.locked.json'),
);

const issues = [];
let totalScanned = 0;

for (const file of lockedFiles) {
  const templateCode = file.replace(/__.*/, '');
  const c = JSON.parse(
    readFileSync(join(LOCKED_DIR, file), 'utf8'),
  );
  totalScanned++;

  for (const field of (c.canonicalFields ?? [])) {
    if (!VALID_SOURCES.has(field.source)) {
      issues.push({
        templateCode,
        sourceId: c.sourceId,
        path: field.path,
        label: field.label ?? field.path,
        originalSource: field.source,
        required: field.required ?? false,
        ...classify(field),
        requiresHumanReview: field.requiresHumanReview ?? false,
      });
    }
  }
}

log(`Scanned ${totalScanned} contracts, found ${issues.length} invalid source fields.`);

// ──────────────────────────────────────────────────────────────────────────────
// Load F4 binding correctness report for BM-021 review item
// ──────────────────────────────────────────────────────────────────────────────

log('Loading F4 binding report for BM-021...');

const bindingReview = [];
if (existsSync(F4_REPORT)) {
  const f4 = JSON.parse(readFileSync(F4_REPORT, 'utf8'));
  const f4ReviewItems = [
    ...(f4.representativeResults ?? []),
    ...(f4.corpusSmokeResults ?? []),
  ].filter((r) => r.status === 'REVIEW_REQUIRED');

  for (const item of f4ReviewItems) {
    bindingReview.push({
      templateCode: item.templateCode,
      sourceId: item.sourceId,
      status: item.status,
      notes: item.notes ?? [],
      markerMissingCount: item.markerMissingCount ?? 0,
    });
  }
}

// Add BM-021 agency.nameUpper as a binding review item if not already in issues
const bm021Issue = issues.find(
  (i) => i.templateCode === 'BM-021' && i.path === 'agency.nameUpper',
);
if (bm021Issue) {
  // It is already captured in the 9 'derived' fields
  // but we add it to bindingReview separately
}

// ──────────────────────────────────────────────────────────────────────────────
// Build summary
// ──────────────────────────────────────────────────────────────────────────────

const byOriginalSource = {
  unknown: issues.filter((i) => i.originalSource === 'unknown').length,
  constantFromDocx: issues.filter((i) => i.originalSource === 'constantFromDocx').length,
  derived: issues.filter((i) => i.originalSource === 'derived').length,
  bindingReview: bindingReview.length,
};

const summaryByProposedSource = {};
for (const issue of issues) {
  summaryByProposedSource[issue.proposedSource] =
    (summaryByProposedSource[issue.proposedSource] ?? 0) + 1;
}

const reviewRequired = issues.filter((i) => i.requiresHumanReview);
const highConf = issues.filter((i) => i.confidence === 'HIGH');
const medConf = issues.filter((i) => i.confidence === 'MEDIUM');
const lowConf = issues.filter((i) => i.confidence === 'LOW');

log(`Confidence: HIGH=${highConf.length}, MEDIUM=${medConf.length}, LOW=${lowConf.length}`);
log(`Review required: ${reviewRequired.length}`);

// ──────────────────────────────────────────────────────────────────────────────
// BM-021 specific entry
// ──────────────────────────────────────────────────────────────────────────────

const bm021Proposals = issues.filter((i) => i.templateCode === 'BM-021');
const bm021Review = bindingReview.find((r) => r.templateCode === 'BM-021');

// ──────────────────────────────────────────────────────────────────────────────
// Write JSON report
// ──────────────────────────────────────────────────────────────────────────────

const body = {
  generatedAt: new Date().toISOString(),
  task: 'C3-PREP — Source Remediation Proposal',
  scope: {
    totalInvalidSourceFields: issues.length,
    bindingReviewItems: bindingReview.length,
    totalIssues: issues.length + bindingReview.length,
    contractsScanned: totalScanned,
    byOriginalSource,
    summaryByProposedSource,
  },
  confidence: {
    HIGH: highConf.length,
    MEDIUM: medConf.length,
    LOW: lowConf.length,
  },
  reviewRequired: reviewRequired.map((i) => ({
    templateCode: i.templateCode,
    path: i.path,
    originalSource: i.originalSource,
    proposedSource: i.proposedSource,
    confidence: i.confidence,
    reason: i.reason,
  })),
  bindingReviewItems: bindingReview,
  bm021Proposal: {
    proposals: bm021Proposals,
    bindingReview: bm021Review ?? null,
  },
  proposals: issues,
};

mkdirSync(OUT_DIR, { recursive: true });
const jsonPath = join(OUT_DIR, 'source-remediation-proposal.json');
writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');
log(`Written: ${jsonPath}`);

// ──────────────────────────────────────────────────────────────────────────────
// Write Markdown report
// ──────────────────────────────────────────────────────────────────────────────

const lines = [];
lines.push(`# C3-PREP — Source Remediation Proposal`);
lines.push('');
lines.push(`Generated: ${body.generatedAt}`);
lines.push('');
lines.push(`## Scope`);
lines.push('');
lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Contracts scanned | ${totalScanned} |`);
lines.push(`| Invalid source fields | ${issues.length} |`);
lines.push(`| Binding review items | ${bindingReview.length} |`);
lines.push(`| **Total issues** | **${issues.length + bindingReview.length}** |`);
lines.push('');
lines.push(`## By Original Source`);
lines.push('');
lines.push(`| Original Source | Count |`);
lines.push(`|----------------|-------|`);
lines.push(`| constantFromDocx | ${byOriginalSource.constantFromDocx} |`);
lines.push(`| derived | ${byOriginalSource.derived} |`);
lines.push(`| unknown | ${byOriginalSource.unknown} |`);
lines.push(`| bindingReview (BM-021) | ${byOriginalSource.bindingReview} |`);
lines.push('');
lines.push(`## By Proposed Source`);
lines.push('');
lines.push(`| Proposed Source | Count |`);
lines.push(`|----------------|-------|`);
for (const [src, count] of Object.entries(summaryByProposedSource)) {
  lines.push(`| ${src} | ${count} |`);
}
lines.push('');
lines.push(`## Confidence`);
lines.push('');
lines.push(`| Level | Count |`);
lines.push(`|-------|-------|`);
lines.push(`| HIGH | ${highConf.length} |`);
lines.push(`| MEDIUM | ${medConf.length} |`);
lines.push(`| LOW | ${lowConf.length} |`);
lines.push('');
if (reviewRequired.length > 0) {
  lines.push(`## Human Review Required`);
  lines.push('');
  lines.push(`| templateCode | path | originalSource | proposedSource | confidence |`);
  lines.push(`|--------------|------|---------------|----------------|------------|`);
  for (const i of reviewRequired) {
    lines.push(`| ${i.templateCode} | ${i.path} | ${i.originalSource} | ${i.proposedSource} | ${i.confidence} |`);
  }
  lines.push('');
}
lines.push(`## BM-021 Proposals`);
lines.push('');
if (bm021Proposals.length > 0) {
  lines.push(`| path | originalSource | proposedSource | confidence | reason |`);
  lines.push(`|------|---------------|----------------|------------|--------|`);
  for (const p of bm021Proposals) {
    lines.push(`| ${p.path} | ${p.originalSource} | ${p.proposedSource} | ${p.confidence} | ${p.reason.replace(/\*/g, '')} |`);
  }
  lines.push('');
}
if (bm021Review) {
  lines.push(`### F4 Binding Review`);
  lines.push('');
  lines.push(`Status: **${bm021Review.status}**`);
  lines.push('');
  for (const note of bm021Review.notes) {
    lines.push(`- ${note}`);
  }
  lines.push('');
  lines.push(`**Remediation note:** \`agency.nameUpper\` (proposedSource=computed) maps to the uppercase of the agency name. This is a `);
  lines.push(`\`derived\` field that should be classified as \`computed\` in the locked contract JSON. The F4 review item will clear automatically once the source is corrected to \`computed\`.`);
  lines.push('');
}
lines.push(`## All Proposals`);
lines.push('');
lines.push(`| templateCode | path | originalSource | proposedSource | confidence | required |`);
lines.push(`|--------------|------|---------------|----------------|------------|----------|`);
for (const p of issues) {
  lines.push(`| ${p.templateCode} | ${p.path} | ${p.originalSource} | ${p.proposedSource} | ${p.confidence} | ${p.required ? 'yes' : 'no'} |`);
}
lines.push('');
lines.push(`## Heuristic Rules Applied`);
lines.push('');
lines.push(`| Pattern | Proposed Source | Confidence |`);
lines.push(`|---------|----------------|------------|`);
lines.push(`| constantFromDocx + legalBasis.*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + agency.*Upper | computed | HIGH |`);
lines.push(`| constantFromDocx + agency.issuePlace | computed | HIGH |`);
lines.push(`| constantFromDocx + decision.summaryLine | computed | HIGH |`);
lines.push(`| constantFromDocx + caseDecision.*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + accusedDecision.*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + indictment.*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + juvenileProtection.*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + measure.detentionArticle*Line | officialConfig | HIGH |`);
lines.push(`| constantFromDocx + other *Line patterns | officialConfig | MEDIUM |`);
lines.push(`| derived + nameUpper | computed | HIGH |`);
lines.push(`| derived + date patterns | computed | HIGH |`);
lines.push(`| derived + *Line patterns | computed | HIGH |`);
lines.push(`| unknown + document.*Code* | manual | HIGH |`);
lines.push(`| unknown + decision.decisionLine | computed | HIGH |`);
lines.push(`| unknown + issuePlaceAndDateLine | computed | HIGH |`);
lines.push(`| unknown + other patterns | manual | LOW |`);
lines.push('');
lines.push(`## Next Steps`);
lines.push('');
lines.push(`1. **User review** this proposal — especially LOW confidence items.`);
lines.push(`2. If approved, run **C3-APPLY** to patch locked contract JSON files.`);
lines.push(`3. After C3-APPLY, re-run \`pnpm audit:docx-fidelity\` to confirm no regressions.`);
lines.push(`4. Verify F4 binding correctness: BM-021 should no longer appear as REVIEW_REQUIRED.`);

const mdPath = join(OUT_DIR, 'source-remediation-proposal.md');
writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
log(`Written: ${mdPath}`);
log('');
log(`Done. ${issues.length} proposals generated.`);
log(`Review LOW-confidence items before applying.`);
