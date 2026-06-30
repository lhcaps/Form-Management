# BM-096 Signature Group Evidence Plan

**Task**: BM096_SIGNATURE_GROUP_DOCX_EVIDENCE_EXTRACTION
**Mode**: EVIDENCE_ONLY
**Generated**: 2026-06-27T21:21:52.066Z
**Status**: READY_FOR_PLANNER_REVIEW

## Classification Summary

- **DEFER_PATH_DOMAIN_MISMATCH**: 3

## Field Evidence

### signature.cheDo

| Property | Value |
|----------|-------|
| label | Ô trống |
| rawPattern | {{document.field17}} |
| rawDomain | document |
| textBefore | Nơi thường trú: |
| context | Nơi thường trú: {{document.field17}}{{document.field18}} |
| visibleVietnamesePhrase | Nơi thường trú |
| proposedSemanticMeaning | person.permanentAddress or person.permanentAddressLine (permanent residence address) |
| proposedTargetPath | - |
| issueCodes | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION |
| classification | **DEFER_PATH_DOMAIN_MISMATCH** |
| confidence | MEDIUM |
| exactValueAssertion | CONFLICT (2 other BMs) |
| collisionCheck | NO COLLISION |
| approved | false |
| canApplyRunNow | false |

**Notes**: Visible Vietnamese phrase 'Nơi thường trú' clearly indicates person address semantics (Nơi thường trú = permanent residence), but current path is under signature.*. Cannot safely determine exact target person.* path without cross-BM inference. DEFER for legal review.

**Context window**: "Nơi thường trú:{{document.field17}}{{document.field18}}"

**200 chars before**: "Nơi thường trú:"

**200 chars after**: "{{document.field18}}"

### signature.chucVu

| Property | Value |
|----------|-------|
| label | Ô trống |
| rawPattern | {{document.field18}} |
| rawDomain | document |
| textBefore | Nơi thường trú: {{document.field17}} |
| context | Nơi thường trú: {{document.field17}}{{document.field18}} |
| visibleVietnamesePhrase | Nơi thường trú document field |
| proposedSemanticMeaning | person.permanentAddress or person.permanentAddressLine (permanent residence address) |
| proposedTargetPath | - |
| issueCodes | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION |
| classification | **DEFER_PATH_DOMAIN_MISMATCH** |
| confidence | MEDIUM |
| exactValueAssertion | CLEAN (no other BM refs) |
| collisionCheck | NO COLLISION |
| approved | false |
| canApplyRunNow | false |

**Notes**: Visible Vietnamese phrase 'Nơi thường trú document field' clearly indicates person address semantics (Nơi thường trú = permanent residence), but current path is under signature.*. Cannot safely determine exact target person.* path without cross-BM inference. DEFER for legal review.

**Context window**: "Nơi thường trú: {{document.field17}}{{document.field18}}"

**200 chars before**: "Nơi thường trú: {{document.field17}}"

**200 chars after**: ""

### signature.nguoiKy

| Property | Value |
|----------|-------|
| label | Ô trống |
| rawPattern | {{document.field19}} |
| rawDomain | document |
| textBefore | Nơi tạm trú: |
| context | Nơi tạm trú: {{document.field19}} |
| visibleVietnamesePhrase | Nơi tạm trú |
| proposedSemanticMeaning | person.permanentAddress or person.permanentAddressLine (permanent residence address) |
| proposedTargetPath | - |
| issueCodes | BAD_LABEL, GENERIC_FIELD_CANONICALIZATION |
| classification | **DEFER_PATH_DOMAIN_MISMATCH** |
| confidence | MEDIUM |
| exactValueAssertion | CLEAN (no other BM refs) |
| collisionCheck | NO COLLISION |
| approved | false |
| canApplyRunNow | false |

**Notes**: Visible Vietnamese phrase 'Nơi tạm trú' clearly indicates person address semantics (Nơi thường trú = permanent residence), but current path is under signature.*. Cannot safely determine exact target person.* path without cross-BM inference. DEFER for legal review.

**Context window**: "Nơi tạm trú:{{document.field19}}"

**200 chars before**: "Nơi tạm trú:"

**200 chars after**: ""

## Safety Assertions

```json
{
  "noLockedContractMutation": true,
  "noCompiledV2Mutation": true,
  "noDbPublish": true,
  "noCrossBmEvidence": true,
  "noApprovedDecisions": true,
  "noApplyRunnerCreated": true,
  "directDocxEvidenceOnly": true,
  "rawPatternEmptyGuard": true,
  "placeholderOnlyTextBeforeGuard": true,
  "labelDomainMismatchGuard": true,
  "canApplyRunNow": false
}
```

## Planner Decision Needed

DEFER_MANUAL_LEGAL_REVIEW for all 3 fields. Evidence is compelling (address semantics under signature.*) but legal/form semantics require human domain expert. No apply action should be taken.

**Next candidate**: NONE - all fields DEFERRED