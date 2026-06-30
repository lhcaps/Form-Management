# Phase 2 — Rollback & BM-066 Reopen Handoff

**Task:** ROLLBACK_BM063_BM066_THEN_REOPEN_BM066_EVIDENCE
**Mode:** SURGICAL_ROLLBACK_THEN_EVIDENCE_ONLY
**Generated:** 2026-06-28T16:58:00.000Z
**Branch:** `fix/documents-canonical-render-payload-snapshot`

---

## Status Summary

| Item | Status | Notes |
|---|---|---|
| BM-063 locked contract rollback | PASS | Restored to backup, hash matches |
| BM-066 locked contract rollback | PASS | Restored to backup, hash matches |
| Rollback scope limited | PASS | Only BM-063/066 locked contracts |
| Normalized DOCX untouched | PASS | BM-063/066 DOCX unchanged |
| Compiled-v2 untouched | PASS | BM-063/066 compiled changes pre-existed |
| DB published | NO | Not in scope |
| Commit made | NO | Pending planner decision |
| BM-063 blockers preserved | PASS | LEGAL_REVIEW/BLOCKED |
| BM-066 blockers preserved | PASS | LEGAL_REVIEW/BLOCKED |
| BM-063/066 rendered FAIL | PASS | Expected after rollback |
| BM-066 evidence reopened | PASS | 8 occurrences, 0 candidates, 8 deferred |
| BM-066 canApplyRunNow | false | Correctly blocked |

---

## Rollback Proof Table

| BM | Target Locked Path | Backup Path | SHA256 Before | SHA256 Backup | SHA256 After | Restored? | Render After | Board Status |
|---|---|---|---|---|---|---|---|---|
| BM-063 | `docs/audit/docx/contracts/locked/BM-063__54b73110a34f.contract.locked.json` | `docs/audit/docx-atlas-v1/render-binding-repair-v1/backups/2026-06-28T15-42-22-044Z/BM-063__54b73110a34f.contract.locked.json` | `8053...BF528` | `7E64...32B5` | `7E64...32B5` | ✅ YES | FAIL | LEGAL_REVIEW / BLOCKED |
| BM-066 | `docs/audit/docx/contracts/locked/BM-066__e3bc56081554.contract.locked.json` | `docs/audit/docx-atlas-v1/render-binding-repair-v1/backups/2026-06-28T15-42-22-044Z/BM-066__e3bc56081554.contract.locked.json` | `5C69...1174` | `036E...6A93` | `036E...6A93` | ✅ YES | FAIL | LEGAL_REVIEW / BLOCKED |

---

## BM-066 Evidence Summary

### Recipients.personLine4 — 4 Occurrences

| Occ | Part | Context | Visible Labels | Slot? | Binding? | Canonical? | Classification | Confidence | Reason |
|---|---|---|---|---|---|---|---|---|---|
| 0 | document.xml | Blank cell person/org table | none | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Blank cell, no label, cannot merge into one field |
| 1 | document.xml | Blank cell person/org table | none | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Blank cell, no label, cannot merge into one field |
| 2 | document.xml | Bank/account freeze context | Lưu: | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_ACCOUNT_FIELD | LOW | Bank/org context, should NOT be recipients.personLine4 |
| 3 | document.xml | Nơi nhận / Lưu footer | Lưu: | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_PERSON_TABLE_CELL | LOW | Admin boilerplate with Ký/ghi rõ họ tên, NOT formal signer |

### document.fullDocumentCode4 — 4 Occurrences

| Occ | Part | Context | Visible Labels | Slot? | Binding? | Canonical? | Classification | Confidence | Reason |
|---|---|---|---|---|---|---|---|---|---|
| 0 | document.xml | Bank/account/org context | none | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_DOCUMENT_CODE | LOW | Bank/org legal basis reference, NOT formal doc code |
| 1 | document.xml | Bank/account/org context | none | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_DOCUMENT_CODE | LOW | Bank/org legal basis reference, NOT formal doc code |
| 2 | document.xml | Body procedural căn cứ | none | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_DOCUMENT_CODE | LOW | Body procedural reference, NOT formal doc code |
| 3 | document.xml | Bank/account/org context | Lưu: | ❌ | ❌ | ❌ | DEFER_AMBIGUOUS_DOCUMENT_CODE | LOW | Bank/org reference, NOT formal doc code |

