// Minimal DOCX zip extractor for forensic investigation.
//
// Reads a .docx file (zip) and returns an array of entries:
//   { path, content (Buffer), size }
//
// Handles the End-of-Central-Directory record first, walks the Central
// Directory, then uses each CFH's "relative offset of local header" to read
// the local file header and decompress its data. Supports compression
// methods 0 (store) and 8 (deflate) using node:zlib.

import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

const SIG_LFH = 0x04034b50;     // local file header
const SIG_CFH = 0x02014b50;     // central directory file header
const SIG_EOCD = 0x06054b50;    // end of central directory record

function u16(buf, off) { return buf.readUInt16LE(off); }
function u32(buf, off) { return buf.readUInt32LE(off); }

function findEOCD(buf) {
  const maxBack = Math.min(buf.length, 65557 + 22);
  for (let i = buf.length - 22; i >= buf.length - maxBack; i--) {
    if (u32(buf, i) === SIG_EOCD) return i;
  }
  return -1;
}

function parseLFH(buf, off) {
  if (u32(buf, off) !== SIG_LFH) return null;
  const compMethod = u16(buf, off + 8);
  const compSize = u32(buf, off + 18);
  const uncompSize = u32(buf, off + 22);
  const nameLen = u16(buf, off + 26);
  const extraLen = u16(buf, off + 28);
  const nameStart = off + 30;
  const name = buf.toString('utf8', nameStart, nameStart + nameLen);
  const dataStart = nameStart + nameLen + extraLen;
  const data = Buffer.from(buf.subarray(dataStart, dataStart + compSize));
  let content = data;
  let storedCompSize = compSize;
  if (compMethod === 8) {
    content = zlib.inflateRawSync(data);
    storedCompSize = data.length;
  } else if (compMethod !== 0) {
    throw new Error(`unsupported compression method: ${compMethod}`);
  }
  void uncompSize;
  return { name, content, size: content.length, compressedSize: storedCompSize, dataEnd: dataStart + compSize };
}

function parseCFH(buf, off) {
  if (u32(buf, off) !== SIG_CFH) return null;
  const compMethod = u16(buf, off + 10);
  const compSize = u32(buf, off + 20);
  const uncompSize = u32(buf, off + 24);
  const nameLen = u16(buf, off + 28);
  const extraLen = u16(buf, off + 30);
  const commentLen = u16(buf, off + 32);
  const localHeaderOffset = u32(buf, off + 42);
  const nameStart = off + 46;
  const name = buf.toString('utf8', nameStart, nameStart + nameLen);
  void commentLen;
  return {
    name, compMethod, compSize, uncompSize, nameLen, extraLen, localHeaderOffset,
    nextOffset: nameStart + nameLen + extraLen + commentLen,
  };
}

export function extractZip(zipPath) {
  const buf = readFileSync(zipPath);
  const eocd = findEOCD(buf);
  if (eocd < 0) throw new Error('EOCD signature not found (not a ZIP file?)');
  const totalEntries = u16(buf, eocd + 10);
  let cfhOff = u32(buf, eocd + 16);
  const entries = [];
  for (let i = 0; i < totalEntries; i++) {
    const cfh = parseCFH(buf, cfhOff);
    if (!cfh) break;
    entries.push({ _cfh: cfh });
    cfhOff = cfh.nextOffset;
  }
  // Now walk each local header.
  const out = [];
  for (const e of entries) {
    const lfh = parseLFH(buf, e._cfh.localHeaderOffset);
    if (!lfh) continue;
    out.push({ path: lfh.name, content: lfh.content, size: lfh.size });
  }
  return out;
}
