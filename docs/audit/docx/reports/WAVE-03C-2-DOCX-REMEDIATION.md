# Wave 03C-2 DOCX Remediation

**Timestamp:** 2026-06-22T18:40:00+07:00
**Branch:** `remediation/docx-placeholders-wave-03c-2`
**Scope:** BM-194 through BM-212 (19 forms)

---

## Scope

BM-194, BM-195, BM-196, BM-197, BM-198, BM-199, BM-200, BM-201, BM-202, BM-203, BM-204, BM-205, BM-206, BM-207, BM-208, BM-209, BM-210, BM-211, BM-212

---

## Before

| Metric | Value |
|--------|-------|
| **Blocking** | 0 |
| **Remediation** | 54 |
| **Warning** | 58 |
| **Runtime readiness** | 213 locked / 0 draft |
| **Smoke** | PASS |
| **Gate** | PASS |

---

## Preflight Notes

### Wave 03C-1 Extra Created Forms Investigation

**Finding:** Wave 03C-1 DB publish reported `Created: 13` but listed 10 new versions (BM-184–BM-193). The extra 3 forms are **BM-001, BM-002, BM-003**.

**Root Cause:** These are pilot forms in `NORMALIZED_PILOT_CODES`. When `audit:docx:extract` ran during Wave 03C-1 verification, it wrote a new `generatedAt` timestamp to their locked contract JSONs (line 1516: `"generatedAt": "2026-06-22T18:04:11.739Z"`), changing the SHA256 hash. The publish script hashes the entire JSON including timestamps, so these forms appeared "new" despite being semantically identical.

**Legitimacy:** **Legitimate but unintentional.** These forms were correctly excluded from the Wave 03C-1 scope and the 13 publishes were a side effect of running the extraction pipeline. The semantic content (slots, fields, bindings) is identical between the v1 and v2 records — only the `generatedAt` timestamp differs.

**Action Taken:** Documented here for transparency. No additional action required. This is a known pipeline artifact where the `generatedAt` field in locked contracts is not stable across pipeline runs.

---

## Placeholder Analysis

| BM | Old Placeholder | Surrounding Context | Proposed Path | Decision | Reason |
|----|---------------|--------------------|----------------|----------|--------|
| BM-194 | document.field (2x) | Header serial, footnote date | document.fullDocumentCode, document.issueDate | RENAMED | Serial number and date placeholders in decision header |
| BM-195 | document.field (2x) | Header serial, footnote date | document.fullDocumentCode, document.issueDate | RENAMED | Same pattern as BM-194 |
| BM-196 | document.field (4x), recipients.field (14x) | Header serial, decision body with person details | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine + personLine2–15 | RENAMED | Decision document with person registry fields |
| BM-197 | document.field (11x) | Decision body without recipients | document.fullDocumentCode, document.issueDate, document.issuePlace, document.reasonLine + personLine2–8 | RENAMED | Decision document, body fields all document.* prefix |
| BM-198 | document.field (2x) | Header serial, footnote date | document.fullDocumentCode, document.issueDate | RENAMED | Simple decision cancellation |
| BM-199 | document.field (3x), recipients.field (14x), decision.field (1x) | Court advocacy document with person details | document.fullDocumentCode, document.issueDate, document.issuePlace + personLine2–14 + decisionLine2 | RENAMED | Court advocacy with decision authority line |
| BM-200 | document.field (1x) | Header serial | document.fullDocumentCode | RENAMED | Simple notification |
| BM-201 | document.field (2x), recipients.field (13x) | Resolution decision with person details | document.fullDocumentCode, document.issueDate + personLine2–14 | RENAMED | Resolution with person registry |
| BM-202 | document.field (3x) | Discontinuation decision | document.fullDocumentCode, document.issueDate, decision.decisionLine | RENAMED | Decision with authority line |
| BM-203 | document.field (7x), recipients.field (15x) | Procedural activity notification | document.fullDocumentCode, document.issueDate, document.issuePlace + personLine2–14 + case.caseNumber, case.caseNumber2 | RENAMED | Activity notification with person + case details |
| BM-204 | document.field (9x) | Organizational participation decision (no recipients.field) | document.fullDocumentCode, document.issueDate, case.caseNumber + personLine2–7 | RENAMED | Tab-aligned table cells for org representative |
| BM-205 | document.field (1x), recipients.field (13x) | Prevention measure notification for juveniles | document.fullDocumentCode + personLine2–15 | RENAMED | Prevention measure with juvenile details |
| BM-206 | recipients.field (13x) | Electronic monitoring decision (no document.field) | personLine2–14 | RENAMED | Only person details, no header fields |
| BM-207 | document.field (1x), recipients.field (12x) | Electronic monitoring approval decision | document.fullDocumentCode + personLine2–13 | RENAMED | Approval with person details |
| BM-208 | document.field (1x), recipients.field (12x) | Electronic monitoring disapproval | document.fullDocumentCode + personLine2–13 | RENAMED | Disapproval with person details |
| BM-209 | document.field (1x), recipients.field (11x) | Representative monitoring decision | document.fullDocumentCode + personLine2–12 | RENAMED | Representative monitoring |
| BM-210 | recipients.field (10x) | Representative change decision (no document.field) | personLine2–11 | RENAMED | Only person details, no header fields |
| BM-211 | document.field (6x), recipients.field (16x) | Case intake notification | document.fullDocumentCode, document.issueDate + personLine2–16 + case.caseNumber, case.caseNumber2 | RENAMED | Case notification with person + case details |
| BM-212 | document.field (10x), recipients.field (13x) | Juvenile procedure participation request | document.fullDocumentCode, document.issueDate + personLine2–23 | RENAMED | Juvenile procedure with extensive person details |

