import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import PizZip from 'pizzip';
import { DocumentPdfService } from './document-pdf.service';

function createDocxBuffer(bodyXml: string): Buffer {
  const zip = new PizZip();
  zip.file(
    'word/document.xml',
    [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
      '<w:body>',
      bodyXml,
      '</w:body>',
      '</w:document>',
    ].join(''),
  );

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function createService(tempDir: string, prisma: any = {}): DocumentPdfService {
  return new DocumentPdfService(
    prisma as never,
    {} as never,
    {
      loadNormalizedConfigForDocumentId: jest.fn().mockResolvedValue({
        config: {},
        warnings: [],
      }),
      hasEnabledCustomizations: jest.fn().mockReturnValue(false),
    } as never,
    {
      repoRoot: tempDir,
    } as never,
    {
      libreOfficePath: null,
    } as never,
  );
}

describe('DocumentPdfService export integrity guards', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qllaw-pdf-export-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('rejects DOCX sources that still contain unresolved placeholders', () => {
    const docxPath = path.join(tempDir, 'unresolved.docx');
    fs.writeFileSync(
      docxPath,
      createDocxBuffer('<w:p><w:r><w:t>{{agency.name}}</w:t></w:r></w:p>'),
    );
    const service = createService(tempDir) as any;

    expect(() =>
      service.assertDocxSourceReadyForPdf(docxPath, '42'),
    ).toThrow(BadRequestException);
    expect(() =>
      service.assertDocxSourceReadyForPdf(docxPath, '42'),
    ).toThrow(/unresolved placeholder/);
  });

  it('rejects DOCX sources that contain undefined or null visible literals', () => {
    const docxPath = path.join(tempDir, 'literal.docx');
    fs.writeFileSync(
      docxPath,
      createDocxBuffer('<w:p><w:r><w:t>Gia tri undefined</w:t></w:r></w:p>'),
    );
    const service = createService(tempDir) as any;

    expect(() =>
      service.assertDocxSourceReadyForPdf(docxPath, '42'),
    ).toThrow(/invalid literal undefined/);
  });

  it('accepts a rendered DOCX source with no placeholder residue', () => {
    const docxPath = path.join(tempDir, 'rendered.docx');
    fs.writeFileSync(
      docxPath,
      createDocxBuffer('<w:p><w:r><w:t>Vien kiem sat nhan dan</w:t></w:r></w:p>'),
    );
    const service = createService(tempDir) as any;

    expect(() =>
      service.assertDocxSourceReadyForPdf(docxPath, '42'),
    ).not.toThrow();
  });

  it('rejects non-PDF output even when a non-empty file exists', () => {
    const pdfPath = path.join(tempDir, 'fake.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('not a pdf'));
    const service = createService(tempDir) as any;

    expect(() =>
      service.assertPdfOutputIntegrity(pdfPath, null, 'test convert'),
    ).toThrow(/không phải PDF/);
  });

  it('rejects PDF output that is missing an EOF marker', () => {
    const pdfPath = path.join(tempDir, 'missing-eof.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.7\nbody'));
    const service = createService(tempDir) as any;

    expect(() =>
      service.assertPdfOutputIntegrity(pdfPath, null, 'test convert'),
    ).toThrow(/EOF marker/);
  });

  it('does not mark a PDF final when conversion writes an invalid PDF file', async () => {
    const sourceDocxPath = path.join(tempDir, 'source.docx');
    fs.writeFileSync(
      sourceDocxPath,
      createDocxBuffer('<w:p><w:r><w:t>Noi dung da render</w:t></w:r></w:p>'),
    );

    const generatedDocument = {
      id: 42n,
      case_id: 7n,
      document_title: 'BM test',
      generated_by_name: 'Tester',
      review_status: 'DRAFT',
    };
    const latestDocx = {
      id: 9n,
      file_format: 'DOCX',
      file_name: 'source.docx',
      file_path: 'source.docx',
      file_size_bytes: 123n,
      checksum: 'abc',
      is_final: true,
    };
    const prisma = {
      generated_documents: {
        findUnique: jest.fn().mockResolvedValue(generatedDocument),
        update: jest.fn(),
      },
      generated_document_files: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(latestDocx),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      cases: {
        findUnique: jest.fn().mockResolvedValue({ case_code: 'CASE-7' }),
      },
      stored_files: {
        create: jest.fn(),
      },
      case_events: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const service = createService(tempDir, prisma);

    jest
      .spyOn(service as any, 'convertDocxToPdf')
      .mockImplementation(async (_docxPath: string, pdfPath: string) => {
        fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        fs.writeFileSync(pdfPath, Buffer.from('not a pdf'));
      });

    await expect(
      service.convertLatestDocxToPdf('42', { force: true }),
    ).rejects.toThrow(/PDF/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
