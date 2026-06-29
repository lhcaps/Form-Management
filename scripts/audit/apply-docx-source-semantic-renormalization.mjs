#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const WORD_DOCUMENT_XML = 'word/document.xml';
const TASK = 'DOCX_SOURCE_BACKED_SEMANTIC_RENORMALIZATION';

export const SEMANTIC_RENORMALIZATIONS = {
  'BM-052': [
    { from: 'recipients.personLine6', occurrenceIndex: 0, to: 'person.otherName', label: 'Tên gọi khác', source: 'manual', section: 'Nhân thân' },
    { from: 'recipients.personLine6', occurrenceIndex: 1, to: 'person.birthInfoLine', label: 'Sinh ngày, tháng, năm, nơi sinh', source: 'manual', section: 'Nhân thân' },
    { from: 'recipients.personLine6', occurrenceIndex: 2, to: 'person.nationalityEthnicityReligionLine', label: 'Quốc tịch, dân tộc, tôn giáo', source: 'manual', section: 'Nhân thân' },
  ],
  'BM-062': [
    { from: 'recipients.personLine5', occurrenceIndex: 0, to: 'person.otherName', label: 'Tên gọi khác', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 1, to: 'person.birthInfoLine', label: 'Sinh ngày, tháng, năm, nơi sinh', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 2, to: 'person.nationality', label: 'Quốc tịch', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 3, to: 'person.ethnicityReligionLine', label: 'Dân tộc, tôn giáo', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 0, to: 'measure.reasonLine', label: 'Xét thấy', source: 'manual', section: 'Căn cứ ban hành' },
    { from: 'decision.decisionLine11', occurrenceIndex: 1, to: 'measure.assetListLine', label: 'Tài sản kê biên', source: 'manual', section: 'Tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 2, to: 'person.occupation', label: 'Nghề nghiệp', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 3, to: 'person.identityNo', label: 'Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 4, to: 'person.identityIssueDateLine', label: 'Ngày cấp giấy tờ tùy thân', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 5, to: 'person.identityIssuePlace', label: 'Nơi cấp giấy tờ tùy thân', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 6, to: 'person.permanentAddress', label: 'Nơi thường trú', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 7, to: 'person.temporaryAddress', label: 'Nơi tạm trú', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 8, to: 'person.currentAddress', label: 'Nơi ở hiện tại', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'decision.decisionLine11', occurrenceIndex: 9, to: 'measure.executionAgencyLine', label: 'Cơ quan, người thi hành lệnh', source: 'manual', section: 'Thi hành lệnh' },
    { from: 'decision.decisionLine11', occurrenceIndex: 10, to: 'measure.coordinationAgencyLine', label: 'Cơ quan, người phối hợp thi hành lệnh', source: 'manual', section: 'Thi hành lệnh' },
  ],
  'BM-063': [
    { from: 'document.fullDocumentCode8', occurrenceIndex: 0, to: 'document.recordStartedAtTimeText', label: 'Thời điểm bắt đầu lập biên bản', source: 'manual', section: 'Biên bản kê biên' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 1, to: 'document.recordLocationName', label: 'Địa điểm lập biên bản', source: 'manual', section: 'Biên bản kê biên' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 2, to: 'prosecutor.procuracyName', label: 'Viện kiểm sát của Kiểm sát viên', source: 'officialConfig', section: 'Thành phần tham gia' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 3, to: 'assignment.participantLine1', label: 'Người tham gia kê biên 1', source: 'manual', section: 'Thành phần tham gia' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 4, to: 'assignment.participantLine2', label: 'Đại diện Ủy ban nhân dân cấp xã', source: 'manual', section: 'Thành phần tham gia' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 5, to: 'assignment.participantLine3', label: 'Người tham gia kê biên 3', source: 'manual', section: 'Thành phần tham gia' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 6, to: 'assignment.participantLine4', label: 'Người tham gia kê biên 4', source: 'manual', section: 'Thành phần tham gia' },
    { from: 'document.fullDocumentCode8', occurrenceIndex: 7, to: 'document.recordEndedAtTimeLine', label: 'Thời điểm kết thúc kê biên', source: 'manual', section: 'Biên bản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 0, to: 'person.birthInfoLine', label: 'Sinh ngày, tháng, năm, nơi sinh', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 1, to: 'person.nationalityEthnicityReligionLine', label: 'Quốc tịch, dân tộc, tôn giáo', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 2, to: 'person.identityIssueLine', label: 'Ngày cấp, nơi cấp giấy tờ tùy thân', source: 'manual', section: 'Người có tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 3, to: 'measure.assetListLine', label: 'Tài sản bị kê biên', source: 'manual', section: 'Tài sản kê biên' },
    { from: 'recipients.personLine5', occurrenceIndex: 4, to: 'measure.participantOpinionLine', label: 'Ý kiến của người tham gia kê biên', source: 'manual', section: 'Tài sản kê biên' },
  ],
  'BM-066': [
    { from: 'document.fullDocumentCode4', occurrenceIndex: 0, to: 'document.issuePlaceAndDateLine', label: 'Địa danh, ngày tháng năm ban hành', source: 'systemDate', section: 'Thông tin văn bản' },
    { from: 'document.fullDocumentCode4', occurrenceIndex: 1, to: 'measure.reasonLine', label: 'Xét thấy', source: 'manual', section: 'Căn cứ ban hành' },
    { from: 'document.fullDocumentCode4', occurrenceIndex: 2, to: 'person.identityIssueLine', label: 'Ngày cấp, nơi cấp giấy tờ tùy thân', source: 'manual', section: 'Người có tài khoản bị phong tỏa' },
    { from: 'document.fullDocumentCode4', occurrenceIndex: 3, to: 'measure.executionRequestLine', label: 'Yêu cầu thi hành lệnh', source: 'manual', section: 'Thi hành lệnh' },
    { from: 'recipients.personLine4', occurrenceIndex: 0, to: 'person.birthInfoLine', label: 'Sinh ngày, tháng, năm, nơi sinh', source: 'manual', section: 'Người có tài khoản bị phong tỏa' },
    { from: 'recipients.personLine4', occurrenceIndex: 1, to: 'person.nationalityEthnicityReligionLine', label: 'Quốc tịch, dân tộc, tôn giáo', source: 'manual', section: 'Người có tài khoản bị phong tỏa' },
    { from: 'recipients.personLine4', occurrenceIndex: 2, to: 'assignment.assignedOfficerLine', label: 'Kiểm sát viên được phân công thi hành lệnh', source: 'manual', section: 'Thi hành lệnh' },
    { from: 'recipients.personLine4', occurrenceIndex: 3, to: 'signature.signerName', label: 'Người ký', source: 'officialConfig', section: 'Chữ ký', required: true },
  ],
};

