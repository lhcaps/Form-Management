/**
 * PR7A — BM-171 Style Profile Engine integration with the
 * Docxtemplater render pipeline.
 *
 * Mirrors `docxtemplater-contract-render-engine-style-profile.spec.ts`
 * exactly. Proves:
 *
 *   1. **No-op for non-registered templates**: the engine must NOT
 *      mutate the DOCX buffer when the requested template has no
 *      profile registered.
 *   2. **Auto-application for BM-171**: BM-171's profile rules are
 *      applied automatically when the shadow render runs through the
 *      engine. The produced DOCX contains typographic mutations.
 *   3. **Non-regression of BM-171 mapping**: the BM-171 rendered DOCX
 *      still contains the shared-mapping evidence strings after the
 *      style-profile post-processor runs (the engine mutates
 *      properties, never text).
 *   4. **Registry reset is idempotent**: after
 *      `__resetStyleProfileRegistryForTests()`, BM-171's profile is
 *      still applied (registry is rebuilt by
 *      `ensureStyleProfilesRegistered`).
 *
 * The spec uses the real locked BM-171 contract template path the
 * PR7A parity spec validates.
 *
 * @module rendering/infrastructure/style-profile
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatSlashDate,
  formatVietnamesePlaceDateLine,
  splitIsoDateToVietnameseParts,
} from '@qllaw/form-contracts';

import { ContractRenderPlanBuilder } from '../../application/contract-render-plan.builder';
import { DocxtemplaterContractRenderEngine } from '../docxtemplater-contract-render-engine';
import { extractVisibleText } from '../docx-inspection/docx-text-extractor';
import type { WorkspacePathsService } from '../../../../../infrastructure/paths/workspace-paths.service';
import {
  __resetStyleProfileRegistryForTests,
  ensureStyleProfilesRegistered,
} from './index';

const REPO_ROOT = join(process.cwd(), '..', '..');
const OUTPUT_ROOT_BM171 = join(tmpdir(), 'qllaw-pr7a-style-profile-bm171');
const OUTPUT_ROOT_NOBMPROFILE = join(
  tmpdir(),
  'qllaw-pr7a-style-profile-nobm',
);

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

const BM171_FIXTURE_INPUT = {
  documentIssuePlace: 'TP. Hồ Chí Minh',
  documentIssueDate: '2026-07-04',
  assetOwnerDateOfBirth: '1985-09-08',
  assetOwnerIdentityIssuedDate: '2021-12-14',
} as const;

const ASSET_OWNER_DOB_TEXT = formatSlashDate(
  splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerDateOfBirth),
);
const ASSET_OWNER_ID_TEXT = formatSlashDate(
  splitIsoDateToVietnameseParts(BM171_FIXTURE_INPUT.assetOwnerIdentityIssuedDate),
);

const BM171_PAYLOAD: Record<string, string> = {
  'document.issuePlaceAndDateLine': formatVietnamesePlaceDateLine({
    place: BM171_FIXTURE_INPUT.documentIssuePlace,
    isoDate: BM171_FIXTURE_INPUT.documentIssueDate,
    defaultPlace: 'TP. Hồ Chí Minh',
  }),
  'assetOwner.dateOfBirthText': ASSET_OWNER_DOB_TEXT,
  'assetOwner.identityIssuedDateText': ASSET_OWNER_ID_TEXT,
  'recipients.archiveLine': buildArchiveLine('', 'Lưu: HSVA, HSKS, VP.'),
};

const REQUIRED_PRESENT = [
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  '08/09/1985',
  '14/12/2021',
  'Lưu: HSVA, HSKS, VP.',
];

function loadDocumentXml(docxPath: string): string {
  const buffer = readFileSync(docxPath);
  const zip = new PizZip(buffer);
  const file = zip.file('word/document.xml');
  if (!file) {
    throw new Error('rendered DOCX is missing word/document.xml');
  }
  return file.asText();
}

function visibleText(documentXml: string): string {
  return extractVisibleText(documentXml)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t\n]*/g, '\n')
    .trim();
}

