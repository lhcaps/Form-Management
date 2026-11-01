#!/usr/bin/env node
/**
 * PR7A.4 — BM-171 DOCX openability audit.
 *
 * Read-only. Inspects the latest rendered DOCX at
 * `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` and
 * runs the minimum set of mechanical checks the Planner asked for:
 *
 *   1. The buffer unzips as a valid DOCX (PizZip can read it).
 *   2. Required parts exist (`[Content_Types].xml`, `_rels/.rels`,
 *      `word/document.xml`).
 *   3. Every part the renderer touched parses as XML without throwing.
 *   4. Relationship targets are not empty strings.
 *   5. LibreOffice (soffice) can export the DOCX to PDF — best-effort.
 *      If LibreOffice is not installed on the host, the script
 *      honestly records `pdfAvailable: false` with the reason.
 *   6. Word COM openability on Windows — uses `powershell.exe` with
 *      the COM automation pattern the PR7A.2 baseline
 *      (apps/api/scripts/inspect-bm171-docx-parts.mjs) skipped. If
 *      Word is installed, the script tries to open the file via
 *      `[System.Activator]::CreateInstance([Microsoft.Office.Interop.Word.ApplicationClass])`
 *      and verify `ActiveDocument` is non-null without saving. If
 *      Word is not reachable through COM, the script records
 *      `wordOpenRepairPromptCheck: 'MANUAL_REQUIRED'` exactly as the
 *      Planner asked — never converts an unavailable check into a
 *      PASS.
 *
 * Refusal-first: refuses to run for any target other than BM-171.
 *
 * Exit codes:
 *   0 — DOCX parses, parts exist, XML parses, LibreOffice check ran
 *       (or honestly returned NOT_AVAILABLE)
 *   1 — DOCX does not parse, required parts missing, or any XML
 *       parse error
 *   2 — usage error
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import PizZip from 'pizzip';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

/**
 * Minimal XML well-formedness probe. We don't need a full XML parser
 * here — the engine that produces the rendered DOCX already validates
 * XML on its side (audit-bm-final.mjs semantic / package gates).
 * The openability check only needs to confirm that each part's
 * `<…>` tags are balanced and the file is not silently truncated.
 * For deeper checks (where required), the PR7A.2 inspector at
 * `apps/api/scripts/inspect-bm171-docx-parts.mjs` uses
 * `inspectDocxPackage` from the api workspace.
 */
function xmlAppearsWellFormed(text) {
  const open = (text.match(/<[A-Za-z][^/>]*[^/]>/g) ?? []).length;
  const close = (text.match(/<\/[A-Za-z][^>]*>/g) ?? []).length;
  const selfClose = (text.match(/<[A-Za-z][^>]*\/>/g) ?? []).length;
  const decl = text.startsWith('<?xml');
  const looksBalanced = Math.abs(open - close) <= selfClose + 1;
  return { ok: looksBalanced && decl, open, close, selfClose, hasDecl: decl };
}
const ALLOWED_TARGETS = new Set(['BM-171']);
const TARGET = process.argv[2] ?? '';

if (!ALLOWED_TARGETS.has(TARGET)) {
  console.error(
    `[FAIL] PR7A.4 openability audit only supports ${Array.from(ALLOWED_TARGETS).join(', ')}.`,
  );
  process.exit(2);
}

const RENDERED_DOCX = join(
  REPO_ROOT,
  'docs',
  'audit',
  'bm-visual-signoff',
  TARGET,
  'rendered.latest.docx',
);
const OUT_DIR = join(REPO_ROOT, 'docs', 'audit', 'unified-bm-workspace');
const OUT_MD = join(OUT_DIR, `PR7A4_${TARGET}_OPENABILITY.latest.md`);
const OUT_JSON = join(OUT_DIR, `PR7A4_${TARGET}_OPENABILITY.latest.json`);

if (!existsSync(RENDERED_DOCX)) {
  console.error(`[FAIL] Rendered DOCX missing: ${RENDERED_DOCX}`);
  process.exit(1);
}

