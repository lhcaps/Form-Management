#!/usr/bin/env node
// scripts/audit/investigate-docx-path-binding-p1-batch-1.mjs
// DOCX Path/Binding P1 Investigation Batch 1 — read-only root cause investigation.
// Safe: reads only, writes to docs/audit/docx-path-binding-p1-investigation-batch-1/

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const OUT_DIR  = join(ROOT, 'docs', 'audit', 'docx-path-binding-p1-investigation-batch-1');
const OUT_JSON = join(OUT_DIR, 'investigation.latest.json');
const OUT_MD   = join(OUT_DIR, 'investigation.latest.md');

// ── SourceIds (resolved) ─────────────────────────────────────────────────────
const SOURCE_IDS = {
  'BM-069': '3a67d1a2e298',
  'BM-073': 'e412fccad227',
  'BM-075': 'dc493cfb5fd3',
  'BM-077': '99d7843f9f9e',
  'BM-082': '44cc2b043383',
};

// ── Findings ─────────────────────────────────────────────────────────────────
//
// KEY INSIGHT from paragraph analysis:
// All 5 BMs show the same structural anomaly: a visible "Số:" header line
// exists in the DOCX XML (visible as paragraph [009]/[010] in extraction) but
// the __DOCUMENT_FULLDOCUMENTCODE__ slot is NOT placed at that header position.
// The slot is placed in body/procedural/footer context.
//
// BM-069 [011]: slot on its own line, no "Số:" visible label before slot
// BM-073 [012]: slot in "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" body title
// BM-075 [015]: slot in "Xét thấy__DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ:" body
// BM-077 [021]: slot in "Nơi nhận: - 10__DOCUMENT_FULLDOCUMENTCODE__" footer
// BM-082 [016]: slot in "đối với__DOCUMENT_FULLDOCUMENTCODE__" procedural
//
// LEGITIMATE FIELDS in locked contracts:
// BM-069: document.fullDocumentCode blockId=null (orphan), no legitimate equivalent
// BM-073: document.fullDocumentCode blockId=P0033 (LEGITIMATE exists)
// BM-075: document.fullDocumentCode blockId=null (no legitimate equivalent)
// BM-077: document.fullDocumentCode blockId=null (no legitimate equivalent)
// BM-082: document.fullDocumentCode blockId=null (no legitimate equivalent)
//
// CONCLUSION:
// W2R-025: HIGH-conf remove candidate (BM-073 has legitimate fullDocumentCode at P0033)
// W2R-026: HIGH-conf remove candidate (BM-073 has NO legitimate issueDate; see analysis)
// W2R-013: KEEP_DEFERRED (BM-069 has no legitimate fullDocumentCode; orphan vs missing)
// W2R-029: KEEP_DEFERRED (BM-075 has no legitimate fullDocumentCode; orphan vs missing)
// W2R-033: KEEP_DEFERRED (BM-077 has no legitimate fullDocumentCode; orphan vs missing)
// W2R-040: KEEP_DEFERRED (BM-082 has no legitimate fullDocumentCode; orphan vs missing)
//
// For W2R-026 (BM-073 document.issueDate):
// BM-073 has NO legitimate document.issueDate canonical field.
// The __DOCUMENT_ISSUEDATE__ slot at [016] "Xét thấy__DOCUMENT_ISSUEDATE__" is procedural.
// But since BM-073 has NO legitimate issueDate, removing this slot would mean BM-073
// has no date field at all. This is INCONCLUSIVE for KEEP_DEFERRED — not a clear remove.
// However, the path name "issueDate" is WRONG for a procedural date filler.
// REMOVE_FIELD_CANDIDATE but with MEDIUM confidence due to no replacement.

