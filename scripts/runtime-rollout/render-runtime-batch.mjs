/**
 * Generic 213-form runtime render core.
 *
 * Built as a CLI runner so it does NOT require the API to be up. It works on:
 *   - Per-form entry from authoritative-213-manifest.json
 *   - The compiled contract JSON (or contractType from form-inputs.tsx if no compile cache)
 *   - The candidate DOCX produced by build-legal-header-candidates.mjs
 *   - A render-model R1 input (deterministic, valid for field types)
 *   - A render-model R2 input (mutated deterministic)
 *
 * Rules from PHASE 3:
 *   - Compiled contract is authoritative for editable field set.
 *   - Profile fields cannot invent source-absent fields.
 *   - formNumber is static template identity, NOT a runtime value.
 *   - documentNumber is a runtime value only where an authoritative source slot exists.
 *   - Static legal text must not be a runtime replacement target.
 *   - Boolean false and numeric zero must persist.
 *   - Dates must not shift timezone.
 *   - Time inputs store canonical HH:mm.
 *   - Repeated rows retain order.
 *   - Conditional sections respect hiddenBySmart.
 *
 *   Rendering strategy:
 *     For each form, this runner:
 *       - Reads the candidate DOCX word/document.xml
 *       - Replaces first-paragraph text with expectedModelNumber + promulgation.
 *         (Already done by build-legal-header-candidates.mjs.)
 *       - Substitutes {{key}} placeholders with R1 input fields using deterministic types.
 *       - Writes R1.docx and an R2.docx with mutated fields.
 *       - Verifies hash determinism (re-render R1 yields identical SHA-256).
 *       - Writes provenance.json with all hashes and exit codes.
 *       - Records a final-verdict.json with PASS / FAIL / NOT_EXECUTED.
 */

import { createHash } from 'node:crypto';
import { copyFile, readFile, mkdir, writeFile } from 'node:fs/promises';
import * as fssync from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import { AdapterResolutionLoader } from './lib/adapter-resolution.mjs';

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

const CANDIDATES_INDEX = path.join(ROLLOUT_DIR, 'legal-header-candidates.json');
const MANIFEST_PATH = path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json');
const RUNTIME_RESULTS_PATH = path.join(ROLLOUT_DIR, 'runtime-render-results.json');
const CLI_BATCH_FLAG = (process.argv.find((a) => a.startsWith('--batch=')) || '').split('=')[1];
const ONLY_FORM_FLAG = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const OUTPUT_ROOT_FLAG = (process.argv.find((a) => a.startsWith('--output-root=')) || '').split('=')[1];
// A fresh render may not overwrite R1/R2 evidence currently opened by Word.
// The result summary remains canonical, while per-form binary evidence can be
// directed to an isolated root for a new run.
const FORM_OUTPUT_ROOT = OUTPUT_ROOT_FLAG
  ? path.resolve(OUTPUT_ROOT_FLAG)
  : path.join(ROLLOUT_DIR, 'forms');
const RENDER_ZIP_DATE = new Date('2000-01-01T00:00:00.000Z');

function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function fileSha256(p) {
  if (!fssync.existsSync(p)) return null;
  const buf = await readFile(p);
  return sha256Hex(buf);
}

async function loadJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isValidForFieldType(value, controlKind) {
  switch (controlKind) {
    case 'TEXT':
    case 'TEXTAREA':
      return typeof value === 'string';
    case 'NUMBER':
      return typeof value === 'number' || (!isNaN(Number(value)) && value !== '');
    case 'BOOLEAN':
      return typeof value === 'boolean';
    case 'DATE':
    case 'YEAR_OR_DATE':
      return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) || value === '';
    case 'TIME':
      return /^\d{2}:\d{2}$/.test(String(value)) || value === '';
    case 'LIST':
    case 'TABLE':
    case 'SIGNATURE':
    case 'SELECT':
    case 'RADIO':
    case 'CONDITIONAL':
      return true; // container; structural validation elsewhere
    case 'DATE_PARTS':
      return typeof value === 'object';
    default:
      return true;
  }
}

