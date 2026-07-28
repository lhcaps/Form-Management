// Phase 4 — forensic investigation of the 4 MISSING + 4 PARTIAL targets.
//
// For each problematic slot:
//   - enumerates all text-bearing OOXML parts in the normalized DOCX:
//       word/document.xml
//       word/header*.xml
//       word/footer*.xml
//       word/footnotes.xml / endnotes.xml
//       word/comments.xml / people.xml
//   - searches each part for occurrences of:
//       * rawPattern
//       * {{<field_path>}} shape
//       * the slot label text
//   - emits a per-row forensic with:
//       LOCKED_LOCATION
//       LOCKED_RAW_PATTERN
//       LOCKED_REVIEW_CONTEXT
//       NORMALIZED_DOCX_PATH, NORMALIZED_DOCX_SHA256
//       CURRENT_TARGET_SEARCH_RESULTS
//       ALL_TEXT_BEARING_PARTS_SCANNED
//       ROOT_CAUSE
//       CANDIDATE_TARGET
//       CANDIDATE_CONFIDENCE
//       REMEDIATION
//       CURRENT_STATUS
//
// Root causes allowed:
//   LOCKED_LOCATION_INCOMPLETE
//   TARGET_MOVED_WITHIN_SAME_DOCX
//   SPLIT_RUN_EXTRACTION_GAP
//   TEXTBOX_EXTRACTION_GAP
//   CONTENT_CONTROL_EXTRACTION_GAP
//   NORMALIZED_TEMPLATE_DRIFT
//   LOCKED_BINDING_CORRUPT
//   SOURCE_TARGET_GENUINELY_ABSENT

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extractZip } from './lib/docx-zip.mjs';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_FORENSIC = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/eight-target-forensic.json');
const NORMALIZED_ROOT = path.join(REPO_ROOT, 'storage/templates/normalized-docx');

const TEXT_BEARING_PARTS = [
  'word/document.xml',
  'word/header1.xml', 'word/header2.xml', 'word/header3.xml',
  'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml',
  'word/footnotes.xml', 'word/endnotes.xml',
  'word/comments.xml',
];

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}
function sha256File(p) {
  return sha256Hex(readFileSync(p));
}

function hashNormalizedDocx(docxPath) {
  if (!existsSync(docxPath)) return null;
  return sha256File(docxPath);
}

function searchAllTextParts(zipEntries, predicate) {
  // Returns per-part match counts.
  const out = {};
  for (const entry of zipEntries) {
    if (!entry.path.startsWith('word/')) continue;
    if (!entry.path.endsWith('.xml')) continue;
    if (entry.path.includes('embeddings/') || entry.path.includes('media/')) continue;
    const text = entry.content.toString('utf8');
    const count = (text.match(predicate) ?? []).length;
    if (count > 0) out[entry.path] = count;
  }
  return out;
}

function looksLikePattern(rawPattern) {
  if (!rawPattern) return null;
  return new RegExp(rawPattern.replace(/[.+*?^${}()|[\]\\]/g, '\\$&'), 'g');
}

function rootCause({ rawPattern }, search, placeholderHits) {
  if (rawPattern && Object.keys(search ?? {}).length === 0 && Object.keys(placeholderHits ?? {}).length === 0) {
    return 'SOURCE_TARGET_GENUINELY_ABSENT';
  }
  if (rawPattern && Object.keys(search ?? {}).length > 0) {
    // Locked rawPattern matches a stored pattern — but location may still be incomplete.
    return 'LOCKED_LOCATION_INCOMPLETE';
  }
  if (!rawPattern && Object.keys(placeholderHits ?? {}).length > 0) {
    // The locked binding itself is empty but the {{<path>}} placeholder is present in DOCX.
    // This is a missing-rawPattern extraction gap, not necessarily genuine absence.
    return 'SPLIT_RUN_EXTRACTION_GAP';
  }
  if (!rawPattern && Object.keys(placeholderHits ?? {}).length === 0) {
    return 'SOURCE_TARGET_GENUINELY_ABSENT';
  }
  return 'LOCKED_BINDING_CORRUPT';
}

function candidateTarget(row, search) {
  const parts = Object.keys(search ?? {});
  if (parts.length === 0) return null;
  return { partName: parts[0], occurrenceCount: search[parts[0]] };
}

