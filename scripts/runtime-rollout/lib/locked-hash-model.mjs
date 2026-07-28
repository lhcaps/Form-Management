// Locked-hash-model — three independent deterministic hashes over the locked
// contract corpus, plus a fourth canonical payload hash for the v2.1 index.
//
// All functions are pure: same input -> same output, no IO, no timestamps,
// no process state. This makes them safe to embed in guards and mutation tests.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Sort an iterable of strings in a stable, locale-independent way. */
export function sortStrings(values) {
  return Array.from(new Set(values)).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

/** Deep sort object keys for deterministic hashing. Arrays preserve order. */
export function deepStable(value) {
  if (Array.isArray(value)) return value.map(deepStable);
  if (value && typeof value === 'object') {
    const sortedKeys = Object.keys(value).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const out = {};
    for (const k of sortedKeys) out[k] = deepStable(value[k]);
    return out;
  }
  return value;
}

/** Stable JSON stringify — same key order on every run. */
export function stableStringify(value) {
  return JSON.stringify(deepStable(value));
}

/** sha256 hex digest of a UTF-8 string. */
export function sha256Hex(input) {
  return createHash('sha256').update(typeof input === 'string' ? input : JSON.stringify(input)).digest('hex');
}

/**
 * Payload extracted for runtimeAuthoritySha256.
 * Excludes volatile data: reviewedAt, extractedAt, generatedAt, timestamps.
 * Includes stable structural + semantic data only.
 */
export function runtimeAuthorityPayload(contract) {
  const slot = (slot) => ({
    slotId: slot.slotId,
    slotType: slot.slotType,
    required: Boolean(slot.required),
    location: slot.location ?? null,
    context: slot.context ?? null,
    rawPattern: slot.evidence?.rawPattern ?? null,
    legacyRawPattern: slot.legacyRawPattern ?? null,
    evidenceTextBefore: slot.evidence?.textBefore ?? null,
    evidenceTextAfter: slot.evidence?.textAfter ?? null,
    structuralAnchor: slot.location?.blockId ?? slot.location?.tableCellId ?? null,
    reviewRequired: Boolean(slot.reviewRequired),
  });
  const field = (field) => ({
    path: field.path,
    type: field.type,
    source: field.source,
    required: Boolean(field.required),
    uiComponent: field.uiComponent,
    options: Array.isArray(field.options) ? field.options : null,
    transform: field.transform ?? null,
    section: field.section ?? null,
  });
  const binding = (binding) => ({
    slotId: binding.slotId,
    from: binding.from,
    fieldPath: binding.fieldPath ?? null,
    transform: binding.transform ?? null,
    fallback: binding.fallback ?? null,
    targetEvidence: binding.targetEvidence ?? null,
  });
  return {
    schemaVersion: contract.schemaVersion,
    templateCode: contract.templateCode,
    sourceId: contract.sourceId,
    status: contract.status,
    extractionSource: {
      path: contract.extractionSource?.path ?? null,
      sha256: contract.extractionSource?.sha256 ?? null,
    },
    canonicalFields: (contract.canonicalFields ?? []).map(field),
    docxSlots: (contract.docxSlots ?? []).map(slot),
    renderBindings: (contract.renderBindings ?? []).map(binding),
    productMetadata: contract.productMetadata ?? null,
    renderFormatHints: contract.renderFormatHints ?? null,
  };
}

/** Audit-evidence payload. Excludes volatile reviewedAt timestamps. */
export function auditEvidencePayload(contract) {
  return {
    schemaVersion: contract.schemaVersion,
    templateCode: contract.templateCode,
    reviewKind: contract.reviewKind ?? null,
    reviewedBy: contract.reviewedBy ?? null,
    dispositions: contract.dispositions ?? null,
    rationales: contract.rationales ?? null,
    sourceContexts: contract.sourceContexts ?? null,
    repairMetadata: contract.repairMetadata
      ? Object.fromEntries(Object.entries(contract.repairMetadata).filter(([k]) => !/At|Timestamp|Time/i.test(k)))
      : null,
    rejectedCandidates: contract.rejectedCandidates ?? null,
    provenance: contract.provenance ?? null,
    warnings: contract.warnings ?? null,
    unresolvedQuestions: contract.unresolvedQuestions ?? null,
  };
}

/** Hash A: corpus byte hash. Sorts file paths, then sha256 over each relative path + NUL + bytes + NUL. */
export function computeCorpusByteSha256(contractsDir) {
  const files = readdirSync(contractsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.contract.locked.json'))
    .map((entry) => entry.name)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const hash = createHash('sha256');
  for (const fileName of files) {
    const bytes = readFileSync(path.join(contractsDir, fileName));
    hash.update(`${fileName}\0`);
    hash.update(bytes);
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Hash B: runtime authority hash, per contract. Excludes volatile data. */
export function computeRuntimeAuthoritySha256(contracts) {
  const ordered = Array.from(contracts).sort((left, right) =>
    (left.templateCode < right.templateCode ? -1 : left.templateCode > right.templateCode ? 1 : 0),
  );
  const hash = createHash('sha256');
  for (const contract of ordered) {
    hash.update(`${contract.templateCode}\0`);
    hash.update(stableStringify(runtimeAuthorityPayload(contract)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Hash C: audit evidence hash. Excludes volatile timestamps. */
export function computeAuditEvidenceSha256(contracts) {
  const ordered = Array.from(contracts).sort((left, right) =>
    (left.templateCode < right.templateCode ? -1 : right.templateCode < right.templateCode ? 1 : 0),
  );
  const hash = createHash('sha256');
  for (const contract of ordered) {
    hash.update(`${contract.templateCode}\0`);
    hash.update(stableStringify(auditEvidencePayload(contract)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Hash D: index canonical payload hash. Hash over the v2.1 index JSON (after canonicalization). */
export function computeIndexCanonicalPayloadSha256(indexObject) {
  return sha256Hex(stableStringify(indexObject));
}

/** Top-level: compute all four hashes from a contracts directory. */
export function computeAllHashes(contractsDir, contracts, indexObject) {
  return {
    corpusByteSha256: computeCorpusByteSha256(contractsDir),
    runtimeAuthoritySha256: computeRuntimeAuthoritySha256(contracts),
    auditEvidenceSha256: computeAuditEvidenceSha256(contracts),
    indexCanonicalPayloadSha256: indexObject ? computeIndexCanonicalPayloadSha256(indexObject) : null,
  };
}

/** Per-form sub-hashes that the v2.1 index exposes for fine-grained verification. */
export function computePerFormHashes(contract) {
  const payload = runtimeAuthorityPayload(contract);
  const audit = auditEvidencePayload(contract);
  return {
    perFormRuntimeHash: sha256Hex(stableStringify({ ...payload, templateCode: contract.templateCode })),
    perFormAuditHash: sha256Hex(stableStringify({ ...audit, templateCode: contract.templateCode })),
  };
}