---

## Changes

| BM | Old Placeholder | New Placeholder | Evidence | DB Version |
|----|---------------|-----------------|----------|------------|
| BM-194 | document.field | document.fullDocumentCode, document.issueDate | Header serial + footnote date | v2 |
| BM-195 | document.field | document.fullDocumentCode, document.issueDate | Header serial + footnote date | v2 |
| BM-196 | document.field, recipients.field | fullDocumentCode, issueDate, issuePlace, reasonLine + personLine2–15 | 18 renames per DOCX analysis | v2 |
| BM-197 | document.field | fullDocumentCode, issueDate, issuePlace, reasonLine + personLine2–8 | 11 renames per DOCX analysis | v2 |
| BM-198 | document.field | document.fullDocumentCode, document.issueDate | Header serial + footnote date | v2 |
| BM-199 | document.field, recipients.field, decision.field | fullDocumentCode, issueDate, issuePlace + personLine2–14 + decisionLine2 | 18 renames per DOCX analysis | v2 |
| BM-200 | document.field | document.fullDocumentCode | Header serial | v2 |
| BM-201 | document.field, recipients.field | fullDocumentCode, issueDate + personLine2–14 | 15 renames per DOCX analysis | v2 |
| BM-202 | document.field | fullDocumentCode, issueDate, decision.decisionLine | Header + authority line | v2 |
| BM-203 | document.field, recipients.field | fullDocumentCode, issueDate, issuePlace + personLine2–15 + caseNumber, caseNumber2 | 22 renames per DOCX analysis | v2 |
| BM-204 | document.field | fullDocumentCode, issueDate, caseNumber + personLine2–7 | 9 renames, tab-aligned table cells | v2 |
| BM-205 | document.field, recipients.field | fullDocumentCode + personLine2–15 | 14 renames per DOCX analysis | v2 |
| BM-206 | recipients.field | personLine2–14 | 13 renames per DOCX analysis | v2 |
| BM-207 | document.field, recipients.field | fullDocumentCode + personLine2–13 | 13 renames per DOCX analysis | v2 |
| BM-208 | document.field, recipients.field | fullDocumentCode + personLine2–13 | 13 renames per DOCX analysis | v2 |
| BM-209 | document.field, recipients.field | fullDocumentCode + personLine2–12 | 12 renames per DOCX analysis | v2 |
| BM-210 | recipients.field | personLine2–11 | 10 renames per DOCX analysis | v2 |
| BM-211 | document.field, recipients.field | fullDocumentCode, issueDate + personLine2–16 + caseNumber, caseNumber2 | 22 renames per DOCX analysis | v2 |
| BM-212 | document.field, recipients.field | fullDocumentCode, issueDate + personLine2–23 | 23 renames per DOCX analysis | v2 |

