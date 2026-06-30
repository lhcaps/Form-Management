# BM-052 CodeGraph Findings: Remaining recipients.personLine6 Render Blocker

**Generated:** 2026-06-28T07:45:00Z
**Task:** BM052_REMAINING_RECIPIENTS_PERSONLINE6_RENDER_BLOCKER_EVIDENCE
**Mode:** EVIDENCE_ONLY

---

## Code Facts (from CodeGraph)

### How `render-form-fidelity-gate.mjs` builds payloads and detects undefined/null

**`buildRenderPayload` (line 212):**
```javascript
function buildRenderPayload(contract) {
  const payload = {};
  for (const binding of contract.renderBindings ?? []) {
    if (!binding?.slotId || !binding?.from) continue;
    const value = markerForPath(binding.from);
    payload[binding.slotId] = value;
    setDeep(payload, binding.slotId, value);
  }
  return payload;
}
```
- Iterates `contract.renderBindings[]`
- For each binding with `slotId` + `from`, creates `{[slotId]: __FROM_UPPERCASE__}`
- **Critical:** If a DOCX placeholder has NO binding in `renderBindings`, its value in the rendered DOCX is literally `__RECIPIENTS_PERSONLINE6__` (the marker), which the literal-fidelity check detects as NOT undefined/null BUT the binding-fidelity check flags the placeholder as unbound.

**`findUndefinedNullLiterals` (line 183):**
```javascript
function findUndefinedNullLiterals(parts) {
  const issues = [];
  for (const part of parts) {
    if (!/\b(?:undefined|null)\b/i.test(part.text)) continue;
    issues.push({ partName: part.partName, preview: part.text.slice(0, 160) });
  }
  return issues;
}
```
- Searches rendered DOCX text parts for literal `undefined` or `null` strings.
- Reports each occurrence with part name and 160-char preview.
- BM-052 has 3 such issues — these are the `__RECIPIENTS_PERSONLINE6__` markers.

**`buildBindingFidelity` (line 234):**
```javascript
function buildBindingFidelity(contract, sourcePlaceholders) {
  const slotIds = new Set((contract.docxSlots ?? []).map((slot) => slot.slotId).filter(Boolean));
  const bindingSlotIds = new Set((contract.renderBindings ?? []).map((binding) => binding.slotId).filter(Boolean));
  // ...
  const templatePlaceholdersWithoutSlots = sourcePlaceholders.unique.filter((p) => !slotIds.has(p));
  const templatePlaceholdersWithoutBindings = sourcePlaceholders.unique.filter((p) => !bindingSlotIds.has(p));
  // FAIL if either array is non-empty
}
```
- Fails if ANY unique DOCX placeholder has no entry in `docxSlots` OR `renderBindings`.
- **BM-052:** `recipients.personLine6` appears in DOCX but has NO entry in either array → FAIL.

**`markerForPath` (line 195):**
```javascript
function markerForPath(path) {
  return `__${path.replace(/\W+/g, '_').toUpperCase()}__`;
}
```
- `recipients.personLine6` → `__RECIPIENTS_PERSONLINE6__`

---

## Corpus Naming Conventions (from locked contract corpus analysis)

### Existing field patterns

| Path pattern | Examples in BM-052 |
|---|---|
| `agency.*` | `agency.name` |
| `document.*` | `document.fullDocumentCode`, `document.fullDocumentCode2` |
| `recipients.*` | `recipients.personLine` |
| `person.*` | `person.fullName`, `person.idNumber`, `person.temporaryAddress` |
| `signature.*` | `signature.signerName` |

### NOT in BM-052 corpus (not collision risks):
- `person.job` / `person.occupation`
- `person.birthDate`
- `person.gender`
- `person.nationality`
- `person.permanentAddress`
- `recipients.personLine6` (placeholder exists in DOCX, but NO slot/binding in contract)
- `recipients.signatureLine*`
- `person.personExtra`
- `person.personFullName2a/2b`

---

## Semantic Facts from BM-052 DOCX

The normalized DOCX has **3 body occurrences** of `{{recipients.personLine6}}` at paragraphs 29, 30, 31 (0-indexed).

