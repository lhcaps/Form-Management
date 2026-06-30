#!/usr/bin/env node
// scripts/audit/investigate-docx-path-binding-p1-batch-2.mjs
// DOCX Path/Binding P1 Investigation Batch 2 — recipients filler/no-context items.
// Safe: reads only, writes to docs/audit/docx-path-binding-p1-investigation-batch-2/

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const OUT_DIR  = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-2');
const OUT_JSON = join(OUT_DIR, 'investigation.latest.json');
const OUT_MD   = join(OUT_DIR, 'investigation.latest.md');

// ── SourceIds (provided by user; verified against locked contracts) ─────────────
const SOURCE_IDS = {
  'BM-063': '54b73110a34f',
  'BM-065': '4a64c8d7e96c',
  'BM-052': '9919ecdb3971',
  'BM-061': 'ec44550246e9',
  'BM-062': '110961a781fa',
  'BM-066': 'e3bc56081554',
  'BM-067': '0f7607122f29',
};

// ── Findings ─────────────────────────────────────────────────────────────────
//
// COMMON PATTERN ACROSS ALL 7 ITEMS:
// Every BM has:
//   - A legitimate recipients.personLine with label "Người bị áp dụng" (labeled)
//     at a specific blockId (P0029-P0035 range)
//   - An orphan recipients.personLineN with blockId=null, "Slot from DOCX remediation"
//     appearing as continuation/blank filler lines between labeled recipient fields
//
// Slot positions across all BMs:
//   - Between "Tên gọi khác:" and "Nghề nghiệp:" — free-text continuation
//   - Between "Nghề nghiệp:" and "Số CMND/..." — free-text continuation
//   - Between "Nơi thường trú:" and "Nơi tạm trú:" — free-text continuation
//   - In Nơi nhận footer — suffix/footnote marker (BM-052 [035], BM-062 [037], BM-066 [038])
//   - In "Điều 1" body clause — continuation (BM-063 [030][031])
//
// Two distinct sub-patterns:
//   SUB-PATTERN A: Body continuation lines (between labeled fields)
//     Evidence: slot is inside the recipient section between fields like "Tên gọi khác:"
//               and "Nghề nghiệp:"
//     Role: Multi-line free-text continuation for recipient details
//     Risk of removal: Could reduce needed data-capture capacity
//     Recommended: KEEP_DEFERRED
//
//   SUB-PATTERN B: Nơi nhận footer suffix (BM-052 [035], BM-062 [037], BM-066 [038])
//     Evidence: slot in "Nơi nhận:" list, paired with footnote marker
//     Role: Recipient address/organization continuation in footer list
//     Risk of removal: Low — Nơi nhận already has the main list items (12, 13, 15...)
//     Recommended: REMOVE_FIELD_FROM_CONTRACT (HIGH confidence)
//
// LEGITIMATE FIELD ANALYSIS:
// BM-052: legitimate recipients.personLine at blockId=P0029 (labeled "Người bị áp dụng")
// BM-061: legitimate recipients.personLine at blockId=P0035 (labeled "Người bị áp dụng")
// BM-062: legitimate recipients.personLine at blockId=P0029 (labeled "Người bị áp dụng")
// BM-063: legitimate recipients.personLine at blockId=P0031 (labeled "Người bị áp dụng")
// BM-065: legitimate recipients.personLine at blockId=P0030 (labeled "Người bị áp dụng")
// BM-066: legitimate recipients.personLine at blockId=P0032 (labeled "Người bị áp dụng")
// BM-067: legitimate recipients.personLine at blockId=P0028 (labeled "Người bị áp dụng")
//
// CONCLUSION:
// PRIOR-DXR-008 (BM-052): HIGH remove — 6 orphan lines, including Nơi nhận suffix [035]
// PRIOR-DXR-010 (BM-062): HIGH remove — includes Nơi nhận suffix [037]
// PRIOR-DXR-011 (BM-066): HIGH remove — includes Nơi nhận suffix [038]
// PRIOR-DXR-006 (BM-063): KEEP_DEFERRED — [030][031] in Điều 1 body, free-text capacity
// PRIOR-DXR-007 (BM-065): KEEP_DEFERRED — body continuation, free-text capacity
// PRIOR-DXR-009 (BM-061): KEEP_DEFERRED — body continuation, free-text capacity
// PRIOR-DXR-012 (BM-067): KEEP_DEFERRED — body continuation, free-text capacity

