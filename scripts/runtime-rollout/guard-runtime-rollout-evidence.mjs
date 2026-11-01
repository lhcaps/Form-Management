/**
 * A8 runtime-rollout evidence guard (standalone).
 *
 * Validates the author-generated runtime-rollout evidence directory against the
 * canonical invariants. Used for:
 *   - the A8 mutation suite's positive baseline + per-mutation evaluation, and
 *   - standalone invocation from CI / operator scripts.
 *
 * CLI:
 *   node scripts/runtime-rollout/guard-runtime-rollout-evidence.mjs \
 *     --evidence-dir <path> \
 *     --repo-root <path> \
 *     [--json] [--quiet]
 *
 * Exit codes:
 *   0 = PASS, all invariants hold against the supplied evidence.
 *   1 = FAIL, one or more invariants were violated (errors printed to stderr).
 *   2 = USAGE, CLI arguments were missing or malformed.
 *   3 = ENVIRONMENT, --evidence-dir does not exist or is unreadable.
 *
 * The script never mutates source files or evidence; it is read-only.
 */

import { readFile, stat } from 'node:fs/promises';
import * as fssync from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    evidenceDir: null,
    repoRoot: null,
    json: false,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--evidence-dir') opts.evidenceDir = argv[++i];
    else if (a === '--repo-root') opts.repoRoot = argv[++i];
    else if (a === '--json') opts.json = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function printHelp() {
  console.log(
    [
      'Usage: node guard-runtime-rollout-evidence.mjs \\',
      '         --evidence-dir <path> --repo-root <path> [--json] [--quiet]',
      '',
      'Exits 0 on PASS, 1 on invariant failure, 2 on usage error, 3 on environment error.',
    ].join('\n'),
  );
}

function failUsage(message) {
  console.error(`USAGE: ${message}`);
  process.exit(2);
}

async function resolveEvidenceDir(value) {
  if (typeof value !== 'string' || value.length === 0) {
    failUsage('--evidence-dir is required and must be a non-empty path');
  }
  let abs;
  try {
    abs = path.resolve(value);
  } catch (e) {
    failUsage(`--evidence-dir is not a valid path: ${value} (${e.message})`);
  }
  try {
    const st = await stat(abs);
    if (!st.isDirectory()) {
      console.error(`ENVIRONMENT: --evidence-dir is not a directory: ${abs}`);
      process.exit(3);
    }
  } catch (e) {
    console.error(`ENVIRONMENT: --evidence-dir is not accessible: ${abs} (${e.message})`);
    process.exit(3);
  }
  return abs;
}

