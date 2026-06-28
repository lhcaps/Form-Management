#!/usr/bin/env node
// scripts/audit/draft-docx-path-binding-p0-destructive-decisions.mjs
// DOCX Path/Binding P0 Destructive Decision Draft.
// Safe: reads only, writes to docs/audit/docx-path-binding-p0-destructive-decision-draft/
// Mode: DRAFT_REVIEW_REQUIRED — no mutation.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const P0_INVESTIGATION = join(ROOT, 'docs', 'audit', 'docx-path-binding-p0-investigation-batch-1', 'investigation.latest.json');
const OUT_DIR          = join(ROOT, 'docs', 'audit', 'docx-path-binding-p0-destructive-decision-draft');
const OUT_JSON         = join(OUT_DIR, 'decisions.draft.json');
const OUT_MD           = join(OUT_DIR, 'decisions.draft.md');

const inv = JSON.parse(readFileSync(P0_INVESTIGATION, 'utf8'));

// ── Build decision items ──────────────────────────────────────────────────────
// Key correction: W2R-036, PRIOR-DXR-001, PRIOR-DXR-002 each have:
//   - A REMOVE_FIELD_FROM_CONTRACT action
//   - A DOMAIN_MODEL_REVIEW note
// So all 5 items contribute to REMOVE_FIELD_FROM_CONTRACT count,
// and 3 items also contribute to DOMAIN_MODEL_REVIEW.

const DECISION_IDS = ['DOCX-P0-001', 'DOCX-P0-002', 'DOCX-P0-003', 'DOCX-P0-004', 'DOCX-P0-005'];

const decisionItems = inv.findings.map((f, idx) => {
  const decisionId = DECISION_IDS[idx];
  const hasDomainModel = !!f.tentativeNewPath;

  return {
    decisionId,
    investigationId: f.investigationId,
    templateCode: f.templateCode,
    sourceId: f.sourceId,
    path: f.path,
    currentLabel: f.currentLabel,
    placeholder: f.placeholder,
    blockId: null,
    proposedAction: 'REMOVE_FIELD_FROM_CONTRACT',
    approvalStatus: 'PENDING_APPROVAL',
    applyAllowed: false,
    risk: 'HIGH',
    confidence: f.confidence,
    evidence: {
      renderedParagraphs: f.renderedParagraphs,
      paragraphSnippets: f.paragraphSnippets,
      canonicalEquivalent: f.canonicalEquivalent,
      reason: f.reason,
    },
    domainModelNote: hasDomainModel ? {
      needsReview: true,
      tentativePath: f.tentativeNewPath,
      note: `Tentative path "${f.tentativeNewPath}" is a domain-model proposal only. ` +
        `Requires separate DOMAIN_MODEL_REVIEW before being added. ` +
        `The current wrong path must still be removed regardless.`,
    } : { needsReview: false, tentativePath: null, note: null },
    rollbackRequirement: 'Backup locked contract before any future apply. Rollback = restore from backup.',
  };
});

// Summary: all 5 are REMOVE_FIELD_FROM_CONTRACT; 3 also have DOMAIN_MODEL_REVIEW.
const removeCount    = decisionItems.filter(d => d.proposedAction === 'REMOVE_FIELD_FROM_CONTRACT').length;
const domainModelCount = decisionItems.filter(d => d.domainModelNote.needsReview).length;

const draft = {
  schemaVersion: '1.0',
  task: 'DOCX_PATH_BINDING_P0_DESTRUCTIVE_DECISION_DRAFT',
  generatedAt: new Date().toISOString(),
  mode: 'DRAFT_REVIEW_REQUIRED',
  approvalRequired: true,
  applyAllowed: false,
  totalItems: decisionItems.length,
  summary: {
    REMOVE_FIELD_FROM_CONTRACT: removeCount,
    DOMAIN_MODEL_REVIEW: domainModelCount,
    APPROVED_FOR_APPLY: 0,
  },
  items: decisionItems,
};

// ── Markdown ─────────────────────────────────────────────────────────────────
const decisionTable = decisionItems.map(d => [
  d.decisionId,
  d.investigationId,
  d.templateCode,
  d.sourceId,
  d.path,
  d.proposedAction,
  d.confidence,
  d.approvalStatus,
  d.domainModelNote.needsReview ? 'Yes — ' + d.domainModelNote.tentativePath : 'No',
].join(' | ')).map(row => '| ' + row + ' |').join('\n');

