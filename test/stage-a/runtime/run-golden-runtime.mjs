// Stage A golden-form runtime runner.
// For each of the 11 forms:
//   1. login as admin
//   2. create a case
//   3. list available templates
//   4. draft document from template
//   5. populate contract form inputs (R1 sentinel values)
//   6. render DOCX
//   7. capture payload + render-model hashes
//   8. update contract form inputs (R2)
//   9. render DOCX again
//  10. record provenance evidence per form
// Idempotent: reuses the same case id when present.
import { ApiClient, Hash, saveJson, ensureDir, loadJson } from './helpers/api-client.mjs';
import { GOLDEN_FORMS, sentinelText, sentinelDate, sentinelNumber, sentinelBool, roleSentinels } from './helpers/sentinels.mjs';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_ROOT = join(__dirname, '..', '..', '..', 'docs', 'audit', 'final-213-customer-ready', 'stage-a-runtime');
const ARTIFACTS_ROOT = join(EVIDENCE_ROOT, 'artifacts');
const COMMANDS_LOG = join(EVIDENCE_ROOT, 'commands.json');
const FORMS_DIR = join(EVIDENCE_ROOT, 'forms');

ensureDir(EVIDENCE_ROOT);
ensureDir(ARTIFACTS_ROOT);
ensureDir(FORMS_DIR);

// Load the A5 field matrix (source of truth for canonical fields)
const A5_MATRIX_PATH = join(__dirname, '..', '..', 'docs', 'audit', 'final-213-customer-ready', 'a5-field-matrix.json');
let a5Matrix = null;
if (existsSync(A5_MATRIX_PATH)) {
  try { a5Matrix = loadJson(A5_MATRIX_PATH); }
  catch (e) { console.warn('a5 matrix parse error', e.message); }
}
const a5ByCode = new Map();
if (a5Matrix && Array.isArray(a5Matrix.forms)) {
  for (const f of a5Matrix.forms) a5ByCode.set(f.code, f);
}

// Build a map from slotId → contract JSON so we can ask "what is a real editable field for this form?"
const contractsRoot = join(__dirname, '..', '..', 'docs', 'audit', 'docx', 'contracts', 'locked');
function loadContract(formCode) {
  if (!existsSync(contractsRoot)) return null;
  const { readdirSync } = require('node:fs');
  const files = readdirSync(contractsRoot).filter((n) => n.startsWith(formCode + '__') && n.endsWith('.contract.locked.json'));
  if (files.length === 0) return null;
  return loadJson(join(contractsRoot, files[0]));
}

// One case per execution: idempotent, stored under .tmp-qllaw
function executionCaseId() {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  return 'STAGE-A-' + stamp;
}

function deterministicCaseName(stamp) { return 'STAGE-A-RUNTIME-' + stamp; }

const allCommands = [];

