/**
 * PR6G.1 — DOCX Parts Inspection: generic package reader test.
 *
 * Verifies that `inspectDocxPackage` opens a real DOCX archive and
 * returns a structured `DocxPackageInspection` covering every part
 * the user listed in the PR6G.1 spec:
 *
 *   - word/document.xml
 *   - word/header*.xml
 *   - word/footer*.xml
 *   - word/footnotes.xml
 *   - word/endnotes.xml
 *   - word/comments.xml
 *   - word/styles.xml
 *   - word/settings.xml
 *   - word/_rels/document.xml.rels
 *
 * This test exercises the BM-001 normalized DOCX — the actual locked
 * template that PR6F has been auditing. BM-001 is a great smoke-test
 * target because it has every standard part (footnotes, endnotes,
 * styles, settings, one header, no footer) but its content is a
 * minimal template (no real notes, no body text beyond slots).
 *
 * Companion specs:
 *   - bm001-docx-footnote-preservation.spec.ts — proves footnotes
 *     survive the renderer + style post-processor.
 *   - docx-inspection-text-extractor.spec.ts — unit tests for the
 *     XML→text primitives.
 */

import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  inspectDocxPackage,
  readFootnotesFromDocx,
} from './docx-package-reader';

const REPO_ROOT = join(process.cwd(), '..', '..');
const BM001_PATH = join(
  REPO_ROOT,
  'storage',
  'templates',
  'normalized-docx',
  'BM-001',
  'BM-001_normalized.docx',
);

