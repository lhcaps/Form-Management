import * as fs from 'node:fs';
import * as ExcelJS from 'exceljs';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import type { ImportTablePreviewRow } from './import.types';
import type {
  ImportParserRequest,
  ImportParserResult,
  ParsedTable,
} from './import-parser-worker.types';

const MAX_TABLE_ROWS = 10;
const MAX_TABLES = 20;
const MAX_ROWS_PER_SHEET = 100_000;
const MAX_COLUMNS_PER_SHEET = 256;
const MAX_JSON_DEPTH = 32;
const MAX_JSON_NODES = 100_000;

function cleanText(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .trim()
  );
}

function decodeText(buffer: Buffer): string {
  const attempts: BufferEncoding[] = ['utf8', 'utf16le', 'latin1'];

  for (const encoding of attempts) {
    const text = buffer.toString(encoding);
    if (!text.includes('\u0000')) return text;
  }

  return buffer.toString('utf8');
}

function detectDelimiterSample(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const delimiters = [',', ';', '\t', '|'];
  return (
    delimiters
      .map((delimiter) => ({
        delimiter,
        score: firstLine.split(delimiter).length,
      }))
      .sort((a, b) => b.score - a.score)[0]?.delimiter ?? ','
  );
}

function buildWorkbookPreview(workbook: ExcelJS.Workbook): {
  tables: ParsedTable[];
  totalRows: number;
} {
  if (workbook.worksheets.length > MAX_TABLES) {
    throw new Error('IMPORT_XLSX_WORKSHEET_LIMIT');
  }

  const tables: ParsedTable[] = [];
  let totalRows = 0;

  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > MAX_ROWS_PER_SHEET) {
      throw new Error('IMPORT_XLSX_ROW_LIMIT');
    }
    if (sheet.columnCount > MAX_COLUMNS_PER_SHEET) {
      throw new Error('IMPORT_XLSX_COLUMN_LIMIT');
    }

    const rawRows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        values[columnNumber - 1] = String(cell.text ?? cell.value ?? '').trim();
      });
      rawRows.push(values);
    });

    const headerRow = rawRows.shift() ?? [];
    const seenHeaders = new Map<string, number>();
    const headers = headerRow.map((value, index) => {
      const base = value || `Cột ${index + 1}`;
      const count = (seenHeaders.get(base) ?? 0) + 1;
      seenHeaders.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    });
    const dataRows = rawRows.filter((row) => row.some((value) => value.trim()));
    totalRows += dataRows.length;
    const rows: ImportTablePreviewRow[] = dataRows
      .slice(0, MAX_TABLE_ROWS)
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, row[index] ?? '']),
        ),
      );

    tables.push({
      sheetName: sheet.name,
      headers,
      rows,
      totalRows: dataRows.length,
    });
  }

  return { tables, totalRows };
}

function assertJsonLimits(
  value: unknown,
  depth = 0,
  nodes = { value: 0 },
): void {
  nodes.value += 1;
  if (depth > MAX_JSON_DEPTH) throw new Error('IMPORT_JSON_DEPTH_LIMIT');
  if (nodes.value > MAX_JSON_NODES) throw new Error('IMPORT_JSON_NODE_LIMIT');
  if (!value || typeof value !== 'object') return;
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    assertJsonLimits(child, depth + 1, nodes);
  }
}

function flattenTables(tables: ParsedTable[]): string {
  return cleanText(
    tables
      .flatMap((table) => [
        table.sheetName,
        table.headers.join(' | '),
        ...table.rows.map((row) => Object.values(row).join(' | ')),
      ])
      .join('\n'),
  );
}

export async function parseImportFile(
  request: ImportParserRequest,
): Promise<ImportParserResult> {
  switch (request.extension) {
    case '.pdf': {
      const parser = new PDFParse({
        data: await fs.promises.readFile(request.absolutePath),
      });
      try {
        const parsed = await parser.getText();
        const text = cleanText(parsed.text ?? '');
        return {
          kind: 'text',
          text,
          warnings: text
            ? []
            : ['PDF có thể là bản scan, chưa trích xuất được chữ.'],
        };
      } finally {
        await parser.destroy();
      }
    }
    case '.docx': {
      const parsed = await mammoth.extractRawText({
        path: request.absolutePath,
      });
      return {
        kind: 'text',
        text: cleanText(parsed.value ?? ''),
        warnings: (parsed.messages ?? [])
          .map((item) => item.message)
          .slice(0, 10),
      };
    }
    case '.xlsx': {
      const workbook = new ExcelJS.Workbook();
      const fileBuffer = await fs.promises.readFile(request.absolutePath);
      await workbook.xlsx.load(
        fileBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
      const preview = buildWorkbookPreview(workbook);
      return {
        kind: 'table',
        text: flattenTables(preview.tables),
        sheetNames: workbook.worksheets.map((sheet) => sheet.name),
        tables: preview.tables,
        totalRows: preview.totalRows,
      };
    }
    case '.csv': {
      const fileBuffer = await fs.promises.readFile(request.absolutePath);
      const content = decodeText(fileBuffer);
      const workbook = new ExcelJS.Workbook();
      await workbook.csv.readFile(request.absolutePath, {
        parserOptions: { delimiter: detectDelimiterSample(content) },
      });
      const preview = buildWorkbookPreview(workbook);
      return {
        kind: 'table',
        text: cleanText(content),
        sheetNames: workbook.worksheets.map((sheet) => sheet.name),
        tables: preview.tables,
        totalRows: preview.totalRows,
      };
    }
    case '.json': {
      const parsed = JSON.parse(
        await fs.promises.readFile(request.absolutePath, 'utf8'),
      ) as Record<string, unknown> | unknown[];
      assertJsonLimits(parsed);
      const pretty = JSON.stringify(parsed, null, 2);
      return {
        kind: 'json',
        pretty,
        topLevelKeys: Array.isArray(parsed)
          ? ['[array]']
          : Object.keys(parsed ?? {}).slice(0, 20),
      };
    }
  }
}
