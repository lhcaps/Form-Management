#!/usr/bin/env node

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

const TEMPLATE_CODE = 'BM-052';
const TASK =
  'BM052_DOCX_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY_CORRECTED_NAMES';
const REJECTED_NAMES = new Set([
  'person.personFullName2a',
  'person.personFullName2b',
  'person.idNumber6',
  'person.addressTemporary6',
]);
const EXPECTED_DECISIONS = [
  ['decision.decisionLine2', 0, 'person.fullName', 'person.fullName'],
  ['decision.decisionLine2', 1, 'person.fullName', 'person.fullName'],
  ['recipients.personLine6', 3, 'person.idNumber', 'person.idNumber'],
  [
    'recipients.personLine6',
    4,
    'person.temporaryAddress',
    'person.temporaryAddress',
  ],
];
const DEFERRED = new Set([
  'recipients.personLine6#0',
  'recipients.personLine6#1',
  'recipients.personLine6#2',
  'recipients.personLine6#5',
]);
const FIELD_METADATA = {
  'person.fullName': {
    label: 'Họ tên',
    source: 'manual',
    required: false,
    reviewRequired: false,
  },
  'person.idNumber': {
    label: 'Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu',
    source: 'manual',
    required: false,
    reviewRequired: true,
  },
  'person.temporaryAddress': {
    label: 'Nơi tạm trú',
    source: 'manual',
    required: false,
    reviewRequired: true,
  },
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

function contextAround(text, needle, occurrenceIndex, radius = 140) {
  let current = -1;
  let index = -1;
  while ((index = text.indexOf(needle, index + 1)) >= 0) {
    current += 1;
    if (current !== occurrenceIndex) continue;
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + needle.length + radius);
    return text.slice(start, end).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
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

function auditDir(root) {
  return join(root, 'docs', 'audit', 'docx-placeholder-renormalization', TEMPLATE_CODE);
}

function decisionsPath(root) {
  return join(auditDir(root), 'approved', 'decisions.approved.json');
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

function loadApprovedDecisions(root) {
  const filePath = decisionsPath(root);
  if (!existsSync(filePath)) {
    throw new Error(`Missing approved decisions: ${filePath}`);
  }
  const doc = readJson(filePath);
  const decisions = doc.decisions ?? [];
  if (!Array.isArray(decisions) || decisions.length !== 4) {
    throw new Error('Approved decisions must contain exactly 4 decisions');
  }

  const serialized = JSON.stringify(decisions);
  for (const rejected of REJECTED_NAMES) {
    if (serialized.includes(rejected)) {
      throw new Error(`Rejected suffix name appears in decisions: ${rejected}`);
    }
  }

  const actual = decisions.map((decision) => [
    decision.originalPlaceholder,
    decision.occurrenceIndex,
    decision.finalNewPlaceholder,
    decision.semanticFieldPath,
  ]);
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_DECISIONS)) {
    throw new Error(
      `Approved decisions do not match corrected BM-052 planner decisions: ${JSON.stringify(actual)}`,
    );
  }

  for (const decision of decisions) {
    if (decision.templateCode !== TEMPLATE_CODE) {
      throw new Error(`Decision templateCode must be ${TEMPLATE_CODE}`);
    }
    if (
      decision.mutationType !==
      'DOCX_OCCURRENCE_RENAME_AND_BINDING_AWARE_CONTRACT_REPAIR'
    ) {
      throw new Error(`Invalid mutationType for ${decision.originalPlaceholder}`);
    }
    if (decision.finalNewPlaceholder !== decision.semanticFieldPath) {
      throw new Error(
        `finalNewPlaceholder must equal semanticFieldPath for ${decision.originalPlaceholder}`,
      );
    }
    if (DEFERRED.has(`${decision.originalPlaceholder}#${decision.occurrenceIndex}`)) {
      throw new Error(
        `Deferred occurrence included in decisions: ${decision.originalPlaceholder}#${decision.occurrenceIndex}`,
      );
    }
    if (decision.exactOoxmlTarget?.partName !== 'word/document.xml') {
      throw new Error(
        `Decision lacks exact word/document.xml target: ${decision.originalPlaceholder}#${decision.occurrenceIndex}`,
      );
    }
  }

  return { doc, decisions };
}

function mutateDocumentXml(documentXml, decisions) {
  const byPlaceholder = new Map();
  for (const decision of decisions) {
    const group = byPlaceholder.get(decision.originalPlaceholder) ?? new Map();
    group.set(decision.occurrenceIndex, decision.finalNewPlaceholder);
    byPlaceholder.set(decision.originalPlaceholder, group);
  }

  let next = documentXml;
  const replacements = [];

  for (const [placeholder, occurrenceMap] of byPlaceholder.entries()) {
    const oldToken = token(placeholder);
    let seen = 0;
    let replaced = 0;
    next = next.replace(new RegExp(escapeRegExp(oldToken), 'g'), (match) => {
      const replacement = occurrenceMap.get(seen);
      const occurrenceIndex = seen;
      seen += 1;
      if (!replacement) return match;
      replaced += 1;
      replacements.push({
        originalPlaceholder: placeholder,
        occurrenceIndex,
        finalNewPlaceholder: replacement,
      });
      return token(replacement);
    });

    const maxIndex = Math.max(...occurrenceMap.keys());
    if (seen <= maxIndex) {
      throw new Error(
        `Cannot prove exact occurrence targeting for ${placeholder}: saw ${seen}, need index ${maxIndex}`,
      );
    }
    if (replaced !== occurrenceMap.size) {
      throw new Error(
        `Expected ${occurrenceMap.size} replacements for ${placeholder}, applied ${replaced}`,
      );
    }
  }

  return { documentXml: next, replacements };
}

function mutateDocx(docxBuffer, decisions) {
  const zip = new PizZip(docxBuffer);
  const documentPart = zip.file('word/document.xml');
  if (!documentPart) throw new Error('word/document.xml missing from normalized DOCX');

  const beforeXml = documentPart.asText();
  const beforeCounts = {
    decisionLine2: countOccurrences(beforeXml, token('decision.decisionLine2')),
    recipientsPersonLine6: countOccurrences(beforeXml, token('recipients.personLine6')),
  };
  if (beforeCounts.decisionLine2 !== 2) {
    throw new Error(`Expected 2 decision.decisionLine2 occurrences, found ${beforeCounts.decisionLine2}`);
  }
  if (beforeCounts.recipientsPersonLine6 !== 6) {
    throw new Error(
      `Expected 6 recipients.personLine6 occurrences, found ${beforeCounts.recipientsPersonLine6}`,
    );
  }

  const mutation = mutateDocumentXml(beforeXml, decisions);
  zip.file('word/document.xml', mutation.documentXml);
  const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  const afterCounts = {
    decisionLine2: countOccurrences(
      mutation.documentXml,
      token('decision.decisionLine2'),
    ),
    recipientsPersonLine6: countOccurrences(
      mutation.documentXml,
      token('recipients.personLine6'),
    ),
    personFullName: countOccurrences(mutation.documentXml, token('person.fullName')),
    personIdNumber: countOccurrences(mutation.documentXml, token('person.idNumber')),
    personTemporaryAddress: countOccurrences(
      mutation.documentXml,
      token('person.temporaryAddress'),
    ),
  };
  if (afterCounts.decisionLine2 !== 0) {
    throw new Error('decision.decisionLine2 must be fully renormalized');
  }
  if (afterCounts.recipientsPersonLine6 !== 4) {
    throw new Error('Deferred recipients.personLine6 occurrence count must remain 4');
  }
  if (
    afterCounts.personFullName !== 2 ||
    afterCounts.personIdNumber !== 1 ||
    afterCounts.personTemporaryAddress !== 1
  ) {
    throw new Error(`Unexpected post-renormalization counts: ${JSON.stringify(afterCounts)}`);
  }

  return {
    buffer: output,
    beforeXml,
    afterXml: mutation.documentXml,
    beforeCounts,
    afterCounts,
    replacements: mutation.replacements,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function findByPath(items, key, value) {
  return items.find((item) => item[key] === value);
}

function removeByPath(items, key, value) {
  const index = items.findIndex((item) => item[key] === value);
  if (index >= 0) return items.splice(index, 1)[0];
  return null;
}

function updateEvidence(slot, fieldPath, context) {
  slot.context = context || slot.context || '';
  slot.evidence = {
    ...(slot.evidence ?? {}),
    rawPattern: token(fieldPath),
  };
  slot.reviewEvidence = slot.reviewEvidence
    ? {
        ...slot.reviewEvidence,
        rawPattern: token(fieldPath),
        context: context || slot.reviewEvidence.context,
      }
    : slot.reviewEvidence;
}

function ensureField(contract, path, sourceField = null) {
  const existing = findByPath(contract.canonicalFields, 'path', path);
  if (existing) return existing;
  const meta = FIELD_METADATA[path];
  if (!meta) throw new Error(`No metadata for field ${path}`);
  const field = sourceField
    ? {
        ...sourceField,
        path,
        label: meta.label,
      }
    : {
        path,
        type: 'string',
        label: meta.label,
        source: meta.source,
        required: meta.required,
        uiComponent: 'text',
        reviewRequired: meta.reviewRequired,
        transform: 'identity',
      };
  contract.canonicalFields.push(field);
  return field;
}

function ensureSlot(contract, path, sourceSlot = null, context = '') {
  const existing = findByPath(contract.docxSlots, 'slotId', path);
  if (existing) return existing;
  const meta = FIELD_METADATA[path];
  if (!meta) throw new Error(`No metadata for slot ${path}`);
  const slot = sourceSlot
    ? {
        ...sourceSlot,
        slotId: path,
        label: meta.label,
      }
    : {
        slotId: path,
        location: {
          partName: 'word/document.xml',
          blockId: null,
          tableCellId: null,
        },
        context,
        label: meta.label,
        slotType: 'text',
        required: meta.required,
        confidence: 1,
        evidence: {
          textBefore: '',
          textAfter: '',
          rawPattern: token(path),
        },
        reviewRequired: meta.reviewRequired,
      };
  updateEvidence(slot, path, context);
  contract.docxSlots.push(slot);
  return slot;
}

function ensureBinding(contract, path, sourceBinding = null) {
  const existing = findByPath(contract.renderBindings, 'slotId', path);
  if (existing) return existing;
  const meta = FIELD_METADATA[path];
  if (!meta) throw new Error(`No metadata for binding ${path}`);
  const binding = sourceBinding
    ? {
        ...sourceBinding,
        slotId: path,
        from: path,
      }
    : {
        slotId: path,
        from: path,
        transform: 'identity',
        fallback: '',
        reviewRequired: meta.reviewRequired,
      };
  contract.renderBindings.push(binding);
  return binding;
}

function assertNoDuplicates(contract) {
  for (const [name, items, key] of [
    ['canonicalFields', contract.canonicalFields, 'path'],
    ['docxSlots', contract.docxSlots, 'slotId'],
    ['renderBindings', contract.renderBindings, 'slotId'],
  ]) {
    const values = items.map((item) => item[key]).filter(Boolean);
    if (new Set(values).size !== values.length) {
      throw new Error(`Duplicate ${name} detected`);
    }
  }
}

function mutateContract(contract, afterXml) {
  const next = clone(contract);
  if (next.templateCode !== TEMPLATE_CODE) {
    throw new Error(`Locked contract templateCode must be ${TEMPLATE_CODE}`);
  }

  const oldFullNameField = removeByPath(
    next.canonicalFields,
    'path',
    'decision.decisionLine2',
  );
  const oldFullNameSlot = removeByPath(
    next.docxSlots,
    'slotId',
    'decision.decisionLine2',
  );
  const oldFullNameBinding = removeByPath(
    next.renderBindings,
    'slotId',
    'decision.decisionLine2',
  );
  const fullNameContext = contextAround(afterXml, token('person.fullName'), 0);

  ensureField(next, 'person.fullName', oldFullNameField);
  ensureSlot(next, 'person.fullName', oldFullNameSlot, fullNameContext);
  ensureBinding(next, 'person.fullName', oldFullNameBinding);

  ensureField(next, 'person.idNumber');
  ensureSlot(
    next,
    'person.idNumber',
    null,
    contextAround(afterXml, token('person.idNumber'), 0),
  );
  ensureBinding(next, 'person.idNumber');

  ensureField(next, 'person.temporaryAddress');
  ensureSlot(
    next,
    'person.temporaryAddress',
    null,
    contextAround(afterXml, token('person.temporaryAddress'), 0),
  );
  ensureBinding(next, 'person.temporaryAddress');

  assertNoDuplicates(next);
  return next;
}

function writeReports(root, report, preflight) {
  const dir = auditDir(root);
  writeJson(join(dir, 'preflight.latest.json'), preflight);
  writeText(
    join(dir, 'preflight.latest.md'),
    [
      '# BM-052 Approved Apply Preflight',
      '',
      markdownTable([
        ['Gate', 'Result'],
        ['Mode', report.mode],
        ['CodeGraph MCP available', preflight.codegraphMcpAvailable],
        ['Approved decisions', preflight.approvedDecisionCount],
        ['Rejected suffix names absent', preflight.rejectedSuffixNamesAbsent],
        ['Deferred occurrences absent', preflight.deferredOccurrencesAbsent],
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
      '# BM-052 Approved Apply Report',
      '',
      markdownTable([
        ['Metric', 'Value'],
        ['Mode', report.mode],
        ['Applied', report.applied],
        ['DOCX replacements', report.docx.replacements.length],
        ['Deferred recipients.personLine6 remaining', report.docx.afterCounts.recipientsPersonLine6],
        ['Contract fields changed', report.contract.changedFieldPaths.join(', ')],
        ['Backup', report.backupPath ?? 'DRY_RUN'],
      ]),
      '',
    ].join('\n'),
  );
  writeJson(join(dir, 'planner-handoff.after-apply.json'), report.plannerHandoff);
  writeText(
    join(dir, 'planner-handoff.after-apply.md'),
    [
      '# BM-052 Planner Handoff After Apply',
      '',
      markdownTable([
        ['Field', 'Value'],
        ['Applied', report.plannerHandoff.applied],
        ['Deferred occurrences untouched', report.plannerHandoff.deferredOccurrencesUntouched],
        ['Can proceed to render fidelity', report.plannerHandoff.canProceedToRenderFidelity],
      ]),
      '',
    ].join('\n'),
  );
}

function main() {
  const { root, write, mode } = parseArgs(process.argv.slice(2));
  const approved = loadApprovedDecisions(root);
  const docxPath = normalizedDocxPath(root);
  const contractPath = findLockedContractFile(root);
  const preflight = {
    schemaVersion: 1,
    task: TASK,
    templateCode: TEMPLATE_CODE,
    mode,
    codegraphMcpAvailable: true,
    approvedDecisionCount: approved.decisions.length,
    rejectedSuffixNamesAbsent: true,
    deferredOccurrencesAbsent: true,
    paths: {
      decisions: decisionsPath(root),
      normalizedDocx: docxPath,
      lockedContract: contractPath,
    },
  };

  if (!existsSync(docxPath)) throw new Error(`Missing normalized DOCX: ${docxPath}`);
  const contract = readJson(contractPath);
  const docxMutation = mutateDocx(readFileSync(docxPath), approved.decisions);
  const nextContract = mutateContract(contract, docxMutation.afterXml);

  const changedFieldPaths = [
    'decision.decisionLine2->person.fullName',
    'person.idNumber',
    'person.temporaryAddress',
  ];
  let backupPath = null;

  if (write) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = join(auditDir(root), 'backups', timestamp);
    mkdirSync(backupPath, { recursive: true });
    copyFileSync(docxPath, join(backupPath, 'BM-052_normalized.docx'));
    copyFileSync(contractPath, join(backupPath, contractPath.split(/[\\/]/).at(-1)));
    copyFileSync(decisionsPath(root), join(backupPath, 'decisions.approved.json'));

    writeFileSync(docxPath, docxMutation.buffer);
    writeJson(contractPath, nextContract);
  }

  const report = {
    schemaVersion: 1,
    task: TASK,
    templateCode: TEMPLATE_CODE,
    mode,
    applied: write,
    backupPath,
    decisions: approved.decisions.map((decision) => ({
      originalPlaceholder: decision.originalPlaceholder,
      occurrenceIndex: decision.occurrenceIndex,
      finalNewPlaceholder: decision.finalNewPlaceholder,
      semanticFieldPath: decision.semanticFieldPath,
    })),
    docx: {
      beforeCounts: docxMutation.beforeCounts,
      afterCounts: docxMutation.afterCounts,
      replacements: docxMutation.replacements,
      compiledV2Touched: false,
    },
    contract: {
      changedFieldPaths,
      noDuplicateFieldsSlotsBindings: true,
      sourceRequiredReviewRequiredPolicy: 'preserved-or-conservative-review-required',
    },
    plannerHandoff: {
      schemaVersion: 1,
      task: TASK,
      templateCode: TEMPLATE_CODE,
      applied: write,
      decisionsApplied: approved.decisions.length,
      deferredOccurrencesUntouched: docxMutation.afterCounts.recipientsPersonLine6 === 4,
      rejectedSuffixNamesAbsent: true,
      compiledV2ManuallyEdited: false,
      canProceedToRenderFidelity: write,
      nextStep: write
        ? 'Run validate, compile, root-cause audit, renormalization inventory, board refresh, publish DB, and contract sync.'
        : 'Dry-run only. Run with --write after review gates pass.',
    },
  };

  writeReports(root, report, preflight);
  console.log(`${TASK} ${mode} OK`);
  console.log(`Applied: ${write ? 'YES' : 'NO'}`);
  console.log(`DOCX replacements: ${docxMutation.replacements.length}`);
  if (backupPath) console.log(`Backup: ${backupPath}`);
}

main();
