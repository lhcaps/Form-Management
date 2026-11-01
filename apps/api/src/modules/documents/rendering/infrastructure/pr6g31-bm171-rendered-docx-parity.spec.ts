/**
 * PR7A — BM-171 API rendered-DOCX parity proof.
 *
 * Mirrors `pr6g31-bm001-rendered-docx-parity.spec.ts` exactly. The
 * spec closes the gap between "payload has the toolkit-aligned
 * values" and "rendered DOCX actually consumes those values" by
 * reading back the rendered DOCX text and asserting on:
 *
 *   1. Aligned strings the BM-171 spec must contain
 *      (`document.issuePlaceAndDateLine`, `recipients.archiveLine`,
 *      identity-issue dates, asset-owner identity dates, etc.).
 *   2. Drift strings the BM-171 spec must NOT contain (placeholder
 *      leaks, legacy fallback strings, serialized `undefined` /
 *      `null` / `[object Object]` / `Invalid Date`).
 *   3. Shared-mapping content under PR7A: the
 *      `formatVietnamesePlaceDateLine` output is byte-identical to
 *      what BM-001 emits for the same input, proving the FE / BE
 *      toolkit reuse works for BM-171.
 *
 * If a future change to `document-renderer.service.ts` (or to the
 * BM-171 adapter pattern) breaks any of these assertions, the spec
 * fails before the regression can ship.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatIdentityIssueDateLine,
  formatSlashDate,
  formatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from './docxtemplater-contract-render-engine';
import { extractVisibleText } from './docx-inspection/docx-text-extractor';
import type { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';

const REPO_ROOT = join(process.cwd(), '..', '..');
const OUTPUT_ROOT = join(tmpdir(), 'qllaw-pr7a-bm171-rendered-docx-parity');

function makeWorkspacePaths(): WorkspacePathsService {
  return {
    contractsRoot: join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts'),
    normalizedTemplatesRoot: join(
      REPO_ROOT,
      'storage',
      'templates',
      'normalized-docx',
    ),
    repoRoot: REPO_ROOT,
  } as WorkspacePathsService;
}

function makePrismaService() {
  return { $connect: jest.fn(), $disconnect: jest.fn() } as unknown;
}

/**
 * BM-171 fixture inputs. Every date / archive value is pre-computed
 * via the SAME shared toolkit helpers the FE / BE renderer uses in
 * production — exactly the discipline PR6G.3.1 enforced for BM-001.
 */
const BM171_FIXTURE_INPUT = {
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04',
  assetOwnerDateOfBirth: '1985-09-08',
  assetOwnerIdentityIssuedDate: '2021-12-14',
  recipientsArchiveLineInput: '',
} as const;

// `assetOwner.dateOfBirthText` and `assetOwner.identityIssuedDateText`
// are text slots bound by identity transform; the locked BM-171
// contract expects slash-form (`dd/mm/yyyy`). We mirror the FE panel
// behaviour: extract the ISO day / month / year and format with
// `formatSlashDate`.
const ASSET_OWNER_DOB_PARTS = splitIsoDateToVietnameseParts(
  BM171_FIXTURE_INPUT.assetOwnerDateOfBirth,
);
const ASSET_OWNER_DOB_TEXT = formatSlashDate(ASSET_OWNER_DOB_PARTS);

const ASSET_OWNER_ID_PARTS = splitIsoDateToVietnameseParts(
  BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedDate,
);
const ASSET_OWNER_ID_TEXT = formatSlashDate(ASSET_OWNER_ID_PARTS);

// `assetOwner.identityIssuedDateText` is also exposed as the full
// "Căn cứ" / "cấp ngày" sentence in some legacy BM-001 / BM-171
// panels. The locked BM-171 contract's slot row is `identityIssuedDateText`
// of plain text type, so we only assert on the slash form (the
// `formatIdentityIssueDateLine` helper exists for the legacy BM-001
// path; we exercise it here only as a non-regression check).
const ASSET_OWNER_ID_DATE_LINE = formatIdentityIssueDateLine(
  BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedDate,
);

