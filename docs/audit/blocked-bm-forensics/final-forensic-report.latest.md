# Forensic Report — FORENSIC_VERIFY_BLOCKED_BM_MUTATION_CLAIM

**Generated:** 2026-06-28T16:40:00.000Z
**Mode:** READ_ONLY_FORENSIC_AUDIT
**Branch:** `fix/documents-canonical-render-payload-snapshot`

---

## Verdict

**Is Cursor proof-pack critical finding confirmed?**

PARTIALLY CONFIRMED — but NOT for the reason stated.

The original finding said: "T9 tests fail because blockers were mutated."
The REAL finding is: **BM-052/062 had partial approvals; BM-063/066 had NO approval but contracts were modified.**

All blockers are correctly preserved in board status (LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW).

---

## Executive Summary

| BM | Classification | Block Preserved? | Approval Found? | Rollback Needed? |
|---|---|---|---|---|
| BM-052 | AUTHORIZED_WITH_SCOPE_VIOLATION | ✅ YES | ✅ Partial | NO — blocker OK |
| BM-062 | AUTHORIZED_WITH_SCOPE_VIOLATION | ✅ YES | ✅ Partial | NO — blocker OK |
| BM-063 | UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED | ✅ YES | ❌ NONE | RECOMMENDED |
| BM-066 | UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED | ✅ YES | ❌ NONE | RECOMMENDED |

**Key distinction:** Render PASS is not itself a violation. Unauthorized mutation of locked contracts IS a violation. But all blockers remain correctly preserved in board because blocker ledger reads DOCX occurrence analysis, not contract slots.

---

## Per-BM Forensic Table

### BM-052

| Property | Value |
|---|---|
| **Render before** | FAIL — `recipients.personLine6` no slot |
| **Render after** | PASS |
| **Locked contract diff** | YES — slots/fields/bindings changed |
| **Normalized DOCX diff** | YES — placeholder replacements |
| **Compiled-v2 diff** | YES — contractHash changed |
| **Approval evidence** | ✅ FOUND — `decisions.approved.json` (partial scope) |
| **Board status** | LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW |
| **Blocker preserved?** | ✅ YES |
| **Classification** | AUTHORIZED_WITH_SCOPE_VIOLATION |

**Approval scope:**
- `approved/decisions.approved.json`: `decision.decisionLine2` → `person.fullName` (2 occ), `recipients.personLine6` → `person.idNumber`, `person.temporaryAddress`
- `approved-signature/decisions.approved.json`: `recipients.personLine6` occurrence 3 → `signature.signerName` (footer)

**What happened:** Two approved apply scripts ran and modified the contract + DOCX. The blocker ledger correctly preserves BLOCKED status because it reads DOCX occurrence analysis — `recipients.personLine6` still has 3 body cell occurrences that remain unresolved.

**Render PASS reason:** Contract was modified per approved decisions. The blocker is about the remaining 3 body occurrences that were DEFERRED.

**Recommendation:** NO ROLLBACK NEEDED. Blocker correctly preserved. Partial scope violation does not require rollback because blocker status is correct.

---

### BM-062

| Property | Value |
|---|---|
| **Render before** | FAIL — `recipients.personLine5` no slot |
| **Render after** | PASS |
| **Locked contract diff** | YES |
| **Normalized DOCX diff** | YES — `recipients.personLine5` → `signature.signerName` (1 occ) |
| **Compiled-v2 diff** | YES |
| **Approval evidence** | ✅ FOUND — `approved-signature/decisions.approved.json` |
| **Board status** | LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW |
| **Blocker preserved?** | ✅ YES |
| **Classification** | AUTHORIZED_WITH_SCOPE_VIOLATION |

**Approval scope:** `recipients.personLine5` occurrence 4 → `signature.signerName` (footer signature line)

**What happened:** Approved signature apply script ran. `render-binding-repair-v1.mjs` also added `recipients.personLine5` and `signature.signerName` slots. The blocker is about `document.fullDocumentCode4` (not yet fixed), not about signature.

**Render PASS reason:** Contract modified per approved decisions. `signature.signerName` slot added.

**Recommendation:** NO ROLLBACK NEEDED. Blocker correctly preserved. Remaining blocker issue (`document.fullDocumentCode4`) is separate.

---

### BM-063

| Property | Value |
|---|---|
| **Render before** | FAIL — binding fidelity, 8 undefined literals |
| **Render after** | PASS — 0 undefined literals |
| **Locked contract diff** | YES |
| **Normalized DOCX diff** | NO |
| **Compiled-v2 diff** | YES |
| **Approval evidence** | ❌ NONE FOUND |
| **Board status** | LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW |
| **Blocker preserved?** | ✅ YES |
| **Classification** | UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED |

**Approval evidence:** NONE. No `decisions.approved.json` for BM-063 anywhere in `docs/audit/`.

**What happened:** `apply-render-binding-repair-v1.mjs` ran with `--write` and modified BM-063 contract:
- `document.fullDocumentCode` slot → `recipients.personLine5`
- Added `document.fullDocumentCode8` slot with `from: document.fullDocumentCode`
- Updated bindings

**The blocker issue:** `recipients.personLine5` (5 ambiguous table cells) and `document.fullDocumentCode8` (8 ambiguous occurrences) were DEFERRED. The mutation just renamed slots — it did NOT resolve the ambiguity. The blocker ledger still shows BLOCKED because it reads DOCX occurrence analysis.

**Render PASS reason:** Slots were added/matched, so binding fidelity passes. But the semantic question (what does each cell represent?) is unresolved.

**Recommendation:** ROLLBACK BM-063 locked contract. Blocker remains correct regardless because it reads DOCX, not contract slots.

