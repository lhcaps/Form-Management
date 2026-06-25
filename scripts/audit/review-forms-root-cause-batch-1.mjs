#!/usr/bin/env node
/**
 * review-forms-root-cause-batch-1.mjs
 *
 * Prepares human-review batch plan for FORMS_ROOT_CAUSE_REVIEW_BATCH_1.
 * Reads skipped/conflicting auto-fix candidates and REVIEW_FIX_CANDIDATE items,
 * groups by field, assigns review classification, and produces a decision sheet.
 *
 * Does NOT apply fixes. Does NOT modify files.
 *
 * Exit codes:
 *   0 — script completed, outputs written
 *   1 — validation failure (see strict exit behavior below)
 *
 * Usage:
 *   node scripts/audit/review-forms-root-cause-batch-1.mjs
 *   pnpm review:forms-root-cause-batch-1
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const REVIEW_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const POSTCHECK_JSON     = join(ROOT, 'docs', 'audit', 'forms-root-cause-apply', 'postcheck.json');
const SKIPPED_JSON      = join(ROOT, 'docs', 'audit', 'forms-root-cause-apply', 'skipped-items.json');
const FIXPLAN_JSON      = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const CANDIDATES_JSON   = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'auto-fix-candidates.json');
const AUDIT_JSON        = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const REVIEW_CAND_JSON  = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'review-fix-candidates.json');
const MANUAL_JSON       = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'manual-review-required.json');
const NOISE_JSON        = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'noise-or-derived.json');
const SLOT_INV_JSON     = join(ROOT, 'docs', 'audit', 'docx-slot-inventory', 'latest.json');
const BINDING_JSON      = join(ROOT, 'docs', 'audit', 'docx-binding-correctness', 'latest.json');
const RENDERED_JSON     = join(ROOT, 'docs', 'audit', 'rendered-text-fidelity', 'latest.json');

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function loadContracts() {
  const map = new Map();
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    try {
      map.set(code, JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8')));
    } catch { /* skip */ }
  }
  return map;
}

function loadCompiled() {
  const map = new Map();
  const dir = join(ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.compiled.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    try {
      map.set(code, JSON.parse(readFileSync(join(dir, f), 'utf8')));
    } catch { /* skip */ }
  }
  return map;
}

let _reviewGroupCounter = 0;
function nextGroupId() {
  return `RG-${String(++_reviewGroupCounter).padStart(3, '0')}`;
}

// =============================================================================
// REVIEW CLASSIFICATION
// =============================================================================

const REVIEW_TYPES = {
  REVIEW_CHOOSE_LABEL:   'REVIEW_CHOOSE_LABEL',
  REVIEW_CHOOSE_PATH:    'REVIEW_CHOOSE_PATH',
  REVIEW_CHOOSE_SOURCE:  'REVIEW_CHOOSE_SOURCE',
  REVIEW_DEFER_LEGAL:     'REVIEW_DEFER_LEGAL',
  REVIEW_DEFER_DOCX:     'REVIEW_DEFER_DOCX',
  REVIEW_REJECT_NOISE:    'REVIEW_REJECT_NOISE',
};

// Known path collisions from skipped-items (must be REJECT/MANUAL_REVIEW)
const PATH_COLLISION_MAP = {
  'BM-021::document.issuePlaceAndDateLine': { target: 'legalBasis.procedureArticlesLine' },
  'BM-026::agency.nameUpper':               { target: 'document.issueDate' },
  'BM-036::document.issuePlaceAndDateLine': { target: 'person.fullName' },
  'BM-036::person.fullName':                { target: 'document.issueDate' },
  'BM-036::decision.summaryLine':            { target: 'agency.parentNameUpper' },
  'BM-041::agency.issuePlace':              { target: 'document.documentCode' },
};

// Known conflict paths — BM-068 group needs extra scrutiny
const WAVE02_REMEDIATION_LABELS = new Set([
  'Slot from Wave 02 DOCX remediation',
]);

// =============================================================================
// BUILD REVIEW GROUPS FROM SKIPPED ITEMS
// =============================================================================

