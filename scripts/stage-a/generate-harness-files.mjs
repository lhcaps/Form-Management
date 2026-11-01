import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const FILES = {
  'test/stage-a/runtime/helpers/api-client.mjs': String.raw`// Stage A runtime helpers. Pure Node, no external deps.
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableJson(value[k])).join(',') + '}';
}

export class ApiClient {
  constructor({ base = API } = {}) {
    this.base = base;
    this.cookie = null;
    this.lastResponses = [];
  }

  async _fetch(method, path, opts = {}) {
    const { body, headers, raw = false, query } = opts;
    let url = path.startsWith('http') ? path : this.base + path;
    if (query) url += '?' + new URLSearchParams(query).toString();
    const h = Object.assign({}, headers ?? {});
    if (this.cookie) h['cookie'] = this.cookie;
    let payload;
    if (body !== undefined && body !== null) {
      if (Buffer.isBuffer(body)) {
        payload = body;
      } else {
        h['content-type'] = h['content-type'] ?? 'application/json';
        payload = JSON.stringify(body);
      }
    }
    const t0 = Date.now();
    const res = await fetch(url, { method, headers: h, body: payload });
    const durMs = Date.now() - t0;
    const setCookie = res.headers.get('set-cookie');
    if (setCookie && !this.cookie) {
      const m = /qlv_session=([^;]+)/.exec(setCookie);
      if (m) this.cookie = 'qlv_session=' + m[1];
    }
    if (raw) {
      const buf = Buffer.from(await res.arrayBuffer());
      this.lastResponses.push({ method, path, status: res.status, durMs });
      return { status: res.status, headers: res.headers, body: buf, durMs };
    }
    let text = '';
    try { text = await res.text(); } catch { text = ''; }
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    this.lastResponses.push({ method, path, status: res.status, durMs });
    return { status: res.status, headers: res.headers, body: parsed, durMs };
  }

  async login(username = 'admin', password = 'admin123') {
    const r = await this._fetch('POST', '/auth/login', { body: { username, password } });
    if (r.status !== 200) throw new Error('login failed ' + r.status + ': ' + JSON.stringify(r.body));
    return r.body;
  }

  async listCases() { return this._fetch('GET', '/cases'); }
  async createCase(body) { return this._fetch('POST', '/cases', { body }); }
  async getCase(id) { return this._fetch('GET', '/cases/' + id); }
  async listAvailableTemplates(caseId) { return this._fetch('GET', '/documents/cases/' + caseId + '/available-templates'); }
  async planDocumentBatch(caseId, plan) { return this._fetch('POST', '/documents/cases/' + caseId + '/plan', { body: plan }); }
  async draftFromTemplate(body) { return this._fetch('POST', '/documents/draft-from-template', { body }); }
  async updateFormInputs(documentId, body) { return this._fetch('POST', '/documents/generated/' + documentId + '/form-inputs', { body }); }
  async putContractFormInputs(documentId, body) { return this._fetch('PUT', '/documents/generated/' + documentId + '/contract-form-inputs', { body }); }
  async renderDocx(documentId) { return this._fetch('POST', '/documents/generated/' + documentId + '/render-docx', { body: {} }); }
  async convertPdf(documentId, opts = {}) { return this._fetch('POST', '/documents/generated/' + documentId + '/convert-pdf', { body: { force: true, convertedByName: 'stage-a-runtime', ...opts } }); }
  async getAudit(documentId) { return this._fetch('GET', '/documents/generated/' + documentId + '/audit'); }
  async getFormSchema(documentId) { return this._fetch('GET', '/documents/generated/' + documentId + '/form-schema'); }
  async previewDocx(documentId, sample = false) { return this._fetch('GET', '/documents/generated/' + documentId + '/preview', { query: { sample } }); }
  async downloadDocx(documentId, outPath) {
    const r = await this._fetch('POST', '/documents/generated/' + documentId + '/render-docx', { body: {}, raw: true });
    if (r.status >= 400) throw new Error('docx download failed: ' + r.status);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, r.body);
    return { path: outPath, sha256: sha256(r.body), bytes: r.body.length };
  }
}

export const Hash = { sha256, stableJson };

export function saveJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

export function ensureDir(p) { mkdirSync(p, { recursive: true }); }
export function loadJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
`,

  'test/stage-a/runtime/helpers/sentinels.mjs': String.raw`// Deterministic sentinel generation per form / revision / field index.
// Avoids substring collisions with legal template text.
const FORMS = ['001', '136', '148', '156', '157', '168', '171', '174', '181', '206', '213'];

function pad(n, w = 3) { return String(n).padStart(w, '0'); }

// Distinct, deterministic, type-valid sentinels per form/rev/field.
export function sentinelText(formCode, rev, fieldKey) {
  const f = formCode.replace(/^BM-/, '');
  return 'A5_BM' + f + '_' + rev + '_' + fieldKey.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40) + '_SENT';
}

export function sentinelMultiline(formCode, rev, fieldKey, lines = 2) {
  const head = sentinelText(formCode, rev, fieldKey);
  return head + '\\n' + Array.from({ length: lines - 1 }, (_, i) => head + '_L' + (i + 2)).join('\\n');
}

export function sentinelDate(rev, idx) {
  // 2027-01-09 (R1) / 2028-03-15 (R2) — deterministic, no timezone shift on UTC+7
  return rev === 'R1' ? '2027-01-09' : '2028-03-15';
}

export function sentinelNumber(rev, idx) {
  return rev === 'R1' ? 4242 + idx : 9001 + idx;
}

export function sentinelBool(rev, idx) {
  return idx % 2 === 0 ? (rev === 'R1' ? true : false) : (rev === 'R1' ? false : true);
}

export function sentinelSelect(rev, idx, options = ['A', 'B', 'C']) {
  return options[(idx + (rev === 'R1' ? 0 : 1)) % options.length];
}

// Distinct role-specific actors per form to detect cross-form leakage.
export function roleSentinels(formCode) {
  const f = formCode.replace(/^BM-/, '');
  return {
    issuer: 'KSV_PHAT_HANH_BM' + f,
    operative: 'KSV_THI_HANH_BM' + f,
    signerTitle: 'Kiểm sát viên sơ cấp BM-' + f,
    signerName: 'Nguyễn Văn Ký_' + f,
    recipient: 'Cơ quan nhận BM-' + f,
    agency: 'Viện KSND BM-' + f,
    footerRole: 'Kiểm sát viên BM-' + f,
  };
}

export const GOLDEN_FORMS = FORMS.map((c) => 'BM-' + c);
`,
};

for (const [path, content] of Object.entries(FILES)) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { encoding: 'utf8' });
  console.log('wrote', path, 'bytes=', existsSync(path) ? require('node:fs').statSync(path).size : 0);
}
