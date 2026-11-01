#!/usr/bin/env node
/**
 * BM-001 RENDER / EXPORT GOLDEN VALIDATION
 *
 * Renders a real DOCX from the BM-001 locked contract + BM-001 normalized
 * DOCX using the SAME underlying Docxtemplater engine the production
 * `DocxtemplaterContractRenderEngine` uses (apps/api/src/modules/documents/
 * rendering/infrastructure/docxtemplater-contract-render-engine.ts →
 * docx-template-renderer.ts → renderDocxTemplate).
 *
 * Strategy A — direct generated render core:
 *   1. Load the BM-001 canonical FormFlightProfile source and extract
 *      `BM001_DEMO` + `BM001_ACCEPTANCE` via deterministic regex parse
 *      (no TypeScript execution needed at validation time).
 *   2. Load the BM-001 locked contract JSON to get the canonical
 *      slot/binding list.
 *   3. Build a flat binding map from BM001_DEMO keys to slot IDs.
 *   4. Use PizZip + Docxtemplater (apps/api/node_modules) to render the
 *      BM-001 normalized DOCX → `BM001_RENDERED_GOLDEN.latest.docx`.
 *   5. Extract visible text from `word/document.xml`, headers, footers,
 *      footnotes, endnotes. Normalize whitespace.
 *   6. Assert acceptance.requiredText anchors, forbiddenText absences,
 *      no placeholder leaks, no undefined/null/[object Object].
 *   7. Assert BM-001 required sections + demo names appear and known
 *      legacy bugs ("Ông  cung cấp", "Nguyễn Thị Hồng Hạnh") do NOT.
 *   8. Write JSON + Markdown report to
 *      `docs/audit/unified-bm-workspace/bm001-golden/`.
 *
 * Constraints:
 *   - No DB mutation.
 *   - No runtime template lifecycle (`/templates/:code` route).
 *   - No mutating the BM-001 source DOCX, normalized DOCX, or locked
 *     contract.
 *   - Exit code 0 if DOCX_GOLDEN.status = PASS, else 1.
 *
 * Run with:
 *   node scripts/audit/validate-bm001-render-export-golden.mjs
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Constants and locations
// ---------------------------------------------------------------------------

const TASK = "BM001_RENDER_EXPORT_GOLDEN";
const TEMPLATE_CODE = "BM-001";
const GOLDEN_DIR = join(
  REPO_ROOT,
  "docs",
  "audit",
  "unified-bm-workspace",
  "bm001-golden",
);
const NORMALIZED_DOCX_PATH = join(
  REPO_ROOT,
  "storage",
  "templates",
  "normalized-docx",
  TEMPLATE_CODE,
  `${TEMPLATE_CODE}_normalized.docx`,
);
const LOCKED_CONTRACT_PATH = join(
  REPO_ROOT,
  "docs",
  "audit",
  "docx",
  "contracts",
  "locked",
  `${TEMPLATE_CODE}__f4c2aa3682d3.contract.locked.json`,
);
const BM001_PROFILE_PATH = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "lib",
  "form-flight",
  "profiles",
  "bm001.ts",
);

const OUTPUT_DOCX_PATH = join(GOLDEN_DIR, "BM001_RENDERED_GOLDEN.latest.docx");
const OUTPUT_JSON_PATH = join(GOLDEN_DIR, "BM001_RENDER_EXPORT_GOLDEN.latest.json");
const OUTPUT_MD_PATH = join(GOLDEN_DIR, "BM001_RENDER_EXPORT_GOLDEN.latest.md");

// ---------------------------------------------------------------------------
// Required sections + demo names + known bug tokens (verbatim from task)
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = [
  "BIÊN BẢN",
  "Tiếp nhận nguồn tin về tội phạm",
  "I. NỘI DUNG NGUỒN TIN VỀ TỘI PHẠM",
  "II. CÁC TÀI LIỆU, ĐỒ VẬT GIAO NỘP KÈM THEO",
  "NGƯỜI CUNG CẤP",
  "NGƯỜI TIẾP NHẬN",
];

const DEMO_NAMES_REQUIRED = ["Nguyễn Thị Mai", "Trần Văn Bình"];

const KNOWN_BUG_TOKENS = ["Ông  cung cấp", "Nguyễn Thị Hồng Hạnh"];

const PLACEHOLDER_PATTERNS = [
  { name: "double-brace-open", pattern: /\{\{/ },
  { name: "double-brace-close", pattern: /\}\}/ },
  { name: "dollar-brace", pattern: /\$\{[^}]+\}/ },
  { name: "double-angle", pattern: /<<[^>]+>>/ },
  { name: "undefined-literal", pattern: /\bundefined\b/i },
  { name: "null-literal", pattern: /\bnull\b/i },
  { name: "object-bracket", pattern: /\[object Object\]/ },
];

// ---------------------------------------------------------------------------
// Docxtemplater + PizZip — same packages the production render engine uses
// ---------------------------------------------------------------------------

const workspaceRequire = createRequire(
  join(REPO_ROOT, "apps", "api", "package.json"),
);
const PizZip = workspaceRequire("pizzip");
const Docxtemplater = workspaceRequire("docxtemplater");
// `pdf-parse` lives in apps/api/node_modules. Use a lazy require so we
// only pay the cost (and potential ENOENT for the bundled test PDF)
// when a PDF golden run actually succeeds.
let pdfParseFn = null;
function loadPdfParse() {
  if (pdfParseFn) return pdfParseFn;
  try {
    const mod = workspaceRequire("pdf-parse");
    // pdf-parse v2.x is an ES module exposed via CommonJS with named
    // exports. The class `PDFParse` exposes `.getText()` returning a
    // promise. Older v1.x default-exports a function(buffer, opts).
    // Support both shapes.
    if (typeof mod === "function") {
      pdfParseFn = mod;
      return pdfParseFn;
    }
    if (mod && typeof mod.PDFParse === "function") {
      const Cls = mod.PDFParse;
      pdfParseFn = async (buffer) => {
        const parser = new Cls({ data: buffer });
        const result = await parser.getText();
        return { text: result?.text ?? "" };
      };
      return pdfParseFn;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Profile source parsing — extract BM001_DEMO and BM001_ACCEPTANCE
// ---------------------------------------------------------------------------

/**
 * Parse the BM-001 profile TS source to extract `BM001_DEMO` and
 * `BM001_ACCEPTANCE` constants without executing TS. This keeps the
 * validation script pure-JS while still using the live profile as the
 * source of truth for demo + acceptance.
 *
 * For each constant we find the line that starts with `const NAME = {`
 * then walk forward collecting lines until we hit the closing `} as const;`
 * (for DEMO / STALE_FALLBACKS) or `};` (for ACCEPTANCE).
 */
