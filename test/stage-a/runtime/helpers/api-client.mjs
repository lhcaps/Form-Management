// Stage A runtime helpers. Pure Node, no external deps.
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

  async _fetch(method, path, opts) {
    opts = opts || {};
    var body = opts.body, headers = opts.headers, raw = opts.raw, query = opts.query;
    var url = path.startsWith('http') ? path : this.base + path;
    if (query) url += '?' + new URLSearchParams(query).toString();
    var h = {};
    if (headers) for (var k in headers) h[k] = headers[k];
    if (this.cookie) h['cookie'] = this.cookie;
    // CSRF guard requires matching Origin/Referer for cross-origin cookie auth
    if (!h['origin'] && !h['referer']) {
      h['origin'] = process.env.API_ORIGIN || 'http://localhost:3000';
      h['referer'] = (process.env.API_ORIGIN || 'http://localhost:3000') + '/';
    }
    var payload;
    if (body !== undefined && body !== null) {
      if (Buffer.isBuffer(body)) payload = body;
      else {
        h['content-type'] = h['content-type'] || 'application/json';
        payload = JSON.stringify(body);
      }
    }
    var t0 = Date.now();
    var res = await fetch(url, { method: method, headers: h, body: payload });
    var durMs = Date.now() - t0;
    var setCookie = res.headers.get('set-cookie');
    if (setCookie && !this.cookie) {
      var m = /qlv_session=([^;]+)/.exec(setCookie);
      if (m) this.cookie = 'qlv_session=' + m[1];
    }
    if (raw) {
      var buf = Buffer.from(await res.arrayBuffer());
      this.lastResponses.push({ method: method, path: path, status: res.status, durMs: durMs });
      return { status: res.status, headers: res.headers, body: buf, durMs: durMs };
    }
    var text = '';
    try { text = await res.text(); } catch (e) { text = ''; }
    var parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
    this.lastResponses.push({ method: method, path: path, status: res.status, durMs: durMs });
    return { status: res.status, headers: res.headers, body: parsed, durMs: durMs };
  }

  async login(username, password) {
    if (!username) username = 'admin';
    if (!password) password = 'admin123';
    var r = await this._fetch('POST', '/auth/login', { body: { username: username, password: password } });
    if (r.status !== 200) throw new Error('login failed ' + r.status + ': ' + JSON.stringify(r.body));
    return r.body;
  }

  async listCases() { return this._fetch('GET', '/cases'); }
  async createCase(body) { return this._fetch('POST', '/cases', { body: body }); }
  async getCase(id) { return this._fetch('GET', '/cases/' + id); }
  async listAvailableTemplates(caseId) { return this._fetch('GET', '/documents/cases/' + caseId + '/available-templates'); }
  async planDocumentBatch(caseId, plan) { return this._fetch('POST', '/documents/cases/' + caseId + '/plan', { body: plan }); }
  async draftFromTemplate(body) { return this._fetch('POST', '/documents/draft-from-template', { body: body }); }
  async updateFormInputs(documentId, body) { return this._fetch('POST', '/documents/generated/' + documentId + '/form-inputs', { body: body }); }
  async putContractFormInputs(documentId, body) { return this._fetch('PUT', '/documents/generated/' + documentId + '/contract-form-inputs', { body: body }); }
  async renderDocx(documentId) { return this._fetch('POST', '/documents/generated/' + documentId + '/render-docx', { body: {} }); }
  async convertPdf(documentId, opts) { return this._fetch('POST', '/documents/generated/' + documentId + '/convert-pdf', { body: Object.assign({ force: true, convertedByName: 'stage-a-runtime' }, opts || {}) }); }
  async getAudit(documentId) { return this._fetch('GET', '/documents/generated/' + documentId + '/audit'); }
  async getFormSchema(documentId) { return this._fetch('GET', '/documents/generated/' + documentId + '/form-schema'); }
  async previewDocx(documentId, sample) { return this._fetch('GET', '/documents/generated/' + documentId + '/preview', { query: { sample: !!sample } }); }
  async downloadDocx(documentId, outPath) {
    var r = await this._fetch('POST', '/documents/generated/' + documentId + '/render-docx', { body: {}, raw: true });
    if (r.status >= 400) throw new Error('docx download failed: ' + r.status);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, r.body);
    return { path: outPath, sha256: sha256(r.body), bytes: r.body.length };
  }
}

export var Hash = { sha256: sha256, stableJson: stableJson };
export function saveJson(p, value) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(value, null, 2)); }
export function ensureDir(p) { mkdirSync(p, { recursive: true }); }
export function loadJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
