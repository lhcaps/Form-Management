/**
 * Builds a reviewable, source-grounded semantic mapping corpus for unresolved
 * contract keys.  It never changes DOCX files or runtime mappings: automatic
 * approvals are evidence records that downstream execution must validate.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout');
const INVENTORY = path.join(OUT, 'slot-inventory-summary.json');
const MANIFEST = path.join(OUT, 'authoritative-213-manifest.json');
const COMPILED = path.join(ROOT, 'docs/audit/docx/compiled-v2');
const NORMALIZED = path.join(ROOT, 'storage/templates/normalized-docx');

const EMPTY = 'NOT_AVAILABLE_FROM_CURRENT_EVIDENCE';
const ROLE_WORDS = ['signer', 'signature', 'receiver', 'recipient', 'official', 'prosecutor', 'investigator', 'clerk', 'issuer'];
const SHAPES = new Set(['DIRECT_SEMANTIC_ALIAS', 'LEGACY_KEY_ALIAS', 'COMPOUND_PARAGRAPH_COMPONENT', 'TABLE_CELL_COMPONENT', 'SIGNATURE_ROLE_FIELD', 'OFFICIAL_ROLE_FIELD', 'PERSON_IDENTITY_FIELD', 'CASE_INFORMATION_FIELD', 'OFFENSE_INFORMATION_FIELD', 'RECIPIENT_FIELD', 'ISSUE_PLACE_DATE_COMPONENT', 'CONDITIONAL_BLOCK_FIELD', 'REPEATED_REGION_FIELD', 'DERIVED_RENDER_VALUE', 'DISPLAY_ONLY', 'EDITOR_ONLY', 'STATIC_SOURCE_TEXT', 'CONTRACT_REDUNDANT', 'GENUINE_SOURCE_ABSENT', 'SOURCE_TEMPLATE_DEBT', 'AMBIGUOUS_LEGAL_ROLE']);

const fold = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const tokens = (value = '') => [...new Set(fold(value).split(/[^a-z0-9]+/).filter((x) => x.length > 1 && !['nguoi', 'thong', 'tin', 'van', 'ban', 'cua', 'the', 'cho'].includes(x)))];
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""').replaceAll('\n', ' ')}"`;

function overlap(a, b) {
  const left = new Set(tokens(a)); const right = new Set(tokens(b));
  return left.size ? [...left].filter((x) => right.has(x)).length / left.size : 0;
}
function roleSet(value) { return new Set(ROLE_WORDS.filter((word) => fold(value).includes(word))); }
function shapeFor(key) {
  if (/^signature\./.test(key)) return 'SIGNATURE_ROLE_FIELD';
  if (/^official\./.test(key)) return 'OFFICIAL_ROLE_FIELD';
  if (/^(person|accused|suspect|informant|reporter)\./.test(key)) return 'PERSON_IDENTITY_FIELD';
  if (/^offense\./.test(key)) return 'OFFENSE_INFORMATION_FIELD';
  if (/^(case|caseInfo|caseDecision|sourceAssignment)\./.test(key)) return 'CASE_INFORMATION_FIELD';
  if (/^recipients?\./.test(key)) return 'RECIPIENT_FIELD';
  if (/^document\.issue/.test(key)) return 'ISSUE_PLACE_DATE_COMPONENT';
  if (/^conditional\./.test(key)) return 'CONDITIONAL_BLOCK_FIELD';
  if (/(line\d+|row\d+|items|list)/i.test(key)) return 'REPEATED_REGION_FIELD';
  if (/(date|day|month|year|summary|line)$/i.test(key)) return 'COMPOUND_PARAGRAPH_COMPONENT';
  return 'DIRECT_SEMANTIC_ALIAS';
}

export function proposeSemanticMapping({ contractKey, contractLabel = '', required, candidates = [] }) {
  const contractRoles = roleSet(`${contractKey} ${contractLabel}`);
  const ranked = candidates.map((candidate) => ({
    ...candidate,
    score: Math.max(overlap(contractLabel, candidate.sourceText), overlap(contractKey, candidate.target)),
  })).filter((candidate) => candidate.score > 0 || (contractRoles.size > 0 && roleSet(`${candidate.target} ${candidate.sourceText}`).size > 0))
    .sort((a, b) => b.score - a.score || a.target.localeCompare(b.target));
  const top = ranked[0];
  const candidateRoles = new Set(ranked.flatMap((c) => [...roleSet(`${c.target} ${c.sourceText}`)]));
  const roleConflict = (contractRoles.size > 0 || /^official\./.test(contractKey)) && candidateRoles.size > 1;
  if (!top) return {
    PROPOSED_CANONICAL_KEY: contractKey,
    PROPOSED_SOURCE_TARGET: EMPTY,
    PROPOSED_RENDER_STRATEGY: 'NO_EXECUTION_SOURCE_TARGET',
    PROPOSED_FIELD_CLASSIFICATION: required ? 'SOURCE_TEMPLATE_DEBT' : 'EDITOR_ONLY',
    SEMANTIC_RATIONALE: required ? 'No current normalized DOCX target exists for this required contract key.' : 'Optional contract field has no current DOCX target; it is retained as editor-only pending evidence.',
    ROLE_CONSTRAINT: 'No source target available to establish a role identity.',
    COLLISION_RISK: 'NO_TARGET',
    CONFIDENCE: 'UNRESOLVABLE_FROM_CURRENT_SOURCE',
    DECISION_STATUS: required ? 'SOURCE_TEMPLATE_DEBT' : 'PROPOSED_FOR_REVIEW',
    alternatives: [],
  };
  if (roleConflict) return {
    PROPOSED_CANONICAL_KEY: contractKey, PROPOSED_SOURCE_TARGET: top.target, PROPOSED_RENDER_STRATEGY: 'ROLE_AWARE_INLINE_REPLACE',
    PROPOSED_FIELD_CLASSIFICATION: 'AMBIGUOUS_LEGAL_ROLE', SEMANTIC_RATIONALE: 'More than one legal-role target is plausible in the current form; no role may be chosen automatically.',
    ROLE_CONSTRAINT: `Competing source roles: ${[...candidateRoles].join(', ') || 'unclassified'}.`, COLLISION_RISK: 'ROLE_COLLISION',
    CONFIDENCE: 'LOW', DECISION_STATUS: 'PROPOSED_FOR_REVIEW', alternatives: ranked.slice(0, 3),
  };
  const runnerUp = ranked[1];
  const deterministic = top.score >= 0.8 && top.structuralPath && (!runnerUp || top.score - runnerUp.score >= 0.25);
  const confidence = deterministic ? 'HIGH' : top.score >= 0.45 ? 'MEDIUM' : 'LOW';
  return {
    PROPOSED_CANONICAL_KEY: contractKey, PROPOSED_SOURCE_TARGET: top.target,
    PROPOSED_RENDER_STRATEGY: shapeFor(contractKey) === 'COMPOUND_PARAGRAPH_COMPONENT' ? 'COMPOUND_COMPONENT_REPLACE' : 'INLINE_REPLACE',
    PROPOSED_FIELD_CLASSIFICATION: shapeFor(contractKey),
    SEMANTIC_RATIONALE: `Best current-form candidate ${top.target} has semantic score ${top.score.toFixed(2)} from contract label/key and exact source excerpt.`,
    ROLE_CONSTRAINT: contractRoles.size ? `Expected role: ${[...contractRoles].join(', ')}.` : 'No role-specific constraint inferred.',
    COLLISION_RISK: runnerUp && top.score - runnerUp.score < 0.25 ? 'MULTIPLE_PLAUSIBLE_TARGETS' : 'NONE_DETECTED',
    CONFIDENCE: confidence, DECISION_STATUS: deterministic ? 'AUTO_APPROVED_DETERMINISTIC' : 'PROPOSED_FOR_REVIEW', alternatives: ranked.slice(0, 3),
  };
}

function sourceSlots(normalizedPath) {
  if (!existsSync(normalizedPath)) return [];
  const zip = new PizZip(requireBuffer(normalizedPath));
  const slots = [];
  for (const name of Object.keys(zip.files).filter((x) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(x))) {
    const xml = zip.file(name)?.asText() || '';
    const blocks = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>|<w:tc[\s\S]*?<\/w:tc>/g)];
    blocks.forEach((block, index) => {
      const text = block[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      for (const match of text.matchAll(/\{\{?\s*([A-Za-z][\w.-]*)\s*\}?\}/g)) slots.push({
        target: match[1].replaceAll('-', '.'), docxPart: name,
        structuralPath: `${name}#/${block[0].startsWith('<w:tc') ? 'w:tc' : 'w:p'}[${index + 1}]`, sourceText: text,
        preceding: index > 0 ? (blocks[index - 1][0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || EMPTY) : 'START_OF_PART',
        following: index + 1 < blocks.length ? (blocks[index + 1][0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || EMPTY) : 'END_OF_PART',
      });
    });
  }
  return slots;
}
function requireBuffer(file) { return readFileSync(file); }
function fieldMeta(compiled, key) {
  const fields = compiled.source?.fields || [];
  const field = fields.find((f) => f.key === key) || {};
  const section = (compiled.source?.sections || []).find((s) => s.id === field.sectionId) || {};
  return { field, section };
}
function workflow(entry, compiled) { return entry?.TECHNICAL_FAMILY || compiled.source?.workflowFamily || compiled.source?.category || 'UNCLASSIFIED_WORKFLOW'; }

async function main() {
  const [inventory, manifest] = await Promise.all([readFile(INVENTORY, 'utf8').then(JSON.parse), readFile(MANIFEST, 'utf8').then(JSON.parse)]);
  const manifestByCode = new Map((manifest.entries || []).map((e) => [e.FORM_CODE, e]));
  const rows = [];
  for (const inv of inventory.results.filter((r) => (r.sourceDebtKeys || []).length > 0)) {
    const code = inv.formCode;
    const contractPath = path.join(COMPILED, `${code}.compiled.json`);
    if (!existsSync(contractPath)) continue;
    const compiled = JSON.parse(await readFile(contractPath, 'utf8'));
    const entry = manifestByCode.get(code) || {};
    const normalizedPath = entry.NORMALIZED_DOCX_PATH || path.join(NORMALIZED, code, `${code}_normalized.docx`);
    const normalizedExists = existsSync(normalizedPath);
    const normalizedHash = normalizedExists ? sha256(requireBuffer(normalizedPath)) : 'NORMALIZED_DOCX_NOT_FOUND';
    const sourcePath = entry.SOURCE_ORIGINAL_DOCX_PATH || 'UNAVAILABLE_IN_AUTHORITATIVE_MANIFEST';
    const sourceHash = entry.SOURCE_ORIGINAL_SHA256 || 'UNAVAILABLE_IN_AUTHORITATIVE_MANIFEST';
    const slots = sourceSlots(normalizedPath);
    for (const key of inv.sourceDebtKeys) {
      const { field, section } = fieldMeta(compiled, key);
      const proposal = proposeSemanticMapping({ contractKey: key, contractLabel: field.label || key, required: field.required !== false, candidates: slots });
      const top = proposal.alternatives[0];
      const special = ['BM-019', 'BM-020', 'BM-050'].includes(code);
      if (special) { proposal.CONFIDENCE = proposal.CONFIDENCE === 'HIGH' ? 'MEDIUM' : proposal.CONFIDENCE; proposal.DECISION_STATUS = proposal.DECISION_STATUS === 'SOURCE_TEMPLATE_DEBT' ? 'SOURCE_TEMPLATE_DEBT' : 'PROPOSED_FOR_REVIEW'; proposal.SEMANTIC_RATIONALE = `Fail-closed special form: ${proposal.SEMANTIC_RATIONALE}`; }
      const row = {
        FORM_CODE: code, FORM_TITLE: compiled.title || entry.TITLE || code, LEGAL_WORKFLOW_FAMILY: workflow(entry, compiled),
        CONTRACT_KEY: key, CONTRACT_LABEL: field.label || 'LABEL_NOT_FOUND_IN_COMPILED_CONTRACT', CONTRACT_DESCRIPTION: field.description || 'NO_FIELD_DESCRIPTION_IN_COMPILED_CONTRACT',
        CONTROL_TYPE: field.control || 'CONTROL_NOT_FOUND', REQUIRED_OR_OPTIONAL: field.required === false ? 'OPTIONAL' : 'REQUIRED',
        UI_SECTION: section.title || section.label || field.sectionId || 'SECTION_NOT_FOUND', UI_CONTEXT: `fieldId=${field.id || 'NOT_FOUND'}; dataSource=${field.dataSource?.kind || 'NOT_FOUND'}`,
        SOURCE_DOCX_PATH: sourcePath, SOURCE_DOCX_SHA256: sourceHash, NORMALIZED_DOCX_PATH: normalizedExists ? normalizedPath : 'NORMALIZED_DOCX_NOT_FOUND', NORMALIZED_DOCX_SHA256: normalizedHash,
        DOCX_PART: top?.docxPart || 'NO_SOURCE_TARGET', STRUCTURAL_PATH: top?.structuralPath || 'NO_SOURCE_TARGET', SOURCE_PARAGRAPH_OR_CELL_TEXT: top?.sourceText || 'NO_SOURCE_TARGET_FOUND_IN_NORMALIZED_DOCX',
        PRECEDING_CONTEXT: top?.preceding || 'NO_SOURCE_TARGET', FOLLOWING_CONTEXT: top?.following || 'NO_SOURCE_TARGET', CURRENT_PLACEHOLDER_OR_TARGET: top?.target || 'NO_CURRENT_TARGET',
        CURRENT_SLOT_DIALECT: top ? '{{dotted.key}} OR {dotted.key}' : 'NO_SLOT_DIALECT_AVAILABLE', ...Object.fromEntries(Object.entries(proposal).filter(([k]) => k !== 'alternatives')),
        CONTRACT_SHA256: inv.contractSha256, NORMALIZED_TEMPLATE_SHA256: inv.templateSha256,
        SPECIAL_FAIL_CLOSED: special ? 'BM-019/BM-020/BM-050_REQUIRE_EVIDENCE' : 'NO',
      };
      if (!SHAPES.has(row.PROPOSED_FIELD_CLASSIFICATION)) throw new Error(`Invalid mapping shape for ${code} ${key}`);
      rows.push(row);
    }
  }
  rows.sort((a, b) => a.FORM_CODE.localeCompare(b.FORM_CODE) || a.CONTRACT_KEY.localeCompare(b.CONTRACT_KEY));
  const review = rows.filter((r) => r.CONFIDENCE === 'MEDIUM' || r.CONFIDENCE === 'LOW');
  const counts = Object.fromEntries(['HIGH', 'MEDIUM', 'LOW', 'UNRESOLVABLE_FROM_CURRENT_SOURCE'].map((k) => [k, rows.filter((r) => r.CONFIDENCE === k).length]));
  const decisions = Object.fromEntries(['AUTO_APPROVED_DETERMINISTIC', 'PROPOSED_FOR_REVIEW', 'SOURCE_TEMPLATE_DEBT', 'REJECTED_UNSAFE'].map((k) => [k, rows.filter((r) => r.DECISION_STATUS === k).length]));
  const priorities = [...new Map(rows.map((r) => {
    const signature = `${r.PROPOSED_FIELD_CLASSIFICATION}|${r.CONTRACT_KEY}|${r.PROPOSED_SOURCE_TARGET}`;
    const v = { MAPPING_SIGNATURE: signature, AFFECTED_FORMS: new Set(), AFFECTED_KEYS: new Set(), CONFIDENCE: r.CONFIDENCE, LEGAL_RISK: r.CONFIDENCE === 'HIGH' ? 'LOW' : r.CONFIDENCE === 'MEDIUM' ? 'MEDIUM' : 'HIGH', IMPLEMENTATION_EFFORT: r.PROPOSED_RENDER_STRATEGY.includes('COMPOUND') ? 'MEDIUM' : 'LOW' };
    return [signature, v];
  })).values()].map((p) => ({ ...p, AFFECTED_FORMS: [], AFFECTED_KEYS: [] }));
  const bySignature = new Map(priorities.map((p) => [p.MAPPING_SIGNATURE, p]));
  for (const r of rows) { const p = bySignature.get(`${r.PROPOSED_FIELD_CLASSIFICATION}|${r.CONTRACT_KEY}|${r.PROPOSED_SOURCE_TARGET}`); p.AFFECTED_FORMS.push(r.FORM_CODE); p.AFFECTED_KEYS.push(r.CONTRACT_KEY); }
  for (const p of priorities) { p.AFFECTED_FORMS = [...new Set(p.AFFECTED_FORMS)].sort(); p.AFFECTED_KEYS = [...new Set(p.AFFECTED_KEYS)].sort(); p.FORMS_UNLOCKED = p.CONFIDENCE === 'HIGH' ? p.AFFECTED_FORMS.length : 0; p.PRIORITY_SCORE = p.FORMS_UNLOCKED * 100 + (p.CONFIDENCE === 'HIGH' ? 20 : p.CONFIDENCE === 'MEDIUM' ? 10 : 0); }
  priorities.sort((a, b) => b.PRIORITY_SCORE - a.PRIORITY_SCORE || a.MAPPING_SIGNATURE.localeCompare(b.MAPPING_SIGNATURE));
  const batchFamily = review[0]?.LEGAL_WORKFLOW_FAMILY || 'UNCLASSIFIED_WORKFLOW';
  const batchForms = [...new Set(review.filter((r) => r.LEGAL_WORKFLOW_FAMILY === batchFamily).map((r) => r.FORM_CODE))].slice(0, 25);
  const batchRows = review.filter((r) => batchForms.includes(r.FORM_CODE));
  const reviewDir = path.join(OUT, 'reviews/batch-01'); await mkdir(reviewDir, { recursive: true });
  const summary = { schema: 'qllaw.213.legal_semantic_mapping/v1', generatedAt: new Date().toISOString(), inputInventoryGeneratedAt: inventory.generatedAt, unresolvedMappings: rows.length, confidence: counts, decisions, formsCovered: [...new Set(rows.map((r) => r.FORM_CODE))].length, reviewItems: review.length, batch01Forms: batchForms.length, autoExecution: 'MANIFEST_ONLY_PENDING_DOWNSTREAM_HASH_AND_COLLISION_VALIDATION', specialFormsFailClosed: ['BM-019', 'BM-020', 'BM-050'] };
  await Promise.all([
    writeFile(path.join(OUT, 'legal-semantic-mapping-all.json'), `${JSON.stringify({ schema: summary.schema, summary, mappings: rows }, null, 2)}\n`),
    writeFile(path.join(OUT, 'legal-semantic-mapping-review.csv'), `${Object.keys(rows[0] || {}).join(',')}\n${review.map((r) => Object.keys(rows[0]).map((k) => csv(r[k])).join(',')).join('\n')}\n`),
    writeFile(path.join(OUT, 'legal-semantic-mapping-summary.json'), `${JSON.stringify(summary, null, 2)}\n`),
    writeFile(path.join(OUT, 'mapping-review-priority.json'), `${JSON.stringify(priorities, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'review.json'), `${JSON.stringify({ batch: 'batch-01', workflowFamily: batchFamily, forms: batchForms, decisionOptions: ['A - APPROVE proposed mapping', 'B - SELECT alternative mapping', 'C - FIELD IS EDITOR_ONLY/DISPLAY_ONLY', 'D - SOURCE HAS NO VALID TARGET', 'E - NEEDS LEGAL REVIEW'], items: batchRows }, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'proposed-mappings.json'), `${JSON.stringify(batchRows, null, 2)}\n`),
    writeFile(path.join(reviewDir, 'source-excerpts.json'), `${JSON.stringify(batchRows.map(({ FORM_CODE, CONTRACT_KEY, DOCX_PART, STRUCTURAL_PATH, SOURCE_PARAGRAPH_OR_CELL_TEXT, PRECEDING_CONTEXT, FOLLOWING_CONTEXT }) => ({ FORM_CODE, CONTRACT_KEY, DOCX_PART, STRUCTURAL_PATH, SOURCE_PARAGRAPH_OR_CELL_TEXT, PRECEDING_CONTEXT, FOLLOWING_CONTEXT })), null, 2)}\n`),
    writeFile(path.join(reviewDir, 'review.md'), `# REVIEW REQUIRED - BATCH 01\n\nWorkflow family: ${batchFamily}. Forms: ${batchForms.join(', ') || 'none'}.\n\n${batchRows.map((r) => `## ${r.FORM_CODE} - ${r.CONTRACT_KEY}\n\nLabel: ${r.CONTRACT_LABEL}\n\nSource: ${r.SOURCE_PARAGRAPH_OR_CELL_TEXT}\n\nProposal: ${r.PROPOSED_SOURCE_TARGET}\n\nConfidence: ${r.CONFIDENCE}; risk: ${r.COLLISION_RISK}\n\nRecommended decision: ${r.CONFIDENCE === 'MEDIUM' ? 'A or B after source verification' : 'E - NEEDS LEGAL REVIEW'}\n\nOptions: A approve, B select alternative, C editor/display only, D no valid target, E legal review.\n`).join('\n')}`),
  ]);
  console.log(`OK: semantic mapping package written: unresolved=${rows.length} high=${counts.HIGH} medium=${counts.MEDIUM} low=${counts.LOW} templateDebt=${decisions.SOURCE_TEMPLATE_DEBT} batchForms=${batchForms.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((err) => { console.error('FATAL:', err.stack || err.message); process.exit(1); });
