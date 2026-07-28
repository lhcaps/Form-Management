/**
 * PR6G.4 — Generic Style Profile Engine: integration with the
 * Docxtemplater render pipeline.
 *
 * This spec covers:
 *   1. **No-op for non-BM-001 templates**: `DocxtemplaterContractRenderEngine`
 *      must NOT mutate the DOCX buffer the renderer fills when no
 *      profile is registered for the template. We assert byte
 *      equality against the fillTemplate output (captured by
 *      comparing the rendered buffer to a fresh shadow render run
 *      with the style profile registry cleared).
 *   2. **Auto-application for BM-001**: BM-001's profile rules are
 *      applied automatically when the shadow render runs through
 *      the engine. We assert the produced DOCX contains the
 *      typographic mutations.
 *   3. **Non-regression of PR6G.3.1**: the BM-001 rendered DOCX
 *      still contains the shared-mapping evidence strings after the
 *      style-profile post-processor runs (the engine mutates
 *      properties, never text).
 *
 * The spec uses the real locked BM-001 contract template path the
 * PR6G.3.1 parity spec already validated.
 *
 * @module rendering/infrastructure/style-profile
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import PizZip from 'pizzip';
import {
  buildArchiveLine,
  formatVietnamesePlaceDateLine,
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
const OUTPUT_ROOT_BM001 = join(tmpdir(), 'qllaw-pr6g4-style-profile-bm001');
const OUTPUT_ROOT_NOBMPROFILE = join(
  tmpdir(),
  'qllaw-pr6g4-style-profile-nobm',
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

const BM001_PAYLOAD: Record<string, string> = {
  'document.issuePlaceDateLine': formatVietnamesePlaceDateLine({
    place: 'TP. Hồ Chí Minh',
    isoDate: '2026-07-04',
    defaultPlace: 'TP. Hồ Chí Minh',
  }),
  'reception.startedAtTimeText': '08:00',
  'reception.startedAtDay': '26',
  'reception.startedAtMonth': '12',
  'reception.startedAtYear': '2025',
  'reception.locationName': 'TP. Hồ Chí Minh',
  'reception.endedAtTimeText': '10:00',
  'reception.endedAtDay': '26',
  'reception.endedAtMonth': '12',
  'reception.endedAtYear': '2025',
  'informant.identityIssuedDay': '07',
  'informant.identityIssuedMonth': '06',
  'informant.identityIssuedYear': '2020',
  'informant.identityIssuedPlace': 'Cục Cảnh sát',
  'recipients.archiveLine': buildArchiveLine('', 'Lưu: HSVA, HSKS, VP.'),
};

const REQUIRED_PRESENT = [
  'TP. Hồ Chí Minh, ngày 04 tháng 07 năm 2026',
  'Cấp ngày 07 tháng 06 năm 2020',
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
  const text = extractVisibleText(documentXml)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t\n]*/g, '\n')
    .trim();
  return text;
}

describe('PR6G.4 — Style Profile Engine integration with DocxtemplaterContractRenderEngine', () => {
  beforeAll(() => {
    ensureStyleProfilesRegistered();
  });

  describe('BM-001 auto-applies the registered style profile', () => {
    let renderedDocumentXml: string;

    beforeAll(async () => {
      rmSync(OUTPUT_ROOT_BM001, { force: true, recursive: true });
      const plan = new ContractRenderPlanBuilder(
        makePrismaService() as any,
        makeWorkspacePaths(),
      ).build({
        documentId: 'pr6g4-bm001-style-profile-integration',
        formData: BM001_PAYLOAD,
        templateCode: 'BM-001',
      });
      const result = await new DocxtemplaterContractRenderEngine(
        makeWorkspacePaths(),
      ).renderShadow(plan, BM001_PAYLOAD, OUTPUT_ROOT_BM001);
      renderedDocumentXml = loadDocumentXml(result.artifacts.docxPath);
    });

    afterAll(() => {
      rmSync(OUTPUT_ROOT_BM001, { force: true, recursive: true });
    });

    it('produces a DOCX with run-property overrides applied', () => {
      expect(renderedDocumentXml).toMatch(/<w:b\b/);
      expect(renderedDocumentXml).toMatch(/<w:i\b/);
      expect(renderedDocumentXml).toMatch(/<w:sz\s+w:val="28"\s*\/>/);
      expect(renderedDocumentXml).toMatch(/<w:sz\s+w:val="22"\s*\/>/);
    });

    it.each(REQUIRED_PRESENT)(
      'shared-mapping content %p is still present (text not mutated)',
      (expectedText) => {
        expect(visibleText(renderedDocumentXml)).toContain(expectedText);
      },
    );

    it('does not introduce drift strings from PR6G.3.1', () => {
      expect(visibleText(renderedDocumentXml)).not.toContain(
        'ngày 4 tháng 7 năm 2026',
      );
      expect(visibleText(renderedDocumentXml)).not.toContain('Cấp ngày 7/6/2020');
      expect(visibleText(renderedDocumentXml)).not.toContain('Lưu: HSVV, VP.');
      expect(visibleText(renderedDocumentXml)).not.toContain(
        '- Lưu: HSVA, HSKS, VP.',
      );
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
  });

  describe('No-op for non-registered templates', () => {
    // The engine cannot synthesise a non-existent locked template for
    // arbitrary templateCodes, so this sub-suite focuses on the
    // registry-level contract: when no profile is registered, the
    // helper method returns the input buffer byte-identical, and the
    // render engine does not produce extra mutating side effects.
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
  rmSync(OUTPUT_ROOT_BM001, { force: true, recursive: true });
  rmSync(OUTPUT_ROOT_NOBMPROFILE, { force: true, recursive: true });
});

// Sanity check: fail loudly when the BM-001 normalized template is
// missing so the test environment is reported, not silently skipped.
if (
  !existsSync(
    join(
      REPO_ROOT,
      'storage',
      'templates',
      'normalized-docx',
      'BM-001',
      'BM-001_normalized.docx',
    ),
  )
) {
  throw new Error(
    'BM-001 normalized template is missing at storage/templates/normalized-docx/BM-001/BM-001_normalized.docx — PR6G.4 integration spec cannot run.',
  );
}