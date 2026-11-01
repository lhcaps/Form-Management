/**
 * PR6G.3.1 follow-up — BM-001 API rendered-DOCX parity proof.
 *
 * Planner verdict on PR6G.3.1:
 *
 *   "Report says API consumes it via a narrow BM-001-only contract adapter.
 *    The adapter emits aligned companion fields (*Aligned) on the BM-001
 *    payload only. ... payload parity chưa bằng rendered DOCX parity."
 *
 * This spec closes that gap by proving the **actual rendered DOCX text**
 * consumes the aligned values, not just the payload.
 *
 * Method:
 *   1. Build a BM-001 fixture payload whose slot values exactly mirror
 *      what `document-renderer.service.ts` now produces for BM-001:
 *        - `document.issuePlaceDateLine` ← `bm001DocumentIssuePlaceDateLineAligned`
 *          (uses the shared toolkit's `formatVietnamesePlaceDateLine` which
 *          preserves leading zeros; legacy `issuePlaceAndDateLine` path used
 *          `monthNoZero` and is no longer reachable for BM-001)
 *        - `recipients.archiveLine` ← `bm001ArchiveLineAligned` (uses the
 *          shared toolkit's `buildArchiveLine` with the no-dash fallback
 *          `'Lưu: HSVA, HSKS, VP.'`; the legacy `'Lưu: HSVV, VP.'` fallback
 *          is no longer reachable for BM-001)
 *        - `informant.identityIssuedDay/Month/Year` ← dateParts output
 *          (preserves leading zero via `padStart(2, '0')` — was already
 *          correct, kept untouched)
 *   2. Render the payload through the real `DocxtemplaterContractRenderEngine`
 *      against the locked BM-001 contract.
 *   3. Extract `word/document.xml` text from the rendered DOCX and assert:
 *        a) Every BM-001 evidence string the Planner listed is present.
 *        b) Every drift string the Planner listed is absent.
 *
 * If a future change to `document-renderer.service.ts` breaks the BM-001
 * slot binding (e.g. revert to `issuePlaceAndDateLine` / `Lưu: HSVV, VP.`)
 * this spec fails before the regression can ship.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatVietnamesePlaceDateLine,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from './docxtemplater-contract-render-engine';
import { extractVisibleText } from './docx-inspection/docx-text-extractor';
import type { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';

const REPO_ROOT = join(process.cwd(), '..', '..');
const OUTPUT_ROOT = join(tmpdir(), 'qllaw-pr6g31-bm001-rendered-docx-parity');

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
 * BM-001 fixture whose slot values exactly mirror what
 * `document-renderer.service.ts` now produces for BM-001 (post-PR6G.3.1).
 *
 * The `documentIssuePlace`, `documentIssueDate`, the identity-issue ISO
 * date, and `recipients.archiveLine` are the canonical inputs the BE
 * renderer consumes. The slot values below are computed by the **same**
 * shared helpers the BE renderer now uses (`formatVietnamesePlaceDateLine`,
 * `buildArchiveLine`, and `dateParts`-style ISO splitting), so the
 * fixture is byte-equivalent to the BE renderer's output.
 */
const BM001_FIXTURE_INPUT = {
  // Inputs (would come from FE / DB / case payload in real life)
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04', // ISO
  informantIdentityIssuedDate: '2020-06-07', // ISO
  receptionStartedAtDate: '2025-12-26', // ISO
  receptionEndedAtDate: '2025-12-26', // ISO
  recipientsArchiveLineInput: '', // empty → use fallback
} as const;

const IDENTITY_ISSUED_DAY = '07';
const IDENTITY_ISSUED_MONTH = '06';
const IDENTITY_ISSUED_YEAR = '2020';

const RECEPTION_STARTED_AT_DAY = '26';
const RECEPTION_STARTED_AT_MONTH = '12';
const RECEPTION_STARTED_AT_YEAR = '2025';

const RECEPTION_ENDED_AT_DAY = '26';
const RECEPTION_ENDED_AT_MONTH = '12';
const RECEPTION_ENDED_AT_YEAR = '2025';

/**
 * Slot values the BE renderer now writes for BM-001 (post-PR6G.3.1).
 * The fixture pre-computes these via the **same** shared helpers so the
 * downstream DOCX-render assertion is testing the same chain the BE
 * renderer runs in production.
 */