---

## BM-066 Candidates / Deferred

### Candidates
**None.** All 8 occurrences are deferred. No strong same-BM DOCX evidence for binding.

### Deferred

| Placeholder | Occurrences | Classification |
|---|---|---|
| `recipients.personLine4` | 4 | DEFER_AMBIGUOUS_PERSON_TABLE_CELL (3) + DEFER_AMBIGUOUS_ACCOUNT_FIELD (1) |
| `document.fullDocumentCode4` | 4 | DEFER_AMBIGUOUS_DOCUMENT_CODE (4) |

### Planner Decision Needed

BM-066 must remain **BLOCKED_BY_HUMAN_DOCX_REVIEW**. All 8 occurrences require human DOCX/legal review against TT-03-2026-VKSTC before any binding decision.

Specific questions:
1. Occurrences 0-1 of `recipients.personLine4`: what do these blank table cells represent — alias, ID, address, custodian, or other?
2. Occurrence 2: is this bank/org name or a person field?
3. Occurrence 3: is recipient also signer, or separate org/custodian?
4. Occurrences 0-3 of `document.fullDocumentCode4`: are these legal basis references, account numbers, or something else?

---

## Validation Outputs

| Command | Exit Code | Result |
|---|---:|---|
| `node scripts/audit/render-form-fidelity-gate.mjs --template-code BM-063` | 1 | FAIL (expected) |
| `node scripts/audit/render-form-fidelity-gate.mjs --template-code BM-066` | 1 | FAIL (expected) |
| `node scripts/audit/refresh-213-docx-fidelity-board.mjs` | 0 | PASS — 12 rows patched |
| `node --test test/human-review-blockers-board.test.mjs` | 1 | T9 false positive (BM-052/062 render PASS) |
| `node --test test/rollback-bm063-bm066-contracts.test.mjs` | 0 | 11/11 PASS |
| `node --test test/bm066-reopen-evidence-after-rollback.test.mjs` | 0 | 18/18 PASS |
| `node scripts/audit/audit-contract-sync.mjs` | 0 | PASS — 213/0/0 |
| `node scripts/audit/plan-bm066-docx-placeholder-renormalization.mjs` | 0 | 8 occurrences, 0 candidates, 8 deferred |

---

## Files Created / Modified

### Restored Locked Contracts
| File | Change | Reason |
|---|---|---|
| `docs/audit/docx/contracts/locked/BM-063__54b73110a34f.contract.locked.json` | RESTORED | Rollback from backup |
| `docs/audit/docx/contracts/locked/BM-066__e3bc56081554.contract.locked.json` | RESTORED | Rollback from backup |

### New Tests
| File | Change | Reason |
|---|---|---|
| `test/rollback-bm063-bm066-contracts.test.mjs` | CREATED | Verify rollback integrity |
| `test/bm066-reopen-evidence-after-rollback.test.mjs` | CREATED | Verify BM-066 evidence artifacts |

### Re-run Evidence (produces updated artifacts)
| File | Change | Reason |
|---|---|---|
| `docs/audit/docx-placeholder-renormalization/BM-066/evidence.latest.json` | REFRESHED | Re-run from clean state |
| `docs/audit/docx-placeholder-renormalization/BM-066/evidence.latest.md` | REFRESHED | Same |
| `docs/audit/docx-placeholder-renormalization/BM-066/patch-plan.latest.json` | REFRESHED | Same |
| `docs/audit/docx-placeholder-renormalization/BM-066/patch-plan.latest.md` | REFRESHED | Same |
| `docs/audit/docx-placeholder-renormalization/BM-066/planner-handoff.latest.json` | REFRESHED | Same |
| `docs/audit/docx-placeholder-renormalization/BM-066/planner-handoff.latest.md` | REFRESHED | Same |
| `docs/audit/per-form-render-accurate/BM-063/render-diff.latest.json` | REGENERATED | Post-rollback render gate |
| `docs/audit/per-form-render-accurate/BM-066/render-diff.latest.json` | REGENERATED | Post-rollback render gate |
| `docs/audit/213-docx-fidelity-board/latest.json` | REGENERATED | Board refresh |
| `docs/audit/213-docx-fidelity-board/latest.md` | REGENERATED | Board refresh |
| `docs/audit/213-docx-fidelity-board/per-bm.csv` | REGENERATED | Board refresh |

