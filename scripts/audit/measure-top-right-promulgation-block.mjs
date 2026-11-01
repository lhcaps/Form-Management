#!/usr/bin/env node
/**
 * scripts/audit/measure-top-right-promulgation-block.mjs
 *
 * Targeted measurement of the top-right "Mẫu số / Ban hành theo Thông tư /
 * Ngày 09/02/2026" block for a single form (pilot: BM-006) and a canary set.
 *
 * Compares source/normalized DOCX vs generated/runtime DOCX at the XML level:
 *   - paragraph alignment (w:jc)
 *   - paragraph indent (w:ind)
 *   - paragraph spacing (w:spacing)
 *   - run font (w:rFonts)
 *   - run size (w:sz) — half-points
 *   - run bold / italic
 *   - paragraph context (inside w:drawing text-box vs body)
 *   - text-box geometry (cx, cy, posOffset)
 *
 * The block is identified by paragraphs containing the triggers:
 *   - "Mẫu số"
 *   - "Ban hành theo Thông tư"
 *   - "Ngày"
 *   - "TT-VKSTC"
 *
 * No mutation: source DOCX, normalized DOCX, locked contract, compiled
 * contract, DB, schema, public API, and FormFlight allowlist remain
 * untouched. This is a pure measurement script.
 *
 * Usage:
 *   node scripts/audit/measure-top-right-promulgation-block.mjs
 *   TARGET_CODES="BM-006,BM-015,BM-057,BM-076,BM-001,BM-171" \
 *     node scripts/audit/measure-top-right-promulgation-block.mjs
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, basename } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
// Generated DOCX can live in one of these directories depending on which batch
// smoke was last run for the form (curated-37, batch3, batch4).
const GENERATED_DIRS = [
  `${ROOT}/.tmp-docx-download-smoke`,
  `${ROOT}/.tmp-batch3-docx-download-smoke`,
  `${ROOT}/.tmp-batch4-docx-download-smoke`,
];
const TMP_DIR = `${ROOT}/.tmp-top-right-promulgation-experiment`;

// Promulgation-block triggers. We use stricter substrings so that paragraphs
// where "Ngày" appears incidentally in narrative content (e.g. "ngày 01/3/2026"
// inside the case summary of a paragraph) are not picked up.
const TRIGGERS = [
  "Mẫu số",
  "Ban hành theo Thông tư",
  "TT-VKSTC",
  "Mẫu số ",
];

// Stricter "Ngày" filter — only the promulgation Ngày line ends with
// "/2026)" right after "Ngày" plus optional spaces.
const PROCLAMATION_NGAY_REGEX = /^Ngày\s*\d*\s*\/?\s*\d*\s*\/?\s*\d+\)\s*$/;

function isPromulgationBlockParagraph(text) {
  if (
    text.includes("Mẫu số") ||
    text.includes("Ban hành theo Thông tư") ||
    text.includes("TT-VKSTC")
  ) {
    return true;
  }
  if (PROCLAMATION_NGAY_REGEX.test(text.trim())) return true;
  return false;
}

const DEFAULT_CODES = ["BM-006"];
const CODES = (process.env.TARGET_CODES || DEFAULT_CODES.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ------------------------------------------------------------------
// XML helpers (read-only)
// ------------------------------------------------------------------

function getDocumentXml(zip) {
  const f = zip.file("word/document.xml");
  if (!f) return null;
  return f.asText();
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
  for (const m of paraXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) {
    out.push(decodeXml(m[1]));
  }
  return out.join("");
}

function splitParagraphs(docXml) {
  if (!docXml) return [];
  return docXml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
}

/**
 * Return all <w:r>...</w:r> blocks contained directly inside a paragraph
 * OR inside a text-box payload. We also recurse into w:txbxContent.
 */