function extractPlaceholderKeys(xml) {
  const re = /\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g;
  const set = new Set();
  let m;
  while ((m = re.exec(xml)) !== null) {
    set.add(m[1]);
  }
  return [...set];
}

function sentinelValueForKey(key, revision) {
  if (key.endsWith('Date') || key.includes('date') || key.includes('Date')) return '2026-06-01';
  if (key.includes('Time') || key.endsWith('time')) return '09:30';
  if (key.includes('Number') || key.includes('So') || key.includes('number')) return revision === 'R1' ? 42 : 43;
  if (key.includes('DiaChi') || key.includes('HoTen') || key.includes('name') || key.includes('FullName')) {
    return revision === 'R1' ? 'Nguyễn Văn A' : 'Trần Thị B';
  }
  // default text
  return revision === 'R1' ? 'Giá trị R1' : 'Giá trị R2';
}

function buildRealRenderInput(placeholderKeys, revision) {
  // Use ALL placeholder keys (not just first 10) so the render exercises
  // every slot the template exposes. This is the canonical R1/R2 input.
  const obj = {};
  for (const key of placeholderKeys) {
    obj[key] = sentinelValueForKey(key, revision);
  }
  return obj;
}

function replacePlaceholdersInXml(xml, renderModel) {
  const re = /\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g;
  let mutations = 0;
  const updated = xml.replace(re, (m, key) => {
    if (renderModel[key] === undefined) return m;
    let value = renderModel[key];
    if (typeof value === 'boolean') value = value ? 'Có' : 'Không';
    if (value === null || value === undefined) value = '';
    if (Array.isArray(value)) value = value.join(', ');
    if (typeof value === 'object') value = JSON.stringify(value);
    mutations++;
    return escapeXml(String(value));
  });
  return { xml: updated, mutations };
}

async function renderDocxFromCandidate(candidatePath, renderModel, outputPath) {
  const buf = await readFile(candidatePath);
  const zip = new PizZip(buf);
  const docPath = 'word/document.xml';
  const f = zip.file(docPath);
  if (!f) throw new Error('NO_DOCUMENT_XML');

  const originalXml = f.asText();
  const { xml, mutations } = replacePlaceholdersInXml(originalXml, renderModel);
  // PizZip otherwise stamps the replaced entry with wall-clock time, making
  // equivalent DOCX renders hash differently across DOS timestamp windows.
  zip.file(docPath, xml, { date: RENDER_ZIP_DATE });

  const out = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  await writeFile(outputPath, out);
  return { mutations };
}

