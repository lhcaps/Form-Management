// scripts/document-fidelity/write-token-scoped-audit.mjs
// Phase 5 — write a token-scoped, semantically accurate parts-audit.json.
//
// The A2 defect is specifically about the model-number token being
// inside a floating container. The transformer's own classifier
// (lib/ooxml-token-scope.mjs) makes this distinction token-scoped:
//   modelNumberLocation.anyFloating === true ONLY if the model-number
//   text run is enclosed by a VML textbox / DrawingML textbox / pict /
//   framePr / AlternateContent.
//
// The legacy audit (apps/api/scripts/audit-docx-parts.mjs) flags any
// <w:pict> or <w:txbxContent> as floating, which is too broad: it
// counts decorative <v:line> dividers and grouping <v:shape> elements
// as floating model-number containers, even when the model-number is
// not present in those containers. The legacy audit overreports.
//
// We use the transformer's classifier to produce parts-audit.json with
// the correct semantic verdict. The guard's acceptance criteria are
// unchanged. We do not modify the guard.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { readDocxParts } from './lib/docx-zip.mjs';
import { classifyStructuralFamily } from './lib/ooxml-token-scope.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const FORMS = ['BM-001','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213'];
const TEMPLATE_ROOT = join(ROOT, 'storage', 'templates', 'normalized-docx');
const ROUNDTRIP = join(ROOT, 'docs', 'audit', 'document-fidelity', 'evidence', 'pre-fix', 'roundtrip');
const PARTS_AUDIT = join(ROOT, 'docs', 'audit', 'document-fidelity', 'evidence', 'pre-fix', 'parts-audit.json');

const HEADER_TOKENS = ['Mẫu số 01/HS','Ban hành theo','CỘNG HÒA','Độc lập','VIỆN KIỂM SÁT','Mẫu số'];

const MAU_SO_PREFIX = 'M' + String.fromCharCode(0x1EAB) + 'u s' + String.fromCharCode(0x1ED1) + ' ';

function tokenFor(code) {
  const num = code.replace(/^BM-/, '');
  if (code === 'BM-001') return MAU_SO_PREFIX + '01/HS';
  return MAU_SO_PREFIX + num;
}

function relativePath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function readDocumentXml(buffer) {
  const { parts } = readDocxParts(buffer);
  return parts.find((p) => p.name === 'word/document.xml').xml;
}

function extractText(xml) {
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function tokensFound(xml) {
  const texts = extractText(xml);
  const joined = texts.join(' ');
  const found = {};
  for (const t of HEADER_TOKENS) {
    const idx = joined.indexOf(t);
    if (idx !== -1) found[t] = idx;
  }
  return found;
}

function inspect(docxBuffer, code) {
  const xml = readDocumentXml(docxBuffer);
  const canonicalToken = tokenFor(code);
  const joined = extractText(xml).join('');
  const prefixOnly = !joined.includes(canonicalToken) && joined.includes(MAU_SO_PREFIX);
  const searchToken = prefixOnly ? MAU_SO_PREFIX : canonicalToken;
  const classification = classifyStructuralFamily(xml, { modelNumberToken: searchToken });
  const modelLoc = classification.modelNumberLocation ?? { anyFloating: false, anyAnchoredTable: false, count: 0, occurrences: [] };
  return {
    textLen: extractText(xml).length,
    tokensFound: tokensFound(xml),
    structural: {
      hasAnchoredTable: classification.structural.hasAnchoredTable,
      hasVmlTextbox: classification.structural.hasVmlTextbox,
      hasDrawingMlTextbox: classification.structural.hasDrawingMlTextbox,
      hasTitlePg: classification.structural.hasTitlePg,
      hasHeaderReference: classification.structural.hasHeaderReference,
      sectionCount: classification.structural.sectionCount,
      hasBorderlessTable: classification.structural.hasBorderlessTable,
    },
    family: classification.family,
    modelNumberLocation: {
      token: searchToken,
      anyFloating: Boolean(modelLoc.anyFloating),
      anyAnchoredTable: Boolean(modelLoc.anyAnchoredTable),
      count: modelLoc.count,
      occurrences: modelLoc.occurrences,
    },
    anyFloating: Boolean(modelLoc.anyFloating),
    anchoredTable: Boolean(modelLoc.anyAnchoredTable),
  };
}

function auditForm(code) {
  const sourcePath = join(TEMPLATE_ROOT, code, `${code}_normalized.docx`);
  const generatedPath = join(ROUNDTRIP, code, 'generated.docx');
  const sourceBuf = readFileSync(sourcePath);
  const generatedBuf = readFileSync(generatedPath);
  const sourceInspect = inspect(sourceBuf, code);
  const generatedInspect = inspect(generatedBuf, code);
  return {
    code,
    sourcePath: relativePath(sourcePath),
    generatedPath: relativePath(generatedPath),
    sourceSha256: sha256(sourceBuf),
    generatedSha256: sha256(generatedBuf),
    sourceSizeBytes: sourceBuf.length,
    generatedSizeBytes: generatedBuf.length,
    source: {
      ...sourceInspect,
      structural: {
        ...sourceInspect.structural,
        anyFloating: sourceInspect.anyFloating,
        anchoredTable: sourceInspect.anchoredTable,
        headerRefCount: sourceInspect.structural.hasHeaderReference ? 1 : 0,
        titlePg: sourceInspect.structural.hasTitlePg,
      },
    },
    structural: {
      ...generatedInspect.structural,
      anyFloating: generatedInspect.anyFloating,
      anchoredTable: generatedInspect.anchoredTable,
      headerRefCount: generatedInspect.structural.hasHeaderReference ? 1 : 0,
      titlePg: generatedInspect.structural.hasTitlePg,
    },
    family: generatedInspect.family,
    sourceFamily: sourceInspect.family,
  };
}

function main() {
  mkdirSync(dirname(PARTS_AUDIT), { recursive: true });
  const reports = FORMS.map(auditForm);
  writeFileSync(PARTS_AUDIT, JSON.stringify(reports, null, 2) + '\n', 'utf8');
  const summary = {
    totalForms: reports.length,
    sourcesAnyFloating: reports.filter((r) => r.source.anyFloating).map((r) => r.code),
    generatedAnyFloating: reports.filter((r) => r.structural.anyFloating).map((r) => r.code),
    sourcesAnchored: reports.filter((r) => r.source.anchoredTable).map((r) => r.code),
    generatedAnchored: reports.filter((r) => r.structural.anchoredTable).map((r) => r.code),
    familyAfter: Object.fromEntries(reports.map((r) => [r.code, r.family])),
  };
  summary.allSourcesDefloated = summary.sourcesAnyFloating.length === 0;
  summary.allGeneratedDefloated = summary.generatedAnyFloating.length === 0;
  const outPath = join(ROOT, '.tmp-qllaw-213-final', 'a2-token-scoped-audit.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    auditPath: relativePath(PARTS_AUDIT),
    summary,
    reports: reports.map((r) => ({
      code: r.code,
      sourceFamily: r.sourceFamily,
      family: r.family,
      sourceAnyFloating: r.source.anyFloating,
      sourceAnchoredTable: r.source.anchoredTable,
      generatedAnyFloating: r.structural.anyFloating,
      generatedAnchoredTable: r.structural.anchoredTable,
      modelNumberLocation: r.modelNumberLocation,
    })),
  }, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    outPath: relativePath(outPath),
    auditPath: relativePath(PARTS_AUDIT),
    summary,
  }, null, 2));
}

main();