function extractRunProtos(paraXml) {
  const protos = [];
  // Outer runs (top-level)
  const top = paraXml.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) || [];
  for (const r of top) {
    protos.push({ run: r, inTextBox: false });
  }
  // Runs inside w:txbxContent (anchored text-box paragraphs)
  const txbx = paraXml.match(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g) || [];
  for (const tb of txbx) {
    const inner = tb.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) || [];
    for (const r of inner) {
      protos.push({ run: r, inTextBox: true });
    }
  }
  return protos;
}

function readRunAttrs(runXml) {
  const rprMatch = runXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  const rpr = rprMatch ? rprMatch[0] : "";

  const get = (tag) => {
    const re = new RegExp(`<w:${tag}(?:\\s[^/>]*)?(?:\\s*\\/>|>[\\s\\S]*?<\\/w:${tag}>)`);
    const m = rpr.match(re);
    if (!m) return null;
    const valMatch = m[0].match(/w:val\s*=\s*["']([^"']*)["']/);
    return valMatch ? valMatch[1] : "true";
  };

  const rFonts = (() => {
    const re = /<w:rFonts[^/>]*\/>/;
    const m = rpr.match(re);
    if (!m) return null;
    const ascii = m[0].match(/w:ascii\s*=\s*["']([^"']*)["']/);
    const hAnsi = m[0].match(/w:hAnsi\s*=\s*["']([^"']*)["']/);
    const cs = m[0].match(/w:cs\s*=\s*["']([^"']*)["']/);
    return {
      ascii: ascii ? ascii[1] : null,
      hAnsi: hAnsi ? hAnsi[1] : null,
      cs: cs ? cs[1] : null,
    };
  })();

  return {
    rFonts,
    sz: get("sz"),
    szCs: get("szCs"),
    bold: /<w:b\s*\/>|<w:b\s+/.test(rpr) || /<w:bCs\s*\/>|<w:bCs\s+/.test(rpr),
    italic: /<w:i\s*\/>|<w:i\s+/.test(rpr) || /<w:iCs\s*\/>|<w:iCs\s+/.test(rpr),
    color: get("color"),
  };
}

function readParagraphProps(paraXml) {
  const pprMatch = paraXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const ppr = pprMatch ? pprMatch[0] : "";
  const get = (tag) => {
    const re = new RegExp(`<w:${tag}(?:\\s[^/>]*)?(?:\\s*\\/>|>[\\s\\S]*?<\\/w:${tag}>)`);
    const m = ppr.match(re);
    if (!m) return null;
    const valMatch = m[0].match(/w:val\s*=\s*["']([^"']*)["']/);
    return valMatch ? valMatch[1] : null;
  };
  // text-box geometry (only meaningful when paragraph contains a drawing)
  const textBox = (() => {
    if (!/<w:drawing>/.test(paraXml)) return null;
    const ext = paraXml.match(/<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/);
    const offX = paraXml.match(/<wp:positionH[^>]*>\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/);
    const offY = paraXml.match(/<wp:positionV[^>]*>\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/);
    const wrap = paraXml.match(/<wp:wrapSquare/);
    return {
      cx: ext ? Number(ext[1]) : null,
      cy: ext ? Number(ext[2]) : null,
      posOffsetX: offX ? Number(offX[1]) : null,
      posOffsetY: offY ? Number(offY[1]) : null,
      wrap: wrap ? "wrapSquare" : null,
    };
  })();
  return {
    jc: get("jc"),
    ind_left: get("ind") ? (ppr.match(/<w:ind[^/>]*\/>/) || [null])[0] : null,
    spacing: (() => {
      const m = ppr.match(/<w:spacing[^/>]*\/>/);
      return m ? m[0] : null;
    })(),
    textBox,
  };
}

function findTopRightParagraphs(docXml) {
  const paras = splitParagraphs(docXml);
  const matched = [];
  for (let i = 0; i < paras.length; i++) {
    const text = paraTexts(paras[i]);
    if (!isPromulgationBlockParagraph(text)) continue;
    const triggersHit = TRIGGERS.filter((t) => text.includes(t));
    const props = readParagraphProps(paras[i]);
    const runs = extractRunProtos(paras[i]).map((r) => ({
      inTextBox: r.inTextBox,
      attrs: readRunAttrs(r.run),
    }));
    matched.push({
      paragraphIndex: i,
      text,
      triggersHit,
      paragraphProps: props,
      runs,
    });
  }
  return matched;
}