function parseBm001ProfileSource(source) {
  const demo = extractStringRecordObject(source, "BM001_DEMO", "} as const;");
  const acceptance = extractAcceptanceObject(source, "BM001_ACCEPTANCE", "};");
  return { demo, acceptance };
}

function extractStringRecordObject(source, constName, terminator) {
  const startLine = findLineThatStartsWith(
    source,
    new RegExp(`^const\\s+${constName}\\s*=\\s*\\{`),
  );
  if (startLine === -1) throw new Error(`${constName} block not found in bm001.ts`);
  const startIdx = source.indexOf("{", startLine);
  const endIdx = source.indexOf(terminator, startIdx);
  if (endIdx === -1) throw new Error(`${constName} terminator "${terminator}" not found`);
  // Closing brace is the character right before the terminator
  const closeIdx = source.lastIndexOf("}", endIdx);
  const body = source.slice(startIdx + 1, closeIdx);
  return parseStringRecordEntries(body);
}

function extractAcceptanceObject(source, constName, terminator) {
  const startLine = findLineThatStartsWith(
    source,
    new RegExp(`^const\\s+${constName}\\s*=\\s*\\{`),
  );
  if (startLine === -1) throw new Error(`${constName} block not found in bm001.ts`);
  const startIdx = source.indexOf("{", startLine);
  const endIdx = source.indexOf(terminator, startIdx);
  if (endIdx === -1) throw new Error(`${constName} terminator "${terminator}" not found`);
  const closeIdx = source.lastIndexOf("}", endIdx);
  const body = source.slice(startIdx + 1, closeIdx);
  return parseAcceptanceEntries(body);
}