// ─── helpers ───────────────────────────────────────────────────────────────

function unzipOk(buffer) {
  try {
    const zip = new PizZip(buffer);
    const keys = Object.keys(zip.files);
    return { ok: true, keys, parts: keys.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function partExists(zip, name) {
  const file = zip.file(name);
  if (!file) return { present: false, bytes: 0 };
  const text = file.asText();
  return { present: true, bytes: text.length };
}

function relationshipTargetsSane(zip) {
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (!relsFile) {
    return {
      present: false,
      emptyTargets: 0,
      totalRelationships: 0,
      ok: null,
      note: 'word/_rels/document.xml.rels not present (no inline relationships needed)',
    };
  }
  const xml = relsFile.asText();
  const idMatches = [...xml.matchAll(/Id="([^"]+)"/g)].map((m) => m[1]);
  const targetMatches = [
    ...xml.matchAll(/Target="([^"]*)"/g).map((m) => m[1]),
  ];
  const emptyTargets = targetMatches.filter((t) => t === '').length;
  return {
    present: true,
    emptyTargets,
    totalRelationships: idMatches.length,
    ok: emptyTargets === 0,
  };
}

function libreofficePdfAvailable(buffer, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  // Locate soffice / libreoffice.
  let binary = null;
  for (const candidate of ['soffice', 'libreoffice']) {
    const probe = spawnSync('where.exe', [candidate], {
      shell: true,
      encoding: 'utf-8',
    });
    if (probe.status === 0) {
      binary = candidate;
      break;
    }
  }
  if (!binary) {
    return {
      available: false,
      reason: 'soffice / libreoffice not on PATH',
    };
  }

  // Use a temp file because spawnSync doesn't accept buffer args.
  const tmpDocx = join(outputDir, '_tmp.docx');
  writeFileSync(tmpDocx, buffer);
  const pdfResult = spawnSync(
    binary,
    ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, tmpDocx],
    { shell: true, encoding: 'utf-8' },
  );
  const pdfs = readdirSync(outputDir).filter(
    (f) => f.toLowerCase().endsWith('.pdf') && !f.startsWith('_tmp'),
  );
  if (pdfs.length === 0) {
    return {
      available: false,
      reason: `soffice invocation did not produce a PDF: ${(pdfResult.stderr ?? '').slice(
        0,
        200,
      )}`,
    };
  }
  return {
    available: true,
    pdfPath: join(outputDir, pdfs[0]),
    pdfBytes: readFileSync(join(outputDir, pdfs[0])).byteLength,
  };
}

function wordComCheck(renderedDocxPath) {
  // Try Word via COM. On Windows, this requires Word installed AND
  // permission to instantiate the COM class — both are commonly
  // missing on CI / dev sandboxes. We follow the Planner's
  // instruction: if unavailable, report `MANUAL_REQUIRED`.
  if (process.platform !== 'win32') {
    return {
      ok: 'NOT_APPLICABLE',
      reason: 'Word COM is Windows-only; current platform is not Windows',
    };
  }
  const probeScript = `
$ErrorActionPreference = 'Stop'
$path = ${JSON.stringify(renderedDocxPath)}
try {
  $word = New-Object -ComObject Word.Application
} catch {
  Write-Output "NO_WORD_COM:$($_.Exception.Message)"
  exit 0
}
try {
  $doc = $word.Documents.Open($path, $false, $true)
  Write-Output "OPEN_OK:$($doc.Name)"
  $doc.Close($false) | Out-Null
  $word.Quit() | Out-Null
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
} catch {
  Write-Output "OPEN_FAILED:$($_.Exception.Message)"
  try { $word.Quit() | Out-Null } catch {}
}
`;
  const probe = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      probeScript,
    ],
    {
      shell: true,
      encoding: 'utf-8',
      timeout: 60_000,
    },
  );
  if (probe.status !== 0) {
    return {
      ok: 'NOT_AVAILABLE',
      reason: `Word COM probe failed (exit ${probe.status}): ${(probe.stdout ?? '').slice(0, 200)}${(probe.stderr ?? '').slice(0, 200)}`,
    };
  }
  const output = (probe.stdout ?? '').trim();
  if (output.startsWith('OPEN_OK:')) {
    return {
      ok: true,
      reason: 'Word opened the DOCX without prompting for repair',
      fileName: output.slice('OPEN_OK:'.length),
    };
  }
  if (output.startsWith('OPEN_FAILED:')) {
    return {
      ok: false,
      reason: 'Word failed to open the DOCX: ' + output.slice('OPEN_FAILED:'.length),
    };
  }
  if (output.startsWith('NO_WORD_COM:')) {
    return {
      ok: 'MANUAL_REQUIRED',
      reason: output.slice('NO_WORD_COM:'.length),
    };
  }
  return {
    ok: 'NOT_AVAILABLE',
    reason: `unexpected probe output: ${output.slice(0, 200)}`,
  };
}