// ------------------------------------------------------------------
// Diff helpers
// ------------------------------------------------------------------

function runAttrDiff(label, src, gen) {
  const out = {};
  for (const key of Object.keys(src)) {
    const a = src[key];
    const b = gen[key];
    out[key] = { source: a, generated: b, equal: JSON.stringify(a) === JSON.stringify(b) };
  }
  return out;
}

function diffParagraphBlocks(srcBlocks, genBlocks) {
  const out = [];
  const n = Math.max(srcBlocks.length, genBlocks.length);
  for (let i = 0; i < n; i++) {
    const s = srcBlocks[i];
    const g = genBlocks[i];
    if (!s || !g) {
      out.push({ index: i, status: s ? "missing-in-generated" : "missing-in-source" });
      continue;
    }
    const textEqual = s.text === g.text;
    const paragraphPropsEqual =
      s.paragraphProps.jc === g.paragraphProps.jc &&
      s.paragraphProps.spacing === g.paragraphProps.spacing &&
      JSON.stringify(s.paragraphProps.textBox) ===
        JSON.stringify(g.paragraphProps.textBox);
    // Compare runs by index; combine run indices from src + gen
    const runDiff = [];
    const rn = Math.max(s.runs.length, g.runs.length);
    for (let j = 0; j < rn; j++) {
      const sr = s.runs[j];
      const gr = g.runs[j];
      if (!sr || !gr) {
        runDiff.push({ index: j, status: sr ? "missing-in-generated" : "missing-in-source" });
        continue;
      }
      runDiff.push({
        index: j,
        inTextBoxEqual: sr.inTextBox === gr.inTextBox,
        attrs: runAttrDiff("rPr", sr.attrs, gr.attrs),
      });
    }
    out.push({
      index: i,
      textEqual,
      text: { source: s.text, generated: g.text },
      triggersHit: { source: s.triggersHit, generated: g.triggersHit },
      paragraphPropsEqual,
      paragraphProps: {
        source: s.paragraphProps,
        generated: g.paragraphProps,
      },
      runs: runDiff,
    });
  }
  return out;
}

// ------------------------------------------------------------------
// Per-form analysis
// ------------------------------------------------------------------

function findGeneratedPath(code) {
  for (const dir of GENERATED_DIRS) {
    const p = `${dir}/${code}.docx`;
    if (existsSync(p)) return p;
  }
  return null;
}

