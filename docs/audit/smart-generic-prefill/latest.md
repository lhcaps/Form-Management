# Smart Generic Prefill — Audit Summary

**Audit date:** 2026-07-03
**Phase:** Discovery / Research + Implementation
**Status:** COMPLETE — Implemented in PR #34

---

## Classification Summary (213 templates, 2,497 fields)

| Classification | Count | Auto-fill v1 | Meaning |
|---|---|---:|---|
| `SAFE_RUNTIME_DEFAULT` | 69 | YES | SYSTEM/CURRENT_DATE fields with safe place/date labels |
| `SAFE_GENERIC_PREFILL` | 384 | YES (v1: subset) | Truly generic boilerplate (recipients) |
| `REVIEW_REQUIRED` | 37 | NO | Ambiguous fields; need human review before classification |
| `NEVER_AUTO` | 2,007 | NEVER | Case-specific legal facts; must remain blank |
| **Total viable v1** | **453** | YES | 69 + 384 |

---

## V1 Implementation Scope

Implemented V1 prefill fills **only**:

| Field | Count | Value Provider |
|---|---|---|
| `document.issuePlaceDateLine` | ~50 templates | Current date + default place |
| `document.issuePlaceAndDateLine` | ~48 templates | Current date + default place |
| `document.issueDate` | ~9 templates | Current date (ISO or text based on control) |
| `document.ngayBan` / `document.issueDay` | ~48 templates | Current day |
| `document.issueMonth` | ~some templates | Current month |
| `document.issueYear` | ~some templates | Current year |
| `recipients.archiveLine` | ~159 templates | `"Lưu: HSVA, HSKS, VP."` |

**V1 deliberately does NOT fill:**
- `agency.*`, `official.*`, `signature.*` — no real profile source in v1
- `legalBasis.*` — no trusted generic boilerplate
- `accused.*`, `victim.*`, `witness.*`, `informant.*`, `reporter.*` — NEVER_AUTO
- `offense.*`, `decision.*`, `measure.*`, `case.*` — NEVER_AUTO
- `detentionArrest.*`, `prosecution.*`, `indictment.*` — NEVER_AUTO

---

## Architecture

Chosen approach: **Option B — separate `smart-generic-prefill.ts` layer**

Created:
- `apps/web/src/lib/smart-generic-prefill.ts` — core prefill engine
- `apps/web/src/lib/smart-generic-prefill.test.ts` — 75 unit tests (node:test)
- `apps/web/src/lib/template-preview-workspace.prefill.test.ts` — 19 UI wiring tests (node:test)
- `apps/web/src/components/documents/template-preview-workspace.tsx` — UI wiring

Sample data (`sample-data.ts`) is **not** touched. Demo data remains separate.

---

## Policy

| Rule | Value |
|------|-------|
| Auto-apply on empty template | NO — explicit button click only |
| Overwrite existing values | NO — only fills empty fields |
| Default place | `TP. Hồ Chí Minh` |
| Timezone | `Asia/Ho_Chi_Minh` |
| Date format | `ngày DD tháng MM năm YYYY` |

---

## Validation Results

| Command | Result |
|---|---|
| `node scripts/audit/smart-generic-prefill.mjs` | PASS |
| `pnpm test:web-unit` | PASS (217 tests, 0 fail) |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm --filter web lint` | PASS |
| `node scripts/audit-runtime-hardcodes.mjs` | PASS |
| `node scripts/audit/audit-locked-compiled-consistency.mjs` | PASS (213/213) |
| `node scripts/audit/audit-contract-sync.mjs` | PASS (213/213 matched) |

---

## Deliverables

| File | Status |
|------|--------|
| `scripts/audit/smart-generic-prefill.mjs` | Created |
| `docs/audit/smart-generic-prefill/field-inventory.csv` | Generated |
| `docs/audit/smart-generic-prefill/field-inventory.json` | Generated |
| `docs/audit/smart-generic-prefill/architecture-notes.md` | Created |
| `apps/web/src/lib/smart-generic-prefill.ts` | Created |
| `apps/web/src/lib/smart-generic-prefill.test.ts` | Created |
| `apps/web/src/lib/template-preview-workspace.prefill.test.ts` | Created |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | Updated |

---

*Generated: 2026-07-03. PR #34 implementation.*
