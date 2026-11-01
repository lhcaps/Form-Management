// Locked contract runtime index v2.1 — exposes three explicit views:
//   runtimeView  -> the only thing active consumers should read for runtime
//   auditView    -> reporting / provenance / repair metadata
//   rawLockedContract -> immutable forensic evidence
//
// Legacy aliases (`.fields`, `.slots`, `.bindings`) are kept with
// `deprecated: true` and a guard test fails the build if any active
// consumer touches them.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedContractCorpus, validateLockedContract } from './lib/locked-contract-loader.mjs';
import {
  auditEvidencePayload,
  computeAllHashes,
  computePerFormHashes,
  runtimeAuthorityPayload,
  stableStringify,
} from './lib/locked-hash-model.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LOCKED_DIR = path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked');
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.1.json');

function readContractFile(fileName) {
  return JSON.parse(readFileSync(path.join(LOCKED_DIR, fileName), 'utf8'));
}

function fileBytesSha256(fileName) {
  return createHash('sha256').update(readFileSync(path.join(LOCKED_DIR, fileName))).digest('hex');
}

function sortByTemplateCode(forms) {
  return [...forms].sort((left, right) => (left.identity.templateCode < right.identity.templateCode ? -1 : left.identity.templateCode > right.identity.templateCode ? 1 : 0));
}

function buildRuntimeView(contract) {
  return {
    canonicalFields: [...(contract.canonicalFields ?? [])].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
    docxSlots: [...(contract.docxSlots ?? [])].sort((a, b) => (a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0)),
    renderBindings: [...(contract.renderBindings ?? [])].sort((a, b) => (a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0)),
    productMetadata: contract.productMetadata ?? null,
    renderFormatHints: contract.renderFormatHints ?? null,
  };
}

function buildAuditView(contract) {
  return {
    schemaVersion: contract.schemaVersion,
    reviewKind: contract.reviewKind ?? null,
    reviewedBy: contract.reviewedBy ?? null,
    reviewedAt: contract.reviewedAt ?? null,
    dispositions: contract.dispositions ?? null,
    rationales: contract.rationales ?? null,
    warnings: contract.warnings ?? null,
    unresolvedQuestions: contract.unresolvedQuestions ?? null,
    sourceContexts: contract.sourceContexts ?? null,
    rejectedCandidates: contract.rejectedCandidates ?? null,
    repairMetadata: contract.repairMetadata ?? null,
    provenance: contract.provenance ?? null,
    extractionSource: {
      path: contract.extractionSource?.path ?? null,
      sha256: contract.extractionSource?.sha256 ?? null,
      kind: contract.extractionSource?.kind ?? null,
      format: contract.extractionSource?.format ?? null,
    },
  };
}

