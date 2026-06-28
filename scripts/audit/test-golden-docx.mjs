#!/usr/bin/env node
/**
 * F6 — Golden DOCX fixtures for 30 representative BMs.
 *
 * Usage:
 *   node scripts/audit/test-golden-docx.mjs               # audit only
 *   node scripts/audit/test-golden-docx.mjs -- --update     # bootstrap fixtures
 *   pnpm test:golden-docx
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const $require = createRequire(import.meta.url);

const ROOT = resolve(process.cwd());
const FIXTURE_DIR = join(ROOT, "tests", "golden-docx");
const LOCKED_DIR = join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const NORMALIZED_DIR = join(ROOT, "storage", "templates", "normalized-docx");
const REPORT_DIR = join(ROOT, "docs", "audit", "golden-docx");
const CACHE_DIR = join(ROOT, ".cache", "f6-golden-render");

const UPDATE_MODE = process.argv.includes("--update");

// ──────────────────────────────────────────────────────────────────────────────
// 30 representative BMs
// ──────────────────────────────────────────────────────────────────────────────
const GOLDEN_BMS = [
  "BM-001", "BM-002", "BM-004", "BM-031", "BM-039",
  "BM-051", "BM-053", "BM-054", "BM-057", "BM-070",
  "BM-085", "BM-086", "BM-100", "BM-103", "BM-139",
  "BM-141", "BM-144", "BM-145", "BM-146", "BM-148",
  "BM-150", "BM-156", "BM-159", "BM-166", "BM-168",
  "BM-169", "BM-170", "BM-171", "BM-172", "BM-173",
];

// ──────────────────────────────────────────────────────────────────────────────
// Text extraction (mirrors F3 audit-rendered-text-fidelity.mjs)
// ──────────────────────────────────────────────────────────────────────────────
const UNREPLACED_TOKENS = ["{{", "}}", "{#", "{/"];

const extractTextFromPart = (content) => {
  const results = [];
  const stripped = content.replace(/<w:t(?:\s[^>]*)?\/>/gu, "");
  const matches = [...stripped.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)];
  for (const m of matches) {
    let t = m[1];
    t = t
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#xD;/g, "");
    t = t.replace(/<[^>]*>/g, "");
    if (t.trim()) results.push(t.trim());
  }
  return results;
};

const extractAllTextParts = (buf) => {
  const PizZip = $require("pizzip");
  const zip = new PizZip(buf);
  const results = [];
  for (const name of Object.keys(zip.files)) {
    if (!/^word\//.test(name) && name !== "word/document.xml") continue;
    if (!name.endsWith(".xml")) continue;
    const content = zip.file(name)?.asText();
    if (!content) continue;
    const parts = extractTextFromPart(content);
    for (const text of parts) {
      results.push({ part: name, text });
    }
  }
  return results;
};

const findUnreplacedPlaceholders = (textParts) => {
  const issues = [];
  for (const { part, text } of textParts) {
    for (const token of UNREPLACED_TOKENS) {
      if (text.includes(token)) {
        const idx = text.indexOf(token);
        issues.push({
          token,
          part: part.replace("word/", ""),
          preview: text.slice(Math.max(0, idx - 15), idx + 40),
        });
        break;
      }
    }
  }
  return issues;
};

const normalizeText = (text) => text.replace(/\s+/g, " ").trim();

const fullTextFromParts = (textParts) =>
  normalizeText(textParts.map((p) => p.text).join(" "));

// ──────────────────────────────────────────────────────────────────────────────
// Anchor extraction (from original DOCX template)
// ──────────────────────────────────────────────────────────────────────────────
const LEGAL_ANCHOR_PATTERNS = [
  "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
  "Độc lập - Tự do - Hạnh phúc",
  "VIỆN KIỂM SÁT",
  "TÒA ÁN",
  "Căn cứ",
  "Bộ luật Tố tụng hình sự",
  "Bộ luật Hình sự",
  "Nơi nhận",
  "TM. TÒA ÁN",
  "TM. VIỆN KIỂM SÁT",
];

const splitAroundPlaceholders = (text) => {
  const segments = [];
  const re = /\{\{[^}]+\}\}/g;
  let lastEnd = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastEnd) segments.push(text.slice(lastEnd, m.index));
    segments.push(m[0]);
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) segments.push(text.slice(lastEnd));
  return segments;
};

const classifyAsLocked = (text) => {
  const labelWords = [
    "Họ và tên", "Tên", "Địa chỉ", "Ngày sinh", "Nghề nghiệp",
    "CMND", "Số CMND", "Cơ quan", "Chức vụ",
    "Điều", "khoản", "Mục", "Tiết",
    "YÊU CẦU", "BIÊN BẢN", "QUYẾT ĐỊNH", "BẢN ÁN", "THÔNG BÁO",
    "Tòa", "Viện", "Người", "Mẫu số", "HS",
  ];
  for (const word of labelWords) {
    if (text.includes(word)) return true;
  }
  if (/[A-ZÀ-Ỹ]{3,}\s+(NHÂN DÂN|QUÂN SỰ|NHÂN|CỦA)/u.test(text)) return true;
  if (/(?:Điều|Mục|Tiết|Khoản)\s+\d/u.test(text)) return true;
  if (/Mẫu\s+số\s+\d+/.test(text)) return true;
  if (/TM\.|Thừa ủy|Chánh|Phó|Thư ký|Kiểm sát|Khởi tố/.test(text)) return true;
  return false;
};

const extractAnchorsFromParts = (textParts) => {
  const fullText = fullTextFromParts(textParts);
  const fullNorm = normalizeText(fullText);
  const anchors = [];

  for (const pattern of LEGAL_ANCHOR_PATTERNS) {
    if (fullNorm.includes(pattern)) {
      anchors.push({ text: pattern, level: "LEGAL_ANCHOR", required: true });
    }
  }

  const seen = new Set(anchors.map((a) => a.text));
  for (const { text } of textParts) {
    for (const seg of splitAroundPlaceholders(text)) {
      const cleaned = seg.replace(/\{\{[^}]+\}\}/g, "").trim();
      if (cleaned.length < 12) continue;
      const alphaLen = (cleaned.match(/[a-zA-ZÀ-ỹ]/gu) || []).length;
      if (alphaLen / cleaned.length < 0.3) continue;
      const norm = normalizeText(cleaned);
      if (/^_{2,}[\w]+_{2,}$/.test(norm)) continue;
      if (UNREPLACED_TOKENS.some((t) => norm.includes(t))) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      if (classifyAsLocked(cleaned)) {
        anchors.push({ text: norm, level: "LOCKED_ANCHOR", required: true });
      }
    }
  }

  return anchors;
};

// ──────────────────────────────────────────────────────────────────────────────
// Stable mock values
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_VALUES = {
  "agency.name": "Viện Kiểm sát nhân dân thành phố Hà Nội",
  "agency.parentName": "Viện Kiểm sát nhân dân tối cao",
  "agency.bodyName": "Viện Kiểm sát nhân dân thành phố Hà Nội",
  "document.documentCodeLine": "123/2026/VKSTC-P8",
  "document.fullDocumentCode": "123/VKSTC-P8",
  "document.fullDocumentCode2": "456/VKSTC-P8",
  "document.fullDocumentCode4": "789/VKSTC-P8",
  "document.fullDocumentCode6": "111/VKSTC-P8",
  "document.fullDocumentCode8": "222/VKSTC-P8",
  "document.issuePlaceAndDateLine": "Hà Nội, ngày 15 tháng 06 năm 2026",
  "document.issueDate": "15/06/2026",
  "decision.decisionLine": "Quyết định số 123/2026/QĐ-VKS",
  "decision.decisionLine2": "Quyết định số 456/2026/QĐ-VKS",
  "decision.decisionLine3": "Quyết định số 789/2026/QĐ-VKS",
  "decision.decisionLine10": "Quyết định số 101/2026/QĐ-VKS",
  "decision.decisionLine11": "Quyết định số 202/2026/QĐ-VKS",
  "person.personFullName": "Nguyễn Văn Minh",
  "person.dateOfBirth": "15/03/1985",
  "person.dateOfBirthText": "ngày 15 tháng 03 năm 1985",
  "person.idNumber": "012345678901",
  "person.currentAddress": "Số 10 phố Trang Tien, quận Hoàn Kiếm, Hà Nội",
  "person.occupation": "Công nhân",
  "person.province": "Hà Nội",
  "person.ward": "Phường Tràng Tiền",
  "case.caseNumber": "01/2026/TLST-HS",
  "signature.signerName": "Trần Thị Lan",
  "signature.positionTitle": "Viện trưởng",
  "signature.signMode": "Ký gửi",
  "recipients.personLine": "Nguyễn Văn Minh",
  "recipients.personLine3": "Nguyễn Thị Hương",
  "recipients.personLine4": "Trần Văn Bình",
  "recipients.personLine5": "Lê Thị C",
  "recipients.personLine6": "Phạm Văn D",
  "recipients.investigationUnitLine": "Công an thành phố Hà Nội",
  "recipients.archiveLine": "Lưu hồ sơ",
};

const markerForPath = (p) => `__${p.replace(/\W+/g, "_").toUpperCase()}__`;

// ──────────────────────────────────────────────────────────────────────────────
// Payload builder
// ──────────────────────────────────────────────────────────────────────────────
const buildPayload = (contract) => {
  const formInputs = {};
  const overrides = {};

  for (const field of contract.canonicalFields || []) {
    const key = field.path;
    const val = MOCK_VALUES[key] || markerForPath(key);

    if (field.source === "manual") {
      formInputs[key] = val;
    } else if (
      field.source === "agencyConfig" ||
      field.source === "officialConfig" ||
      field.source === "systemDate" ||
      field.source === "casePayload" ||
      field.source === "computed"
    ) {
      overrides[key] = val;
    }
  }

  return { formInputs, overrides };
};

// ──────────────────────────────────────────────────────────────────────────────
// DOCX pre-processing (fix malformed placeholders)
// ──────────────────────────────────────────────────────────────────────────────
const fixMalformedPlaceholders = (text) => {
  text = text.replace(/\}{3,}/gu, "}}");
  const result = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "{") { depth++; result.push(c); }
    else if (c === "}") { if (depth > 0) { depth--; result.push(c); } }
    else { result.push(c); }
  }
  const fixed = result.join("");
  const openPairs = (fixed.match(/\{\{/g) || []).length;
  const closePairs = (fixed.match(/\}\}/g) || []).length;
  if (openPairs > closePairs) return fixed + "}}";
  return fixed;
};

const preprocessDocxZip = (buf) => {
  const PizZip = $require("pizzip");
  const zip = new PizZip(buf);
  const fixedFiles = {};
  let changed = false;
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue;
    const content = zip.file(name)?.asText();
    if (!content || !content.includes("{{")) continue;
    const fixed = content.replace(
      /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/gu,
      (match, openTag, textContent, closeTag) => {
        const ft = fixMalformedPlaceholders(textContent);
        return ft !== textContent ? openTag + ft + closeTag : match;
      },
    );
    if (fixed !== content) { fixedFiles[name] = fixed; changed = true; }
  }
  if (!changed) return buf;
  const newZip = new PizZip();
  for (const name of Object.keys(zip.files)) {
    newZip.file(name, fixedFiles[name] !== undefined ? fixedFiles[name] : zip.files[name].asUint8Array());
  }
  return newZip.generate({ type: "nodebuffer" });
};

// ──────────────────────────────────────────────────────────────────────────────
// Render DOCX (sync, subprocess-per-BM)
// ──────────────────────────────────────────────────────────────────────────────
const renderDocx = (templateCode, contract, outputBinPath) => {
  const scriptDir = join(tmpdir(), `f6-golden-${process.pid}-${Date.now()}-${Math.random()}`);
  mkdirSync(scriptDir, { recursive: true });

  const normalizedPath = join(NORMALIZED_DIR, templateCode, `${templateCode}_normalized.docx`);
  const rawBuf = readFileSync(normalizedPath);
  const fixedBuf = preprocessDocxZip(rawBuf);

  const { formInputs, overrides } = buildPayload(contract);
  const payloadPath = join(scriptDir, "payload.json");
  writeFileSync(payloadPath, JSON.stringify({ formInputs, renderPayloadOverrides: {}, overrides }), "utf8");

  const scriptPath = join(scriptDir, "render.cjs");
  const escapedNorm = normalizedPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedPayload = payloadPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedOut = outputBinPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const scriptContent = [
    `"use strict";`,
    `const PizZip = require("pizzip");`,
    `const Docxtemplater = require("docxtemplater");`,
    `const fs = require("node:fs");`,
    `const buf = fs.readFileSync("${escapedNorm}");`,
    `const payload = JSON.parse(fs.readFileSync("${escapedPayload}", "utf8"));`,
    `const zip = new PizZip(buf);`,
    `const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });`,
    `doc.render(payload);`,
    `const result = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });`,
    `fs.writeFileSync("${escapedOut}", result);`,
    `process.exit(0);`,
  ].join("\n");

  writeFileSync(scriptPath, scriptContent, "utf8");

  try {
    execSync(`node "${scriptPath}"`, { cwd: ROOT, stdio: "pipe", timeout: 30_000 });
  } catch (e) {
    try { rmSync(scriptDir, { recursive: true, force: true }); } catch (_) {}
    throw new Error(`Render subprocess failed: ${e.message}`);
  }

  try { rmSync(scriptDir, { recursive: true, force: true }); } catch (_) {}
};

// ──────────────────────────────────────────────────────────────────────────────
// Stable contract hash
// ──────────────────────────────────────────────────────────────────────────────
const stableHash = (contract) => {
  const stable = JSON.stringify(contract);
  return createHash("sha256").update(stable).digest("hex");
};

// ──────────────────────────────────────────────────────────────────────────────
// Load locked contract for a template code
// ──────────────────────────────────────────────────────────────────────────────
const loadContract = (templateCode) => {
  const files = readdirSync(LOCKED_DIR).filter(
    (f) => f.startsWith(templateCode + "__") && f.endsWith(".contract.locked.json"),
  );
  if (!files.length) throw new Error(`No locked contract for ${templateCode}`);
  return JSON.parse(readFileSync(join(LOCKED_DIR, files[0]), "utf8"));
};

// ──────────────────────────────────────────────────────────────────────────────
// Bootstrap a fixture (--update mode)
// ──────────────────────────────────────────────────────────────────────────────
const bootstrap = (templateCode) => {
  const dir = join(FIXTURE_DIR, templateCode);
  mkdirSync(dir, { recursive: true });

  const contract = loadContract(templateCode);
  const contractHash = stableHash(contract);
  const normalizedPath = join(NORMALIZED_DIR, templateCode, `${templateCode}_normalized.docx`);

  if (!existsSync(normalizedPath)) {
    console.error(`  Cannot bootstrap ${templateCode}: no normalized DOCX`);
    return;
  }

  // Render
  mkdirSync(CACHE_DIR, { recursive: true });
  const outBin = join(CACHE_DIR, `${templateCode}_rendered.bin`);
  renderDocx(templateCode, contract, outBin);

  const PizZip = $require("pizzip");
  const renderedBuf = readFileSync(outBin);
  const renderedZip = new PizZip(renderedBuf);
  const renderedParts = extractAllTextParts(renderedZip.files);
  const renderedText = fullTextFromParts(renderedParts);

  // Extract anchors from ORIGINAL template (not rendered)
  const originalBuf = readFileSync(normalizedPath);
  const originalZip = new PizZip(originalBuf);
  const originalParts = extractAllTextParts(originalZip.files);
  const anchors = extractAnchorsFromParts(originalParts);

  // expected-text.txt
  writeFileSync(join(dir, "expected-text.txt"), normalizeText(renderedText), "utf8");

  // expected-anchors.json
  writeFileSync(
    join(dir, "expected-anchors.json"),
    JSON.stringify({ templateCode, anchors }, null, 2),
    "utf8",
  );

  // input.json
  const { formInputs, overrides } = buildPayload(contract);
  writeFileSync(
    join(dir, "input.json"),
    JSON.stringify({ formInputs, overrides, note: "Stable mock values for golden fixture. F6 bootstrap." }, null, 2),
    "utf8",
  );

  // metadata.json
  writeFileSync(
    join(dir, "metadata.json"),
    JSON.stringify({
      templateCode,
      sourceId: contract.sourceId,
      contractHash,
      generatedAt: new Date().toISOString(),
      notes: "Initial baseline generated from K0-green output. F6 bootstrap.",
      knownExceptions: [],
    }, null, 2),
    "utf8",
  );

  console.log(
    `  ${templateCode}: text=${normalizeText(renderedText).length} chars, anchors=${anchors.length}`,
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Audit a fixture (normal mode)
// ──────────────────────────────────────────────────────────────────────────────
const audit = (templateCode) => {
  const dir = join(FIXTURE_DIR, templateCode);
  const errors = [];
  const warnings = [];

  // Check fixture files exist
  for (const f of ["input.json", "expected-text.txt", "expected-anchors.json", "metadata.json"]) {
    if (!existsSync(join(dir, f))) {
      errors.push(`${f} missing`);
    }
  }
  if (errors.length > 0) return { templateCode, status: "MISSING", errors, warnings };

  const contract = loadContract(templateCode);
  const contractHash = stableHash(contract);

  // Render
  mkdirSync(CACHE_DIR, { recursive: true });
  const outBin = join(CACHE_DIR, `${templateCode}_rendered.bin`);
  try {
    renderDocx(templateCode, contract, outBin);
  } catch (e) {
    return { templateCode, status: "FAIL", errors: [`Render failed: ${e.message}`], warnings };
  }

  try {
    const PizZip = $require("pizzip");
    const renderedBuf = readFileSync(outBin);
    const renderedZip = new PizZip(renderedBuf);
    const renderedParts = extractAllTextParts(renderedZip.files);
    const unreplaced = findUnreplacedPlaceholders(renderedParts);
    if (unreplaced.length > 0) {
      errors.push(`Unreplaced: ${unreplaced.map((u) => u.preview).join("; ")}`);
    }

    const renderedNorm = normalizeText(fullTextFromParts(renderedParts));

    // Check anchors
    const anchors = JSON.parse(readFileSync(join(dir, "expected-anchors.json"), "utf8")).anchors;
    const missingAnchors = anchors
      .filter((a) => !renderedNorm.includes(a.text))
      .map((a) => a.text);

    if (missingAnchors.length > 0) {
      errors.push(`Missing anchors: ${missingAnchors.join("; ")}`);
    }

    // Text comparison
    const expectedNorm = normalizeText(readFileSync(join(dir, "expected-text.txt"), "utf8"));
    if (renderedNorm !== expectedNorm) {
      warnings.push(
        `Text diff: got ${renderedNorm.length} chars, expected ${expectedNorm.length} chars`,
      );
    }

    const status = errors.length > 0 ? "FAIL" : "PASS";
    return { templateCode, status, errors, warnings, contractHash, textLength: renderedNorm.length };
  } catch (e) {
    return { templateCode, status: "FAIL", errors: [`Check failed: ${e.message}`], warnings };
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
console.log(`\n[F6] Golden DOCX fixtures — ${GOLDEN_BMS.length} representative BMs`);
console.log(`Mode: ${UPDATE_MODE ? "UPDATE (bootstrap fixtures)" : "AUDIT (verify fixtures)"}`);
console.log("");

if (UPDATE_MODE) {
  console.log("Bootstrapping fixtures...");
  for (const code of GOLDEN_BMS) {
    process.stdout.write(`  ${code}...`);
    bootstrap(code);
  }
  console.log("\nBootstrap complete.");
  process.exit(0);
}

// Audit mode
console.log("Auditing fixtures...");
const results = [];
for (const code of GOLDEN_BMS) {
  process.stdout.write(`  ${code}...`);
  const result = audit(code);
  console.log(` ${result.status}`);
  results.push(result);
}

const pass = results.filter((r) => r.status === "PASS").length;
const fail = results.filter((r) => r.status === "FAIL").length;
const missing = results.filter((r) => r.status === "MISSING").length;

console.log(`\nSummary: ${pass} PASS, ${fail} FAIL, ${missing} MISSING`);

if (fail > 0) {
  console.log("\nFailures:");
  for (const r of results) {
    if (r.status === "FAIL") {
      console.log(`  ${r.templateCode}:`);
      for (const e of r.errors) console.log(`    - ${e}`);
    }
  }
}

// Reports
mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(
  join(REPORT_DIR, "latest.json"),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: GOLDEN_BMS.length,
    pass,
    fail,
    missing,
    results,
  }, null, 2),
  "utf8",
);

const mdLines = [
  "# F6 Golden DOCX Fixtures — Audit Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Mode: AUDIT (fixtures must exist)`,
  "",
  `| Status | Count |`,
  `|---|---|`,
  `| PASS | ${pass} |`,
  `| FAIL | ${fail} |`,
  `| MISSING | ${missing} |`,
  "",
  "## Details",
  "",
  "| BM | Status | Errors | Warnings |",
  "|---|---|---|---|",
];
for (const r of results) {
  const errs = (r.errors || []).join("; ").substring(0, 60);
  const warns = (r.warnings || []).join("; ").substring(0, 40);
  mdLines.push(`| ${r.templateCode} | ${r.status} | ${errs} | ${warns} |`);
}

writeFileSync(join(REPORT_DIR, "latest.md"), mdLines.join("\n"), "utf8");

console.log(`Report: ${REPORT_DIR}/latest.json`);
process.exit(fail > 0 ? 1 : 0);
