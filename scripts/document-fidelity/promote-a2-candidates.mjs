// A2 Stage A2 candidate promotion. Per-form rollback-safe replacement.
// A failure on one form must not roll back others.
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';

import PizZip from 'pizzip';
import { normalizeLegalHeader } from './normalize-legal-header.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const FORMS = ['BM-001','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213'];
const FINAL_ROOT = join(ROOT, '.tmp-qllaw-213-final');
const CANDIDATE_ROOT = join(ROOT, '.tmp-document-fidelity-fix');

function relativePath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function describeFile(path) {
  const stat = statSync(path);
  return {
    path: relativePath(path),
    sha256: sha256(readFileSync(path)),
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  };
}

function zipEntries(buffer) {
  const zip = new PizZip(buffer);
  return new Map(
    Object.entries(zip.files)
      .filter(([, entry]) => !entry.dir)
      .map(([name, entry]) => [name, entry.asNodeBuffer()]),
  );
}

function comparePackages(left, right) {
  const before = zipEntries(left);
  const after = zipEntries(right);
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
    verdict: missing.length === 0 && added.length === 0 && changed.length === 0
      ? 'IDENTICAL'
      : changed.length === 1 && changed[0] === 'word/document.xml' && missing.length === 0 && added.length === 0
        ? 'PASS'
        : 'FAIL',
  };
}

function postValidate(liveBuffer, code) {
  const secondPass = normalizeLegalHeader(liveBuffer, { templateCode: code, strategy: 'auto' });
  return {
    packagePreservation: comparePackages(readFileSync(join(ROOT, 'storage', 'templates', 'normalized-docx', code, `${code}_normalized.docx`)), liveBuffer),
    secondPassIdempotent: secondPass.transformed === false || secondPass.skipped === true,
    familyAfter: secondPass.familyAfter,
    tokenScopeAfter: secondPass.tokenScopeAfter,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const records = [];
  for (const code of FORMS) {
    const livePath = join(ROOT, 'storage', 'templates', 'normalized-docx', code, `${code}_normalized.docx`);
    const candidatePath = join(CANDIDATE_ROOT, code, `${code}_normalized.candidate.docx`);
    const rollbackPath = join(FINAL_ROOT, 'rollback', code, `${code}_normalized.rollback.docx`);
    const promotedPath = join(livePath.replace(/\.docx$/, '') + '.promoted.docx');
    const record = {
      formCode: code,
      livePath: relativePath(livePath),
      candidatePath: relativePath(candidatePath),
      rollbackPath: relativePath(rollbackPath),
      prePromotionLive: describeFile(livePath),
      candidate: describeFile(candidatePath),
      rollback: describeFile(rollbackPath),
    };
    if (record.prePromotionLive.sha256 !== record.rollback.sha256) {
      record.promotionResult = 'FAIL_ROLLBACK_HASH_MISMATCH';
      records.push(record);
      continue;
    }
    if (record.candidate.sha256 === record.prePromotionLive.sha256) {
      record.promotionResult = 'NO_CHANGE_ALREADY_CONFORMANT';
      try {
        record.postValidation = postValidate(readFileSync(livePath), code);
      } catch (err) {
        record.postValidation = { error: err.message };
      }
      records.push(record);
      continue;
    }
    try {
      copyFileSync(candidatePath, promotedPath);
      const tempEvidence = describeFile(promotedPath);
      if (tempEvidence.sha256 !== record.candidate.sha256) {
        record.promotionResult = 'FAIL_TEMP_HASH_MISMATCH';
        record.tempEvidence = tempEvidence;
        records.push(record);
        continue;
      }
      renameSync(promotedPath, livePath);
      const postPromote = describeFile(livePath);
      record.promoted = postPromote;
      record.promotionResult = postPromote.sha256 === record.candidate.sha256 ? 'PROMOTED' : 'FAIL_PROMOTED_HASH_MISMATCH';
      const post = postValidate(readFileSync(livePath), code);
      record.postValidation = post;
      if (post.packagePreservation.verdict === 'FAIL' || !post.secondPassIdempotent) {
        copyFileSync(rollbackPath, livePath);
        const restored = describeFile(livePath);
        record.rollbackResult = restored.sha256 === record.prePromotionLive.sha256 ? 'ROLLED_BACK' : 'ROLLBACK_FAILED';
      }
    } catch (error) {
      record.promotionResult = 'FAIL_EXCEPTION';
      record.error = error instanceof Error ? error.message : String(error);
    }
    records.push(record);
  }
  const output = {
    generatedAt: startedAt,
    completedAt: new Date().toISOString(),
    records,
    passCount: records.filter((record) => record.promotionResult === 'PROMOTED' || record.promotionResult === 'NO_CHANGE_ALREADY_CONFORMANT').length,
    failCount: records.filter((record) => !['PROMOTED', 'NO_CHANGE_ALREADY_CONFORMANT'].includes(record.promotionResult)).length,
  };
  mkdirSync(FINAL_ROOT, { recursive: true });
  const outPath = join(FINAL_ROOT, 'a2-promotion-manifest.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    outputPath: relativePath(outPath),
    passCount: output.passCount,
    failCount: output.failCount,
    verdicts: Object.fromEntries(records.map((record) => [record.formCode, record.promotionResult])),
  }, null, 2));
  process.exitCode = output.failCount === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
