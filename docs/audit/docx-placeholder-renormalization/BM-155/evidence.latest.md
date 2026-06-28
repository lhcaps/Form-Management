# BM-155 Path-Domain Binding Evidence

Mode: EVIDENCE_ONLY
Render gate: PASS
Candidates: 0
Deferred: 13

| Path | Raw pattern | Context | Classification |
|---|---|---|---|
| `agency.diaDanh` | `{{document.field4}}` | Nhận thấy{{document.field3}}{{document.field4}}{{document.field5}}., | DEFER_LABEL_ONLY_WEAK_EVIDENCE |
| `document.chuThe` | `{{document.field7}}` | {{document.field7}} | DEFER_NO_VISIBLE_LABEL |
| `document.dieu1` | `{{document.field15}}` | Điều 2. Xử lý{{document.field15}} | DEFER_SOURCE_POLICY_CONFLICT |
| `document.dieu2` | `{{document.field16}}` | - 16{{document.field16}} | DEFER_NO_VISIBLE_LABEL |
| `document.lyDo` | `{{person.field14}}` | {{person.field11}}{{person.field12}}{{person.field13}}{{person.field14}} | DEFER_NO_VISIBLE_LABEL |
| `document.ngayBan` | `{{document.field5}}` | Nhận thấy{{document.field3}}{{document.field4}}{{document.field5}}., | DEFER_REQUIRES_HUMAN_DOCX_REVIEW |
| `document.ngayQd` | `{{person.field11}}` | {{person.field11}}{{person.field12}}{{person.field13}}{{person.field14}} | DEFER_NO_VISIBLE_LABEL |
| `document.soQd` | `{{document.field10}}` | Nơi tạm trú: {{document.field10}} | DEFER_PATH_DOMAIN_MISMATCH |
| `document.soQuyet` | `{{document.field3}}` | Nhận thấy{{document.field3}}{{document.field4}}{{document.field5}}., | DEFER_REQUIRES_HUMAN_DOCX_REVIEW |
| `document.tenVu` | `{{person.field13}}` | {{person.field11}}{{person.field12}}{{person.field13}}{{person.field14}} | DEFER_NO_VISIBLE_LABEL |
| `legalBasis.canCu` | `{{document.field8}}` | {{document.field8}} | DEFER_NO_VISIBLE_LABEL |
| `person.tenBi` | `{{person.field12}}` | {{person.field11}}{{person.field12}}{{person.field13}}{{person.field14}} | DEFER_NO_VISIBLE_LABEL |
| `recipients.noiNhan` | `{{document.field17}}` | {{document.field17}} | DEFER_NO_VISIBLE_LABEL |
