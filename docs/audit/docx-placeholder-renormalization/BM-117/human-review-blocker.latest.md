# BM-117 Human Review Blocker

**Template:** BM-117 - QĐ phục hồi điều tra bị can
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO

## Render Gate

Render gate is PASS. BM-117 is blocked for semantic/path-domain review, not render execution.

## Deferred Items

| Path | Raw pattern | Context | Classification |
|---|---|---|---|
| `agency.diaDanh` | `{{document.field4}}` | Xét thấy9 {{document.field4}} | DEFER_LABEL_ONLY_WEAK_EVIDENCE |
| `agency.dongDia` | `{{document.field7}}` | {{document.field7}} | DEFER_NO_VISIBLE_LABEL |
| `document.chuThe` | `{{document.field8}}` | {{document.field8}} | DEFER_NO_VISIBLE_LABEL |
| `document.donVi` | `{{document.field13}}` | 12{{document.field13}} | DEFER_NO_VISIBLE_LABEL |
| `document.ngayBan` | `{{document.field6}}` | {{document.field6}} | DEFER_NO_VISIBLE_LABEL |
| `document.ngayQd` | `{{document.field12}}` | - 11{{document.field12}} | DEFER_NO_VISIBLE_LABEL |
| `document.soQd` | `{{document.field11}}` | Nơi tạm trú: {{document.field11}} | DEFER_PATH_DOMAIN_MISMATCH |
| `document.soQuyet` | `{{legalBasis.field3}}` | Căn cứ Quyết định đình chỉ điều tra bị can số … ngày … tháng … năm … của8… đối với7{{legalBasis.field3}}; | DEFER_SOURCE_POLICY_CONFLICT |
| `document.tenVu` | `{{document.field9}}` | Nơi thường trú: {{document.field9}}{{document.field10}} | DEFER_PATH_DOMAIN_MISMATCH |
| `person.toiDanh` | `{{document.field10}}` | Nơi thường trú: {{document.field9}}{{document.field10}} | DEFER_PATH_DOMAIN_MISMATCH |

## Required Review

- Confirm official labels, source policy, and semantic paths for each generic field.
- Split any approved changes into a separate apply task with exact path-level decisions.
- Do not mark BM-117 DONE until semantic blockers are resolved.
