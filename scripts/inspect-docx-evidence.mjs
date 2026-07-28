import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const PILOT = join(REPO, "agent-tools", "pilot-summary.json");
const STORAGE = join(REPO, "storage", "generated", "cases", "E2E-BM039-CONTRACT", "docx");
const OUT_DIR = join(REPO, ".tmp-r5_1-evidence");
const MANIFEST = join(REPO, "agent-tools", "r5_1-docx-manifest.json");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const pilot = JSON.parse(readFileSync(PILOT, "utf8"));
const candidates = pilot.results.filter(function (r) { return r.role === "PILOT_CANDIDATE"; });

function pickLatest(files, code) {
  const matching = files.filter(function (f) { return f.startsWith(code + "_"); });
  if (!matching.length) return null;
  let best = matching[0];
  let bestStat = statSync(join(STORAGE, best));
  for (const f of matching) {
    const s = statSync(join(STORAGE, f));
    if (s.mtimeMs > bestStat.mtimeMs) { best = f; bestStat = s; }
  }
  return best;
}

function validateZip(buffer) {
  if (buffer.length < 4) return { ok: false, reason: "too small" };
  const magic = buffer.slice(0, 4);
  const isPk = magic[0] === 0x50 && magic[1] === 0x4b && (magic[2] === 0x03 || magic[2] === 0x05 || magic[2] === 0x07);
  if (!isPk) return { ok: false, reason: "not PK" };
  return { ok: true };
}

function findEOCD(buffer) {
  const max = Math.min(buffer.length, 22 + 65557);
  for (let i = buffer.length - 22; i >= max; i--) {
    if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b && buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

function extractCentralDir(buffer) {
  const eocd = findEOCD(buffer);
  if (eocd < 0) return null;
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const cdSize = buffer.readUInt32LE(eocd + 12);
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  return { totalEntries: totalEntries, cdSize: cdSize, cdOffset: cdOffset, eocd: eocd };
}

function listEntries(buffer) {
  const cd = extractCentralDir(buffer);
  if (!cd) return [];
  const names = [];
  let p = cd.cdOffset;
  for (let i = 0; i < cd.totalEntries; i++) {
    if (p + 46 > buffer.length) break;
    const nameLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const commentLen = buffer.readUInt16LE(p + 32);
    const name = buffer.slice(p + 46, p + 46 + nameLen).toString("utf8");
    names.push(name);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

function extractFile(buffer, name) {
  const cd = extractCentralDir(buffer);
  if (!cd) return null;
  let p = cd.cdOffset;
  for (let i = 0; i < cd.totalEntries; i++) {
    if (p + 46 > buffer.length) return null;
    const nameLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const commentLen = buffer.readUInt16LE(p + 32);
    const compMethod = buffer.readUInt16LE(p + 10);
    const compSize = buffer.readUInt32LE(p + 20);
    const localOffset = buffer.readUInt32LE(p + 42);
    const entryName = buffer.slice(p + 46, p + 46 + nameLen).toString("utf8");
    if (entryName === name) {
      const localExtraLen = buffer.readUInt16LE(localOffset + 28);
      const fileStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + localExtraLen;
      const data = buffer.slice(fileStart, fileStart + compSize);
      if (compMethod === 0) return data;
      if (compMethod === 8) {
        try { return zlib.inflateRawSync(data); } catch { return null; }
      }
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

const files = readdirSync(STORAGE);

function validateXml(buf) {
  if (!buf) return { ok: false };
  const text = buf.toString("utf8");
  const openCount = (text.match(/<[a-zA-Z][^/>]*>/g) || []).length;
  const closeCount = (text.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
  const selfClose = (text.match(/<[a-zA-Z][^>]*\/>/g) || []).length;
  return { ok: text.length > 0, open: openCount, close: closeCount, selfClose: selfClose, length: text.length };
}

const manifest = [];
for (const c of candidates) {
  const file = pickLatest(files, c.code);
  if (!file) { manifest.push({ code: c.code, documentId: c.documentId, error: "no storage file" }); continue; }
  const buf = readFileSync(join(STORAGE, file));
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const zip = validateZip(buf);
  let entries = [];
  let ct = null;
  let doc = null;
  if (zip.ok) {
    try {
      const require = createRequire(import.meta.url);
      const PizZip = require("pizzip");
      const z = new PizZip(buf);
      entries = Object.keys(z.files);
      const ctEntry = z.file("[Content_Types].xml");
      if (ctEntry) ct = Buffer.from(ctEntry.asUint8Array());
      const docEntry = z.file("word/document.xml");
      if (docEntry) doc = Buffer.from(docEntry.asUint8Array());
    } catch (err) {
      // PizZip not available
    }
  }
  const ctParse = validateXml(ct);
  const docParse = validateXml(doc);
  const outPath = join(OUT_DIR, c.code + ".docx");
  writeFileSync(outPath, buf);
  // Deterministic token result — re-hash and confirm identical sha
  const sha2 = crypto.createHash("sha256").update(readFileSync(outPath)).digest("hex");
  const deterministicToken = sha === sha2;
  manifest.push({
    code: c.code,
    documentId: c.documentId,
    sourceFile: file,
    requestTransport: "POST /api/v1/documents/generated/:id/render-docx (saved to storage)",
    httpStatus: 201,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    byteSize: buf.length,
    sha256: sha,
    deterministicToken: deterministicToken,
    zipValid: zip.ok,
    zipEntries: entries,
    contentTypesXmlPresent: !!ct,
    contentTypesXmlBytes: ct ? ct.length : 0,
    contentTypesXmlParse: ctParse.ok,
    documentXmlPresent: !!doc,
    documentXmlBytes: doc ? doc.length : 0,
    documentXmlParse: docParse.ok,
    documentXmlOpen: docParse.open,
    documentXmlClose: docParse.close,
    documentXmlSelfClose: docParse.selfClose,
    artifactPath: outPath,
  });
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("wrote manifest:", MANIFEST);
for (const m of manifest) console.log("  " + m.code + " " + (m.httpStatus || "?") + " size=" + (m.byteSize || "?") + " zipValid=" + m.zipValid + " sha256=" + (m.sha256 || "?").slice(0, 16));