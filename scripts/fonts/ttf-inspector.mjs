#!/usr/bin/env node
/**
 * QLLAW Phase 8C — TTF metadata inspector.
 *
 * Parses a TTF/OTF file enough to extract:
 *  - family name (name table nameID=1, Windows BMP / English)
 *  - subfamily / style name (name table nameID=2)
 *  - full font name (name table nameID=4)
 *  - postscript name (name table nameID=6)
 *  - OS/2 weight class (usWeightClass) and width class (usWidthClass)
 *  - version string (head table fontRevision)
 *  - file size and SHA-256
 *
 * This is intentionally minimal. It does NOT replace fc-match/fc-query,
 * which still do the canonical work. The inspector exists so that
 * QLLAW font verification can:
 *   1. Run inside the Docker image without requiring fc-match
 *      (some hardened images strip fontconfig).
 *   2. Run on the host as part of CI/preflight (where fc-match
 *      may not be installed on Windows or Alpine).
 *   3. Distinguish exact-family fonts from generic aliases — fc-match
 *      often returns "Liberation Serif" as a substitute and only the
 *      TTF metadata knows the truth.
 *
 * Status values returned by `inspectFont`:
 *   EXACT_REQUIRED_FONT_PASS  family matches and style coverage is complete
 *   EXACT_REQUIRED_FONT_MISSING family does not match
 *   STYLE_INCOMPLETE          family matches but not all required styles present
 *   ALIAS_ONLY                file is a known metric-compatible alias (e.g. Liberation Serif)
 *   FALLBACK_ALLOWED          family differs but policy permits the substitution
 *   INVALID_FONT_METADATA     TTF/OTF bytes cannot be parsed or required tables missing
 *
 * References:
 *   - OpenType spec, "name" table: nameRecord entries carry the human-readable
 *     strings. nameID 1 = family, 2 = subfamily, 4 = full name, 6 = postscript.
 *   - OS/2 table: usWeightClass 100..900 maps to Thin..Black; combined with
 *     nameID 2 ("Regular"/"Bold"/"Italic"/"Bold Italic") we identify the four
 *     styles required for legal-layout fidelity.
 *   - head table: fontRevision (Fixed) gives the font version string.
 *
 * No external dependencies. Pure Node.js stdlib.
 */

import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const PLATFORM_WINDOWS_BMP = 3;
const ENGLISH_MAC_ROMAN = 0;
const NAME_ID_FAMILY = 1;
const NAME_ID_SUBFAMILY = 2;
const NAME_ID_FULL = 4;
const NAME_ID_POSTSCRIPT = 6;

const KNOWN_ALIAS_FAMILIES = new Map([
  // filename aliases the verifier should flag as ALIAS_ONLY when present
  ["Liberation Serif", "liberation-serif"],
  ["Liberation Sans", "liberation-sans"],
  ["Liberation Mono", "liberation-mono"],
  ["DejaVu Serif", "dejavu-serif"],
  ["DejaVu Sans", "dejavu-sans"],
  ["Nimbus Roman", "nimbus-roman"],
  ["Nimbus Sans", "nimbus-sans"],
]);

