#!/usr/bin/env node
/**
 * scripts/audit/assert-top-right-promulgation-block.mjs
 *
 * Regression guard for the top-right "Mẫu số / Ban hành theo Thông tư /
 * Ngày" block. For each target form, asserts that the runtime-generated
 * DOCX preserves the source/normalized DOCX's run/paragraph properties
 * for every promulgation-block paragraph (font, size 16 half-pt = 8pt,
 * bold/italic flags, jc=center, text-box geometry).
 *
 * Exit code 0 on PASS, non-zero on FAIL. Designed to be cheap; reuses
 * PizZip to extract word/document.xml from both DOCX packages.
 *
 * Usage:
 *   node scripts/audit/assert-top-right-promulgation-block.mjs
 *   TARGET_CODES="BM-006,BM-015" node scripts/audit/assert-top-right-promulgation-block.mjs
 *
 * No mutation: source/normalized/locked/compiled DOCX, contracts, DB,
 * schema, public API, and FormFlight allowlist remain untouched.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const GENERATED_DIRS = [
  `${ROOT}/.tmp-docx-download-smoke`,
  `${ROOT}/.tmp-batch3-docx-download-smoke`,
  `${ROOT}/.tmp-batch4-docx-download-smoke`,
];

const TARGET_CODES = (process.env.TARGET_CODES ||
  "BM-001,BM-006,BM-015,BM-035,BM-038,BM-042,BM-044,BM-046,BM-047,BM-048,BM-052,BM-053,BM-054,BM-057,BM-070,BM-076,BM-171")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// (Same promulgation filter as the measurement script.)
const PROCLAMATION_NGAY_REGEX = /^Ngày\s*\d*\s*\/?\s*\d*\s*\/?\s*\d+\)\s*$/;
function isPromulgationBlockParagraph(text) {
  if (
    text.includes("Mẫu số") ||
    text.includes("Ban hành theo Thông tư") ||
    text.includes("TT-VKSTC")
  )
    return true;
  if (PROCLAMATION_NGAY_REGEX.test(text.trim())) return true;
  return false;
}

function decodeXml(s) {
  return String(s ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
function paraTexts(paraXml) {
  const out = [];
  for (const m of paraXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g))
    out.push(decodeXml(m[1]));
  return out.join("");
}
function splitParagraphs(xml) {
  return xml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
}
function extractRunProtos(paraXml) {
  const protos = [];
  const top = paraXml.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) || [];
  for (const r of top) protos.push({ run: r, inTextBox: false });
  const txbx = paraXml.match(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g) || [];
  for (const tb of txbx) {
    const inner = tb.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) || [];
    for (const r of inner) protos.push({ run: r, inTextBox: true });
  }
  return protos;
}
function readRunAttrs(runXml) {
  const rprMatch = runXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  const rpr = rprMatch ? rprMatch[0] : "";
  const get = (tag) => {
    const re = new RegExp(
      `<w:${tag}(?:\\s[^/>]*)?(?:\\s*\\/>|>[\\s\\S]*?<\\/w:${tag}>)`,
    );
    const m = rpr.match(re);
    if (!m) return null;
    const valMatch = m[0].match(/w:val\s*=\s*["']([^"']*)["']/);
    return valMatch ? valMatch[1] : "true";
  };
  const rFonts = (() => {
    const m = rpr.match(/<w:rFonts[^/>]*\/>/);
    if (!m) return null;
    const ascii = m[0].match(/w:ascii\s*=\s*["']([^"']*)["']/);
    const hAnsi = m[0].match(/w:hAnsi\s*=\s*["']([^"']*)["']/);
    return {
      ascii: ascii ? ascii[1] : null,
      hAnsi: hAnsi ? hAnsi[1] : null,
    };
  })();
  return {
    rFonts,
    sz: get("sz"),
    bold: /<w:b\s*\/>|<w:b\s+/.test(rpr),
    italic: /<w:i\s*\/>|<w:i\s+/.test(rpr),
  };
}
function readParagraphProps(paraXml) {
  const pprMatch = paraXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const ppr = pprMatch ? pprMatch[0] : "";
  const jcMatch = ppr.match(/<w:jc[^/>]*\/>/);
  let jc = null;
  if (jcMatch) {
    const v = jcMatch[0].match(/w:val\s*=\s*["']([^"']*)["']/);
    jc = v ? v[1] : null;
  }
  const textBox = (() => {
    if (!/<w:drawing>/.test(paraXml)) return null;
    const ext = paraXml.match(/<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/);
    return {
      cx: ext ? Number(ext[1]) : null,
      cy: ext ? Number(ext[2]) : null,
    };
  })();
  return { jc, textBox };
}
function findTopRightParagraphs(docXml) {
  const paras = splitParagraphs(docXml);
  const matched = [];
  for (let i = 0; i < paras.length; i++) {
    const text = paraTexts(paras[i]);
    if (!isPromulgationBlockParagraph(text)) continue;
    matched.push({
      index: i,
      text,
      props: readParagraphProps(paras[i]),
      runs: extractRunProtos(paras[i]).map((r) => ({
        inTextBox: r.inTextBox,
        attrs: readRunAttrs(r.run),
      })),
    });
  }
  return matched;
}
function findGeneratedPath(code) {
  for (const dir of GENERATED_DIRS) {
    const p = `${dir}/${code}.docx`;
    if (existsSync(p)) return p;
  }
  return null;
}

function assertForm(code) {
  const sourcePath = `${NORM_DIR}/${code}/${code}_normalized.docx`;
  const generatedPath = findGeneratedPath(code);
  const out = { code, source: sourcePath, generated: generatedPath };
  if (!existsSync(sourcePath)) {
    out.status = "SKIP";
    out.reason = "source missing";
    return out;
  }
  if (!generatedPath) {
    out.status = "SKIP";
    out.reason = "generated missing";
    return out;
  }
  const srcBlocks = findTopRightParagraphs(
    new PizZip(readFileSync(sourcePath)).file("word/document.xml").asText(),
  );
  const genBlocks = findTopRightParagraphs(
    new PizZip(readFileSync(generatedPath)).file("word/document.xml").asText(),
  );
  const failures = [];
  if (srcBlocks.length !== genBlocks.length) {
    failures.push(`block count: src=${srcBlocks.length} gen=${genBlocks.length}`);
  }
  const n = Math.min(srcBlocks.length, genBlocks.length);
  for (let i = 0; i < n; i++) {
    const s = srcBlocks[i];
    const g = genBlocks[i];
    if (s.text !== g.text) {
      failures.push(`para ${i} text diff: src="${s.text.slice(0, 60)}" gen="${g.text.slice(0, 60)}"`);
      continue;
    }
    if (s.props.jc !== g.props.jc) {
      failures.push(`para ${i} jc: src=${s.props.jc} gen=${g.props.jc}`);
    }
    if (JSON.stringify(s.props.textBox) !== JSON.stringify(g.props.textBox)) {
      failures.push(
        `para ${i} textBox: src=${JSON.stringify(s.props.textBox)} gen=${JSON.stringify(g.props.textBox)}`,
      );
    }
    if (s.runs.length !== g.runs.length) {
      failures.push(`para ${i} run count: src=${s.runs.length} gen=${g.runs.length}`);
      continue;
    }
    for (let j = 0; j < s.runs.length; j++) {
      const sr = s.runs[j].attrs;
      const gr = g.runs[j].attrs;
      if (sr.sz !== gr.sz) failures.push(`para ${i} run ${j} sz: src=${sr.sz} gen=${gr.sz}`);
      if (sr.bold !== gr.bold) failures.push(`para ${i} run ${j} bold: src=${sr.bold} gen=${gr.bold}`);
      if (sr.italic !== gr.italic) failures.push(`para ${i} run ${j} italic: src=${sr.italic} gen=${gr.italic}`);
      const sFont = sr.rFonts?.ascii || sr.rFonts?.hAnsi;
      const gFont = gr.rFonts?.ascii || gr.rFonts?.hAnsi;
      if (sFont !== gFont) failures.push(`para ${i} run ${j} font: src=${sFont} gen=${gFont}`);
    }
  }
  out.srcBlocks = srcBlocks.length;
  out.genBlocks = genBlocks.length;
  out.failures = failures;
  out.status = failures.length === 0 ? "PASS" : "FAIL";
  return out;
}

const results = TARGET_CODES.map(assertForm);
const failed = results.filter((r) => r.status === "FAIL");
const skipped = results.filter((r) => r.status === "SKIP");
const passed = results.filter((r) => r.status === "PASS");

console.log(`Total: ${results.length}; PASS=${passed.length}; FAIL=${failed.length}; SKIP=${skipped.length}`);
for (const r of failed) {
  console.log(`FAIL ${r.code}:`);
  for (const f of r.failures) console.log("  - " + f);
}
for (const r of skipped) {
  console.log(`SKIP ${r.code}: ${r.reason}`);
}
process.exit(failed.length === 0 ? 0 : 1);