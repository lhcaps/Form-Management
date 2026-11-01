/**
 * Source-slot debt family report.
 *
 * Walks the slot-inventory-summary.json, groups the SOURCE_SLOT_DEBT forms
 * by the missing key family (signature.*, person.*, offense.*, recipient.*,
 * repeated-region.*, etc.) and reports the missing-key families in
 * descending frequency order. This is the input to Phase 6's shared
 * family-adapter design.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);
const SLOT_INVENTORY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const OUT_PATH = path.join(ROLLOUT_DIR, 'source-slot-debt-family-report.json');

// Family classification rules, ordered most-specific first.
const FAMILIES = [
  { id: 'SIGNATURE_SECTION', re: /^signature\.(signerName|signMode|positionTitle|signDate|convertedByName|renderedByName|updatedByName)$/, classification: 'SIGNATURE_ROLE_VALUE', genericAdapter: 'SIGNATURE_BLOCK_ADAPTER' },
  { id: 'SIGNATURE_FULL', re: /^signature\./, classification: 'SIGNATURE_ROLE_VALUE', genericAdapter: 'SIGNATURE_BLOCK_ADAPTER' },
  { id: 'PERSON_FULLNAME', re: /^person\.(fullName|hoTen|tenBi|tenNguoi|surname|givenName|middleName)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'PERSON_BIRTHDATE', re: /^person\.(dateOfBirth|birthYear|birthDate|birthDay|birthMonth|birthYear|namSinh|ngaySinh)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'PERSON_ID_DOC', re: /^person\.(identityNo|idNumber|identityIssuedDate|identityIssuedPlace|identityIssuedDay|identityIssuedMonth|identityIssuedYear)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'PERSON_ADDRESS', re: /^person\.(currentAddress|permanentAddress|placeOfBirth|nationality|ethnicity|religion|occupation)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'PERSON_GENERIC', re: /^person\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'OFFENSE_NAME', re: /^offense\.(offenseName|toiDanh|name|legalArticle|article)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'OFFENSE_BLOCK_ADAPTER' },
  { id: 'OFFENSE_BLOCK', re: /^offense\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'OFFENSE_BLOCK_ADAPTER' },
  { id: 'CASE_SUMMARY', re: /^(case|caseInfo|accusedDecision)\.(summary|summaryLine|caseSummary|caseTitle|caseCode|accusedName)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERSON_IDENTITY_ADAPTER' },
  { id: 'CASE_INFO_BLOCK', re: /^(case|caseInfo|caseDecision)\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'CASE_INFO_BLOCK_ADAPTER' },
  { id: 'ISSUE_PLACE_DATE', re: /^document\.(issuePlaceAndDateLine|issueDateLine|issueDateText|issuePlace|issueDate)$/, classification: 'DERIVED_FROM_COMPOUND_FIELD', genericAdapter: 'COMPOUND_ISSUE_PLACE_DATE_ADAPTER' },
  { id: 'DOCUMENT_BASIC', re: /^document\.(documentCode|number|modelName|referenceCode)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'DOCUMENT_BASIC_ADAPTER' },
  { id: 'OFFICIAL_BLOCK', re: /^official\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'LEGAL_HEADER_ADAPTER' },
  { id: 'RECIPIENT_PRIMARY', re: /^recipients\.(primaryLine|recipientLine|noiNhan)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'COMPOUND_RECIPIENT_BLOCK_ADAPTER' },
  { id: 'RECIPIENT_COPY', re: /^recipients\.(copyLine|personLine\d*|archiveLine|dispatchLine|caseFileLine|luuHo)$/, classification: 'DERIVED_FROM_CASE_DATA', genericAdapter: 'COMPOUND_RECIPIENT_BLOCK_ADAPTER' },
  { id: 'RECIPIENT_GENERIC', re: /^recipients\./, classification: 'DERIVED_FROM_CASE_DATA', genericAdapter: 'COMPOUND_RECIPIENT_BLOCK_ADAPTER' },
  { id: 'AGENCY_BASIC', re: /^agency\.(name|parentName|shortName|bodyName|issuePlace|tenCo|tenVien|vienKiem|coQuan|diaDanh)$/, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'LEGAL_HEADER_ADAPTER' },
  { id: 'AGENCY_REFERENCE', re: /^agency\.(referenceLine|agencyReferenceLine)$/, classification: 'DERIVED_FROM_CASE_DATA', genericAdapter: 'LEGAL_HEADER_ADAPTER' },
  { id: 'LEGAL_BASIS', re: /^(legalBasis|content\.legalBasisLine)\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'LEGAL_BASIS_ADAPTER' },
  { id: 'LEGAL_BASIS_LINE', re: /^content\.legalBasisLine$/, classification: 'DERIVED_FROM_LEGAL_BASIS_BLOCK', genericAdapter: 'LEGAL_BASIS_ADAPTER' },
  { id: 'CONTENT_BASIC', re: /^content\.(summaryLine|decisionLine|noteLine|requestLine)$/, classification: 'DERIVED_FROM_COMPOUND_FIELD', genericAdapter: 'CONTENT_BLOCK_ADAPTER' },
  { id: 'FORMINPUTS', re: /^formInputs\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'FORM_INPUTS_ADAPTER' },
  { id: 'REQUEST', re: /^request\./, classification: 'DERIVED_FROM_CASE_DATA', genericAdapter: 'REQUEST_BLOCK_ADAPTER' },
  { id: 'NOTIFICATION', re: /^notification\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'NOTIFICATION_BLOCK_ADAPTER' },
  { id: 'CHANGEINFO', re: /^changeInfo\./, classification: 'DERIVED_FROM_CASE_DATA', genericAdapter: 'CHANGEINFO_ADAPTER' },
  { id: 'METADATA', re: /^metadata\./, classification: 'DISPLAY_ONLY', genericAdapter: 'METADATA_ADAPTER' },
  { id: 'DETENTION_REPLACE', re: /^detentionReplacement\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'DETENTION_REPLACE_ADAPTER' },
  { id: 'CANCELLED_DECISION', re: /^cancelledDecision\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'CANCELLED_DECISION_ADAPTER' },
  { id: 'DECISION_BLOCK', re: /^decision\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'DECISION_BLOCK_ADAPTER' },
  { id: 'MEASURE', re: /^measure\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'MEASURE_BLOCK_ADAPTER' },
  { id: 'REPEATED_LINE', re: /(\.line\d+|\.personLine\d+|\.row\d+)$/i, classification: 'REPEATED_SOURCE_REGION', genericAdapter: 'REPEATED_REGION_ADAPTER' },
  { id: 'CONDITIONAL', re: /^conditional\./, classification: 'CONDITIONAL_SOURCE_SLOT', genericAdapter: 'CONDITIONAL_BLOCK_ADAPTER' },
  { id: 'SOURCE_ASSIGNMENT', re: /^sourceAssignment\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'SOURCE_ASSIGNMENT_ADAPTER' },
  { id: 'OBJECTION', re: /^objection\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'OBJECTION_ADAPTER' },
  { id: 'AUTHORITY_DETERMINE', re: /^authorityDetermine\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'AUTHORITY_DETERMINE_ADAPTER' },
  { id: 'PROSECUTION_REQUEST', re: /^prosecutionRequest\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PROSECUTION_REQUEST_ADAPTER' },
  { id: 'TRAIL', re: /^trail\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'TRAIL_ADAPTER' },
  { id: 'JUDGEMENT', re: /^judgement\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'JUDGEMENT_ADAPTER' },
  { id: 'PERIOD_TIME', re: /^periodTime\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PERIOD_TIME_ADAPTER' },
  { id: 'PROCEDURAL', re: /^procedural\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'PROCEDURAL_ADAPTER' },
  { id: 'LEGAL_RELATIONS', re: /^legalRelations\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'LEGAL_RELATIONS_ADAPTER' },
  { id: 'WARNING_BOX', re: /^warningBox\./, classification: 'REQUIRED_SOURCE_SLOT', genericAdapter: 'WARNING_BOX_ADAPTER' },
];

function classifyFamily(dottedKey) {
  for (const f of FAMILIES) {
    if (f.re.test(dottedKey)) {
      return {
        familyId: f.id,
        classification: f.classification,
        genericAdapter: f.genericAdapter,
      };
    }
  }
  return {
    familyId: 'OTHER',
    classification: 'STATIC_SOURCE_TEXT',
    genericAdapter: 'PENDING_INVESTIGATION',
  };
}

async function main() {
  const inventory = JSON.parse(await readFile(SLOT_INVENTORY, 'utf8'));
  let debt = inventory.results.filter((r) => r.verdict === 'SOURCE_SLOT_DEBT');

  // The 62 GenericTemplateFormInputsPanel forms were reclassified from
  // CONTRACT_SOURCE_STUB_GAP to SOURCE_SLOT_DEBT but their sourceDebtKeys
  // is empty. Hydrate the missing keys from the delegation-aware extractor
  // so the family report reflects the real surface area.
  const DELEGATION_PATH = path.join(ROLLOUT_DIR, 'contract-delegation-62.json');
  if (existsSync(DELEGATION_PATH)) {
    const delegation = JSON.parse(await readFile(DELEGATION_PATH, 'utf8'));
    const delegationByCode = new Map(
      (delegation.records || []).map((r) => [r.formCode, r]),
    );
    debt = debt.map((row) => {
      const dg = delegationByCode.get(row.formCode);
      if (dg && (!row.sourceDebtKeys || row.sourceDebtKeys.length === 0)) {
        // The delegation extractor emits MISSING_KEYS (keys contract asks for
        // but template cannot evidence). For the family-frequency report we
        // need the *missing* surface, which is what came in via MISSING_KEYS;
        // fall back to the full EXTRACTED_CONTRACT_KEYS if MISSING is empty.
        const missing =
          (dg.MISSING_KEYS && dg.MISSING_KEYS.length > 0
            ? dg.MISSING_KEYS
            : dg.EXTRACTED_CONTRACT_KEYS) || [];
        return { ...row, sourceDebtKeys: missing };
      }
      return row;
    });
  }
  const byKey = new Map();
  let totalMissingKeys = 0;
  for (const row of debt) {
    for (const key of row.sourceDebtKeys || []) {
      totalMissingKeys += 1;
      const family = classifyFamily(key);
      const existing = byKey.get(key) || {
        key,
        familyId: family.familyId,
        classification: family.classification,
        genericAdapter: family.genericAdapter,
        affectedForms: new Set(),
      };
      existing.affectedForms.add(row.formCode);
      byKey.set(key, existing);
    }
  }

  const families = {};
  for (const v of byKey.values()) {
    families[v.familyId] = families[v.familyId] || {
      familyId: v.familyId,
      classification: v.classification,
      genericAdapter: v.genericAdapter,
      count: 0,
      affectedForms: 0,
      keys: [],
    };
    families[v.familyId].count += 1;
    families[v.familyId].affectedForms = Math.max(
      families[v.familyId].affectedForms,
      v.affectedForms.size,
    );
    families[v.familyId].keys.push({ key: v.key, count: v.affectedForms.size });
  }
  for (const f of Object.values(families)) {
    // Compute affectedForms from debt directly: a form is "affected" if
    // any of its missing keys belong to this family.
    const matchedRows = debt.filter((r) => (r.sourceDebtKeys || []).some((k) => classifyFamily(k).familyId === f.familyId));
    f.affectedForms = new Set(matchedRows.map((r) => r.formCode)).size;
  }
  const sortedFamilies = Object.values(families).sort((a, b) => b.affectedForms - a.affectedForms);
  const uniqueFormCount = new Set(debt.map((r) => r.formCode)).size;

  const report = {
    schema: 'qllaw.213.source_slot_debt_family/v1',
    finishedAt: new Date().toISOString(),
    counts: {
      sourceSlotDebtForms: uniqueFormCount,
      totalMissingKeys,
      familiesIdentified: sortedFamilies.length,
    },
    families: sortedFamilies,
    notes: [
      'Forms are de-duplicated per family; family "affectedForms" is the union of all keys in the family.',
      'Classification values follow the Phase 5 spec: REQUIRED_SOURCE_SLOT / DERIVED_FROM_COMPOUND_FIELD / DERIVED_FROM_CASE_DATA / SIGNATURE_ROLE_VALUE / STATIC_SOURCE_TEXT / REPEATED_SOURCE_REGION / CONDITIONAL_SOURCE_SLOT.',
      'Generic adapter mappings point at the Phase 6 adapter design (SIGNATURE_BLOCK_ADAPTER, PERSON_IDENTITY_ADAPTER, OFFENSE_BLOCK_ADAPTER, COMPOUND_ISSUE_PLACE_DATE_ADAPTER, REPEATED_REGION_ADAPTER, CONDITIONAL_BLOCK_ADAPTER).',
    ],
  };

  await writeFile(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  const top = sortedFamilies[0];
  console.log(`OK: family report written. ${uniqueFormCount} debt forms, ${sortedFamilies.length} families, top family: ${top?.familyId} (${top?.affectedForms} forms)`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26.
 *
 * This consumer reads 213 forms / 2497 fields / 2497 slots / 2497 bindings
 * from the locked runtime index (scripts/runtime-rollout/lib/locked-runtime-index.mjs).
 *
 * It does NOT consume:
 *   - semantic mapping v1
 *   - compiled-v2 (runtime-readiness.generated.ts) as authority
 *   - panel/save payload as authority
 *   - the deprecated .fields / .slots / .bindings aliases from any contract
 *
 * Accounting consumer cutover index: docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/accounting-consumer-cutover.json
 * ------------------------------------------------------------------ */

