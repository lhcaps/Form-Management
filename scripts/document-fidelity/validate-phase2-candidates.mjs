import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import PizZip from 'pizzip';

import { normalizeLegalHeader } from './normalize-legal-header.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const CODES = [
  'BM-001', 'BM-136', 'BM-148', 'BM-156', 'BM-157', 'BM-168',
  'BM-171', 'BM-174', 'BM-181', 'BM-206', 'BM-213',
];
const OUT_PATH = join(ROOT, '.tmp-document-fidelity-fix', 'candidate-validation.json');
const REQUIRED_UNCHANGED_PARTS = [
  'word/styles.xml',
  'word/numbering.xml',
  'word/settings.xml',
  'word/fontTable.xml',
];
const RELATED_PREFIXES = [
  'word/theme/',
  'word/media/',
  'word/header',
  'word/footer',
  'word/footnotes',
  'word/endnotes',
  'customXml/',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function zipEntries(buffer) {
  const zip = new PizZip(buffer);
  return new Map(
    Object.entries(zip.files)
      .filter(([, entry]) => !entry.dir)
      .map(([name, entry]) => [name, entry.asNodeBuffer()]),
  );
}

function normalizedXml(buffer) {
  const entries = zipEntries(buffer);
  return [...entries.entries()]
    .filter(([name]) => /(?:\.xml|\.rels)$/u.test(name))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}\n${value.toString('utf8').replace(/>\s+</gu, '><').trim()}`)
    .join('\n---\n');
}

function textRuns(xml) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/gu)].map((match) => match[1]);
}

function paragraphs(xml) {
  return [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gu)].map((match, index) => ({
    index,
    text: textRuns(match[0]).join(''),
    alignment: match[0].match(/<w:jc\s+w:val="([^"]+)"/u)?.[1] ?? null,
  }));
}

function anchoredTables(xml) {
  return [...xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/gu)]
    .map((match, index) => ({ index, xml: match[0] }))
    .filter((table) => /<w:tblpPr\b/u.test(table.xml))
    .map((table) => ({
      index: table.index,
      text: textRuns(table.xml).join(' | '),
      hasModelNumber: /Mẫu số\s*\d+/u.test(textRuns(table.xml).join('')),
      hasAgencyHeading: /VIỆN KIỂM SÁT/u.test(textRuns(table.xml).join('')),
      hasNationalHeading: /CỘNG HÒA/u.test(textRuns(table.xml).join('')),
      hasPlaceDate: /issuePlaceDateLine|ngày.+tháng.+năm/u.test(textRuns(table.xml).join('')),
    }));
}

function isPreservationPart(name) {
  return REQUIRED_UNCHANGED_PARTS.includes(name) || RELATED_PREFIXES.some((prefix) => name.startsWith(prefix));
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
    .map((name) => ({
      name,
      beforeSha256: sha256(before.get(name)),
      afterSha256: sha256(after.get(name)),
    }));
  const unexpectedMissing = missing.filter((name) => isPreservationPart(name));
  const unexpectedChanged = changed.filter(({ name }) => name !== 'word/document.xml' && isPreservationPart(name));
  const unexpectedAdded = added.filter((name) => isPreservationPart(name));
  return {
    partsBefore: beforeNames.length,
    partsAfter: afterNames.length,
    missing,
    added,
    changed,
    unexpectedChanges: [...unexpectedMissing, ...unexpectedChanged.map(({ name }) => name), ...unexpectedAdded],
    verdict: unexpectedMissing.length === 0 && unexpectedChanged.length === 0 && unexpectedAdded.length === 0
      ? 'PASS'
      : 'FAIL',
  };
}

function validateBm001(documentXml) {
  const text = textRuns(documentXml).join('');
  const anchored = anchoredTables(documentXml);
  const tokenBearingAnchored = anchored.filter((table) => table.hasModelNumber);
  const legalHeaderAnchored = anchored.filter(
    (table) => table.hasAgencyHeading || table.hasNationalHeading || table.hasPlaceDate,
  );
  return {
    modelNumberContainerFamily: /<w:pict\b[\s\S]*?Mẫu số/u.test(documentXml)
      ? 'VML_FLOATING'
      : 'IN_FLOW_PARAGRAPH',
    legalHeaderContainerFamily: legalHeaderAnchored.length > 0
      ? 'ANCHORED_LEGAL_HEADER_TABLE'
      : 'IN_FLOW_LEGAL_HEADER',
    modelNumberPresent: /Mẫu số\s*01\/HS/u.test(text),
    agencyHeadingPresent: /VIỆN KIỂM SÁT/u.test(text),
    nationalHeadingPresent: /CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/u.test(text),
    placeDatePresent: /issuePlaceDateLine|ngày.+tháng.+năm/u.test(text),
    tokenBearingAnchoredTables: tokenBearingAnchored,
    legalHeaderAnchoredTables: legalHeaderAnchored,
    verdict: tokenBearingAnchored.length === 0 && legalHeaderAnchored.length === 0
      ? 'PASS'
      : 'BLOCKED_ANCHORED_LEGAL_HEADER',
  };
}

function validateBm213(documentXml) {
  const allParagraphs = paragraphs(documentXml);
  const modelIndex = allParagraphs.findIndex((paragraph) => paragraph.text.includes('Mẫu số 213/HS'));
  const headerSequence = allParagraphs
    .slice(Math.max(0, modelIndex), modelIndex < 0 ? 0 : modelIndex + 4)
    .map(({ index, text, alignment }) => ({ index, text, alignment }));
  const modelParagraph = allParagraphs[modelIndex];
  const exactModelSequence = modelParagraph?.text.startsWith('Mẫu số 213/HS') ?? false;
  const issuanceLineOne = allParagraphs[modelIndex + 1];
  const issuanceLineTwo = allParagraphs[modelIndex + 2];
  const issuanceAfterModel =
    /Ban hành theo Thông tư/u.test(issuanceLineOne?.text ?? '') &&
    /ngày/u.test(issuanceLineTwo?.text ?? '');
  const rightAligned =
    modelParagraph?.alignment === 'right' &&
    issuanceLineOne?.alignment === 'right' &&
    issuanceLineTwo?.alignment === 'right';
  return {
    modelIndex,
    exactModelSequence,
    issuanceLineCount: issuanceAfterModel ? 2 : 0,
    issuanceAfterModel,
    rightAligned,
    headerSequence,
    verdict: modelIndex >= 0 && exactModelSequence && issuanceAfterModel && rightAligned
      ? 'PASS'
      : 'FAIL_ORDER_OR_ALIGNMENT',
  };
}

const records = [];
for (const code of CODES) {
  const livePath = join(ROOT, 'storage', 'templates', 'normalized-docx', code, `${code}_normalized.docx`);
  const candidatePath = join(ROOT, '.tmp-document-fidelity-fix', code, `${code}_normalized.candidate.docx`);
  if (!existsSync(livePath) || !existsSync(candidatePath)) {
    records.push({ code, verdict: 'FAIL_MISSING_ARTIFACT', livePath, candidatePath });
    continue;
  }

  const liveBuffer = readFileSync(livePath);
  const candidateBuffer = readFileSync(candidatePath);
  const candidateZip = new PizZip(candidateBuffer);
  const documentXml = candidateZip.file('word/document.xml')?.asText() ?? '';
  let secondPass;
  let idempotence;
  try {
    secondPass = normalizeLegalHeader(candidateBuffer, { templateCode: code, strategy: 'auto' });
    idempotence = {
      verdict: normalizedXml(candidateBuffer) === normalizedXml(secondPass.buffer)
        ? 'IDEMPOTENT'
        : 'NON_IDEMPOTENT',
      transformedOnSecondPass: secondPass.transformed,
      skippedOnSecondPass: secondPass.skipped ?? false,
    };
  } catch (error) {
    idempotence = {
      verdict: 'NON_IDEMPOTENT',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const packagePreservation = comparePackages(liveBuffer, candidateBuffer);
  const bm001 = code === 'BM-001' ? validateBm001(documentXml) : undefined;
  const bm213 = code === 'BM-213' ? validateBm213(documentXml) : undefined;
  const verdict = packagePreservation.verdict === 'PASS' &&
    idempotence.verdict === 'IDEMPOTENT' &&
    (!bm001 || bm001.verdict === 'PASS') &&
    (!bm213 || bm213.verdict === 'PASS')
    ? 'PASS'
    : 'BLOCKED';

  records.push({
    code,
    livePath: relative(ROOT, livePath).replaceAll('\\', '/'),
    candidatePath: relative(ROOT, candidatePath).replaceAll('\\', '/'),
    liveSha256: sha256(liveBuffer),
    candidateSha256: sha256(candidateBuffer),
    packagePreservation,
    idempotence,
    bm001,
    bm213,
    verdict,
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  scope: CODES,
  passCount: records.filter((record) => record.verdict === 'PASS').length,
  blockedCount: records.filter((record) => record.verdict !== 'PASS').length,
  records,
};
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({
  outPath: relative(ROOT, OUT_PATH).replaceAll('\\', '/'),
  passCount: output.passCount,
  blockedCount: output.blockedCount,
  verdicts: Object.fromEntries(records.map((record) => [record.code, record.verdict])),
}, null, 2));
process.exitCode = output.blockedCount === 0 ? 0 : 1;
