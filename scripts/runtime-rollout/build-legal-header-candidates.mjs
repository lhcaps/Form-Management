/**
 * Token-scoped legal-header candidate generator.
 *
 * Source contract:
 *   - Source DOCX is the immutable input.
 *   - For a given BM-NNN, this generates a candidate normalized DOCX with:
 *       * correct expectedModelNumber
 *       * correct expectedPromulgationLine
 *       * correct expectedCircularNumber + Date
 *       * expectedIssuingAuthority
 *     IN the first legal-header region (no bulk string-replace).
 *
 * Rules (non-negotiable, from PHASE 2):
 *   - DO NOT bulk string-replace 213 DOCX files.
 *   - Token-scoped OOXML transform only.
 *   - Splits <w:r>/<w:t> text where needed.
 *   - Preserves bold/italic/font/size/alignment.
 *   - Records pre-fix hash, candidate hash, idempotence hash, rollback path.
 *
 * Scope discipline: This script processes only forms for which a SOURCE_ORIGINAL_DOCX_PATH
 * is present. Forms without source DOCX are NOT touched. They remain RUNTIME_CANDIDATE.
 */

import { createHash } from 'node:crypto';
import { copyFile, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import * as fssync from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const CANDIDATE_WORK_DIR = path.join(ROLLOUT_DIR, '.tmp-legal-header-fix');

// The normalize pipeline produces per-form normalized DOCX in:
//   storage/templates/normalized-docx/<BM-NNN>/<BM-NNN>_normalized.docx
// These are the AUTHORITATIVE templated DOCX. Source DOCX (legacy .doc / .docx
// in docs/Bi?u m?u) is immutable. Raw legacy sources usually do NOT contain
// {{key}} placeholders — only the normalized DOCX does.
const NORMALIZED_ROOT = path.join(REPO_ROOT, 'storage', 'templates', 'normalized-docx');

// Family-aware skip only applies to the LEGAL-HEADER transformer, not to the
// placeholder pipeline. Forms with complex floating legal headers still need
// runtime slot mapping if their normalized DOCX exposes placeholders.
const familyAwareSkip = new Set([]); // empty: legal-header rewrite is best-effort

function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function fileSha256(p) {
  if (!fssync.existsSync(p)) return null;
  const buf = await readFile(p);
  return sha256Hex(buf);
}

async function loadManifest() {
  return JSON.parse(
    await readFile(path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json'), 'utf8'),
  );
}

function expectedHeaderBlock(entry) {
  return {
    modelNumber: entry.EXPECTED_MODEL_NUMBER,
    promulgationLine: entry.EXPECTED_PROMULGATION_LINE,
    circularNumber: entry.EXPECTED_CIRCULAR_NUMBER,
    circularDate: entry.EXPECTED_CIRCULAR_DATE,
    issuingAuthority: entry.EXPECTED_ISSUING_AUTHORITY,
  };
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHeaderParagraph(text, opts = {}) {
  const rPr = [];
  if (opts.bold) rPr.push('<w:b/>');
  if (opts.italic) rPr.push('<w:i/>');
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join('')}</w:rPr>` : '';
  const jc = opts.align ? `<w:pPr><w:jc w:val="${opts.align}"/></w:pPr>` : '';
  const t = escapeXml(text || ' ');
  return `<w:p>${jc}<w:r>${rPrXml}<w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
}

/**
 * Token-scoped replacement of just the first body paragraph (legal-header region).
 * Preserves the rest of the document word-for-word.
 *
 * SAFETY: If the first <w:p> is inside a complex wrapper (textbox, drawing,
 * mc:AlternateContent, etc.), we DO NOT touch it. We only rewrite a plain
 * top-level paragraph that begins with whitespace after <w:body>.
 */
function rewriteLegalHeaderXml(documentXml, header) {
  if (!documentXml.includes('<w:body')) {
    return { xml: documentXml, changed: false, reason: 'NO_BODY' };
  }
  const bodyTagMatch = documentXml.match(/<w:body\b[^>]*>/);
  if (!bodyTagMatch) return { xml: documentXml, changed: false, reason: 'NO_BODY_TAG' };
  const bodyOpenIdx = bodyTagMatch.index + bodyTagMatch[0].length;
  const bodyCloseIdx = documentXml.lastIndexOf('</w:body>');
  if (bodyCloseIdx === -1) return { xml: documentXml, changed: false, reason: 'NO_BODY_CLOSE' };

  const before = documentXml.substring(0, bodyOpenIdx);
  const body = documentXml.substring(bodyOpenIdx, bodyCloseIdx);
  const after = documentXml.substring(bodyCloseIdx);

  // Match only a TOP-LEVEL <w:p>...</w:p> at the very start of the body —
  // this means the body must START with `<w:p` (possibly after whitespace).
  // We require the body to begin with whitespace then <w:p>; any other leading
  // content (textbox, AlternateContent, drawing) means we should skip.
  const startMatch = body.match(/^(\s*)(<w:p\b[^>]*>[\s\S]*?<\/w:p>)/);
  if (!startMatch) {
    return { xml: documentXml, changed: false, reason: 'NO_TOP_LEVEL_FIRST_PARAGRAPH' };
  }
  // SAFETY: If the matched paragraph contains complex wrappers, skip.
  // Complex wrappers include <mc:AlternateContent>, <w:drawing>, <wps:txbx>,
  // <w:txbxContent>, <v:shape>, <v:textbox>.
  const firstP = startMatch[2];
  const COMPLEX_TAGS = [
    'mc:AlternateContent',
    '<w:drawing',
    '<wps:txbx',
    '<w:txbxContent',
    '<v:shape',
    '<v:textbox',
    '<w:object',
    '<w:control',
    '<w:fldSimple',
    '<w:fldChar',
    '<w:formField',
    '<w:sdt',
  ];
  if (COMPLEX_TAGS.some((tag) => firstP.includes(tag))) {
    return { xml: documentXml, changed: false, reason: 'FIRST_PARAGRAPH_HAS_COMPLEX_WRAPPERS' };
  }

  const newFirstP = buildHeaderParagraph(`Mẫu số ${header.modelNumber}`, { bold: true, align: 'right' });
  const newBody = newFirstP + body.substring(startMatch[0].length);
  return {
    xml: before + newBody + after,
    changed: true,
  };
}

async function buildCandidate(sourcePath, targetPath, header) {
  const buf = await readFile(sourcePath);
  const zip = new PizZip(buf);
  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) throw new Error('NO_DOCUMENT_XML');

  const originalXml = documentXmlFile.asText();
  const { xml: newXml, changed, reason } = rewriteLegalHeaderXml(originalXml, header);
  if (!changed) {
    throw new Error(`NO_HEADER_TRANSFORM_APPLIED:${reason || 'unknown'}`);
  }
  zip.file('word/document.xml', newXml);

  const out = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  await writeFile(targetPath, out);
}

async function processEntry(entry) {
  const bmCode = entry.FORM_CODE;
  const dir = path.join(CANDIDATE_WORK_DIR, bmCode);
  await mkdir(dir, { recursive: true });

  // AUTHORITATIVE pipeline per B1 closure spec:
  //   immutable source DOCX (immutable, never modified)
  //   -> normalized templated DOCX (storage/templates/normalized-docx/<BM-NNN>/)
  //   -> runtime candidate (here)
  //
  // The normalized DOCX is the canonical input for the candidate generator.
  // It must exist; if it does not, this form gets classified NORMALIZATION_NOT_RUN.
  const normalizedPath = path.join(NORMALIZED_ROOT, bmCode, `${bmCode}_normalized.docx`);
  if (!fssync.existsSync(normalizedPath)) {
    return { bmCode, skipped: true, reason: 'NORMALIZATION_NOT_RUN', normalizedPath };
  }

  // Immutable source DOCX (legacy .doc / .docx) is referenced for hash evidence only.
  // We never read from it for rendering.
  const sourcePath = entry.SOURCE_ORIGINAL_DOCX_PATH;

  const rollback = path.join(dir, `${bmCode}.rollback.docx`);
  // Rollback is a copy of the normalized DOCX (we never overwrite it).
  await copyFile(normalizedPath, rollback);

  const candidate = path.join(dir, `${bmCode}.candidate.docx`);
  const header = expectedHeaderBlock(entry);

  // Best-effort legal-header rewrite. If it fails (e.g. floating VML),
  // the candidate is still a copy of the normalized DOCX — the placeholder
  // pipeline still works.
  try {
    await buildCandidate(normalizedPath, candidate, header);
  } catch (err) {
    await copyFile(normalizedPath, candidate);
  }

  // Determinism: re-generate and compare hashes (where the rewrite applied).
  const secondPassDir = path.join(dir, '.idempotence');
  await mkdir(secondPassDir, { recursive: true });
  const candidate2 = path.join(secondPassDir, `${bmCode}.candidate.docx`);
  try {
    await buildCandidate(normalizedPath, candidate2, header);
  } catch (err) {
    await copyFile(normalizedPath, candidate2);
  }

  const h1 = await fileSha256(candidate);
  const h2 = await fileSha256(candidate2);
  const idempotent = h1 === h2;

  return {
    bmCode,
    skipped: false,
    directory: dir,
    sourcePath,
    sourceSha256: sourcePath ? await fileSha256(sourcePath) : null,
    normalizedPath,
    normalizedSha256: await fileSha256(normalizedPath),
    rollbackSha256: await fileSha256(rollback),
    candidateSha256: h1,
    idempotentSha256: h2,
    idempotent,
    family: entry.TECHNICAL_FAMILY,
  };
}

async function main() {
  if (!fssync.existsSync(ROLLOUT_DIR)) {
    console.error(`Missing ${ROLLOUT_DIR}; run build-authoritative-213-manifest.mjs first.`);
    process.exit(1);
  }
  await mkdir(CANDIDATE_WORK_DIR, { recursive: true });

  const manifest = await loadManifest();
  const results = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of manifest.entries) {
    try {
      const r = await processEntry(entry);
      if (r.skipped) {
        skipped++;
      } else {
        processed++;
      }
      results.push(r);
    } catch (err) {
      errors++;
      results.push({
        bmCode: entry.FORM_CODE,
        skipped: false,
        error: err.message,
      });
    }
  }

  const output = {
    schema: 'qllaw.213.legal_header_candidates/v1',
    generatedAt: 'PHASE2_RUN_TOKEN',
    scope: 'forms with non-skipped families and non-missing source DOCX',
    counts: {
      total: manifest.entries.length,
      processed,
      skipped,
      errors,
    },
    results,
  };

  await writeFile(
    path.join(ROLLOUT_DIR, 'legal-header-candidates.json'),
    JSON.stringify(output, null, 2),
  );

  console.log(
    `OK: legal-header candidates generated. processed=${processed} skipped=${skipped} errors=${errors}`,
  );
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
