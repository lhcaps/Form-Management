#!/usr/bin/env node
/**
 * scripts/audit/apply-bm006-top-right-template-calibration.mjs
 *
 * Approved pilot template calibration — TOP-RIGHT promulgation/form-number
 * block for BM-006 only.
 *
 * Surgical changes ONLY to paragraph 0 of the BM-006 normalized DOCX:
 * the anchored text-box that visually displays "Mẫu số 06/HS" at the
 * top-right of the form. Everything else in the DOCX (body content,
 * Ban hành/Ngày lines, national heading, signature, footer, tables,
 * articles, etc.) is preserved byte-for-byte.
 *
 * Adjustments:
 *   - reduce anchor extent (cx, cy) so the wrap region is smaller and the
 *     block looks less visually dominant
 *   - push posOffsetX right so the block sits tighter to the right margin
 *     (better top-right alignment)
 *   - shrink inner text-box extent to match (no extra blank white-on-white
 *     area)
 *   - tighten posOffsetV so the block sits closer to the page top
 *
 * Preserved (per user instruction):
 *   - "Mẫu số 06/HS" text
 *   - Times New Roman, size 8 (sz=16 half-pt)
 *   - bold for "Mẫu số" line
 *   - paragraph centering inside the text-box (jc=center)
 *   - white fill / no visible border (no background change)
 *
 * No mutation of:
 *   - paragraphs 1-39 (body, Ban hành/Ngày lines, duplicates, content)
 *   - any other BM (only BM-006)
 *   - DB / Prisma / migrations
 *   - public API routes
 *   - FormFlight runtimeReady allowlist
 *
 * Usage:
 *   node scripts/audit/apply-bm006-top-right-template-calibration.mjs
 *
 * Exit code 0 on success.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const TARGET = `${ROOT}/storage/templates/normalized-docx/BM-006/BM-006_normalized.docx`;

// Geometry deltas (EMU). 914400 EMU = 1 inch.
//
// Revision history:
//   v1: posOffsetH=4350000, posOffsetV=36000, anchor 1900000x380000,
//       inner 1200000x320000.  (Original pilot calibration.)
//   v2 (ADJUST): wider/taller top-right text box to reduce wrapping/
//       clipping of "03/2026/TT-VKSTC" line and bottom-clipping of the
//       textbox.  posOffsetH reduced slightly to avoid right-edge
//       clipping.  posOffsetV unchanged (no top clipping reported).
//       Box extents grown to give the line room to breathe.
//   v3 (ADJUST): more decisive shift to address the v2 visual
//       "still clipped/too far right" finding.  Block is pushed
//       meaningfully left, down a touch, and the box is widened
//       and heightened to remove the wrapping/clipping pressure
//       on the "Ban hành theo Thông tư số 03/2026/TT-VKSTC" line
//       and the bottom/date line.  The block still sits in the
//       top-right area and remains visually secondary to the
//       national heading below.
const NEW = {
  positionH_posOffset: 3700000, // 4250000 -> 3700000 (decisive leftward move; ~4.046")
  positionV_posOffset: 85000,   // 36000   -> 85000   (slightly down; avoid top clipping; ~0.093")
  anchor_extent_cx: 2600000,    // 2150000 -> 2600000 (wider wrap area,  ~2.844")
  anchor_extent_cy: 700000,     // 480000  -> 700000  (taller wrap area, ~0.766")
  inner_extent_cx: 2200000,     // 1500000 -> 2200000 (wider textbox,    ~2.405")
  inner_extent_cy: 600000,      // 420000  -> 600000  (taller textbox,   ~0.656")
};

function ensureUnchanged(label, before, after) {
  if (before === after) return;
  throw new Error(
    `Refusing to publish — expected ${label} to be unchanged but it differs.\n` +
      `  before: ${before}\n  after:  ${after}`,
  );
}

function main() {
  if (!existsSync(TARGET)) {
    console.error(`ABORT: target DOCX not found: ${TARGET}`);
    process.exit(1);
  }

  const beforeBuf = readFileSync(TARGET);
  const beforeHash = require("node:crypto")
    .createHash("sha256")
    .update(beforeBuf)
    .digest("hex");

  const zip = new PizZip(beforeBuf);
  const docEntry = zip.file("word/document.xml");
  if (!docEntry) {
    console.error("ABORT: word/document.xml missing in BM-006_normalized.docx");
    process.exit(1);
  }
  const xml = docEntry.asText();

  // Locate the FIRST paragraph that contains an anchored drawing for the
  // top-right text-box (paragraph 0). We only edit this paragraph; all other
  // paragraphs are preserved byte-for-byte.
  const paragraphs = xml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
  if (paragraphs.length < 1) {
    console.error("ABORT: no <w:p> blocks found in document.xml");
    process.exit(1);
  }
  const targetPara = paragraphs[0];
  if (!/<w:drawing>/.test(targetPara) || !/<wp:anchor/.test(targetPara)) {
    console.error(
      "ABORT: paragraph 0 does not contain an anchored drawing; refusing to mutate an unrelated paragraph",
    );
    process.exit(1);
  }

  // Hard guards — make sure we are editing exactly the BM-006 top-right text-box.
  if (!/Mẫu số\s*06\/HS/.test(targetPara)) {
    console.error(
      "ABORT: paragraph 0 does not contain 'Mẫu số 06/HS'; refusing to mutate",
    );
    process.exit(1);
  }
  if (!/06\/HS/.test(targetPara) || !/Times New Roman/.test(targetPara)) {
    console.error("ABORT: expected BM-006 signature text missing in paragraph 0");
    process.exit(1);
  }

  let updated = targetPara;

  // 1. Anchor posOffsetH — push right.
  updated = updated.replace(
    /<wp:positionH relativeFrom="column"><wp:posOffset>-?\d+<\/wp:posOffset><\/wp:positionH>/,
    `<wp:positionH relativeFrom="column"><wp:posOffset>${NEW.positionH_posOffset}</wp:posOffset></wp:positionH>`,
  );

  // 2. Anchor posOffsetV — pull up toward page top.
  updated = updated.replace(
    /<wp:positionV relativeFrom="paragraph"><wp:posOffset>-?\d+<\/wp:posOffset><\/wp:positionV>/,
    `<wp:positionV relativeFrom="paragraph"><wp:posOffset>${NEW.positionV_posOffset}</wp:posOffset></wp:positionV>`,
  );

  // 3. Anchor extent — narrower, shorter.
  updated = updated.replace(
    /<wp:extent cx="\d+" cy="\d+"\/>/,
    `<wp:extent cx="${NEW.anchor_extent_cx}" cy="${NEW.anchor_extent_cy}"/>`,
  );

  // 4. Inner text-box extent — match the reduced anchor.
  updated = updated.replace(
    /<a:ext cx="\d+" cy="\d+"\/>/,
    `<a:ext cx="${NEW.inner_extent_cx}" cy="${NEW.inner_extent_cy}"/>`,
  );

  // Sanity: ensure all 4 replacements hit exactly once.
  const replaceCounts = {
    positionH: (targetPara.match(/<wp:positionH relativeFrom="column"><wp:posOffset>-?\d+<\/wp:posOffset><\/wp:positionH>/g) || []).length,
    positionV: (targetPara.match(/<wp:positionV relativeFrom="paragraph"><wp:posOffset>-?\d+<\/wp:posOffset><\/wp:positionV>/g) || []).length,
    extent: (targetPara.match(/<wp:extent cx="\d+" cy="\d+"\/>/g) || []).length,
    innerExt: (targetPara.match(/<a:ext cx="\d+" cy="\d+"\/>/g) || []).length,
  };
  if (
    replaceCounts.positionH !== 1 ||
    replaceCounts.positionV !== 1 ||
    replaceCounts.extent !== 1 ||
    replaceCounts.innerExt !== 1
  ) {
    console.error("ABORT: replacement targets did not match exactly once:", replaceCounts);
    process.exit(1);
  }

  // 5. Verify text-box run properties are unchanged (bold, Times New Roman, sz=16).
  ensureUnchanged("bold flag", /<w:b\/>/.test(targetPara), /<w:b\/>/.test(updated));
  ensureUnchanged("Times New Roman font", /Times New Roman/.test(targetPara), /Times New Roman/.test(updated));
  ensureUnchanged("sz=16 (8pt)", /w:val="16"/.test(targetPara), /w:val="16"/.test(updated));
  ensureUnchanged("jc=center inside text-box", /<w:jc w:val="center"\/>/.test(targetPara), /<w:jc w:val="center"\/>/.test(updated));
  ensureUnchanged(
    "Mẫu số 06/HS text",
    /<w:t>Mẫu số 06\/HS<\/w:t>/.test(targetPara),
    /<w:t>Mẫu số 06\/HS<\/w:t>/.test(updated),
  );

  // Splice the updated paragraph back into the document.xml. Preserve
  // everything else (including all other paragraphs) byte-for-byte.
  const beforeIdx = xml.indexOf(targetPara);
  if (beforeIdx < 0) {
    console.error("ABORT: could not locate target paragraph in document.xml");
    process.exit(1);
  }
  const newXml = xml.slice(0, beforeIdx) + updated + xml.slice(beforeIdx + targetPara.length);

  // Verify the new XML differs ONLY in the targeted paragraph (defensive).
  const newParagraphs = newXml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
  for (let i = 1; i < newParagraphs.length; i++) {
    if (newParagraphs[i] !== paragraphs[i]) {
      console.error(
        `ABORT: paragraph ${i} unexpectedly changed; refusing to publish. ` +
          `Before length: ${paragraphs[i].length}, after length: ${newParagraphs[i].length}`,
      );
      process.exit(1);
    }
  }

  zip.file("word/document.xml", newXml);
  const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

  const afterHash = require("node:crypto")
    .createHash("sha256")
    .update(out)
    .digest("hex");

  // Write atomically: tmp file then rename.
  const tmpPath = TARGET + ".tmp-calibration";
  writeFileSync(tmpPath, out);
  // Move into place.
  const fs = require("node:fs");
  fs.renameSync(tmpPath, TARGET);

  console.log("BM-006 top-right template calibration applied.");
  console.log(`  target: ${TARGET}`);
  console.log(`  before sha256: ${beforeHash}`);
  console.log(`  after  sha256: ${afterHash}`);
  console.log(`  before bytes : ${beforeBuf.length}`);
  console.log(`  after  bytes : ${out.length}`);
  console.log(`  geometry:`);
  console.log(`    posOffsetH  ${extractPosOffsetH(targetPara).before ?? "?"} -> ${NEW.positionH_posOffset}`);
  console.log(`    posOffsetV  ${extractPosOffsetV(targetPara).before ?? "?"} -> ${NEW.positionV_posOffset}`);
  console.log(`    anchor cx   ${extractExtent(targetPara).cxBefore ?? "?"} -> ${NEW.anchor_extent_cx}`);
  console.log(`    anchor cy   ${extractExtent(targetPara).cyBefore ?? "?"} -> ${NEW.anchor_extent_cy}`);
  console.log(`    inner cx    ${extractInner(targetPara).cxBefore ?? "?"} -> ${NEW.inner_extent_cx}`);
  console.log(`    inner cy    ${extractInner(targetPara).cyBefore ?? "?"} -> ${NEW.inner_extent_cy}`);
}

function extractPosOffsetH(para) {
  const m = para.match(/<wp:positionH relativeFrom="column"><wp:posOffset>(-?\d+)<\/wp:posOffset><\/wp:positionH>/);
  return { before: m ? Number(m[1]) : null };
}
function extractPosOffsetV(para) {
  const m = para.match(/<wp:positionV relativeFrom="paragraph"><wp:posOffset>(-?\d+)<\/wp:posOffset><\/wp:positionV>/);
  return { before: m ? Number(m[1]) : null };
}
function extractExtent(para) {
  const m = para.match(/<wp:extent cx="(\d+)" cy="(\d+)"\/>/);
  return m ? { cxBefore: Number(m[1]), cyBefore: Number(m[2]) } : { cxBefore: null, cyBefore: null };
}
function extractInner(para) {
  const m = para.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  return m ? { cxBefore: Number(m[1]), cyBefore: Number(m[2]) } : { cxBefore: null, cyBefore: null };
}

main();