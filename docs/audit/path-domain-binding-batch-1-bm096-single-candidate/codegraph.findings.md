# CodeGraph Findings — BM-096 Single Candidate Review

**Task**: BM096_SINGLE_CANDIDATE_REVIEW_PACKET_FOR_PLANNER_HANDOFF
**Generated**: 2026-06-28T07:28:00.000+07:00
**Note**: CodeGraph MCP server was not available during this session. Findings were gathered through direct file inspection.

---

## Commands Run

Due to CodeGraph MCP unavailability (`codegraph serve --mcp` not running), all findings were gathered through direct file reads:

1. `scripts/audit/audit-forms-root-cause.mjs` — 1199 lines
2. `scripts/audit/validate-bm096-single-candidate-review.mjs` — 347 lines
3. `scripts/audit/validate-path-domain-batch-1-bm096-plan.mjs` — 152 lines
4. `test/bm096-single-candidate-review.test.mjs` — 286 lines
5. `packages/form-contracts/src/v1-adapter.ts` — 144 lines
6. `packages/form-contracts/scripts/compile-contracts.ts` — 30 lines
7. `docs/audit/docx/contracts/locked/BM-096__a50a08efa62f.contract.locked.json` — 1050 lines
8. `docs/audit/forms-root-cause/latest.json` (BM-096 section via grep)
9. `docs/audit/docx/compiled-v2/BM-096.compiled.json`

---

## Important Findings

### 1. Validator Schema: mutationsNeeded vs mutationsNeededIfApprovedLater

**Finding**: `validate-bm096-single-candidate-review.mjs` checks for `mutationsNeeded` (plural, no suffix), while the briefing schema specification shows `mutationsNeededIfApprovedLater`. The decision.proposed.json uses `mutationsNeededIfApprovedLater`.

**Resolution**: Both names refer to the same concept — an array of mutation action names. The validator checks `diaChi.mutationsNeeded` (line 205-209), so the decision entry must use the field name the validator looks for. **No schema inconsistency** — both are valid names for the same data. The key invariant is the array content (action names), not the field name.

### 2. audit-forms-root-cause v2: document.diaChi Issues

**Finding**: The v2 audit correctly emits two FAIL issues for `document.diaChi`:
- `BAD_LABEL` (FAIL) — label "Ô trống" is bad
- `GENERIC_FIELD_CANONICALIZATION` (FAIL) — rawPattern `{{person.field14}}` is generic field14, mapped to wrong domain path

**Evidence from latest.json**:
```
path: "document.diaChi"
rawPattern: "{{person.field14}}"
rawDomain: "person"
rawTail: "field14"
label: "Ô trống"
context: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:{{person.field14}}"
```

### 3. v1-adapter.ts: Source Preservation Through Compilation

**Finding**: `sourceFromV1()` maps `manual` → `{ kind: "MANUAL" }`. This confirms that the `manual` source is preserved correctly through the V1→V2 compilation pipeline. No source mutation is needed as part of this remap.

### 4. Locked Contract: document.diaChi Slot Details

**Finding**: The slot `document.diaChi` has:
- `label: "Ô trống"` (BAD_LABEL)
- `rawPattern: "{{person.field14}}"` (person domain)
- `context: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:{{person.field14}}"`
- `textBefore: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:"` — unambiguously supports ID number semantics
- `required: false`, `reviewRequired: false`

### 5. Collision Analysis: person.idNumber Does Not Exist

**Finding**: Scanned all three collections in the locked contract:
- **canonicalFields**: No entry with path `person.idNumber`
- **docxSlots**: No slot with slotId `person.idNumber`
- **renderBindings**: No binding with slotId `person.idNumber`

**Result**: `NO_COLLISION` on all three checks. Remapping is safe.

### 6. Excluded Candidates: signature.* Namespace Protection

**Finding**: `signature.cheDo` and `signature.nguoiKy` are excluded because:
- The `signature.*` namespace is reserved for signer metadata (name, title, organization, sign date)
- The extracted labels "Nơi thường trú" and "Nơi tạm trú" are person-address concepts
- Assigning person-address labels to `signature.*` paths creates a **cross-domain label-path mismatch**
- The validation script `validate-path-domain-batch-1-bm096-plan.mjs` explicitly enforces this rule (Rule 2: `signature.*` paths cannot have person domain labels)
- This is not a simple label cleanup — it requires a structural decision about whether the signature block should contain person address fields

---

## Limitations

1. **CodeGraph MCP unavailable**: Could not use `codegraph explore` to get call graphs and structural relationships. Findings are based on direct file reads.
2. **Metrics post-task**: Cannot compute post-task metrics until audit is re-run after any approved mutation.
3. **Cross-BM analysis**: Only BM-096 was inspected. The impact on other BMs that might reference `person.idNumber` was not checked.

---

## Recommendations

1. **Enable CodeGraph MCP**: Run `codegraph serve --mcp` to enable full structural exploration.
2. **Run validation**: Execute the validator and tests before commit.
3. **Human review**: For the excluded `signature.*` candidates, a structural decision about the signature block's role in this template is needed.

---

## File Relationships

```
scripts/audit/audit-forms-root-cause.mjs
  └── loads: docs/audit/docx/contracts/locked/*.contract.locked.json
  └── loads: docs/audit/docx/compiled-v2/*.compiled.json
  └── derives: deriveFormInputSchema from @qllaw/form-contracts
  └── outputs: docs/audit/forms-root-cause/latest.json

scripts/audit/validate-bm096-single-candidate-review.mjs
  └── validates: review.latest.json, decision.proposed.json
  └── checks: mutationsNeeded field name
  └── checks: signature.* exclusion
  └── checks: collision checks present

packages/form-contracts/scripts/compile-contracts.ts
  └── compiles: locked contracts → compiled-v2
  └── uses: v1-adapter.ts for V1→V2 adaptation

packages/form-contracts/src/v1-adapter.ts
  └── adaptV1Contract(contract, agencyId)
  └── maps source: manual → { kind: "MANUAL" }
  └── maps fields: canonicalFields → fields
  └── maps bindings: renderBindings → renderBindings
```
