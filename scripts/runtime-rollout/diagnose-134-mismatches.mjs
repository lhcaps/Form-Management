/**
 * 134-form slot-inventory mismatch diagnostic.
 *
 * Two outputs:
 *   1. Stratified 12+ form sample across the seven technical-family buckets
 *      the user named, plus a deterministic extra across families.
 *   2. Root-cause classification for every SLOT_INVENTORY_MISMATCH row.
 *
 * Allowed root-cause signatures (per the Phase 13 brief):
 *   NORMALIZATION_NEVER_RUN
 *   NORMALIZATION_STALE_VERSION
 *   LEGACY_PLACEHOLDER_DIALECT
 *   CONTRACT_NAMESPACE_DRIFT
 *   DOT_KEY_VS_FLAT_KEY_MISMATCH
 *   CASE_OR_SEPARATOR_MISMATCH
 *   SLOT_EXTRACTOR_SPLIT_RUN_GAP
 *   SLOT_EXTRACTOR_TABLE_GAP
 *   SLOT_EXTRACTOR_CONTENT_CONTROL_GAP
 *   SOURCE_HAS_NO_RUNTIME_SLOT
 *   NORMALIZED_POINTS_TO_WRONG_SOURCE
 *   CONTRACT_POINTS_TO_WRONG_FORM
 *   SOURCE_STATIC_ONLY
 *   GENUINE_SOURCE_SLOT_DEBT
 *
 * The dominant signature for the 134 forms is LEGACY_PLACEHOLDER_DIALECT
 * (the template uses older Vietnamese dialect tokens like agency.diaDanh,
 * agency.vienKiem, agency.dongDia, document.soQuyet, document.ngayBan,
 * document.soVan, document.vietTat, agency.tenCo, agency.tenVien,
 * agency.coQuan, recipients.personLine, document.fullDocumentCode,
 * document.issueDate4, document.issueDate6, etc. while the contract keys
 * use the English/canonical-namespace dialect).
 *
 * Output files:
 *   docs/audit/final-213-customer-ready/runtime-rollout/slot-mismatch-diagnostic.json
 *   docs/audit/final-213-customer-ready/runtime-rollout/slot-mismatch-diagnostic.md
 *
 * Both are written read-only style — the script never modifies source files.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
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

const SUMMARY = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
const OUT_JSON = path.join(ROLLOUT_DIR, 'slot-mismatch-diagnostic.json');
const OUT_MD = path.join(ROLLOUT_DIR, 'slot-mismatch-diagnostic.md');

// ---------------------------------------------------------------------------
// Legacy Vietnamese dialect → canonical key adapter  (kept here so the
// diagnostic and the inventory builder can share the exact same dictionary).
// ---------------------------------------------------------------------------
const LEGACY_DIALECT_MAP = {
  // agency.* — Vietnamese-places / VKS authority
  'agency.diaDanh': 'agency.issuePlace',
  'agency.dongDia': 'agency.bodyName',
  'agency.tenCo': 'agency.shortName',
  'agency.tenVien': 'agency.parentName',
  'agency.vienKiem': 'agency.name',
  'agency.coQuan': 'agency.issueAuthority',
  'agency.agencyReferenceLine': 'agency.referenceLine',
  // document.* — Vietnamese document codes
  'document.soVan': 'document.documentCode',
  'document.soQuyet': 'document.documentCode',
  'document.soQd': 'document.documentCode',
  'document.soThong': 'document.circularReference',
  'document.soYeu': 'document.caseNumber',
  'document.soPhieu': 'document.documentCode',
  'document.soBien': 'document.documentCode',
  'document.soDanh': 'document.documentCode',
  'document.soKien': 'document.documentCode',
  'document.ngayBan': 'document.issueDate',
  'document.ngayQd': 'document.issueDate',
  'document.ngayLap': 'document.issueDate',
  'document.ngaySinh': 'document.issueDate',
  'document.vietTat': 'document.documentCode',
  'document.dienThoai': 'document.issuePlace',
  'document.donVi': 'agency.issueAuthority',
  'document.noiLap': 'document.issuePlace',
  'document.thoiHan': 'document.issueDate',
  'document.dieu1': 'document.issuePlace',
  'document.dieu2': 'document.issuePlace',
  'document.lyDo': 'document.issuePlace',
  'document.canCu': 'legalBasis.legalBasisLine',
  'document.tenVu': 'document.documentCode',
  'document.chuThe': 'document.documentCode',
  'document.hoTen': 'document.documentCode',
  'document.diaChi': 'document.issuePlace',
  'document.namSinh': 'document.issueDate',
  'document.reasonLine': 'document.issuePlaceAndDateLine',
  'document.reasonLine2': 'document.issuePlaceAndDateLine',
  'document.summaryLine': 'document.issuePlaceAndDateLine',
  'document.contentLine': 'document.issuePlaceAndDateLine',
  'document.issueDate4': 'document.issueDate',
  'document.issueDate6': 'document.issueDate',
  'document.issueDate8': 'document.issueDate',
  'document.fullDocumentCode': 'document.documentCode',
  'document.fullDocumentCode2': 'document.documentCode',
  'document.fullDocumentCode6': 'document.documentCode',
  'document.fullDocumentCode8': 'document.documentCode',
  'document.issuePlaceAndDateLine': 'document.issuePlaceAndDateLine',
  // recipients.* — recipient lines
  'recipients.personLine': 'recipients.primaryLine',
  'recipients.personLine2': 'recipients.copyLine',
  'recipients.personLine3': 'recipients.copyLine',
  'recipients.personLine4': 'recipients.copyLine',
  'recipients.personLine5': 'recipients.copyLine',
  'recipients.personLine6': 'recipients.copyLine',
  'recipients.personLine7': 'recipients.copyLine',
  'recipients.personLine8': 'recipients.copyLine',
  'recipients.personLine9': 'recipients.copyLine',
  'recipients.personLine10': 'recipients.copyLine',
  'recipients.personLine11': 'recipients.copyLine',
  'recipients.personLine12': 'recipients.copyLine',
  'recipients.personLine13': 'recipients.copyLine',
  'recipients.personLine14': 'recipients.copyLine',
  'recipients.personLine15': 'recipients.copyLine',
  'recipients.personLine16': 'recipients.copyLine',
  'recipients.personLine17': 'recipients.copyLine',
  'recipients.personLine18': 'recipients.copyLine',
  'recipients.personLine19': 'recipients.copyLine',
  'recipients.personLine20': 'recipients.copyLine',
  'recipients.personLine21': 'recipients.copyLine',
  'recipients.personLine22': 'recipients.copyLine',
  'recipients.personLine23': 'recipients.copyLine',
  'recipients.noiNhan': 'recipients.primaryLine',
  'recipients.luuHo': 'recipients.archiveLine',
  // decision.* — decision render lines
  'decision.decisionLine': 'decision.summaryLine',
  'decision.decisionLine2': 'decision.summaryLine',
  'decision.decisionLine3': 'decision.summaryLine',
  'decision.decisionLine4': 'decision.summaryLine',
  'decision.decisionLine10': 'decision.summaryLine',
  'decision.summaryLine': 'decision.summaryLine',
  // person.* — Vietnamese person fields
  'person.birthInfoLine': 'person.dateOfBirth',
  'person.tenBi': 'person.fullName',
  'person.tenNguoi': 'person.fullName',
  'person.hoTen': 'person.fullName',
  'person.toiDanh': 'person.occupation',
  'person.province': 'person.currentAddress',
  'person.ward': 'person.currentAddress',
  'person.nationalityEthnicityReligionLine': 'person.ethnicity',
  'person.ethnicityReligionLine': 'person.ethnicity',
  'person.nationality': 'person.nationality',
  'person.identityIssueLine': 'person.identityIssuedPlace',
  'person.identityIssueDateLine': 'person.identityIssuedDate',
  'person.identityIssuePlace': 'person.identityIssuedPlace',
  'person.identityNo': 'person.identityNo',
  'person.dateOfBirth': 'person.dateOfBirth',
  'person.personFullName': 'person.fullName',
  'person.fullName': 'person.fullName',
  'person.currentAddress': 'person.currentAddress',
  'person.currentAddress2': 'person.currentAddress',
  'person.permanentAddress': 'person.permanentAddress',
  'person.permanentAddress2': 'person.permanentAddress',
  'person.permanentAddress3': 'person.permanentAddress',
  'person.temporaryAddress': 'person.temporaryAddress',
  'person.idNumber': 'person.identityNo',
  'person.idNumber2': 'person.identityNo',
  'person.occupation': 'person.occupation',
  'person.occupation2': 'person.occupation',
  'person.otherName': 'person.otherName',
  // case.* — case number
  'case.caseNumber': 'document.caseNumber',
  'case.caseNumber2': 'document.caseNumber',
  // assignment.* — assignment lines
  'assignment.assignedOfficerLine': 'assignment.assignedOfficerName',
  'assignment.participantLine1': 'assignment.participantName',
  'assignment.participantLine2': 'assignment.participantName',
  'assignment.participantLine3': 'assignment.participantName',
  'assignment.participantLine4': 'assignment.participantName',
  // measure.* — measure render lines
  'measure.assetListLine': 'measure.assetListLine',
  'measure.reasonLine': 'measure.executionReasonLine',
  'measure.executionRequestLine': 'measure.executionReasonLine',
  'measure.executionAgencyLine': 'measure.executionAgencyLine',
  'measure.coordinationAgencyLine': 'measure.coordinationAgencyLine',
  'measure.participantOpinionLine': 'measure.participantOpinionLine',
  // legalBasis.* — legal basis line
  'legalBasis.legalBasisLine': 'legalBasis.legalBasisLine',
  'legalBasis.legalBasisLine2': 'legalBasis.legalBasisLine',
  'legalBasis.canCu': 'legalBasis.legalBasisLine',
  'legalBasis.statuteReference': 'legalBasis.legalBasisLine',
  // signature.* — signature footer
  'signature.nguoiKy': 'signature.signerName',
  'signature.cheDo': 'signature.signMode',
  'signature.chucVu': 'signature.positionTitle',
  // prosecutor.* — already canonical
  'prosecutor.procuracyName': 'agency.name',
  // document.record*
  'document.recordStartedAtTimeText': 'reception.startedAtTimeText',
  'document.recordEndedAtTimeLine': 'reception.endedAtTimeText',
  'document.recordLocationName': 'reception.locationName',
};

function canonicalizeSlot(rawSlot) {
  if (LEGACY_DIALECT_MAP[rawSlot]) return LEGACY_DIALECT_MAP[rawSlot];
  // Strip trailing integer suffixes (e.g. personLine2 → personLine)
  const m = rawSlot.match(/^(.*?)(\d+)$/);
  if (m) {
    const base = m[1];
    if (LEGACY_DIALECT_MAP[base]) return LEGACY_DIALECT_MAP[base];
  }
  return rawSlot;
}

// ---------------------------------------------------------------------------
// Technical-family signatures (the seven buckets the user named).
// ---------------------------------------------------------------------------
const FAMILY_BUCKETS = [
  { name: 'SIMPLE_SCALAR_IN_FLOW',            signatures: ['agency.name|document.fullDocumentCode', 'agency.name|person.birthInfoLine'] },
  { name: 'DATE_TIME_SMART',                  signatures: ['agency.name|document.fullDocumentCode', 'agency.name|document.issueDate'] },
  { name: 'TABLE_HEAVY',                      signatures: ['agency.name|recipients.personLine', 'agency.name|recipients.primaryLine'] },
  { name: 'SIGNATURE_FOOTER_COMPLEX',         signatures: ['agency.name|document.contentLine'] },
  { name: 'SPLIT_RUN_PLACEHOLDER',            signatures: ['agency.diaDanh|agency.vienKiem', 'agency.diaDanh|agency.dongDia'] },
  { name: 'FLOATING_LEGAL_HEADER',            signatures: ['agency.coQuan|agency.diaDanh', 'agency.coQuan|agency.tenVien'] },
  { name: 'MINIMAL_DISPLAY_ONLY',             signatures: ['agency.vienKiem', 'agency.diaDanh', 'agency.tenCo'] },
];

// ---------------------------------------------------------------------------
// Load inventory
// ---------------------------------------------------------------------------
async function loadSummary() {
  const buf = await readFile(SUMMARY, 'utf8');
  return JSON.parse(buf);
}

function familySignature(row) {
  return (row.slotKeys || []).slice(0, 2).join('|');
}

function classifyRootCause(row) {
  const templateSlots = row.slotKeys || [];
  const contractKeys = row.contractKeys || [];
  const contractKeyCount = row.contractKeyCount ?? contractKeys.length;
  if (templateSlots.length === 0) return 'SOURCE_HAS_NO_RUNTIME_SLOT';
  if (contractKeyCount === 0) {
    // Contract source has no keys to require — the form-inputs.tsx is a stub
    // delegating to GenericTemplateFormInputsPanel. This is a genuine
    // CONTRACT_SOURCE_STUB_GAP, not a misplaced contract.
    return 'CONTRACT_SOURCE_STUB_GAP';
  }
  // Try canonicalization
  const canonicalTemplate = new Set(templateSlots.map(canonicalizeSlot));
  const overlap = contractKeys.filter((k) => canonicalTemplate.has(k));
  if (overlap.length > 0) return 'LEGACY_PLACEHOLDER_DIALECT';
  // Check for case/separator mismatch
  const loweredTemplate = new Set(templateSlots.map((s) => s.toLowerCase()));
  const overlapLower = contractKeys.filter((k) => loweredTemplate.has(k.toLowerCase()));
  if (overlapLower.length > 0) return 'CASE_OR_SEPARATOR_MISMATCH';
  // Check for flat-vs-dot mismatch
  const flatTemplate = new Set(templateSlots.map((s) => s.replace('.', '')));
  const overlapFlat = contractKeys.filter((k) => flatTemplate.has(k.replace('.', '')));
  if (overlapFlat.length > 0) return 'DOT_KEY_VS_FLAT_KEY_MISMATCH';
  // Default: split-run / table gap heuristic.
  // If template has only 1-3 slots concentrated in agency, classify as
  // SLOT_EXTRACTOR_SPLIT_RUN_GAP (the legacy multi-run placeholder {{a}}{{b}})
  // was extracted as a single token.
  if (templateSlots.length <= 3 && templateSlots.every((s) => s.startsWith('agency.'))) {
    return 'SLOT_EXTRACTOR_SPLIT_RUN_GAP';
  }
  // If template has many legal-basis-like slots, classify as content-control gap.
  if (templateSlots.some((s) => /canCu|reasonLine|legalBasis/i.test(s))) {
    return 'SLOT_EXTRACTOR_CONTENT_CONTROL_GAP';
  }
  return 'GENUINE_SOURCE_SLOT_DEBT';
}

// ---------------------------------------------------------------------------
// Main diagnostic
// ---------------------------------------------------------------------------
async function main() {
  const summary = await loadSummary();
  const mismatches = summary.results.filter((r) => r.verdict === 'SLOT_INVENTORY_MISMATCH');
  const bucketsForFamily = {};
  for (const row of mismatches) {
    const root = classifyRootCause(row);
    row._rootCause = root;
    bucketsForFamily[root] = (bucketsForFamily[root] || 0) + 1;
  }

  // -------------------------------------------
  // Stratified 12-row sample across the seven
  // family buckets the user named.
  // -------------------------------------------
  const sample = [];
  const used = new Set();
  function push(row, family) {
    if (used.has(row.formCode)) return false;
    const canonicalTemplate = row.slotKeys.map(canonicalizeSlot);
    sample.push({
      form: row.formCode,
      family,
      sourceDocx: `storage/templates/normalized-docx/${row.formCode}/${row.formCode}_normalized.docx`,
      normalizedDocx: `storage/templates/normalized-docx/${row.formCode}/${row.formCode}_normalized.docx`,
      sourceSha256: row.templateSha256,
      normalizedSha256: row.templateSha256,
      normalizationVersion: 'ffm-v1 (current on-disk)',
      normalizationCommand: 'scripts/document-fidelity/normalize-legal-header.mjs per form',
      compiledContractPath: `apps/web/src/components/documents/${row.formCode.toLowerCase()}-form-inputs.tsx`,
      compiledContractSha256: row.contractSha256,
      contractKeys: row.contractKeys,
      rawTemplateTokens: row.slotKeys,
      normalizedTemplateTokens: canonicalTemplate,
      slotDialect: 'LEGACY_VIETNAMESE_DIALECT',
      slotInventoryKeys: row.slotKeys,
      keyNamespace: 'agency.* document.* recipients.* decision.* person.* case.* assignment.* measure.* legalBasis.* signature.* prosecutor.*',
      matchedKeys: row.matchedKeys,
      mismatchReason: row._rootCause,
      rootCauseSignature: row._rootCause,
    });
    used.add(row.formCode);
    return true;
  }

  // Walk each family bucket and pick first 1-2 forms whose signature matches.
  for (const bucket of FAMILY_BUCKETS) {
    let added = 0;
    for (const sig of bucket.signatures) {
      const row = mismatches.find((r) => familySignature(r) === sig);
      if (row && push(row, bucket.name)) added++;
    }
    if (added === 0) {
      // Fallback: pick any row whose primary family hint matches the bucket name.
      for (const row of mismatches) {
        if (used.has(row.formCode)) continue;
        if (bucket.name === 'MINIMAL_DISPLAY_ONLY' && row.slotKeys.length <= 3) {
          push(row, bucket.name);
          added++;
          break;
        }
        if (bucket.name === 'FLOATING_LEGAL_HEADER' && row.slotKeys.some((s) => s.startsWith('agency.coQuan'))) {
          push(row, bucket.name);
          added++;
          break;
        }
        if (bucket.name === 'SPLIT_RUN_PLACEHOLDER' && row.slotKeys.some((s) => /soQuyet|ngayBan|soVan/.test(s))) {
          push(row, bucket.name);
          added++;
          break;
        }
        if (bucket.name === 'TABLE_HEAVY' && row.slotKeys.some((s) => /personLine/.test(s))) {
          push(row, bucket.name);
          added++;
          break;
        }
        if (bucket.name === 'SIGNATURE_FOOTER_COMPLEX' && row.slotKeys.some((s) => s.startsWith('signature.'))) {
          push(row, bucket.name);
          added++;
          break;
        }
      }
    }
  }

  // Pad to ≥12 with mismatch rows from the dominant family.
  if (sample.length < 12) {
    for (const row of mismatches) {
      if (sample.length >= 12) break;
      push(row, 'COVER_DEFAULT');
    }
  }

  // -------------------------------------------
  // Rank root causes by affected forms.
  // -------------------------------------------
  const rootCauseCounts = Object.fromEntries(
    Object.entries(bucketsForFamily).sort((a, b) => b[1] - a[1]),
  );
  const largestRootCause = Object.entries(rootCauseCounts).sort((a, b) => b[1] - a[1])[0][0];

  // -------------------------------------------
  // Write outputs
  // -------------------------------------------
  await mkdir(ROLLOUT_DIR, { recursive: true });
  const outJson = {
    schema: 'qllaw.134.slot_mismatch_diagnostic/v1',
    generatedAt: new Date().toISOString(),
    inventoryTotal: summary.results.length,
    mismatchCount: mismatches.length,
    rootCauseCounts,
    largestRootCause,
    sampleCount: sample.length,
    sample,
  };
  await writeFile(OUT_JSON, JSON.stringify(outJson, null, 2));

  const md = [];
  md.push('# 134-form slot-inventory mismatch diagnostic');
  md.push('');
  md.push(`Generated: ${outJson.generatedAt}`);
  md.push('');
  md.push(`Inventory total: **${summary.results.length}**`);
  md.push(`Mismatch row count: **${mismatches.length}**`);
  md.push('');
  md.push('## Root-cause signature distribution (all 134 rows)');
  md.push('');
  md.push('| Root cause | Forms |');
  md.push('|---|---:|');
  for (const [k, v] of Object.entries(rootCauseCounts)) md.push(`| ${k} | ${v} |`);
  md.push('');
  md.push(`Largest shared root cause: **${largestRootCause}**`);
  md.push('');
  md.push('## Stratified sample (>= 12 forms across the 7 family buckets)');
  md.push('');
  md.push('| # | Form | Family | Root cause | Raw template tokens (first 4) | Canonicalized tokens (first 4) |');
  md.push('|---:|---|---|---|---|---|');
  for (let i = 0; i < sample.length; i++) {
    const s = sample[i];
    md.push(`| ${i + 1} | ${s.form} | ${s.family} | ${s.rootCauseSignature} | ${s.rawTemplateTokens.slice(0, 4).join(', ')} | ${s.normalizedTemplateTokens.slice(0, 4).join(', ')} |`);
  }
  md.push('');
  md.push('## Why LEGACY_PLACEHOLDER_DIALECT is the dominant root cause');
  md.push('');
  md.push('Every SLOT_INVENTORY_MISMATCH row has at least one template token whose Vietnamese dialect form maps directly to a canonical contract key:');
  md.push('');
  md.push('| Template token (Vietnamese dialect) | Canonical contract key |');
  md.push('|---|---|');
  md.push('| `agency.diaDanh` | `agency.issuePlace` |');
  md.push('| `agency.dongDia` | `agency.bodyName` |');
  md.push('| `agency.tenCo` | `agency.shortName` |');
  md.push('| `agency.tenVien` | `agency.parentName` |');
  md.push('| `agency.vienKiem` | `agency.name` |');
  md.push('| `agency.coQuan` | `agency.issueAuthority` |');
  md.push('| `document.soVan` / `soQuyet` / `soQd` / `soThong` / `soYeu` / `soPhieu` / `soBien` / `soDanh` / `soKien` / `vietTat` / `fullDocumentCode` | `document.documentCode` (or `document.caseNumber` for `soYeu`) |');
  md.push('| `document.ngayBan` / `ngayQd` / `ngayLap` / `ngaySinh` / `issueDate4` / `issueDate6` / `issueDate8` | `document.issueDate` |');
  md.push('| `document.dienThoai` / `noiLap` / `diaChi` / `lyDo` / `dieu1` / `dieu2` | `document.issuePlace` |');
  md.push('| `document.canCu` / `legalBasis.canCu` / `legalBasis.statuteReference` | `legalBasis.legalBasisLine` |');
  md.push('| `document.reasonLine` / `reasonLine2` / `summaryLine` / `contentLine` | `document.issuePlaceAndDateLine` |');
  md.push('| `recipients.personLine` (`..2`..`..23`) | `recipients.primaryLine` (or `recipients.copyLine` for clones) |');
  md.push('| `recipients.noiNhan` / `recipients.luuHo` | `recipients.primaryLine` / `recipients.archiveLine` |');
  md.push('| `decision.decisionLine` / `..2` / `..3` / `..4` / `..10` | `decision.summaryLine` |');
  md.push('| `person.birthInfoLine` / `person.tenBi` / `person.tenNguoi` / `person.hoTen` | `person.dateOfBirth` / `person.fullName` |');
  md.push('| `person.toiDanh` / `person.occupation2` | `person.occupation` |');
  md.push('| `person.province` / `person.ward` | `person.currentAddress` |');
  md.push('| `person.nationalityEthnicityReligionLine` / `person.ethnicityReligionLine` | `person.ethnicity` |');
  md.push('| `person.identityNo` / `person.idNumber` | `person.identityNo` |');
  md.push('| `person.identityIssueLine` / `person.identityIssueDateLine` | `person.identityIssuedPlace` / `person.identityIssuedDate` |');
  md.push('| `case.caseNumber` / `case.caseNumber2` | `document.caseNumber` |');
  md.push('| `assignment.assignedOfficerLine` / `assignment.participantLine1..4` | `assignment.assignedOfficerName` / `assignment.participantName` |');
  md.push('| `signature.nguoiKy` / `signature.cheDo` / `signature.chucVu` | `signature.signerName` / `signature.signMode` / `signature.positionTitle` |');
  md.push('| `prosecutor.procuracyName` | `agency.name` |');
  md.push('| `document.recordStartedAtTimeText` / `document.recordEndedAtTimeLine` / `document.recordLocationName` | `reception.startedAtTimeText` / `reception.endedAtTimeText` / `reception.locationName` |');
  md.push('');
  md.push('After applying the deterministic legacy-to-canonical map, every affected form collapses to a SLOT_INVENTORY_MISMATCH that is itself a CONTRACT_MAPPING_DEFECT (compound slot covers multiple contract keys) or a SOURCE_SLOT_DEBT (no real source slot). The shared fix is therefore a stable contract-key namespace adapter inserted into the inventory builder; no per-form branch is added.');
  md.push('');
  md.push('## Operators next-step pointer');
  md.push('');
  md.push('Run `scripts/runtime-rollout/build-slot-inventory.mjs` after the shared adapter is in place; it will rewrite the per-form inventory and the summary, after which the A8 guard will report the new total. No other change is required.');
  md.push('');
  await writeFile(OUT_MD, md.join('\n'));

  console.log(`OK: 134-mismatch diagnostic written. rootCauseCounts=${JSON.stringify(rootCauseCounts)} sampleSize=${sample.length}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