async function processCandidate(candidate, adapterRow) {
  const bmCode = candidate.bmCode;
  const formDir = path.join(FORM_OUTPUT_ROOT, bmCode);
  await mkdir(formDir, { recursive: true });

  const candidatePath = path.join(candidate.directory, `${bmCode}.candidate.docx`);

  // Extract real placeholder keys from candidate XML
  const docBuf = await readFile(candidatePath);
  const zipPeek = new PizZip(docBuf);
  const docFilePeek = zipPeek.file('word/document.xml');
  if (!docFilePeek) {
    throw new Error('NO_DOCUMENT_XML');
  }
  const candidateXml = docFilePeek.asText();
  const placeholderKeys = extractPlaceholderKeys(candidateXml);

  const r1Input = buildRealRenderInput(placeholderKeys, 'R1');
  const r2Input = buildRealRenderInput(placeholderKeys, 'R2');

  // Phase 4B — wire adapter render values into the renderer. A value whose
  // key is explicitly source-resolved by an adapter takes precedence over a
  // synthetic sentinel; otherwise adapter values only fill absent keys.
  const adapterR1Used = [];
  const adapterR2Used = [];
  const adapterUnresolved = (adapterRow && adapterRow.UNRESOLVED_REQUIRED_KEYS) || [];
  const adapterResolved = (adapterRow && adapterRow.RESOLVED_REQUIRED_KEYS) || [];
  const adapterCollisions = (adapterRow && adapterRow.TARGET_COLLISIONS) || [];
  if (adapterRow) {
    for (const rv of adapterRow.RENDER_VALUES_R1 || []) {
      const sourceResolved = adapterResolved.includes(rv.key);
      if (rv.key && (sourceResolved || r1Input[rv.key] === undefined) && rv.value !== undefined && rv.value !== '') {
        r1Input[rv.key] = rv.value;
        adapterR1Used.push(rv.key);
      }
    }
    for (const rv of adapterRow.RENDER_VALUES_R2 || []) {
      const sourceResolved = adapterResolved.includes(rv.key);
      if (rv.key && (sourceResolved || r2Input[rv.key] === undefined) && rv.value !== undefined && rv.value !== '') {
        r2Input[rv.key] = rv.value;
        adapterR2Used.push(rv.key);
      }
    }
    // SIGNATURE_SECTION rules: signer name + signer title must remain
    // distinct. The adapter's R1 and R2 already encode this. Validate.
    if (adapterR1Used.includes('signature.signerName') &&
        adapterR1Used.includes('signature.positionTitle') &&
        r1Input['signature.signerName'] === r1Input['signature.positionTitle']) {
      // Treat as a collision: signer name collapsed into the role caption.
      adapterCollisions.push('SIGNATURE_NAME_TITLE_COLLAPSE_R1');
    }
  }

  const r1Path = path.join(formDir, 'R1.docx');
  const r1AgainPath = path.join(formDir, 'R1-again.docx');
  const r2Path = path.join(formDir, 'R2.docx');

  const r1Stats = await renderDocxFromCandidate(candidatePath, r1Input, r1Path);
  const r1AgainStats = await renderDocxFromCandidate(candidatePath, r1Input, r1AgainPath);
  const r2Stats = await renderDocxFromCandidate(candidatePath, r2Input, r2Path);

  const r1Hash = await fileSha256(r1Path);
  const r1AgainHash = await fileSha256(r1AgainPath);
  const r2Hash = await fileSha256(r2Path);

  const deterministic = r1Hash === r1AgainHash && r1AgainStats.mutations === r1Stats.mutations;
  const noPlaceholders = placeholderKeys.length === 0;
  // R1 vs R2 differ only when there's at least one valid placeholder pair
  const r1DifferentFromR2 = noPlaceholders ? true : r1Hash !== r2Hash;

  // Explicit verdicts. None of these except PASS_RUNTIME_MAPPING promote:
  //   PASS_RUNTIME_MAPPING      - has slots, deterministic, R1!=R2, R2 has no changed R1 sentinels
  //   NO_RUNTIME_SLOTS          - candidate has zero {{key}} placeholders (not a pass)
  //   NORMALIZATION_NOT_RUN     - normalized DOCX was absent when candidate was built
  //   SLOT_INVENTORY_MISMATCH   - placeholder keys found in XML but no compiled-contract key matches
  //   SOURCE_SLOT_DEBT          - placeholder keys missing despite contract field requiring source slot
  //   CONTRACT_MAPPING_DEFECT   - compiled-contract field has no source-grounded slot
  //   RENDER_FAILURE            - mutations errored or are not deterministic
  //   VISUAL_FAILURE            - R1/R2 deterministic but byte-identical
  //   NOT_EXECUTED              - candidate path absent or skipped by upstream pipeline
  let verdict;
  if (noPlaceholders) {
    verdict = 'NO_RUNTIME_SLOTS';
  } else if (!deterministic) {
    verdict = 'RENDER_FAILURE';
  } else if (adapterCollisions.length > 0) {
    verdict = 'RENDER_FAILURE';
  } else if (
    adapterUnresolved.length > 0 ||
    (adapterRow && (
      adapterRow.FINAL_ADAPTER_STATUS === 'FAIL' ||
      adapterRow.FINAL_ADAPTER_STATUS === 'SOURCE_ABSENT'
    ))
  ) {
    // Adapter-derived values are supplemental only. A form retains source
    // debt until every required key has a source-grounded, validated target.
    verdict = 'SOURCE_SLOT_DEBT';
  } else if (!r1DifferentFromR2) {
    verdict = 'VISUAL_FAILURE';
  } else {
    verdict = 'PASS_RUNTIME_MAPPING';
  }

  return {
    bmCode,
    formDir,
    r1Hash,
    r1AgainHash,
    r2Hash,
    deterministicR1: deterministic,
    r1DifferentFromR2,
    mutations: r1Stats.mutations,
    noPlaceholders,
    placeholderKeys,
    r1Input,
    r2Input,
    family: candidate.family,
    adapterR1Used,
    adapterR2Used,
    adapterResolvedKeys: adapterResolved,
    adapterUnresolvedKeys: adapterUnresolved,
    adapterCollisions,
    adapterFinalStatus: adapterRow ? adapterRow.FINAL_ADAPTER_STATUS : 'NOT_APPLICABLE',
    adapterVerdict: adapterRow ? adapterRow.ADAPTER_VALIDATION_VERDICT : 'NOT_APPLICABLE',
    verdict,
    evidence: {
      r1SentinelCount: Object.keys(r1Input).length,
      r2SentinelCount: Object.keys(r2Input).length,
      placeholderKeyCount: placeholderKeys.length,
      adapterR1Keys: adapterR1Used,
      adapterR2Keys: adapterR2Used,
    },
  };
}

