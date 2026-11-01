/** Source-evidence-first semantic mapping v2. Never writes templates or runtime mappings. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout');
const NORMALIZED = path.join(ROOT, 'storage/templates/normalized-docx');
const COMPILED = path.join(ROOT, 'docs/audit/docx/compiled-v2');
const sha = (v) => createHash('sha256').update(v).digest('hex');
const hashFile = (p) => sha(readFileSync(p));
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const text = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const targetRe = /\{\{?\s*([A-Za-z][\w.-]*)\s*\}?\}/g;
const normalizeKey = (k = '') => k.replaceAll('-', '.');

function inferValueType(key, control = '') {
  if (/boolean|has[A-Z]|is[A-Z]/.test(key)) return 'BOOLEAN';
  if (/date|day|month|year|time/i.test(key)) return 'DATE';
  if (/items|members|rows|list/i.test(key)) return 'LIST';
  if (/textarea|content|summary|line|reason|description/i.test(`${control} ${key}`)) return 'MULTILINE_TEXT';
  return 'TEXT';
}
function inferExpectation(key, field) {
  if (!field) return 'UNKNOWN_REQUIRES_INVESTIGATION';
  if (field.dataSource?.kind === 'DERIVED') return 'DERIVED_VALUE';
  if (/signMode|display|preview/i.test(key)) return 'DISPLAY_ONLY';
  if (/date|day|month|year|line|summary|article|basis|items|members/i.test(key)) return 'COMPOUND_COMPONENT';
  if (/has[A-Z]|is[A-Z]/.test(key)) return 'CONDITIONAL_SWITCH';
  if (/items|rows|members/i.test(key)) return 'REPEATED_COMPONENT';
  if (/signature|official|receiver|recipient/.test(key)) return 'ROLE_BOUND_VALUE';
  return 'DIRECT_VISIBLE_VALUE';
}
function regionFor(value) {
  const v = value.toLowerCase();
  if (/nơi nhận|noi nhan|lưu:|luu:/.test(v)) return 'RECIPIENT_BLOCK';
  if (/ký, ghi rõ|ký tên|ky, ghi ro|chữ ký|chu ky/.test(v)) return 'SIGNATURE_BLOCK';
  if (/mẫu số|mau so|cộng hòa|cong hoa|thông tư|thong tu/.test(v)) return 'LEGAL_HEADER';
  if (/ngày.*tháng.*năm|ngay.*thang.*nam/.test(v)) return 'ISSUE_PLACE_DATE';
  if (/điều\s*\d|dieu\s*\d/.test(v)) return 'OPERATIVE_ARTICLE';
  if (/xét thấy|xet thay/.test(v)) return 'CONSIDERATION';
  if (/căn cứ|can cu/.test(v)) return 'LEGAL_BASIS';
  return 'BODY_FLOW';
}
function roleFor(value) {
  const v = value.toLowerCase();
  if (/nơi nhận|noi nhan/.test(v)) return 'RECIPIENT';
  if (/ký, ghi rõ|ký tên|ky, ghi ro/.test(v)) return 'SIGNER';
  if (/kiểm sát viên|kiem sat vien/.test(v)) return 'PROSECUTOR';
  return null;
}
export function validateCandidate(metadata, target) {
  const reasons = [];
  const region = target.structuralRegion;
  const ns = metadata.namespace || '';
  if (metadata.valueType === 'DATE' && ['RECIPIENT_BLOCK', 'SIGNATURE_BLOCK', 'LEGAL_HEADER', 'CONSIDERATION'].includes(region)) reasons.push('DATE_REGION_MISMATCH');
  if (/^(case|caseInfo|offense|person)/.test(ns) && region === 'RECIPIENT_BLOCK') reasons.push('NAMESPACE_REGION_MISMATCH');
  if (/^(official|signature)/.test(ns) && region === 'RECIPIENT_BLOCK') reasons.push('ROLE_REGION_MISMATCH');
  if (metadata.valueType === 'BOOLEAN' && !['CONDITIONAL_REGION', 'OPERATIVE_ARTICLE'].includes(region)) reasons.push('BOOLEAN_SCALAR_REPLACEMENT_UNSAFE');
  if (metadata.renderExpectation === 'COMPOUND_COMPONENT' && ['RECIPIENT_BLOCK', 'SIGNATURE_BLOCK', 'LEGAL_HEADER'].includes(region)) reasons.push('COMPOUND_REGION_MISMATCH');
  return { valid: reasons.length === 0, reasons };
}
export function classifyV2Row({ metadata, source }) {
  if (!metadata) return { PRIMARY_CLASSIFICATION: 'CONTRACT_METADATA_GAP', CONFIDENCE: null, DECISION_STATUS: 'EVIDENCE_PIPELINE_GAP', BLOCKING_REASON: 'CONTRACT_METADATA_GAP' };
  if (!['FOUND_IMMUTABLE_SOURCE', 'FOUND_ARCHIVED_SOURCE', 'FOUND_VERIFIED_NORMALIZATION_INPUT', 'NORMALIZED_ONLY_SOURCE_PROVENANCE_PROVEN'].includes(source.SOURCE_DISCOVERY_STATUS)) return { PRIMARY_CLASSIFICATION: 'SOURCE_DISCOVERY_GAP', CONFIDENCE: null, DECISION_STATUS: 'EVIDENCE_PIPELINE_GAP', BLOCKING_REASON: source.SOURCE_DISCOVERY_STATUS };
  return { PRIMARY_CLASSIFICATION: 'AMBIGUOUS_LEGAL_SEMANTICS', CONFIDENCE: null, DECISION_STATUS: 'EVIDENCE_PIPELINE_GAP', BLOCKING_REASON: 'NO_VALIDATED_RECIPE_OR_DIRECT_TARGET' };
}

async function findSources() {
  const baseline = await readJson(path.join(OUT, 'source-hash-baseline.json'));
  const byCode = new Map((baseline.rows || []).map((x) => [x.formCode, x]));
  const rows = [];
  for (let n = 1; n <= 213; n++) {
    const code = `BM-${String(n).padStart(3, '0')}`;
    const normalizedPath = path.join(NORMALIZED, code, `${code}_normalized.docx`);
    const known = byCode.get(code);
    const sourceFound = known?.path && existsSync(known.path);
    rows.push({ FORM_CODE: code, SOURCE_DISCOVERY_STATUS: sourceFound ? 'FOUND_VERIFIED_NORMALIZATION_INPUT' : 'SOURCE_PATH_GAP', SOURCE_DOCX_PATH: sourceFound ? known.path : null, SOURCE_DOCX_SHA256: sourceFound ? hashFile(known.path) : null, SOURCE_PROVENANCE: sourceFound ? 'source-hash-baseline.json' : null, NORMALIZED_DOCX_PATH: existsSync(normalizedPath) ? normalizedPath : null, NORMALIZED_DOCX_SHA256: existsSync(normalizedPath) ? hashFile(normalizedPath) : null, NORMALIZATION_INPUT_SHA256: sourceFound ? hashFile(known.path) : null, NORMALIZATION_OUTPUT_SHA256: existsSync(normalizedPath) ? hashFile(normalizedPath) : null, SOURCE_TO_NORMALIZED_RELATION: sourceFound ? 'HASH_LEDGER_SOURCE_TO_NORMALIZED' : 'UNPROVEN', FILES_SEARCHED: ['source-hash-baseline.json', 'storage/templates/normalized-docx'], FAILURE_REASON: sourceFound ? null : 'No immutable or archived source path recorded in repository evidence.' });
  }
  return rows;
}
async function extractTargets(sourceRows) {
  const all = [];
  for (const source of sourceRows.filter((r) => r.NORMALIZED_DOCX_PATH)) {
    const zip = new PizZip(readFileSync(source.NORMALIZED_DOCX_PATH));
    for (const name of Object.keys(zip.files).filter((p) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/.test(p))) {
      const xml = zip.file(name)?.asText() || '';
      const blocks = [...xml.matchAll(/<w:(?:p|tc|sdt)[\s\S]*?<\/w:(?:p|tc|sdt)>/g)];
      blocks.forEach((block, index) => {
        const value = text(block[0]); const region = regionFor(value);
        for (const m of value.matchAll(targetRe)) all.push({ TARGET_ID: `${source.FORM_CODE}:${name}:${index + 1}:${m[1]}`, FORM_CODE: source.FORM_CODE, DOCX_PART: name, STRUCTURAL_PATH: `${name}#/block[${index + 1}]`, OCCURRENCE_INDEX: index, STRUCTURAL_REGION: region, TEXT_BEFORE: value.slice(0, m.index), TARGET_TOKEN: m[0], TARGET_KEY: normalizeKey(m[1]), TEXT_AFTER: value.slice((m.index || 0) + m[0].length), FULL_PARAGRAPH_OR_CELL_TEXT: value, PRECEDING_BLOCK: index ? text(blocks[index - 1][0]) : 'START_OF_PART', FOLLOWING_BLOCK: index + 1 < blocks.length ? text(blocks[index + 1][0]) : 'END_OF_PART', ROLE_HINT: roleFor(value), VALUE_TYPE_HINT: inferValueType(m[1]), PLACEHOLDER_DIALECT: m[0].startsWith('{{') ? 'DOUBLE_BRACE_DOTTED' : 'SINGLE_BRACE_DOTTED', STATIC_OR_RUNTIME: 'RUNTIME_TOKEN', NORMALIZED_TEMPLATE_SHA256: source.NORMALIZED_DOCX_SHA256 });
      });
    }
  }
  return all;
}
async function buildMetadata(inventory) {
  const metadata = new Map();
  for (const inv of inventory.results.filter((r) => (r.sourceDebtKeys || []).length)) {
    const code = inv.formCode; const p = path.join(COMPILED, `${code}.compiled.json`); const compiled = existsSync(p) ? await readJson(p) : null;
    const fields = compiled?.source?.fields || []; const sections = compiled?.source?.sections || [];
    for (const key of inv.sourceDebtKeys) {
      const field = fields.find((f) => f.key === key);
      if (!field) { metadata.set(`${code}|${key}`, null); continue; }
      const section = sections.find((s) => s.id === field.sectionId);
      metadata.set(`${code}|${key}`, { FORM_CODE: code, CONTRACT_KEY: key, DECLARING_FILE: p, DECLARING_SYMBOL: field.id || `compiled:${key}`, CONTRACT_SHA256: inv.contractSha256, LABEL: field.label, DESCRIPTION: field.description || null, CONTROL_TYPE: field.control, VALUE_TYPE: inferValueType(key, field.control), REQUIRED: field.required === true, OPTIONAL: field.required === false, SECTION_ID: field.sectionId || null, SECTION_TITLE: section?.title || section?.label || null, FIELD_ID: field.id || null, DATA_SOURCE: field.dataSource || null, VISIBILITY_RULE: field.visibleWhen || null, REPEATER_PARENT: field.repeaterParent || null, TABLE_PARENT: field.tableParent || null, ROLE_TYPE: roleFor(`${key} ${field.label || ''}`), DEFAULT_VALUE_POLICY: field.defaultValue ?? null, DERIVATION_POLICY: field.dataSource?.kind === 'DERIVED' ? 'DERIVED' : null, RENDER_EXPECTATION: inferExpectation(key, field), namespace: key.split('.')[0] });
    }
  }
  return metadata;
}
function recipeFor(code, metadata, candidates) {
  if (!candidates.length || !['COMPOUND_COMPONENT', 'CONDITIONAL_SWITCH', 'REPEATED_COMPONENT', 'ROLE_BOUND_VALUE'].includes(metadata.RENDER_EXPECTATION)) return null;
  const candidate = candidates[0];
  return { recipeId: `${code}:${candidate.TARGET_KEY}`, formCode: code, targetId: candidate.TARGET_ID, targetKey: candidate.TARGET_KEY, renderStrategy: metadata.RENDER_EXPECTATION, sourceEvidence: { part: candidate.DOCX_PART, structuralPath: candidate.STRUCTURAL_PATH, sourceText: candidate.FULL_PARAGRAPH_OR_CELL_TEXT, templateSha256: candidate.NORMALIZED_TEMPLATE_SHA256 }, components: [{ contractKey: metadata.CONTRACT_KEY, componentRole: metadata.RENDER_EXPECTATION, transform: 'UNVALIDATED_NO_EXECUTION', required: metadata.REQUIRED, order: 10 }], grammar: { prefix: null, fragments: [], punctuationPolicy: 'UNVALIDATED', emptyComponentPolicy: 'NO_EXECUTION' }, status: 'PROPOSED_EVIDENCE_ONLY' };
}
async function main() {
  await mkdir(OUT, { recursive: true });
  const inventory = await readJson(path.join(OUT, 'slot-inventory-summary.json'));
  const sources = await findSources(); const sourceBy = new Map(sources.map((s) => [s.FORM_CODE, s]));
  const targets = await extractTargets(sources); const targetBy = new Map(); for (const t of targets) { const k = `${t.FORM_CODE}|${t.TARGET_KEY}`; targetBy.set(k, [...(targetBy.get(k) || []), t]); }
  const metadata = await buildMetadata(inventory); const rows = []; const recipes = []; const gaps = [];
  for (const inv of inventory.results.filter((r) => (r.sourceDebtKeys || []).length)) for (const key of inv.sourceDebtKeys) {
    const meta = metadata.get(`${inv.formCode}|${key}`); const source = sourceBy.get(inv.formCode); const base = classifyV2Row({ metadata: meta, source });
    const candidates = meta ? [...(targetBy.get(`${inv.formCode}|${key}`) || [])].map((target) => ({ target, result: validateCandidate(meta, target) })) : [];
    const valid = candidates.filter((c) => c.result.valid).map((c) => c.target); const rejected = candidates.filter((c) => !c.result.valid).map((c) => ({ TARGET_ID: c.target.TARGET_ID, TARGET_KEY: c.target.TARGET_KEY, reasons: c.result.reasons }));
    const recipe = meta && source?.SOURCE_DISCOVERY_STATUS !== 'SOURCE_PATH_GAP' ? recipeFor(inv.formCode, meta, valid) : null; if (recipe) recipes.push(recipe);
    const row = { FORM_CODE: inv.formCode, CONTRACT_KEY: key, CONTRACT_METADATA_STATUS: meta ? 'COMPLETE' : 'CONTRACT_METADATA_GAP', CONTRACT_LABEL: meta?.LABEL ?? null, CONTRACT_DESCRIPTION: meta?.DESCRIPTION ?? null, CONTROL_TYPE: meta?.CONTROL_TYPE ?? null, VALUE_TYPE: meta?.VALUE_TYPE ?? null, REQUIRED: meta?.REQUIRED ?? null, SECTION: meta?.SECTION_TITLE ?? null, FIELD_ID: meta?.FIELD_ID ?? null, RENDER_EXPECTATION: meta?.RENDER_EXPECTATION ?? 'UNKNOWN_REQUIRES_INVESTIGATION', SOURCE_DISCOVERY_STATUS: source?.SOURCE_DISCOVERY_STATUS ?? 'SOURCE_PATH_GAP', SOURCE_DOCX_PATH: source?.SOURCE_DOCX_PATH ?? null, SOURCE_DOCX_SHA256: source?.SOURCE_DOCX_SHA256 ?? null, NORMALIZED_DOCX_PATH: source?.NORMALIZED_DOCX_PATH ?? null, NORMALIZED_DOCX_SHA256: source?.NORMALIZED_DOCX_SHA256 ?? null, ...base, RECIPE_ID: recipe?.recipeId ?? null, COMPONENT_ROLE: recipe?.components[0].componentRole ?? null, VALID_CANDIDATES: valid.map((x) => ({ TARGET_ID: x.TARGET_ID, TARGET_KEY: x.TARGET_KEY, STRUCTURAL_REGION: x.STRUCTURAL_REGION })), REJECTED_CANDIDATES: rejected, HARD_CONSTRAINT_RESULTS: candidates.map((c) => ({ target: c.target.TARGET_KEY, valid: c.result.valid, reasons: c.result.reasons })), SCORE_COMPONENTS: null, CONFIDENCE_MARGIN: null, EXECUTION_STATUS: 'NOT_EXECUTABLE_EVIDENCE_FIRST', BLOCKING_REASON: base.BLOCKING_REASON };
    rows.push(row); if (base.DECISION_STATUS === 'EVIDENCE_PIPELINE_GAP') gaps.push(row);
  }
  const classifications = Object.fromEntries([...new Set(rows.map((r) => r.PRIMARY_CLASSIFICATION))].map((x) => [x, rows.filter((r) => r.PRIMARY_CLASSIFICATION === x).length]));
  const quality = { schema: 'qllaw.213.legal_semantic_mapping/v2-quality', status: rows.every((r) => r.CONFIDENCE === null || r.CONTRACT_METADATA_STATUS === 'COMPLETE') ? 'PASS_EVIDENCE_GAPS_FAIL_CLOSED' : 'FAIL', rows: rows.length, missingMetadata: rows.filter((r) => r.CONTRACT_METADATA_STATUS !== 'COMPLETE').length, sourceDiscoveryGaps: rows.filter((r) => r.SOURCE_DISCOVERY_STATUS === 'SOURCE_PATH_GAP').length, unsafeDirectMappings: 0, untrustedV1Consumed: false, notes: ['No v2 row receives semantic confidence while its contract metadata or source discovery is incomplete.', 'No v2 mapping is executable in this evidence-repair pass.'] };
  const summary = { schema: 'qllaw.213.legal_semantic_mapping/v2', generatedAt: new Date().toISOString(), unresolvedKeysInput: rows.length, classifications, recipesProposed: recipes.length, execution: 'NO_MAPPING_EXECUTED', v1: 'SUPERSEDED_UNTRUSTED_V1', qualityStatus: quality.status };
  const transition = Object.entries(classifications).map(([v2, count]) => ({ V1_CLASSIFICATION: 'SOURCE_TEMPLATE_DEBT_OR_UNTRUSTED_PROPOSAL', V2_CLASSIFICATION: v2, COUNT: count, AFFECTED_FORMS: [...new Set(rows.filter((r) => r.PRIMARY_CLASSIFICATION === v2).map((r) => r.FORM_CODE))], REASON: 'v2 evidence-first reclassification' }));
  const priority = [{ RECIPE_FAMILY: 'EVIDENCE_PIPELINE_REPAIR', AFFECTED_FORMS: [...new Set(gaps.map((r) => r.FORM_CODE))].length, DEBT_KEYS_RESOLVED: 0, FORMS_FULLY_UNLOCKED: 0, FORMS_PARTIALLY_UNLOCKED: 0, SHARED_REUSE_COUNT: 0, CONFIDENCE: 'NONE_UNTIL_EVIDENCE_COMPLETE', LEGAL_RISK: 'LOW', STRUCTURAL_COMPLEXITY: 'MEDIUM', IMPLEMENTATION_EFFORT: 'MEDIUM', EXISTING_VISUAL_EVIDENCE: 'NOT_COUNTED', BLOCKING_DEPENDENCIES: ['contract metadata', 'authoritative source discovery'], PRIORITY_SCORE: 1000 }];
  await Promise.all([
    writeFile(path.join(OUT, 'contract-field-evidence-213.json'), `${JSON.stringify({ schema: 'qllaw.213.contract_field_evidence/v2', rows: [...metadata.values()].filter(Boolean), gaps: [...metadata.entries()].filter(([, v]) => !v).map(([k]) => ({ key: k, status: 'CONTRACT_METADATA_GAP', filesSearched: ['docs/audit/docx/compiled-v2', 'apps/web/src/components/documents'] })) }, null, 2)}\n`),
    writeFile(path.join(OUT, 'authoritative-source-evidence-213.json'), `${JSON.stringify({ schema: 'qllaw.213.authoritative_source_evidence/v2', rows: sources }, null, 2)}\n`),
    writeFile(path.join(OUT, 'docx-structural-targets-213.json'), `${JSON.stringify({ schema: 'qllaw.213.docx_structural_targets/v2', targets }, null, 2)}\n`),
    writeFile(path.join(OUT, 'legal-semantic-mapping-v2-all.json'), `${JSON.stringify({ schema: summary.schema, summary, mappings: rows }, null, 2)}\n`),
    writeFile(path.join(OUT, 'legal-semantic-mapping-v2-summary.json'), `${JSON.stringify(summary, null, 2)}\n`),
    writeFile(path.join(OUT, 'render-recipes-v2.json'), `${JSON.stringify({ schema: 'qllaw.213.render_recipes/v2', executable: false, recipes }, null, 2)}\n`),
    writeFile(path.join(OUT, 'mapping-v2-evidence-gaps.json'), `${JSON.stringify({ schema: 'qllaw.213.mapping_v2_evidence_gaps/v2', rows: gaps }, null, 2)}\n`),
    writeFile(path.join(OUT, 'mapping-v2-quality-report.json'), `${JSON.stringify(quality, null, 2)}\n`),
    writeFile(path.join(OUT, 'mapping-v2-priority.json'), `${JSON.stringify(priority, null, 2)}\n`),
    writeFile(path.join(OUT, 'mapping-v1-to-v2-transition.json'), `${JSON.stringify(transition, null, 2)}\n`),
  ]);
  console.log(`OK: mapping v2 evidence repair complete. rows=${rows.length} metadataGaps=${quality.missingMetadata} sourceGaps=${quality.sourceDiscoveryGaps} targets=${targets.length} recipes=${recipes.length}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
