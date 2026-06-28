# BM-136 Human Review Blocker

**Template:** BM-136 - BB đối chất
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO

## Render Gate

Render gate is PASS. BM-136 is blocked for semantic/path-domain review, not render execution.

## Deferred Items

| Path | Raw pattern | Context | Classification |
|---|---|---|---|
| `agency.diaDanh` | `{{document.field8}}` | {{document.field8}} | DEFER_NO_VISIBLE_LABEL |
| `agency.dongDia` | `{{person.field10}}` | {{person.field10}}{{person.field11}} | DEFER_NO_VISIBLE_LABEL |
| `document.chuThe` | `{{person.field11}}` | {{person.field10}}{{person.field11}} | DEFER_NO_VISIBLE_LABEL |
| `document.lyDo` | `{{document.field17}}` | Nơi tạm trú: {{document.field17}} | DEFER_PATH_DOMAIN_MISMATCH |
| `document.ngayBan` | `{{document.field9}}` | Nơi tạm trú: {{document.field9}} | DEFER_PATH_DOMAIN_MISMATCH |
| `document.soQuyet` | `{{document.field7}}` | {{document.field7}} | DEFER_NO_VISIBLE_LABEL |
| `document.soTien` | `{{document.field16}}` | {{document.field16}} | DEFER_NO_VISIBLE_LABEL |
| `document.tenVu` | `{{document.field14}}` | {{document.field14}} | DEFER_NO_VISIBLE_LABEL |
| `person.tenBi` | `{{document.field12}}` | Tư cách tham gia tố tụng:{{document.field12}} | DEFER_PATH_DOMAIN_MISMATCH |
| `person.toiDanh` | `{{document.field15}}` | {{document.field15}} | DEFER_NO_VISIBLE_LABEL |
| `recipients.luuHo` | `{{person.field18}}` | {{person.field18}}{{person.field19}} | DEFER_NO_VISIBLE_LABEL |
| `signature.cheDo` | `{{person.field19}}` | {{person.field18}}{{person.field19}} | DEFER_NO_VISIBLE_LABEL |
| `signature.chucVu` | `{{document.field20}}` | Tư cách tham gia tố tụng:{{document.field20}} | DEFER_PATH_DOMAIN_MISMATCH |
| `signature.nguoiKy` | `{{document.field21}}` | 3.{{document.field21}} | DEFER_NO_VISIBLE_LABEL |

## Required Review

- Confirm official labels and semantic paths for each generic field.
- Split any approved changes into a separate apply task with exact path-level decisions.
- Do not mark BM-136 DONE until semantic blockers are resolved.
