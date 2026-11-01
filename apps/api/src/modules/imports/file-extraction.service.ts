import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import {
  type CandidateConfidence,
  type ImportDetectedCandidate,
  type ImportDetectedColumn,
  type ImportExtractionResult,
  type ImportTablePreview,
} from './import.types';
import { ImportFilePolicyService } from './import-file-policy.service';
import { ImportParserWorkerService } from './import-parser-worker.service';
import type { ImportParserResult } from './import-parser-worker.types';

const MAX_TEXT_LENGTH = 250_000;
const MAX_PREVIEW_TEXT_LENGTH = 4_000;

type CandidateSeed = Omit<ImportDetectedCandidate, 'id'>;

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function cleanText(value: string): string {
  return (
    value
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .trim()
  );
}

function snippetAround(source: string, index: number, length: number): string {
  const start = Math.max(0, index - 28);
  const end = Math.min(source.length, index + length + 28);

  return source.slice(start, end).replace(/\s+/g, ' ').trim();
}

function pushCandidate(
  bucket: Map<string, ImportDetectedCandidate>,
  candidate: CandidateSeed,
): void {
  const value = candidate.value.trim();

  if (!value) {
    return;
  }

  const key = `${candidate.type}:${value.toLocaleLowerCase('vi-VN')}`;

  if (bucket.has(key)) {
    return;
  }

  bucket.set(key, {
    id: `cand_${bucket.size + 1}`,
    ...candidate,
    value,
  });
}

function detectColumns(headers: string[]): ImportDetectedColumn[] {
  const mappings: Array<{
    matcher: RegExp;
    mappedField: string;
    confidence: CandidateConfidence;
  }> = [
    {
      matcher: /m[aã]\s*h[ồo]\s*s[ơo]|case\s*code/i,
      mappedField: 'Mã hồ sơ',
      confidence: 'cao',
    },
    {
      matcher: /t[eê]n\s*v[ụu]\s*[áa]n|case\s*title/i,
      mappedField: 'Tên vụ án',
      confidence: 'cao',
    },
    {
      matcher: /b[ịi]\s*can|ng[ườu]i\s*li[êe]n\s*quan|h[ọo]\s*t[êe]n/i,
      mappedField: 'Tên bị can/người liên quan',
      confidence: 'vừa',
    },
    {
      matcher: /t[ộo]i\s*danh|t[ộo]i/i,
      mappedField: 'Tội danh',
      confidence: 'vừa',
    },
    {
      matcher: /ng[aà]y|date/i,
      mappedField: 'Ngày',
      confidence: 'thấp',
    },
    {
      matcher: /c[ơo]\s*quan|đ[ơo]n\s*v[ịi]|agency/i,
      mappedField: 'Cơ quan',
      confidence: 'thấp',
    },
    {
      matcher: /đ[ịi]a\s*ch[ỉi]|address/i,
      mappedField: 'Địa chỉ',
      confidence: 'thấp',
    },
  ];

  return headers
    .map((header, index) => {
      const matched = mappings.find((item) => item.matcher.test(header));

      if (!matched) {
        return null;
      }

      return {
        id: `col_${index + 1}`,
        columnName: header,
        mappedField: matched.mappedField,
        confidence: matched.confidence,
      };
    })
    .filter((item): item is ImportDetectedColumn => Boolean(item));
}