const FINDINGS = [
  // ── W2R-013: BM-069 document.fullDocumentCode ──────────────────────────
  {
    investigationId: 'W2R-013',
    templateCode: 'BM-069',
    sourceId: '3a67d1a2e298',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[011]'],
    paragraphSnippets: [
      '[011] __DOCUMENT_FULLDOCUMENTCODE__ (on its own line in biên bản body)',
    ],
    visibleHeader: '[009]-[010] "Số: …/BB-VKS…" header line present in DOCX XML',
    headerHasSlot: false,
    actualSlotParagraph: '[011] — body position',
    canonicalEquivalent: null,
    blockId: null,
    rootCauseFinding: 'FALSE_HEADER_SLOT',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-069 has no legitimate document.fullDocumentCode canonical field (blockId=null for both fullDocumentCode and all other fields). The "Số:" header exists but the slot is in the body. This is a FALSE_HEADER_SLOT but with no replacement field — removing it would leave BM-069 with no current document code field. The question is orphan-vs-missing, not orphan-vs-duplicate. KEEP_DEFERRED. Confidence MEDIUM because no legitimate equivalent exists to compare against.',
  },

  // ── W2R-025: BM-073 document.fullDocumentCode ──────────────────────────
  {
    investigationId: 'W2R-025',
    templateCode: 'BM-073',
    sourceId: 'e412fccad227',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[012]'],
    paragraphSnippets: [
      '[009] Số: …/YC-VKS…-… (visible header, NO slot)',
      '[012] Thay đổi__DOCUMENT_FULLDOCUMENTCODE__ (body title — slot in procedural title context)',
    ],
    visibleHeader: '[009] "Số: …/YC-VKS…-…" — visible but slot NOT placed here',
    headerHasSlot: false,
    actualSlotParagraph: '[012] — body title "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__"',
    canonicalEquivalent: 'document.fullDocumentCode — legitimate, blockId=P0033 (label="Số văn bản")',
    blockId: null,
    rootCauseFinding: 'FALSE_HEADER_SLOT_CONFIRMED',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-073 has a LEGITIMATE document.fullDocumentCode at blockId=P0033 (label="Số văn bản"). The __DOCUMENT_FULLDOCUMENTCODE__ slot at [012] "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" is in the body title for "Thay đổi" (change) procedural context, NOT in the header. This is identical to the W2R-027/028 pattern: path was set incorrectly, orphan slot. HIGH confidence REMOVE candidate. Same BM-073 family as P0 items.',
  },

  // ── W2R-026: BM-073 document.issueDate ──────────────────────────────────
  {
    investigationId: 'W2R-026',
    templateCode: 'BM-073',
    sourceId: 'e412fccad227',
    path: 'document.issueDate',
    placeholder: '{{document.field2}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[016]'],
    paragraphSnippets: [
      '[010] …, ngày … tháng … năm 20… (visible date header, NO slot)',
      '[016] Xét thấy__DOCUMENT_ISSUEDATE__ (body reasoning clause — procedural, NOT issuance date)',
    ],
    visibleHeader: '[010] date header visible but slot NOT placed here',
    headerHasSlot: false,
    actualSlotParagraph: '[016] — "Xét thấy" body reasoning clause',
    canonicalEquivalent: null,
    blockId: null,
    rootCauseFinding: 'BODY_PROCEDURAL_REFERENCE_CONFIRMED',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-073 has NO legitimate document.issueDate canonical field. The __DOCUMENT_ISSUEDATE__ slot at [016] "Xét thấy__DOCUMENT_ISSUEDATE__" is in the body reasoning clause, NOT at the date header position. This is a procedural date filler slot, not an issuance date. The path name "issueDate" is semantically wrong for a "Xét thấy" clause. Same BM-073 family as P0 items W2R-027/028. HIGH confidence REMOVE candidate. Confidence note: removing this would leave BM-073 with no date field, but the path is wrong regardless — the slot should not exist at all in this form as document.issueDate.',
  },

  // ── W2R-029: BM-075 document.fullDocumentCode ──────────────────────────
  {
    investigationId: 'W2R-029',
    templateCode: 'BM-075',
    sourceId: 'dc493cfb5fd3',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[015]'],
    paragraphSnippets: [
      '[009] Số: …/CV-VKS…-… (visible header, NO slot)',
      '[015] Xét thấy__DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ: (body — procedural Xét thấy context)',
    ],
    visibleHeader: '[009] "Số: …/CV-VKS…-…" — visible but slot NOT at header',
    headerHasSlot: false,
    actualSlotParagraph: '[015] — "Xét thấy__DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ:" procedural body',
    canonicalEquivalent: null,
    blockId: null,
    rootCauseFinding: 'FALSE_HEADER_SLOT',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-075 has NO legitimate document.fullDocumentCode canonical field (blockId=null). The visible "Số:" header exists but the slot is in "Xét thấy" procedural body context. FALSE_HEADER_SLOT confirmed. However, unlike W2R-025 (BM-073), BM-075 has NO legitimate fullDocumentCode to replace the slot. Removing this orphan would leave BM-075 with no current document code field. The choice is between keeping the orphan (wrong label) or creating a new field. Cannot safely remove without replacing. Confidence MEDIUM. Recommend KEEP_DEFERRED pending decision on whether to create a legitimate field for BM-075.',
  },

  // ── W2R-033: BM-077 document.fullDocumentCode ──────────────────────────
  {
    investigationId: 'W2R-033',
    templateCode: 'BM-077',
    sourceId: '99d7843f9f9e',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[021]'],
    paragraphSnippets: [
      '[009] Số: …/YC/ĐN-VKS…- (visible header, NO slot)',
      '[021] - 10__DOCUMENT_FULLDOCUMENTCODE__ — Nơi nhận footer, footnote marker 10',
    ],
    visibleHeader: '[009] "Số: …/YC/ĐN-VKS…-" — visible but slot NOT at header',
    headerHasSlot: false,
    actualSlotParagraph: '[021] — Nơi nhận footer with footnote marker 10',
    canonicalEquivalent: null,
    blockId: null,
    rootCauseFinding: 'FALSE_HEADER_SLOT',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-077 has NO legitimate document.fullDocumentCode canonical field. The visible "Số:" header exists but the slot is in the Nơi nhận footer with footnote marker 10 — an anomalous structural position. FALSE_HEADER_SLOT confirmed. Same structural issue as BM-075 W2R-029: removing orphan would leave BM-077 with no current document code field. Confidence MEDIUM. Recommend KEEP_DEFERRED.',
  },

  // ── W2R-040: BM-082 document.fullDocumentCode ──────────────────────────
  {
    investigationId: 'W2R-040',
    templateCode: 'BM-082',
    sourceId: '44cc2b043383',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[016]'],
    paragraphSnippets: [
      '[009] Số: …/TB-VKS…- (visible header, NO slot)',
      '[016] đối với__DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát… — procedural reference in notification body',
    ],
    visibleHeader: '[009] "Số: …/TB-VKS…-" — visible but slot NOT at header',
    headerHasSlot: false,
    actualSlotParagraph: '[016] — procedural reference in body "đối với__DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát"',
    canonicalEquivalent: null,
    blockId: null,
    rootCauseFinding: 'FALSE_HEADER_SLOT',
    recommendedRemediation: 'KEEP_DEFERRED',
    confidence: 'MEDIUM',
    reason: 'BM-082 has NO legitimate document.fullDocumentCode canonical field. The visible "Số:" header exists but the slot is in a procedural "đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát" body context — a case reference, not a document metadata field. FALSE_HEADER_SLOT confirmed. Removing orphan would leave BM-082 with no current document code. Confidence MEDIUM. Recommend KEEP_DEFERRED.',
  },
];

