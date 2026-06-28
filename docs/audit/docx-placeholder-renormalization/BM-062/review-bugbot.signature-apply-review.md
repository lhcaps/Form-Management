# Bugbot Review — BM-062 Signature Apply

**Task:** BM062_SIGNATURE_FOOTER_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY
**Date:** 2026-06-28
**Status:** SKIPPED — Bugbot service unavailable (connection interrupted twice)

## Manual Safety Review

### Gates verified

| Gate | Status |
|---|---|
| Refuses if any `decision.decisionLine11` appears | ✅ `assertDecision` line 111: `originalPlaceholder !== ORIGINAL_PLACEHOLDER` |
| Refuses if `recipients.personLine5` occ 0/1/2/3 | ✅ `assertDecision` line 112: `occurrenceIndex !== SIGNATURE_OCCURRENCE_INDEX (4)` |
| Verifies `requiredContext` anchors before replace | ✅ lines 145-148: `contextAroundOccurrence` + `missingAnchors` filter |
| Refuses if templateCode not BM-062 | ✅ line 110: `templateCode !== TEMPLATE_CODE` |
| Exactly 1 decision enforced | ✅ line 126: `decisions.length !== 1` |
| Creates backups before write | ✅ lines 302-305: `mkdirSync(backupDir)`, `copyFileSync` ×2 |
| `signature.signerName` field/slot/binding without duplicates | ✅ `findBy` + `assertNoDuplicates` |
| After-counts: 4 recipients.personLine5, 1 signature.signerName | ✅ lines 164-169 |
| No global replacement | ✅ `seen !== decision.occurrenceIndex` guard |
| No compiled-v2 manual edit | ✅ Script only writes DOCX + locked contract |

### Required context anchors

- `{{recipients.personLine5}}` — the token itself
- `( Ký, ghi rõ họ tên, đóng dấu )` — visible label (verified from evidence)
- `Lưu:` — document part marker
- `16` — page/section marker

### Field policy

| Field | Value |
|---|---|
| source | officialConfig |
| required | true |
| reviewRequired | false |

Matches BM-052 signature.footer pattern. Appropriate.

## Test Results

- `node --test test/bm062-signature-placeholder-renormalization.test.mjs` → **22/22 PASS**
- `node ... --dry-run` → ✅ 5→4 recipients.personLine5, 0→1 signature.signerName

## Bugbot Service Status

Bugbot subagent unavailable (connection interrupted twice). Manual review substituted. Recommend re-running Bugbot review before next apply task.