async function runForm(client, formCode) {
  const formDir = join(FORMS_DIR, formCode);
  ensureDir(formDir);
  ensureDir(join(formDir, 'artifacts'));
  const evidence = {
    formCode,
    startedAt: new Date().toISOString(),
    commands: [],
    a4: {},
    a5: {},
    a6: {},
    a7: {},
    finalVerdict: 'RUNNING',
  };
  try {
    // 1. List cases
    const casesResp = await client.listCases();
    let caseId = null;
    const list = casesResp.body && casesResp.body.data ? casesResp.body.data : (Array.isArray(casesResp.body) ? casesResp.body : null);
    if (Array.isArray(list)) {
      const wanted = executionCaseId();
      const found = list.find((c) => c.code === wanted || (c.id && String(c.id) === wanted));
      if (found) caseId = String(found.id);
    }
    if (!caseId) {
      const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const createResp = await client.createCase({
        caseCode: 'STAGE-A-' + stamp,
        caseTitle: deterministicCaseName(stamp),
        caseSummary: 'Stage A runtime harness - execution-owned case ' + stamp,
        caseType: 'CRIMINAL_CASE',
        priority: 'NORMAL',
      });
      evidence.commands.push({ name: 'createCase', status: createResp.status, durMs: createResp.durMs });
      if (createResp.status >= 400) throw new Error('createCase ' + createResp.status + ': ' + JSON.stringify(createResp.body));
      caseId = String(createResp.body && createResp.body.id ? createResp.body.id : (createResp.body && createResp.body.data && createResp.body.data.id) || '');
      if (!caseId) throw new Error('createCase returned no id');
    }
    evidence.caseId = caseId;
    allCommands.push({ formCode, command: 'createCase', caseId, status: 'OK' });

    // 2. List available templates
    const templatesResp = await client.listAvailableTemplates(caseId);
    evidence.commands.push({ name: 'listAvailableTemplates', status: templatesResp.status, durMs: templatesResp.durMs });
    var templatesList = [];
    if (templatesResp.body) {
      if (Array.isArray(templatesResp.body)) templatesList = templatesResp.body;
      else if (templatesResp.body.data && Array.isArray(templatesResp.body.data)) templatesList = templatesResp.body.data;
      else if (templatesResp.body.items && Array.isArray(templatesResp.body.items)) templatesList = templatesResp.body.items;
      else if (templatesResp.body.templates && Array.isArray(templatesResp.body.templates)) templatesList = templatesResp.body.templates;
    }
    evidence.templatesListRaw = templatesResp.body;
    evidence.templatesListCount = templatesList.length;
    const template = templatesList.find((t) => (t.templateCode || t.code) === formCode) || templatesList.find((t) => String(t.id || '').startsWith(formCode));
    if (!template) {
      evidence.finalVerdict = 'NOT_AVAILABLE_TEMPLATE';
      evidence.error = 'template not in available-templates';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }
    evidence.templateId = template.id || template.templateCode || formCode;

    // 3. Draft document
    const draftResp = await client.draftFromTemplate({
      caseId: caseId,
      templateCode: formCode,
    });
    evidence.commands.push({ name: 'draftFromTemplate', status: draftResp.status, durMs: draftResp.durMs });
    if (draftResp.status >= 400) {
      evidence.error = 'draftFromTemplate ' + draftResp.status + ': ' + JSON.stringify(draftResp.body);
      evidence.finalVerdict = 'FAIL_DRAFT';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }
    const documentId = String(draftResp.body && draftResp.body.id ? draftResp.body.id : (draftResp.body && draftResp.body.document && draftResp.body.document.id) || '');
    if (!documentId) {
      evidence.error = 'draftFromTemplate returned no documentId';
      evidence.finalVerdict = 'FAIL_DRAFT';
      saveJson(join(formDir, 'execution.json'), evidence);
      return evidence;
    }
    evidence.documentId = documentId;
    evidence.revisionId = draftResp.body.revisionId || draftResp.body.revision_id || null;
    evidence.draftPayload = draftResp.body;

    // 4. Inspect contract for canonical editable slot ids
    const contract = loadContract(formCode);
    const slotPaths = new Set();
    if (contract && Array.isArray(contract.docxSlots)) {
      for (const s of contract.docxSlots) {
        if (s && s.slotId) slotPaths.add(s.slotId);
      }
    }
    evidence.contractSlotCount = slotPaths.size;
    evidence.contractSlots = Array.from(slotPaths).slice(0, 200);

    // 5. Build R1 / R2 form-inputs payload from canonical contract slots
    const roles = roleSentinels(formCode);
    const editable = Array.from(slotPaths).filter((p) => !p.endsWith('.number') && !p.endsWith('.count'));
    const r1Inputs = {};
    const r2Inputs = {};
    editable.slice(0, 30).forEach((slot, idx) => {
      const tail = slot.split('.').pop() || 'x';
      // role-specific keys get specific role tokens
      if (/positionTitle|chucVu/i.test(tail)) {
        r1Inputs[slot] = roles.signerTitle;
        r2Inputs[slot] = roles.signerTitle + '_R2';
      } else if (/signerName|nguoiKy|fullName|hoTen/i.test(tail)) {
        r1Inputs[slot] = roles.signerName;
        r2Inputs[slot] = roles.signerName + '_R2';
      } else if (/date|ngay/i.test(tail)) {
        r1Inputs[slot] = sentinelDate('R1');
        r2Inputs[slot] = sentinelDate('R2');
      } else if (/isFinal|certified|approved|verified|xacNhan|chapNhan/i.test(tail)) {
        r1Inputs[slot] = sentinelBool('R1', idx);
        r2Inputs[slot] = sentinelBool('R2', idx);
      } else if (/count|soLuong|soLan/i.test(tail)) {
        r1Inputs[slot] = sentinelNumber('R1', idx);
        r2Inputs[slot] = sentinelNumber('R2', idx);
      } else {
        r1Inputs[slot] = sentinelText(formCode, 'R1', tail);
        r2Inputs[slot] = sentinelText(formCode, 'R2', tail);
      }
    });
    evidence.a5.r1FieldCount = Object.keys(r1Inputs).length;
    evidence.a5.r2FieldCount = Object.keys(r2Inputs).length;
    evidence.a5.r1Hash = createHash('sha256').update(Hash.stableJson(r1Inputs)).digest('hex');
    evidence.a5.r2Hash = createHash('sha256').update(Hash.stableJson(r2Inputs)).digest('hex');

    // 6. Update form inputs R1
    const r1Update = await client.updateFormInputs(documentId, { formInputs: r1Inputs });
    evidence.commands.push({ name: 'updateFormInputs.R1', status: r1Update.status, durMs: r1Update.durMs });
    if (r1Update.status >= 400) {
      evidence.error = 'R1 update ' + r1Update.status + ': ' + JSON.stringify(r1Update.body).slice(0, 500);
    } else {
      evidence.a5.r1Response = r1Update.body;
    }

    // 7. Render DOCX R1
    const r1Render = await client.renderDocx(documentId);
    evidence.commands.push({ name: 'renderDocx.R1', status: r1Render.status, durMs: r1Render.durMs });
    evidence.a5.r1Render = { status: r1Render.status, contentLength: r1Render.body && r1Render.body.byteLength ? r1Render.body.byteLength : (r1Render.body && r1Render.body.length) || 0 };

    // 8. Download DOCX R1
    const r1DocxPath = join(formDir, 'artifacts', formCode + '_R1.docx');
    const r1Download = await client.downloadDocx(documentId, r1DocxPath);
    evidence.a7.r1 = { path: r1DocxPath, sha256: r1Download.sha256, bytes: r1Download.bytes };

    // 9. Reload & re-fetch document state (R1 reload)
    const auditR1 = await client.getAudit(documentId);
    evidence.commands.push({ name: 'getAudit.R1', status: auditR1.status, durMs: auditR1.durMs });
    evidence.a5.r1Audit = auditR1.body;

    // 10. Update form inputs R2
    const r2Update = await client.updateFormInputs(documentId, { formInputs: r2Inputs });
    evidence.commands.push({ name: 'updateFormInputs.R2', status: r2Update.status, durMs: r2Update.durMs });
    if (r2Update.status >= 400) {
      evidence.error = (evidence.error || '') + ' R2 update ' + r2Update.status + ': ' + JSON.stringify(r2Update.body).slice(0, 500);
    } else {
      evidence.a5.r2Response = r2Update.body;
    }

    // 11. Render DOCX R2
    const r2Render = await client.renderDocx(documentId);
    evidence.commands.push({ name: 'renderDocx.R2', status: r2Render.status, durMs: r2Render.durMs });

    // 12. Download DOCX R2
    const r2DocxPath = join(formDir, 'artifacts', formCode + '_R2.docx');
    const r2Download = await client.downloadDocx(documentId, r2DocxPath);
    evidence.a7.r2 = { path: r2DocxPath, sha256: r2Download.sha256, bytes: r2Download.bytes };

    // 13. Preview
    const previewResp = await client.previewDocx(documentId);
    evidence.commands.push({ name: 'previewDocx.R2', status: previewResp.status, durMs: previewResp.durMs });
    evidence.a7.r2Preview = { status: previewResp.status, summary: previewResp.body && previewResp.body.summary };

    // 14. Convert to PDF
    const pdfResp = await client.convertPdf(documentId);
    evidence.commands.push({ name: 'convertPdf', status: pdfResp.status, durMs: pdfResp.durMs });
    evidence.a7.pdf = { status: pdfResp.status, body: pdfResp.body };

    // 15. Audit final
    const finalAudit = await client.getAudit(documentId);
    evidence.commands.push({ name: 'getAudit.R2', status: finalAudit.status, durMs: finalAudit.durMs });
    evidence.a7.r2Audit = finalAudit.body;

    // 16. Verdict
    evidence.finalVerdict = computeVerdict(evidence);
    saveJson(join(formDir, 'execution.json'), evidence);
    saveJson(join(formDir, 'field-roundtrip.json'), evidence.a5);
    saveJson(join(formDir, 'role-signature.json'), evidence.a4);
    saveJson(join(formDir, 'revision-provenance.json'), evidence.a7);
    saveJson(join(formDir, 'docx-field-mapping.json'), evidence.a6);
    saveJson(join(formDir, 'document-visual.json'), evidence);
    return evidence;
  } catch (e) {
    evidence.finalVerdict = 'EXCEPTION';
    evidence.error = String(e && e.message ? e.message : e);
    saveJson(join(formDir, 'execution.json'), evidence);
    return evidence;
  }
}

