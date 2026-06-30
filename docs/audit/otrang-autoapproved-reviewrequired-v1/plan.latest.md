# Ô Trống Auto-Approved → ReviewRequired=True Plan

## Task
`OTRONG_AUTOAPPROVED_REVIEW_REQUIRED_BATCH_V1`

## Current State
- Git: clean
- C3 locked↔compiled: PASS 213/213
- C2 compiled↔DB: PASS 213/213
- canStartNonBlockedRemediation: YES

## Target Rule
`label === "Ô trống" && reviewRequired === false` → `reviewRequired = true`

## Scope
- Include: all BMs except BM-063, BM-066
- Exclude: BM-063, BM-066

## Results

### Candidates Found
- **Total fields needing change:** 675
- **BMs affected:** 86

### BMs Affected
- BM-004 (4 field(s))
- BM-013 (10 field(s))
- BM-021 (7 field(s))
- BM-022 (1 field(s))
- BM-024 (2 field(s))
- BM-025 (2 field(s))
- BM-026 (1 field(s))
- BM-027 (8 field(s))
- BM-028 (14 field(s))
- BM-029 (4 field(s))
- BM-032 (3 field(s))
- BM-034 (1 field(s))
- BM-035 (1 field(s))
- BM-036 (5 field(s))
- BM-041 (1 field(s))
- BM-048 (12 field(s))
- BM-049 (2 field(s))
- BM-050 (4 field(s))
- BM-052 (1 field(s))
- BM-072 (4 field(s))
- BM-074 (6 field(s))
- BM-076 (8 field(s))
- BM-078 (6 field(s))
- BM-081 (4 field(s))
- BM-083 (6 field(s))
- BM-084 (4 field(s))
- BM-087 (12 field(s))
- BM-088 (4 field(s))
- BM-091 (4 field(s))
- BM-092 (6 field(s))
- BM-093 (6 field(s))
- BM-094 (8 field(s))
- BM-095 (6 field(s))
- BM-096 (30 field(s))
- BM-098 (4 field(s))
- BM-099 (2 field(s))
- BM-100 (4 field(s))
- BM-101 (8 field(s))
- BM-102 (8 field(s))
- BM-105 (6 field(s))
- BM-106 (18 field(s))
- BM-107 (4 field(s))
- BM-108 (8 field(s))
- BM-109 (8 field(s))
- BM-110 (4 field(s))
- BM-111 (6 field(s))
- BM-112 (8 field(s))
- BM-113 (8 field(s))
- BM-114 (10 field(s))
- BM-115 (10 field(s))
- BM-116 (6 field(s))
- BM-117 (20 field(s))
- BM-118 (20 field(s))
- BM-119 (8 field(s))
- BM-120 (6 field(s))
- BM-121 (4 field(s))
- BM-122 (2 field(s))
- BM-123 (2 field(s))
- BM-125 (8 field(s))
- BM-126 (18 field(s))
- BM-127 (12 field(s))
- BM-128 (10 field(s))
- BM-129 (12 field(s))
- BM-130 (12 field(s))
- BM-131 (10 field(s))
- BM-132 (6 field(s))
- BM-133 (10 field(s))
- BM-134 (14 field(s))
- BM-135 (14 field(s))
- BM-136 (28 field(s))
- BM-137 (10 field(s))
- BM-138 (12 field(s))
- BM-140 (8 field(s))
- BM-142 (8 field(s))
- BM-143 (4 field(s))
- BM-147 (6 field(s))
- BM-149 (10 field(s))
- BM-151 (4 field(s))
- BM-152 (14 field(s))
- BM-153 (8 field(s))
- BM-154 (10 field(s))
- BM-155 (26 field(s))
- BM-157 (2 field(s))
- BM-158 (4 field(s))
- BM-160 (2 field(s))
- BM-161 (12 field(s))

### Skipped
- Already `reviewRequired: true`: 9
- Wrong `reviewRequired` value: 0
- Blocked BMs (BM-063, BM-066): 2

## Changes to Apply

