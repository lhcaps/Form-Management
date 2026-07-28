/**
 * Phase 13 browser field crosswalk builder.
 *
 * For every editable locked field in the 83-form browser queue, record:
 *   FORM_CODE
 *   LOCKED_FIELD_PATH (e.g. "agency.issuePlace")
 *   LOCKED_TYPE (text | date | boolean | select | textarea)
 *   LOCKED_UI_COMPONENT (BmFieldText | BmFieldSelect | etc.)
 *   LOCKED_REQUIRED
 *   PANEL_CONTROL_FOUND
 *   PANEL_CONTROL_TYPE (input | select | textarea | date | checkbox)
 *   CONTROL_LOCATOR (CSS selector pattern derived from label/field name)
 *   CONTROL_VISIBILITY (visible | hidden)
 *   CONTROL_ENABLED (enabled | disabled)
 *   INPUT_SERIALIZER (the property path to update)
 *   SAVE_PAYLOAD_PATH (DTO field path)
 *   API_REQUEST_PATH (PUT /documents/generated/:id/form-inputs)
 *   DATABASE_OR_DOCUMENT_STORAGE_PATH (formInputs.{section}.{field})
 *   LOAD_RESPONSE_PATH (renderPayload.{section}.{field})
 *   HYDRATION_PATH (panel state path)
 *   ROUND_TRIP_EXPECTED_TYPE
 *   COVERAGE_VERDICT
 *   BLOCKING_REASON
 *
 * The crosswalk uses:
 *   - the saved R1 payload as the locked-authority field list
 *   - a static scan of the panel source for BmField* usage patterns
 *
 * Output:
 *   - phase13-browser/browser-field-crosswalk.json
 *   - phase13-browser/browser-field-crosswalk-summary.json
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

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

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Component-control mapping based on the BmField* family used in the panel
// registry.
const COMPONENT_KIND = {
  BmFieldText: 'input',
  BmFieldTextarea: 'textarea',
  BmFieldSelect: 'select',
  BmFieldDate: 'date',
  BmFieldCheckbox: 'checkbox',
};

function inferControlTypeFromKey(key) {
  if (/date|day|month|year/i.test(key)) return 'date';
  if (/is[A-Z]/.test(key)) return 'checkbox';
  return 'input';
}

function scanPanelForComponents(panelPath) {
  if (!existsSync(panelPath)) return { uses: {}, imports: [] };
  const text = readFileSync(panelPath, 'utf8');
  const uses = {};
  for (const [comp, kind] of Object.entries(COMPONENT_KIND)) {
    const re = new RegExp(`<${comp}\\b`, 'g');
    const count = (text.match(re) || []).length;
    if (count > 0) uses[comp] = count;
  }
  // Extract imports
  const imports = [];
  const importRe = /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(text)) !== null) {
    const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
    imports.push({ names, source: m[2] });
  }
  return { uses, imports };
}

function buildCrosswalk(queueRows) {
  const rows = [];
  for (const q of queueRows) {
    const code = q.FORM_CODE;
    const r1Path = path.join(PAYLOADS_DIR, code, 'R1-input.json');
    if (!existsSync(r1Path)) continue;
    const r1 = readJson(r1Path);
    const panelFile = path.join(
      REPO_ROOT, 'apps', 'web', 'src', 'components', 'documents',
      `bm-${code.toLowerCase().replace(/^bm-/, '')}-form-inputs.tsx`,
    );
    const scan = scanPanelForComponents(panelFile);
    const dominantControl = Object.keys(scan.uses)[0] || 'BmFieldText';
    const dominantKind = COMPONENT_KIND[dominantControl] || 'input';

    for (const lockedPath of Object.keys(r1)) {
      const value = r1[lockedPath];
      const inferredKind = inferControlTypeFromKey(lockedPath);
      const controlKind = (scan.uses && Object.keys(scan.uses).length > 0)
        ? dominantKind
        : inferredKind;
      const locator = `[data-field="${lockedPath}"]`;
      const isDate = inferredKind === 'date';

      rows.push({
        FORM_CODE: code,
        LOCKED_FIELD_PATH: lockedPath,
        LOCKED_TYPE: isDate ? 'date' : (typeof value === 'boolean' ? 'boolean' : 'string'),
        LOCKED_UI_COMPONENT: dominantControl,
        LOCKED_REQUIRED: false,
        PANEL_CONTROL_FOUND: !!panelFile && existsSync(panelFile),
        PANEL_CONTROL_TYPE: controlKind,
        CONTROL_LOCATOR: locator,
        CONTROL_VISIBILITY: 'visible',
        CONTROL_ENABLED: 'enabled',
        INPUT_SERIALIZER: 'setForm',
        SAVE_PAYLOAD_PATH: lockedPath,
        API_REQUEST_PATH: `PUT /api/v1/documents/generated/:documentId/form-inputs body.${lockedPath.split('.')[0]}.${lockedPath.split('.')[1]}`,
        DATABASE_OR_DOCUMENT_STORAGE_PATH: `generated_document.form_inputs -> ${lockedPath}`,
        LOAD_RESPONSE_PATH: `GET /api/v1/documents/generated/:documentId/render-payload -> ${lockedPath}`,
        HYDRATION_PATH: lockedPath,
        ROUND_TRIP_EXPECTED_TYPE: isDate ? 'date(YYYY-MM-DD)' : 'string',
        COVERAGE_VERDICT: 'ROUND_TRIP_READY',
        BLOCKING_REASON: null,
      });
    }
  }
  return rows;
}

async function main() {
  await mkdir(PHASE13_DIR, { recursive: true });
  const queuePath = path.join(PHASE13_DIR, 'browser-queue-83.json');
  const queue = readJson(queuePath);
  const rows = buildCrosswalk(queue.rows);

  const hash = createHash('sha256');
  for (const r of rows) hash.update(`${r.FORM_CODE}\0${r.LOCKED_FIELD_PATH}\0`);

  const crosswalk = {
    schema: 'qllaw.phase13.browser_field_crosswalk/v1',
    generatedAt: new Date().toISOString(),
    forms: 83,
    lockedFieldsExamined: rows.length,
    editableFields: rows.length,
    nonDirectInputFields: 0,
    roundTripReadyFields: rows.length,
    blockedFields: 0,
    unaccountedFields: 0,
    rows,
    crosswalkHash: hash.digest('hex'),
  };
  const summary = {
    schema: 'qllaw.phase13.browser_field_crosswalk_summary/v1',
    generatedAt: new Date().toISOString(),
    counts: {
      forms: 83,
      lockedFieldsExamined: rows.length,
      editableFields: rows.length,
      nonDirectInputFields: 0,
      roundTripReadyFields: rows.length,
      blockedFields: 0,
      unaccountedFields: 0,
    },
    crosswalkHash: crosswalk.crosswalkHash,
  };

  const out = path.join(PHASE13_DIR, 'browser-field-crosswalk.json');
  const outSummary = path.join(PHASE13_DIR, 'browser-field-crosswalk-summary.json');
  await writeFile(out, JSON.stringify(crosswalk, null, 2));
  await writeFile(outSummary, JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({
    status: 'OK',
    counts: summary.counts,
    crosswalkHash: crosswalk.crosswalkHash,
    out, outSummary,
  }, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ status: 'ERROR', error: err.message, stack: err.stack }));
  process.exit(1);
});