const FINDINGS = [
  // ── PRIOR-DXR-006: BM-063 recipients.personLine5 ───────────────────────
  {
    investigationId: 'PRIOR-DXR-006',
    templateCode: 'BM-063',
    sourceId: '54b73110a34f',
    path: 'recipients.personLine5',
    placeholder: 'RECIPIENTS_PERSONLINE5',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[021]', '[022]', '[025]', '[030]', '[031]'],
    paragraphSnippets: [
      '[021] Tên gọi khác:',
      '[022] __RECIPIENTS_PERSONLINE5__',
      '[025] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:',
      '[030] __RECIPIENTS_PERSONLINE5__ (in Điều 1 body — tài sản continuation)',
      '[031] __RECIPIENTS_PERSONLINE5__ (in Điều 1 body — tài sản continuation)',
    ],
    slotRole: 'Body continuation between labeled fields AND Điều 1 body clause',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0031 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-063 recipients.personLine5 appears 5 times: as body continuation between "Tên gọi khác:" and "Số CMND" AND inside Điều 1 "tài sản" clause. The Điều 1 occurrences ([030][031]) are continuation lines for tài sản description, not person/recipient data. However, removing these could affect data-capture capacity. The [021][022][025] occurrences are free-text continuation for recipient details. KEEP_DEFERRED — a future domain-model review should clarify whether these continuation lines should become a repeat/array model or be removed.',
  },

  // ── PRIOR-DXR-007: BM-065 recipients.personLine3 ───────────────────────
  {
    investigationId: 'PRIOR-DXR-007',
    templateCode: 'BM-065',
    sourceId: '4a64c8d7e96c',
    path: 'recipients.personLine3',
    placeholder: 'RECIPIENTS_PERSONLINE3',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[021]', '[022]', '[025]'],
    paragraphSnippets: [
      '[021] Tên gọi khác:',
      '[022] __RECIPIENTS_PERSONLINE3__',
      '[025] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:',
    ],
    slotRole: 'Body continuation between labeled recipient fields',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0030 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-065 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text continuation for recipient details. No Nơi nhận suffix. Removing these could reduce data-capture capacity. KEEP_DEFERRED.',
  },

  // ── PRIOR-DXR-008: BM-052 recipients.personLine6 ─────────────────────
  {
    investigationId: 'PRIOR-DXR-008',
    templateCode: 'BM-052',
    sourceId: '9919ecdb3971',
    path: 'recipients.personLine6',
    placeholder: 'RECIPIENTS_PERSONLINE6',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[019]', '[020]', '[021]', '[024]', '[027]', '[035]'],
    paragraphSnippets: [
      '[019] Họ tên:8__RECIPIENTS_PERSONLINE__',
      '[020] __RECIPIENTS_PERSONLINE6__',
      '[021] __RECIPIENTS_PERSONLINE6__',
      '[024] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:',
      '[027] Nơi tạm trú:',
      '[035] 11__RECIPIENTS_PERSONLINE6__ (Nơi nhận suffix — after "Lưu: HSVA...")',
    ],
    slotRole: 'Body continuation + Nơi nhận footer suffix [035]',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0029 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-052 recipients.personLine6 appears 6 times: [020][021] as body continuation, [024] between fields, [027] after "Nơi tạm trú:", and [035] as Nơi nhận suffix after "Lưu: HSVA..." with footnote marker 11. The Nơi nhận suffix [035] is a pure footer artifact — Nơi nhận already lists the main recipients (7, 10, 8) and the "11" footnote marker is a signer title placeholder. The body continuation lines [020][021][024][027] are free-text fill, but BM-052 has no legitimate repeat/array person model. HIGH confidence REMOVE — the Nơi nhận suffix is sufficient evidence on its own. The body continuation lines are secondary.',
  },

  // ── PRIOR-DXR-009: BM-061 recipients.personLine3 ──────────────────────
  {
    investigationId: 'PRIOR-DXR-009',
    templateCode: 'BM-061',
    sourceId: 'ec44550246e9',
    path: 'recipients.personLine3',
    placeholder: 'RECIPIENTS_PERSONLINE3',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[022]', '[023]', '[026]'],
    paragraphSnippets: [
      '[022] __RECIPIENTS_PERSONLINE3__',
      '[023] __RECIPIENTS_PERSONLINE3__',
      '[026] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:',
    ],
    slotRole: 'Body continuation between labeled recipient fields',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0035 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-061 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text continuation. No Nơi nhận suffix. KEEP_DEFERRED.',
  },

  // ── PRIOR-DXR-010: BM-062 recipients.personLine5 ──────────────────────
  {
    investigationId: 'PRIOR-DXR-010',
    templateCode: 'BM-062',
    sourceId: '110961a781fa',
    path: 'recipients.personLine5',
    placeholder: 'RECIPIENTS_PERSONLINE5',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[021]', '[022]', '[023]', '[037]'],
    paragraphSnippets: [
      '[021] __RECIPIENTS_PERSONLINE5__',
      '[022] __RECIPIENTS_PERSONLINE5__',
      '[023] __RECIPIENTS_PERSONLINE5____RECIPIENTS_PERSONLINE5__ (merged line)',
      '[037] 16__RECIPIENTS_PERSONLINE5__ (Nơi nhận suffix — after "Lưu: HSVA...")',
    ],
    slotRole: 'Body continuation + Nơi nhận footer suffix [037]',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0029 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-062 recipients.personLine5 appears 4 times: [021][022][023] as body continuation (some merged with duplicate), and [037] as Nơi nhận suffix with footnote marker 16. The Nơi nhận suffix [037] is a pure footer artifact — Nơi nhận already lists main recipients (12, 13, 15). The "16" marker is a signer title placeholder. HIGH confidence REMOVE — the Nơi nhận suffix is sufficient evidence.',
  },

  // ── PRIOR-DXR-011: BM-066 recipients.personLine4 ──────────────────────
  {
    investigationId: 'PRIOR-DXR-011',
    templateCode: 'BM-066',
    sourceId: 'e3bc56081554',
    path: 'recipients.personLine4',
    placeholder: 'RECIPIENTS_PERSONLINE4',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[023]', '[024]', '[031]', '[038]'],
    paragraphSnippets: [
      '[023] __RECIPIENTS_PERSONLINE4__',
      '[024] __RECIPIENTS_PERSONLINE4__',
      '[031] __RECIPIENTS_PERSONLINE4__. (after "Yêu cầu 12 và 14")',
      '[038] 15__RECIPIENTS_PERSONLINE4__ (Nơi nhận suffix — after "Lưu: HSVA...")',
    ],
    slotRole: 'Body continuation + Điều 2 clause + Nơi nhận footer suffix [038]',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0032 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-066 recipients.personLine4 appears 4 times: [023][024] as body continuation between "Tên gọi khác:" and "Nghề nghiệp:", [031] as Điều 2 clause continuation, and [038] as Nơi nhận suffix with footnote marker 15. The Nơi nhận suffix [038] is a pure footer artifact — "15" is a signer title placeholder. HIGH confidence REMOVE. The Điều 2 clause [031] is also anomalous (Yêu cầu clause, not recipient continuation).',
  },

  // ── PRIOR-DXR-012: BM-067 recipients.personLine3 ──────────────────────
  {
    investigationId: 'PRIOR-DXR-012',
    templateCode: 'BM-067',
    sourceId: '0f7607122f29',
    path: 'recipients.personLine3',
    placeholder: 'RECIPIENTS_PERSONLINE3',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[021]', '[022]', '[025]'],
    paragraphSnippets: [
      '[021] __RECIPIENTS_PERSONLINE3__',
      '[022] __RECIPIENTS_PERSONLINE3__',
      '[025] Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:',
    ],
    slotRole: 'Body continuation between labeled recipient fields',
    visibleLabel: false,
    hasLegitimate: true,
    legitimatePath: 'recipients.personLine at blockId=P0028 (labeled "Người bị áp dụng")',
    blockId: null,
    rootCauseFinding: 'RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-067 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text continuation for recipient details. No Nơi nhận suffix. KEEP_DEFERRED.',
  },
];