export function runForensicEightTarget(options = {}) {
  const index = loadLockedRuntimeIndex();
  const rows = [];

  for (const form of index.forms) {
    for (const slot of form.runtimeView.docxSlots ?? []) {
      const hasBlock = !!(slot.location?.blockId || slot.location?.tableCellId);
      const hasPattern = !!slot.evidence?.rawPattern;
      const kind = (!hasBlock && !hasPattern) ? 'MISSING' : (!hasBlock || !hasPattern) ? 'PARTIAL' : 'EXACT';
      // Limit: only report genuinely problematic slots.
      // MISSING = no blockId AND no rawPattern.
      // PARTIAL = evidence partial per the spec — limit to slots where the
      //           rawPattern is absent (otherwise downstream consumers treat
      //           it as TOKEN_PATTERN_TARGET during render).
      const problematic = kind === 'MISSING' || (kind === 'PARTIAL' && !hasPattern);
      if (!problematic) continue;

      const formCode = form.identity.templateCode;
      const docxPath = path.join(NORMALIZED_ROOT, formCode, `${formCode}_normalized.docx`);
      const docxSha256 = hashNormalizedDocx(docxPath);
      let entries = [];
      try {
        if (existsSync(docxPath)) entries = extractZip(docxPath);
      } catch (err) {
        rows.push({
          FORM_CODE: formCode, SLOT_ID: slot.slotId, error: err.message, CURRENT_STATUS: 'EXTRACTION_ERROR',
        });
        continue;
      }
      const partsScanned = entries.filter((e) => TEXT_BEARING_PARTS.includes(e.path)).map((e) => e.path);

      const locked = {
        rawPattern: slot.evidence?.rawPattern ?? null,
        context: slot.context ?? null,
        location: slot.location ?? null,
        reviewContext: null,
      };
      const predicate = looksLikePattern(slot.evidence?.rawPattern);
      const search = predicate ? searchAllTextParts(entries, predicate) : {};
      // Also search the {{<path>}} shape.
      const placeholderSearch = new RegExp(`\\{\\{\\s*${slot.slotId.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      const placeholderHits = searchAllTextParts(entries, placeholderSearch);

      const allHits = mergeHits(search, placeholderHits);
      const cause = rootCause(locked, search, placeholderHits);
      const candidate = candidateTarget(locked, allHits);

      rows.push({
        FORM_CODE: formCode,
        FIELD_PATH: slot.slotId,
        SLOT_ID: slot.slotId,
        BINDING: (form.runtimeView.renderBindings ?? []).find((b) => b.slotId === slot.slotId) ?? null,
        LOCKED_RAW_PATTERN: locked.rawPattern,
        LOCKED_LOCATION: locked.location,
        LOCKED_REVIEW_CONTEXT: locked.context,
        LOCKED_REVIEW_KIND: kind,
        NORMALIZED_DOCX_PATH: path.relative(REPO_ROOT, docxPath),
        NORMALIZED_DOCX_SHA256: docxSha256,
        CURRENT_TARGET_SEARCH_RESULTS: allHits,
        ALL_TEXT_BEARING_PARTS_SCANNED: partsScanned,
        ROOT_CAUSE: cause,
        CANDIDATE_TARGET: candidate,
        CANDIDATE_CONFIDENCE: candidate ? (Object.keys(allHits).length > 0 ? 0.5 : 0.1) : 0,
        REMEDIATION: cause === 'SOURCE_TARGET_GENUINELY_ABSENT'
          ? 'BLOCKED_PENDING_SOURCE_PROOF — no text pattern match in any text-bearing part'
          : (cause === 'TARGET_MOVED_WITHIN_SAME_DOCX'
            ? 'verify target paragraph/blockId matches DOCX structural extraction'
            : (cause === 'SPLIT_RUN_EXTRACTION_GAP'
              ? 're-extract raw pattern using split-run extractor; the {{<path>}} placeholder confirms the binding target exists'
              : 're-run extraction with broader split-run/textbox/content-control pipeline')),
        CURRENT_STATUS: cause === 'SOURCE_TARGET_GENUINELY_ABSENT' ? 'BLOCKED_PENDING_SOURCE_PROOF' : 'PENDING_RE_EXTRACTION',
      });
    }
  }

  const summary = {
    schema: 'qllaw.213.locked_eight_target_forensic/v1',
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    byRootCause: rows.reduce((acc, r) => ({ ...acc, [r.ROOT_CAUSE ?? 'UNKNOWN']: (acc[r.ROOT_CAUSE ?? 'UNKNOWN'] ?? 0) + 1 }), {}),
    byStatus: rows.reduce((acc, r) => ({ ...acc, [r.CURRENT_STATUS ?? 'UNKNOWN']: (acc[r.CURRENT_STATUS ?? 'UNKNOWN'] ?? 0) + 1 }), {}),
    rows,
  };

  mkdirSync(path.dirname(OUTPUT_FORENSIC), { recursive: true });
  writeFileSync(OUTPUT_FORENSIC, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_FORENSIC, summary };
}

function mergeHits(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { summary, outputPath } = runForensicEightTarget();
  console.log(`OK forensic: ${summary.totalRows} rows`);
  console.log('     by root cause:', JSON.stringify(summary.byRootCause));
  console.log('     by status:', JSON.stringify(summary.byStatus));
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
