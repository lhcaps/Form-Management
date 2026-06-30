# DOCX Path/Binding — Layer C Approved Decisions

Generated: 2026-06-27T04:30:00.000Z
Task: DOCX_PATH_BINDING_LAYER_C_APPLY
Layer: C (Layer 3 of 3)
Status: APPROVED_FOR_APPLY

Approval command:

```
APPROVE_DESTRUCTIVE_LAYER C BM-052 BM-062 BM-066 9919ecdb3971 110961a781fa e3bc56081554 DOCX-REMOVE-008 DOCX-REMOVE-009 DOCX-REMOVE-010
```

---

## DOCX-REMOVE-008

| Field | Value |
|---|---|
| decisionId | DOCX-REMOVE-008 |
| templateCode | BM-052 |
| sourceId | 9919ecdb3971 |
| path | recipients.personLine6 |
| blockId | null |
| action | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |
| domainModelNote | false |
| sourceBatch | P1_BATCH_2 |

**Evidence:** BM-052 recipients.personLine6 appears 6 times: [020][021] as body continuation, [024] between fields, [027] after "Nơi tạm trú:", and [035] as Nơi nhận suffix after "Lưu: HSVA..." with footnote marker 11. The Nơi nhận suffix [035] is a pure footer artifact. The Nơi nhận already lists the main recipients (7, 10, 8). The "11" footnote marker is a signer title placeholder.

**Rollback:** Restore recipients.personLine6 entries in docxSlots, canonicalFields, renderBindings from backup.

---

## DOCX-REMOVE-009

| Field | Value |
|---|---|
| decisionId | DOCX-REMOVE-009 |
| templateCode | BM-062 |
| sourceId | 110961a781fa |
| path | recipients.personLine5 |
| blockId | null |
| action | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |
| domainModelNote | false |
| sourceBatch | P1_BATCH_2 |

**Evidence:** BM-062 recipients.personLine5 appears 4 times: [021][022][023] as body continuation (some merged with duplicate), and [037] as Nơi nhận suffix with footnote marker 16. The Nơi nhận suffix [037] is a pure footer artifact. The Nơi nhận already lists main recipients (12, 13, 15). The "16" marker is a signer title placeholder.

**Rollback:** Restore recipients.personLine5 entries in docxSlots, canonicalFields, renderBindings from backup.

---

## DOCX-REMOVE-010

| Field | Value |
|---|---|
| decisionId | DOCX-REMOVE-010 |
| templateCode | BM-066 |
| sourceId | e3bc56081554 |
| path | recipients.personLine4 |
| blockId | null |
| action | REMOVE_FIELD_FROM_CONTRACT |
| confidence | HIGH |
| domainModelNote | false |
| sourceBatch | P1_BATCH_2 |

**Evidence:** BM-066 recipients.personLine4 appears 4 times: [023][024] as body continuation, [031] after "Yêu cầu 12 và 14", and [038] as Nơi nhận suffix with footnote marker 15. The Nơi nhận suffix [038] is a pure footer artifact. The "15" marker is a signer title placeholder.

**Rollback:** Restore recipients.personLine4 entries in docxSlots, canonicalFields, renderBindings from backup.

---

## Summary

| Item | BM | SourceId | Path | Confidence |
|---|---|---|---|---|
| DOCX-REMOVE-008 | BM-052 | 9919ecdb3971 | recipients.personLine6 | HIGH |
| DOCX-REMOVE-009 | BM-062 | 110961a781fa | recipients.personLine5 | HIGH |
| DOCX-REMOVE-010 | BM-066 | e3bc56081554 | recipients.personLine4 | HIGH |

**Total: 3 decisions. Domain-model notes: 0. Keep-deferred touched: 0.**

This is the final layer. All decisions are orphan recipients.footer/body suffix cleanup only.
