## Summary

This PR productizes the generated form workflow after the 213-form engine reached READY_ABSOLUTE.

Implemented:

- Adds "Điền dữ liệu mẫu" to the published contract form editor.
- Wires sample prefill to existing `getSampleData()` and `mergeWithSampleData()`.
- Preserves user-entered values by default.
- Treats whitespace-only strings as empty for sample merge.
- Shows sample-mode banner after prefill.
- Hides contract runtime/hash/internal IDs behind explicit debug flags.
- Replaces user-visible debug/English labels with Vietnamese labels.
- Localizes raw form section keys such as `document`, `receiver`, `informant`.
- Aligns report page palette from `zinc-*` to `slate-*`.

## Scope

Frontend-only productization.

No changes to:

- locked contracts
- normalized DOCX templates
- compiled-v2 artifacts
- DB publish/sync
- semantic readiness gates

## Verification

| Check | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm test:web-unit` | 73/73 PASS |
| `E2E sample-prefill.spec.ts` | PASS |
| `E2E document-form-save.spec.ts` | PASS |
| `check-213-remediation-readiness` | Ready: YES / Decision gate ALLOW |
| `build-website-requirement-acceptance-v1` | READY_ABSOLUTE |
| `build-ready-absolute-blocker-burn-down-v3` | 0 blockers |

## Live UX Verification

Verified on BM-001 published-contract flow:

- "Điền dữ liệu mẫu" button visible.
- Amber sample-mode banner appears after click.
- Vietnamese section labels visible:
  - "Thông tin văn bản"
  - "Người tiếp nhận"
  - "Người cung cấp tin"
  - "Nơi nhận"
- Raw English keys are absent.
- Debug metadata is hidden by default:
  - no "Contract runtime"
  - no contract hash
  - no "Published contract"
- Save/reload verified through existing document-form-save E2E.

## Notes

Backend validation correctly rejects invalid arbitrary strings in legal fields, such as wrong CCCD/date formats. This is expected behavior. The save/reload E2E uses valid legal data.

Sample data generator coverage remains 1735/1735. This PR verifies the sample-prefill UX on representative published-contract flow, not exhaustive UI E2E across all 213 forms.

## Remaining Work

P2/P3 backlog remains documented:

- Full 213-form UI sample-prefill sweep
- Broader design-system migration
- PageShell migration
- Additional accessibility tests
- Toast/dirty-state polish
- Admin debug panel

## Reviewer Checklist

- [ ] Open `/templates`
- [ ] Confirm no user-visible "Catalog API", source zip, or technical debug copy
- [ ] Open BM-001 or BM-004
- [ ] Confirm "Điền dữ liệu mẫu" is visible
- [ ] Click sample prefill
- [ ] Confirm amber sample banner appears
- [ ] Confirm fields are filled
- [ ] Edit one field manually
- [ ] Save
- [ ] Reload
- [ ] Confirm user edit persists
- [ ] Confirm no "Contract runtime" or hash visible by default
- [ ] Confirm section headings are Vietnamese
- [ ] Export DOCX if local API is running
- [ ] Confirm exported DOCX has no placeholder / undefined / null / "Ô trống"