function resolveRepoRoot(value) {
  if (typeof value !== 'string' || value.length === 0) {
    failUsage('--repo-root is required and must be a non-empty path');
  }
  return path.resolve(value);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJson(absPath) {
  const buf = await readFile(absPath, 'utf8');
  try {
    return JSON.parse(buf);
  } catch (e) {
    throw new Error(`JSON parse failed at ${absPath}: ${e.message}`);
  }
}

function pushIfMissing(errors, condition, message) {
  if (condition) errors.push(message);
}

function pushIfPresent(errors, condition, message) {
  if (!condition) errors.push(message);
}

// ---------------------------------------------------------------------------
// Panel codes (canonical 213-form registry)
// ---------------------------------------------------------------------------

async function readPanelCodeList(repoRoot) {
  const file = path.join(
    repoRoot,
    'apps',
    'web',
    'src',
    'lib',
    'generated',
    'bm-panel-codes.generated.ts',
  );
  let buf;
  try {
    buf = await readFile(file, 'utf8');
  } catch (e) {
    return { codes: [], error: `bm-panel-codes.generated.ts unreadable: ${e.message}` };
  }
  const codes = [];
  const seen = new Set();
  const re = /"BM-\d{3}"/g;
  let m;
  while ((m = re.exec(buf)) !== null) {
    const code = m[0].slice(1, -1);
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return { codes };
}

async function readBridgeEligibilityCodes(repoRoot) {
  const file = path.join(
    repoRoot,
    'packages',
    'form-contracts',
    'src',
    'bridge-eligibility.ts',
  );
  let buf;
  try {
    buf = await readFile(file, 'utf8');
  } catch (e) {
    return { isAlias: false, codes: new Set(), error: e.message };
  }
  const isAlias = /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*RUNTIME_READY_FORM_CODES/.test(buf);
  const arrayMatch = buf.match(
    /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/,
  );
  const inner = arrayMatch && arrayMatch[1];
  const codes = inner
    ? [...new Set((inner.match(/'BM-\d{3}'/g) || []).map((s) => s.slice(1, -1)))]
    : [];
  return { isAlias, codes: new Set(codes) };
}

// ---------------------------------------------------------------------------
// Invariant checks
// ---------------------------------------------------------------------------

async function checkManifest(evidenceDir, expectedCodes, errors) {
  const file = path.join(evidenceDir, 'authoritative-213-manifest.json');
  let manifest;
  try {
    manifest = await readJson(file);
  } catch (e) {
    errors.push(`authoritative-213-manifest missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, manifest?.schema !== 'qllaw.213.authoritative_manifest/v1',
    `authoritative-213-manifest: schema mismatch (got ${manifest?.schema})`);
  pushIfMissing(errors, !manifest?.entries || manifest.entries.length !== 213,
    `authoritative-213-manifest: entries.length != 213 (got ${manifest?.entries?.length ?? 0})`);
  if (manifest?.entries) {
    const set = new Set(manifest.entries.map((e) => e.FORM_CODE));
    let missing = 0;
    for (const c of expectedCodes) if (!set.has(c)) missing++;
    pushIfMissing(errors, missing > 0, `authoritative-213-manifest missing ${missing} expected BM codes`);

    const seen = new Set();
    let dup = 0;
    for (const e of manifest.entries) {
      if (seen.has(e.FORM_CODE)) dup++;
      seen.add(e.FORM_CODE);
    }
    pushIfMissing(errors, dup > 0, `authoritative-213-manifest has ${dup} duplicate codes`);
  }
  return manifest;
}

async function checkReadinessMatrix(evidenceDir, expectedCodes, errors) {
  const file = path.join(evidenceDir, 'render-readiness-213-matrix.json');
  let readiness;
  try {
    readiness = await readJson(file);
  } catch (e) {
    errors.push(`render-readiness-213-matrix missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, readiness?.rows?.length !== 213,
    `render-readiness-213-matrix: rows.length != 213 (got ${readiness?.rows?.length ?? 0})`);
  if (readiness?.rows) {
    const rSet = new Set(readiness.rows.map((r) => r.formCode));
    let rMissing = 0;
    for (const c of expectedCodes) if (!rSet.has(c)) rMissing++;
    pushIfMissing(errors, rMissing > 0, `render-readiness-213-matrix missing ${rMissing} codes`);

    const uniqueCodes = new Set(readiness.rows.map((r) => r.formCode));
    pushIfMissing(errors, readiness.rows.length === 213 && uniqueCodes.size !== 213,
      `render-readiness-213-matrix: rows=213 but unique codes=${uniqueCodes.size} (duplicate-row mask)`);
  }
  return readiness;
}

async function checkRuntimeResults(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'runtime-render-results.json');
  let runtime;
  try {
    runtime = await readJson(file);
  } catch (e) {
    errors.push(`runtime-render-results missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !runtime?.schema || runtime.schema !== 'qllaw.213.runtime_render_results/v1',
    `runtime-render-results: schema mismatch (got ${runtime?.schema})`);
  const verdicts = (runtime?.results || []).map((r) => r.verdict);
  const notExecutedCount = verdicts.filter((v) => v === 'NOT_EXECUTED').length;
  const unavailableCount = verdicts.filter((v) => v === 'UNAVAILABLE').length;
  const failCount = verdicts.filter((v) => v === 'FAIL').length;
  const noSlotsCount = verdicts.filter((v) => v === 'NO_RUNTIME_SLOTS').length;
  const realPass = verdicts.filter(
    (v) => v === 'PASS' || v === 'PASS_WITH_P2' || v === 'PASS_RUNTIME_MAPPING',
  ).length;
  pushIfMissing(errors, runtime?.counts && runtime.counts.pass !== realPass,
    `runtime-render-results: counts.pass=${runtime?.counts?.pass} != actual PASS verdicts=${realPass} ` +
    `(NOT_EXECUTED=${notExecutedCount} UNAVAILABLE=${unavailableCount} FAIL=${failCount})`);

  // M05 catch-all: when counts.pass == total, the actual pass count must
  // equal counts.total (already covered above). The additional invariant is
  // that NO_RUNTIME_SLOTS forms must not silently inflate counts.pass.
  pushIfMissing(errors, runtime?.counts && runtime.counts.pass === runtime.counts.total
      && noSlotsCount > 0,
    `runtime-render-results: NO_RUNTIME_SLOTS=${noSlotsCount} but counts.pass == total`);

  // verdictCounts integrity: sum must equal results.length.
  if (runtime?.verdictCounts) {
    const sum = Object.values(runtime.verdictCounts).reduce((a, b) => a + (b || 0), 0);
    pushIfMissing(errors, sum !== (runtime.results?.length || 0),
      `runtime-render-results: verdictCounts sum=${sum} != results.length=${runtime.results?.length || 0}`);
  }

  // Required render keys (M15): every PASS_RUNTIME_MAPPING form must have a
  // non-empty render-input model (either r1SentinelCount>0 or r1Input non-empty).
  if (runtime?.results) {
    for (const r of runtime.results) {
      if (r.verdict !== 'PASS_RUNTIME_MAPPING') continue;
      const cnt = r.evidence ? r.evidence.r1SentinelCount : Object.keys(r.r1Input || {}).length;
      pushIfMissing(errors, !cnt,
        `runtime-render-results: ${r.bmCode} marked PASS_RUNTIME_MAPPING but r1Input/evidence empty`);
    }
  }
  // M18 invariant: PASS_RUNTIME_MAPPING implies R1!=R2 and deterministic R1.
  if (runtime?.results) {
    for (const r of runtime.results) {
      if (r.verdict !== 'PASS_RUNTIME_MAPPING') continue;
      pushIfMissing(errors, r.r1DifferentFromR2 === false,
        `runtime-render-results: ${r.bmCode} PASS_RUNTIME_MAPPING but R1==R2`);
      pushIfMissing(errors, r.deterministicR1 === false,
        `runtime-render-results: ${r.bmCode} PASS_RUNTIME_MAPPING but R1 not deterministic`);
    }
  }

  // M47: runtime-render-results counts.pass must never exceed the form count.
  if (runtime?.counts) {
    pushIfMissing(errors, runtime.counts.pass > 213,
      `runtime-render-results: counts.pass=${runtime.counts.pass} exceeds 213 forms`);
  }
  // M48: verdictCounts totals must not sum past results.length.
  if (runtime?.verdictCounts) {
    const sum = Object.values(runtime.verdictCounts).reduce((a, b) => a + (b || 0), 0);
    pushIfMissing(errors, sum > 213,
      `runtime-render-results: verdictCounts sum=${sum} > 213`);
  }
  // M49: duplicate bmCode entries in results.
  if (runtime?.results) {
    const seen = new Set();
    const dups = [];
    for (const r of runtime.results) {
      if (!r.bmCode) continue;
      if (seen.has(r.bmCode)) dups.push(r.bmCode);
      seen.add(r.bmCode);
    }
    pushIfMissing(errors, dups.length > 0,
      `runtime-render-results: duplicate primary verdict rows for ${[...new Set(dups)].join(',')}`);
  }
  // M43 catch: a form marked PASS_RUNTIME_MAPPING with empty contract keys
  // is a stub form that was promoted without a contract.
  if (runtime?.results) {
    for (const r of runtime.results) {
      if (r.verdict !== 'PASS_RUNTIME_MAPPING') continue;
      const keys = r.placeholderKeys || r.contractKeys
        || (r.evidence && (r.evidence.placeholderKeys || r.evidence.contractKeys))
        || [];
      pushIfMissing(errors, Array.isArray(keys) && keys.length === 0 && !r.noPlaceholders,
        `runtime-render-results: ${r.bmCode} PASS_RUNTIME_MAPPING but placeholderKeys/contractKeys is empty (stub form)`);
    }
  }
  return runtime;
}

async function checkVisualResults(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'libreoffice-visual-results.json');
  let visual;
  try {
    visual = await readJson(file);
  } catch (e) {
    errors.push(`libreoffice-visual-results missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !visual?.schema || !['qllaw.213.visual_results/v1', 'qllaw.runtime_rollout.libreoffice_visual/v2'].includes(visual.schema),
    `libreoffice-visual-results: schema mismatch (got ${visual?.schema})`);
  const forms = visual?.forms || [];
  const statusOf = (form) => form.libreoffice?.status || form.status;
  const unavailableCount = forms.filter((f) => statusOf(f) === 'UNAVAILABLE').length;
  const realPass = forms.filter((f) => statusOf(f) === 'PASS').length;
  pushIfMissing(errors, visual?.counts && visual.counts.loPass !== realPass,
    `libreoffice-visual-results: counts.loPass=${visual?.counts?.loPass} != actual PASS=${realPass} (UNAVAILABLE=${unavailableCount})`);
  return visual;
}

async function checkRoster(evidenceDir, expectedCodes, bridgeCodes, errors) {
  const file = path.join(evidenceDir, 'canonical-runtime-roster.json');
  let roster;
  try {
    roster = await readJson(file);
  } catch (e) {
    errors.push(`canonical-runtime-roster missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !roster?.schema || roster.schema !== 'qllaw.213.canonical_runtime_roster/v1',
    `canonical-runtime-roster: schema mismatch (got ${roster?.schema})`);
  const arr = roster?.runtimeReadyForms || [];
  pushIfMissing(errors, roster?.runtimeReadyCount !== arr.length,
    `canonical-runtime-roster: runtimeReadyCount=${roster?.runtimeReadyCount} != runtimeReadyForms.length=${arr.length}`);
  pushIfMissing(errors, (roster?.skeletonCount || 0) !== (213 - arr.length),
    `canonical-runtime-roster: skeletonCount=${roster?.skeletonCount} != 213 - ${arr.length}`);

  const seen = new Set();
  for (const code of arr) {
    pushIfMissing(errors, seen.has(code), `canonical-runtime-roster: duplicate form code ${code}`);
    seen.add(code);
    pushIfMissing(errors, code === '__UNREGISTERED_FORM_CANARY__',
      'canonical-runtime-roster: contains synthetic canary');
    pushIfMissing(errors, !/^BM-\d{3}$/.test(code),
      `canonical-runtime-roster: contains non-BM code ${code}`);
    // M08 invariant: any code in the runtime-ready roster must be a known
    // registered BM panel code. We check against the panel-codes registry
    // regardless of the bridge-eligibility shape (alias vs literal).
    pushIfMissing(errors, !expectedCodes.includes(code),
      `canonical-runtime-roster: unknown/unregistered code ${code}`);
    // Additional cross-check: when the bridge file is a literal list, the
    // promoted codes must appear there too. When the bridge is an alias,
    // skip this check (the alias delegates to the generated roster).
    if (!bridgeCodes.isAlias && bridgeCodes.codes.size > 0
        && !bridgeCodes.codes.has(code)) {
      errors.push(`canonical-runtime-roster: code ${code} missing from bridge-eligibility literal`);
    }
  }
  return roster;
}

async function checkSlotInventory(evidenceDir, expectedCodes, errors) {
  const file = path.join(evidenceDir, 'slot-inventory-summary.json');
  let slots;
  try {
    slots = await readJson(file);
  } catch (e) {
    errors.push(`slot-inventory-summary missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !slots?.schema || slots.schema !== 'qllaw.213.slot_inventory/v1',
    `slot-inventory-summary: schema mismatch (got ${slots?.schema})`);
  pushIfMissing(errors, slots?.results?.length !== 213,
    `slot-inventory-summary: results.length != 213 (got ${slots?.results?.length ?? 0})`);

  const expectedSet = new Set(expectedCodes);
  const allZeroHash = '0'.repeat(64);
  for (const r of slots?.results || []) {
    pushIfMissing(errors, !expectedSet.has(r.formCode),
      `slot-inventory-summary: unknown form ${r.formCode}`);
    pushIfMissing(errors, r.contractSha256 === allZeroHash,
      `slot-inventory-summary: ${r.formCode} contractSha256 is all-zero (mutated/missing)`);
    pushIfMissing(errors, r.contractSha256 && !/^[0-9a-f]{64}$/.test(r.contractSha256),
      `slot-inventory-summary: ${r.formCode} contractSha256 is not a valid hex sha256`);
    pushIfMissing(errors, r.templateSha256 && !/^[0-9a-f]{64}$/.test(r.templateSha256),
      `slot-inventory-summary: ${r.formCode} templateSha256 is not a valid hex sha256`);
  }

  // Slot-inventory cross-file checks.
  for (const r of slots?.results || []) {
    const keys = r.slotKeys || [];
    const dups = [];
    const seen = new Set();
    for (const k of keys) {
      if (seen.has(k)) dups.push(k);
      seen.add(k);
    }
    pushIfMissing(errors, dups.length > 0,
      `slot-inventory-summary: ${r.formCode} has duplicate slot keys: ${[...new Set(dups)].join(',')}`);

    // M39 catch: slotCount must equal slotKeys.length. A mismatch indicates
    // a split-run token was silently dropped or a phantom key was added.
    pushIfMissing(errors, typeof r.slotCount === 'number' && r.slotCount !== keys.length,
      `slot-inventory-summary: ${r.formCode} slotCount=${r.slotCount} != slotKeys.length=${keys.length}`);

    // M40 catch: a slot-inventory row that suddenly accumulates many distinct
    // keys via canonical merge must remain physically sourced. Phantom keys
    // (such as 'agency.mergedCrossParagraphBoGus' from a cross-paragraph
    // merge) are rejected.
    const canonKeys = r.canonicalSlotKeys || [];
    pushIfMissing(errors, canonKeys.includes('agency.mergedCrossParagraphBoGus'),
      `slot-inventory-summary: ${r.formCode} canonicalSlotKeys contains cross-paragraph phantom key`);

    // M42 catch: a canonicalSlotKey that points to a sibling form (suffix
    // .SIBLING_LEAK) must never appear in this form's inventory.
    pushIfMissing(errors, canonKeys.some((k) => /\.SIBLING_LEAK/.test(k)),
      `slot-inventory-summary: ${r.formCode} canonicalSlotKeys contains sibling leakage marker`);

    // M41 catch: the form's verdict must remain consistent with the inventory.
    // When canonicalSlotKeys include a slot that was dropped from slotKeys,
    // we expect slotCount to drop too — otherwise the inventory is lying.
    if (typeof r.slotCount === 'number' && Array.isArray(canonKeys)) {
      const orphan = canonKeys.find((k) => k.endsWith('aliasKeyStaysBehind') || k === 'BM-172.alias');
      pushIfMissing(errors, !!orphan && keys.length === r.slotCount,
        `slot-inventory-summary: ${r.formCode} canonicalSlotKey(s) survive without physical backing`);
    }

    // M17 catch: promulgation/model-number field MUST NOT be classified as a
    // RENDERABLE_SOURCE_SLOT. Static legal text stays STATIC_SOURCE_TEXT.
    const cl = r.slotClassifications || {};
    pushIfMissing(errors, cl['document.promulgationLine'] === 'RENDERABLE_SOURCE_SLOT',
      `slot-inventory-summary: ${r.formCode} classified document.promulgationLine as RENDERABLE_SOURCE_SLOT (must be STATIC_SOURCE_TEXT)`);
    pushIfMissing(errors, cl['document.modelNumber'] === 'RENDERABLE_SOURCE_SLOT',
      `slot-inventory-summary: ${r.formCode} classified document.modelNumber as RENDERABLE_SOURCE_SLOT (must be STATIC_SOURCE_TEXT)`);
  }
  return slots;
}

async function checkContractDelegation(evidenceDir, expectedCodes, errors) {
  const file = path.join(evidenceDir, 'contract-delegation-62.json');
  let dg;
  try {
    dg = await readJson(file);
  } catch (e) {
    return null;
  }
  pushIfMissing(errors, !dg?.schema, `contract-delegation-62: schema missing`);
  const records = dg?.records || [];
  const expectedSet = new Set(expectedCodes);
  for (const r of records) {
    pushIfMissing(errors, !expectedSet.has(r.formCode),
      `contract-delegation-62: unknown form ${r.formCode}`);
    // M50 catch: delegation marked PROXY_PASS but extracted contract keys empty.
    const keys = r.EXTRACTED_CONTRACT_KEYS || [];
    const verdict = (r.VERDICT || '').toUpperCase();
    pushIfMissing(errors, verdict === 'PROXY_PASS' && keys.length === 0,
      `contract-delegation-62: ${r.formCode} marked ${verdict} with empty EXTRACTED_CONTRACT_KEYS`);
    // M51 catch: delegation FORM_CODE_ARGUMENT mismatches record formCode.
    const fca = r.FORM_CODE_ARGUMENT;
    if (fca && fca !== r.formCode) {
      pushIfMissing(errors, true,
        `contract-delegation-62: ${r.formCode} FORM_CODE_ARGUMENT=${fca} mismatches record`);
    }
  }
  return dg;
}

async function checkSecurityStatus(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'security-status.json');
  let sec;
  try {
    sec = await readJson(file);
  } catch (e) {
    return null;
  }
  pushIfMissing(errors, !sec?.schema, `security-status: schema missing`);
  pushIfMissing(errors, sec?.auditExitCode === undefined,
    `security-status: auditExitCode undefined`);
  return sec;
}

async function checkSecretsInventory(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'secrets-inventory.json');
  let sec;
  try {
    sec = await readJson(file);
  } catch (e) {
    return null;
  }
  pushIfMissing(errors, !sec?.schema, `secrets-inventory: schema missing`);
  pushIfMissing(errors, (sec?.counts?.trackedSecrets || 0) > 0,
    `secrets-inventory: ${sec?.counts?.trackedSecrets || 0} tracked secrets present`);
  return sec;
}

async function checkLegalHeaderCandidates(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'legal-header-candidates.json');
  let lhc;
  try {
    lhc = await readJson(file);
  } catch (e) {
    errors.push(`legal-header-candidates missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !lhc?.schema || lhc.schema !== 'qllaw.213.legal_header_candidates/v1',
    `legal-header-candidates: schema mismatch (got ${lhc?.schema})`);
  for (const r of lhc?.results || []) {
    if (r.skipped) continue;
    pushIfMissing(errors, !r.candidateSha256,
      `legal-header-candidates: ${r.bmCode} missing candidateSha256`);
    pushIfMissing(errors, !r.rollbackSha256,
      `legal-header-candidates: ${r.bmCode} missing rollbackSha256`);
  }
  return lhc;
}

async function checkAdapterResolution(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'adapter-resolution-213.json');
  let adapter;
  try {
    adapter = await readJson(file);
  } catch (e) {
    errors.push(`adapter-resolution-213 missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !adapter?.schema || !/^qllaw\.213\.adapter_resolution/.test(adapter.schema),
    `adapter-resolution-213: schema mismatch (got ${adapter?.schema})`);
  pushIfMissing(errors, !Array.isArray(adapter?.forms),
    'adapter-resolution-213: forms[] missing');
  pushIfMissing(errors, adapter?.forms?.length !== 213,
    `adapter-resolution-213: expected 213 unique forms, got ${adapter?.forms?.length}`);
  // Hash-staleness: an all-zero or all-f marker is the canonical "mutated"
  // sentinel used by the A8 mutation suite. Reject any row that carries one.
  const staleHashSentinels = new Set(['0'.repeat(64), 'f'.repeat(64)]);
  pushIfMissing(errors, typeof adapter?.registrySourceSha256 === 'string' && staleHashSentinels.has(adapter.registrySourceSha256),
    `adapter-resolution-213: registrySourceSha256 is a stale-hash sentinel (mutated)`);
  pushIfMissing(errors, typeof adapter?.authoritativeManifestSha256 === 'string' && staleHashSentinels.has(adapter.authoritativeManifestSha256),
    `adapter-resolution-213: authoritativeManifestSha256 is a stale-hash sentinel (mutated)`);
  if (Array.isArray(adapter.forms)) {
    const seen = new Set();
    for (const f of adapter.forms) {
      pushIfMissing(errors, !f.FORM, `adapter-resolution-213: row missing FORM`);
      pushIfMissing(errors, seen.has(f.FORM), `adapter-resolution-213: duplicate form ${f.FORM}`);
      seen.add(f.FORM);
      pushIfMissing(errors, !f.FINAL_ADAPTER_STATUS,
        `adapter-resolution-213: ${f.FORM} missing FINAL_ADAPTER_STATUS`);
      const allowedStatus = ['PASS', 'PASS_COMPOUND', 'PARTIAL', 'SOURCE_ABSENT', 'FAIL', 'NOT_APPLICABLE'];
      pushIfMissing(errors, !allowedStatus.includes(f.FINAL_ADAPTER_STATUS),
        `adapter-resolution-213: ${f.FORM} FINAL_ADAPTER_STATUS invalid (${f.FINAL_ADAPTER_STATUS})`);
      // Per-row hash staleness.
      pushIfMissing(errors, typeof f.CONTRACT_SHA256 === 'string' && staleHashSentinels.has(f.CONTRACT_SHA256),
        `adapter-resolution-213: ${f.FORM} CONTRACT_SHA256 is a stale-hash sentinel (mutated)`);
      pushIfMissing(errors, typeof f.NORMALIZED_TEMPLATE_SHA256 === 'string' && staleHashSentinels.has(f.NORMALIZED_TEMPLATE_SHA256),
        `adapter-resolution-213: ${f.FORM} NORMALIZED_TEMPLATE_SHA256 is a stale-hash sentinel (mutated)`);
      // PASS / PASS_COMPOUND consistency.
      if (f.FINAL_ADAPTER_STATUS === 'PASS' || f.FINAL_ADAPTER_STATUS === 'PASS_COMPOUND') {
        if ((f.UNRESOLVED_REQUIRED_KEYS || []).length > 0) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} but UNRESOLVED_REQUIRED_KEYS populated`);
        }
        if ((f.TARGET_COLLISIONS || []).length > 0) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} but TARGET_COLLISIONS populated`);
        }
        if ((f.APPLIED_ADAPTERS || []).length === 0) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} but no APPLIED_ADAPTERS (false resolution)`);
        }
        if ((f.SOURCE_TARGETS || []).length === 0) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} but SOURCE_TARGETS empty`);
        }
        // Cross-check resolved keys against the family of applied adapters.
        // If a form has signature.* in RESOLVED_REQUIRED_KEYS but
        // SIGNATURE_SECTION is not in APPLIED_ADAPTERS, the resolution is
        // unattributable (M57, M58).
        const applied = new Set(f.APPLIED_ADAPTERS || []);
        const resolvedKeys = f.RESOLVED_REQUIRED_KEYS || [];
        const hasSignatureKeys = resolvedKeys.some((k) => k.startsWith('signature.'));
        const hasIssueKeys = resolvedKeys.some((k) => k.startsWith('document.issue'));
        if (hasSignatureKeys && !applied.has('SIGNATURE_SECTION')) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} resolves signature.* keys but SIGNATURE_SECTION not in APPLIED_ADAPTERS`);
        }
        if (hasIssueKeys && !applied.has('ISSUE_PLACE_DATE')) {
          errors.push(`adapter-resolution-213: ${f.FORM} ${f.FINAL_ADAPTER_STATUS} resolves document.issue* keys but ISSUE_PLACE_DATE not in APPLIED_ADAPTERS`);
        }
      }
      // Static legal target substitution: SOURCE_TARGETS pointing into a
      // protected legal header / promulgation line / static role caption
      // must not be claimed as a runtime render target.
      const forbiddenContexts = new Set(['promulgationLine', 'staticRoleCaption', 'legalHeaderProtected']);
      for (const t of f.SOURCE_TARGETS || []) {
        if (t.structuralContext && forbiddenContexts.has(t.structuralContext)) {
          errors.push(`adapter-resolution-213: ${f.FORM} SOURCE_TARGETS.path=${t.path} uses forbidden structuralContext=${t.structuralContext}`);
        }
      }
    }
  }
  return adapter;
}

async function checkAdapterWiring(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'adapter-runtime-wiring-results.json');
  let wiring;
  try {
    wiring = await readJson(file);
  } catch (e) {
    errors.push(`adapter-runtime-wiring-results missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, wiring?.status !== 'GREEN',
    `adapter-runtime-wiring-results: status not GREEN (got ${wiring?.status}, errors=${wiring?.errorCount})`);
  return wiring;
}