function detectCandidatesFromText(source: string): ImportDetectedCandidate[] {
  const bucket = new Map<string, ImportDetectedCandidate>();

  const text = cleanText(source);

  if (!text) {
    return [];
  }

  const caseCodeRegex = /\b[A-ZĐ]{2,10}[-/]\d{2,4}[-/]\d{2,8}\b/gu;
  const documentCodeRegex = /Số\s*:\s*([^\n\r]{1,80})/giu;
  const dateSlashRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/gu;
  const vietnameseDateRegex =
    /ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/giu;
  const nameRegex =
    /(?:bị can|họ tên|ông|bà)\s*[:-]?\s*([A-ZÀ-Ỹ][\p{L}\s]{3,80})/gu;
  const offenseRegex = /(?:tội danh|tội)\s*[:-]?\s*([^\n\r,.]{3,120})/giu;
  const agencyRegex =
    /(Viện kiểm sát nhân dân[^\n\r]{0,80}|Cơ quan [^\n\r]{0,80})/giu;
  const addressRegex =
    /(?:địa chỉ|nơi cư trú|thường trú)\s*[:-]?\s*([^\n\r]{5,140})/giu;

  for (const match of text.matchAll(caseCodeRegex)) {
    pushCandidate(bucket, {
      type: 'caseCode',
      label: 'Mã hồ sơ',
      value: match[0],
      confidence: 'cao',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(documentCodeRegex)) {
    pushCandidate(bucket, {
      type: 'documentCode',
      label: 'Số văn bản',
      value: match[1] ?? '',
      confidence: 'cao',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(dateSlashRegex)) {
    pushCandidate(bucket, {
      type: 'date',
      label: 'Ngày tháng',
      value: match[0],
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(vietnameseDateRegex)) {
    pushCandidate(bucket, {
      type: 'date',
      label: 'Ngày tháng',
      value: match[0],
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(nameRegex)) {
    pushCandidate(bucket, {
      type: 'personName',
      label: 'Tên người liên quan',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(offenseRegex)) {
    pushCandidate(bucket, {
      type: 'offense',
      label: 'Tội danh',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'vừa',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(agencyRegex)) {
    pushCandidate(bucket, {
      type: 'agency',
      label: 'Cơ quan',
      value: match[0],
      confidence: 'thấp',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  for (const match of text.matchAll(addressRegex)) {
    pushCandidate(bucket, {
      type: 'address',
      label: 'Địa chỉ',
      value: (match[1] ?? '').replace(/\s+/g, ' ').trim(),
      confidence: 'thấp',
      source: snippetAround(text, match.index ?? 0, match[0].length),
    });
  }

  return Array.from(bucket.values()).slice(0, 20);
}

@Injectable()
export class FileExtractionService {
  private readonly logger = new Logger(FileExtractionService.name);

  constructor(
    private readonly policy: ImportFilePolicyService = new ImportFilePolicyService(),
    private readonly parser: ImportParserWorkerService = new ImportParserWorkerService(),
  ) {}

  async extractFile(
    absolutePath: string,
    extension: string,
    mimeType: string | null,
  ): Promise<ImportExtractionResult> {
    try {
      if (extension === '.xls') return this.rejectLegacyXls();
      const policy = await this.policy.validate(
        absolutePath,
        extension,
        mimeType,
      );
      if (!policy.accepted) {
        this.logger.warn(`Import rejected by policy: ${policy.reasonCode}`);
        return {
          extractionStatus: 'REJECTED',
          rawText: null,
          parsedJson: null,
          warnings: ['Tệp không đạt chính sách an toàn để xử lý.'],
          errorMessage: 'Tệp không thể được xử lý an toàn.',
          candidates: [],
          previewText: null,
          totalRows: 0,
        };
      }
      switch (extension) {
        case '.pdf':
        case '.docx':
        case '.xlsx':
        case '.csv':
        case '.json':
          return await this.extractInWorker(absolutePath, extension);
        case '.doc':
          return this.extractDoc();
        case '.xls':
          return this.rejectLegacyXls();
        case '.txt':
          return await this.extractTxt(absolutePath);
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.webp':
        case '.tif':
        case '.tiff':
          return this.extractImage();
        default:
          return {
            extractionStatus: 'REJECTED',
            rawText: null,
            parsedJson: null,
            warnings: [
              `Định dạng ${extension || mimeType || 'không xác định'} chưa được hỗ trợ.`,
            ],
            errorMessage: 'Định dạng tệp không được hỗ trợ.',
            candidates: [],
            previewText: null,
            totalRows: 0,
          };
      }
    } catch (error: unknown) {
      const reasonCode =
        error instanceof Error ? error.message : 'IMPORT_PARSER_FAILED';
      this.logger.warn(`Import parser rejected file: ${reasonCode}`);
      return {
        extractionStatus: 'FAILED',
        rawText: null,
        parsedJson: null,
        warnings: [],
        errorMessage: 'Không thể trích xuất dữ liệu từ tệp này.',
        candidates: [],
        previewText: null,
        totalRows: 0,
      };
    }
  }

  private async extractInWorker(
    absolutePath: string,
    extension: '.pdf' | '.docx' | '.xlsx' | '.csv' | '.json',
  ): Promise<ImportExtractionResult> {
    return this.toExtractionResult(
      await this.parser.parse({ absolutePath, extension }),
    );
  }

  private toExtractionResult(
    parsed: ImportParserResult,
  ): ImportExtractionResult {
    if (parsed.kind === 'text') {
      const text = cleanText(parsed.text);
      return {
        extractionStatus: parsed.warnings.length
          ? 'PARSED_WITH_WARNINGS'
          : 'PARSED',
        rawText: text ? truncateText(text, MAX_TEXT_LENGTH) : null,
        parsedJson: { kind: 'text' },
        warnings: parsed.warnings,
        errorMessage: null,
        candidates: detectCandidatesFromText(text),
        previewText: text ? truncateText(text, MAX_PREVIEW_TEXT_LENGTH) : null,
        totalRows: 0,
      };
    }

    if (parsed.kind === 'table') {
      const text = cleanText(parsed.text);
      const tables: ImportTablePreview[] = parsed.tables.map((table) => ({
        ...table,
        candidateColumns: detectColumns(table.headers),
      }));
      return {
        extractionStatus: 'PARSED',
        rawText: truncateText(text, MAX_TEXT_LENGTH) || null,
        parsedJson: { kind: 'table', sheetNames: parsed.sheetNames, tables },
        warnings: [],
        errorMessage: null,
        candidates: detectCandidatesFromText(text),
        previewText: truncateText(text, MAX_PREVIEW_TEXT_LENGTH) || null,
        totalRows: parsed.totalRows,
      };
    }

    const pretty = parsed.pretty;
    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(pretty, MAX_TEXT_LENGTH),
      parsedJson: {
        kind: 'json',
        preview: truncateText(pretty, MAX_PREVIEW_TEXT_LENGTH),
        topLevelKeys: parsed.topLevelKeys,
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(pretty),
      previewText: truncateText(pretty, MAX_PREVIEW_TEXT_LENGTH),
      totalRows: 0,
    };
  }

  private extractDoc(): ImportExtractionResult {
    return {
      extractionStatus: 'STORED_ONLY',
      rawText: null,
      parsedJson: {
        kind: 'binary',
      },
      warnings: [
        'File DOC đã được lưu, nhưng hệ thống chưa trích xuất ổn định nội dung từ định dạng này.',
      ],
      errorMessage: null,
      candidates: [],
      previewText: null,
      totalRows: 0,
    };
  }

  private rejectLegacyXls(): ImportExtractionResult {
    return {
      extractionStatus: 'REJECTED',
      rawText: null,
      parsedJson: null,
      warnings: [
        'File XLS cũ không còn được hỗ trợ vì lý do an toàn. Hãy chuyển đổi sang XLSX hoặc CSV.',
      ],
      errorMessage: 'Định dạng tệp không được hỗ trợ.',
      candidates: [],
      previewText: null,
      totalRows: 0,
    };
  }

  private async extractTxt(
    absolutePath: string,
  ): Promise<ImportExtractionResult> {
    const buffer = await fs.promises.readFile(absolutePath);
    const text = cleanText(this.decodeText(buffer));

    return {
      extractionStatus: 'PARSED',
      rawText: truncateText(text, MAX_TEXT_LENGTH) || null,
      parsedJson: {
        kind: 'text',
      },
      warnings: [],
      errorMessage: null,
      candidates: detectCandidatesFromText(text),
      previewText: truncateText(text, MAX_PREVIEW_TEXT_LENGTH) || null,
      totalRows: 0,
    };
  }

  private extractImage(): ImportExtractionResult {
    return {
      extractionStatus: 'STORED_ONLY',
      rawText: null,
      parsedJson: {
        kind: 'image',
      },
      warnings: ['Không trích xuất được nội dung, nhưng file gốc đã được lưu.'],
      errorMessage: null,
      candidates: [],
      previewText: null,
      totalRows: 0,
    };
  }

  private decodeText(buffer: Buffer): string {
    const attempts: BufferEncoding[] = ['utf8', 'utf16le', 'latin1'];

    for (const encoding of attempts) {
      const text = buffer.toString(encoding);

      if (!text.includes('\u0000')) {
        return text;
      }
    }

    return buffer.toString('utf8');
  }
}
