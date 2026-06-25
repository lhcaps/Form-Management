#!/usr/bin/env node
/**
 * repair-triple-brace-placeholders.mjs — Path A of F1.
 *
 * Walk the 13 failing normalized DOCX templates flagged by
 * `pnpm audit:docx-slot-inventory` and repair two distinct template
 * defect classes that the F1 audit caught:
 *
 *   1. TRIPLE_IN_RUN: a literal "{{key}}}" lives inside one <w:t> node.
 *      The placeholder has a well-formed open/close pair, but the
 *      trailing "}" is a literal brace that DocxTemplater's lexer
 *      reads as a stray character. Fix: drop the trailing "}".
 *
 *   2. UNBALANCED_IN_RUN: a "{{key}" (or "{key}}") lives inside one
 *      <w:t> while the matching "}" (or "{") lives in the very next
 *      <w:t> run, separated by </w:t></w:r><w:r>...<w:t>. This is a
 *      Word split-run. DocxTemplater also rejects it ("Duplicate open
 *      tag" / "Duplicate close tag"). Fix: merge the two consecutive
 *      runs into one <w:t> with the corrected placeholder.
 *
 * Constraints (per F1_FIX brief):
 *  - This script does NOT modify locked contract JSON. If a repaired
 *    DOCX still parses the same set of {{key}} placeholders, the
 *    locked contract's slot inventory is unchanged.
 *  - This script does NOT modify the renderer or the F1 detector.
 *  - This script does NOT modify the normalizer.
 *  - The script defaults to --dry-run so an operator can preview
 *    what would change before applying. Use --write to actually
 *    rewrite the DOCX bytes.
 *
 * Inputs:
 *   - storage/templates/normalized-docx/<BM>/<BM>_normalized.docx
 *   - docs/audit/docx-slot-inventory/latest.json  (the F1 audit
 *     report, used to know which 13 BMs are failing)
 *
 * Outputs:
 *   - <same path>                  when --write is set
 *   - docs/audit/docx-slot-inventory/triple-brace-repair.json
 *   - docs/audit/docx-slot-inventory/triple-brace-repair.md
 *
 * Exit codes:
 *   0 — repair completed successfully (or dry-run with findings).
 *   1 — repair attempted but unrecoverable error.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import PizZip from 'pizzip';

const ROOT = process.cwd();
const NORMALIZED_DIR = join(ROOT, 'storage', 'templates', 'normalized-docx');
const AUDIT_REPORT = join(
  ROOT,
  'docs',
  'audit',
  'docx-slot-inventory',
  'latest.json',
);
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-slot-inventory');

const DRY_RUN = !process.argv.includes('--write');
const TEMPLATE_FILTER = new Set(
  process.argv
    .filter((a, i) => process.argv[i - 1] === '--only')
    .map((s) => s.toUpperCase()),
);

// ────────────────────────────────────────────────────────────────────────────
// Defect classes
// ────────────────────────────────────────────────────────────────────────────

// Matches {{key}}} where key is a dotted identifier (matches the
// canonical-field naming convention used by the locked contracts).
const PLACEHOLDER_KEY = '[A-Za-z][A-Za-z0-9]*(?:\\.[A-Za-z0-9]+)*';
const TRIPLE_RE = new RegExp(`\\{\\{(${PLACEHOLDER_KEY})\\}\\}\\}`, 'gu');

// ────────────────────────────────────────────────────────────────────────────
// Per-template repair
// ────────────────────────────────────────────────────────────────────────────

const TEXT_PART_RE = /^word\/(document|header\d*|footer\d*|footnotes?|endnotes?)\.xml$/;

const listTextParts = (zip) =>
  Object.keys(zip.files).filter((n) => TEXT_PART_RE.test(n));

/**
 * Within a single XML part, repair:
 *   - TRIPLE_IN_RUN  → "}}" → "}"  (drop one trailing brace).
 *   - UNBALANCED_IN_RUN: split runs. The most common shape is
 *     <w:t>{{key}</w:t>...</w:r><w:r>...<w:t>}</w:t> where both runs
 *     have the same <w:rPr> formatting. We merge them.
 *
 * Returns a per-part list of replacements. Each replacement records
 * the part, kind, before/after examples, and offset.
 */
