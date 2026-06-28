# DOCX Path/Binding P1 Investigation Batch 1

Generated: 2026-06-26T19:53:40.295Z

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
