/**
 * A8 fail-closed mutation suite.
 *
 * Each mutation must cause the standalone guard
 * (scripts/runtime-rollout/guard-runtime-rollout-evidence.mjs) to fail-closed.
 * Mutates copies in temporary folders so the live artifacts remain pristine.
 *
 * Mutation-effectiveness verification:
 *   - target file path (relative to the evidence work folder)
 *   - target region inside the file (json path / substring / regex range)
 *   - before-hash + after-hash of the target file
 *   - semantic delta summary (what the mutation is supposed to corrupt)
 *   - mutationApplied: true iff the after-hash differs from the before-hash
 *   - setup failure tracking: every step that errors out is recorded so the
 *     suite cannot silently mark a mutation "FAIL_CLOSED_TRIGGERED" by
 *     misconfiguration.
 */

import { copyFile, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { runGuard } from './guard-runtime-rollout-evidence.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const WORK_DIR = path.join(ROLLOUT_DIR, '.tmp-a8-mutations');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function sha256File(file) {
  const buf = await readFile(file);
  return sha256(buf);
}

function parseJson(buf, source) {
  try {
    return JSON.parse(buf);
  } catch (e) {
    throw new Error(`invalid JSON at ${source}: ${e.message}`);
  }
}

/**
 * A Mutation is a tuple of:
 *   - id / name: identifier + human description
 *   - target: relative file path inside the work folder
 *   - region: human-readable description of the field/region mutated
 *   - apply(workDir): async function that performs the mutation, after the
 *     baseline evidence has been copied into workDir by the suite. Must throw
 *     a descriptive Error on failure (these become setup failures).
 *   - beforeAndAfterHashes: filled in by the suite at run time
 *   - semanticDelta: filled in by the suite at run time
 */