/** Read a big-endian unsigned 16-bit integer at `offset`. */
function readU16BE(buffer, offset) {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/** Read a big-endian unsigned 32-bit integer at `offset`. */
function readU32BE(buffer, offset) {
  return (
    ((buffer[offset] << 24) >>> 0) +
    ((buffer[offset + 1] << 16) >>> 0) +
    ((buffer[offset + 2] << 8) >>> 0) +
    (buffer[offset + 3] >>> 0)
  );
}

/** Read a 32-bit fixed-point value at `offset` (16.16 big-endian). */
function readFixed32BE(buffer, offset) {
  const major = readU16BE(buffer, offset);
  const minor = readU16BE(buffer, offset + 2);
  return `${major}.${String(minor).padStart(4, "0")}`;
}

/**
 * Locate the offset and length of a specific table in the TTF/OTF table
 * directory. Returns null if the table is not present.
 */
function findTable(buffer, tableTag) {
  const sfntVersion = readU32BE(buffer, 0);
  // TrueType ('true', 0x00010000), OpenType CFF ('OTTO', 0x4F54544F),
  // and 'typ1' / 'ttcf' use the same directory layout.
  if (
    sfntVersion !== 0x00010000 &&
    sfntVersion !== 0x4f54544f &&
    sfntVersion !== 0x74797031 &&
    sfntVersion !== 0x74746366
  ) {
    return null;
  }
  const numTables = readU16BE(buffer, 4);
  for (let i = 0; i < numTables; i += 1) {
    const recordOffset = 12 + i * 16;
    const tag = buffer.toString(
      "ascii",
      recordOffset,
      recordOffset + 4,
    );
    if (tag === tableTag) {
      return {
        offset: readU32BE(buffer, recordOffset + 8),
        length: readU32BE(buffer, recordOffset + 12),
      };
    }
  }
  return null;
}

/**
 * Decode a Windows BMP (UTF-16BE) string from a name table storage slot.
 */
function decodeWindowsBMP(buffer, offset, byteLength) {
  return buffer.toString("utf16le", offset, offset + byteLength);
}

/**
 * Parse the `name` table. Returns a map keyed by nameID containing
 * { family, subfamily, full, postscript } when available.
 */
function parseNameTable(buffer) {
  const table = findTable(buffer, "name");
  if (!table) return null;
  const headerOffset = table.offset;
  const storageOffset = readU16BE(buffer, headerOffset + 4);
  const numRecords = readU16BE(buffer, headerOffset + 2);
  /** @type {Record<number, {family?: string, subfamily?: string, full?: string, postscript?: string}>} */
  const strings = {};
  const recordStart = headerOffset + 6;
  for (let i = 0; i < numRecords; i += 1) {
    const baseOffset = recordStart + i * 12;
    const platformID = readU16BE(buffer, baseOffset);
    const encodingID = readU16BE(buffer, baseOffset + 2);
    const languageID = readU16BE(buffer, baseOffset + 4);
    const nameID = readU16BE(buffer, baseOffset + 6);
    const length = readU16BE(buffer, baseOffset + 8);
    const stringOffset = readU16BE(buffer, baseOffset + 10);
    const isWindowsEnglish =
      platformID === PLATFORM_WINDOWS_BMP && languageID === 0x0409;
    const isMacRomanEnglish =
      platformID === 1 && encodingID === ENGLISH_MAC_ROMAN && languageID === 0;
    if (!isWindowsEnglish && !isMacRomanEnglish) continue;
    const start = headerOffset + storageOffset + stringOffset;
    let value;
    if (platformID === PLATFORM_WINDOWS_BMP) {
      value = decodeWindowsBMP(buffer, start, length);
    } else {
      value = buffer.toString("latin1", start, start + length);
    }
    const slot = strings[nameID] ?? (strings[nameID] = {});
    if (nameID === NAME_ID_FAMILY && !slot.family) slot.family = value;
    else if (nameID === NAME_ID_SUBFAMILY && !slot.subfamily)
      slot.subfamily = value;
    else if (nameID === NAME_ID_FULL && !slot.full) slot.full = value;
    else if (nameID === NAME_ID_POSTSCRIPT && !slot.postscript)
      slot.postscript = value;
  }
  return strings;
}

/**
 * Parse the OS/2 table. Returns usWeightClass / usWidthClass when present.
 */
function parseOs2Table(buffer) {
  const table = findTable(buffer, "OS/2");
  if (!table) return null;
  const base = table.offset;
  // OS/2 v1+ keeps usWeightClass at byte 4, usWidthClass at byte 6.
  // Header itself is 78 bytes minimum, version at byte 0.
  const version = readU16BE(buffer, base);
  const usWeightClass = readU16BE(buffer, base + 4);
  const usWidthClass = readU16BE(buffer, base + 6);
  return { version, usWeightClass, usWidthClass };
}

/**
 * Read the head table for font revision.
 */
function parseHeadTable(buffer) {
  const table = findTable(buffer, "head");
  if (!table) return null;
  const base = table.offset;
  const fontRevision = readFixed32BE(buffer, base + 8);
  return { fontRevision };
}

/**
 * Public API: inspect a single TTF/OTF file. Returns a structured
 * descriptor including metadata, computed hashes, and a status
 * relative to the required family and styles.
 *
 * @param {string} filePath absolute path to the TTF/OTF
 * @param {{
 *   requiredFamily?: string,
 *   requiredStyles?: readonly string[],
 *   allowFallback?: boolean
 * }} options
 */
export function inspectFont(filePath, options = {}) {
  const requiredFamily = options.requiredFamily ?? "Times New Roman";
  const requiredStyles = options.requiredStyles ?? [
    "Regular",
    "Bold",
    "Italic",
    "Bold Italic",
  ];
  const allowFallback = options.allowFallback ?? false;

  const stat = statSync(filePath);
  const buffer = readFileSync(filePath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const nameTable = parseNameTable(buffer);
  const os2Table = parseOs2Table(buffer);
  const headTable = parseHeadTable(buffer);
  if (!nameTable) {
    return {
      path: filePath,
      basename: basename(filePath),
      size: stat.size,
      sha256,
      family: null,
      subfamily: null,
      fullName: null,
      postscriptName: null,
      os2: os2Table,
      version: headTable?.fontRevision ?? null,
      status: "INVALID_FONT_METADATA",
      reason: "name table missing or sfnt header unrecognised",
      requiredFamily,
      allowFallback,
    };
  }
  const family = nameTable[NAME_ID_FAMILY]?.family ?? null;
  const subfamily = nameTable[NAME_ID_SUBFAMILY]?.subfamily ?? "Regular";
  const fullName = nameTable[NAME_ID_FULL]?.full ?? null;
  const postscriptName = nameTable[NAME_ID_POSTSCRIPT]?.postscript ?? null;

  const familyMatches =
    family != null && family.toLowerCase() === requiredFamily.toLowerCase();
  const isKnownAlias =
    family != null && KNOWN_ALIAS_FAMILIES.has(family);

  /** @type {"EXACT_REQUIRED_FONT_PASS"|"EXACT_REQUIRED_FONT_MISSING"|"STYLE_INCOMPLETE"|"ALIAS_ONLY"|"FALLBACK_ALLOWED"} */
  let status;
  let reason;
  if (familyMatches) {
    status = "EXACT_REQUIRED_FONT_PASS";
    reason = `family=${requiredFamily} style=${subfamily}`;
  } else if (isKnownAlias) {
    status = allowFallback ? "FALLBACK_ALLOWED" : "ALIAS_ONLY";
    reason = `family=${family} alias-only=${KNOWN_ALIAS_FAMILIES.get(family)}`;
  } else if (allowFallback) {
    status = "FALLBACK_ALLOWED";
    reason = `family=${family ?? "(unknown)"} not=${requiredFamily}`;
  } else {
    status = "EXACT_REQUIRED_FONT_MISSING";
    reason = `family=${family ?? "(unknown)"} not=${requiredFamily}`;
  }

  return {
    path: filePath,
    basename: basename(filePath),
    size: stat.size,
    sha256,
    family,
    subfamily,
    fullName,
    postscriptName,
    os2: os2Table,
    version: headTable?.fontRevision ?? null,
    status,
    reason,
    requiredFamily,
    allowFallback,
  };
}

function basename(p) {
  const idx = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return idx >= 0 ? p.slice(idx + 1) : p;
}

/**
 * Verify a directory contains the exact required family with all four
 * styles (regular, bold, italic, bold-italic). Returns an aggregate
 * report.
 *
 * @param {{
 *   fontDir: string,
 *   requiredFamily?: string,
 *   requiredStyles?: readonly string[],
 *   allowFallback?: boolean,
 *   knownFilenames?: readonly string[]
 * }} options
 */
export function verifyFontDirectory(options) {
  const requiredFamily = options.requiredFamily ?? "Times New Roman";
  const requiredStyles = options.requiredStyles ?? [
    "Regular",
    "Bold",
    "Italic",
    "Bold Italic",
  ];
  const allowFallback = options.allowFallback ?? false;
  const fontDir = options.fontDir;
  const knownFilenames = options.knownFilenames ?? [
    "times.ttf",
    "timesbd.ttf",
    "timesi.ttf",
    "timesbi.ttf",
  ];

  const expectedFiles = knownFilenames.map((name) => `${fontDir}/${name}`);
  const perFont = expectedFiles.map((path) => {
    try {
      return inspectFont(path, { requiredFamily, requiredStyles, allowFallback });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        return {
          path,
          basename: basename(path),
          size: null,
          sha256: null,
          family: null,
          subfamily: null,
          fullName: null,
          postscriptName: null,
          os2: null,
          version: null,
          status: allowFallback ? "FALLBACK_ALLOWED" : "EXACT_REQUIRED_FONT_MISSING",
          reason: "file not found",
          requiredFamily,
          allowFallback,
        };
      }
      throw error;
    }
  });

  const presentStyles = perFont
    .filter((entry) => entry.status === "EXACT_REQUIRED_FONT_PASS")
    .map((entry) => entry.subfamily ?? "Regular");

  const missingStyles = requiredStyles.filter(
    (style) => !presentStyles.includes(style),
  );

  /** @type {"EXACT_REQUIRED_FONT_PASS"|"STYLE_INCOMPLETE"|"ALIAS_ONLY"|"EXACT_REQUIRED_FONT_MISSING"|"FALLBACK_ALLOWED"} */
  let aggregate;
  if (perFont.some((entry) => entry.status === "INVALID_FONT_METADATA")) {
    aggregate = "EXACT_REQUIRED_FONT_MISSING";
  } else if (
    perFont.every((entry) => entry.status === "FALLBACK_ALLOWED") &&
    presentStyles.length === 0
  ) {
    aggregate = allowFallback ? "FALLBACK_ALLOWED" : "ALIAS_ONLY";
  } else if (missingStyles.length === 0 && presentStyles.length > 0) {
    aggregate = "EXACT_REQUIRED_FONT_PASS";
  } else if (presentStyles.length > 0) {
    aggregate = "STYLE_INCOMPLETE";
  } else {
    aggregate = allowFallback ? "FALLBACK_ALLOWED" : "EXACT_REQUIRED_FONT_MISSING";
  }

  return {
    fontDir,
    requiredFamily,
    requiredStyles,
    allowFallback,
    aggregate,
    presentStyles,
    missingStyles,
    perFont,
  };
}

const SCRIPT_BASENAME = "ttf-inspector.mjs";
const isDirectExecution =
  process.argv[1] && process.argv[1].endsWith(SCRIPT_BASENAME);

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const fontDir = args[0];
  if (!fontDir) {
    console.error(
      "usage: node scripts/fonts/ttf-inspector.mjs <font-dir> [--allow-fallback]",
    );
    process.exit(2);
  }
  const allowFallback = args.includes("--allow-fallback");
  const report = verifyFontDirectory({ fontDir, allowFallback });
  console.log(JSON.stringify(report, null, 2));
  const exitCode =
    report.aggregate === "EXACT_REQUIRED_FONT_PASS" ||
    report.aggregate === "FALLBACK_ALLOWED"
      ? 0
      : 1;
  process.exit(exitCode);
}