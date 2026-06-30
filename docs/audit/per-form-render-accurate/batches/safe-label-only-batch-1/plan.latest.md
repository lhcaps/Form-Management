# Safe Label Only Batch 1 - Field-Level Plan

Generated: 2026-06-27T16:58:39.496Z

## Decision

Approval token: none. No AUTO_SAFE_APPROVABLE changes should be applied from this plan.

No apply was performed by this refresh script.

## Current Baseline

| Metric | Value |
|--------|-------|
| Total issues | 1559 |
| FAIL | 1218 |
| REVIEW | 341 |
| BAD_LABEL | 373 |
| UI_VISIBLE_BAD_METADATA | 24 |

## Summary

| Bucket | Fields |
|--------|--------|
| AUTO_SAFE_APPROVABLE | 0 |
| REVIEW_NEEDED | 3 |
| BLOCKED | 351 |
| EXCLUDED_CLOSED | 0 |
| EXCLUDED_KEEP_DEFERRED | 19 |

## Expected Delta If AUTO_SAFE Only Is Approved

| Issue | Delta |
|-------|-------|
| BAD_LABEL | 0 |
| UI_VISIBLE_BAD_METADATA | 0 |

## Guard Checks

| Check | Pass |
|-------|------|
| noKeepDeferredInAutoSafe | YES |
| noReviewNeededInAutoSafe | YES |
| noBlockedIssueCodeInAutoSafe | YES |
| allAutoSafeTargetsCanonicalLabels | YES |
| allAutoSafeHaveExactOldAndNewLabels | YES |
| runnerDeepDiffGuardPresent | YES |
| clean | YES |

## AUTO_SAFE_APPROVABLE

No fields currently qualify under the conservative field-level guard.

## REVIEW_NEEDED

| BM | Path | Old label | Suggested label | Issues | Reason |
|----|------|-----------|-----------------|--------|--------|
| BM-003 | `document.issuePlaceAndDateLine` | issuePlaceAndDateLine |  | BAD_LABEL, UI_VISIBLE_BAD_METADATA | root-cause audit requires human review; no audited suggestedLabel is available; path is legal/signature/recipient/date/header sensitive |
| BM-003 | `recipients.archiveLine` | archiveLine |  | BAD_LABEL, UI_VISIBLE_BAD_METADATA | root-cause audit requires human review; no audited suggestedLabel is available; path is legal/signature/recipient/date/header sensitive |
| BM-003 | `recipients.primaryLine` | primaryLine |  | BAD_LABEL, UI_VISIBLE_BAD_METADATA | root-cause audit requires human review; no audited suggestedLabel is available; path is legal/signature/recipient/date/header sensitive |

## BLOCKED

| BM | Path | Old label | Suggested label | Issues | Reason |
|----|------|-----------|-----------------|--------|--------|
| BM-004 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-004 | `document.vietTat` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-013 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-013 | `agency.tenCo` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-013 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH |
| BM-013 | `document.soVan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-013 | `document.vietTat` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-021 | `agency.issuePlace` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-021 | `decision.decisionLine` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-021 | `decision.summaryLine` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-024 | `document.issuePlaceAndDateLine` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-025 | `agency.issuePlace` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-027 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-027 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-027 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-027 | `document.soThong` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-028 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-028 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-028 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-028 | `document.ngayQd` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH |
| BM-028 | `document.soQd` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH |
| BM-028 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-028 | `legalBasis.canCu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH |
| BM-029 | `agency.tenCo` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-029 | `document.vietTat` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-032 | `agency.issuePlace` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-036 | `recipients.archiveLine` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-036 | `recipients.personLine` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `document.canCu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-048 | `legalBasis.canCu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-049 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-050 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-050 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-051 | `decision.decisionLine3` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-052 | `decision.decisionLine2` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-052 | `document.fullDocumentCode2` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-060 | `decision.decisionLine10` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-062 | `decision.decisionLine` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-062 | `decision.decisionLine11` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-066 | `decision.decisionLine` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION |
| BM-066 | `document.fullDocumentCode4` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-072 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-072 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-074 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-074 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-074 | `document.soYeu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-076 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-076 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION, SOURCE_MISMATCH |
| BM-076 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-076 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-078 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-078 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-078 | `document.soThong` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-080 | `legalBasis.legalBasisLine` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-080 | `person.currentAddress` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-080 | `person.dateOfBirth` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | co-occurring blocker issue(s): REMEDIATION_LEAK |
| BM-081 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-081 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-083 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-083 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-083 | `document.soYeu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-084 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-084 | `document.dienThoai` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `agency.coQuan` | Ô trống | Cơ quan ra quyết định đề nghị phê chuẩn | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `document.chuThe` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-087 | `legalBasis.canCu` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-088 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-088 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-091 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-091 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-092 | `agency.diaDanh` | Ô trống | Địa điểm, ngày lập văn bản | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | root-cause audit suggests a path change, not label-only; co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-092 | `document.ngayBan` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| BM-092 | `document.soQuyet` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | co-occurring blocker issue(s): GENERIC_FIELD_CANONICALIZATION |
| ... | ... | ... | ... | ... | 271 more in JSON |

## EXCLUDED_KEEP_DEFERRED

| BM | Path | Old label | Suggested label | Issues | Reason |
|----|------|-----------|-----------------|--------|--------|
| BM-061 | `recipients.personLine3` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-063 | `document.issuePlaceAndDateLine` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | BM/path is on KEEP_DEFERRED closure track |
| BM-063 | `recipients.personLine5` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-065 | `decision.decisionLine` | Ô trống |  | BAD_LABEL, COMPILED_DRIFT, GENERIC_FIELD_CANONICALIZATION | BM/path is on KEEP_DEFERRED closure track |
| BM-065 | `document.fullDocumentCode8` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-065 | `recipients.personLine3` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-067 | `document.fullDocumentCode2` | Ô trống |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION | BM/path is on KEEP_DEFERRED closure track |
| BM-067 | `document.fullDocumentCode6` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-067 | `recipients.personLine3` | Slot from DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK | BM/path is on KEEP_DEFERRED closure track |
| BM-069 | `decision.decisionLine` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-069 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, REQUIRED_SUSPICIOUS, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-069 | `document.reasonLine` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-069 | `document.reasonLine2` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-069 | `document.summaryLine` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-075 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, REQUIRED_SUSPICIOUS, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-075 | `person.currentAddress` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-075 | `person.dateOfBirth` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, REMEDIATION_LEAK, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-077 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, REQUIRED_SUSPICIOUS, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |
| BM-082 | `document.fullDocumentCode` | Slot from Wave 02 DOCX remediation |  | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION, REMEDIATION_LEAK, REQUIRED_SUSPICIOUS, UI_VISIBLE_BAD_METADATA | BM/path is on KEEP_DEFERRED closure track |

## EXCLUDED_CLOSED

None.