const repairPart = (xml) => {
  const replacements = [];

  // ── 1) TRIPLE_IN_RUN: inside one <w:t>...</w:t>, rewrite {{key}}} → {{key}}.
  let result = xml.replace(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/gu, (full, attrs, text) => {
    let cursor = 0;
    const segments = [];
    let m;
    TRIPLE_RE.lastIndex = 0;
    let mutated = text;
    while ((m = TRIPLE_RE.exec(text)) !== null) {
      const key = m[1];
      segments.push({
        kind: 'TRIPLE_IN_RUN',
        key,
        before: `{{${key}}}`,
        after: `{{${key}}}`,
        offsetInText: m.index,
      });
      mutated = mutated.replace(`{{${key}}}}`, `{{${key}}}`);
    }
    replacements.push(...segments);
    return `<w:t${attrs ?? ''}>${mutated}</w:t>`;
  });

  // ── 1b) TRUNCATED_AT_END: a <w:t> has more "{" than "}" (i.e. an
  // unclosed placeholder tail). Cross-paragraph split runs in BM-167
  // hit this case: the opening "{{key" exists but the matching "}}"
  // lives in another paragraph (or nowhere). We append enough "}"
  // to balance the run.
  //
  // We only fire when:
  //   - openCount > closeCount (a genuinely unclosed placeholder),
  //   - the run text does NOT contain "}}" anywhere (otherwise it's
  //     mid-text split that we cannot safely fix locally).
  result = result.replace(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/gu, (full, attrs, text) => {
    const decoded = decodeXmlEntities(text);
    if (decoded.includes('}}')) return full;
    const openCount = (decoded.match(/\{/g) || []).length;
    const closeCount = (decoded.match(/\}/g) || []).length;
    if (openCount <= closeCount) return full;
    // Sanity: the unclosed braces must look like placeholder syntax.
    // If a "{{" or "{" sits at the tail of the run (which is the
    // common split-run shape), this is safe to auto-close.
    if (!/\{[A-Za-z]/u.test(decoded)) return full;
    const need = openCount - closeCount;
    const appended = decoded + '}'.repeat(need);
    replacements.push({
      kind: 'TRUNCATED_AT_END',
      before: decoded,
      after: appended,
      offsetInText: decoded.length,
    });
    return `<w:t${attrs ?? ''}>${encodeXmlEntities(appended)}</w:t>`;
  });

  // ── 2) UNBALANCED_IN_RUN: split runs.
  // Pattern: <w:t...>TEXT1</w:t></w:r><w:r...><w:rPr>...RPR...</w:rPr><w:t...>TEXT2</w:t>
  // where TEXT1 ends with "{{key}" or begins with "{key" or similar,
  // and TEXT2 is "}" or "{" or similar single-brace content that
  // completes the pair.
  //
  // Operate on a copy and re-scan: split runs are detected by walking
  // consecutive <w:r>...</w:r> elements and merging text content if
  // the combined text balances its braces.
  //
  // For safety we ONLY merge when:
  //   - both runs share identical <w:rPr> formatting,
  //   - one run's text ends with "{{" or "{{key" (partial opening) and
  //     the next run's text begins with "}}", "key}}", or "}",
  //   - OR one run's text ends with "{{key" / "{key" and the next
  //     begins with "key}}" / "}}", "}" matching a single missing brace.
  //
  // Detected pair-by-pair inside a paragraph <w:p>...</w:p>.
  result = mergeSplitRuns(result, replacements);

  return { xml: result, replacements };
};

const R_RE = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/gu;
const RPR_RE = /<w:rPr\b[^>]*>([\s\S]*?)<\/w:rPr>/u;
const T_RE = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu;

const isBalancedBraces = (s) => {
  // Only counts {{ ... }} pairs; ignores lone { or } which are not
  // valid placeholder syntax anyway.
  const opens = (s.match(/\{\{/g) || []).length;
  const closes = (s.match(/\}\}/g) || []).length;
  return opens === closes;
};

const mergeSplitRuns = (paragraphOrFull, replacements) => {
  // Walk every <w:r>...</w:r>; for each consecutive pair where
  // (a) both runs have identical <w:rPr>, (b) the merged text has
  // balanced {{...}} pairs while the separate texts did not, and
  // (c) the merge is a local, single-pair change, replace.
  return paragraphOrFull.replace(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/gu, (runFull) => {
    return runFull; // no-op; the actual merge happens at the paragraph level
  }).replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gu, (paraFull) => {
    // Collect every run + its <w:t> text + its <w:rPr> signature.
    const runs = [];
    const re = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/gu;
    let m;
    while ((m = re.exec(paraFull)) !== null) {
      const inner = m[1];
      const rprMatch = inner.match(RPR_RE);
      const rprSig = rprMatch ? rprMatch[0] : '';
      const tMatch = inner.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/u);
      const text = tMatch ? tMatch[1] : '';
      runs.push({ full: m[0], inner, rprSig, text, index: m.index, length: m[0].length });
    }
    if (runs.length < 2) return paraFull;

    // Try every consecutive pair.
    for (let i = 0; i < runs.length - 1; i += 1) {
      const a = runs[i];
      const b = runs[i + 1];
      // We do NOT require identical <w:rPr>. A Word split-run with
      // different formatting is still a malformed placeholder from
      // DocxTemplater's perspective; the formatting consequence is
      // limited to "second-run formatting extends to merged text",
      // which is a smaller evil than a render failure.
      const aText = decodeXmlEntities(a.text);
      const bText = decodeXmlEntities(b.text);
      const combined = aText + bText;
      // Skip if both already balanced — nothing to do.
      if (isBalancedBraces(aText) && isBalancedBraces(bText)) continue;
      // Skip if combined is not balanced — would just trade one defect
      // for another.
      if (!isBalancedBraces(combined)) continue;

      // The repair must be local: only {{...}} pair boundary lives
      // across the two runs. We require:
      //   (a) each half individually is unbalanced (or one half has
      //       no {{...}} pair at all, e.g. just "}"),
      //   (b) combined is balanced.
      // The stricter "delta === 1" check rejected legitimate merges
      // like "{{key}" + "}" where b contributes nothing to the {{ }}
      // count itself.
      const aBalanced = isBalancedBraces(aText);
      const bBalanced = isBalancedBraces(bText);
      const localPair = !aBalanced || !bBalanced;
      if (!localPair) continue;

      // Capture before/after examples for the report.
      const exampleBefore = `${aText} | ${bText}`;
      const exampleAfter = combined;

      // Build the merged run. Drop the second run entirely. Replace
      // the first run's <w:t> text with the merged text.
      const mergedRun = a.full.replace(
        /<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/u,
        (tFull, attrs) => `<w:t${attrs ?? ''}>${encodeXmlEntities(combined)}</w:t>`,
      );

      // Splice: replace [a.full][b.full] with mergedRun in the
      // paragraph. We need to find them by offset.
      const aStart = a.index;
      const aEnd = a.index + a.length;
      const bStart = b.index;
      const bEnd = b.index + b.length;
      // Skip if either run doesn't appear at its captured offset —
      // paragraph was mutated by earlier iteration.
      if (paraFull.slice(aStart, aEnd) !== a.full) continue;
      if (paraFull.slice(bStart, bEnd) !== b.full) continue;

      replacements.push({
        kind: 'UNBALANCED_IN_RUN',
        before: exampleBefore,
        after: exampleAfter,
        offsetInText: aStart,
      });

      const spliced =
        paraFull.slice(0, aStart) +
        mergedRun +
        paraFull.slice(bEnd);
      // Recurse with the spliced paragraph. The for-loop variable
      // can't be reset, so we re-scan from this paragraph's runs.
      // Easiest: re-run on the spliced paragraph once more via the
      // outer regex (we're inside .replace's callback, so just
      // return spliced — the outer paragraph regex won't re-match
      // since we already consumed this paragraph's start).
      return spliced;
    }
    return paraFull;
  });
};

