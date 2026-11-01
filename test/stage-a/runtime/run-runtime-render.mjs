// Stage A runtime-render harness for runtime-ready (standalone) templates.
// Per AGENTS.md: "Standalone template = Runtime DOCX/Preview Session. No persisted document."
// For the 11 golden forms, draft bridge is rejected with HTTP 400, so we exercise
// the runtime template render endpoint and compare DOCX hash to prove determinism.
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiClient, saveJson, ensureDir, loadJson } from './helpers/api-client.mjs';
import { GOLDEN_FORMS, sentinelText, sentinelDate, sentinelNumber, sentinelBool } from './helpers/sentinels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_ROOT = join(__dirname, '..', '..', '..', 'docs', 'audit', 'final-213-customer-ready', 'stage-a-runtime');
const FORMS_DIR = join(EVIDENCE_ROOT, 'forms');
const ARTIFACTS_ROOT = join(EVIDENCE_ROOT, 'artifacts');
const COMMANDS_LOG = join(EVIDENCE_ROOT, 'commands.runtime.json');

ensureDir(EVIDENCE_ROOT);
ensureDir(ARTIFACTS_ROOT);
ensureDir(FORMS_DIR);

const contractsRoot = join(__dirname, '..', '..', '..', 'docs', 'audit', 'docx', 'contracts', 'locked');

function loadContract(formCode) {
  if (!existsSync(contractsRoot)) return null;
  const files = readdirSync(contractsRoot).filter((n) => n.startsWith(formCode + '__') && n.endsWith('.contract.locked.json'));
  if (files.length === 0) return null;
  return loadJson(join(contractsRoot, files[0]));
}

function getContractFields(formCode) {
  const contract = loadContract(formCode);
  if (!contract || !Array.isArray(contract.canonicalFields)) return [];
  return contract.canonicalFields;
}

function sha256(buf) { return createHash('sha256').update(buf).digest('hex'); }

function buildData(formCode, rev) {
  const data = {};
  const fields = getContractFields(formCode);
  for (const fld of fields) {
    if (!fld || !fld.path) continue;
    const p = fld.path;
    if (typeof p !== 'string') continue;
    if (fld.type === 'date') data[p] = sentinelDate(rev);
    else if (fld.type === 'number') data[p] = sentinelNumber(rev, 0);
    else if (fld.type === 'boolean') data[p] = sentinelBool(rev, 0);
    else data[p] = sentinelText(formCode, rev, p);
  }
  data['document.title'] = '[' + rev + '] Stage A runtime ' + formCode + ' ' + new Date().toISOString().slice(0, 10);
  data['document.code'] = 'STAGE-A-' + rev + '-' + formCode;
  return data;
}

async function runtimeRender(client, templateCode, data, outPath) {
  const r = await client._fetch('POST', '/forms/runtime/' + templateCode + '/render-docx', {
    body: { data: data },
    raw: true,
  });
  if (r.status >= 400) {
    return { status: r.status, error: 'render-docx failed: ' + r.status, body: r.body && r.body.toString ? r.body.toString().slice(0, 500) : null, headers: r.headers };
  }
  ensureDir(dirname(outPath));
  writeFileSync(outPath, r.body);
  return {
    status: r.status,
    path: outPath,
    sha256: sha256(r.body),
    bytes: r.body.length,
    headers: {
      templateCode: r.headers.get('x-qllaw-template-code'),
      missingRequiredCount: r.headers.get('x-qllaw-missing-required-count'),
      warningCount: r.headers.get('x-qllaw-warning-count'),
    },
  };
}

async function runtimePreviewSession(client, templateCode, data) {
  const r = await client._fetch('POST', '/forms/runtime/' + templateCode + '/preview-session', {
    body: { data: data },
  });
  return { status: r.status, body: r.body, durMs: r.durMs };
}

async function downloadPreviewDocx(client, sessionId, outPath) {
  const r = await client._fetch('GET', '/forms/runtime/preview-sessions/' + sessionId + '/docx', { raw: true });
  if (r.status >= 400) {
    return { status: r.status, error: 'preview-session download failed: ' + r.status };
  }
  ensureDir(dirname(outPath));
  writeFileSync(outPath, r.body);
  return { status: r.status, path: outPath, sha256: sha256(r.body), bytes: r.body.length };
}