const BM171_PAYLOAD: Record<string, string> = {
  // Header date line — `document.issuePlaceAndDateLine` is a date
  // transform (alias of identity per contract-render-plan.builder).
  // The pre-formatted string is the toolkit output; the FE panel
  // emits this string verbatim.
  'document.issuePlaceAndDateLine': formatVietnamesePlaceDateLine({
    place: BM171_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM171_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),

  // Identity / birth-date slash forms — fed directly into the
  // identity-transform text slots.
  'assetOwner.dateOfBirthText': ASSET_OWNER_DOB_TEXT,
  'assetOwner.identityIssuedDateText': ASSET_OWNER_ID_TEXT,

  // Archive line — `recipients.archiveLine` is identity transform;
  // we pre-compute the canonical no-dash BM-171 wording using the
  // shared toolkit.
  'recipients.archiveLine': buildArchiveLine(
    BM171_FIXTURE_INPUT.recipientsArchiveLineInput,
    'Lưu: HSVA, HSKS, VP.',
  ),
};

/**
 * Strings the rendered BM-171 DOCX MUST contain (post-docxtemplater
 * fill + BM-171 style profile post-process).
 */
const REQUIRED_PRESENT = [
  // `document.issuePlaceAndDateLine` slot at P0019 — toolkit output
  // (leading zeros preserved).
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  // `assetOwner.dateOfBirthText` at P0036 — slash form.
  '08/09/1985',
  // `assetOwner.identityIssuedDateText` at P0040 — slash form.
  '14/12/2021',
  // `recipients.archiveLine` at P0049 — no leading dash.
  'Lưu: HSVA, HSKS, VP.',
];

/**
 * Drift strings the rendered BM-171 DOCX MUST NOT contain. These are
 * the canonical regressions PR6G.3 / PR6G.3.1 taught us to flag
 * unconditionally: placeholder leaks, serialised `undefined` / `null` /
 * `[object Object]` / `Invalid Date`, the BM-001 legacy archive
 * fallback, the zero-stripped date form, etc.
 *
 * PR7A.3 extended this list with the BM-171 drafter-note residue:
 * the `12 Ghi cụ thể cơ quan…` and `13 Ghi chức danh người ký` body
 * paragraphs. PR7A.2 triage proved these were never real Word
 * footnotes/endnotes (no `word/footnotes.xml`/`word/endnotes.xml`
 * part exists) and the locked contract does NOT bind P0080/P0081.
 * The Planner decision (Path B — MUST_SUPPRESS) routes these via
 * the BM-171 style profile's `dropParagraph` rules.
 */
const REQUIRED_ABSENT = [
  // Placeholder leak: any unresolved `{{...}}` for the slots in §3 of
  // the BM-171 intake report.
  '{{assetOwner.fullName}}',
  '{{document.issuePlaceAndDateLine}}',
  '{{recipients.archiveLine}}',
  // Drift: the legacy `monthNoZero` form would yield "ngày 04 tháng 7 năm 2026"
  // for the header date line.
  'ngày 04 tháng 7 năm 2026',
  // Drift: identity-issue date would be a slash date only if the legacy
  // `dateSlashText` path were used; the canonical BM-171 path keeps
  // separate day / month / year slots. We assert the slash form IS
  // present (REQUIRED_PRESENT) and the legacy hardcoded fallback is NOT.
  'Lưu: HSVV, VP.',
  '- Lưu: HSVA, HSKS, VP.',
  // Serialised unsafe values (PR6G.2 LEAKED_TOKEN_PATTERNS).
  'undefined',
  '[object Object]',
  'Invalid Date',
  '{{{',
  '}}}',
  // Empty Vietnamese date parts (zero-fill drift).
  'ngày  tháng  năm ',
  // PR7A.3 — drafter-note residue. The BM-171 normalized template
  // renders the drafter notes 12 and 13 as plain body `<w:p>`
  // paragraphs (NOT real footnotes/endnotes). PR7A.3's Path B
  // suppression routes them through the style-profile engine's
  // `dropParagraph` rules; if either of these leaks back into the
  // rendered DOCX, the suppression has regressed.
  '12 Ghi cụ thể cơ quan',
  '13 Ghi chức danh người ký',
];

describe('PR7A — BM-171 rendered-DOCX consumption proof', () => {
  let renderedDocXml: string;
  let renderedVisibleText: string;
  let renderedNormalizedText: string;

  beforeAll(async () => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });

    const plan = new ContractRenderPlanBuilder(
      makePrismaService() as any,
      makeWorkspacePaths(),
    ).build({
      documentId: 'pr7a-bm171-rendered-docx-parity',
      formData: BM171_PAYLOAD,
      templateCode: 'BM-171',
    });

    const result = await new DocxtemplaterContractRenderEngine(
      makeWorkspacePaths(),
    ).renderShadow(plan, BM171_PAYLOAD, OUTPUT_ROOT);

    const buffer = readFileSync(result.artifacts.docxPath);
    const zip = new PizZip(buffer);
    const docXmlEntry = zip.file('word/document.xml');
    if (!docXmlEntry) {
      throw new Error(
        'rendered DOCX is missing word/document.xml — render pipeline broken',
      );
    }
    renderedDocXml = docXmlEntry.asText();
    renderedVisibleText = extractVisibleText(renderedDocXml);
    renderedNormalizedText = renderedVisibleText
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t\n]*/g, '\n')
      .trim();
  });

  afterAll(() => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
  });

  it('renders a non-empty BM-171 DOCX (sanity check on the pipeline)', () => {
    expect(renderedVisibleText.length).toBeGreaterThan(0);
    expect(renderedDocXml).toContain('</w:document>');
  });

  describe('aligned strings are present in the actual rendered DOCX text', () => {
    it.each(REQUIRED_PRESENT)(
      'rendered DOCX contains %p',
      (expectedText) => {
        expect(renderedNormalizedText).toContain(expectedText);
      },
    );
  });

  describe('drift strings are absent from the actual rendered DOCX text', () => {
    it.each(REQUIRED_ABSENT)(
      'rendered DOCX does NOT contain %p',
      (driftText) => {
        expect(renderedNormalizedText).not.toContain(driftText);
      },
    );
  });

  it('BM-171 header date slot uses the shared-toolkit output (leading zeros preserved)', () => {
    // The locked BM-171 contract binds `document.issuePlaceAndDateLine`
    // via `date.issuePlaceDateLine` (alias of identity). The slot
    // value is whatever the FE panel emits. We pre-compute the
    // toolkit-aligned string (leading zeros preserved) and assert
    // the rendered DOCX shows the padded form, NOT the zero-stripped
    // form.
    expect(renderedNormalizedText).toContain('ngày 04 tháng 07 năm 2026');
    expect(renderedNormalizedText).not.toContain('ngày 04 tháng 7 năm 2026');
  });

  it('BM-171 archive-line slot uses the shared-toolkit output (no dash, no HSVV fallback)', () => {
    // The locked BM-171 contract binds `recipients.archiveLine` via
    // identity transform. The BM-171 canonical wording is
    // `'Lưu: HSVA, HSKS, VP.'` (NOT the BM-001 legacy `'Lưu: HSVV, VP.'`).
    // The toolkit's `buildArchiveLine(value, 'Lưu: HSVA, HSKS, VP.')`
    // produces the no-dash form. We assert BOTH that the canonical
    // form is present AND that no legacy form or dash-prefixed variant
    // is rendered.
    expect(renderedNormalizedText).toContain('Lưu: HSVA, HSKS, VP.');
    expect(renderedNormalizedText).not.toContain('Lưu: HSVV, VP.');
    expect(renderedNormalizedText).not.toContain('- Lưu: HSVA, HSKS, VP.');
  });

  it('BM-171 identity / birth-date slots consume slash-form strings directly', () => {
    // `assetOwner.dateOfBirthText` and `assetOwner.identityIssuedDateText`
    // are text slots bound by identity transform. The FE panel feeds
    // pre-formatted `dd/mm/yyyy` strings (via `formatSlashDate`) so
    // the rendered DOCX carries the same wording verbatim.
    expect(renderedNormalizedText).toContain('08/09/1985');
    expect(renderedNormalizedText).toContain('14/12/2021');
    // `formatIdentityIssueDateLine` is the legacy BM-001 helper that
    // composes a full `Cấp ngày ... tháng ... năm ...` sentence; it
    // is shared with BM-171's toolkit but the locked BM-171 contract
    // emits identity-form slot values, so the rendered DOCX carries
    // the literal value. We only assert the helper itself works
    // (proves the toolkit is still consumed; not a regression) — the
    // rendered DOCX may or may not contain this exact sentence
    // depending on how the BM-171 DOCX template composes its date
    // text, so this assertion lives in a single `it(...)` rather
    // than the REQUIRED_PRESENT loop above.
    expect(ASSET_OWNER_ID_DATE_LINE).toBe('Cấp ngày 14 tháng 12 năm 2021');
  });

  describe('PR7A.3 — paragraph suppression', () => {
    /**
     * PR7A.3 asserted BM-171's rendered DOCX must NOT carry the
     * `12 Ghi cụ thể cơ quan…` or `13 Ghi chức danh người ký`
     * drafter-note paragraphs. The path-B suppression rules in
     * `BM171_STYLE_PROFILE` (`drop_drafter_note_12`,
     * `drop_drafter_note_13`, `drop_tail_between_archive_and_drafter_notes`,
     * `drop_legal_basis_blank_block`) remove them at render time.
     */
    it('drafter note 12 (12 Ghi cụ thể cơ quan) is absent from the rendered DOCX', () => {
      expect(renderedNormalizedText).not.toContain('12 Ghi cụ thể cơ quan');
    });

    it('drafter note 13 (13 Ghi chức danh người ký) is absent from the rendered DOCX', () => {
      expect(renderedNormalizedText).not.toContain('13 Ghi chức danh người ký');
    });

    it('archive line is still present (suppression is scoped to drafter notes)', () => {
      expect(renderedNormalizedText).toContain('Lưu: HSVA, HSKS, VP.');
    });

    it('recipient heading Nơi nhận is still present (layout intact)', () => {
      expect(renderedNormalizedText).toContain('Nơi nhận:');
    });

    it('paragraph count in body decreased (37 + 9 empties removed)', () => {
      // PR7A.2 baseline paragraph count for the canonical render
      // was 95; after PR7A.3 suppression the count must be smaller.
      // We assert the delta range rather than an exact value so
      // future template content tweaks don't cause flakiness.
      const paragraphCount = (renderedDocXml.match(/<w:p\b/g) ?? []).length;
      expect(paragraphCount).toBeGreaterThan(0);
      expect(paragraphCount).toBeLessThan(95);
    });

    it('no visible superscript <w:vertAlign val="superscript"/> run remains on a drafter-note shape', () => {
      // Belt-and-braces: the `<w:vertAlign w:val="superscript"/>`
      // marker is the ONLY structural signature of the drafter-note
      // paragraphs. PR7A.3 removes the drafter-note paragraphs
      // entirely; if the rule regressed, at least one such marker
      // would remain in the body. The header/footer/title headings
      // don't carry `vertAlign`, so a body-level superscript run is
      // an unambiguous regression signal.
      const superscriptMatches =
        renderedDocXml.match(/<w:vertAlign\s+w:val="superscript"/g) ?? [];
      expect(superscriptMatches.length).toBe(0);
    });
  });
});

// Sanity check: fail loudly when the BM-171 normalized template is
// missing so the test environment is reported, not silently skipped.
if (
  !existsSync(
    join(
      REPO_ROOT,
      'storage',
      'templates',
      'normalized-docx',
      'BM-171',
      'BM-171_normalized.docx',
    ),
  )
) {
  throw new Error(
    'BM-171 normalized template is missing at storage/templates/normalized-docx/BM-171/BM-171_normalized.docx — PR7A integration spec cannot run.',
  );
}
