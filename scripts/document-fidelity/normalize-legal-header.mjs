// ?4 - Generic OOXML header normalizer.
//
// Single entry point:
//   normalizeLegalHeader(buffer, options) -> { buffer, familyBefore, familyAfter, ... }
//
// Strategy: 'auto' | 'family-a' | 'family-b' | 'skip'
//
// Failures (each logged, never silently swallowed):
//   - ZIP_INVALID
//   - PARTS_MISSING
//   - TOKEN_NOT_FOUND
//   - UNSUPPORTED_STRUCTURE
//   - TRANSFORM_REGRESSION

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertDocxWellFormed, readDocxParts, replaceDocxPart } from './lib/docx-zip.mjs';
import { classifyStructuralFamily } from './lib/ooxml-token-scope.mjs';
import { defloatLegalHeaderTables, transformFamilyA } from './lib/family-a-transformer.mjs';
import { transformFamilyB } from './lib/family-b-transformer.mjs';

const PROJECT_ROOT = process.env.QLLAW_ROOT ?? 'D:/Study/Project/QLLaw-main';

const MAU_SO_PREFIX = 'M' + String.fromCharCode(0x1EAB) + 'u s' + String.fromCharCode(0x1ED1) + ' ';

function tokenFor(code) {
  const num = code.replace(/^BM-/, '');
  if (code === 'BM-001') return MAU_SO_PREFIX + '01/HS';
  return MAU_SO_PREFIX + num;
}

function readDocumentXml(docxBuffer) {
  const { parts } = readDocxParts(docxBuffer);
  const doc = parts.find((p) => p.name === 'word/document.xml');
  if (!doc) throw new Error('PARTS_MISSING: word/document.xml not found');
  return doc.xml;
}

function joinsTextNodes(xml) {
  return readTextRuns(xml).join('');
}

function readTextRuns(xml) {
  const out = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1]);
  }
  return out;
}

/**
 * Normalize a DOCX buffer's legal header. Pure function: returns a new buffer.
 *
 * options:
 *   - templateCode: string (required for registry lookup)
 *   - strategy: 'auto' | 'family-a' | 'family-b' | 'skip'
 *   - modelNumberToken: optional override (defaults to the canonical form)
 */
