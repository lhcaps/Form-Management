import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as ExcelJS from 'exceljs';
import { ImportFilePolicyService } from './import-file-policy.service';

describe('ImportFilePolicyService', () => {
  it('rejects a PDF whose extension claims it is a DOCX', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qllaw-import-policy-'));
    const filePath = path.join(dir, 'spoofed.docx');
    await fs.promises.writeFile(filePath, Buffer.from('%PDF-1.7\n'));

    try {
      await expect(
        new ImportFilePolicyService(async () => ({ mime: 'application/pdf' })).validate(filePath, '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      ).resolves.toMatchObject({ accepted: false, reasonCode: 'SIGNATURE_MISMATCH' });
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });

  it('accepts a valid XLSX office package', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qllaw-import-policy-'));
    const filePath = path.join(dir, 'valid.xlsx');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Sheet 1').addRow(['Mã hồ sơ']);
    await workbook.xlsx.writeFile(filePath);

    try {
      await expect(
        new ImportFilePolicyService(async () => ({ mime: 'application/zip' })).validate(filePath, '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      ).resolves.toMatchObject({ accepted: true });
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects a valid signature when the supplied MIME claims another format', async () => {
    const policy = new ImportFilePolicyService(async () => ({
      mime: 'application/pdf',
    }));

    await expect(
      policy.validate('ignored.pdf', '.pdf', 'image/png'),
    ).resolves.toMatchObject({
      accepted: false,
      reasonCode: 'SIGNATURE_MISMATCH',
    });
  });

  it('rejects a malformed Office ZIP without exposing archive internals', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qllaw-import-policy-'));
    const filePath = path.join(dir, 'broken.docx');
    await fs.promises.writeFile(filePath, Buffer.from('PK\x03\x04broken'));

    try {
      await expect(
        new ImportFilePolicyService(async () => ({ mime: 'application/zip' })).validate(filePath, '.docx', null),
      ).resolves.toMatchObject({ accepted: false, reasonCode: 'INVALID_OFFICE_ARCHIVE' });
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });
});
