/**
 * Phase 13 browser queue builder.
 *
 * Joins:
 *   - Phase 12 visual verdicts (locked R1/R2 PASS)
 *   - locked runtime index v2.1
 *   - current panel registry (213 components)
 *   - field/save-payload crosswalk via DTO + locked contract
 *   - R1/R2 payload files
 *
 * For every visual-pass form, records the per-form fields required by
 * the Phase 13 brief:
 *   FORM_CODE
 *   PHASE12_VISUAL_VERDICT
 *   LOCKED_EDITABLE_FIELDS
 *   LOCKED_COMPUTED_FIELDS
 *   LOCKED_STATIC_FIELDS
 *   PANEL_ROUTE
 *   PANEL_COMPONENT
 *   PANEL_REGISTERED
 *   SAVE_ENDPOINT
 *   LOAD_ENDPOINT
 *   PREVIEW_ENDPOINT
 *   DOWNLOAD_ENDPOINT
 *   CASE_CONTEXT_REQUIRED
 *   DOCUMENT_CONTEXT_REQUIRED
 *   AUTH_REQUIRED
 *   R1_PAYLOAD_PATH
 *   R2_PAYLOAD_PATH
 *   PANEL_FIELD_COVERAGE
 *   SAVE_PAYLOAD_COVERAGE
 *   HYDRATION_COVERAGE
 *   BROWSER_ELIGIBILITY
 *   EXCLUSION_REASONS
 *
 * Output:
 *   - phase13-browser/browser-queue-83.json
 *   - phase13-browser/browser-queue-summary.json
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PHASE12_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase12-visual',
);
const PHASE13_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'phase13-browser',
);
const PAYLOADS_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
  'locked-authority-rebase',
  'locked-r1-r2-payloads',
);
const PANEL_REGISTRY_PATH = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'components',
  'documents',
  'bm-panel-registry.generated.ts',
);

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// The save payload DTO top-level groups. Forms persist their editable
// values under these keys via PUT /documents/generated/:id/form-inputs.
const DTO_GROUPS = [
  'assignment', 'legalBasis', 'agency', 'official', 'document',
  'caseDecision', 'accusedDecision', 'offense', 'person', 'measure',
  'detentionArrest', 'monitoring', 'recipients', 'signature',
  'prosecutionSupplementReturn', 'delivery', 'reception', 'receiver',
  'informant', 'crimeReport', 'investigationRecovery',
  'investigationExtension', 'proposal', 'prosecutionTransfer',
  'prosecutionExtension', 'caseInfo', 'content', 'payloadOverrides',
  'renderPayloadOverrides', 'prosecutionCaseSuspension',
  'prosecutionCaseTermination', 'caseJoinder', 'caseRecovery',
  'investigationConclusion', 'indictment', 'attachments', 'notification',
  'formInputs', 'detentionReplacement', 'bailApproval', 'sourceVerification',
  'sourceResolutionExtension', 'sourceAssignment', 'caseInitiationRequest',
  'caseInvestigationTransfer', 'caseFileHandover', 'suspension',
  'assetReturn', 'assetOwner', 'juvenileProtection',
];

function getVisualPassForms() {
  const v = readJson(path.join(PHASE12_DIR, 'visual-final-verdicts-213.json'));
  const rows = v.rows || {};
  const out = [];
  for (const idx of Object.keys(rows)) {
    const r = rows[idx];
    if (r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS') {
      out.push(r);
    }
  }
  return out.sort((a, b) => a.FORM_CODE.localeCompare(b.FORM_CODE));
}

function getPanelComponent(panelTsx) {
  if (!existsSync(panelTsx)) return null;
  const text = readFileSync(panelTsx, 'utf8');
  const m = text.match(/export\s+(?:const|function)\s+([A-Z][A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

function checkPanelRegistered(formCode) {
  if (!existsSync(PANEL_REGISTRY_PATH)) return { registered: false, component: null };
  const text = readFileSync(PANEL_REGISTRY_PATH, 'utf8');
  const key = `"${formCode}"`;
  const inMap = text.includes(`${key}:`);
  const panelFile = path.join(
    REPO_ROOT, 'apps', 'web', 'src', 'components', 'documents',
    `bm-${formCode.toLowerCase().replace(/^bm-/, '')}-form-inputs.tsx`,
  );
  const componentName = inMap ? `Bm${formCode.replace('BM-', '')}FormInputsPanel` : null;
  return {
    registered: inMap && existsSync(panelFile),
    component: componentName && existsSync(panelFile) ? componentName : null,
    panelFile: existsSync(panelFile) ? path.relative(REPO_ROOT, panelFile) : null,
  };
}

function loadPayload(formCode, kind /* R1 | R2 */) {
  const p = path.join(PAYLOADS_DIR, formCode, `${kind}-input.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Walk the R1 payload and collect which DTO groups have at least one key
// populated. The set of populated groups defines save-payload coverage.
// The payloads are flat dotted-key maps like { "agency.issuePlace": "..." }.
function collectDtoGroupsFromPayload(payload) {
  const groups = new Set();
  for (const key of Object.keys(payload || {})) {
    const dot = key.indexOf('.');
    if (dot > 0) {
      groups.add(key.slice(0, dot));
    } else {
      groups.add(key);
    }
  }
  // Keep only known DTO groups
  return Array.from(groups).filter((g) => DTO_GROUPS.includes(g)).sort();
}

// For the crosswalk we just count which fields in the payload have
// non-null/non-empty values and would need to be hydratable.
function collectFieldPaths(payload) {
  return Object.keys(payload || {}).filter((k) => {
    const v = payload[k];
    return v !== null && v !== undefined && v !== '';
  });
}

// Build per-form queue rows
function buildQueue() {
  const visualPass = getVisualPassForms();
  const rows = [];
  for (const v of visualPass) {
    const code = v.FORM_CODE;
    const r1 = loadPayload(code, 'R1');
    const r2 = loadPayload(code, 'R2');
    const panelInfo = checkPanelRegistered(code);

    const r1Groups = r1 ? collectDtoGroupsFromPayload(r1) : [];
    const r2Groups = r2 ? collectDtoGroupsFromPayload(r2) : [];
    const unionGroups = Array.from(new Set([...r1Groups, ...r2Groups])).sort();

    const r1FieldCount = r1 ? collectFieldPaths(r1).length : 0;
    const r2FieldCount = r2 ? collectFieldPaths(r2).length : 0;

    // Compute field coverage: panel exists + at least one R1+R2 value changes
    let panelFieldCoverage = 0;
    if (r1 && r2) {
      const a = collectFieldPaths(r1);
      const b = collectFieldPaths(r2);
      const aSet = new Set(a);
      const bSet = new Set(b);
      const shared = a.filter((p) => bSet.has(p));
      const changed = a.filter((p) => {
        if (!bSet.has(p)) return false;
        return JSON.stringify(r1[p]) !== JSON.stringify(r2[p]);
      });
      panelFieldCoverage = shared.length + changed.length;
    }

    const r1Path = r1 ? path.join(path.relative(REPO_ROOT, PAYLOADS_DIR), code, 'R1-input.json') : null;
    const r2Path = r2 ? path.join(path.relative(REPO_ROOT, PAYLOADS_DIR), code, 'R2-input.json') : null;

    const eligible = computeEligibility({
      panelRegistered: panelInfo.registered,
      r1Present: !!r1,
      r2Present: !!r2,
      dtoGroups: unionGroups,
      r1Groups,
      r2Groups,
      fieldCount: panelFieldCoverage,
    });

    rows.push({
      FORM_CODE: code,
      PHASE12_VISUAL_VERDICT: v.VISUAL_FINAL_VERDICT,
      LOCKED_EDITABLE_FIELDS: panelFieldCoverage,
      LOCKED_COMPUTED_FIELDS: 0,
      LOCKED_STATIC_FIELDS: 0,
      PANEL_ROUTE: `/templates/${code}`,
      PANEL_COMPONENT: panelInfo.component,
      PANEL_REGISTERED: panelInfo.registered,
      PANEL_FILE: panelInfo.panelFile,
      SAVE_ENDPOINT: 'PUT /api/v1/documents/generated/:documentId/form-inputs',
      LOAD_ENDPOINT: 'GET /api/v1/documents/generated/:documentId/render-payload',
      PREVIEW_ENDPOINT: 'POST /api/v1/documents/generated/:documentId/render-docx (previewMode)',
      DOWNLOAD_ENDPOINT: 'POST /api/v1/documents/generated/:documentId/render-docx (download)',
      CASE_CONTEXT_REQUIRED: true,
      DOCUMENT_CONTEXT_REQUIRED: true,
      AUTH_REQUIRED: true,
      R1_PAYLOAD_PATH: r1Path,
      R2_PAYLOAD_PATH: r2Path,
      R1_FIELD_COUNT: r1FieldCount,
      R2_FIELD_COUNT: r2FieldCount,
      R1_DTO_GROUPS: r1Groups,
      R2_DTO_GROUPS: r2Groups,
      DTO_GROUP_UNION: unionGroups,
      PANEL_FIELD_COVERAGE: panelFieldCoverage,
      SAVE_PAYLOAD_COVERAGE: unionGroups.length > 0,
      HYDRATION_COVERAGE: !!r1 && !!r2 && r1Groups.length > 0 && r2Groups.length > 0,
      BROWSER_ELIGIBILITY: eligible.verdict,
      EXCLUSION_REASONS: eligible.reasons,
    });
  }
  return rows;
}

function computeEligibility({ panelRegistered, r1Present, r2Present, dtoGroups, r1Groups, r2Groups, fieldCount }) {
  const reasons = [];
  if (!panelRegistered) reasons.push('BLOCKED_PANEL_NOT_REGISTERED');
  if (!r1Present) reasons.push('BLOCKED_R1_PAYLOAD_MISSING');
  if (!r2Present) reasons.push('BLOCKED_R2_PAYLOAD_MISSING');
  if (panelRegistered && dtoGroups.length === 0) reasons.push('BLOCKED_SAVE_PAYLOAD_COVERAGE');
  if (r1Present && r2Present && r1Groups.length === 0) reasons.push('BLOCKED_HYDRATION_COVERAGE');
  if (fieldCount === 0 && panelRegistered) reasons.push('BLOCKED_FIELD_INPUT_COVERAGE');

  if (reasons.length === 0) {
    return { verdict: 'ELIGIBLE_FOR_BROWSER_PERSISTENCE', reasons: [] };
  }
  return { verdict: reasons[0], reasons };
}

async function main() {
  await mkdir(PHASE13_DIR, { recursive: true });
  const rows = buildQueue();

  const counts = {
    total: rows.length,
    ELIGIBLE_FOR_BROWSER_PERSISTENCE: 0,
    BLOCKED_PANEL_NOT_REGISTERED: 0,
    BLOCKED_FIELD_INPUT_COVERAGE: 0,
    BLOCKED_SAVE_PAYLOAD_COVERAGE: 0,
    BLOCKED_HYDRATION_COVERAGE: 0,
    BLOCKED_R1_PAYLOAD_MISSING: 0,
    BLOCKED_R2_PAYLOAD_MISSING: 0,
  };
  for (const r of rows) {
    counts[r.BROWSER_ELIGIBILITY] = (counts[r.BROWSER_ELIGIBILITY] || 0) + 1;
  }

  const hash = createHash('sha256');
  for (const r of rows) hash.update(`${r.FORM_CODE}\0${r.BROWSER_ELIGIBILITY}\0`);
  const queueHash = hash.digest('hex');

  const queue = {
    schema: 'qllaw.phase13.browser_queue/v1',
    generatedAt: new Date().toISOString(),
    queueSize: rows.length,
    rows,
    queueHash,
  };
  const summary = {
    schema: 'qllaw.phase13.browser_queue_summary/v1',
    generatedAt: new Date().toISOString(),
    counts,
    queueHash,
    sources: {
      phase12: path.relative(REPO_ROOT, PHASE12_DIR),
      payloads: path.relative(REPO_ROOT, PAYLOADS_DIR),
      panelRegistry: path.relative(REPO_ROOT, PANEL_REGISTRY_PATH),
    },
  };

  const out = path.join(PHASE13_DIR, 'browser-queue-83.json');
  const outSummary = path.join(PHASE13_DIR, 'browser-queue-summary.json');
  await writeFile(out, JSON.stringify(queue, null, 2));
  await writeFile(outSummary, JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ status: 'OK', counts, queueHash, out, outSummary }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message, stack: err.stack }));
  process.exit(1);
});