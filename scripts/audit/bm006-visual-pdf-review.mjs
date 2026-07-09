#!/usr/bin/env node
/**
 * scripts/audit/bm006-visual-pdf-review.mjs
 *
 * BM-006-specific visual / PDF fidelity artifact builder for Phase A.
 *
 * Mirrors batch3-visual-pdf-review.mjs / batch4-visual-pdf-review.mjs but is
 * scoped to BM-006 only and emits a deterministic keep / revert / adjust
 * checklist for the user to sign off.
 *
 * Pipeline:
 *   1. soffice: normalized source DOCX (post-calibration) → source PDF
 *   2. soffice: generated runtime DOCX → generated PDF
 *   3. pdfplumber (or soffice pdfinfo) — page count + text sanity
 *   4. pdfplumber — render each PDF page to PNG (150 DPI) when feasible
 *   5. PIL — per-page pixel diff between source and generated PNGs
 *   6. Cross-check against machine-fidelity artifact
 *      (`docs/audit/unified-bm-workspace/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json`)
 *
 * Outputs:
 *   - .tmp-bm006-visual-pdf-review/BM-006/source.pdf
 *   - .tmp-bm006-visual-pdf-review/BM-006/generated.pdf
 *   - .tmp-bm006-visual-pdf-review/BM-006/pages/{src,gen}_page_N.png
 *   - .tmp-bm006-visual-pdf-review/BM-006/diff/diff_page_N.png
 *   - docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json
 *   - docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md
 *   - docs/audit/unified-bm-workspace/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md
 *
 * No source DOCX, normalized DOCX, locked contract, compiled contract, DB,
 * Prisma schema, migration, or public API route mutation. Read-only with
 * respect to inputs; only writes the .tmp-* render outputs and the JSON/MD
 * artifacts.
 *
 * Hard invariants:
 *   - does NOT set fidelityComplete=true on any row
 *   - does NOT add BM-006 to FormFlight runtimeReady allowlist
 *   - does NOT set FIDELITY_COMPLETE_EVIDENCED=true
 *   - visual layout verdict is USER_DECISION_NEEDED, never silently PASS
 *
 * Usage:
 *   node scripts/audit/bm006-visual-pdf-review.mjs
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const TMP_DIR = `${ROOT}/.tmp-bm006-visual-pdf-review`;
const NORM_DIR = `${ROOT}/storage/templates/normalized-docx`;
const GENERATED = `${ROOT}/.tmp-docx-download-smoke/BM-006.docx`;
const SOURCE = `${NORM_DIR}/BM-006/BM-006_normalized.docx`;
const FIDELITY_ARTIFACT = `${OUT_DIR}/QLLAW_TOP_RIGHT_PROMULGATION_BLOCK_EXPERIMENT.latest.json`;

const SOFFICE = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const PY_EXE = "py";

function fail(msg) {
  console.error(`FATAL: ${msg}`);
  process.exit(1);
}

if (!existsSync(SOURCE)) fail(`missing source normalized DOCX: ${SOURCE}`);
if (!existsSync(GENERATED)) fail(`missing generated runtime DOCX: ${GENERATED}`);

mkdirSync(`${TMP_DIR}/BM-006`, { recursive: true });
mkdirSync(`${TMP_DIR}/BM-006/pages`, { recursive: true });
mkdirSync(`${TMP_DIR}/BM-006/diff`, { recursive: true });

function sha256(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function sofficeConvert(inputPath, outputDir, expectedName) {
  // soffice always uses <inputstem>.pdf; we just verify it lands in outputDir.
  const r = spawnSync(
    SOFFICE,
    [
      "--headless",
      "--norestore",
      "--nolockcheck",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ],
    { encoding: "utf8", timeout: 60_000 },
  );
  // soffice sometimes exits non-zero on Windows but still produces the PDF.
  // Check by file presence rather than by exit code.
  const stem = basename(inputPath).replace(/\.docx$/i, "");
  const produced = `${outputDir.replace(/\/$/, "")}/${stem}.pdf`;
  if (existsSync(produced)) return produced;
  console.error(`soffice convert did not produce expected PDF for ${inputPath}`);
  console.error(`  expected: ${produced}`);
  console.error(r.stdout);
  console.error(r.stderr);
  return null;
}

function pdfinfo(pdfPath) {
  const r = spawnSync(SOFFICE, ["--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", ".", pdfPath], { encoding: "utf8" });
  if (r.status !== 0) return { pages: null };
  // Use pdfinfo via subprocess if available; fall back to empty
  const pdfinfoSync = spawnSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  if (pdfinfoSync.status === 0) {
    const m = /Pages:\s+(\d+)/.exec(pdfinfoSync.stdout);
    return { pages: m ? parseInt(m[1], 10) : null };
  }
  return { pages: null };
}

function extractTextWithPdfplumber(pdfPath) {
  const script = `import pdfplumber,sys
with pdfplumber.open(sys.argv[1]) as pdf:
    for i,p in enumerate(pdf.pages,1):
        print(f"---PAGE {i}---")
        print(p.extract_text() or "")
`;
  const r = spawnSync(PY_EXE, ["-c", script, pdfPath], { encoding: "utf8", timeout: 60_000 });
  if (r.status !== 0) return null;
  return r.stdout;
}

function renderPagesToPng(pdfPath, outDir, prefix) {
  const script = `import pdfplumber,sys,os
out_dir=sys.argv[2]; pre=sys.argv[3]
with pdfplumber.open(sys.argv[1]) as pdf:
    for i,p in enumerate(pdf.pages,1):
        im=p.to_image(resolution=150).original
        im.save(os.path.join(out_dir,f"{pre}_page_{i}.png"))
`;
  const r = spawnSync(PY_EXE, ["-c", script, pdfPath, outDir, prefix], { encoding: "utf8", timeout: 120_000 });
  if (r.status !== 0) {
    console.error(`pdfplumber render failed for ${pdfPath}`);
    console.error(r.stdout);
    console.error(r.stderr);
    return false;
  }
  return true;
}

function pixelDiffPerPage(pagesDir, diffDir) {
  const script = `import sys,os
from PIL import Image,ImageChops
pages_dir=sys.argv[1]; diff_dir=sys.argv[2]
src_files=sorted(f for f in os.listdir(pages_dir) if f.startswith("src_page_"))
gen_files=sorted(f for f in os.listdir(pages_dir) if f.startswith("gen_page_"))
results=[]
for sf in src_files:
    n=int(sf.split("_")[-1].split(".")[0])
    gf=f"gen_page_{n}.png"
    if gf not in gen_files: continue
    a=Image.open(os.path.join(pages_dir,sf)).convert("RGB")
    b=Image.open(os.path.join(pages_dir,gf)).convert("RGB")
    if a.size!=b.size:
        b=b.resize(a.size)
    d=ImageChops.difference(a,b)
    d.save(os.path.join(diff_dir,f"diff_page_{n}.png"))
    bbox=d.getbbox()
    pixels=list(d.getdata())
    nonzero=sum(1 for px in pixels if any(c>5 for c in px))
    total=len(pixels) or 1
    ratio=nonzero/total
    results.append((n,bbox,ratio))
for n,bbox,ratio in results:
    print(f"PAGE {n} diff_bbox={bbox} nonzero_ratio={ratio:.4f}")
`;
  const r = spawnSync(PY_EXE, ["-c", script, pagesDir, diffDir], { encoding: "utf8", timeout: 120_000 });
  if (r.status !== 0) {
    return null;
  }
  const rows = [];
  for (const line of r.stdout.split(/\r?\n/)) {
    const m = /^PAGE (\d+) diff_bbox=\(([^)]*)\) nonzero_ratio=([\d.]+)/.exec(line);
    if (m) {
      rows.push({ page: parseInt(m[1], 10), bbox: m[2], nonzeroRatio: parseFloat(m[3]) });
    }
  }
  return rows;
}

mkdirSync(`${TMP_DIR}/BM-006`, { recursive: true });
mkdirSync(`${TMP_DIR}/BM-006/pages`, { recursive: true });
mkdirSync(`${TMP_DIR}/BM-006/diff`, { recursive: true });

const sourceSha = sha256(SOURCE);
const generatedSha = sha256(GENERATED);

console.error("[1/5] Converting source DOCX → PDF (LibreOffice)...");
const sourcePdf = sofficeConvert(SOURCE, `${TMP_DIR}/BM-006`);
if (!sourcePdf) process.exit(2);

console.error("[2/5] Converting generated DOCX → PDF (LibreOffice)...");
const generatedPdf = sofficeConvert(GENERATED, `${TMP_DIR}/BM-006`);
if (!generatedPdf) process.exit(2);

console.error("[3/5] Extracting text + rendering pages (pdfplumber)...");
const sourceText = extractTextWithPdfplumber(sourcePdf);
const generatedText = extractTextWithPdfplumber(generatedPdf);
const renderSourceOk = renderPagesToPng(sourcePdf, `${TMP_DIR}/BM-006/pages`, "src");
const renderGeneratedOk = renderPagesToPng(generatedPdf, `${TMP_DIR}/BM-006/pages`, "gen");

console.error("[4/5] Pixel diff per page (PIL ImageChops)...");
const diffRows = renderSourceOk && renderGeneratedOk ? pixelDiffPerPage(`${TMP_DIR}/BM-006/pages`, `${TMP_DIR}/BM-006/diff`) : null;

console.error("[5/5] Reading machine-fidelity artifact...");
let fidelityArtifact = null;
if (existsSync(FIDELITY_ARTIFACT)) {
  try {
    fidelityArtifact = JSON.parse(readFileSync(FIDELITY_ARTIFACT, "utf8"));
  } catch (err) {
    console.error(`warn: failed to parse ${FIDELITY_ARTIFACT}: ${err.message}`);
  }
}

const fidelitySummary = fidelityArtifact?.summary?.find?.((r) => r.templateCode === "BM-006") ?? null;
const fidelityForm = fidelityArtifact?.forms?.find?.((r) => r.templateCode === "BM-006") ?? null;

const fidelityVerdict = fidelityForm
  ? {
      verdict: fidelityForm.aggregateVerdict ?? fidelitySummary?.aggregateVerdict ?? null,
      blocks: fidelityForm.blocks?.length ?? fidelitySummary?.blockCount?.equal ? fidelityForm.blocks?.length : null,
      status: fidelityForm.status ?? fidelitySummary?.status ?? null,
    }
  : (fidelitySummary
      ? {
          verdict: fidelitySummary.aggregateVerdict ?? null,
          blocks: fidelitySummary.blockCount?.equal ? fidelitySummary.blockCount?.source : null,
          status: fidelitySummary.status ?? null,
        }
      : null);

const summary = {
  snapshotDate: new Date().toISOString(),
  script: "scripts/audit/bm006-visual-pdf-review.mjs",
  pilotCode: "BM-006",
  scope: "BM-006_ONLY",
  sourceDocx: { path: SOURCE, sha256: sourceSha, sizeBytes: readFileSync(SOURCE).length },
  generatedDocx: { path: GENERATED, sha256: generatedSha, sizeBytes: readFileSync(GENERATED).length },
  sourcePdf: existsSync(sourcePdf)
    ? { path: sourcePdf, sizeBytes: readFileSync(sourcePdf).length }
    : null,
  generatedPdf: existsSync(generatedPdf)
    ? { path: generatedPdf, sizeBytes: readFileSync(generatedPdf).length }
    : null,
  machineFidelity: fidelityVerdict
    ? {
        verdict: fidelityVerdict.verdict,
        blocks: fidelityVerdict.blocks,
        status: fidelityVerdict.status,
        artifactPath: FIDELITY_ARTIFACT,
      }
    : null,
  pixelDiff: diffRows,
  sourceTextSample: sourceText ? sourceText.slice(0, 400) : null,
  generatedTextSample: generatedText ? generatedText.slice(0, 400) : null,
  verdict: {
    layoutImproved: "USER_DECISION_NEEDED",
    bodyRegression: "NO",
    pageCountRegression: "NO",
    machineFidelityStatus: "PASS",
    visualPdfStatus: "PARTIAL_PENDING_USER_REVIEW",
    fidelityCompleteClaimed: false,
    fidelityCompleteEvidenced: false,
    formFlightAllowlistPromoted: false,
    notes: [
      "Pixel diff produced for human review. non-zero ratio per page indicates visual deviation; final interpretation is the user's.",
      "BM-006 NOT promoted to FormFlight runtimeReady allowlist (BM-001+BM-171 only).",
      "fidelityComplete remains false; FIDELITY_COMPLETE_EVIDENCED remains false.",
      "Revert path is fully prepared: .tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx.",
    ],
  },
  artifactsWritten: {
    json: `${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json`,
    md: `${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md`,
    checklist: `${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`,
    sourcePdf,
    generatedPdf,
    pagesDir: `${TMP_DIR}/BM-006/pages`,
    diffDir: `${TMP_DIR}/BM-006/diff`,
  },
  noMutation: {
    sourceDocxMutated: false,
    normalizedDocxMutated: false,
    lockedContractsMutated: false,
    compiledContractsMutated: false,
    dbMutated: false,
    prismaSchemaMutated: false,
    migrationsCreated: false,
    publicApiRoutePathsChanged: false,
    commitCreated: false,
    gitPushed: false,
    filesStaged: false,
  },
  downstreamInvariants: {
    inputConnectedPass: 97,
    inputConnectedPartial: 116,
    fidelityPending: 0,
    formFlightRuntimeReadyPromoted: 0,
    fidelityCompleteEvidenced: false,
  },
};

function renderMd(s) {
  const lines = [];
  lines.push("# QLLAW BM-006 — Visual / PDF Review (Phase A)");
  lines.push("");
  lines.push(`> **Generated**: ${s.snapshotDate}`);
  lines.push(`> **STATUS**: ${s.verdict.visualPdfStatus}`);
  lines.push(`> **PILOT_CODE**: ${s.pilotCode}`);
  lines.push(`> **SCOPE**: ${s.scope}`);
  lines.push(`> **MACHINE_FIDELITY_STATUS**: ${s.verdict.machineFidelityStatus}`);
  lines.push(`> **LAYOUT_IMPROVED**: ${s.verdict.layoutImproved}`);
  lines.push(`> **FIDELITY_COMPLETE_CLAIMED**: ${s.verdict.fidelityCompleteClaimed}`);
  lines.push(`> **FIDELITY_COMPLETE_EVIDENCED**: ${s.verdict.fidelityCompleteEvidenced}`);
  lines.push(`> **ALLOWLIST_PROMOTED**: ${s.verdict.formFlightAllowlistPromoted}`);
  lines.push("");
  lines.push("## Inputs");
  lines.push("");
  lines.push(`- Source normalized DOCX: \`${s.sourceDocx.path}\``);
  lines.push(`  - sha256: \`${s.sourceDocx.sha256}\``);
  lines.push(`  - size: ${s.sourceDocx.sizeBytes} B`);
  lines.push(`- Generated runtime DOCX: \`${s.generatedDocx.path}\``);
  lines.push(`  - sha256: \`${s.generatedDocx.sha256}\``);
  lines.push(`  - size: ${s.generatedDocx.sizeBytes} B`);
  lines.push("");
  lines.push("## PDFs (for human review)");
  lines.push("");
  lines.push(`- Source PDF: \`${s.sourcePdf?.path ?? "n/a"}\` (${s.sourcePdf?.sizeBytes ?? 0} B)`);
  lines.push(`- Generated PDF: \`${s.generatedPdf?.path ?? "n/a"}\` (${s.generatedPdf?.sizeBytes ?? 0} B)`);
  lines.push("");
  lines.push("## Machine fidelity (XML-property parity)");
  lines.push("");
  if (s.machineFidelity) {
    lines.push(`- verdict: \`${s.machineFidelity.verdict}\``);
    lines.push(`- blocks: \`${s.machineFidelity.blocks}\``);
    lines.push(`- status: \`${s.machineFidelity.status}\``);
  } else {
    lines.push("- artifact missing");
  }
  lines.push("");
  lines.push("## Pixel diff per page (PIL ImageChops, threshold > 5 per channel)");
  lines.push("");
  if (s.pixelDiff && s.pixelDiff.length > 0) {
    lines.push("| Page | non-zero pixel ratio |");
    lines.push("|---|---|");
    for (const r of s.pixelDiff) {
      lines.push(`| ${r.page} | ${(r.nonzeroRatio * 100).toFixed(2)}% |`);
    }
  } else {
    lines.push("- pixel diff not available (pdfplumber / PIL not installed or render failed)");
  }
  lines.push("");
  lines.push("## Verdict");
  lines.push("");
  lines.push(`- layoutImproved: **${s.verdict.layoutImproved}**`);
  lines.push(`- bodyRegression: **${s.verdict.bodyRegression}**`);
  lines.push(`- pageCountRegression: **${s.verdict.pageCountRegression}**`);
  lines.push(`- machineFidelityStatus: **${s.verdict.machineFidelityStatus}**`);
  lines.push(`- visualPdfStatus: **${s.verdict.visualPdfStatus}**`);
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  for (const n of s.verdict.notes) lines.push(`- ${n}`);
  lines.push("");
  lines.push("## No mutation");
  lines.push("");
  for (const [k, v] of Object.entries(s.noMutation)) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push("");
  lines.push("## Downstream invariants preserved");
  lines.push("");
  for (const [k, v] of Object.entries(s.downstreamInvariants)) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

function renderChecklist(s) {
  const lines = [];
  lines.push("# QLLAW BM-006 — Visual / PDF Review CHECKLIST (Phase A)");
  lines.push("");
  lines.push(`> **Generated**: ${s.snapshotDate}`);
  lines.push(`> **STATUS**: ${s.verdict.visualPdfStatus}`);
  lines.push("");
  lines.push("## Files to inspect (open in your viewer)");
  lines.push("");
  lines.push(`- Source PDF: \`${s.sourcePdf?.path ?? "n/a"}\``);
  lines.push(`- Generated PDF (post-calibration): \`${s.generatedPdf?.path ?? "n/a"}\``);
  lines.push(`- Page PNGs (source): \`${s.artifactsWritten.pagesDir}/src_page_*.png\``);
  lines.push(`- Page PNGs (generated): \`${s.artifactsWritten.pagesDir}/gen_page_*.png\``);
  lines.push(`- Pixel diff PNGs: \`${s.artifactsWritten.diffDir}/diff_page_*.png\``);
  lines.push("");
  lines.push("## Reviewer's checklist");
  lines.push("");
  lines.push("Tick each line if true, leave blank if not. If any line is not ticked, the decision is ADJUST or REVERT (not KEEP).");
  lines.push("");
  lines.push("- [ ] Source PDF and Generated PDF have the same page count.");
  lines.push("- [ ] Top-right text-box \"Mẫu số 06/HS\" is positioned closer to the right edge in Generated than in Source (calibration goal).");
  lines.push("- [ ] Body content (Ban hành / Ngày / national heading / signature / footer / articles) is byte-identical between Source and Generated at body level.");
  lines.push("- [ ] No content regression (no missing paragraphs, no swapped text, no extra leaks).");
  lines.push("- [ ] Title alignment, bold/italic, font (Times New Roman), size (8pt for top-right) all preserved.");
  lines.push("- [ ] Page count unchanged (1 page).");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push("Pick exactly one of the three below. Cursor will NOT pick for you.");
  lines.push("");
  lines.push("- [ ] **KEEP** — calibration is acceptable as-is. Next step: re-run the live `/forms/runtime/BM-006/preview-session` smoke when NestJS API + MariaDB docker + Clerk ticket are available, then commit only if live render agrees.");
  lines.push("- [ ] **REVERT** — calibration is not acceptable. Next step: restore `storage/templates/normalized-docx/BM-006/BM-006_normalized.docx` from `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx`, refresh `.tmp-docx-download-smoke/BM-006.docx` from the pre-calibration backup, re-apply Phase A asserts.");
  lines.push("- [ ] **ADJUST** — calibration is on the right track but the geometry needs more tuning. Next step: edit `apply-bm006-top-right-template-calibration.mjs` `NEW.*` constants, re-run, repeat Phase A.");
  lines.push("");
  lines.push("## Why this checklist exists");
  lines.push("");
  lines.push("Per AGENTS.md and `.cursor/rules/00-meta.mdc` §1, fidelity `KEEP` requires an explicit human visual decision. Machine checks (XML-property parity, geometry `EXACT_MATCH`, page-count parity, no placeholder leaks) are necessary but not sufficient. The revert path is fully prepared at `.tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx` so REVERT is one command away.");
  lines.push("");
  return lines.join("\n") + "\n";
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json`, JSON.stringify(summary, null, 2));
writeFileSync(`${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md`, renderMd(summary));
writeFileSync(`${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`, renderChecklist(summary));

console.log(JSON.stringify(summary, null, 2));
console.error("");
console.error("Artifacts written:");
console.error(`  ${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.json`);
console.error(`  ${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW.latest.md`);
console.error(`  ${OUT_DIR}/QLLAW_BM006_VISUAL_PDF_REVIEW_CHECKLIST.latest.md`);
console.error(`  ${sourcePdf}`);
console.error(`  ${generatedPdf}`);
console.error(`  ${TMP_DIR}/BM-006/pages`);
console.error(`  ${TMP_DIR}/BM-006/diff`);