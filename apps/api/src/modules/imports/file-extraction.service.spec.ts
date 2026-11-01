import * as ExcelJS from 'exceljs';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { FileExtractionService } from './file-extraction.service';
import { ImportFilePolicyService } from './import-file-policy.service';

const permissivePolicy = new ImportFilePolicyService(async () => ({ mime: 'application/zip' }));

describe('FileExtractionService', () => {
  it('rejects legacy .xls input instead of sending it through an unpatched parser', async () => {
    const result = await new FileExtractionService(permissivePolicy).extractFile(
      'missing-legacy.xls',
      '.xls',
      'application/vnd.ms-excel',
    );

    expect(result.extractionStatus).toBe('REJECTED');
    expect(result.errorMessage).toBe('Định dạng tệp không được hỗ trợ.');
  });

  it('extracts XLSX data through the maintained parser', async () => {
    const dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'qllaw-xlsx-'),
    );
    const filePath = path.join(dir, 'cases.xlsx');
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Hồ sơ').addRows([
      ['Mã hồ sơ', 'Tên vụ án'],
      ['HS-2026-001', 'Vụ án kiểm thử'],
    ]);
    await workbook.xlsx.writeFile(filePath);

    try {
      const result = await new FileExtractionService(permissivePolicy).extractFile(
        filePath,
        '.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      expect(result.extractionStatus).toBe('PARSED');
      expect(result.totalRows).toBe(1);
      expect(result.parsedJson).toMatchObject({
        kind: 'table',
        sheetNames: ['Hồ sơ'],
        tables: [
          {
            headers: ['Mã hồ sơ', 'Tên vụ án'],
            rows: [
              {
                'Mã hồ sơ': 'HS-2026-001',
                'Tên vụ án': 'Vụ án kiểm thử',
              },
            ],
          },
        ],
      });
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });

  it('fails a JSON document beyond the bounded nesting depth without returning parser internals', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qllaw-json-'));
    const filePath = path.join(dir, 'deep.json');
    let deep: unknown = 'leaf';
    for (let index = 0; index < 34; index += 1) deep = { nested: deep };
    await fs.promises.writeFile(filePath, JSON.stringify(deep));

    try {
      const result = await new FileExtractionService(
        new ImportFilePolicyService(async () => undefined),
      ).extractFile(filePath, '.json', 'application/json');
      expect(result.extractionStatus).toBe('FAILED');
      expect(result.errorMessage).toBe('Không thể trích xuất dữ liệu từ tệp này.');
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });
});