function analyze(code) {
  const sourcePath = `${NORM_DIR}/${code}/${code}_normalized.docx`;
  const generatedPath = findGeneratedPath(code);

  if (!existsSync(sourcePath)) {
    return {
      templateCode: code,
      status: "SKIP",
      reason: `source DOCX not found: ${sourcePath}`,
    };
  }
  if (!generatedPath) {
    return {
      templateCode: code,
      status: "SKIP",
      reason: `generated DOCX not found in any of: ${GENERATED_DIRS.join(", ")}`,
    };
  }

  const srcZip = new PizZip(readFileSync(sourcePath));
  const genZip = new PizZip(readFileSync(generatedPath));

  const srcXml = getDocumentXml(srcZip);
  const genXml = getDocumentXml(genZip);

  if (!srcXml || !genXml) {
    return {
      templateCode: code,
      status: "FAIL",
      reason: "word/document.xml missing in one of the packages",
    };
  }

  const srcBlocks = findTopRightParagraphs(srcXml);
  const genBlocks = findTopRightParagraphs(genXml);

  const blockCountEqual = srcBlocks.length === genBlocks.length;
  const perBlock = diffParagraphBlocks(srcBlocks, genBlocks);

  // Aggregate verdict per block
  const verdicts = perBlock.map((b) => {
    if (b.status) return { ...b, verdict: b.status };
    if (!b.textEqual) return { ...b, verdict: "TEXT_DIFF" };
    if (!b.paragraphPropsEqual) return { ...b, verdict: "PARAGRAPH_PROPS_DIFF" };
    const runMismatches = b.runs.filter(
      (r) => r.status || (r.attrs && Object.values(r.attrs).some((v) => v && v.equal === false))
    );
    if (runMismatches.length > 0) return { ...b, verdict: "RUN_PROPS_DIFF" };
    return { ...b, verdict: "EXACT_MATCH" };
  });

  // Page counts (proxy via soffice already done upstream; here we record path only)
  const sourcePdf = `${ROOT}/.tmp-visual-pdf-fidelity/${code}/${code}_normalized.pdf`;
  const generatedPdf = `${ROOT}/.tmp-visual-pdf-fidelity/${code}/${code}.pdf`;

  const aggregateVerdict = (() => {
    if (!blockCountEqual) return "BLOCK_COUNT_DIFF";
    if (verdicts.some((v) => v.verdict === "TEXT_DIFF")) return "TEXT_DIFF";
    if (verdicts.some((v) => v.verdict === "PARAGRAPH_PROPS_DIFF"))
      return "PARAGRAPH_PROPS_DIFF";
    if (verdicts.some((v) => v.verdict === "RUN_PROPS_DIFF")) return "RUN_PROPS_DIFF";
    return "EXACT_MATCH";
  })();

  return {
    templateCode: code,
    status: "OK",
    sourcePath,
    generatedPath,
    sourcePdfPath: existsSync(sourcePdf) ? sourcePdf : null,
    generatedPdfPath: existsSync(generatedPdf) ? generatedPdf : null,
    blockCount: { source: srcBlocks.length, generated: genBlocks.length, equal: blockCountEqual },
    aggregateVerdict,
    blocks: verdicts,
  };
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const analyses = CODES.map(analyze);

  const out = {
    snapshotDate: new Date().toISOString(),
    measurementScript: "scripts/audit/measure-top-right-promulgation-block.mjs",
    status: "OK",
    statusNote:
      "Pure XML-level measurement. No source/normalized/locked/compiled DOCX or contract mutation. No DB/schema change. No FormFlight allowlist promotion. FIDELITY_COMPLETE_EVIDENCED not claimed.",
    triggers: TRIGGERS,
    targetCodes: CODES,
    normalizedDir: NORM_DIR,
    generatedDirs: GENERATED_DIRS,
    summary: analyses.map((a) => ({
      templateCode: a.templateCode,
      status: a.status,
      aggregateVerdict: a.aggregateVerdict ?? null,
      blockCount: a.blockCount ?? null,
      reason: a.reason ?? null,
    })),
    forms: analyses,
  };

  const jsonPath = `${OUT_DIR}/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json`;
  writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");

  const md = renderMarkdown(out);
  const mdPath = `${OUT_DIR}/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.md`;
  writeFileSync(mdPath, md, "utf8");

  // Print compact summary to stdout for executor report.
  console.log("--- summary ---");
  for (const s of out.summary) {
    console.log(
      `${s.templateCode}: status=${s.status} verdict=${s.aggregateVerdict ?? "-"} blocks=${s.blockCount?.source ?? "-"}/${s.blockCount?.generated ?? "-"}`
    );
  }
  console.log("Artifacts:");
  console.log("  " + jsonPath);
  console.log("  " + mdPath);
}