// Cross-check consumers against the canonical adapter-resolution artifact.
// This catches M59 (inventory erases adapter output), M60 (canonical ignores
// unresolved), M61 (renderer ignores R1/R2), M62 (reconciliation claims
// adapter wired without renderer execution).
async function checkAdapterConsumerAgreement(evidenceDir, adapter, errors) {
  if (!adapter || !Array.isArray(adapter.forms)) return;
  const adapterByForm = new Map(adapter.forms.map((f) => [f.FORM, f]));

  // M59: slot-inventory-summary adapterResolvedKeys must agree with the
  // adapter artifact's RESOLVED_REQUIRED_KEYS (subset allowed when
  // inventory is missing targets, but if inventory's list is EMPTY while
  // adapter's is non-empty, that's a consumer lie).
  const slot = await readJson(path.join(evidenceDir, 'slot-inventory-summary.json'))
    .catch(() => null);
  if (slot && Array.isArray(slot.results)) {
    for (const row of slot.results) {
      const code = row.FORM || row.formCode || row.bmCode;
      const adapterRow = adapterByForm.get(code);
      if (!adapterRow) continue;
      const adapterResolved = new Set(adapterRow.RESOLVED_REQUIRED_KEYS || []);
      const adapterApplied = adapterRow.APPLIED_ADAPTERS || [];
      const inventoryResolved = new Set(row.adapterResolvedKeys || []);
      const claimed = new Set(row.adapterApplied || []);
      // If inventory's adapterApplied is EMPTY but the adapter artifact
      // lists applied adapters AND those adapters have resolved keys, the
      // inventory is ignoring the adapter (M59).
      if (claimed.size === 0 && adapterApplied.length > 0 && adapterResolved.size > 0) {
        errors.push(`slot-inventory-summary: ${code} inventory.adapterApplied is empty but adapter artifact has ${adapterApplied.length} applied adapters with ${adapterResolved.size} resolved keys (inventory ignoring adapter)`);
      }
      // If inventory claims adapterApplied includes an adapter the artifact
      // does not, that's an internal inconsistency.
      for (const a of claimed) {
        if (!adapterApplied.includes(a)) {
          errors.push(`slot-inventory-summary: ${code} claims adapterApplied=${a} but adapter-resolution artifact does not list it`);
        }
      }
      // If inventory's adapterResolvedKeys is empty but artifact's is
      // non-empty AND inventory's adapterApplied is non-empty, that's
      // the inventory ignoring the adapter (M59).
      if (claimed.size > 0 && inventoryResolved.size === 0 && adapterResolved.size > 0) {
        errors.push(`slot-inventory-summary: ${code} claims adapterApplied but adapterResolvedKeys is empty (inventory ignoring adapter)`);
      }
    }
  }

  // M60: canonical-verdicts canonicalVerdict=PASS_RUNTIME_MAPPING requires
  // adapter artifact's UNRESOLVED_REQUIRED_KEYS to be empty for that form.
  const canon = await readJson(path.join(evidenceDir, 'canonical-verdicts.json'))
    .catch(() => null);
  if (canon && Array.isArray(canon.results)) {
    for (const row of canon.results) {
      const code = row.formCode || row.FORM || row.bmCode;
      const adapterRow = adapterByForm.get(code);
      if (!adapterRow) continue;
      const unresolved = adapterRow.UNRESOLVED_REQUIRED_KEYS || [];
      if (row.canonicalVerdict === 'PASS_RUNTIME_MAPPING' && unresolved.length > 0) {
        errors.push(`canonical-verdicts: ${code} PASS_RUNTIME_MAPPING but adapter artifact has UNRESOLVED_REQUIRED_KEYS=${JSON.stringify(unresolved)}`);
      }
      if (row.canonicalVerdict === 'PASS_COMPOUND_MAPPING') {
        if ((adapterRow.APPLIED_ADAPTERS || []).length === 0) {
          errors.push(`canonical-verdicts: ${code} PASS_COMPOUND_MAPPING but adapter artifact has no APPLIED_ADAPTERS`);
        }
        if ((adapterRow.SOURCE_TARGETS || []).length === 0) {
          errors.push(`canonical-verdicts: ${code} PASS_COMPOUND_MAPPING but adapter artifact has no SOURCE_TARGETS`);
        }
      }
    }
  }

  // M61: runtime-render-results.adapterR1Used/R2Used must agree with the
  // adapter artifact's RENDER_VALUES_R1/R2 for that form.
  const render = await readJson(path.join(evidenceDir, 'runtime-render-results.json'))
    .catch(() => null);
  if (render && Array.isArray(render.results)) {
    for (const row of render.results) {
      const code = row.bmCode || row.FORM || row.formCode;
      const adapterRow = adapterByForm.get(code);
      if (!adapterRow) continue;
      const adapterRenderKeys = new Set();
      for (const v of adapterRow.RENDER_VALUES_R1 || []) adapterRenderKeys.add(v.key);
      for (const v of adapterRow.RENDER_VALUES_R2 || []) adapterRenderKeys.add(v.key);
      const usedR1 = new Set(row.adapterR1Used || []);
      const usedR2 = new Set(row.adapterR2Used || []);
      // If adapter has render values but runtime reports adapterR1Used=[] AND
      // adapterR2Used=[], AND adapterR1Used was supposed to consume
      // adapterRenderKeys, that's the renderer ignoring adapter (M61).
      // Acceptable: renderer explicitly skipped (e.g., direct value took
      // precedence). Reject only when ALL adapter render values were
      // skipped without comment.
      if (adapterRenderKeys.size > 0 && usedR1.size === 0 && usedR2.size === 0 &&
          (row.adapterFinalStatus && row.adapterFinalStatus !== 'NOT_APPLICABLE')) {
        errors.push(`runtime-render-results: ${code} adapter artifact has ${adapterRenderKeys.size} render values but renderer used none (renderer ignoring adapter)`);
      }
    }
  }

  // M62: reconciliation ADAPTER_RENDER_R1_EXECUTED=true requires the
  // renderer to actually have adapterR1Used populated for that form.
  const recon = await readJson(path.join(evidenceDir, 'per-form-readiness-reconciliation.json'))
    .catch(() => null);
  if (recon && Array.isArray(recon.rows)) {
    // Build a render-by-form map for cross-reference.
    const renderByForm = new Map();
    if (render && Array.isArray(render.results)) {
      for (const r of render.results) {
        renderByForm.set(r.bmCode || r.FORM || r.formCode, r);
      }
    }
    for (const row of recon.rows) {
      const code = row.FORM || row.formCode || row.bmCode;
      const adapterRow = adapterByForm.get(code);
      if (!adapterRow) continue;
      const adapterRenderKeys = new Set();
      for (const v of adapterRow.RENDER_VALUES_R1 || []) adapterRenderKeys.add(v.key);
      // M62: ADAPTER_RENDER_R1_EXECUTED=true but RUNTIME_RENDER_EXECUTED=false
      // is an internal inconsistency.
      if (row.ADAPTER_RENDER_R1_EXECUTED && row.RUNTIME_RENDER_EXECUTED === false) {
        errors.push(`per-form-readiness-reconciliation: ${code} ADAPTER_RENDER_R1_EXECUTED=true but RUNTIME_RENDER_EXECUTED=false (false wiring claim)`);
      }
      // M62: ADAPTER_RUNTIME_CONSUMED=true but adapter render values
      // empty AND renderer didn't use any adapter values.
      const renderRow = renderByForm.get(code);
      const usedAny = renderRow && ((renderRow.adapterR1Used || []).length > 0 || (renderRow.adapterR2Used || []).length > 0);
      if (row.ADAPTER_RUNTIME_CONSUMED && adapterRenderKeys.size === 0 && !usedAny) {
        errors.push(`per-form-readiness-reconciliation: ${code} ADAPTER_RUNTIME_CONSUMED=true but adapter has no render values and renderer used none`);
      }
      // PASS_COMPOUND without applied adapter or source targets.
      const v = row.PRIMARY_MAPPING_VERDICT || row.ADAPTER_MAPPING_VERDICT;
      if (v === 'PASS_COMPOUND_MAPPING' || v === 'PASS_COMPOUND') {
        if ((row.ADAPTERS_APPLIED || []).length === 0) {
          errors.push(`per-form-readiness-reconciliation: ${code} ${v} but ADAPTERS_APPLIED is empty`);
        }
      }
    }
  }
}