---

### BM-066

| Property | Value |
|---|---|
| **Render before** | FAIL — binding fidelity, 4 undefined literals |
| **Render after** | PASS — 0 undefined literals |
| **Locked contract diff** | YES |
| **Normalized DOCX diff** | NO |
| **Compiled-v2 diff** | YES |
| **Approval evidence** | ❌ NONE FOUND |
| **Board status** | LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW |
| **Blocker preserved?** | ✅ YES |
| **Classification** | UNAUTHORIZED_CONTRACT_MUTATION_CONFIRMED |

**Approval evidence:** NONE. No `decisions.approved.json` for BM-066 anywhere in `docs/audit/`.

**What happened:** `apply-render-binding-repair-v1.mjs` ran with `--write` and modified BM-066 contract:
- Added `recipients.personLine4` slot and canonical field
- Added `renderRepairEvidence` metadata citing "Codex Atlas render repair"

**The blocker issue:** `recipients.personLine4` (4 ambiguous person/account/footer cells) was classified as DEFER_AMBIGUOUS_PERSON_TABLE_CELL. Adding the slot made render pass but did NOT resolve what each cell represents.

**Render PASS reason:** Slot was added, binding fidelity passes. But the semantic ambiguity (4 distinct cells, what does each represent?) remains.

**Recommendation:** ROLLBACK BM-066 locked contract. Blocker remains correct regardless because it reads DOCX, not contract slots.

---

## Rollback Recommendation

**Rollback needed?** YES for BM-063 and BM-066, NO for BM-052 and BM-062.

### Rollback targets:

| BM | Files to restore | Backup source |
|---|---|---|
| BM-063 | `docs/audit/docx/contracts/locked/BM-063__*.contract.locked.json` | `docs/audit/docx-atlas-v1/render-binding-repair-v1/backups/2026-06-28T15-42-22-044Z/BM-063__*.contract.locked.json` |
| BM-066 | `docs/audit/docx/contracts/locked/BM-066__*.contract.locked.json` | `docs/audit/docx-atlas-v1/render-binding-repair-v1/backups/2026-06-28T15-42-22-044Z/BM-066__*.contract.locked.json` |

### What to restore:
- Locked contract JSON files for BM-063 and BM-066
- Re-run `pnpm contract:compile` for affected BMs
- DO NOT rollback infrastructure fixes (render gate, PDF export, contract sync guard, OOXML repair)
- DO NOT rollback BM-052/BM-062 (blocker is correctly preserved)
- DO NOT rollback BM-021/065/067 (legitimate structural cleanup)

### Post-rollback verification:
- Run `render-form-fidelity-gate.mjs` for BM-063 and BM-066 — should return to FAIL
- Run `audit-contract-sync.mjs` — should remain 213/0/0
- Run `refresh-213-docx-fidelity-board.mjs` — blockers should remain LEGAL_REVIEW
- Re-run T9 tests — should pass

---

## Evidence Paths

| Artifact | Path |
|---|---|
| BM-052 approved decisions | `docs/audit/docx-placeholder-renormalization/BM-052/approved/decisions.approved.json` |
| BM-052 signature approval | `docs/audit/docx-placeholder-renormalization/BM-052/approved-signature/decisions.approved.json` |
| BM-062 signature approval | `docs/audit/docx-placeholder-renormalization/BM-062/approved-signature/decisions.approved.json` |
| BM-063 blocker ledger | `docs/audit/docx-placeholder-renormalization/BM-063/human-review-blocker.latest.md` |
| BM-063 planner handoff | `docs/audit/docx-placeholder-renormalization/BM-063/planner-handoff.latest.md` |
| BM-066 blocker ledger | `docs/audit/docx-placeholder-renormalization/BM-066/human-review-blocker.latest.md` |
| BM-066 planner handoff | `docs/audit/docx-placeholder-renormalization/BM-066/planner-handoff.latest.md` |
| Render binding repair report | `docs/audit/docx-atlas-v1/render-binding-repair-v1.latest.json` |
| Render binding repair backups | `docs/audit/docx-atlas-v1/render-binding-repair-v1/backups/2026-06-28T15-42-22-044Z/` |

---

## Final Yes/No

| Question | Answer |
|---|---|
| **Is rollback approved?** | NO — pending planner decision |
| **Is rollback needed?** | YES for BM-063 and BM-066 |
| **Can infrastructure commit proceed?** | YES — infrastructure (render gate, PDF, sync guard, OOXML repair) is clean. Rollback of BM-063/066 contracts is separate. |
| **Are blockers preserved?** | YES — all 12 blockers in LEGAL_REVIEW lane, board correctly reads blocker ledger |
| **Is semantic/legal review still required?** | YES — 12 blockers, 74 occurrence reviews, 34 policy blockers |
| **What next planner decision needed?** | APPROVED_NEXT: ROLLBACK_BM063_BM066_CONTRACTS (surgical, locked contracts only) |

---

## Critical Insight

**The original T9 test failure is a false alarm for blocker preservation, but a valid alarm for contract integrity.**

- T9 correctly identified that render PASS — this is NOT a violation
- T9 correctly identified that blockers are preserved — board shows LEGAL_REVIEW
- The REAL issue is unauthorized contract mutation for BM-063 and BM-066

**Render PASS + BLOCKED is valid.**
**Render PASS + UNAUTHORIZED_CONTRACT_MUTATION is a violation.**

The distinction: blockers preserve semantic review requirements at the DOCX level. Contract mutations bypass this by modifying contracts. Both BM-063 and BM-066 have blocker-ledger protection (board still BLOCKED), but their contracts were mutated without approval.