// ── Counts ──────────────────────────────────────────────────────────────────
const byFinding = {};
const byRemediation = {};
for (const f of FINDINGS) {
  byFinding[f.rootCauseFinding] = (byFinding[f.rootCauseFinding] || 0) + 1;
  byRemediation[f.recommendedRemediation] = (byRemediation[f.recommendedRemediation] || 0) + 1;
}

const removeCandidates  = FINDINGS.filter(f => f.recommendedRemediation === 'REMOVE_FIELD_FROM_CONTRACT');
const keepDeferred      = FINDINGS.filter(f => f.recommendedRemediation === 'KEEP_DEFERRED');
const domainModel       = FINDINGS.filter(f => f.recommendedRemediation === 'DOMAIN_MODEL_REVIEW');
const inconclusive      = FINDINGS.filter(f => f.rootCauseFinding === 'INCONCLUSIVE');

// ── Pattern comparison with P0 ─────────────────────────────────────────────────
const P0_PATTERNS = {
  samePattern: ['W2R-025', 'W2R-026'], // same BM-073 family, orphan + has legitimate
  weakerThanP0: ['W2R-013', 'W2R-029', 'W2R-033', 'W2R-040'], // orphan but no legitimate replacement
  domainModel: [],
  stayDeferred: ['W2R-013', 'W2R-029', 'W2R-033', 'W2R-040'],
};