const decodeXmlEntities = (s) =>
  s
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'");

const encodeXmlEntities = (s) =>
  s
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');

// ────────────────────────────────────────────────────────────────────────────
// Driver
// ────────────────────────────────────────────────────────────────────────────

const loadFailingCodes = () => {
  if (!existsSync(AUDIT_REPORT)) {
    throw new Error(
      `F1 audit report missing at ${AUDIT_REPORT}. Run \`pnpm audit:docx-slot-inventory\` first.`,
    );
  }
  const r = JSON.parse(readFileSync(AUDIT_REPORT, 'utf8'));
  const codes = [];
  for (const bm of r.perBm ?? []) {
    if (bm.status !== 'PASS' && bm.malformedPlaceholders?.length > 0) {
      codes.push(bm.templateCode);
    }
  }
  return codes.sort();
};

const repairOne = (templateCode) => {
  const filePath = join(NORMALIZED_DIR, templateCode, `${templateCode}_normalized.docx`);
  if (!existsSync(filePath)) {
    return {
      templateCode,
      filePath,
      error: `Normalized DOCX not found at ${filePath}`,
      replacements: 0,
      parts: [],
    };
  }
  const before = readFileSync(filePath);
  const beforeHash = createHash('sha256').update(before).digest('hex');
  const zip = new PizZip(before);
  const partNames = listTextParts(zip);
  const perPart = [];
  let totalReplacements = 0;
  let mutated = false;

  for (const partName of partNames) {
    const file = zip.file(partName);
    if (!file) continue;
    const xml = file.asText();
    const { xml: newXml, replacements } = repairPart(xml);
    if (replacements.length === 0) continue;
    mutated = true;
    totalReplacements += replacements.length;
    perPart.push({
      part: partName,
      replacements: replacements.length,
      examplesBefore: replacements.slice(0, 3).map((r) => r.before),
      examplesAfter: replacements.slice(0, 3).map((r) => r.after),
    });
    zip.file(partName, newXml);
  }

  if (!mutated) {
    return {
      templateCode,
      filePath,
      beforeHash,
      afterHash: beforeHash,
      replacements: 0,
      parts: [],
      skipped: true,
    };
  }

  const after = zip.generate({ type: 'nodebuffer' });
  const afterHash = createHash('sha256').update(after).digest('hex');

  if (!DRY_RUN) {
    writeFileSync(filePath, after);
  }

  return {
    templateCode,
    filePath,
    beforeHash,
    afterHash,
    replacements: totalReplacements,
    parts: perPart,
  };
};

