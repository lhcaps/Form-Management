#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import PizZip from 'pizzip';

const TEMPLATE_CODE = 'BM-052';
const TASK = 'BM052_SIGNATURE_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY';
const ORIGINAL_PLACEHOLDER = 'recipients.personLine6';
const ORIGINAL_OCCURRENCE_COUNT = 4;
const SIGNATURE_PLACEHOLDER = 'signature.signerName';
const SIGNATURE_OCCURRENCE_INDEX = 3;
const MUTATION_TYPE =
  'DOCX_OCCURRENCE_RENAME_AND_BINDING_AWARE_CONTRACT_REPAIR';
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
    if (arg === '--root') {
      root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--dry-run') {
      mode = mode ? 'INVALID' : 'DRY_RUN';
      continue;
    }
    if (arg === '--write') {
      mode = mode ? 'INVALID' : 'WRITE';
      continue;
    }
  }

  if (!root) throw new Error('--root requires a path');
  if (!mode || mode === 'INVALID') {
    throw new Error('Pass exactly one of --dry-run or --write');
  }

  return { root: resolve(root), write: mode === 'WRITE', mode };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function token(placeholder) {
  return `{{${placeholder}}}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(text, needle) {
  return [...text.matchAll(new RegExp(escapeRegExp(needle), 'g'))].length;
}

function visibleContext(text, start, end, radius = 1800) {
  return text
    .slice(Math.max(0, start - radius), Math.min(text.length, end + radius))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contextAroundOccurrence(text, needle, occurrenceIndex, radius = 1800) {
  let seen = -1;
  let index = -1;
  while ((index = text.indexOf(needle, index + 1)) >= 0) {
    seen += 1;
    if (seen === occurrenceIndex) {
      return visibleContext(text, index, index + needle.length, radius);
    }
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
  return String(context)
    .slice(index + rawPattern.length, index + rawPattern.length + 160)
    .trim();
}

function auditDir(root) {
  return join(
    root,
    'docs',
    'audit',
    'docx-placeholder-renormalization',
    TEMPLATE_CODE,
    'approved-signature',
  );
}

function decisionsPath(root) {
  return join(auditDir(root), 'decisions.approved.json');
}

function normalizedDocxPath(root) {
  return join(
    root,
    'storage',
    'templates',
    'normalized-docx',
    TEMPLATE_CODE,
    `${TEMPLATE_CODE}_normalized.docx`,
  );
}

function lockedContractsDir(root) {
  return join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
}

function findLockedContractFile(root) {
  const dir = lockedContractsDir(root);
  const matches = readdirSync(dir)
    .filter(
      (file) =>
        file.startsWith(`${TEMPLATE_CODE}__`) &&
        file.endsWith('.contract.locked.json'),
    )
    .sort();
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${TEMPLATE_CODE} locked contract, found ${matches.length}`,
    );
  }
  return join(dir, matches[0]);
}

function assertDecision(decision, document) {
  const errors = [];
  if (document.templateCode && document.templateCode !== TEMPLATE_CODE) {
    errors.push(`Document templateCode must be ${TEMPLATE_CODE}`);
  }
  if (decision.templateCode !== TEMPLATE_CODE) {
    errors.push(`Decision templateCode must be ${TEMPLATE_CODE}`);
  }
  if (decision.originalPlaceholder !== ORIGINAL_PLACEHOLDER) {
    errors.push(`originalPlaceholder must be ${ORIGINAL_PLACEHOLDER}`);
  }
  if (decision.occurrenceIndex !== SIGNATURE_OCCURRENCE_INDEX) {
    errors.push(`occurrenceIndex must be ${SIGNATURE_OCCURRENCE_INDEX}`);
  }
  if (decision.finalNewPlaceholder !== SIGNATURE_PLACEHOLDER) {
    errors.push(`finalNewPlaceholder must be ${SIGNATURE_PLACEHOLDER}`);
  }
  if (decision.semanticFieldPath !== SIGNATURE_PLACEHOLDER) {
    errors.push(`semanticFieldPath must be ${SIGNATURE_PLACEHOLDER}`);
  }
  if (decision.mutationType !== MUTATION_TYPE) {
    errors.push(`mutationType must be ${MUTATION_TYPE}`);
  }
  if (decision.exactOoxmlTarget?.partName !== WORD_DOCUMENT_XML) {
    errors.push(`exactOoxmlTarget.partName must be ${WORD_DOCUMENT_XML}`);
  }
  if (!Array.isArray(decision.requiredContext) || decision.requiredContext.length === 0) {
    errors.push('requiredContext must contain at least one anchor');
  }
  if (errors.length > 0) {
    throw new Error(`Invalid approved signature decision: ${errors.join('; ')}`);
  }
}

function loadApprovedDecision(root) {
  const filePath = decisionsPath(root);
  if (!existsSync(filePath)) {
    throw new Error(`Missing approved decisions: ${filePath}`);
  }
  const document = readJson(filePath);
  const decisions = document.decisions ?? [];
  if (!Array.isArray(decisions) || decisions.length !== 1) {
    throw new Error('Approved signature decisions must contain exactly 1 decision');
  }
  const decision = decisions[0];
  assertDecision(decision, document);
  return { document, decision };
}

