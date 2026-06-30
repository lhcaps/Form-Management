# DOCX Path/Binding P1 Investigation Batch 2

Generated: 2026-06-26T20:00:08.121Z

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