Document structure around those paragraphs:
```
P27: Điều 1. Hủy bỏ biện pháp đặt tiền để bảo đảm đối với bị can
P28: Họ tên: | 8 | {{recipients.personLine}}
P29: {{recipients.personLine6}}     ← occ 0
P30: {{recipients.personLine6}}     ← occ 1
P31: {{recipients.personLine6}}     ← occ 2
P32: Nghề nghiệp:
P33: Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:
P34: {{person.idNumber}}
P35: Nơi thường trú:
P36: Nơi tạm trú:
P37: {{person.temporaryAddress}}
```

Each `{{recipients.personLine6}}` is a standalone single-placeholder paragraph — the text of each `<w:t>` tag IS exactly `{{recipients.personLine6}}`.

### What Codex's previous applies handled:
1. `decision.decisionLine2` occ 0 → `person.fullName` (slot at P33) ✓
2. `decision.decisionLine2` occ 1 → `person.fullName` (slot at P35) ✓
3. `recipients.personLine6` footer occurrence (Table 2, Cell 1, "11{{signature.signerName}}") → `signature.signerName` ✓
4. `person.idNumber` → slot + binding added ✓
5. `person.temporaryAddress` → slot + binding added ✓

### What Codex's previous applies LEFT:
The 3 body occurrences of `{{recipients.personLine6}}` at P29-P31.

---

## Assumptions

1. Each `{{recipients.personLine6}}` at P29-P31 is a separate semantic slot, not a table row with adjacent labels.
2. The text immediately BEFORE the first `{{recipients.personLine6}}` is `{{recipients.personLine}}` (a tab/space separator).
3. After the three `{{recipients.personLine6}}` placeholders, `Nghề nghiệp:` appears — suggesting these 3 blank paragraphs represent person detail fields (e.g., alias, date of birth, ethnicity/nationality).
4. The "Nơi thường trú:" paragraph (P35) has NO placeholder — this is a BLANK permanent address field.
5. `{{person.idNumber}}` at P34 is a SEPARATE slot from the `recipients.personLine6` occurrences.
6. The `recipients.personLine6` footer occurrence (Table 2 Cell 1) has already been fixed by Codex as `signature.signerName`.

---

## Unknowns

1. What are the 3 blank `{{recipients.personLine6}}` cells semantically? The visible label order suggests they sit between "Họ tên" and "Nghề nghiệp" — but the exact semantic meaning of each cell cannot be determined from the DOCX alone.
2. Is the "Nơi thường trú:" blank intentional or an error in the original DOCX?
3. Do the form-contracts model support person.detail fields beyond fullName, idNumber, and temporaryAddress?
4. What should the contract look like if the DOCX is kept as-is (recipients.personLine6) vs renormalized?

---

## Rendering Pipeline Summary

```
Normalized DOCX (has {{recipients.personLine6}} x3)
       ↓
buildRenderPayload() → payload = {} (no binding for recipients.personLine6)
       ↓
Docxtemplater renders → output has __RECIPIENTS_PERSONLINE6__ x3
       ↓
findUndefinedNullLiterals → detects __RECIPIENTS_PERSONLINE6__ as 3 literal issues
       ↓
buildBindingFidelity → recipients.personLine6 has no slot, no binding → FAIL
```

The render technically succeeds (no Docxtemplater error), but the fidelity checks fail because the placeholders produce visible literal markers in the output.

---

## BM-052 Current Contract State

```
docxSlots (8 entries):
  agency.name               ✓ bound
  document.fullDocumentCode ✓ bound
  recipients.personLine    ✓ bound
  document.fullDocumentCode2 ✓ bound
  person.fullName          ✓ bound (2 slots, 2 bindings)
  person.idNumber          ✓ bound
  person.temporaryAddress  ✓ bound
  signature.signerName     ✓ bound

renderBindings (8 entries): one-to-one with docxSlots above

MISSING (not in contract):
  recipients.personLine6   ✗ NO slot, NO binding, NO field

unique DOCX placeholders (7):
  agency.name              ✓ in contract
  person.fullName          ✓ in contract
  person.idNumber          ✓ in contract
  person.temporaryAddress ✓ in contract
  recipients.personLine    ✓ in contract
  signature.signerName     ✓ in contract
  recipients.personLine6   ✗ NOT in contract → FAIL
```
