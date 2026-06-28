# Approved Decision — BM-001 SAFE_LABEL_ONLY

Approval command: `APPROVE_RENDER_ACCURATE_FORM BM-001 BM-001__f4c2aa3682d3 SAFE_LABEL_ONLY`

| Field | Value |
|-------|-------|
| Template | BM-001 |
| SourceId | `BM-001__f4c2aa3682d3` |
| Patch type | SAFE_LABEL_ONLY |
| Approved | 2026-06-27T17:25:00.000Z |

## Safety

| Constraint | Status |
|------------|--------|
| docxSlots modified | ❌ NO |
| renderBindings modified | ❌ NO |
| paths modified | ❌ NO |
| fields added/removed | ❌ NO |
| DOCX/source mutated | ❌ NO |
| compiled artifacts edited | ❌ NO |

## Deferred Cleanup

docxSlots labels are NOT modified. Tracked for separate consistency cleanup phase.

## Changes

| # | Index | Path | Old Label | New Label | Audit Delta |
|---|-------|------|-----------|-----------|-------------|
| 1 | 16 | `informant.identityIssuedDay` | `identityIssuedDay` | **Ngày cấp** | -1 / -1 |
| 2 | 17 | `informant.identityIssuedMonth` | `identityIssuedMonth` | **Tháng cấp** | -1 / -1 |
| 3 | 18 | `informant.identityIssuedYear` | `identityIssuedYear` | **Năm cấp** | -1 / -1 |
| 4 | 24 | `informant.representedOrganization` | `representedOrganization` | **Người đại diện cơ quan, tổ chức** | -1 / -1 |
| 5 | 27 | `recipients.archiveLine` | `archiveLine` | **Nơi lưu** | -1 / -1 |

## Expected Deltas

| Metric | From | To | Delta |
|--------|------|----|-------|
| BAD_LABEL | 5 | 0 | **-5** |
| UI_VISIBLE_BAD_METADATA | 5 | 0 | **-5** |

## Rollback

Restore from backup in `docs/audit/per-form-render-accurate/BM-001/backups/<timestamp>/`
