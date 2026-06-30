# CodeGraph Findings — BM096_DEFERRED_GROUP_REVIEW

**Generated:** 2026-06-28T03:52:00.000+07:00
**Tool:** codegraph_explore (MCP)
**Health:** MCP tool available, query succeeded

---

## Query 1: BM-096 contract structure after document.diaChi -> person.idNumber remap

**Query:** `BM-096 contract locked canonicalFields docxSlots renderBindings current state after document.diaChi -> person.idNumber remap`

**Result:** Contract structure confirmed. Key findings:

- `canonicalFields`: 18 fields total
- `docxSlots`: 18 slots total
- `renderBindings`: 18 bindings total
- `person.idNumber` slot confirmed with:
  - `label: "Số CCCD/CMND"` (updated from "Ô trống")
  - `evidence.textBefore: "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:"`
  - `rawPattern: "{{person.field14}}"`
  - `required: false`
  - `reviewRequired: false`
- `document.diaChi` slot no longer exists
- All 18 slots use `slotId === path` matching (identity bindings)
- All renderBindings are identity (`transform: "identity"`)
- No cross-slot dependencies found

**Signature fields:** `signature.cheDo`, `signature.nguoiKy`, `signature.chucVu` all present with generic labels and no visible Vietnamese context.

---

## Key Code Relationships

**Form contract type hierarchy:**
```
FormContract -> CanonicalField -> FieldSource -> UiComponentHint
FormContract -> DocxSlot -> SlotType
FormContract -> RenderBinding -> RenderBindingSource -> Expression
```

**Locked contract schema:** Uses `canonicalFields[]`, `docxSlots[]`, `renderBindings[]` arrays.

**Render binding:** `slotId` must match a `docxSlots[].slotId` for render to work.

---

## What Depends on CanonicalField

- `derive-form-input-schema.ts` → uses `readCanonicalField` to build form input schema
- `form-schema-generator.ts` → uses `CanonicalField` for schema generation
- `contract-types.ts` → defines `CanonicalField` interface

---

## Safety Checks Available

The `apply-bm096-single-candidate-approved-remap.mjs` script has `assertNoSignatureTouch()` function that protects signature fields from accidental mutation. This function:
1. Verifies `signature.cheDo` and `signature.nguoiKy` exist in contract
2. Confirms they are NOT in the remap set
3. Logs each check as OK or FAIL

---

## Key Insight: All 18 BM-096 slots are Identity-Bound

Every renderBinding in BM-096 uses `transform: "identity"` with `slotId === path`. This means:
- No cross-slot transformations
- Each slot renders from its own field
- Path remaps are safe (no transform breakage)
- But label/path changes affect UI directly

---

## Classification Note

The codegraph exploration confirmed the contract structure is clean:
- No duplicate paths
- All renderBindings are valid identity bindings
- `person.idNumber` is correctly bound
- Signature fields are structurally valid but semantically suspicious (wrong paths based on textBefore context)