function buildReviewGroupsFromSkipped(skippedItems, candidates, contracts, compiled, slotInventory, bindingData) {
  const groups = [];

  // Group skipped items by templateCode::path
  const byKey = new Map();
  for (const s of skippedItems) {
    const key = `${s.templateCode}::${s.path}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(s);
  }

  for (const [key, skipItems] of byKey) {
    const [templateCode, ...pathParts] = key.split('::');
    const path = pathParts.join('::');
    const contract = contracts.get(templateCode);
    const compiledDoc = compiled.get(templateCode);

    // Get all proposed options from candidates
    const candidateOpts = (candidates || []).filter(
      (c) => c.templateCode === templateCode && c.path === path
    );

    // Get current field state
    const currentField = contract?.canonicalFields?.find((f) => f.path === path);
    // slotInventory: { generatedAt, status, summary, perBm: [{ templateCode, slots: [...] }] }
    const bmSlots = (slotInventory?.perBm ?? []).find(
      (s) => s.templateCode === templateCode
    );
    const slotInfo = (bmSlots?.slots ?? []).find(
      (s) => s.path === path || s.canonicalPath === path
    );
    // bindingData: { generatedAt, corpusSmokeResults: [{ templateCode, status, ... }] }
    // No per-path binding info in this version — bindingInfo is aggregate only
    const bindingInfo = null;
    // renderedJson: { generatedAt, results: [{ templateCode, status, ... }] }
    // No per-path rendering info — renderedInfo is aggregate only
    const renderedInfo = null;

    // Collect unique proposed labels (deduplicate identical proposals)
    const proposedOptions = [];
    const seenProps = new Map();
    for (const c of candidateOpts) {
      const prop = c.proposed ?? {};
      const propKey = JSON.stringify(prop);
      if (!seenProps.has(propKey)) {
        seenProps.set(propKey, true);
        proposedOptions.push({
          proposedLabel:   prop.label   ?? null,
          proposedPath:    prop.path    ?? null,
          proposedSource:  prop.source  ?? null,
          proposedRequired: prop.required ?? null,
          action:          prop.action  ?? c.action,
          issueCodes:      c.issueCodes ?? [c.issueCode],
          confidence:      c.confidence ?? null,
          reason:          c.reason     ?? null,
        });
      }
    }

    // Determine review type
    // Note: postcheck items have `classification` field (SKIPPED_CONFLICTING, SKIPPED_PATH_COLLISION)
    // not `skipReasonCode`. Map it here.
    const skipReasonCode = skipItems[0]?.reasonCode ?? skipItems[0]?.classification ?? null;
    const isPathCollision = skipReasonCode === 'SKIPPED_PATH_COLLISION' ||
      skipItems.some((s) => s.reasonCode === 'SKIPPED_PATH_COLLISION');
    const isConflicting   = skipReasonCode === 'SKIPPED_CONFLICTING_MUTATIONS' ||
      skipReasonCode === 'SKIPPED_CONFLICTING' ||
      skipItems.some((s) => s.reasonCode === 'SKIPPED_CONFLICTING_MUTATIONS' || s.classification === 'SKIPPED_CONFLICTING');
    const hasCurrentBadLabel = currentField &&
      WAVE02_REMEDIATION_LABELS.has(currentField.label);

    let reviewType;
    let recommendedDecision;

    if (isPathCollision) {
      reviewType = REVIEW_TYPES.REVIEW_CHOOSE_PATH;
      // Path collisions: default to REJECT, not APPROVE
      const collisionInfo = PATH_COLLISION_MAP[key];
      recommendedDecision = {
        decision: 'REJECT',
        action:   'NO_OP',
        rationale: `Path collision detected: proposed path "${collisionInfo?.target}" already exists. Auto-suggestion is ambiguous or wrong. Requires manual path design decision.`,
        confidence: 'LOW',
        label:    null,
        path:     null,
        source:   null,
      };
    } else if (isConflicting) {
      // Multiple conflicting proposals — label might be same but issue source differs
      const allLabels = proposedOptions.map((o) => o.proposedLabel).filter(Boolean);
      const uniqueLabels = [...new Set(allLabels)];

      if (uniqueLabels.length === 1) {
        // All proposals agree on the label — check if it's already applied
        const proposedLabel = uniqueLabels[0];
        if (currentField && currentField.label === proposedLabel) {
          reviewType = REVIEW_TYPES.REVIEW_REJECT_NOISE;
          recommendedDecision = {
            decision:   'REJECT',
            action:     'NO_OP',
            rationale:  `Label "${proposedLabel}" is already applied. Conflicting issue codes but identical label — no action needed.`,
            confidence: 'HIGH',
            label:      proposedLabel,
            path:       null,
            source:     null,
          };
        } else if (hasCurrentBadLabel && templateCode.startsWith('BM-06')) {
          // BM-068, BM-069, etc. — Wave 02 remediation labels
          // If path is semantically correct, approve the label fix
          const isSemanticallyCorrectPath =
            path === 'document.fullDocumentCode' ||
            path === 'document.issueDate';

          if (isSemanticallyCorrectPath) {
            reviewType = REVIEW_TYPES.REVIEW_CHOOSE_LABEL;
            recommendedDecision = {
              decision:   'APPROVE',
              action:     'UPDATE_LABEL',
              rationale:  `Wave 02 remediation label confirmed bad. Path "${path}" is semantically correct. Label "${proposedLabel}" matches known label map. Multiple issue sources (BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA) all agree. Safe to approve.`,
              confidence: 'HIGH',
              label:      proposedLabel,
              path:       null,
              source:     null,
            };
          } else {
            reviewType = REVIEW_TYPES.REVIEW_DEFER_DOCX;
            recommendedDecision = {
              decision:   'DEFER_DOCX',
              action:     'MANUAL_REVIEW',
              rationale:  `Wave 02 remediation label "${currentField?.label}" detected on "${path}". Path semantics unclear — may be a slot created incorrectly by DOCX authoring. Defer to DOCX lane for root cause.`,
              confidence: 'MEDIUM',
              label:      null,
              path:       null,
              source:     null,
            };
          }
        } else {
          // Other BM — multiple issue codes but same label
          reviewType = REVIEW_TYPES.REVIEW_CHOOSE_LABEL;
          recommendedDecision = {
            decision:   'APPROVE',
            action:     'UPDATE_LABEL',
            rationale:  `Multiple issue codes conflict but all propose the same label "${proposedLabel}". Safe to apply.`,
            confidence: 'MEDIUM',
            label:      proposedLabel,
            path:       null,
            source:     null,
          };
        }
      } else {
        // Truly different labels proposed
        reviewType = REVIEW_TYPES.REVIEW_CHOOSE_LABEL;
        recommendedDecision = {
          decision:   'DEFER_LEGAL',
          action:     'MANUAL_REVIEW',
          rationale:  `Multiple conflicting labels proposed for "${path}". Requires human to select correct label based on legal/form semantics.`,
          confidence: 'LOW',
          label:      null,
          path:       null,
          source:     null,
        };
      }
    } else {
      reviewType = REVIEW_TYPES.REVIEW_CHOOSE_LABEL;
      recommendedDecision = {
        decision:   'DEFER_LEGAL',
        action:     'MANUAL_REVIEW',
        rationale:  `Unknown skip reason. Requires human review.`,
        confidence: 'LOW',
        label:      null,
        path:       null,
        source:     null,
      };
    }

    // Check applySafeAfterApproval
    // Exclude legalBasis.* paths, Wave 02 remediation labels, Wave 02 BMs
    const isLegalBasis = path.startsWith('legalBasis.');
    const isWave02Label = currentField && WAVE02_REMEDIATION_LABELS.has(currentField.label);
    const isWave02Bm = templateCode.startsWith('BM-06');
    const canBeApplySafe = !isLegalBasis && !isWave02Label && !isWave02Bm;
    const applySafe = canBeApplySafe &&
      ['APPROVE'].includes(recommendedDecision.decision) &&
      recommendedDecision.confidence !== 'LOW';

    groups.push({
      reviewGroupId:       nextGroupId(),
      templateCode,
      path,
      rawPattern:          slotInfo?.rawPattern ?? currentField?.rawPattern ?? null,
      current: {
        path:         currentField?.path     ?? path,
        label:        currentField?.label    ?? null,
        source:       currentField?.source   ?? null,
        required:     currentField?.required ?? null,
        reviewRequired: currentField?.reviewRequired ?? null,
        uiComponent:  currentField?.uiComponent ?? null,
      },
      issueCodes:           [...new Set(candidateOpts.flatMap((c) => c.issueCodes ?? [c.issueCode]))],
      conflictReason:       skipItems[0]?.reason ?? null,
      skipReasonCode: skipReasonCode,
      classification: skipReasonCode,
      candidateOptions:     proposedOptions,
      context: {
        textBefore:     slotInfo?.textBefore   ?? bindingInfo?.textBefore   ?? null,
        textAfter:      slotInfo?.textAfter    ?? bindingInfo?.textAfter    ?? null,
        context:        slotInfo?.context      ?? bindingInfo?.context      ?? null,
        docxSlot:      slotInfo?.slotName    ?? bindingInfo?.slotName    ?? null,
        renderBinding:  bindingInfo?.renderBinding ?? compiledDoc?.renderBindings?.find(
          (rb) => rb.canonicalPath === path
        ) ?? null,
      },
      reviewerDecisionRequired: true,
      recommendedDecision,
      applySafeAfterApproval: applySafe,
    });
  }

  return groups;
}

// =============================================================================
// HIGH-CONFIDENCE REVIEW_FIX_CANDIDATE ITEMS
// =============================================================================

function buildReviewGroupsFromReviewCandidates(reviewCandidates, contracts, compiled, manualReview, noiseOrDerived) {
  const groups = [];

  // Filter to HIGH-confidence, UI-visible, non-legal items only
  const eligible = (reviewCandidates || []).filter((c) => {
    // Must have HIGH confidence
    if (c.confidence !== 'HIGH') return false;

    // Only include specific issue codes that are metadata-only
    const okCodes = new Set([
      'UI_VISIBLE_BAD_METADATA',
      'BAD_LABEL',
      'SOURCE_MISMATCH',
    ]);
    const codes = c.issueCodes ?? [c.issueCode].filter(Boolean);
    if (!codes.some((code) => okCodes.has(code))) return false;

    // Exclude legalBasis.* unless source-only
    if (c.path.startsWith('legalBasis.')) {
      const prop = c.proposed ?? {};
      const action = prop.action ?? c.proposed?.action;
      if (action !== 'UPDATE_SOURCE') return false;
    }

    // Exclude required/editable changes
    if (c.proposed?.required !== undefined || c.proposed?.editable !== undefined) {
      return false;
    }

    // CRITICAL: Exclude items already in exclusion lists (manual/noise)
    // Build exclusion set from both manual-review-required and noise-or-derived
    const exclusionSet = new Set([
      ...(manualReview || [])
        .map((m) => `${m.templateCode}::${m.path}`),
      ...(noiseOrDerived || [])
        .map((n) => `${n.templateCode}::${n.path}`),
    ]);
    const cKey = `${c.templateCode}::${c.path}`;
    if (exclusionSet.has(cKey)) return false;

    return true;
  });

  for (const c of eligible) {
    const contract = contracts.get(c.templateCode);
    const compiledDoc = compiled.get(c.templateCode);
    const currentField = contract?.canonicalFields?.find((f) => f.path === c.path);

    const prop = c.proposed ?? {};
    let reviewType = REVIEW_TYPES.REVIEW_CHOOSE_LABEL;
    if (prop.action === 'UPDATE_SOURCE') reviewType = REVIEW_TYPES.REVIEW_CHOOSE_SOURCE;

    // Check for Wave 02 remediation labels
    const isWave02Label = currentField &&
      WAVE02_REMEDIATION_LABELS.has(currentField.label);

    let recommendedDecision = {
      decision:   'APPROVE',
      action:     prop.action ?? 'UPDATE_LABEL',
      rationale:  c.reason ?? 'High-confidence metadata fix.',
      confidence: c.confidence ?? 'HIGH',
      label:      prop.label   ?? null,
      path:       prop.path    ?? null,
      source:     prop.source  ?? null,
    };

    if (isWave02Label) {
      recommendedDecision = {
        decision:   'DEFER_DOCX',
        action:     'MANUAL_REVIEW',
        rationale:  `Wave 02 remediation label detected. Root cause may be DOCX authoring error. Defer to DOCX lane.`,
        confidence: 'MEDIUM',
        label:      null,
        path:       null,
        source:     null,
      };
    }

    const isLegalBasis2 = c.path.startsWith('legalBasis.');
    const isWave02Label2 = currentField && WAVE02_REMEDIATION_LABELS.has(currentField.label);
    const isWave02Bm2 = c.templateCode.startsWith('BM-06');
    const canBeApplySafe2 = !isLegalBasis2 && !isWave02Label2 && !isWave02Bm2;
    const applySafe = canBeApplySafe2 &&
      ['APPROVE'].includes(recommendedDecision.decision) &&
      recommendedDecision.confidence !== 'LOW';

    groups.push({
      reviewGroupId:  nextGroupId(),
      templateCode:   c.templateCode,
      path:           c.path,
      rawPattern:     currentField?.rawPattern ?? null,
      current: {
        path:          currentField?.path           ?? c.path,
        label:         currentField?.label          ?? c.current?.label ?? null,
        source:        currentField?.source         ?? c.current?.source ?? null,
        required:      currentField?.required       ?? c.current?.required ?? null,
        reviewRequired: currentField?.reviewRequired ?? c.current?.reviewRequired ?? null,
        uiComponent:   currentField?.uiComponent   ?? c.current?.uiComponent ?? null,
      },
      issueCodes:    c.issueCodes ?? [c.issueCode].filter(Boolean),
      conflictReason: null,
      skipReasonCode: null,
      classification: null,
      candidateOptions: [{
        proposedLabel:   prop.label   ?? null,
        proposedPath:    prop.path    ?? null,
        proposedSource:  prop.source  ?? null,
        action:         prop.action  ?? c.proposed?.action,
        issueCodes:      c.issueCodes ?? [c.issueCode],
        confidence:      c.confidence ?? 'HIGH',
        reason:          c.reason ?? null,
      }],
      context: {
        textBefore:    null,
        textAfter:     null,
        context:       c.reason ?? null,
        docxSlot:      null,
        renderBinding: compiledDoc?.renderBindings?.find(
          (rb) => rb.canonicalPath === c.path
        ) ?? null,
      },
      reviewerDecisionRequired: true,
      recommendedDecision,
      applySafeAfterApproval: applySafe,
    });
  }

  return groups;
}

// =============================================================================
// BM-068 SPECIAL HANDLING
// Check Wave 02 remediation status for BM-068 documents
// =============================================================================

function checkBM068Wave02Status(contract, compiledDoc) {
  const fields = contract?.canonicalFields ?? [];
  const wave02Fields = fields.filter((f) =>
    WAVE02_REMEDIATION_LABELS.has(f.label)
  );
  return {
    hasWave02Labels:  wave02Fields.length > 0,
    wave02FieldCount: wave02Fields.length,
    wave02Paths:      wave02Fields.map((f) => f.path),
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validate(groups, reviewCandidates, manualReview, noiseOrDerived) {
  const errors = [];
  const warnings = [];

  const excludedPaths = new Set([
    ...(manualReview || []).map((m) => `${m.templateCode}::${m.path}`),
    ...(noiseOrDerived || []).map((n) => `${n.templateCode}::${n.path}`),
  ]);

  for (const g of groups) {
    const key = `${g.templateCode}::${g.path}`;

    // Validation 1: must have recommendedDecision
    if (!g.recommendedDecision) {
      errors.push(`Group ${g.reviewGroupId} (${key}): no recommendedDecision`);
    }

    // Validation 2: applySafe cannot have LOW confidence
    if (g.applySafeAfterApproval && g.recommendedDecision?.confidence === 'LOW') {
      errors.push(`Group ${g.reviewGroupId} (${key}): applySafe=true but confidence=LOW`);
    }

    // Validation 3: cannot include MANUAL_LEGAL_REVIEW items
    if (excludedPaths.has(key)) {
      if (g.applySafeAfterApproval) {
        errors.push(`Group ${g.reviewGroupId} (${key}): accidentally included as apply-safe but is in manual/noise exclusion list`);
      }
    }

    // Validation 4: BM-068 must have exactly 8 skipped-conflict entries
    // (counted separately below)
  }

  // Count BM-068 skipped entries — check both skipReasonCode and classification
  // Groups: 2 (document.fullDocumentCode, document.issueDate)
  // Items: 8 (multiple candidates per path)
  // Validate: ensure both paths are covered (>= 2 groups)
  const bm068Groups = groups.filter((g) =>
    g.templateCode === 'BM-068' &&
    (g.skipReasonCode === 'SKIPPED_CONFLICTING' ||
     g.skipReasonCode === 'SKIPPED_CONFLICTING_MUTATIONS' ||
     g.classification === 'SKIPPED_CONFLICTING')
  );
  if (bm068Groups.length < 2) {
    errors.push(`BM-068 skipped-conflict groups: expected >= 2 (fullDocumentCode + issueDate), got ${bm068Groups.length}`);
  }

  // Ensure no REVIEW_DEFER_LEGAL or REVIEW_DEFER_DOCX are marked applySafe
  const illegalApply = groups.filter(
    (g) =>
      g.applySafeAfterApproval &&
      ['DEFER_LEGAL', 'DEFER_DOCX'].includes(g.recommendedDecision?.decision)
  );
  if (illegalApply.length > 0) {
    errors.push(`${illegalApply.length} groups marked applySafe but decision is DEFER_LEGAL or DEFER_DOCX`);
  }

  return { errors, warnings };
}

// =============================================================================
// OUTPUT GENERATION
// =============================================================================

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  process.stderr.write(`[REVIEW] Written: ${path}\n`);
}

function writeMarkdown(path, data) {
  const lines = [
    '# Forms Root Cause — Review Batch 1',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total review groups | ${data.groups.length} |`,
    `| REVIEW_CHOOSE_LABEL | ${data.stats.byReviewType?.REVIEW_CHOOSE_LABEL ?? 0} |`,
    `| REVIEW_CHOOSE_PATH | ${data.stats.byReviewType?.REVIEW_CHOOSE_PATH ?? 0} |`,
    `| REVIEW_CHOOSE_SOURCE | ${data.stats.byReviewType?.REVIEW_CHOOSE_SOURCE ?? 0} |`,
    `| REVIEW_DEFER_LEGAL | ${data.stats.byReviewType?.REVIEW_DEFER_LEGAL ?? 0} |`,
    `| REVIEW_DEFER_DOCX | ${data.stats.byReviewType?.REVIEW_DEFER_DOCX ?? 0} |`,
    `| REVIEW_REJECT_NOISE | ${data.stats.byReviewType?.REVIEW_REJECT_NOISE ?? 0} |`,
    `| Apply-safe after approval | ${data.stats.applySafeCount ?? 0} |`,
    '',
    '## Decision Sheet',
    '',
    '| reviewGroupId | BM | field path | current label | current source | issue codes | candidate labels | recommended decision |',
    '|---|---|---|---|---|---|---|---|',
  ];

  for (const g of data.groups) {
    const rec = g.recommendedDecision ?? {};
    const candLabels = [
      ...new Set(
        (g.candidateOptions || [])
          .map((o) => o.proposedLabel || o.proposedPath || o.proposedSource || o.action)
          .filter(Boolean)
      ),
    ].join(', ');

    lines.push(
      `| ${g.reviewGroupId} | ${g.templateCode} | \`${g.path}\` | ${g.current?.label ?? '-'} | ${g.current?.source ?? '-'} | ${(g.issueCodes || []).join(', ')} | ${candLabels} | ${rec.decision ?? '-'} (${rec.confidence ?? '-'}) |`
    );
  }

  lines.push('');
  lines.push('## BM-068 Special Review');
  lines.push('');

  const bm068Groups = data.groups.filter(
    (g) => g.templateCode === 'BM-068'
  );
  for (const g of bm068Groups) {
    lines.push(`### ${g.reviewGroupId}: ${g.templateCode}::${g.path}`);
    lines.push('');
    lines.push(`- **Current label**: \`${g.current?.label ?? '-'}\``);
    lines.push(`- **Current source**: \`${g.current?.source ?? '-'}\``);
    lines.push(`- **Raw pattern**: \`${g.rawPattern ?? '-'}\``);
    lines.push(`- **Issue codes**: ${(g.issueCodes || []).join(', ')}`);
    lines.push(`- **Skip reason**: ${g.conflictReason ?? '-'}`);
    lines.push(`- **Recommended decision**: **${g.recommendedDecision?.decision ?? '-'}** (${g.recommendedDecision?.confidence ?? '-'})`);
    lines.push(`- **Rationale**: ${g.recommendedDecision?.rationale ?? '-'}`);
    lines.push(`- **Apply-safe**: ${g.applySafeAfterApproval}`);
    lines.push('');
    lines.push('Candidate options:');
    for (const opt of g.candidateOptions || []) {
      lines.push(
        `  - ${opt.action}: label="${opt.proposedLabel ?? '-'}" path="${opt.proposedPath ?? '-'}" source="${opt.proposedSource ?? '-'}" [${opt.confidence ?? '-'}] — ${opt.reason?.slice(0, 80) ?? '-'}`
      );
    }
    lines.push('');
  }

  lines.push('## Path Collision Summary');
  lines.push('');

  const collisionGroups = data.groups.filter(
    (g) => g.skipReasonCode === 'SKIPPED_PATH_COLLISION' || g.classification === 'SKIPPED_PATH_COLLISION'
  );
  for (const g of collisionGroups) {
    lines.push(`- **${g.templateCode}::${g.path}** → default: **${g.recommendedDecision?.decision ?? '?'}** (${g.recommendedDecision?.confidence ?? '-'})`);
    lines.push(`  Rationale: ${g.recommendedDecision?.rationale ?? '-'}`);
    lines.push(`  Proposed options: ${g.candidateOptions?.map((o) => o.proposedPath ?? o.proposedLabel).join(', ') ?? '-'}`);
    lines.push('');
  }

  lines.push('## Validation Result');
  lines.push('');
  lines.push(`Errors: ${data.validation.errors.length}`);
  lines.push(`Warnings: ${data.validation.warnings.length}`);
  if (data.validation.errors.length > 0) {
    lines.push('');
    lines.push('**FAIL**');
    lines.push('');
    for (const e of data.validation.errors) {
      lines.push(`- ${e}`);
    }
  } else {
    lines.push('');
    lines.push('**PASS**');
  }

  writeFileSync(path, lines.join('\n'), 'utf8');
  process.stderr.write(`[REVIEW] Written: ${path}\n`);
}

