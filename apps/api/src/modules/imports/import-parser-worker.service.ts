import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Worker } from 'node:worker_threads';
import { parseImportFile } from './import-parser.core';
import type {
  ImportParserRequest,
  ImportParserResult,
  ImportParserWorkerMessage,
} from './import-parser-worker.types';

const PARSER_TIMEOUT_MS = 10_000;
const PARSER_MEMORY_LIMIT_MB = 256;

@Injectable()
export class ImportParserWorkerService {
  async parse(request: ImportParserRequest): Promise<ImportParserResult> {
    const workerPath = this.resolveWorkerPath();

    if (!fs.existsSync(workerPath)) {
      if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        return parseImportFile(request);
      }
      throw new Error('IMPORT_PARSER_WORKER_UNAVAILABLE');
    }

    return new Promise<ImportParserResult>((resolve, reject) => {
      let settled = false;
      const worker = new Worker(workerPath, {
        workerData: request,
        resourceLimits: {
          maxOldGenerationSizeMb: this.memoryLimitMb(),
          maxYoungGenerationSizeMb: 32,
          stackSizeMb: 4,
        },
      });
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        void worker.terminate();
        callback();
      };
      const timeout = setTimeout(() => {
        finish(() => reject(new Error('IMPORT_PARSER_TIMEOUT')));
      }, this.timeoutMs());

      worker.once('message', (message: ImportParserWorkerMessage) => {
        finish(() => {
          if (message.ok) resolve(message.result);
          else reject(new Error(message.reasonCode));
        });
      });
      worker.once('error', () => {
        finish(() => reject(new Error('IMPORT_PARSER_FAILED')));
      });
      worker.once('exit', (code) => {
        if (code !== 0) finish(() => reject(new Error('IMPORT_PARSER_FAILED')));
      });
    });
  }

  protected resolveWorkerPath(): string {
    return path.join(__dirname, 'import-parser.worker.js');
  }

  protected timeoutMs(): number {
    return PARSER_TIMEOUT_MS;
  }

  protected memoryLimitMb(): number {
    return PARSER_MEMORY_LIMIT_MB;
  }
}
