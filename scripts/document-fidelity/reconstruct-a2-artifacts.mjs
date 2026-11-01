import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

import PizZip from 'pizzip';

import { normalizeLegalHeader } from './normalize-legal-header.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const CODES = [
  'BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168',
  'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213',
];
const FINAL_ROOT = join(ROOT, '.tmp-qllaw-213-final');
const CANDIDATE_ROOT = join(ROOT, '.tmp-document-fidelity-fix');
const TRANSFORMER_PATH = join(ROOT, 'scripts', 'document-fidelity', 'normalize-legal-header.mjs');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function relativePath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function describeFile(path) {
  const stat = statSync(path);
  const buffer = readFileSync(path);
  return {
    path: relativePath(path),
    sha256: sha256(buffer),
    sizeBytes: stat.size,
    createdAt: stat.birthtime.toISOString(),
    modifiedAt: stat.mtime.toISOString(),
  };
}

function discoverSource(code, livePath) {
  const formDir = dirname(livePath);
  const names = readdirSync(formDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.docx'))
    .map((entry) => join(formDir, entry.name))
    .filter((path) => resolve(path) !== resolve(livePath));
  if (names.length === 1) {
    return { path: names[0], classification: 'IMMUTABLE_ORIGINAL_SIBLING' };
  }
  if (names.length > 1) {
    throw new Error(`${code}: multiple source/original DOCX siblings found: ${names.join(', ')}`);
  }
  return { path: livePath, classification: 'AUTHORITATIVE_REGISTRY_DOCX_NO_SEPARATE_ORIGINAL' };
}

function zipEntries(buffer) {
  const zip = new PizZip(buffer);
  return new Map(
    Object.entries(zip.files)
      .filter(([, entry]) => !entry.dir)
      .map(([name, entry]) => [name, entry.asNodeBuffer()]),
  );
}

function canonicalPackageDigest(buffer) {
  const entries = zipEntries(buffer);
  const hash = createHash('sha256');
  for (const [name, value] of [...entries.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    hash.update(name);
    hash.update('\0');
    hash.update(value);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function comparePackages(beforeBuffer, afterBuffer) {
  const before = zipEntries(beforeBuffer);
  const after = zipEntries(afterBuffer);
  const beforeNames = [...before.keys()].sort();
  const afterNames = [...after.keys()].sort();
  const missing = beforeNames.filter((name) => !after.has(name));
  const added = afterNames.filter((name) => !before.has(name));
  const changed = beforeNames
    .filter((name) => after.has(name) && sha256(before.get(name)) !== sha256(after.get(name)))
    .map((name) => name);
  return {
    partsBefore: beforeNames.length,
    partsAfter: afterNames.length,
    missing,
    added,
    changed,
    verdict: missing.length === 0 && added.length === 0 && changed.every((name) => name === 'word/document.xml')
      ? 'PASS'
      : 'FAIL',
  };
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const transformer = describeFile(TRANSFORMER_PATH);
const createdAt = new Date().toISOString();
const records = [];

for (const code of CODES) {
  const livePath = join(ROOT, 'storage', 'templates', 'normalized-docx', code, `${code}_normalized.docx`);
  if (!existsSync(livePath)) {
    records.push({ formCode: code, status: 'FAIL_MISSING_LIVE_NORMALIZED', livePath: relativePath(livePath) });
    continue;
  }

  try {
    const source = discoverSource(code, livePath);
    const sourceBefore = describeFile(source.path);
    const liveBefore = describeFile(livePath);
    const liveBuffer = readFileSync(livePath);
    const rollbackPath = join(FINAL_ROOT, 'rollback', code, `${code}_normalized.rollback.docx`);
    mkdirSync(dirname(rollbackPath), { recursive: true });
    copyFileSync(livePath, rollbackPath);
    const rollback = describeFile(rollbackPath);
    if (rollback.sha256 !== liveBefore.sha256) {
      throw new Error(`${code}: rollback hash mismatch`);
    }

    const transformed = normalizeLegalHeader(liveBuffer, { templateCode: code, strategy: 'auto' });
    const candidateBuffer = transformed.buffer;
    const candidatePath = join(CANDIDATE_ROOT, code, `${code}_normalized.candidate.docx`);
    mkdirSync(dirname(candidatePath), { recursive: true });
    const candidateTempPath = `${candidatePath}.tmp-${process.pid}`;
    writeFileSync(candidateTempPath, candidateBuffer);
    renameSync(candidateTempPath, candidatePath);
    const candidate = describeFile(candidatePath);

    const secondPass = normalizeLegalHeader(candidateBuffer, { templateCode: code, strategy: 'auto' });
    const secondPassPath = join(CANDIDATE_ROOT, code, `${code}_normalized.candidate.pass2.docx`);
    writeFileSync(secondPassPath, secondPass.buffer);
    const secondPassEvidence = describeFile(secondPassPath);
    const byteIdentical = candidate.sha256 === secondPassEvidence.sha256;
    const canonicalEquivalent = canonicalPackageDigest(candidateBuffer) === canonicalPackageDigest(secondPass.buffer);
    const packagePreservation = comparePackages(liveBuffer, candidateBuffer);
    const sourceAfter = describeFile(source.path);
    if (sourceAfter.sha256 !== sourceBefore.sha256) {
      throw new Error(`${code}: authoritative source changed during reconstruction`);
    }

    records.push({
      formCode: code,
      sourceClassification: source.classification,
      source: sourceBefore,
      sourcePostReconstructionSha256: sourceAfter.sha256,
      liveNormalized: liveBefore,
      rollback,
      candidate,
      candidateSecondPass: secondPassEvidence,
      transformer,
      transform: {
        familyBefore: transformed.familyBefore,
        familyAfter: transformed.familyAfter,
        transformed: transformed.transformed,
        skipped: transformed.skipped ?? false,
        tokenScopeAfter: transformed.tokenScopeAfter,
        transformMeta: transformed.transformMeta,
      },
      packagePreservation,
      idempotence: {
        byteIdentical,
        canonicalEquivalent,
        verdict: byteIdentical ? 'PASS_BYTE_IDENTICAL' : canonicalEquivalent ? 'PASS_CANONICAL_EQUIVALENT' : 'FAIL',
      },
      createdAt,
      status: packagePreservation.verdict === 'PASS' && (byteIdentical || canonicalEquivalent)
        ? 'PASS_RECONSTRUCTED'
        : 'FAIL_VALIDATION',
    });
  } catch (error) {
    records.push({
      formCode: code,
      status: 'FAIL_RECONSTRUCTION',
      error: error instanceof Error ? error.message : String(error),
      createdAt,
    });
  }
}

const output = {
  schemaVersion: 1,
  generatedAt: createdAt,
  scope: CODES,
  transformer,
  passCount: records.filter((record) => record.status === 'PASS_RECONSTRUCTED').length,
  failCount: records.filter((record) => record.status !== 'PASS_RECONSTRUCTED').length,
  records,
};

writeJson(join(FINAL_ROOT, 'a2-hash-evidence.json'), output);
writeJson(join(FINAL_ROOT, 'rollback-manifest.json'), {
  schemaVersion: 1,
  generatedAt: createdAt,
  records: records.map((record) => ({
    formCode: record.formCode,
    prePromotionLiveSha256: record.liveNormalized?.sha256 ?? null,
    rollback: record.rollback ?? null,
    verified: record.liveNormalized?.sha256 === record.rollback?.sha256,
    status: record.rollback ? 'READY' : 'MISSING',
  })),
});
writeJson(join(FINAL_ROOT, 'a2-transformer-idempotence.json'), {
  schemaVersion: 1,
  generatedAt: createdAt,
  transformer,
  records: records.map((record) => ({
    formCode: record.formCode,
    candidate: record.candidate ?? null,
    secondPass: record.candidateSecondPass ?? null,
    idempotence: record.idempotence ?? { verdict: 'FAIL_NOT_RUN' },
  })),
});
writeJson(join(FINAL_ROOT, 'a2-package-preservation.json'), {
  schemaVersion: 1,
  generatedAt: createdAt,
  records: records.map((record) => ({
    formCode: record.formCode,
    packagePreservation: record.packagePreservation ?? { verdict: 'FAIL_NOT_RUN' },
  })),
});
writeJson(join(CANDIDATE_ROOT, 'candidates-manifest.json'), {
  schemaVersion: 1,
  generatedAt: createdAt,
  transformer,
  records: records.map((record) => ({
    formCode: record.formCode,
    sourceClassification: record.sourceClassification ?? null,
    source: record.source ?? null,
    liveNormalized: record.liveNormalized ?? null,
    rollback: record.rollback ?? null,
    candidate: record.candidate ?? null,
    candidateSecondPass: record.candidateSecondPass ?? null,
    transform: record.transform ?? null,
    status: record.status,
    error: record.error ?? null,
  })),
});

console.log(JSON.stringify({
  passCount: output.passCount,
  failCount: output.failCount,
  verdicts: Object.fromEntries(records.map((record) => [record.formCode, record.status])),
}, null, 2));
process.exitCode = output.failCount === 0 ? 0 : 1;