function findLineThatStartsWith(source, pattern) {
  const re = new RegExp(pattern.source, "m");
  const m = source.match(re);
  return m ? m.index : -1;
}

/**
 * Parse a flat `key: "string value"` record literal line-by-line.
 * Lines may include comments and whitespace; we strip comments then
 * match `key: "value"` where key is either a bare word or a quoted
 * string (we only use bare dotted identifiers here).
 */
function parseStringRecordEntries(body) {
  const result = {};
  const lines = body.split(/\r?\n/);
  const entryRe = /^\s*("([^"\\]|\\.)+"|\w+(?:\.\w+)+)\s*:\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/;
  for (const line of lines) {
    // Strip line comment
    const codeOnly = line.replace(/\/\/.*$/, "");
    const m = codeOnly.match(entryRe);
    if (!m) continue;
    const key = m[1].startsWith('"') ? JSON.parse(m[1]) : m[1];
    result[key] = JSON.parse(`"${m[3]}"`);
  }
  return result;
}

function parseAcceptanceEntries(body) {
  const result = { requiredText: [], forbiddenText: [] };
  const lines = body.split(/\r?\n/);
  let currentKey = null;
  const itemRe = /^\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/;
  for (const line of lines) {
    const codeOnly = line.replace(/\/\/.*$/, "");
    const keyMatch = codeOnly.match(/^\s*(requiredText|forbiddenText)\s*:\s*\[/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      continue;
    }
    if (!currentKey) continue;
    const itemMatch = codeOnly.match(itemRe);
    if (itemMatch) {
      result[currentKey].push(JSON.parse(`"${itemMatch[1]}"`));
      continue;
    }
    // Closing `]` resets the current array
    if (/^\s*\]\s*,?\s*$/.test(codeOnly)) {
      currentKey = null;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// DOCX text extraction
// ---------------------------------------------------------------------------

const DOCX_TEXT_PARTS = [
  /^word\/document\d*\.xml$/,
  /^word\/header\d*\.xml$/,
  /^word\/footer\d*\.xml$/,
  /^word\/footnotes\.xml$/,
  /^word\/endnotes\.xml$/,
];

function decodeXmlText(xml) {
  return xml
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#xD;/g, "")
    .replace(/&#10;/g, "\n")
    .replace(/&#13;/g, "\r");
}

function normalizeWhitespace(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Extract every <w:t>...</w:t> visible-text run from the named DOCX
 * parts. Returns an array of {partName, text} and a flat joined string.
 */
function extractTextFromDocx(buffer) {
  const zip = new PizZip(buffer);
  const parts = [];
  for (const name of Object.keys(zip.files)) {
    const match = DOCX_TEXT_PARTS.some((re) => re.test(name));
    if (!match) continue;
    const xml = zip.file(name)?.asText();
    if (!xml) continue;
    let runText = "";
    for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) {
      runText += decodeXmlText(m[1]);
    }
    const text = runText.replace(/<[^>]*>/g, "");
    if (text.trim()) {
      parts.push({ partName: name, text: text });
    }
  }
  const joined = normalizeWhitespace(parts.map((p) => p.text).join(" "));
  return { parts, joined };
}

// ---------------------------------------------------------------------------
// Render BM-001 DOCX using Docxtemplater (same engine as production)
// ---------------------------------------------------------------------------

function renderBm001Docx(sourceBuffer, demo) {
  const zip = new PizZip(sourceBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  // The locked contract's docxSlots declare slotIds identical to the
  // BM-001 dot-paths (verified in BM-001_RUNTIME_READY_REPAIR §5). Feed
  // the demo values verbatim as the binding map. Empty/undefined values
  // fall through to Docxtemplater's nullGetter which produces empty
  // string — no `undefined` literal can leak.
  const data = {};
  for (const [path, value] of Object.entries(demo)) {
    data[path] = String(value);
  }
  doc.render(data);
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

// ---------------------------------------------------------------------------
// Acceptance scanner
// ---------------------------------------------------------------------------

function scanAcceptance(text, acceptance) {
  const requiredResults = [];
  for (const anchor of acceptance.requiredText) {
    requiredResults.push({
      anchor,
      present: text.includes(anchor),
    });
  }
  const forbiddenResults = [];
  for (const token of acceptance.forbiddenText) {
    forbiddenResults.push({
      token,
      present: text.includes(token),
    });
  }
  return {
    requiredResults,
    forbiddenResults,
    requiredPassed: requiredResults.filter((r) => r.present).length,
    requiredTotal: requiredResults.length,
    forbiddenAbsent: forbiddenResults.filter((r) => !r.present).length,
    forbiddenTotal: forbiddenResults.length,
    allRequiredPassed: requiredResults.every((r) => r.present),
    allForbiddenAbsent: forbiddenResults.every((r) => !r.present),
  };
}

function scanPlaceholderLeaks(parts) {
  const findings = [];
  for (const { name, pattern } of PLACEHOLDER_PATTERNS) {
    for (const part of parts) {
      if (pattern.test(part.text)) {
        findings.push({ kind: name, partName: part.partName, preview: part.text.slice(0, 160) });
        break;
      }
    }
  }
  return findings;
}

function scanRequiredSections(text) {
  return REQUIRED_SECTIONS.map((anchor) => ({
    anchor,
    present: text.includes(anchor),
  }));
}

function scanDemoNames(text) {
  return DEMO_NAMES_REQUIRED.map((name) => ({
    name,
    present: text.includes(name),
  }));
}

function scanKnownBugs(text) {
  return KNOWN_BUG_TOKENS.map((token) => ({
    token,
    present: text.includes(token),
  }));
}

// ---------------------------------------------------------------------------
// PDF export — best-effort, expects Windows-only Word COM or LibreOffice
// ---------------------------------------------------------------------------

async function tryPdfExport(sourceDocxPath, targetPdfPath) {
  const blockers = [];

  if (process.platform !== "win32") {
    return {
      attempted: false,
      blocker: `unsupported platform ${process.platform}; PDF export requires Windows PowerShell + Word COM or LibreOffice.`,
    };
  }

  const wordComHelper = join(REPO_ROOT, "apps", "api", "scripts", "pdf-convert-word-com.ps1");
  const fallbackHelper = join(REPO_ROOT, "apps", "api", "scripts", "pdf-convert-fallback.ps1");
  const helpers = [wordComHelper, fallbackHelper].filter(existsSync);
  if (helpers.length === 0) {
    return {
      attempted: false,
      blocker: `PDF helper scripts not found (looked for ${wordComHelper} and ${fallbackHelper}).`,
    };
  }

  const helper = helpers[0];
  try {
    const { spawn } = await import("node:child_process");
    const result = await new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          helper,
          "-SourceDocx",
          sourceDocxPath,
          "-TargetPdf",
          targetPdfPath,
        ],
        { windowsHide: true },
      );
      child.stdout?.on("data", (b) => (stdout += b.toString("utf8")));
      child.stderr?.on("data", (b) => (stderr += b.toString("utf8")));
      child.on("error", (e) => reject(new Error(`spawn error: ${e.message}`)));
      child.on("close", (code) => resolve({ code, stdout, stderr }));
    });

    if (result.code !== 0 || !existsSync(targetPdfPath)) {
      return {
        attempted: true,
        blocker: `PDF helper exited with code ${result.code}; helper=${helper}; stdout=${result.stdout.slice(0, 400)}; stderr=${result.stderr.slice(0, 400)}`,
      };
    }
    return { attempted: true, helper, blocker: null };
  } catch (error) {
    return {
      attempted: true,
      blocker: `PDF helper invocation failed: ${error && error.message ? error.message : String(error)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const generatedAt = new Date().toISOString();

  if (!existsSync(NORMALIZED_DOCX_PATH)) {
    fail(`Missing normalized DOCX at ${NORMALIZED_DOCX_PATH}`);
  }
  if (!existsSync(LOCKED_CONTRACT_PATH)) {
    fail(`Missing locked contract at ${LOCKED_CONTRACT_PATH}`);
  }
  if (!existsSync(BM001_PROFILE_PATH)) {
    fail(`Missing BM-001 profile at ${BM001_PROFILE_PATH}`);
  }

  mkdirSync(GOLDEN_DIR, { recursive: true });

  // Load inputs
  const profileSource = readFileSync(BM001_PROFILE_PATH, "utf8");
  const { demo, acceptance } = parseBm001ProfileSource(profileSource);
  const lockedContract = JSON.parse(readFileSync(LOCKED_CONTRACT_PATH, "utf8"));
  const sourceBuffer = readFileSync(NORMALIZED_DOCX_PATH);

  // Render DOCX
  const renderedBuffer = renderBm001Docx(sourceBuffer, demo);
  writeFileSync(OUTPUT_DOCX_PATH, renderedBuffer);
  const fileSizeBytes = renderedBuffer.length;

  // Extract text
  const { parts, joined: renderedText } = extractTextFromDocx(renderedBuffer);

  // Acceptance checks
  const acceptanceScan = scanAcceptance(renderedText, acceptance);
  const placeholderLeaks = scanPlaceholderLeaks(parts);
  const sectionScan = scanRequiredSections(renderedText);
  const demoNameScan = scanDemoNames(renderedText);
  const knownBugScan = scanKnownBugs(renderedText);
  const allPlaceholderAbsent = placeholderLeaks.length === 0;
  const allSectionsPresent = sectionScan.every((s) => s.present);
  const allDemoNamesPresent = demoNameScan.every((n) => n.present);
  const noKnownBugs = knownBugScan.every((b) => !b.present);

  const docxGolden = {
    status:
      fileSizeBytes > 0 &&
      acceptanceScan.allRequiredPassed &&
      acceptanceScan.allForbiddenAbsent &&
      allPlaceholderAbsent &&
      allSectionsPresent &&
      allDemoNamesPresent &&
      noKnownBugs
        ? "PASS"
        : "FAIL",
    outputPath: OUTPUT_DOCX_PATH,
    textExtracted: parts.length > 0,
    fileSizeBytes,
    partsExtracted: parts.length,
    requiredTextPassed: `${acceptanceScan.requiredPassed}/${acceptanceScan.requiredTotal}`,
    forbiddenTextAbsent: `${acceptanceScan.forbiddenAbsent}/${acceptanceScan.forbiddenTotal}`,
    requiredTextResults: acceptanceScan.requiredResults,
    forbiddenTextResults: acceptanceScan.forbiddenResults,
    placeholderLeaks: { count: placeholderLeaks.length, findings: placeholderLeaks },
    placeholderLeaksPresent: !allPlaceholderAbsent,
    staleFallbackLeaksPresent: acceptanceScan.forbiddenResults.some((r) => r.present),
    sectionResults: sectionScan,
    demoNameResults: demoNameScan,
    knownBugResults: knownBugScan,
  };

  // PDF export — best effort
  const pdfPath = join(GOLDEN_DIR, "BM001_RENDERED_GOLDEN.latest.pdf");
  const pdfResult = await tryPdfExport(OUTPUT_DOCX_PATH, pdfPath);
  const parseFn = pdfResult.attempted && !pdfResult.blocker ? loadPdfParse() : null;
  let pdfText = "";
  let pdfParts = [];
  let pdfAcceptanceScan = null;
  let pdfSectionScan = null;
  let pdfDemoNameScan = null;
  let pdfKnownBugScan = null;
  let pdfPlaceholderLeaks = null;
  let pdfTextExtracted = false;
  let pdfTextExtractionNote = null;

  if (pdfResult.attempted && !pdfResult.blocker && existsSync(pdfPath)) {
    if (parseFn) {
      try {
        const pdfBuffer = readFileSync(pdfPath);
        const pdfData = await parseFn(pdfBuffer);
        pdfText = normalizeWhitespace(pdfData.text ?? "");
        pdfTextExtracted = pdfText.length > 0;
        pdfParts = pdfTextExtracted ? [{ partName: "pdf-text", text: pdfText }] : [];
        if (pdfTextExtracted) {
          pdfAcceptanceScan = scanAcceptance(pdfText, acceptance);
          pdfSectionScan = scanRequiredSections(pdfText);
          pdfDemoNameScan = scanDemoNames(pdfText);
          pdfKnownBugScan = scanKnownBugs(pdfText);
          pdfPlaceholderLeaks = scanPlaceholderLeaks(pdfParts);
        }
      } catch (error) {
        pdfTextExtracted = false;
        pdfTextExtractionNote =
          `pdf-parse failed to extract text from the rendered PDF: ${error && error.message ? error.message : String(error)}`;
      }
    } else {
      pdfTextExtractionNote = "pdf-parse module not available; PDF text extraction skipped.";
    }
  }

  const pdfGolden = pdfResult.attempted
    ? {
        status: pdfResult.blocker ? "PARTIAL" : "PASS",
        outputPath: pdfPath,
        textExtracted: pdfTextExtracted,
        requiredTextPassed: pdfAcceptanceScan
          ? `${pdfAcceptanceScan.requiredPassed}/${pdfAcceptanceScan.requiredTotal}`
          : "N/A",
        forbiddenTextAbsent: pdfAcceptanceScan
          ? `${pdfAcceptanceScan.forbiddenAbsent}/${pdfAcceptanceScan.forbiddenTotal}`
          : "N/A",
        requiredTextResults: pdfAcceptanceScan?.requiredResults ?? null,
        forbiddenTextResults: pdfAcceptanceScan?.forbiddenResults ?? null,
        sectionResults: pdfSectionScan ?? null,
        demoNameResults: pdfDemoNameScan ?? null,
        knownBugResults: pdfKnownBugScan ?? null,
        placeholderLeaks: pdfPlaceholderLeaks
          ? { count: pdfPlaceholderLeaks.length, findings: pdfPlaceholderLeaks }
          : null,
        blocker: pdfResult.blocker,
        helper: pdfResult.helper ?? null,
        textExtractionNote: pdfTextExtractionNote,
      }
    : {
        status: "PARTIAL",
        outputPath: null,
        textExtracted: false,
        requiredTextPassed: "N/A",
        forbiddenTextAbsent: "N/A",
        blocker: pdfResult.blocker,
        helper: null,
      };

  // Build final status
  // DOCX PASS + PDF PASS → overall PASS.
  // PDF PARTIAL (text extraction not done) → overall PARTIAL.
  // DOCX FAIL → overall FAIL regardless of PDF.
  let overallStatus;
  if (docxGolden.status === "FAIL") {
    overallStatus = "FAIL";
  } else if (pdfGolden.status === "PARTIAL" || !pdfTextExtracted) {
    overallStatus = "PARTIAL";
  } else {
    overallStatus = "PASS";
  }

  // Write JSON
  const result = {
    schemaVersion: 1,
    task: TASK,
    templateCode: TEMPLATE_CODE,
    generatedAt,
    strategy: "direct generated render core (Docxtemplater + PizZip, same engine as DocxtemplaterContractRenderEngine.renderActiveDocx)",
    sourceInputs: {
      bm001Profile: BM001_PROFILE_PATH,
      bm001LockedContract: LOCKED_CONTRACT_PATH,
      bm001NormalizedDocx: NORMALIZED_DOCX_PATH,
      sourceId: lockedContract.sourceId,
      slotCount: Array.isArray(lockedContract.docxSlots)
        ? lockedContract.docxSlots.length
        : null,
      bindingCount: Array.isArray(lockedContract.renderBindings)
        ? lockedContract.renderBindings.length
        : null,
      demoKeyCount: Object.keys(demo).length,
      requiredTextCount: acceptance.requiredText.length,
      forbiddenTextCount: acceptance.forbiddenText.length,
    },
    docxGolden,
    pdfGolden,
    status: overallStatus,
  };
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(result, null, 2)}\n`);

  // Write Markdown
  writeFileSync(OUTPUT_MD_PATH, buildMarkdownReport(result));

  // Print short summary
  console.log(`${TASK} ${TEMPLATE_CODE} ${overallStatus}`);
  console.log(
    `  DOCX: ${docxGolden.status} | required ${docxGolden.requiredTextPassed} | forbidden absent ${docxGolden.forbiddenTextAbsent} | sections ${sectionScan.filter((s) => s.present).length}/${sectionScan.length} | demo names ${demoNameScan.filter((n) => n.present).length}/${demoNameScan.length} | known bugs ${knownBugScan.filter((b) => !b.present).length}/${knownBugScan.length} absent`,
  );
  console.log(`  PDF:  ${pdfGolden.status} | blocker: ${pdfGolden.blocker ?? "none"}`);
  console.log(`  Report: ${OUTPUT_JSON_PATH}`);
  console.log(`  Markdown: ${OUTPUT_MD_PATH}`);
  console.log(`  DOCX: ${OUTPUT_DOCX_PATH}`);

  process.exit(overallStatus === "FAIL" ? 1 : 0);
}

function fail(message) {
  console.error(`[FATAL] ${message}`);
  process.exit(2);
}

function buildMarkdownReport(result) {
  const lines = [
    `# ${result.templateCode} Render / Export Golden Validation`,
    "",
    `Generated: ${result.generatedAt}`,
    `Status: **${result.status}**`,
    `Strategy: ${result.strategy}`,
    "",
    "## Source Inputs",
    "",
    `| Key | Path |`,
    `|---|---|`,
    `| BM-001 profile | \`${result.sourceInputs.bm001Profile}\` |`,
    `| Locked contract | \`${result.sourceInputs.bm001LockedContract}\` |`,
    `| Normalized DOCX | \`${result.sourceInputs.bm001NormalizedDocx}\` |`,
    `| sourceId | \`${result.sourceInputs.sourceId}\` |`,
    `| contract slot count | ${result.sourceInputs.slotCount} |`,
    `| contract binding count | ${result.sourceInputs.bindingCount} |`,
    `| demo key count | ${result.sourceInputs.demoKeyCount} |`,
    `| requiredText count | ${result.sourceInputs.requiredTextCount} |`,
    `| forbiddenText count | ${result.sourceInputs.forbiddenTextCount} |`,
    "",
    "## DOCX Golden",
    "",
    `Status: **${result.docxGolden.status}**`,
    `Output: \`${result.docxGolden.outputPath}\``,
    `File size: ${result.docxGolden.fileSizeBytes} bytes`,
    `Text extracted: ${result.docxGolden.textExtracted ? "YES" : "NO"} (${result.docxGolden.partsExtracted} parts)`,
    `requiredText passed: ${result.docxGolden.requiredTextPassed}`,
    `forbiddenText absent: ${result.docxGolden.forbiddenTextAbsent}`,
    `placeholder leaks: ${result.docxGolden.placeholderLeaks.count}`,
    `stale fallback leaks: ${result.docxGolden.staleFallbackLeaksPresent ? "YES" : "NO"}`,
    "",
    "### requiredText results",
    "",
    "| Anchor | Present |",
    "|---|---|",
    ...result.docxGolden.requiredTextResults.map(
      (r) => `| \`${r.anchor}\` | ${r.present ? "PASS" : "FAIL"} |`,
    ),
    "",
    "### forbiddenText results",
    "",
    "| Token | Absent |",
    "|---|---|",
    ...result.docxGolden.forbiddenTextResults.map(
      (r) => `| \`${r.token}\` | ${!r.present ? "PASS" : "FAIL"} |`,
    ),
    "",
    "### required sections",
    "",
    "| Section | Present |",
    "|---|---|",
    ...result.docxGolden.sectionResults.map(
      (r) => `| \`${r.anchor}\` | ${r.present ? "PASS" : "FAIL"} |`,
    ),
    "",
    "### demo names",
    "",
    "| Name | Present |",
    "|---|---|",
    ...result.docxGolden.demoNameResults.map(
      (r) => `| \`${r.name}\` | ${r.present ? "PASS" : "FAIL"} |`,
    ),
    "",
    "### known bug tokens (must be absent)",
    "",
    "| Token | Absent |",
    "|---|---|",
    ...result.docxGolden.knownBugResults.map(
      (r) => `| \`${r.token}\` | ${!r.present ? "PASS" : "FAIL"} |`,
    ),
    "",
    "### placeholder leaks",
    "",
    result.docxGolden.placeholderLeaks.count === 0
      ? "None."
      : result.docxGolden.placeholderLeaks.findings
          .map((f) => `- \`${f.kind}\` in ${f.partName}: ${f.preview}…`)
          .join("\n"),
    "",
    "## PDF Golden",
    "",
    `Status: **${result.pdfGolden.status}**`,
    `Output: \`${result.pdfGolden.outputPath ?? "(not generated)"}\``,
    `Helper: \`${result.pdfGolden.helper ?? "(none)"}\``,
    `Text extracted: ${result.pdfGolden.textExtracted ? "YES" : "NO"}`,
    `requiredText passed: ${result.pdfGolden.requiredTextPassed}`,
    `forbiddenText absent: ${result.pdfGolden.forbiddenTextAbsent}`,
    `Blocker: ${result.pdfGolden.blocker ?? "none"}`,
    result.pdfGolden.textExtractionNote
      ? `Note: ${result.pdfGolden.textExtractionNote}`
      : "",
    "",
    result.pdfGolden.requiredTextResults
      ? [
          "### requiredText results (PDF)",
          "",
          "| Anchor | Present |",
          "|---|---|",
          ...result.pdfGolden.requiredTextResults.map(
            (r) => `| \`${r.anchor}\` | ${r.present ? "PASS" : "FAIL"} |`,
          ),
          "",
        ].join("\n")
      : "",
    result.pdfGolden.forbiddenTextResults
      ? [
          "### forbiddenText results (PDF)",
          "",
          "| Token | Absent |",
          "|---|---|",
          ...result.pdfGolden.forbiddenTextResults.map(
            (r) => `| \`${r.token}\` | ${!r.present ? "PASS" : "FAIL"} |`,
          ),
          "",
        ].join("\n")
      : "",
    result.pdfGolden.sectionResults
      ? [
          "### required sections (PDF)",
          "",
          "| Section | Present |",
          "|---|---|",
          ...result.pdfGolden.sectionResults.map(
            (r) => `| \`${r.anchor}\` | ${r.present ? "PASS" : "FAIL"} |`,
          ),
          "",
        ].join("\n")
      : "",
    result.pdfGolden.demoNameResults
      ? [
          "### demo names (PDF)",
          "",
          "| Name | Present |",
          "|---|---|",
          ...result.pdfGolden.demoNameResults.map(
            (r) => `| \`${r.name}\` | ${r.present ? "PASS" : "FAIL"} |`,
          ),
          "",
        ].join("\n")
      : "",
    result.pdfGolden.knownBugResults
      ? [
          "### known bug tokens (PDF, must be absent)",
          "",
          "| Token | Absent |",
          "|---|---|",
          ...result.pdfGolden.knownBugResults.map(
            (r) => `| \`${r.token}\` | ${!r.present ? "PASS" : "FAIL"} |`,
          ),
          "",
        ].join("\n")
      : "",
    result.pdfGolden.placeholderLeaks
      ? [
          "### placeholder leaks (PDF)",
          "",
          result.pdfGolden.placeholderLeaks.count === 0
            ? "None."
            : result.pdfGolden.placeholderLeaks.findings
                .map((f) => `- \`${f.kind}\` in ${f.partName}: ${f.preview}…`)
                .join("\n"),
          "",
        ].join("\n")
      : "",
    "## Lifecycle",
    "",
    "- Render strategy: direct generated render core (PizZip + Docxtemplater, same packages and delimiters as `DocxtemplaterContractRenderEngine`).",
    "- PDF export: existing project helper `apps/api/scripts/pdf-convert-word-com.ps1` (Word COM) and/or `pdf-convert-fallback.ps1` (LibreOffice → Word COM). No new dependencies, no DB mutation.",
    "- No DB mutation. No `/templates/:templateCode` runtime preview lifecycle used.",
    "- No mutation of source DOCX, normalized DOCX, locked contract, or BM-001 profile.",
    "",
  ];
  return lines.join("\n");
}

main().catch((err) => {
  console.error(
    "[FATAL]",
    err && err.stack ? err.stack : err && err.message ? err.message : String(err),
  );
  process.exit(2);
});