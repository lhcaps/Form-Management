# BM-050 Focus Analysis

**Template Code:** BM-050
**Classification:** LOCKED_CONTRACT_EVIDENCE_INCONSISTENT
**Issues:** 16

## Issues

### [HIGH] OTRONG_AUTOAPPROVED — docxSlot
- **slotId:** agency.coQuan
- **label:** Ô trống
- **reason:** docxSlot "agency.coQuan" has label "Ô trống" with reviewRequired=false — was auto-approved without human review
### [HIGH] OTRONG_AUTOAPPROVED — docxSlot
- **slotId:** agency.diaDanh
- **label:** Ô trống
- **reason:** docxSlot "agency.diaDanh" has label "Ô trống" with reviewRequired=false — was auto-approved without human review
### [HIGH] OTRONG_AUTOAPPROVED — canonicalField
- **path:** agency.coQuan
- **label:** Ô trống
- **reason:** canonicalField "agency.coQuan" has label "Ô trống" with reviewRequired=false
### [HIGH] OTRONG_AUTOAPPROVED — canonicalField
- **path:** agency.diaDanh
- **label:** Ô trống
- **reason:** canonicalField "agency.diaDanh" has label "Ô trống" with reviewRequired=false
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.evidence.rawPattern
- **slotId:** agency.tenVien
- **expected:** {{agency.tenVien}}
- **actual:** {{document.field1}}
- **reason:** docxSlot "agency.tenVien" evidence.rawPattern="{{document.field1}}" ≠ slotId (expected "{{agency.tenVien}}")
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.reviewEvidence.rawPattern
- **slotId:** agency.tenVien
- **expected:** {{agency.tenVien}}
- **actual:** {{document.field1}}
- **reason:** docxSlot "agency.tenVien" reviewEvidence.rawPattern="{{document.field1}}" ≠ slotId (expected "{{agency.tenVien}}")
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.evidence.rawPattern
- **slotId:** agency.coQuan
- **expected:** {{agency.coQuan}}
- **actual:** {{decision.field2}}
- **reason:** docxSlot "agency.coQuan" evidence.rawPattern="{{decision.field2}}" ≠ slotId (expected "{{agency.coQuan}}")
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.reviewEvidence.rawPattern
- **slotId:** agency.coQuan
- **expected:** {{agency.coQuan}}
- **actual:** {{decision.field2}}
- **reason:** docxSlot "agency.coQuan" reviewEvidence.rawPattern="{{decision.field2}}" ≠ slotId (expected "{{agency.coQuan}}")
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.evidence.rawPattern
- **slotId:** agency.diaDanh
- **expected:** {{agency.diaDanh}}
- **actual:** {{document.field3}}
- **reason:** docxSlot "agency.diaDanh" evidence.rawPattern="{{document.field3}}" ≠ slotId (expected "{{agency.diaDanh}}")
### [HIGH] RAW_PATTERN_MISMATCH — docxSlot.reviewEvidence.rawPattern
- **slotId:** agency.diaDanh
- **expected:** {{agency.diaDanh}}
- **actual:** {{document.field3}}
- **reason:** docxSlot "agency.diaDanh" reviewEvidence.rawPattern="{{document.field3}}" ≠ slotId (expected "{{agency.diaDanh}}")
### [MEDIUM] AUTO_GENERATED_AUTOAPPROVED — docxSlot
- **slotId:** agency.tenVien
- **reason:** docxSlot "agency.tenVien" has [Auto-generated] context with reviewRequired=false
### [MEDIUM] AUTO_GENERATED_AUTOAPPROVED — docxSlot
- **slotId:** agency.coQuan
- **reason:** docxSlot "agency.coQuan" has [Auto-generated] context with reviewRequired=false
### [MEDIUM] AUTO_GENERATED_AUTOAPPROVED — docxSlot
- **slotId:** agency.diaDanh
- **reason:** docxSlot "agency.diaDanh" has [Auto-generated] context with reviewRequired=false
### [HIGH] FORM_INPUT_HINTS_STALE — formInputHints.suggestedControls
- **path:** document.field1
- **control:** text
- **reason:** formInputHints suggests "document.field1" not in canonicalFields — stale post-semanticization
### [HIGH] FORM_INPUT_HINTS_STALE — formInputHints.suggestedControls
- **path:** decision.field2
- **control:** text
- **reason:** formInputHints suggests "decision.field2" not in canonicalFields — stale post-semanticization
### [HIGH] FORM_INPUT_HINTS_STALE — formInputHints.suggestedControls
- **path:** document.field3
- **control:** text
- **reason:** formInputHints suggests "document.field3" not in canonicalFields — stale post-semanticization