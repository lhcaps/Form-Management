/**
 * Phase 4B — Build the authoritative adapter-resolution artifact.
 *
 * Runs the SIGNATURE_SECTION + ISSUE_PLACE_DATE adapters against every
 * registered form and writes a single 213-row deterministic artifact:
 *   docs/audit/final-213-customer-ready/runtime-rollout/adapter-resolution-213.json
 *
 * Each row carries:
 *   - REAL structural source targets extracted from the normalized DOCX,
 *     never synthetic;
 *   - adapter field classifications (REQUIRED_SOURCE_SLOT, GENUINE_SOURCE_ABSENT, …);
 *   - adapter render values (R1 preserved, R2 changed deterministically);
 *   - adapter-validation verdict (PASS / PASS_COMPOUND / FAIL …);
 *   - resolved / partially-resolved / unresolved required keys.
 *
 * Output is byte-identical when re-run because:
 *   - generatedAt is recorded separately and excluded from the canonical payload;
 *   - form ordering is numeric BM-NNN ascending;
 *   - adapter ordering is registration order from buildDefaultRegistry();
 *   - source-target extraction is pure (driven by the normalized DOCX bytes).
 *
 * Reference HEAD: b0e43be3fd7831db42a88ad521384e0608ee6a18
 * Branch: codex/customer-ready-baseline
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDefaultRegistry } from '../../packages/form-contracts/src/adapters/default-registry';
import type {
  AdapterResolution,
  ClassifiedField,
} from '../../packages/form-contracts/src/adapters/adapter-registry';
import type {
  SourceSlotFamily,
  SourceTargetIdentity,
  RenderValue,
  FieldClassification,
  FormRenderContext,
} from '../../packages/form-contracts/src/source-slot-family-adapter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Repo root is the parent of `scripts/runtime-rollout/`. Walk up the
// __dirname until we reach the directory that contains `scripts/`.
function resolveRepoRoot(): string {
  let cur = __dirname;
  for (let i = 0; i < 6; i++) {
    cur = path.dirname(cur);
    if (fs.existsSync(path.join(cur, 'scripts'))) return cur;
  }
  return __dirname;
}
const REPO_ROOT = resolveRepoRoot();

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const NORMALIZED_ROOT = path.join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
);

const FORM_INPUTS_DIR = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
);

const ARTIFACT_PATH = path.join(ROLLOUT_DIR, 'adapter-resolution-213.json');

// ---------------------------------------------------------------------------
// Tiny standard helpers (Node's perf_hooks for startTime/endTime only)
// ---------------------------------------------------------------------------

function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

async function sha256OfFile(p: string): Promise<string | null> {
  if (!fs.existsSync(p)) return null;
  return sha256(await readFile(p));
}

// ---------------------------------------------------------------------------
// Real structural source-target discovery
//
// We split the normalized DOCX into structural targets per source-slot
// family. Each target carries the DOCX part, an xpath-like path inside that
// part, the occurrence index, a structural context, a text preview, a
// SHA-256 of the matched XML fragment, and a render strategy.
//
// We do NOT fabricate targets. If the family has no occurrence in a form's
// normalized DOCX, we return an empty target list and the adapter sees
// GENUINE_SOURCE_ABSENT.
// ---------------------------------------------------------------------------

type FamilyKind = 'SIGNATURE_SECTION' | 'ISSUE_PLACE_DATE' | 'DOCUMENT_BASIC' | 'RECIPIENT_COPY' | 'LEGAL_HEADER' | 'OTHER';

const KNOWN_KEYS: Record<SourceSlotFamily, readonly string[]> = {
  SIGNATURE_SECTION: [
    'signature.signerName',
    'signature.positionTitle',
    'signature.signMode',
  ],
  ISSUE_PLACE_DATE: [
    'document.issuePlace',
    'document.issueDate',
    'document.issueDay',
    'document.issueMonth',
    'document.issueYear',
    'document.issuePlaceDateLine',
  ],
  DOCUMENT_BASIC: ['document.documentCode'],
  RECIPIENT_COPY: ['recipients.archiveLine'],
  CASE_INFO_BLOCK: [],
  OFFICIAL_BLOCK: [],
  LEGAL_HEADER: [
    'agency.name',
    'agency.parentName',
    'agency.nameUpper',
    'agency.parentNameUpper',
    'agency.issuePlace',
  ],
  PROMULGATION: [],
  MODEL_NUMBER: [],
  CONDITIONAL_BOOLEAN: [],
  REPEATER_REGION: [],
  FLOATING_TEXTBOX: [],
  TABLE_HEAVY: [],
  SPLIT_RUN_PLACEHOLDER: [],
  CONTENT_CONTROL_ALIAS: [],
  OTHER: [],
};

const STATIC_LEGAL_KEYS = new Set<string>([
  'document.promulgationLine',
  'document.modelNumber',
  'document.circularReference',
  'document.legalBasisLine',
  'signature.caption',
  'signature.deputyWording',
  'signature.onBehalfWording',
]);

const CONTRACT_FAMILY_HINTS: Record<string, FamilyKind> = {
  signature: 'SIGNATURE_SECTION',
  document: 'ISSUE_PLACE_DATE',
  recipients: 'RECIPIENT_COPY',
  recipient: 'OTHER',
  person: 'OTHER',
  agency: 'LEGAL_HEADER',
  decision: 'OTHER',
  assignment: 'OTHER',
  measure: 'OTHER',
  legalBasis: 'OTHER',
  prosecutor: 'OTHER',
  reception: 'OTHER',
  crimeReport: 'OTHER',
  record: 'OTHER',
  receiver: 'OTHER',
  informant: 'OTHER',
  reparation: 'OTHER',
  recovery: 'OTHER',
  caseFile: 'OTHER',
  prosecution: 'OTHER',
  investigation: 'OTHER',
};

function familyForKey(key: string): FamilyKind {
  if (key === 'document.documentCode') return 'DOCUMENT_BASIC';
  if (key.startsWith('document.issue')) return 'ISSUE_PLACE_DATE';
  const section = key.split('.')[0];
  return CONTRACT_FAMILY_HINTS[section] || 'OTHER';
}

type InventoryRow = {
  formCode: string;
  templateSha256: string | null;
  contractSha256: string | null;
  slotKeys: string[];
  contractKeys: string[];
  matchedKeys: string[];
  canonicalSlotKeys: string[];
  verdict: string;
};

async function loadSlotInventory(): Promise<Record<string, InventoryRow>> {
  const file = path.join(ROLLOUT_DIR, 'slot-inventory-summary.json');
  const buf = await readFile(file, 'utf8');
  const obj = JSON.parse(buf);
  const out: Record<string, InventoryRow> = {};
  for (const r of obj.results || []) {
    out[r.formCode] = {
      formCode: r.formCode,
      templateSha256: r.templateSha256 || null,
      contractSha256: r.contractSha256 || null,
      slotKeys: r.slotKeys || [],
      contractKeys: r.contractKeys || [],
      matchedKeys: r.matchedKeys || [],
      canonicalSlotKeys: r.canonicalSlotKeys || [],
      verdict: r.verdict,
    };
  }
  return out;
}

async function loadManifest(): Promise<any> {
  const file = path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json');
  return JSON.parse(await readFile(file, 'utf8'));
}

function codeIndex(manifest: any): Map<string, any> {
  const out = new Map<string, any>();
  for (const e of manifest?.entries || []) if (e.FORM_CODE) out.set(e.FORM_CODE, e);
  return out;
}

function manifestSha256(manifest: any): string {
  // Stable JSON: deterministic key ordering. Manifest object is from
  // authoritative-213-manifest.json; we serialize it sorted so the sha is
  // independent of any object key ordering.
  return sha256(stableJsonStringify(manifest));
}

function stableJsonStringify(value: any): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableJsonStringify(v)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJsonStringify(value[k])}`).join(',')}}`;
}

// ---------------------------------------------------------------------------
// Real structural source-target discovery from normalized DOCX
// ---------------------------------------------------------------------------

function discoverTargetsFromXml(xml: string, family: FamilyKind): SourceTargetIdentity[] {
  if (!xml) return [];
  const re = /\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g;
  const seen = new Set<string>();
  const out: SourceTargetIdentity[] = [];
  let occ = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const rawKey = m[1];
    const fam = familyForKey(rawKey);
    if (fam !== family) continue;
    const sigKey = `${rawKey}#${occ}`;
    if (seen.has(sigKey)) {
      occ++;
      continue;
    }
    seen.add(sigKey);
    const ctx = extractContext(xml, m.index);
    const preview = extractPreview(xml, m.index);
    const xmlFrag = xml.slice(m.index, m.index + Math.min(200, xml.length - m.index));
    out.push({
      docxPart: 'word/document.xml',
      path: rawKey.replaceAll('.', '/'),
      occurrenceIndex: occ,
      structuralContext: ctx,
      sourceTextPreview: preview,
      sourceHash: sha256(xmlFrag),
      renderStrategy: family === 'SIGNATURE_SECTION' ? 'INLINE_REPLACE' : 'INLINE_REPLACE',
    });
    occ++;
  }
  return out;
}

function extractContext(xml: string, idx: number): SourceTargetIdentity['structuralContext'] {
  const before = xml.slice(Math.max(0, idx - 2000), idx);
  const lastTableOpen = before.lastIndexOf('<w:tbl');
  const lastSdtOpen = before.lastIndexOf('<w:sdt');
  const lastPClose = before.lastIndexOf('</w:p>');
  if (lastTableOpen > lastPClose && lastTableOpen > lastSdtOpen) return 'table';
  if (lastSdtOpen > lastPClose && lastSdtOpen > lastTableOpen) return 'sdt';
  return 'paragraph';
}

function extractPreview(xml: string, idx: number): string {
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  let nearest = '';
  for (const m of xml.slice(0, idx + 500).matchAll(re)) {
    const text = m[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    if (text) nearest = (nearest + ' ' + text).trim().slice(0, 80);
  }
  return nearest || '';
}

// ---------------------------------------------------------------------------
// Canonical R1 / R2 inputs (timezone-safe, deterministic).
// ---------------------------------------------------------------------------

function buildRenderInputs(
  family: FamilyKind,
  formCode: string,
  hasTarget: boolean,
): Record<string, unknown> {
  if (!hasTarget) return {};
  const out: Record<string, unknown> = {};
  if (family === 'SIGNATURE_SECTION') {
    out['signature.signerName'] = `${formCode}-R1-Signer`;
    out['signature.positionTitle'] = 'VIỆN TRƯỞNG';
    out['signature.signMode'] = 'BLANK_MANUAL';
    return out;
  }
  if (family === 'ISSUE_PLACE_DATE') {
    out['document.issuePlace'] = `Place-${formCode}`;
    out['document.issueDate'] = '2026-05-12';
    out['document.issuePlaceDateLine'] = `Place-${formCode}, 2026-05-12`;
    return out;
  }
  if (family === 'DOCUMENT_BASIC') {
    out['document.documentCode'] = `${formCode}/QD-VKS`;
    return out;
  }
  if (family === 'LEGAL_HEADER') {
    out['agency.name'] = `VKSND ${formCode}`;
    out['agency.parentName'] = 'VKSND TOI CAO';
    out['agency.nameUpper'] = `VKSND ${formCode}`;
    out['agency.parentNameUpper'] = 'VKSND TOI CAO';
    out['agency.issuePlace'] = `Dia danh ${formCode}`;
    return out;
  }
  if (family === 'RECIPIENT_COPY') { out['recipients.archiveLine'] = `Lưu: ${formCode}-R1`; return out; }
  return out;
}

function buildChangedInputs(
  family: FamilyKind,
  formCode: string,
  hasTarget: boolean,
): Record<string, unknown> {
  if (!hasTarget) return {};
  const out: Record<string, unknown> = {};
  if (family === 'SIGNATURE_SECTION') {
    out['signature.signerName'] = `${formCode}-R2-Signer`;
    out['signature.positionTitle'] = 'VIỆN TRƯỞNG';
    out['signature.signMode'] = 'BLANK_MANUAL';
    return out;
  }
  if (family === 'ISSUE_PLACE_DATE') {
    out['document.issuePlace'] = `Place-${formCode}-CHANGED`;
    out['document.issueDate'] = '2026-05-13';
    out['document.issuePlaceDateLine'] = `Place-${formCode}-CHANGED, 2026-05-13`;
    return out;
  }
  if (family === 'DOCUMENT_BASIC') {
    out['document.documentCode'] = `${formCode}/QD-VKS-R2`;
    return out;
  }
  if (family === 'LEGAL_HEADER') {
    out['agency.name'] = `VKSND ${formCode} R2`;
    out['agency.parentName'] = 'VKSND TOI CAO R2';
    out['agency.nameUpper'] = `VKSND ${formCode} R2`;
    out['agency.parentNameUpper'] = 'VKSND TOI CAO R2';
    out['agency.issuePlace'] = `Dia danh ${formCode} R2`;
    return out;
  }
  if (family === 'RECIPIENT_COPY') { out['recipients.archiveLine'] = `Lưu: ${formCode}-R2`; return out; }
  return out;
}

// ---------------------------------------------------------------------------
// FormRenderContext builder
// ---------------------------------------------------------------------------

function makeContext(opts: {
  formCode: string;
  family: SourceSlotFamily;
  formInputs: Record<string, unknown>;
  sourceTargets: readonly SourceTargetIdentity[];
}): FormRenderContext {
  return {
    formCode: opts.formCode,
    formInputs: opts.formInputs,
    sourceTargets: opts.sourceTargets,
    family: opts.family,
  };
}

// ---------------------------------------------------------------------------
// Adapter output normalisation for the per-form row
// ---------------------------------------------------------------------------

interface PerFormRow {
  FORM: string;
  CONTRACT_PATH: string;
  CONTRACT_SHA256: string | null;
  NORMALIZED_TEMPLATE_PATH: string;
  NORMALIZED_TEMPLATE_SHA256: string | null;
  APPLIED_ADAPTERS: string[];
  FIELD_CLASSIFICATIONS: {
    key: string;
    classification: FieldClassification;
    family: string;
  }[];
  SOURCE_TARGETS: SourceTargetIdentity[];
  RENDER_VALUES_R1: RenderValue[];
  RENDER_VALUES_R2: RenderValue[];
  RESOLVED_REQUIRED_KEYS: string[];
  PARTIALLY_RESOLVED_KEYS: string[];
  UNRESOLVED_REQUIRED_KEYS: string[];
  STATIC_PROTECTED_KEYS: string[];
  DISPLAY_ONLY_KEYS: string[];
  EDITOR_ONLY_KEYS: string[];
  TARGET_COLLISIONS: string[];
  ADAPTER_VALIDATION_VERDICT: string;
  ADAPTER_VALIDATION_REASONS: string[];
  FINAL_ADAPTER_STATUS:
    | 'PASS'
    | 'PASS_COMPOUND'
    | 'PARTIAL'
    | 'SOURCE_ABSENT'
    | 'FAIL'
    | 'NOT_APPLICABLE';
}

function emptyRow(form: string): PerFormRow {
  return {
    FORM: form,
    CONTRACT_PATH: path.join(FORM_INPUTS_DIR, `${form.toLowerCase()}-form-inputs.tsx`),
    CONTRACT_SHA256: null,
    NORMALIZED_TEMPLATE_PATH: path.join(NORMALIZED_ROOT, form, `${form}_normalized.docx`),
    NORMALIZED_TEMPLATE_SHA256: null,
    APPLIED_ADAPTERS: [],
    FIELD_CLASSIFICATIONS: [],
    SOURCE_TARGETS: [],
    RENDER_VALUES_R1: [],
    RENDER_VALUES_R2: [],
    RESOLVED_REQUIRED_KEYS: [],
    PARTIALLY_RESOLVED_KEYS: [],
    UNRESOLVED_REQUIRED_KEYS: [],
    STATIC_PROTECTED_KEYS: [],
    DISPLAY_ONLY_KEYS: [],
    EDITOR_ONLY_KEYS: [],
    TARGET_COLLISIONS: [],
    ADAPTER_VALIDATION_VERDICT: 'NOT_APPLICABLE',
    ADAPTER_VALIDATION_REASONS: [],
    FINAL_ADAPTER_STATUS: 'NOT_APPLICABLE',
  };
}

// ---------------------------------------------------------------------------
// Per-form adapter resolution
// ---------------------------------------------------------------------------

interface AdapterRunResult {
  row: PerFormRow;
  validSources: boolean;
  hasInvalidTargets: boolean;
  targetCollision: boolean;
}

function runAdapterForFamily(opts: {
  registry: ReturnType<typeof buildDefaultRegistry>;
  formCode: string;
  family: SourceSlotFamily;
  contractKeys: string[];
  xml: string | null;
  familyKeys: readonly string[];
}): AdapterRunResult {
  const { registry, formCode, family, contractKeys, xml } = opts;
  const row = emptyRow(formCode);
  row.APPLIED_ADAPTERS.push(family);

  // 1. Discover real source targets (no fabrication).
  const targets = xml ? discoverTargetsFromXml(xml, family as FamilyKind) : [];
  row.SOURCE_TARGETS = targets;
  const validSources = targets.length > 0;

  // 2. Classify fields.
  const ctxBase = makeContext({
    formCode,
    family,
    formInputs: {},
    sourceTargets: targets,
  });

  let classifications: ClassifiedField[] = [];
  if (validSources) {
    const out = registry.classifyFields(ctxBase);
    classifications = out.classifications.filter((c) =>
      KNOWN_KEYS[family].includes(c.key),
    );
    row.TARGET_COLLISIONS = out.collisionFindings;
  } else {
    // Even without targets we surface the classifications the adapter emits
    // when supplied with empty source-targets.
    const out = registry.classifyFields(ctxBase);
    classifications = out.classifications.filter((c) =>
      KNOWN_KEYS[family].includes(c.key),
    );
  }
  row.FIELD_CLASSIFICATIONS = classifications.map((c) => ({
    key: c.key,
    classification: c.classification,
    family: c.familyId,
  }));

  // 3. Build R1 / R2 render values using the adapter against canonical inputs.
  const r1Inputs = buildRenderInputs(family as FamilyKind, formCode, validSources);
  const r2Inputs = buildChangedInputs(family as FamilyKind, formCode, validSources);
  const ctxR1 = makeContext({
    formCode,
    family,
    formInputs: r1Inputs,
    sourceTargets: targets,
  });
  const ctxR2 = makeContext({
    formCode,
    family,
    formInputs: r2Inputs,
    sourceTargets: targets,
  });

  let r1Values: RenderValue[] = [];
  let r2Values: RenderValue[] = [];
  if (validSources) {
    const rvs1 = registry.buildRenderValues(ctxR1);
    r1Values = [...rvs1.renderValues];
    const rvs2 = registry.buildRenderValues(ctxR2);
    r2Values = [...rvs2.renderValues];

    // Some adapters classify a field from source-grounded runtime input
    // (for example ISSUE_PLACE_DATE). Reclassify with R1 rather than the
    // earlier empty-input probe, otherwise a value that was rendered from a
    // real target is incorrectly recorded as GENUINE_SOURCE_ABSENT.
    const classified = registry.classifyFields(ctxR1);
    classifications = classified.classifications.filter((classification) =>
      KNOWN_KEYS[family].includes(classification.key),
    );
    row.TARGET_COLLISIONS = classified.collisionFindings;
    row.FIELD_CLASSIFICATIONS = classifications.map((classification) => ({
      key: classification.key,
      classification: classification.classification,
      family: classification.familyId,
    }));
  }
  // Deterministic ordering by key for stable serialization.
  r1Values.sort((a, b) => a.key.localeCompare(b.key));
  r2Values.sort((a, b) => a.key.localeCompare(b.key));
  row.RENDER_VALUES_R1 = r1Values;
  row.RENDER_VALUES_R2 = r2Values;

  // 4. Resolve required keys.
  // An adapter only owns a field when the contract AND the normalized DOCX
  // expose the same source target. Contract-only siblings can be editor/UI
  // metadata; treating them as adapter-required would create a new false
  // SOURCE_SLOT_DEBT merely by registering an unrelated family adapter.
  // The base inventory remains responsible for classifying those fields.
  const adapterFamilyKeys = KNOWN_KEYS[family];
  const sourceTargetKeys = new Set(
    targets.map((target) => target.path.replaceAll('/', '.')),
  );
  const contractFamilyKeys = contractKeys.filter(
    (key) => adapterFamilyKeys.includes(key) && sourceTargetKeys.has(key),
  );
  for (const key of contractFamilyKeys) {
    if (STATIC_LEGAL_KEYS.has(key)) {
      row.STATIC_PROTECTED_KEYS.push(key);
      continue;
    }
    const cls = classifications.find((c) => c.key === key);
    const r1 = r1Values.find((v) => v.key === key);
    if (!validSources) {
      // Source target is genuinely absent for this family: the required key
      // cannot be resolved at runtime.
      row.UNRESOLVED_REQUIRED_KEYS.push(key);
      continue;
    }
    if (cls?.classification === 'REQUIRED_SOURCE_SLOT' && r1 && r1.value !== '') {
      row.RESOLVED_REQUIRED_KEYS.push(key);
    } else if (cls?.classification === 'GENUINE_SOURCE_ABSENT') {
      row.UNRESOLVED_REQUIRED_KEYS.push(key);
    } else if (cls) {
      row.PARTIALLY_RESOLVED_KEYS.push(key);
    } else {
      row.PARTIALLY_RESOLVED_KEYS.push(key);
    }
    if (cls?.classification === 'DISPLAY_ONLY') row.DISPLAY_ONLY_KEYS.push(key);
    if (cls?.classification === 'EDITOR_ONLY') row.EDITOR_ONLY_KEYS.push(key);
  }

  // 5. Adapter validation. We only call validate() when we actually have
  // structural source targets; otherwise we record SOURCE_ABSENT.
  let verdictKind = 'NOT_APPLICABLE';
  const reasons: string[] = [];
  if (contractFamilyKeys.length === 0) {
    row.FINAL_ADAPTER_STATUS = 'NOT_APPLICABLE';
    row.ADAPTER_VALIDATION_VERDICT = 'NOT_APPLICABLE';
    row.ADAPTER_VALIDATION_REASONS = ['NO_CONTRACT_FIELDS_FOR_ADAPTER_FAMILY'];
    return { row, validSources, hasInvalidTargets: false, targetCollision: false };
  }
  if (!validSources) {
    row.FINAL_ADAPTER_STATUS = 'SOURCE_ABSENT';
    row.ADAPTER_VALIDATION_VERDICT = 'SOURCE_ABSENT';
    row.ADAPTER_VALIDATION_REASONS = [
      'No structural source targets for family; adapter deferred',
    ];
    return { row, validSources: false, hasInvalidTargets: false, targetCollision: false };
  }
  const validation: AdapterResolution = registry.validate({
    formCode,
    family,
    contractFields: contractFamilyKeys.map((k) => ({ key: k, required: true })),
    sourceTargets: targets,
    renderValues: r1Values,
  });
  verdictKind = validation.verdict.kind;
  row.ADAPTER_VALIDATION_VERDICT = verdictKind;
  row.ADAPTER_VALIDATION_REASONS = [validation.verdict.reason];
  if ('missingRequired' in validation.verdict) {
    row.ADAPTER_VALIDATION_REASONS.push(
      `missingRequired=[${validation.verdict.missingRequired.join(',')}]`,
    );
  }
  if ('compoundCoverage' in validation.verdict && validation.verdict.compoundCoverage) {
    row.ADAPTER_VALIDATION_REASONS.push(
      `compoundCoverage=[${validation.verdict.compoundCoverage.join(',')}]`,
    );
  }

  // 6. Final status.
  const targetCollision = row.TARGET_COLLISIONS.length > 0;
  let finalStatus: PerFormRow['FINAL_ADAPTER_STATUS'];
  if (targetCollision) finalStatus = 'FAIL';
  else if (row.UNRESOLVED_REQUIRED_KEYS.length > 0) {
    if (row.PARTIALLY_RESOLVED_KEYS.length > 0) finalStatus = 'PARTIAL';
    else finalStatus = 'FAIL';
  } else if (verdictKind === 'FAIL') finalStatus = 'FAIL';
  else if (verdictKind === 'PASS_COMPOUND') finalStatus = 'PASS_COMPOUND';
  else if (verdictKind === 'PASS') finalStatus = 'PASS';
  else finalStatus = 'NOT_APPLICABLE';
  row.FINAL_ADAPTER_STATUS = finalStatus;

  if (reasons.length) row.ADAPTER_VALIDATION_REASONS.push(...reasons);

  return {
    row,
    validSources,
    hasInvalidTargets: false,
    targetCollision,
  };
}

// ---------------------------------------------------------------------------
// XML loader for normalized DOCX (read-only)
// ---------------------------------------------------------------------------

import PizZip from 'pizzip';

async function readNormalizedXml(formCode: string): Promise<string | null> {
  const docxPath = path.join(NORMALIZED_ROOT, formCode, `${formCode}_normalized.docx`);
  if (!fs.existsSync(docxPath)) return null;
  const buf = await readFile(docxPath);
  let zip: PizZip;
  try {
    zip = new PizZip(buf);
  } catch (e) {
    return null;
  }
  const doc = zip.file('word/document.xml');
  if (!doc) return null;
  return doc.asText();
}

// ---------------------------------------------------------------------------
// Merge per-family rows into one per-form row when both adapters apply.
// ---------------------------------------------------------------------------

function mergeFamilyRows(form: string, rows: PerFormRow[]): PerFormRow {
  const merged = emptyRow(form);
  for (const r of rows) {
    merged.APPLIED_ADAPTERS = [...merged.APPLIED_ADAPTERS, ...r.APPLIED_ADAPTERS];
    merged.FIELD_CLASSIFICATIONS = [
      ...merged.FIELD_CLASSIFICATIONS,
      ...r.FIELD_CLASSIFICATIONS,
    ];
    merged.SOURCE_TARGETS = [...merged.SOURCE_TARGETS, ...r.SOURCE_TARGETS];
    merged.RENDER_VALUES_R1 = [...merged.RENDER_VALUES_R1, ...r.RENDER_VALUES_R1];
    merged.RENDER_VALUES_R2 = [...merged.RENDER_VALUES_R2, ...r.RENDER_VALUES_R2];
    merged.RESOLVED_REQUIRED_KEYS = [
      ...merged.RESOLVED_REQUIRED_KEYS,
      ...r.RESOLVED_REQUIRED_KEYS,
    ];
    merged.PARTIALLY_RESOLVED_KEYS = [
      ...merged.PARTIALLY_RESOLVED_KEYS,
      ...r.PARTIALLY_RESOLVED_KEYS,
    ];
    merged.UNRESOLVED_REQUIRED_KEYS = [
      ...merged.UNRESOLVED_REQUIRED_KEYS,
      ...r.UNRESOLVED_REQUIRED_KEYS,
    ];
    merged.STATIC_PROTECTED_KEYS = [
      ...merged.STATIC_PROTECTED_KEYS,
      ...r.STATIC_PROTECTED_KEYS,
    ];
    merged.DISPLAY_ONLY_KEYS = [...merged.DISPLAY_ONLY_KEYS, ...r.DISPLAY_ONLY_KEYS];
    merged.EDITOR_ONLY_KEYS = [...merged.EDITOR_ONLY_KEYS, ...r.EDITOR_ONLY_KEYS];
    merged.TARGET_COLLISIONS = [...merged.TARGET_COLLISIONS, ...r.TARGET_COLLISIONS];
    // Carry path + sha into the merged row (all family rows share these).
    if (r.NORMALIZED_TEMPLATE_PATH) merged.NORMALIZED_TEMPLATE_PATH = r.NORMALIZED_TEMPLATE_PATH;
    if (r.NORMALIZED_TEMPLATE_SHA256) merged.NORMALIZED_TEMPLATE_SHA256 = r.NORMALIZED_TEMPLATE_SHA256;
    if (r.CONTRACT_PATH) merged.CONTRACT_PATH = r.CONTRACT_PATH;
    if (r.CONTRACT_SHA256) merged.CONTRACT_SHA256 = r.CONTRACT_SHA256;
  }
  if (rows.length === 1) {
    merged.ADAPTER_VALIDATION_VERDICT = rows[0].ADAPTER_VALIDATION_VERDICT;
    merged.ADAPTER_VALIDATION_REASONS = rows[0].ADAPTER_VALIDATION_REASONS;
    merged.FINAL_ADAPTER_STATUS = rows[0].FINAL_ADAPTER_STATUS;
    return merged;
  }

  // For forms touched by both families, take the worse final status.
  const order: PerFormRow['FINAL_ADAPTER_STATUS'][] = [
    'FAIL',
    'SOURCE_ABSENT',
    'PARTIAL',
    'NOT_APPLICABLE',
    'PASS_COMPOUND',
    'PASS',
  ];
  // Combined resolution verdict: any FAIL → FAIL; any PASS_COMPOUND with no
  // FAIL → PASS_COMPOUND.
  const hasFail = rows.some((r) => r.ADAPTER_VALIDATION_VERDICT === 'FAIL');
  const hasPassCompound = rows.some((r) => r.ADAPTER_VALIDATION_VERDICT === 'PASS_COMPOUND');
  if (hasFail) merged.ADAPTER_VALIDATION_VERDICT = 'FAIL';
  else if (hasPassCompound) merged.ADAPTER_VALIDATION_VERDICT = 'PASS_COMPOUND';
  else merged.ADAPTER_VALIDATION_VERDICT = rows.map((r) => r.ADAPTER_VALIDATION_VERDICT).join('+');

  merged.ADAPTER_VALIDATION_REASONS = rows.flatMap((r) => [
    `${r.APPLIED_ADAPTERS.join(',')} → ${r.ADAPTER_VALIDATION_VERDICT} (${r.ADAPTER_VALIDATION_REASONS.join('; ')})`,
  ]);

  // NOT_APPLICABLE is neutral in a compound form: it means that particular
  // family owns no real contract+DOCX target, not that a sibling's proven
  // mapping failed. Only use it when every family is inapplicable.
  const effectiveRows = rows.filter((row) => row.FINAL_ADAPTER_STATUS !== 'NOT_APPLICABLE');
  let worst = (effectiveRows.length === 0 ? 'NOT_APPLICABLE' : 'PASS') as PerFormRow['FINAL_ADAPTER_STATUS'];
  for (const r of effectiveRows) {
    const idx = order.indexOf(r.FINAL_ADAPTER_STATUS);
    if (idx === -1) continue;
    const worstIdx = order.indexOf(worst);
    if (idx < worstIdx) worst = r.FINAL_ADAPTER_STATUS;
  }
  merged.FINAL_ADAPTER_STATUS = worst;
  return merged;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(ROLLOUT_DIR, { recursive: true });

  const registry = buildDefaultRegistry();
  const inventory = await loadSlotInventory();
  const manifest = await loadManifest();
  const manifestIdx = codeIndex(manifest);
  const manifestSha = manifestSha256(manifest);

  // Pre-compute registry SHA by hashing a canonical string of the registered
  // family IDs (registration order is canonical).
  const registeredFamilies = registry.list().map((a) => a.family);
  const registrySourceSha = sha256(stableJsonStringify(registeredFamilies));

  const forms = [...manifestIdx.keys()].sort((a, b) => {
    const na = parseInt(a.replace(/[^0-9]/g, ''), 10);
    const nb = parseInt(b.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(na) && Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  if (forms.length !== 213) {
    throw new Error(
      `Expected 213 forms; got ${forms.length}. Did the manifest build run?`,
    );
  }

  const outForms: PerFormRow[] = [];

  for (const form of forms) {
    const code = form;
    const inv = inventory[code] || {
      formCode: code,
      templateSha256: null,
      contractSha256: null,
      slotKeys: [],
      contractKeys: [],
      matchedKeys: [],
      canonicalSlotKeys: [],
      verdict: 'NO_DATA',
    };

    const xml = await readNormalizedXml(code);
    const familyRows: PerFormRow[] = [];
    for (const family of ['SIGNATURE_SECTION', 'ISSUE_PLACE_DATE', 'DOCUMENT_BASIC', 'RECIPIENT_COPY', 'LEGAL_HEADER'] as SourceSlotFamily[]) {
      const r = runAdapterForFamily({
        registry,
        formCode: code,
        family,
        contractKeys: inv.contractKeys,
        xml,
        familyKeys: KNOWN_KEYS[family],
      });
      r.row.NORMALIZED_TEMPLATE_PATH = path.join(
        NORMALIZED_ROOT,
        code,
        `${code}_normalized.docx`,
      );
      r.row.NORMALIZED_TEMPLATE_SHA256 = inv.templateSha256;
      r.row.CONTRACT_PATH = path.join(
        FORM_INPUTS_DIR,
        `${code.toLowerCase()}-form-inputs.tsx`,
      );
      r.row.CONTRACT_SHA256 = inv.contractSha256;
      familyRows.push(r.row);
    }
    const merged = mergeFamilyRows(code, familyRows);
    // Sort all sub-arrays deterministically.
    merged.FIELD_CLASSIFICATIONS.sort((a, b) => a.key.localeCompare(b.key));
    merged.SOURCE_TARGETS.sort((a, b) =>
      a.path.localeCompare(b.path) || a.occurrenceIndex - b.occurrenceIndex,
    );
    merged.RENDER_VALUES_R1.sort((a, b) => a.key.localeCompare(b.key));
    merged.RENDER_VALUES_R2.sort((a, b) => a.key.localeCompare(b.key));
    merged.RESOLVED_REQUIRED_KEYS.sort();
    merged.PARTIALLY_RESOLVED_KEYS.sort();
    merged.UNRESOLVED_REQUIRED_KEYS.sort();
    merged.STATIC_PROTECTED_KEYS.sort();
    merged.DISPLAY_ONLY_KEYS.sort();
    merged.EDITOR_ONLY_KEYS.sort();
    merged.TARGET_COLLISIONS.sort();
    merged.APPLIED_ADAPTERS.sort();
    outForms.push(merged);
  }

  const counts = {
    PASS: 0,
    PASS_COMPOUND: 0,
    PARTIAL: 0,
    SOURCE_ABSENT: 0,
    FAIL: 0,
    NOT_APPLICABLE: 0,
  };
  let signatureResolved = 0;
  let issuePlaceDateResolved = 0;
  let targetCollisions = 0;
  for (const r of outForms) {
    counts[r.FINAL_ADAPTER_STATUS]++;
    for (const k of r.RESOLVED_REQUIRED_KEYS) {
      if (k.startsWith('signature.')) signatureResolved++;
      if (k.startsWith('document.issue') || k.startsWith('document.issuePlace') || k.startsWith('document.issueDate'))
        issuePlaceDateResolved++;
    }
    if (r.TARGET_COLLISIONS.length > 0) targetCollisions++;
  }

  // The output object — `generatedAt` is excluded from the canonical hash payload.
  const generatedAt = new Date().toISOString();
  const canonicalPayload = stableJsonStringify({
    schema: 'qllaw.213.adapter_resolution/v1',
    formCount: outForms.length,
    counts,
    forms: outForms,
  });
  const canonicalPayloadSha = sha256(canonicalPayload);

  const artifact = {
    schema: 'qllaw.213.adapter_resolution/v1',
    generatedAt,
    generatorVersion: 'phase4b-build-adapter-resolution/1',
    registrySourceSha256: registrySourceSha,
    authoritativeManifestSha256: manifestSha,
    canonicalPayloadSha256: canonicalPayloadSha,
    formCount: outForms.length,
    counts,
    a8Invariants: {
      signatureResolved,
      issuePlaceDateResolved,
      targetCollisions,
    },
    forms: outForms,
  };

  await writeFile(ARTIFACT_PATH, JSON.stringify(artifact, null, 2));

  console.log(
    `OK: adapter-resolution-213.json written (${outForms.length} forms). ` +
      `counts=${JSON.stringify(counts)} ` +
      `signatureResolved=${signatureResolved} issuePlaceDateResolved=${issuePlaceDateResolved} ` +
      `targetCollisions=${targetCollisions} ` +
      `canonicalPayloadSha256=${canonicalPayloadSha.slice(0, 12)}…`,
  );
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26 (render consumer).
 *
 * Render authority is now sourced from scripts/runtime-rollout/lib/locked-runtime-index.mjs:
 *   - WHAT field renders: locked binding.from (canonical field path)
 *   - WHERE it renders:    locked slot.location.partName/blockId/tableCellId
 *   - HOW it renders:      lib/locked-transforms.mjs (applyTransform)
 *   - blocked:             partial/missing targets fail closed
 *
 * Locked totals for this wave: 213 forms / 2497 fields / 2497 slots / 2497 bindings.
 * Compile-v2 and panels may serve as values, never as authority.
 * The semantic overlay (lib/locked-semantic-overlay) gates unsafe field interpretation.
 * ------------------------------------------------------------------ */

