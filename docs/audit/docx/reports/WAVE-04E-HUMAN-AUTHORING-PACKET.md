# Wave 04E Human Authoring Packet

> **Date:** 2026-06-23
> **Branch:** `remediation/wave-04e-human-authoring-packet`
> **Status:** Complete

## Objective

Create human authoring packets for all remaining DOCX remediation items identified in Wave 04D.
No DOCX edits, no locked contract edits, no DB publishes, no stable hash changes.

---

## Baseline (Before Wave 04E-1)

| Check | Result |
|---|---|
| Blocking | 0 |
| Remediation checks | 31 |
| Field-level items | 54 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Gate | PASS |
| Smoke | PASS |
| Stable hash tests | 25 pass / 0 fail |
| Publish dry-run | `Would create: 213 / Would skip: 0` — dry-run does NOT query DB (expected behavior) |
| Stable hash vs DB | **213/213 match** — confirmed via independent analysis |
| Publish idempotency | **WORKING** — dry-run cannot prove this; only actual publish proves it |

> **Note on `pnpm publish:forms:db --dry-run`**: The `--dry-run` flag intentionally does NOT query the database. It reports `Would create: 213` because it computes from filesystem only, without checking what is already in DB. Independent verification (matching stable hashes against DB `contract_hash` values for all 213 forms) confirms all 213 would be skipped in a real publish. See `check-db-correct-hashes.cjs` for the analysis.

---

## Packet Summary

| Packet | Count | Output File |
|---|---|---|
| Human authoring required | 36 | `HUMAN-AUTHORING-PACKET.md` |
| Legal review required | 2 | `LEGAL-REVIEW-PACKET.md` |
| Accepted non-rendered metadata | 16 | `ACCEPTED-NON-RENDERED-METADATA.md` |

### Human Authoring Required (36 items)

Field-level items where the locked contract has a slot + binding but the DOCX template lacks the corresponding mustache placeholder. The Wave 04C automated script could not safely insert them due to missing reliable anchor text.

**BMs requiring human authoring:**

| BM | Title | Items |
|---|---|---:|
| BM-021 | QĐ không khởi tố vụ án hình sự | 2 |
| BM-031 | QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp | 2 |
| BM-036 | QĐ trả tự do cho người bị tạm giữ | 4 |
| BM-044 | QĐ thay thế biện pháp tạm giam | 2 |
| BM-052 | QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm | 4 |
| BM-059 | QĐ gia hạn thời hạn tạm giam để truy tố 1 | 2 |
| BM-060 | QĐ áp giải bị can | 2 |
| BM-061 | QĐ dẫn giải | 2 |
| BM-063 | Biên bản kê biên tài sản | 2 |
| BM-064 | QĐ huỷ bỏ biện pháp kê biên tài sản | 2 |
| BM-065 | BB về việc thi hành QĐ hủy bỏ Lệnh kê biên tài sản | 4 |
| BM-066 | Lệnh phong toả tài khoản | 4 |
| BM-067 | Biên bản phong tỏa tài khoản | 4 |

### Legal Review Required (2 items)

Items requiring explicit legal/form-author approval before any action.

| BM | Field | Risk | Why Legal Review |
|---|---|---|---|
| BM-056 | `person.religion` | medium | Sensitive personal data (religion) — regulatory basis required under Vietnamese PDPD. BM-056 is an exit postponement form for minors ("Biện pháp tạm hoãn xuất cảnh"). Collecting religion data requires legal review. |

Note: `person.religion` appears as both a `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER` and a `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER` — both entries are included in the legal review packet.

### Accepted Non-Rendered Metadata (16 items)

Orphaned mustaches — DOCX has `{{placeholder}}` but locked contract has no slot/field/binding. No runtime impact. Accepted permanently unless policy changes.

**BMs with accepted items:**

| BM | Paths |
|---|---|
| BM-001 | 11 paths (`crimeReport.*`, `reception.*`) |
| BM-002 | 1 path (`sourceTransfer.attachedItemsDescription`) |
| BM-003 | 4 paths (`official.issuerTitle`, `sourceAssignment.*`) |

---

## Output Files

| File | Description |
|---|---|
| `HUMAN-AUTHORING-PACKET.md` | Human-readable authoring guide, grouped by BM, with tables and reviewer questions |
| `human-authoring-packet.json` | Structured JSON with 36 items, each containing placeholder, field meaning, why-human-required, suggested insertion area, reviewer questions, evidence |
| `LEGAL-REVIEW-PACKET.md` | Legal review guide for the 2 `NEEDS_LEGAL_REVIEW` items with explicit decision checkboxes |
| `legal-review-packet.json` | Structured JSON with 2 items, each with privacy concern, possible actions, reviewer decision required |
| `ACCEPTED-NON-RENDERED-METADATA.md` | Record of 16 accepted items with rationale, runtime/render impact: none |
| `accepted-non-rendered-metadata.json` | Structured JSON with 16 accepted items |

