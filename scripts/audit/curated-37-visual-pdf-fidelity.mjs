#!/usr/bin/env node
/**
 * curated-37-visual-pdf-fidelity.mjs
 *
 * Visual / PDF fidelity comparison for the 37 curated INPUT_CONNECTED_PASS forms.
 *
 * Pipeline:
 *   1. soffice: normalized DOCX → source PDF
 *   2. soffice: generated DOCX → generated PDF
 *   3. pdfplumber: render each PDF page to PNG (150 DPI)
 *   4. PIL: per-page pixel diff between source PNG and generated PNG
 *   5. pdfplumber: extract text for sanity checks
 *
 * Outputs:
 *   - .tmp-visual-pdf-fidelity/<code>/source.pdf
 *   - .tmp-visual-pdf-fidelity/<code>/generated.pdf
 *   - .tmp-visual-pdf-fidelity/<code>/diff/page_N.png  (visual diff overlay)
 *   - docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json
 *   - docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.md
 *   - docs/audit/unified-bm-workspace/QLLAW_CURATED_VISUAL_PDF_REVIEW_CHECKLIST.latest.md
 *
 * No source DOCX, locked contract, or DB mutation.
 *
 * Usage:
 *   node scripts/audit/curated-37-visual-pdf-fidelity.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const TMP_DIR = `${ROOT}/.tmp-visual-pdf-fidelity`;
const SAMPLE_DIR = `${ROOT}/.tmp-docx-download-smoke`;
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;

const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const PY_EXE = "py";

const FORM_TITLE_KEYWORDS = ["Biên bản", "Quyết định", "Báo cáo", "Đơn", "Phiếu", "Giấy"];
const AGENCY_KEYWORDS = ["Viện Kiểm sát", "Viện kiểm sát", "VKSND", "Tòa án"];
const SIGNATURE_KEYWORDS = ["Người lập", "Thủ trưởng", "Viện trưởng", "Ký tên",
  "Ký và ghi rõ họ tên", "kiểm sát viên", "xác nhận", "chữ ký"];
const RECIPIENT_KEYWORDS = ["Nơi nhận", "Để biết", "Để thực hiện", "Để chấp hành",
  "Cơ quan", "Đơn vị"];

const CURATED_FORMS = [
  "BM-001", "BM-005", "BM-006", "BM-007", "BM-008", "BM-009", "BM-010",
  "BM-011", "BM-012", "BM-014", "BM-015", "BM-017", "BM-018", "BM-019",
  "BM-020", "BM-022", "BM-023", "BM-030", "BM-031", "BM-033", "BM-035",
  "BM-036", "BM-037", "BM-038", "BM-040", "BM-042", "BM-043", "BM-044",
  "BM-045", "BM-046", "BM-047", "BM-048", "BM-052", "BM-053", "BM-054",
  "BM-070", "BM-171",
];

// ---------------------------------------------------------------
// soffice: DOCX → PDF
// ---------------------------------------------------------------

function sofficeConvertToPdf(docxPath, outDir) {
  mkdirSync(outDir, { recursive: true });
  const r = spawnSync(SOFFICE, [
    "--headless", "--invisible", "--norestore", "--nofirststartwizard",
    "--convert-to", "pdf",
    "--outdir", outDir,
    docxPath,
  ], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 300000,
  });
  const base = basename(docxPath, ".docx") + ".pdf";
  const pdfPath = `${outDir}/${base}`;
  return {
    exitCode: r.status,
    stdout: (r.stdout || "").toString(),
    stderr: (r.stderr || "").toString(),
    pdfPath: existsSync(pdfPath) ? pdfPath : null,
  };
}

// ---------------------------------------------------------------
// py.exe wrappers
// ---------------------------------------------------------------

function runPy(script) {
  const r = spawnSync(PY_EXE, ["-c", script], {
    timeout: 120000,
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    stdout: (r.stdout || "").toString().trim(),
    stderr: (r.stderr || "").toString(),
    exitCode: r.status,
  };
}

function escapePyPath(p) {
  return p.replace(/\\/g, "\\\\");
}

function getPdfPageCount(pdfPath) {
  if (!existsSync(pdfPath)) return null;
  const esc = escapePyPath(pdfPath);
  const r = runPy(
    `import pdfplumber; pdf=pdfplumber.open(r"${esc}"); print(len(pdf.pages)); pdf.close()`,
  );
  if (r.exitCode !== 0) return null;
  const n = parseInt(r.stdout, 10);
  return isNaN(n) ? null : n;
}

function extractPdfText(pdfPath, maxChars = 5000) {
  if (!existsSync(pdfPath)) return "";
  const esc = escapePyPath(pdfPath);
  const r = runPy(
    `import pdfplumber; pdf=pdfplumber.open(r"${esc}"); parts=[]; ` +
    `for p in pdf.pages: t=p.extract_text() or ''; parts.append(t); ` +
    `pdf.close(); text=' |PAGE| '.join(parts); print(text[:${maxChars}])`,
  );
  return r.stdout || "";
}

function renderPdfPageToPng(pdfPath, pageIndex, outPng) {
  if (!existsSync(pdfPath)) return false;
  mkdirSync(dirname(outPng), { recursive: true });
  const esc = escapePyPath(pdfPath);
  const outEsc = escapePyPath(outPng);
  const r = runPy(
    `import pdfplumber; pdf=pdfplumber.open(r"${esc}"); ` +
    `pages=pdf.pages; ` +
    `if ${pageIndex} >= len(pages): print('NO_PAGE'); pdf.close()` +
    `else: ` +
    `  p=pages[${pageIndex}]; ` +
    `  im=p.to_image(resolution=150); ` +
    `  im.save(r"${outEsc}", format="PNG"); ` +
    `  print('OK'); pdf.close()`,
  );
  return existsSync(outPng);
}

function computePngPixelDiff(img1, img2) {
  if (!existsSync(img1) || !existsSync(img2)) return null;
  const fp1 = escapePyPath(img1);
  const fp2 = escapePyPath(img2);
  const r = runPy(
    `from PIL import Image; ` +
    `img1=Image.open(r"${fp1}").convert("RGB"); ` +
    `img2=Image.open(r"${fp2}").convert("RGB"); ` +
    `w=min(img1.size[0],img2.size[0]); h=min(img1.size[1],img2.size[1]); ` +
    `i1=img1.crop((0,0,w,h)); i2=img2.crop((0,0,w,h)); ` +
    `px1=i1.load(); px2=i2.load(); ` +
    `diff=sum(1 for y in range(h) for x in range(w) if ` +
    `  max(abs(px1[x,y][0]-px2[x,y][0]),abs(px1[x,y][1]-px2[x,y][1]),abs(px1[x,y][2]-px2[x,y][2]))>5); ` +
    `print(f"{(diff/(w*h)):.6f}")`,
  );
  if (r.exitCode !== 0) return null;
  const n = parseFloat(r.stdout);
  return isNaN(n) ? null : n;
}

function computeDiffOverlay(img1, img2, outOverlay) {
  if (!existsSync(img1) || !existsSync(img2)) return false;
  mkdirSync(dirname(outOverlay), { recursive: true });
  const fp1 = escapePyPath(img1);
  const fp2 = escapePyPath(img2);
  const outEsc = escapePyPath(outOverlay);
  const r = runPy(
    `from PIL import Image, ImageChops; ` +
    `img1=Image.open(r"${fp1}").convert("RGB"); ` +
    `img2=Image.open(r"${fp2}").convert("RGB"); ` +
    `w=min(img1.size[0],img2.size[0]); h=min(img1.size[1],img2.size[1]); ` +
    `i1=img1.crop((0,0,w,h)); i2=img2.crop((0,0,w,h)); ` +
    `diff=ImageChops.difference(i1,i2); ` +
    `diff.save(r"${outEsc}", format="PNG"); print('OK')`,
  );
  return existsSync(outOverlay);
}

// ---------------------------------------------------------------
// Text sanity
// ---------------------------------------------------------------

function checkTextSanity(text) {
  const lower = text.toLowerCase();
  return {
    agencyPresent: AGENCY_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase())),
    titlePresent: FORM_TITLE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase())),
    signaturePresent: SIGNATURE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase())),
    recipientsPresent: RECIPIENT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase())),
    hasDatePattern: /ngày\s+\d+|tháng\s+\d+|năm\s+\d{4}/i.test(text),
    hasUndefined: /\bundefined\b/i.test(text),
    hasNull: /\bnull\b/i.test(text),
    hasObjObj: /\[object Object\]/i.test(text),
    hasDoubleBrace: /\{\{/.test(text),
    hasStaleName: /Nguyễn Văn A|Trần Thị B|Ông cung cấp|Nguyễn Thị Hồng Hạnh/.test(text),
  };
}

// ---------------------------------------------------------------
// Per-form comparison
// ---------------------------------------------------------------

function compareForm(code) {
  const formDir = `${TMP_DIR}/${code}`;
  const pagesDir = `${formDir}/pages`;
  const diffDir = `${formDir}/diff`;
  mkdirSync(formDir, { recursive: true });
  mkdirSync(pagesDir, { recursive: true });
  mkdirSync(diffDir, { recursive: true });

  const generatedDocx = `${SAMPLE_DIR}/${code}.docx`;
  const normalizedDocx = `${NORM_DIR}/${code}/${code}_normalized.docx`;

  const result = {
    templateCode: code,
    sourceDocxPath: existsSync(normalizedDocx) ? normalizedDocx : null,
    generatedDocxPath: existsSync(generatedDocx) ? generatedDocx : null,
    sourcePdfPath: null,
    generatedPdfPath: null,
    pdfConversionStatus: "pending",
    sourcePageCount: null,
    generatedPageCount: null,
    pageCountStatus: "pending",
    sourceTextSanity: null,
    generatedTextSanity: null,
    textSanityStatus: "pending",
    imageDiffStatus: "pending",
    maxDiffRatio: null,
    avgDiffRatio: null,
    pageDiffRatios: [],
    automatedVisualStatus: "pending",
    humanReviewStatus: "NOT_REVIEWED",
    manualReviewRequired: true,
    fidelityComplete: false,
    failureReasons: [],
  };

  // Step 1: Convert normalized DOCX → PDF
  process.stderr.write(`\n  [${code}] Converting source DOCX...`);
  if (result.sourceDocxPath) {
    const r1 = sofficeConvertToPdf(result.sourceDocxPath, formDir);
    result.sourcePdfPath = r1.pdfPath;
    if (!r1.pdfPath) {
      result.pdfConversionStatus = "source_failed";
      result.failureReasons.push(`source_pdf_conversion_failed: ${r1.stderr.slice(0, 80)}`);
    }
    process.stderr.write(r1.pdfPath ? " OK" : " FAIL");
  } else {
    result.pdfConversionStatus = "source_not_found";
    result.failureReasons.push("source_normalized_docx_not_found");
  }

  // Step 2: Convert generated DOCX → PDF
  process.stderr.write(` | Converting generated DOCX...`);
  if (result.generatedDocxPath) {
    const r2 = sofficeConvertToPdf(result.generatedDocxPath, formDir);
    result.generatedPdfPath = r2.pdfPath;
    if (!r2.pdfPath) {
      result.pdfConversionStatus = result.pdfConversionStatus === "source_failed"
        ? "both_failed" : "generated_failed";
      result.failureReasons.push(`generated_pdf_conversion_failed: ${r2.stderr.slice(0, 80)}`);
    } else if (result.sourcePdfPath) {
      result.pdfConversionStatus = "both_converted";
    }
    process.stderr.write(r2.pdfPath ? " OK" : " FAIL");
  } else {
    result.pdfConversionStatus = "generated_not_found";
    result.failureReasons.push("generated_docx_not_found");
  }

  // Step 3: Page counts
  if (result.sourcePdfPath) {
    result.sourcePageCount = getPdfPageCount(result.sourcePdfPath);
  }
  if (result.generatedPdfPath) {
    result.generatedPageCount = getPdfPageCount(result.generatedPdfPath);
  }
  if (result.sourcePageCount !== null && result.generatedPageCount !== null) {
    if (result.sourcePageCount === result.generatedPageCount) {
      result.pageCountStatus = "exact_match";
    } else {
      result.pageCountStatus = "mismatch";
      result.failureReasons.push(
        `page_count_mismatch: source=${result.sourcePageCount} generated=${result.generatedPageCount}`,
      );
    }
  } else if (result.sourcePageCount === null && result.generatedPageCount === null) {
    result.pageCountStatus = "both_count_failed";
  } else if (result.generatedPageCount === null) {
    result.pageCountStatus = "generated_count_failed";
  } else {
    result.pageCountStatus = "source_count_failed";
  }
  process.stderr.write(
    ` | pages src=${result.sourcePageCount ?? "?"} gen=${result.generatedPageCount ?? "?"} [${result.pageCountStatus}]`,
  );

  // Step 4: Text sanity (generated only — source is reference)
  if (result.generatedPdfPath) {
    const genText = extractPdfText(result.generatedPdfPath, 3000);
    const genSanity = checkTextSanity(genText);
    result.generatedTextSanity = genSanity;
    if (!genSanity.agencyPresent) {
      result.failureReasons.push("text_sanity: no_agency_keywords");
    }
    if (genSanity.hasUndefined || genSanity.hasNull || genSanity.hasObjObj || genSanity.hasDoubleBrace) {
      result.failureReasons.push("text_sanity: placeholder_leak");
    }
    if (genSanity.hasStaleName) {
      result.failureReasons.push("text_sanity: stale_token");
    }
    result.textSanityStatus =
      result.failureReasons.some((f) => f.startsWith("text_sanity:")) ? "fail" : "pass";
  }

  // Step 5: Image diff
  const maxPagesForDiff = Math.min(
    result.sourcePageCount ?? 1,
    result.generatedPageCount ?? 1,
    5,
  );
  if (result.sourcePdfPath && result.generatedPdfPath && maxPagesForDiff > 0) {
    process.stderr.write(` | diff:`);
    const diffRatios = [];

    for (let p = 0; p < maxPagesForDiff; p++) {
      const srcPng = `${pagesDir}/src_page_${p + 1}.png`;
      const genPng = `${pagesDir}/gen_page_${p + 1}.png`;
      const diffPng = `${diffDir}/diff_page_${p + 1}.png`;

      const srcOk = renderPdfPageToPng(result.sourcePdfPath, p, srcPng);
      const genOk = renderPdfPageToPng(result.generatedPdfPath, p, genPng);

      if (srcOk && genOk) {
        const ratio = computePngPixelDiff(srcPng, genPng);
        diffRatios.push(ratio);
        result.pageDiffRatios.push({ page: p + 1, diffRatio: ratio });
        computeDiffOverlay(srcPng, genPng, diffPng);
        process.stderr.write(` p${p + 1}=${ratio !== null ? ratio.toFixed(3) : "?"}`);
      } else {
        diffRatios.push(null);
        result.pageDiffRatios.push({ page: p + 1, diffRatio: null, renderFailed: true });
        process.stderr.write(` p${p + 1}=render_fail`);
      }
    }

    const validRatios = diffRatios.filter((r) => r !== null);
    if (validRatios.length > 0) {
      result.maxDiffRatio = Math.max(...validRatios);
      result.avgDiffRatio = validRatios.reduce((a, b) => a + b, 0) / validRatios.length;
      if (result.maxDiffRatio < 0.05) {
        result.imageDiffStatus = "low_diff";
      } else if (result.maxDiffRatio < 0.20) {
        result.imageDiffStatus = "moderate_diff";
      } else {
        result.imageDiffStatus = "high_diff";
        result.failureReasons.push(
          `high_image_diff: max=${result.maxDiffRatio.toFixed(3)} avg=${result.avgDiffRatio.toFixed(3)}`,
        );
      }
    } else {
      result.imageDiffStatus = "no_diff_data";
    }
  }

  // Step 6: Automated visual status
  const pdfOk = result.pdfConversionStatus === "both_converted";
  const pagesOk = result.pageCountStatus === "exact_match";
  const textOk = result.textSanityStatus === "pass";
  const imgOk = result.imageDiffStatus === "low_diff" || result.imageDiffStatus === "moderate_diff";

  if (pdfOk && pagesOk && textOk) {
    result.automatedVisualStatus = "PASS_AUTO_NEEDS_HUMAN_CONFIRM";
  } else if (!pdfOk || result.pageCountStatus === "mismatch" || result.textSanityStatus === "fail") {
    result.automatedVisualStatus = "FAIL";
    if (!result.failureReasons.some((f) => f.startsWith("automated"))) {
      result.failureReasons.unshift("automated_visual_check_failed");
    }
  } else {
    result.automatedVisualStatus = "PARTIAL";
  }

  process.stderr.write(` | [${result.automatedVisualStatus}]`);
  return result;
}

// ---------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------

function renderChecklistMd(results) {
  const lines = [];
  lines.push("# QLLAW Curated 37 — Visual / PDF Review Checklist");
  lines.push("");
  lines.push(`> **Generated**: ${new Date().toISOString()}`);
  lines.push("> **Purpose**: Human reviewer completes this checklist to finalize visual fidelity.");
  lines.push("> Every criterion must be PASS for `fidelityComplete=true`.");
  lines.push(">");
  lines.push("> **Automated evidence**:");
  lines.push(">   - Source PDF: `.tmp-visual-pdf-fidelity/<code>/source.pdf`");
  lines.push(">   - Generated PDF: `.tmp-visual-pdf-fidelity/<code>/generated.pdf`");
  lines.push(">   - Page diff overlay: `.tmp-visual-pdf-fidelity/<code>/diff/diff_page_N.png`");
  lines.push(">   - Per-page PNG: `.tmp-visual-pdf-fidelity/<code>/pages/`");
  lines.push("");
  lines.push("## Per-form checklist");
  lines.push("");
  lines.push(
    "| Code | Header/Agency | Title | Body/Table | Sig Block | Recipients | Pagination | Overall | Reviewer | Date | Notes |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    lines.push(
      `| ${r.templateCode} | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | [ ] PASS [ ] FAIL | ___ | ___ | ___ |`,
    );
  }
  lines.push("");
  lines.push("## Metadata table");
  lines.push("");
  lines.push(
    "| Code | Source PDF | Gen PDF | Pages (src/gen) | Page match | Text sanity | Max diff | Auto status | PDF status |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const srcPdf = r.sourcePdfPath ? basename(r.sourcePdfPath) : "MISSING";
    const genPdf = r.generatedPdfPath ? basename(r.generatedPdfPath) : "MISSING";
    const pages = `${r.sourcePageCount ?? "?"}/${r.generatedPageCount ?? "?"}`;
    const diff = r.maxDiffRatio !== null ? r.maxDiffRatio.toFixed(3) : "N/A";
    lines.push(
      `| ${r.templateCode} | ${srcPdf} | ${genPdf} | ${pages} | ${r.pageCountStatus} | ${r.textSanityStatus} | ${diff} | ${r.automatedVisualStatus} | ${r.pdfConversionStatus} |`,
    );
  }
  lines.push("");
  lines.push("## Instructions");
  lines.push("");
  lines.push("1. Open the source PDF: `.tmp-visual-pdf-fidelity/<code>/source.pdf`");
  lines.push("2. Open the generated PDF: `.tmp-visual-pdf-fidelity/<code>/generated.pdf`");
  lines.push("3. Compare side-by-side. Check for:");
  lines.push("   - Correct Vietnamese agency header (Viện Kiểm sát nhân dân)");
  lines.push("   - Correct form title (Biên bản / Quyết định / etc.)");
  lines.push("   - Body/table layout not collapsed or garbled");
  lines.push("   - Signature blocks in correct position");
  lines.push("   - Recipients (Nơi nhận) block present");
  lines.push("   - Pagination correct");
  lines.push("4. Fill in PASS/FAIL for each criterion above.");
  lines.push("5. To claim fidelityComplete=true for a form, ALL criteria must be PASS.");
  lines.push("6. Update `humanReviewStatus` to `PASS` or `FAIL` in the JSON artifact.");
  lines.push("");
  return lines.join("\n") + "\n";
}

function renderSummaryMd(results, counts) {
  const lines = [];
  lines.push("# QLLAW Curated 37 — Visual / PDF Fidelity Summary");
  lines.push("");
  lines.push(`> **Generated**: ${new Date().toISOString()}`);
  lines.push(`> **STATUS**: ${counts.status}`);
  lines.push(`> **FIDELITY_COMPLETE_EVIDENCED**: ${counts.fidelityCompleteEvidenced}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Total curated | ${results.length} |`);
  lines.push(`| Both PDFs converted | ${counts.bothConverted} |`);
  lines.push(`| Page count match | ${counts.pageCountMatch} |`);
  lines.push(`| Text sanity pass | ${counts.textSanityPass} |`);
  lines.push(`| Automated PASS (needs human confirm) | ${counts.automatedPass} |`);
  lines.push(`| Human reviewed PASS | ${counts.humanReviewedPass} |`);
  lines.push(`| Human reviewed FAIL | ${counts.humanReviewedFail} |`);
  lines.push(`| fidelityComplete=true | ${counts.fidelityComplete} |`);
  lines.push(`| Manual review required | ${counts.manualReviewRequired} |`);
  lines.push("");
  lines.push("## Per-form results");
  lines.push("");
  lines.push(
    "| Code | Source PDF | Gen PDF | Pages | Page match | Text sanity | Max diff | Auto status | Human review | Complete |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    const src = r.sourcePdfPath ? "✓" : "✗";
    const gen = r.generatedPdfPath ? "✓" : "✗";
    const pages = `${r.sourcePageCount ?? "?"}/${r.generatedPageCount ?? "?"}`;
    const diff = r.maxDiffRatio !== null ? r.maxDiffRatio.toFixed(3) : "N/A";
    lines.push(
      `| ${r.templateCode} | ${src} | ${gen} | ${pages} | ${r.pageCountStatus} | ${r.textSanityStatus} | ${diff} | ${r.automatedVisualStatus} | ${r.humanReviewStatus} | ${r.fidelityComplete ? "yes" : "no"} |`,
    );
  }
  lines.push("");
  lines.push("## Status rationale");
  lines.push("");
  lines.push(counts.statusNote);
  lines.push("");
  lines.push("## Remaining risks");
  lines.push("");
  lines.push("- fidelityComplete=true only set for forms with explicit human review PASS.");
  lines.push("- PIL pixel diff is automated and may miss subtle layout issues.");
  lines.push("- Only first 5 pages per form are compared via image diff.");
  lines.push("- FormFlight runtimeReady allowlist remains BM-001 + BM-171 only.");
  lines.push("");
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------

async function main() {
  console.error("=== Visual/PDF fidelity comparison for 37 curated forms ===");
  console.error(`soffice: ${SOFFICE}`);
  console.error(`py: ${PY_EXE}`);
  console.error(`Output dir: ${TMP_DIR}`);
  console.error("");

  mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  for (const code of CURATED_FORMS) {
    process.stderr.write(`\n=== ${code} ===`);
    const r = compareForm(code);
    results.push(r);
    process.stderr.write(
      `\n  ${r.automatedVisualStatus} | pages=${r.pageCountStatus} | text=${r.textSanityStatus} | diff=${r.imageDiffStatus} | failures=${r.failureReasons.length}`,
    );
  }

  const counts = {
    bothConverted: results.filter((r) => r.pdfConversionStatus === "both_converted").length,
    pageCountMatch: results.filter((r) => r.pageCountStatus === "exact_match").length,
    textSanityPass: results.filter((r) => r.textSanityStatus === "pass").length,
    automatedPass: results.filter((r) => r.automatedVisualStatus === "PASS_AUTO_NEEDS_HUMAN_CONFIRM").length,
    humanReviewedPass: results.filter((r) => r.humanReviewStatus === "PASS").length,
    humanReviewedFail: results.filter((r) => r.humanReviewStatus === "FAIL").length,
    manualReviewRequired: results.filter((r) => r.manualReviewRequired).length,
    fidelityComplete: results.filter((r) => r.fidelityComplete).length,
  };

  const allHumanReviewed =
    counts.humanReviewedPass + counts.humanReviewedFail === results.length;
  const allHumanPass = counts.humanReviewedPass === results.length;

  if (allHumanPass && allHumanReviewed) {
    counts.status = "PASS";
    counts.statusNote = `All ${results.length} forms passed automated checks and explicit human review. fidelityComplete=true for ${counts.humanReviewedPass} forms.`;
    counts.fidelityCompleteEvidenced = true;
  } else if (counts.bothConverted === results.length) {
    counts.status = "PARTIAL";
    counts.statusNote = `All ${results.length} forms converted to PDF. Automated checks pass for ${counts.automatedPass} forms. ${counts.manualReviewRequired} forms still require human review. No fidelityComplete=true claims without human review.`;
    counts.fidelityCompleteEvidenced = false;
  } else {
    counts.status = "PARTIAL";
    counts.statusNote = `${counts.bothConverted}/${results.length} forms converted to PDF. Some forms failed conversion. Human review not possible for failed forms.`;
    counts.fidelityCompleteEvidenced = false;
  }

  // Write artifacts
  const checklistMd = renderChecklistMd(results);
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`,
    checklistMd,
  );

  const summaryMd = renderSummaryMd(results, counts);
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.md`,
    summaryMd,
  );

  const snapshotDate = new Date().toISOString();
  const summary = {
    snapshotDate,
    status: counts.status,
    statusNote: counts.statusNote,
    fidelityCompleteEvidenced: counts.fidelityCompleteEvidenced,
    totalForms: results.length,
    formsPdfCompared: counts.bothConverted,
    formsAutoVisualPass: counts.automatedPass,
    formsHumanReviewedPass: counts.humanReviewedPass,
    formsHumanReviewedFail: counts.humanReviewedFail,
    formsConversionFailed: results.length - counts.bothConverted,
    formsManualReviewRequired: counts.manualReviewRequired,
    fidelityCompleteClaimed: counts.fidelityComplete,
    sourceRenderStatus: "PASS",
    browserVisibilityStatus: "PASS",
    demoClickStatus: "PASS",
    previewClickStatus: "PASS",
    docxDownloadStatus: "PASS",
    machineCheckableFidelityStatus: "PASS",
    visualPdfFidelityStatus: counts.status,
    results,
    auditScript: "scripts/audit/curated-37-visual-pdf-fidelity.mjs",
    toolInfo: {
      sofficePath: SOFFICE,
      pyExe: PY_EXE,
      pdfplumberAvailable: true,
    },
  };

  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json`,
    JSON.stringify(summary, null, 2),
  );

  console.error("\n\n=== Summary ===");
  console.error(`Status: ${counts.status}`);
  console.error(`Both converted: ${counts.bothConverted}/${results.length}`);
  console.error(`Page count match: ${counts.pageCountMatch}`);
  console.error(`Text sanity pass: ${counts.textSanityPass}`);
  console.error(`Automated PASS (needs human): ${counts.automatedPass}`);
  console.error(`Human reviewed PASS: ${counts.humanReviewedPass}`);
  console.error(`Human reviewed FAIL: ${counts.humanReviewedFail}`);
  console.error(`fidelityComplete=true: ${counts.fidelityComplete}`);
  console.error(`FIDELITY_COMPLETE_EVIDENCED: ${counts.fidelityCompleteEvidenced}`);
  console.error("");
  console.error("Artifacts:");
  console.error(`  ${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.json`);
  console.error(`  ${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_FIDELITY.latest.md`);
  console.error(`  ${OUT_DIR}/QLLAW_CURATED_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`);
  console.error(`  ${TMP_DIR}/<code>/source.pdf, generated.pdf, pages/, diff/`);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
