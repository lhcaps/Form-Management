import type { ImportTablePreviewRow } from './import.types';

export type ImportParserExtension =
  | '.pdf'
  | '.docx'
  | '.xlsx'
  | '.csv'
  | '.json';

export type ImportParserRequest = {
  absolutePath: string;
  extension: ImportParserExtension;
};

export type ParsedTable = {
  sheetName: string;
  headers: string[];
  rows: ImportTablePreviewRow[];
  totalRows: number;
};

export type ImportParserResult =
  | {
      kind: 'text';
      text: string;
      warnings: string[];
    }
  | {
      kind: 'table';
      text: string;
      sheetNames: string[];
      tables: ParsedTable[];
      totalRows: number;
    }
  | {
      kind: 'json';
      pretty: string;
      topLevelKeys: string[];
    };

export type ImportParserWorkerMessage =
  | {
      ok: true;
      result: ImportParserResult;
    }
  | {
      ok: false;
      reasonCode: string;
    };