function mutateDocumentXml(documentXml, decision) {
  const oldToken = token(decision.originalPlaceholder);
  const newToken = token(decision.finalNewPlaceholder);
  const beforeOldCount = countOccurrences(documentXml, oldToken);
  const beforeNewCount = countOccurrences(documentXml, newToken);
  if (beforeOldCount !== ORIGINAL_OCCURRENCE_COUNT) {
    throw new Error(
      `Expected ${ORIGINAL_OCCURRENCE_COUNT} ${oldToken} occurrences before mutation, found ${beforeOldCount}`,
    );
  }
  if (beforeNewCount !== 0) {
    throw new Error(`Expected no existing ${newToken} occurrences, found ${beforeNewCount}`);
  }

  const targetContext = contextAroundOccurrence(
    documentXml,
    oldToken,
    decision.occurrenceIndex,
  );
  const missingAnchors = decision.requiredContext.filter(
    (anchor) => !targetContext.includes(anchor),
  );
  if (missingAnchors.length > 0) {
    throw new Error(
      `Target occurrence context missing required anchor(s): ${missingAnchors.join(', ')}`,
    );
  }

  let seen = -1;
  let replacements = 0;
  const nextXml = documentXml.replace(new RegExp(escapeRegExp(oldToken), 'g'), (match) => {
    seen += 1;
    if (seen !== decision.occurrenceIndex) return match;
    replacements += 1;
    return newToken;
  });

  if (replacements !== 1) {
    throw new Error(`Expected exactly one footer replacement, applied ${replacements}`);
  }

  const signatureContext = contextAroundOccurrence(nextXml, newToken, 0);
  const afterCounts = {
    [ORIGINAL_PLACEHOLDER]: countOccurrences(nextXml, oldToken),
    [SIGNATURE_PLACEHOLDER]: countOccurrences(nextXml, newToken),
  };
  if (afterCounts[ORIGINAL_PLACEHOLDER] !== ORIGINAL_OCCURRENCE_COUNT - 1) {
    throw new Error(
      `Expected ${ORIGINAL_OCCURRENCE_COUNT - 1} deferred ${oldToken} occurrences after mutation, found ${afterCounts[ORIGINAL_PLACEHOLDER]}`,
    );
  }
  if (afterCounts[SIGNATURE_PLACEHOLDER] !== 1) {
    throw new Error(`Expected exactly one ${newToken} after mutation`);
  }

  return {
    documentXml: nextXml,
    beforeCounts: {
      [ORIGINAL_PLACEHOLDER]: beforeOldCount,
      [SIGNATURE_PLACEHOLDER]: beforeNewCount,
    },
    afterCounts,
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
  return {
    ...mutation,
    buffer: zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function findBy(items, key, value) {
  return (items ?? []).find((item) => item?.[key] === value);
}

function assertNoDuplicates(contract) {
  for (const [name, items, key] of [
    ['canonicalFields', contract.canonicalFields ?? [], 'path'],
    ['docxSlots', contract.docxSlots ?? [], 'slotId'],
    ['renderBindings', contract.renderBindings ?? [], 'slotId'],
  ]) {
    const values = items.map((item) => item[key]).filter(Boolean);
    if (new Set(values).size !== values.length) {
      throw new Error(`Duplicate ${name} detected`);
    }
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
    location: {
      partName: WORD_DOCUMENT_XML,
      blockId: null,
      tableCellId: null,
    },
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
    reviewRequired: SIGNATURE_FIELD.reviewRequired,
  });
  return true;
}

function mutateContract(contract, signatureContext) {
  const next = clone(contract);
  if (next.templateCode !== TEMPLATE_CODE) {
    throw new Error(`Locked contract templateCode must be ${TEMPLATE_CODE}`);
  }
  next.canonicalFields ??= [];
  next.docxSlots ??= [];
  next.renderBindings ??= [];

  const changes = [];
  if (ensureSignatureField(next)) changes.push('canonicalFields.signature.signerName');
  if (ensureSignatureSlot(next, signatureContext)) changes.push('docxSlots.signature.signerName');
  if (ensureSignatureBinding(next)) changes.push('renderBindings.signature.signerName');

  assertNoDuplicates(next);
  return { contract: next, changes };
}

function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const separator = header.map(() => '---');
  return [header, separator, ...body]
    .map(
      (cells) =>
        `| ${cells.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`,
    )
    .join('\n');
}

function writeReports(root, report, preflight) {
  const dir = auditDir(root);
  writeJson(join(dir, 'preflight.latest.json'), preflight);
  writeText(
    join(dir, 'preflight.latest.md'),
    [
      '# BM-052 Signature Apply Preflight',
      '',
      markdownTable([
        ['Gate', 'Result'],
        ['Mode', report.mode],
        ['Approved decisions', preflight.approvedDecisionCount],
        ['DOCX path', preflight.paths.normalizedDocx],
        ['Contract path', preflight.paths.lockedContract],
      ]),
      '',
    ].join('\n'),
  );
  writeJson(join(dir, 'apply.latest.json'), report);
  writeText(
    join(dir, 'apply.latest.md'),
    [
      '# BM-052 Signature Apply Report',
      '',
      markdownTable([
        ['Metric', 'Value'],
        ['Mode', report.mode],
        ['Applied', report.applied],
        ['DOCX replacements', report.docx.replacements.length],
        ['Deferred recipients.personLine6 remaining', report.docx.afterCounts[ORIGINAL_PLACEHOLDER]],
        ['Contract changes', report.contract.changedPaths.join(', ') || 'idempotent'],
        ['Backup', report.backupPath ?? 'DRY_RUN'],
      ]),
      '',
    ].join('\n'),
  );
  writeJson(join(dir, 'planner-handoff.after-apply.json'), report.plannerHandoff);
  writeText(
    join(dir, 'planner-handoff.after-apply.md'),
    [
      '# BM-052 Signature Planner Handoff After Apply',
      '',
      markdownTable([
        ['Field', 'Value'],
        ['Applied', report.plannerHandoff.applied],
        ['Footer signature placeholder bound', report.plannerHandoff.footerSignaturePlaceholderBound],
        ['Body occurrences untouched', report.plannerHandoff.bodyOccurrencesUntouched],
        ['Can proceed to render fidelity', report.plannerHandoff.canProceedToRenderFidelity],
      ]),
      '',
    ].join('\n'),
  );
}

function main() {
  const { root, write, mode } = parseArgs(process.argv.slice(2));
  const { decision } = loadApprovedDecision(root);
  const docxPath = normalizedDocxPath(root);
  const contractPath = findLockedContractFile(root);

  if (!existsSync(docxPath)) throw new Error(`Missing normalized DOCX: ${docxPath}`);
  const docxMutation = mutateDocx(readFileSync(docxPath), decision);
  const contractMutation = mutateContract(
    readJson(contractPath),
    docxMutation.replacement.afterContext,
  );

  const preflight = {
    schemaVersion: 1,
    task: TASK,
    templateCode: TEMPLATE_CODE,
    mode,
    approvedDecisionCount: 1,
    paths: {
      decisions: decisionsPath(root),
      normalizedDocx: docxPath,
      lockedContract: contractPath,
    },
    exactOccurrenceTarget: {
      placeholder: ORIGINAL_PLACEHOLDER,
      occurrenceIndex: SIGNATURE_OCCURRENCE_INDEX,
      finalNewPlaceholder: SIGNATURE_PLACEHOLDER,
    },
  };

  let backupPath = null;
  if (write) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = join(auditDir(root), 'backups', timestamp);
    mkdirSync(backupPath, { recursive: true });
    copyFileSync(docxPath, join(backupPath, `${TEMPLATE_CODE}_normalized.docx`));
    copyFileSync(contractPath, join(backupPath, basename(contractPath)));
    copyFileSync(decisionsPath(root), join(backupPath, 'decisions.approved.json'));

    writeFileSync(docxPath, docxMutation.buffer);
    writeJson(contractPath, contractMutation.contract);
  }

  const report = {
    schemaVersion: 1,
    task: TASK,
    templateCode: TEMPLATE_CODE,
    mode,
    applied: write,
    backupPath,
    decisions: [
      {
        originalPlaceholder: decision.originalPlaceholder,
        occurrenceIndex: decision.occurrenceIndex,
        finalNewPlaceholder: decision.finalNewPlaceholder,
        semanticFieldPath: decision.semanticFieldPath,
      },
    ],
    docx: {
      beforeCounts: docxMutation.beforeCounts,
      afterCounts: docxMutation.afterCounts,
      replacements: [docxMutation.replacement],
      compiledV2Touched: false,
    },
    contract: {
      changedPaths: contractMutation.changes,
      noDuplicateFieldsSlotsBindings: true,
      addedFieldMetadata: SIGNATURE_FIELD,
    },
    plannerHandoff: {
      schemaVersion: 1,
      task: TASK,
      templateCode: TEMPLATE_CODE,
      applied: write,
      decisionsApplied: 1,
      footerSignaturePlaceholderBound:
        docxMutation.afterCounts[SIGNATURE_PLACEHOLDER] === 1,
      bodyOccurrencesUntouched:
        docxMutation.afterCounts[ORIGINAL_PLACEHOLDER] === ORIGINAL_OCCURRENCE_COUNT - 1,
      compiledV2ManuallyEdited: false,
      canProceedToRenderFidelity: write,
      nextStep: write
        ? 'Run validate, compile, audits, board refresh, publish DB, and contract sync.'
        : 'Dry-run only. Run with --write after review gates pass.',
    },
  };

  writeReports(root, report, preflight);
  console.log(`${TASK} ${mode} OK`);
  console.log(`Applied: ${write ? 'YES' : 'NO'}`);
  console.log(`DOCX replacements: ${report.docx.replacements.length}`);
  if (backupPath) console.log(`Backup: ${backupPath}`);
}

main();