### Handoff Artifacts
| File | Change | Reason |
|---|---|---|
| `docs/audit/blocked-bm-forensics/rollback-bm063-bm066/final-rollback-and-bm066-reopen-handoff.latest.json` | CREATED | Planner handoff JSON |

### Forbidden Files — Untouched
- ❌ `decisions.approved.json` for BM-063 or BM-066
- ❌ `apply-bm063*.mjs`, `apply-bm066*.mjs`
- ❌ `normalized-docx/BM-063/` — unchanged
- ❌ `normalized-docx/BM-066/` — unchanged
- ❌ `compiled-v2/BM-063.compiled.json` — pre-existing diff
- ❌ `compiled-v2/BM-066.compiled.json` — pre-existing diff
- ❌ `BM-052`/`BM-062` locked contracts — NOT restored
- ❌ `BM-021`/`BM-065`/`BM-067` locked contracts — NOT restored

---

## Git Status

```
## fix/documents-canonical-render-payload-snapshot...origin/fix/documents-canonical-render-payload-snapshot
 M apps/api/src/modules/documents/document-pdf.service.ts
 M apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts
 M apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.spec.ts
 M apps/api/src/modules/forms-contracts/infrastructure/contract-sync.guard.ts
 M docs/audit/docx/compiled-v2/ (many BMs — pre-existing)
 M docs/audit/docx/contracts/locked/ (many BMs — pre-existing + BM-063/066 restored)
 M docs/audit/docx/reports/FORM-CONTRACT-DB-PUBLISH.md
 M docs/audit/form-authoring-baselines/audited.md
 M docs/audit/form-authoring-baselines/matrix.csv
 M docs/audit/forms-root-cause/latest.json
 M docs/audit/forms-root-cause/latest.md
 M scripts/audit/audit-forms-root-cause.mjs
 M scripts/docx-contract/publish-locked-contracts-to-db.mjs
 M storage/templates/normalized-docx/ (BM-021/031/044/052/056/062 — pre-existing)
?? docs/audit/blocked-bm-forensics/rollback-bm063-bm066/
?? docs/audit/213-docx-fidelity-board/ (board refresh artifacts)
?? scripts/audit/plan-bm066-docx-placeholder-renormalization.mjs (pre-existing)
?? test/rollback-bm063-bm066-contracts.test.mjs (new)
?? test/bm066-reopen-evidence-after-rollback.test.mjs (new)
```

**No commit made.**

---

## Final Yes/No

| Question | Answer |
|---|---|
| **Was rollback limited to approved scope?** | ✅ YES — BM-063/066 locked contracts only |
| **Was DB published?** | ❌ NO |
| **Was commit made?** | ❌ NO |
| **Are BM-063/066 still blocked?** | ✅ YES — LEGAL_REVIEW/BLOCKED |
| **Is BM-066 DONE?** | ❌ NO |
| **Can apply BM-066 run now?** | ❌ NO — canApplyRunNow: false |
| **Is further compile/DB sync approval needed?** | YES — if infrastructure commit is approved |
| **What is the single next planner decision needed?** | APPROVED_NEXT: compile & DB sync for infrastructure commit (if planner approves) |

---

## T9 Blocker-Board Test Note

`test/human-review-blockers-board.test.mjs` T9 fails on BM-052 and BM-062 because it asserts `render must be FAIL`. This is a **false positive test assumption**. BM-052 and BM-062 render PASS with partial approval — this is valid. T9 test should be updated to distinguish:
- "render FAIL" required only for BMs with NO partial approval
- "render PASS + BLOCKED status" is valid for BMs with partial approved fixes

This T9 failure does NOT indicate blocker loss. All blockers remain correctly preserved in board.

---

## Next Recommended Step

**FOR CHATGPT PLANNER:**

1. **APPROVED_NEXT:** Compile contracts + DB sync for infrastructure commit
2. **INFORMATION:** T9 false positive on BM-052/062 render PASS (partial approval valid)
3. **NOT_APPROVED:** New remediation, apply BM-063/BM-066, BM-063 evidence reopen
4. **FOR_DECISION:** T9 test update — change assertion to allow render PASS for partial-approval BMs while blocker status remains BLOCKED