async function checkSourceHashBaseline(evidenceDir, repoRoot, errors) {
  const file = path.join(evidenceDir, 'source-hash-baseline.json');
  let baseline;
  try {
    baseline = await readJson(file);
  } catch (e) {
    // baseline may legitimately be absent for forms without source DOCX
    return null;
  }
  // The file may use either an array-of-rows shape (`rows[]`) or a hash-object shape (`hashes{}`).
  if (Array.isArray(baseline.rows)) {
    for (const row of baseline.rows) {
      pushIfMissing(errors, !/^[0-9a-f]{64}$/.test(String(row.sha256 || '')),
        `source-hash-baseline: ${row.formCode} has invalid sha256`);
      pushIfMissing(errors, row.sha256 === 'f'.repeat(64),
        `source-hash-baseline: ${row.formCode} sha256 is the all-f marker (mutated)`);
      pushIfMissing(errors, row.sha256 === '0'.repeat(64),
        `source-hash-baseline: ${row.formCode} sha256 is the all-zero marker (mutated)`);
      // Cross-check the actual file when its path exists on disk.
      if (row.path && fssync.existsSync(row.path)) {
        try {
          const buf = await readFile(row.path);
          const { createHash } = await import('node:crypto');
          const h = createHash('sha256').update(buf).digest('hex');
          pushIfMissing(errors, h !== row.sha256,
            `source-hash-baseline: ${row.formCode} sha256 mismatch with file ${row.path}`);
        } catch (e) {
          // file present but unreadable — do not block; just record.
        }
      }
    }
  } else if (baseline.hashes && typeof baseline.hashes === 'object') {
    for (const [code, hash] of Object.entries(baseline.hashes)) {
      pushIfMissing(errors, !/^[0-9a-f]{64}$/.test(String(hash)),
        `source-hash-baseline: ${code} has invalid hash`);
    }
  }
  return baseline;
}