export function buildLockedRuntimeIndexV21(options = {}) {
  const corpus = loadLockedContractCorpus(options);
  const allFiles = readdirSync(LOCKED_DIR).filter((file) => file.endsWith('.contract.locked.json')).sort();
  const fileByTemplateCode = new Map();
  for (const fileName of allFiles) {
    const raw = readContractFile(fileName);
    validateLockedContract(raw, { fileName });
    fileByTemplateCode.set(raw.templateCode, fileName);
  }

  const forms = sortByTemplateCode(corpus.contracts.map((contract) => {
    const fileName = fileByTemplateCode.get(contract.templateCode);
    const runtimeView = buildRuntimeView(contract);
    const auditView = buildAuditView(contract);
    const rawLockedContract = contract;
    const perFormHashes = computePerFormHashes(contract);
    return {
      identity: {
        templateCode: contract.templateCode,
        sourceId: contract.sourceId,
        templateTitle: contract.templateTitle,
        documentKind: contract.documentKind,
        schemaVersion: contract.schemaVersion,
        contractPath: `docs/audit/docx/contracts/locked/${fileName}`,
        contractFileSha256: fileBytesSha256(fileName),
      },
      runtimeView,
      auditView,
      provenance: {
        extractionSource: contract.extractionSource,
        sourceContexts: contract.sourceContexts ?? null,
        repairMetadata: contract.repairMetadata ?? null,
      },
      rawLockedContract,
      hashes: perFormHashes,
      deprecated: {
        fields: { deprecated: true, replacement: 'runtimeView.canonicalFields', since: 'v2.1' },
        slots: { deprecated: true, replacement: 'runtimeView.docxSlots', since: 'v2.1' },
        bindings: { deprecated: true, replacement: 'runtimeView.renderBindings', since: 'v2.1' },
      },
    };
  }));

  // identity is also stored at root for quick form-level metadata reads.
  const expectedFormCodes = Array.from({ length: 213 }, (_, index) => `BM-${String(index + 1).padStart(3, '0')}`);
  const presentCodes = forms.map((f) => f.identity.templateCode);
  const missing = expectedFormCodes.filter((code) => !presentCodes.includes(code));
  const extras = presentCodes.filter((code) => !expectedFormCodes.includes(code));
  const duplicates = presentCodes.filter((code, idx) => presentCodes.indexOf(code) !== idx);

  const indexObject = {
    schema: 'qllaw.213.locked_contract_runtime_index/v2.1',
    schemaVersion: 'qllaw.213.locked_contract_runtime_index/v2.1',
    authority: 'docs/audit/docx/contracts/locked/*.contract.locked.json',
    contractDirectory: 'docs/audit/docx/contracts/locked',
    contractCount: forms.length,
    expectedFormCodes,
    missingFormCodes: missing,
    extraFormCodes: extras,
    duplicateFormCodes: [...new Set(duplicates)],
    generatedAt: new Date().toISOString(),
    forms,
  };

  // indexCanonicalPayload hash excludes generatedAt (volatile) and the
  // hashes sub-object (so re-hashing is idempotent).
  const hashableIndex = {
    schema: indexObject.schema,
    schemaVersion: indexObject.schemaVersion,
    authority: indexObject.authority,
    contractDirectory: indexObject.contractDirectory,
    contractCount: indexObject.contractCount,
    expectedFormCodes: indexObject.expectedFormCodes,
    missingFormCodes: indexObject.missingFormCodes,
    extraFormCodes: indexObject.extraFormCodes,
    duplicateFormCodes: indexObject.duplicateFormCodes,
    forms: indexObject.forms,
  };
  const hashes = computeAllHashes(LOCKED_DIR, corpus.contracts, hashableIndex);
  return { index: { ...indexObject, hashes }, hashes };
}

export function writeLockedRuntimeIndexV21(options = {}) {
  const { index, hashes } = buildLockedRuntimeIndexV21(options);
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, index, hashes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { index, hashes, outputPath } = writeLockedRuntimeIndexV21();
  console.log(`OK v2.1 index: ${index.contractCount} forms`);
  console.log(`     corpusByteSha256:        ${hashes.corpusByteSha256}`);
  console.log(`     runtimeAuthoritySha256:  ${hashes.runtimeAuthoritySha256}`);
  console.log(`     auditEvidenceSha256:     ${hashes.auditEvidenceSha256}`);
  console.log(`     indexCanonicalPayload:   ${hashes.indexCanonicalPayloadSha256}`);
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);

  // Determinism: build twice and compare.
  const second = buildLockedRuntimeIndexV21();
  if (second.hashes.runtimeAuthoritySha256 !== hashes.runtimeAuthoritySha256) {
    console.error('FAIL runtimeAuthoritySha256 not deterministic');
    process.exit(1);
  }
  if (second.hashes.auditEvidenceSha256 !== hashes.auditEvidenceSha256) {
    console.error('FAIL auditEvidenceSha256 not deterministic');
    process.exit(1);
  }
  if (second.hashes.indexCanonicalPayloadSha256 !== hashes.indexCanonicalPayloadSha256) {
    console.error('FAIL indexCanonicalPayloadSha256 not deterministic');
    process.exit(1);
  }
  console.log('OK determinism: hashes match on second build');
}
