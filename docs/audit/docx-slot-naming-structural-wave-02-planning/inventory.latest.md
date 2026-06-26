# DOCX Slot Naming / Structural Remediation — Wave 02 Planning

Generated: 2026-06-26T13:57:59.721Z
Mode: **PLANNING ONLY** — no files mutated

## Root Cause

| Metric | Value |
|--------|------:|
| Total root-cause issues | 3441 |
| BAD_LABEL | 432 |
| UI_VISIBLE_BAD_METADATA | 77 |

## BAD_LABEL Breakdown

| Label | Count | Contracts | Sources | Sample Paths |
|-------|------:|--------:|---------|--------------|
| `Ô trống` | 340 | 86 | manual, agencyConfig, computed, systemDate | `document.vietTat, agency.diaDanh` |
| `Slot from Wave 02 DOCX remediation` | 57 | 9 | manual | `document.fullDocumentCode, document.issueDate` |
| `Slot from DOCX remediation` | 16 | 10 | manual | `decision.decisionLine3, decision.decisionLine2` |
| `archiveLine` | 3 | 3 | manual | `recipients.archiveLine` |
| `issuePlaceAndDateLine` | 2 | 2 | systemDate | `document.issuePlaceAndDateLine` |
| `primaryLine` | 2 | 2 | manual | `recipients.primaryLine` |
| `identityIssuedDay` | 1 | 1 | manual | `informant.identityIssuedDay` |
| `identityIssuedMonth` | 1 | 1 | manual | `informant.identityIssuedMonth` |
| `identityIssuedYear` | 1 | 1 | manual | `informant.identityIssuedYear` |
| `representedOrganization` | 1 | 1 | manual | `informant.representedOrganization` |
| `receivedDateLine` | 1 | 1 | systemDate | `sourceReport.receivedDateLine` |
| `genderText` | 1 | 1 | manual | `reporter.genderText` |
| `otherName` | 1 | 1 | manual | `reporter.otherName` |
| `birthDateLine` | 1 | 1 | systemDate | `reporter.birthDateLine` |
| `identityIssueDateLine` | 1 | 1 | systemDate | `reporter.identityIssueDateLine` |
| `organizationRepresentative` | 1 | 1 | manual | `reporter.organizationRepresentative` |
| `content` | 1 | 1 | manual | `sourceReport.content` |
| `procedureArticlesLine` | 1 | 1 | officialConfig | `legalBasis.procedureArticlesLine` |

## Lane Classification

| Lane | Count | Fixability | Risk | Description |
|------|------:|------------|------|-------------|
| A_O_TRONG_SLOT | 340 | DOCX_AUTHORING_ONLY | high | Blank placeholder label. Requires DOCX authoring to add actu |
| B_WAVE_02_GENERIC_SLOT | 57 | DOCX_AUTHORING_ONLY | high | Wave 02 structural leftover. Requires DOCX Wave 02 remediati |
| C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT | 16 | DOCX_AUTHORING_ONLY | high | Prior remediation generic slot. Requires DOCX authoring to r |
| D_DOCUMENT_LINE_METADATA | 11 | DOCX_AUTHORING_OR_METADATA | medium | Document metadata line. May be fixable via DOCX or metadata  |
| E_LEGAL_OR_PROCEDURAL_AMBIGUOUS | 0 | LEGAL_REVIEW | high | Legal/procedural domain. Requires human legal review before  |
| F_TRUE_SAFE_STRUCTURAL_RENAME | 0 | METADATA_OR_DOCX | low | Low-risk unambiguous structural rename. May be safe for meta |
| G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW | 8 | ORIGINAL_DOCX_REVIEW | medium | Needs original DOCX review to determine the correct label. |
| H_DO_NOT_FIX_NOISE_OR_DERIVED | 0 | DO_NOT_FIX | low | Noise or derived field. Do not fix. |

## Top 30 Affected BMs

| # | BM | Total | A_O_TRONG | B_WAVE02 | C_DOCX_REMED | D_DOC_LINE | E_LEGAL | F_SAFE | G_DEFER | H_NOISE |
|---|----|------:|--------:|---------:|------------:|-----------:|--------:|-------:|-------:|-------:|
| 1 | BM-096 | **16** | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | BM-136 | **14** | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | BM-155 | **13** | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | BM-068 | **12** | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | BM-069 | **12** | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | BM-117 | **10** | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | BM-118 | **10** | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | BM-163 | **10** | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | BM-002 | **10** | 0 | 0 | 0 | 6 | 0 | 0 | 4 | 0 |
| 10 | BM-106 | **9** | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | BM-126 | **9** | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | BM-028 | **7** | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | BM-134 | **7** | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | BM-135 | **7** | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 15 | BM-152 | **7** | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | BM-162 | **7** | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 |
| 17 | BM-048 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | BM-087 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 19 | BM-127 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | BM-129 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 21 | BM-130 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 22 | BM-138 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 23 | BM-161 | **6** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 24 | BM-080 | **6** | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| 25 | BM-013 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 26 | BM-114 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 27 | BM-115 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 28 | BM-128 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 29 | BM-131 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 30 | BM-133 | **5** | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Fixability Summary

| Fixability | Count | Lane(s) |
|------------|------:|----------|
| DOCX authoring only | 413 | A, B, C |
| DOCX authoring or metadata | 11 | D |
| Legal review required | 0 | E |
| Low-risk safe rename | 0 | F |
| Original DOCX review required | 8 | G |
| Do not fix | 0 | H |

## Safety

| Check | Result |
|-------|--------|
| Locked contracts mutated | **false** |
| DOCX touched | **false** |
| Compiled artifacts hand-edited | **false** |
| Source/path/binding changed | **false** |