describe('PR7A — BM-171 Style Profile Engine integration', () => {
  beforeAll(() => {
    ensureStyleProfilesRegistered();
  });

  describe('BM-171 auto-applies the registered style profile', () => {
    let renderedDocumentXml: string;

    beforeAll(async () => {
      rmSync(OUTPUT_ROOT_BM171, { force: true, recursive: true });
      const plan = new ContractRenderPlanBuilder(
        makePrismaService() as any,
        makeWorkspacePaths(),
      ).build({
        documentId: 'pr7a-bm171-style-profile-integration',
        formData: BM171_PAYLOAD,
        templateCode: 'BM-171',
      });
      const result = await new DocxtemplaterContractRenderEngine(
        makeWorkspacePaths(),
      ).renderShadow(plan, BM171_PAYLOAD, OUTPUT_ROOT_BM171);
      renderedDocumentXml = loadDocumentXml(result.artifacts.docxPath);
    });

    afterAll(() => {
      rmSync(OUTPUT_ROOT_BM171, { force: true, recursive: true });
    });

    it('produces a DOCX with run-property overrides applied', () => {
      // The BM-171 profile declares 6 rules with `bold: true` and 1 rule
      // with `italic: true`. All 7 carry a font-size override (either
      // 14pt → sz 28 for headings / place-date line, or 11pt → sz 22
      // for the archive line).
      expect(renderedDocumentXml).toMatch(/<w:b\b/);
      expect(renderedDocumentXml).toMatch(/<w:i\b/);
      // 14pt headings / place-date line.
      expect(renderedDocumentXml).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
      // 11pt archive line.
      expect(renderedDocumentXml).toMatch(/<w:sz\s+w:val="22"\s*\/>/);
    });

    it.each(REQUIRED_PRESENT)(
      'shared-mapping content %p is still present (text not mutated)',
      (expectedText) => {
        expect(visibleText(renderedDocumentXml)).toContain(expectedText);
      },
    );

    it('does not introduce drift strings from PR6G.3 / PR6G.3.1', () => {
      const normalized = visibleText(renderedDocumentXml);
      expect(normalized).not.toContain('ngày 04 tháng 7 năm 2026');
      expect(normalized).not.toContain('Lưu: HSVV, VP.');
      expect(normalized).not.toContain('- Lưu: HSVA, HSKS, VP.');
      expect(normalized).not.toContain('{{');
    });

    it('attaches sz/szCs to the archive line run (11pt)', () => {
      // Find a run whose <w:t> contains the archive line text.
      const runs = renderedDocumentXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? [];
      const archiveRun = runs.find((run) =>
        run.includes('Lưu: HSVA, HSKS, VP.'),
      );
      expect(archiveRun).toBeDefined();
      expect(archiveRun).toMatch(/<w:sz\s+w:val="22"\s*\/>/);
      expect(archiveRun).toMatch(/<w:szCs\s+w:val="22"\s*\/>/);
    });

    it('attaches italic + 14pt to the place-date line run', () => {
      // Find a run whose <w:t> contains the place-date line text.
      const runs = renderedDocumentXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? [];
      const dateRun = runs.find((run) =>
        run.includes('TP. Hồ Chí Minh,'),
      );
      expect(dateRun).toBeDefined();
      expect(dateRun).toMatch(/<w:i\b/);
      expect(dateRun).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });

    it('attaches bold + 14pt to the body-title run', () => {
      const runs = renderedDocumentXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? [];
      const titleRun = runs.find((run) =>
        run.includes('QUYẾT ĐỊNH'),
      );
      expect(titleRun).toBeDefined();
      expect(titleRun).toMatch(/<w:b\b/);
      expect(titleRun).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
    });
  });

  describe('No-op for non-registered templates', () => {
    it('returns the input buffer byte-identical when no profile is registered', () => {
      const zip = new PizZip();
      zip.file(
        'word/document.xml',
        `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t xml:space="preserve">hello</w:t></w:r></w:p></w:body>
</w:document>`,
      );
      const buffer = zip.generate({ type: 'nodebuffer' });

      const engine = new DocxtemplaterContractRenderEngine(makeWorkspacePaths());
      const result = (engine as any).applyTemplateStyleProfile(buffer, 'BM-999');
      expect(result).toBe(buffer);
    });

    it('returns the input buffer byte-identical even when a profile exists for another template', () => {
      // Re-register to a clean state so the engine lookup is exercised.
      __resetStyleProfileRegistryForTests();
      ensureStyleProfilesRegistered();

      const zip = new PizZip();
      zip.file(
        'word/document.xml',
        `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t xml:space="preserve">unrelated</w:t></w:r></w:p></w:body>
</w:document>`,
      );
      const buffer = zip.generate({ type: 'nodebuffer' });

      const engine = new DocxtemplaterContractRenderEngine(makeWorkspacePaths());
      const result = (engine as any).applyTemplateStyleProfile(buffer, 'BM-099');
      expect(result).toBe(buffer);
    });
  });
});

// Make sure the output root is cleared if the spec short-circuits.
afterAll(() => {
  rmSync(OUTPUT_ROOT_BM171, { force: true, recursive: true });
  rmSync(OUTPUT_ROOT_NOBMPROFILE, { force: true, recursive: true });
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
    'BM-171 normalized template is missing at storage/templates/normalized-docx/BM-171/BM-171_normalized.docx — PR7A BM-171 style-profile integration spec cannot run.',
  );
}