| BM | File | Path | Before | After |
|----|------|------|--------|-------|
| BM-004 | BM-004__2775520fd22c.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-004 | BM-004__2775520fd22c.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-004 | BM-004__2775520fd22c.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-004 | BM-004__2775520fd22c.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-013 | BM-013__9a1f7d37fec9.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-021 | BM-021__772319486f41.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-022 | BM-022__13d342bdfc56.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-024 | BM-024__575a6d8e9173.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-024 | BM-024__575a6d8e9173.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-025 | BM-025__5dcf0eb7f481.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-025 | BM-025__5dcf0eb7f481.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-026 | BM-026__6e339663e320.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-027 | BM-027__7c207d24faee.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-028 | BM-028__e895e0889340.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-029 | BM-029__0bf65fba614a.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-029 | BM-029__0bf65fba614a.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-029 | BM-029__0bf65fba614a.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-029 | BM-029__0bf65fba614a.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-032 | BM-032__cce50086cd38.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-032 | BM-032__cce50086cd38.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-032 | BM-032__cce50086cd38.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-034 | BM-034__e02f842b6038.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-035 | BM-035__be0035952622.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-036 | BM-036__6f4466480a94.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-036 | BM-036__6f4466480a94.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-036 | BM-036__6f4466480a94.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-036 | BM-036__6f4466480a94.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-036 | BM-036__6f4466480a94.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-041 | BM-041__9a027eeceb3a.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-048 | BM-048__724a5a8b3421.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-049 | BM-049__798e9b21ce2e.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-049 | BM-049__798e9b21ce2e.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-050 | BM-050__2d31c941887e.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-050 | BM-050__2d31c941887e.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-050 | BM-050__2d31c941887e.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-050 | BM-050__2d31c941887e.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-052 | BM-052__9919ecdb3971.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-072 | BM-072__fadb53cde2cb.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-072 | BM-072__fadb53cde2cb.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-072 | BM-072__fadb53cde2cb.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-072 | BM-072__fadb53cde2cb.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-074 | BM-074__e7b3ef2ccb68.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-076 | BM-076__cd44ed3c7e5d.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-078 | BM-078__6845bd7e6cb1.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-081 | BM-081__232b8c1d66ae.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-081 | BM-081__232b8c1d66ae.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-081 | BM-081__232b8c1d66ae.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-081 | BM-081__232b8c1d66ae.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-083 | BM-083__71218955a7c2.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-084 | BM-084__c21e2b7fa5cc.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-084 | BM-084__c21e2b7fa5cc.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-084 | BM-084__c21e2b7fa5cc.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-084 | BM-084__c21e2b7fa5cc.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-087 | BM-087__80e8edb6b8b2.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-088 | BM-088__d9d213d94690.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-088 | BM-088__d9d213d94690.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-088 | BM-088__d9d213d94690.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-088 | BM-088__d9d213d94690.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-091 | BM-091__18a41431ecae.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-091 | BM-091__18a41431ecae.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-091 | BM-091__18a41431ecae.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-091 | BM-091__18a41431ecae.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-092 | BM-092__f8ca4bc8033d.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-093 | BM-093__7273ce5a66b8.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-094 | BM-094__12ad016b36d2.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-095 | BM-095__83c3c1ef212f.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[11].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[13].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[14].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[15].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[16].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `canonicalFields[17].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[11].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[13].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[14].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[15].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[16].reviewRequired` | `false` | `true` |
| BM-096 | BM-096__a50a08efa62f.contract.locked.json | `docxSlots[17].reviewRequired` | `false` | `true` |
| BM-098 | BM-098__949d75027001.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-098 | BM-098__949d75027001.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-098 | BM-098__949d75027001.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-098 | BM-098__949d75027001.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-099 | BM-099__ce4aa505a071.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-099 | BM-099__ce4aa505a071.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-100 | BM-100__a359d20c8fed.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-100 | BM-100__a359d20c8fed.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-100 | BM-100__a359d20c8fed.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-100 | BM-100__a359d20c8fed.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-101 | BM-101__2fe2187f4777.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-102 | BM-102__88bde5060df8.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-105 | BM-105__c83181e6b64b.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-106 | BM-106__7f44c9dd261a.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-107 | BM-107__9b3379af7cfe.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-107 | BM-107__9b3379af7cfe.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-107 | BM-107__9b3379af7cfe.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-107 | BM-107__9b3379af7cfe.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-108 | BM-108__baea4e0f603e.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-109 | BM-109__0fe502079a3e.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-110 | BM-110__a1f991fed29c.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-110 | BM-110__a1f991fed29c.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-110 | BM-110__a1f991fed29c.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-110 | BM-110__a1f991fed29c.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-111 | BM-111__33851c577165.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-112 | BM-112__109c846bbe17.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-113 | BM-113__2651c6185250.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-114 | BM-114__84cec283ce1b.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-115 | BM-115__94659bf76001.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-116 | BM-116__23c45f530ed1.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `canonicalFields[11].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-117 | BM-117__c9531f5e460e.contract.locked.json | `docxSlots[11].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `canonicalFields[11].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-118 | BM-118__7d13f5eae86d.contract.locked.json | `docxSlots[11].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-119 | BM-119__bb054433cbac.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-120 | BM-120__e702d429a0f3.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-121 | BM-121__a7983088c6ec.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-121 | BM-121__a7983088c6ec.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-121 | BM-121__a7983088c6ec.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-121 | BM-121__a7983088c6ec.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-122 | BM-122__c6efcf63e36a.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-122 | BM-122__c6efcf63e36a.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-123 | BM-123__8aa275f0ac70.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-123 | BM-123__8aa275f0ac70.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-125 | BM-125__77ec214513fb.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-126 | BM-126__2d8c3d38368b.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-127 | BM-127__582febaeadf0.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-128 | BM-128__8eab646ee06f.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-129 | BM-129__7fb66a442c28.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-130 | BM-130__9a859e843d48.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-131 | BM-131__91726e55d979.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `canonicalFields[0].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `docxSlots[0].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-132 | BM-132__670b47f0b235.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `canonicalFields[0].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `docxSlots[0].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-133 | BM-133__1f7f12f1a249.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-134 | BM-134__7c1e123c01b0.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-135 | BM-135__79b31ad7511e.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[11].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[12].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[13].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[14].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[15].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `canonicalFields[16].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[11].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[12].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[13].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[14].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[15].reviewRequired` | `false` | `true` |
| BM-136 | BM-136__f7c2e28ddd12.contract.locked.json | `docxSlots[16].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-137 | BM-137__d2c569c61fb7.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-138 | BM-138__bf31a1f547b0.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-140 | BM-140__13e1ade15acd.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-142 | BM-142__02d373abb354.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-143 | BM-143__7ad54f65b3a0.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-143 | BM-143__7ad54f65b3a0.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-143 | BM-143__7ad54f65b3a0.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-143 | BM-143__7ad54f65b3a0.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-147 | BM-147__7bf9bc811cad.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-149 | BM-149__3990ac4442f1.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-151 | BM-151__d3ead7c40b56.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-151 | BM-151__d3ead7c40b56.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-151 | BM-151__d3ead7c40b56.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-151 | BM-151__d3ead7c40b56.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-152 | BM-152__d28f03a3f72b.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-153 | BM-153__829ed04c824a.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-154 | BM-154__618d13a959ca.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[8].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[9].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[10].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[11].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[12].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[13].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `canonicalFields[14].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[8].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[9].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[10].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[11].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[12].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[13].reviewRequired` | `false` | `true` |
| BM-155 | BM-155__d89766f2092a.contract.locked.json | `docxSlots[14].reviewRequired` | `false` | `true` |
| BM-157 | BM-157__a5c6971a69d2.contract.locked.json | `canonicalFields[0].reviewRequired` | `false` | `true` |
| BM-157 | BM-157__a5c6971a69d2.contract.locked.json | `docxSlots[0].reviewRequired` | `false` | `true` |
| BM-158 | BM-158__7a98055a3e9c.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-158 | BM-158__7a98055a3e9c.contract.locked.json | `canonicalFields[2].reviewRequired` | `false` | `true` |
| BM-158 | BM-158__7a98055a3e9c.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-158 | BM-158__7a98055a3e9c.contract.locked.json | `docxSlots[2].reviewRequired` | `false` | `true` |
| BM-160 | BM-160__2f8e7c014448.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-160 | BM-160__2f8e7c014448.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[1].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[3].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[4].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[5].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[6].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `canonicalFields[7].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[1].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[3].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[4].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[5].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[6].reviewRequired` | `false` | `true` |
| BM-161 | BM-161__5c910ef4adf5.contract.locked.json | `docxSlots[7].reviewRequired` | `false` | `true` |

## Proof: No Label Changed
Labels are unchanged — only `reviewRequired` boolean flipped.

## Proof: No Binding Changed
No `renderBindings`, `path`, `slotId`, `rawPattern`, `source`, or `formInputHints` modified.

## Proof: BM-063/BM-066 Excluded
Both BMs are in the blocked list and skipped.

## Can Apply
**YES**