function computeVerdict(ev) {
  if (ev.error && /R1 update/.test(ev.error) && /R2 update/.test(ev.error)) return 'FAIL_PERSISTENCE';
  if (ev.a7 && ev.a7.r1 && ev.a7.r2 && ev.a7.r1.sha256 === ev.a7.r2.sha256) return 'FAIL_HASH_REUSE';
  if (ev.a5 && ev.a5.r1FieldCount === 0) return 'NO_EDITABLE_FIELDS';
  if (!ev.a7 || !ev.a7.r2 || !ev.a7.r2.sha256) return 'INCOMPLETE';
  return 'PASS_EVIDENCE_COLLECTED';
}

async function main() {
  const startTs = new Date().toISOString();
  const client = new ApiClient();
  const login = await client.login();
  allCommands.push({ command: 'login', user: login && login.user && login.user.username, status: 'OK' });

  const results = {};
  for (const formCode of GOLDEN_FORMS) {
    console.log('=== running', formCode);
    const ev = await runForm(client, formCode);
    results[formCode] = {
      finalVerdict: ev.finalVerdict,
      caseId: ev.caseId,
      documentId: ev.documentId,
      r1Sha256: ev.a7 && ev.a7.r1 && ev.a7.r1.sha256,
      r2Sha256: ev.a7 && ev.a7.r2 && ev.a7.r2.sha256,
      error: ev.error,
    };
  }
  const endTs = new Date().toISOString();
  const summary = {
    startedAt: startTs,
    endedAt: endTs,
    forms: results,
    totals: {
      passEvidence: Object.values(results).filter((r) => r.finalVerdict === 'PASS_EVIDENCE_COLLECTED').length,
      fail: Object.values(results).filter((r) => /FAIL/.test(r.finalVerdict)).length,
      incomplete: Object.values(results).filter((r) => /INCOMPLETE|NOT_AVAILABLE|EXCEPTION|NO_EDITABLE/.test(r.finalVerdict)).length,
    },
  };
  saveJson(join(EVIDENCE_ROOT, 'master-form-matrix.json'), summary);
  saveJson(COMMANDS_LOG, { startedAt: startTs, endedAt: endTs, commands: allCommands });
  saveJson(join(EVIDENCE_ROOT, 'execution-manifest.json'), summary);
  console.log('SUMMARY', JSON.stringify(summary.totals));
}

main().catch((e) => {
  console.error('FATAL', e && e.stack ? e.stack : e);
  process.exit(1);
});
