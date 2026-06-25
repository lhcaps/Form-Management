

---

## Task C3-APPLY. Source Remediation Batch Apply

**Status**: DONE (2026-06-25)

### What changed

115 `canonicalFields[].source` values in 65 locked contract JSON files were updated from invalid sources to VALID_SOURCES values. No other properties changed (path, label, required, docxSlots, renderBindings, etc.).

### Scope

| Metric | Before | After |
|--------|--------|--------|
| `source="unknown"` | 16 | 0 |
| `source="constantFromDocx"` | 90 | 0 |
| `source="derived"` | 9 | 0 |
| Total invalid sources | **115** | **0** |

### Changes by source

| Old Source | Count | New Source |
|-----------|-------|-----------|
| constantFromDocx | 66 | officialConfig |
| constantFromDocx | 24 | computed |
| derived | 9 | computed |
| unknown | 12 | manual |
| unknown | 4 | computed |

### Files changed

- 65 `*.contract.locked.json` files in `docs/audit/docx/contracts/locked/`
- `docs/audit/source-remediation/source-remediation-apply.json` — apply report
- `docs/audit/source-remediation/source-remediation-apply.md` — apply report
- `scripts/audit/apply-source-remediation.mjs` — batch apply script
- `packages/form-contracts/test/derive-form-input-schema.test.ts` — 3 tests updated for post-C3 state
- `SUMMARY.md` — this entry

### Scripts

- `pnpm audit:source-remediation:apply --dry-run` — 115 APPLIED, 0 FAILED
- `pnpm audit:source-remediation:apply --apply` — 115 APPLIED, 0 FAILED

### Safety checks

Every proposal required exact match: `templateCode + sourceId + path + originalSource`. Any mismatch caused BLOCKED status and exit 1. Zero mismatches occurred.

### Test updates

3 tests in `derive-form-input-schema.test.ts` were updated to assert the corrected (post-C3-APPLY) state:
- `BM-051 (real corpus) has NO UNKNOWN_SOURCE_NORMALIZED after C3-APPLY`
- `B4 corpus audit: post-C3-APPLY, corpus is clean — no unknown or invalid source fields`
- `B4 corpus audit: post-C3-APPLY, zero unknown/invalid sources, zero warnings`

### Verification results

| Gate | Result |
|------|--------|
| `pnpm audit:source-remediation:proposal` | 0 invalid sources remaining |
| E1 `UNKNOWN_SOURCE_NORMALIZED` | **0** |
| E1 `BOUND_SLOT_MISSING_FIELD` | **0** |
| E1 `REJECTED_AS_EDITABLE` | **0** |
| `pnpm audit:docx-fidelity` | F1:213/0/0, F2:213/0/0, F3:213/0/0, F4:212/1/0, F5:213/0/0 |
| K0 mutations | 5/5 PASS |
| K0 parity | 6/6 PASS |
| `pnpm typecheck` | PASS |
| `@qllaw/form-contracts` tests | **80/80 PASS** |

### F4 BM-021 REVIEW item status

BM-021 still appears as `REVIEW_REQUIRED` in F4 because `agency.nameUpper` has `source=computed` — the mock does not fill computed fields. This is **expected behavior**, not a failure. The field is correctly classified; the rendering engine will fill it at render time. No action needed.

### Risks / Follow-up

- **53 unmapped section keys** remain informational (e.g., `sourceReport`, `sourceVerification`). Low priority; `deriveFormInputSchema` falls back to humanized names.
- The 35 MEDIUM-confidence proposals were accepted. If any turned out incorrect, targeted rollback of specific contracts is possible.

### Next task

Per PLAN.md phase order: **B3** — wire `GET /documents/generated/:id/form-schema` endpoint and UI form rendering.

### What C3-APPLY did NOT touch

Renderer, UI, DOCX templates, `deriveFormInputSchema` logic, `renderBindings`, `docxSlots`, `rejectedCandidates`, or any field property other than `canonicalFields[].source`.
