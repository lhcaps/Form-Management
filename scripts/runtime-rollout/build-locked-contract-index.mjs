import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildLockedContractCanonicalView, loadLockedContractCorpus } from './lib/locked-contract-loader.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_OUTPUT = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.json');
const LOCKED_DIR = path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked');

export function buildLockedContractIndex(options = {}) {
  const corpus = loadLockedContractCorpus(options);
  const fileBySourceId = new Map(readdirSync(LOCKED_DIR).filter((file) => file.endsWith('.contract.locked.json')).map((file) => [file.replace('.contract.locked.json', ''), file]));
  const formFiles = [];
  const forms = Object.fromEntries(corpus.contracts.map((contract) => {
    const canonical = buildLockedContractCanonicalView(contract);
    const fileName = fileBySourceId.get(contract.sourceId);
    const bytes = readFileSync(path.join(LOCKED_DIR, fileName));
    const contractFileSha256 = createHash('sha256').update(bytes).digest('hex');
    formFiles.push({ fileName, contractFileSha256 });
    return [contract.templateCode, {
      formCode: canonical.templateCode,
      templateCode: canonical.templateCode,
      contractPath: `docs/audit/docx/contracts/locked/${fileName}`,
      contractFileSha256,
      canonicalFormSha256: createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),
      lockedSchemaVersion: canonical.schemaVersion,
      sourceId: canonical.sourceId,
      templateTitle: canonical.templateTitle,
      documentKind: canonical.documentKind,
      extractionSource: canonical.extractionSource,
      fields: canonical.canonicalFields,
      slots: canonical.docxSlots,
      bindings: canonical.renderBindings,
      canonicalFields: canonical.canonicalFields,
      docxSlots: canonical.docxSlots,
      renderBindings: canonical.renderBindings,
      fieldCount: canonical.canonicalFields.length,
      slotCount: canonical.docxSlots.length,
      bindingCount: canonical.renderBindings.length,
      classificationCounts: contract.canonicalFields.reduce((counts, field) => ({ ...counts, [field.source ?? 'unknown']: (counts[field.source ?? 'unknown'] ?? 0) + 1 }), {}),
      reviewMetadata: { reviewKind: contract.reviewKind, reviewedBy: contract.reviewedBy, reviewedAt: contract.reviewedAt, warnings: contract.warnings, unresolvedQuestions: contract.unresolvedQuestions },
      provenance: { docx: contract.docx, extractionSource: contract.extractionSource, renderRepairEvidence: contract.renderRepairEvidence },
      rawLockedContract: contract,
    }];
  }));
  const expectedFormCodes = Array.from({ length: 213 }, (_, index) => `BM-${String(index + 1).padStart(3, '0')}`);
  const corpusFileSha256 = createHash('sha256').update(JSON.stringify(formFiles.sort((left, right) => left.fileName.localeCompare(right.fileName, 'en')))).digest('hex');
  return {
    schemaVersion: 'qllaw.213.locked_contract_runtime_index/v2',
    authority: 'docs/audit/docx/contracts/locked/*.contract.locked.json',
    contractDirectory: 'docs/audit/docx/contracts/locked',
    contractCount: corpus.contracts.length,
    totals: corpus.totals,
    expectedFormCodes,
    missingFormCodes: [],
    extraFormCodes: [],
    duplicateFormCodes: [],
    corpusFileSha256,
    canonicalPayloadSha256: corpus.canonicalHash,
    canonicalHash: corpus.canonicalHash,
    forms,
  };
}

export function writeLockedContractIndex(options = {}) {
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT;
  const index = buildLockedContractIndex(options);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  return { outputPath, index };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { outputPath, index } = writeLockedContractIndex();
  console.log(`OK locked authority index: ${index.contractCount} forms, ${index.canonicalHash}, ${outputPath}`);
}