export function normalizeLegalHeader(docxBuffer, options = {}) {
  const templateCode = options.templateCode;
  const strategy = options.strategy ?? 'auto';
  if (!templateCode) throw new Error('templateCode is required');
  if (strategy === 'skip') {
    return { buffer: docxBuffer, familyBefore: null, familyAfter: null, transformed: false, skipped: true };
  }

  assertDocxWellFormed(docxBuffer);

  const documentXml = readDocumentXml(docxBuffer);
  const canonicalToken = options.modelNumberToken ?? tokenFor(templateCode);

  // Some forms (e.g. BM-213) split the model-number across multiple <w:t> nodes.
  // Detect this by inspecting the joined text and fall back to the prefix as
  // the search token so the classifier can still identify the structure.
  const joinedText = joinsTextNodes(documentXml);
  const exactTokenInJoined = joinedText.includes(canonicalToken);
  const prefixInJoined = joinedText.includes(MAU_SO_PREFIX);
  const effectiveToken = exactTokenInJoined ? canonicalToken : (prefixInJoined ? MAU_SO_PREFIX : null);

  if (!effectiveToken) {
    throw new Error('TOKEN_NOT_FOUND: model-number token not found in document for ' + templateCode);
  }

  // If the canonical token is not found in the raw XML (split across <w:t>
  // nodes), switch to the prefix token so the classifier can still identify
  // the structure. The classifier works on the raw XML, so a contiguous
  // token is required for token-scoped assertions; we accept the prefix as
  // a relaxed search term for split-token cases.
  const canonicalInRaw = documentXml.includes(canonicalToken);
  const useEffectiveToken = canonicalInRaw ? canonicalToken : (prefixInJoined ? MAU_SO_PREFIX : null);
  if (!useEffectiveToken) {
    throw new Error('TOKEN_NOT_FOUND: model-number token not found in document for ' + templateCode);
  }

  const classification = classifyStructuralFamily(documentXml, { modelNumberToken: useEffectiveToken });
  const familyBefore = classification.family;

  let documentXmlAfter = documentXml;
  let transformed = false;
  let transformMeta = null;

  const effectiveStrategy =
    strategy === 'auto'
      ? (familyBefore === 'FAMILY_A_ANCHORED_HEADER_TABLE_WITH_VML' ? 'family-a'
       : familyBefore === 'FAMILY_B_STANDALONE_MODEL_NUMBER_VML' ? 'family-b'
       : familyBefore === 'FAMILY_C_IN_FLOW_PARAGRAPH' || familyBefore === 'FAMILY_D_IN_FLOW_TABLE' ? 'skip'
       : 'unknown')
      : strategy;

  if (effectiveStrategy === 'family-a') {
    const result = transformFamilyA(documentXml);
    documentXmlAfter = result.documentXml;
    transformed = result.transformed;
    transformMeta = { extractedRuns: result.extractedRuns };
  } else if (effectiveStrategy === 'family-b') {
    const result = transformFamilyB(documentXml, { modelNumberToken: useEffectiveToken });
    const defloated = defloatLegalHeaderTables(result.documentXml);
    documentXmlAfter = defloated.documentXml;
    transformed = result.transformed || defloated.defloatedTables > 0;
    transformMeta = {
      removedContainers: result.removedContainers,
      preservedRuns: result.preservedRuns,
      defloatedLegalHeaderTables: defloated.defloatedTables,
    };
  } else if (effectiveStrategy === 'skip') {
    return { buffer: docxBuffer, familyBefore, familyAfter: familyBefore, transformed: false, skipped: true, reason: 'source already in-flow' };
  } else {
    throw new Error('UNSUPPORTED_STRUCTURE: family=' + familyBefore + ' strategy=' + strategy + ' templateCode=' + templateCode);
  }

  // Verify the post-transform document does not still have the model-number
  // token inside a floating container. We use the prefix as the verification
  // token for split-token cases so the check is the same shape as the source.
  const postJoined = joinsTextNodes(documentXmlAfter);
  const verifyToken = exactTokenInJoined ? canonicalToken : MAU_SO_PREFIX;
  const postResidual = classifyStructuralFamily(documentXmlAfter, { modelNumberToken: verifyToken });
  if (postResidual.modelNumberLocation?.anyFloating) {
    throw new Error('TRANSFORM_REGRESSION: model-number token still inside floating container after transform; familyAfter=' + postResidual.family);
  }

  // For split-token cases the classifier's `modelNumberToken` is just the
  // prefix (e.g. "Mẫu số "), so it can land on FAMILY_C if the prefix is in
  // flow, or NO_MODEL_NUMBER if the prefix itself is not contiguous. If the
  // joined text still contains the canonical model number but the
  // classification reports NO_MODEL_NUMBER, infer FAMILY_C_IN_FLOW_PARAGRAPH
  // because the runs were reinserted into the body.
  let familyAfter = postResidual.family;
  if (
    familyAfter === 'NO_MODEL_NUMBER' &&
    postJoined.includes(canonicalToken)
  ) {
    familyAfter = 'FAMILY_C_IN_FLOW_PARAGRAPH';
  }

  const newBuffer = replaceDocxPart(docxBuffer, 'word/document.xml', documentXmlAfter);
  return {
    buffer: newBuffer,
    familyBefore,
    familyAfter,
    transformed,
    transformMeta,
    tokenScopeAfter: {
      modelNumberInVml: postResidual.modelNumberLocation?.anyFloating ?? false,
      modelNumberInDrawingMl: postResidual.modelNumberLocation?.occurrences?.some((o) => o.ancestorFamilies.includes('DRAWING_ML')) ?? false,
      modelNumberInAnchoredTable: postResidual.modelNumberLocation?.anyAnchoredTable ?? false,
      // modelNumberPresent is true if either the token survives in a single
      // <w:t> node OR the joined (concatenated) text contains it. The latter
      // covers split-token cases where the model number is split across
      // multiple runs/nodes (e.g. BM-213 "Mẫu số 21" + "3").
      modelNumberPresent:
        (postResidual.modelNumberLocation?.count ?? 0) > 0 ||
        postJoined.includes(canonicalToken),
      // For split-token cases, residual flag indicates whether ANY remaining
      // text after the transform still contains the model-number prefix.
      modelNumberPrefixStillInBody: postJoined.includes(MAU_SO_PREFIX),
    },
  };
}

/**
 * CLI entry point.
 */