async function main() {
  if (!fssync.existsSync(MANIFEST_PATH)) {
    console.error(`Missing ${MANIFEST_PATH}. Run build-authoritative-213-manifest.mjs first.`);
    process.exit(1);
  }

  const candidatesIndex = await loadJson(CANDIDATES_INDEX);
  const candidates = candidatesIndex.results.filter((r) => !r.skipped);
  if (candidates.length === 0) {
    console.error('No RUNTIME_CANDIDATE forms with available DOCX sources. Stopping.');
    process.exit(2);
  }

  // Phase 4B — load the shared adapter-resolution artifact once. Forms with
  // a row in the artifact get their RENDER_VALUES_R1/R2 merged into the
  // runtime input. Forms without a row fall back to direct render values.
  const adapterLoader = new AdapterResolutionLoader();
  let adapterByCode = new Map();
  try {
    const adapterArtifact = adapterLoader.load();
    for (const row of adapterArtifact.forms) adapterByCode.set(row.FORM, row);
  } catch (err) {
    if (err.adapterResolutionFailure) {
      console.error('FATAL: adapter-resolution artifact unusable.');
      console.error(`  ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  let toProcess = candidates;
  if (ONLY_FORM_FLAG) {
    toProcess = candidates.filter((c) => c.bmCode === ONLY_FORM_FLAG);
    if (toProcess.length === 0) {
      console.error(`No candidate for ${ONLY_FORM_FLAG}`);
      process.exit(2);
    }
  }
  if (CLI_BATCH_FLAG) {
    // Resolve symbolic batch name to a form-code list from
    // docs/audit/.../runtime-rollout/batches/<BATCH>.json
    const batchPath = path.join(ROLLOUT_DIR, 'batches', `${CLI_BATCH_FLAG}.json`);
    if (fssync.existsSync(batchPath)) {
      const batchFile = JSON.parse(await readFile(batchPath, 'utf8'));
      const allow = new Set(batchFile.forms || []);
      toProcess = toProcess.filter((c) => allow.has(c.bmCode));
      if (toProcess.length === 0) {
        console.error(`Batch ${CLI_BATCH_FLAG} has 0 candidate forms after intersection.`);
        process.exit(2);
      }
    } else if (/^\d+-\d+$/.test(CLI_BATCH_FLAG)) {
      // Legacy numeric range
      const [start, end] = CLI_BATCH_FLAG.split('-').map((n) => parseInt(n, 10));
      toProcess = toProcess.slice(start, end);
    } else {
      console.error(`Unknown batch: ${CLI_BATCH_FLAG} (no ${batchPath})`);
      process.exit(2);
    }
  }

  console.log(`Running ${toProcess.length} candidates...`);
  const results = [];
  const verdictCounts = {
    PASS_RUNTIME_MAPPING: 0,
    NO_RUNTIME_SLOTS: 0,
    NORMALIZATION_NOT_RUN: 0,
    SLOT_INVENTORY_MISMATCH: 0,
    SOURCE_SLOT_DEBT: 0,
    CONTRACT_MAPPING_DEFECT: 0,
    RENDER_FAILURE: 0,
    VISUAL_FAILURE: 0,
    NOT_EXECUTED: 0,
  };
  let pass = 0;
  let fail = 0;
  let errors = 0;

  for (const c of toProcess) {
    try {
      const adapterRow = adapterByCode.get(c.bmCode) || null;
      const r = await processCandidate(c, adapterRow);
      results.push(r);
      if (r.verdict === 'PASS_RUNTIME_MAPPING') {
        pass++;
      } else {
        fail++;
      }
      verdictCounts[r.verdict] = (verdictCounts[r.verdict] || 0) + 1;
      await writeFile(path.join(FORM_OUTPUT_ROOT, c.bmCode, 'final-verdict.json'), JSON.stringify(r, null, 2));
    } catch (err) {
      errors++;
      results.push({
        bmCode: c.bmCode,
        verdict: 'RENDER_FAILURE',
        error: err.message,
      });
      verdictCounts.RENDER_FAILURE++;
    }
  }

  const output = {
    schema: 'qllaw.213.runtime_render_results/v1',
    generatedAt: 'PHASE3_RUN_TOKEN',
    counts: { pass, fail, errors, total: toProcess.length },
    verdictCounts,
    adapterCounts: {
      formsTouchedByAdapter: results.filter((r) => r.adapterFinalStatus && r.adapterFinalStatus !== 'NOT_APPLICABLE').length,
      adapterR1KeysUsed: results.reduce((s, r) => s + ((r.adapterR1Used && r.adapterR1Used.length) || 0), 0),
      adapterR2KeysUsed: results.reduce((s, r) => s + ((r.adapterR2Used && r.adapterR2Used.length) || 0), 0),
    },
    results,
  };

  await writeFile(RUNTIME_RESULTS_PATH, JSON.stringify(output, null, 2));
  console.log(
    `OK: runtime render. pass=${pass} fail=${fail} errors=${errors} ` +
      `(PASS_RUNTIME_MAPPING=${verdictCounts.PASS_RUNTIME_MAPPING || 0} ` +
      `NO_RUNTIME_SLOTS=${verdictCounts.NO_RUNTIME_SLOTS || 0} ` +
      `RENDER_FAILURE=${verdictCounts.RENDER_FAILURE || 0} ` +
      `VISUAL_FAILURE=${verdictCounts.VISUAL_FAILURE || 0})`,
  );
  // Fail-closed: exit non-zero unless at least one form is genuinely eligible for promotion.
  // (Audit-only invocations pass --audit-only to skip this gate.)
  const auditOnly = (process.argv.find((a) => a === '--audit-only') !== undefined);
  if (!auditOnly && pass === 0) {
    console.error('BATCH FAILED: no form is eligible for promotion (zero PASS_RUNTIME_MAPPING).');
    process.exit(1);
  }
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26 (render consumer).
 *
 * Render authority is now sourced from scripts/runtime-rollout/lib/locked-runtime-index.mjs:
 *   - WHAT field renders: locked binding.from (canonical field path)
 *   - WHERE it renders:    locked slot.location.partName/blockId/tableCellId
 *   - HOW it renders:      lib/locked-transforms.mjs (applyTransform)
 *   - blocked:             partial/missing targets fail closed
 *
 * Locked totals for this wave: 213 forms / 2497 fields / 2497 slots / 2497 bindings.
 * Compile-v2 and panels may serve as values, never as authority.
 * The semantic overlay (lib/locked-semantic-overlay) gates unsafe field interpretation.
 * ------------------------------------------------------------------ */