const md = `# DOCX Path/Binding P0 Destructive Decision Draft

Generated: ${draft.generatedAt}
Mode: **DRAFT_REVIEW_REQUIRED**
Apply Allowed: **NO**

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**Draft decisions: 5**

| Metric | Value |
|--------|-------|
| Proposed removals | ${removeCount} |
| Domain-model review notes | ${domainModelCount} |
| Approved for apply | 0 |
| Apply allowed | **NO** |
| Approval required | **YES** |

---

## Why This Is Destructive

All 5 P0 items recommend **REMOVE_FIELD_FROM_CONTRACT**. This is a destructive action:

- Removing a field from a locked contract removes it from the UI schema.
- Any downstream system that binds to these paths will lose data.
- These slots appear as BAD_LABEL / UI_VISIBLE_BAD_METADATA in the audit.
- Removing them will **decrease** totalIssues but **does not fix** a mislabeled field — it removes the mislabeled field entirely.

This task is a **decision draft only**. No contract, DOCX, or binding will be modified until explicit approval is granted.

---

## Decision Table

| Decision ID | Investigation ID | BM | sourceId | Path | Proposed Action | Confidence | Approval Status | Domain Model Note |
|------------|-----------------|----|---------|------|----------------|-----------|----------------|------------------|
${decisionTable}

---

## Per-Item Evidence

### DOCX-P0-001: W2R-027 — BM-073 / person.dateOfBirth

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT
**Confidence:** HIGH
**Investigation Source:** DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1

**Evidence:** Paragraph [018]: "Thủ trưởng Cơ quan ... phân công5__PERSON_DATEOFBIRTH__... để tiếp tục thực hiện nhiệm vụ..."

BM-073 is a **Yêu cầu thay đổi nhân sự** form (request to change personnel). It does not contain personal date-of-birth fields. Footnote 5 = "Ghi cơ quan, người có thẩm quyền ra Quyết định phân công" — the slot is a phân công (assignment) reference marker, not a DOB field.

**Canonical equivalent:** None.

**Why label-only fix is unsafe:** The path person.dateOfBirth has no semantic basis in this contract. Adding a label would misrepresent the field.

**Proposed destructive action:** REMOVE person.dateOfBirth from BM-073 (e412fccad227). No replacement path needed.

**Domain model note:** No domain-model review required.

---

### DOCX-P0-002: W2R-028 — BM-073 / person.idNumber

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT
**Confidence:** HIGH
**Investigation Source:** DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1

**Evidence:** Paragraph [022]: "__PERSON_IDNUMBER__.." — a standalone reference marker appearing after the "Lưu: HSVV/HSVA, HSKS, VP." document footer items. This is a footnote reference marker, not an ID number.

BM-073 does not contain CMND/CCCD/ID number fields.

**Canonical equivalent:** None.

**Why label-only fix is unsafe:** The path person.idNumber has no semantic basis in this contract.

**Proposed destructive action:** REMOVE person.idNumber from BM-073 (e412fccad227). No replacement path needed.

**Domain model note:** No domain-model review required.

---

### DOCX-P0-003: W2R-036 — BM-080 / person.personFullName

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT (current wrong path) + DOMAIN_MODEL_REVIEW (tentative new path)
**Confidence:** HIGH
**Investigation Source:** DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1

**Evidence:** Paragraph [021]: "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:\n__PERSON_PERSONFULLNAME__"

The slot is directly under a card/license number heading. This is a **lawyer/defender card number** field, not a person name field. The placeholder {{person.personFullName}} was assigned during prior remediation based on the variable name, not the rendered DOCX content.

**Canonical equivalent:** None (this is the only person.personFullName in this contract).

**Why label-only fix is unsafe:** Renaming this field as "Họ tên" would misrepresent its purpose — it holds a card/license number, not a person name.

**Proposed destructive action:** Two-step:
1. **REMOVE** person.personFullName from BM-080 (a7aa64d4b889) — current wrong path
2. **DOMAIN_MODEL_REVIEW** — tentative new path: defender.cardLicenseNumber (or legalAid.cardLicenseNumber) — requires separate domain-model review before being added

**Domain model note:** NEEDS REVIEW. Tentative new path: defender.cardLicenseNumber. This is a domain-model proposal only. Requires separate DOMAIN_MODEL_REVIEW before being added to any contract.

---

### DOCX-P0-004: PRIOR-DXR-001 — BM-063 / document.fullDocumentCode8

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT + DOMAIN_MODEL_REVIEW (tentative new path)
**Confidence:** HIGH
**Investigation Source:** DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1

**Evidence:** 7 occurrences in BM-063 body/signature context:
- [011]: antecedent date reference
- [013]: Kiểm sát viên reference
- [014]-[017]: UBND cấp xã and procedural references
- [033]: closing reference

All reference the underlying **Lệnh kê biên tài sản** document being reported on, not the current biên bản's own document code.

**Canonical equivalent:** document.fullDocumentCode (label="Số văn bản", blockId=P0033) — legitimate, already exists.

**Why label-only fix is unsafe:** The path document.fullDocumentCode8 has no semantic basis — these are antecedent document references. Labeling them as "Số văn bản" would misrepresent their purpose.

**Proposed destructive action:** Two-step:
1. **REMOVE** document.fullDocumentCode8 from BM-063 (54b73110a34f) — orphan antecedent slots
2. **DOMAIN_MODEL_REVIEW** — tentative new path: antecedentDocument.fullDocumentCode — requires separate domain-model review before being added

**Domain model note:** NEEDS REVIEW. Tentative new path: antecedentDocument.fullDocumentCode. This is a domain-model proposal only. The legitimate document.fullDocumentCode already handles the current document's code.

---

### DOCX-P0-005: PRIOR-DXR-002 — BM-064 / document.issueDate4

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT + DOMAIN_MODEL_REVIEW (tentative new path)
**Confidence:** HIGH
**Investigation Source:** DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1

**Evidence:** 4 occurrences:
- [016]: inside "Căn cứ Lệnh kê biên tài sản số ..." (antecedent procedural citation)
- [017]: in "Xét thấy" body clause
- [020]: in "Điều 2. Yêu cầu" procedural text
- [026]: Nơi nhận suffix

None of these are issuance date positions.

**Canonical equivalent:** None.

**Why label-only fix is unsafe:** The path document.issueDate4 is a procedural/antecedent date filler, not an issuance date. Labeling it as "Ngày ban hành" would misrepresent the field.

**Proposed destructive action:** Two-step:
1. **REMOVE** document.issueDate4 from BM-064 (4d8cebc3515b) — orphan procedural date slots
2. **DOMAIN_MODEL_REVIEW** — tentative new path: antecedentDocument.issueDate — requires separate domain-model review

**Domain model note:** NEEDS REVIEW. Tentative new path: antecedentDocument.issueDate. Domain-model proposal only.

---

## Domain-Model Review Section

The following tentative new paths were identified during investigation. They are **not implementation decisions** — they require separate domain-model review before being added.

| BM | Current Wrong Path | Tentative New Path | Status |
|----|-------------------|-------------------|--------|
| BM-080 | person.personFullName | defender.cardLicenseNumber | DOMAIN_MODEL_REVIEW required |
| BM-063 | document.fullDocumentCode8 | antecedentDocument.fullDocumentCode | DOMAIN_MODEL_REVIEW required |
| BM-064 | document.issueDate4 | antecedentDocument.issueDate | DOMAIN_MODEL_REVIEW required |

These are recorded for future domain-model work. Do not implement without explicit domain-model approval.

---

## Approval Gate

This draft requires explicit approval before any destructive apply can occur.

### Required approval commands for REMOVE_FIELD_FROM_CONTRACT:

\`\`\`
APPROVE_DESTRUCTIVE_REMOVE DOCX-P0-001 BM-073 e412fccad227 person.dateOfBirth
APPROVE_DESTRUCTIVE_REMOVE DOCX-P0-002 BM-073 e412fccad227 person.idNumber
APPROVE_DESTRUCTIVE_REMOVE DOCX-P0-003 BM-080 a7aa64d4b889 person.personFullName
APPROVE_DESTRUCTIVE_REMOVE DOCX-P0-004 BM-063 54b73110a34f document.fullDocumentCode8
APPROVE_DESTRUCTIVE_REMOVE DOCX-P0-005 BM-064 4d8cebc3515b document.issueDate4
\`\`\`

### Optional approval commands for DOMAIN_MODEL_REVIEW (separate track):

\`\`\`
APPROVE_DOMAIN_MODEL_REVIEW BM-080 defender.cardLicenseNumber
APPROVE_DOMAIN_MODEL_REVIEW BM-063 antecedentDocument.fullDocumentCode
APPROVE_DOMAIN_MODEL_REVIEW BM-064 antecedentDocument.issueDate
\`\`\`

Until all required APPROVE_DESTRUCTIVE_REMOVE commands are given, apply is **blocked**.

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply write triggered: **0**
- Apply script created: **NO**
- Apply write: **NO**

---

_Lane closure auto-generated. Do not edit manually._
`;

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON, JSON.stringify(draft, null, 2), 'utf8');

console.log('[draft] Written', OUT_MD);
console.log('[draft] Written', OUT_JSON);
console.log('[draft] Total decisions:', draft.totalItems);
console.log('[draft] Summary:', JSON.stringify(draft.summary));