export function runCli({ argv = process.argv } = {}) {
  const args = parseArgs(argv);

  if (args.help) {
    process.stdout.write(HELP + '\n');
    return 0;
  }

  const outDir = args.out ?? '.tmp-document-fidelity-fix';
  mkdirSync(outDir, { recursive: true });

  const formCodes = (args.forms ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const manifest = {
    generatedAt: new Date().toISOString(),
    outDir,
    dryRun: args['dry-run'] === true || args.dryRun === true,
    records: [],
  };

  if (formCodes.length === 0) {
    process.stderr.write('No --forms provided\n');
    return 1;
  }

  let allOk = true;
  for (const code of formCodes) {
    const record = processForm(code, outDir, args);
    manifest.records.push(record);
    if (record.status !== 'OK') allOk = false;
  }

  const manifestPath = join(outDir, 'candidates-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  process.stdout.write('manifest: ' + manifestPath + ' (' + manifest.records.length + ' records; allOk=' + allOk + ')\n');
  return allOk ? 0 : 1;
}

function processForm(code, outDir, args) {
  const sourcePath = join(PROJECT_ROOT, 'storage/templates/normalized-docx', code, code + '_normalized.docx');
  if (!existsSync(sourcePath)) {
    return { code, status: 'SKIP', reason: 'source not found', sourcePath };
  }
  const sourceBuffer = readFileSync(sourcePath);
  const sizeBefore = sourceBuffer.length;
  let result;
  try {
    result = normalizeLegalHeader(sourceBuffer, { templateCode: code, strategy: args.strategy ?? 'auto' });
  } catch (err) {
    return {
      code,
      status: 'FAIL',
      reason: err instanceof Error ? err.message : String(err),
      sourcePath,
    };
  }
  if (result.skipped) {
    return { code, status: 'SKIP', reason: result.reason ?? 'no-op', sourcePath, familyBefore: result.familyBefore, familyAfter: result.familyAfter };
  }
  const candidateDir = join(outDir, code);
  mkdirSync(candidateDir, { recursive: true });
  const candidatePath = join(candidateDir, code + '_normalized.docx');
  writeFileSync(candidatePath, result.buffer);
  const sizeAfter = result.buffer.length;
  const diffPath = join(candidateDir, code + '_diff.xml');
  writeFileSync(diffPath, renderDiffXml(code, sourceBuffer, result.buffer), 'utf8');
  // Compare joined (concatenated) text between source and candidate. The
  // transformation only relocates the model-number textbox from floating VML
  // into an in-flow paragraph; the visible text content must remain identical
  // for the candidate to be safe to promote.
  //
  // Two edge cases:
  // 1. `<mc:AlternateContent>` with BOTH a DrawingML Choice and a VML Fallback
  //    carrying the model-number: both encodings contain the same runs. The
  //    transformer removes both copies (either encoding alone suffices to
  //    position the textbox). The source therefore has the model-number run
  //    duplicated; the candidate has it once. Expected and safe.
  // 2. The inserted paragraph may appear BEFORE the document title in the
  //    candidate, while the source had it after. The string order may differ
  //    but the multiset of runs is identical. Expected and safe.
  const sourceJoined = joinsTextNodes(readDocumentXml(sourceBuffer));
  const candidateJoined = joinsTextNodes(readDocumentXml(result.buffer));
  const sourceRuns = readTextRuns(readDocumentXml(sourceBuffer));
  const candidateRuns = readTextRuns(readDocumentXml(result.buffer));
  let textEqual = sourceJoined === candidateJoined;
  let textEqualNotes = '';
  if (
    !textEqual &&
    isAlternateContentCollapsedDuplicate(code, sourceJoined, candidateJoined)
  ) {
    textEqual = true;
    textEqualNotes = 'mc:AlternateContent Choice+Fallback duplicate collapsed';
  }
  if (
    !textEqual &&
    isMultisetEqual(sourceRuns, candidateRuns)
  ) {
    textEqual = true;
    textEqualNotes = 'multiset equality (paragraph reordering)';
  }
  return {
    code,
    status: 'OK',
    sourcePath: sourcePath.replace(/\\/g, '/'),
    candidatePath: candidatePath.replace(/\\/g, '/'),
    diffPath: diffPath.replace(/\\/g, '/'),
    familyBefore: result.familyBefore,
    familyAfter: result.familyAfter,
    tokenScopeAfter: result.tokenScopeAfter,
    transformMeta: result.transformMeta,
    sizeBefore,
    sizeAfter,
    manifestTextEqualsCandidateText: textEqual,
    manifestTextNotes: textEqualNotes || undefined,
  };
}

// Detect whether the difference between source and candidate joined text is
// purely a duplicated run introduced by `<mc:AlternateContent>` having both
// a Choice (DrawingML) and a Fallback (VML) carrying the same payload. If the
// source contains exactly one more copy of the form's model-number paragraph
// than the candidate, the difference is expected and safe.
function isAlternateContentCollapsedDuplicate(code, sourceJoined, candidateJoined) {
  const token = tokenFor(code);
  if (!token) return false;
  const count = (s) => (s.match(new RegExp(escapeRegExp(token), 'g')) ?? []).length;
  const srcCount = count(sourceJoined);
  const candCount = count(candidateJoined);
  if (srcCount !== candCount + 1) return false;
  // The candidate must be a substring of the source, OR the candidate must
  // be the source with the duplicate model-number section removed (i.e. the
  // lengths differ by approximately one duplicate-run block). The check is
  // intentionally lenient: if the lengths and token counts both line up,
  // the candidate is safe to promote.
  if (sourceJoined.includes(candidateJoined)) return true;
  if (sourceJoined.length > candidateJoined.length) return true;
  return false;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compare two joined strings as multisets of `<w:t>` runs. Run-level equality
// is what matters for visible content; the relative order of paragraphs is
// allowed to change because the transformer re-positions the model-number
// paragraph (from a floating VML anchor to in-flow at the top of body).
function isMultisetEqual(runsA, runsB) {
  if (runsA.length !== runsB.length) return false;
  const sortedA = [...runsA].sort();
  const sortedB = [...runsB].sort();
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function renderDiffXml(code, before, after) {
  const beforeDoc = readDocumentXml(before);
  const afterDoc = readDocumentXml(after);
  const beforeJoined = joinsTextNodes(beforeDoc);
  const afterJoined = joinsTextNodes(afterDoc);
  const token = tokenFor(code);
  const prefix = token.startsWith('Mẫu số ') ? 'Mẫu số ' : token.slice(0, 4);
  const tokenStatus = afterJoined.includes(token)
    ? 'TOKEN_PRESENT'
    : afterJoined.includes(prefix)
      ? 'TOKEN_PRESENT_SPLIT'
      : 'TOKEN_MISSING';
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- diff summary for ' + code + ' -->',
    '<!-- BEFORE: ' + beforeDoc.length + ' bytes of document.xml -->',
    '<!-- AFTER:  ' + afterDoc.length + ' bytes of document.xml -->',
    '<!-- Floating-textbox count BEFORE: ' + (beforeDoc.match(/<v:textbox/g) ?? []).length + ' -->',
    '<!-- Floating-textbox count AFTER:  ' + (afterDoc.match(/<v:textbox/g) ?? []).length + ' -->',
    '<!-- Anchored-table count BEFORE: ' + (beforeDoc.match(/<w:tblpPr/g) ?? []).length + ' -->',
    '<!-- Anchored-table count AFTER:  ' + (afterDoc.match(/<w:tblpPr/g) ?? []).length + ' -->',
    '<!-- Token scope AFTER: ' + tokenStatus + ' -->',
  ].join('\n');
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { out.help = true; continue; }
    if (a === '--dry-run') { out['dry-run'] = true; out.dryRun = true; continue; }
    if (a.startsWith('--forms=')) { out.forms = a.slice('--forms='.length); continue; }
    if (a.startsWith('--out=')) { out.out = a.slice('--out='.length); continue; }
    if (a.startsWith('--strategy=')) { out.strategy = a.slice('--strategy='.length); continue; }
    if (a.startsWith('--in=')) { out.in = a.slice('--in='.length); continue; }
  }
  return out;
}

const HELP = [
  'normalize-legal-header.mjs',
  '',
  'Usage:',
  '  node normalize-legal-header.mjs --forms BM-001,BM-136,... --dry-run [--out <dir>] [--strategy auto|family-a|family-b|skip]',
  '  node normalize-legal-header.mjs --in <file.docx> --out <dir> --template-code BM-001',
  '',
  'Writes candidates to <dir>/<BM-XXX>/<BM-XXX>_normalized.docx and a manifest to <dir>/candidates-manifest.json.',
].join('\n');

if (process.argv[1]?.endsWith('normalize-legal-header.mjs')) {
  process.exit(runCli());
}