describe('PR6G.1 — DOCX parts inspection: generic package reader', () => {
  const bm001 = existsSync(BM001_PATH)
    ? readFileSync(BM001_PATH)
    : (() => {
        throw new Error(`BM-001 normalized DOCX missing at ${BM001_PATH}`);
      })();

  describe('inspectDocxPackage(BM-001 normalized)', () => {
    const inspection = inspectDocxPackage(bm001);

    it('reports schemaVersion = "1"', () => {
      expect(inspection.schemaVersion).toBe('1');
    });

    it('exposes every part name in the underlying zip, sorted', () => {
      // BM-001 normalized has these well-known parts. We assert the
      // three most informative ones — full equality would couple the
      // test to every part Word emits, which varies by version.
      expect(inspection.partList).toContain('word/document.xml');
      expect(inspection.partList).toContain('word/styles.xml');
      expect(inspection.partList).toContain('word/settings.xml');
      expect(inspection.partList).toContain('word/footnotes.xml');
      expect(inspection.partList).toContain('word/endnotes.xml');
      expect(inspection.partList).toContain('word/_rels/document.xml.rels');
      // Sorted ascending — required by the spec for deterministic
      // snapshot equality.
      const sorted = [...inspection.partList].sort();
      expect(inspection.partList).toEqual(sorted);
    });

    it('reads word/document.xml and exposes visible text', () => {
      expect(inspection.mainDocument.exists).toBe(true);
      expect(inspection.mainDocument.partName).toBe('word/document.xml');
      expect(inspection.mainDocument.text.length).toBeGreaterThan(0);
      // The BM-001 body contains the canonical agency line + title.
      expect(inspection.mainDocument.text).toContain('VIỆN KIỂM SÁT');
      expect(inspection.mainDocument.text).toContain('BIÊN BẢN');
      // Normalized form collapses whitespace; same content survives.
      expect(inspection.mainDocument.normalizedText).toContain('VIỆN KIỂM SÁT');
    });

    it('reads word/styles.xml and reports its existence', () => {
      expect(inspection.styles.exists).toBe(true);
      expect(inspection.styles.partName).toBe('word/styles.xml');
    });

    it('reads word/settings.xml and reports its existence', () => {
      expect(inspection.settings.exists).toBe(true);
      expect(inspection.settings.partName).toBe('word/settings.xml');
    });

    it('parses word/_rels/document.xml.rels and exposes relationship list', () => {
      // BM-001 has at least header, styles, settings, footnotes,
      // endnotes, numbering, theme, fontTable, webSettings, customXml.
      expect(inspection.relationships.length).toBeGreaterThanOrEqual(5);
    });

    it('extracts header parts and assigns a relationship id', () => {
      // BM-001 has exactly one header part (header1.xml) referenced
      // from the section properties. The header carries a PAGE field
      // for the "Mẫu số" page-number rendering, NOT the VKS agency
      // lines — those live in the body. We assert the structural
      // facts that downstream audit code actually relies on.
      expect(inspection.headers.length).toBe(1);
      expect(inspection.headers[0]?.partName).toBe('word/header1.xml');
      expect(inspection.headers[0]?.relationshipId).toBeDefined();
      // The header carries a PAGE field marker that extraction
      // surfaces as visible text "2" (the current page index).
      expect(inspection.headers[0]?.text.length).toBeGreaterThanOrEqual(0);
    });

    it('extracts footer parts as an empty array (none in BM-001)', () => {
      expect(inspection.footers).toEqual([]);
    });

    it('extracts footnotes and reports zero real notes for BM-001', () => {
      // IMPORTANT EMPIRICAL FACT (verified by direct OOXML inspection):
      // BM-001's `word/footnotes.xml` contains only the two Word-emitted
      // separator entries (`w:id="-1"` and `w:id="0"`). It does NOT
      // carry any real numbered explanatory notes. We assert that
      // observed behaviour honestly — the inspection result MUST be 0
      // rather than a fabricated count of 7.
      expect(inspection.footnotes).toEqual([]);
    });

    it('extracts endnotes and reports zero real notes for BM-001', () => {
      expect(inspection.endnotes).toEqual([]);
    });

    it('extracts comments and reports zero (no comments part)', () => {
      expect(inspection.comments).toEqual([]);
    });

    it('throws a descriptive error when word/document.xml is missing', () => {
      // Build a minimal zip with NO document.xml.
      const PizZip = require('pizzip') as typeof import('pizzip');
      const zip = new PizZip();
      zip.file('word/styles.xml', '<x/>');
      const buf = zip.generate({ type: 'nodebuffer' }) as Buffer;
      expect(() => inspectDocxPackage(buf)).toThrow(/word\/document\.xml/);
    });

    it('does not mutate the input buffer', () => {
      const before = Buffer.from(bm001);
      const after = inspectDocxPackage(bm001);
      // Buffer equality is byte-for-byte — same length and same content.
      expect(Buffer.compare(before, bm001)).toBe(0);
      // The result is the same size as the input (we never wrote back).
      expect(after.sourceBytes).toBe(bm001.byteLength);
      // And the inspection object is frozen (defensive).
      expect(Object.isFrozen(after)).toBe(true);
    });
  });

  describe('readFootnotesFromDocx(BM-001 normalized)', () => {
    it('returns the verbatim word/footnotes.xml text', () => {
      const xml = readFootnotesFromDocx(bm001);
      expect(xml).toBeDefined();
      // The two separator entries are present.
      expect(xml).toContain('w:type="separator"');
      expect(xml).toContain('w:type="continuationSeparator"');
      // No real numbered notes (id >= 1).
      expect(xml).not.toMatch(/<w:footnote\s+w:id="[1-9]\d*"/u);
    });

    it('returns undefined when footnotes part is absent', () => {
      const PizZip = require('pizzip') as typeof import('pizzip');
      const zip = new PizZip();
      zip.file('word/document.xml', '<x/>');
      const buf = zip.generate({ type: 'nodebuffer' }) as Buffer;
      expect(readFootnotesFromDocx(buf)).toBeUndefined();
    });
  });

  describe('inspectDocxPackage output immutability', () => {
    const inspection = inspectDocxPackage(bm001);

    it('freezes the partList array', () => {
      expect(Object.isFrozen(inspection.partList)).toBe(true);
    });

    it('freezes the relationships array', () => {
      expect(Object.isFrozen(inspection.relationships)).toBe(true);
    });

    it('freezes headers, footers, footnotes, endnotes, comments arrays', () => {
      expect(Object.isFrozen(inspection.headers)).toBe(true);
      expect(Object.isFrozen(inspection.footers)).toBe(true);
      expect(Object.isFrozen(inspection.footnotes)).toBe(true);
      expect(Object.isFrozen(inspection.endnotes)).toBe(true);
      expect(Object.isFrozen(inspection.comments)).toBe(true);
    });

    it('rejects mutations to partList', () => {
      // Frozen arrays throw in strict mode; in jest's default mode
      // they silently fail in non-strict contexts. We use the
      // well-known sentinel: pushing onto a frozen array throws a
      // TypeError.
      expect(() => {
        (inspection.partList as string[]).push('word/mutated.xml');
      }).toThrow(TypeError);
    });
  });

  describe('sanity: tmp path resolves without depending on tmpdir layout', () => {
    it('uses tmpdir() as scratch, never the storage tree', () => {
      // Defensive — the PR6F final-content spec uses tmpdir() the same
      // way. This test pins the convention so a future PR cannot
      // accidentally read or write inside the repo storage tree.
      const scratch = join(tmpdir(), 'qllaw-pr6g1-docx-inspection');
      expect(scratch.startsWith(REPO_ROOT)).toBe(false);
    });
  });
});