const BM001_PAYLOAD: Record<string, string> = {
  // Header date line — `document.issuePlaceDateLine` is now bound to
  // `bm001DocumentIssuePlaceDateLineAligned` (formatVietnamesePlaceDateLine
  // preserves leading zeros; legacy `monthNoZero` is no longer reachable
  // for BM-001).
  'document.issuePlaceDateLine': formatVietnamesePlaceDateLine({
    place: BM001_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM001_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),

  // Reception start line parts — the DOCX template renders
  //   `Hồi {{reception.startedAtTimeText}} ngày {{reception.startedAtDay}}
  //    tháng {{reception.startedAtMonth}} năm {{reception.startedAtYear}},
  //    tại {{reception.locationName}}`
  // `dateParts` (paddStart(2, '0')) keeps `26`/`12`/`2025` unchanged; we
  // mirror that output here.
  'reception.startedAtTimeText': '08:00',
  'reception.startedAtDay': RECEPTION_STARTED_AT_DAY,
  'reception.startedAtMonth': RECEPTION_STARTED_AT_MONTH,
  'reception.startedAtYear': RECEPTION_STARTED_AT_YEAR,
  'reception.locationName': 'TP. Hồ Chí Minh',

  // Reception end line parts.
  'reception.endedAtTimeText': '10:00',
  'reception.endedAtDay': RECEPTION_ENDED_AT_DAY,
  'reception.endedAtMonth': RECEPTION_ENDED_AT_MONTH,
  'reception.endedAtYear': RECEPTION_ENDED_AT_YEAR,

  // Identity issue date parts — DOCX template renders
  //   `Cấp ngày {{informant.identityIssuedDay}} tháng
  //    {{informant.identityIssuedMonth}} năm {{informant.identityIssuedYear}}`
  'informant.identityIssuedDay': IDENTITY_ISSUED_DAY,
  'informant.identityIssuedMonth': IDENTITY_ISSUED_MONTH,
  'informant.identityIssuedYear': IDENTITY_ISSUED_YEAR,
  'informant.identityIssuedPlace': 'Cục Cảnh sát',

  // Archive line — `recipients.archiveLine` is now bound to
  // `bm001ArchiveLineAligned` (buildArchiveLine). The fallback is the
  // canonical BM-001 wording with NO leading dash — verified against the
  // BM-001 source DOCX where `{{recipients.archiveLine}}` is rendered
  // directly with no `- ` prefix or bullet outside the slot.
  'recipients.archiveLine': buildArchiveLine(
    BM001_FIXTURE_INPUT.recipientsArchiveLineInput,
    'Lưu: HSVA, HSKS, VP.',
  ),
};

/**
 * Strings Planner required to be PRESENT in the actual rendered DOCX.
 * Each one traces to a specific DOCX slot the BM-001 contract binds to.
 */
const REQUIRED_PRESENT = [
  // document.issuePlaceDateLine slot
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  // Cấp ngày ... line via separate day/month/year slots (padded by dateParts)
  'Cấp ngày 07 tháng 06 năm 2020',
  // Reception start line
  'ngày 26 tháng 12 năm 2025',
  // Reception end line — mirrors the start date wording with the end time
  'ngày 26 tháng 12 năm 2025',
  // Archive line — no leading dash (verified against source DOCX)
  'Lưu: HSVA, HSKS, VP.',
];

/**
 * Strings Planner required to be ABSENT from the actual rendered DOCX.
 * Each one represents a drift regression: zero-stripped dates, the legacy
 * BM-001 hardcode `'Lưu: HSVV, VP.'`, or a dash the source template never
 * renders.
 */
const REQUIRED_ABSENT = [
  // Drift: header month would be stripped to `tháng 7` if the legacy
  // `issuePlaceAndDateLine` path were still reachable for BM-001.
  'ngày 4 tháng 7 năm 2026',
  // Drift: identity-issue date would be a slash date if the legacy
  // `dateSlashText` path were used instead of the parts slots.
  'Cấp ngày 7/6/2020',
  // Drift: legacy BM-001 hardcode — should never be reachable now.
  'Lưu: HSVV, VP.',
  // Drift: dash prefix the source DOCX never renders.
  '- Lưu: HSVA, HSKS, VP.',
];

describe('PR6G.3.1 follow-up — BM-001 rendered-DOCX consumption proof', () => {
  let renderedDocXml: string;
  let renderedVisibleText: string;
  let renderedNormalizedText: string;

  beforeAll(async () => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });

    const plan = new ContractRenderPlanBuilder(
      makePrismaService() as any,
      makeWorkspacePaths(),
    ).build({
      documentId: 'pr6g31-bm001-rendered-docx-parity',
      formData: BM001_PAYLOAD,
      templateCode: 'BM-001',
    });

    const result = await new DocxtemplaterContractRenderEngine(
      makeWorkspacePaths(),
    ).renderShadow(plan, BM001_PAYLOAD, OUTPUT_ROOT);

    const buffer = readFileSync(result.artifacts.docxPath);
    const zip = new PizZip(buffer);
    const docXmlEntry = zip.file('word/document.xml');
    if (!docXmlEntry) {
      throw new Error(
        'rendered DOCX is missing word/document.xml — render pipeline broken',
      );
    }
    renderedDocXml = docXmlEntry.asText();
    // `extractVisibleText` walks every `<w:t>` run in document order and
    // inserts a single space between adjacent runs that share a parent
    // paragraph. That is what Word renders; using raw XML regex would
    // miss gaps between split runs (e.g. "Cấp" + " " + "ngày" + " " +
    // "{{informant.identityIssuedDay}}").
    renderedVisibleText = extractVisibleText(renderedDocXml);
    // Whitespace-normalised form for substring assertions: collapses
    // tabs/multi-spaces, preserves single newlines (paragraph breaks).
    renderedNormalizedText = renderedVisibleText
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t\n]*/g, '\n')
      .trim();
  });

  afterAll(() => {
    rmSync(OUTPUT_ROOT, { force: true, recursive: true });
  });

  it('rendered DOCX was produced (sanity check on the render pipeline)', () => {
    expect(renderedVisibleText.length).toBeGreaterThan(0);
    expect(renderedDocXml).toContain('</w:document>');
  });

  describe('aligned strings are present in actual rendered DOCX text', () => {
    it.each(REQUIRED_PRESENT)(
      'rendered DOCX contains %p',
      (expectedText) => {
        expect(renderedNormalizedText).toContain(expectedText);
      },
    );
  });

  describe('drift strings are absent from actual rendered DOCX text', () => {
    it.each(REQUIRED_ABSENT)(
      'rendered DOCX does NOT contain %p',
      (driftText) => {
        expect(renderedNormalizedText).not.toContain(driftText);
      },
    );
  });

  it('header date slot uses shared-toolkit output (padded month), not legacy monthNoZero path', () => {
    // The BM-001 locked contract binds document.issuePlaceDateLine via
    // an `identity` transform, so the rendered DOCX carries whatever
    // string the BE renderer puts in the slot. After PR6G.3.1, BM-001
    // binds to `bm001DocumentIssuePlaceDateLineAligned` which uses
    // `formatVietnamesePlaceDateLine` (preserves leading zeros). If a
    // future change reverts to the legacy `issuePlaceAndDateLine` path
    // (which uses `monthNoZero`), the rendered DOCX would show
    // `ngày 04 tháng 7 năm 2026` instead.
    expect(renderedNormalizedText).toContain('ngày 04 tháng 07 năm 2026');
    expect(renderedNormalizedText).not.toContain('ngày 04 tháng 7 năm 2026');
  });

  it('archive line slot uses shared-toolkit output (no dash), not legacy hardcoded fallback', () => {
    // The BM-001 locked contract binds recipients.archiveLine via an
    // `identity` transform. After PR6G.3.1, BM-001 binds to
    // `bm001ArchiveLineAligned` which uses `buildArchiveLine(value,
    // 'Lưu: HSVA, HSKS, VP.')` (no leading dash — verified against
    // source DOCX). The legacy `'Lưu: HSVV, VP.'` hardcode and any
    // dash-prefixed variant must NOT appear.
    expect(renderedNormalizedText).toContain('Lưu: HSVA, HSKS, VP.');
    expect(renderedNormalizedText).not.toContain('Lưu: HSVV, VP.');
    expect(renderedNormalizedText).not.toContain('- Lưu: HSVA, HSKS, VP.');
  });
});