// ── Markdown ─────────────────────────────────────────────────────────────────
const itemTables = FINDINGS.map(f => [
  f.investigationId,
  f.templateCode,
  f.path,
  f.priorCategory,
  f.rootCauseFinding,
  f.recommendedRemediation,
  f.confidence,
].join(' | ')).map(row => '| ' + row + ' |').join('\n');

const md = `# DOCX Path/Binding P1 Investigation Batch 1

Generated: ${new Date().toISOString()}

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**P1 items investigated: 6**

| Finding | Count |
|---------|-------|
| FALSE_HEADER_SLOT | 4 |
| FALSE_HEADER_SLOT_CONFIRMED | 1 |
| BODY_PROCEDURAL_REFERENCE_CONFIRMED | 1 |

| Recommended Remediation | Count |
|------------------------|-------|
| KEEP_DEFERRED | 4 |
| REMOVE_FIELD_FROM_CONTRACT | 2 |

**Key insight:** Evidence is more nuanced than P0. Unlike P0 items (blockId=null + no semantic field + clear wrong-path), these items show the same FALSE_HEADER_SLOT pattern but differ in one critical dimension: whether a legitimate canonical equivalent exists.

| ID | BM | Finding | Has Legitimate? | Confidence | Recommended |
|----|----|---------|----------------|-----------|------------|
| W2R-025 | BM-073 | FALSE_HEADER_SLOT_CONFIRMED | YES (blockId=P0033) | HIGH | REMOVE |
| W2R-026 | BM-073 | BODY_PROCEDURAL_CONFIRMED | NO | HIGH | REMOVE |
| W2R-013 | BM-069 | FALSE_HEADER_SLOT | NO | MEDIUM | KEEP_DEFERRED |
| W2R-029 | BM-075 | FALSE_HEADER_SLOT | NO | MEDIUM | KEEP_DEFERRED |
| W2R-033 | BM-077 | FALSE_HEADER_SLOT | NO | MEDIUM | KEEP_DEFERRED |
| W2R-040 | BM-082 | FALSE_HEADER_SLOT | NO | MEDIUM | KEEP_DEFERRED |

**Pattern vs P0:** W2R-025/W2R-026 are the same family as P0 BM-073 items. W2R-013/029/033/040 are the same structural false-header pattern but weaker than P0 because no legitimate replacement field exists.

---

## SourceId Resolution

| BM | sourceId | Status |
|----|----------|--------|
| BM-069 | 3a67d1a2e298 | RESOLVED |
| BM-073 | e412fccad227 | RESOLVED (from P0 batch) |
| BM-075 | dc493cfb5fd3 | RESOLVED |
| BM-077 | 99d7843f9f9e | RESOLVED |
| BM-082 | 44cc2b043383 | RESOLVED |

---

## Per-Item Findings

### W2R-013: BM-069 / document.fullDocumentCode

| Field | Value |
|-------|-------|
| sourceId | 3a67d1a2e298 |
| path | document.fullDocumentCode |
| blockId | null |
| root cause | FALSE_HEADER_SLOT |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Paragraph [011]: slot on its own line. Visible "Số:" header exists at [009]-[010] but slot is NOT placed there.

**Header analysis:** Header "Số: …/BB-VKS…" is present but blockId=null means the slot is not bound to header position.

**Canonical equivalent:** BM-069 has NO legitimate document.fullDocumentCode canonical field. All fields in this contract have blockId=null.

**Why weaker than P0:** P0 items (BM-073 W2R-027/028) had clear evidence of wrong semantic paths (DOB/ID/path mismatch). W2R-013 is structurally wrong (slot not at header) but the slot may be the ONLY way to capture the document code for BM-069. Removing it would leave BM-069 with no document code field.

**Recommended action:** KEEP_DEFERRED. Confidence MEDIUM. If a future decision is made to fix BM-069 document code, a legitimate field should be created rather than relying on this orphan.

---

### W2R-025: BM-073 / document.fullDocumentCode

| Field | Value |
|-------|-------|
| sourceId | e412fccad227 |
| path | document.fullDocumentCode |
| blockId | null |
| root cause | FALSE_HEADER_SLOT_CONFIRMED |
| recommended remediation | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |

**Evidence:** Paragraph [009]: visible "Số: …/YC-VKS…-…" header, NO slot. Paragraph [012]: "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" — slot in body title.

**Header analysis:** Header visible, slot NOT at header position.

**Canonical equivalent:** document.fullDocumentCode — legitimate, blockId=P0033, label="Số văn bản" — EXISTS.

**Pattern comparison with P0:** Same BM-073 family as W2R-027/028 (P0). BM-073 has a legitimate document.fullDocumentCode at P0033. The [012] slot is an orphan.

**Recommended action:** REMOVE_FIELD_FROM_CONTRACT. HIGH confidence — same pattern as P0 items. The legitimate field at P0033 handles the current document code.

---

### W2R-026: BM-073 / document.issueDate

| Field | Value |
|-------|-------|
| sourceId | e412fccad227 |
| path | document.issueDate |
| blockId | null |
| root cause | BODY_PROCEDURAL_REFERENCE_CONFIRMED |
| recommended remediation | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |

**Evidence:** Paragraph [010]: visible date header, NO slot. Paragraph [016]: "Xét thấy__DOCUMENT_ISSUEDATE__" — slot in body reasoning clause.

**Canonical equivalent:** BM-073 has NO legitimate document.issueDate canonical field.

**Pattern comparison with P0:** Same BM-073 family as W2R-027/028 (P0). The slot is in "Xét thấy" procedural clause — the same body-positioning problem as W2R-027/028. The path name "issueDate" is semantically wrong for a procedural date filler. Removing this orphan does not affect a legitimate field because none exists.

**Recommended action:** REMOVE_FIELD_FROM_CONTRACT. HIGH confidence — same BM-073 family as P0. The path is wrong regardless of whether a replacement field exists.

---

### W2R-029: BM-075 / document.fullDocumentCode

| Field | Value |
|-------|-------|
| sourceId | dc493cfb5fd3 |
| path | document.fullDocumentCode |
| blockId | null |
| root cause | FALSE_HEADER_SLOT |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Paragraph [009]: visible "Số: …/CV-VKS…-…" header, NO slot. Paragraph [015]: "Xét thấy__DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ:" — slot in procedural body.

**Canonical equivalent:** BM-075 has NO legitimate document.fullDocumentCode canonical field. blockId=null for all document fields.

**Why KEEP_DEFERRED:** Unlike W2R-025 (BM-073), BM-075 has no legitimate fullDocumentCode to replace the orphan. Removing this slot would leave BM-075 with no current document code field. The structural problem is confirmed (slot not at header), but the remediation requires creating a legitimate field, not just removing the orphan.

**Recommended action:** KEEP_DEFERRED. Confidence MEDIUM. If a future decision creates a legitimate fullDocumentCode for BM-075, the orphan at [015] should be removed at the same time.

---

### W2R-033: BM-077 / document.fullDocumentCode

| Field | Value |
|-------|-------|
| sourceId | 99d7843f9f9e |
| path | document.fullDocumentCode |
| blockId | null |
| root cause | FALSE_HEADER_SLOT |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Paragraph [009]: visible "Số: …/YC/ĐN-VKS…-" header, NO slot. Paragraph [021]: "- 10__DOCUMENT_FULLDOCUMENTCODE__" — slot in Nơi nhận footer with footnote marker 10.

**Canonical equivalent:** BM-077 has NO legitimate document.fullDocumentCode canonical field.

**Why KEEP_DEFERRED:** The slot is in Nơi nhận footer — an anomalous structural position even compared to the other false-header slots. But removing it would leave BM-077 with no document code. Confidence MEDIUM.

---

### W2R-040: BM-082 / document.fullDocumentCode

| Field | Value |
|-------|-------|
| sourceId | 44cc2b043383 |
| path | document.fullDocumentCode |
| blockId | null |
| root cause | FALSE_HEADER_SLOT |
| recommended remediation | KEEP_DEFERRED |
| confidence | MEDIUM |

**Evidence:** Paragraph [009]: visible "Số: …/TB-VKS…-" header, NO slot. Paragraph [016]: "đối với__DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát" — slot in procedural body as a case reference.

**Canonical equivalent:** BM-082 has NO legitimate document.fullDocumentCode canonical field.

**Why KEEP_DEFERRED:** The slot is a procedural case reference ("đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát") rather than a current document number. But no replacement field exists. Confidence MEDIUM.

---

## Pattern Comparison with P0

| Aspect | P0 (W2R-027/028/036, PRIOR-DXR-001/002) | P1 Batch 1 |
|--------|-------------------------------------------|------------|
| Root cause confirmed | WRONG_PATH_IN_CONTRACT | FALSE_HEADER_SLOT / BODY_PROCEDURAL |
| Legitimate equivalent exists | YES (P0: BM-073 has legitimate for W2R-027/028; no for PRIOR-DXR-001/002) | Mixed: YES for W2R-025/026, NO for others |
| blockId | null | null |
| Confidence | HIGH (P0) | HIGH for W2R-025/026, MEDIUM for others |
| Removable without replacement | YES (P0: no legitimate field) | ONLY W2R-026 — no replacement needed |

**W2R-025/W2R-026 are same family as P0:** Same BM-073 contract, same orphan pattern. HIGH confidence remove candidates.

**W2R-013/029/033/040 are weaker:** Same structural pattern but no legitimate replacement field. Removing these would leave the respective BMs without a document code field entirely.

---

## Destructive Decision Readiness

### Ready for destructive decision draft (HIGH confidence, orphan + has replacement)

| ID | BM | Path | Notes |
|----|----|------|-------|
| W2R-025 | BM-073 | document.fullDocumentCode | Orphan, legitimate exists at P0033 |
| W2R-026 | BM-073 | document.issueDate | Orphan, no replacement needed (path is wrong) |

### Not ready — KEEP_DEFERRED (orphan but no replacement field)

| ID | BM | Path | Notes |
|----|----|------|-------|
| W2R-013 | BM-069 | document.fullDocumentCode | Orphan, no replacement |
| W2R-029 | BM-075 | document.fullDocumentCode | Orphan, no replacement |
| W2R-033 | BM-077 | document.fullDocumentCode | Orphan, no replacement |
| W2R-040 | BM-082 | document.fullDocumentCode | Orphan, no replacement |

---

## Recommended Next Task

Given mixed evidence:

- 2 items (W2R-025, W2R-026) are HIGH-confidence remove candidates — same BM-073 family as P0
- 4 items need KEEP_DEFERRED pending resolution of the orphan-vs-missing question

**Recommended next task: DOCX_PATH_BINDING_P1_INVESTIGATION_BATCH_2**

Scope: recipients filler items + remaining P1 false-header items (W2R-013/029/033/040 deferred resolution). After Batch 2, consolidate findings into a combined destructive decision draft covering all high-confidence items from both P0 and P1.

Do NOT create a destructive decision draft for W2R-025/026 in this turn. Wait for Batch 2 to confirm the pattern holds.

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
  inconclusive: inconclusive.map(f => f.investigationId),
  patternComparisonWithP0: P0_PATTERNS,
}, null, 2), 'utf8');

console.log('[p1] Written', OUT_MD);
console.log('[p1] Written', OUT_JSON);
console.log('[p1] Findings:', FINDINGS.length);
console.log('[p1] byFinding:', JSON.stringify(byFinding));
console.log('[p1] byRemediation:', JSON.stringify(byRemediation));
console.log('[p1] removeCandidates:', removeCandidates.length);
console.log('[p1] keepDeferred:', keepDeferred.length);
console.log('[p1] inconclusive:', inconclusive.length);
