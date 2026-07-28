#!/usr/bin/env node
/**
 * capture-docx-evidence.mjs
 *
 * Captures DOCX bytes for each documentId produced by the R5.1 strict pilot.
 *
 * Strategy: launch the existing get-clerk-ticket.mjs to mint a Clerk
 * sign-in ticket, then exchange it for a session JWT via the Clerk
 * /v1/sign_ins endpoint, then call the API with Authorization: Bearer <jwt>.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

const envContent = readFileSync(join(REPO, ".env"), "utf8");
const e2eContent = readFileSync(join(REPO, ".env.e2e.local"), "utf8");
const env = {};
for (const src of [envContent, e2eContent]) {
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
}

const SECRET = env.CLERK_SECRET_KEY;
const API = env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1";
const PILOT = join(REPO, "agent-tools", "pilot-summary.json");
const OUT_DIR = join(REPO, ".tmp-r5_1-evidence");
const MANIFEST = join(REPO, "agent-tools", "r5_1-docx-manifest.json");
const TICKET_FILE = join(REPO, ".env.e2e.ticket.tmp");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
const pilot = JSON.parse(readFileSync(PILOT, "utf8"));
const candidates = pilot.results.filter((r) => r.role === "PILOT_CANDIDATE");

// Mint a sign-in ticket using the in-repo helper
const ticketRes = spawnSync(process.execPath, [join(REPO, "apps", "api", "scripts", "get-clerk-ticket.mjs")], {
  cwd: REPO,
  encoding: "utf8",
});
if (ticketRes.status !== 0) {
  console.error("[capture] ticket mint failed:", ticketRes.stderr || ticketRes.stdout);
  process.exit(2);
}
if (!existsSync(TICKET_FILE)) {
  console.error("[capture] ticket file missing");
  process.exit(2);
}
const ticketLine = readFileSync(TICKET_FILE, "utf8").trim();
const ticket = ticketLine.split("=")[1];
if (!ticket) {
  console.error("[capture] ticket parse failed");
  process.exit(2);
}

// Exchange ticket for a session JWT via the Clerk Backend API.
// Step 1: create a session for the user (test-only endpoint per Clerk docs).
// Step 2: mint a JWT from that session.
async function exchangeTicketForJwt(ticket) {
  // The ticket isn't directly exchangeable via BAPI; we use the documented
  // test-only endpoint to create a session, then mint a JWT.
  // 1. find user id
  const userEmail = env.E2E_CLERK_USER_EMAIL || "admin@example.test";
  const userListRes = await fetch(
    "https://api.clerk.com/v1/users?email_address=" + encodeURIComponent(userEmail) + "&limit=1",
    { headers: { Authorization: "Bearer " + SECRET } },
  );
  if (!userListRes.ok) throw new Error("Clerk user lookup failed: " + userListRes.status);
  const users = await userListRes.json();
  if (!users.length) throw new Error("No Clerk user for " + userEmail);
  const userId = users[0].id;

  // 2. create a test session for the user (dev-instance only)
  const sessionRes = await fetch("https://api.clerk.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!sessionRes.ok) {
    const text = await sessionRes.text();
    throw new Error("create session failed: " + sessionRes.status + " " + text);
  }
  const sessionData = await sessionRes.json();
  const sessionId = sessionData.id;
  if (!sessionId) throw new Error("no session id returned");

  // 3. mint a JWT from the session
  const jwtRes = await fetch("https://api.clerk.com/v1/sessions/" + sessionId + "/tokens", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!jwtRes.ok) {
    const text = await jwtRes.text();
    throw new Error("session token failed: " + jwtRes.status + " " + text);
  }
  const jwtData = await jwtRes.json();
  return jwtData.jwt;
}

let bearer;
try {
  bearer = await exchangeTicketForJwt(ticket);
} catch (err) {
  console.error("[capture] JWT exchange failed:", String(err.message || err));
  process.exit(2);
}
if (!bearer) {
  console.error("[capture] no bearer returned");
  process.exit(2);
}
console.log("[capture] Clerk bearer acquired");

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
  return { totalEntries, cdSize, cdOffset, eocd };
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

async function fetchDocx(bearer, documentId) {
  const res = await fetch(API + "/documents/generated/" + documentId + "/render-docx", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + bearer,
      "Content-Type": "application/json",
    },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, contentType: res.headers.get("content-type"), buf };
}

const manifest = [];
for (const c of candidates) {
  const documentId = c.documentId;
  if (!documentId) {
    manifest.push({ code: c.code, documentId: null, error: "no documentId" });
    continue;
  }
  const path = join(OUT_DIR, c.code + ".docx");
  try {
    const r = await fetchDocx(bearer, documentId);
    const sha = crypto.createHash("sha256").update(r.buf).digest("hex");
    const zip = validateZip(r.buf);
    const entries = zip.ok ? listEntries(r.buf) : [];
    const ct = extractFile(r.buf, "[Content_Types].xml");
    const doc = extractFile(r.buf, "word/document.xml");
    manifest.push({
      code: c.code,
      documentId,
      httpStatus: r.status,
      requestTransport: "fetch+Clerk_Bearer",
      contentType: r.contentType,
      byteSize: r.buf.length,
      sha256: sha,
      zipValid: zip.ok,
      zipEntries: entries,
      contentTypesXmlPresent: !!ct,
      contentTypesXmlBytes: ct ? ct.length : 0,
      documentXmlPresent: !!doc,
      documentXmlBytes: doc ? doc.length : 0,
      artifactPath: path,
    });
    if (zip.ok) writeFileSync(path, r.buf);
  } catch (err) {
    manifest.push({ code: c.code, documentId, error: String(err.message || err) });
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log("[capture] wrote manifest:", MANIFEST);
for (const m of manifest) console.log("  " + m.code + " " + (m.httpStatus || "?") + " " + (m.sha256 || m.error || "?"));