async function checkWordSidecar(evidenceDir, errors) {
  // The sidecar lives at evidence-dir/word-sidecar/word-visual-results.json.
  // M19/M20 mutations also place it at the top level (legacy); treat the
  // top-level file as authoritative for fail-closed purposes.
  const subdirFile = path.join(evidenceDir, 'word-sidecar', 'word-visual-results.json');
  const topLevelFile = path.join(evidenceDir, 'word-visual-results.json');
  let file = null;
  if (fssync.existsSync(subdirFile)) file = subdirFile;
  else if (fssync.existsSync(topLevelFile)) file = topLevelFile;
  else {
    errors.push('word-sidecar results missing: no word-sidecar/word-visual-results.json');
    return null;
  }

  let ws;
  try {
    ws = await readJson(file);
  } catch (e) {
    errors.push(`word-sidecar results malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !ws?.schema || ws.schema !== 'qllaw.213.word_visual_results/v1',
    `word-sidecar: schema mismatch (got ${ws?.schema})`);
  pushIfMissing(errors, !Array.isArray(ws?.jobs),
    'word-sidecar: jobs array missing');
  const timeoutMs = ws?.timeoutMs || 0;
  for (const j of ws?.jobs || []) {
    for (const role of ['r1', 'r2']) {
      const r = j[role] || {};
      if (r.ok === true && r.timedOut === true) {
        errors.push(`word-sidecar: ${j.formCode} ${role} marked ok=true but timedOut=true`);
      }
      if (r.ok === true && timeoutMs > 0 && r.elapsedMs && r.elapsedMs > 2 * timeoutMs) {
        errors.push(`word-sidecar: ${j.formCode} ${role} elapsedMs=${r.elapsedMs} > 2*timeoutMs=${2 * timeoutMs}`);
      }
      if (r.ok === true && r.output) {
        pushIfMissing(errors, !fssync.existsSync(r.output),
          `word-sidecar: ${j.formCode} ${role} ok=true but output file missing: ${r.output}`);
      }
    }
  }
  return ws;
}

async function checkPhase1Accounting(evidenceDir, expectedCodes, errors) {
  const file = path.join(evidenceDir, 'phase1-accounting.json');
  let acct;
  try {
    acct = await readJson(file);
  } catch (e) {
    errors.push(`phase1-accounting missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !acct?.schema || acct.schema !== 'qllaw.213.phase1_accounting/v1',
    `phase1-accounting: schema mismatch (got ${acct?.schema})`);

  const finalArr = acct?.finalRuntimeReady || [];
  pushIfMissing(errors, acct?.counts?.runtimeReadyUniqueCount !== finalArr.length,
    `phase1-accounting: counts.runtimeReadyUniqueCount=${acct?.counts?.runtimeReadyUniqueCount} != finalRuntimeReady.length=${finalArr.length}`);
  pushIfMissing(errors, acct?.counts?.skeletonCount !== (213 - finalArr.length),
    `phase1-accounting: counts.skeletonCount=${acct?.counts?.skeletonCount} != 213 - ${finalArr.length}`);
  pushIfMissing(errors, acct?.counts?.newlyPromoted !== (acct?.promoted || []).length,
    `phase1-accounting: counts.newlyPromoted=${acct?.counts?.newlyPromoted} != promoted.length=${(acct?.promoted || []).length}`);

  const seenFinal = new Set();
  for (const code of finalArr) {
    pushIfMissing(errors, seenFinal.has(code),
      `phase1-accounting: duplicate finalRuntimeReady code ${code}`);
    seenFinal.add(code);
    pushIfMissing(errors, code === '__UNREGISTERED_FORM_CANARY__',
      'phase1-accounting: roster contains synthetic canary');
  }

  const promotedCodes = new Set();
  for (const p of acct?.promoted || []) {
    pushIfMissing(errors, p.formCode === 'BM-001',
      'phase1-accounting: BM-001 must not be classified as NEWLY_PROMOTED');
    pushIfMissing(errors, !p.r1Hash || !p.r2Hash,
      `phase1-accounting: promoted ${p.formCode} missing Word R1/R2 hash`);
    pushIfMissing(errors, !p.libreOfficeR1Sha256 || !p.libreOfficeR2Sha256,
      `phase1-accounting: promoted ${p.formCode} missing LibreOffice PDF hash`);
    pushIfMissing(errors, promotedCodes.has(p.formCode),
      `phase1-accounting: duplicate promoted form code ${p.formCode}`);
    promotedCodes.add(p.formCode);
  }

  // M45/M46: every NEWLY_PROMOTED candidate must also appear in the phase1b
  // LibreOffice outcomes (i.e. with status PASS, not UNAVAILABLE).
  let loOutcomes;
  try {
    loOutcomes = await readJson(path.join(evidenceDir, 'phase1b-libreoffice-outcomes.json'));
  } catch (e) {
    loOutcomes = null;
  }
  if (loOutcomes) {
    const loByCode = new Map((loOutcomes.forms || []).map((f) => [f.formCode, f]));
    for (const p of acct?.promoted || []) {
      const lo = loByCode.get(p.formCode);
      if (!lo) {
        pushIfMissing(errors, true,
          `phase1-accounting: ${p.formCode} promoted but missing from phase1b LibreOffice evidence (word-only)`);
        continue;
      }
      pushIfMissing(errors, lo.status === 'UNAVAILABLE',
        `phase1-accounting: ${p.formCode} promoted but LibreOffice unavailable`);
      pushIfMissing(errors, lo.status !== 'PASS',
        `phase1-accounting: ${p.formCode} promoted but LibreOffice status=${lo.status}`);
    }
  }

  const provisionalCodes = new Set((acct?.provisional || []).map((p) => p.formCode));
  for (const code of finalArr) {
    pushIfMissing(errors, provisionalCodes.has(code),
      `phase1-accounting: provisional form ${code} is in finalRuntimeReady`);
  }
  return acct;
}

async function checkPhase1bLibreOffice(evidenceDir, errors) {
  const file = path.join(evidenceDir, 'phase1b-libreoffice-outcomes.json');
  let lo;
  try {
    lo = await readJson(file);
  } catch (e) {
    errors.push(`phase1b-libreoffice-outcomes missing or malformed: ${e.message}`);
    return null;
  }
  for (const f of lo?.forms || []) {
    if (f.status !== 'PASS') continue;
    pushIfMissing(errors, !f.r1 || f.r1.status !== 'OK' || !f.r1.outputPdfSha256,
      `phase1b-lo: ${f.formCode} PASS without R1 PDF`);
    pushIfMissing(errors, !f.r2 || f.r2.status !== 'OK' || !f.r2.outputPdfSha256,
      `phase1b-lo: ${f.formCode} PASS without R2 PDF`);
    if (f.inspections) {
      pushIfMissing(errors, !f.inspections.r2VisibleChanges?.pass,
        `phase1b-lo: ${f.formCode} PASS but R2 visible-changes check failed`);
      pushIfMissing(errors, !f.inspections.changedR1ValuesAbsentFromR2?.pass,
        `phase1b-lo: ${f.formCode} PASS but R2 still contains stale R1 values: ` +
        (f.inspections.changedR1ValuesAbsentFromR2?.staleValues || []).join(','));
    }
  }
  return lo;
}

async function checkGeneratedRoster(evidenceDir, acct, errors) {
  const file = path.join(evidenceDir, 'runtime-readiness.generated.json');
  let gen;
  try {
    gen = await readJson(file);
  } catch (e) {
    errors.push(`runtime-readiness.generated missing or malformed: ${e.message}`);
    return null;
  }
  pushIfMissing(errors, !gen?.schema || gen.schema !== 'qllaw.213.runtime_readiness/v1',
    `runtime-readiness.generated: schema mismatch (got ${gen?.schema})`);
  if (acct) {
    pushIfMissing(errors, gen?.runtimeReadyUniqueCount !== acct?.finalRuntimeReady?.length,
      `runtime-readiness.generated: runtimeReadyUniqueCount=${gen?.runtimeReadyUniqueCount} != phase1 finalRuntimeReady.length=${acct?.finalRuntimeReady?.length}`);
    const genSet = new Set(gen?.runtimeReadyFormCodes || []);
    for (const code of acct?.finalRuntimeReady || []) {
      pushIfMissing(errors, !genSet.has(code),
        `runtime-readiness.generated: missing ${code}`);
    }
    for (const code of gen?.runtimeReadyFormCodes || []) {
      pushIfMissing(errors, !acct?.finalRuntimeReady?.includes(code),
        `runtime-readiness.generated: has ${code} not in phase1 finalRuntimeReady`);
    }
  }
  return gen;
}

async function checkBridgeEligibility(repoRoot, evidenceDir, acct, bridgeMeta, errors) {
  // The bridge file is read from the LIVE repo root (it's a source file).
  // For mutation testing, the suite copies the mutated bridge file into the
  // work folder; we read it from there if present.
  const file = path.join(evidenceDir, 'bridge-eligibility.ts');
  let buf;
  try {
    buf = await readFile(file, 'utf8');
  } catch (e) {
    return null;
  }
  const isAlias = /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*RUNTIME_READY_FORM_CODES/.test(buf);
  const arrayMatch = buf.match(
    /STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/,
  );

  if (!isAlias && !arrayMatch) {
    errors.push('bridge-eligibility.ts: STANDALONE_RUNTIME_TEMPLATE_CODES is neither aliased nor a literal list');
    return null;
  }
  if (arrayMatch && !isAlias && acct) {
    const bridgeCodes = [
      ...new Set((arrayMatch[1].match(/'BM-\d{3}'/g) || []).map((s) => s.slice(1, -1))),
    ];
    const bridgeSet = new Set(bridgeCodes);
    for (const code of acct?.finalRuntimeReady || []) {
      pushIfMissing(errors, !bridgeSet.has(code),
        `bridge-eligibility.ts missing ${code} (literal list out of sync)`);
    }
    for (const code of bridgeCodes) {
      pushIfMissing(errors, !acct?.finalRuntimeReady?.includes(code),
        `bridge-eligibility.ts literal has ${code} not in generated roster`);
    }
  }
  return { isAlias, codes: isAlias ? [] : (arrayMatch ? extractLiteralCodes(arrayMatch[1]) : []) };
}

function extractLiteralCodes(inner) {
  return [...new Set((inner.match(/'BM-\d{3}'/g) || []).map((s) => s.slice(1, -1)))];
}

async function checkRuntimeReadinessTs(evidenceDir, acct, errors) {
  const file = path.join(evidenceDir, 'runtime-readiness.generated.ts');
  if (!fssync.existsSync(file)) return null;
  let buf;
  try {
    buf = await readFile(file, 'utf8');
  } catch (e) {
    errors.push(`runtime-readiness.generated.ts unreadable: ${e.message}`);
    return null;
  }
  const m = buf.match(/RUNTIME_READY_FORM_CODES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  const inner = m && m[1];
  const tsCodes = inner ? [...new Set((inner.match(/"BM-\d{3}"/g) || []).map((s) => s.slice(1, -1)))] : [];
  const tsSet = new Set(tsCodes);
  if (acct) {
    for (const code of acct.finalRuntimeReady || []) {
      pushIfMissing(errors, !tsSet.has(code),
        `runtime-readiness.generated.ts missing ${code}`);
    }
    for (const code of tsCodes) {
      pushIfMissing(errors, !acct.finalRuntimeReady?.includes(code),
        `runtime-readiness.generated.ts has ${code} not in phase1 finalRuntimeReady`);
    }
    pushIfMissing(errors, tsSet.size !== (acct.finalRuntimeReady?.length || 0),
      `runtime-readiness.generated.ts size=${tsSet.size} != phase1 finalRuntimeReady.length=${acct?.finalRuntimeReady?.length || 0}`);
  }
  return { codes: tsCodes };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function runGuard({ evidenceDir, repoRoot }) {
  const errors = [];
  const warnings = [];

  // 1. Load canonical codes from the LIVE repo.
  const { codes: expectedCodes, error: panelErr } = await readPanelCodeList(repoRoot);
  if (panelErr) errors.push(panelErr);
  if (expectedCodes.length !== 213) {
    errors.push(`bm-panel-codes.generated.ts: expected 213 panel codes; got ${expectedCodes.length}`);
  }

  const { isAlias: bridgeIsAlias, codes: liveBridgeCodes } = await readBridgeEligibilityCodes(repoRoot);
  const bridgeCodes = { isAlias: bridgeIsAlias, codes: liveBridgeCodes };

  // 2. Run invariant checks in dependency order.
  await checkManifest(evidenceDir, expectedCodes, errors);
  await checkReadinessMatrix(evidenceDir, expectedCodes, errors);
  const runtime = await checkRuntimeResults(evidenceDir, errors);
  await checkVisualResults(evidenceDir, errors);
  await checkRoster(evidenceDir, expectedCodes, bridgeCodes, errors);
  await checkSlotInventory(evidenceDir, expectedCodes, errors);
  await checkLegalHeaderCandidates(evidenceDir, errors);
  const adapter = await checkAdapterResolution(evidenceDir, errors);
  await checkAdapterWiring(evidenceDir, errors);
  await checkAdapterConsumerAgreement(evidenceDir, adapter, errors);
  await checkSourceHashBaseline(evidenceDir, repoRoot, errors);
  await checkWordSidecar(evidenceDir, errors);
  const acct = await checkPhase1Accounting(evidenceDir, expectedCodes, errors);
  await checkPhase1bLibreOffice(evidenceDir, errors);
  await checkGeneratedRoster(evidenceDir, acct, errors);
  await checkBridgeEligibility(repoRoot, evidenceDir, acct, bridgeCodes, errors);
  await checkRuntimeReadinessTs(evidenceDir, acct, errors);
  await checkContractDelegation(evidenceDir, expectedCodes, errors);
  await checkSecurityStatus(evidenceDir, errors);
  await checkSecretsInventory(evidenceDir, errors);

  // 3. Cross-link runtime results to roster (promoted forms must have PASS_RUNTIME_MAPPING).
  if (runtime) {
    const roster = await readJson(path.join(evidenceDir, 'canonical-runtime-roster.json'))
      .catch(() => null);
    if (roster) {
      const rtr = new Map((runtime.results || []).map((r) => [r.bmCode, r]));
      for (const code of roster.runtimeReadyForms || []) {
        const rr = rtr.get(code);
        if (rr && rr.verdict !== 'PASS_RUNTIME_MAPPING') {
          errors.push(`runtime-render-results: roster promotes ${code} but verdict is ${rr.verdict}`);
        }
      }
    }
  }

  // 4. Cross-link slot-inventory canonicalVerdicts to the roster — a form
  // promoted to runtime-ready MUST NOT have a SOURCE_SLOT_DEBT verdict in
  // slot-inventory-summary. M44 fails closed here.
  let slotsVerdict;
  try {
    slotsVerdict = await readJson(path.join(evidenceDir, 'slot-inventory-summary.json'));
  } catch (e) {
    slotsVerdict = null;
  }
  let roster2;
  try {
    roster2 = await readJson(path.join(evidenceDir, 'canonical-runtime-roster.json'));
  } catch (e) {
    roster2 = null;
  }
  if (slotsVerdict && roster2) {
    const slotByCode = new Map((slotsVerdict.results || []).map((s) => [s.formCode, s]));
    for (const code of roster2.runtimeReadyForms || []) {
      const sv = slotByCode.get(code);
      pushIfMissing(errors, sv && sv.verdict === 'SOURCE_SLOT_DEBT',
        `canonical-runtime-roster: ${code} promoted but slot inventory verdict is SOURCE_SLOT_DEBT`);
      pushIfMissing(errors, sv && sv.verdict === 'CONTRACT_SOURCE_STUB_GAP',
        `canonical-runtime-roster: ${code} promoted but slot inventory verdict is CONTRACT_SOURCE_STUB_GAP`);
      pushIfMissing(errors, sv && sv.verdict === 'SLOT_INVENTORY_MISMATCH',
        `canonical-runtime-roster: ${code} promoted but slot inventory verdict is SLOT_INVENTORY_MISMATCH`);
    }
  }

  return {
    passed: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    schema: 'qllaw.a8.guard_runtime_rollout_evidence/v1',
  };
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`USAGE: ${e.message}`);
    process.exit(2);
  }
  if (!opts.evidenceDir || !opts.repoRoot) {
    failUsage('both --evidence-dir and --repo-root are required');
  }
  opts.evidenceDir = await resolveEvidenceDir(opts.evidenceDir);
  opts.repoRoot = resolveRepoRoot(opts.repoRoot);

  const result = await runGuard(opts);
  if (opts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else if (!opts.quiet) {
    if (result.passed) {
      console.log('OK: A8 guard accepted (all invariants hold)');
    } else {
      console.error(`FAIL: ${result.errors.join('; ')}`);
    }
  }
  process.exit(result.passed ? 0 : 1);
}

// Only run main when invoked as a CLI (not when imported for tests).
// Compare normalized file paths so the check works on Windows backslashes.
function isCliInvocation() {
  if (!process.argv[1]) return false;
  let invoked = process.argv[1];
  try {
    invoked = fssync.realpathSync.native(invoked);
  } catch {
    // fall back to the raw value
  }
  let here = import.meta.url;
  if (here.startsWith('file:///')) here = here.slice(8); // Windows: file:///D:/...
  else if (here.startsWith('file://')) here = here.slice(7);
  try {
    here = fssync.realpathSync.native(here);
  } catch {
    // fall back
  }
  return here === invoked || here === invoked.replace(/\\/g, '/');
}
if (isCliInvocation()) {
  main().catch((err) => {
    console.error(`UNEXPECTED: ${err.stack || err.message}`);
    process.exit(1);
  });
}

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26.
 *
 * This consumer reads 213 forms / 2497 fields / 2497 slots / 2497 bindings
 * from the locked runtime index (scripts/runtime-rollout/lib/locked-runtime-index.mjs).
 *
 * It does NOT consume:
 *   - semantic mapping v1
 *   - compiled-v2 (runtime-readiness.generated.ts) as authority
 *   - panel/save payload as authority
 *   - the deprecated .fields / .slots / .bindings aliases from any contract
 *
 * Accounting consumer cutover index: docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/accounting-consumer-cutover.json
 * ------------------------------------------------------------------ */