function buildApplyPreview(groups) {
  return groups
    .filter((g) => g.applySafeAfterApproval && g.recommendedDecision?.decision === 'APPROVE')
    .map((g) => {
      const rec = g.recommendedDecision;
      const firstOpt = (g.candidateOptions || [])[0];
      return {
        reviewGroupId:   g.reviewGroupId,
        templateCode:    g.templateCode,
        path:            g.path,
        action:          rec.action ?? firstOpt?.action ?? 'UPDATE_LABEL',
        label:           rec.label ?? firstOpt?.proposedLabel ?? null,
        pathTo:          rec.path  ?? firstOpt?.proposedPath  ?? null,
        source:          rec.source ?? firstOpt?.proposedSource ?? null,
        confidence:      rec.confidence ?? 'HIGH',
        rationale:       rec.rationale ?? null,
        issueCodes:     g.issueCodes ?? [],
      };
    });
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write('[REVIEW] Starting review batch 1 preparation\n');
  mkdirSync(REVIEW_DIR, { recursive: true });

  // Load inputs
  const postcheck    = loadJson(POSTCHECK_JSON);
  const skippedItems = loadJson(SKIPPED_JSON) ?? [];
  const fixplanData  = loadJson(FIXPLAN_JSON);
  const candidates   = loadJson(CANDIDATES_JSON) ?? [];
  const auditData    = loadJson(AUDIT_JSON);
  const reviewCandidates = loadJson(REVIEW_CAND_JSON) ?? [];
  const manualReview = loadJson(MANUAL_JSON) ?? [];
  const noiseOrDerived = loadJson(NOISE_JSON) ?? [];
  const slotInventory  = loadJson(SLOT_INV_JSON);
  const bindingData     = loadJson(BINDING_JSON);
  const contracts   = loadContracts();
  const compiled     = loadCompiled();

  process.stderr.write(`[REVIEW] Skipped items: ${skippedItems.length}\n`);
  process.stderr.write(`[REVIEW] Contracts loaded: ${contracts.size}\n`);
  process.stderr.write(`[REVIEW] REVIEW_FIX_CANDIDATE items: ${reviewCandidates.length}\n`);

  // Reset counter
  _reviewGroupCounter = 0;

  // Build review groups from skipped items (the 72 remaining auto-fix candidates)
  const skippedGroups = buildReviewGroupsFromSkipped(
    skippedItems, candidates, contracts, compiled, slotInventory, bindingData
  );
  process.stderr.write(`[REVIEW] Skipped groups: ${skippedGroups.length}\n`);

  // Build HIGH-confidence review-candidate groups (filtered subset)
  const reviewGroups = buildReviewGroupsFromReviewCandidates(
    reviewCandidates, contracts, compiled, manualReview, noiseOrDerived
  );
  process.stderr.write(`[REVIEW] HIGH-confidence review-candidate groups: ${reviewGroups.length}\n`);

  // Combine all groups
  const allGroups = [...skippedGroups, ...reviewGroups];

  // Deduplicate by templateCode::path (prefer skipped group if both exist)
  const deduped = [];
  const seen = new Set();
  for (const g of [...skippedGroups, ...reviewGroups]) {
    const key = `${g.templateCode}::${g.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(g);
    }
  }
  process.stderr.write(`[REVIEW] Total unique groups: ${deduped.length}\n`);

  // Validation
  const validation = validate(deduped, reviewCandidates, manualReview, noiseOrDerived);
  process.stderr.write(`[REVIEW] Validation errors: ${validation.errors.length}\n`);
  process.stderr.write(`[REVIEW] Validation warnings: ${validation.warnings.length}\n`);

  if (validation.errors.length > 0) {
    validation.errors.forEach((e) => process.stderr.write(`  ERROR: ${e}\n`));
  }

  // Cross-reference with actual classification
  const byReviewType = {
    REVIEW_CHOOSE_LABEL:  deduped.filter((g) =>
      (g.skipReasonCode === 'SKIPPED_CONFLICTING' || g.skipReasonCode === 'SKIPPED_CONFLICTING_MUTATIONS' || g.classification === 'SKIPPED_CONFLICTING') &&
      g.recommendedDecision?.decision !== 'REJECT'
    ),
    REVIEW_CHOOSE_PATH:   deduped.filter(
      (g) => g.skipReasonCode === 'SKIPPED_PATH_COLLISION' || g.classification === 'SKIPPED_PATH_COLLISION'
    ),
    REVIEW_CHOOSE_SOURCE: deduped.filter((g) => g.candidateOptions?.some((o) => o.action === 'UPDATE_SOURCE')),
    REVIEW_DEFER_LEGAL:    deduped.filter((g) => g.recommendedDecision?.decision === 'DEFER_LEGAL'),
    REVIEW_DEFER_DOCX:     deduped.filter((g) => g.recommendedDecision?.decision === 'DEFER_DOCX'),
    REVIEW_REJECT_NOISE:   deduped.filter((g) => g.recommendedDecision?.decision === 'REJECT'),
  };

  // Compute stats
  const stats = {
    byType: {},
    byReviewType: {
      REVIEW_CHOOSE_LABEL:  byReviewType.REVIEW_CHOOSE_LABEL.length,
      REVIEW_CHOOSE_PATH:   byReviewType.REVIEW_CHOOSE_PATH.length,
      REVIEW_CHOOSE_SOURCE: byReviewType.REVIEW_CHOOSE_SOURCE.length,
      REVIEW_DEFER_LEGAL:    byReviewType.REVIEW_DEFER_LEGAL.length,
      REVIEW_DEFER_DOCX:     byReviewType.REVIEW_DEFER_DOCX.length,
      REVIEW_REJECT_NOISE:   byReviewType.REVIEW_REJECT_NOISE.length,
    },
    applySafeCount: 0,
    totalGroups: deduped.length,
  };
  for (const g of deduped) {
    const t = g.recommendedDecision?.decision ?? 'UNKNOWN';
    stats.byType[t] = (stats.byType[t] ?? 0) + 1;
    if (g.applySafeAfterApproval) stats.applySafeCount++;
  }

  const decisionSheet = deduped.map((g) => ({
    reviewGroupId:     g.reviewGroupId,
    templateCode:      g.templateCode,
    path:              g.path,
    current:           g.current,
    issueCodes:        g.issueCodes,
    candidateOptions:  g.candidateOptions,
    context:           g.context,
    reviewerDecisionRequired: true,
    recommendedDecision: g.recommendedDecision,
    applySafeAfterApproval:  g.applySafeAfterApproval,
    // Blank for reviewer to fill
    reviewerApprovedDecision: null,
    reviewerApprovedAction:   null,
    reviewerApprovedLabel:   null,
    reviewerApprovedPath:    null,
    reviewerApprovedSource:   null,
    reviewerRationale:       null,
    reviewerSignature:        null,
    reviewerTimestamp:       null,
  }));

  const applyPreview = buildApplyPreview(deduped);

  const outputJson = {
    generatedAt:       new Date().toISOString(),
    totalGroups:      deduped.length,
    stats: {
      totalGroups: stats.totalGroups,
      byType: stats.byType,
      byReviewType: stats.byReviewType,
      bm068Groups: deduped.filter((g) => g.templateCode === 'BM-068').length,
      pathCollisionGroups: byReviewType.REVIEW_CHOOSE_PATH.length,
      applySafeCount: stats.applySafeCount,
    },
    validation: {
      passed: validation.errors.length === 0,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    groups: deduped,
    bm068Special: {
      totalGroups:   deduped.filter((g) => g.templateCode === 'BM-068').length,
      skippedConflictGroups: deduped.filter(
        (g) =>
          g.templateCode === 'BM-068' &&
          (g.skipReasonCode === 'SKIPPED_CONFLICTING' ||
           g.skipReasonCode === 'SKIPPED_CONFLICTING_MUTATIONS' ||
           g.classification === 'SKIPPED_CONFLICTING')
      ).length,
      pathCollisionGroups: deduped.filter(
        (g) =>
          g.templateCode === 'BM-068' &&
          (g.skipReasonCode === 'SKIPPED_PATH_COLLISION' ||
           g.classification === 'SKIPPED_PATH_COLLISION')
      ).length,
      wave02RemediationFields: deduped
        .filter(
          (g) =>
            g.templateCode === 'BM-068' &&
            WAVE02_REMEDIATION_LABELS.has(g.current?.label ?? '')
        )
        .map((g) => ({ path: g.path, label: g.current?.label })),
    },
    pathCollisionSummary: byReviewType.REVIEW_CHOOSE_PATH.map((g) => ({
      groupId:       g.reviewGroupId,
      templateCode:  g.templateCode,
      currentPath:   g.path,
      proposedPath:  g.candidateOptions?.[0]?.proposedPath ?? null,
      recommendedDecision: g.recommendedDecision,
    })),
  };

  const outputMd = {
    generatedAt: new Date().toISOString(),
    groups: deduped,
    stats,
    validation,
    bm068Special: outputJson.bm068Special,
    pathCollisionSummary: outputJson.pathCollisionSummary,
  };

  // Write outputs
  writeJson(join(REVIEW_DIR, 'latest.json'), outputJson);
  writeJson(join(REVIEW_DIR, 'decision-sheet.json'), decisionSheet);
  writeJson(join(REVIEW_DIR, 'apply-preview.json'), applyPreview);
  writeMarkdown(join(REVIEW_DIR, 'latest.md'), outputMd);
  writeMarkdown(join(REVIEW_DIR, 'decision-sheet.md'), {
    ...outputMd,
    decisionSheet,
  });

  process.stderr.write(`[REVIEW] Total groups: ${deduped.length}\n`);
  process.stderr.write(`[REVIEW] Apply-safe: ${stats.applySafeCount}\n`);
  process.stderr.write(`[REVIEW] By type: ${JSON.stringify(stats.byType)}\n`);

  const pass = validation.errors.length === 0;
  process.stderr.write(`[REVIEW] VERDICT: ${pass ? 'PASS' : 'FAIL'}\n`);

  if (!pass) {
    process.stderr.write('[REVIEW] Validation errors. Review outputs before proceeding.\n');
    process.exit(1);
  }

  process.stderr.write('[REVIEW] Review batch 1 preparation complete.\n');
  process.exit(0);
}

main();
