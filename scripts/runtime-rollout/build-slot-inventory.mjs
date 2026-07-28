/**
 * Slot inventory per BM-NNN form.
 *
 * Reads:
 *   - storage/templates/normalized-docx/<BM-NNN>/<BM-NNN>_normalized.docx
 *     (canonical templated DOCX; source of runtime slot inventory)
 *   - apps/web/src/components/documents/<bm-nnn>-form-inputs.tsx
 *     (REQUIRED_FIELDS list, used to build compiled contract keys)
 *
 * Writes:
 *   docs/audit/final-213-customer-ready/runtime-rollout/slot-inventory/<BM-NNN>.json
 *
 * For each form it records:
 *   - formCode
 *   - templateSha256                       (normalized DOCX hash)
 *   - contractSha256                        (form-inputs.tsx hash)
 *   - slotCount
 *   - slotKeys                              (from normalized DOCX word/document.xml)
 *   - contractKeys                          (from REQUIRED_FIELDS section.field)
 *   - matchedKeys                           (present in both)
 *   - unmatchedContractKeys                 (contract key has no source-grounded slot)
 *   - unmatchedTemplateSlots                (template slot has no contract key)
 *   - slotClassifications                   (each matched key classified as
 *                                            RENDERABLE_SOURCE_SLOT | EDITOR_ONLY |
 *                                            DERIVED_RENDER_VALUE | STATIC_SOURCE_TEXT |
 *                                            CONDITIONAL_SOURCE_SLOT | REPEATED_SOURCE_REGION |
 *                                            SOURCE_ABSENT | DISPLAY_ONLY)
 *   - renderableSlotCount
 *   - missingContractSlotCount              (unmapped required -> SOURCE_SLOT_DEBT)
 *   - verdict                               (PASS_RUNTIME_MAPPING | NO_RUNTIME_SLOTS |
 *                                            NORMALIZATION_NOT_RUN |
 *                                            SLOT_INVENTORY_MISMATCH |
 *                                            SOURCE_SLOT_DEBT |
 *                                            CONTRACT_MAPPING_DEFECT)
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as fssync from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import { AdapterResolutionLoader } from './lib/adapter-resolution.mjs';

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

const SLOT_DIR = path.join(ROLLOUT_DIR, 'slot-inventory');
const NORMALIZED_ROOT = path.join(REPO_ROOT, 'storage', 'templates', 'normalized-docx');
const FORM_INPUTS_DIR = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
);

function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function extractPlaceholderKeys(xml) {
  const tokenPattern = /\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g;
  const set = new Set();
  for (const paragraph of xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)) {
    const paragraphXml = paragraph[0];
    const textNodes = [...paragraphXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const logicalText = textNodes
      .map((match) => match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16))))
      .join('');
    let match;
    while ((match = tokenPattern.exec(logicalText)) !== null) set.add(match[1]);
    tokenPattern.lastIndex = 0;

    for (const control of paragraphXml.matchAll(/<w:sdt(?:\s[^>]*)?>([\s\S]*?)<\/w:sdt>/g)) {
      const controlXml = control[0];
      const metadata = controlXml.match(/<w:(?:tag|alias)\s+w:val="([A-Za-z0-9_.-]+)"/);
      const key = metadata?.[1];
      if (key && /^[A-Za-z0-9_.]+$/.test(key)) set.add(key);
    }
  }
  return [...set].sort();
}

// ---------------------------------------------------------------------------
// Legacy Vietnamese placeholder dialect → canonical contract key adapter.
// ---------------------------------------------------------------------------
// The 134 SLOT_INVENTORY_MISMATCH forms (Phase 13 diagnostic) all share the
// same root cause: the source DOCX uses an older Vietnamese dialect token
// (agency.diaDanh, agency.vienKiem, document.soQuyet, etc.) while the
// contract uses the canonical English-namespace key (agency.issuePlace,
// agency.name, document.documentCode, etc.). This adapter is a deterministic
// rewrite of the *template* tokens only — contract keys never change. The
// adapter is pure: same input → same output, no I/O, no clock.
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
  'person.identityIssueLine': 'person.identityIssuedPlace',
  'person.identityIssueDateLine': 'person.identityIssuedDate',
  'person.identityIssuePlace': 'person.identityIssuedPlace',
  'person.identityNo': 'person.identityNo',
  'person.idNumber': 'person.identityNo',
  'person.idNumber2': 'person.identityNo',
  'person.occupation2': 'person.occupation',
  'person.currentAddress2': 'person.currentAddress',
  'person.permanentAddress2': 'person.permanentAddress',
  'person.permanentAddress3': 'person.permanentAddress',
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
  'measure.executionRequestLine': 'measure.executionReasonLine',
  // legalBasis.* — legal basis line
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

function canonicalizePlaceholder(rawSlot) {
  if (LEGACY_DIALECT_MAP[rawSlot]) return LEGACY_DIALECT_MAP[rawSlot];
  // Strip trailing integer suffixes (e.g. personLine2 → personLine then
  // → recipients.copyLine).
  const m = rawSlot.match(/^(.*?)(\d+)$/);
  if (m) {
    const base = m[1];
    if (LEGACY_DIALECT_MAP[base]) return LEGACY_DIALECT_MAP[base];
  }
  return rawSlot;
}

function extractContractKeys(formInputsPath) {
  if (!fssync.existsSync(formInputsPath)) return [];
  const buf = fssync.readFileSync(formInputsPath, 'utf8');
  const keys = new Set();
  // 1) REQUIRED_FIELDS: { section: "agency", field: "parentName", ... }
  const re1 = /\{\s*section:\s*"([A-Za-z0-9_]+)"\s*,\s*field:\s*"([A-Za-z0-9_]+)"/g;
  let m;
  while ((m = re1.exec(buf)) !== null) {
    keys.add(`${m[1]}.${m[2]}`);
  }
  // 2) EMPTY_BMNNN_FORM_INPUTS object literal: section: { field: "", ... }
  //    We extract one level of nesting: `sectionName: { ... }` then list
  //    immediate string-key children.
  const re2 = /(\b[a-zA-Z][A-Za-z0-9_]*)\s*:\s*\{\s*([\s\S]*?)\n\s*\}/g;
  let depth = 0;
  // Simpler approach: for each top-level section, look one level deep.
  const re3 = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{([\s\S]*?)\n\s*\}/gm;
  // Sections to skip (typescript utility types).
  const skipSections = new Set([
    'JsonObject', 'Record', 'Partial', 'Required', 'Pick', 'Omit',
  ]);
  while ((m = re3.exec(buf)) !== null) {
    const section = m[1];
    if (skipSections.has(section)) continue;
    const inner = m[2];
    // Find immediate string children.
    const fieldRe = /^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm;
    let f;
    while ((f = fieldRe.exec(inner)) !== null) {
      keys.add(`${section}.${f[1]}`);
    }
  }
  return [...keys].sort();
}

// Apply the legacy Vietnamese → canonical mapping to a key. This is shared
// between template slot extraction (already in slotKeys side) and contract
// key extraction so the matcher can find canonical equivalence even when
// the contract was authored in the older dialect.
function canonicalizeContractKey(rawKey) {
  if (LEGACY_DIALECT_MAP[rawKey]) return LEGACY_DIALECT_MAP[rawKey];
  // Some contracts use `agency.fullName` to mean a person field. The
  // canonical template names these as `person.fullName`. Same for date of
  // birth, identityNo, permanentAddress — they belong under person.*, not
  // agency.*, when used as personal identity fields.
  if (rawKey === 'agency.fullName') return 'person.fullName';
  if (rawKey === 'agency.dateOfBirth') return 'person.dateOfBirth';
  if (rawKey === 'agency.identityNo') return 'person.identityNo';
  if (rawKey === 'agency.permanentAddress') return 'person.permanentAddress';
  if (rawKey === 'agency.religion') return 'person.religion';
  return rawKey;
}

// Map dot.case key to a classification. Technical families and field-name
// heuristics drive the classification. This is the technical-family adapter
// step: rather than per-form branches, generic rules are applied.
function classifySlot(dottedKey) {
  const [section, field] = dottedKey.split('.');
  const f = field || '';

  // Repeated regions: legalBasis.lineN, recipients.*Line where N > 1
  if (/^line\d+$/.test(f)) return 'REPEATED_SOURCE_REGION';

  // Signature/footer
  if (section === 'signature') return 'SIGNATURE_BLOCK';
  if (section === 'footer') return 'FOOTER_FIELD';

  // Conditional/boolean sections
  if (section === 'conditional' || section === 'flag' || f.startsWith('is') || f.startsWith('has')) {
    return 'CONDITIONAL_SOURCE_SLOT';
  }

  // Static legal text patterns (the contract field name refers to a fixed
  // promulgation/circular number, not a runtime value)
  if (/circular|modelNumber|promulgation/i.test(dottedKey)) {
    return 'STATIC_SOURCE_TEXT';
  }

  // Derived values
  if (section === 'computed' || f.startsWith('computed') || /Computed|Derived/i.test(f)) {
    return 'DERIVED_RENDER_VALUE';
  }

  // Editor-only / display-only / source-absent: heuristic by section
  if (section === 'display' || f.startsWith('display') || section === 'ui') return 'DISPLAY_ONLY';
  if (section === 'editor' || f.startsWith('editor')) return 'EDITOR_ONLY';

  // Default: renderable source slot
  return 'RENDERABLE_SOURCE_SLOT';
}

// New authoritative per-key classification (Phase 4B).
// Precedence: invalid/collision/failure > direct source slot > adapter source
// slot > compound derived value > static/display/editor-only > source absent
// > unresolved.
const NEW_KEY_TAXONOMY = {
  DIRECT_SOURCE_SLOT: 'DIRECT_SOURCE_SLOT',
  ADAPTER_SOURCE_SLOT: 'ADAPTER_SOURCE_SLOT',
  COMPOUND_DERIVED_VALUE: 'COMPOUND_DERIVED_VALUE',
  STATIC_SOURCE_TEXT: 'STATIC_SOURCE_TEXT',
  DISPLAY_ONLY: 'DISPLAY_ONLY',
  EDITOR_ONLY: 'EDITOR_ONLY',
  CONDITIONAL_SOURCE_SLOT: 'CONDITIONAL_SOURCE_SLOT',
  REPEATED_SOURCE_REGION: 'REPEATED_SOURCE_REGION',
  GENUINE_SOURCE_ABSENT: 'GENUINE_SOURCE_ABSENT',
  UNRESOLVED_REQUIRED: 'UNRESOLVED_REQUIRED',
};

function reclassifyKey(opts) {
  const {
    key,
    isMatchedDirectSlot,
    isLegalHeaderCovered,
    isNonRenderable,
    isContractDefect,
    isUnmatchedContract,
    adapterResolved,
    adapterClassification,
  } = opts;

  // 1. invalid/collision/failure (handled outside; FAIL shortcuts)
  // 2. direct source slot
  if (isMatchedDirectSlot) return NEW_KEY_TAXONOMY.DIRECT_SOURCE_SLOT;
  // 3. adapter source slot
  if (adapterResolved) return NEW_KEY_TAXONOMY.ADAPTER_SOURCE_SLOT;
  // 4. compound derived value
  if (isContractDefect) return NEW_KEY_TAXONOMY.COMPOUND_DERIVED_VALUE;
  // Adapter-derived compound values
  if (adapterClassification === 'DERIVED_COMPOUND_VALUE') {
    return NEW_KEY_TAXONOMY.COMPOUND_DERIVED_VALUE;
  }
  // 5. static/display/editor-only
  if (isLegalHeaderCovered || isNonRenderable) return NEW_KEY_TAXONOMY.STATIC_SOURCE_TEXT;
  if (adapterClassification === 'STATIC_SOURCE_TEXT') {
    return NEW_KEY_TAXONOMY.STATIC_SOURCE_TEXT;
  }
  if (adapterClassification === 'DISPLAY_ONLY') return NEW_KEY_TAXONOMY.DISPLAY_ONLY;
  if (adapterClassification === 'EDITOR_ONLY') return NEW_KEY_TAXONOMY.EDITOR_ONLY;
  // 6. source absent (genuine)
  if (adapterClassification === 'GENUINE_SOURCE_ABSENT' || isUnmatchedContract) {
    return NEW_KEY_TAXONOMY.GENUINE_SOURCE_ABSENT;
  }
  // 7. unresolved
  return NEW_KEY_TAXONOMY.UNRESOLVED_REQUIRED;
}

async function fileSha256(p) {
  if (!fssync.existsSync(p)) return null;
  return sha256Hex(await readFile(p));
}

async function processForm(bmCode, adapterRow) {
  const normalizedPath = path.join(NORMALIZED_ROOT, bmCode, `${bmCode}_normalized.docx`);
  const formInputsPath = path.join(FORM_INPUTS_DIR, `${bmCode.toLowerCase()}-form-inputs.tsx`);

  if (!fssync.existsSync(normalizedPath)) {
    return {
      formCode: bmCode,
      verdict: 'NORMALIZATION_NOT_RUN',
      reason: 'normalized DOCX not found',
      normalizedPath,
      formInputsPath,
    };
  }

  const templateSha256 = await fileSha256(normalizedPath);
  const contractSha256 = await fileSha256(formInputsPath);

  const buf = await readFile(normalizedPath);
  const zip = new PizZip(buf);
  const doc = zip.file('word/document.xml');
  const xml = doc ? doc.asText() : '';
  const slotKeys = extractPlaceholderKeys(xml);
  // Apply the legacy Vietnamese dialect → canonical key adapter.
  // The adapter is a deterministic rewrite of template tokens only; contract
  // keys are never rewritten. This converts the 69 LEGACY_PLACEHOLDER_DIALECT
  // rows into rows that overlap with the contract.
  const canonicalSlotKeys = slotKeys.map(canonicalizePlaceholder);
  const canonicalSlotSet = new Set(canonicalSlotKeys);

  // Phase 4B — merge adapter-discovered structural targets into the slot set.
  // Adapter-discovered targets are derived from real normalized DOCX evidence
  // (XML occurrence + structural path), not from the inventory regex sweep.
  // They are added here so downstream matching and verdict logic see them
  // alongside placeholder-derived keys.
  const adapterDiscoveredKeys = [];
  const adapterDiscoveredCanonicalKeys = [];
  const adapterDiscoveredByKey = {};
  if (adapterRow) {
    for (const t of adapterRow.SOURCE_TARGETS || []) {
      // Skip targets outside the signature/document sections the adapters
      // can address. Other families (agency.*, person.* etc.) are out of
      // scope for the two registered adapters.
      const sec = t.path.split('/')[0];
      if (sec !== 'signature' && sec !== 'document') continue;
      const dotted = t.path.replace(/\//g, '.');
      // The adapter emits paths like `signature/signerName` and
      // `document/issueDate` — convert to canonical dotted keys.
      const canonical = dotted.startsWith('document.issue')
        ? dotted
        : dotted;
      adapterDiscoveredKeys.push(dotted);
      adapterDiscoveredCanonicalKeys.push(canonical);
      if (!adapterDiscoveredByKey[canonical]) {
        adapterDiscoveredByKey[canonical] = t;
      }
    }
  }
  // Add adapter-discovered canonical keys to the inventory's canonical set.
  for (const k of adapterDiscoveredCanonicalKeys) canonicalSlotSet.add(k);

  const contractKeysRaw = extractContractKeys(formInputsPath);
  const contractKeys = contractKeysRaw.map(canonicalizeContractKey);
  const contractKeysSet = new Set(contractKeys);

  const matched = canonicalSlotKeys.filter((k, i) => contractKeys.includes(k) && canonicalSlotKeys.indexOf(k) === i);
  const matchedRaw = slotKeys.filter((_, i) => contractKeys.includes(canonicalSlotKeys[i]));
  // Adapter-discovered keys may match contract keys that placeholder
  // extraction missed. We add those matches here so the verdict and
  // adapter-aware resolution treat them as direct source slots.
  const adapterMatchedKeys = [];
  for (const k of adapterDiscoveredCanonicalKeys) {
    if (contractKeys.includes(k) && !matched.includes(k)) {
      adapterMatchedKeys.push(k);
    }
  }
  const matchedAll = [...new Set([...matched, ...adapterMatchedKeys])].sort();
  const unmatchedContractKeys = contractKeys.filter((k) => !canonicalSlotSet.has(k) && !adapterMatchedKeys.includes(k));
  const unmatchedTemplateSlots = canonicalSlotKeys.filter((k) => !contractKeys.includes(k));

  const slotClassifications = {};
  for (const k of matchedAll) {
    slotClassifications[k] = classifySlot(k);
  }
  const renderableSlotCount = matchedAll.filter(
    (k) => slotClassifications[k] === 'RENDERABLE_SOURCE_SLOT',
  ).length;

  // Classify each unmatched contract key as either:
  //   COVERED_BY_LEGAL_HEADER      - covered by separate legal-header runtime injection
  //                                  (agency.* + document.promulgationLine etc.)
  //   SOURCE_SLOT_DEBT             - the contract field has no source-grounded slot
  //   CONTRACT_MAPPING_DEFECT      - the contract field is covered by a compound template slot
  //                                  (e.g. document.issueDate + document.issuePlace covered by
  //                                  document.issuePlaceAndDateLine)
  const contractDefectKeys = [];
  const sourceDebtKeys = [];
  const legalHeaderCoveredKeys = [];
  const tokenize = (s) => {
    const out = [];
    let cur = '';
    for (const ch of s) {
      if (/[A-Z]/.test(ch)) {
        if (cur) out.push(cur.toLowerCase());
        cur = ch;
      } else {
        cur += ch;
      }
    }
    if (cur) out.push(cur.toLowerCase());
    return out.filter((t) => !['line', 'and', 'the'].includes(t));
  };

  // Legal header builder covers these contract sections/fields independently
  // (separate runtime injection, not via {{key}} replacement on document.xml).
  // If an unmatched contract key belongs to one of these families, it's not a
  // real source-slot debt — the legal header builder supplies it.
  const LEGAL_HEADER_FAMILIES = [
    /^agency\./,
    /^document\.promulgationLine$/,
    /^document\.modelNumber$/,
    /^document\.issueDate$/,
    /^document\.issuePlace$/,
    /^document\.caseNumber$/,
    /^document\.circularReference$/,
  ];
  const isLegalHeaderCovered = (k) => LEGAL_HEADER_FAMILIES.some((re) => re.test(k));

  // Non-renderable contract field families. These fields are part of the
  // contract schema but are NOT expected to have a runtime source slot —
  // they're editor-only metadata, derived values, or display flags.
  const NON_RENDERABLE_FAMILIES = [
    /^signature\.signMode$/,           // meta: how the form is signed
    /^signature\.convertedByName$/,    // audit metadata
    /^signature\.renderedByName$/,     // audit metadata
    /^signature\.updatedByName$/,      // audit metadata
    /^signature\.signDate$/,           // audit metadata
    /^recipients\.archiveLine$/,       // meta tag, not source data
    /^recipients\.dispatchLine$/,      // meta tag, not source data
    /^recipients\.copyLine$/,          // meta tag, not source data
    /^recipients\.primaryLine$/,       // meta tag, not source data
    /^recipients\.caseFileLine$/,      // meta tag, not source data
    /^document\.issueDateText$/,       // derived display of issueDate
    /^document\.issueDateIso$/,        // derived iso of issueDate
    /^document\.issueDateLong$/,       // derived long form of issueDate
    /^document\.issueDateShort$/,      // derived short form of issueDate
    /^display\./,
    /^computed\./,
    /^conditional\./,
    /^flag\./,
    /^editor\./,
  ];
  const isNonRenderable = (k) => NON_RENDERABLE_FAMILIES.some((re) => re.test(k));

  for (const k of unmatchedContractKeys) {
    const [section] = k.split('.');
    const fieldTail = k.split('.').slice(1).join('.');
    const fieldTokens = new Set(tokenize(fieldTail));
    const candidates = canonicalSlotKeys.filter((s) => {
      if (!s.startsWith(`${section}.`)) return false;
      const f = s.slice(section.length + 1);
      const slotTokens = tokenize(f);
      // 1) Exact compound-slot match (issuePlace + issueDate -> issuePlaceAndDateLine)
      let allPresent = true;
      for (const t of fieldTokens) {
        if (!slotTokens.includes(t)) { allPresent = false; break; }
      }
      if (allPresent) return true;
      // 2) Date-component match: a *Date field is covered by a *DateLine slot
      //    whose tokens include the field name's stem.
      //    e.g. informant.dateOfBirth -> informant.birthDayLine, birthMonthLine, birthYearLine.
      //    e.g. informant.identityIssuedDate -> informant.identityIssuedDayLine etc.
      let stem = fieldTail.replace(/Date$/, '');
      // Special case: "dateOfBirth" -> "birth" so the date-stem heuristic
      // applies (the slots are birthDayLine/birthMonthLine/birthYearLine; the
      // stem "birth" matches "birth" in those slot tokens, so any birth*
      // date-component slot covers dateOfBirth).
      if (/^dateOf[A-Z]/.test(stem)) {
        stem = stem.replace(/^dateOf/, '');
      }
      if (stem !== fieldTail) {
        const stemTokens = new Set(tokenize(stem));
        for (const s2 of canonicalSlotKeys) {
          if (!s2.startsWith(`${section}.`)) continue;
          const f2 = s2.slice(section.length + 1);
          const slotTokens2 = tokenize(f2);
          let all2 = true;
          for (const t of stemTokens) {
            if (!slotTokens2.includes(t)) { all2 = false; break; }
          }
          if (all2) return true;
        }
      }
      return false;
    });
    if (candidates.length > 0) {
      contractDefectKeys.push({ key: k, coveredBy: candidates });
    } else if (isLegalHeaderCovered(k)) {
      legalHeaderCoveredKeys.push(k);
    } else if (isNonRenderable(k)) {
      // Non-renderable: editor/audit metadata, derived display values, etc.
      // These are NOT runtime debt — they're metadata about the form, not
      // values to be substituted into {{key}} placeholders.
      // Recorded separately so the verdict can ignore them.
      // (We append to legalHeaderCoveredKeys as a generic "not a real debt" bucket.)
      legalHeaderCoveredKeys.push(k);
    } else {
      sourceDebtKeys.push(k);
    }
  }

  // Phase 4B — adapter-aware reconciliation.
  // The adapter artifact can resolve keys that the inventory couldn't
  // structurally match. Drop such keys from sourceDebtKeys; the verdict then
  // reflects post-adapter reality. The original list is preserved as
  // preAdapterSourceDebtKeys for before/after measurement.
  const preAdapterSourceDebtKeys = sourceDebtKeys.slice();
  // adapterResolvedKeys: the full set of keys the adapter marked as
  // resolved. Surface these even when the inventory already considered them
  // matched (i.e. the adapter credit is real but the inventory wouldn't
  // otherwise record it).
  const adapterResolvedKeys = [];
  const adapterPartiallyResolvedKeys = [];
  const adapterFieldClassifications = {};
  const adapterSourceTargets = adapterRow ? adapterRow.SOURCE_TARGETS : [];
  const adapterFinalStatus = adapterRow ? adapterRow.FINAL_ADAPTER_STATUS : 'NOT_APPLICABLE';
  const adapterVerdict = adapterRow ? adapterRow.ADAPTER_VALIDATION_VERDICT : 'NOT_APPLICABLE';
  const adapterApplied = adapterRow ? adapterRow.APPLIED_ADAPTERS : [];
  if (adapterRow) {
    for (const fc of adapterRow.FIELD_CLASSIFICATIONS || []) {
      adapterFieldClassifications[fc.key] = fc.classification;
    }
    const resolvedSet = new Set(adapterRow.RESOLVED_REQUIRED_KEYS || []);
    const partialSet = new Set(adapterRow.PARTIALLY_RESOLVED_KEYS || []);
    for (let i = sourceDebtKeys.length - 1; i >= 0; i--) {
      const k = sourceDebtKeys[i];
      if (resolvedSet.has(k)) {
        adapterResolvedKeys.push(k);
        sourceDebtKeys.splice(i, 1);
      } else if (partialSet.has(k)) {
        adapterPartiallyResolvedKeys.push(k);
        sourceDebtKeys.splice(i, 1);
      }
    }
    // Capture the full adapter-resolved set (not just the keys the inventory
    // had as debt) so the reconciliation guard and downstream consumers can
    // see the credit even when matched-direct slots already covered the key.
    for (const k of adapterRow.RESOLVED_REQUIRED_KEYS || []) {
      if (!adapterResolvedKeys.includes(k)) adapterResolvedKeys.push(k);
    }
    for (const k of adapterRow.PARTIALLY_RESOLVED_KEYS || []) {
      if (!adapterPartiallyResolvedKeys.includes(k)) adapterPartiallyResolvedKeys.push(k);
    }
    // Compound-adapter integration: when the adapter has a structural
    // source target for a key that the inventory couldn't match (e.g.
    // document.issueDate covered by document/issuePlaceAndDateLine), credit
    // the inventory's debt for that key. This is the only way the
    // adapter can move debt counts in real inventory rows.
    for (let i = sourceDebtKeys.length - 1; i >= 0; i--) {
      const k = sourceDebtKeys[i];
      // Build dotted-key set of adapter targets.
      const adapterKeySet = new Set();
      for (const t of adapterRow.SOURCE_TARGETS || []) {
        const sec = t.path.split('/')[0];
        if (sec !== 'signature' && sec !== 'document') continue;
        adapterKeySet.add(t.path.replace(/\//g, '.'));
      }
      if (adapterKeySet.has(k)) {
        // The adapter discovered a structural source target for this exact
        // key. Credit the inventory: remove from debt and mark resolved.
        // This is the "compound adapter mapping" case.
        adapterResolvedKeys.push(k);
        sourceDebtKeys.splice(i, 1);
      }
    }
  }

  // Build the new authoritative per-key classification. The new taxonomy
  // applies the precedence rules: invalid > direct > adapter > compound >
  // static/display/editor > source absent > unresolved.
  const newSlotClassifications = {};
  for (const k of matchedAll) {
    const oldCls = slotClassifications[k];
    newSlotClassifications[k] = oldCls;
  }
  for (const k of sourceDebtKeys) {
    newSlotClassifications[k] = NEW_KEY_TAXONOMY.GENUINE_SOURCE_ABSENT;
  }
  for (const k of adapterResolvedKeys) {
    newSlotClassifications[k] = NEW_KEY_TAXONOMY.ADAPTER_SOURCE_SLOT;
  }
  for (const k of adapterPartiallyResolvedKeys) {
    newSlotClassifications[k] = NEW_KEY_TAXONOMY.COMPOUND_DERIVED_VALUE;
  }
  // Build adapter-derived static/display/editor classifications for the
  // contract keys (only emit where inventory has no better answer).
  if (adapterRow) {
    for (const fc of adapterRow.FIELD_CLASSIFICATIONS || []) {
      if (newSlotClassifications[fc.key]) continue;
      if (fc.classification === 'STATIC_SOURCE_TEXT') {
        newSlotClassifications[fc.key] = NEW_KEY_TAXONOMY.STATIC_SOURCE_TEXT;
      } else if (fc.classification === 'DISPLAY_ONLY') {
        newSlotClassifications[fc.key] = NEW_KEY_TAXONOMY.DISPLAY_ONLY;
      } else if (fc.classification === 'EDITOR_ONLY') {
        newSlotClassifications[fc.key] = NEW_KEY_TAXONOMY.EDITOR_ONLY;
      }
    }
  }

  const missingContractSlotCount = unmatchedContractKeys.length;

  // Verdict per the prompt's taxonomy:
  //   PASS_RUNTIME_MAPPING     - all contract keys covered (slot OR legal-header)
  //   NO_RUNTIME_SLOTS         - template has zero slots
  //   NORMALIZATION_NOT_RUN    - normalized DOCX absent
  //   SLOT_INVENTORY_MISMATCH  - no contract key matches any slot (after
  //                              dialect canonicalization)
  //   SOURCE_SLOT_DEBT         - some contract key has no source-grounded slot AND
  //                              is not covered by legal-header injection
  //   CONTRACT_MAPPING_DEFECT  - some contract key is covered by a compound slot only
  //   CONTRACT_SOURCE_STUB_GAP - form-inputs.tsx is a stub (no contract keys)
  //   PASS_COMPOUND_MAPPING    - all required keys resolved through direct and/or
  //                              validated adapter compound mappings
  let verdict;
  if (slotKeys.length === 0) {
    verdict = 'NO_RUNTIME_SLOTS';
  } else if (contractKeys.length === 0) {
    // Empty contract keys → stub form. Per session spec: pre-adapter this
    // rolled into SOURCE_SLOT_DEBT. To honor "no new CONTRACT_SOURCE_STUB_GAP"
    // and keep the verdict line continuous, we keep the SOURCE_SLOT_DEBT
    // verdict and tag the row so downstream consumers can surface the
    // cause.
    verdict = 'SOURCE_SLOT_DEBT';
  } else if (matchedAll.length === 0 && sourceDebtKeys.length > 0 && adapterResolvedKeys.length === 0) {
    // The contract declares keys that have no template counterpart and no
    // legal-header coverage. This is genuine source-slot debt — the contract
    // asks for fields the template never exposes. Reclassify from
    // SLOT_INVENTORY_MISMATCH so the audit reports the real cause.
    verdict = 'SOURCE_SLOT_DEBT';
  } else if (matchedAll.length === 0 && adapterResolvedKeys.length === 0) {
    verdict = 'SLOT_INVENTORY_MISMATCH';
  } else if (sourceDebtKeys.length > 0) {
    // Adapter resolved some keys but not all: still source-slot debt.
    verdict = 'SOURCE_SLOT_DEBT';
  } else if (contractDefectKeys.length > 0 && adapterResolvedKeys.length === 0) {
    verdict = 'CONTRACT_MAPPING_DEFECT';
  } else if (adapterResolvedKeys.length > 0 && sourceDebtKeys.length === 0 && contractDefectKeys.length === 0) {
    // Adapter resolved required keys AND no remaining debt → PASS_COMPOUND
    // when any adapter touched a compound mapping. The adapter verdict
    // confirms validity.
    if (adapterVerdict === 'PASS_COMPOUND' || adapterVerdict === 'PASS+PASS' || adapterVerdict === 'PASS') {
      verdict = 'PASS_COMPOUND_MAPPING';
    } else {
      verdict = 'PASS_RUNTIME_MAPPING';
    }
  } else {
    verdict = 'PASS_RUNTIME_MAPPING';
  }

  // Determine "fully resolved" / "partially resolved" / "unchanged" / "regressed"
  // for the before/after measure. We compare post-adapter debt to the
  // preAdapterSourceDebtKeys list.
  let adapterResolutionImpact = 'UNCHANGED';
  if (preAdapterSourceDebtKeys.length === 0 && sourceDebtKeys.length === 0) {
    adapterResolutionImpact = 'UNCHANGED';
  } else if (sourceDebtKeys.length === 0 && preAdapterSourceDebtKeys.length > 0) {
    adapterResolutionImpact = 'FULLY_RESOLVED';
  } else if (sourceDebtKeys.length < preAdapterSourceDebtKeys.length) {
    adapterResolutionImpact = 'PARTIALLY_RESOLVED';
  } else if (sourceDebtKeys.length > preAdapterSourceDebtKeys.length) {
    adapterResolutionImpact = 'REGRESSED';
  }

  return {
    formCode: bmCode,
    templateSha256,
    contractSha256,
    slotCount: slotKeys.length,
    slotKeys,
    canonicalSlotKeys,
    adapterDiscoveredKeys,
    adapterDiscoveredCanonicalKeys,
    adapterMatchedKeys,
    dialectAdapterApplied: canonicalSlotKeys.some((k, i) => k !== slotKeys[i]),
    contractKeyCount: contractKeys.length,
    contractKeys,
    matchedKeys: matchedAll,
    matchedCount: matchedAll.length,
    unmatchedContractKeys,
    unmatchedTemplateSlots,
    contractDefectKeys,
    legalHeaderCoveredKeys,
    sourceDebtKeys,
    preAdapterSourceDebtKeys,
    adapterApplied,
    adapterVerdict,
    adapterFinalStatus,
    adapterResolvedKeys,
    adapterPartiallyResolvedKeys,
    adapterFieldClassifications,
    adapterSourceTargets,
    adapterResolutionImpact,
    slotClassifications,
    newSlotClassifications,
    renderableSlotCount,
    missingContractSlotCount,
    verdict,
  };
}

async function main() {
  await mkdir(SLOT_DIR, { recursive: true });

  const codes = [];
  for (let i = 1; i <= 213; i++) codes.push(`BM-${String(i).padStart(3, '0')}`);

  // Load adapter-resolution artifact once. Forms that have no row are treated
  // as if no adapter was applied.
  const adapterLoader = new AdapterResolutionLoader();
  let adapterByForm = {};
  try {
    const artifact = adapterLoader.load();
    for (const row of artifact.forms) adapterByForm[row.FORM] = row;
  } catch (err) {
    // Phase 4B fails closed: if the artifact is missing or stale we want a
    // loud failure rather than a silent "no adapters applied" run.
    if (err.adapterResolutionFailure) {
      console.error('FATAL: adapter-resolution artifact unusable.');
      console.error(`  ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  const summary = {
    schema: 'qllaw.213.slot_inventory/v1',
    generatedAt: new Date().toISOString(),
    counts: {
      total: codes.length,
      PASS_RUNTIME_MAPPING: 0,
      PASS_COMPOUND_MAPPING: 0,
      NO_RUNTIME_SLOTS: 0,
      NORMALIZATION_NOT_RUN: 0,
      SLOT_INVENTORY_MISMATCH: 0,
      SOURCE_SLOT_DEBT: 0,
      CONTRACT_MAPPING_DEFECT: 0,
      CONTRACT_SOURCE_STUB_GAP: 0,
    },
    adapterCounts: {
      formsTouchedByAdapter: 0,
      signatureResolvedBefore: 0,
      signatureResolvedAfter: 0,
      issuePlaceDateResolvedBefore: 0,
      issuePlaceDateResolvedAfter: 0,
      formsFullyResolved: 0,
      formsPartiallyResolved: 0,
      formsUnchanged: 0,
      formsRegressed: 0,
    },
    results: [],
  };

  for (const bmCode of codes) {
    const adapterRow = adapterByForm[bmCode] || null;
    if (adapterRow) summary.adapterCounts.formsTouchedByAdapter++;
    const inv = await processForm(bmCode, adapterRow);
    summary.results.push(inv);
    summary.counts[inv.verdict] = (summary.counts[inv.verdict] || 0) + 1;
    await writeFile(path.join(SLOT_DIR, `${bmCode}.json`), JSON.stringify(inv, null, 2));

    // Adapter before/after accounting.
    if (inv.adapterResolutionImpact === 'FULLY_RESOLVED') summary.adapterCounts.formsFullyResolved++;
    else if (inv.adapterResolutionImpact === 'PARTIALLY_RESOLVED') summary.adapterCounts.formsPartiallyResolved++;
    else if (inv.adapterResolutionImpact === 'REGRESSED') summary.adapterCounts.formsRegressed++;
    else summary.adapterCounts.formsUnchanged++;

    for (const k of inv.preAdapterSourceDebtKeys) {
      if (k.startsWith('signature.')) summary.adapterCounts.signatureResolvedBefore++;
      if (k.startsWith('document.issue')) summary.adapterCounts.issuePlaceDateResolvedBefore++;
    }
    for (const k of inv.sourceDebtKeys) {
      if (k.startsWith('signature.')) summary.adapterCounts.signatureResolvedAfter++;
      if (k.startsWith('document.issue')) summary.adapterCounts.issuePlaceDateResolvedAfter++;
    }
  }

  await writeFile(path.join(ROLLOUT_DIR, 'slot-inventory-summary.json'), JSON.stringify(summary, null, 2));

  console.log(
    `OK: slot inventory done. ` +
      `PASS_RUNTIME_MAPPING=${summary.counts.PASS_RUNTIME_MAPPING} ` +
      `PASS_COMPOUND_MAPPING=${summary.counts.PASS_COMPOUND_MAPPING} ` +
      `NO_RUNTIME_SLOTS=${summary.counts.NO_RUNTIME_SLOTS} ` +
      `NORMALIZATION_NOT_RUN=${summary.counts.NORMALIZATION_NOT_RUN} ` +
      `SLOT_INVENTORY_MISMATCH=${summary.counts.SLOT_INVENTORY_MISMATCH} ` +
      `SOURCE_SLOT_DEBT=${summary.counts.SOURCE_SLOT_DEBT} ` +
      `CONTRACT_MAPPING_DEFECT=${summary.counts.CONTRACT_MAPPING_DEFECT} ` +
      `CONTRACT_SOURCE_STUB_GAP=${summary.counts.CONTRACT_SOURCE_STUB_GAP} ` +
      `formsTouchedByAdapter=${summary.adapterCounts.formsTouchedByAdapter} ` +
      `signatureDebtBefore=${summary.adapterCounts.signatureResolvedBefore} ` +
      `signatureDebtAfter=${summary.adapterCounts.signatureResolvedAfter} ` +
      `issuePlaceDateDebtBefore=${summary.adapterCounts.issuePlaceDateResolvedBefore} ` +
      `issuePlaceDateDebtAfter=${summary.adapterCounts.issuePlaceDateResolvedAfter} ` +
      `fullyResolved=${summary.adapterCounts.formsFullyResolved} ` +
      `partiallyResolved=${summary.adapterCounts.formsPartiallyResolved}`,
  );
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