async function runForm(client, formCode) {
  const formDir = join(FORMS_DIR, formCode);
  ensureDir(formDir);
  ensureDir(join(formDir, 'artifacts'));
  const evidence = {
    formCode,
    harness: 'runtime-render',
    startedAt: new Date().toISOString(),
    commands: [],
    a4: {},
    a5: {},
    a6: {},
    a7: {},
    finalVerdict: 'RUNNING',
  };
  try {
    const contract = loadContract(formCode);
    const slotPaths = new Set();
    const fields = contract && Array.isArray(contract.canonicalFields) ? contract.canonicalFields : [];
    for (const f of fields) if (f && f.path) slotPaths.add(f.path);
    evidence.contractSlotCount = slotPaths.size;
    evidence.contractSlots = Array.from(slotPaths).slice(0, 200);
    evidence.a5.r1FieldCount = slotPaths.size;

    // 1. R1 render
    const r1Data = buildData(formCode, 'R1');
    const r1Path = join(formDir, 'artifacts', formCode + '_R1.docx');
    const r1 = await runtimeRender(client, formCode, r1Data, r1Path);
    evidence.commands.push({ name: 'runtimeRender.R1', status: r1.status });
    evidence.a7.r1 = r1;
    if (r1.status >= 400) {
      evidence.error = 'R1 render failed: ' + JSON.stringify(r1.error || r1);
      evidence.finalVerdict = 'FAIL_RUNTIME_RENDER';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }

    // 2. R2 render
    const r2Data = buildData(formCode, 'R2');
    const r2Path = join(formDir, 'artifacts', formCode + '_R2.docx');
    const r2 = await runtimeRender(client, formCode, r2Data, r2Path);
    evidence.commands.push({ name: 'runtimeRender.R2', status: r2.status });
    evidence.a7.r2 = r2;
    if (r2.status >= 400) {
      evidence.error = 'R2 render failed: ' + JSON.stringify(r2.error || r2);
      evidence.finalVerdict = 'FAIL_RUNTIME_RENDER';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }

    // 3. Determinism: re-render R1 with same data
    const r1AgainPath = join(formDir, 'artifacts', formCode + '_R1_again.docx');
    const r1Again = await runtimeRender(client, formCode, r1Data, r1AgainPath);
    evidence.commands.push({ name: 'runtimeRender.R1Again', status: r1Again.status });
    evidence.a6.r1Again = r1Again;
    if (r1Again.status !== 200) {
      evidence.error = 'R1 determinism re-render failed';
      evidence.finalVerdict = 'FAIL_RUNTIME_RENDER';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }
    const deterministic = r1Again.sha256 === r1.sha256;
    evidence.a6.r1Deterministic = deterministic;

    // 4. R1 != R2
    const differentData = r1.sha256 !== r2.sha256;
    evidence.a6.r2DifferentFromR1 = differentData;

    // 5. Preview session round-trip
    const sessionR1 = await runtimePreviewSession(client, formCode, r1Data);
    evidence.commands.push({ name: 'previewSession.R1', status: sessionR1.status });
    evidence.a6.r1Session = sessionR1;
    if (sessionR1.status === 200 && sessionR1.body && sessionR1.body.sessionId) {
      const previewPath = join(formDir, 'artifacts', formCode + '_R1_preview.docx');
      const download = await downloadPreviewDocx(client, sessionR1.body.sessionId, previewPath);
      evidence.commands.push({ name: 'previewDocx.R1', status: download.status });
      evidence.a7.r1Preview = download;
    } else {
      evidence.a7.r1Preview = { status: sessionR1.status, body: sessionR1.body };
    }

    evidence.a5.r1Inputs = r1Data;
    evidence.a5.r2Inputs = r2Data;

    if (deterministic && differentData && r1.bytes > 0 && r2.bytes > 0) {
      evidence.finalVerdict = 'PASS_EVIDENCE_COLLECTED';
    } else {
      evidence.finalVerdict = 'INCOMPLETE_EVIDENCE';
      if (!deterministic) evidence.error = (evidence.error || '') + ' R1 not deterministic';
      if (!differentData) evidence.error = (evidence.error || '') + ' R1 hash equals R2 hash';
    }
  } catch (err) {
    evidence.error = String(err && err.stack ? err.stack : err);
    evidence.finalVerdict = 'EXCEPTION';
  }
  evidence.endedAt = new Date().toISOString();
  saveJson(join(formDir, 'execution.json'), evidence);
  return evidence;
}

async function main() {
  const startTs = new Date().toISOString();
  const client = new ApiClient();
  const login = await client.login();
  console.log('login OK', login && login.user && login.user.username);

  const results = {};
  for (const formCode of GOLDEN_FORMS) {
    console.log('=== runtime-render', formCode);
    const ev = await runForm(client, formCode);
    results[formCode] = {
      finalVerdict: ev.finalVerdict,
      r1Sha256: ev.a7 && ev.a7.r1 && ev.a7.r1.sha256,
      r2Sha256: ev.a7 && ev.a7.r2 && ev.a7.r2.sha256,
      r1Bytes: ev.a7 && ev.a7.r1 && ev.a7.r1.bytes,
      r2Bytes: ev.a7 && ev.a7.r2 && ev.a7.r2.bytes,
      r1PreviewStatus: ev.a7 && ev.a7.r1Preview && ev.a7.r1Preview.status,
      deterministic: ev.a6 && ev.a6.r1Deterministic,
      r2DifferentFromR1: ev.a6 && ev.a6.r2DifferentFromR1,
      contractSlotCount: ev.contractSlotCount,
      error: ev.error,
    };
  }
  const endTs = new Date().toISOString();
  const summary = {
    startedAt: startTs,
    endedAt: endTs,
    harness: 'runtime-render',
    forms: results,
    totals: {
      passEvidence: Object.values(results).filter((r) => r.finalVerdict === 'PASS_EVIDENCE_COLLECTED').length,
      fail: Object.values(results).filter((r) => /FAIL/.test(r.finalVerdict)).length,
      incomplete: Object.values(results).filter((r) => /INCOMPLETE|EXCEPTION|NOT_AVAILABLE/.test(r.finalVerdict)).length,
    },
  };
  saveJson(join(EVIDENCE_ROOT, 'master-form-matrix.runtime.json'), summary);
  saveJson(COMMANDS_LOG, { startedAt: startTs, endedAt: endTs, harness: 'runtime-render', commands: client.lastResponses });
  console.log('SUMMARY runtime', JSON.stringify(summary.totals));
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : e);
  process.exit(1);
});
