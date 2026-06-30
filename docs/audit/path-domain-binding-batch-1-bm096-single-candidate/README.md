# BM096 Single Candidate Review Workflow

## Trạng thái hiện tại

```
BM-096: NOT APPLIED
Total issues: 1477
REMEDIATION_LEAK: 10 (BLOCKED)
COMPILED_DRIFT: 37
```

## Exclusion (đã downgrade)

| Path | Nguyên nhân |
|------|-------------|
| `signature.cheDo` → Nơi thường trú | DEFER_PATH_DOMAIN_MISMATCH |
| `signature.nguoiKy` → Nơi tạm trú | DEFER_PATH_DOMAIN_MISMATCH |

## Active candidate (cần review)

| Old Path | New Path | Label |
|----------|----------|-------|
| `document.diaChi` | `person.idNumber` | Số CCCD/CMND |

## Files đã tạo

```
.cursor/rules/qllaw-contract-remediation.mdc          # Project rules
scripts/audit/validate-remediation-batch-safety-gates.mjs  # Safety gates
scripts/audit/validate-bm096-single-candidate-review.mjs  # BM096 validator
test/bm096-single-candidate-review.test.mjs               # Test suite
docs/audit/path-domain-binding-batch-1-bm096-single-candidate/  # Output folder
```

## Workflow

```
1. Tạo review packet (PROPOSED_ONLY)
   → docs/audit/.../review.latest.json
   → docs/audit/.../review.latest.md

2. Human review & approve

3. Tạo decision packet
   → docs/audit/.../decision.proposed.json

4. Chạy validate
   node scripts/audit/validate-bm096-single-candidate-review.mjs
   node --test test/bm096-single-candidate-review.test.mjs

5. Nếu pass → tạo apply prompt riêng
   BM096_SINGLE_CANDIDATE_APPLY_APPROVED_REMAP
```

## Validation commands

```bash
# Validate review packet
node scripts/audit/validate-bm096-single-candidate-review.mjs

# Run tests
node --test test/bm096-single-candidate-review.test.mjs

# Run safety gates (khi có decision)
node scripts/audit/validate-remediation-batch-safety-gates.mjs \
  docs/audit/.../decision.proposed.json \
  docs/audit/.../audit.latest.json

# Audit
node scripts/audit/audit-forms-root-cause.mjs

# Git diff (không được thay đổi)
git diff -- docs/audit/docx/contracts/locked docs/audit/docx/compiled-v2
```

## Expected metrics sau task này

```
totalIssues: 1477 (không đổi)
REMEDIATION_LEAK: 10 (không đổi)
COMPILED_DRIFT: 37 (không đổi)
```

## Prompt cho Cursor (task tiếp theo)

Copy prompt từ briefing đã cung cấp ở trên và gửi cho Cursor Agent.
