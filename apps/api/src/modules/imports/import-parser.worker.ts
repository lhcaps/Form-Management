import { parentPort, workerData } from 'node:worker_threads';
import { parseImportFile } from './import-parser.core';
import type {
  ImportParserRequest,
  ImportParserWorkerMessage,
} from './import-parser-worker.types';

const port = parentPort;
const request = workerData as ImportParserRequest;

function reasonCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /^IMPORT_[A-Z_]+$/.test(message) ? message : 'IMPORT_PARSER_FAILED';
}

void parseImportFile(request)
  .then((result) => {
    port?.postMessage({ ok: true, result } satisfies ImportParserWorkerMessage);
  })
  .catch((error: unknown) => {
    port?.postMessage({
      ok: false,
      reasonCode: reasonCode(error),
    } satisfies ImportParserWorkerMessage);
  });
