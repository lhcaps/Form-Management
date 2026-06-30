# BM-066 CodeGraph Findings

**Generated:** 2026-06-28
**BM:** BM-066 (Lệnh phong tỏa tài khoản)
**Query:** Risk detector conventions + duplicateSemanticRisk + document.fullDocumentCode / account/bank conventions

## Code Facts

### duplicateSemanticRisk detection (scripts/audit/lib/docx-placeholder-risks.mjs:70)

```javascript
export function duplicateSemanticRisk(item) {
  if ((item.count ?? 0) <= 1) return null;
  if (item.placeholder.startsWith('agency.')) return null;

  const occurrenceContexts = item.occurrenceContexts?.length
    ? item.occurrenceContexts
    : [item.context].filter(Boolean);
  const anchors = [
    ...new Set(occurrenceContexts.flatMap((context) => semanticAnchors(context))),
  ].sort();

  const highVolumeGeneric =
    genericNumberedPlaceholder(item.placeholder) && item.count >= 3;
  const mixedContextGeneric =
    genericNumberedPlaceholder(item.placeholder) && anchors.length >= 2;

  if (!highVolumeGeneric && !mixedContextGeneric) {
    return null;
  }

  return {
    placeholder: item.placeholder,
    count: item.count,
    severity: 'HIGH',
    reason: 'The same numbered DOCX placeholder appears in multiple visible semantic contexts; renormalize the DOCX placeholders before contract add/relink/remove.',
    anchors,
    occurrenceContexts,
  };
}
```

Trigger conditions for BM-066:
- `recipients.personLine4`: count=4 >= 3 → `highVolumeGeneric` = true → HIGH risk
- `document.fullDocumentCode4`: count=4 >= 3 → `highVolumeGeneric` = true → HIGH risk

Both risk triggers confirmed from `docs/audit/213-docx-fidelity-board/latest.json`.

### genericNumberedPlaceholder

```javascript
export function genericNumberedPlaceholder(path) {
  return /(?:personLine|decisionLine|fullDocumentCode)\d+$/u.test(path);
}
```

Matches: `recipients.personLine4`, `document.fullDocumentCode4`.

### SEMANTIC_ANCHORS (scripts/audit/lib/docx-placeholder-risks.mjs:41)

```javascript
const SEMANTIC_ANCHORS = [
  ['fullName', /họ\s*tên/i],
  ['alias', /tên\s*gọi\s*khác/i],
  ['job', /nghề\s*nghiệp/i],
  ['idNumber', /cmnd|cccd|hộ\s*chiếu/i],
  ['permanentAddress', /nơi\s*thường\s*trú/i],
  ['temporaryAddress', /nơi\s*tạm\s*trú/i],
  ['currentAddress', /nơi\s*ở\s*hiện\s*tại/i],
  ['recipientFooter', /nơi\s*nhận/i],
  ['signature', /ký,\s*ghi\s*rõ\s*họ\s*tên|đóng\s*dấu/i],
  ['prosecutor', /kiểm\s*sát\s*viên/i],
  ['committee', /ủy\s*ban\s*nhân\s*dân|y\s*ban\s*nhân\s*dân/i],
  ['decisionBasis', /căn\s*cứ\s*quyết\s*định|xét\s*thấy/i],
  ['assignment', /phân\s*công/i],
  ['asset', /tài\s*sản|kê\s*biên|bảo\s*quản/i],
  ['documentNumber', /số:\s*…|số\s*…|số\s*văn\s*bản/i],
  ['dateLine', /ngày\s*…\s*tháng\s*…\s*năm|ngày\s*tháng\s*năm/i],
];
```

### semanticAnchors function

```javascript
export function semanticAnchors(context) {
  return SEMANTIC_ANCHORS
    .filter(([, pattern]) => pattern.test(context))
    .map(([name]) => name);
}
```

Key for BM-066:
- `recipientFooter` (/nơi\s*nhận/i) — matches Nơi nhận distribution footer
- `decisionBasis` (/căn\s*cứ\s*quyết\s*định|xét\s*thấy/i) — matches body procedural context
- `documentNumber` (/số:\s*…|số\s*…|số\s*văn\s*bản/i) — matches "Số văn bản" formal document code
- `signature` (/ký,\s*ghi\s*rõ\s*họ\s*tên|đóng\s*dấu/i) — matches signature distribution pattern
- `asset` (/tài\s*sản|kê\s*biên|bảo\s*quản/i) — matches bank/account freeze custodian context

