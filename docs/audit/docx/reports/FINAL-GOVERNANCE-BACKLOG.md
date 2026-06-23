# Final Governance Backlog

**Phase**: F-3
**Generated**: 2026-06-23T14:50:00+07:00
**Status**: Governance-pending only — no safe automated actions remain

---

## Summary

| Classification | Count | Status |
|---|---|---|
| REMOVE_PENDING_EXPLICIT_APPROVAL | 4 | Pending form-author approval |
| CONFLICT_PENDING_REMOVE_DECISION | 1 | Requires sequencing decision |
| ACCEPTED_NO_ACTION_SET | 2 | Accepted — no action required |

**All 7 items require explicit human decision. No automated action is safe.**

---

## Remove Approval Requests

| ID | BM | Field | Risk | Required Approval | Status | Notes |
|---|---|---|---|---|---|---|
| RAR-001 | BM-052 | `document.fullDocumentCode2` | medium | form-author | pending | Also: alias target for BM-052 canonical. Must resolve alias first. |
| RAR-002 | BM-067 | `document.fullDocumentCode2` | low | form-author | pending | Safe to remove if approved. No compound binding dependency. |
| RAR-003 | BM-067 | `document.fullDocumentCode2` | low | form-author | pending | Duplicate of RAR-002 (BINDING entry). Single removal resolves both. |
| RAR-004 | BM-052 | `document.fullDocumentCode2` | medium | form-author | pending | Duplicate of RAR-001 (BINDING entry). Single removal resolves both. |

### RAR Resolution Guidance

**BM-067 `document.fullDocumentCode2`** (RAR-002/RAR-003):
- The official form repeats the same lệnh phong tỏa, not a second independent document.
- `document.fullDocumentCode6` already renders the lệnh phong tỏa reference.
- **No compound binding depends on this slot.** Safe to remove if approved.
- Form-author should verify: does any runtime data exist in this field?

**BM-052 `document.fullDocumentCode2`** (RAR-001/RAR-004):
- Official form has one cited deposit decision.
- **Critical conflict**: this slot is also the alias target for BM-052 `document.fullDocumentCode` canonical alias.
- **Must decide before acting** — see CONFLICT item below.

---

## Conflict Items

| ID | BM | Field | Risk | Required Approval | Status |
|---|---|---|---|---|---|
| CPG-001 | BM-052 | `document.fullDocumentCode` | high | form-author | pending |

**CPG-001 — BM-052 Alias ↔ Remove Conflict**:

`document.fullDocumentCode` in BM-052 is in both:
1. **Alias policy** (maps canonical → `document.fullDocumentCode2`)
2. **Remove-pending** (`document.fullDocumentCode2` flagged for removal)

These conflict: activating the alias creates a dependency on `fullDocumentCode2`; removing `fullDocumentCode2` would break the alias.

**Resolution options:**

| Option | Action | Consequence |
|---|---|---|
| **A — Reject Remove** | Approve `REJECT_REMOVE` for RAR-001/RAR-004 | Keep `fullDocumentCode2`. Activate alias: `document.fullDocumentCode` → `document.fullDocumentCode2`. |
| **B — Approve Remove** | Approve `APPROVE_REMOVE` for RAR-001/RAR-004 | Remove `fullDocumentCode2`. Redirect alias: `document.fullDocumentCode` → `document.fullDocumentCode6` (same pattern as BM-067). |
| **C — Defer** | Record `DEFER` | Keep both pending for future form-author review. |

---

## Accepted No-Action Items

| ID | BM | Field | Risk | Reason |
|---|---|---|---|---|
| ANA-001 | BM-001 | 11 orphaned mustaches | low | Accepted no-action set per Wave 04E decisions. Do not touch. |
| ANA-002 | BM-002 | `sourceTransfer.attachedItemsDescription` | low | Accepted no-action set per Wave 04E decisions. Do not touch. |
| ANA-003 | BM-003 | 4 orphaned mustaches | low | Accepted no-action set per Wave 04E decisions. Do not touch. |

---

## Approval Record

To record a decision, edit `docs/audit/docx/policies/remove-approval-requests.json` and add:

```json
{
  "id": "RAR-001",
  "approvalDecision": "APPROVE_REMOVE | REJECT_REMOVE | DEFER",
  "approvedBy": "<name>",
  "approvedAt": "<ISO timestamp>",
  "note": "<optional>"
}
```

For CPG-001 conflict, document the chosen resolution in the same file.

---

## No Automated Actions Remain

All safe automated remediation work is complete:

- All DOCX placeholders verified against contracts
- All blocking issues resolved
- All stable hashes validated
- All runtime contracts published
- Alias/metadata-only audit suppressions implemented
- No further automated DOCX editing is safe without explicit form-author/legal approval
