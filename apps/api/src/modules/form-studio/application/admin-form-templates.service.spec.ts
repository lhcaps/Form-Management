import PizZip from 'pizzip';
import { AdminFormTemplatesService } from './admin-form-templates.service';

function file(name: string, buffer: Buffer): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: buffer.length,
    destination: '',
    filename: name,
    path: '',
    buffer,
    stream: undefined as never,
  };
}

function checker() {
  const service = new AdminFormTemplatesService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return (
    service as unknown as {
      assertSupportedOfficeFile(input: Express.Multer.File): void;
    }
  ).assertSupportedOfficeFile.bind(service);
}

function expectErrorCode(action: () => void, code: string) {
  try {
    action();
    throw new Error(`Expected ${code}.`);
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe('Form Studio upload security', () => {
  it('accepts a minimal structurally valid DOCX package', () => {
    const zip = new PizZip();
    zip.file('[Content_Types].xml', '<Types/>');
    zip.file('word/document.xml', '<w:document/>');

    expect(() =>
      checker()(file('template.docx', zip.generate({ type: 'nodebuffer' }))),
    ).not.toThrow();
  });

  it('rejects extension spoofing and invalid package structure', () => {
    expectErrorCode(
      () => checker()(file('template.docx', Buffer.from('not-a-zip'))),
      'UNSUPPORTED_TEMPLATE_UPLOAD',
    );

    const zip = new PizZip();
    zip.file('[Content_Types].xml', '<Types/>');
    expectErrorCode(
      () =>
      checker()(file('template.docx', zip.generate({ type: 'nodebuffer' }))),
      'INVALID_DOCX_PACKAGE',
    );
  });

  it('blocks DOCX packages with an excessive part count', () => {
    const zip = new PizZip();
    zip.file('[Content_Types].xml', '<Types/>');
    zip.file('word/document.xml', '<w:document/>');
    for (let index = 0; index < 5000; index += 1) {
      zip.file(`word/media/item-${index}.txt`, 'x');
    }

    expectErrorCode(
      () =>
      checker()(file('template.docx', zip.generate({ type: 'nodebuffer' }))),
      'DOCX_ZIP_BOMB_BLOCKED',
    );
  });
});