### Contract path conventions

BM-066 contract (BM-066__e3bc56081554.contract.locked.json):
- `docxSlots[].slotId` = placeholder ID (e.g., `document.fullDocumentCode4`)
- `renderBindings[].slotId` = target DOCX placeholder ID
- `renderBindings[].from` = semantic source field path
- `canonicalFields[].path` = semantic source field path

BM-066 has:
- `document.fullDocumentCode`: 1 slot, label "Số văn bản", binding → `document.fullDocumentCode`
- `document.fullDocumentCode4`: 1 slot, label "Số văn bản" (different from singular), 0 bindings
- `recipients.personLine`: 1 slot, label "Người bị áp dụng", binding → `recipients.personLine`
- `recipients.personLine4`: 0 slots, 0 bindings, 4 DOCX occurrences

### Render binding model

```typescript
// renderBindings[].slotId = actual DOCX placeholder ID
// renderBindings[].from = semantic source field path
// docxSlots[].slotId = actual DOCX placeholder ID
// canonicalFields[].path = semantic source field path
```

Correct binding model: `docxSlots.id / docxSlots.slotId` = actual DOCX placeholder id; `renderBindings.slotId` = actual target DOCX placeholder id; `renderBindings.from` = semantic source field path.

## Corpus Naming Conventions

From CodeGraph + prior DOCX remediation investigation:

- `document.fullDocumentCode` (singular) = formal document code/header identifier
- `document.fullDocumentCode4/8/suffix` = separate canonical field with "Số văn bản" label — appears in body/procedural context
- `recipients.personLine*` = recipient rows in table (not formal signer)
- `signature.signerName` = formal signer name in dedicated signature section
- `account.*` fields: `account.accountNumber`, `account.bankName`, `account.accountHolder` — account freeze domain
- `organization.*` fields: `organization.name`, `organization.type` — entity domain
- `recipients.personLine` = singular form for single recipient

## Same-BM DOCX Facts

### BM-066 document.fullDocumentCode4

Contract has 1 slot for `document.fullDocumentCode4` (label "Số văn bản") but 4 DOCX occurrences:
- Contexts: bank/account freeze, procedural body text, organization references
- Cannot determine from DOCX which occurrence is the formal "Số văn bản" header vs. body reference
- Prior DOCX remediation investigation (PRIOR-DXR-002): classified as DOCX_REAUTHOR_REQUIRED
- All 4 deferred: appears in bank/organization/procedural context, NOT the formal header code

### BM-066 recipients.personLine4

Contract has 0 slots for `recipients.personLine4` — all 4 occurrences render as "undefined":
- 3 in table cells with blank/no visible label (person table rows)
- 1 in Nơi nhận / Lưu: distribution footer with "(Ký, ghi rõ họ tên, đóng dấu)" — administrative boilerplate
- Prior DOCX remediation investigation: classified as DEFER_NO_CONTEXT
- BM-066 is Lệnh phong tỏa tài khoản — recipients are likely organizations/banks, not persons
- No safe candidate for signature.signerName binding

## Assumptions

- BM-066 recipients are organizations/banks (tổ chức tín dụng, kho bạc nhà nước) not persons — `recipients.personLine4` is semantically wrong domain
- `document.fullDocumentCode4` occurrences refer to account/bank/legal basis references, not the formal document code
- All 4 occurrences of `recipients.personLine4` are distinct semantics: 2 person table cells, 1 account custodian row, 1 distribution recipient

## Unknowns

- Which specific BM-066 occurrence of `document.fullDocumentCode4` corresponds to which semantic (bank name, account number reference, legal basis)?
- Is there a separate `account.*` or `organization.*` slot that should bind to these?
- Does the DOCX have a dedicated "Tài khoản" or "Ngân hàng" slot that should be used?
- Should all 4 `recipients.personLine4` be removed from DOCX or replaced with `organization.name`?
