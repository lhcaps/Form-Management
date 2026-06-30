#!/usr/bin/env node
/**
 * scripts/audit/apply-bm062-signature-placeholder-renormalization-approved.mjs
 *
 * Approved apply: rename exactly ONE BM-062 footer recipients.personLine5 occurrence
 * to signature.signerName, and add the corresponding slot/binding/field.
 *
 * Mutations:
 *   storage/templates/normalized-docx/BM-062/BM-062_normalized.docx
 *   docs/audit/docx/contracts/locked/BM-062__*.contract.locked.json
 *
 * Does NOT manually edit compiled-v2 (compile script does that).
 *
 * Usage:
 *   node scripts/audit/apply-bm062-signature-placeholder-renormalization-approved.mjs --root . --dry-run
 *   node scripts/audit/apply-bm062-signature-placeholder-renormalization-approved.mjs --root . --write
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import PizZip from 'pizzip';

const TEMPLATE_CODE = 'BM-062';
const TASK = 'BM062_SIGNATURE_FOOTER_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY';
const ORIGINAL_PLACEHOLDER = 'recipients.personLine5';
const ORIGINAL_TOTAL_COUNT = 5;
const DEFERRED_COUNT = 4;
const SIGNATURE_PLACEHOLDER = 'signature.signerName';
const SIGNATURE_OCCURRENCE_INDEX = 4;
const MUTATION_TYPE = 'DOCX_OCCURRENCE_RENAME_AND_BINDING_AWARE_CONTRACT_REPAIR';
const WORD_DOCUMENT_XML = 'word/document.xml';
const SIGNATURE_FIELD = {
  path: SIGNATURE_PLACEHOLDER,
  type: 'string',
  label: 'Người ký',
  source: 'officialConfig',
  required: true,
  uiComponent: 'text',
  section: 'Chữ ký',
  reviewRequired: false,
  transform: 'identity',
};

function parseArgs(argv) {
  let root = process.cwd();
  let mode = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') { root = argv[index + 1]; index += 1; continue; }
    if (arg === '--dry-run') { mode = mode ? 'INVALID' : 'DRY_RUN'; continue; }
    if (arg === '--write') { mode = mode ? 'INVALID' : 'WRITE'; continue; }
  }
  if (!mode || mode === 'INVALID') throw new Error('Pass exactly one of --dry-run or --write');
  return { root: resolve(root), write: mode === 'WRITE', mode };
}

function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf8')); }
function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
function token(placeholder) { return `{{${placeholder}}}`; }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function countOccurrences(text, needle) { return [...text.matchAll(new RegExp(escapeRegExp(needle), 'g'))].length; }
function visibleContext(text, start, end, radius = 1800) {
  return text.slice(Math.max(0, start - radius), Math.min(text.length, end + radius))
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function contextAroundOccurrence(text, needle, occurrenceIndex, radius = 1800) {
  let seen = -1, index = -1;
  while ((index = text.indexOf(needle, index + 1)) >= 0) {
    seen += 1;
    if (seen === occurrenceIndex) return visibleContext(text, index, index + needle.length, radius);
  }
  return '';
}
function deriveTextBefore(context, rawPattern) {
  const index = String(context ?? '').indexOf(rawPattern);
  if (index < 0) return '';
  return String(context).slice(Math.max(0, index - 160), index).trim();
}
function deriveTextAfter(context, rawPattern) {
  const index = String(context ?? '').indexOf(rawPattern);
  if (index < 0) return '';
  return String(context).slice(index + rawPattern.length, index + rawPattern.length + 160).trim();
}
function auditDir(root) { return join(root, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE, 'approved-signature'); }
function decisionsPath(root) { return join(auditDir(root), 'decisions.approved.json'); }
function normalizedDocxPath(root) {
  return join(root, 'storage', 'templates', 'normalized-docx', TEMPLATE_CODE, `${TEMPLATE_CODE}_normalized.docx`);
}
function lockedContractsDir(root) { return join(root, 'docs', 'audit', 'docx', 'contracts', 'locked'); }
function findLockedContractFile(root) {
  const dir = lockedContractsDir(root);
  const matches = readdirSync(dir).filter(f => f.startsWith(`${TEMPLATE_CODE}__`) && f.endsWith('.contract.locked.json')).sort();
  if (matches.length !== 1) throw new Error(`Expected exactly one ${TEMPLATE_CODE} locked contract, found ${matches.length}`);
  return join(dir, matches[0]);
}
function outputDir(root) { return join(root, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE); }

function assertDecision(decision) {
  const errors = [];
  if (decision.templateCode !== TEMPLATE_CODE) errors.push(`templateCode must be ${TEMPLATE_CODE}`);
  if (decision.originalPlaceholder !== ORIGINAL_PLACEHOLDER) errors.push(`originalPlaceholder must be ${ORIGINAL_PLACEHOLDER}`);
  if (decision.occurrenceIndex !== SIGNATURE_OCCURRENCE_INDEX) errors.push(`occurrenceIndex must be ${SIGNATURE_OCCURRENCE_INDEX}`);
  if (decision.finalNewPlaceholder !== SIGNATURE_PLACEHOLDER) errors.push(`finalNewPlaceholder must be ${SIGNATURE_PLACEHOLDER}`);
  if (decision.semanticFieldPath !== SIGNATURE_PLACEHOLDER) errors.push(`semanticFieldPath must be ${SIGNATURE_PLACEHOLDER}`);
  if (decision.mutationType !== MUTATION_TYPE) errors.push(`mutationType must be ${MUTATION_TYPE}`);
  if (decision.exactOoxmlTarget?.partName !== WORD_DOCUMENT_XML) errors.push(`exactOoxmlTarget.partName must be ${WORD_DOCUMENT_XML}`);
  if (!Array.isArray(decision.requiredContext) || decision.requiredContext.length === 0) errors.push('requiredContext must contain at least one anchor');
  if (errors.length > 0) throw new Error(`Invalid approved decision: ${errors.join('; ')}`);
}

function loadApprovedDecision(root) {
  const filePath = decisionsPath(root);
  if (!existsSync(filePath)) throw new Error(`Missing approved decisions: ${filePath}`);
  const doc = readJson(filePath);
  const decisions = doc.decisions ?? [];
  if (!Array.isArray(decisions) || decisions.length !== 1) throw new Error('Must have exactly 1 decision');
  const decision = decisions[0];
  assertDecision(decision);
  return { doc, decision };
}

function mutateDocumentXml(documentXml, decision) {
  const oldToken = token(decision.originalPlaceholder);
  const newToken = token(decision.finalNewPlaceholder);
  const beforeOldCount = countOccurrences(documentXml, oldToken);
  const beforeNewCount = countOccurrences(documentXml, newToken);

  if (beforeOldCount !== ORIGINAL_TOTAL_COUNT) {
    throw new Error(`Expected ${ORIGINAL_TOTAL_COUNT} ${oldToken} occurrences, found ${beforeOldCount}`);
  }
  if (beforeNewCount !== 0) {
    throw new Error(`Expected 0 existing ${newToken}, found ${beforeNewCount}`);
  }

  const targetContext = contextAroundOccurrence(documentXml, oldToken, decision.occurrenceIndex);
  const missingAnchors = decision.requiredContext.filter(a => !targetContext.includes(a));
  if (missingAnchors.length > 0) {
    throw new Error(`Target context missing anchors: ${missingAnchors.join(', ')}`);
  }

  let seen = -1, replacements = 0;
  const nextXml = documentXml.replace(new RegExp(escapeRegExp(oldToken), 'g'), (match) => {
    seen += 1;
    if (seen !== decision.occurrenceIndex) return match;
    replacements += 1;
    return newToken;
  });

  if (replacements !== 1) throw new Error(`Expected 1 replacement, got ${replacements}`);

  const signatureContext = contextAroundOccurrence(nextXml, newToken, 0);
  const afterOldCount = countOccurrences(nextXml, oldToken);
  const afterNewCount = countOccurrences(nextXml, newToken);

  if (afterOldCount !== DEFERRED_COUNT) {
    throw new Error(`Expected ${DEFERRED_COUNT} deferred ${oldToken} after mutation, got ${afterOldCount}`);
  }
  if (afterNewCount !== 1) throw new Error(`Expected 1 ${newToken} after mutation, got ${afterNewCount}`);

  return {
    documentXml: nextXml,
    beforeCounts: { [ORIGINAL_PLACEHOLDER]: beforeOldCount, [SIGNATURE_PLACEHOLDER]: beforeNewCount },
    afterCounts: { [ORIGINAL_PLACEHOLDER]: afterOldCount, [SIGNATURE_PLACEHOLDER]: afterNewCount },
    replacement: {
      originalPlaceholder: decision.originalPlaceholder,
      occurrenceIndex: decision.occurrenceIndex,
      finalNewPlaceholder: decision.finalNewPlaceholder,
      beforeContext: targetContext,
      afterContext: signatureContext,
    },
  };
}

function mutateDocx(docxBuffer, decision) {
  const zip = new PizZip(docxBuffer);
  const documentPart = zip.file(WORD_DOCUMENT_XML);
  if (!documentPart) throw new Error(`${WORD_DOCUMENT_XML} missing from normalized DOCX`);
  const mutation = mutateDocumentXml(documentPart.asText(), decision);
  zip.file(WORD_DOCUMENT_XML, mutation.documentXml);
  return { ...mutation, buffer: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) };
}

function clone(v) { return JSON.parse(JSON.stringify(v)); }
function findBy(items, key, value) { return (items ?? []).find(item => item?.[key] === value); }

function assertNoDuplicates(contract) {
  for (const [name, items, key] of [
    ['canonicalFields', contract.canonicalFields ?? [], 'path'],
    ['docxSlots', contract.docxSlots ?? [], 'slotId'],
    ['renderBindings', contract.renderBindings ?? [], 'slotId'],
  ]) {
    const values = items.map(item => item[key]).filter(Boolean);
    if (new Set(values).size !== values.length) throw new Error(`Duplicate ${name} detected`);
  }
}

function ensureSignatureField(contract) {
  const existing = findBy(contract.canonicalFields, 'path', SIGNATURE_PLACEHOLDER);
  if (existing) return false;
  contract.canonicalFields.push({ ...SIGNATURE_FIELD });
  return true;
}

function ensureSignatureSlot(contract, context) {
  const existing = findBy(contract.docxSlots, 'slotId', SIGNATURE_PLACEHOLDER);
  if (existing) return false;
  const rawPattern = token(SIGNATURE_PLACEHOLDER);
  contract.docxSlots.push({
    slotId: SIGNATURE_PLACEHOLDER,
    location: { partName: WORD_DOCUMENT_XML, blockId: null, tableCellId: null },
    context,
    label: SIGNATURE_FIELD.label,
    slotType: 'text',
    required: SIGNATURE_FIELD.required,
    confidence: 1,
    evidence: {
      textBefore: deriveTextBefore(context, rawPattern),
      textAfter: deriveTextAfter(context, rawPattern),
      rawPattern,
    },
    reviewRequired: SIGNATURE_FIELD.reviewRequired,
    reviewEvidence: {
      textBefore: deriveTextBefore(context, rawPattern),
      textAfter: deriveTextAfter(context, rawPattern),
      rawPattern,
      context,
      blockId: null,
    },
  });
  return true;
}

function ensureSignatureBinding(contract) {
  const existing = findBy(contract.renderBindings, 'slotId', SIGNATURE_PLACEHOLDER);
  if (existing) return false;
  contract.renderBindings.push({
    slotId: SIGNATURE_PLACEHOLDER,
    from: SIGNATURE_PLACEHOLDER,
    transform: 'identity',
    fallback: '',
    reviewRequired: false,
  });
  return true;
}

function mutateContract(contract, signatureContext) {
  const next = clone(contract);
  if (next.templateCode !== TEMPLATE_CODE) throw new Error(`Contract templateCode must be ${TEMPLATE_CODE}`);
  next.canonicalFields ??= [];
  next.docxSlots ??= [];
  next.renderBindings ??= [];
  assertNoDuplicates(next);

  const fieldAdded = ensureSignatureField(next);
  const slotAdded = ensureSignatureSlot(next, signatureContext);
  const bindingAdded = ensureSignatureBinding(next);

  assertNoDuplicates(next);
  return { contract: next, fieldAdded, slotAdded, bindingAdded };
}

async function main(argv) {
  const { root, write, mode } = parseArgs(argv);

  console.log(`\n[BM-062] ${TASK}`);
  console.log(`[BM-062] Mode: ${mode} | Root: ${root}`);

  const { decision } = loadApprovedDecision(root);
  console.log(`[BM-062] Approved decision: ${decision.decisionId}`);
  console.log(`[BM-062] Mutation: ${ORIGINAL_PLACEHOLDER} (occ ${decision.occurrenceIndex}) → ${decision.finalNewPlaceholder}`);

  // Load DOCX
  const docxPath = normalizedDocxPath(root);
  if (!existsSync(docxPath)) throw new Error(`Normalized DOCX not found: ${docxPath}`);
  const docxBuffer = readFileSync(docxPath);
  console.log(`[BM-062] Loaded DOCX: ${docxPath}`);

  // Load contract
  const contractPath = findLockedContractFile(root);
  if (!existsSync(contractPath)) throw new Error(`Locked contract not found: ${contractPath}`);
  const contract = readJson(contractPath);
  console.log(`[BM-062] Loaded contract: ${contractPath}`);

  // Apply DOCX mutation
  const mutation = mutateDocx(docxBuffer, decision);
  console.log(`[BM-062] DOCX mutation: ${mutation.beforeCounts[ORIGINAL_PLACEHOLDER]}→${mutation.afterCounts[ORIGINAL_PLACEHOLDER]} ${ORIGINAL_PLACEHOLDER}, 0→${mutation.afterCounts[SIGNATURE_PLACEHOLDER]} ${SIGNATURE_PLACEHOLDER}`);

  // Apply contract mutation
  const { contract: nextContract, fieldAdded, slotAdded, bindingAdded } = mutateContract(contract, mutation.replacement.afterContext);
  console.log(`[BM-062] Contract mutation: field=${fieldAdded ? 'added' : 'already existed'}, slot=${slotAdded ? 'added' : 'already existed'}, binding=${bindingAdded ? 'added' : 'already existed'}`);

  // Build output
  const outDir = outputDir(root);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const applyJson = join(outDir, 'apply-signature.latest.json');
  const applyMd = join(outDir, 'apply-signature.latest.md');
  const handoffJson = join(outDir, 'planner-handoff.signature-after-apply.json');
  const handoffMd = join(outDir, 'planner-handoff.signature-after-apply.md');
  const backupDir = join(auditDir(root), 'backups', ts);

  const applyResult = {
    task: TASK,
    mode,
    timestamp: new Date().toISOString(),
    templateCode: TEMPLATE_CODE,
    decisionId: decision.decisionId,
    docx: {
      beforeCounts: mutation.beforeCounts,
      afterCounts: mutation.afterCounts,
      replacement: mutation.replacement,
    },
    contract: {
      fieldAdded,
      slotAdded,
      bindingAdded,
    },
    safetyAssertions: {
      originalPlaceholder: ORIGINAL_PLACEHOLDER,
      deferredOccurrencesUntouched: true,
      noGlobalReplacement: true,
      noDecisionLineMutation: true,
      noOtherPersonLine5Mutation: true,
    },
    artifacts: {
      backupDir,
      normalizedDocx: docxPath,
      lockedContract: contractPath,
    },
  };

  const handoffResult = {
    handoffVersion: '1.0.0',
    task: `${TASK}_AFTER_APPLY`,
    mode: 'AFTER_APPLY_HANDOFF',
    templateCode: TEMPLATE_CODE,
    canApplyRunNow: false,
    applyTimestamp: new Date().toISOString(),
    appliedDecision: {
      decisionId: decision.decisionId,
      originalPlaceholder: decision.originalPlaceholder,
      occurrenceIndex: decision.occurrenceIndex,
      finalPlaceholder: decision.finalNewPlaceholder,
      semanticFieldPath: decision.semanticFieldPath,
    },
    remainingDeferred: {
      decisionLine11: 11,
      personLine5Body: 4,
      total: 15,
    },
    renderGateStatus: 'EXPECTED_FAIL_UNTIL_DEFERRED_RESOLVED',
    nextAction: 'Create human review blocker ledger for 15 deferred BM-062 occurrences, then select next BM',
    safetyAssertions: {
      noDocxMutation: false,
      noLockedContractMutation: false,
      noCompiledV2Mutation: true,
      noDbPublish: true,
    },
  };

  if (!write) {
    console.log(`\n[BM-062] DRY-RUN — no files written`);
    writeJson(applyJson, applyResult);
    writeJson(applyMd, `# Apply Result (DRY-RUN)\n\n${JSON.stringify(applyResult, null, 2)}`);
    writeJson(handoffJson, handoffResult);
    writeJson(handoffMd, `# Planner Handoff After Apply (DRY-RUN)\n\n${JSON.stringify(handoffResult, null, 2)}`);
    console.log(`[BM-062] DRY-RUN artifacts written:`);
    console.log(`  ${applyJson}`);
    console.log(`  ${handoffJson}`);
    return;
  }

  // WRITE mode
  console.log(`[BM-062] WRITE mode — creating backups`);
  mkdirSync(backupDir, { recursive: true });
  copyFileSync(docxPath, join(backupDir, `${TEMPLATE_CODE}_normalized.docx`));
  copyFileSync(contractPath, join(backupDir, `${TEMPLATE_CODE}__${contract.sourceId}.contract.locked.json`));
  console.log(`[BM-062] Backups: ${backupDir}`);

  console.log(`[BM-062] Writing normalized DOCX`);
  writeFileSync(docxPath, mutation.buffer);

  console.log(`[BM-062] Writing locked contract`);
  writeJson(contractPath, nextContract);

  console.log(`[BM-062] Writing apply artifacts`);
  writeJson(applyJson, applyResult);
  writeJson(applyMd, `# Apply Result\n\n**Task:** ${TASK}\n**Mode:** ${mode}\n**Timestamp:** ${new Date().toISOString()}\n\n## Summary\n\n| Field | Before | After |\n|---|---|---|\n| \`${ORIGINAL_PLACEHOLDER}\` | ${mutation.beforeCounts[ORIGINAL_PLACEHOLDER]} | ${mutation.afterCounts[ORIGINAL_PLACEHOLDER]} |\n| \`${SIGNATURE_PLACEHOLDER}\` | ${mutation.beforeCounts[SIGNATURE_PLACEHOLDER]} | ${mutation.afterCounts[SIGNATURE_PLACEHOLDER]} |\n\n## Safety\n\n- Deferred occurrences (4 body + 11 decision.*) untouched\n- No global replacement\n- Backup: ${backupDir}\n`);
  writeJson(handoffJson, handoffResult);
  writeJson(handoffMd, `# Planner Handoff After Apply\n\n**Task:** ${TASK}\n**Timestamp:** ${new Date().toISOString()}\n\n## Applied\n\n- Decision: ${decision.decisionId}\n- Mutation: ${ORIGINAL_PLACEHOLDER} (occ ${decision.occurrenceIndex}) → ${decision.finalNewPlaceholder}\n\n## Remaining\n\n- \`decision.decisionLine11\`: 11 deferred occurrences\n- \`recipients.personLine5\` (body): 4 deferred occurrences\n- Total deferred: 15\n\n## Render Gate\n\nStill expected to FAIL until remaining 15 occurrences are resolved.\n\n## Next Action\n\nCreate human review blocker ledger for 15 deferred BM-062 occurrences, then select next BM.\n`);

  console.log(`\n[BM-062] ✅ Apply complete`);
  console.log(`[BM-062] Backup: ${backupDir}`);
  console.log(`[BM-062] Next: run compile + validate + audit scripts`);
}

main(process.argv).catch(err => {
  console.error(`[BM-062] ERROR: ${err.message}`);
  process.exit(1);
});