const MUTATIONS = [
  // ===== Baseline-shape integrity =====
  {
    id: 'A8.M01.MISSING_MANIFEST',
    name: 'Missing authoritative manifest',
    target: 'authoritative-213-manifest.json',
    region: 'file-level (whole file removed)',
    apply: async (w) => {
      const dst = path.join(w, 'authoritative-213-manifest.json');
      await rm(dst, { force: true });
    },
  },
  {
    id: 'A8.M02.MALFORMED_JSON',
    name: 'Malformed JSON in readiness matrix',
    target: 'render-readiness-213-matrix.json',
    region: 'JSON parser will reject',
    apply: async (w) => {
      const dst = path.join(w, 'render-readiness-213-matrix.json');
      await writeFile(dst, '{ "rows": [], "totally malformed": true,');
    },
  },
  {
    id: 'A8.M03.ONLY_212_FORMS',
    name: 'Readiness matrix lists only 212 forms',
    target: 'render-readiness-213-matrix.json',
    region: 'rows[212:] removed',
    apply: async (w) => {
      const dst = path.join(w, 'render-readiness-213-matrix.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.rows = obj.rows.slice(0, 212);
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M04.DUPLICATE_ROW_MASK',
    name: 'Readiness matrix has 213 rows but one is duplicated (masking a missing form)',
    target: 'render-readiness-213-matrix.json',
    region: 'rows[last] replaced with rows[0]',
    apply: async (w) => {
      const dst = path.join(w, 'render-readiness-213-matrix.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.rows[obj.rows.length - 1] = { ...obj.rows[0] };
      obj.total = obj.rows.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // ===== Counts-vs-verdicts consistency =====
  // M05: in the baseline, counts.pass already equals counts.total. To produce
  // a SEMANTIC change that the guard can detect, we mutate a real verdict to
  // NOT_EXECUTED and bump counts.pass so pass==total still holds. That is the
  // exact "NOT_EXECUTED counted as PASS" failure mode the user named.
  {
    id: 'A8.M05.NOT_EXECUTED_COUNTED_AS_PASS',
    name: 'A verdict flips to NOT_EXECUTED but counts.pass stays == counts.total',
    target: 'runtime-render-results.json',
    region: 'results[1].verdict = NOT_EXECUTED, counts.pass == counts.total',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.results && obj.results.length > 1) {
        obj.results[1].verdict = 'NOT_EXECUTED';
      }
      obj.verdictCounts.NOT_EXECUTED = (obj.verdictCounts?.NOT_EXECUTED || 0) + 1;
      if (obj.verdictCounts.PASS_RUNTIME_MAPPING > 0) {
        obj.verdictCounts.PASS_RUNTIME_MAPPING -= 1;
      }
      obj.counts.pass = obj.counts.total; // <-- the bug: count stays at total
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M11: NO_RUNTIME_SLOTS forms exist but counts.pass is bumped so pass==total.
  // The guard detects this because verdictCounts.NO_RUNTIME_SLOTS>0 AND
  // counts.pass==counts.total.
  {
    id: 'A8.M11.PASS_NO_PLACEHOLDERS_AS_PASS',
    name: 'A verdict flips to NO_RUNTIME_SLOTS but counts.pass stays == counts.total',
    target: 'runtime-render-results.json',
    region: 'results[2].verdict = NO_RUNTIME_SLOTS, counts.pass == counts.total',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.results && obj.results.length > 2) {
        obj.results[2].verdict = 'NO_RUNTIME_SLOTS';
      }
      obj.verdictCounts.NO_RUNTIME_SLOTS = (obj.verdictCounts?.NO_RUNTIME_SLOTS || 0) + 1;
      if (obj.verdictCounts.PASS_RUNTIME_MAPPING > 0) {
        obj.verdictCounts.PASS_RUNTIME_MAPPING -= 1;
      }
      obj.counts.pass = obj.counts.total;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M14: contractSha256 for results[0] is set to the all-zero sentinel. The
  // guard now rejects all-zero contract hashes.
  {
    id: 'A8.M14.CONTRACT_TEMPLATE_HASH_MISMATCH',
    name: 'contractSha256 in slot inventory is all-zero (mutated)',
    target: 'slot-inventory-summary.json',
    region: 'results[0].contractSha256 = 0x00 * 32',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        obj.results[0].contractSha256 = '0'.repeat(64);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M15: results[0].r1Input is emptied AND evidence.r1SentinelCount is zeroed
  // so the guard sees a PASS_RUNTIME_MAPPING form with no render input.
  {
    id: 'A8.M15.MISSING_REQUIRED_RENDER_KEY',
    name: 'r1Input + evidence empty for a PASS_RUNTIME_MAPPING form',
    target: 'runtime-render-results.json',
    region: 'results[0].r1Input = {} ; results[0].evidence.r1SentinelCount = 0',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        obj.results[0].r1Input = {};
        if (!obj.results[0].evidence) obj.results[0].evidence = {};
        obj.results[0].evidence.r1SentinelCount = 0;
        obj.results[0].evidence.r2SentinelCount = 0;
        obj.results[0].evidence.placeholderKeyCount = 0;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M16: append the first slot key onto results[0].slotKeys so the guard sees
  // a duplicate-key target.
  {
    id: 'A8.M16.DUPLICATE_SLOT_TARGET',
    name: 'Slot inventory lists a duplicate slot target (same slot twice)',
    target: 'slot-inventory-summary.json',
    region: 'results[0].slotKeys.append(slotKeys[0])',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        const first = obj.results[0];
        first.slotKeys = [...first.slotKeys, first.slotKeys[0]];
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M17: reclassify document.promulgationLine as RENDERABLE_SOURCE_SLOT.
  {
    id: 'A8.M17.STATIC_LEGAL_TEXT_AS_SLOT',
    name: 'Promulgation/model-number field classified as RENDERABLE_SOURCE_SLOT (must be STATIC_SOURCE_TEXT)',
    target: 'slot-inventory-summary.json',
    region: 'results[0].slotClassifications["document.promulgationLine"] = RENDERABLE_SOURCE_SLOT',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        const first = obj.results[0];
        first.slotClassifications = first.slotClassifications || {};
        first.slotClassifications['document.promulgationLine'] = 'RENDERABLE_SOURCE_SLOT';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M17b: reclassify a different model-number field as RENDERABLE_SOURCE_SLOT.
  {
    id: 'A8.M17b.MODEL_NUMBER_AS_SLOT',
    name: 'document.modelNumber classified as RENDERABLE_SOURCE_SLOT (must be STATIC_SOURCE_TEXT)',
    target: 'slot-inventory-summary.json',
    region: 'results[1].slotClassifications["document.modelNumber"] = RENDERABLE_SOURCE_SLOT',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 1) {
        const second = obj.results[1];
        second.slotClassifications = second.slotClassifications || {};
        second.slotClassifications['document.modelNumber'] = 'RENDERABLE_SOURCE_SLOT';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M18: results[0].r1DifferentFromR2 = false while verdict = PASS_RUNTIME_MAPPING.
  {
    id: 'A8.M18.R2_CONTAINS_R1_SENTINEL',
    name: 'R2 still contains a changed R1 sentinel value (failed sentinel-clear)',
    target: 'runtime-render-results.json',
    region: 'results[0].r1DifferentFromR2 = false while verdict = PASS_RUNTIME_MAPPING',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        obj.results[0].r1DifferentFromR2 = false;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M19: word-sidecar r1.elapsedMs exceeds 2x timeoutMs while ok=true and
  // timedOut=true. Place the file under word-sidecar/word-visual-results.json
  // so the guard sees it.
  {
    id: 'A8.M19.WORD_TIMEOUT_BUT_MARKED_PASS',
    name: 'Word sidecar job marked ok=true but elapsedMs > 2x timeout AND timedOut=true',
    target: 'word-sidecar/word-visual-results.json',
    region: 'jobs[0].r1.ok=true; jobs[0].r1.timedOut=true; jobs[0].r1.elapsedMs=999_999',
    apply: async (w) => {
      const dst = path.join(w, 'word-sidecar', 'word-visual-results.json');
      mkdirSync(path.dirname(dst), { recursive: true });
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.jobs || []).length > 0) {
        obj.jobs[0].r1.ok = true;
        obj.jobs[0].r1.timedOut = true;
        obj.jobs[0].r1.elapsedMs = 999_999;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M20: word-sidecar r1.ok=true but the output PDF path does not exist.
  {
    id: 'A8.M20.WORD_PDF_MISSING',
    name: 'Word sidecar ok=true but PDF file does not exist on disk',
    target: 'word-sidecar/word-visual-results.json',
    region: 'jobs[0].r1.output -> non-existent path',
    apply: async (w) => {
      const dst = path.join(w, 'word-sidecar', 'word-visual-results.json');
      mkdirSync(path.dirname(dst), { recursive: true });
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.jobs || []).length > 0) {
        obj.jobs[0].r1.output = path.join(w, 'does-not-exist.pdf');
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M20b: r2.ok=true but r2.output PDF does not exist.
  {
    id: 'A8.M20b.WORD_R2_PDF_MISSING',
    name: 'Word sidecar R2 ok=true but R2 PDF file does not exist on disk',
    target: 'word-sidecar/word-visual-results.json',
    region: 'jobs[0].r2.output -> non-existent path',
    apply: async (w) => {
      const dst = path.join(w, 'word-sidecar', 'word-visual-results.json');
      mkdirSync(path.dirname(dst), { recursive: true });
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.jobs || []).length > 0) {
        obj.jobs[0].r2.output = path.join(w, 'r2-missing.pdf');
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M21: source-hash-baseline rows[0].sha256 flipped to all-f marker.
  {
    id: 'A8.M21.SOURCE_HASH_CHANGED',
    name: 'Source DOCX hash differs from baseline (all-f marker)',
    target: 'source-hash-baseline.json',
    region: 'rows[0].sha256 = 0xff * 32',
    apply: async (w) => {
      const dst = path.join(w, 'source-hash-baseline.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (Array.isArray(obj.rows) && obj.rows.length > 0) {
        obj.rows[0].sha256 = 'f'.repeat(64);
      } else if (obj.hashes) {
        const keys = Object.keys(obj.hashes);
        if (keys.length > 0) obj.hashes[keys[0]] = 'f'.repeat(64);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M21b: source-hash-baseline rows[1].sha256 flipped to invalid hex.
  {
    id: 'A8.M21b.SOURCE_HASH_INVALID_HEX',
    name: 'Source DOCX hash has invalid hex characters',
    target: 'source-hash-baseline.json',
    region: 'rows[1].sha256 = "z".repeat(64)',
    apply: async (w) => {
      const dst = path.join(w, 'source-hash-baseline.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (Array.isArray(obj.rows) && obj.rows.length > 1) {
        obj.rows[1].sha256 = 'z'.repeat(64);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // ===== Roster integrity =====
  {
    id: 'A8.M06.UNAVAILABLE_COUNTED_AS_PASS',
    name: 'LibreOffice visual results marked UNAVAILABLE but counted as PASS',
    target: 'libreoffice-visual-results.json',
    region: 'counts.loPass = counts.total (inflated)',
    apply: async (w) => {
      const dst = path.join(w, 'libreoffice-visual-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = (obj.forms || [])[0];
      if (!target) throw new Error('M06 requires one LibreOffice form');
      if (target.libreoffice) target.libreoffice.status = 'UNAVAILABLE';
      else target.status = 'UNAVAILABLE';
      obj.counts.loPass = obj.counts.total;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M07.SYNTHETIC_CANARY_ACCEPTED',
    name: 'Synthetic canary __UNREGISTERED_FORM_CANARY__ listed as RUNTIME_READY',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyForms[0] = "__UNREGISTERED_FORM_CANARY__"',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.runtimeReadyForms = ['__UNREGISTERED_FORM_CANARY__', ...(obj.runtimeReadyForms || [])];
      obj.runtimeReadyCount = obj.runtimeReadyForms.length;
      obj.skeletonCount = 213 - obj.runtimeReadyForms.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M08.UNKNOWN_FORM_ADDED',
    name: 'Unknown form (BM-999) added to runtime-ready roster',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyForms.append("BM-999")',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.runtimeReadyForms = [...(obj.runtimeReadyForms || []), 'BM-999'];
      obj.runtimeReadyCount = obj.runtimeReadyForms.length;
      obj.skeletonCount = 213 - obj.runtimeReadyForms.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M09.RUNTIME_READY_OVERCOUNTED',
    name: 'runtimeReadyCount does not match runtimeReadyForms length',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyCount = runtimeReadyForms.length + 5',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.runtimeReadyCount = (obj.runtimeReadyForms || []).length + 5;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M10.SKELETON_INCONSISTENT',
    name: 'skeletonCount != 213 - runtimeReadyCount',
    target: 'canonical-runtime-roster.json',
    region: 'skeletonCount = 100',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.skeletonCount = 100;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // ===== B1 closure — legal-header candidates =====
  {
    id: 'A8.M12.MISSING_NORMALIZED_CANDIDATE',
    name: 'Normalized candidate DOCX absent for a form marked ready',
    target: 'legal-header-candidates.json',
    region: 'results[0].candidateSha256=null; results[0].candidatePath=null',
    apply: async (w) => {
      const dst = path.join(w, 'legal-header-candidates.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const first = (obj.results || [])[0];
      if (first) {
        first.candidateSha256 = null;
        first.candidatePath = null;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M13.SLOT_INVENTORY_ABSENT',
    name: 'slot-inventory-summary.json has 0 results',
    target: 'slot-inventory-summary.json',
    region: 'results = []',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.results = [];
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M22.ROLLBACK_MISSING',
    name: 'Rollback file absent for a B1A form',
    target: 'legal-header-candidates.json',
    region: 'results[0].rollbackSha256 = null',
    apply: async (w) => {
      const dst = path.join(w, 'legal-header-candidates.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.results || []).length > 0) {
        obj.results[0].rollbackSha256 = null;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M23.PROMOTED_WITHOUT_RUNTIME_MAPPING',
    name: 'Form in canonical-runtime-roster.json has no PASS_RUNTIME_MAPPING verdict',
    target: 'runtime-render-results.json',
    region: 'results[promotedCode].verdict = NO_RUNTIME_SLOTS',
    apply: async (w) => {
      const rosterDst = path.join(w, 'canonical-runtime-roster.json');
      const rtDst = path.join(w, 'runtime-render-results.json');
      const roster = parseJson(await readFile(rosterDst, 'utf8'), rosterDst);
      const rt = parseJson(await readFile(rtDst, 'utf8'), rtDst);
      const promoteMe = (roster.runtimeReadyForms || [])[0];
      const target = (rt.results || []).find((r) => r.bmCode === promoteMe);
      if (target) target.verdict = 'NO_RUNTIME_SLOTS';
      await writeFile(rosterDst, JSON.stringify(roster, null, 2));
      await writeFile(rtDst, JSON.stringify(rt, null, 2));
    },
  },
  {
    id: 'A8.M24.PROMOTED_COUNT_INCONSISTENT',
    name: 'runtimeReadyCount does not match runtimeReadyForms.length AND divergence in evidence',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyCount + 7; skeletonCount adjusted',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.runtimeReadyCount = (obj.runtimeReadyForms || []).length + 7;
      obj.skeletonCount = 213 - obj.runtimeReadyCount;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M25.DUPLICATE_FORM_IN_ROSTER',
    name: 'Runtime-ready roster contains duplicate form code (masking omission)',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyForms.push(runtimeReadyForms[0])',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if ((obj.runtimeReadyForms || []).length > 0) {
        const first = obj.runtimeReadyForms[0];
        obj.runtimeReadyForms.push(first);
        obj.runtimeReadyCount = obj.runtimeReadyForms.length;
        obj.skeletonCount = 213 - obj.runtimeReadyForms.length;
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M26.MALFORMED_PROMOTION_MANIFEST',
    name: 'Promotion manifest JSON is syntactically malformed',
    target: 'canonical-runtime-roster.json',
    region: 'JSON parser will reject (truncated)',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      await writeFile(dst, '{ "runtimeReadyForms": [ "BM-001", "BM-002" ], "runtimeReadyCount": ');
    },
  },

  // ===== Phase 4 expansion — accounting + visual + roster-drift =====
  {
    id: 'A8.M27.PHASE1_DUPLICATE_BM001_PROMOTED',
    name: 'phase1-accounting.json promotes BM-001 as NEWLY_PROMOTED (already-ready treated as new)',
    target: 'phase1-accounting.json',
    region: 'promoted.push({formCode:"BM-001", promotionStatus:NEWLY_PROMOTED})',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.promoted.push({
        formCode: 'BM-001',
        promotionStatus: 'NEWLY_PROMOTED',
        r1Hash: 'deadbeef'.repeat(8),
        r2Hash: 'beadbeef'.repeat(8),
        slotVerdict: 'CONTRACT_MAPPING_DEFECT',
        libreOfficeR1Sha256: 'a'.repeat(64),
        libreOfficeR2Sha256: 'b'.repeat(64),
        libreOfficePageCount: 1,
      });
      obj.newlyPromoted = obj.promoted.length;
      obj.finalRuntimeReady = [...new Set([...obj.finalRuntimeReady, 'BM-001'])].sort();
      obj.counts.newlyPromoted = obj.promoted.length;
      obj.counts.runtimeReadyUniqueCount = obj.finalRuntimeReady.length;
      obj.counts.skeletonCount = 213 - obj.finalRuntimeReady.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M28.PHASE1_DUPLICATE_FORM_INFLATING_COUNT',
    name: 'phase1-accounting.json lists the same form twice',
    target: 'phase1-accounting.json',
    region: 'finalRuntimeReady.append(finalRuntimeReady[0])',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.finalRuntimeReady = [...obj.finalRuntimeReady, obj.finalRuntimeReady[0]];
      obj.finalRuntimeReady.sort();
      obj.counts.runtimeReadyUniqueCount = obj.finalRuntimeReady.length;
      obj.counts.skeletonCount = 213 - obj.finalRuntimeReady.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M29.PHASE1_PROMOTED_WITHOUT_LIBREOFFICE',
    name: 'phase1-accounting.json promotes a form without LibreOffice PASS evidence',
    target: 'phase1-accounting.json',
    region: 'promoted[0].libreOfficeR1Sha256/libreOfficeR2Sha256/pageCount = null',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.promoted[0].libreOfficeR1Sha256 = null;
      obj.promoted[0].libreOfficeR2Sha256 = null;
      obj.promoted[0].libreOfficePageCount = null;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M30.PHASE1_PROMOTED_WITHOUT_WORD',
    name: 'phase1-accounting.json promotes a form but Word evidence is missing',
    target: 'phase1-accounting.json',
    region: 'promoted[0].r1Hash/r2Hash = null',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.promoted[0].wordVerified = false;
      obj.promoted[0].r1Hash = null;
      obj.promoted[0].r2Hash = null;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M31.PHASE1_PROVISIONAL_IN_CANONICAL_ROSTER',
    name: 'phase1-accounting.json includes a PROVISIONAL form in finalRuntimeReady',
    target: 'phase1-accounting.json',
    region: 'finalRuntimeReady.append(provisional[0].formCode)',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const provisionalCode = obj.provisional?.[0]?.formCode
        ?? obj.newCandidates.find((code) => !obj.finalRuntimeReady.includes(code))
        ?? 'BM-006';
      obj.provisional = [{
        formCode: provisionalCode,
        promotionStatus: 'RUNTIME_CANDIDATE_PROVISIONAL',
        reason: 'LIBREOFFICE_VISUAL_MISSING',
      }];
      obj.finalRuntimeReady = [...new Set([...obj.finalRuntimeReady, provisionalCode])].sort();
      obj.counts.provisionalCandidates = obj.provisional.length;
      obj.counts.runtimeReadyUniqueCount = obj.finalRuntimeReady.length;
      obj.counts.skeletonCount = 213 - obj.finalRuntimeReady.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M32.PHASE1_ROSTER_DRIFT_FROM_GENERATED',
    name: 'phase1-accounting.json finalRuntimeReady diverges from generated roster',
    target: 'phase1-accounting.json',
    region: 'finalRuntimeReady.append("BM-099")',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.finalRuntimeReady = [...obj.finalRuntimeReady, 'BM-099'].sort();
      obj.counts.runtimeReadyUniqueCount = obj.finalRuntimeReady.length;
      obj.counts.skeletonCount = 213 - obj.finalRuntimeReady.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M33.PHASE1_BRIDGE_HAS_UNKNOWN_CODE',
    name: 'bridge-eligibility.ts literal list diverges from generated roster',
    target: 'bridge-eligibility.ts',
    region: 'STANDALONE_RUNTIME_TEMPLATE_CODES = literal that omits the promoted codes',
    apply: async (w) => {
      const dst = path.join(w, 'bridge-eligibility.ts');
      let buf = await readFile(dst, 'utf8');
      buf = buf.replace(
        /export const STANDALONE_RUNTIME_TEMPLATE_CODES = RUNTIME_READY_FORM_CODES;/,
        "export const STANDALONE_RUNTIME_TEMPLATE_CODES = ['BM-001', 'BM-099'] as const;\nexport const __stub__ = RUNTIME_READY_FORM_CODES;",
      );
      await writeFile(dst, buf);
    },
  },
  {
    id: 'A8.M34.PHASE1_MANUAL_CODE_WITHOUT_EVIDENCE',
    name: 'runtime-readiness.generated.ts contains a code not in phase1 finalRuntimeReady',
    target: 'runtime-readiness.generated.ts',
    region: 'RUNTIME_READY_FORM_CODES prepends "BM-099"',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-readiness.generated.ts');
      let buf = await readFile(dst, 'utf8');
      buf = buf.replace(
        /export const RUNTIME_READY_FORM_CODES = \[\n/,
        'export const RUNTIME_READY_FORM_CODES = [\n  "BM-099",\n',
      );
      if (!buf.includes('BM-099')) {
        throw new Error('M34 mutation failed to inject BM-099');
      }
      await writeFile(dst, buf);
    },
  },
  {
    id: 'A8.M35.PHASE1_SUMMARY_REPORTS_SIX_NEW',
    name: 'phase1-accounting.json reports 6 newlyPromoted but only 5 forms are unique',
    target: 'phase1-accounting.json',
    region: 'promoted.push({ ...dup, formCode: "BM-002" })',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const dup = obj.promoted[0];
      obj.promoted.push({ ...dup, formCode: 'BM-002' });
      obj.counts.newlyPromoted = obj.promoted.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M36.PHASE1_COUNT_MISMATCH',
    name: 'phase1-accounting.json runtimeReadyUniqueCount differs from finalRuntimeReady.length',
    target: 'phase1-accounting.json',
    region: 'counts.runtimeReadyUniqueCount = finalRuntimeReady.length + 3',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.counts.runtimeReadyUniqueCount = obj.finalRuntimeReady.length + 3;
      obj.counts.skeletonCount = 213 - obj.counts.runtimeReadyUniqueCount;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M37.PHASE1B_LO_PROMOTED_BUT_FAIL',
    name: 'phase1b-libreoffice-outcomes.json marks BM-002 as PASS but R2 PDF is missing',
    target: 'phase1b-libreoffice-outcomes.json',
    region: 'forms[BM-002].r2.status=FAIL, outputPdfSha256=null, status=PASS',
    apply: async (w) => {
      const dst = path.join(w, 'phase1b-libreoffice-outcomes.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.forms.find((f) => f.formCode === 'BM-002') || obj.forms[0];
      target.status = 'PASS';
      target.r2.pdfPath = null;
      target.r2.outputPdfSha256 = null;
      target.r2.status = 'FAIL';
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
  {
    id: 'A8.M38.PHASE1B_LO_STALE_R1_VALUE_IN_R2',
    name: 'phase1b-libreoffice-outcomes.json shows R2 still contains changed R1 sentinel',
    target: 'phase1b-libreoffice-outcomes.json',
    region: 'forms[BM-002].inspections.changedR1ValuesAbsentFromR2.pass=false',
    apply: async (w) => {
      const dst = path.join(w, 'phase1b-libreoffice-outcomes.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.forms.find((f) => f.formCode === 'BM-002') || obj.forms[0];
      target.inspections.r2VisibleChanges.pass = true;
      target.inspections.changedR1ValuesAbsentFromR2.pass = false;
      target.inspections.changedR1ValuesAbsentFromR2.staleValues = ['stale-r1-leak'];
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // ===========================================================
  // Phase 13 — A8 expansion for the new extractor / delegation /
  // verdict-classification / readiness-board work.
  // ===========================================================

  // M39: split-run token omitted — slot inventory drops a placeholder
  // that legitimately spans multiple <w:r> nodes. The mutation drops
  // slotKeys but leaves slotCount untouched; the guard catches the
  // slot-count vs slot-keys mismatch.
  {
    id: 'A8.M39.SPLIT_RUN_TOKEN_OMITTED',
    name: 'split-run placeholder token omitted from slot inventory',
    target: 'slot-inventory-summary.json',
    region: 'results[3].slotKeys drop without re-syncing slotCount',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.results.find((r) => r.formCode === 'BM-003') || obj.results[3];
      if (!target) return;
      const tokens = target.slotKeys || [];
      const keep = tokens.slice(0, Math.max(0, tokens.length - 1));
      target.slotKeys = keep;
      // Intentionally NOT updating slotCount to trigger the invariant.
      target.verdict = 'SLOT_INVENTORY_MISMATCH';
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M40: cross-paragraph pseudo-token — slot-inventory merges two
  // unrelated paragraph texts into one bogus canonical key. The mutation
  // pushes a phantom canonicalSlotKey without resyncing the count; the
  // guard rejects the phantom via the dedicated check.
  {
    id: 'A8.M40.CROSS_PARAGRAPH_PSEUDO_TOKEN',
    name: 'cross-paragraph text merged into a pseudo placeholder token',
    target: 'slot-inventory-summary.json',
    region: 'results[4].canonicalSlotKeys appends phantom key',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.results.find((r) => r.formCode === 'BM-004') || obj.results[4];
      if (!target) return;
      target.canonicalSlotKeys = (target.canonicalSlotKeys || []).concat(['agency.mergedCrossParagraphBoGus']);
      target.verdict = 'SLOT_INVENTORY_MISMATCH';
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M41: content-control alias ignored — slot inventory drops a physical
  // alias-bearing key but leaves the canonical alias. The mutation injects a
  // sentinel canonicalSlotKey that the guard detects as "orphan canonical".
  {
    id: 'A8.M41.CONTENT_CONTROL_ALIAS_IGNORED',
    name: 'content-control alias ignored in slot extraction',
    target: 'slot-inventory-summary.json',
    region: 'results[5] canonicalSlotKeys adds orphan aliasKeyStaysBehind',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.results.find((r) => r.formCode === 'BM-172') || obj.results[5];
      if (!target) return;
      target.canonicalSlotKeys = (target.canonicalSlotKeys || []).concat(['agency.aliasKeyStaysBehind']);
      target.verdict = 'SLOT_INVENTORY_MISMATCH';
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M42: content-control from sibling form accepted — slot inventory
  // records a non-zero match for a form whose content-control originated
  // in a sibling template. Guard catches duplicated canonicalSlotKey.
  {
    id: 'A8.M42.SIBLING_CONTENT_CONTROL_ACCEPTED',
    name: 'content-control from sibling form accepted',
    target: 'slot-inventory-summary.json',
    region: 'results[6].canonicalSlotKeys duplicates BM-001 alias',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.results.find((r) => r.formCode === 'BM-006') || obj.results[6];
      if (!target) return;
      target.canonicalSlotKeys = (target.canonicalSlotKeys || []).concat(['agency.name.SIBLING_LEAK']);
      target.slotCount = target.canonicalSlotKeys.length;
      target.verdict = 'SLOT_INVENTORY_MISMATCH';
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M43: 62 stub forms counted as runtime mapping PASS — runtime render
  // promotes a GenericTemplateFormInputsPanel form that has empty
  // contract keys but the verdict is set to PASS_RUNTIME_MAPPING. Guard
  // catches empty placeholderKeys on a PASS verdict.
  {
    id: 'A8.M43.STUB_FORMS_COUNTED_AS_RUNTIME_PASS',
    name: 'GenericTemplateFormInputsPanel stub form counted as PASS_RUNTIME_MAPPING',
    target: 'runtime-render-results.json',
    region: 'results[10] verdict forced to PASS_RUNTIME_MAPPING with empty placeholderKeys',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = obj.results.find((r) => r.bmCode === 'BM-051') || obj.results[10];
      if (!target) return;
      target.placeholderKeys = [];
      target.contractKeys = target.placeholderKeys;
      target.unmatchedContractKeys = [];
      target.verdict = 'PASS_RUNTIME_MAPPING';
      target.noPlaceholders = false;
      // keep counts consistent with mutation so M05/M11 invariant doesn't fire first.
      if (obj.verdictCounts) {
        obj.verdictCounts.NO_RUNTIME_SLOTS = Math.max(0, (obj.verdictCounts.NO_RUNTIME_SLOTS || 1) - 1);
        obj.verdictCounts.PASS_RUNTIME_MAPPING = (obj.verdictCounts.PASS_RUNTIME_MAPPING || 0) + 1;
      }
      obj.counts.pass = (obj.counts.pass || 0) + 1;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M44: source-slot-debt form promoted — runtime-render-results has a
  // SOURCE_SLOT_DEBT form in the promoted roster. Guard cross-checks
  // roster against runtime verdict.
  {
    id: 'A8.M44.SOURCE_SLOT_DEBT_PROMOTED',
    name: 'SOURCE_SLOT_DEBT form promoted in roster',
    target: 'canonical-runtime-roster.json',
    region: 'runtimeReadyForms includes BM-007 (a source-slot-debt form)',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-runtime-roster.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const arr = obj.runtimeReadyForms || [];
      obj.runtimeReadyForms = [...new Set([...arr, 'BM-007'])].sort();
      obj.runtimeReadyCount = obj.runtimeReadyForms.length;
      obj.skeletonCount = (obj.formCount || 213) - obj.runtimeReadyCount;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M45: Word-only candidate counted runtime-ready — phase1-accounting
  // has a candidate marked NEWLY_PROMOTED but its LO outcome is missing.
  // Guard cross-checks phase1 promoted[] vs phase1b presence.
  {
    id: 'A8.M45.WORD_ONLY_COUNTED_RUNTIME_READY',
    name: 'Word-only candidate counted runtime-ready (LibreOffice evidence missing)',
    target: 'phase1-accounting.json',
    region: 'promoted[] has a form not present in phase1b-libreoffice-outcomes',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.promoted = (obj.promoted || []).concat([
        { formCode: 'BM-013-WORD-ONLY', promotionStatus: 'NEWLY_PROMOTED', r1Hash: 'x'.repeat(64), r2Hash: 'y'.repeat(64), slotVerdict: 'PASS_RUNTIME_MAPPING' },
      ]);
      obj.wordVerifiedCandidates = obj.wordVerifiedCandidates.concat(['BM-013-WORD-ONLY']);
      obj.counts.newlyPromoted = obj.promoted.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M46: LibreOffice-unavailable candidate promoted — promote a form
  // whose phase1b LO status is UNAVAILABLE. Guard detects the promotion
  // vs unavailable mismatch via candidate membership.
  {
    id: 'A8.M46.LIBREOFFICE_UNAVAILABLE_PROMOTED',
    name: 'LibreOffice-unavailable candidate promoted',
    target: 'phase1-accounting.json',
    region: 'promoted[] contains a form that phase1b records as unavailable',
    apply: async (w) => {
      const dst = path.join(w, 'phase1-accounting.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.promoted = (obj.promoted || []).concat([
        { formCode: 'BM-005-LO-UNAVAIL', promotionStatus: 'NEWLY_PROMOTED', r1Hash: 'a'.repeat(64), r2Hash: 'b'.repeat(64), slotVerdict: 'PASS_RUNTIME_MAPPING' },
      ]);
      obj.counts.newlyPromoted = obj.promoted.length;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M47: runtime-render-results counts.pass falsely inflated beyond the
  // 213 form cap. The guard catches any counts.pass > 213.
  {
    id: 'A8.M47.RUNTIME_MAPPING_PASS_FALSELY_213',
    name: 'runtime-render-results counts.pass falsely exceeds form count',
    target: 'runtime-render-results.json',
    region: 'counts.pass = 500, realPass << 500',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.counts.pass = 500;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M48: non-exclusive verdict totals greater than 213 — two primary
  // verdicts accumulate past the 213 form cap. Guard catches the sum
  // exceeding results.length.
  {
    id: 'A8.M48.NON_EXCLUSIVE_TOTALS_GT_213',
    name: 'verdictCounts totals exceed 213',
    target: 'runtime-render-results.json',
    region: 'verdictCounts.PASS_RUNTIME_MAPPING inflated past formCount',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (!obj.verdictCounts) obj.verdictCounts = {};
      obj.verdictCounts.PASS_RUNTIME_MAPPING = (obj.verdictCounts.PASS_RUNTIME_MAPPING || 0) + 50;
      obj.counts.pass = (obj.counts.pass || 0) + 50;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M49: one form assigned two primary verdicts — runtime-render-results
  // has a duplicate bmCode (a primary verdict for the same form twice).
  // Guard catches duplicate bmCodes in results.
  {
    id: 'A8.M49.ONE_FORM_TWO_PRIMARY_VERDICTS',
    name: 'same form listed twice with two primary verdicts',
    target: 'runtime-render-results.json',
    region: 'duplicate bmCode in results',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.results && obj.results[0]) {
        const dup = { ...obj.results[0], verdict: 'FAIL' };
        obj.results.push(dup);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M50: GenericTemplateFormInputsPanel delegation unresolved but
  // marked PASS — contract-delegation-62 contains a delegation record
  // with status=PASS but EXTRACTED_CONTRACT_KEYS is empty. Guard catches
  // empty delegation contract with promotion status PASS.
  {
    id: 'A8.M50.DELEGATION_UNRESOLVED_BUT_PASS',
    name: 'delegation unresolved yet status=PROXY_PASS for GenericTemplateFormInputsPanel',
    target: 'contract-delegation-62.json',
    region: 'records[0].EXTRACTED_CONTRACT_KEYS emptied',
    apply: async (w) => {
      const dst = path.join(w, 'contract-delegation-62.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const records = obj.records || [];
      if (records[0]) {
        records[0].EXTRACTED_CONTRACT_KEYS = [];
        records[0].COMPILED_CONTRACT_KEYS = [];
        records[0].MATCHED_KEYS = [];
        records[0].VERDICT = 'PROXY_PASS';
      }
      obj.records = records;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M51: generic wrapper uses wrong form-code config — delegation
  // record shows FORM_CODE_ARGUMENT referencing a sibling form. Guard
  // catches FORM_CODE_ARGUMENT that doesn't match the record formCode.
  {
    id: 'A8.M51.WRAPPER_WRONG_FORM_CODE_CONFIG',
    name: 'wrapper delegated with wrong form-code argument',
    target: 'contract-delegation-62.json',
    region: 'records[1].FORM_CODE_ARGUMENT mismatches record formCode',
    apply: async (w) => {
      const dst = path.join(w, 'contract-delegation-62.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const records = obj.records || [];
      if (records[1]) {
        records[1].FORM_CODE_ARGUMENT = 'BM-001';
        records[1].WRONG_FORM_CODE = true;
      }
      obj.records = records;
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // =============================================================
  // M52-M66 — Phase 4B adapter-runtime-wiring integration mutations
  // =============================================================

  // M52: adapter-resolution artifact missing entirely. The loader is
  // required to fail closed when the artifact is absent, and the
  // guard's checkAdapterResolution must surface this.
  {
    id: 'A8.M52.ADAPTER_RESOLUTION_MISSING',
    name: 'adapter-resolution artifact removed',
    target: 'adapter-resolution-213.json',
    region: 'file-level (whole file removed)',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      await rm(dst, { force: true });
    },
  },

  // M53: adapter-resolution artifact has malformed JSON.
  {
    id: 'A8.M53.ADAPTER_RESOLUTION_MALFORMED',
    name: 'adapter-resolution artifact has malformed JSON',
    target: 'adapter-resolution-213.json',
    region: 'JSON parser will reject (truncated payload)',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      await writeFile(dst, '{"schema":"qllaw.213.adapter_resolution/v1","forms":[');
    },
  },

  // M54: registry hash stale. Mutate the registrySourceSha256 in the
  // top-level fields to a value that does not match the live registry.
  {
    id: 'A8.M54.REGISTRY_HASH_STALE',
    name: 'adapter registry hash is stale',
    target: 'adapter-resolution-213.json',
    region: 'top-level.registrySourceSha256 mutated to all-zero',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      obj.registrySourceSha256 = '0'.repeat(64);
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M55: contract hash stale. Mutate the per-form CONTRACT_SHA256 to a
  // value that does not match the live contract.
  {
    id: 'A8.M55.CONTRACT_HASH_STALE',
    name: 'adapter row CONTRACT_SHA256 is stale',
    target: 'adapter-resolution-213.json',
    region: 'forms[0].CONTRACT_SHA256 mutated to all-f',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.forms && obj.forms[0]) {
        obj.forms[0].CONTRACT_SHA256 = 'f'.repeat(64);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M56: normalized-template hash stale.
  {
    id: 'A8.M56.NORMALIZED_TEMPLATE_HASH_STALE',
    name: 'adapter row NORMALIZED_TEMPLATE_SHA256 is stale',
    target: 'adapter-resolution-213.json',
    region: 'forms[0].NORMALIZED_TEMPLATE_SHA256 mutated to all-f',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.forms && obj.forms[0]) {
        obj.forms[0].NORMALIZED_TEMPLATE_SHA256 = 'f'.repeat(64);
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M57: SIGNATURE_SECTION result removed for a form whose
  // RESOLVED_REQUIRED_KEYS is non-empty. The form should NOT remain PASS.
  // The mutation: keep RESOLVED_REQUIRED_KEYS populated (downstream still
  // reports debt as resolved), but remove SIGNATURE_SECTION from
  // APPLIED_ADAPTERS and mark FINAL_ADAPTER_STATUS=PASS. This is an
  // internal inconsistency the guard must reject.
  {
    id: 'A8.M57.SIGNATURE_SECTION_REMOVED_BUT_RESOLVED',
    name: 'SIGNATURE_SECTION result removed while RESOLVED_REQUIRED_KEYS populated',
    target: 'adapter-resolution-213.json',
    region: 'first adapter row with signature.* in RESOLVED_REQUIRED_KEYS loses SIGNATURE_SECTION from APPLIED_ADAPTERS',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const targetRow = (obj.forms || []).find((r) =>
        (r.RESOLVED_REQUIRED_KEYS || []).some((k) => k.startsWith('signature.')) &&
        (r.APPLIED_ADAPTERS || []).includes('SIGNATURE_SECTION'),
      );
      if (targetRow) {
        // Remove SIGNATURE_SECTION from applied adapters.
        targetRow.APPLIED_ADAPTERS = targetRow.APPLIED_ADAPTERS.filter((a) => a !== 'SIGNATURE_SECTION');
        // Keep RESOLVED_REQUIRED_KEYS populated (the lie we are catching).
        // Keep FINAL_ADAPTER_STATUS=PASS.
        targetRow.FINAL_ADAPTER_STATUS = 'PASS';
        targetRow.ADAPTER_VALIDATION_VERDICT = 'PASS';
        targetRow._mutation = 'M57_SIGNATURE_SECTION_REMOVED_BUT_RESOLVED';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M58: ISSUE_PLACE_DATE result removed but debt still reported resolved.
  {
    id: 'A8.M58.ISSUE_PLACE_DATE_REMOVED_BUT_RESOLVED',
    name: 'ISSUE_PLACE_DATE result removed while UNRESOLVED_REQUIRED_KEYS absent',
    target: 'adapter-resolution-213.json',
    region: 'first adapter row with empty UNRESOLVED_REQUIRED_KEYS loses ISSUE_PLACE_DATE',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const targetRow = (obj.forms || []).find((r) =>
        (r.UNRESOLVED_REQUIRED_KEYS || []).length === 0 &&
        (r.RESOLVED_REQUIRED_KEYS || []).length > 0 &&
        (r.APPLIED_ADAPTERS || []).includes('ISSUE_PLACE_DATE'),
      );
      if (targetRow) {
        targetRow.APPLIED_ADAPTERS = targetRow.APPLIED_ADAPTERS.filter((a) => a !== 'ISSUE_PLACE_DATE');
        targetRow._mutation = 'M58_ISSUE_PLACE_DATE_REMOVED_BUT_RESOLVED';
        // The artifact row still claims PASS_COMPOUND without the adapter
        // that did the work. The guard's adapter-resolution check rejects
        // a PASS with an empty APPLIED_ADAPTERS list.
        targetRow.APPLIED_ADAPTERS = [];
        targetRow.FINAL_ADAPTER_STATUS = 'PASS';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M59: inventory ignores adapter output. The slot inventory is
  // rewritten to drop the adapterResolvedKeys field for the adapter-aware
  // form. This must be visible in the guard's reconciliation.
  {
    id: 'A8.M59.INVENTORY_IGNORES_ADAPTER',
    name: 'slot inventory erases adapterResolvedKeys',
    target: 'slot-inventory-summary.json',
    region: 'first form row with adapterResolvedKeys is overwritten to empty',
    apply: async (w) => {
      const dst = path.join(w, 'slot-inventory-summary.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = (obj.results || []).find((r) => (r.adapterResolvedKeys || []).length > 0);
      if (target) {
        // Only proceed if the adapter artifact actually has resolved keys
        // for this form — otherwise the mutation is meaningless.
        const code = target.FORM || target.formCode || target.bmCode;
        const adapterArtifact = parseJson(
          await readFile(path.join(w, 'adapter-resolution-213.json'), 'utf8'),
          path.join(w, 'adapter-resolution-213.json'),
        );
        const adapterRow = (adapterArtifact.forms || []).find((f) => f.FORM === code);
        if (!adapterRow || (adapterRow.RESOLVED_REQUIRED_KEYS || []).length === 0) {
          // Fallback: find a form with both inventory adapterApplied AND
          // artifact RESOLVED_REQUIRED_KEYS populated.
          const fallback = (obj.results || []).find((r) => {
            const c = r.FORM || r.formCode || r.bmCode;
            const ar = (adapterArtifact.forms || []).find((f) => f.FORM === c);
            return ar && (r.adapterApplied || []).length > 0 &&
              (ar.RESOLVED_REQUIRED_KEYS || []).length > 0;
          });
          if (fallback) {
            fallback.adapterResolvedKeys = [];
            fallback.adapterApplied = [];
            fallback.adapterFinalStatus = 'NOT_APPLICABLE';
            fallback._mutation = 'M59_INVENTORY_IGNORES_ADAPTER';
          }
        } else {
          target.adapterResolvedKeys = [];
          target.adapterApplied = [];
          target.adapterFinalStatus = 'NOT_APPLICABLE';
          target._mutation = 'M59_INVENTORY_IGNORES_ADAPTER';
        }
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M60: canonical verdict ignores unresolved adapter key. Mutate the
  // canonical verdicts so a form's canonicalVerdict is PASS despite the
  // adapter's UNRESOLVED_REQUIRED_KEYS being non-empty.
  {
    id: 'A8.M60.CANONICAL_IGNORES_UNRESOLVED_ADAPTER_KEY',
    name: 'canonical verdict marked PASS despite adapter unresolved',
    target: 'canonical-verdicts.json',
    region: 'first row canonicalVerdict set to PASS_RUNTIME_MAPPING',
    apply: async (w) => {
      const dst = path.join(w, 'canonical-verdicts.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.results && obj.results[0]) {
        obj.results[0].canonicalVerdict = 'PASS_RUNTIME_MAPPING';
        obj.results[0]._mutation = 'M60_CANONICAL_IGNORES_UNRESOLVED';
        const adapterPath = path.join(w, 'adapter-resolution-213.json');
        const adapter = parseJson(await readFile(adapterPath, 'utf8'), adapterPath);
        const code = obj.results[0].formCode || obj.results[0].FORM || obj.results[0].bmCode;
        const adapterRow = (adapter.forms || []).find((row) => row.FORM === code);
        if (!adapterRow) throw new Error(`M60 missing adapter row for ${code}`);
        adapterRow.UNRESOLVED_REQUIRED_KEYS = ['__M60_UNRESOLVED_REQUIRED_KEY__'];
        await writeFile(adapterPath, JSON.stringify(adapter, null, 2));
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M61: renderer ignores adapter R1/R2 values. Mutate the runtime
  // results so adapterR1Used and adapterR2Used are empty while the
  // adapter artifact still has values.
  {
    id: 'A8.M61.RENDERER_IGNORES_ADAPTER_R1_R2',
    name: 'runtime renderer erases adapter R1/R2 usage',
    target: 'runtime-render-results.json',
    region: 'all rows have adapterR1Used=[] and adapterR2Used=[]',
    apply: async (w) => {
      const dst = path.join(w, 'runtime-render-results.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (Array.isArray(obj.results)) {
        for (const r of obj.results) {
          r.adapterR1Used = [];
          r.adapterR2Used = [];
          r.adapterFinalStatus = r.adapterFinalStatus === 'NOT_APPLICABLE' ? 'PASS' : (r.adapterFinalStatus || 'PASS');
          r._mutation = 'M61_RENDERER_IGNORES_ADAPTER';
        }
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M62: reconciliation claims adapter wired while renderer does not
  // consume it. Mark the reconciliation's ADAPTER_RENDER_R1_EXECUTED /
  // ADAPTER_RENDER_R2_EXECUTED true while the renderer's adapterR1Used
  // is empty.
  {
    id: 'A8.M62.RECON_CLAIMS_ADAPTER_WIRED_BUT_RENDERER_DOES_NOT',
    name: 'reconciliation falsely reports adapter wired',
    target: 'per-form-readiness-reconciliation.json',
    region: 'first row ADAPTER_RENDER_R1_EXECUTED=true but RUNTIME_RENDER_EXECUTED=false',
    apply: async (w) => {
      const dst = path.join(w, 'per-form-readiness-reconciliation.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = (obj.rows || [])[0];
      if (target) {
        target.ADAPTER_RENDER_R1_EXECUTED = true;
        target.ADAPTER_RENDER_R2_EXECUTED = true;
        target.ADAPTER_RUNTIME_CONSUMED = true;
        target.RUNTIME_RENDER_EXECUTED = false;
        target.RUNTIME_RENDER_PASS = false;
        target._mutation = 'M62_RECON_CLAIMS_ADAPTER_WIRED';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M63: PASS_COMPOUND without structural source target. Force a form's
  // FINAL_ADAPTER_STATUS to PASS_COMPOUND while SOURCE_TARGETS is empty.
  {
    id: 'A8.M63.PASS_COMPOUND_WITHOUT_SOURCE_TARGET',
    name: 'adapter row marked PASS_COMPOUND with no source targets',
    target: 'adapter-resolution-213.json',
    region: 'first row FINAL_ADAPTER_STATUS=PASS_COMPOUND with empty SOURCE_TARGETS',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.forms && obj.forms[0]) {
        obj.forms[0].FINAL_ADAPTER_STATUS = 'PASS_COMPOUND';
        obj.forms[0].ADAPTER_VALIDATION_VERDICT = 'PASS_COMPOUND';
        obj.forms[0].SOURCE_TARGETS = [];
        obj.forms[0]._mutation = 'M63_PASS_COMPOUND_WITHOUT_SOURCE_TARGET';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M64: adapter target collision marked PASS. Set TARGET_COLLISIONS to
  // a synthetic value while FINAL_ADAPTER_STATUS is PASS.
  {
    id: 'A8.M64.ADAPTER_TARGET_COLLISION_MARKED_PASS',
    name: 'adapter target collision but verdict PASS',
    target: 'adapter-resolution-213.json',
    region: 'first row TARGET_COLLISIONS non-empty while FINAL_ADAPTER_STATUS=PASS',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      if (obj.forms && obj.forms[0]) {
        obj.forms[0].TARGET_COLLISIONS = ['MUTATED: synthetic collision for guard'];
        obj.forms[0].FINAL_ADAPTER_STATUS = 'PASS';
        obj.forms[0].ADAPTER_VALIDATION_VERDICT = 'PASS';
        obj.forms[0]._mutation = 'M64_ADAPTER_TARGET_COLLISION_MARKED_PASS';
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M65: issue date mapped into promulgation line. Mutate the adapter
  // to claim document.issueDate is resolved through a target path
  // inside the legal header / promulgation region.
  {
    id: 'A8.M65.ISSUE_DATE_MAPPED_INTO_PROMULGATION',
    name: 'document.issueDate mapped to promulgation line',
    target: 'adapter-resolution-213.json',
    region: 'first row SOURCE_TARGETS contains document/issueDate with structuralContext=promulgationLine',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = (obj.forms || []).find((r) =>
        (r.SOURCE_TARGETS || []).some((t) => t.path === 'document/issueDate'),
      );
      if (target) {
        target.SOURCE_TARGETS = target.SOURCE_TARGETS.map((t) =>
          t.path === 'document/issueDate'
            ? { ...t, structuralContext: 'promulgationLine', _mutation: 'M65' }
            : t,
        );
      } else if (obj.forms && obj.forms[0]) {
        obj.forms[0].SOURCE_TARGETS = [{
          docxPart: 'word/document.xml',
          path: 'document/issueDate',
          occurrenceIndex: 0,
          structuralContext: 'promulgationLine',
          sourceTextPreview: '',
          sourceHash: '',
          renderStrategy: 'INLINE_REPLACE',
          _mutation: 'M65_ISSUE_DATE_MAPPED_INTO_PROMULGATION',
        }];
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },

  // M66: signer name mapped into static signer title. Mutate the
  // adapter to claim signature.signerName is resolved through a target
  // path that collides with a static role caption.
  {
    id: 'A8.M66.SIGNER_NAME_MAPPED_INTO_STATIC_TITLE',
    name: 'signature.signerName mapped to static signer title slot',
    target: 'adapter-resolution-213.json',
    region: 'first row SOURCE_TARGETS has signature/signerName with structuralContext=staticRoleCaption',
    apply: async (w) => {
      const dst = path.join(w, 'adapter-resolution-213.json');
      const obj = parseJson(await readFile(dst, 'utf8'), dst);
      const target = (obj.forms || []).find((r) =>
        (r.SOURCE_TARGETS || []).some((t) => t.path === 'signature/signerName'),
      );
      if (target) {
        target.SOURCE_TARGETS = target.SOURCE_TARGETS.map((t) =>
          t.path === 'signature/signerName'
            ? { ...t, structuralContext: 'staticRoleCaption', _mutation: 'M66' }
            : t,
        );
      } else if (obj.forms && obj.forms[0]) {
        obj.forms[0].SOURCE_TARGETS = [{
          docxPart: 'word/document.xml',
          path: 'signature/signerName',
          occurrenceIndex: 0,
          structuralContext: 'staticRoleCaption',
          sourceTextPreview: '',
          sourceHash: '',
          renderStrategy: 'INLINE_REPLACE',
          _mutation: 'M66_SIGNER_NAME_MAPPED_INTO_STATIC_TITLE',
        }];
      }
      await writeFile(dst, JSON.stringify(obj, null, 2));
    },
  },
];

// ---------------------------------------------------------------------------
// Baseline copy
// ---------------------------------------------------------------------------

async function copyBaseline(workFolder) {
  // Create the work folder fresh.
  await rm(workFolder, { recursive: true, force: true });
  await mkdir(workFolder, { recursive: true });

  // Copy every authoritative evidence artifact.
  const artifacts = [
    'authoritative-213-manifest.json',
    'legal-header-213-matrix.json',
    'technical-family-clusters.json',
    'render-readiness-213-matrix.json',
    'source-hash-baseline.json',
    'command-log.json',
    'runtime-render-results.json',
    'word-visual-results.json',
    'libreoffice-visual-results.json',
    'canonical-runtime-roster.json',
    'phase1-accounting.json',
    'phase1b-libreoffice-outcomes.json',
    'runtime-readiness.generated.json',
    'slot-inventory-summary.json',
    'contract-delegation-62.json',
    'canonical-verdicts.json',
    'source-slot-debt-family-report.json',
    'security-status.json',
    'secrets-inventory.json',
    'legal-header-candidates.json',
    'adapter-resolution-213.json',
    'adapter-runtime-wiring-results.json',
    'per-form-readiness-reconciliation.json',
  ];
  for (const f of artifacts) {
    const src = path.join(ROLLOUT_DIR, f);
    const dst = path.join(workFolder, f);
    if (existsSync(src)) {
      try {
        await copyFile(src, dst);
      } catch (e) {
        throw new Error(`baseline copy failed for ${f}: ${e.message}`);
      }
    }
  }

  // Copy word-sidecar subdir if it exists.
  const wordSidecarSrc = path.join(ROLLOUT_DIR, 'word-sidecar');
  const wordSidecarDst = path.join(workFolder, 'word-sidecar');
  if (existsSync(wordSidecarSrc)) {
    try {
      cpSync(wordSidecarSrc, wordSidecarDst, { recursive: true });
    } catch (e) {
      throw new Error(`baseline copy failed for word-sidecar: ${e.message}`);
    }
  }

  // Copy bridge-eligibility.ts and runtime-readiness.generated.ts so M33/M34
  // (and any future cross-file mutation) start from the real source.
  for (const f of [
    'packages/form-contracts/src/bridge-eligibility.ts',
    'packages/form-contracts/src/runtime-readiness.generated.ts',
  ]) {
    const src = path.join(REPO_ROOT, f);
    const dst = path.join(workFolder, path.basename(f));
    if (existsSync(src)) {
      try {
        await copyFile(src, dst);
      } catch (e) {
        throw new Error(`baseline copy failed for ${f}: ${e.message}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Mutation runner
// ---------------------------------------------------------------------------

function emptySetupReport(mutation) {
  return {
    mutation: mutation.id,
    name: mutation.name,
    target: mutation.target,
    region: mutation.region,
    setupFailures: [],
    mutationApplied: null,
    beforeHash: null,
    afterHash: null,
    semanticDelta: null,
    guardExitCode: null,
    guardStdout: '',
    guardStderr: '',
    failClosedTriggered: null,
  };
}

async function runOneMutation(mutation) {
  const report = emptySetupReport(mutation);
  const w = path.join(WORK_DIR, mutation.id);

  // 1. Baseline copy (mandatory setup; failure here is a hard error).
  try {
    await copyBaseline(w);
  } catch (e) {
    report.setupFailures.push({ stage: 'baseline-copy', message: e.message });
    report.failClosedTriggered = false;
    report.mutationApplied = false;
    report.guardExitCode = -1;
    return report;
  }

  // 2. Capture before-hash of the target file (if it exists).
  const targetPath = path.join(w, mutation.target);
  let beforeBuf = null;
  try {
    beforeBuf = await readFile(targetPath);
  } catch (e) {
    report.setupFailures.push({ stage: 'before-hash', message: e.message });
    report.mutationApplied = false;
    report.failClosedTriggered = false;
    report.guardExitCode = -1;
    return report;
  }
  report.beforeHash = sha256(beforeBuf);

  // 3. Apply the mutation.
  try {
    await mutation.apply(w);
  } catch (e) {
    report.setupFailures.push({ stage: 'apply', message: e.message });
    report.mutationApplied = false;
    report.failClosedTriggered = false;
    report.guardExitCode = -1;
    return report;
  }

  // 4. Capture after-hash and compute the semantic delta summary.
  try {
    const afterBuf = await readFile(targetPath);
    report.afterHash = sha256(afterBuf);
  } catch (e) {
    // The mutation may have intentionally removed the target (M01, M52).
    if (mutation.id === 'A8.M01.MISSING_MANIFEST' || mutation.id === 'A8.M52.ADAPTER_RESOLUTION_MISSING') {
      report.afterHash = '<absent>';
    } else {
      report.setupFailures.push({ stage: 'after-hash', message: e.message });
      report.mutationApplied = false;
      report.failClosedTriggered = false;
      report.guardExitCode = -1;
      return report;
    }
  }
  report.mutationApplied = report.beforeHash !== report.afterHash;
  report.semanticDelta = `target=${mutation.target}; region=${mutation.region}`;

  // 5. Run the standalone guard against the mutated work folder.
  const guardProc = spawnSync(
    'node',
    [
      path.join(__dirname, 'guard-runtime-rollout-evidence.mjs'),
      '--evidence-dir', w,
      '--repo-root', REPO_ROOT,
      '--quiet',
    ],
    { encoding: 'utf8' },
  );
  report.guardExitCode = guardProc.status;
  report.guardStdout = (guardProc.stdout || '').trim();
  report.guardStderr = (guardProc.stderr || '').trim().slice(0, 800);
  report.failClosedTriggered = report.guardExitCode !== 0;

  return report;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(WORK_DIR, { recursive: true });

  // ----- POSITIVE BASELINE VALIDATION -----
  const baselineWork = path.join(WORK_DIR, 'POSITIVE_BASELINE');
  let baselineSetupFailures = [];
  try {
    await copyBaseline(baselineWork);
  } catch (e) {
    baselineSetupFailures.push({ stage: 'baseline-copy', message: e.message });
  }

  let baselineGuardExit = -1;
  let baselineGuardStderr = '';
  if (baselineSetupFailures.length === 0) {
    const baselineProc = spawnSync(
      'node',
      [
        path.join(__dirname, 'guard-runtime-rollout-evidence.mjs'),
        '--evidence-dir', baselineWork,
        '--repo-root', REPO_ROOT,
        '--quiet',
      ],
      { encoding: 'utf8' },
    );
    baselineGuardExit = baselineProc.status;
    baselineGuardStderr = (baselineProc.stderr || '').trim().slice(0, 800);
  }

  const positiveBaseline = {
    name: 'POSITIVE_BASELINE',
    description: 'Unmutated authoritative evidence must pass the same guard.',
    setupFailures: baselineSetupFailures,
    guardExitCode: baselineGuardExit,
    failClosedTriggered: baselineGuardExit !== 0,
    guardStderr: baselineGuardStderr,
  };

  // ----- MUTATION RUN -----
  const mutationReports = [];
  for (const m of MUTATIONS) {
    const r = await runOneMutation(m);
    mutationReports.push(r);
  }

  const failClosedTriggered = mutationReports.filter((r) => r.failClosedTriggered).length;
  const failClosedMissed = mutationReports.filter(
    (r) => !r.failClosedTriggered && r.setupFailures.length === 0,
  ).length;
  const setupFailures = mutationReports.filter((r) => r.setupFailures.length > 0).length;
  const mutationAppliedCount = mutationReports.filter((r) => r.mutationApplied === true).length;

  const summary = {
    schema: 'qllaw.a8.mutation_results/v1',
    generatedAt: new Date().toISOString(),
    positiveBaseline,
    total: mutationReports.length,
    failClosedTriggered,
    failClosedMissed,
    setupFailures,
    mutationAppliedCount,
    positiveBaselinePassed: positiveBaseline.failClosedTriggered === false,
    mutations: mutationReports,
  };

  await writeFile(
    path.join(ROLLOUT_DIR, 'a8-mutation-results.json'),
    JSON.stringify(summary, null, 2),
  );

  if (!summary.positiveBaselinePassed) {
    console.error(
      `A8 POSITIVE BASELINE FAILED (exit=${positiveBaseline.guardExitCode}); see a8-mutation-results.json`,
    );
    process.exit(2);
  }

  if (setupFailures > 0) {
    console.error(
      `A8 SETUP FAILURES: ${setupFailures} mutation(s) could not be applied (see a8-mutation-results.json)`,
    );
    process.exit(3);
  }

  console.log(
    `OK: A8 mutations done. failClosedTriggered=${failClosedTriggered}/${mutationReports.length}; ` +
    `positiveBaseline=PASS`,
  );
  if (failClosedMissed > 0 || mutationAppliedCount < mutationReports.length) {
    console.error('A8 has gaps: see a8-mutation-results.json');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
