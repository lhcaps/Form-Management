import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ImportParserWorkerService } from './import-parser-worker.service';

class FixtureWorkerService extends ImportParserWorkerService {
  constructor(
    private readonly fixturePath: string,
    private readonly deadlineMs = 1_000,
  ) {
    super();
  }

  protected override resolveWorkerPath(): string {
    return this.fixturePath;
  }

  protected override timeoutMs(): number {
    return this.deadlineMs;
  }
}

describe('ImportParserWorkerService', () => {
  async function withFixture(
    source: string,
    assertion: (fixturePath: string) => Promise<void>,
  ): Promise<void> {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qllaw-import-worker-'));
    const fixturePath = path.join(dir, 'fixture.cjs');
    await fs.promises.writeFile(fixturePath, source, 'utf8');
    try {
      await assertion(fixturePath);
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  it('returns structured worker results without exposing worker internals', async () => {
    await withFixture(
      "require('node:worker_threads').parentPort.postMessage({ ok: true, result: { kind: 'text', text: 'safe', warnings: [] } });",
      async (fixturePath) => {
        await expect(
          new FixtureWorkerService(fixturePath).parse({
            absolutePath: 'ignored',
            extension: '.pdf',
          }),
        ).resolves.toEqual({ kind: 'text', text: 'safe', warnings: [] });
      },
    );
  });

  it('terminates a non-responsive worker at the bounded deadline', async () => {
    await withFixture('setInterval(() => {}, 1_000);', async (fixturePath) => {
      await expect(
        new FixtureWorkerService(fixturePath, 100).parse({
          absolutePath: 'ignored',
          extension: '.pdf',
        }),
      ).rejects.toThrow('IMPORT_PARSER_TIMEOUT');
    });
  });
});