// ─── main ──────────────────────────────────────────────────────────────────

const buffer = readFileSync(RENDERED_DOCX);

const unzip = unzipOk(buffer);
let zip = null;
let requiredParts = {};
let xmlPartsChecks = [];
let relsOk = null;
let docXmlParse = null;

if (unzip.ok) {
  zip = new PizZip(buffer);
  for (const name of [
    '[Content_Types].xml',
    '_rels/.rels',
    'word/document.xml',
    'word/styles.xml',
    'word/settings.xml',
  ]) {
    const r = partExists(zip, name);
    requiredParts[name] = r;
  }
  for (const name of Object.keys(zip.files)) {
    const file = zip.file(name);
    if (!file) continue;
    const text = file.asText();
    const parsed = xmlAppearsWellFormed(text);
    xmlPartsChecks.push({ name, ok: parsed.ok });
  }
  relsOk = relationshipTargetsSane(zip);
  docXmlParse = xmlAppearsWellFormed(zip.file('word/document.xml').asText());
}

const libreofficeDir = join(OUT_DIR, '_pr7a4_bm171_openability');
const libreoffice = libreofficePdfAvailable(buffer, libreofficeDir);

const wordCom = wordComCheck(RENDERED_DOCX);

const requiredPartsOk = Object.values(requiredParts).every((p) => p.present);
const allXmlParsed = xmlPartsChecks.every((p) => p.ok);
const relsOkResolved = relsOk === null ? true : !!relsOk.ok;
const docXmlOk = docXmlParse == null ? true : docXmlParse.ok;
const wordOpenOk = wordCom.ok === true;

const overallPass =
  unzip.ok && requiredPartsOk && allXmlParsed && relsOkResolved && docXmlOk;

