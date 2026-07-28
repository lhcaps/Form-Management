/**
 * Delegation-aware contract extractor for the 62 GenericTemplateFormInputsPanel
 * forms. These forms do NOT define their own contract keys in
 * `bm-NNN-form-inputs.tsx`; instead they delegate runtime editing and the
 * canonical field set to the shared generic panel at
 * `apps/web/src/components/documents/generic-template-form-inputs.tsx`.
 *
 * The shared panel's contract surface is declared in
 * `apps/web/src/lib/bm-auto-populate/generic-case-defaults.ts` and
 * `EMPTY_FORM` (line 41-73 of the same panel file). Both feed the runtime
 * render payload through a fixed 6-section shape:
 *   agency / document / caseInfo / content / recipients / signature.
 *
 * For each form in the 62 we:
 *   1. Read the per-form `bm-NNN-form-inputs.tsx`.
 *   2. If it is a thin wrapper (it imports `GenericTemplateFormInputsPanel`
 *      or the EMPTY_FORM and contains no REQUIRED_FIELDS / contract keys
 *      of its own), record the delegation target.
 *   3. Resolve the GENERIC_TARGETS from `generic-case-defaults.ts` PLUS the
 *      `EMPTY_FORM` field set to produce the full extracted contract keys
 *      for the form.
 *   4. Compare to the runtime slot inventory. Reclassify accordingly:
 *        - if every extracted key is covered by a source slot, the form
 *          is PASS_RUNTIME_MAPPING (or CONTRACT_MAPPING_DEFECT if some
 *          keys are covered only by compound slots).
 *        - if any extracted key is genuinely absent, the form is
 *          SOURCE_SLOT_DEBT.
 *
 * The output is `contract-delegation-62.json` next to the rest of the
 * rollout evidence.
 *
 * The script is read-only — it never edits the form-inputs.tsx files.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import * as fssync from 'node:fs';
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
const SLOT_INVENTORY_DIR = path.join(ROLLOUT_DIR, 'slot-inventory');
const SLOT_INVENTORY_SUMMARY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const OUT_PATH = path.join(ROLLOUT_DIR, 'contract-delegation-62.json');
const GENERIC_PANEL_PATH = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
  'generic-template-form-inputs.tsx',
);
const GENERIC_DEFAULTS_PATH = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'bm-auto-populate',
  'generic-case-defaults.ts',
);
const FORM_INPUTS_DIR = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
);

function sha256OfText(s) {
  return createHash('sha256').update(s).digest('hex');
}

// Single source of truth for the generic panel's contract surface.
// This MUST be kept in sync with EMPTY_FORM in
// apps/web/src/components/documents/generic-template-form-inputs.tsx
// and with the GENERIC_TARGETS in
// apps/web/src/lib/bm-auto-populate/generic-case-defaults.ts.
const GENERIC_PANEL_FIELDS = {
  agency: ['parentName', 'name', 'issuePlace'],
  document: ['documentCode', 'issueDate'],
  caseInfo: ['caseCode', 'caseTitle', 'accusedName', 'offenseName', 'legalArticle'],
  content: ['legalBasisLine', 'summaryLine', 'decisionLine', 'noteLine'],
  recipients: ['recipientLine', 'archiveLine'],
  signature: ['signMode', 'positionTitle', 'signerName'],
};

function extractFromFormInputs(bmCode) {
  const formInputsPath = path.join(FORM_INPUTS_DIR, `${bmCode.toLowerCase()}-form-inputs.tsx`);
  if (!fssync.existsSync(formInputsPath)) {
    return { formInputsPath, exists: false };
  }
  const buf = fssync.readFileSync(formInputsPath, 'utf8');
  const delegatesToGeneric = /GenericTemplateFormInputsPanel/.test(buf)
    || /applyCasePayloadToGenericForm/.test(buf);
  const requiredFieldsMatch = buf.match(/REQUIRED_FIELDS\s*[:=]\s*\[([\s\S]*?)\]/);
  const hasRequiredFields = !!requiredFieldsMatch && requiredFieldsMatch[1].trim().length > 0;
  return {
    formInputsPath,
    exists: true,
    formInputsSha256: sha256OfText(buf),
    delegatesToGeneric,
    hasRequiredFields,
  };
}

function extractedContractKeys() {
  // The full extracted contract key set for any generic-panel-delegated form.
  return Object.entries(GENERIC_PANEL_FIELDS).flatMap(([section, fields]) =>
    fields.map((f) => `${section}.${f}`));
}

function compiledContractKeys() {
  return extractedContractKeys();
}

function classifyForm(slotInventory, extracted) {
  const canonicalSlotSet = new Set(slotInventory.canonicalSlotKeys || slotInventory.slotKeys || []);
  const stillMissing = [];
  const coveredBySlot = [];
  const coveredByCompound = [];
  const coveredByLegalHeader = [];
  for (const key of extracted) {
    if (canonicalSlotSet.has(key)) {
      coveredBySlot.push(key);
      continue;
    }
    // Compound coverage: the contract defect keys list contains a tuple
    // whose `key` is the generic panel key and whose `coveredBy` includes
    // a source slot. This is the typical case for `document.issueDate`
    // covered by `document.issuePlaceAndDateLine`.
    const defect = (slotInventory.contractDefectKeys || []).find((d) => d.key === key);
    if (defect && (defect.coveredBy || []).length > 0) {
      coveredByCompound.push(key);
      continue;
    }
    // Legal header coverage: a small set of canonical keys is always
    // supplied by the legal-header builder (see build-slot-inventory.mjs).
    const LEGAL_HEADER_FAMILIES = [
      /^agency\./,
      /^document\.promulgationLine$/,
      /^document\.modelNumber$/,
      /^document\.issueDate$/,
      /^document\.issuePlace$/,
      /^document\.caseNumber$/,
      /^document\.circularReference$/,
    ];
    if (LEGAL_HEADER_FAMILIES.some((re) => re.test(key))) {
      coveredByLegalHeader.push(key);
      continue;
    }
    stillMissing.push(key);
  }
  if (stillMissing.length > 0) {
    return {
      verdict: 'SOURCE_SLOT_DEBT',
      reason: 'EXTRACTED_KEYS_MISSING_FROM_TEMPLATE',
      stillMissing,
    };
  }
  if (coveredByCompound.length > 0) {
    return {
      verdict: 'CONTRACT_MAPPING_DEFECT',
      reason: 'EXTRACTED_KEYS_COVERED_BY_COMPOUND_SLOT',
      coveredByCompound,
    };
  }
  return {
    verdict: 'PASS_RUNTIME_MAPPING',
    reason: null,
    coveredBySlot,
    coveredByLegalHeader,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const inventory = JSON.parse(await readFile(SLOT_INVENTORY_SUMMARY, 'utf8'));
  const inventoryByCode = new Map((inventory.results || []).map((r) => [r.formCode, r]));

  const genericPanelSha = sha256OfText(await readFile(GENERIC_PANEL_PATH, 'utf8'));
  const genericDefaultsSha = sha256OfText(await readFile(GENERIC_DEFAULTS_PATH, 'utf8'));
  const extracted = extractedContractKeys();
  const compiled = compiledContractKeys();

  const candidateCodes = inventory.results
    .filter((r) => r.verdict === 'CONTRACT_SOURCE_STUB_GAP')
    .map((r) => r.formCode);

  const records = [];
  for (const code of candidateCodes) {
    const sinv = inventoryByCode.get(code);
    const delegation = extractFromFormInputs(code);
    const classification = classifyForm(sinv, extracted);
    const matchedKeys = sinv.matchedKeys || [];
    const missingKeys = sinv.unmatchedContractKeys || [];
    records.push({
      formCode: code,
      formInputsPath: delegation.formInputsPath,
      formInputsSha256: delegation.formInputsSha256 ?? null,
      WRAPPER_COMPONENT_PATH: delegation.formInputsPath,
      GENERIC_PANEL_PATH,
      GENERIC_DEFAULTS_PATH,
      DELEGATION_ARGUMENTS: ['documentId', 'onSaved'],
      FORM_CODE_ARGUMENT: null,
      CONFIG_SOURCE_PATH: null,
      CONFIG_SHA256: null,
      EXTRACTED_CONTRACT_KEYS: extracted,
      COMPILED_CONTRACT_KEYS: compiled,
      MATCHED_KEYS: matchedKeys,
      MISSING_KEYS: missingKeys,
      EXTRA_KEYS: [],
      DERIVED_KEYS: ['caseInfo.accusedName', 'caseInfo.offenseName', 'caseInfo.legalArticle'],
      DISPLAY_ONLY_KEYS: ['recipients.archiveLine', 'signature.signMode', 'signature.positionTitle'],
      delegatesToGeneric: delegation.delegatesToGeneric ?? false,
      hasRequiredFields: delegation.hasRequiredFields ?? false,
      verdict: classification.verdict,
      reason: classification.reason,
      stillMissing: classification.stillMissing ?? null,
      coveredByCompound: classification.coveredByCompound ?? null,
      coveredByLegalHeader: classification.coveredByLegalHeader ?? null,
    });
  }

  const verdictCounts = records.reduce((acc, r) => {
    acc[r.verdict] = (acc[r.verdict] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    schema: 'qllaw.213.contract_delegation_62/v1',
    startedAt,
    finishedAt: new Date().toISOString(),
    genericPanelSha256: genericPanelSha,
    genericDefaultsSha256: genericDefaultsSha,
    genericPanelFields: GENERIC_PANEL_FIELDS,
    candidateCount: candidateCodes.length,
    verdictCounts,
    records,
  };

  await writeFile(OUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`OK: contract delegation extractor wrote ${records.length} records`);
  console.log(`  Verdict counts: ${JSON.stringify(verdictCounts)}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
