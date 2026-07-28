/**
 * BM-122/123/124 semantic-ui curation verification.
 * Tests that these forms pass the semantic audit after curation fixes:
 * - No generated placeholder markers (no "(mẫu BM-NNN)" in placeholders)
 * - Section descriptions present
 * - Presentation sections present
 *
 * Run: node --test test/forms/bm122-123-124-curation.test.mjs
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const PROFILE_DIR = resolve(PROJECT_ROOT, 'apps/web/src/lib/runtime-ux');
const AUDIT_SCRIPT = resolve(PROJECT_ROOT, 'scripts/audit/audit-213-semantic-ui-maturity.mjs');

const FORMS = [
  {
    code: 'BM-122',
    title: 'QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm',
    fieldCount: 2,
    section: 'Thông tin biểu mẫu',
  },
  {
    code: 'BM-123',
    title: 'QĐ thực nghiệm điều tra',
    fieldCount: 2,
    section: 'Thông tin biểu mẫu',
  },
  {
    code: 'BM-124',
    title: 'Biên bản thực nghiệm điều tra',
    fieldCount: 1,
    section: 'Thông tin biểu mẫu',
  },
];

// These checks should all FAIL before curation and PASS after
describe('BM-122/123/124 semantic curation', { concurrency: false }, () => {
  for (const { code, title, fieldCount, section } of FORMS) {
    const fileName = code.replace('BM-', 'bm').replace('-', '') + '-runtime-ux-profile.ts';
    const profilePath = resolve(PROFILE_DIR, fileName);

    it(`${code} profile exists`, () => {
      assert.ok(
        existsSync(profilePath),
        `${code} profile file must exist at ${profilePath}`,
      );
    });

    it(`${code} no generated placeholder markers`, () => {
      const source = readFileSync(profilePath, 'utf-8');
      const generatedMarkerRegex = /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu;
      const matches = source.match(generatedMarkerRegex);
      assert.strictEqual(
        matches,
        null,
        `${code} must not contain generated placeholder markers like "(mẫu ${code})"`,
      );
    });

    it(`${code} section description present`, () => {
      const source = readFileSync(profilePath, 'utf-8');
      // Must have a description in presentationSections
      assert.ok(
        source.includes('description:'),
        `${code} sections must have a description field`,
      );
    });

    it(`${code} presentation sections present`, () => {
      const source = readFileSync(profilePath, 'utf-8');
      assert.ok(
        source.includes('presentationSections:'),
        `${code} profile must have presentationSections`,
      );
    });

    it(`${code} field key ${code} is registered`, () => {
      const source = readFileSync(profilePath, 'utf-8');
      assert.ok(
        source.includes(`templateCode: "${code}"`),
        `${code} must register with its templateCode`,
      );
    });
  }
});