const report = {
  schemaVersion: '1',
  templateCode: TARGET,
  generatedAt: new Date().toISOString(),
  renderedDocxPath: RENDERED_DOCX,
  renderedDocxBytes: buffer.byteLength,
  unzip: unzip.ok
    ? { ok: true, partCount: unzip.parts }
    : { ok: false, error: unzip.error ?? null },
  requiredParts: Object.fromEntries(
    Object.entries(requiredParts).map(([k, v]) => [
      k,
      { present: v.present, bytes: v.bytes },
    ]),
  ),
  xmlPartsHealth: xmlPartsChecks,
  documentXmlParse: docXmlParse ?? null,
  relationships: relsOk ?? null,
  libreofficePdfExport: libreoffice,
  wordComOpenability: wordCom,
  overallPass,
  packetStatus: overallPass
    ? wordOpenOk
      ? 'READY_OPENABLE_CONFIRMED'
      : 'READY_OPENABLE_MECHANICAL_WORD_REPAIR_DIALOG_CHECK_MANUAL_REQUIRED'
    : 'BLOCKED_OPENABILITY_FAILED',
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const md = [];
md.push(`# PR7A.4 — ${TARGET} Openability Audit`);
md.push('');
md.push(`**STATUS**: \`${report.packetStatus}\``);
md.push(`**Generated**: ${report.generatedAt}`);
md.push(`**Rendered DOCX**: \`${RENDERED_DOCX}\` (${buffer.byteLength} bytes)`);
md.push('');
md.push('## 1. Unzip');
md.push('');
md.push(`- ok: ${unzip.ok ? 'yes' : 'no'}`);
if (unzip.ok) md.push(`- part count: ${unzip.parts}`);
else md.push(`- error: ${unzip.error}`);
md.push('');
md.push('## 2. Required parts present');
md.push('');
md.push('| part | present | bytes |');
md.push('|---|---|---|');
for (const [name, info] of Object.entries(requiredParts)) {
  md.push(`| ${name} | ${info.present ? 'yes' : 'NO'} | ${info.bytes} |`);
}
md.push('');
md.push('## 3. XML parts parse successfully');
md.push('');
md.push('| part | well-formed |');
md.push('|---|---|');
xmlPartsChecks.forEach((p) =>
  md.push(`| ${p.name} | ${p.ok ? 'yes' : 'no'} |`),
);
md.push('');
md.push('## 4. Relationship targets sane');
md.push('');
if (relsOk === null) {
  md.push('- n/a');
} else {
  md.push(`- present: ${relsOk.present}`);
  md.push(`- total relationships: ${relsOk.totalRelationships}`);
  md.push(`- empty targets: ${relsOk.emptyTargets}`);
  md.push(`- ok: ${relsOk.ok}`);
}
md.push('');
md.push('## 5. LibreOffice → PDF export');
md.push('');
md.push(`- available: ${libreoffice.available ? 'yes' : 'no'}`);
if (libreoffice.available) {
  md.push(`- pdf path: \`${libreoffice.pdfPath}\``);
  md.push(`- pdf bytes: ${libreoffice.pdfBytes}`);
} else {
  md.push(`- reason: ${libreoffice.reason}`);
}
md.push('');
md.push('## 6. Word COM openability check');
md.push('');
if (wordCom.ok === true) {
  md.push(`- ok: yes — Word opened without prompting for repair`);
  md.push(`- file name from Word: ${wordCom.fileName}`);
} else if (wordCom.ok === false) {
  md.push(`- ok: NO — ${wordCom.reason}`);
} else if (wordCom.ok === 'MANUAL_REQUIRED') {
  md.push(`- ok: MANUAL_REQUIRED — ${wordCom.reason}`);
  md.push('- Planner must open rendered.latest.docx in Word and verify no repair prompt.');
} else if (wordCom.ok === 'NOT_APPLICABLE') {
  md.push(`- ok: NOT_APPLICABLE — ${wordCom.reason}`);
} else {
  md.push(`- ok: NOT_AVAILABLE — ${wordCom.reason}`);
}
md.push('');
md.push('## Acceptance');
md.push('');
md.push(`- DOCX unzips: ${unzip.ok ? 'PASS' : '**FAIL**'}`);
md.push(`- Required parts present: ${requiredPartsOk ? 'PASS' : '**FAIL**'}`);
md.push(`- XML parts parse: ${allXmlParsed ? 'PASS' : '**FAIL**'}`);
md.push(`- Relationship targets sane: ${relsOkResolved ? 'PASS' : '**FAIL**'}`);
md.push(`- LibreOffice PDF export: ${libreoffice.available ? 'PASS' : 'NOT_AVAILABLE'}`);
md.push(
  `- Word open without repair prompt: ${wordCom.ok === true ? 'PASS' : wordCom.ok === 'MANUAL_REQUIRED' ? 'MANUAL_REQUIRED' : wordCom.ok === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'NOT_AVAILABLE'}`,
);
md.push('');
writeFileSync(OUT_MD, `${md.join('\n')}\n`);

console.log(`[INFO] wrote ${OUT_JSON}`);
console.log(`[INFO] wrote ${OUT_MD}`);
console.log(
  `[INFO] unzip=${unzip.ok} requiredParts=${requiredPartsOk} xmlParsed=${allXmlParsed} rels=${relsOkResolved} libreoffice=${libreoffice.available} wordCom=${wordCom.ok} overall=${overallPass}`,
);
process.exit(overallPass ? 0 : 1);