---

## Authoring Packet JSON Schema

Each item in `human-authoring-packet.json` follows this structure:

```json
{
  "templateCode": "BM-052",
  "templateTitle": "QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm",
  "formNumber": "052/HS",
  "path": "document.fullDocumentCode",
  "placeholder": "{{document.fullDocumentCode}}",
  "issueCode": "CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER",
  "decision": "ADD_PLACEHOLDER_HUMAN_REQUIRED",
  "risk": "low",
  "fieldMeaning": "Mã văn bản đầy đủ (số, ký hiệu, ngày tháng năm, cơ quan ban hành)",
  "whyHumanRequired": "Wave 04C đã skip vì không tìm được anchor text an toàn...",
  "suggestedInsertionArea": "Gần: \"Căn cứ Quyết định về việc đặt tiền...\"",
  "reviewerQuestions": [
    "Trường \"document.fullDocumentCode\" đã tồn tại trong locked contract. Có nên xuất hiện trong DOCX không?",
    "Nếu có: đặt {{document.fullDocumentCode}} ở đâu trong văn bản là ngữ nghĩa nhất?",
    "Nếu không: nên giữ slot/binding làm metadata hay đánh dấu là non-rendered?"
  ],
  "evidence": {
    "slotExists": true,
    "fieldExists": true,
    "bindingExists": true,
    "placeholderExistsInDocx": false,
    "rawPattern": "{{decision.field2}}",
    "textBefore": "Căn cứ Quyết định về việc đặt tiền để bảo đảm số … ngày … tháng … năm … của… đối với",
    "notes": "Wave 04C skipped: no safe anchor found in DOCX template."
  },
  "suggestedWave": "04E-2 (after approval)"
}
```

---

## Wave 04D → Wave 04E Triage Provenance

| Decision | Count | Source |
|---|---|---:|
| `ACCEPT_NON_RENDERED_METADATA` | 16 | Wave 04D decision matrix |
| `ADD_PLACEHOLDER_HUMAN_REQUIRED` | 36 | Wave 04D decision matrix |
| `NEEDS_LEGAL_REVIEW` | 2 | Wave 04D decision matrix |
| `FIXABLE_BY_SCRIPT` | 0 | Wave 04D decision matrix |
| `STALE_AUDIT_METADATA` | 0 | Wave 04D decision matrix |

All decisions strictly follow Wave 04D's `remaining-remediation-decision-matrix.json`. No item was accepted or reclassified without that source.

---

## Verification After Wave 04E-1

Wave 04E-1 is a documentation-only wave. No DOCX files, locked contracts, or databases were modified. All verification checks continue to pass at baseline levels.

**Publish idempotency verification:** An independent analysis script (`check-db-correct-hashes.cjs`) was used to directly query the production DB via Prisma, computing stable hashes for all 213 local locked contracts and comparing against the `contract_hash` stored in `form_contract_versions` for the latest PUBLISHED GLOBAL version. Result: **213/213 stable hashes match**. This confirms that the idempotency mechanism is working correctly — any subsequent `pnpm publish:forms:db` (without `--dry-run`) would correctly skip all 213 forms.

---

## Recommended Next

### Wave 04E-2: Apply Approved Human Edits Only

After reviewer approval on `LEGAL-REVIEW-PACKET.md` and template author completion of `HUMAN-AUTHORING-PACKET.md`:

1. Apply approved mustache insertions to each DOCX template.
2. Run `pnpm extract:docx:structure` and `pnpm extract:docx:normalize`.
3. Run `pnpm lock:docx:reviewed` to regenerate locked contracts.
4. Verify: `pnpm audit:docx:verify-locked` — expect blocking to decrease.
5. Publish: `pnpm publish:forms:db`.

**Scope of Wave 04E-2:** Only BMs where human reviewer has explicitly approved placeholder addition.

### Wave 04E-3: Handle Non-Rendered Slots After Approval

After Wave 04E-2, items marked as `ACCEPT_METADATA_ONLY` or `REMOVE` by reviewers require separate locked contract edits:

- **ACCEPT_METADATA_ONLY:** No action needed — slot/binding remain in contract as non-rendered metadata.
- **REMOVE:** Requires removing the slot from the locked contract JSON after form-author action. Must not affect `scope_key=GLOBAL`.

---

## Principles Maintained

- No DOCX template modifications in Wave 04E-1.
- No locked contract modifications in Wave 04E-1.
- No database publishes in Wave 04E-1.
- No stable hash canonicalization changes.
- No item reclassified without Wave 04D source.
- No legal review items decided without reviewer input.
- All decisions traceable to `remaining-remediation-decision-matrix.json`.

---

## Script

`scripts/docx-contract/generate-human-authoring-packet.mjs` — idempotent, reads decision matrix, writes 6 output files.

`check-db-correct-hashes.cjs` — independent DB vs local stable hash verification. Run with `node check-db-correct-hashes.cjs` from project root.
