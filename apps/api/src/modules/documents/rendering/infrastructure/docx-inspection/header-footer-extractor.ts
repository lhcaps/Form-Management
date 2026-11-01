/**
 * PR6G.1 — DOCX Parts Inspection: header / footer part extractor.
 *
 * Headers and footers share the same XML structure (just different
 * root/child element names — `hdr`/`ftr`). Both live under
 * `word/header<N>.xml` / `word/footer<N>.xml`, where N is bounded by
 * `MAX_HEADER_FOOTER_PARTS` (we read up to 9 parts; Word supports up
 * to 9 distinct headers per section for first / odd / even variants,
 * and we never see more than 9 in practice).
 *
 * The extractor is also responsible for correlating each part to the
 * `Relationship Id` from `word/_rels/document.xml.rels` so the
 * downstream audit harness can answer "which section uses this
 * header?" without re-parsing the rels file itself.
 *
 * @module docx-inspection/header-footer-extractor
 */

import type { DocxHeaderFooterPart } from './docx-part-types';
import { extractVisibleText, normalizeWhitespace } from './docx-text-extractor';

/**
 * Maximum number of header/footer parts to scan. Word's section
 * properties allow at most three "real" header/footer types
 * (default/even/first) so 9 is a comfortable ceiling. We hard-code
 * rather than scan arbitrary numeric suffixes to keep the loop
 * deterministic for snapshots.
 */
export const MAX_HEADER_FOOTER_PARTS = 9;

interface DocxPartReader {
  /**
   * Read the textual content of a part by its part name (e.g.
   * "word/header1.xml"). Returns `undefined` when the part is absent.
   */
  readPartText(partName: string): string | undefined;
  /**
   * Read the rels for a given part. For headers/footers, we correlate
   * against `word/_rels/document.xml.rels` which is the canonical
   * rels file in DOCX. Returns an array of `<Relationship>` element
   * bodies (raw XML strings).
   */
  readDocumentRels(): ReadonlyArray<string>;
}

const REL_TARGET_RE = /\bTarget="([^"]+)"/u;
const REL_ID_RE = /\bId="([^"]+)"/u;
const REL_TYPE_RE = /\bType="([^"]+)"/u;

interface ParsedRel {
  id: string;
  target: string;
  type: string;
}

/** Parse a single `<Relationship …/>` element body. */
function parseRelationshipElement(relElement: string): ParsedRel | null {
  const idMatch = REL_ID_RE.exec(relElement);
  const targetMatch = REL_TARGET_RE.exec(relElement);
  const typeMatch = REL_TYPE_RE.exec(relElement);
  if (!idMatch || !targetMatch || !typeMatch) return null;
  return {
    id: idMatch[1] ?? '',
    target: targetMatch[1] ?? '',
    type: typeMatch[1] ?? '',
  };
}

/**
 * Build a `Map<targetPath, relId>` for every Relationship in the
 * document rels whose `Type` is `…/header` or `…/footer`. The map key
 * is the file path Word references (e.g. `header1.xml`); the value is
 * the `r:id` we will store on the header/footer part entry.
 */
function buildHeaderFooterRelIndex(
  relsXml: string | undefined,
): Map<string, string> {
  const index = new Map<string, string>();
  if (!relsXml) return index;
  // Accept both self-closing `<Relationship/>` and pair form. The Type
  // URL contains `/` so we cannot use a stricter `[^/>]` form.
  const re = /<Relationship\b[^>]*\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml)) !== null) {
    const parsed = parseRelationshipElement(m[0]);
    if (!parsed) continue;
    if (!/header|footer/iu.test(parsed.type)) continue;
    // Target paths can be `header1.xml` (relative) or `word/header1.xml`
    // (absolute within the package). Normalize to the basename form so
    // lookup is unambiguous.
    const targetName = parsed.target.split('/').pop() ?? parsed.target;
    index.set(targetName, parsed.id);
  }
  return index;
}

/**
 * Generic extractor for header or footer parts. The caller passes the
 * part-name prefix (`header` or `footer`) and the reader that knows
 * how to fetch part text + document rels.
 */
function extractHeaderOrFooterParts(
  kind: 'header' | 'footer',
  reader: DocxPartReader,
): DocxHeaderFooterPart[] {
  const out: DocxHeaderFooterPart[] = [];
  for (let i = 1; i <= MAX_HEADER_FOOTER_PARTS; i += 1) {
    const partName = `word/${kind}${i}.xml`;
    const xml = reader.readPartText(partName);
    if (xml === undefined) continue;
    const text = extractVisibleText(xml);
    out.push({
      partName,
      text,
      normalizedText: normalizeWhitespace(text),
    });
  }
  // Backfill the relationship id for each part so callers can correlate.
  const relXml = reader.readDocumentRels().join('\n');
  const relIndex = buildHeaderFooterRelIndex(relXml);
  for (const part of out) {
    const targetName = part.partName.split('/').pop() ?? part.partName;
    const relId = relIndex.get(targetName);
    if (relId) (part as { relationshipId?: string }).relationshipId = relId;
  }
  // Deterministic order: sort by part name (which is already
  // `word/header1.xml`, `word/header2.xml`, …, so lexical order is
  // numeric order).
  out.sort((a, b) => a.partName.localeCompare(b.partName));
  return out;
}

/**
 * Extract every header part. Returns an empty array when no
 * `word/header*.xml` parts exist.
 */
export function extractHeaders(reader: DocxPartReader): DocxHeaderFooterPart[] {
  return extractHeaderOrFooterParts('header', reader);
}

/**
 * Extract every footer part. Returns an empty array when no
 * `word/footer*.xml` parts exist.
 */
export function extractFooters(reader: DocxPartReader): DocxHeaderFooterPart[] {
  return extractHeaderOrFooterParts('footer', reader);
}
