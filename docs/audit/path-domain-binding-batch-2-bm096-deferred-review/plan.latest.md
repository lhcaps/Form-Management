# BM-096 Deferred Group Review — Plan

**Task:** `BM096_DEFERRED_GROUP_REVIEW_PLAN`
**Generated:** 2026-06-28T03:52:00.000+07:00
**Status:** READY_FOR_PLANNER_REVIEW
**Role:** Evidence-only (no mutations, no apply)

---

## Current Baseline

| Metric | Value |
|--------|-------|
| totalIssues | 1476 |
| FAIL | 1154 |
| REVIEW | 322 |
| REMEDIATION_LEAK | 10 |
| COMPILED_DRIFT | 37 |
| DB sync | matched=213, stale=0 |

---

## Previous Mutation (Closed)

| Field | Before | After | Status |
|-------|--------|--------|--------|
| document.diaChi | BAD_LABEL + GENERIC_FIELD_CANONICALIZATION | RESOLVED | ACCEPTED |
| person.idNumber | (new) REQUIRED_SUSPICIOUS | REVIEW | unmasking, follow-up needed |

---

## 17 Fields Reviewed

### Clean / No Issues

| Path | Label | Notes |
|------|-------|-------|
| recipients.personLine | Người bị áp dụng | ✅ Label is clear Vietnamese. rawDomain=recipients matches pathDomain. No audit issues. |

### Deferred: Required Policy Review

| Path | Label | Notes |
|------|-------|-------|
| person.idNumber | Số CCCD/CMND | REQUIRED_SUSPICIOUS is unmasking from previous mutation. Follow-up: human review to set required=true. **DO NOT touch in this batch.** |

### Deferred: No Visible Label (14 fields)

All have BAD_LABEL + GENERIC_FIELD_CANONICALIZATION. Cannot determine correct semantic path because textBefore does not contain meaningful visible Vietnamese context.

| Path | textBefore | Issue |
|------|-----------|-------|
| document.soYeu | Xét thấy8 | Generic placeholder |
| document.ngayBan | Xét thấy8{{document.field3}}{{document.field4}} | Mixed with other DOCX fields |
| document.chuThe | {{document.field7}} | Only DOCX field refs |
| document.tenVu | {{document.field9}} | Only DOCX field refs |
| document.lyDo | C | Single letter |

### Deferred: Source Policy Conflict (2 fields)

| Path | source | rawDomain | Issue |
|------|--------|-----------|-------|
| agency.diaDanh | agencyConfig | document | rawDomain=document contradicts agencyConfig source |
| agency.dongDia | agencyConfig | document | rawDomain=document contradicts agencyConfig source |

### Deferred: Path/Domain Mismatch (7 fields)

These have `rawDomain=document` but pathDomain is NOT `document`. This is the most significant finding.

| Path | rawDomain | textBefore | Signal |
|------|-----------|-----------|--------|
| legalBasis.canCu | document | — | rawDomain mismatch |
| person.toiDanh | document | — | rawDomain mismatch |
| person.hoTen | document | — | rawDomain mismatch |
| **document.namSinh** | document | **Nghề nghiệp:** | **STRONG: textBefore says occupation, path says birth year** |
| recipients.luuHo | document | — | rawDomain mismatch |
| **signature.cheDo** | document | **Nơi thường trú:** | **STRONG: textBefore says permanent address, path says signature mode** |
| signature.chucVu | document | — | rawDomain mismatch |
| **signature.nguoiKy** | document | **Nơi tạm trú:** | **STRONG: textBefore says temporary address, path says signer** |

---

## Key Insight: Signature Fields Are Misclassified

All three signature fields in BM-096 appear to be **misclassified placeholders** for person address fields:

- `signature.cheDo` — textBefore="Nơi thường trú:" (permanent address) → should be `person.permanentAddress`
- `signature.nguoiKy` — textBefore="Nơi tạm trú:" (temporary address) → should be `person.temporaryAddress`
- `signature.chucVu` — context shows permanent address → path may be wrong

This is a **systematic domain misclassification** pattern across the whole BM.

---

## Classification Summary

| Classification | Count | Fields |
|---------------|-------|--------|
| CLEAN_NO_ISSUES | 1 | recipients.personLine |
| DEFER_REQUIRED_POLICY_REVIEW | 1 | person.idNumber |
| DEFER_NO_VISIBLE_LABEL | 5 | document.soYeu, document.ngayBan, document.chuThe, document.tenVu, document.lyDo |
| DEFER_SOURCE_POLICY_CONFLICT | 2 | agency.diaDanh, agency.dongDia |
| DEFER_PATH_DOMAIN_MISMATCH | 7 | legalBasis.canCu, person.toiDanh, person.hoTen, document.namSinh, recipients.luuHo, signature.cheDo, signature.chucVu, signature.nguoiKy |
| REVIEW_CANDIDATE_SAFE_REMAP | 0 | — |
| REVIEW_CANDIDATE_LABEL_ONLY | 0 | — |

---

## Top Candidate Recommendation

**PROMOTE: document.namSinh → person.occupation**

Rationale:
- textBefore="Nghề nghiệp:" (occupation) is clear Vietnamese evidence
- path `document.namSinh` (birth year) contradicts the visible context
- Label should be "Nghề nghiệp" (occupation)
- rawDomain=document matches, pathDomain would change from document to person
- Collision check: `person.occupation` not currently in BM-096 slots — collision-safe
- Confidence: MEDIUM (textBefore is clear but needs DOCX verification)

**Runner-up: signature.cheDo → person.permanentAddress**

Rationale:
- textBefore="Nơi thường trú:" (permanent address) is very clear
- But this involves a cross-domain remap (signature → person) with renderBinding implications
- Should be evaluated carefully in single-field workflow

---

## Safety Assertions

- ✅ No locked contract mutations
- ✅ No compiled-v2 changes
- ✅ No DB publish
- ✅ No apply scripts run
- ✅ No approved decisions created
- ✅ DB sync unchanged (matched=213, stale=0)
- ✅ Root-cause metrics unchanged (1476 total)

---

## Next Step

Planner decision: which single candidate to promote to single-field review/apply workflow?