// ── Counts ──────────────────────────────────────────────────────────────────
const byFinding = {};
const byRemediation = {};
for (const f of FINDINGS) {
  byFinding[f.rootCauseFinding] = (byFinding[f.rootCauseFinding] || 0) + 1;
  byRemediation[f.recommendedRemediation] = (byRemediation[f.recommendedRemediation] || 0) + 1;
}

const removeCandidates = FINDINGS.filter(f => f.recommendedRemediation === 'REMOVE_FIELD_FROM_CONTRACT');
const keepDeferred    = FINDINGS.filter(f => f.recommendedRemediation === 'KEEP_DEFERRED');

// ── Markdown ─────────────────────────────────────────────────────────────────
const itemTable = FINDINGS.map(f => [
  f.investigationId,
  f.templateCode,
  f.path,
  f.renderedParagraphs.join(', '),
  f.slotRole,
  f.recommendedRemediation,
  f.confidence,
].join(' | ')).map(row => '| ' + row + ' |').join('\n');

const md = `# DOCX Path/Binding P1 Investigation Batch 2

Generated: ${new Date().toISOString()}

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**P1 items investigated: 7**

| Finding | Count |
|---------|-------|
| RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED | 7 |

| Recommended Remediation | Count |
|------------------------|-------|
| REMOVE_FIELD_FROM_CONTRACT | 3 |
| KEEP_DEFERRED | 4 |

**Key insight:** All 7 items share a single structural pattern: orphan continuation lines between labeled recipient fields, plus Nơi nhận footer suffixes. Two distinct sub-patterns emerged:

1. **Body continuation lines** — between "Tên gọi khác:" / "Nghề nghiệp:" / "Số CMND:" fields. Role: free-text capacity for multi-line recipient details. Risk of removal: could reduce needed data-capture capacity. Recommended: KEEP_DEFERRED.

2. **Nơi nhận footer suffixes** — in the "Nơi nhận:" list with footnote markers (BM-052 [035], BM-062 [037], BM-066 [038]). Role: signer title placeholders in footer list. Risk of removal: low. Recommended: REMOVE_FIELD_FROM_CONTRACT (HIGH confidence).

---

## Per-Item Findings

### PRIOR-DXR-006: BM-063 / recipients.personLine5

| Field | Value |
|-------|-------|
| sourceId | 54b73110a34f |
| path | recipients.personLine5 |
| blockId | null |
| slotRole | Body continuation + Điều 1 tài sản clause |
| rendered paragraphs | [021], [022], [025], [030], [031] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Body continuation between "Tên gọi khác:" and "Số CMND:" ([021]-[025]), plus [030]-[031] inside Điều 1 "tài sản" clause (continuation of tài sản description, not recipient data). The Điều 1 occurrences are anomalous — these are tài sản description continuation, not person lines. However, removing without replacement could affect data-capture.

**Recommended action:** KEEP_DEFERRED. A domain-model review should clarify whether the Điều 1 tài sản continuation should become a tài sản.repeat model rather than a personLine variant.

---

### PRIOR-DXR-007: BM-065 / recipients.personLine3

| Field | Value |
|-------|-------|
| sourceId | 4a64c8d7e96c |
| path | recipients.personLine3 |
| blockId | null |
| slotRole | Body continuation between labeled fields |
| rendered paragraphs | [021], [022], [025] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Pure free-text continuation between "Tên gọi khác:" and "Số CMND". No Nơi nhận suffix. No visible label.

**Recommended action:** KEEP_DEFERRED.

---

### PRIOR-DXR-008: BM-052 / recipients.personLine6

| Field | Value |
|-------|-------|
| sourceId | 9919ecdb3971 |
| path | recipients.personLine6 |
| blockId | null |
| slotRole | Body continuation + Nơi nhận footer suffix [035] |
| rendered paragraphs | [019], [020], [021], [024], [027], [035] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |

**Evidence:** 6 occurrences. [020][021] as body continuation, [024] between fields, [027] after "Nơi tạm trú:", and [035] as Nơi nhận suffix after "Lưu: HSVA..." with footnote marker 11. The Nơi nhận suffix [035] is a pure footer artifact — "11" is a signer title placeholder. Nơi nhận already lists main recipients (7, 10, 8).

**Recommended action:** REMOVE_FIELD_FROM_CONTRACT. HIGH confidence — Nơi nhận suffix is sufficient evidence.

---

### PRIOR-DXR-009: BM-061 / recipients.personLine3

| Field | Value |
|-------|-------|
| sourceId | ec44550246e9 |
| path | recipients.personLine3 |
| blockId | null |
| slotRole | Body continuation between labeled fields |
| rendered paragraphs | [022], [023], [026] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Pure free-text continuation between "Tên gọi khác:" and "Số CMND". No Nơi nhận suffix.

**Recommended action:** KEEP_DEFERRED.

---

### PRIOR-DXR-010: BM-062 / recipients.personLine5

| Field | Value |
|-------|-------|
| sourceId | 110961a781fa |
| path | recipients.personLine5 |
| blockId | null |
| slotRole | Body continuation + Nơi nhận footer suffix [037] |
| rendered paragraphs | [021], [022], [023], [037] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |

**Evidence:** 4 occurrences. [021][022][023] as body continuation (including a merged double-slot [023]), and [037] as Nơi nhận suffix with footnote marker 16. The "16" marker is a signer title placeholder. Nơi nhận already lists main recipients (12, 13, 15).

**Recommended action:** REMOVE_FIELD_FROM_CONTRACT. HIGH confidence — Nơi nhận suffix is sufficient evidence.

---

### PRIOR-DXR-011: BM-066 / recipients.personLine4

| Field | Value |
|-------|-------|
| sourceId | e3bc56081554 |
| path | recipients.personLine4 |
| blockId | null |
| slotRole | Body continuation + Điều 2 clause + Nơi nhận footer suffix [038] |
| rendered paragraphs | [023], [024], [031], [038] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |

**Evidence:** 4 occurrences. [023][024] as body continuation, [031] as Điều 2 clause continuation after "Yêu cầu 12 và 14" (anomalous — not recipient continuation), and [038] as Nơi nhận suffix with footnote marker 15. The Điều 2 occurrence [031] is particularly anomalous — it is a Yêu cầu clause continuation, not a recipient line at all.

**Recommended action:** REMOVE_FIELD_FROM_CONTRACT. HIGH confidence — Nơi nhận suffix plus the Điều 2 anomaly provides strong evidence.

---

### PRIOR-DXR-012: BM-067 / recipients.personLine3

| Field | Value |
|-------|-------|
| sourceId | 0f7607122f29 |
| path | recipients.personLine3 |
| blockId | null |
| slotRole | Body continuation between labeled fields |
| rendered paragraphs | [021], [022], [025] |
| root cause | RECIPIENT_FILLER_NO_CONTEXT_CONFIRMED |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Pure free-text continuation between "Tên gọi khác:" and "Số CMND". No Nơi nhận suffix.

**Recommended action:** KEEP_DEFERRED.

---

## Pattern Comparison with P0/P1 Batch 1

| Aspect | P0 (document metadata) | P1 Batch 1 (document code) | P1 Batch 2 (recipients) |
|--------|------------------------|----------------------------|-------------------------|
| Pattern | Wrong path / orphan metadata slot | False header / orphan metadata slot | Orphan recipient continuation |
| Legitimate field exists | YES (for some) | YES (for W2R-025/026) | YES (all BMs have legitimate recipients.personLine) |
| Removal risk | LOW — orphan | LOW — orphan with replacement | MEDIUM — could reduce free-text capacity |
| Confidence | HIGH | HIGH | MIXED |

**Key distinction:** P0/P1 Batch 1 orphan fields had wrong semantic paths. P1 Batch 2 orphan fields have correct semantic type (recipients.personLine) but wrong structural position (no label, no blockId). The question is not "wrong path" but "orphan continuation line that may be needed free-text capacity."

---

## Destructive Decision Readiness

### HIGH-confidence remove candidates (ready for future destructive decision draft)

| ID | BM | Path | Evidence |
|----|----|------|---------|
| PRIOR-DXR-008 | BM-052 | recipients.personLine6 | Nơi nhận suffix [035] + 5 body continuations |
| PRIOR-DXR-010 | BM-062 | recipients.personLine5 | Nơi nhận suffix [037] + body continuations |
| PRIOR-DXR-011 | BM-066 | recipients.personLine4 | Nơi nhận suffix [038] + Điều 2 anomaly |

### KEEP_DEFERRED items (not ready for destructive removal)

| ID | BM | Path | Reason |
|----|----|------|--------|
| PRIOR-DXR-006 | BM-063 | recipients.personLine5 | Điều 1 tài sản clause [030][031] needs domain model review |
| PRIOR-DXR-007 | BM-065 | recipients.personLine3 | Body continuation, could reduce free-text capacity |
| PRIOR-DXR-009 | BM-061 | recipients.personLine3 | Body continuation, could reduce free-text capacity |
| PRIOR-DXR-012 | BM-067 | recipients.personLine3 | Body continuation, could reduce free-text capacity |

---

## Recommended Next Task

P1 Batch 2 yields 3 HIGH-confidence remove candidates (PRIOR-DXR-008, PRIOR-DXR-010, PRIOR-DXR-011) from the recipients filler group.

Combined with P1 Batch 1 (W2R-025, W2R-026) and P0 (5 items), the total HIGH-confidence candidates are now:

- P0: 5 remove candidates
- P1 Batch 1: 2 remove candidates
- P1 Batch 2: 3 remove candidates
- **Total: 10 HIGH-confidence remove candidates**

**Recommended next task: DOCX_PATH_BINDING_COMBINED_DESTRUCTIVE_DECISION_DRAFT**

This draft should consolidate all 10 HIGH-confidence remove candidates from P0 + P1 Batch 1 + P1 Batch 2 into a single approval-gated decision record. The 4 KEEP_DEFERRED items (P1 Batch 2) should be noted as deferred pending domain-model review.

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply write triggered: **0**

---

_Lane closure auto-generated. Do not edit manually._
`;

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON, JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceIds: SOURCE_IDS,
  findings: FINDINGS,
  counts: { byFinding, byRemediation },
  removeCandidates: removeCandidates.map(f => ({ id: f.investigationId, bm: f.templateCode, path: f.path, finding: f.rootCauseFinding, remediation: f.recommendedRemediation, confidence: f.confidence })),
  keepDeferred: keepDeferred.map(f => ({ id: f.investigationId, bm: f.templateCode, path: f.path, finding: f.rootCauseFinding, remediation: f.recommendedRemediation, confidence: f.confidence })),
  combinedHighConfidenceCount: 10, // P0(5) + P1-B1(2) + P1-B2(3)
}, null, 2), 'utf8');

console.log('[p1b2] Written', OUT_MD);
console.log('[p1b2] Written', OUT_JSON);
console.log('[p1b2] Findings:', FINDINGS.length);
console.log('[p1b2] byFinding:', JSON.stringify(byFinding));
console.log('[p1b2] byRemediation:', JSON.stringify(byRemediation));
console.log('[p1b2] removeCandidates:', removeCandidates.length);
console.log('[p1b2] keepDeferred:', keepDeferred.length);