**Total renames:** 223 mustache occurrences across 19 forms.

---

## After

| Metric | Value |
|--------|-------|
| **Blocking** | 0 |
| **Remediation** | 35 (was 54, decreased 19) |
| **Warning** | 58 (unchanged) |
| **Runtime readiness** | 213 locked / 0 draft |
| **Smoke** | PASS |
| **Gate** | PASS |

---

## DB Publish

| Metric | Value |
|--------|-------|
| **Created** | 19 (BM-194 through BM-212) |
| **Skipped** | 194 (idempotency — hash unchanged) |
| **Failed** | 0 |
| **Scope key** | GLOBAL |
| **Source resolution** | GLOBAL_PUBLISHED |
| **Extra created forms** | None |

All 19 scoped forms created as v2. All 194 unchanged forms skipped idempotently. No extra forms created.

---

## Warning Delta

| Category | Count | Details |
|---------|-------|---------|
| **New warnings** | 0 | None created |
| **Resolved warnings** | 0 | None resolved |
| **Accepted warnings** | 0 | No new warnings to classify |

**Note:** Warning count (58) is unchanged from before. This is expected as the remediation only addresses generic placeholder-to-slot mismatches, not metadata completeness issues.

---

## Remaining Work

| Metric | Count |
|--------|-------|
| **Remaining remediation** | 35 |
| **Remaining warnings** | 58 |
| **Recommended next wave** | BM-021, BM-031, BM-036, BM-044, BM-051–BM-067, BM-068–BM-069, BM-073, BM-075, BM-077, BM-080, BM-082, BM-162–BM-163 (CONTRACT_REPAIR_REQUIRED forms with CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER or BINDING_WITHOUT_TEMPLATE_PLACEHOLDER patterns) |

**Note:** Remaining remediation items are in forms with CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER and BINDING_WITHOUT_TEMPLATE_PLACEHOLDER patterns (slots/bindings exist in contract but no matching DOCX mustache). These require DOCX template editing to add missing placeholders, which is a different remediation pattern than the generic placeholder renaming addressed in this wave.

---

## Files Changed

- `scripts/docx-contract/wave-03c-2-remediation.mjs` (created)
- `docs/audit/docx/reports/wave-03c-2-placeholder-renames.json` (created)
- `docs/audit/docx/contracts/locked/BM-194__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-195__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-196__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-197__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-198__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-199__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-200__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-201__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-202__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-203__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-204__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-205__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-206__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-207__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-208__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-209__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-210__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-211__*.contract.locked.json` (updated)
- `docs/audit/docx/contracts/locked/BM-212__*.contract.locked.json` (updated)
- `storage/templates/normalized-docx/BM-194/BM-194_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-195/BM-195_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-196/BM-196_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-197/BM-197_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-198/BM-198_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-199/BM-199_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-200/BM-200_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-201/BM-201_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-202/BM-202_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-203/BM-203_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-204/BM-204_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-205/BM-205_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-206/BM-206_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-207/BM-207_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-208/BM-208_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-209/BM-209_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-210/BM-210_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-211/BM-211_normalized.docx` (updated)
- `storage/templates/normalized-docx/BM-212/BM-212_normalized.docx` (updated)
- `docs/audit/docx/contracts/locked/__lock-mapping.json` files (19 forms updated)
- `docs/audit/docx/reports/FORM-RUNTIME-READINESS.md` (regenerated)
- `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` (regenerated)