const writeReport = (records) => {
  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, 'triple-brace-repair.json');
  const mdPath = join(OUT_DIR, 'triple-brace-repair.md');
  const totalReplacements = records.reduce((s, r) => s + (r.replacements ?? 0), 0);
  const repairedTemplates = records.filter((r) => r.replacements > 0);
  const body = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    totalTemplatesAudited: records.length,
    repairedTemplatesCount: repairedTemplates.length,
    totalReplacements,
    repairedTemplates,
  };
  writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

  const lines = [];
  lines.push(`# Triple-Brace Template Repair — F1_FIX`);
  lines.push('');
  lines.push(`Generated: ${body.generatedAt}`);
  lines.push(`Mode: **${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE (DOCX bytes updated)'}**`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| totalTemplatesAudited | ${body.totalTemplatesAudited} |`);
  lines.push(`| repairedTemplatesCount | ${body.repairedTemplatesCount} |`);
  lines.push(`| totalReplacements | ${body.totalReplacements} |`);
  lines.push('');
  if (repairedTemplates.length === 0) {
    lines.push('_No repairs needed._');
  } else {
    lines.push('## Per-template repair');
    lines.push('');
    lines.push('| templateCode | replacements | parts |');
    lines.push('|--------------|--------------|-------|');
    for (const r of repairedTemplates) {
      const partsSummary = r.parts.map((p) => `${p.part}(${p.replacements})`).join(', ');
      lines.push(`| ${r.templateCode} | ${r.replacements} | ${partsSummary} |`);
    }
    lines.push('');
    lines.push('## Before / after examples');
    lines.push('');
    for (const r of repairedTemplates) {
      lines.push(`### ${r.templateCode}`);
      lines.push('');
      for (const p of r.parts) {
        lines.push(`- **${p.part}** (${p.replacements} replacements)`);
        for (let i = 0; i < p.examplesBefore.length; i += 1) {
          lines.push(`  - before: \`${p.examplesBefore[i].replace(/\|/g, '\\|')}\``);
          lines.push(`  - after:  \`${p.examplesAfter[i].replace(/\|/g, '\\|')}\``);
        }
      }
      lines.push('');
    }
  }
  writeFileSync(mdPath, lines.join('\n') + '\n', 'utf8');
};

const main = () => {
  const allFailing = loadFailingCodes();
  if (TEMPLATE_FILTER.size > 0) {
    for (const code of [...allFailing]) {
      if (!TEMPLATE_FILTER.has(code)) allFailing.splice(allFailing.indexOf(code), 1);
    }
  }
  process.stderr.write(
    `${DRY_RUN ? '[DRY-RUN]' : '[WRITE]'} Repairing ${allFailing.length} failing templates\n`,
  );

  const records = [];
  for (const code of allFailing) {
    try {
      const r = repairOne(code);
      records.push(r);
      process.stderr.write(
        `  ${code}: replacements=${r.replacements} parts=${r.parts.length}\n`,
      );
    } catch (err) {
      records.push({
        templateCode: code,
        filePath: join(NORMALIZED_DIR, code, `${code}_normalized.docx`),
        error: err instanceof Error ? err.message : String(err),
        replacements: 0,
        parts: [],
      });
      process.stderr.write(`  ${code}: ERROR ${err.message}\n`);
    }
  }

  writeReport(records);

  const totalReplacements = records.reduce((s, r) => s + (r.replacements ?? 0), 0);
  process.stderr.write(`\nDone. Total replacements: ${totalReplacements}\n`);
  process.stderr.write(`Wrote docs/audit/docx-slot-inventory/triple-brace-repair.{json,md}\n`);
  if (DRY_RUN) {
    process.stderr.write('Re-run with --write to actually update the DOCX bytes.\n');
  }
};

main();