function renderMarkdown(out) {
  const lines = [];
  lines.push(`# Top-Right Promulgation Block — XML Measurement Experiment`);
  lines.push(``);
  lines.push(`- Snapshot: ${out.snapshotDate}`);
  lines.push(`- Script: \`${out.measurementScript}\``);
  lines.push(`- Triggers: ${out.triggers.map((t) => `"${t}"`).join(", ")}`);
  lines.push(`- Source normalized: \`${out.normalizedDir}\``);
  lines.push(`- Generated DOCX candidates (first hit wins):`);
  for (const g of out.generatedDirs) lines.push(`  - \`${g}\``);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Code | Status | Aggregate verdict | Block count (src/gen) | Reason |`);
  lines.push(`|---|---|---|---|---|`);
  for (const s of out.summary) {
    lines.push(
      `| ${s.templateCode} | ${s.status} | ${s.aggregateVerdict ?? "-"} | ${s.blockCount?.source ?? "-"} / ${s.blockCount?.generated ?? "-"} | ${s.reason ?? ""} |`
    );
  }
  lines.push(``);
  lines.push(`## Per-block detail`);
  for (const f of out.forms) {
    if (f.status !== "OK") {
      lines.push(``);
      lines.push(`### ${f.templateCode} — ${f.status}`);
      lines.push(``);
      lines.push(`Reason: ${f.reason ?? "(no reason)"}`);
      continue;
    }
    lines.push(``);
    lines.push(`### ${f.templateCode}`);
    lines.push(``);
    lines.push(`- Source: \`${f.sourcePath}\``);
    lines.push(`- Generated: \`${f.generatedPath}\``);
    lines.push(`- Source PDF: ${f.sourcePdfPath ? `\`${f.sourcePdfPath}\`` : "not found"}`);
    lines.push(`- Generated PDF: ${f.generatedPdfPath ? `\`${f.generatedPdfPath}\`` : "not found"}`);
    lines.push(`- Aggregate verdict: **${f.aggregateVerdict}**`);
    lines.push(``);
    lines.push(`| # | Verdict | Text src | Text gen | pPrEqual | Run props diff (first run) |`);
    lines.push(`|---|---|---|---|---|---|`);
    for (const b of f.blocks) {
      const firstRun = b.runs?.[0];
      let runSummary = "-";
      if (firstRun) {
        if (firstRun.status) {
          runSummary = firstRun.status;
        } else if (firstRun.attrs) {
          const diffs = [];
          for (const k of Object.keys(firstRun.attrs)) {
            const eq = firstRun.attrs[k].equal;
            if (!eq) {
              diffs.push(`${k}: src=${JSON.stringify(firstRun.attrs[k].source)} gen=${JSON.stringify(firstRun.attrs[k].generated)}`);
            }
          }
          runSummary = diffs.length === 0 ? "ALL_EQUAL" : diffs.join("; ");
        }
      }
      lines.push(
        `| ${b.index} | ${b.verdict} | ${(b.text?.source ?? "").slice(0, 40).replace(/\|/g, "\\|")} | ${(b.text?.generated ?? "").slice(0, 40).replace(/\|/g, "\\|")} | ${b.paragraphPropsEqual ?? "-"} | ${runSummary.replace(/\|/g, "\\|")} |`
      );
    }
  }
  lines.push(``);
  lines.push(`## Notes`);
  lines.push(``);
  lines.push(`- Source DOCX is the normalized baseline at \`storage/templates/normalized-docx/<code>/<code>_normalized.docx\`.`);
  lines.push(`- Generated DOCX is the latest authenticated DOCX download smoke artifact at \`.tmp-docx-download-smoke/<code>.docx\`.`);
  lines.push(`- Both paragraphs are extracted as \`<w:p>...</w:p>\` blocks from \`word/document.xml\`.`);
  lines.push(`- Run-property comparison inspects \`<w:rFonts/>\`, \`<w:sz/>\`, \`<w:szCs/>\`, \`<w:b/>\`, \`<w:bCs/>\`, \`<w:i/>\`, \`<w:iCs/>\`, \`<w:color/>\`.`);
  lines.push(`- Text-box geometry (cx/cy/posOffset/wrapSquare) is captured when the paragraph contains \`<w:drawing>\`.`);
  lines.push(`- No source/normalized/locked/compiled DOCX or contract is mutated.`);
  lines.push(`- FIDELITY_COMPLETE_EVIDENCED remains \`false\`.`);
  return lines.join("\n");
}

main();