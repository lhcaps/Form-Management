# C3-PREP — Source Remediation Proposal

Generated: 2026-06-25T14:23:17.544Z

## Scope

| Metric | Value |
|--------|-------|
| Contracts scanned | 213 |
| Invalid source fields | 115 |
| Binding review items | 1 |
| **Total issues** | **116** |

## By Original Source

| Original Source | Count |
|----------------|-------|
| constantFromDocx | 90 |
| derived | 9 |
| unknown | 16 |
| bindingReview (BM-021) | 1 |

## By Proposed Source

| Proposed Source | Count |
|----------------|-------|
| officialConfig | 66 |
| computed | 37 |
| manual | 12 |

## Confidence

| Level | Count |
|-------|-------|
| HIGH | 80 |
| MEDIUM | 35 |
| LOW | 0 |

## BM-021 Proposals

| path | originalSource | proposedSource | confidence | reason |
|------|---------------|----------------|------------|--------|
| agency.parentNameUpper | constantFromDocx | computed | HIGH | Uppercase transform of agency.parentName; computed from agency config, not manual input. |
| agency.nameUpper | derived | computed | HIGH | Uppercase transform of agency.name; computed from agency config, not user input. |
| agency.issuePlace | constantFromDocx | computed | HIGH | Derived from agency config; place of issue is not a free-form manual field. |
| legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | Source is constantFromDocx; treating as officialConfig (fixed legal/official text). User review recommended for document types not covered by naming patterns. |
| decision.summaryLine | constantFromDocx | computed | HIGH | Summary line derived from decision data; not a user-typed fixed text. |

### F4 Binding Review

Status: **REVIEW_REQUIRED**

- 1 non-required placeholder(s) left unreplaced: {{agency.nameUpper}}. These fields are not required/editable/manual and the mock did not fill them.

**Remediation note:** `agency.nameUpper` (proposedSource=computed) maps to the uppercase of the agency name. This is a 
`derived` field that should be classified as `computed` in the locked contract JSON. The F4 review item will clear automatically once the source is corrected to `computed`.

## All Proposals