export function taxonomyNamespaceForPath(fieldPath) {
  return String(fieldPath).split('.')[0];
}

export function buildReplacementIndex(replacementsByTemplate) {
  const index = {};
  for (const [templateCode, replacements] of Object.entries(replacementsByTemplate)) {
    index[templateCode] = {};
    for (const replacement of replacements) {
      index[templateCode][replacement.from] ??= [];
      index[templateCode][replacement.from].push(replacement);
    }
    for (const list of Object.values(index[templateCode])) {
      list.sort((a, b) => a.occurrenceIndex - b.occurrenceIndex);
    }
  }
  return index;
}

function parseArgs(argv) {
  let mode = null;
  let root = process.cwd();
  const only = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--only') {
      only.push(...String(argv[index + 1] ?? '').split(',').map((item) => item.trim()).filter(Boolean));
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
  if (!mode || mode === 'INVALID') throw new Error('Pass exactly one of --dry-run or --write');
  return {
    root: resolve(root),
    write: mode === 'WRITE',
    mode,
    only: only.length > 0 ? new Set(only) : null,
  };
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

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function cleanContext(xml, index, length, radius = 320) {
  return xml
    .slice(Math.max(0, index - radius), Math.min(xml.length, index + length + radius))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contextForToken(xml, placeholder) {
  const needle = token(placeholder);
  const index = xml.indexOf(needle);
  return index >= 0 ? cleanContext(xml, index, needle.length) : needle;
}

export function replaceIndexedOccurrences(documentXml, replacements) {
  const byOriginal = buildReplacementIndex({ X: replacements }).X;
  let nextXml = documentXml;
  const applied = [];

  for (const [original, items] of Object.entries(byOriginal)) {
    const oldToken = token(original);
    const maxIndex = Math.max(...items.map((item) => item.occurrenceIndex));
    const expectedCount = maxIndex + 1;
    const beforeCount = countOccurrences(nextXml, oldToken);
    if (beforeCount < expectedCount) {
      const alreadyApplied = beforeCount === 0 && items.every((item) =>
        countOccurrences(nextXml, token(item.to)) > 0,
      );
      if (alreadyApplied) {
        continue;
      }
      throw new Error(
        `${original}: expected at least ${expectedCount} occurrences, found ${beforeCount}`,
      );
    }

    const byIndex = new Map(items.map((item) => [item.occurrenceIndex, item]));
    let seen = -1;
    let replaced = 0;
    nextXml = nextXml.replace(new RegExp(escapeRegExp(oldToken), 'g'), (match) => {
      seen += 1;
      const item = byIndex.get(seen);
      if (!item) return match;
      replaced += 1;
      applied.push({
        from: item.from,
        occurrenceIndex: item.occurrenceIndex,
        to: item.to,
      });
      return token(item.to);
    });

    if (replaced !== items.length) {
      throw new Error(`${original}: expected ${items.length} replacements, applied ${replaced}`);
    }
  }

  return { documentXml: nextXml, applied };
}

function extractPlaceholders(zip) {
  const placeholders = [];
  for (const fileName of Object.keys(zip.files)) {
    if (!/^word\/.*\.xml$/u.test(fileName)) continue;
    const text = zip.file(fileName)?.asText();
    if (!text) continue;
    for (const match of text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/gu)) {
      placeholders.push(match[1].trim());
    }
  }
  return [...new Set(placeholders)].sort();
}

function normalizedDocxPath(root, templateCode) {
  return join(root, 'storage', 'templates', 'normalized-docx', templateCode, `${templateCode}_normalized.docx`);
}

function lockedContractsDir(root) {
  return join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
}

function findLockedContractFile(root, templateCode) {
  const matches = readdirSync(lockedContractsDir(root))
    .filter((fileName) => fileName.startsWith(`${templateCode}__`) && fileName.endsWith('.contract.locked.json'))
    .sort();
  if (matches.length !== 1) {
    throw new Error(`Expected one locked contract for ${templateCode}, found ${matches.length}`);
  }
  return join(lockedContractsDir(root), matches[0]);
}

function fieldDescriptor(item) {
  return {
    path: item.to,
    type: 'string',
    label: item.label,
    source: item.source,
    required: item.required ?? false,
    uiComponent: 'text',
    section: item.section,
    reviewRequired: false,
    transform: 'identity',
  };
}

function slotDescriptor(item, context) {
  return {
    slotId: item.to,
    location: {
      partName: WORD_DOCUMENT_XML,
      blockId: null,
      tableCellId: null,
    },
    context,
    label: item.label,
    slotType: 'text',
    required: item.required ?? false,
    confidence: 1,
    evidence: {
      textBefore: '',
      textAfter: '',
      rawPattern: token(item.to),
    },
    reviewRequired: false,
  };
}

function bindingDescriptor(item) {
  return {
    slotId: item.to,
    from: item.to,
    transform: 'identity',
    fallback: '',
    reviewRequired: false,
  };
}

function upsertBy(items, key, value, descriptor) {
  const existing = items.find((item) => item[key] === value);
  if (existing) {
    Object.assign(existing, descriptor);
    return 'updated';
  }
  items.push(descriptor);
  return 'added';
}

export function syncContract(contract, replacements, placeholderSet, afterXml, newSha, generatedAt) {
  const next = JSON.parse(JSON.stringify(contract));
  next.canonicalFields ??= [];
  next.docxSlots ??= [];
  next.renderBindings ??= [];

  const beforeFields = next.canonicalFields.length;
  const beforeSlots = next.docxSlots.length;
  const beforeBindings = next.renderBindings.length;
  next.docxSlots = next.docxSlots.filter((slot) => placeholderSet.has(slot.slotId));
  next.renderBindings = next.renderBindings.filter((binding) => placeholderSet.has(binding.slotId));
  const remainingBoundFields = new Set(
    next.renderBindings.map((binding) => binding.from).filter(Boolean),
  );
  next.canonicalFields = next.canonicalFields.filter((field) =>
    remainingBoundFields.has(field.path),
  );

  const fieldChanges = [];
  const slotChanges = [];
  const bindingChanges = [];
  for (const item of replacements) {
    fieldChanges.push({
      path: item.to,
      action: upsertBy(next.canonicalFields, 'path', item.to, fieldDescriptor(item)),
    });
    slotChanges.push({
      slotId: item.to,
      action: upsertBy(next.docxSlots, 'slotId', item.to, slotDescriptor(item, contextForToken(afterXml, item.to))),
    });
    bindingChanges.push({
      slotId: item.to,
      action: upsertBy(next.renderBindings, 'slotId', item.to, bindingDescriptor(item)),
    });
  }

  if (next.extractionSource?.sha256) {
    next.extractionSource.sha256 = newSha;
  }
  next.reviewedBy = 'Codex source-DOCX semantic renormalization';
  next.reviewedAt = generatedAt;
  next.reviewKind = 'human';
  next.renderRepairEvidence = {
    repairedAt: generatedAt,
    repairedBy: 'Codex source-DOCX semantic renormalization',
    reason: 'Source DOCX paragraph-backed semantic placeholder renormalization',
    source: 'storage/templates/normalized-docx/<BM>/<source DOCX beside normalized file>',
    changes: {
      fieldChanges,
      slotChanges,
      bindingChanges,
      removedFields: beforeFields - next.canonicalFields.length,
      removedSlots: beforeSlots - next.docxSlots.length,
      removedBindings: beforeBindings - next.renderBindings.length,
    },
  };

  return next;
}

function mutateTemplate(root, templateCode, replacements, options) {
  const generatedAt = options.generatedAt;
  const docxPath = normalizedDocxPath(root, templateCode);
  const contractPath = findLockedContractFile(root, templateCode);
  const originalDocx = readFileSync(docxPath);
  const originalContract = readJson(contractPath);
  const zip = new PizZip(originalDocx);
  const part = zip.file(WORD_DOCUMENT_XML);
  if (!part) throw new Error(`${templateCode}: missing ${WORD_DOCUMENT_XML}`);

  const beforeXml = part.asText();
  const mutation = replaceIndexedOccurrences(beforeXml, replacements);
  zip.file(WORD_DOCUMENT_XML, mutation.documentXml);
  const nextDocx = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const nextZip = new PizZip(nextDocx);
  const placeholders = extractPlaceholders(nextZip);
  const nextContract = syncContract(
    originalContract,
    replacements,
    new Set(placeholders),
    mutation.documentXml,
    sha256(nextDocx),
    generatedAt,
  );

  if (options.write) {
    mkdirSync(options.backupDir, { recursive: true });
    copyFileSync(docxPath, join(options.backupDir, `${templateCode}_normalized.docx`));
    copyFileSync(contractPath, join(options.backupDir, contractPath.split(/[\\/]/u).at(-1)));
    writeFileSync(docxPath, nextDocx);
    writeJson(contractPath, nextContract);
  }

  return {
    templateCode,
    docxPath,
    contractPath,
    replacements: mutation.applied,
    appliedReplacements: mutation.applied.length,
    plannedReplacements: replacements.length,
    alreadyAppliedReplacements: replacements.length - mutation.applied.length,
    placeholderCount: placeholders.length,
    removedOldPlaceholders: [...new Set(replacements.map((item) => item.from))]
      .filter((placeholder) => !placeholders.includes(placeholder)),
    addedPlaceholders: [...new Set(replacements.map((item) => item.to))].sort(),
    contractFieldCount: nextContract.canonicalFields.length,
    contractSlotCount: nextContract.docxSlots.length,
    contractBindingCount: nextContract.renderBindings.length,
  };
}

function reportDir(root) {
  return join(root, 'docs', 'audit', 'docx-placeholder-renormalization', 'source-backed-semantic-batch');
}

function markdown(report) {
  const lines = [
    '# Source-backed Semantic Renormalization',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Applied: ${report.applied}`,
    '',
    '| BM | Applied | Planned | Already applied | Added placeholders | Removed old placeholders | Slots | Bindings |',
    '|---|---:|---:|---:|---|---|---:|---:|',
  ];
  for (const item of report.items) {
    lines.push(
      `| ${item.templateCode} | ${item.appliedReplacements} | ${item.plannedReplacements} | ${item.alreadyAppliedReplacements} | ${item.addedPlaceholders.join(', ')} | ${item.removedOldPlaceholders.join(', ')} | ${item.contractSlotCount} | ${item.contractBindingCount} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function runSemanticRenormalization(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const generatedAt = new Date().toISOString();
  const selected = Object.entries(SEMANTIC_RENORMALIZATIONS)
    .filter(([templateCode]) => !options.only || options.only.has(templateCode));
  const backupDir = join(reportDir(options.root), 'backups', generatedAt.replace(/[:.]/g, '-'));
  const items = [];

  for (const [templateCode, replacements] of selected) {
    items.push(
      mutateTemplate(options.root, templateCode, replacements, {
        generatedAt,
        backupDir: join(backupDir, templateCode),
        write: options.write,
      }),
    );
  }

  const report = {
    schemaVersion: 1,
    task: TASK,
    generatedAt,
    mode: options.mode,
    applied: options.write,
    backupDir: options.write ? backupDir : null,
    items,
  };

  writeJson(join(reportDir(options.root), 'latest.json'), report);
  writeText(join(reportDir(options.root), 'latest.md'), markdown(report));
  console.log(JSON.stringify({
    task: TASK,
    mode: options.mode,
    applied: options.write,
    templates: items.length,
    replacements: items.reduce((sum, item) => sum + item.replacements.length, 0),
    report: join(reportDir(options.root), 'latest.json'),
  }, null, 2));
  return report;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  try {
    runSemanticRenormalization();
  } catch (error) {
    console.error(error?.stack ?? error);
    process.exit(1);
  }
}