| templateCode | path | originalSource | proposedSource | confidence | required |
|--------------|------|---------------|----------------|------------|----------|
| BM-003 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-005 | sourceVerification.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-007 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-009 | sourceResolutionExtension.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-011 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-014 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-016 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-017 | caseInitiationRequest.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-018 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-021 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-021 | agency.nameUpper | derived | computed | HIGH | no |
| BM-021 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-021 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | no |
| BM-021 | decision.summaryLine | constantFromDocx | computed | HIGH | no |
| BM-022 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-023 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-024 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-024 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-025 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-025 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-026 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-030 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-032 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-032 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-033 | agency.parentNameUpper | constantFromDocx | computed | HIGH | yes |
| BM-033 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-034 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-034 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-035 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-036 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-036 | document.issueDate | derived | computed | HIGH | no |
| BM-036 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | no |
| BM-036 | decision.summaryLine | constantFromDocx | computed | HIGH | no |
| BM-037 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-037 | accusedDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-038 | agency.parentNameUpper | constantFromDocx | computed | HIGH | yes |
| BM-038 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-039 | agency.parentNameUpper | constantFromDocx | computed | HIGH | yes |
| BM-039 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-040 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-040 | accusedDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-041 | agency.parentNameUpper | constantFromDocx | computed | HIGH | no |
| BM-041 | agency.issuePlace | constantFromDocx | computed | HIGH | no |
| BM-044 | agency.parentNameUpper | constantFromDocx | computed | HIGH | yes |
| BM-044 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-045 | agency.parentNameUpper | constantFromDocx | computed | HIGH | yes |
| BM-045 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-046 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-047 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-051 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-052 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-052 | document.fullDocumentCode2 | unknown | manual | HIGH | no |
| BM-055 | accusedDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-058 | document.issuePlaceAndDateLine | derived | computed | HIGH | yes |
| BM-058 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-058 | legalBasis.juvenileJusticeLine | constantFromDocx | officialConfig | HIGH | no |
| BM-058 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-058 | accusedDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-058 | measure.detentionArticle1Line | constantFromDocx | officialConfig | HIGH | yes |
| BM-058 | person.dateOfBirthText | derived | computed | HIGH | yes |
| BM-058 | measure.detentionFromDateText | derived | computed | HIGH | yes |
| BM-058 | measure.detentionToDateText | derived | computed | HIGH | yes |
| BM-058 | measure.detentionArticle2Line | constantFromDocx | officialConfig | HIGH | yes |
| BM-059 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-059 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-059 | accusedDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-060 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-061 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-062 | decision.decisionLine | unknown | computed | HIGH | no |
| BM-062 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-063 | document.issuePlaceAndDateLine | unknown | computed | HIGH | no |
| BM-063 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-064 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-065 | decision.decisionLine | unknown | computed | HIGH | no |
| BM-065 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-066 | decision.decisionLine | unknown | computed | HIGH | no |
| BM-066 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-067 | document.fullDocumentCode | unknown | manual | HIGH | no |
| BM-067 | document.fullDocumentCode2 | unknown | manual | HIGH | no |
| BM-085 | caseInvestigationTransfer.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-086 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-090 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-090 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-097 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-097 | caseDecision.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-103 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-104 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-104 | investigationRecovery.legalBasisLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-126 | decision.summaryLine | constantFromDocx | computed | HIGH | no |
| BM-141 | prosecutionTransfer.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-144 | prosecutionExtension.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-145 | prosecutionSupplementReturn.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-146 | prosecutionCaseSuspension.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-148 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-150 | prosecutionCaseTermination.procedureArticlesLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-156 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-156 | caseJoinder.legalBasisLine | constantFromDocx | officialConfig | HIGH | no |
| BM-156 | caseRecovery.legalBasisLine | constantFromDocx | officialConfig | HIGH | no |
| BM-156 | investigationConclusion.legalBasisLine | constantFromDocx | officialConfig | HIGH | no |
| BM-156 | indictment.summaryConclusionLine | constantFromDocx | officialConfig | HIGH | yes |
| BM-156 | indictment.article1Line | constantFromDocx | officialConfig | HIGH | yes |
| BM-156 | indictment.replacementLine | constantFromDocx | officialConfig | HIGH | no |
| BM-159 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-159 | subordinateProcuracyTrialAssignment.article1Line | constantFromDocx | officialConfig | HIGH | yes |
| BM-166 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-169 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-170 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-171 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-172 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-173 | legalBasis.procedureArticlesLine | constantFromDocx | officialConfig | MEDIUM | yes |
| BM-213 | document.issuePlaceAndDateLine | derived | computed | HIGH | yes |
| BM-213 | person.dateOfBirthText | derived | computed | HIGH | yes |
| BM-213 | person.identityIssueLine | derived | computed | HIGH | no |
| BM-213 | juvenileProtection.article1Line | constantFromDocx | officialConfig | HIGH | yes |
| BM-213 | juvenileProtection.article2Line | constantFromDocx | officialConfig | HIGH | yes |

## Heuristic Rules Applied

| Pattern | Proposed Source | Confidence |
|---------|----------------|------------|
| constantFromDocx + legalBasis.*Line | officialConfig | HIGH |
| constantFromDocx + agency.*Upper | computed | HIGH |
| constantFromDocx + agency.issuePlace | computed | HIGH |
| constantFromDocx + decision.summaryLine | computed | HIGH |
| constantFromDocx + caseDecision.*Line | officialConfig | HIGH |
| constantFromDocx + accusedDecision.*Line | officialConfig | HIGH |
| constantFromDocx + indictment.*Line | officialConfig | HIGH |
| constantFromDocx + juvenileProtection.*Line | officialConfig | HIGH |
| constantFromDocx + measure.detentionArticle*Line | officialConfig | HIGH |
| constantFromDocx + other *Line patterns | officialConfig | MEDIUM |
| derived + nameUpper | computed | HIGH |
| derived + date patterns | computed | HIGH |
| derived + *Line patterns | computed | HIGH |
| unknown + document.*Code* | manual | HIGH |
| unknown + decision.decisionLine | computed | HIGH |
| unknown + issuePlaceAndDateLine | computed | HIGH |
| unknown + other patterns | manual | LOW |

## Next Steps

1. **User review** this proposal — especially LOW confidence items.
2. If approved, run **C3-APPLY** to patch locked contract JSON files.
3. After C3-APPLY, re-run `pnpm audit:docx-fidelity` to confirm no regressions.
4. Verify F4 binding correctness: BM-021 should no longer appear as REVIEW_REQUIRED.
